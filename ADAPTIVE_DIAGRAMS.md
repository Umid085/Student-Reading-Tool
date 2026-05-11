# Adaptive Difficulty: Visual Diagrams & Flowcharts

---

## 1. Algorithm Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│ Quiz Completed (doFinish called)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │ Extract Quiz Metrics:         │
       │ • Quiz %: 81%                 │
       │ • WPM: 110                    │
       │ • Vocab Known: 24/32          │
       └──────────┬────────────────────┘
                  │
                  ▼
       ┌───────────────────────────────┐
       │ Update Arrays:                │
       │ • Append to last-5 quizzes    │
       │ • Update vocab mastery        │
       │ • Update WPM average          │
       └──────────┬────────────────────┘
                  │
                  ▼
       ┌───────────────────────────────────────┐
       │ Compute Master Score                  │
       │                                       │
       │ avgQuiz = [0.81, 0.82, 0.88, ...] = 0.833 │
       │ vocabMastery = 24/32 = 0.75           │
       │ speedRatio = 110/115 = 0.957          │
       │                                       │
       │ masterScore = (0.833×0.5) +           │
       │              (0.75×0.3) +             │
       │              (0.957×0.2)              │
       │            = 0.417 + 0.225 + 0.191    │
       │            = 0.833 (83.3%)            │
       └──────────┬────────────────────────────┘
                  │
                  ▼
            ┌────────────────┐
            │ Is score ≥ 0.80? │
            └────┬──────────┬─────┘
          YES │           │ NO
              │           │
         ┌────▼────┐  ┌────▼──────────┐
         │ >= 0.80 │  │ < 0.50?        │
         │ UPGRADE │  │                │
         │ A2→B1   │  └────┬──────┬────┘
         └────┬────┘    YES │    │ NO
              │       ┌─────▼──┐ │
              │       │ DOWNGRADE
              │       │ B1→A2   │
              │       └─────┬──┘
              │             │
              ▼             ▼             ▼
         ┌─────────┐ ┌──────────┐ ┌──────────┐
         │ Next    │ │ Previous │ │ Current  │
         │ Level   │ │ Level    │ │ Level    │
         │ (B1)    │ │ (A2)     │ │ (A2)     │
         └─────┬───┘ └────┬─────┘ └────┬─────┘
               │          │             │
               └──────┬───┴─────────┬───┘
                      │ Save as      │
                      │ Recommendation
                      ▼
          ┌─────────────────────────┐
          │ Check Hysteresis:       │
          │ recommendationCount < 2?│
          └────┬──────────────────┬─┘
          YES  │                  │ NO (≥2)
               │                  │
               ▼                  ▼
          ┌─────────┐      ┌──────────────┐
          │ Wait for│      │ APPLY CHANGE │
          │ next    │      │ Show popup   │
          │ quiz    │      │ Update UI    │
          └─────────┘      └──────────────┘
```

---

## 2. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     React Component State                    │
│ (student-reading-quest.jsx)                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  useState: {                                                  │
│    currentUser,     ◄───────────┐                             │
│    adaptiveData,    ◄───┐       │                             │
│    masterScore,     ◄─┐ │       │                             │
│    recommendedLevel,  │ │       │                             │
│    ...                │ │       │                             │
│  }                    │ │       │                             │
└──────────────┬───────┘ │       │                             │
               │ doFinish()     │                             
               ▼              │                             
    ┌─────────────────────────┐│                             
    │ updateAdaptiveDifficulty()                             
    │ (adaptiveEngine.js)      ││                             
    │                          ││                             
    │ • Compute masterScore    ││                             
    │ • Apply logic            ││                             
    │ • Check hysteresis       ││                             
    │ • Return { applied, ... }││                             
    └──────────┬───────────────┘│                             
               │                 │                             
        ┌──────┴──────┐          │                             
        │             │          │                             
        ▼             ▼          │                             
    localStorage Firebase       │                             
    (immediate)  (async)        │                             
        │          │            │                             
        └──────┬───┘            │                             
               │                │                             
               └────────────────┴──────────► setAdaptiveData()
                                              setMasterScore()
                                              setRecommendedLevel()
                                              setShowLevelRecommendation()
```

