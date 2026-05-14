import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

Return ONLY valid JSON with no markdown:
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
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
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: PROMPT(passage, topic || "General", level || "B1") }],
    });

    const raw = msg.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
