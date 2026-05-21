import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { hashPassword, verifyPassword } from "./_passwordHash.js";
import { issueRefreshToken } from "./_refreshToken.js";

function issueToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
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

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "DB not configured" });

  const { name, hash, legacy } = req.body || {};
  if (!name || !hash) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

    // Try the dedicated auth store first (new and migrated users)
    const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`);
    const authData = await ar.json();
    // Surface Firebase permission/auth errors instead of masking them as "Invalid credentials"
    if (authData && typeof authData === "object" && !Array.isArray(authData) && typeof authData.error === "string") {
      return res.status(502).json({ error: `Firebase: ${authData.error}` });
    }
    if (Array.isArray(authData)) {
      const authUser = authData.find(function (u) {
        return u.name.toLowerCase() === name.toLowerCase();
      });
      if (authUser) {
        const v = verifyPassword(hash, authUser.hash);
        if (v.ok) {
          if (v.needsRehash) {
            // Legacy hash matched — upgrade to scrypt in place.
            const updated = authData.map(function (u) {
              return u === authUser ? { name: authUser.name, hash: hashPassword(hash) } : u;
            });
            await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
          }
          return res.status(200).json({
            token: issueToken(authUser.name, secret),
            refreshToken: issueRefreshToken(authUser.name, secret),
          });
        }
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    // Fall back to old profile list (users registered before the auth separation)
    const pr = await fetch(`${DB}/rq/rq-users-v6.json${fbAuth}`);
    const profiles = await pr.json();
    if (profiles && typeof profiles === "object" && !Array.isArray(profiles) && typeof profiles.error === "string") {
      return res.status(502).json({ error: `Firebase: ${profiles.error}` });
    }
    if (!Array.isArray(profiles)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const profileUser = profiles.find(function (u) {
      return u.name.toLowerCase() === name.toLowerCase();
    });
    if (!profileUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const v = verifyPassword(hash, profileUser.hash);
    const legacyMatches = !v.ok && legacy && verifyPassword(legacy, profileUser.hash).ok;
    if (!v.ok && !legacyMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Migrate: write to rq-auth-v6 with the freshly scrypt-hashed credential.
    const authList = Array.isArray(authData) ? authData : [];
    const newAuthList = authList.concat([{ name: profileUser.name, hash: hashPassword(hash) }]);
    await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAuthList),
    });

    return res.status(200).json({
      token: issueToken(profileUser.name, secret),
      refreshToken: issueRefreshToken(profileUser.name, secret),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
