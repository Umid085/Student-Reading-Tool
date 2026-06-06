// Firebase client: social sign-in (Google/Apple/Facebook via Firebase Auth)
// + Analytics (GA4). Config comes from VITE_FIREBASE_* env vars — the Firebase
// web config is public by design (security lives in the DB rules + our server
// token checks), so these are safe to ship in the client bundle.
//
// Everything is lazy: the firebase SDK is dynamically imported only when a user
// actually clicks a social-login button or when analytics initializes, so it
// stays out of the main app chunk. `firebaseReady` is a pure env check (no
// import), so the app boots fine before the env is set — the social buttons
// just stay hidden until then.

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseReady = !!cfg.apiKey && !!cfg.projectId;

let _appPromise = null;
async function getApp() {
  if (!firebaseReady) throw new Error("Firebase not configured");
  if (!_appPromise) {
    _appPromise = import("firebase/app").then(function (m) { return m.initializeApp(cfg); });
  }
  return _appPromise;
}

function makeProvider(m, name) {
  if (name === "google") return new m.GoogleAuthProvider();
  if (name === "apple") return new m.OAuthProvider("apple.com");
  if (name === "facebook") return new m.FacebookAuthProvider();
  throw new Error("Unknown provider: " + name);
}

// sessionStorage flag so we know, after a full-page redirect, that we should
// pick up the result on next load (and which provider it was).
const REDIRECT_FLAG = "rq-oauth-redirect";

// Run the Firebase sign-in for the given provider and return a fresh Firebase
// ID token. The server (POST /api/auth?action=oauth) verifies it and mints our
// own session tokens.
//
// Tries the popup flow first. In-app browsers (Telegram, Facebook, Instagram)
// and some locked-down mobile browsers block or don't support popups — there we
// fall back to a full-page redirect and finish via getPendingRedirectToken() on
// the next load. Returns { idToken, redirecting }: when redirecting is true the
// page is navigating away and idToken is null.
export async function signInWithProvider(name) {
  const app = await getApp();
  const m = await import("firebase/auth");
  const provider = makeProvider(m, name);
  const auth = m.getAuth(app);
  try {
    const cred = await m.signInWithPopup(auth, provider);
    return { idToken: await cred.user.getIdToken(), redirecting: false };
  } catch (e) {
    const code = e && e.code ? String(e.code) : "";
    if (
      code.indexOf("popup-blocked") !== -1 ||
      code.indexOf("operation-not-supported") !== -1 ||
      code.indexOf("web-storage-unsupported") !== -1
    ) {
      try { sessionStorage.setItem(REDIRECT_FLAG, name); } catch (_) {}
      await m.signInWithRedirect(auth, provider); // navigates away
      return { idToken: null, redirecting: true };
    }
    throw e;
  }
}

// Called once on app load. If the user is returning from a redirect sign-in
// (REDIRECT_FLAG set), resolves the redirect result and returns
// { idToken, provider }; otherwise null. Gated on the flag so we don't pull the
// firebase/auth chunk on every cold load.
export async function getPendingRedirectToken() {
  let pending = null;
  try { pending = sessionStorage.getItem(REDIRECT_FLAG); } catch (_) {}
  if (!pending) return null;
  try { sessionStorage.removeItem(REDIRECT_FLAG); } catch (_) {}
  if (!firebaseReady) return null;
  const app = await getApp();
  const m = await import("firebase/auth");
  const auth = m.getAuth(app);
  const res = await m.getRedirectResult(auth);
  if (res && res.user) return { idToken: await res.user.getIdToken(), provider: pending };
  return null;
}

// Initialize GA4 collection. Safe to call unconditionally — no-ops without a
// measurementId or outside the browser. Deferred from app start so it doesn't
// compete with first paint.
export async function initAnalytics() {
  if (!firebaseReady || !cfg.measurementId || typeof window === "undefined") return;
  try {
    const app = await getApp();
    const m = await import("firebase/analytics");
    if (await m.isSupported()) m.getAnalytics(app);
  } catch (_) { /* analytics is best-effort */ }
}
