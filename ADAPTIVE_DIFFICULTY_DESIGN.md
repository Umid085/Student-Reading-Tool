# Adaptive Difficulty Algorithm & Data Layer Design

**Version:** 1.0  
**Date:** 2026-05-09  
**Status:** Design Specification (Ready for Implementation)

---

## Executive Summary

This document specifies the adaptive difficulty algorithm that automatically recommends next CEFR level (A1–C2) based on student performance. The system tracks quiz scores, reading speed (WPM), and vocabulary mastery to compute a `masterScore`, then applies hysteresis logic to prevent bouncing between levels. Data is stored in Firebase with client-side localStorage fallback.

---

## 1. Mastery Scoring Algorithm

### 1.1 Formula

```
masterScore = (avgQuizScore × 0.5) + (vocabMastery × 0.3) + (readingSpeed × 0.2)
```

**Weights:**
- **Quiz Score (50%)** — Primary indicator of comprehension and question accuracy
- **Vocabulary Mastery (30%)** — Lexical progress (words learned without translation)
- **Reading Speed (20%)** — WPM relative to target for current level

### 1.2 Component Calculations

#### 1.2.1 Average Quiz Score (`avgQuizScore`)

```
avgQuizScore = (sum of last 5 quiz percentages at current level) / 5

Range: 0–100%
Normalization: Divide by 100 to get 0–1 decimal for formula

Edge Case: If fewer than 5 quizzes at level, use all available (no minimum threshold)
```

**Implementation Note:** The `doFinish()` function currently computes `pct` as:
```javascript
var pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
```

Store this per level in the adaptive data model.

#### 1.2.2 Vocabulary Mastery (`vocabMastery`)

```
vocabMastery = (count of vocabulary words with status="known") / (total words attempted at level)

Range: 0–100%
Normalization: Divide by 100 to get 0–1 decimal for formula

Source: 'rq-vocab-v1' (already tracked in app)
Track per CEFR level using word metadata (if available) or estimate by quizzes at that level
```

**Rationale:** Students who bypass translation mode demonstrate deeper understanding.

#### 1.2.3 Reading Speed (`readingSpeed`)

```
readingSpeed = (student WPM at level) / (target WPM for level)

Range: 0–200%+ (can exceed target)
Normalization: For formula, cap at 2.0 (200%) to prevent outliers from dominating

Target WPM by CEFR Level:
- A1: 80–100 WPM (elementary pace)
- A2: 100–130 WPM (gradual increase)
- B1: 130–160 WPM (moderate fluency)
- B2: 160–190 WPM (advanced fluency)
- C1: 190–220 WPM (near-native pace)
- C2: 220–250 WPM (native-like speed)

Example: Student at A2 reads 110 WPM with target 115 WPM → 110/115 = 0.96 (96%)
```

**Data Source:** `wpm` field added to `gameEntry` in `doFinish()` (already implemented):
```javascript
var wpm = getWpmFromSecs(passage.split(/\s+/).length, readingTimerSecs);
```

### 1.3 Example Calculation

```
Current Level: A2
Last 5 quizzes: [75%, 82%, 88%, 79%, 85%]
  avgQuizScore = (75 + 82 + 88 + 79 + 85) / 5 = 409 / 5 = 81.8% = 0.818

Vocabulary Mastery: 24 known words / 32 attempted = 75% = 0.75

Reading Speed: 112 WPM / 115 target = 0.974 → capped at 1.0 for formula

masterScore = (0.818 × 0.5) + (0.75 × 0.3) + (1.0 × 0.2)
            = 0.409 + 0.225 + 0.2
            = 0.834 (83.4%)
```

---

## 2. Level Recommendation Logic

### 2.1 Recommendation Decision Tree

```
if masterScore >= 0.80:
  recommendedLevel = nextLevel(currentLevel)
  reason = "Excellent performance — ready for harder content"
  
elif masterScore < 0.50:
  recommendedLevel = prevLevel(currentLevel)
  reason = "Struggling — move to easier content for consolidation"
  
else:
  recommendedLevel = currentLevel
  reason = "Steady progress — stay at current level"
```

