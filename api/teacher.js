// F6 — teacher router. Consolidates bio (GET/POST) + search (GET) into one
// Serverless Function to stay under Vercel's Hobby-plan 12-function cap.
//
// Dispatch:
//   GET  /api/teacher?action=bio&name=<n>  → public profile + counts (or 404)
//   POST /api/teacher?action=bio           → auth-required upsert
//   GET  /api/teacher?action=search&q=<>   → directory search
//
// See the original teacher-bio.js / teacher-search.js commit messages for
// design rationale (consent gate, snippet len, scrape rate-limits).

import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX_BIO = 60;
const RATE_LIMIT_MAX_SEARCH = 60;
const MAX_RESULTS = 20;
const SNIPPET_LEN = 140;

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const action = String((req.query && req.query.action) || (req.body && req.body.action) || "").toLowerCase();

  // ── bio ─────────────────────────────────────────────────────────
  if (action === "bio") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_BIO, bucket: "teacher-bio" });
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

  // ── search ──────────────────────────────────────────────────────
  if (action === "search") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_SEARCH, bucket: "teacher-search" });
    if (rl.limited) {
      res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many searches." });
    }
    if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });

    const q = clean(String((req.query && req.query.q) || ""), 80);
    const qLc = q.toLowerCase();

    try {
      const map = await fbGet("rq-teacher-pub-v1");
      if (!map || typeof map !== "object") return res.status(200).json({ q, total: 0, results: [] });

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

      return res.status(200).json({ q, total: hits.length, results: hits.slice(0, MAX_RESULTS) });
    } catch (e) {
      return res.status(500).json({ error: e.message || String(e) });
    }
  }

  return res.status(400).json({ error: "Unknown 'action' (expected bio|search)" });
}
