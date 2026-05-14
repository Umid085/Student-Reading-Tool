import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // ── Mode 1: generic proxy — {messages:[{role,content}]} → {content:[{type,text}]} ──
  if (body.messages && Array.isArray(body.messages)) {
    const userMessage = body.messages[body.messages.length - 1]?.content || "";
    if (!userMessage) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No message provided" }) };
    }
    const maxTokens = body.max_tokens || 4096;
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: userMessage }],
      });
      const text = msg.content[0].text;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ content: [{ type: "text", text }] }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── Mode 2: AI assignment generation — {level, topic, types} → {passage, questions} ──
  const level = body.level || "B1";
  const topic = body.topic || "General";
  const types = Array.isArray(body.types) ? body.types : ["mcq", "qa"];

  const lc = LEVEL_CONFIG[level] || LEVEL_CONFIG["B1"];
  const validTypes = types.filter((t) => SUPPORTED_AI_TYPES.has(t)).slice(0, 4);
  if (!validTypes.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No valid question types provided" }) };
  }

  const typeExamples = validTypes.map((t) => "  " + TYPE_EXAMPLES[t]).join(",\n");

  const prompt = `Write a ${lc.words}-word reading passage ONLY about: "${topic}"

The very first sentence must introduce "${topic}" directly.
Every sentence in the passage must relate to "${topic}".
Do not write about any other subject.

CEFR level ${level} rules (strictly enforced):
- Vocabulary: ${lc.vocab}
- Sentences: ${lc.sentences}

After the passage, write exactly ${validTypes.length} comprehension question(s) in this order: ${validTypes.join(", ")}

Return ONLY this JSON structure, no markdown, no explanation:
{
  "passage": "<passage about ${topic}>",
  "questions": [
${typeExamples}
  ]
}

- All questions must be answered from the passage only
- answer field = 0-based index of the correct option (for mcq/gap_word/gap_sentence)
- Do NOT go above CEFR ${level} vocabulary or grammar`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are an English reading exercise generator. You always write passages about the exact topic the user specifies. You never change the topic or drift to related subjects. You always follow CEFR level vocabulary and grammar rules strictly.`,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.passage || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure from Claude");
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ passage: parsed.passage, questions: parsed.questions }),
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
