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

// Run the Firebase popup flow for the given provider and return a fresh
// Firebase ID token. The server (POST /api/auth?action=oauth) verifies it and
// mints our own session tokens.
export async function signInWithProvider(name) {
  const app = await getApp();
  const m = await import("firebase/auth");
  let provider;
  if (name === "google") provider = new m.GoogleAuthProvider();
  else if (name === "apple") provider = new m.OAuthProvider("apple.com");
  else if (name === "facebook") provider = new m.FacebookAuthProvider();
  else throw new Error("Unknown provider: " + name);
  const auth = m.getAuth(app);
  const cred = await m.signInWithPopup(auth, provider);
  return cred.user.getIdToken();
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
