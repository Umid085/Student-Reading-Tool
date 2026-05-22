// F6 — teacher router (Netlify shape). Mirrors api/teacher.js.

import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX_BIO = 60;
const RATE_LIMIT_MAX_SEARCH = 60;
const MAX_RESULTS = 20;
const SNIPPET_LEN = 140;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function clean(s, maxLen) {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLen);
}

function cleanArr(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s) => typeof s === "string").map((s) => clean(s, maxLen)).filter(Boolean).slice(0, maxItems);
}

function fbAuthSuffix() { return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : ""; }

async function fbGet(path) {
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return null;
  try {
    const r = await fetch(`${DB}/rq/${path}.json${fbAuthSuffix()}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (data && typeof data === "object" && data.error) return null;
    return data;
  } catch (_) { return null; }
}

async function fbPut(path, value) {
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return false;
  try {
    const r = await fetch(`${DB}/rq/${path}.json${fbAuthSuffix()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function findTeacherClasses(name) {
  const raw = await fbGet("rq-classes-v1");
  let arr = raw;
  if (Array.isArray(raw) && raw.length === 1 && Array.isArray(raw[0])) arr = raw[0];
  if (!Array.isArray(arr)) return [];
  return arr.filter((c) => c && c.teacherName === name);
}

function matches(entry, name, qLc) {
  if (!entry || !entry.public) return false;
  if (!qLc) return true;
  const hay = [
    name || "",
    entry.displayName || "",
    entry.bio || "",
    (entry.subjects || []).join(" "),
    (entry.languages || []).join(" "),
  ].join(" ").toLowerCase();
  return hay.indexOf(qLc) !== -1;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch (_) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const qa = event.queryStringParameters && event.queryStringParameters.action;
  const action = String(qa || body.action || "").toLowerCase();

  if (action === "bio") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_BIO, bucket: "teacher-bio" });
    if (rl.limited) return { statusCode: 429, headers: Object.assign({}, CORS, { "Retry-After": String(rl.retryAfter) }), body: JSON.stringify({ error: "Too many requests." }) };

    if (event.httpMethod === "GET") {
      const rawName = (event.queryStringParameters && event.queryStringParameters.name) || "";
      const name = clean(String(rawName), 60);
      if (!name) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'name'" }) };
      const sn = safeName(name);
      const bio = await fbGet(`rq-teacher-pub-v1/${sn}`);
      if (!bio || !bio.public) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Not found" }) };
      const classes = await findTeacherClasses(name);
      const studentSet = new Set();
      classes.forEach((c) => (c.students || []).forEach((s) => studentSet.add(s)));
      return { statusCode: 200, headers: CORS, body: JSON.stringify({
        name,
        displayName: bio.displayName || name,
        bio: bio.bio || "",
        languages: Array.isArray(bio.languages) ? bio.languages : [],
        subjects: Array.isArray(bio.subjects) ? bio.subjects : [],
        classCount: classes.length,
        studentCount: studentSet.size,
        updated: bio.updated || null,
      }) };
    }

    if (event.httpMethod === "POST") {
      const username = extractUsername(event);
      if (!username) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };
      const ownedClasses = await findTeacherClasses(username);
      if (!ownedClasses.length) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: "Only users who teach at least one class can publish a profile" }) };
      const entry = {
        bio: clean(body.bio, 500),
        displayName: clean(body.displayName, 60),
        languages: cleanArr(body.languages, 5, 30),
        subjects: cleanArr(body.subjects, 5, 50),
        public: body.public === true,
        updated: new Date().toISOString(),
      };
      const ok = await fbPut(`rq-teacher-pub-v1/${safeName(username)}`, entry);
      if (!ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Write failed" }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify(Object.assign({ ok: true }, entry)) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (action === "search") {
    if (event.httpMethod !== "GET") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_SEARCH, bucket: "teacher-search" });
    if (rl.limited) return { statusCode: 429, headers: Object.assign({}, CORS, { "Retry-After": String(rl.retryAfter) }), body: JSON.stringify({ error: "Too many searches." }) };
    if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };

    const q = clean(String((event.queryStringParameters && event.queryStringParameters.q) || ""), 80);
    const qLc = q.toLowerCase();

    try {
      const map = await fbGet("rq-teacher-pub-v1");
      if (!map || typeof map !== "object") return { statusCode: 200, headers: CORS, body: JSON.stringify({ q, total: 0, results: [] }) };

      const all = Object.entries(map);
      const hits = all
        .filter(([name, entry]) => matches(entry, name, qLc))
        .map(([name, entry]) => ({
          name,
          displayName: entry.displayName || name,
          bio: clean(entry.bio || "", SNIPPET_LEN),
          languages: Array.isArray(entry.languages) ? entry.languages : [],
          subjects: Array.isArray(entry.subjects) ? entry.subjects : [],
          updated: entry.updated || null,
        }))
        .sort((a, b) => (b.updated || "").localeCompare(a.updated || "") || a.name.localeCompare(b.name));

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ q, total: hits.length, results: hits.slice(0, MAX_RESULTS) }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message || String(e) }) };
    }
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Unknown 'action' (expected bio|search)" }) };
};
