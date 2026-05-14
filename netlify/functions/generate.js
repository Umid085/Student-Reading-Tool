import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TYPE_EXAMPLES = {
  mcq:          '{"type":"mcq","q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"Why A."}',
  gap_word:     '{"type":"gap_word","sentence":"The ___ was important.","options":["cat","dog","event","reason"],"answer":2,"explanation":"Because..."}',
  gap_sentence: '{"type":"gap_sentence","sentence":"___ was the main cause.","options":["Sent1","Sent2","Sent3","Sent4"],"answer":0,"explanation":"Because..."}',
  qa:           '{"type":"qa","q":"Open question?","keywords":["word1","word2","word3"],"explanation":"Model answer."}',
  tfnm:         '{"type":"tfnm","instruction":"According to the passage...","q":"Statement.","options":["True","False","Not Mentioned"],"answer":0,"explanation":"..."}',
  ynng:         '{"type":"ynng","instruction":"Do the following statements agree with the claims of the writer?","q":"Statement.","options":["Yes","No","Not Given"],"answer":0,"explanation":"..."}',
};

const LEVEL_CONFIG = {
  A1: { words: "80-100",  sentences: "very short (5-8 words)",     vocab: "top 500 most common words only" },
  A2: { words: "100-130", sentences: "short (8-12 words)",          vocab: "basic everyday vocabulary" },
  B1: { words: "150-200", sentences: "moderate (10-15 words)",      vocab: "intermediate everyday vocabulary" },
  B2: { words: "200-250", sentences: "varied (12-18 words)",        vocab: "upper-intermediate, some academic" },
  C1: { words: "250-320", sentences: "complex (15-22 words)",       vocab: "advanced academic vocabulary" },
  C2: { words: "300-400", sentences: "sophisticated (18-25 words)", vocab: "idiomatic and sophisticated language" },
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
  const validTypes = types.filter((t) => TYPE_EXAMPLES[t]).slice(0, 5);
  if (!validTypes.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No valid question types provided" }) };
  }

  const typeExamples = validTypes.map((t) => "  " + TYPE_EXAMPLES[t]).join(",\n");

  const prompt = `You are a CEFR ${level} English language teacher creating a reading exercise.

Topic: "${topic}"

Write an original reading passage, then create exactly ${validTypes.length} quiz question(s).

Passage requirements:
- Length: ${lc.words} words
- Sentence length: ${lc.sentences}
- Vocabulary: ${lc.vocab}
- Informative, engaging, and appropriate for CEFR ${level}

Question types (in this exact order): ${validTypes.join(", ")}

Return ONLY valid JSON with no markdown or explanation:
{
  "passage": "<the full reading passage>",
  "questions": [
${typeExamples}
  ]
}

Rules:
- Every question must be answerable from the passage alone
- Explanations must cite the passage
- For mcq/gap_word/gap_sentence: answer is the 0-based index of the correct option`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
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
