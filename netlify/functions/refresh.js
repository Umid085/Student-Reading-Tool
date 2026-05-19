// POST /api/refresh — exchange a long-lived refresh token for a fresh
// access token (and rotated refresh token). Used by the client's auto-login
// flow instead of re-sending the password hash on every session.
//
// Body: { name, refreshToken }
// Response: { token, refreshToken } (rotated)

import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { issueRefreshToken, verifyRefreshToken, refreshTokenId } from "./_refreshToken.js";

// One Firebase fetch per refresh to read the revoked-token list. The list
// is bounded by the 30-day token TTL (entries drop off automatically) and
// by total user count, so it stays small in practice.
async function isRevoked(DB, tokenId) {
  if (!DB || !tokenId) return false;
  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
    const r = await fetch(`${DB}/rq/rq-revoked-v1.json${fbAuth}`);
    const data = await r.json();
    if (!data || typeof data !== "object") return false;
    const expiresAt = data[tokenId];
    if (typeof expiresAt !== "number") return false;
    // Past-expiry entries are effectively no longer needed but we still
    // honour them (cheap to check, defence in depth).
    return true;
  } catch (e) {
    // Fail-open on revocation lookup so a brief Firebase outage doesn't
    // lock out every user. The token is still cryptographically signed.
    return false;
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function issueAccessToken(name, secret) {
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
  if (!secret) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Auth not configured" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, refreshToken } = body;
  if (!name || !refreshToken) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many attempts. Try again later." }) };
  }

  const v = verifyRefreshToken(refreshToken, secret);
  if (!v.ok || v.name.toLowerCase() !== String(name).toLowerCase()) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid refresh token" }) };
  }

  // Revocation check: if the user logged out (or an admin explicitly
  // invalidated this token), the token ID will be on the blacklist.
  const tokenId = refreshTokenId(refreshToken);
  if (tokenId && (await isRevoked(DB, tokenId))) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Refresh token revoked" }) };
  }

  // Rotate: every refresh issues a fresh refresh token. This shortens the
  // window during which a leaked token is useful (the new one replaces it
  // in localStorage; the old one stays valid until expiry but can be
  // invalidated by rotating SESSION_SECRET).
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      token: issueAccessToken(v.name, secret),
      refreshToken: issueRefreshToken(v.name, secret),
    }),
  };
};
