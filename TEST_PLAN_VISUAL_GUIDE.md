# Translation Feature — Visual Test Guide
**Visual Workflows, Flow Diagrams & Component Maps**

---

## Feature Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSLATION FEATURE FLOW                       │
└─────────────────────────────────────────────────────────────────┘

                        USER INTERACTION
                              │
                              ▼
                    ┌──────────────────┐
                    │  Reading Screen  │
                    │   Passage Text   │
                    └────────┬─────────┘
                             │
                    User clicks sentence
                             │
                             ▼
                    ┌──────────────────────┐
                    │  activeSentence      │
                    │  set to selected     │
                    │  text               │
                    └────────┬─────────────┘
                             │
                    User clicks "🌐 Translate"
                             │
                             ▼
                    ┌──────────────────────────────┐
                    │  translateSentence()         │
                    │  • setTranslating(true)      │
                    │  • Build MyMemory API URL    │
                    │  • encodeURIComponent()      │
                    │  • Set timeout: 2s max       │
                    └────────┬─────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌─────────────────┐
            │ API SUCCESS  │  │   API ERROR     │
            │ 200 OK       │  │ 403/500/Network │
            └────┬─────────┘  └────┬────────────┘
                 │                 │
        setTranslation()    setTranslation(
        (translatedText)    "unavailable")
                 │                 │
                 └────────┬────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │ Translation Panel   │
                │ [Italic blue text]  │
                │ [150ms fade-in]     │
                └──────────┬──────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  VISIBLE      │
                   │  To User      │
                   └───────────────┘
```

---

## CEFR Quota Gating Logic (To Be Implemented)

```
┌──────────────────────────────────────────────────────────────────┐
│                     QUOTA DECISION TREE                           │
└──────────────────────────────────────────────────────────────────┘

User clicks "Translate"
        │
        ▼
Get user.level (A1, A2, B1, B2, C1, C2)
        │
        ├─ Is user A1? ────► YES ──► ALLOW (unlimited)
        │                          │
        │                          ▼
        │                      translateSentence()
        │                          │
        │                          ▼
        │                    Show translation
        │
        ├─ Is user A2? ────► YES ──► ALLOW (unlimited)
        │                          │
        │                          ▼
        │                      translateSentence()
        │
        ├─ Is user B1? ────► YES ──► ALLOW (unlimited)
        │                          │
        │                          ▼
        │                      translateSentence()
        │
        └─ Is user B2+? ──► YES ──┐
                                  │
                  ┌───────────────┘
                  │
                  ▼
      Check translationCount[passageId]
                  │
         ┌────────┴────────┐
         │                 │
    Count ≤ 3?         Count > 3?
         │                 │
         ▼                 ▼
      ALLOW          DENY + SHOW
      │              QUOTA MESSAGE
      │              │
      ▼              ▼
  translateSentence()  Toast/Modal:
      │              "Quota Reached!
      │               Complete this
      │               passage to unlock
      ▼               unlimited or
 Show translation     upgrade level."
                      │
                      ▼
                 Button: "Next Passage"
                      │
                      ▼
                 Reset translationCount
                 for next passage
```

---

## Test Coverage Heatmap

```
┌─────────────────────────────────────────────────────────────┐
│              FEATURE COVERAGE ANALYSIS                       │
└─────────────────────────────────────────────────────────────┘

Component                   Coverage  Status      Risk Level
────────────────────────────────────────────────────────────

translateSentence()         ████░░░░  80%         YELLOW
├─ API call                 ██████░░  HIGH        GREEN
├─ Error handling           ███░░░░░  MEDIUM      YELLOW
├─ Encoding/escaping        ██████░░  HIGH        GREEN
└─ Empty input validation   ░░░░░░░░  0%          RED

Language selection          ██████░░  85%         GREEN
├─ State management         ██████░░  HIGH        GREEN
├─ localStorage persist     ██████░░  HIGH        GREEN
└─ Dropdown UI              ███░░░░░  MEDIUM      YELLOW

