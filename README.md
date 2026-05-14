# Reading Quest

An AI-powered English reading and comprehension platform for students, teachers, and exam candidates. Users pick a CEFR level (A1–C2), read a passage, answer a multi-type quiz, and earn XP — with a full teacher dashboard, social features, vocabulary system, and spaced repetition.

---

## Features

### Core Reading & Quiz
- **Custom topic generation** — Type any topic (e.g. "Formula 1 drivers") and Claude writes a fresh, level-appropriate passage with questions on demand. Leave blank for an instant library story.
- **Story library** — 100+ pre-written passages across A1–C2 covering science, culture, history, sport, technology, and more. Available instantly, no API call needed.
- **8 question types** — Multiple Choice, Gap Fill (word & sentence), Matching, Match Headings, Open Answer, True/False/Not Mentioned, Yes/No/Not Given.
- **Click-to-define** — Tap any word in the passage for definition, phonetic, part of speech, and example via Free Dictionary API. Results cached to avoid repeat requests.
- **Text-to-Speech** — Listen to passages and questions via Web Speech API. Playback rate selector (0.75×, 1×, 1.25×, 1.5×) and sentence-by-sentence playback mode.

### Reading Enhancements
- **Reading Speed Tracker** — Live WPM counter during reading; labeled stat on results (Beginner / Elementary / Intermediate / Advanced / Expert).
- **Difficulty Analyzer** — Flesch-Kincaid star rating (1–5), word count, estimated read time, and new-word count shown on the reading screen.
- **Vocab Heatmap** — Toggle to highlight uncommon words with amber dotted underline, using a ~800-word common-words baseline.
- **Sentence Translation** — Tap any sentence to translate it. Supports Uzbek, Russian, Turkish, Arabic, and German via MyMemory API.
- **Personal Favourites** — Heart toggle on reading screen; favourited stories appear at the top of the Library screen.

### Gamification & Progression
- **XP & scoring** — Per-question scoring with level multipliers (A1 = 1×, C2 = 4×), time bonus, and streak bonus (+50 XP per 3 consecutive correct answers).
- **User leveling** — 21 levels (0–190k+ XP) with real-time progress bar and level badge on all profiles.
- **Leaderboards** — Per-level rankings (A1–C2) stored in Firebase, cached locally. Each user appears once with their best score.
- **Weekly Challenge Board** — Per-week XP leaderboard with a 3-story weekly goal tracker.
- **Timed Challenge Mode** — Half the time limit, 1.5× XP multiplier for extra difficulty.
- **Story-specific head-to-head challenges** — Challenge a friend on the exact story you just completed; includes sender's score so the opponent knows the target.

### Vocabulary System
- **Spaced Repetition (SRS)** — Vocab deck with 4-interval review schedule (1, 3, 7, 14 days). Words auto-extracted from passages or manually added.
- **Vocabulary Review Game** — Three modes: Flashcard, Word Quiz (MCQ), Fill the Blank. Score tracked per session.
- **Auto-vocab prompt** — After quiz, uncommon words from the passage are offered for one-click addition to the SRS deck.
- **Missed-question SRS** — Questions answered incorrectly are automatically queued for spaced repetition review.

### Social
- **Friend system** — Send/accept friend requests, view friend profiles and game history.
- **Likes** — Heart a friend's profile.
- **Head-to-head comparison** — Color-coded stat bars (green = you, pink = friend).
- **Game history chart** — SVG line chart showing XP over time on personal and friend profiles.
- **Story Discussions** — Per-story flat comment threads (newest-first, capped at 50 comments, 1 post/user/day).

### Teacher Dashboard
- **Class management** — Create classes, invite students by username, view per-student stats.
- **Assignments** — Three assignment types: Library Story (pick from built-in), AI Topic (Claude generates a passage on a custom topic), Custom Text (paste any passage and get AI-generated questions).
- **Assignment tracking** — Per-student completion rates, scores, and time; trend indicators.
- **Announcements** — Post class-wide messages.
- **Student portfolio** — Shareable URL-encoded progress report per student.
- **Standards alignment** — Subject area and skill-level tags on library stories; filterable.
- **Class analytics dashboard** — Reading trends, question-type breakdown, at-risk flagging.

