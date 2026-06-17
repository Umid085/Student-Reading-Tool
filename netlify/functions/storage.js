import { createHmac } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const ALLOWED_KEYS = /^rq-[a-z0-9_-]{1,60}$/;
const MAX_VALUE_BYTES = 512 * 1024; // 512 KB
// Credentials must never flow through the public storage endpoint
const READ_BLOCKED = new Set(["rq-users-v6", "rq-auth-v6"]);
// These keys are mutated only via authenticated, ownership/actor-checked routers
// that do per-child / ETag-CAS writes — /api/classroom for classes+assignments,
// /api/community for leaderboards (rq-boards-v6, rq-weekly-v1, rq-daily-lb-v1),
// the social graph (rq-social-v6), and per-user vocab/favs + story discussion
// (rq-vocab-v1, rq-favs-v1, rq-discuss-v1). Blocking them here closes the
// authorization hole where any signed-in user could overwrite the whole list
// (or another user's data) through this generic proxy. Reads stay open (the
// lists aren't secret). rq-daily-v1 (the daily-challenge config) is intentionally
// left writable: it's deterministic-by-date, so every client computes the same
// record and a forged write is at most low-impact griefing, not impersonation.
const WRITE_BLOCKED = new Set(["rq-auth-v6", "rq-classes-v1", "rq-assignments-v1", "rq-boards-v6", "rq-weekly-v1", "rq-social-v6", "rq-vocab-v1", "rq-favs-v1", "rq-daily-lb-v1", "rq-discuss-v1"]);

function validateToken(token, secret) {
  if (!token || !secret) return false;
  const lastColon = token.lastIndexOf(":");
  if (lastColon === -1) return false;
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return false;
  const expires = parseInt(payload.slice(colonIdx + 1));
  if (isNaN(expires) || Date.now() > expires) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return sig.length === expected.length && sig === expected;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");

  // health-check
  if (!((event.queryStringParameters || {}).key) && event.httpMethod === "GET") {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "ok", db: !!DB }) };
  }

  if (!DB) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };
  }

  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

  try {
    if (event.httpMethod === "GET") {
      const key = (event.queryStringParameters || {}).key;
      if (!key || !ALLOWED_KEYS.test(key) || READ_BLOCKED.has(key)) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid key" }) };
      }
      const r = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json${fbAuth}`);
      const data = await r.json();
      if (data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string") {
        return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `Firebase: ${data.error}` }) };
      }
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ value: data !== null && data !== undefined ? JSON.stringify(data) : null }),
      };
    }

    if (event.httpMethod === "POST") {
      // Validate session token when SESSION_SECRET is configured
      const secret = process.env.SESSION_SECRET || "";
      if (secret) {
        const auth = (event.headers["authorization"] || event.headers["Authorization"] || "");
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!validateToken(token, secret)) {
          return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };
        }
      }

      const { key, value } = JSON.parse(event.body || "{}");
      if (!key || !ALLOWED_KEYS.test(key) || WRITE_BLOCKED.has(key)) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid key" }) };
      }
      if (typeof value !== "string") {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Value must be a string" }) };
      }
      if (Buffer.byteLength(value, "utf8") > MAX_VALUE_BYTES) {
        return { statusCode: 413, headers: CORS, body: JSON.stringify({ error: "Value too large (max 512 KB)" }) };
      }
      const wr = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json${fbAuth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: value,
      });
      if (!wr.ok) {
        let errText = "";
        try { errText = await wr.text(); } catch (_) {}
        return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `Firebase write failed (${wr.status}): ${errText.slice(0, 200)}` }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