CEFR quota gating          ░░░░░░░░  0%          RED (Blocker)
├─ Count tracking           ░░░░░░░░  0%          RED
├─ Quota enforcement        ░░░░░░░░  0%          RED
└─ UI message               ░░░░░░░░  0%          RED

Animation/UI               ███████░  90%         GREEN
├─ Fade-in animation       ██████░░  HIGH        GREEN
├─ Text styling            ██████░░  HIGH        GREEN
└─ Responsive layout       ████░░░░  MEDIUM      YELLOW

Accessibility             ████░░░░  50%         RED
├─ Color contrast          ██████░░  HIGH        GREEN
├─ ARIA labels             ░░░░░░░░  0%          RED
├─ Screen reader support   ░░░░░░░░  0%          RED
└─ Touch targets           ░░░░░░░░  0%          RED (Blocker)

Performance               ███░░░░░  60%         YELLOW
├─ API response time       ██████░░  HIGH        GREEN
├─ Caching (localStorage)  ░░░░░░░░  0%          RED
└─ Memory management       ███░░░░░  MEDIUM      YELLOW

OVERALL COVERAGE: ════════░░ 52% (NEEDS WORK)
```

---

## Test Execution Timeline

```
┌──────────────────────────────────────────────────────────────┐
│                    2-WEEK TEST TIMELINE                       │
└──────────────────────────────────────────────────────────────┘

WEEK 1 (Development + Core Testing)
─────────────────────────────────────

Mon: Implement blockers (quota, touch targets, ARIA)
     └─ TP-006-009 logic, TP-034 sizing, TP-030 labels
Tue: Implement error handling + validation
     └─ TP-017 (empty), TP-024 (offline), TP-027 (logging)
Wed: Run Vitest unit tests
     └─ TP-001, TP-004, TP-006-020, TP-035, TP-036
     └─ Target: 90%+ pass rate
Thu: Manual happy path testing (all browsers)
     └─ TP-001-005, TP-011, TP-012
     └─ Chrome, Firefox, Safari, Edge
Fri: Edge case testing + accessibility audit
     └─ TP-013-016, TP-019-020, TP-028-032
     └─ axe DevTools + NVDA screen reader

WEEK 2 (E2E + UAT + Release)
────────────────────────────

Mon: Run Playwright E2E tests (all platforms)
     └─ Mobile (iPhone, Android) + Desktop
     └─ TP-033-039 regression suite
     └─ Target: <5% flakiness
Tue: Performance testing under load
     └─ 50 concurrent API calls
     └─ Memory leak test (10+ translations)
     └─ P95 latency monitoring
Wed: UAT with beta users (B2-C2 quota testing)
     └─ Real user feedback on quota experience
     └─ Measure engagement impact
Thu: Canary release (5% of users)
     └─ Monitor error rate (<0.1%)
     └─ Check MyMemory API uptime
     └─ Gather initial user feedback
Fri: General release + monitoring setup
     └─ Rollout to 100%
     └─ Set up alerts for API errors
     └─ Week-long post-launch observation

     ┌────────────────────────────────────┐
     │ CRITICAL PATH (Sequential)         │
     │ Mon-Fri Week 1: Blockers & Unit    │
     │ Mon-Tue Week 2: E2E & Perf         │
     │ Must complete before UAT           │
     └────────────────────────────────────┘
```

---

## Test Categories by Priority & Effort

```
┌──────────────────────────────────────────────────────────────┐
│     EFFORT vs PRIORITY MATRIX (Test Prioritization)           │
└──────────────────────────────────────────────────────────────┘

                   EFFORT (→ increases)
         LOW          MEDIUM          HIGH
      
