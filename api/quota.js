// GET /api/quota
// Returns the authenticated user's daily quota usage for each tracked
// endpoint. Used by the front-end home-screen chip ("X / Y quests today").
//
// The "ai" bucket has a level-dependent cap (10 for A1-B1, 6 for B2-C2)
// so the response includes both values — the frontend picks the right
// one based on the user's current level.

import { extractUsername } from "./_session.js";
import { getUserQuota } from "./_userQuota.js";

const ENDPOINTS = {
  ai: { maxLow: 10, maxHigh: 6 },
  quiz_from_text: { max: 15 },
  vocab: { max: 80 },
  slider: { max: 30 },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const username = extractUsername(req);
  if (!username) return res.status(401).json({ error: "Unauthorized" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const quotas = {};
  for (const [endpoint, caps] of Object.entries(ENDPOINTS)) {
    // For display we ask with the higher cap so `used` is exact — the
    // frontend picks the right `max` from `caps` based on the user's level.
    const probeMax = caps.maxLow || caps.max || 0;
    const q = await getUserQuota(DB, username, endpoint, { max: probeMax });
    quotas[endpoint] = { used: q.used, resetAt: q.resetAt, ...caps };
  }
  return res.status(200).json({ user: username, quotas });
}
