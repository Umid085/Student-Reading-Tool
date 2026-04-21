const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json" };

  try {
    const store = getStore("rq-data");

    if (event.httpMethod === "GET") {
      const key = (event.queryStringParameters || {}).key;
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing key" }) };
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
