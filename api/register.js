import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { hashPassword } from "./_passwordHash.js";
import { issueRefreshToken } from "./_refreshToken.js";

const ALLOWED_NAME = /^[a-zA-Z0-9_]{2,30}$/;

function issueToken(name, secret) {
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

  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_DB_SECRET || "";
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!secret) return res.status(503).json({ error: "Auth not configured" });
  if (!DB) return res.status(503).json({ error: "DB not configured" });

  const { name, hash } = req.body || {};
  if (!name || !hash) {
    return res.status(400).json({ error: "Missing credentials" });
  }
  if (!ALLOWED_NAME.test(name)) {
    return res.status(400).json({ error: "Invalid username" });
  }

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

    // Check for duplicate name in profile list
    const pr = await fetch(`${DB}/rq/rq-users-v6.json${fbAuth}`);
    const profiles = await pr.json();
    if (profiles && typeof profiles === "object" && !Array.isArray(profiles) && typeof profiles.error === "string") {
      return res.status(502).json({ error: `Firebase: ${profiles.error}` });
    }
    const profileList = Array.isArray(profiles) ? profiles : [];

    if (profileList.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: "Username taken" });
    }

    // ISO yyyy-mm-dd so display and comparisons are locale-stable
    // (front-end keys all dates the same way).
    const joined = new Date().toISOString().slice(0, 10);

    // Write profile (no hash) to rq-users-v6
    const newProfiles = profileList.concat([{ name, games: [], joined }]);
    const wp = await fetch(`${DB}/rq/rq-users-v6.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProfiles),
    });
    if (!wp.ok) {
      let errText = "";
      try { errText = await wp.text(); } catch (_) {}
      return res.status(502).json({ error: `Firebase profile write failed (${wp.status}): ${errText.slice(0, 200)}` });
    }

    // Write credentials to rq-auth-v6 (separate, never exposed via storage.js).
    // Store as a scrypt-hashed value so a DB leak doesn't expose passwords
    // to trivial GPU brute force on the client-supplied SHA-256.
    const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`);
    const authData = await ar.json();
    const authList = Array.isArray(authData) ? authData : [];
    const newAuthList = authList.concat([{ name, hash: hashPassword(hash) }]);
    await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAuthList),
    });

    return res.status(200).json({
      token: issueToken(name, secret),
      refreshToken: issueRefreshToken(name, secret),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
