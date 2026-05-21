// Teacher public profile endpoint. Backs F6 (Teacher Portfolio).
//
// Storage: rq-teacher-pub-v1/<safeName>.json holds the teacher's
// consent-gated public profile:
//   { bio, displayName, languages[], subjects[], public, updated }
// Teachers must explicitly set `public: true` for their profile to
// appear in search or load via GET — default is private.
//
// GET  ?name=<teacher>  → public profile + joined class/student counts,
//                          or 404 if missing / not opted in.
// POST { bio, displayName, languages[], subjects[], public }
//                       → upsert the authenticated user's own profile.
//                          Requires Bearer auth AND that the username
//                          is the teacherName of at least one class
//                          (rq-classes-v1) — that's how the server
//                          knows who is "a teacher" without a separate
//                          server-side role table.
//
// Field caps prevent the row from becoming a free-form CMS:
//   bio          ≤ 500 chars
//   displayName  ≤ 60 chars
//   languages    ≤ 5 entries, each ≤ 30 chars
//   subjects     ≤ 5 entries, each ≤ 50 chars

import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX = 60; // per IP per 15-min — protects against scraping

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
  // rq-classes-v1 is an array of { id, name, teacherName, students[] }.
  // Tolerate the legacy "nested-array" wrapper (see CLAUDE.md notes).
  const raw = await fbGet("rq-classes-v1");
  let arr = raw;
  if (Array.isArray(raw) && raw.length === 1 && Array.isArray(raw[0])) arr = raw[0];
  if (!Array.isArray(arr)) return [];
  return arr.filter((c) => c && c.teacherName === name);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "teacher-bio" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many requests." });
  }

  if (req.method === "GET") {
    const rawName = (req.query && req.query.name) || "";
    const name = clean(String(rawName), 60);
    if (!name) return res.status(400).json({ error: "Missing 'name'" });
    const sn = safeName(name);
    const bio = await fbGet(`rq-teacher-pub-v1/${sn}`);
    if (!bio || !bio.public) return res.status(404).json({ error: "Not found" });
    const classes = await findTeacherClasses(name);
    const studentSet = new Set();
    classes.forEach((c) => (c.students || []).forEach((s) => studentSet.add(s)));
    return res.status(200).json({
      name,
      displayName: bio.displayName || name,
      bio: bio.bio || "",
      languages: Array.isArray(bio.languages) ? bio.languages : [],
      subjects: Array.isArray(bio.subjects) ? bio.subjects : [],
      classCount: classes.length,
      studentCount: studentSet.size,
      updated: bio.updated || null,
    });
  }

  if (req.method === "POST") {
    const username = extractUsername(req);
    if (!username) return res.status(401).json({ error: "Unauthorized" });
    const ownedClasses = await findTeacherClasses(username);
    if (!ownedClasses.length) {
      return res.status(403).json({ error: "Only users who teach at least one class can publish a profile" });
    }
    const body = req.body || {};
    const entry = {
      bio: clean(body.bio, 500),
      displayName: clean(body.displayName, 60),
      languages: cleanArr(body.languages, 5, 30),
      subjects: cleanArr(body.subjects, 5, 50),
      public: body.public === true,
      updated: new Date().toISOString(),
    };
    const ok = await fbPut(`rq-teacher-pub-v1/${safeName(username)}`, entry);
    if (!ok) return res.status(502).json({ error: "Write failed" });
    return res.status(200).json({ ok: true, ...entry });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
