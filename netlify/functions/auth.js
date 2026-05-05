import { createHmac } from "crypto";

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

  const secret = process.env.SESSION_SECRET || "";
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

  try {
    // Try the dedicated auth store first (new and migrated users)
    const ar = await fetch(`${DB}/rq/rq-auth-v6.json`);
    const authData = await ar.json();
    if (Array.isArray(authData)) {
      const authUser = authData.find(function (u) {
        return u.name.toLowerCase() === name.toLowerCase() && u.hash === hash;
      });
      if (authUser) {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(authUser.name, secret) }) };
      }
    }

    // Fall back to old profile list (users registered before the auth separation)
    const pr = await fetch(`${DB}/rq/rq-users-v6.json`);
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

    // Accept SHA-256 hash or legacy btoa hash (migration path)
    const hashMatches = profileUser.hash === hash;
    const legacyMatches = legacy && profileUser.hash === legacy;
    if (!hashMatches && !legacyMatches) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    // Migrate: write to rq-auth-v6 with SHA-256 hash going forward
    const authList = Array.isArray(authData) ? authData : [];
    const newAuthList = authList.concat([{ name: profileUser.name, hash }]);
    await fetch(`${DB}/rq/rq-auth-v6.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAuthList),
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: issueToken(profileUser.name, secret) }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
