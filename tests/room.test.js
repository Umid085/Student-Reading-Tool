import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let mockCreate;

vi.mock("@anthropic-ai/sdk", () => {
  mockCreate = vi.fn();
  return {
    default: class { constructor() { this.messages = { create: mockCreate }; } },
  };
});

const { handler } = await import("../netlify/functions/room.js");

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

const goodCard = JSON.stringify({
  passage: "A short passage. It has a payoff at the end. Surprise!",
  question: { type: "mcq", q: "Q?", options: ["a", "b", "c", "d"], answer: 1, explanation: "..." },
});

describe("netlify/functions/room.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ANTHROPIC_API_KEY: "test-key",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    realFetch = global.fetch;
    mockCreate.mockReset();
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("405 for PUT", async () => {
    const r = await handler({ httpMethod: "PUT" });
    expect(r.statusCode).toBe(405);
  });

  it("create → 200 with room", async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: goodCard }] });
    global.fetch = makeFetch([{ ok: true, json: null }, { ok: true, json: {} }]);
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "create", level: "B1", ownerName: "alice" }) });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).room.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("create → 400 on malformed JSON body", async () => {
    const r = await handler({ httpMethod: "POST", body: "{not-json" });
    expect(r.statusCode).toBe(400);
  });

  it("join → 410 when room missing", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "join", code: "ABC123", name: "bob" }) });
    expect(r.statusCode).toBe(410);
  });

  it("answer → records correct/wrong", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "x", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 2 }, participants: { bob: { joined: 1 } } } },
      { ok: true, json: {} },
    ]);
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "answer", code: "ROOM01", name: "bob", optionIdx: 2 }) });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).room.participants.bob.correct).toBe(true);
  });

  it("GET state → 200 with room", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { code: "ROOM01", expiresAt: Date.now() + 60_000, passage: "x", question: { type: "mcq", q: "?", options: ["a", "b", "c", "d"], answer: 0 } } },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { code: "ROOM01" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).room.code).toBe("ROOM01");
  });
});