### Exercises
- **Error Hunt** — 5 deliberate errors injected into the passage (2 spelling, 1 grammar, 1 vocabulary, 1 tense). Tap words to identify them. Fully client-side — no API call.
- **Written summary** — Free-text passage summary with local scoring.
- **Placement test** — 10 adaptive questions that recommend a starting CEFR level.

### Account & UX
- **Auto-login** — Saved credentials (`localStorage`) for seamless return visits.
- **Dark theme, mobile-first** — Inline styles, responsive at 640 px breakpoint.
- **10 colour themes** — Indigo, Ocean, Forest, Magenta, Sunset Fire, Neon Green, Synthwave, Golden Hour, Cosmic Purple, Ice Crystal.
- **Word of the Day** — Rotating advanced vocabulary card on the home screen.
- **Smart Recommendations** — 3 library stories suggested based on the player's dominant CEFR level.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 7, Google Fonts (Inter, Outfit, JetBrains Mono) |
| AI | Claude Sonnet (`claude-sonnet-4-6`) via Anthropic SDK |
| Storage | Firebase Realtime Database (REST) via Netlify Function |
| Design System | CSS-in-JS with design tokens in `src/designSystem.js` |
| Hosting | Netlify (SPA + serverless functions) |
| Testing | Vitest (70 tests across 6 suites) |

---

## Project Structure

