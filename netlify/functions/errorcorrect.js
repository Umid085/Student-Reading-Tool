import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const PROMPT = (passage, topic, level) =>
  `You are a language teacher creating an error-correction exercise for a ${level} student.

Original passage (topic: ${topic}):
"""
${passage}
"""

Introduce EXACTLY 5 subtle errors into the passage by changing individual words. Use this mix:
- 2 spelling errors (misspell one word each)
- 1 grammar error (wrong article, preposition, or word form)
- 1 vocabulary error (replace a word with a plausible but wrong word)
- 1 tense error (change a verb to the wrong tense)

Rules:
- Change only single words, never add or delete words
- Each corrupted word must appear exactly once in the passage
- Do NOT change proper nouns, numbers, or punctuation
- Errors should be subtle but detectable by a ${level} student
- Keep the passage length and structure identical

Return ONLY valid JSON:
{
  "passage": "the full passage text with exactly 5 errors introduced",
  "errors": [
    {"corrupted": "wrongword", "original": "correctword", "type": "spelling", "explanation": "Brief explanation of the error."},
    {"corrupted": "wrongword", "original": "correctword", "type": "grammar", "explanation": "Brief explanation."},
    {"corrupted": "wrongword", "original": "correctword", "type": "vocabulary", "explanation": "Brief explanation."},
    {"corrupted": "wrongword", "original": "correctword", "type": "tense", "explanation": "Brief explanation."},
    {"corrupted": "wrongword", "original": "correctword", "type": "spelling", "explanation": "Brief explanation."}
  ]
}`;

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

  const { passage, topic, level } = body;
  if (!passage) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing passage" }) };
  }

  try {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: PROMPT(passage, topic || "General", level || "B1") }] }],
        generationConfig: { maxOutputTokens: 1200 },
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Error correction timeout")), 12000)),
    ]);
    const raw = result.response.text();
    const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
