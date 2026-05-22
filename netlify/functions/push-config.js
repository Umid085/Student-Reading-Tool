// Public endpoint — returns the VAPID public key the browser needs to
// construct a PushManager subscription. Netlify shape; mirrors api/push-config.js.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!publicKey) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Push notifications not configured" }) };
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ publicKey }) };
};
