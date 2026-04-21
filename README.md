# Reading Quest

An AI-powered language reading and quiz app for students learning English. Users pick a CEFR level (A1–C2), read a Claude-generated passage, answer a 6-question quiz, and earn XP — with a leaderboard and social features.

---

## Features

- **AI-generated content** — Each session calls Claude (`claude-sonnet-4-6`) to produce a unique reading passage and quiz tailored to the chosen level.
- **6 question types** — Multiple Choice, Gap Fill (word & sentence), Matching, Match Headings, Open Answer.
- **XP & scoring system** — Per-question scoring with level multipliers (A1 = 1×, C2 = 4×), time bonuses, and streak bonuses (+50 XP after 3 correct in a row).
- **Leaderboards** — Per-level rankings stored in Firebase and cached locally.
- **Social layer** — Friend requests, likes, and head-to-head challenges between users.
- **Persistent accounts** — Username + password (base64) auth with auto-login via `localStorage`.
- **Dark theme, mobile-first** — Inline styles, responsive at 640 px breakpoint.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) via Netlify Function |
| Storage | Firebase Realtime Database (REST) via Netlify Function |
| Hosting | Netlify (SPA + serverless functions) |
| Testing | Vitest |

---

## Project Structure

```
├── student-reading-quest.jsx   # Root React component — all screens & logic (~1100 lines)
├── src/
│   └── main.jsx                # Entry point — mounts <App /> in StrictMode
├── netlify/
│   └── functions/
│       ├── generate.js         # Proxies to Anthropic API
│       └── storage.js          # Firebase REST wrapper (GET / POST)
├── tests/
│   ├── setup.js                # Vitest setup — patches require.cache to mock SDK
│   ├── generate.test.js        # Unit tests for generate.js (6 tests)
│   └── storage.test.js         # Unit tests for storage.js (9 tests)
├── index.html
├── vite.config.js
└── netlify.toml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Netlify CLI](https://docs.netlify.com/cli/get-started/) install (`npm i -g netlify-cli`)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Firebase Realtime Database](https://firebase.google.com/) project

### Installation

```bash
git clone <repo-url>
cd "Student Reading Tool"
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_DB_URL=https://your-project-default-rtdb.firebaseio.com
```

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Key for the Anthropic API |
| `FIREBASE_DB_URL` | Yes | Firebase Realtime Database base URL |

---

## Running Locally

```bash
netlify dev        # Full stack: app on :8888, functions on /.netlify/functions/*
# or
npm run dev        # Vite only (:5173) — Netlify functions unavailable
```

> Use `netlify dev` for full functionality including AI generation and storage.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all unit tests with Vitest |

---

## Testing

Unit tests cover the two Netlify functions:

```bash
npm test
```

**`tests/generate.test.js`** — 6 tests for `netlify/functions/generate.js`:
- 405 on non-POST requests
- 500 when `ANTHROPIC_API_KEY` is missing
- 400 on invalid JSON body
- 200 with correct response on success
- 500 when the Anthropic SDK throws
- Correct model/max_tokens forwarding

**`tests/storage.test.js`** — 9 tests for `netlify/functions/storage.js`:
- Health check (GET with no key)
- 503 when `FIREBASE_DB_URL` is missing
- GET with key — fetches and returns data from Firebase
- GET returns null when Firebase has no data
- POST — saves data via Firebase PUT
- 400 when key is missing
- 405 for unsupported methods
- 500 when fetch throws

> **Note:** `generate.js` is a CJS module. Vitest's `vi.mock` doesn't intercept CJS `require()`. The test setup patches Node's `require.cache` directly in `tests/setup.js` to inject the mock SDK before any test imports the handler.

---

## Deployment (Netlify)

1. Push the repo to GitHub.
2. Connect the repo in the [Netlify dashboard](https://app.netlify.com/).
3. Set the environment variables (`ANTHROPIC_API_KEY`, `FIREBASE_DB_URL`) under **Site settings → Environment variables**.
4. Netlify uses `netlify.toml` — build command is `npm run build`, publish dir is `dist/`, functions dir is `netlify/functions/`.

---

## Storage Architecture

All writes go to `localStorage` first (instant), then fire-and-forget to Firebase. Reads try Firebase first, then fall back to the local cache silently.

**Firebase keys:**

| Key | Contents |
|---|---|
| `rq-users-v6` | Array of `{ name, hash, games, joined }` |
| `rq-boards-v6` | Leaderboard entries per level (A1–C2) |
| `rq-social-v6` | Per-user `{ friends, requests, likes, challenges }` |

---

## Scoring Reference

| Level | Multiplier | Time Limit | Time Bonus |
|---|---|---|---|
| A1 | 1× | 150 s | 200 XP |
| A2 | 1.5× | 150 s | 200 XP |
| B1 | 2× | 180 s | 300 XP |
| B2 | 2.5× | 180 s | 300 XP |
| C1 | 3× | 210 s | 400 XP |
| C2 | 4× | 210 s | 400 XP |

Final XP = `base_points × multiplier × 100 + time_bonus + streak_bonus`

Streak bonus: +50 XP after every 3 consecutive correct answers.
