// One-off cleanup: remove smoke-test leaderboard entries from rq-boards-v6.
//
// Filters out any board entry whose name starts with "smoke_comm_" or
// "smoke_verify_" (the disposable accounts used to verify the authz fixes),
// writing back ONLY the levels that actually changed (per-level PUT, not a
// whole-doc rewrite). Reads credentials from the environment — nothing is
// hardcoded. Not committed; delete after use.
//
// Run with the production Firebase env available, e.g.:
//   vercel env pull /tmp/p --environment=production --yes \
//     && set -a && . /tmp/p && set +a \
//     && node scripts/remove-smoke-entry.mjs \
//     ; rm -f /tmp/p

const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
const SEC = process.env.FIREBASE_DB_SECRET || "";
if (!DB) { console.error("FIREBASE_DB_URL not set in the environment."); process.exit(1); }
const auth = SEC ? `?auth=${SEC}` : "";
const SMOKE = /^smoke_(comm|verify)_/;

const asArr = (v) => Array.isArray(v) ? v
  : (v && typeof v === "object")
    ? Object.keys(v).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => v[k]).filter(x => x != null)
    : [];

const boards = await (await fetch(`${DB}/rq/rq-boards-v6.json${auth}`)).json() || {};
let total = 0;
for (const lvl of Object.keys(boards)) {
  const arr = asArr(boards[lvl]);
  const kept = arr.filter(e => e && !SMOKE.test(e.name || ""));
  const dropped = arr.length - kept.length;
  if (!dropped) continue;
  const w = await fetch(`${DB}/rq/rq-boards-v6/${encodeURIComponent(lvl)}.json${auth}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kept),
  });
  if (!w.ok) { console.error(`✗ ${lvl}: write failed ${w.status}`); process.exit(1); }
  console.log(`✓ ${lvl}: removed ${dropped} smoke entr${dropped === 1 ? "y" : "ies"}`);
  total += dropped;
}
console.log(total ? `Done — removed ${total} total.` : "No smoke entries found.");
