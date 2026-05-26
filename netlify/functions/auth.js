// Auth router (Netlify shape). Mirrors api/auth.js. Dispatches login /
// register / refresh / revoke based on action query param or body.action.

import { createHmac } from "crypto";
import { checkRateLimit } from "./_rateLimit.js";
import { hashPassword, verifyPassword } from "./_passwordHash.js";
import { issueRefreshToken, verifyRefreshToken, refreshTokenId } from "./_refreshToken.js";
import { verifyProviderCredential } from "./_oauth.js";

const ALLOWED_NAME = /^[a-zA-Z0-9_]{2,30}$/;
const PRUNE_HORIZON_MS = 31 * 24 * 60 * 60 * 1000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function getSecret() {
  return process.env.SESSION_SECRET || process.env.SESSIONS_SECRET || process.env.FIREBASE_DB_SECRET || "";
}

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function issueAccessToken(name, secret) {
  const expires = Date.now() + 48 * 60 * 60 * 1000;
  const payload = `${name}:${expires}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

async function isRevoked(DB, tokenId) {
  if (!DB || !tokenId) return false;
  try {
    const r = await fetch(`${DB}/rq/rq-revoked-v1.json${fbAuthSuffix()}`);
    const data = await r.json();
    if (!data || typeof data !== "object") return false;
    return typeof data[tokenId] === "number";
  } catch (_) { return false; }
}

async function doLogin({ name, hash, legacy }, secret, DB) {
  const fb = fbAuthSuffix();
  const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fb}`);
  const authData = await ar.json();
  if (authData && typeof authData === "object" && !Array.isArray(authData) && typeof authData.error === "string") {
    return { status: 502, body: { error: `Firebase: ${authData.error}` } };
  }
  if (Array.isArray(authData)) {
    const authUser = authData.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (authUser) {
      const v = verifyPassword(hash, authUser.hash);
      if (v.ok) {
        if (v.needsRehash) {
          const updated = authData.map((u) => (u === authUser ? { name: authUser.name, hash: hashPassword(hash) } : u));
          await fetch(`${DB}/rq/rq-auth-v6.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
        }
        return { status: 200, body: { token: issueAccessToken(authUser.name, secret), refreshToken: issueRefreshToken(authUser.name, secret) } };
      }
      return { status: 401, body: { error: "Invalid credentials" } };
    }
  }
  const pr = await fetch(`${DB}/rq/rq-users-v6.json${fb}`);
  const profiles = await pr.json();
  if (profiles && typeof profiles === "object" && !Array.isArray(profiles) && typeof profiles.error === "string") {
    return { status: 502, body: { error: `Firebase: ${profiles.error}` } };
  }
  if (!Array.isArray(profiles)) return { status: 401, body: { error: "Invalid credentials" } };
  const profileUser = profiles.find((u) => u.name.toLowerCase() === name.toLowerCase());
  if (!profileUser) return { status: 401, body: { error: "Invalid credentials" } };
  const v = verifyPassword(hash, profileUser.hash);
  const legacyMatches = !v.ok && legacy && verifyPassword(legacy, profileUser.hash).ok;
  if (!v.ok && !legacyMatches) return { status: 401, body: { error: "Invalid credentials" } };
  const authList = Array.isArray(authData) ? authData : [];
  const newAuthList = authList.concat([{ name: profileUser.name, hash: hashPassword(hash) }]);
  await fetch(`${DB}/rq/rq-auth-v6.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAuthList) });
  return { status: 200, body: { token: issueAccessToken(profileUser.name, secret), refreshToken: issueRefreshToken(profileUser.name, secret) } };
}

async function doRegister({ name, hash }, secret, DB) {
  if (!ALLOWED_NAME.test(name)) return { status: 400, body: { error: "Invalid username" } };
  const fb = fbAuthSuffix();
  const pr = await fetch(`${DB}/rq/rq-users-v6.json${fb}`);
  const profiles = await pr.json();
  if (profiles && typeof profiles === "object" && !Array.isArray(profiles) && typeof profiles.error === "string") {
    return { status: 502, body: { error: `Firebase: ${profiles.error}` } };
  }
  const profileList = Array.isArray(profiles) ? profiles : [];
  if (profileList.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
    return { status: 409, body: { error: "Username taken" } };
  }
  const joined = new Date().toISOString().slice(0, 10);
  const newProfiles = profileList.concat([{ name, games: [], joined }]);
  const wp = await fetch(`${DB}/rq/rq-users-v6.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProfiles) });
  if (!wp.ok) {
    let errText = ""; try { errText = await wp.text(); } catch (_) {}
    return { status: 502, body: { error: `Firebase profile write failed (${wp.status}): ${errText.slice(0, 200)}` } };
  }
  const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fb}`);
  const authData = await ar.json();
  const authList = Array.isArray(authData) ? authData : [];
  const newAuthList = authList.concat([{ name, hash: hashPassword(hash) }]);
  await fetch(`${DB}/rq/rq-auth-v6.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAuthList) });
  return { status: 200, body: { token: issueAccessToken(name, secret), refreshToken: issueRefreshToken(name, secret) } };
}

async function doRefresh({ name, refreshToken }, secret, DB) {
  const v = verifyRefreshToken(refreshToken, secret);
  if (!v.ok || v.name.toLowerCase() !== String(name).toLowerCase()) {
    return { status: 401, body: { error: "Invalid refresh token" } };
  }
  const tokenId = refreshTokenId(refreshToken);
  if (tokenId && (await isRevoked(DB, tokenId))) {
    return { status: 401, body: { error: "Refresh token revoked" } };
  }
  return { status: 200, body: { token: issueAccessToken(v.name, secret), refreshToken: issueRefreshToken(v.name, secret) } };
}

async function doRevoke({ name, refreshToken }, secret, DB) {
  const v = verifyRefreshToken(refreshToken, secret);
  if (!v.ok || v.name.toLowerCase() !== String(name).toLowerCase()) {
    return { status: 401, body: { error: "Invalid refresh token" } };
  }
  const tokenId = refreshTokenId(refreshToken);
  if (!tokenId) return { status: 400, body: { error: "Token id not derivable" } };
  try {
    const fb = fbAuthSuffix();
    const r = await fetch(`${DB}/rq/rq-revoked-v1.json${fb}`);
    const existing = await r.json();
    const list = (existing && typeof existing === "object") ? existing : {};
    const now = Date.now();
    for (const k of Object.keys(list)) {
      if (typeof list[k] !== "number" || list[k] < now - PRUNE_HORIZON_MS) delete list[k];
    }
    list[tokenId] = v.expiresAt || (now + 30 * 24 * 60 * 60 * 1000);
    await fetch(`${DB}/rq/rq-revoked-v1.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list) });
    return { status: 200, body: { ok: true } };
  } catch (e) {
    return { status: 500, body: { error: e.message } };
  }
}

