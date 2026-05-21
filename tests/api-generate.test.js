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

  // Topic-drift detection: English passage without the topic word → 422
  it("Mode 2: returns 422 when English passage does not mention the topic", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ passage: "Tom and his family went to the park.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "Mars", types: ["mcq"], language: "English" },
    });
    expect(r.statusCode).toBe(422);
    expect(JSON.parse(r.body).error).toMatch(/drifted off-topic/);
  });

  // Non-English: trust client-provided topic_in_language, accept passage containing it
  it("Mode 2: accepts non-English passage containing the client-translated topic", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ passage: "Марс — четвёртая планета. На Марс летают зонды.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "Mars", types: ["mcq"], language: "Russian", topic_in_language: "Марс" },
    });
    expect(r.statusCode).toBe(200);
  });

  // Abbreviation case: short topic forms must pass via full-substring match,
  // even when no ≥3-char word from the typed topic appears in the passage.
  it("Mode 2: accepts passage using abbreviation when Claude reports it via topic_echo", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ topic_echo: "F1", passage: "F1 is a motor sport. F1 started in 1950.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "Formula 1", types: ["mcq"], language: "English" },
    });
    expect(r.statusCode).toBe(200);
  });

  // Non-English: client translation overrides Claude's lying topic_echo
  it("Mode 2: rejects non-English drift even if Claude's topic_echo matches the passage", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ topic_echo: "Дом", passage: "Дом был старым. Семья жила в доме.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "B1", topic: "Mars", types: ["mcq"], language: "Russian", topic_in_language: "Марс" },
    });
    expect(r.statusCode).toBe(422);
  });

  // Per-user daily quota integration. Authenticated user with used >= max
  // must get 429 — proves the consumeUserQuota wiring in generate.js works.
  it("Mode 2: returns 429 when the authed user's daily 'ai' quota is exceeded", async () => {
    const { createHmac } = await import("crypto");
    // Drop RATE_LIMIT_DISABLED so _userQuota actually runs.
    delete process.env.RATE_LIMIT_DISABLED;
    process.env.SESSION_SECRET = "test-secret";
    process.env.FIREBASE_DB_URL = "https://test-db.firebaseio.com";
    const expires = Date.now() + 60_000;
    const payload = `alice:${expires}`;
    const sig = createHmac("sha256", "test-secret").update(payload).digest("hex");
    const realFetch = global.fetch;
    // _rateLimit short-circuits without a fetch when ip is empty (no
    // x-forwarded-for header in the test). The only fetch is the quota
    // GET, which we mock to return n=10 — the A1-B1 cap is 10 → blocked.
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ n: 10, ts: Date.now() }) });
    try {
      const handler = await loadHandler();
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: `Bearer ${payload}:${sig}` },
        body: { level: "B1", topic: "Mars", types: ["mcq"], language: "English" },
      });
      expect(r.statusCode).toBe(429);
      expect(JSON.parse(r.body).error).toMatch(/Daily quest limit/);
      // Claude must NOT have been called when quota is exceeded.
      expect(mockCreate).not.toHaveBeenCalled();
    } finally {
      global.fetch = realFetch;
      delete process.env.SESSION_SECRET;
    }
  });

  // Mode 3: slider micro-card path. The structured response must be a
  // single passage + single MCQ; anything else is a 502.
  it("Mode 3: returns {passage, question} for a valid micro request", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({
        passage: "The octopus has three hearts and blue blood. When it swims, two of the hearts stop beating, which is why octopuses prefer to crawl.",
        question: { type: "mcq", q: "Why do octopuses prefer crawling to swimming?", options: ["They have no fins", "Swimming stops two of their hearts", "Their blue blood is cold", "They cannot see underwater"], answer: 1, explanation: "Two hearts stop when swimming." },
      }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { mode: "micro", level: "B1" },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.passage).toMatch(/octopus/);
    expect(body.question.type).toBe("mcq");
    expect(body.question.options).toHaveLength(4);
    expect(body.question.answer).toBe(1);
  });

  it("Mode 3: returns 502 when Claude returns invalid micro shape", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ passage: "ok", question: { type: "mcq", q: "?" } }) }], // missing options/answer
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { mode: "micro", level: "A1" },
    });
    expect(r.statusCode).toBe(502);
  });

  it("Mode 3: respects slider quota (429 when authed user is at cap)", async () => {
    const { createHmac } = await import("crypto");
    delete process.env.RATE_LIMIT_DISABLED;
    process.env.SESSION_SECRET = "test-secret";
    process.env.FIREBASE_DB_URL = "https://test-db.firebaseio.com";
    const expires = Date.now() + 60_000;
    const payload = `bob:${expires}`;
    const sig = createHmac("sha256", "test-secret").update(payload).digest("hex");
    const realFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ n: 30 }), // SLIDER_QUOTA cap
    });
    try {
      const handler = await loadHandler();
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: `Bearer ${payload}:${sig}` },
        body: { mode: "micro", level: "B1" },
      });
      expect(r.statusCode).toBe(429);
      expect(JSON.parse(r.body).error).toMatch(/Daily slider limit/);
      expect(mockCreate).not.toHaveBeenCalled();
    } finally {
      global.fetch = realFetch;
      delete process.env.SESSION_SECRET;
    }
  });

  // Anonymous (no Bearer) callers must NOT be blocked by the user quota —
  // they're throttled only by the IP rate-limit. Demo users still work.
  it("Mode 2: anonymous callers bypass user quota (still subject to IP rate limit)", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ topic_echo: "cats", passage: "Cats are small animals. Cats have four legs. Cats are pets.", questions: [{ type: "mcq", q: "?" }] }) }],
    });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { level: "A1", topic: "cats", types: ["mcq"], language: "English" },
    });
    expect(r.statusCode).toBe(200);
  });
});
