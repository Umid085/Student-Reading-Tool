// POST /api/revoke — invalidate a refresh token before its 30-day expiry.
// Called by the client on logout. Authentication is the token itself:
// presenting a valid-signature, non-revoked token is sufficient proof.
//
// Body: { name, refreshToken }
// Response: { ok: true } on success, 401 otherwise.

import { checkRateLimit } from "./_rateLimit.js";
import { verifyRefreshToken, refreshTokenId } from "./_refreshToken.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Cap how big the blacklist gets. Tokens older than this many days are
// expired anyway (the cryptographic signature gives a 30-day TTL) so we
// drop them on every write to keep the list bounded.
const PRUNE_HORIZON_MS = 31 * 24 * 60 * 60 * 1000;

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_DB_SECRET || "";
  if (!secret) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Auth not configured" }) };

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, refreshToken } = body;
  if (!name || !refreshToken) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
  }

  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many attempts. Try again later." }) };
  }

  const v = verifyRefreshToken(refreshToken, secret);
  if (!v.ok || v.name.toLowerCase() !== String(name).toLowerCase()) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid refresh token" }) };
  }

  const tokenId = refreshTokenId(refreshToken);
  if (!tokenId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Token id not derivable" }) };
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
    const r = await fetch(`${DB}/rq/rq-revoked-v1.json${fbAuth}`);
    const existing = await r.json();
    const list = (existing && typeof existing === "object") ? existing : {};

    // Prune stale entries (tokens whose signature TTL has already passed).
    const now = Date.now();
    for (const k of Object.keys(list)) {
      if (typeof list[k] !== "number" || list[k] < now - PRUNE_HORIZON_MS) {
        delete list[k];
      }
    }
    list[tokenId] = v.expiresAt || (now + 30 * 24 * 60 * 60 * 1000);

    await fetch(`${DB}/rq/rq-revoked-v1.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    });
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
};
