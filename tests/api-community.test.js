import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

function makeBearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

// fetch mock: each call consumes the next seq entry; every response exposes
// headers.get("etag") so casChild's conditional-PUT path works.
function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return {
      ok: r.ok !== false,
      status: r.status || 200,
      headers: { get: () => r.etag || "etag-0" },
      json: async () => r.json,
      text: async () => "",
    };
  });
}

// URLs of the PUT calls only (writes), in order.
function putUrls(fetchMock) {
  return fetchMock.mock.calls.filter((c) => c[1] && c[1].method === "PUT").map((c) => c[0]);
}
function putBodies(fetchMock) {
  return fetchMock.mock.calls.filter((c) => c[1] && c[1].method === "PUT").map((c) => JSON.parse(c[1].body));
}

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/community.js");
  return mod.default;
}

const SECRET = "test-secret";
const auth = (name, expired) => makeBearer(name, SECRET, Date.now() + (expired ? -1 : 60_000));
const post = (h, action, body, name = "bob") =>
  runHandler(h, { method: "POST", headers: { authorization: auth(name) }, query: { action }, body });

describe("api/community.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: SECRET, FIREBASE_DB_URL: "https://test-db.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  // ── guards ──────────────────────────────────────────────────
  it("OPTIONS → 204", async () => {
    expect((await runHandler(await loadHandler(), { method: "OPTIONS" })).statusCode).toBe(204);
  });
  it("405 for GET", async () => {
    expect((await runHandler(await loadHandler(), { method: "GET" })).statusCode).toBe(405);
  });
  it("503 without FIREBASE_DB_URL", async () => {
    delete process.env.FIREBASE_DB_URL;
    expect((await post(await loadHandler(), "submitWeekly", { xp: 1 })).statusCode).toBe(503);
  });
  it("401 without a token", async () => {
    const r = await runHandler(await loadHandler(), { method: "POST", query: { action: "submitWeekly" }, body: { xp: 1 } });
    expect(r.statusCode).toBe(401);
  });
  it("401 with an expired token", async () => {
    const r = await runHandler(await loadHandler(), { method: "POST", headers: { authorization: auth("bob", true) }, query: { action: "submitWeekly" }, body: { xp: 1 } });
    expect(r.statusCode).toBe(401);
  });
  it("400 for unknown action", async () => {
    expect((await post(await loadHandler(), "nope", {})).statusCode).toBe(400);
  });

  // ── submitScore ─────────────────────────────────────────────
  describe("submitScore", () => {
    it("400 on an invalid level", async () => {
      expect((await post(await loadHandler(), "submitScore", { level: "Z9" })).statusCode).toBe(400);
    });

    it("writes only the level child, forces name from token, clamps pct/xp", async () => {
      const fm = makeFetch([{ json: [{ name: "alice", xp: 999 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitScore", { level: "b1", name: "impostor", xp: -5, score: 3, total: 4, pct: 150, timeSecs: 30, topic: "Cats" });
      expect(r.statusCode).toBe(200);
      expect(putUrls(fm)[0]).toContain("/rq-boards-v6/B1.json");
      const board = JSON.parse(r.body).board;
      const me = board.find((e) => e.name === "bob");
      expect(me).toBeDefined();          // name from token, not "impostor"
      expect(board.some((e) => e.name === "impostor")).toBe(false);
      expect(me.xp).toBe(0);             // clamped ≥0
      expect(me.pct).toBe(100);          // clamped ≤100
      expect(me.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(board.find((e) => e.name === "alice")).toBeDefined(); // others preserved
    });

    it("replaces the actor's own prior entry (no duplicate) and sorts desc", async () => {
      const fm = makeFetch([{ json: [{ name: "bob", xp: 10 }, { name: "carol", xp: 500 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitScore", { level: "A1", xp: 50, pct: 80 });
      const board = JSON.parse(r.body).board;
      expect(board.filter((e) => e.name === "bob")).toHaveLength(1);
      expect(board[0].name).toBe("carol"); // 500 > 50
    });

    it("retries on a 412 and succeeds", async () => {
      global.fetch = makeFetch([{ json: [] }, { ok: false, status: 412 }, { json: [] }, { json: {} }]);
      const r = await post(await loadHandler(), "submitScore", { level: "A1", xp: 5, pct: 80 });
      expect(r.statusCode).toBe(200);
    });

    it("rejects a sub-threshold (random-guess) score without touching the board", async () => {
      const fm = makeFetch([{ json: [{ name: "alice", xp: 999 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitScore", { level: "A1", xp: 9999999, score: 1, total: 5, pct: 20 });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.ok).toBe(false);
      expect(putUrls(fm)).toHaveLength(0); // no write at all
    });

    it("clamps a forged XP down to the level's theoretical max", async () => {
      const fm = makeFetch([{ json: [] }, { json: {} }]);
      global.fetch = fm;
      // C2: total 5 → max (5*4*100 + 400 + 50 + 2000) * 1.5 = 6675
      const r = await post(await loadHandler(), "submitScore", { level: "C2", xp: 9999999, score: 5, total: 5, pct: 100, timeSecs: 30 });
      const me = JSON.parse(r.body).board.find((e) => e.name === "bob");
      expect(me.xp).toBe(6675);
    });
  });

  // ── submitWeekly ────────────────────────────────────────────
  describe("submitWeekly", () => {
    it("accumulates xp+games onto the actor's existing week entry", async () => {
      const fm = makeFetch([{ json: [{ name: "bob", xp: 100, games: 2 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitWeekly", { xp: 50 });
      expect(r.statusCode).toBe(200);
      const me = JSON.parse(r.body).week.find((e) => e.name === "bob");
      expect(me.xp).toBe(150);
      expect(me.games).toBe(3);
      expect(putUrls(fm)[0]).toMatch(/\/rq-weekly-v1\/\d{4}-W\d{2}\.json/);
    });
  });

  // ── sendRequest ─────────────────────────────────────────────
  describe("sendRequest", () => {
    it("400 on self-request", async () => {
      expect((await post(await loadHandler(), "sendRequest", { to: "bob" })).statusCode).toBe(400);
    });
    it("appends actor to recipient's requests", async () => {
      const fm = makeFetch([{ json: [] }, { json: [] }, { json: {} }]); // friends, requests, put
      global.fetch = fm;
      const r = await post(await loadHandler(), "sendRequest", { to: "alice" });
      expect(JSON.parse(r.body).ok).toBe(true);
      expect(putUrls(fm)[0]).toContain("/rq-social-v6/alice/requests.json");
      expect(putBodies(fm)[0]).toContain("bob");
    });
    it("ok:false 'Already friends' without any write", async () => {
      const fm = makeFetch([{ json: ["bob"] }]); // recipient's friends already include bob
      global.fetch = fm;
      const r = await post(await loadHandler(), "sendRequest", { to: "alice" });
      expect(JSON.parse(r.body)).toMatchObject({ ok: false, err: "Already friends" });
      expect(putUrls(fm)).toHaveLength(0);
    });
    it("ok:false 'Request already sent' (duplicate, no write)", async () => {
      const fm = makeFetch([{ json: [] }, { json: ["bob"] }]); // friends none, requests has bob
      global.fetch = fm;
      const r = await post(await loadHandler(), "sendRequest", { to: "alice" });
      expect(JSON.parse(r.body)).toMatchObject({ ok: false, err: "Request already sent" });
      expect(putUrls(fm)).toHaveLength(0);
    });
  });

  // ── acceptRequest / removeFriend (two-node) ─────────────────
  it("acceptRequest removes the request and adds both friendships", async () => {
    const fm = makeFetch([
      { json: ["alice"] }, { json: {} },  // actor/requests: remove alice
      { json: [] }, { json: {} },          // actor/friends: add alice
      { json: [] }, { json: {} },          // alice/friends: add actor
    ]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "acceptRequest", { from: "alice" });
    expect(r.statusCode).toBe(200);
    const urls = putUrls(fm);
    expect(urls).toEqual(expect.arrayContaining([
      expect.stringContaining("/rq-social-v6/bob/requests.json"),
      expect.stringContaining("/rq-social-v6/bob/friends.json"),
      expect.stringContaining("/rq-social-v6/alice/friends.json"),
    ]));
  });

  // ── likeProfile ─────────────────────────────────────────────
  describe("likeProfile", () => {
    it("400 on self-like", async () => {
      expect((await post(await loadHandler(), "likeProfile", { target: "bob" })).statusCode).toBe(400);
    });
    it("writes the guard then increments the target's likes", async () => {
      const fm = makeFetch([{ json: {} }, { json: {} }, { json: 5 }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "likeProfile", { target: "alice" });
      expect(JSON.parse(r.body)).toMatchObject({ ok: true, likes: 6 });
      const urls = putUrls(fm);
      expect(urls[0]).toContain("/rq-social-v6/!likes.json");
      expect(urls[1]).toContain("/rq-social-v6/alice/likes.json");
    });
    it("double-like is rejected with no increment", async () => {
      const fm = makeFetch([{ json: { "bob->alice": true } }]); // guard already present
      global.fetch = fm;
      const r = await post(await loadHandler(), "likeProfile", { target: "alice" });
      expect(JSON.parse(r.body)).toMatchObject({ ok: false, err: "Already liked" });
      expect(putUrls(fm)).toHaveLength(0);
    });
  });

  // ── sendChallenge / respond / complete ──────────────────────
  it("sendChallenge appends to opponent challenges and actor sent", async () => {
    const fm = makeFetch([{ json: [] }, { json: {} }, { json: [] }, { json: {} }]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "sendChallenge", { to: "alice", level: "B1", types: ["mcq"] });
    expect(JSON.parse(r.body).ok).toBe(true);
    expect(JSON.parse(r.body).id).toBeTruthy();
    const urls = putUrls(fm);
    expect(urls[0]).toContain("/rq-social-v6/alice/challenges.json");
    expect(urls[1]).toContain("/rq-social-v6/bob/sent.json");
  });

  it("respondChallenge 400 on bad status; resolves by id otherwise", async () => {
    expect((await post(await loadHandler(), "respondChallenge", { id: "c1", status: "maybe" })).statusCode).toBe(400);
    const fm = makeFetch([{ json: [{ id: "c1", status: "pending" }] }, { json: {} }]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "respondChallenge", { id: "c1", status: "accepted" });
    expect(r.statusCode).toBe(200);
    expect(putBodies(fm)[0][0].status).toBe("accepted");
  });

  it("completeChallenge marks actor's challenge + sender's sent by id; 404 if missing", async () => {
    const fm = makeFetch([
      { json: [{ id: "c1", from: "alice", senderPct: 80, status: "pending" }] }, { json: {} }, // actor challenges
      { json: [{ id: "c1", to: "bob", status: "pending" }] }, { json: {} },                    // alice sent
    ]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "completeChallenge", { id: "c1", result: { pct: 90, xp: 120, timeSecs: 60 } });
    expect(r.statusCode).toBe(200);
    const urls = putUrls(fm);
    expect(urls[0]).toContain("/rq-social-v6/bob/challenges.json");
    expect(urls[1]).toContain("/rq-social-v6/alice/sent.json");

    global.fetch = makeFetch([{ json: [] }]); // no matching challenge
    const r2 = await post(await loadHandler(), "completeChallenge", { id: "nope", result: {} });
    expect(r2.statusCode).toBe(404);
  });

  // ── subscribe / unsubscribe ─────────────────────────────────
  it("subscribe 400 on self; otherwise writes both sides", async () => {
    expect((await post(await loadHandler(), "subscribe", { teacher: "bob" })).statusCode).toBe(400);
    const fm = makeFetch([{ json: [] }, { json: {} }, { json: [] }, { json: {} }]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "subscribe", { teacher: "ms_smith" });
    expect(r.statusCode).toBe(200);
    const urls = putUrls(fm);
    expect(urls[0]).toContain("/rq-social-v6/bob/subscribed.json");
    expect(urls[1]).toContain("/rq-social-v6/ms_smith/subscribers.json");
  });

  // ── Firebase gappy-array coercion ───────────────────────────
  it("coerces a gappy {0:..,2:..} array before mutating (submitScore)", async () => {
    const fm = makeFetch([{ json: { 0: { name: "alice", xp: 9 }, 2: { name: "carol", xp: 8 } } }, { json: {} }]);
    global.fetch = fm;
    const r = await post(await loadHandler(), "submitScore", { level: "A1", xp: 5, pct: 80 });
    expect(r.statusCode).toBe(200);
    const board = JSON.parse(r.body).board;
    expect(Array.isArray(board)).toBe(true);
    expect(board.find((e) => e.name === "alice")).toBeDefined();
  });

  // ── saveVocab (per-user child) ──────────────────────────────
  describe("saveVocab", () => {
    it("400 when vocab is not an array", async () => {
      expect((await post(await loadHandler(), "saveVocab", { vocab: "nope" })).statusCode).toBe(400);
    });
    it("writes ONLY the actor's own child, normalizes entry shape", async () => {
      const fm = makeFetch([{ json: null }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "saveVocab", { vocab: [{ word: "cat", def: "a pet" }] });
      expect(r.statusCode).toBe(200);
      expect(putUrls(fm)[0]).toContain("/rq-vocab-v1/bob.json"); // child = token user, not the body
      const body = putBodies(fm)[0];
      expect(body[0].word).toBe("cat");
      expect(body[0].status).toBe("new");      // defaulted
      expect(body[0].nextReview).toBe(null);   // non-string → null
    });
    it("drops wordless entries and clamps overlong fields", async () => {
      const fm = makeFetch([{ json: null }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "saveVocab", { vocab: [{ word: "" }, { def: "x" }, { word: "a".repeat(200) }] });
      const body = putBodies(fm)[0];
      expect(body).toHaveLength(1);
      expect(body[0].word.length).toBe(80);
    });
    it("caps at VOCAB_MAX (500) entries", async () => {
      const big = Array.from({ length: 600 }, (_, i) => ({ word: "w" + i }));
      const fm = makeFetch([{ json: null }, { json: {} }]);
      global.fetch = fm;
      await post(await loadHandler(), "saveVocab", { vocab: big });
      expect(putBodies(fm)[0]).toHaveLength(500);
    });
  });

  // ── saveFavs (per-user child) ───────────────────────────────
  describe("saveFavs", () => {
    it("400 when favs is not an array", async () => {
      expect((await post(await loadHandler(), "saveFavs", { favs: { id: "x" } })).statusCode).toBe(400);
    });
    it("writes the actor's own child preserving {id,title,level,date}", async () => {
      const fm = makeFetch([{ json: null }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "saveFavs", { favs: [{ id: "s1", title: "Story", level: "B1", date: "2026-06-17" }] });
      expect(r.statusCode).toBe(200);
      expect(putUrls(fm)[0]).toContain("/rq-favs-v1/bob.json");
      expect(putBodies(fm)[0][0]).toMatchObject({ id: "s1", title: "Story", level: "B1", date: "2026-06-17" });
    });
    it("drops entries without an id and caps at FAVS_MAX (500)", async () => {
      const big = Array.from({ length: 600 }, (_, i) => ({ id: "s" + i }));
      const fm = makeFetch([{ json: null }, { json: {} }]);
      global.fetch = fm;
      await post(await loadHandler(), "saveFavs", { favs: [{ title: "no id" }].concat(big) });
      expect(putBodies(fm)[0]).toHaveLength(500);
    });
  });

  // ── submitDailyScore (daily leaderboard) ────────────────────
  describe("submitDailyScore", () => {
    it("writes today's child, forces name from token, preserves others", async () => {
      const fm = makeFetch([{ json: [{ name: "alice", xp: 50 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitDailyScore", { name: "impostor", xp: 80, pct: 90, timeSecs: 30 });
      expect(r.statusCode).toBe(200);
      expect(putUrls(fm)[0]).toMatch(/\/rq-daily-lb-v1\/\d{4}-\d{2}-\d{2}\.json/);
      const board = JSON.parse(r.body).board;
      expect(board.some((e) => e.name === "impostor")).toBe(false);
      expect(board.find((e) => e.name === "bob")).toBeDefined();
      expect(board.find((e) => e.name === "alice")).toBeDefined();
    });
    it("clamps forged xp to MAX_GAME_XP, replaces the actor's prior entry, sorts desc", async () => {
      const fm = makeFetch([{ json: [{ name: "bob", xp: 10 }, { name: "carol", xp: 5000 }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "submitDailyScore", { xp: 9999999, pct: 100 });
      const board = JSON.parse(r.body).board;
      expect(board.filter((e) => e.name === "bob")).toHaveLength(1);
      expect(board.find((e) => e.name === "bob").xp).toBe(60000);
      expect(board[0].name).toBe("bob"); // 60000 > 5000
    });
  });

  // ── postDiscuss (story thread) ──────────────────────────────
  describe("postDiscuss", () => {
    it("400 on a missing storyId", async () => {
      expect((await post(await loadHandler(), "postDiscuss", { text: "hello there" })).statusCode).toBe(400);
    });
    it("400 on text shorter than 3 chars (no fetch)", async () => {
      const fm = makeFetch([]);
      global.fetch = fm;
      expect((await post(await loadHandler(), "postDiscuss", { storyId: "s1", text: "hi" })).statusCode).toBe(400);
      expect(putUrls(fm)).toHaveLength(0);
    });
    it("authors the post as the token user and prepends newest", async () => {
      const fm = makeFetch([{ json: [{ user: "alice", text: "old", date: "2020-01-01" }] }, { json: {} }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "postDiscuss", { storyId: "s1", text: "great story", user: "impostor" });
      expect(r.statusCode).toBe(200);
      expect(putUrls(fm)[0]).toContain("/rq-discuss-v1/s1.json");
      const arr = putBodies(fm)[0];
      expect(arr[0].user).toBe("bob");          // forced, not "impostor"
      expect(arr[0].text).toBe("great story");
      expect(arr[1].user).toBe("alice");        // existing post kept after
    });
    it("rejects a second post the same day with no write", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const fm = makeFetch([{ json: [{ user: "bob", text: "already", date: today }] }]);
      global.fetch = fm;
      const r = await post(await loadHandler(), "postDiscuss", { storyId: "s1", text: "again today" });
      expect(JSON.parse(r.body).ok).toBe(false);
      expect(putUrls(fm)).toHaveLength(0);
    });
  });
});
