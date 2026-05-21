// GET /.netlify/functions/quota
// Returns the authenticated user's daily quota usage. Mirrors api/quota.js.

import { extractUsername } from "./_session.js";
import { getUserQuota } from "./_userQuota.js";

const ENDPOINTS = {
  ai: { maxLow: 10, maxHigh: 6 },
  quiz_from_text: { max: 15 },
  vocab: { max: 80 },
  slider: { max: 30 },
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: {}, body: "" };
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const username = extractUsername(event);
  if (!username) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const quotas = {};
  for (const [endpoint, caps] of Object.entries(ENDPOINTS)) {
    const probeMax = caps.maxLow || caps.max || 0;
    const q = await getUserQuota(DB, username, endpoint, { max: probeMax });
    quotas[endpoint] = { used: q.used, resetAt: q.resetAt, ...caps };
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: username, quotas }),
  };
};