**Threshold Justification:**
- **≥80%:** Student consistently masters comprehension, vocabulary, and speed
- **50–79%:** Productive struggle zone; pushing toward mastery at current level
- **<50%:** Content too difficult; risk of discouragement; recommend easier level

### 2.2 Hysteresis (Prevent Level Bouncing)

```
recommendationChanged = (recommendedLevel != previousRecommendedLevel)

if recommendationChanged:
  recommendationCount = (recommendationCount or 0) + 1
  
  if recommendationCount >= 2:  // Sustained across ≥2 quizzes
    Apply recommendation to user (show notification, update UI)
    Reset recommendationCount = 0
    Update lastRecommendationDate = today
  else:
    Wait for next quiz; don't display recommendation yet
else:
  recommendationCount = 0  // Reset on score volatility
```

**Rationale:** Require consistent performance across 2+ quizzes before switching levels. Prevents single good/bad day causing level ping-pong.

### 2.3 Level Jump Safety

```
MAX_JUMP = 1 level per recommendation

Example Valid Jumps:
- A1 → A2 ✓
- A2 → B1 ✓
- B1 → C1 ✗ (exceeds MAX_JUMP; must go B1 → B2 → C1)

Implementation:
if nextLevel(currentLevel) == recommendedLevel:
  Apply (jump safe)
else if recommendedLevel > currentLevel + 1:
  recommendedLevel = nextLevel(currentLevel)  // Clamp to next level
  reason = "Jump limited to one level (CEFR gaps too large)"
else:
  Apply
```

**Rationale:** CEFR levels are scaffolded; A1→B1 skips A2 grammar (articles, verb tenses) and vocabulary depth. One-level jumps maintain pedagogical integrity.

### 2.4 Direction Consistency

```
// Prevent rapid down-level after up-level (or vice versa)
if previousRecommendation == "upgrade" && newRecommendation == "downgrade":
  Hold newRecommendation for 3 quizzes before applying
  reason = "Stabilizing after level change"

if previousRecommendation == "downgrade" && newRecommendation == "upgrade":
  Hold newRecommendation for 2 quizzes before applying
  reason = "Consolidating before advancing"
```

**Rationale:** Reduces jitter if level change is still settling in.

---

## 3. Data Model

### 3.1 User Adaptive State Object

Stored per user in Firebase under `rq-adaptive-v1/{userId}`:

```javascript
{
  userId: "user-123",
  
  // Current tracked level
  currentLevel: "A2",
  
  // Recommended next level (null if same as current)
  recommendedLevel: "B1",
  
  // Tracking for recommendation hysteresis
  recommendationHistory: [
    { level: "B1", date: "2026-05-09", quizCount: 1 },
    { level: "B1", date: "2026-05-08", quizCount: 2 }
  ],
  recommendationCount: 2,  // Consecutive quizzes suggesting same recommendation
  lastRecommendationChange: "2026-05-09T10:30:00Z",
  
  // Per-level mastery tracking (keep last 5 quiz scores)
  masterScores: {
    "A1": [0.92, 0.88, 0.85, 0.90, 0.87],
    "A2": [0.75, 0.82, 0.87, 0.81, 0.79],
    "B1": [0.68, 0.72, 0.70]  // Only 3 quizzes so far
  },
  
  // Vocabulary mastery per level
  vocabMastery: {
    "A1": { known: 95, attempted: 100, pct: 0.95 },
    "A2": { known: 52, attempted: 67, pct: 0.78 },
    "B1": { known: 18, attempted: 45, pct: 0.40 }
  },
  
  // Reading speed (WPM) per level (running average)
  readingSpeed: {
    "A1": { wpm: 120, count: 5 },  // Average of 5 quizzes
    "A2": { wpm: 95, count: 4 },
    "B1": { wpm: 88, count: 2 }
  },
  
  // Level progression history (audit trail)
  levelHistory: [
    {
      level: "A1",
      startDate: "2026-04-01",
      endDate: "2026-04-14",
      quizzes: 10,
      avgScore: 0.88,
      avgWpm: 120,
      vocabMastery: 0.95,
      reason: "Recommended upgrade to A2"
    },
    {
      level: "A2",
      startDate: "2026-04-15",
      endDate: null,  // Current
      quizzes: 5,
      avgScore: 0.81,
      avgWpm: 95,
      vocabMastery: 0.78,
      reason: "Recently promoted"
    }
  ],
  
  // Timestamps
  createdAt: "2026-04-01T09:00:00Z",
  lastUpdated: "2026-05-09T10:30:00Z",
  lastQuizDate: "2026-05-09T10:30:00Z",
  
  // Metadata for analytics
  totalQuizzesCompleted: 15,
  recommendationsMade: 1,
  levelChanges: 1,
  averageMasterScore: 0.81
}
```

