// Teacher directory search. Public — no auth.
// GET /api/teacher-search?q=<query>
//
// Reads the whole rq-teacher-pub-v1 namespace, filters to entries with
// public=true that substring-match the query against display name,
// username, bio, subjects, or languages, then returns up to 20 trimmed
// result cards plus a `total` count.
//
// At small scale (≤1000 consented teachers) the full-tree read is fast
// and avoids any indexing infrastructure. If it ever gets slow, the
// natural next step is a denormalised "search index" key updated by
// teacher-bio.js writes — not exposed here yet.

import { checkRateLimit } from "./_rateLimit.js";

const RATE_LIMIT_MAX = 60;
const MAX_RESULTS = 20;
const SNIPPET_LEN = 140;

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function clean(s, maxLen) {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLen);
}

function matches(entry, name, qLc) {
  if (!entry || !entry.public) return false;
  if (!qLc) return true; // empty query — return all consented teachers
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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "teacher-search" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many searches." });
  }
  if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });

  const q = clean(String((req.query && req.query.q) || ""), 80);
  const qLc = q.toLowerCase();

  try {
    const r = await fetch(`${DB}/rq/rq-teacher-pub-v1.json${fbAuthSuffix()}`);
    if (!r.ok) return res.status(502).json({ error: "Search backend unavailable" });
    const map = await r.json();
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
      // Newest profiles first; stable secondary sort by name
      .sort((a, b) => (b.updated || "").localeCompare(a.updated || "") || a.name.localeCompare(b.name));

    return res.status(200).json({ q, total: hits.length, results: hits.slice(0, MAX_RESULTS) });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
