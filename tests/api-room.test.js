import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runHandler } from "./_vercelMock.js";

const mockCreate = globalThis.__mockAnthropicCreate;

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/room.js");
  return mod.default;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json, text: async () => "" };
  });
}

const goodCard = JSON.stringify({
  passage: "The mantis shrimp punches with the speed of a bullet. Its strike heats the surrounding water briefly to 4,400 K — hotter than the sun's surface. The flash lasts a microsecond, then the prey is gone.",
  question: { type: "mcq", q: "What hot phenomenon does the mantis shrimp's strike create?", options: ["A small explosion of light", "A microwave pulse", "A gust of wind", "A magnetic field"], answer: 0, explanation: "The flash is light + heat." },
});

describe("api/room.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ANTHROPIC_API_KEY: "test-key",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
      RATE_LIMIT_DISABLED: "1",
    };
    mockCreate.mockClear();
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 503 without FIREBASE_DB_URL", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { action: "create" } });
    expect(r.statusCode).toBe(503);
  });

  it("returns 400 for unknown action", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { action: "nope" } });
    expect(r.statusCode).toBe(400);
  });

  describe("create", () => {
    it("generates a passage + question and writes the room", async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: goodCard }] });
      global.fetch = makeFetch([
        // collision check → no existing room at the first code
        { ok: true, json: null },
        // PUT new room
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "create", level: "B1", topic: "mantis shrimp", ownerName: "alice" } });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.room.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(body.room.passage).toMatch(/mantis shrimp/);
      expect(body.room.ownerName).toBe("alice");
      expect(body.room.ownerType).toBe("student"); // default
      expect(body.room.participants.alice.role).toBe("owner");
      expect(body.room.expiresAt).toBeGreaterThan(Date.now());
    });

    it("502s when Claude returns a malformed card", async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: "{not valid" }] });
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "create", level: "B1" } });
      expect(r.statusCode).toBe(502);
    });

    it("503s without ANTHROPIC_API_KEY", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "create", level: "B1" } });
      expect(r.statusCode).toBe(503);
    });

    it("ownerType=teacher is preserved when explicitly set", async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: goodCard }] });
      global.fetch = makeFetch([{ ok: true, json: null }, { ok: true, json: {} }]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "create", level: "A2", ownerType: "teacher", ownerName: "ms-smith" } });
      expect(r.statusCode).toBe(200);
      expect(JSON.parse(r.body).room.ownerType).toBe("teacher");
    });
  });

  describe("join", () => {
    it("400s without code", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "join", name: "bob" } });
      expect(r.statusCode).toBe(400);
    });

    it("400s without name (and no auth)", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "join", code: "ABC123" } });
      expect(r.statusCode).toBe(400);
    });

    it("410s on missing room", async () => {
      global.fetch = makeFetch([{ ok: true, json: null }]); // not found
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "join", code: "ABC123", name: "bob" } });
      expect(r.statusCode).toBe(410);
    });

    it("410s on expired room (and drops the stale entry)", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { code: "OLD123", expiresAt: Date.now() - 1000, passage: "stale", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 0 } } },
        // DELETE call (response unused)
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "join", code: "OLD123", name: "bob" } });
      expect(r.statusCode).toBe(410);
    });

    it("adds a new participant and patches the room", async () => {
      global.fetch = makeFetch([
        // GET active room
        { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "hi", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 0 }, participants: { alice: { joined: 1 } } } },
        // PATCH
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "join", code: "ROOM01", name: "bob" } });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.room.participants.bob).toBeDefined();
      expect(body.room.participants.alice).toBeDefined();
    });
  });

  describe("answer", () => {
    it("400s on invalid optionIdx", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "answer", code: "ROOM01", name: "bob", optionIdx: 9 } });
      expect(r.statusCode).toBe(400);
    });

    it("records the answer and marks correct/wrong", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "x", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 2 }, participants: { bob: { joined: 1 } } } },
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "answer", code: "ROOM01", name: "bob", optionIdx: 2, elapsedMs: 4321 } });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.room.participants.bob.answerIdx).toBe(2);
      expect(body.room.participants.bob.correct).toBe(true);
      expect(body.room.participants.bob.elapsedMs).toBe(4321);
    });

    it("409s when the same participant tries to answer twice", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "x", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 0 }, participants: { bob: { joined: 1, answerIdx: 1 } } } },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { action: "answer", code: "ROOM01", name: "bob", optionIdx: 0 } });
      expect(r.statusCode).toBe(409);
    });
  });

  describe("state (GET)", () => {
    it("400 without code", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: {} });
      expect(r.statusCode).toBe(400);
    });

    it("returns the room on hit", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "ok", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 0 } } },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: { code: "room01" } });
      expect(r.statusCode).toBe(200);
      expect(JSON.parse(r.body).room.code).toBe("ROOM01");
    });
  });
});
