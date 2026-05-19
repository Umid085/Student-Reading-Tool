// Thin wrapper around Sentry (errors + session replay) and PostHog (product
// analytics). Both are gated on env vars and silently no-op when unset, so
// the app keeps working in local dev without keys.
//
// Env vars (set in Netlify/Vercel dashboard, prefixed with VITE_ to expose
// to the client):
//   VITE_SENTRY_DSN     — Sentry project DSN
//   VITE_POSTHOG_KEY    — PostHog project API key
//   VITE_POSTHOG_HOST   — optional, defaults to PostHog US cloud

import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let sentryReady = false;
let posthogReady = false;

export function initObservability() {
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,
        integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })],
      });
      sentryReady = true;
    } catch (e) {
      console.warn("Sentry init failed:", e);
    }
  }

  if (POSTHOG_KEY) {
    try {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        autocapture: false,
        persistence: "localStorage",
      });
      posthogReady = true;
    } catch (e) {
      console.warn("PostHog init failed:", e);
    }
  }
}

export function identify(username) {
  if (!username) return;
  if (posthogReady) {
    try { posthog.identify(username); } catch (_) {}
  }
  if (sentryReady) {
    try { Sentry.setUser({ username }); } catch (_) {}
  }
}

export function resetIdentity() {
  if (posthogReady) {
    try { posthog.reset(); } catch (_) {}
  }
  if (sentryReady) {
    try { Sentry.setUser(null); } catch (_) {}
  }
}

export function track(event, props = {}) {
  if (posthogReady) {
    try { posthog.capture(event, props); } catch (_) {}
  }
}

export const ErrorBoundary = Sentry.ErrorBoundary;
