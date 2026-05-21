// Shared slider pool helper — mirrors api/_sliderPool.js exactly.
// See that file for the design notes.

const POOL_CAP = 100;

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function safeLevel(level) {
  return String(level || "B1").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "B1";
}

function poolUrl(DB, level) {
  return `${DB}/rq/rq-slider-pool-v1/${safeLevel(level)}.json`;
}

export async function getRandomFromPool(DB, level, excludeIds) {
  if (!DB) return null;
  try {
    const r = await fetch(poolUrl(DB, level) + fbAuthSuffix());
    if (!r.ok) return null;
    const map = await r.json();
    if (!map || typeof map !== "object" || Array.isArray(map)) return null;
    const ex = new Set((excludeIds || []).map(String));
    const ids = Object.keys(map).filter((id) => !ex.has(id) && map[id] && map[id].passage);
    if (!ids.length) return null;
    const pick = ids[Math.floor(Math.random() * ids.length)];
    return { id: pick, ...map[pick] };
  } catch (_) { return null; }
}

export async function addToPool(DB, level, card) {
  if (!DB || !card || !card.passage) return null;
  const id = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const entry = { ...card, ts: Date.now() };
  try {
    await fetch(`${DB}/rq/rq-slider-pool-v1/${safeLevel(level)}.json${fbAuthSuffix()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [id]: entry }),
    });
    pruneIfOverCap(DB, level).catch(function () {});
    return id;
  } catch (_) { return null; }
}

async function pruneIfOverCap(DB, level) {
  try {
    const r = await fetch(poolUrl(DB, level) + fbAuthSuffix());
    if (!r.ok) return;
    const map = await r.json();
    if (!map || typeof map !== "object") return;
    const entries = Object.entries(map);
    if (entries.length <= POOL_CAP) return;
    entries.sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0));
    const toDrop = entries.slice(0, entries.length - POOL_CAP);
    const updates = {};
    toDrop.forEach(([id]) => { updates[id] = null; });
    await fetch(`${DB}/rq/rq-slider-pool-v1/${safeLevel(level)}.json${fbAuthSuffix()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (_) {}
}