### 3.2 Quiz Game Entry Extension

Update existing `gameEntry` in `doFinish()` to include adaptive data:

```javascript
var gameEntry = {
  level: lvObj.key,
  score: totalEarned,
  total: totalMax,
  xp: finalXp,
  pct: pct,  // ← Quiz score percentage (used for masterScore)
  timeSecs: timeSecs,
  timeBonus: tb,
  topic: topic,
  date: today,
  typeStats: typeStats,
  isDaily: isDailyGame || false,
  storyId: currentStoryId || null,
  wpm: wpm,  // ← Reading speed (already implemented)
  
  // NEW: Adaptive difficulty tracking
  masterScore: 0.815,  // Computed per-quiz score
  vocabSnapshot: {     // Vocab state at quiz completion
    known: 52,
    attempted: 67,
    pct: 0.78
  }
};
```

---

## 4. Firebase Schema

### 4.1 Adaptive Difficulty Collection

**Path:** `rq-adaptive-v1`

```json
{
  "rq-adaptive-v1": {
    "user-123": {
      "userId": "user-123",
      "currentLevel": "A2",
      "recommendedLevel": "B1",
      "recommendationHistory": [
        { "level": "B1", "date": "2026-05-09", "quizCount": 1 },
        { "level": "B1", "date": "2026-05-08", "quizCount": 2 }
      ],
      "recommendationCount": 2,
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
      "levelHistory": [
        {
          "level": "A1",
          "startDate": "2026-04-01",
          "endDate": "2026-04-14",
          "quizzes": 10,
          "avgScore": 0.88,
          "reason": "Recommended upgrade to A2"
        },
        {
          "level": "A2",
          "startDate": "2026-04-15",
          "endDate": null,
          "quizzes": 5,
          "avgScore": 0.81
        }
      ],
      "createdAt": "2026-04-01T09:00:00Z",
      "lastUpdated": "2026-05-09T10:30:00Z"
    }
  }
}
```

### 4.2 Integration with Existing Keys

**Existing keys (unchanged):**
- `rq-users-v6` — User account objects (name, hash, games array)
- `rq-vocab-v1` — Vocabulary tracking (words with status, SRS intervals)

**Games array in user object** — Already includes `wpm` and `pct`:
```javascript
games: [
  {
    level: "A2",
    pct: 81,  // Quiz score
    wpm: 110,  // Reading speed
    xp: 1850,
    date: "2026-05-09",
    ...
  }
]
```

---

## 5. Update Trigger & Frequency

### 5.1 When to Recalculate

**Trigger:** After every quiz completion in `doFinish()` function

**Timing:**
1. Quiz finished → `doFinish()` called
2. Compute `masterScore` for current level
3. Fetch current adaptive state from Firebase
4. Append to `masterScores[level]` array (keep last 5)
5. Check recommendation logic
6. If recommendation changed:
   - Increment `recommendationCount`
   - If `recommendationCount >= 2`: Apply + notify user
7. Write updated adaptive object to Firebase (async, non-blocking)
8. Update client-side state for display

### 5.2 Performance Targets

| Operation | Target | Implementation |
|-----------|--------|-----------------|
| **Recalculation** | O(1) | Weighted average formula (constant time) |
| **Update latency** | <100ms | Non-blocking async write to Firebase |
| **Cache refresh** | <500ms | Read adaptive data on app load, store in React state |
| **Recommendation delay** | <1s | Instant check after quiz, 2-quiz hysteresis before apply |

