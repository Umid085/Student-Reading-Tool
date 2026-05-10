import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const key = process.env.GOOGLE_API_KEY;
  if (!key) return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "FAIL", reason: "GOOGLE_API_KEY not set" }) };

  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await Promise.race([
      model.generateContent({ contents: [{ role: "user", parts: [{ text: "Say OK" }] }] }),
      new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 8000)),
    ]);
    const text = result.response.text();
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "OK", model: "gemini-1.5-flash", response: text.slice(0, 50) }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "FAIL", model: "gemini-1.5-flash", error: e.message }) };
  }
};
