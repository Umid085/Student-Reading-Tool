import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = (passage, topic, level) =>
  `You are a friendly, concise language tutor. The student just read a passage and completed a reading comprehension quiz.

Level: ${level}  Topic: ${topic}

Passage:
"""
${passage}
"""

Your job:
- Answer questions about the passage, its vocabulary, grammar, or the quiz
- Explain words or phrases clearly with a short example when helpful
- Give brief, encouraging feedback — keep replies to 2–4 sentences unless a longer explanation is genuinely needed
- Never reveal quiz answers directly; guide the student to reason them out
- Respond in the same language the student uses`;

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { passage, topic, level, messages } = body;
  if (!passage || !messages || !messages.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing passage or messages" }) };
  }

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM(passage, topic || "General", level || "B1"),
      messages: messages.map(function (m) {
        return { role: m.role === "assistant" ? "assistant" : "user", content: m.content };
      }),
    });

    const reply = msg.content[0].text;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
