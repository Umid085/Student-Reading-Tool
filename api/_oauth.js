// Social-login credential verification. The client signs in through the
// Firebase Auth SDK (Google/Apple/Facebook — all managed in the Firebase
// console) and sends us the resulting Firebase ID token. We verify it here and
// hand a *trusted* identity to the auth router's `oauth` action, which then
// mints our own existing HMAC access + refresh tokens — nothing downstream of
// login changes, and adding a provider later is a console toggle, no new code.
//
// Verification is done manually with jose (no firebase-admin: it's a heavy
// serverless dependency that needs a service-account secret). Mirrored verbatim
// in api/_oauth.js and netlify/functions/_oauth.js — touch both.
import { importX509, jwtVerify, decodeProtectedHeader } from "jose";

// Google publishes the public X.509 certs that sign Firebase ID tokens here,
// keyed by `kid`. Not JWKS format, so we import each PEM ourselves.
const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let _certsCache = { keys: null, exp: 0 };

async function getFirebaseCerts() {
  const now = Date.now();
  if (_certsCache.keys && now < _certsCache.exp) return _certsCache.keys;
  const r = await fetch(FIREBASE_CERTS_URL);
  const certs = await r.json(); // { "<kid>": "-----BEGIN CERTIFICATE-----..." }
  let maxAge = 3600;
  const cc = r.headers.get && r.headers.get("cache-control");
  if (cc) { const m = cc.match(/max-age=(\d+)/); if (m) maxAge = parseInt(m[1], 10); }
  _certsCache = { keys: certs, exp: now + maxAge * 1000 };
  return certs;
}

// Verify a Firebase ID token (a signed JWT). We trust the email only when
// Firebase marks it verified and both issuer + audience match our project,
// so a token minted for a different Firebase project can't be replayed here.
export async function verifyFirebaseIdToken(credential) {
  const projectId = process.env.FIREBASE_PROJECT_ID || "";
  if (!projectId) return { ok: false, error: "Firebase login not configured" };
  try {
    const { kid } = decodeProtectedHeader(credential);
    if (!kid) return { ok: false, error: "Invalid token header" };
    const certs = await getFirebaseCerts();
    const pem = certs[kid];
    if (!pem) return { ok: false, error: "Unknown signing key" };
    const key = await importX509(pem, "RS256");
    const { payload } = await jwtVerify(credential, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    if (!payload.sub) return { ok: false, error: "Token missing subject" };
    if (!payload.email) return { ok: false, error: "Account has no email" };
    if (payload.email_verified === false) return { ok: false, error: "Email not verified" };
    return {
      ok: true,
      provider: (payload.firebase && payload.firebase.sign_in_provider) || "firebase",
      firebaseUid: String(payload.sub),
      email: String(payload.email).toLowerCase(),
      emailVerified: payload.email_verified !== false,
      name: payload.name || payload.display_name || "",
    };
  } catch (_) {
    return { ok: false, error: "Invalid Firebase credential" };
  }
}

// `provider` is informational only — the trusted provider comes from the token
// itself (firebase.sign_in_provider). Kept in the signature so the auth router
// and tests don't care which login the user picked.
export async function verifyProviderCredential(_provider, credential) {
  if (!credential) return { ok: false, error: "Missing credential" };
  return verifyFirebaseIdToken(credential);
}
