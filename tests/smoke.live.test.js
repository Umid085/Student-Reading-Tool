// Live-site smoke tests. Hits the deployed Vercel URL via plain fetch
// to verify the most expensive-to-regress surfaces:
//   - homepage HTML loads + has the expected title and canonical link
//   - PWA manifest is valid JSON with the install-essentials
//   - service worker + icons serve
//   - core API endpoints respond (proving function modules loaded and
//     validation chains run)
//
// Skipped from `npm test` by default — the default suite must run offline
// in CI. Run with `npm run smoke` (which sets RUN_SMOKE=1) when you want to
// check production after a deploy.

import { describe, it, expect } from "vitest";

const RUN = process.env.RUN_SMOKE === "1";
const ORIGIN = process.env.SMOKE_ORIGIN || "https://student-reading-tool.vercel.app";

const describeLive = RUN ? describe : describe.skip;

describeLive("live-site smoke", () => {
  const UA = { "User-Agent": "Mozilla/5.0 (smoke-test) Reading-Quest-CI" };

  async function get(path) {
    const r = await fetch(ORIGIN + path, { headers: UA });
    const text = await r.text();
    return { status: r.status, headers: r.headers, text };
  }

  async function postJson(path, body) {
    const r = await fetch(ORIGIN + path, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const text = await r.text();
    return { status: r.status, headers: r.headers, text };
  }

  it("homepage returns 200 with the expected title and canonical URL", async () => {
    const r = await get("/");
    expect(r.status).toBe(200);
    expect(r.text).toContain("Student Reading Quest");
    expect(r.text).toContain('<link rel="canonical" href="https://student-reading-tool.vercel.app/">');
    expect(r.text).toMatch(/src="\/assets\/index-[A-Za-z0-9_-]+\.js"/);
  });

  it("manifest is valid JSON with install essentials", async () => {
    const r = await get("/manifest.json");
    expect(r.status).toBe(200);
    const manifest = JSON.parse(r.text);
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    const has192 = manifest.icons.some(i => i.sizes === "192x192");
    const has512 = manifest.icons.some(i => i.sizes === "512x512");
    expect(has192 && has512).toBe(true);
  });

  it("service worker and primary icons serve", async () => {
    const sw = await fetch(ORIGIN + "/sw.js", { headers: UA });
    expect(sw.status).toBe(200);
    const icon192 = await fetch(ORIGIN + "/icons/icon-192.png", { headers: UA });
    expect(icon192.status).toBe(200);
    const appleIcon = await fetch(ORIGIN + "/icons/apple-touch-icon.png", { headers: UA });
    expect(appleIcon.status).toBe(200);
  });

  it("auth endpoints reject empty bodies (proves functions loaded)", async () => {
    for (const path of ["/api/auth", "/api/refresh", "/api/revoke", "/api/register"]) {
      const r = await postJson(path, {});
      // 400 Missing credentials (validation ran); 503 = not configured;
      // anything 2xx or 5xx-other is a regression.
      expect([400, 503]).toContain(r.status);
    }
  });

  it("refresh endpoint rejects a bogus token with 401", async () => {
    const r = await postJson("/api/refresh", { name: "smoke-bot", refreshToken: "r:smoke-bot:9999999999999:deadbeef" });
    expect([401, 429]).toContain(r.status);
  });

  it("hashed asset chunks resolve and serve JS", async () => {
    const home = await get("/");
    const match = home.text.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/);
    expect(match).toBeTruthy();
    const r = await fetch(ORIGIN + match[1], { headers: UA });
    expect(r.status).toBe(200);
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    // Vercel uses ETag-based revalidation rather than immutable headers,
    // so we just check the asset is actually JS (not the SPA fallback's
    // text/html, which would mean the hash is stale on the deploy).
    expect(ct).toMatch(/javascript|ecmascript/);
  });

  it("vendor chunks are split out (returning visitor optimization)", async () => {
    const home = await get("/");
    // After the chunk-split deploy there should be at least one separate
    // vendor or react-vendor chunk referenced as a script preload or import.
    const hasVendor = /\/assets\/(react-vendor|vendor|story-library)-[A-Za-z0-9_-]+\.js/.test(home.text);
    expect(hasVendor).toBe(true);
  });
});
