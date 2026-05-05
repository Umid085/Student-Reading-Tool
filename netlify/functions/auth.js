import { createHmac } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function issueToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
  const payload = `${name}:${expires}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const secret = process.env.SESSION_SECRET || "";
  if (!secret) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Auth not configured" }) };

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, hash } = body;
  if (!name || !hash) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
  }

  try {
    const r = await fetch(`${DB}/rq/rq-users-v6.json`);
    const users = await r.json();
    if (!Array.isArray(users)) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }
    const user = users.find(function (u) {
      return u.name.toLowerCase() === name.toLowerCase() && u.hash === hash;
    });
    if (!user) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(user.name, secret) }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
