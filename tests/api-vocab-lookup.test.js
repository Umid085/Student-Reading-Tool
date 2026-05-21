import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runHandler } from "./_vercelMock.js";

const mockCreate = globalThis.__mockAnthropicCreate;

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/vocab-lookup.js");
  return mod.default;
}

// Build a fake fetch that responds to the URLs we care about.
function makeFetchSequencer(responses) {
  let i = 0;
  return vi.fn(async (url) => {
    const r = responses[i++];
    if (!r) throw new Error(`fetch called more times than expected (i=${i}, url=${url})`);
    if (r._throw) throw r._throw;
    return {
      ok: r.ok !== false,
      status: r.status || 200,
      json: async () => r.json,
      text: async () => r.text || "",
    };
  });
}

describe("api/vocab-lookup.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ANTHROPIC_API_KEY: "test-key",
      RATE_LIMIT_DISABLED: "1",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    mockCreate.mockClear();
    realFetch = global.fetch;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global.fetch = realFetch;
  });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 405 for non-POST", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 503 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "hello" } });
    expect(r.statusCode).toBe(503);
  });

  it("rejects empty / non-string word with 400", async () => {
    const handler = await loadHandler();
    const r1 = await runHandler(handler, { method: "POST", body: {} });
    expect(r1.statusCode).toBe(400);
    const r2 = await runHandler(handler, { method: "POST", body: { word: "12345" } });
    // 12345 normalizes to "" because all chars stripped — 400
    expect(r2.statusCode).toBe(400);
  });

  it("returns cached entry without calling Claude when Firebase hit", async () => {
    global.fetch = makeFetchSequencer([
      // cacheGet: Firebase hit
      { ok: true, json: { translation: "привет", mode: "translate", lang: "ru", ts: 1 } },
    ]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "hello", lang: "ru", level: "A1" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.translation).toBe("привет");
    expect(body.source).toBe("cache");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("A1 + supported lang triggers translate mode and caches result", async () => {
    global.fetch = makeFetchSequencer([
      // cacheGet: miss
      { ok: true, json: null },
      // cachePut
      { ok: true, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"translation":"мир"}' }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "world", lang: "ru", level: "A1" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.translation).toBe("мир");
    expect(body.mode).toBe("translate");
    expect(body.source).toBe("claude");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("A2 + unsupported lang falls through to enriched mode (dict + example)", async () => {
    global.fetch = makeFetchSequencer([
      // cacheGet: miss
      { ok: true, json: null },
      // dictionaryapi.dev — found
      { ok: true, json: [{ phonetic: "/həˈləʊ/", phonetics: [{ audio: "" }], meanings: [{ definitions: [{ definition: "a greeting" }] }] }] },
      // cachePut
      { ok: true, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"example":"She waved a quick hello before running off."}' }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "hello", lang: "en", level: "A2" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.mode).toBe("enriched");
    expect(body.def).toBe("a greeting");
    expect(body.example).toMatch(/waved a quick hello/);
  });

  it("B1+ uses enriched mode even when lang is supported (dict + Claude example)", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null },
      { ok: true, json: [{ phonetic: "/serendipity/", meanings: [{ definitions: [{ definition: "lucky discovery" }] }] }] },
      { ok: true, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"example":"Finding that old coin in the drawer was pure serendipity."}' }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "serendipity", lang: "ru", level: "B2" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.mode).toBe("enriched");
    expect(body.example).toMatch(/serendipity/);
  });

  it("B1+ falls back to Claude-only when dictionary misses", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null },
      // dictionary 404
      { ok: false, status: 404, json: {} },
      { ok: true, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: '{"example":"He coined the neologism in last week\'s blog post."}' }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "neologism", lang: "en", level: "C1" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.mode).toBe("enriched");
    expect(body.def).toBe("");
    expect(body.example).toMatch(/neologism/);
    expect(body.source).toBe("claude");
  });

  it("returns 404 when both dict and Claude fail", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: null },
      { ok: false, status: 404, json: {} },
    ]);
    mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: "not valid json" }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "xyzqq", lang: "en", level: "C1" } });
    expect(r.statusCode).toBe(404);
  });

  it("normalizes word (lowercase, strips punctuation)", async () => {
    global.fetch = makeFetchSequencer([
      { ok: true, json: { translation: "T-привет", mode: "translate", lang: "ru" } },
    ]);
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { word: "  HeLLO!!  ", lang: "ru", level: "A1" } });
    expect(r.statusCode).toBe(200);
    // Verify cache key uses the normalized form ("hello") by checking fetch was called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const urlArg = global.fetch.mock.calls[0][0];
    expect(urlArg).toMatch(/t-ru-hello/);
  });
});
