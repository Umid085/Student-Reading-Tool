import { describe, it, expect, beforeEach, afterEach } from "vitest";

// mockCreate is the vi.fn() injected by tests/setup.js
const mockCreate = globalThis.__mockAnthropicCreate;

const { handler } = await import("../netlify/functions/generate.js");

function makeEvent(overrides = {}) {
  return {
    httpMethod: "POST",
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    ...overrides,
  };
}

describe("generate.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, ANTHROPIC_API_KEY: "test-key" };
    mockCreate.mockReset();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("returns 405 for non-POST requests", async () => {
    const res = await handler(makeEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await handler(makeEvent({ body: "not-json" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON/);
  });

  it("returns 200 with the Anthropic response on success", async () => {
    const fakeMessage = { id: "msg_1", content: [{ text: "Hello" }] };
    mockCreate.mockResolvedValue(fakeMessage);
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(fakeMessage);
  });

  it("returns 500 when the Anthropic SDK throws", async () => {
    mockCreate.mockRejectedValue(new Error("rate limited"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("rate limited");
  });

  it("passes custom model and max_tokens from body", async () => {
    mockCreate.mockResolvedValue({ id: "msg_2" });
    await handler(
      makeEvent({
        body: JSON.stringify({
          model: "claude-opus-4-7",
          max_tokens: 4000,
          messages: [{ role: "user", content: "hi" }],
        }),
      })
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-7", max_tokens: 4000 })
    );
  });
});
