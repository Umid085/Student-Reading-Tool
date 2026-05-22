// F4b — push subscription endpoint (Netlify shape). Mirrors api/push-subscribe.js.

import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX = 30;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function dbPath(name) {
  return `${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1/${safeName(name)}.json${fbAuthSuffix()}`;
}

async function fbGet(name) {
  try {
    const r = await fetch(dbPath(name));
    if (!r.ok) return null;
    const d = await r.json();
    if (d && typeof d === "object" && d.error) return null;
    return d;
  } catch (_) { return null; }
}

async function fbPut(name, value) {
  try {
    const r = await fetch(dbPath(name), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function fbDelete(name) {
  try { await fetch(dbPath(name), { method: "DELETE" }); return true; } catch (_) { return false; }
}

function validSubscription(s) {
  return !!(s && typeof s === "object"
    && typeof s.endpoint === "string" && s.endpoint.startsWith("https://")
    && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string");
}

function validDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function validLocale(s) { return typeof s === "string" && ["en", "uz", "ru", "tr", "ar", "de", "es", "fr"].indexOf(s) !== -1; }

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };

  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "push-subscribe" });
  if (rl.limited) {
    return { statusCode: 429, headers: Object.assign({}, CORS, { "Retry-After": String(rl.retryAfter) }), body: JSON.stringify({ error: "Too many requests." }) };
  }

  const username = extractUsername(event);
  if (!username) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };

  if (event.httpMethod === "GET") {
    const record = await fbGet(username);
    if (!record) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "No subscription" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(record) };
  }

  if (event.httpMethod === "POST") {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }
    if (!validSubscription(body.subscription)) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid 'subscription'" }) };
    }
    if (body.examDate != null && body.examDate !== "" && !validDate(body.examDate)) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid 'examDate' (expect YYYY-MM-DD)" }) };
    }
    const entry = {
      subscription: {
        endpoint: body.subscription.endpoint,
        keys: { p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth },
      },
      examDate: body.examDate || null,
      locale: validLocale(body.locale) ? body.locale : "en",
      updated: new Date().toISOString(),
    };
    const ok = await fbPut(username, entry);
    if (!ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Write failed" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(Object.assign({ ok: true }, entry)) };
  }

  if (event.httpMethod === "DELETE") {
    await fbDelete(username);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
};