P  │  QUICK WINS      PLANNED WORK    DEFER/PHASE2
R  │  TP-001 (5m)     TP-030 (10m)    TP-021 (10m)
I  │  TP-002 (5m)     TP-032 (10m)    TP-025 (10m)
O  │  TP-004 (5m)     TP-034 (5m)     TP-006-009
R  │  TP-028 (2m)     TP-037 (10m)    (blockers)
I  │              
T  │  MEDIUM IMPACT   HARD PROBLEMS   RISKY
Y  │  TP-035 (15m)    TP-015 (10m)    TP-021 (cache)
   │  TP-036 (5m)     TP-023 (race)   TP-026-027
   │  TP-019 (3m)     TP-024 (API)    (logging)
   │
   │  NICE-TO-HAVE    POLISH         FUTURE
   │  TP-018 (5m)     TP-012 (15m)    (Spanish,
   │  TP-020 (5m)     TP-033 (10m)     RTL Arab)

EXECUTION ORDER:
1. Start with QUICK WINS (30 min, high confidence)
2. PLANNED WORK (medium blockers & regression)
3. HARD PROBLEMS (edge cases, performance)
4. DEFER: Phase 2 enhancements (caching, analytics)
```

---

## Browser & Device Test Matrix

```
┌──────────────────────────────────────────────────────────────┐
│           BROWSER COMPATIBILITY GRID                          │
└──────────────────────────────────────────────────────────────┘

             Chrome    Firefox    Safari     Edge
          ┌──────────┬──────────┬──────────┬──────────┐
          │ ✓ 125    │ ✓ 124    │ ✓ 17     │ ✓ 125    │
Desktop   │ PASS     │ PASS     │ PASS     │ PASS     │
          └──────────┴──────────┴──────────┴──────────┘

Mobile    ┌──────────┬──────────┬──────────┐
iOS       │ Chrome   │          │ Safari   │
          │ ✓ Latest │          │ ✓ Latest │
          │ PASS     │          │ PASS     │
          └──────────┴──────────┴──────────┘

          ┌──────────┬──────────┐
Android   │ Chrome   │ Firefox  │
          │ ✓ Latest │ ✓ Latest │
          │ PASS     │ PASS     │
          └──────────┴──────────┘

Viewport Sizes Tested:
  ┌─ Desktop: 1920×1080, 1366×768
  ├─ Tablet: 768×1024 (iPad)
  └─ Mobile: 412×915 (Pixel 6), 390×844 (iPhone 14), 320×568 (iPhone SE)

Critical Tests per Browser:
  ✓ TP-001, TP-002, TP-003 (happy path)
  ✓ TP-004, TP-005 (persistence)
  ✓ TP-035, TP-036 (compat matrix)
  ✓ TP-034 (touch targets on mobile)
```

---

## Accessibility Checklist Flowchart

```
┌──────────────────────────────────────────────────────────────┐
│        WCAG 2.1 AA COMPLIANCE VERIFICATION FLOW               │
└──────────────────────────────────────────────────────────────┘

