#!/usr/bin/env node
// One-time maintenance: clear the B2, C1, and C2 per-level leaderboards in
// rq-boards-v6. Run this ONCE after shipping the level-gate so the high-level
// boards start empty and only re-populate with players who have unlocked them.
//
// Usage (Node 18+ has global fetch):
//   FIREBASE_DB_URL="https://your-db.firebaseio.com" \
//   FIREBASE_DB_SECRET="your-secret" \
//   node scripts/wipe-gated-boards.js
//
// FIREBASE_DB_SECRET is optional if your DB rules allow unauthenticated writes
// (they normally don't). Grab both values from the Vercel project env.

const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
const SECRET = process.env.FIREBASE_DB_SECRET || "";

if (!DB) {
  console.error("✖ FIREBASE_DB_URL is not set.");
  process.exit(1);
}

const auth = SECRET ? `?auth=${encodeURIComponent(SECRET)}` : "";
const LEVELS = ["B2", "C1", "C2"];

(async () => {
  for (const lv of LEVELS) {
    const url = `${DB}/rq/rq-boards-v6/${lv}.json${auth}`;
    const r = await fetch(url, { method: "DELETE" });
    if (r.ok) console.log(`✓ ${lv} leaderboard cleared`);
    else console.error(`✖ ${lv}: ${r.status} ${await r.text()}`);
  }
  console.log("Done — B2 / C1 / C2 leaderboards wiped.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
