// POST /api/refresh — exchange a long-lived refresh token for a fresh
// access token (and rotated refresh token). See netlify/functions/refresh.js
// for the full explanation; this is the Vercel-shape mirror.

import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { issueRefreshToken, verifyRefreshToken } from "./_refreshToken.js";

function issueAccessToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000;
  const payload = `${name}:${expires}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.SESSION_SECRET || process.env.SESSIONS_SECRET || process.env.FIREBASE_DB_SECRET || "";
  if (!secret) return res.status(503).json({ error: "Auth not configured" });

  const { name, refreshToken } = req.body || {};
  if (!name || !refreshToken) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
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

  return res.status(200).json({
    token: issueAccessToken(v.name, secret),
    refreshToken: issueRefreshToken(v.name, secret),
  });
}
