// Public endpoint — returns the VAPID public key the browser needs to
// construct a PushManager subscription. Safe to expose: the public key
// is meant to be shipped to clients. The PRIVATE key never leaves the
// server (used only by api/cron-push.js to sign push messages).

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!publicKey) return res.status(503).json({ error: "Push notifications not configured" });
  return res.status(200).json({ publicKey });
}
