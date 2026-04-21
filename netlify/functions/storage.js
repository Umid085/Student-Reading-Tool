exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json" };
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");

  // health-check
  if (!((event.queryStringParameters || {}).key) && event.httpMethod === "GET") {
    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok", db: !!DB }) };
  }

  if (!DB) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const key = (event.queryStringParameters || {}).key;
      const r = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json`);
      const data = await r.json();
      // Firebase returns parsed JSON; re-stringify so apiGet can JSON.parse it uniformly
      return { statusCode: 200, headers, body: JSON.stringify({ value: data !== null && data !== undefined ? JSON.stringify(data) : null }) };
    }

    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing key" }) };
      // value is already a JSON string from apiSet; send it as the body so Firebase stores the parsed structure
      await fetch(`${DB}/rq/${encodeURIComponent(key)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: value,
      });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
