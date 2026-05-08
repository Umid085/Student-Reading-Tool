import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const TIMEOUT_MS = 9000;

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

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini API timeout — try again")), TIMEOUT_MS)
  );

  try {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({ model: body.model || "gemini-2.0-flash" });

    const userMessage = body.messages?.[body.messages.length - 1]?.content || "";

    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: body.max_tokens || 2000 },
      }),
      timeout,
    ]);

    const text = result.response.text();
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        content: [{ type: "text", text: text }]
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