```
├── student-reading-quest.jsx      # Root React component — all screens & logic (~6100 lines)
├── src/
│   ├── main.jsx                   # Entry point — mounts <App /> in StrictMode
│   └── designSystem.js            # Design tokens: colors, spacing, typography
├── netlify/
│   └── functions/
│       ├── generate.js            # AI passage + quiz generation (Claude Sonnet)
│       ├── quiz-from-text.js      # Quiz generation from custom pasted text (Claude Sonnet)
│       ├── storage.js             # Firebase REST wrapper (GET / POST)
│       ├── auth.js                # User authentication
│       ├── register.js            # User registration
│       ├── users.js               # User management
│       └── _rateLimit.js          # Rate limiting helper
├── tests/
│   ├── setup.js
│   ├── generate.test.js           # 6 tests
│   ├── storage.test.js            # 9 tests
│   ├── auth.test.js
│   ├── register.test.js
│   ├── rateLimit.test.js
│   └── users.test.js
├── index.html
├── vite.config.js
└── netlify.toml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm i -g netlify-cli`)
- An [Anthropic API key](https://console.anthropic.com/) (separate from Claude.ai subscription)
- A [Firebase Realtime Database](https://firebase.google.com/) project

### Installation

```bash
git clone <repo-url>
cd student-reading-tool
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
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — get from [console.anthropic.com](https://console.anthropic.com/) |
| `FIREBASE_DB_URL` | Yes | Firebase Realtime Database base URL |

> **Note:** `ANTHROPIC_API_KEY` is your API billing account, entirely separate from a Claude.ai subscription.

---

## Running Locally

```bash
netlify dev        # Full stack: app on :8888, functions on /.netlify/functions/*
# or
npm run dev        # Vite only (:5173) — Netlify functions unavailable
```

Use `netlify dev` for full functionality including AI generation and storage.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all 70 unit tests with Vitest |

---

## Testing

```bash
npm test
```

70 tests across 6 suites covering all Netlify functions:

| Suite | Tests | Covers |
|---|---|---|
| `generate.test.js` | 6 | 405 on non-POST, 500 missing API key, 400 invalid JSON, 200 success, 500 API error, max_tokens forwarding |
| `storage.test.js` | 9 | Health check, 503 missing DB URL, GET/POST Firebase, null data, 400 missing key, 405 unsupported method, 500 fetch error |
| `auth.test.js` | — | Authentication flows |
| `register.test.js` | — | Registration flows |
| `rateLimit.test.js` | — | Rate limiting logic |
| `users.test.js` | — | User management |

---

## Deployment (Netlify)

1. Push the repo to GitHub.
2. Connect in the [Netlify dashboard](https://app.netlify.com/).
3. Set environment variables (`ANTHROPIC_API_KEY`, `FIREBASE_DB_URL`) under **Site settings → Environment variables**.
4. Netlify uses `netlify.toml` — build command `npm run build`, publish dir `dist/`, functions dir `netlify/functions/`.

---

## AI Architecture

Two modes in `generate.js`:

| Mode | Input | Output | Used by |
|---|---|---|---|
| Custom topic | `{level, topic, types}` | `{passage, questions}` | Home screen topic input, Teacher AI assignments |
| Generic proxy | `{messages:[{role,content}]}` | `{content:[{type,text}]}` | Direct API callers |

`quiz-from-text.js` handles teacher "paste your own text" assignments — takes a passage and returns questions only.

**Error Hunt** is entirely client-side (`injectErrors()` in the frontend) — no Claude call, no cost.

**Answer checking** is entirely client-side (`scoreQuestion()`) — no Claude call.

---

## Storage Architecture

Dual-write: `localStorage` first (instant), then fire-and-forget to Firebase. Reads try Firebase then fall back to local cache silently.

**Firebase keys:**

| Key | Contents |
|---|---|
| `rq-users-v6` | Array of `{ name, hash, games, joined, level, totalXp }` |
| `rq-boards-v6` | Leaderboard entries per level (A1–C2), deduplicated per user |
| `rq-social-v6` | Per-user `{ friends, requests, likes, challenges }` |
| `rq-favs-v1` | Favourited story IDs per user |
| `rq-weekly-v1` | Per-week XP leaderboard entries |
| `rq-discuss-v1` | Per-story comment threads `{ author, text, timestamp }` |
| `rq-vocab-v1` | Per-user SRS vocabulary deck |
| `rq-daily-v1` | Daily challenge data |
| `rq-classes-v1` | Teacher class data |
| `rq-assignments-v1` | Teacher assignments and student completions |

**Local-only keys:**

| Key | Contents |
|---|---|
| `rq-session` | Current logged-in username |
| `rq-credentials` | Auto-login credentials `{ name, hash }` |

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

---

## User Progression System

21 levels based on accumulated XP:

| Level | XP Required | Level | XP Required |
|---|---|---|---|
| 1 | 0 | 12 | 55,000 |
| 2 | 1,000 | 13 | 66,000 |
| 3 | 2,500 | 14 | 78,000 |
| 4 | 4,500 | 15 | 91,000 |
| 5 | 7,000 | 16 | 105,000 |
| 6 | 10,500 | 17 | 120,000 |
| 7 | 15,000 | 18 | 136,000 |
| 8 | 21,000 | 19 | 153,000 |
| 9 | 28,000 | 20 | 171,000 |
| 10 | 36,000 | 21 | 190,000+ |
| 11 | 45,000 | | (Max) |

---

## Recent Updates (v5.0)

### AI Backend
- Migrated from Google Gemini to **Claude Sonnet (`claude-sonnet-4-6`)** across all AI features
- Custom topic input on home screen now calls Claude to generate a real passage (was silently ignored before)
- AI assignment generation fixed — was returning 400 since the migration; now fully functional
- `generate.js` supports both generic proxy mode and structured `{level, topic, types}` mode

### Codebase Cleanup
- Removed 5 dead Netlify functions: `design.js`, `errorcorrect.js`, `test-api.js`, `tutor.js`, `writefeedback.js`
- Error Hunt game replaced with pure-JS `injectErrors()` — no API call, no cost, works offline
- Removed dead `DESIGN_API` variable from frontend

### Previously Released
- Story-specific head-to-head challenges with sender score and 24h expiry
- Spaced repetition for missed quiz questions (SRS_INTERVALS: 1, 3, 7, 14 days)
- Teacher dashboard: class analytics, assignments, portfolio links, announcements
- Timed challenge mode (0.5× time, 1.5× XP)
- Student portfolio with shareable URL-encoded report
- Standards alignment tags and library filtering
- Story Discussions (per-story comment threads)
- Weekly Challenge Board
- Vocabulary Review Game (Flashcard, MCQ, Fill the Blank)
- Reading Speed Tracker, Difficulty Analyzer, Sentence Translation, Heatmap
