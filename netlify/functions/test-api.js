import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "FAIL", reason: "ANTHROPIC_API_KEY not set" }) };

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK" }],
    });
    const text = msg.content[0].text;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "OK", model: "claude-haiku-4-5-20251001", response: text.slice(0, 50) }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "FAIL", model: "claude-haiku-4-5-20251001", error: e.message }) };
  }
};
