import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { hashPassword, verifyPassword } from "./_passwordHash.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function issueToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
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

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, hash, legacy } = body;
  if (!name || !hash) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
  }

  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) {
    return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many attempts. Try again later." }) };
  }

  try {
    const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

    // Try the dedicated auth store first (new and migrated users)
    const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`);
    const authData = await ar.json();
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
          return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(authUser.name, secret) }) };
        }
        // Hash didn't match — fall through to legacy fallback only if no auth
        // entry is found at all (handled below by checking profileUser).
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
      }
    }

    // Fall back to old profile list (users registered before the auth separation)
    const pr = await fetch(`${DB}/rq/rq-users-v6.json${fbAuth}`);
    const profiles = await pr.json();
    if (!Array.isArray(profiles)) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const profileUser = profiles.find(function (u) {
      return u.name.toLowerCase() === name.toLowerCase();
    });
    if (!profileUser) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    // Accept current-format hash or legacy btoa hash (kept for users whose
    // client still sends a `legacy` field; covered by the verifyPassword
    // fall-back path for non-scrypt stored values).
    const v = verifyPassword(hash, profileUser.hash);
    const legacyMatches = !v.ok && legacy && verifyPassword(legacy, profileUser.hash).ok;
    if (!v.ok && !legacyMatches) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    // Migrate: write to rq-auth-v6 with the freshly scrypt-hashed credential.
    const authList = Array.isArray(authData) ? authData : [];
    const newAuthList = authList.concat([{ name: profileUser.name, hash: hashPassword(hash) }]);
    await fetch(`${DB}/rq/rq-auth-v6.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAuthList),
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(profileUser.name, secret) }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
