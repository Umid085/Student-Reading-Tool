import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const PROMPT = (passage, topic, level, summary) =>
  `You are an expert language teacher grading a student's written summary of a reading passage.

CEFR Level: ${level}
Topic: ${topic}

Original passage:
"""
${passage}
"""

Student's summary:
"""
${summary}
"""

Grade the summary on these 4 dimensions, calibrated for ${level} level expectations:

1. **content** (0-100): Did they capture the key ideas accurately? No invented facts?
2. **vocabulary** (0-100): Did they use varied, appropriate words — not just copy phrases verbatim?
3. **grammar** (0-100): Are sentences grammatically correct?
4. **structure** (0-100): Is it organised, coherent, with clear flow?

Return ONLY valid JSON in this exact shape:
{
  "scores": {"content": 0-100, "vocabulary": 0-100, "grammar": 0-100, "structure": 0-100},
  "feedback": {
    "content": "1-2 sentence feedback",
    "vocabulary": "1-2 sentence feedback",
    "grammar": "1-2 sentence feedback",
    "structure": "1-2 sentence feedback"
  },
  "strengths": "1 sentence highlighting what they did well",
  "improvements": "1 sentence on the single most important thing to improve",
  "overall": 0-100
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

  const { passage, topic, level, summary } = body;
  if (!passage || !summary || !summary.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing passage or summary" }) };
  }

  try {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: PROMPT(passage, topic || "General", level || "B1", summary) }] }],
        generationConfig: { maxOutputTokens: 600 },
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Feedback timeout")), 12000)),
    ]);
    const raw = result.response.text();
    const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