// Derive a clean default username from a provider's display name / email
// local-part so the picker isn't blank. Output always satisfies ALLOWED_NAME.
function suggestUsername(email, name) {
  let base = (name || (email ? email.split("@")[0] : "") || "user")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 24);
  if (base.length < 2) base = (base + "user").slice(0, 24);
  return base;
}

// Social login. Verify the provider credential → trusted identity, then:
//   1. match an existing account by provider sub, else by verified email
//      (existing password-only accounts have no email on file, so they're
//       never silently claimed — linking those is the authenticated flow);
//   2. otherwise it's a new user — ask the client for a username, then create
//      the account and mint our own tokens.
async function doOAuth(body, secret, DB) {
  const { provider, credential, username } = body || {};
  const id = await verifyProviderCredential(provider, credential);
  if (!id.ok) return { status: 401, body: { error: id.error || "OAuth verification failed" } };

  const fb = fbAuthSuffix();
  const ar = await fetch(`${DB}/rq/rq-auth-v6.json${fb}`);
  const authData = await ar.json();
  if (authData && typeof authData === "object" && !Array.isArray(authData) && typeof authData.error === "string") {
    return { status: 502, body: { error: `Firebase: ${authData.error}` } };
  }
  const authList = Array.isArray(authData) ? authData : [];

  let match = authList.find((u) => u && u.firebaseUid && u.firebaseUid === id.firebaseUid);
  if (!match && id.email) {
    match = authList.find((u) => u && typeof u.email === "string" && u.email.toLowerCase() === id.email);
  }
  if (match) {
    // Backfill the Firebase uid / email when we matched on email so next time
    // is a direct uid hit.
    if (match.firebaseUid !== id.firebaseUid || !match.email) {
      const updated = authList.map((u) => (u === match ? Object.assign({}, u, { firebaseUid: id.firebaseUid, email: u.email || id.email }) : u));
      await fetch(`${DB}/rq/rq-auth-v6.json${fb}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    }
    return { status: 200, body: { token: issueAccessToken(match.name, secret), refreshToken: issueRefreshToken(match.name, secret), name: match.name } };
  }

  if (!username) {
    return { status: 200, body: { needsUsername: true, email: id.email, suggestedName: suggestUsername(id.email, id.name), provider: id.provider } };
  }
  if (!ALLOWED_NAME.test(username)) {
    return { status: 400, body: { error: "Username must be 2–30 letters, numbers, or underscores", code: "invalid_username" } };
  }
  if (authList.some((u) => u && u.name && u.name.toLowerCase() === username.toLowerCase())) {
    return { status: 409, body: { error: "Username taken", code: "username_taken" } };
  }
  const pr = await fetch(`${DB}/rq/rq-users-v6.json${fb}`);
  const profiles = await pr.json();
  if (profiles && typeof profiles === "object" && !Array.isArray(profiles) && typeof profiles.error === "string") {
    return { status: 502, body: { error: `Firebase: ${profiles.error}` } };
  }
  const profileList = Array.isArray(profiles) ? profiles : [];
  if (profileList.some((u) => u && u.name && u.name.toLowerCase() === username.toLowerCase())) {
    return { status: 409, body: { error: "Username taken", code: "username_taken" } };
  }
  const joined = new Date().toISOString().slice(0, 10);
  const wp = await fetch(`${DB}/rq/rq-users-v6.json${fb}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileList.concat([{ name: username, games: [], joined }])),
  });
  if (!wp.ok) {
    let errText = ""; try { errText = await wp.text(); } catch (_) {}
    return { status: 502, body: { error: `Firebase profile write failed (${wp.status}): ${errText.slice(0, 200)}` } };
  }
  const newAuth = { name: username, email: id.email, firebaseUid: id.firebaseUid, provider: id.provider };
  await fetch(`${DB}/rq/rq-auth-v6.json${fb}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authList.concat([newAuth])),
  });
  return { status: 200, body: { token: issueAccessToken(username, secret), refreshToken: issueRefreshToken(username, secret), name: username } };
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  const secret = getSecret();
  if (!secret) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Auth not configured" }) };
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();
  const rl = await checkRateLimit(DB, ip);
  if (rl.limited) return { statusCode: 429, headers: Object.assign({}, CORS, { "Retry-After": String(rl.retryAfter) }), body: JSON.stringify({ error: "Too many attempts. Try again later." }) };

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch (_) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  const qa = event.queryStringParameters && event.queryStringParameters.action;
  const action = String(qa || body.action || "login").toLowerCase();

  // OAuth derives the account from the verified provider credential, so unlike
  // the other actions it has no `name` on the first call — dispatch before the
  // name guard.
  if (action === "oauth") {
    try {
      const r = await doOAuth(body, secret, DB);
      return { statusCode: r.status, headers: CORS, body: JSON.stringify(r.body) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (!body.name) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };

  let result;
  try {
    if (action === "login") {
      if (!body.hash) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
      result = await doLogin(body, secret, DB);
    } else if (action === "register") {
      if (!body.hash) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
      result = await doRegister(body, secret, DB);
    } else if (action === "refresh") {
      if (!body.refreshToken) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
      result = await doRefresh(body, secret, DB);
    } else if (action === "revoke") {
      if (!body.refreshToken) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing credentials" }) };
      result = await doRevoke(body, secret, DB);
    } else {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Unknown 'action' (expected login|register|refresh|revoke|oauth)" }) };
    }
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }

  return { statusCode: result.status, headers: CORS, body: JSON.stringify(result.body) };
};
