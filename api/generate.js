import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AI_RATE_LIMIT_MAX = 60; // requests per 15-minute window
const USER_MSG_MAX_LEN = 4000;
const MAX_TOKENS_CAP = 2048;

const TYPE_EXAMPLES = {
  mcq:          '{"type":"mcq","q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"Why A is correct."}',
  gap_word:     '{"type":"gap_word","sentence":"The ___ was important.","options":["cat","dog","event","reason"],"answer":2,"explanation":"Because..."}',
  gap_sentence: '{"type":"gap_sentence","sentence":"___ was the main cause.","options":["Sent1","Sent2","Sent3","Sent4"],"answer":0,"explanation":"Because..."}',
  qa:           '{"type":"qa","q":"Open question?","keywords":["word1","word2","word3"],"explanation":"Model answer."}',
  tfnm:         '{"type":"tfnm","instruction":"According to the passage...","q":"Statement.","options":["True","False","Not Mentioned"],"answer":0,"explanation":"..."}',
  ynng:         '{"type":"ynng","instruction":"Do the following statements agree with the claims of the writer?","q":"Statement.","options":["Yes","No","Not Given"],"answer":0,"explanation":"..."}',
};

// matching and heading require complex structured formats — excluded from AI generation
const SUPPORTED_AI_TYPES = new Set(Object.keys(TYPE_EXAMPLES));

const LEVEL_CONFIG = {
  A1: { words: "80-100",  vocab: "ONLY the 500 most common English words. No complex words at all.", sentences: "Maximum 8 words per sentence. Very simple grammar (present simple, 'I have', 'There is')." },
  A2: { words: "100-130", vocab: "Basic everyday vocabulary only. No academic or technical words.", sentences: "Short sentences, 8-12 words. Simple past tense and basic connectors (and, but, because)." },
  B1: { words: "150-200", vocab: "Intermediate vocabulary. Occasional topic-specific words are fine, but avoid jargon.", sentences: "Moderate complexity, 10-15 words. Use some subordinate clauses." },
  B2: { words: "200-250", vocab: "Upper-intermediate vocabulary including some academic and abstract words.", sentences: "Varied sentence length, 12-18 words. Complex grammar structures allowed." },
  C1: { words: "250-320", vocab: "Advanced academic vocabulary, idiomatic expressions, nuanced language.", sentences: "Long and complex sentences, 15-22 words. Sophisticated grammar." },
  C2: { words: "300-400", vocab: "Sophisticated, native-level vocabulary including rare and technical terms.", sentences: "Native-level complexity, 18-25 words. All grammar structures." },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });
  }

  const body = req.body || {};

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: AI_RATE_LIMIT_MAX, bucket: "ai" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many AI requests. Try again later." });
  }

  // ── Mode 1: generic proxy — {messages:[{role,content}]} → {content:[{type,text}]} ──
  if (body.messages && Array.isArray(body.messages)) {
    let userMessage = body.messages[body.messages.length - 1]?.content || "";
    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }
    if (typeof userMessage === "string" && userMessage.length > USER_MSG_MAX_LEN) {
      userMessage = userMessage.slice(0, USER_MSG_MAX_LEN);
    }
    const requestedTokens = Number(body.max_tokens) || 4096;
    const maxTokens = Math.min(MAX_TOKENS_CAP, Math.max(1, requestedTokens));
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: userMessage }],
      });
      const text = msg.content?.[0]?.text || "";
      if (!text) {
        return res.status(502).json({ error: "Empty model response" });
      }
      return res.status(200).json({ content: [{ type: "text", text }] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Mode 2: AI assignment generation — {level, topic, types, language} → {passage, questions} ──
  const level = body.level || "B1";
  const topic = body.topic || "General";
  const types = Array.isArray(body.types) ? body.types : ["mcq", "qa"];
  const language = body.language || "English";
  const topicInLanguage =
    typeof body.topic_in_language === "string" && body.topic_in_language.trim()
      ? body.topic_in_language.trim().slice(0, 120)
      : null;

  const lc = LEVEL_CONFIG[level] || LEVEL_CONFIG["B1"];
  const validTypes = types.filter((t) => SUPPORTED_AI_TYPES.has(t)).slice(0, 4);
  if (!validTypes.length) {
    return res.status(400).json({ error: "No valid question types provided" });
  }

  const typeExamples = validTypes.map((t) => "  " + TYPE_EXAMPLES[t]).join(",\n");

  const prompt = `Write a ${lc.words}-word reading passage in ${language} about: "${topic}"

TOPIC ADHERENCE (highest priority — overrides all other rules):
- The word "${topic}" (translated into ${language} if needed) MUST appear in the passage at least twice.
- The first sentence MUST name "${topic}" directly.
- Every paragraph MUST be about "${topic}".
- Do NOT drift to generic subjects (family, school, weather, daily routines) unless that IS the topic.
- If "${topic}" is harder than CEFR ${level} vocabulary, KEEP the word and explain it with simpler words.

CEFR ${level} rules:
- Vocabulary: ${lc.vocab}
- Sentences: ${lc.sentences}

After the passage, write exactly ${validTypes.length} comprehension question(s) in this order: ${validTypes.join(", ")}

Return ONLY this JSON, no markdown, no explanation:
{
  "topic_echo": "the word(s) for \\"${topic}\\" exactly as you wrote them in ${language} (e.g. \\"Mars\\" → \\"Марс\\" for Russian, \\"المريخ\\" for Arabic, \\"Mars\\" for English). This must appear verbatim in your passage.",
  "passage": "your passage about ${topic}",
  "questions": [
${typeExamples}
  ]
}

- Every question must be answerable from the passage alone.
- answer = 0-based index of the correct option (mcq/gap_word/gap_sentence).
- topic_echo MUST appear in the passage — this is how topic adherence is verified.`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are a language learning exercise generator. You always write reading passages in ${language} about the exact topic the user specifies. You never change the language or topic. You always follow CEFR level vocabulary and grammar rules strictly.`,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = msg.content?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: "Empty model response" });
    }
    const raw = rawText.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.passage || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure from Claude");
    }

    // Topic-adherence check: if Claude drifted to a generic passage that does not
    // actually cover the topic, surface it rather than rendering a mismatched
    // title/body. Priority order:
    //   1. `topic_in_language` from the client (independently translated via
    //      MyMemory — Claude cannot fabricate this), if provided.
    //   2. `topic_echo` self-reported by Claude — only used as fallback when no
    //      trusted translation is available.
    //   3. The original `topic` for English requests.
    if (topic && topic !== "General") {
      const candidates = [];
      if (language === "English") candidates.push(topic);
      if (topicInLanguage) {
        candidates.push(topicInLanguage);
      } else if (parsed.topic_echo && typeof parsed.topic_echo === "string") {
        candidates.push(parsed.topic_echo);
      }
      if (candidates.length > 0) {
        const passageLc = parsed.passage.toLowerCase();
        const words = candidates
          .flatMap((c) => c.toLowerCase().split(/\s+/))
          .filter((w) => w.length >= 3);
        if (words.length > 0 && !words.some((w) => passageLc.includes(w))) {
          return res.status(422).json({
            error: `The model drifted off-topic (no mention of "${topic}"). Please try again.`,
          });
        }
      }
    }

    return res.status(200).json({ passage: parsed.passage, questions: parsed.questions });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
