import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let mockCreate;

vi.mock("@anthropic-ai/sdk", () => {
  mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: "text", text: "Generated content" }],
  });
  return {
    default: class {
      constructor() {
        this.messages = { create: mockCreate };
      }
    },
  };
});

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
    mockCreate.mockClear();
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

  it("returns 200 with the Claude response on success", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Hello from Claude" }],
    });
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.content).toBeDefined();
    expect(body.content[0].text).toBe("Hello from Claude");
  });

  it("returns 500 when the Claude API throws", async () => {
    mockCreate.mockRejectedValue(new Error("rate limited"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/rate limited/);
  });

  it("passes max_tokens from body to Claude", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Response" }],
    });
    const res = await handler(
      makeEvent({
        body: JSON.stringify({
          max_tokens: 4000,
          messages: [{ role: "user", content: "hi" }],
        }),
      })
    );
    expect(res.statusCode).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 4000 })
    );
  });
});
