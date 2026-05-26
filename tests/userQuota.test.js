import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let realFetch;
let getUserQuota, consumeUserQuota;

beforeEach(async () => {
  // Reload module fresh each test so any per-module state is clean.
  vi.resetModules();
  const mod = await import("../api/_userQuota.js");
  getUserQuota = mod.getUserQuota;
  consumeUserQuota = mod.consumeUserQuota;
  realFetch = global.fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  delete process.env.RATE_LIMIT_DISABLED;
  delete process.env.FIREBASE_DB_SECRET;
});

function makeFetch(responses) {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[i++] || { ok: true, json: null };
    return {
      ok: r.ok !== false,
      status: r.status || (r.ok === false ? 500 : 200),
      // consumeUserQuota reads the ETag header for its compare-and-swap.
      headers: { get: (h) => (String(h).toLowerCase() === "etag" ? (r.etag || "etag0") : null) },
      json: async () => r.json,
      text: async () => "",
    };
  });
}

describe("_userQuota.js — getUserQuota", () => {
  it("returns zero usage when RATE_LIMIT_DISABLED", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const q = await getUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.used).toBe(0);
    expect(q.max).toBe(10);
    expect(q.resetAt).toBeGreaterThan(Date.now());
  });

  it("returns zero + anonymous=true when username is missing", async () => {
    const q = await getUserQuota("https://x.fb", "", "ai", { max: 10 });
    expect(q.used).toBe(0);
    expect(q.anonymous).toBe(true);
  });

  it("returns the current Firebase counter when one exists", async () => {
    global.fetch = makeFetch([{ ok: true, json: { n: 4, ts: Date.now() } }]);
    const q = await getUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.used).toBe(4);
    expect(q.max).toBe(10);
  });

  it("returns 0 when Firebase has no record for today yet", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const q = await getUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.used).toBe(0);
  });

  it("flags failedRead when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("network"));
    const q = await getUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.failedRead).toBe(true);
    expect(q.used).toBe(0);
  });
});

describe("_userQuota.js — consumeUserQuota", () => {
  it("returns exceeded=false + anonymous=true for unauthenticated callers", async () => {
    const q = await consumeUserQuota("https://x.fb", null, "ai", { max: 10 });
    expect(q.exceeded).toBe(false);
    expect(q.anonymous).toBe(true);
  });

  it("RATE_LIMIT_DISABLED bypasses the check", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const q = await consumeUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.exceeded).toBe(false);
  });

  it("allows the call when under the cap and writes the incremented count via CAS", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { n: 4 }, etag: "e1" }, // read (value + ETag)
      { ok: true, json: {} },                    // conditional write
    ]);
    const q = await consumeUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.exceeded).toBe(false);
    expect(q.used).toBe(5);
    // Two fetch calls: ETag read + conditional (if-match) write
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const putCall = global.fetch.mock.calls[1];
    expect(putCall[1].method).toBe("PUT");
    expect(putCall[1].headers["if-match"]).toBe("e1");
    expect(JSON.parse(putCall[1].body).n).toBe(5);
  });

  it("retries on a 412 (concurrent write) then succeeds", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { n: 4 }, etag: "e1" }, // read 1
      { ok: false, status: 412 },               // write 1 — ETag moved under us
      { ok: true, json: { n: 5 }, etag: "e2" }, // re-read
      { ok: true, json: {} },                    // write 2 — success
    ]);
    const q = await consumeUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.exceeded).toBe(false);
    expect(q.used).toBe(6);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("refuses the call when used >= max and does NOT write", async () => {
    global.fetch = makeFetch([{ ok: true, json: { n: 10 }, etag: "e1" }]);
    const q = await consumeUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.exceeded).toBe(true);
    expect(q.used).toBe(10);
    // Only the read call — the cap check returns before any write
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("fails open when Firebase read throws", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("offline"));
    const q = await consumeUserQuota("https://x.fb", "alice", "ai", { max: 10 });
    expect(q.exceeded).toBe(false);
    expect(q.failedRead).toBe(true);
  });

  it("uses default max=10 when caller omits opts.max", async () => {
    global.fetch = makeFetch([{ ok: true, json: { n: 10 } }]);
    const q = await consumeUserQuota("https://x.fb", "alice", "ai");
    expect(q.exceeded).toBe(true);
    expect(q.max).toBe(10);
  });

  it("sanitizes username + endpoint in the URL path", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }, { ok: true, json: {} }]);
    await consumeUserQuota("https://x.fb", "alice/../etc", "ai mode:bad!", { max: 10 });
    const url = global.fetch.mock.calls[0][0];
    // Sanitized: every non-[a-zA-Z0-9_-] is replaced with "_"
    expect(url).toMatch(/alice____etc/);
    expect(url).toMatch(/ai_mode_bad_/);
    // No path-traversal segments in our user/endpoint subpath
    expect(url).not.toMatch(/\/\.\.\//);
  });
});
