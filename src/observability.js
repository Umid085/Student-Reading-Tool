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
      // Tag every event with the chosen UI language. IP geo (auto-enriched by
      // PostHog cloud) tells us where the device is; the picked locale reveals
      // which market the user actually belongs to — the signal that matters for
      // go-to-market decisions. Registered as a super-property so it rides on
      // all events + retention cohorts.
      try { posthog.register({ ui_lang: localStorage.getItem("rq-uilang") || "en" }); } catch (_) {}
    } catch (e) {
      console.warn("PostHog init failed:", e);
    }
  }
}

// Update super-properties attached to all subsequent events (e.g. when the
// user switches interface language). No-ops until PostHog is initialized.
export function setSuperProps(props = {}) {
  if (posthogReady) {
    try { posthog.register(props); } catch (_) {}
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