### 5.3 Calculation Pseudocode

```javascript
async function updateAdaptiveDifficulty(userId, currentLevel, gameEntry) {
  // Step 1: Fetch existing adaptive state
  let adaptive = await fetchAdaptiveData(userId);
  if (!adaptive) {
    adaptive = initializeAdaptiveState(userId, currentLevel);
  }
  
  // Step 2: Extract quiz data from gameEntry
  const quizScore = gameEntry.pct / 100;  // Normalize to 0-1
  const wpm = gameEntry.wpm;
  const vocabNow = gameEntry.vocabSnapshot;
  
  // Step 3: Append to masterScores array (keep last 5)
  if (!adaptive.masterScores[currentLevel]) {
    adaptive.masterScores[currentLevel] = [];
  }
  adaptive.masterScores[currentLevel].push(quizScore);
  if (adaptive.masterScores[currentLevel].length > 5) {
    adaptive.masterScores[currentLevel].shift();  // Remove oldest
  }
  
  // Step 4: Update vocabulary mastery for level
  adaptive.vocabMastery[currentLevel] = {
    known: vocabNow.known,
    attempted: vocabNow.attempted,
    pct: vocabNow.pct
  };
  
  // Step 5: Update reading speed (running average)
  if (!adaptive.readingSpeed[currentLevel]) {
    adaptive.readingSpeed[currentLevel] = { wpm: 0, count: 0 };
  }
  const speedData = adaptive.readingSpeed[currentLevel];
  speedData.wpm = (speedData.wpm * speedData.count + wpm) / (speedData.count + 1);
  speedData.count += 1;
  
  // Step 6: Compute new masterScore
  const avgQuizScore = calculateAverage(adaptive.masterScores[currentLevel]);
  const vocabMastery = adaptive.vocabMastery[currentLevel].pct;
  const targetWpm = getTargetWpm(currentLevel);
  const speedRatio = Math.min(wpm / targetWpm, 2.0);  // Cap at 2.0
  
  const newMasterScore = 
    (avgQuizScore * 0.5) + (vocabMastery * 0.3) + (speedRatio * 0.2);
  
  // Step 7: Apply recommendation logic
  const newRecommendation = getRecommendation(newMasterScore, currentLevel);
  const recommendationChanged = (newRecommendation !== adaptive.recommendedLevel);
  
  if (recommendationChanged) {
    adaptive.recommendationCount = 1;
    adaptive.lastRecommendationChange = new Date().toISOString();
  } else {
    adaptive.recommendationCount = 0;
  }
  
  // Step 8: Check if apply (hysteresis)
  if (adaptive.recommendationCount >= 2) {
    adaptive.recommendedLevel = newRecommendation;
    return {
      applied: true,
      oldLevel: adaptive.currentLevel,
      newLevel: newRecommendation,
      reason: `masterScore=${newMasterScore.toFixed(2)} triggers ${newRecommendation}`
    };
  } else {
    adaptive.recommendedLevel = newRecommendation;
    return {
      applied: false,
      suggestion: newRecommendation,
      quizzesNeeded: 2 - adaptive.recommendationCount
    };
  }
  
  // Step 9: Save to Firebase (async, non-blocking)
  adaptive.lastUpdated = new Date().toISOString();
  saveAdaptiveDataAsync(userId, adaptive);
  
  return result;
}

function getRecommendation(masterScore, currentLevel) {
  if (masterScore >= 0.80) {
    return getNextLevel(currentLevel);
  } else if (masterScore < 0.50) {
    return getPrevLevel(currentLevel);
  } else {
    return currentLevel;
  }
}

function getTargetWpm(level) {
  const targets = {
    "A1": 90,
    "A2": 115,
    "B1": 145,
    "B2": 175,
    "C1": 205,
    "C2": 235
  };
  return targets[level] || 115;
}
```

---

## 6. Edge Cases & Error Handling

### 6.1 First Quiz at a Level

