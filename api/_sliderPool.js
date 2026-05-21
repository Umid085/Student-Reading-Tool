// Shared cross-user slider card pool. Sits under rq-slider-pool-v1/<level>
// as a Firebase RTDB object map keyed by card id (timestamp + random suffix).
// Each entry holds { passage, question, topic, ts }.
//
// Lifecycle:
//   - First user at a given level pays Claude, the card is also written here.
//   - Subsequent users at the same level pull from here for free until the
//     pool runs out or every card has been seen by the requester.
//   - Pool grows organically; the cap (100) prevents unbounded storage and
//     keeps reads small. New writes prune the oldest entry when at cap.
//
// `excludeIds` lets the caller suppress within-session duplicates without
// the server tracking per-user history.

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

// Reads the pool for a level and returns one random card the caller hasn't
// seen yet, or null if the pool is empty / every card is excluded.
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

// Writes a freshly generated card to the pool with a unique id. Prunes the
// oldest entries (by `ts`) when the pool grows past POOL_CAP so RTDB reads
// stay small. Fire-and-forget — caller can return the card immediately.
export async function addToPool(DB, level, card) {
  if (!DB || !card || !card.passage) return null;
  const id = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const entry = { ...card, ts: Date.now() };
  try {
    // PATCH to merge a single id into the existing map
    await fetch(`${DB}/rq/rq-slider-pool-v1/${safeLevel(level)}.json${fbAuthSuffix()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [id]: entry }),
    });
    // Best-effort prune: if the pool is over cap, drop the N oldest.
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
    entries.sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0)); // oldest first
    const toDrop = entries.slice(0, entries.length - POOL_CAP);
    const updates = {};
    toDrop.forEach(([id]) => { updates[id] = null; });
    await fetch(`${DB}/rq/rq-slider-pool-v1/${safeLevel(level)}.json${fbAuthSuffix()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (_) { /* swallow — prune is best-effort */ }
}
