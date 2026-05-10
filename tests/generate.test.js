import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let mockGenerateContent;

vi.mock("@google/generative-ai", () => {
  mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => "Generated content"
    }
  });

  return {
    GoogleGenerativeAI: class {
      constructor(apiKey) {
        this.apiKey = apiKey;
      }
      getGenerativeModel(config) {
        return {
          generateContent: mockGenerateContent
        };
      }
    }
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
    process.env = { ...OLD_ENV, GOOGLE_API_KEY: "test-key" };
    mockGenerateContent.mockClear();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("returns 405 for non-POST requests", async () => {
    const res = await handler(makeEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when GOOGLE_API_KEY is missing", async () => {
    delete process.env.GOOGLE_API_KEY;
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/GOOGLE_API_KEY/);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await handler(makeEvent({ body: "not-json" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON/);
  });

  it("returns 200 with the Gemini response on success", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Hello from Gemini"
      }
    });
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.content).toBeDefined();
    expect(body.content[0].text).toBe("Hello from Gemini");
  });

  it("returns 500 when the Gemini API throws on all models", async () => {
    mockGenerateContent.mockRejectedValue(new Error("rate limited"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/rate limited/);
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue({ response: { text: () => "Generated content" } });
  });

  it("passes custom model and max_tokens from body", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Response"
      }
    });
    const res = await handler(
      makeEvent({
        body: JSON.stringify({
          model: "gemini-1.5-pro",
          max_tokens: 4000,
          messages: [{ role: "user", content: "hi" }],
        }),
      })
    );
    expect(res.statusCode).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: expect.objectContaining({ maxOutputTokens: 4000 })
      })
    );
  });
});