```
Scenario: Student just promoted to A2, completes first quiz

Handling:
- No hysteresis (need 2 quizzes for pattern)
- Recommendation based on single score
- Log: "First quiz at A2: score=85%, recommendation pending"
- Don't display recommendation until 2nd quiz
```

### 6.2 Manual Level Selection

```
Scenario: User manually chooses different level instead of recommended

Handling:
- Reset recommendationCount = 0
- Start fresh tracking for new level
- Preserve old level's history in levelHistory[]
- Log: "User manually selected C1 (was at B2)"
- Don't penalize user if they want to explore
```

### 6.3 Level Repeated

```
Scenario: Student at B1 takes 10 quizzes without advancing

Handling:
- Keep rolling average of last 5 quizzes
- Continue updating masterScore after each quiz
- If score remains 50-79%, stay at level (productive struggle)
- Show UI encouragement: "You're building solid B1 skills!"
- Don't force advancement
```

### 6.4 Vocabulary Not Tracked

```
Scenario: User new to app, no vocab words recorded yet

Handling:
- Set vocabMastery = 0.5 (neutral default)
- Recommendation still computes: (avgScore × 0.5) + (0.5 × 0.3) + (speed × 0.2)
- As vocab tracking starts, weight increases naturally
```

### 6.5 Rapid Level Changes (Possible Cheating)

```
Scenario: Student jumps 4 levels in one session (A1 → C1)

Detection:
- if |currentLevel - recommendedLevel| > 3:
    flag as "Anomaly"

Handling:
- Don't apply automatic recommendation
- Admin review required
- Log: "Anomaly detected: user-123 jumped A1→C1 in 1 day"
- Possible causes: cheating, shared account, data corruption
```

### 6.6 Missing WPM Data

```
Scenario: Student completes quiz but reading timer didn't capture WPM (browser crash, etc.)

Handling:
- Assume wpm = 0 or use previous level's average
- Issue: speedRatio = 0 / targetWpm = 0
- Reduces masterScore but doesn't block recommendation
- Log warning for manual review
```

### 6.7 Network Failure on Write

```
Scenario: Firebase write fails after quiz completes

Handling:
- Compute masterScore locally
- Store in localStorage under "rq-adaptive-pending"
- Retry on next app load
- Display: "Syncing... (offline)"
- No recommendation shown until Firebase confirm
```

---

## 7. Client-Side State Management

### 7.1 New React State Variables

In `student-reading-quest.jsx`, add to `useState` declarations:

```javascript
// Adaptive difficulty state
const [adaptiveData, setAdaptiveData] = useState(null);        // Current user's adaptive object
const [masterScore, setMasterScore] = useState(null);          // Latest masterScore after quiz
const [recommendedLevel, setRecommendedLevel] = useState(null); // Next suggested level
const [showLevelRecommendation, setShowLevelRecommendation] = useState(false);
const [recommendationCountdown, setRecommendationCountdown] = useState(0); // Quizzes until applied
```

### 7.2 Load Adaptive Data on Login

In the login/auto-login flow:

```javascript
async function fetchAdaptiveData(userId) {
  try {
    // Try Firebase
    const resp = await fetch('/.netlify/functions/storage?key=rq-adaptive-v1-' + userId);
    if (resp.ok) {
      const data = await resp.json();
      if (data.value) {
        setAdaptiveData(JSON.parse(data.value));
        return;
      }
    }
  } catch (e) {}
  
  // Fallback to localStorage
  const cached = localStorage.getItem('rq-adaptive-v1-' + userId);
  if (cached) {
    setAdaptiveData(JSON.parse(cached));
  } else {
    // Initialize for new user
    setAdaptiveData(initializeAdaptiveState(userId, currentLevel));
  }
}
```

### 7.3 Call updateAdaptiveDifficulty in doFinish()

Add after user and boards are saved:

