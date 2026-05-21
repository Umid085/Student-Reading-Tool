// Teacher directory search — Netlify shape. Mirrors api/teacher-search.js.

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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };

  const q = clean(((event.queryStringParameters || {}).q) || "", 80);
  const qLc = q.toLowerCase();

  try {
    const r = await fetch(`${DB}/rq/rq-teacher-pub-v1.json${fbAuthSuffix()}`);
    if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Search backend unavailable" }) };
    const map = await r.json();
    if (!map || typeof map !== "object") {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ q, total: 0, results: [] }) };
    }
    const hits = Object.entries(map)
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
};
