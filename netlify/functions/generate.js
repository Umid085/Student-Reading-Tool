import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const TIMEOUT_MS = 25000;
const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  if (!process.env.GOOGLE_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "GOOGLE_API_KEY is not set" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const userMessage = body.messages?.[body.messages.length - 1]?.content || "";
  if (!userMessage) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No message provided" }) };
  }

  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  let lastError = "";

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 25s on ${modelName}`)), TIMEOUT_MS)
      );

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
        timeout,
      ]);

      const text = result.response.text();
      if (!text || !text.trim()) {
        lastError = `${modelName} returned empty response`;
        continue;
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ content: [{ type: "text", text }] }),
      };
    } catch (e) {
      lastError = `${modelName}: ${e.message}`;
      continue;
    }
  }

  return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: lastError }) };
};