```javascript
// In doFinish(), after saveUsers() and saveBoards()

const vocabSnapshot = {
  known: vocab.filter(w => w.status === "known").length,
  attempted: vocab.length,
  pct: vocab.length > 0 
    ? vocab.filter(w => w.status === "known").length / vocab.length 
    : 0
};

const gameEntryWithAdaptive = {
  ...gameEntry,
  masterScore: null,  // Will be computed in updateAdaptiveDifficulty
  vocabSnapshot: vocabSnapshot
};

const adaptiveResult = await updateAdaptiveDifficulty(
  currentUser.name,
  lvObj.key,
  gameEntryWithAdaptive
);

if (adaptiveResult.applied) {
  // Show user: "Great progress! We've recommended B1 for you."
  setRecommendedLevel(adaptiveResult.newLevel);
  setShowLevelRecommendation(true);
} else if (adaptiveResult.suggestion) {
  // Show quiet suggestion: "You might be ready for B1 soon!"
  setRecommendedLevel(adaptiveResult.suggestion);
  setRecommendationCountdown(adaptiveResult.quizzesNeeded);
}

// Update local adaptive state
setAdaptiveData(updatedAdaptiveData);
```

---

## 8. UI/UX Display Points

### 8.1 Results Screen Enhancements

After quiz completion, show:

```
┌─────────────────────────────────────┐
│ Quiz Complete!                       │
│ Score: 81% | WPM: 110 | XP: +1850   │
│                                     │
│ 📈 Your Progress (A2):               │
│ Mastery Score: 83% 🟢 Strong        │
│ • Quiz avg: 81%                     │
│ • Vocab mastery: 75%                │
│ • Reading speed: 110 WPM            │
│                                     │
│ 🎯 Next: B1 Ready in 1 more quiz!   │
│ Keep it up! ⭐                       │
└─────────────────────────────────────┘
```

### 8.2 Home Screen Level Selector

Show badge on recommended level:

```
Level Select:
┌─────────┐  ┌─────────┐
│ A1      │  │ A2      │
│ (Master)│  │ (Current)
└─────────┘  └─────────┘
             (83% Mastery)

┌─────────┐  ← "READY!" badge
│ B1      │
│ (Suggested)
└─────────┘
```

### 8.3 Profile Screen Stats

Add "Adaptive Insights" card:

```
📊 ADAPTIVE INSIGHTS
Level Journey: A1 (Apr 1–14) → A2 (Apr 15 – now)
Current Level: A2
Recommended: B1

Performance Trend:
- Quiz scores: ↗ (trending up)
- Vocabulary: ↗ (75% learned)
- Speed: → (110 WPM, stable)

Next milestone: 2 more quizzes at 80%+ for B1
```

---

## 9. Analytics & Logging

### 9.1 Audit Trail

Log all state changes for learning analytics:

```javascript
// Log format
{
  timestamp: "2026-05-09T10:30:00Z",
  userId: "user-123",
  event: "adaptive_update",
  level: "A2",
  masterScore: 0.815,
  avgQuizScore: 0.818,
  vocabMastery: 0.75,
  readingSpeed: 0.974,
  recommendedLevel: "B1",
  recommendationCount: 2,
  action: "recommended_level_change",
  oldLevel: "A2",
  newLevel: "B1",
  reason: "Sustained masterScore >= 0.80"
}
```

### 9.2 Admin Dashboard Queries

Queries for teacher/admin dashboards:

```sql
-- Students ready for level up
SELECT userId, currentLevel, recommendedLevel, masterScore 
FROM adaptive 
WHERE recommendedLevel > currentLevel

-- Students struggling
SELECT userId, currentLevel, masterScore 
FROM adaptive 
WHERE masterScore < 0.50

-- Level journey (progression speed)
SELECT userId, COUNT(*) as levelChanges, 
       MIN(startDate) as firstLevel, MAX(endDate) as currentDate
FROM levelHistory 
GROUP BY userId
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add adaptive state initialization to user signup
- [ ] Implement `updateAdaptiveDifficulty()` function
- [ ] Add Firebase `rq-adaptive-v1` key support
- [ ] Test with 5 sample users

### Phase 2: Integration (Week 2)
- [ ] Wire into `doFinish()` function
- [ ] Update game entry with `vocabSnapshot` and `masterScore`
- [ ] Add React state for adaptive data
- [ ] Test recommendation logic (all 3 branches: up/down/stay)

### Phase 3: UI (Week 3)
- [ ] Add recommendation notification to results screen
- [ ] Badge on level selector
- [ ] "Adaptive Insights" card on profile
- [ ] Countdown display for hysteresis

### Phase 4: Analytics (Week 4)
- [ ] Logging pipeline
- [ ] Teacher dashboard widget
- [ ] A/B test: with/without adaptive on engagement

---

## 11. Testing Strategy

### 11.1 Unit Tests

```javascript
// tests/adaptive.test.js

