import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let mockCreate;

vi.mock("@anthropic-ai/sdk", () => {
  mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: "text", text: "{}" }],
  });
  return {
    default: class {
      constructor() {
        this.messages = { create: mockCreate };
      }
    },
  };
});

const { handler } = await import("../netlify/functions/vocab-lookup.js");

function makeEvent(overrides = {}) {
  return {
    httpMethod: "POST",
    body: JSON.stringify({ word: "hello", lang: "ru", level: "A1" }),
    ...overrides,
  };
}

function makeFetchSequencer(responses) {
  let i = 0;
  return vi.fn(async (url) => {
    const r = responses[i++];
    if (!r) throw new Error(`fetch called more times than expected (i=${i}, url=${url})`);
    return {
      ok: r.ok !== false,
      status: r.status || 200,
      json: async () => r.json,
      text: async () => r.text || "",
    };
  });
}

describe("netlify/functions/vocab-lookup.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ANTHROPIC_API_KEY: "test-key",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    mockCreate.mockClear();
    realFetch = global.fetch;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global.fetch = realFetch;
  });

  it("returns 204 on OPTIONS", async () => {
    const res = await handler({ httpMethod: "OPTIONS" });
    expect(res.statusCode).toBe(204);
  });

  it("returns 405 for non-POST", async () => {
    const res = await handler(makeEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("returns 503 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(503);
  });

  it("returns 400 on bogus JSON body", async () => {
    const res = await handler(makeEvent({ body: "{not-json" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when word is missing", async () => {
    const res = await handler(makeEvent({ body: JSON.stringify({}) }));
    expect(res.statusCode).toBe(400);
  });

  it("returns cached entry without calling Claude when Firebase hits", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: { translation: "привет", mode: "translate", lang: "ru" } },
    ]);
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.translation).toBe("привет");
    expect(body.source).toBe("cache");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("A1 + supported lang → translate via Claude, then cache", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null }, // cache miss
      { ok: true, json: {} },   // cache put
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"translation":"мир"}' }] });
    const res = await handler(makeEvent({ body: JSON.stringify({ word: "world", lang: "ru", level: "A1" }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.translation).toBe("мир");
    expect(body.mode).toBe("translate");
    expect(body.source).toBe("claude");
  });

  it("B1+ → enriched mode (dict + Claude example)", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null },
      { ok: true, json: [{ phonetic: "/x/", meanings: [{ definitions: [{ definition: "thing" }] }] }] },
      { ok: true, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"example":"The mystery sat heavily on the lab bench."}' }] });
    const res = await handler(makeEvent({ body: JSON.stringify({ word: "mystery", lang: "ru", level: "C1" }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.mode).toBe("enriched");
    expect(body.def).toBe("thing");
    expect(body.example).toMatch(/lab bench/);
  });

  it("returns 404 when both dict and Claude example fail", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null },
      { ok: false, status: 404, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: "garbage no json" }] });
    const res = await handler(makeEvent({ body: JSON.stringify({ word: "xyzqq", lang: "en", level: "B2" }) }));
    expect(res.statusCode).toBe(404);
  });

  it("normalizes word (lowercase, strips non-alpha)", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: { translation: "test", mode: "translate", lang: "ru" } },
    ]);
    await handler(makeEvent({ body: JSON.stringify({ word: "  HELLO!! ", lang: "ru", level: "A1" }) }));
    const urlArg = global.fetch.mock.calls[0][0];
    expect(urlArg).toMatch(/t-ru-hello/);
  });
});