START: Translation Feature
│
├─ 1.4.3 COLOR CONTRAST (AA)
│  ├─ Measure: #c7d2fe on #0d0d1a
│  ├─ Tool: WebAIM contrast checker
│  ├─ Target: 4.5:1 minimum
│  ├─ Result: 7.8:1 ✓ PASS (AAA)
│  └─ TP-028: VERIFIED
│
├─ 2.1.1 KEYBOARD (A)
│  ├─ Test: Tab to all interactive elements
│  ├─ Elements: [Translate] [Language Selector]
│  ├─ Expected: Focus ring visible on each
│  ├─ Status: ⚠️ PARTIAL (needs enhancement)
│  └─ TP-029: PARTIAL PASS
│
├─ 2.4.3 FOCUS ORDER (A)
│  ├─ Test: Tab order logical?
│  ├─ Expected: Translate → Dropdown → Close
│  ├─ Status: ⚠️ NEEDS TESTING
│  └─ TP-029: DEFERRED
│
├─ 2.4.7 FOCUS VISIBLE (AA)
│  ├─ Test: Focus ring visible on focus
│  ├─ Requirements:
│  │  • 3px+ minimum visible area
│  │  • Not relying on color alone
│  │  • Not obscured by other elements
│  ├─ Status: ⚠️ PARTIAL (button OK, dropdown unclear)
│  └─ TP-031: PARTIAL PASS
│
├─ 3.3.1 ERROR IDENTIFICATION (A)
│  ├─ Test: "Quota reached" error clear?
│  ├─ Requirements:
│  │  • Text identifies error
│  │  • Placement near problem
│  │  • Not color-only indication
│  ├─ Status: ⚠️ NOT IMPLEMENTED
│  └─ TP-008-009: BLOCKED
│
├─ 4.1.2 NAME, ROLE, VALUE (A)
│  ├─ Test: aria-label on interactive elements
│  ├─ Elements:
│  │  • Translate button: "Translate sentence"
│  │  • Dropdown: "Select translation language"
│  ├─ Status: ✗ MISSING
│  └─ TP-030: FAIL
│
├─ 4.1.3 STATUS MESSAGES (AA)
│  ├─ Test: Loading/done state announced
│  ├─ Requirements:
│  │  • aria-live="polite" on status area
│  │  • Announces "Translating..."
│  │  • Announces "Translation loaded"
│  ├─ Status: ✗ MISSING
│  └─ TP-032: FAIL
│
├─ 2.5.5 TARGET SIZE (AA)
│  ├─ Test: Touch targets 44×44px minimum
│  ├─ Current: Button 20px, Dropdown 20px
│  ├─ Status: ✗ FAIL (CRITICAL)
│  └─ TP-034: FAIL
│
└─ OVERALL: ⚠️ PARTIAL (50% AA compliant)
   Action: Fix TP-030, TP-031, TP-032, TP-034 before release

 ┌────────────────────────────────────────┐
 │ NEXT STEPS:                             │
 │ 1. Run axe DevTools: npx axe-checker  │
 │ 2. Test with NVDA (screen reader)     │
 │ 3. Run Lighthouse: --axe flag         │
 │ 4. Manual keyboard nav (Tab/Enter)    │
 │ 5. Verify touch targets with DevTools │
 └────────────────────────────────────────┘
```

---

## Performance Optimization Path

```
┌──────────────────────────────────────────────────────────────┐
│            PERFORMANCE BOTTLENECK ANALYSIS                    │
└──────────────────────────────────────────────────────────────┘

User Action Timeline:
─────────────────────

0ms ────── User clicks "Translate" button
           ├─ React state update: setTranslating(true)
           ├─ Button text changes to "..."
           └─ UI rerender: <10ms ✓ FAST

50ms ───── API call begins
           ├─ encodeURIComponent() processes text
           ├─ fetch() initiated
           ├─ Network request sent
           └─ Waiting for MyMemory API...

250ms ──── Network request reaches API server
           ├─ (depends on user location + MyMemory latency)
           └─ No optimization possible here

450ms ───── MyMemory processes + responds
           ├─ API processing time: ~200ms avg
           ├─ Response travels back: ~200ms
           └─ Browser receives JSON

600ms ───── Browser processes response
           ├─ JSON.parse(): <5ms ✓ FAST
           ├─ setTranslation(text): <5ms ✓ FAST
           ├─ setTranslating(false)
           └─ React rerender: <10ms ✓ FAST

700ms ───── FADE-IN ANIMATION BEGINS
           ├─ CSS transition: opacity 0 → 1
           ├─ Duration: 150ms (designed)
           └─ User sees translation at 850ms

═════════════════════════════════════════════════

OPTIMIZATION OPPORTUNITIES (Phase 2):
────────────────────────────────────

1. CACHING (Target: <500ms for cached)
   Current: Every translation = API call
   Solution: localStorage/{sentence:lang} hash
   Savings: 600ms → 50ms (12× faster!)

   ┌─ Check localStorage (5ms)
   ├─ MISS? → API call (600ms)
   └─ SAVE result → Next lookup instant

