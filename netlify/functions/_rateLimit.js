import { createHash } from "crypto";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkRateLimit(DB, ip) {
  if (process.env.RATE_LIMIT_DISABLED) return { limited: false };
  if (!DB || !ip) return { limited: false };

  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 12);
  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

  try {
    const r = await fetch(`${DB}/rl/${ipHash}.json${fbAuth}`);
    const data = await r.json();
    const now = Date.now();
    const inWindow = data && typeof data.count === "number" && data.resetAt > now;
    const count = inWindow ? data.count : 0;
    const resetAt = inWindow ? data.resetAt : now + WINDOW_MS;

    if (count >= MAX_ATTEMPTS) {
      return { limited: true, retryAfter: Math.ceil((resetAt - now) / 1000) };
    }

    // Increment counter — fire-and-forget so auth latency is unaffected
    fetch(`${DB}/rl/${ipHash}.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: count + 1, resetAt }),
    }).catch(function () {});

    return { limited: false };
  } catch (e) {
    return { limited: false }; // fail open if Firebase is unreachable
  }
}