---

## 3. Mastery Score Composition

```
                    MASTER SCORE (0-1)
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
      Quiz (50%)      Vocab (30%)        Speed (20%)
         │                 │                 │
         │                 │                 │
    ┌────▼────┐        ┌────▼────┐     ┌────▼────┐
    │ 81%     │        │ 75%     │     │ 110 WPM │
    │ avg of  │        │ words   │     │ vs 115  │
    │ last 5  │        │ learned │     │ target  │
    │         │        │ without │     │ = 95.7% │
    │         │        │ trans   │     │ capped  │
    └────┬────┘        └────┬────┘     │ at 200% │
         │                 │          └────┬────┘
         │ 0.81 * 0.5 = 0.405           │ 0.957 * 0.2 = 0.191
         │                 │ 0.75 * 0.3 = 0.225 │
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ 0.405 +     │
                    │ 0.225 +     │
                    │ 0.191 =     │
                    │ 0.821       │
                    │ (82.1%) ✓   │
                    └─────────────┘
                           │
                    >= 0.80? → YES
                           │
                           ▼
                    Recommend B1
```

---

## 4. Hysteresis State Machine

```
                    ┌─────────────────────────────┐
                    │  Hysteresis Protection      │
                    │                             │
                    │  Prevent level bouncing     │
                    │  Require 2+ consistent      │
                    │  recommendations            │
                    └────────────┬────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
              ▼ Quiz 1               ▼ Quiz 2
    ┌──────────────────┐   ┌──────────────────┐
    │ Score: 85%       │   │ Score: 86%       │
    │ masterScore=0.82 │   │ masterScore=0.84 │
    │ Recommendation:  │   │ Recommendation:  │
    │ "Go to B1"       │   │ "Go to B1"       │
    │                  │   │                  │
    │ recommendCount=1 │   │ recommendCount=2 │
    │ Action: WAIT     │   │ Action: APPLY ✓  │
    └──────────────────┘   └────────┬─────────┘
                                    │
                            Show popup:
                        "Great! Ready for B1"
                        
    ─────────────────────────────────────────────
    
    Counter-Example (Volatile Student):
    
    Quiz 1: 85% → "B1" (count=1)
    Quiz 2: 60% → "A2" (count=0, reset)
                   (volatile signal ignored)
    Quiz 3: 55% → "A2" (count=1)
    Quiz 4: 45% → "A2" (count=2, apply) ✓
                   
                   "Move to A2 to consolidate"
```

---

## 5. Level Progression Graph

```
CEFR Level Progression (A1 → C2)
═════════════════════════════════

A1 ──────────────────── 10 quizzes ──────────────────── A2
   avg 0.88 masterScore              avg 0.81 masterScore

   A2 ──────────────── 7 quizzes ───────────────── B1
      (still building)              0.78 avg, ready!

   B1 ──────────────── 12 quizzes ──────────────── B2
      (productive struggle)         avg 0.52, staying

   B2 ──────────────── 5 quizzes ───────────────── C1
      (working on it)              avg 0.65, close!

   C1 ──────────────── 8 quizzes ───────────────── C2
      (nearly there)               avg 0.79, ready!

   C2 ─────────────── Master Level ──────────────
      (native competence)


Time progression: ────────────────────────────────►
Level mastery:   ▁▂▃▄▅▆▇█   ▁▂▃▄▅▆▇█   ▁▂▃▄▅▆
```

---

## 6. Firebase Data Structure

