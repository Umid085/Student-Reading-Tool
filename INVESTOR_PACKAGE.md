# Student Reading Quest — Investor & Strategy Package
**Confidential | Version 1.0 | May 2026**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [The Problem We Solve](#3-the-problem-we-solve)
4. [Product Overview](#4-product-overview)
5. [Market Analysis](#5-market-analysis)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Our Differentiation](#7-our-differentiation)
8. [Product Architecture & Module Structure](#8-product-architecture--module-structure)
9. [Technology Stack](#9-technology-stack)
10. [Business Model & Revenue Streams](#10-business-model--revenue-streams)
11. [Go-to-Market & Launch Plan](#11-go-to-market--launch-plan)
12. [Financial Projections & Expenditure Plan](#12-financial-projections--expenditure-plan)
13. [Team Structure](#13-team-structure)
14. [Traction & Current Status](#14-traction--current-status)
15. [Roadmap](#15-roadmap)
16. [Investment Ask](#16-investment-ask)
17. [Risk Analysis](#17-risk-analysis)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

**Student Reading Quest** is an AI-powered English reading and comprehension platform that serves three distinct user groups through a single, unified product:

- **Individual learners** who want to improve their CEFR-level reading skills at their own pace
- **Classroom teachers** who need to assign, track, and evaluate student reading progress
- **Exam candidates** preparing for IELTS, TOEFL, Cambridge, and other international certifications

The platform uses large language models to generate unlimited, curriculum-aligned reading passages and six-question comprehension quizzes — eliminating the content bottleneck that constrains every competing product. A gamified XP and leveling system, social features, spaced repetition vocabulary review, and an AI tutor keep learners engaged beyond a single session.

**The opportunity:** The global English language learning market is valued at $62 billion (2022), growing at 18.7% CAGR toward $115 billion by 2030. No incumbent product specifically addresses AI-generated, CEFR-aligned reading comprehension at scale across both consumer and classroom markets.

**We are seeking $1.2M seed funding** to complete the product, acquire the first 50,000 active users, and close the first 200 institutional (school/language school) contracts.

---

## 2. Vision & Mission

### Vision
A world where every English learner — regardless of location, income, or access to qualified teachers — can develop genuine reading fluency at exactly the right level of challenge.

### Mission
Deliver personalized, AI-generated reading practice that adapts to each learner's CEFR level, measures comprehension accurately, and gives teachers the visibility they need to intervene before a student falls behind.

### Core Belief
Reading comprehension is the single highest-leverage skill in language acquisition. It improves vocabulary, grammar, writing, and listening simultaneously. Yet it is the most underserved category in the language-learning app market, which is dominated by vocabulary flashcards and speaking exercises.

---

## 3. The Problem We Solve

### For Individual Learners

| Problem | Current "solution" | Why it fails |
|---|---|---|
| Finding reading material at exactly the right level | Searching Google for "B1 English texts" | Content is random, not comprehension-tested |
| Knowing what words they don't know | Looking words up individually | Breaks flow; forgotten by next day |
| Staying motivated to read daily | Nothing specific | No streak, XP, or social accountability |
| Knowing if they're improving | Taking a test once a year | No continuous, granular feedback |

### For Classroom Teachers

| Problem | Current "solution" | Why it fails |
|---|---|---|
| Assigning differentiated reading by level | Printing multiple worksheets | Unsustainable; no tracking |
| Seeing which students understood the text | Collecting paper quizzes | Slow; can't act on data in real time |
| Generating fresh content for each unit | Searching textbook libraries | Static; mismatches student level |
| Identifying at-risk students early | Waiting for exam results | Too late to intervene |

### For Exam Candidates

| Problem | Current "solution" | Why it fails |
|---|---|---|
| Practicing IELTS/TOEFL reading passages | Buying physical practice books | Finite; no adaptive difficulty |
| Understanding their current band score | Full mock exam every month | Expensive and infrequent |
| Targeting weak question types | Generic practice apps | Not question-type-specific analytics |

---

## 4. Product Overview

### Core User Journey

```
Register / Placement Test
         ↓
    Home Screen
  (Level selector + Daily Plan)
         ↓
  Reading Stage
  (AI passage + WPM + Heatmap + Translation + Audio)
         ↓
    Quiz Stage
  (6 question types + Timer + Challenge Mode)
         ↓
   Result Screen
  (XP + Stars + WPM label + Writing Feedback + Tutor)
         ↓
  [Leaderboard / Vocab / Friends / Teacher Dashboard / Exam Report]
```

### The 30 Product Screens

| Screen | Description |
|---|---|
| `auth` | Registration and login |
| `home` | Level selector, daily plan, recommendations, pending challenges |
| `reading` | AI-generated passage with WPM counter, difficulty card, heatmap, translation, audio |
| `quiz` | 6-type quiz with optional timer |
| `result` | Score, XP, badges, writing challenge, error hunt, story challenges |
| `leaderboard` | Per-level global ranking |
| `dailyleaderboard` | Today's scores only |
| `weekly` | Weekly XP challenge board |
| `library` | 60+ pre-built stories organized by level and subject |
| `vocab` | Vocabulary notebook with SRS flashcards |
| `vocabgame` | Flashcard / MCQ / fill-the-blank vocab practice |
| `friends` | Friend search, requests, profiles, head-to-head stats |
| `discuss` | Per-story comment threads |
| `profile` | Personal stats, badges, XP chart, portfolio |
| `portfolio` | Shareable achievement card |
| `portfolioShare` | Public-facing portfolio view (no login required) |
| `history` | Full game history with filtering |
| `analytics` | Personal performance analytics |
| `badges` | Badge collection and progress |
| `goals` | Weekly learning goals |
| `quotes` | Saved text highlights from passages |
| `tutor` | AI tutor chat (contextual to current passage) |
| `writefeedback` | Submit passage summary → AI feedback |
| `errorcorrect` | Find 5 deliberate errors in the passage |
| `teacherDashboard` | Create classes, write announcements, assign stories |
| `classView` | Student roster, individual scores, assignment status |
| `classAnalytics` | Completion matrix, at-risk detection, level distribution |
| `report` | Shareable score report card |
| `vocabgame` | Spaced repetition game modes |
| `loading` | AI generation loading screen |

### 10 Core Feature Modules

**Module 1 — Reading Engine**
AI-generated passages at any CEFR level (A1–C2) on any topic, with configurable question types. No content runs out.

**Module 2 — Adaptive Difficulty**
System tracks last 10 games. Suggests level up when average > 85%; level down when average < 50%. Placement test on first login.

**Module 3 — Vocabulary System**
Click-to-define any word. Auto-extract uncommon words post-reading. Spaced repetition review (1/3/7/14-day intervals). Anki/CSV export.

**Module 4 — Reading Analytics**
Live WPM tracking. Flesch-Kincaid difficulty score. Estimated read time. New-word count per passage.

**Module 5 — Social & Gamification**
XP, 21-level progression, streaks, badges, weekly challenges, friend leaderboards, story-specific head-to-head challenges.

**Module 6 — Teacher Tools**
Class management, assignment creation (library stories or AI-generated), due dates, completion tracking, class analytics dashboard, at-risk alerts.

**Module 7 — Exam Prep**
Timed exam mode, IELTS-style question types (TFNG, match headings), band score prediction, performance-by-question-type breakdown.

**Module 8 — AI Extras**
Tutor chat (passage-contextual), writing feedback, error-hunt mini-game, pronunciation practice, sentence translation (6 languages).

**Module 9 — Portfolio & Sharing**
Shareable portfolio card (best score, WPM, level, favorite topic), shareable score report. No login required to view.

**Module 10 — Content Library**
60+ hand-crafted stories across all 6 CEFR levels, 12 subject categories. Favorites, SRS review queue, discussion threads.

---

## 5. Market Analysis

### 5.1 Total Addressable Market (TAM)

| Segment | Size (2025 est.) | Source |
|---|---|---|
| Global EdTech market | $340B | Grand View Research 2024 |
| Language learning apps | $21B | Mordor Intelligence 2024 |
| English language learning (total) | $62B | Global Market Insights |
| K-12 classroom EdTech tools | $18B | HolonIQ |
| Test preparation (IELTS/TOEFL/Cambridge) | $4.8B | Allied Market Research |

**Serviceable Addressable Market (SAM):** $6.2B
- English reading comprehension apps (consumer + classroom)
- CEFR-aligned learning tools
- Secondary/adult English as a Second/Foreign Language (ESL/EFL)

**Serviceable Obtainable Market (SOM) — Year 3:** $62M
- 0.5M paid individual subscribers at $10/month (average $7 blended)
- 2,000 institutional contracts at ~$800/year average

---

### 5.2 Market Drivers

**1. Global demand for English proficiency is accelerating**
- 1.5 billion people currently learning English globally (British Council, 2023)
- English is the required language for 70%+ of Fortune 500 job postings worldwide
- 3.5M IELTS tests administered annually; 500K TOEFL; 5.5M Cambridge exams

**2. AI has fundamentally changed content economics**
- Previously: producing a reading passage + quiz required a curriculum writer ($150–300/hour)
- Now: Claude/Gemini generates passage + 6-question quiz in 3 seconds at $0.002
- This means infinite content at effectively zero marginal cost — a structural advantage no pre-AI competitor can replicate quickly

**3. Post-pandemic classroom digitization is permanent**
- 73% of K-12 teachers now use at least one EdTech tool daily (ISTE, 2024)
- School technology budgets increased 34% from 2020 to 2024
- Teachers are actively looking for tools that reduce prep work while increasing student visibility

**4. CEFR has become the global standard**
- Adopted by 47 European countries as the official language framework
- Increasingly required in Asia (Japan, South Korea, Vietnam, Indonesia) for academic and job applications
- Directly maps to exam scores: A2=IELTS 3.5, B1=IELTS 4.0–5.0, B2=IELTS 5.5–6.5, C1=IELTS 7.0–8.0

---

### 5.3 Target Customer Segments

**Segment A — The Self-Study Adult Learner (largest by volume)**
- Age 18–40, learning English for work, immigration, or personal enrichment
- Currently uses: Duolingo, YouTube, grammar books
- Underserved by: structured reading practice at their exact level
- Willingness to pay: $8–15/month
- Global population: ~400M potential users

**Segment B — The Language School Student (highest LTV)**
- Enrolled in a private language school or university EFL course
- Teacher assigns platforms; student has no choice
- School pays: $300–1,200/year per class
- Global population: ~80M enrolled students

**Segment C — The Exam Candidate (most urgent need)**
- Preparing for IELTS, TOEFL, Cambridge FCE/CAE, PTE
- Has a deadline; highly motivated; willing to pay premium
- Willingness to pay: $20–40/month or $150–300 one-time
- Global population: ~9M active candidates at any given time

**Segment D — The K-12 ESL/EFL Teacher (procurement decision-maker)**
- Secondary school English teacher, often outside native English-speaking countries
- Currently uses: textbook photocopies, BBC Learning English, static worksheets
- Needs: differentiated content by level, automatic grading, progress visibility
- School budget: $500–5,000/year for digital tools

---

### 5.4 Geographic Priority Markets

| Priority | Markets | Rationale |
|---|---|---|
| Tier 1 (launch) | UK, Australia, UAE, Singapore | English proficiency demand + willingness to pay + IELTS culture |
| Tier 2 (Year 1) | Turkey, Vietnam, Indonesia, Poland | Large CEFR-aligned school systems; strong digital EdTech adoption |
| Tier 3 (Year 2) | Brazil, Mexico, Saudi Arabia, Japan | High volume, require localized marketing |
| Tier 4 (Year 3) | India, Nigeria, Egypt | Massive volume but price-sensitive; freemium/institution focus |

---

## 6. Competitive Landscape

### 6.1 Direct Competitors

| Competitor | Focus | Strengths | Weaknesses vs. Us |
|---|---|---|---|
| **Duolingo** | Gamified vocab/grammar | 500M users, massive brand | No reading comprehension; not CEFR-specific; no classroom tools |
| **ReadTheory** | Reading comprehension | 10M users, free for teachers | Static content library; no AI generation; no gamification |
| **Newsela** | Classroom reading | 30M users; leveled real articles | English-only static news; no ESL focus; no exam prep |
| **CommonLit** | K-12 reading | 30M students; teacher-focused | US-centric; no EFL/ESL; no AI content |
| **Quizlet** | Flashcards/vocab | 60M users; strong brand | Vocab only; no reading; no passage comprehension |
| **Babbel** | Structured language courses | 10M paying subscribers | Courses, not comprehension; no classroom tools |
| **IELTS.org / Cambridge practice** | Exam prep only | Official materials | Finite static content; no adaptive difficulty |
| **Busuu** | Language courses + community | 120M users | Grammar/speaking focus; no reading engine; limited classroom use |

### 6.2 Indirect Competitors

- **ChatGPT / Claude direct use** — some learners ask AI for passages directly; no gamification, tracking, or curriculum
- **YouTube + podcasts** — listening/speaking focus; no reading comprehension
- **Physical textbooks** — still dominant in many markets; zero adaptivity
- **Private tutors** — highest quality; not scalable; $30–80/hour

### 6.3 Competitive Matrix

| Feature | Us | Duolingo | ReadTheory | Newsela | Quizlet |
|---|---|---|---|---|---|
| AI-generated content | ✅ Unlimited | ❌ | ❌ | ❌ | ❌ |
| CEFR-aligned | ✅ A1–C2 | Partial | Partial | ❌ | ❌ |
| Reading comprehension focus | ✅ | ❌ | ✅ | ✅ | ❌ |
| 6+ question types | ✅ | ❌ | Partial | ❌ | ❌ |
| Teacher dashboard | ✅ | ❌ | ✅ | ✅ | Partial |
| Exam prep mode | ✅ (roadmap) | ❌ | ❌ | ❌ | ❌ |
| Vocabulary SRS | ✅ | Partial | ❌ | ❌ | ✅ |
| Social / challenges | ✅ | ✅ | ❌ | ❌ | Partial |
| AI tutor | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offline / mobile app | ❌ (roadmap) | ✅ | ✅ | ✅ | ✅ |
| Free tier | ✅ | ✅ | ✅ | Partial | ✅ |

---

## 7. Our Differentiation

### The Three Unfair Advantages

**1. Infinite, personalized content at near-zero marginal cost**
Every competitor is constrained by a fixed content library. We generate a new passage + quiz on demand, calibrated to any CEFR level, on any topic the learner chooses. A learner who completes every story in ReadTheory's library hits a wall. Our library is effectively infinite.

*Cost reality:* One Claude API call (passage + questions) costs approximately $0.003. A subscription user doing one session per day costs $0.09/month in AI API fees — effectively free at scale.

**2. The only product that genuinely serves three audiences from one codebase**
We are simultaneously a consumer app (solo learner), a classroom management tool (teacher), and an exam prep platform. This is not a marketing claim — the features exist. This means:
- Teachers discover us → bring their classes → students become personal users
- Students become teachers → bring their students
- Exam candidates complete their exam → become hobbyist learners

**3. CEFR alignment is a distribution moat, not just a feature**
The Common European Framework of Reference is the official standard in 47 countries. Language schools, universities, and ministries of education require CEFR documentation. By building CEFR alignment into the product's core (not as an afterthought), we can be purchased and recommended by institutions that require it — competitors using proprietary level systems cannot.

---

## 8. Product Architecture & Module Structure

### 8.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React SPA (Vite)                    │
│              student-reading-quest.jsx                │
│          30 screens · 161 state variables             │
│              All logic inline (no Redux)              │
└───────────────┬─────────────────┬────────────────────┘
                │                 │
     ┌──────────▼────────┐  ┌────▼──────────────────┐
     │  Netlify Functions │  │    Client-side APIs    │
     │                   │  │                        │
     │  generate.js      │  │  MyMemory (translation)│
     │  → Claude AI      │  │  Free Dictionary API   │
     │  → Gemini AI      │  │  Web Speech API (TTS)  │
     │                   │  │  SpeechRecognition API │
     │  storage.js       │  └────────────────────────┘
     │  → Firebase REST  │
     │                   │
     │  errorcorrect.js  │
     │  → Claude AI      │
     └──────────┬────────┘
                │
     ┌──────────▼────────────────────────────────────┐
     │           Firebase Realtime Database           │
     │                                               │
     │  rq-users-v6      User accounts + game history│
     │  rq-boards-v6     Leaderboard entries by level│
     │  rq-social-v6     Friends, challenges, social │
     │  rq-favs-v1       Favorited story IDs         │
     │  rq-weekly-v1     Weekly XP board             │
     │  rq-discuss-v1    Story discussion threads    │
     │  rq-vocab-v1      Vocabulary notebooks        │
     │  rq-classes-v1    Teacher classes + students  │
     │  rq-assignments-v1 Assignments + completions  │
     └───────────────────────────────────────────────┘

     localStorage (dual-write fallback for all keys)
```

### 8.2 Module Breakdown

---

#### MODULE 1 — Authentication & User Management

**Status:** ✅ Complete

**Components:**
- Registration (username + hashed password)
- Login with auto-login via saved session
- User object: `{ name, hash, games[], joined, level, totalXp, badges[], goals[] }`
- Session persistence via `localStorage` (`rq-session`, `rq-credentials`)

**Known limitations:**
- Base64 password hash (not bcrypt) — acceptable for MVP; upgrade before institutional launch
- No email verification — users can create throwaway accounts
- No OAuth (Google/Apple login) — on roadmap

---

#### MODULE 2 — Content Generation Engine

**Status:** ✅ Complete

**Flow:**
1. User selects CEFR level (A1–C2) + topic or picks from subject categories
2. Frontend calls `/.netlify/functions/generate` with `{ level, topic, types[] }`
3. Netlify function calls Claude API with a structured prompt
4. Returns `{ passage: string, questions: Question[] }` JSON
5. Frontend renders reading screen; questions ready for quiz stage

**Question types generated:**
| Type | Description |
|---|---|
| `mcq` | Multiple choice (4 options) |
| `gap_word` | Fill blank from 4-word options |
| `gap_sentence` | Fill blank from 4-sentence options |
| `matching` | Match 4 items to 4 descriptions |
| `headings` | Match 4 paragraph headings |
| `qa` | Open-answer scored by keyword matching |
| `tfnm` | True / False / Not Mentioned (IELTS-style) |
| `ynng` | Yes / No / Not Given (IELTS-style) |

**Cost model:**
- Average tokens per generation: ~1,200 input + ~800 output = ~2,000 tokens
- Cost at Claude Sonnet pricing: ~$0.003 per generation
- At 100,000 generations/month: $300/month

---

#### MODULE 3 — Quiz & Scoring Engine

**Status:** ✅ Complete

**Scoring logic (`scoreQuestion()`):**
- MCQ/Gap/TFNM/YNNG: binary 1/0 per question
- Matching/Headings: partial credit (score/total pairs)
- Open Answer: keyword hit-rate scoring (≥50% keywords = full credit)

**XP formula:**
```
finalXP = (correctAnswers × levelMultiplier × 100)
         + timeBonus
         + (streak ≥ 3 ? 50 : 0)
         × (challengeMode ? 1.5 : 1.0)

Level multipliers: A1=1× A2=1.5× B1=2× B2=2.5× C1=3× C2=4×
Time bonuses: A1/A2=200 B1/B2=300 C1/C2=400 XP
```

**Result object stores:**
`level, score, total, xp, pct, timeSecs, wpm, storyId, typeStats, wasDaily, wasChallenge`

---

#### MODULE 4 — Reading Enhancement Tools

**Status:** ✅ Complete

| Tool | Description |
|---|---|
| WPM Tracker | Live words-per-minute counter while reading; labeled on result (Beginner/Expert) |
| Difficulty Analyzer | Flesch-Kincaid grade, word count, estimated read time, new-word count |
| Vocabulary Heatmap | Uncommon words highlighted amber; 800-word common-word filter |
| Sentence Translation | Click sentence → translate via MyMemory API; 6 target languages |
| Audio Controls | Web Speech API TTS; playback speed 0.75×–1.5×; sentence-by-sentence mode |
| Click-to-Define | Tap any word → phonetic, definition, example from Free Dictionary API |

---

#### MODULE 5 — Vocabulary System

**Status:** ✅ Complete

**Storage:** `rq-vocab-v1` keyed by username

**Spaced Repetition Schedule:** 1 → 3 → 7 → 14 days (SRS_INTERVALS)

**Word states:** `new → learning → review → known`

**Game modes (vocabgame screen):**
1. Flashcard (flip to reveal)
2. Word Quiz (MCQ from vocab list)
3. Fill the Blank (type the word)

**Export formats:** CSV, Anki (.txt)

---

#### MODULE 6 — Social & Gamification

**Status:** ✅ Complete

**Storage:** `rq-social-v6` keyed by username

| Feature | Description |
|---|---|
| Friends | Send/accept friend requests; view friend profiles and XP charts |
| Likes | Like a friend's profile (one like per user) |
| Generic challenges | Challenge friend to beat a score at a given level within 24h |
| Story challenges | Challenge friend to beat your exact score on a specific library story; auto-launches story on accept; head-to-head result card |
| Weekly board | Per-week XP leaderboard; weekly goal (3 stories); `rq-weekly-v1` |
| Story discussions | Per-story comment threads; 1 post/user/day; newest-first; cap 50 |
| Badges | 30+ badges across categories: streaks, levels, speed, social, special |
| Goals | Weekly story/XP/streak targets with progress visualization |
| Leaderboards | Per-level global ranking; daily leaderboard; personal history chart |

---

#### MODULE 7 — Teacher Tools

**Status:** ✅ Complete (v1)

**Storage:** `rq-classes-v1`, `rq-assignments-v1`

| Feature | Description |
|---|---|
| Class management | Create class, get join code, write announcements |
| Student roster | See all students, their level, last active date, total XP |
| Assignment creation | Assign library story, AI-generated story, or custom text passage |
| Due dates | Assignments expire; UI shows overdue state |
| Completion tracking | Per-student completion with score and date |
| Class analytics | Completion matrix (student × assignment); at-risk alerts (inactive 7+ days); level distribution; weak question types per student |
| Custom text | Teacher pastes own passage; AI generates quiz questions for it |

**Gaps (on roadmap):**
- Teacher cannot see individual student quiz answers (only % score)
- No assignment feedback/comments from teacher to student
- No CSV/PDF export of class results

---

#### MODULE 8 — Exam Prep

**Status:** 🟡 Partial (roadmap)

**Currently in product:**
- TFNM and YNNG question types (IELTS-style)
- Timed challenge mode (50% time pressure, 1.5× XP)
- Performance-by-question-type breakdown on result screen

**On roadmap:**
- Dedicated IELTS exam mode (60-min timer, 3 passages, authentic format)
- Band score predictor (linear regression on last 10 games)
- Mock test history screen
- Cambridge FCE/CAE passage style

---

#### MODULE 9 — AI Extras

**Status:** ✅ Complete

| Feature | Description |
|---|---|
| AI Tutor | Chat with Claude about the passage just read; context-aware Q&A |
| Writing Feedback | Write a 100-word summary; AI scores it on accuracy, grammar, style |
| Error Hunt | AI hides 5 errors in the passage; student finds and taps them |
| Pronunciation | Text-to-speech sentence playback; student records and compares |

---

#### MODULE 10 — Content Library

**Status:** ✅ Complete (v1)

**Current state:** 60 hand-crafted stories across:
- 6 CEFR levels (A1–C2)
- 12 subject categories: Nature, Science, Culture, Technology, History, Health, Sports, Business, Arts, Life, Travel, Society
- Each with: passage, 3 quiz questions, level, topic label, subject metadata

**On roadmap:** Expand to 200+ stories; community submission; teacher-uploaded stories

---

### 8.3 Data Flow Diagram

```
User Action
    │
    ▼
React State Update (useState)
    │
    ├──► localStorage write (instant, synchronous)
    │
    └──► Firebase REST API call (async, fire-and-forget)
              │
              ├── Success → state already correct, no action
              └── Failure → silent; localStorage is source of truth
```

All reads attempt Firebase first, fall back to localStorage on timeout or error. This gives the app near-instant perceived performance while maintaining multi-device sync when online.

---

## 9. Technology Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free (open source) |
| Hosting | Netlify (SPA + serverless) | Free tier → $19/month Pro |
| AI — Content | Claude Sonnet (Anthropic) | ~$0.003/generation |
| AI — Extras | Claude Sonnet (Anthropic) | ~$0.002/call |
| Database | Firebase Realtime DB | Free → $25/month Blaze |
| Translation | MyMemory API | Free (5,000 req/day free tier) |
| Dictionary | Free Dictionary API | Free |
| TTS/STT | Web Speech API (browser) | Free |
| Auth | Custom (base64 hash) | Free |
| CI/CD | GitHub Actions + Netlify | Free |
| Testing | Vitest | Free |
| Analytics (planned) | Mixpanel / PostHog | $0–25/month |

**Total current monthly infrastructure cost: ~$0 (free tiers)**
**Projected at 10,000 active users: ~$450/month**
**Projected at 100,000 active users: ~$3,200/month**

---

## 10. Business Model & Revenue Streams

### 10.1 Pricing Tiers

**Consumer (B2C)**

| Tier | Price | What's included |
|---|---|---|
| Free | $0 | 3 AI generations/day; 30 library stories; basic vocab (50 words); no teacher tools |
| Plus | $9.99/month | Unlimited AI generations; full library; unlimited vocab; exam mode; portfolio |
| Annual | $79/year | All Plus features; 34% discount vs monthly |

**Institutional (B2B)**

| Tier | Price | What's included |
|---|---|---|
| Teacher | $6/month per teacher | 1 class (30 students); assignment tools; basic analytics |
| School | $299/month | Unlimited teachers and classes; full analytics; CSV export; SLA support |
| District | Custom ($3,000–15,000/year) | Multi-school admin; LMS integration (Canvas/Moodle); white-label option |

**Exam Prep (B2C premium)**

| Product | Price | Description |
|---|---|---|
| IELTS Prep Pack | $29 one-time | 30-day structured plan; band score predictor; mock exam report |
| TOEFL Prep Pack | $29 one-time | Same structure, TOEFL question formats |
| Monthly Exam Mode | $14.99/month | Unlimited exam-mode sessions; weekly band score update |

---

### 10.2 Unit Economics (Projections)

| Metric | Consumer Plus | School Contract |
|---|---|---|
| Average Revenue per User/Year | $96 | $3,600 |
| AI Cost per User/Year (100 sessions/month) | $3.60 | $3.60 |
| Hosting Cost per User/Year | $0.50 | $0.50 |
| **Gross Margin** | **~96%** | **~99%** |
| Estimated Churn (monthly) | 5% | 8% (annual) |
| LTV (24-month avg) | $180 | $8,280 |
| CAC Target | $15–25 | $200–400 |
| **LTV:CAC** | **7–12×** | **20–41×** |

---

### 10.3 Revenue Mix Targets

| Year | Consumer Sub | School Contracts | Exam Packs | Total ARR |
|---|---|---|---|---|
| Y1 | $180K | $120K | $40K | **$340K** |
| Y2 | $720K | $480K | $180K | **$1.38M** |
| Y3 | $2.1M | $1.5M | $600K | **$4.2M** |

---

## 11. Go-to-Market & Launch Plan

### Phase 0 — Pre-Launch (Months 1–2)

**Goal:** Product-ready; first 500 beta users; 5 pilot schools

**Actions:**
- [ ] Fix auth security (bcrypt password hashing)
- [ ] Add mobile PWA manifest and offline support
- [ ] Complete placement test flow
- [ ] Teacher onboarding video (3-minute Loom)
- [ ] Landing page with waitlist + SEO content
- [ ] Recruit 5 language schools for free pilot (UAE, UK, Turkey, Vietnam, Poland)
- [ ] Reddit/Discord seeding: r/languagelearning, r/EnglishLearning, IELTS subreddits
- [ ] ProductHunt preparation (assets, description, launch day community)

**KPIs:** 500 registered users; 5 pilot school agreements; <2s load time

---

### Phase 1 — Soft Launch (Months 3–4)

**Goal:** 5,000 active users; validate retention; 20 paying schools

**Actions:**
- [ ] ProductHunt launch (target: Top 5 Product of the Day)
- [ ] IELTS/TOEFL candidate communities: Facebook groups, Telegram channels, YouTube comment seeding
- [ ] Partner with 3 language learning YouTubers (10K–200K subscribers) for honest review
- [ ] Teacher referral program: refer a colleague → 3 months free
- [ ] App Store / Play Store listing (PWA wrapper via Capacitor)
- [ ] Free tier becomes sticky: daily streak email reminders
- [ ] First paid ads test: Google search ("IELTS reading practice", "B2 English reading")

**Budget:** $15,000 (ads $8K, influencers $5K, tools $2K)

**KPIs:** 5,000 MAU; 300 paid subscribers; D7 retention ≥ 35%; 20 school contracts

---

### Phase 2 — Growth (Months 5–9)

**Goal:** 25,000 MAU; $30K MRR; 100 school contracts

**Actions:**
- [ ] SEO content strategy: publish 50 blog posts targeting IELTS/CEFR/English reading keywords
- [ ] B2B direct sales: email outreach to 500 language schools in Tier 1 markets
- [ ] Partner with English language school chains (e.g. British Council, IH Network, EF Education)
- [ ] IELTS exam prep mode fully launched; position as alternative to expensive prep books
- [ ] Localized landing pages in Turkish, Vietnamese, Polish, Arabic
- [ ] Free teacher plan (1 class, basic features) to reduce B2B friction
- [ ] Case study: publish results from 5 pilot schools

**Budget:** $80,000 (content/SEO $20K, B2B sales $25K, ads $30K, localization $5K)

**KPIs:** 25,000 MAU; $30K MRR; 100 school contracts; NPS ≥ 45

---

### Phase 3 — Scale (Months 10–18)

**Goal:** 100,000 MAU; $150K MRR; 500 school contracts

**Actions:**
- [ ] LMS integration (Canvas, Moodle, Google Classroom)
- [ ] Native iOS + Android apps (Capacitor wrapper + native notifications)
- [ ] Hire dedicated sales rep for MENA and Southeast Asia regions
- [ ] District-level deals in UK, Australia, UAE
- [ ] White-label offering for large school chains
- [ ] Affiliate program: language teachers earn 20% commission
- [ ] Press coverage: target TechCrunch Education, EdSurge, Times Higher Education

**Budget:** $350,000 (team $200K, sales $80K, marketing $50K, infrastructure $20K)

**KPIs:** 100,000 MAU; $150K MRR; 500 schools; Series A readiness

---

### Channel Prioritization

| Channel | Cost | Fit | Priority |
|---|---|---|---|
| IELTS/TOEFL community seeding | Low | Very High | 🔴 Do first |
| SEO (reading comprehension + IELTS keywords) | Medium | Very High | 🔴 Do first |
| Language school direct sales | Medium | Very High | 🔴 Do first |
| ProductHunt / indie communities | Low | High | 🟠 Month 3 |
| YouTube language learning influencers | Medium | High | 🟠 Month 3 |
| Google paid search | High | Medium | 🟡 Month 5 |
| Facebook/Instagram | High | Low-Medium | 🟢 Month 9+ |
| TikTok study content | Low | Medium | 🟡 Month 5 |

---

## 12. Financial Projections & Expenditure Plan

### 12.1 Funding Use of Proceeds ($1.2M Seed)

| Category | Amount | % | Notes |
|---|---|---|---|
| **Product & Engineering** | $480,000 | 40% | 2 full-time engineers for 18 months |
| **Sales & Marketing** | $300,000 | 25% | Ads, content, B2B sales headcount |
| **Operations & Infra** | $60,000 | 5% | Hosting, APIs, tools, security audit |
| **Team (non-engineering)** | $240,000 | 20% | CEO salary, 1 customer success hire |
| **Legal & Compliance** | $60,000 | 5% | Incorporation, GDPR/FERPA, contracts |
| **Reserve** | $60,000 | 5% | 3-month runway buffer |

---

### 12.2 Monthly Operating Expenditure (Post-Seed)

**Month 1–6 Burn Rate: ~$52,000/month**

| Item | Monthly Cost |
|---|---|
| Engineering (2× full-time, senior) | $24,000 |
| CEO / Founder salary | $8,000 |
| Customer Success Manager | $5,000 |
| B2B Sales (part-time, commission-based) | $3,000 |
| Marketing & Ads | $8,000 |
| Infrastructure (Netlify + Firebase + AI APIs) | $1,200 |
| Tools (Notion, Linear, Mixpanel, Intercom) | $600 |
| Legal / accounting | $800 |
| Miscellaneous | $1,400 |
| **Total** | **$52,000** |

**Month 7–12 Burn Rate: ~$68,000/month** (scaled marketing, CS hire)

---

### 12.3 Revenue Projections

| Month | MAU | Paid Users | School Contracts | MRR | Cumulative Revenue |
|---|---|---|---|---|---|
| 3 | 2,000 | 80 | 5 | $2,300 | $2,300 |
| 6 | 8,000 | 400 | 20 | $10,800 | $28,000 |
| 9 | 18,000 | 1,100 | 55 | $27,500 | $95,000 |
| 12 | 35,000 | 2,400 | 100 | $57,400 | $250,000 |
| 18 | 80,000 | 6,000 | 280 | $147,000 | $900,000 |
| 24 | 150,000 | 13,000 | 500 | $310,000 | $2.4M |

**Assumption basis:**
- 5% free-to-paid conversion rate (industry standard: 2–8%)
- School contracts averaging $299/month (blended small/large)
- Monthly churn: 5% consumer, 0.7% institutional
- No enterprise/district deals modeled (upside)

---

### 12.4 Break-Even Analysis

- Fixed monthly costs at Month 12: ~$68,000
- Break-even MRR needed: $68,000
- At $9.99/month blended ARPU: ~6,800 paid users **or** ~228 school contracts
- Projected break-even: **Month 16**

---

### 12.5 Infrastructure Cost Scaling

| Monthly Active Users | AI API | Firebase | Netlify | Total Infra/month |
|---|---|---|---|---|
| 1,000 | $18 | $0 | $19 | **$37** |
| 10,000 | $180 | $25 | $45 | **$250** |
| 50,000 | $900 | $100 | $99 | **$1,100** |
| 200,000 | $3,600 | $300 | $199 | **$4,100** |
| 1,000,000 | $18,000 | $1,200 | $500 | **$19,700** |

*Assumes 3 AI generations/day per active user (conservative for paid tier)*
*Infrastructure cost as % of revenue remains under 5% at all scales — extremely favorable unit economics*

---

## 13. Team Structure

### 13.1 Current Team

| Role | Status | Responsibilities |
|---|---|---|
| Founder / Product | Active | Product vision, feature development, investor relations |

### 13.2 Immediate Hires (Seed Funding, Month 1–3)

| Role | Type | Cost/Month | Priority |
|---|---|---|---|
| Senior Full-Stack Engineer | Full-time | $10,000 | 🔴 Critical |
| Frontend Engineer (React/UX) | Full-time | $8,000 | 🔴 Critical |
| Customer Success / Sales | Full-time | $5,000 | 🔴 Critical |

### 13.3 Growth Hires (Month 6–12)

| Role | Type | Cost/Month | Priority |
|---|---|---|---|
| Head of Marketing | Full-time | $8,000 | 🟠 High |
| B2B Sales (MENA region) | Full-time | $5,000 + commission | 🟠 High |
| Curriculum / Content Lead | Part-time | $3,000 | 🟡 Medium |
| DevOps / Security Engineer | Contract | $4,000 | 🟡 Medium |

### 13.4 Ideal Team Backgrounds

**Engineering:** Experience with React, serverless functions, real-time databases. LLM API experience preferred. EdTech or B2B SaaS background a plus.

**Sales:** Familiarity with school/university procurement cycles. Experience selling SaaS tools to educators in Middle East, Southeast Asia, or Europe preferred.

**Marketing:** SEO-first mindset. Experience with community-led growth. Language learning or EdTech content experience a strong plus.

---

### 13.5 Onboarding Guide for New Team Members

**Day 1 — Repository Setup**
```bash
git clone https://github.com/umid085/student-reading-tool
cd student-reading-tool
npm install
cp .env.example .env.local  # Add ANTHROPIC_API_KEY and FIREBASE_DB_URL
netlify dev                  # Starts full-stack on :8888
```

**Understanding the codebase:**
- All product logic lives in `src/student-reading-quest.jsx` (~6,100 lines)
- Navigation is controlled by `stage` state variable (30 possible values)
- All styles are inline `style={{...}}` objects — no CSS framework
- `var` declarations throughout for consistency — maintain this when editing
- Backend: two Netlify functions (`generate.js`, `storage.js`)
- Read `CLAUDE.md` for the complete architecture reference

**Key state variables to understand first:**
- `stage` — which screen is showing
- `currentUser` — logged-in user object or null
- `result` — last quiz result object
- `social` — the full social graph for all users
- `passage`, `questions`, `userAnswers` — current reading session state

**Testing:**
```bash
npm test        # Unit tests for Netlify functions
npm run dev     # Frontend only (no serverless)
netlify dev     # Full stack
npm run build   # Production build check
```

**Git workflow:**
- Always branch from `origin/main`
- Feature branches: `feature/description`
- PRs required; squash merge to main
- Never push directly to main

---

## 14. Traction & Current Status

### What Exists Today (May 2026)

| Component | Status |
|---|---|
| Core reading + quiz loop | ✅ Production-ready |
| 60-story content library | ✅ Complete |
| AI content generation | ✅ Working (Claude Sonnet) |
| Gamification (XP, badges, streaks) | ✅ Complete |
| Social layer (friends, challenges) | ✅ Complete |
| Teacher dashboard + assignments | ✅ v1 complete |
| Class analytics | ✅ v1 complete |
| Vocabulary system + SRS | ✅ Complete |
| AI tutor, writing feedback, error hunt | ✅ Complete |
| Portfolio + shareable reports | ✅ Complete |
| Spaced repetition review queue | ✅ Complete |
| Story-specific leaderboard challenges | ✅ Complete |
| Netlify + Firebase deployment | ✅ Live |
| Placement test | 🟡 In progress |
| IELTS exam mode | 🟡 In progress |
| Mobile app (Capacitor) | ❌ Planned |
| LMS integration | ❌ Planned |
| bcrypt auth | ❌ Planned |
| Native push notifications | ❌ Planned |

### Metrics (Pre-Launch / Internal Testing)
- Product built and deployed: ✅
- Beta testers: inviting first cohort
- School pilot agreements: in conversation (3 schools, UAE and Turkey)
- Investor conversations: pre-seed stage

---

## 15. Roadmap

### Q2 2026 — Foundation (current quarter)

- [ ] Placement test (adaptive A1–C2 with 12 questions)
- [ ] Teacher: view individual student quiz answers
- [ ] Security: bcrypt password hashing
- [ ] PWA manifest + service worker (offline support)
- [ ] "Today's Plan" home card
- [ ] Level progression roadmap ("3 more B1 stories to unlock B2")

### Q3 2026 — Exam Prep & Classroom

- [ ] IELTS timed exam mode (60-min, 3 passages, authentic format)
- [ ] Band score predictor
- [ ] Teacher assignment feedback (teacher comments on student work)
- [ ] Class progress CSV export
- [ ] Missed-question timed re-test
- [ ] iOS + Android PWA packaging

### Q4 2026 — Scale & Polish

- [ ] 200-story library (expanded from 60)
- [ ] Native mobile apps (Capacitor)
- [ ] Email reminders (streak maintenance, weekly digest)
- [ ] Google Classroom integration (basic)
- [ ] TOEFL prep mode
- [ ] Affiliate / referral system

### Q1 2027 — Enterprise

- [ ] LMS integration (Canvas, Moodle)
- [ ] SSO (Google, Microsoft)
- [ ] District admin dashboard
- [ ] White-label option
- [ ] SCORM export for LMS content packs
- [ ] API for third-party integration

---

## 16. Investment Ask

### Seeking: $1.2M Seed Round

**Use of funds:** See Section 12.1

**Timeline:** Close by July 2026; 18-month runway to Series A metrics

### Series A Triggers (Month 18 targets)
- 80,000+ MAU
- $140,000+ MRR
- 250+ paying school contracts
- Net Revenue Retention > 110% (schools upgrading tiers)
- NPS ≥ 50

### What We're Looking For in Investors

Beyond capital, we want investors who bring:
- **EdTech networks** — connections to school districts, language school chains, ministries of education
- **B2B SaaS experience** — school sales cycles are long; experience navigating them is invaluable
- **Geographic expertise** — MENA, Southeast Asia, or Turkey market knowledge
- **Portfolio synergy** — complementary EdTech tools (LMS, student management, content platforms)

### Cap Table (Pre-Seed)
- Founder: 100% (pre-investment, fully diluted)
- Seed round: offering 15–20% for $1.2M (implied valuation: $6–8M pre-money)

---

## 17. Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| AI API cost spike | Medium | Medium | Switch models (Haiku for simple generations); cache common passages; rate limit free tier |
| Firebase goes down | Low | High | localStorage dual-write already in place; self-hosted fallback in Year 2 |
| AI content quality failure | Low | High | Human review of generated content; moderation layer; teacher flagging system |
| Anthropic price increase | Medium | Medium | Abstract generation to model-agnostic interface; Gemini already partially integrated |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Duolingo launches reading comprehension | High (eventually) | High | Be 2–3 years ahead in classroom features + CEFR depth; institutional relationships are sticky |
| Schools locked into competitor tools | Medium | High | Free tier for teachers; LMS integration; zero-friction trial |
| Consumer willingness to pay lower than modeled | Medium | Medium | Freemium drives MAU; institutional revenue diversifies; exam packs are high WTP |
| Content moderation at scale | Medium | Medium | Teacher/user flagging; AI content moderation layer |

### Regulatory Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| FERPA/GDPR compliance for student data | Medium | High | No PII collected beyond username; EU hosting option; DPA templates for schools |
| COPPA (under-13 users) | Medium | High | Age gate at registration; strict parental consent flow for K-12 |
| AI content liability (incorrect info) | Low | Medium | Disclaimer; teacher review recommended; factual passage review process |

---

## 18. Appendix

### A. CEFR Level Reference

| Level | Description | Equivalent Exams |
|---|---|---|
| A1 | Beginner | —  |
| A2 | Elementary | KET, IELTS 3.0–3.5 |
| B1 | Intermediate | PET, IELTS 4.0–5.0, TOEFL 42–71 |
| B2 | Upper Intermediate | FCE, IELTS 5.5–6.5, TOEFL 72–94 |
| C1 | Advanced | CAE, IELTS 7.0–8.0, TOEFL 95–120 |
| C2 | Proficient | CPE, IELTS 8.5–9.0 |

### B. Firebase Data Schema

```json
{
  "rq-users-v6": [
    {
      "name": "string",
      "hash": "base64(password)",
      "joined": "locale date string",
      "level": "A1–C2",
      "totalXp": 0,
      "games": [
        {
          "level": "B1",
          "score": 5,
          "total": 6,
          "xp": 1200,
          "pct": 83,
          "timeSecs": 142,
          "wpm": 198,
          "topic": "Climate Change",
          "date": "locale date string",
          "storyId": "b1_3 | null",
          "isDaily": false,
          "typeStats": { "mcq": {"correct":2,"total":2} }
        }
      ],
      "badges": ["first_game", "streak_3"],
      "goals": []
    }
  ],
  "rq-social-v6": {
    "username": {
      "friends": ["friend1", "friend2"],
      "requests": ["pending_user"],
      "likes": 3,
      "challenges": [
        {
          "id": "abc123",
          "from": "challenger",
          "level": "B1",
          "types": ["mcq","qa"],
          "storyId": "b1_3",
          "storyTitle": "Climate Change",
          "senderPct": 83,
          "date": "2026-05-14",
          "status": "pending",
          "expiresAt": 1715734800000
        }
      ],
      "sent": []
    }
  }
}
```

### C. Question Type Distribution Recommendation

For a balanced quiz (6 questions):
- 2× MCQ (foundational comprehension)
- 1× Gap Fill word or sentence (vocabulary in context)
- 1× TFNM or YNNG (inferential comprehension)
- 1× Open Answer (productive comprehension)
- 1× Matching or Match Headings (organizational comprehension)

### D. Key Performance Indicators Dashboard

**Product health:**
- DAU/MAU ratio (target: > 30%)
- D1/D7/D30 retention (targets: 60% / 35% / 20%)
- Average sessions per active user per week (target: 4)
- AI generation success rate (target: > 98%)

**Revenue health:**
- Free-to-paid conversion rate (target: 5%)
- Monthly churn (target: < 4%)
- Net Revenue Retention (target: > 105%)
- LTV:CAC (target: > 8×)

**Learning outcomes (differentiator):**
- Average WPM improvement over 30 days
- % users who increase CEFR level within 90 days
- Teacher-reported engagement scores from pilot schools

---

*Document prepared May 2026. Financial projections are forward-looking estimates based on comparable EdTech SaaS benchmarks. Actual results may differ.*

*For questions: [contact via GitHub repository]*
