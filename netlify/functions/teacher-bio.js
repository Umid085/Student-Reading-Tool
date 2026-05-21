// Teacher public profile endpoint — Netlify shape.
// Mirrors api/teacher-bio.js. See that file for design notes.

import { extractUsername } from "./_session.js";

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function clean(s, maxLen) {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLen);
}

function cleanArr(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s) => typeof s === "string").map((s) => clean(s, maxLen)).filter(Boolean).slice(0, maxItems);
}

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    const name = clean(qs.name || "", 60);
    if (!name) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'name'" }) };
    const sn = safeName(name);
    const bio = await fbGet(`rq-teacher-pub-v1/${sn}`);
    if (!bio || !bio.public) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Not found" }) };
    const classes = await findTeacherClasses(name);
    const studentSet = new Set();
    classes.forEach((c) => (c.students || []).forEach((s) => studentSet.add(s)));
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        name,
        displayName: bio.displayName || name,
        bio: bio.bio || "",
        languages: Array.isArray(bio.languages) ? bio.languages : [],
        subjects: Array.isArray(bio.subjects) ? bio.subjects : [],
        classCount: classes.length,
        studentCount: studentSet.size,
        updated: bio.updated || null,
      }),
    };
  }

  if (event.httpMethod === "POST") {
    const username = extractUsername(event);
    if (!username) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }
    const ownedClasses = await findTeacherClasses(username);
    if (!ownedClasses.length) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: "Only users who teach at least one class can publish a profile" }) };
    }
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
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, ...entry }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
};