```
Firebase Realtime Database
──────────────────────────

{
  "rq-users-v6": [
    {
      "name": "user-123",
      "games": [
        { "level": "A2", "pct": 81, "wpm": 110, ... },
        { "level": "A2", "pct": 86, "wpm": 112, ... }
      ]
    }
  ],
  
  "rq-vocab-v1": [
    { "word": "building", "status": "known", "learned": "2026-05-01" },
    { "word": "technology", "status": "learning", "srInterval": 3 }
  ],
  
  "rq-adaptive-v1": {         ◄─── NEW
    "user-123": {
      "userId": "user-123",
      "currentLevel": "A2",
      "recommendedLevel": "B1",
      "masterScores": {
        "A1": [0.92, 0.88, 0.85, 0.90, 0.87],
        "A2": [0.75, 0.82, 0.87, 0.81, 0.79]
      },
      "vocabMastery": {
        "A1": { "known": 95, "attempted": 100, "pct": 0.95 },
        "A2": { "known": 52, "attempted": 67, "pct": 0.78 }
      },
      "readingSpeed": {
        "A1": { "wpm": 120, "count": 5 },
        "A2": { "wpm": 95, "count": 4 }
      },
      "levelHistory": [...],
      "recommendationCount": 2,
      "lastUpdated": "2026-05-09T10:30:00Z"
    }
  }
}

Storage Size:
  Per user adaptive: ~2 KB
  ×10k users: ~20 MB (trivial)
```

---

## 7. Recommendation Display Timeline

```
Quiz Flow with Recommendations
═════════════════════════════════════════════════════

User at A2 level:

┌─────────────────────────────────────────────────────────┐
│ QUIZ 1: Score 85%, WPM 110, Vocab 75%                  │
│ ─────────────────────────────────────────────────────   │
│ masterScore = 0.82 (82%) → Recommend B1                │
│ recommendationCount = 1                                │
│ recommendedLevel = "B1"                                │
│                                                         │
│ RESULTS SCREEN:                                        │
│ ✓ 85% | 110 WPM | +1850 XP                            │
│ (Recommendation WAITING, not shown)                    │
└─────────────────────────────────────────────────────────┘
                          │
                   User continues...
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ QUIZ 2: Score 83%, WPM 108, Vocab 76%                  │
│ ─────────────────────────────────────────────────────   │
│ masterScore = 0.81 (81%) → Still recommend B1          │
│ recommendationCount = 2 ✓ THRESHOLD MET!               │
│ recommendedLevel = "B1"                                │
│                                                         │
│ RESULTS SCREEN:                                        │
│ ✓ 83% | 108 WPM | +1780 XP                            │
│                                                         │
│ 📈 YOUR PROGRESS (A2)                                 │
│ Mastery Score: 81% 🟢 Strong                          │
│ • Quiz avg: 84%                                        │
│ • Vocabulary mastery: 76%                              │
│ • Reading speed: 108 WPM                               │
│                                                         │
│ ┌──────────────────────────┐                           │
│ │ 🎯 Ready for B1!         │ ◄─── SHOWN NOW           │
│ │ You've shown consistent  │                           │
│ │ mastery. Try B1 next! ✨│                           │
│ └──────────────────────────┘                           │
│                                                         │
│ [Home] [Try B1] [Stay at A2]                          │
└─────────────────────────────────────────────────────────┘
                          │
                   User selects "Try B1"
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Promoted to B1                                          │
│ ─────────────────────────────────────────────────────   │
│ currentLevel = "B1"                                    │
│ levelHistory updated:                                  │
│ { "level": "B1", "startDate": "2026-05-09", ... }     │
│ recommendationCount = 0 (reset)                        │
│ Adaptive data synced to Firebase                       │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Performance Profile

```
Operation Timing Analysis
═════════════════════════

Quiz Completion Flow:
─────────────────────

doFinish() called
    │
    ├─ Score calculation        <1ms    (existing)
    │
    ├─ User/board saves         100ms   (Firebase)
    │
    └─ updateAdaptiveDifficulty() ┐
        ├─ fetchAdaptiveData()        ├─ 105ms total
        │  (localStorage first)    1ms  │
        │                              │
        ├─ Compute components      <1ms │
        │  (arrays, averages)          │
        │                              │
        ├─ masterScore formula     <1ms │
        │  (3 multiplies, adds)        │
        │                              │
        ├─ Logic check             <1ms │
        │  (if/else tree)              │
        │                              │
        ├─ saveAdaptiveDataAsync() 1ms  │
        │  (async, non-blocking)       │
        │                              │
        └─ setReact states         <1ms │
            (UI updates)                │

