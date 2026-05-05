import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

global.fetch = vi.fn();

async function loadCheckRateLimit() {
  vi.resetModules();
  const mod = await import("../netlify/functions/_rateLimit.js");
  return mod.checkRateLimit;
}

const DB = "https://fake.firebaseio.com";

describe("_rateLimit.js", () => {
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

  it("allows request when count is below limit", async () => {
    const data = { count: 5, resetAt: Date.now() + 60000 };
    fetch.mockResolvedValueOnce({ json: async () => data }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(false);
  });

  it("blocks request when count reaches limit", async () => {
    const data = { count: 10, resetAt: Date.now() + 60000 };
    fetch.mockResolvedValueOnce({ json: async () => data });
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets counter when window has expired", async () => {
    const data = { count: 10, resetAt: Date.now() - 1000 }; // window expired
    fetch.mockResolvedValueOnce({ json: async () => data }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(false);
  });

  it("fails open when Firebase throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const checkRateLimit = await loadCheckRateLimit();
    const result = await checkRateLimit(DB, "1.2.3.4");
    expect(result.limited).toBe(false);
  });

  it("reads from a hashed IP path under /rq/rq-rl-", async () => {
    fetch.mockResolvedValueOnce({ json: async () => null }).mockResolvedValue({});
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4");
    expect(fetch.mock.calls[0][0]).toMatch(/fake\.firebaseio\.com\/rq\/rq-rl-[a-f0-9]{12}\.json/);
  });

  it("same IP always maps to same rate-limit key", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4");
    await checkRateLimit(DB, "1.2.3.4");
    expect(fetch.mock.calls[0][0]).toBe(fetch.mock.calls[2][0]);
  });

  it("different IPs map to different rate-limit keys", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const checkRateLimit = await loadCheckRateLimit();
    await checkRateLimit(DB, "1.2.3.4");
    await checkRateLimit(DB, "5.6.7.8");
    expect(fetch.mock.calls[0][0]).not.toBe(fetch.mock.calls[2][0]);
  });
});
