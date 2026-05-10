import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

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
  if (!process.env.GOOGLE_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "GOOGLE_API_KEY not set" }) };
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
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM(passage, topic || "General", level || "B1"),
    });

    // Convert Anthropic-style messages to Gemini format; roles: user → user, assistant → model
    const history = messages.slice(0, -1).map(function (m) {
      return { role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] };
    });
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await Promise.race([
      chat.sendMessage(lastMessage),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Tutor timeout")), 10000)),
    ]);

    const reply = result.response.text();
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
