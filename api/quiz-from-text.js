// Generates a quiz for a pre-written passage using Claude. Used by the
// custom-text assignment flow (teacher) and the library AI-quiz upgrade
// (student). Question count scales by CEFR level to match /api/generate.
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";
import { consumeUserQuota } from "./_userQuota.js";
import { extractUsername } from "./_session.js";

const QUIZ_FROM_TEXT_QUOTA = 15; // per authenticated user per day

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AI_RATE_LIMIT_MAX = 60; // requests per 15-minute window

// Must match LEVEL_CONFIG in generate.js — stronger learners get longer
// quizzes for the same passage.
const QUESTIONS_PER_LEVEL = { A1: 5, A2: 6, B1: 8, B2: 10, C1: 12, C2: 15 };

const TYPE_EXAMPLES = {
  mcq:          '{"type":"mcq","q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"Why A is correct."}',
  gap_word:     '{"type":"gap_word","sentence":"The ___ was important.","options":["cat","dog","event","reason"],"answer":2,"explanation":"Because..."}',
  gap_sentence: '{"type":"gap_sentence","sentence":"___ was the main cause.","options":["Sent1","Sent2","Sent3","Sent4"],"answer":0,"explanation":"Because..."}',
  qa:           '{"type":"qa","q":"Open question?","keywords":["word1","word2","word3"],"explanation":"Model answer."}',
  tfnm:         '{"type":"tfnm","instruction":"According to the passage...","q":"Statement.","options":["True","False","Not Mentioned"],"answer":0,"explanation":"..."}',
  ynng:         '{"type":"ynng","instruction":"Do the following statements agree with the claims of the writer?","q":"Statement.","options":["Yes","No","Not Given"],"answer":0,"explanation":"..."}',
};

const SUPPORTED_TYPES = new Set(Object.keys(TYPE_EXAMPLES));

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: AI_RATE_LIMIT_MAX, bucket: "ai" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many AI requests. Try again later." });
  }

  // Per-user daily quota (separate "quiz_from_text" bucket — cheaper than
  // full passage generation since the passage is already provided).
  const qftUsername = extractUsername(req);
  const qftQuota = await consumeUserQuota(DB, qftUsername, "quiz_from_text", { max: QUIZ_FROM_TEXT_QUOTA });
  if (qftQuota.exceeded) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((qftQuota.resetAt - Date.now()) / 1000))));
    return res.status(429).json({ error: `Daily quiz limit reached (${qftQuota.used}/${qftQuota.max}). Resets at UTC midnight.` });
  }

  const { passage, level = "B1", types = ["mcq", "tfnm", "qa"] } = req.body || {};

  if (!passage || passage.trim().length < 30) {
    return res.status(400).json({ error: "Passage must be at least 30 characters." });
  }
  if (passage.length > 4000) {
    return res.status(400).json({ error: "Passage too long (max 4000 characters)." });
  }

  // Filter to supported types and pad up to the level's target count by
  // cycling — same approach as /api/generate. The model is told to vary the
  // detail it tests for repeated types so we don't get duplicated stems.
  const baseTypes = (Array.isArray(types) ? types : []).filter((t) => SUPPORTED_TYPES.has(t));
  if (!baseTypes.length) {
    return res.status(400).json({ error: "No valid question types specified." });
  }
  const targetCount = QUESTIONS_PER_LEVEL[level] || 6;
  const orderedTypes = [];
  for (let i = 0; i < targetCount; i++) {
    orderedTypes.push(baseTypes[i % baseTypes.length]);
  }
  const uniqueTypes = Array.from(new Set(orderedTypes));
  const typeShapes = uniqueTypes.map((t) => `  ${t}: ${TYPE_EXAMPLES[t]}`).join("\n");

  const prompt = `You are a CEFR ${level} English language test designer.

The passage below has already been written. Generate exactly ${targetCount} comprehension questions about it, one per slot in this exact order: ${orderedTypes.join(", ")}

Each question object must follow the JSON shape for its type:
${typeShapes}

<passage>
${passage.trim()}
</passage>

Return ONLY this JSON, no markdown, no explanation:
{
  "topic": "short title for this passage, 3-6 words",
  "questions": [ ${targetCount} question objects in the order listed above ]
}

Rules:
- All questions must be answerable ONLY from the passage — no outside knowledge.
- answer = 0-based index of the correct option (mcq/gap_word/gap_sentence/tfnm/ynng).
- When the same type appears multiple times, each occurrence MUST ask about a DIFFERENT detail from the passage — no repeated stems, no rephrased duplicates.
- Keep question language appropriate for CEFR ${level}.
- Explanations should cite the passage briefly.`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      // Up to 15 questions × ~150 tokens each + JSON scaffolding fits
      // comfortably in 4096 tokens.
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure");
    }

    return res.status(200).json({ topic: parsed.topic || "Custom Passage", questions: parsed.questions });
  } catch (e) {
    console.error("quiz-from-text error:", e);
    return res.status(500).json({ error: "Failed to generate quiz. Please try again." });
  }
}
