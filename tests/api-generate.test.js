import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runHandler } from "./_vercelMock.js";

// __mockAnthropicCreate is set up in tests/setup.js
const mockCreate = globalThis.__mockAnthropicCreate;

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/generate.js");
  return mod.default;
}

describe("api/generate.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, ANTHROPIC_API_KEY: "test-key", RATE_LIMIT_DISABLED: "1" };
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "Hello" }] });
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 405 for non-POST requests", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    expect(r.statusCode).toBe(500);
    expect(JSON.parse(r.body).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  // B01: null-guard req.body — must not throw TypeError on body.messages access
  it("does not crash when req.body is undefined", async () => {
    const handler = await loadHandler();
    // body undefined falls through to Mode 2 with defaults; the actual Claude call
    // is mocked. The critical assertion: no unhandled TypeError on body.messages.
    let threw = false;
    try {
      await runHandler(handler, { method: "POST" });
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  it("returns 400 when messages is an empty array", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { messages: [] } });
    // Empty messages array → Mode 1 path → no userMessage → 400
    expect(r.statusCode).toBe(400);
  });

  it("Mode 1: returns 200 with the Claude response on success", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "Hello from Claude" }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.content[0].text).toBe("Hello from Claude");
  });

  it("Mode 1: returns 500 when the Claude API throws", async () => {
    mockCreate.mockRejectedValue(new Error("rate limited"));
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    expect(r.statusCode).toBe(500);
    expect(JSON.parse(r.body).error).toMatch(/rate limited/);
  });

  // B06: empty content array returns 502 not 500
  it("Mode 1: returns 502 when Claude returns an empty content array", async () => {
    mockCreate.mockResolvedValue({ content: [] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } });
    expect(r.statusCode).toBe(502);
    expect(JSON.parse(r.body).error).toMatch(/Empty model response/);
  });

  // B02: max_tokens clamp to 2048
  it("Mode 1: clamps max_tokens at 2048 even when caller asks for more", async () => {
    const handler = await loadHandler();
    await runHandler(handler, {
      method: "POST",
      body: { max_tokens: 100000, messages: [{ role: "user", content: "hi" }] },
    });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 2048 }));
  });

  it("Mode 1: passes a requested max_tokens below the cap unchanged", async () => {
    const handler = await loadHandler();
    await runHandler(handler, {
      method: "POST",
      body: { max_tokens: 1024, messages: [{ role: "user", content: "hi" }] },
    });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 1024 }));
  });

  // B02: user message length cap
  it("Mode 1: truncates userMessage longer than 4000 chars", async () => {
    const handler = await loadHandler();
    const longMsg = "x".repeat(5000);
    await runHandler(handler, {
      method: "POST",
      body: { messages: [{ role: "user", content: longMsg }] },
    });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content.length).toBe(4000);
  });

  // B12: rate limit returns 429
  it("returns 429 when rate-limit bucket is exceeded", async () => {
    delete process.env.RATE_LIMIT_DISABLED;
    process.env.FIREBASE_DB_URL = "https://fake.firebaseio.com";
    const realFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({ json: async () => ({ count: 60, resetAt: Date.now() + 60000 }) });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: { messages: [{ role: "user", content: "hi" }] },
    });
    global.fetch = realFetch;
    expect(r.statusCode).toBe(429);
    expect(JSON.parse(r.body).error).toMatch(/Too many/i);
  });

  // Mode 2: AI assignment generation
  it("Mode 2: returns 400 when no valid types are provided", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "cats", types: ["bogus"], language: "English" },
    });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.body).error).toMatch(/No valid question types/);
  });

  it("Mode 2: returns 200 with parsed passage and questions", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ passage: "About cats.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "cats", types: ["mcq"], language: "English" },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.passage).toBe("About cats.");
    expect(body.questions[0].type).toBe("mcq");
  });

  // B06: Mode 2 empty content array
  it("Mode 2: returns 502 when Claude returns an empty content array", async () => {
    mockCreate.mockResolvedValue({ content: [] });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "cats", types: ["mcq"], language: "English" },
    });
    expect(r.statusCode).toBe(502);
  });
});
