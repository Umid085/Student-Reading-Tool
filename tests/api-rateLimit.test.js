import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

global.fetch = vi.fn();

async function loadCheckRateLimit() {
  vi.resetModules();
  const mod = await import("../api/_rateLimit.js");
  return mod.checkRateLimit;
}

const DB = "https://fake.firebaseio.com";

describe("api/_rateLimit.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.RATE_LIMIT_DISABLED;
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("skips check when RATE_LIMIT_DISABLED is set", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips check when DB is empty", async () => {
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit("", "1.2.3.4");
    expect(result.limited).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips check when ip is empty", async () => {
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "");
    expect(result.limited).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows request when no prior attempts (null data)", async () => {
    fetch.mockResolvedValueOnce({ json: async () => null }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(false);
  });

  it("blocks request when count reaches default limit (10)", async () => {
    const data = { count: 10, resetAt: Date.now() + 60000 };
    fetch.mockResolvedValueOnce({ json: async () => data });
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  // Extended behavior added in B02/B12
  it("honours a custom max via opts.max", async () => {
    const data = { count: 30, resetAt: Date.now() + 60000 };
    fetch.mockResolvedValueOnce({ json: async () => data });
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4", { max: 60 });
    expect(result.limited).toBe(false);
  });

  it("blocks at the custom max", async () => {
    const data = { count: 60, resetAt: Date.now() + 60000 };
    fetch.mockResolvedValueOnce({ json: async () => data });
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4", { max: 60 });
    expect(result.limited).toBe(true);
  });

  it("uses a bucket-scoped path when opts.bucket is set", async () => {
    fetch.mockResolvedValueOnce({ json: async () => null }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4", { bucket: "ai" });
    expect(fetch.mock.calls[0][0]).toMatch(/\/rl-ai\/[a-f0-9]{12}\.json/);
  });

  it("uses the default /rl/ path when no bucket is set", async () => {
    fetch.mockResolvedValueOnce({ json: async () => null }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4");
    expect(fetch.mock.calls[0][0]).toMatch(/\/rl\/[a-f0-9]{12}\.json/);
  });

  it("sanitises bucket name to alphanumeric/_-", async () => {
    fetch.mockResolvedValueOnce({ json: async () => null }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4", { bucket: "ai/../escape" });
    // Slashes and dots must be stripped — only /rl-aiescape/ should appear.
    expect(fetch.mock.calls[0][0]).toMatch(/\/rl-aiescape\/[a-f0-9]{12}\.json/);
  });

  it("fails open when Firebase throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4", { max: 60, bucket: "ai" });
    expect(result.limited).toBe(false);
  });

  it("ai bucket and default bucket are independent", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4");                       // default
    await checkRateLimit(DB, "1.2.3.4", { bucket: "ai" });    // ai bucket
    // calls 0 + 2 are GET requests; their paths must differ
    expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[2][0]);
  });
});
