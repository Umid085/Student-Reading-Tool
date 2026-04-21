const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json" };

  // health-check: GET /storage with no key returns a status ping
  if (event.httpMethod === "GET" && !(event.queryStringParameters || {}).key) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok", env: !!process.env.NETLIFY }) };
  }

  let store;
  try {
    // explicit context so it works across all @netlify/blobs versions
    const opts = process.env.NETLIFY_SITE_ID
      ? { name: "rq-data", siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN }
      : "rq-data";
    store = getStore(opts);
  } catch (e) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "store_init: " + e.message }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const key = (event.queryStringParameters || {}).key;
      const value = await store.get(key);
      return { statusCode: 200, headers, body: JSON.stringify({ value: value || null }) };
    }

    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing key" }) };
      await store.set(key, value);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
