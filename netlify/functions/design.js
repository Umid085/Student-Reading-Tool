import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const PROMPT = (description) =>
  `You are a UI color designer creating a neon dark-theme color scheme.

The user wants a theme described as: "${description}"

Return ONLY valid JSON with vivid, saturated colors that pop on a near-black (#0d0d1a) background:
{
  "accent": "#hexcolor",
  "secondary": "#hexcolor",
  "name": "Theme Name (2-3 words)",
  "emoji": "single emoji"
}

Rules:
- accent = primary glow/highlight color (the most prominent color)
- secondary = complementary accent (harmonises with accent but different enough to be distinct)
- Both must be bright, saturated neon-style colors — not grey, white, or near-black
- name should evoke the mood/vibe
- emoji should match the vibe`;

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

  const { description } = body;
  if (!description || !description.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing description" }) };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{ role: "user", content: PROMPT(description.trim().slice(0, 120)) }],
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Design timeout")), 8000)),
    ]);
    const raw = msg.content[0]?.text || "";
    const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    if (!parsed.accent || !parsed.secondary) {
      throw new Error("Invalid color response");
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
