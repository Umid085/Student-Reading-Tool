import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const ALLOWED_NAME = /^[a-zA-Z0-9_]{2,30}$/;

function issueToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000;
  const payload = `${name}:${expires}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_DB_SECRET || "";
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!secret) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Auth not configured" }) };
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, hash } = body;
  if (!name || !hash) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
  }
  if (!ALLOWED_NAME.test(name)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid username" }) };
  }

  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many attempts. Try again later." }) };
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

    // Check for duplicate name in profile list
    const pr = await fetch(`${DB}/rq/rq-users-v6.json`);
    const profiles = await pr.json();
    const profileList = Array.isArray(profiles) ? profiles : [];

    if (profileList.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: "Username taken" }) };
    }

    // ISO yyyy-mm-dd so display and comparisons are locale-stable
    // (front-end keys all dates the same way).
    const joined = new Date().toISOString().slice(0, 10);

    // Write profile (no hash) to rq-users-v6
    const newProfiles = profileList.concat([{ name, games: [], joined }]);
    await fetch(`${DB}/rq/rq-users-v6.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProfiles),
    });

    // Write credentials to rq-auth-v6 (separate, never exposed via storage.js)
    const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`);
    const authData = await ar.json();
    const authList = Array.isArray(authData) ? authData : [];
    const newAuthList = authList.concat([{ name, hash }]);
    await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAuthList),
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(name, secret) }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
