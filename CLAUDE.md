# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (port 5173; use netlify dev for full-stack with functions)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm test         # Run all unit tests with Vitest
netlify dev      # Full-stack dev: app on :8888, functions on /.netlify/functions/*
```

For full-stack development with Netlify Functions and Firebase, use `netlify dev`. Vite-only (`npm run dev`) is faster for frontend-only work but functions won't be available.

## Architecture

**Student Reading Quest** is a single-page React app for AI-powered language learning. Users select a CEFR level (A1–C2), the app calls Claude via a Netlify function to generate a reading passage + 6-type quiz, and results are saved to a Firebase Realtime Database. The app includes 10 advanced features: reading speed tracking, difficulty analysis, audio enhancements, favorites, vocabulary heatmap, vocab game, recommendations, translation, weekly leaderboard, and story discussions.

### Entry Points

- `src/main.jsx` → mounts `student-reading-quest.jsx` in StrictMode
- `student-reading-quest.jsx` — monolithic root component (`App`) with all screens, state, and logic (~1600 lines)
  - **Key functions within:** `doRegister()`, `doLogin()`, `doFinish()`, `scoreQuestion()`, `fetchUserData()`
  - **Screen stages:** auth, home, reading, quiz, results, leaderboard, profile, friends, social, weekly, vocabgame, discuss
- `netlify/functions/generate.js` — proxies to Anthropic API (`claude-sonnet-4-6`), returns `{passages, questions}` JSON
- `netlify/functions/storage.js` — Firebase REST API wrapper (`GET`/`POST` at `/.netlify/functions/storage?key=...`)

### Screen Flow

Auth (Register/Login) → Home (level selector) → Reading stage → Quiz stage → Result screen → [Leaderboard / Friends / Profile / Weekly / Vocab Game / Discussions]

### State Management

Pure `useState` hooks — no Context or Redux. Key state variables:

**Screen & navigation:**
- `screen` — controls which view renders (auth, home, reading, quiz, results, etc.)

**Quiz & reading state:**
- `questions`, `userAnswers`, `matchState`, `headingState` — current quiz state
- `passage`, `currentLevel` — reading content and difficulty
- `wpm` — words-per-minute tracking (stores live WPM on reading screen)

**Persistent user data:**
- `currentUser`, `allUsers`, `socialData`, `leaderboards` — user accounts and social data
- `favorites`, `weeklyBoard`, `discussions` — new feature data
- `userProfile`, `selectedFriend` — profile and comparison views

### 10 Advanced Features

**Phase A — Client-side reading enhancements:**
1. **Reading Speed Tracker** — Live WPM counter on reading screen; labeled stat on results (Beginner/Elementary/Intermediate/Advanced/Expert)
2. **Reading Difficulty Analyzer** — Card on reading screen: Flesch-Kincaid star (1-5), word count, estimated read time, new-word count
3. **Story Audio Enhancements** — Playback rate selector (0.75×/1×/1.25×/1.5×); sentence-by-sentence playback via SpeechSynthesis
4. **Personal Favorites** — ❤️/🤍 toggle on reading screen; My Favorites section at top of Library

**Phase B — Analytics & vocab:**
5. **Difficult Word Heatmap** — 💡 toggle; uncommon words (not in ~800-word COMMON_WORDS set) highlighted amber with dotted underline
6. **Vocabulary Review Game** (stage=vocabgame) — 3 modes: Flashcard, Word Quiz MCQ, Fill the Blank; score tracked

**Phase C — Personalization:**
7. **Smart Story Recommendation** — Home screen card with 3 unlocked library stories based on player's dominant level
8. **Sentence Translation** — 🌐 Translate mode on reading screen; tap sentence to highlight + translate via MyMemory API; language selector (Uzbek, Russian, Turkish, Arabic, German)

**Phase D — Social:**
9. **Weekly Challenge Board** (stage=weekly) — Per-week XP leaderboard; weekly goal card (3 stories); nav button on home
10. **Story Discussion** (stage=discuss) — Per-story flat comment threads (newest-first, capped at 50); 1 post/user/day limit; accessible from result screen

### Storage Layer (Dual Fallback)

All saves: write to `localStorage` first (instant), then fire-and-forget to Firebase via `/.netlify/functions/storage`. Reads try Firebase async and fall back to `localStorage` silently if offline.

**Firebase keys:**
- `rq-users-v6` — array of `{ name, hash, games, joined, level, totalXp }` user objects
- `rq-boards-v6` — leaderboard entries per level (A1–C2)
- `rq-social-v6` — per-user `{ friends, requests, likes, challenges }`
- `rq-favs-v1` — array of favorited story IDs per user
- `rq-weekly-v1` — per-week XP leaderboard (week-based entries)
- `rq-discuss-v1` — per-story discussion threads with `{ author, text, timestamp }`

**Local-only keys:**
- `rq-session` — current logged-in username
- `rq-credentials` — auto-login credentials `{ name, hash }`

### Scoring & XP System

- 6 question types: MCQ, Gap-Fill (word/sentence), Matching, Headings, Open Answer, True/False/Not Mentioned, Yes/No/Not Given
- Per-question scoring via `scoreQuestion()` with type-specific logic; matching/headings award partial credit
- Final XP: `base_points × level_multiplier × 100 + time_bonus + streak_bonus`
  - Time bonus: 200 XP (A1/A2), 300 XP (B1/B2), 400 XP (C1/C2)
  - Streak bonus: +50 XP after 3 consecutive correct answers
- Level multipliers: A1=1×, A2=1.5×, B1=2×, B2=2.5×, C1=3×, C2=4×
- User progression: 21 levels (0–190k+ XP) with real-time progress tracking

### Authentication

Username + `btoa(password)` (base64, not cryptographic). Session persisted as `rq-session` in `localStorage`. No OAuth. Auto-login on load if session username still exists in user list and credentials match `rq-credentials`.

### Environment Variables

```
ANTHROPIC_API_KEY=...        # Required by netlify/functions/generate.js
FIREBASE_DB_URL=https://...  # Required by netlify/functions/storage.js (Realtime DB base URL)
```

Set in `.env.local` for local dev; configure in Netlify dashboard for deployment.

### UI Conventions

- All styles are inline `style={{...}}` props — no CSS framework
- Dark theme (`#0d0d1a` base) with per-level gradient accent colors
- `var` declarations throughout (pre-ES6 style) — maintain consistency when editing
- Responsive: mobile-first, breakpoint at 640px for grid columns
- Icons: emoji-only (❤️, 💡, 🌐, etc.)