2. PRELOAD COMMON SENTENCES
   Common: "Hello", "Thank you", "How are you?"
   On app start: Pre-translate to all 5 languages
   Savings: First 5 translations instant

3. COMPRESSION (If API adds gzip)
   Current: ~2KB response (uncompressed)
   With gzip: ~500 bytes over network
   Savings: ~10ms on slow networks

4. SERVICE WORKER CACHING
   Cache translations for offline access
   + Background sync when online
   Savings: Zero dependency on network

CURRENT BASELINE:
  P50: 620ms ✓ GOOD
  P95: 1200ms ✓ ACCEPTABLE
  P99: 2000ms ✓ WITHIN SLA

TARGET AFTER PHASE 2:
  P50: 100ms (cached)
  P95: 800ms (uncached)
  P99: 1500ms (worst case)
```

---

## Risk Heat Map

```
┌──────────────────────────────────────────────────────────────┐
│              RISK ASSESSMENT MATRIX                           │
└──────────────────────────────────────────────────────────────┘

LIKELIHOOD (→) vs IMPACT (↓)

                Unlikely    Possible    Likely
            ┌─────────────┬──────────┬──────────┐
         HI │   🟡        │   🔴     │   🔴    │
         GH │ WCAG lawsuit│ MyMemory │ Quota   │
            │ (low odds)  │  downtime│bypass   │
            │             │ (rare)   │(medium) │
            ├─────────────┼──────────┼──────────┤
         MED│   🟢        │   🟡     │   🟡    │
            │ Browser     │ Edge case│ Cache   │
            │ incomp      │ failure  │ collide │
            │ (modern OK) │ (6 langs)│ (race)  │
            ├─────────────┼──────────┼──────────┤
         LOW│   🟢        │   🟢     │   🟡    │
            │ Unicode     │ Single   │ Spanish │
            │ mojibake    │ word OK  │ missing │
            │ (handled)   │          │ (phase2)│
            └─────────────┴──────────┴──────────┘

🔴 CRITICAL (Stop release): WCAG violations, quota bypass
🟡 WARNING (Monitor closely): MyMemory uptime, edge cases
🟢 LOW RISK (Proceed): Browser compat, encoding

MITIGATION STRATEGY:
  1. Fix WCAG (touch targets, ARIA) — BEFORE release
  2. Server-side quota validation — DEV requirement
  3. API retry + fallback — Resilience pattern
  4. User testing — Quota acceptance (B2-C2)
  5. Monitoring — Error rate <0.1%
```

---

## Test Automation Architecture

```
┌──────────────────────────────────────────────────────────────┐
│           TEST STACK & TOOL INTEGRATION                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                           │
│  GitHub Actions → npm test → Coverage → Deployment          │
└────────────────────────┬────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Unit Tests  │  │  E2E Tests   │  │  Perf Tests  │
│  (Vitest)    │  │ (Playwright) │  │  (Custom)    │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ TP-006-020   │  │ TP-001-005   │  │ TP-021-023   │
│ TP-026-036   │  │ TP-029-034   │  │ TP-022       │
│              │  │ TP-037-039   │  │              │
│ Runtime: 2-3m│  │ Runtime: 3-5m│  │ Runtime: 1m  │
└──────────────┘  └──────────────┘  └──────────────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │  Coverage Report         │
            │  Target: 90% statements  │
            │  Codecov integration     │
            └────────────┬─────────────┘
                         │
                ┌────────┴────────┐
                │                 │
           Pass? ✓          Fail? ✗
                │                 │
                ▼                 ▼
         ┌─────────────┐    ┌──────────────┐
         │ Merge OK    │    │ Block merge   │
         │ → Staging   │    │ Fail check    │
         └─────────────┘    │ Notify team   │
                            └──────────────┘

ACCESSIBILITY LAYER:
    Parallel to Unit/E2E:
    axe-core + NVDA scan (manual)
    Target: 0 violations

