import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runHandler } from "./_vercelMock.js";

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/teacher-search.js");
  return mod.default;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

describe("api/teacher-search.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
      RATE_LIMIT_DISABLED: "1",
    };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 405 for POST", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 503 when FIREBASE_DB_URL is missing", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { q: "alice" } });
    expect(r.statusCode).toBe(503);
  });

  it("empty pool → empty result set", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { q: "anything" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.total).toBe(0);
    expect(body.results).toEqual([]);
  });

  it("filters out private entries (public=false)", async () => {
    global.fetch = makeFetch([{
      ok: true,
      json: {
        alice: { displayName: "Alice", bio: "TOEFL coach", public: true },
        bob:   { displayName: "Bob",   bio: "TOEFL coach", public: false },
      },
    }]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { q: "TOEFL" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.total).toBe(1);
    expect(body.results[0].name).toBe("alice");
  });

  it("substring-matches against name, bio, subjects, and languages", async () => {
    global.fetch = makeFetch([{
      ok: true,
      json: {
        alice:   { displayName: "Ms. Alice", bio: "Pure conversation",  subjects: ["IELTS"], languages: ["en"], public: true },
        bob:     { displayName: "Bob",       bio: "Loves grammar",       subjects: ["TOEFL"], languages: ["ru"], public: true },
        carol:   { displayName: "Carol",     bio: "Cambridge-certified", subjects: ["IELTS", "Business"], languages: ["en"], public: true },
      },
    }]);
    const handler = await loadHandler();
    // q matches Alice's subject + Carol's subject
    const r = await runHandler(handler, { method: "GET", query: { q: "IELTS" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    const names = body.results.map((x) => x.name).sort();
    expect(names).toEqual(["alice", "carol"]);
  });

  it("empty query returns all consented teachers", async () => {
    global.fetch = makeFetch([{
      ok: true,
      json: {
        alice: { displayName: "Alice", bio: "", subjects: [], languages: [], public: true },
        bob:   { displayName: "Bob",   bio: "", subjects: [], languages: [], public: false },
      },
    }]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { q: "" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.total).toBe(1);
    expect(body.results[0].name).toBe("alice");
  });

  it("snippets bios and caps at 20 results", async () => {
    const big = {};
    for (let i = 0; i < 25; i++) {
      big["teach" + i] = {
        displayName: "Teach " + i,
        bio: "a".repeat(300),
        public: true,
        updated: "2026-05-" + String(20 + (i % 10)).padStart(2, "0") + "T00:00:00Z",
      };
    }
    global.fetch = makeFetch([{ ok: true, json: big }]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { q: "" } });
    const body = JSON.parse(r.body);
    expect(body.total).toBe(25);
    expect(body.results).toHaveLength(20);
    expect(body.results[0].bio.length).toBeLessThanOrEqual(140);
  });
});