test('calculateMasterScore with perfect performance', () => {
  const score = calculateMasterScore(1.0, 1.0, 1.0);
  expect(score).toBe(1.0);
});

test('calculateMasterScore with low quiz but high vocab', () => {
  const score = calculateMasterScore(0.4, 0.9, 0.5);
  expect(score).toBe((0.4 * 0.5) + (0.9 * 0.3) + (0.5 * 0.2));
  // 0.2 + 0.27 + 0.1 = 0.57
});

test('getRecommendation >= 0.80 recommends nextLevel', () => {
  const rec = getRecommendation(0.85, 'A2');
  expect(rec).toBe('B1');
});

test('getRecommendation < 0.50 recommends prevLevel', () => {
  const rec = getRecommendation(0.45, 'B1');
  expect(rec).toBe('A2');
});

test('Hysteresis: recommendationCount < 2 does not apply', () => {
  const result = applyHysteresis(
    { recommendationCount: 1, recommendedLevel: 'B1' },
    'A2'
  );
  expect(result.applied).toBe(false);
  expect(result.quizzesNeeded).toBe(1);
});

test('Hysteresis: recommendationCount >= 2 applies', () => {
  const result = applyHysteresis(
    { recommendationCount: 2, recommendedLevel: 'B1' },
    'A2'
  );
  expect(result.applied).toBe(true);
  expect(result.newLevel).toBe('B1');
});

test('MAX_JUMP prevents A1 → C1', () => {
  const clamped = clampLevelJump('A1', 'C1');
  expect(clamped).toBe('A2');  // Only one level jump
});
```

### 11.2 Integration Tests

```javascript
// Simulate quiz → adaptive update flow
test('doFinish triggers adaptive update', async () => {
  // Complete quiz at A2
  // Assert: masterScore computed
  // Assert: stored in Firebase
  // Assert: recommendation logic applied
  // Assert: hysteresis honored
});

test('Manual level selection resets adaptive state', async () => {
  // User at A2, recommended B1
  // User manually selects C1
  // Assert: recommendationCount reset
  // Assert: C1 level history started
});
```

### 11.3 Manual QA Scenarios

```
Scenario 1: Happy Path (Student ready to advance)
1. Student at A2, takes 5 quizzes at 85%+ with 110 WPM
2. After 2nd high-scoring quiz: recommendation shows
3. After 5 more quizzes: verify no spurious recommendations
✓ Recommendation applied on 2nd confirmation

Scenario 2: Struggling Student
1. Student at B1, scores drop to 35%, 42%, 48%
2. After 2 low quizzes: down-recommendation appears
3. If promoted back to A2, verify history log
✓ Hysteresis prevents ping-pong

Scenario 3: Vocabulary Impact
1. Student A2: quiz score 70%, no vocab learned
2. Set vocab to 80% learned, run same quiz score
3. Master score improves due to vocab weight
✓ Vocabulary correctly influences recommendation
```

---

## 12. Performance Considerations

### 12.1 Computation

- **masterScore calc:** O(1) — 3 weighted sums
- **Recommendation logic:** O(1) — if/else tree
- **Array management:** O(5) — keep last 5 quizzes
- **Total per quiz:** <5ms local compute

### 12.2 Storage

| Entity | Size | Per User | Notes |
|--------|------|----------|-------|
| Adaptive object | ~2 KB | 1 | Stored in Firebase |
| Game entry | ~0.2 KB | 15+ | Part of user games array |
| Vocab per level | ~0.1 KB | 6 | Denormalized in adaptive |
| **Total** | — | **~4 KB** | Trivial Firebase cost |

### 12.3 Network

- **Read adaptive:** 1 fetch on login → cached in React state
- **Write adaptive:** Async after quiz (non-blocking to UX)
- **Fallback:** localStorage if offline, sync on reconnect

### 12.4 Caching Strategy

```javascript
// On login
const adaptive = await fetchAdaptiveData(userId);
setAdaptiveData(adaptive);  // Cache in React state

