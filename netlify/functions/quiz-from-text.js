// Generates a quiz for a pre-written passage using Claude. Used by the
// custom-text assignment flow (teacher) and the library AI-quiz upgrade
// (student). Question count scales by CEFR level to match generate.js.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export const handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { passage, level = "B1", types = ["mcq", "tfnm", "qa"] } = body;

  if (!passage || passage.trim().length < 30) {
    return { statusCode: 400, body: JSON.stringify({ error: "Passage must be at least 30 characters." }) };
  }
  if (passage.length > 4000) {
    return { statusCode: 400, body: JSON.stringify({ error: "Passage too long (max 4000 characters)." }) };
  }

  const baseTypes = (Array.isArray(types) ? types : []).filter((t) => SUPPORTED_TYPES.has(t));
  if (!baseTypes.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "No valid question types specified." }) };
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: parsed.topic || "Custom Passage", questions: parsed.questions }),
    };
  } catch (e) {
    console.error("quiz-from-text error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate quiz. Please try again." }),
    };
  }
};