### Design System

A comprehensive design system is available in `src/designSystem.js` with:

**Color Tokens** — Semantic colors (primary, success, error), backgrounds, text levels, and CEFR level colors
```javascript
import { colors, spacing, typography } from './designSystem';
// Use colors.primary, colors.success, colors.error, etc.
```

**Spacing Scale** — 8px base unit: xs(4px), sm(8px), md(12px), lg(16px), xl(20px), 2xl(24px), 3xl(32px), 4xl(40px)
```javascript
style={{ padding: spacing.md, gap: spacing.lg }}
```

**Typography Scale** — h1/h2/h3, body, bodySmall, label, caption, button
```javascript
style={{ fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight }}
```

**Utility Functions** — `getOptionStyle()`, `getTextColor()`, `getLevelColor()`, `getLevelGlow()`
```javascript
style={getOptionStyle(isSelected, isCorrect, isConfirmed)}
```

**Reusable Style Objects** — buttonBase, buttonPrimary, ghostButton, inputBase, card, focusRing
```javascript
style={{ ...styles.buttonBase, ...styles.buttonPrimary }}
```

When adding new components or modifying styles, import and use design tokens from `designSystem.js` instead of hardcoding colors/spacing. This ensures consistency and makes theme changes trivial.

## Testing

Unit tests cover the Netlify functions:

```bash
npm test
```

**Test files:**
- `tests/generate.test.js` — 6 tests for `netlify/functions/generate.js`
- `tests/storage.test.js` — 9 tests for `netlify/functions/storage.js`
- `tests/auth.test.js` — auth function tests
- `tests/register.test.js` — register function tests
- `tests/rateLimit.test.js` — rate limiting tests
- `tests/users.test.js` — user management tests

**Note:** `generate.js` is CommonJS. The test setup in `tests/setup.js` patches Node's `require.cache` to inject mocks before tests run.

## Monolithic Component Structure

`student-reading-quest.jsx` is large (~1600 lines) and contains all logic. Key sections:

1. **State setup** — `useState` declarations for screen, quiz, user data, features
2. **API calls** — `fetchUserData()`, `fetchFirebase()`, quiz generation via generate.js
3. **Score calculation** — `scoreQuestion()` function with per-type logic
4. **Event handlers** — `doRegister()`, `doLogin()`, `doFinish()`, `doSubmitQuiz()`, feature toggles
5. **Render branches** — large conditional tree rendering screens by `screen` stage variable
6. **Feature modules** — WPM counter, heatmap, translation, weekly board, discussion inline

When adding features: locate the relevant state, handler, and render section; keep inline to avoid breaking screen logic dependencies.
