import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { handler } = await import("../netlify/functions/teacher-search.js");

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

describe("netlify/functions/teacher-search.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, FIREBASE_DB_URL: "https://test-db.firebaseio.com" };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("405 for POST", async () => {
    const r = await handler({ httpMethod: "POST" });
    expect(r.statusCode).toBe(405);
  });

  it("empty pool → 0 results", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { q: "anything" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).total).toBe(0);
  });

  it("filters private, matches public", async () => {
    global.fetch = makeFetch([{
      ok: true,
      json: {
        alice: { displayName: "Alice", bio: "TOEFL", public: true },
        bob:   { displayName: "Bob",   bio: "TOEFL", public: false },
      },
    }]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { q: "TOEFL" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.total).toBe(1);
    expect(body.results[0].name).toBe("alice");
  });
});