TOTAL: ~210ms (all non-blocking after quiz save)

Breakdown:
  Firebase writes:  100ms (existing)
  Adaptive update:    4ms (local compute)
  Async Firebase:     1ms (fire-and-forget)
  React state:        <1ms
  ─────────────
  Total:           ~105ms

User Experience:
  ✓ Results screen appears instantly
  ✓ Recommendation popup shows within 1 second
  ✓ No perceived lag or delay
```

---

## 9. Recommendation Matrix

```
Student Performance Matrix
═══════════════════════════════════════════════════════════

                    Quiz Score
              Low      Medium     High
              (40%)    (65%)     (85%)
           ┌─────────┬─────────┬──────────┐
Vocab Low  │ STRUGGLE│ STRUGGLING UPGRADING
(40%)      │ ↓ Level │ → Stay   │ → Next  │
           ├─────────┼─────────┼──────────┤
Vocab Med  │ STRUGGLE│ PRODUCTIVE UPGRADING
(60%)      │ ↓ Level │ → Stay   │ → Next  │
           ├─────────┼─────────┼──────────┤
Vocab High │ MIXED   │ READY    │ MASTER
(80%)      │ ↓ Try ↓ │ → Stay   │ ↑ Go up │
           └─────────┴─────────┴──────────┘

           (Speed, WPM, adjusts each category slightly)

Explanation:
─────────────
Low quiz + Low vocab      → Hard level, retreat
Low quiz + High vocab     → Vocab learned but struggle understanding
Medium quiz + Medium vocab → Productive zone, stay & build
High quiz + High vocab    → Ready for next
```

---

## 10. Integration Points Diagram

```
student-reading-quest.jsx Structure
═════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│ App Component (~1600 lines)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ useState: {                                             │
│   currentUser, allUsers, vocab, ...                    │
│   ┌─── NEW ───┐                                        │
│   │ adaptiveData                                       │
│   │ masterScore                                        │
│   │ recommendedLevel                                   │
│   │ showLevelRecommendation                           │
│   │ recommendationCountdown                           │
│   └────────────┘                                       │
│ }                                                      │
│                                                         │
│ ┌──────────────────────────────────────┐              │
│ │ useEffect (onMount, currentUser)      │              │
│ │ ┌─────────────────────────────────┐  │              │
│ │ │ NEW: fetchAdaptiveData()        │  │              │
│ │ │ setAdaptiveData()               │  │              │
│ │ └─────────────────────────────────┘  │              │
│ └──────────────────────────────────────┘              │
│                                                         │
│ ┌──────────────────────────────────────┐              │
│ │ async function doFinish() {           │              │
│ │   ...scoring logic...                │              │
│ │                                       │              │
│ │   ┌─────────────────────────────┐   │              │
│ │   │ NEW: updateAdaptiveDifficulty() │              
│ │   │ • Compute masterScore         │              
│ │   │ • Apply logic                 │              
│ │   │ • Save to Firebase            │              
│ │   │ setAdaptiveData()             │              
│ │   │ setRecommendedLevel()         │              
│ │   └─────────────────────────────┘   │              │
│ │                                       │              │
│ │   setResult({...})                   │              │
│ │ }                                     │              │
│ └──────────────────────────────────────┘              │
│                                                         │
│ ┌──────────────────────────────────────┐              │
│ │ Render Result Screen:                │              │
│ │  ┌──────────────────────────────┐   │              │
│ │  │ NEW: Adaptive Insights Card   │   │              │
│ │  │ • Mastery score display       │   │              │
│ │  │ • Recommendation popup        │   │              │
│ │  │ • Countdown timer             │   │              │
│ │  └──────────────────────────────┘   │              │
│ └──────────────────────────────────────┘              │
│                                                         │
│ ┌──────────────────────────────────────┐              │
│ │ Render Home Screen:                  │              │
│ │  ┌──────────────────────────────┐   │              │
│ │  │ NEW: "READY!" badge on        │   │              │
│ │  │ recommended level button      │   │              │
│ │  └──────────────────────────────┘   │              │
│ └──────────────────────────────────────┘              │
│                                                         │
│ ┌──────────────────────────────────────┐              │
│ │ Render Profile Screen:               │              │
│ │  ┌──────────────────────────────┐   │              │
│ │  │ NEW: Adaptive Insights Card   │   │              │
│ │  │ • Level journey              │   │              │
│ │  │ • Current mastery %          │   │              │
│ │  │ • Next recommendation        │   │              │
│ │  │ • Stats (quizzes, changes)   │   │              │
│ │  └──────────────────────────────┘   │              │
│ └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘

Key Integration Points:
  1. Load adaptive data on login (useEffect)
  2. Call updateAdaptiveDifficulty() in doFinish()
  3. Update React state with recommendation
  4. Display in 3 screens (results, home, profile)
```

---

## 11. Example Walkthrough

```
Real Student Journey
════════════════════════════════════════════════════════

WEEK 1: Starting at A1
─────────────────────────────────────────────────────────

Day 1-2:
  Quiz 1: 85% | 115 WPM | Vocab 80% → masterScore 0.82
          → Recommendation: "Try A2" (count=1, wait)
          
  Quiz 2: 78% | 120 WPM | Vocab 82% → masterScore 0.80
          → Still A2 (count=2, APPLY!) ✓
          → Shows popup: "Ready for A2!"

Day 3-5:
  Student chooses A2 (promoted)
  
  Quiz 3: 72% | 95 WPM | Vocab 65%  → masterScore 0.71
          → Recommendation: "Stay A2" (count=1)
          
  Quiz 4: 68% | 92 WPM | Vocab 62%  → masterScore 0.67
          → Still A2 (count=2, APPLY) ✓
          → Shows quiet message: "Keep building A2 skills"

WEEK 2: Consolidation at A2
─────────────────────────────────────────────────────────

Day 6-10:
  Takes 5 more A2 quizzes
  Scores trend upward: 72%, 75%, 78%, 82%, 85%
  
  After quiz 9: 82% → "Ready for A3?" Not yet, only 1 quiz
  After quiz 10: 85% → Still "Ready for B1"? (count=2, yes!)
  
  masterScore = (0.82 + 0.85)/2 = 0.835 ≈ 84%
  → UPGRADED to B1

WEEK 3-4: B1 Challenge
─────────────────────────────────────────────────────────

Day 11-18:
  Quiz 1: 65% | 85 WPM  → masterScore 0.63 ("Stay B1")
  Quiz 2: 62% | 82 WPM  → masterScore 0.60 ("Stay B1")
  Quiz 3: 58% | 80 WPM  → masterScore 0.56 ("Stay B1")
  Quiz 4: 52% | 78 WPM  → masterScore 0.52 ("Stay B1")
  Quiz 5: 48% | 75 WPM  → masterScore 0.49 < 0.50 ("Try A2") count=1
  Quiz 6: 46% | 74 WPM  → masterScore 0.48 ("Try A2") count=2
  
  Shows popup: "B1 might be tough. Consolidate A2?"
  
  Student chooses to retry B1 (skip regression)
  
  Quiz 7: 65% | 90 WPM  → masterScore 0.63 (improving)
  Quiz 8: 72% | 95 WPM  → masterScore 0.70 (solid progress)
  
  Stays at B1, building towards 0.80 for C1

MONTH 2: C1 Goal
─────────────────────────────────────────────────────────

  Continues B1 quizzes consistently
  masterScore trend: 0.62 → 0.68 → 0.74 → 0.79 → 0.81
  
  After sustained 0.80+ score (2+ quizzes):
  → Promoted to C1
  
  Profile now shows:
  "Level Journey: A1 (Apr 1–5) → A2 (Apr 5–15) → 
                  B1 (Apr 15 – May 10) → C1 (May 10 – now)"
  
  Recommendation: "You're making excellent progress toward C2!"
```

---

**These diagrams provide visual understanding of algorithm flow, data structure, and real-world usage patterns. Use alongside code documentation for complete clarity.**
