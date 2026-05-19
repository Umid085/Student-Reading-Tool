// POST /api/revoke — Vercel mirror. See netlify/functions/revoke.js for
// the full explanation.

import { checkRateLimit } from "./_rateLimit.js";
import { verifyRefreshToken, refreshTokenId } from "./_refreshToken.js";

const PRUNE_HORIZON_MS = 31 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.SESSION_SECRET || process.env.SESSIONS_SECRET || process.env.FIREBASE_DB_SECRET || "";
  if (!secret) return res.status(503).json({ error: "Auth not configured" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "DB not configured" });

  const { name, refreshToken } = req.body || {};
  if (!name || !refreshToken) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  const v = verifyRefreshToken(refreshToken, secret);
  if (!v.ok || v.name.toLowerCase() !== String(name).toLowerCase()) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const tokenId = refreshTokenId(refreshToken);
  if (!tokenId) {
    return res.status(400).json({ error: "Token id not derivable" });
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
    const r = await fetch(`${DB}/rq/rq-revoked-v1.json${fbAuth}`);
    const existing = await r.json();
    const list = (existing && typeof existing === "object") ? existing : {};
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
    return res.status(500).json({ error: e.message });
  }

  return res.status(200).json({ ok: true });
}
