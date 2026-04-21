# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (port 5173; use netlify dev for full-stack with functions)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

For full-stack development (Netlify Functions + Vite), run `netlify dev` instead of `npm run dev`. This exposes the app at `http://localhost:8888` with functions available at `/.netlify/functions/*`.

No test or lint commands are configured.

## Architecture

**Student Reading Quest** is a single-page React app for AI-powered language learning. Users select a CEFR level (A1–C2), the app calls Claude via a Netlify function to generate a reading passage + 6-type quiz, and results are saved to a Firebase Realtime Database.

### Entry Points

- `src/main.jsx` → mounts `student-reading-quest.jsx`
- `student-reading-quest.jsx` — single large root component (`App`) containing all screens, state, and logic (~1100 lines)
- `netlify/functions/generate.js` — proxies to Anthropic API (`claude-sonnet-4-6`), returns quiz JSON
- `netlify/functions/storage.js` — Firebase REST API wrapper (`GET`/`POST` at `/rq/{key}.json`)

### Screen Flow

Auth (Register/Login) → Home (level selector, pending challenges) → Reading stage → Quiz stage → Result screen → [Leaderboard / Friends / Profile]

### State Management

Pure `useState` hooks — no Context or Redux. Key state variables:
- `screen` — controls which view renders
- `questions`, `userAnswers`, `matchState`, `headingState` — quiz state
- `currentUser`, `allUsers`, `socialData`, `leaderboards` — persistent app data

### Storage Layer (Dual Fallback)

All saves: write to `localStorage` first (instant), then fire-and-forget to Firebase via `/.netlify/functions/storage`. Reads try Firebase async and fall back to `localStorage` cache silently if offline.

**Firebase keys:**
- `rq-users-v6` — array of `{name, hash, games, joined}` user objects
- `rq-boards-v6` — leaderboard entries per level (A1–C2)
- `rq-social-v6` — per-user `{friends, requests, likes, challenges}`

### Scoring & XP System

- 6 question types: MCQ, Gap-Fill (word/sentence), Matching, Headings, Open Answer
- Per-question scoring via `scoreQuestion()` with type-specific logic; matching/headings award partial credit
- Final XP: `base_points × level_multiplier × 100 + time_bonus + streak_bonus` (streak: +50 XP after 3 correct in a row)
- Level multipliers: A1=1×, A2=1.5×, B1=2×, B2=2.5×, C1=3×, C2=4×

### Authentication

Username + `btoa(password)` (base64, not cryptographic). Session persisted as `rq-session` in `localStorage`. No OAuth. Auto-login on load if session username still exists in user list.

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