// After quiz
updateAdaptiveData(adaptive);  // Update state
saveAdaptiveDataAsync(userId, adaptive);  // Fire-and-forget write

// Next quiz
// Use cached state; don't re-fetch
```

---

## 13. Future Enhancements

### 13.1 Difficulty Variants

```
Current: Single difficulty per level
Future: Within-level variants (A2-Easy, A2-Standard, A2-Hard)
Recommendation: If score > 95%, try A2-Hard before advancing
Benefit: Finer-grained progression
```

### 13.2 Adaptive Content Selection

```
Current: User selects question types
Future: Recommend types based on weakness
Example: Student weak on "matching" → prioritize in next quiz
Metric: Per-question-type success rate in adaptive tracking
```

### 13.3 Spaced Repetition Integration

```
Current: Vocab tracked separately
Future: Adaptive SRS interval based on level
Example: A2 student, 60% vocab mastery → recommend 3 SRS reviews
Rationale: Boost vocab before promoting to B1
```

### 13.4 Collaborative Difficulty

```
Future: Friend comparison
Example: "You're at A2, friend is at B1. Want to challenge B1?"
Adaptive: Show difficulty delta (quiz score diff, time bonus needed)
```

---

## 14. Appendix: Constants & Formulas

### 14.1 Level Metadata

```javascript
const LEVEL_METADATA = {
  "A1": { ord: 0, targetWpm: 90,  vocabSize: 500 },
  "A2": { ord: 1, targetWpm: 115, vocabSize: 1000 },
  "B1": { ord: 2, targetWpm: 145, vocabSize: 1500 },
  "B2": { ord: 3, targetWpm: 175, vocabSize: 2500 },
  "C1": { ord: 4, targetWpm: 205, vocabSize: 3500 },
  "C2": { ord: 5, targetWpm: 235, vocabSize: 5000 }
};

function getNextLevel(level) {
  const meta = LEVEL_METADATA[level];
  return Object.keys(LEVEL_METADATA).find(k => LEVEL_METADATA[k].ord === meta.ord + 1);
}

function getPrevLevel(level) {
  const meta = LEVEL_METADATA[level];
  return Object.keys(LEVEL_METADATA).find(k => LEVEL_METADATA[k].ord === meta.ord - 1) || level;
}
```

### 14.2 Threshold Justification

| Threshold | Decision | Rationale |
|-----------|----------|-----------|
| ≥ 0.80 | Advance | 80%+ mastery is proven competence |
| 0.50–0.79 | Stay | Productive struggle zone (Vygotsky) |
| < 0.50 | Retreat | Content too hard; frustration risk |

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **masterScore** | Weighted aggregate of quiz score, vocab mastery, and reading speed (0–1) |
| **Hysteresis** | Requirement for 2+ consistent quizzes before applying recommendation |
| **vocabMastery** | Percentage of words learned without translation (0–100%) |
| **readingSpeed** | WPM relative to target for level (normalized to 0–2) |
| **Level Jump** | Movement between CEFR levels; capped at 1 level per recommendation |
| **Recommendation** | System suggestion to move up, down, or stay at current level |
| **Audit Trail** | Timestamped log of all adaptive state changes |

---

## 16. References

- **CEFR Specification:** European Council Framework for Languages
- **Vygotsky Learning Theory:** Zone of Proximal Development (ZPD)
- **SRS (Spaced Repetition):** Ebbinghaus forgetting curve
- **Hysteresis in Systems:** Prevents oscillation in control loops

---

**Document Author:** Backend Architect  
**Reviewed by:** Product Team  
**Status:** Ready for Implementation Sprint  
**Next Review:** After Phase 1 testing
