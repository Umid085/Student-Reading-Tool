# CLAUDE.md

Guidance for Claude Code (and future maintainers) working in this repository.

## Commands

```bash
npm run dev      # Vite dev server on :5173 (front-end only)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm test         # Run unit-test suite (vitest, offline-safe)
npm run smoke    # Live-site smoke tests against the deployed Vercel URL
                 #   set SMOKE_ORIGIN=https://preview-foo.vercel.app to target a preview
netlify dev      # Full-stack dev: app on :8888, functions under /.netlify/functions/*
                 # (only needed when you're working on a server function locally)
```

Production hosting is **Vercel** (`student-reading-tool.vercel.app`). The repo still ships a parallel Netlify Functions implementation for compatibility, so every server function exists in both `api/*.js` (Vercel handler shape) and `netlify/functions/*.js` (Netlify handler shape). **Touch both when changing server behavior** — the test suite covers both paths.

## Architecture

**Student Reading Quest** is a single-page React app for AI-powered CEFR English learning (A1–C2). The user picks a level, the app calls Claude to generate a level-appropriate reading passage and quiz, the user reads + takes the quiz, results are scored and saved. State + social data live in Firebase Realtime Database via authenticated server functions; the front-end uses localStorage as a primary cache.

### Entry points

- `src/main.jsx` — boots React, registers the service worker, wraps everything in an ErrorBoundary.
- `src/student-reading-quest.jsx` — monolithic root component (`App`). ~7800 lines. All stages, state, handlers, and inline render are here.
- `src/storyLibrary.js` — the 60-story static library (separate chunk so deploys that touch only app logic don't bust its hash).
- `src/observability.js` — Sentry + PostHog wrapping (`track`, `identify`, `resetIdentity`, `initObservability`, `ErrorBoundary`).
- `src/designSystem.js` — color/spacing/typography tokens. Newer code should pull from here instead of hardcoding values.

### Stage flow

The whole app is rendered by `student-reading-quest.jsx` based on the `stage` state variable. The major stages, roughly in order of use:

```
auth → home → reading → quiz → result
                                    ↘ leaderboard / weekly / dailyleaderboard / portfolio
home → library → reading                  (library story flow)
home → placementTest → home               (new-user CEFR estimate)
home → profile / analytics / friends / vocab / vocabgame / quotes / goals / history / discuss
home → teacherDashboard → classView → classAnalytics (teacher role only)
?report=… → report                        (signed-only profile-share link)
?portfolio=… → portfolioShare
```

The `stage` state variable controls which JSX branch renders. The CLAUDE.md predecessor referred to it as `screen`; it's actually `stage`.

### Server functions

Every function exists twice — once for Vercel (`api/*.js`, default export), once for Netlify (`netlify/functions/*.js`, named `handler` export). The Vite test suite imports the Netlify shape; the Vercel API tests import the Vercel shape.

| Endpoint | Purpose |
|---|---|
| `POST /api/register` | Create user. Server stores `name + scrypt(hash)` in `rq-auth-v6`. Returns `{ token, refreshToken }`. |
| `POST /api/auth` | Password login. Returns `{ token, refreshToken }`. Auto-migrates legacy plain-hex stored credentials to scrypt on first successful login. |
| `POST /api/refresh` | Exchange a refresh token for a fresh access token + rotated refresh token. Checks `rq-revoked-v1` blacklist before issuing. Fails open on blacklist-read errors. |
| `POST /api/revoke` | Invalidate a refresh token (called on logout). Adds the token's id to `rq-revoked-v1`, prunes entries older than 31 days. |
| `POST /api/generate` | Anthropic proxy. Two modes: free-form `{messages}` proxy, or structured `{level, topic, types, language, vocab_words}` → returns `{passage, questions}`. Picks the question count per level (5–15) automatically. |
| `POST /api/quiz-from-text` | Generates a level-appropriate quiz for a pre-written passage. Used by the library AI-quiz upgrade and the teacher's custom-text assignment flow. |
| `POST /api/storage` | Authenticated Firebase proxy. Read/write a value by key. Refuses reads on `rq-auth-v6` and `rq-users-v6`; refuses writes on `rq-auth-v6`. |
| `POST /api/users` | Profile-list lookup for friends/leaderboard. |

Helpers (shared between Vercel + Netlify variants):
- `_rateLimit.js` — IP-based sliding window. `RATE_LIMIT_DISABLED=1` in tests.
- `_passwordHash.js` — scrypt wrapper. `hashPassword`, `verifyPassword` (returns `{ok, needsRehash}`), `isScryptHash`.
- `_refreshToken.js` — HMAC refresh tokens. Format `r:<name>:<expiresAt>:<sig>`, namespace `/refresh-v1`, 30-day expiry, `refreshTokenId()` derives a stable blacklist key.

### Question / passage scaling (per CEFR level)

Both passage size and quiz length scale by level. Defined once in `LEVEL_CONFIG` inside `api/generate.js` and `netlify/functions/generate.js` (keep them in sync).

| Level | Words | Paragraphs | Questions |
|---|---|---|---|
| A1 | 130–170 | 2 | 5 |
| A2 | 180–230 | 2 | 6 |
| B1 | 260–340 | 3 | 8 |
| B2 | 360–440 | 3 | 10 |
| C1 | 460–560 | 4 | 12 |
| C2 | 600–750 | 4 | 15 |

The server prompts Claude to separate paragraphs with literal `\n\n`. The front-end's `WordTokens` / `SentencePassage` renderers split on `/\n{2,}/` and emit one `<p>` per paragraph. The flat sentence list still works for TTS, pronunciation panel, etc. via a running index across paragraphs.

When the client requests fewer types than the level wants, the backend cycles through the requested types to reach the target count (e.g. C2 + `[mcq, gap_word, qa, tfnm]` → 15 items, each type repeating 3–4×). The prompt instructs the model not to repeat stems.

### Date handling

**All date keys are ISO `yyyy-mm-dd`** via `todayKey()`. This includes:
- `game.date` (game-history entries)
- daily-challenge `done.date`
- weekly leaderboard `getWeekId()` returns ISO 8601 week (`YYYY-W##`, Thursday-anchored)
- SRS `srsNextDate(days)` and `g.date===today` filters
- Shield "yesterday" check, 7-day/30-day charts, discussion 1-post-per-day cap

Locale-formatted dates were removed in favour of ISO so a user crossing timezones or switching OS language doesn't reset their streak or replay the daily for double XP.

### Storage layer

**Firebase keys (server-mediated):**
- `rq-users-v6` — array of `{ name, games, joined, totalXp }` profiles (no hash; auth lives in `rq-auth-v6`)
- `rq-auth-v6` — `[{ name, hash }]` where `hash` is scrypt-formatted (`s$N$r$p$saltB64$keyB64`) or legacy plain hex (auto-upgraded on next login)
- `rq-revoked-v1` — `{ tokenId: expiresAt }` map of revoked refresh-token ids
- `rq-boards-v6` — per-level leaderboards
- `rq-social-v6` — per-user `{ friends, requests, likes, challenges }`
- `rq-favs-v1` — per-user favorited story ids
- `rq-weekly-v1` — per-week XP leaderboards
- `rq-discuss-v1` — per-story comment threads (newest-first, capped at 50)
- `rq-classes-v1` — teacher classes
- `rq-assignments-v1` — teacher assignments
- `rq-rate-v1` — rate-limit counters (managed by `_rateLimit.js`)

**Local-only keys:**
- `rq-session` — currently logged-in username
- `rq-credentials` — `{ name, refreshToken }` for auto-login (legacy `{ name, hash }` is still accepted and silently upgraded)
- `rq-role-<name>` — `"teacher"` if the user registered as a teacher
- `rq-onboarded-<name>` — `"true"` once a teacher finishes the 3-step onboarding
- `rq-pmt-<name>` — placement-test taken flag (value = recommended level or `"skipped"`)
- `rq-libqs-<storyId>` — cached AI-upgraded library quizzes (per-user)
- `rq-review-<name>` — SRS review queue (capped at 60 items)
- `rq-daily-done-<name>` — daily-challenge completion `{ date, xp, pct }`
- `rq-quests-<name>-<date>` — completed daily quests (one key per day)
- `rq-streak-data-v1-<name>` — `{ shields, shieldDates, longestStreak }`
- `rq-uilang` — UI language (`en` / `uz` / `ru` / `tr` / `ar` / `de` / `es` / `fr`)
- `rq-sfx`, `rq-music-genre`, `rq-translate-lang` — UI preferences

All writes go to localStorage first (sync), then fire-and-forget to Firebase via `/api/storage` (async). Reads pull from Firebase if available, fall back to localStorage on error.

### Known limitations (storage security debt)

Two structural issues were identified in the May 2026 backend review and **left unfixed by decision** (tracked, not yet scheduled):

1. **`/api/storage` enforces authentication, not authorization.** The POST path verifies the Bearer token is a valid, unexpired token for *some* user, but never binds that user to the key being written. Any logged-in user can PUT to any key that passes `ALLOWED_KEYS` and isn't in `WRITE_BLOCKED` (i.e. everything except `rq-auth-v6`) — including `rq-classes-v1`, `rq-assignments-v1`, `rq-boards-v6`, `rq-social-v6`. Teacher/class ownership is enforced only by browser UI gates (`isTeacherOf`), which a direct API call bypasses.
2. **Whole-array lost-update races.** `doCompleteAssignment` and `doJoinClass`/`doPostAnnouncement` read a stale in-memory snapshot, mutate it, and PUT the *entire* `rq-assignments-v1` / `rq-classes-v1` array. Concurrent writers clobber each other (a completion or class-join is silently dropped). Same class as the quota-counter and room-participant races that were fixed via ETag CAS / per-child writes.

Recommended fix for both: dedicated authenticated mutation endpoints (one per class/assignment/score action) that derive the actor from `extractUsername(req)` and do per-child Firebase writes server-side, instead of routing through the generic whole-array `/api/storage` proxy.

### Authentication (current state)

The auth story has been hardened in three layers:

1. **Storage:** server uses `scrypt(N=16384, r=8, p=1)` with a per-user salt. Legacy plain-hex entries are auto-rehashed on next successful login.
2. **Wire:** client sends `enc(password)` (SHA-256 hex) — same as before, but the server treats it as input to scrypt rather than storing it directly.
3. **Auto-login:** `localStorage.rq-credentials` holds `{ name, refreshToken }`, not the password hash. The refresh token is an HMAC-signed stateless token (`r:<name>:<expiresAt>:<sig>`, 30-day expiry) that's rotated on every `/api/refresh` call. Logout calls `/api/revoke` which adds the token id to `rq-revoked-v1`.

Migration: an existing user with the old `{name, hash}` localStorage shape gets one final `/api/auth` round-trip on their next visit, receives a refresh token, and is upgraded to the new shape.

### i18n

UI text is in `STRINGS[locale]` at the top of `student-reading-quest.jsx`. 8 locales: `en, uz, ru, tr, ar, de, es, fr`. The translation function is `t(key)` — falls back to `en` if a locale is missing the key, then to the key string itself.

Two prefixes worth knowing:
- `tch_*` — teacher dashboard / class view labels (~38 keys)
- `stu_*` — student-side error toasts and social-flow strings (~24 keys). Some use `{name}` placeholders that get `.replace("{name}", x)`-substituted at the call site so word order can vary by language.

Placement-test labels and a handful of older toasts are still English-only by design — placement tests English fluency, and those strings haven't moved out yet.

### PWA

`public/manifest.json` declares name, scope, icons (192/512/maskable PNG + SVG fallback), theme color, and display mode. `public/sw.js` is hand-rolled:
- pre-caches `/`, `/manifest.json`, `/favicon.svg`, and the four icons on install
- runtime cache-first for hashed assets
- network-first with cached fallback for HTML navigations (uses Navigation Preload)
- never caches `/api/*` — returns a 503 JSON `{error: "You appear to be offline…"}` instead
- handles push notifications (no server-side push scheduling yet — events arrive via external pushes)

Bump `CACHE_NAME = 'srq-vN'` in `sw.js` on any SW logic change to evict old caches.

### Build / bundle

Vite with `manualChunks` (see `vite.config.js`):
- `react-vendor` — React, ReactDOM, scheduler (~144 KB raw / 46 KB gz)
- `vendor` — everything else in node_modules (Anthropic SDK, Sentry, PostHog) (~203 KB / 68 KB gz)
- `story-library` — `src/storyLibrary.js` (~84 KB / 25 KB gz)
- `index` — app code (~440 KB / 116 KB gz)

Returning visitors with the vendor/story-library chunks already cached skip most of the per-deploy download.

### Scoring & XP

- 8 question types: `mcq`, `gap_word`, `gap_sentence`, `matching`, `heading`, `qa` (open answer), `tfnm` (True/False/Not Mentioned), `ynng` (Yes/No/Not Given). Matching and heading are excluded from AI generation (complex structured format).
- `scoreQuestion(q, ans)` is type-dispatched and defensive: it returns 0 on missing fields (no longer crashes on a malformed `qa` lacking `keywords`).
- XP = `base × level_mult × 100 + time_bonus + streak_bonus + quest_xp` (×1.5 if challenge-mode finished). Streak bonus uses `Math.max(streak, maxStreak)` so a user who hit ≥3 streak earlier still earns the +50 even after a late miss.
- Level multipliers: A1=1×, A2=1.5×, B1=2×, B2=2.5×, C1=3×, C2=4×.
- WPM is only recorded when `readingTimerSecs > 5` (avoids 12000-WPM outliers when the reading screen is skipped).

### Environment variables

```
ANTHROPIC_API_KEY=...        # /api/generate + /api/quiz-from-text
FIREBASE_DB_URL=https://...  # All storage + auth functions
FIREBASE_DB_SECRET=...       # Firebase auth token (optional but recommended)
SESSION_SECRET=...           # HMAC secret for access + refresh tokens
                             # Rotating this invalidates every outstanding refresh token
RATE_LIMIT_DISABLED=1        # Skip rate limits (tests only)
```

Set in `.env.local` for local dev; in the Vercel dashboard for production; in the Netlify dashboard if you're using the parallel Netlify deploy.

### UI conventions

- All styles are inline `style={{...}}` props. No CSS framework. Pull from `designSystem.js` (`colors`, `spacing`, `typography`, plus utility helpers like `getLevelColor`, `getOptionStyle`) for any new style.
- Dark theme (`#0d0d1a` base) with per-level accent colors.
- `var` declarations throughout — maintain consistency when editing existing functions (newer top-level files use `const`/`let`).
- Responsive: mobile-first, breakpoint at 640px for grid columns.
- Icons: emoji-only (❤️ 💡 🌐 📋 🎯 etc.).

## Testing

```bash
npm test         # unit suite — 165 tests across 14 files, offline-safe
npm run smoke    # 7 fetch-based smoke tests against the deployed URL
```

Unit tests cover all server functions:

| File | Covers |
|---|---|
| `tests/auth.test.js` / `api-auth.test.js` | login + legacy-rehash + scrypt-format assertion |
| `tests/register.test.js` / `api-register.test.js` | registration, username collision, hash format |
| `tests/refresh.test.js` | token issue/verify/rotate/expire + revocation-list interaction |
| `tests/revoke.test.js` | revoke endpoint + blacklist pruning |
| `tests/generate.test.js` / `api-generate.test.js` | proxy mode |
| `tests/quiz-from-text` (in `api-generate`) | passage-only quiz generation |
| `tests/storage.test.js` / `api-storage.test.js` | Firebase proxy, read/write blocking on auth keys |
| `tests/users.test.js` / `api-users.test.js` | profile-list lookup |
| `tests/rateLimit.test.js` / `api-rateLimit.test.js` | rate-limit helper |
| `tests/smoke.live.test.js` | live-site smoke (skipped without `RUN_SMOKE=1`) |

Test setup in `tests/setup.js` mocks Anthropic SDK calls via a `tests/_vercelMock.js` helper so unit tests never hit a real LLM.

## Working in the monolithic component

`student-reading-quest.jsx` is ~7800 lines. Roughly:

1. **Module-level constants** (lines 1–~1400): endpoint URLs, `STRINGS` (8 locales), helpers (`getWeekId`, `todayKey`, `srsNextDate`, `getWpmFromSecs`, `splitSentences`, `scoreQuestion`, `maxPoints`), `PLACEMENT_QUESTIONS`, badges, goals, daily-quests.
2. **`MatchingQ`, `HeadingQ`** — sub-components for two complex question types.
3. **API helpers** (lines ~1500–1800): `getSessionToken`, `apiSet`, `apiGet`, `loadUsers`, `loadBoards`, `saveUsers`, etc.
4. **`App` component** (lines ~1900 onward):
   - Big `useState` block (~150+ pieces of state)
   - Effects (auto-login URL handling, reading-timer tick, daily challenge load, Sean Ellis modal gate, theme application)
   - Event handlers: `doRegister`, `doLogin`, `doFinish`, `doConfirm`, `doNext`, `doRestart`, social actions, teacher class actions, assignment actions, vocab actions
   - Render: one big conditional tree dispatched on `stage`

When adding a feature: locate the existing state, handler, and render section; keep the new code inline. The component is intentionally monolithic — splitting it into separate files would require threading dozens of state values through props. Lazy-loading individual stages via `React.lazy` is the canonical next refactor for bundle size, but hasn't been done yet.

### Common pitfalls

- **Don't compare dates as locale strings.** Use `todayKey()` and ISO `yyyy-mm-dd` throughout. Mixed-format dates were a source of bugs (replay daily for double XP across timezones).
- **Don't access `cls.students` without `|| []`.** Older classes in storage may not have the field; the render IIFEs already alias to `var students = cls.students || []` at the top.
- **Don't shuffle `mq.rights` as plain strings.** Duplicates become indistinguishable. The pattern is `shuffleArr(mq.rights.map((v,i) => ({idx:i, val:v})))` — `MatchingQ` reads `.idx` and `.val`.
- **Don't return only `{token}` from auth endpoints.** Both register and auth must return `{token, refreshToken}` so the client can store the rotating token.
- **Bump `CACHE_NAME` in `public/sw.js`** when changing service-worker logic so existing visitors evict the old SW.
- **Touch both `api/*.js` and `netlify/functions/*.js`** when changing server logic. The smoke tests run against `api/` (Vercel production) but the unit tests run against `netlify/functions/`.

## Design system

`src/designSystem.js` exports:

- **`colors`** — semantic (`primary`, `success`, `error`), backgrounds, text levels, CEFR-level colors
- **`spacing`** — 8px scale: `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `2xl(24)`, `3xl(32)`, `4xl(40)`
- **`typography`** — `h1`/`h2`/`h3`, `body`, `bodySmall`, `label`, `caption`, `button`
- **Utility functions** — `getOptionStyle()`, `getTextColor()`, `getLevelColor()`, `getLevelGlow()`
- **Reusable style objects** — `buttonBase`, `buttonPrimary`, `ghostButton`, `inputBase`, `card`, `focusRing`

```js
import { colors, spacing, typography, getLevelColor } from "./designSystem";
style={{ padding: spacing.md, color: colors.success, ...buttonBase }}
```

Newer code should import these instead of hardcoding hex values. Existing inline styles are gradually being migrated.