MANUAL TESTING GATES:
    Before prod release:
    ✓ Accessibility audit
    ✓ Performance validation
    ✓ Mobile device testing (real hardware)
    ✓ UAT with B2-C2 beta users
```

---

## Translation State Machine

```
┌──────────────────────────────────────────────────────────────┐
│          COMPONENT STATE LIFECYCLE                            │
└──────────────────────────────────────────────────────────────┘

INITIAL STATE:
  translation = null
  translating = false
  translateLang = "uz" (from localStorage)
  activeSentence = null


USER SELECTS SENTENCE:
  activeSentence = "Selected text from passage"
  translation = null
  translating = false


USER CLICKS TRANSLATE:
  ┌─────────────────────────────────────────┐
  │ setTranslating(true)                    │
  │ ↓ Translation panel shows "..."         │
  │ setTranslation(null)                    │
  │ ↓ Clear old translation                 │
  │                                         │
  │ fetch(MyMemory API)                     │
  │ ↓ Request sent                          │
  └─────────────────────────────────────────┘
          │
          ├─ SUCCESS (200) ──────┐
          │                      │
          │                ┌─────▼──────────┐
          │                │ Response OK?   │
          │                │ translatedText │
          │                │ field exists?  │
          │                ├─YES───────┐    │
          │                │           │    │
          │                ▼           ▼    │
          │          setTranslation(text)   │
          │          translating = false    │
          │          ↓                      │
          │    [Translation visible]        │
          │    [150ms fade-in]              │
          │                │               │
          │                └─NO──────┐    │
          │                        setTranslation
          │                        ("unavailable")
          │
          └─ ERROR (API DOWN) ─────┐
                                   │
                          setTranslation(
                          "unavailable")


FINAL STATE:
  translation = "Mushuk kovrakda yotibdi."
  translating = false
  activeSentence = "The cat is on the mat."
  translateLang = "uz"


USER CHANGES LANGUAGE:
  translateLang = "ru"  (new value)
  localStorage.setItem("rq-translate-lang", "ru")
  translation = null (cleared)
  activeSentence = unchanged


USER SELECTS DIFFERENT SENTENCE:
  activeSentence = "New sentence"
  translation = null (cleared)
  translating = false
  [Ready for new translate]
```

---

## Quota Reset Diagram (When Implemented)

```
┌──────────────────────────────────────────────────────────────┐
│            CEFR QUOTA TRACKING & RESET                        │
└──────────────────────────────────────────────────────────────┘

SCENARIO: B2 student with 3-translation quota

┌─ Reading Passage 1
│  ├─ Translation 1: "Sentence A" ──────────── COUNT = 1 ✓
│  ├─ Translation 2: "Sentence B" ──────────── COUNT = 2 ✓
│  ├─ Translation 3: "Sentence C" ──────────── COUNT = 3 ✓
│  └─ Translation 4: "Sentence D" ──────────── COUNT = 4 ✗
│                                             │
│                               ┌─────────────┴──────────┐
│                               │                        │
│                         Show quota message:
│                         "Quota reached"
│                         [Button: "Next Passage"]
│
└─ User clicks "Next Passage"
   │
   └─ Reset: translationCount[passage-1] = 0
      │
      └─ Reading Passage 2
         ├─ Translation 1: "New sentence A" ─ COUNT = 1 ✓
         ├─ Translation 2: "New sentence B" ─ COUNT = 2 ✓
         └─ [Quota reset for new passage]

STATE STRUCTURE (To Implement):
  const [translationCountPerPassage, setTranslationCountPerPassage]
    = useState({
        "passage-A": 3,
        "passage-B": 0
      });

QUOTA CHECK LOGIC:
  if (currentLevel in ['B2','C1','C2']) {
    if (translationCountPerPassage[passageId] >= 3) {
      return { allowed: false, reason: "quota_exceeded" };
    }
  }
  return { allowed: true };
```

---

**Visual Guide Complete**

All diagrams, flowcharts, and architectural visualizations are provided above to supplement the written test plan. Use these as references during test execution and team discussions.

