# Adaptive Difficulty Feature - Edge Cases & Failure Mode Analysis

**Version:** 1.0  
**Date:** 2026-05-09  
**Status:** Comprehensive Edge Case Documentation

---

## Executive Summary

This document analyzes 15+ edge cases and failure modes for the Adaptive Difficulty feature, providing:
- **Failure scenarios** with risk assessment
- **Mitigation strategies** for each edge case
- **Recovery procedures** if failures occur
- **Impact on user experience** (positive/negative)
- **Testing recommendations** to prevent issues

---

## 1. DATA EDGE CASES

### 1.1 Empty/Missing Vocabulary Data

**Scenario:**  
User completes A1 quiz with no vocabulary history (VOCAB_KEY empty or missing).

**Risk:** 
- Algorithm receives vocabMastery = undefined or 0
- masterScore calculation fails or returns NaN

**Code Impact:**
```javascript
// Vulnerable code:
const vocabPct = vocabAttempted > 0 ? vocabKnown / vocabAttempted : 0.5;
// If vocabAttempted = 0, defaults to 0.5 (50% assumed)
// This is SAFE
```

**Mitigation:**
- Default vocabMastery to 0.5 (neutral assumption) if no vocab data
- Log warning: "No vocab data for {userId}, using default 50%"
- Mark quiz as "incomplete_vocab_data" for review

**Recovery:**
- Next quiz: collect vocab data and recalculate
- User sees message: "Collecting more data for accurate recommendations..."

**Testing (TC-029):**
- ✅ Already covered: "First quiz ever"
- Add: vocabAttempted = 0 edge case test

---

### 1.2 Missing WPM Data

**Scenario:**  
User completes quiz but WPM calculation fails (reading timer malfunction).

**Risk:**
- readingSpeed = 0 or NaN
- Algorithm treats speed as 0 WPM
- masterScore artificially low

**Vulnerable Code:**
```javascript
// If readingTimerSecs = 0 or passage.split() fails:
var wpm = getWpmFromSecs(wordCount, 0);  // Returns 0
var speedRatio = wpm / targetWpm; // 0 / 115 = 0
// masterScore includes 0 weight: 0.2 × 0 = 0
```

**Mitigation:**
- Detect invalid WPM: if wpm = 0, default to targetWpm (assume 100% speed)
- Log error: "WPM calculation failed, using default"
- Retry reading timer on next quiz

**Recovery:**
```javascript
const speedRatio = wpm === 0 ? 1.0 : Math.min(wpm / targetWpm, 2.0);
// If no speed data, assume student reads at target pace (neutral)
```

**Testing:**
- Add test: WPM = 0 → speedRatio = 1.0 → masterScore unaffected by speed

---

### 1.3 NaN in Quiz Score Calculation

**Scenario:**  
Quiz scoring returns NaN (e.g., totalMax = 0, question weight error).

**Risk:**
- avgQuizScore = NaN
- masterScore = NaN
- Recommendation = undefined
- Modal doesn't render (empty recommendation value)

**Vulnerable Code:**
```javascript
var pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
// If scoreQuestion() has bug and returns undefined:
// totalEarned = undefined
// pct = NaN
```

**Mitigation:**
- Validate score: `if (isNaN(pct) || pct < 0 || pct > 100) return null`
- Show error modal: "Quiz couldn't be scored. Please try again."
- Don't save quiz to history (or save as "failed")
- Log error with full stack trace

**Testing:**
- Add test: Inject NaN into totalEarned → catch & display error
- Test zero-question quiz (totalMax = 0)

---

### 1.4 Negative or >100% Scores

**Scenario:**  
Quiz scoring bug returns 105% or -5%.

**Risk:**
- Algorithm receives avgQuizScore > 1.0 or < 0
- masterScore calculation goes out of range
- Unexpected behavior: may recommend even though score invalid

**Mitigation:**
```javascript
const avgQuizScore = Math.max(0, Math.min(100, calculatedScore)) / 100;
// Clamp to 0-100% range before normalization
```

**Testing:**
- Test: pct = 105% → clamp to 100% → avgQuizScore = 1.0
- Test: pct = -5% → clamp to 0% → avgQuizScore = 0

---

## 2. ALGORITHM EDGE CASES

### 2.1 Speed Cap Behavior (readingSpeed > 2.0)

**Scenario:**  
User reads extremely fast: 300 WPM at A1 (target 90).

**Math:**
```
readingSpeed = 300 / 90 = 3.33 (uncapped)
Cap at 2.0: speedRatio = 2.0
speedWeight = 0.2 × (2.0 / 2.0) = 0.2
```

**Edge Case:** Speed doesn't help score beyond 2.0x normal.

**Why This Matters:**
- Very fast readers don't get unfair advantage
- Prevents algorithm bias toward speed over comprehension
- Example: 300 WPM + 40% quiz score = masterScore still low (0.40 × 0.5 = 0.20 dominates)

**Testing (TC-032):**
- ✅ Already covered: "Very high scores cap at next level"
- Add: readingSpeed = 2.5 → capped at 2.0 in formula

---

### 2.2 Empty Quiz History (< 5 Prior Quizzes)

**Scenario:**  
User has completed 2 prior quizzes, now takes 3rd.

**Math:**
```
// Algorithm: "keep last 5"
// If only 3 quizzes available: use all 3
masterScores[currentLevel] = [0.70, 0.75, 0.80]
avgQuizScore = (0.70 + 0.75 + 0.80) / 3 = 0.75 (not 5)
```

**Edge Case:** 
- Is 3-quiz average fair? (vs 5-quiz confirmation)
- Hysteresis helps: requires 2+ consistent recommendations before acting

**Design Decision:**
- Allow 1+ quizzes for avgQuizScore (generous early-stage)
- Hysteresis waits for 2nd confirmation before recommendation (defensive)
- Net result: Safe to recommend after ~3 quizzes if consistently high

**Testing:**
- Test with 1, 2, 3, 4, 5 quizzes in history
- Verify hysteresis still requires 2 consistent recs

---

### 2.3 Boundary Values: 0.50 vs 0.5000001

**Scenario:**  
masterScore = 0.50000001 (just above 0.50 threshold).

**Decision Tree:**
```javascript
if (masterScore >= 0.80) → recommend next
else if (masterScore < 0.50) → recommend prev
else → stay
```

**Result:**
- masterScore = 0.50000001 → NOT < 0.50 → STAY (correct)
- masterScore = 0.49999999 → < 0.50 → RECOMMEND PREV (correct)

**Edge Case:**
- Floating-point precision: is >= 0.50 correctly handled?

**Mitigation:**
```javascript
// Use epsilon comparison for boundaries
const EPSILON = 0.0001;
if (masterScore >= 0.80 - EPSILON) { ... }
else if (masterScore < 0.50 + EPSILON) { ... }
```

**Testing (TC-004 to TC-007):**
- ✅ Already covered: Boundary tests at 80%, 79.9%, 50%, 50.1%
- Add: Float precision check with 0.5000001

---

## 3. HYSTERESIS & RECOMMENDATION STATE

### 3.1 Rapid Level Switching (User Clicks "Try A2", Then "Stay A1")

**Scenario:**
1. Quiz 1: 85% → recommendedLevel = A2, recommendationCount = 1
2. User sees modal, clicks "Try A2"
3. currentLevel changes to A2
4. User completes 1 A2 quiz with 42% → recommendedLevel = A1
5. Modal shows: "Move back to A1"
6. User clicks "Stay A2"

**Risk:**
- User bounces between levels rapidly
- Disorienting experience
- Data confusion: which level is "current"?

**Mitigation:**
- Add cooldown: "Can't switch levels again for 24 hours"
- Or: Require 2+ quizzes at new level before allowing downgrade
- Message: "Give A2 a fair try — complete 3 more quizzes first"

**Testing:**
- Test: Level change → cooldown enforcement
- Test: Multiple attempts to downgrade immediately

---

### 3.2 recommendationCount Stuck at High Value

**Scenario:**  
User scores 85% for 10 consecutive quizzes at A2.

**State:**
- recommendedLevel = B1 (same for all 10)
- recommendationCount incrementing: 1, 2, 3, ..., 10

**Risk:**
- recommendationCount = 10 is unnecessary
- Wastes memory (if stored)
- May confuse log analysis

**Mitigation:**
- Cap recommendationCount at 2 (only need confirmation)
- Or reset after recommendation is *acted upon* (user accepts)

**Code:**
```javascript
if (recommendationChanged) {
  recommendationCount = 1;
} else if (recommendationCount < 2) {
  recommendationCount++;
}
// Don't increment past 2
```

**Testing:**
- Test: 10 consecutive same recommendations → recommendationCount stops at 2

---

### 3.3 recommendedLevel Diverges from Actual Recommendation Logic

**Scenario:**  
Bug in recommendation calculation logic, but recommendedLevel field is stale.

**Risk:**
- Modal shows old recommendation (B1)
- Recalculation yields B2 (correct)
- UI and logic are out of sync

**Mitigation:**
- Always recalculate recommendation before displaying modal
- Don't rely solely on stored recommendedLevel
- Validate: `const recommended = getRecommendation(newMasterScore, currentLevel)`
- Compare: if (recommended !== recommendedLevel) log warning

**Testing:**
- Add test: Recalculate vs stored value must match
- Test: After Firebase sync, re-calculate recommendation locally

---

## 4. OFFLINE & SYNC EDGE CASES

### 4.1 User Takes Quiz, Network Drops Mid-Sync

**Scenario:**
1. Quiz completed (stored in localStorage)
2. Auto-sync starts: Firebase write initiated
3. Network drops after 100ms (request in-flight)
4. Callback never fires: sync neither succeeds nor fails

**Risk:**
- Quiz stored locally (safe)
- Firebase doesn't receive update (no loss)
- But sync manager doesn't retry
- On reconnect, may not know sync was attempted

**Mitigation:**
- Use retry logic with exponential backoff
- Store "pending sync" flag: `localStorage.rq-adaptive-pending-sync = true`
- On reconnect, check flag and retry all pending syncs

**Code:**
```javascript
async function autoSyncAdaptive() {
  try {
    await firebaseWrite(adaptiveData);
    localStorage.removeItem('rq-adaptive-pending-sync');
  } catch (e) {
    localStorage.setItem('rq-adaptive-pending-sync', 'true');
    // Retry on next network change event
  }
}

window.addEventListener('online', autoSyncAdaptive);
```

**Testing (TC-014 to TC-017):**
- Add: Interrupt sync mid-request, verify retry on reconnect
- Add: Multiple failed syncs → queue accumulates

---

### 4.2 localStorage Quota Exceeded

**Scenario:**  
User has completed 1000+ quizzes (unlikely but possible).

**Size Estimate:**
- 1000 quizzes × ~200 bytes per quiz = ~200 KB
- Plus vocab, speeds, level history = ~500 KB total
- localStorage limit: typically 5–10 MB (browsers vary)

**Risk:**
- Not immediate risk (500 KB << 5 MB)
- But if user has many apps using storage, could hit limit
- localStorage.setItem() throws QuotaExceededError

**Mitigation:**
- Archive old data: move quizzes older than 6 months to Firebase only
- Trim quiz history: keep only last 5 per level (already done)
- Monitor storage: console.log(estimateStorageUsage())

**Testing:**
- Simulate full localStorage: fill with 4+ MB of test data
- Try to save adaptive data → should handle gracefully (error message)

---

### 4.3 Firebase Offline Persistence Not Enabled

**Scenario:**  
Firebase is configured without offline persistence.

**Risk:**
- On reconnect, old data is fetched fresh
- If sync was pending, data is lost

**Mitigation:**
- Enable Firebase offline persistence: `firebase.firestore().enablePersistence()`
- Or rely on localStorage as primary cache (current architecture)
- Document: "localStorage is source of truth while offline"

**Testing:**
- Verify Firebase persistence config in test environment
- Test: Offline quiz → sync → fetch fresh (should match)

---

## 5. BROWSER & STORAGE EDGE CASES

### 5.1 Private/Incognito Mode: localStorage Disabled

**Scenario:**  
User opens app in Safari private mode, where localStorage is cleared on close.

**Risk:**
- Quiz data not persisted
- Each session starts fresh
- Offline functionality breaks

**Mitigation:**
- Detect private mode: try to set a test value, check if it persists
- Fallback to in-memory store: `let adaptiveState = {...}`
- Message user: "Private mode detected. Recommendations won't be saved between sessions."
- On reconnect, sync to Firebase and restore from there

**Code:**
```javascript
function detectPrivateMode() {
  try {
    localStorage.setItem('_test', '1');
    localStorage.removeItem('_test');
    return false; // Not private
  } catch (e) {
    return true; // Private mode
  }
}
```

**Testing (TC-048):**
- ✅ Already covered: Safari private browsing edge case
- Test: Open app in incognito → complete quiz → no localStorage → message shown

---

### 5.2 Safari "Intelligent Tracking Prevention" (ITP) Clears Storage

**Scenario:**  
Safari ITP policy expires storage for apps with no user interaction recently.

**Risk:**
- localStorage cleared without warning
- Quiz history lost
- But Firebase has copy (if synced)

**Mitigation:**
- On app load, check if localStorage data exists
- If not, fetch from Firebase as recovery
- Message: "Your progress was restored from cloud"

**Testing:**
- Simulate storage loss: localStorage.clear()
- App startup should fetch from Firebase automatically

---

### 5.3 IndexedDB Not Available (Corporate Proxy/Sandboxed)

**Scenario:**  
Some corporate environments block IndexedDB (if future feature uses it).

**Risk:**
- Feature breaks silently
- No fallback to localStorage
- Data loss

**Mitigation:**
- For current feature: use localStorage only (no IndexedDB dependency)
- Test in locked-down environments (if possible)
- Graceful degradation: if IndexedDB unavailable, use localStorage only

**Testing:**
- Block IndexedDB in DevTools: DevTools → Settings → disable IndexedDB
- Verify localStorage still works

---

## 6. PERFORMANCE EDGE CASES

### 6.1 Algorithm Recalculation on Every State Change

**Scenario:**  
React re-render causes updateAdaptiveDifficulty() to run on every quiz screen update.

**Risk:**
- Algorithm runs 100+ times for single quiz completion
- Firebase writes batched: 5+ writes per quiz
- Unnecessary API calls, slower app

**Mitigation:**
- Call updateAdaptiveDifficulty() only once: after quiz submission
- Wrap in useCallback or gate with flag: `let hasCalculated = false`
- Firebase: use batch writes or debounce
- Test: Monitor Firebase logs for duplicate writes

**Code:**
```javascript
const [hasCalculated, setHasCalculated] = useState(false);

async function doFinish() {
  // ... score calculation ...
  if (!hasCalculated) {
    await updateAdaptiveDifficulty(currentUser.name, level, gameEntry, vocab);
    setHasCalculated(true); // Prevent re-runs
  }
}
```

**Testing (TC-041 to TC-043):**
- ✅ Already covered: Performance benchmarks
- Add: Monitor Firebase call count for single quiz → should be 1–2, not 100+

---

### 6.2 WPM Calculation with Extremely Short/Long Passages

**Scenario:**  
A1 passage is 10 words (typo/test), user reads in 5 seconds.

**Math:**
```
WPM = 10 / (5/60) = 10 / 0.0833 = 120 WPM (suspicious)
```

**Risk:**
- Extremely fast/slow WPM outliers distort average
- Not meaningful for A1 level

**Mitigation:**
- Validate passage length: if < 50 words, flag as "invalid passage"
- Skip WPM calculation for invalid passages
- Message user: "Passage too short, try another"

**Testing:**
- Test: 10-word passage → WPM = outlier → handled gracefully
- Test: 2000-word passage → WPM = very low → handled gracefully

---

### 6.3 Memory Leak from Event Listeners (Window.online/offline)

**Scenario:**  
setupAdaptiveListeners() attaches window.addEventListener('online', autoSync) but never removes.

**Risk:**
- Multiple listeners stack up
- Sync runs 5× on reconnect (5 listeners)
- Memory growth with repeated app loads

**Mitigation:**
- Remove listeners on cleanup: `window.removeEventListener('online', autoSync)`
- Use useEffect cleanup in React: `return () => removeEventListener(...)`

**Code:**
```javascript
useEffect(() => {
  const handleOnline = () => autoSyncAdaptive();
  window.addEventListener('online', handleOnline);
  
  return () => {
    window.removeEventListener('online', handleOnline); // Cleanup
  };
}, []);
```

**Testing (TC-043):**
- Add: Take 10 quizzes → check memory usage (DevTools → Memory)
- Should not grow unbounded

---

## 7. USER INTERACTION EDGE CASES

### 7.1 User Dismisses Modal Multiple Times (Modal Appears Again Immediately)

**Scenario:**
1. Quiz 1: 85% → Modal appears
2. User clicks "Stay" → Modal closes
3. Quiz 2: 86% (same level, still qualifies)
4. Modal appears again immediately
5. User clicks "Stay" again

**UX Risk:**
- Repetitive experience
- User frustrated: "Why keep asking?"

**Mitigation:**
- Add snooze logic: "Ask me again in 3 sessions" (TC-026)
- Or: Don't show recommendation again if just dismissed (24-hour cooldown)
- Track: dismissedRecommendations = [{level: "B1", dismissedAt: "2026-05-09T12:00:00Z"}]

**Code:**
```javascript
const lastDismissed = dismissedRecommendations.find(r => r.level === recommendedLevel);
const dismissedRecently = lastDismissed && (now - lastDismissed.dismissedAt < 86400000); // 24h

if (dismissedRecently && !snoozeExpired) {
  // Don't show modal
} else {
  // Show modal
}
```

**Testing:**
- Test: Dismiss modal → take quiz qualifying again → verify cooldown

---

### 7.2 User Rapidly Clicks "Try Next Level" Button Multiple Times

**Scenario:**
User double-clicks button, or clicks while async operation is in-flight.

**Risk:**
- currentLevel changes to A2, then A2 again (duplicate)
- Navigation happens twice
- Data inconsistency

**Mitigation:**
- Disable button after click: `button.disabled = true`
- Or: Track pending state and prevent re-clicks
- Debounce: wait 500ms before enabling button again

**Code:**
```javascript
const [isTransitioning, setIsTransitioning] = useState(false);

async function acceptRecommendation() {
  if (isTransitioning) return; // Prevent double-click
  setIsTransitioning(true);
  
  // ... navigate to new level ...
  
  setIsTransitioning(false);
}

<button onClick={acceptRecommendation} disabled={isTransitioning}>
  Try A2
</button>
```

**Testing:**
- Test: Rapid double-click → only one level change occurs
- Monitor currentLevel: should change once, not twice

---

### 7.3 User Changes Level Manually, Then Sees Recommendation for Old Level

**Scenario:**
1. At A2, receives B1 recommendation (shows in profile)
2. User manually selects B1 from home
3. currentLevel = B1
4. But profile still shows B1 recommendation (stale)

**Risk:**
- Confusion: "Am I already at B1, or is it recommended?"

**Mitigation:**
- Update recommendedLevel when user manually changes level
- Reset to null or to same as currentLevel
- Message: "You've selected B1. Complete quizzes to unlock B2."

**Code:**
```javascript
function selectLevel(newLevel) {
  setCurrentLevel(newLevel);
  setRecommendedLevel(newLevel); // Clear recommendation for old level
}
```

**Testing (TC-030):**
- ✅ Already covered: "Manual level select resets recommendation"

---

## 8. DATA CONSISTENCY EDGE CASES

### 8.1 Firebase Write Succeeds, But Response Is Malformed

**Scenario:**  
Firebase returns HTTP 200 but JSON is broken: `{currentLevel: null, ...}`.

**Risk:**
- App assumes write succeeded
- But data is corrupted on server
- Next read fetches broken data

**Mitigation:**
- Validate response schema before accepting
- Check: currentLevel is in LEVEL_ORDER, masterScores is object, etc.
- If invalid, treat as failure and retry

**Code:**
```javascript
async function updateAdaptiveDifficulty(...) {
  const newData = {...};
  try {
    const response = await firebaseWrite(newData);
    
    // Validate schema
    if (!validateAdaptiveSchema(response)) {
      throw new Error('Invalid response schema');
    }
    
    return response;
  } catch (e) {
    // Retry or fallback
  }
}
```

**Testing:**
- Add: Mock Firebase to return malformed JSON
- Verify retry or error handling

---

### 8.2 Two Devices Sync Conflicting Data Simultaneously

**Scenario:**  
Device A completes quiz at A2 and syncs.  
Device B (offline) completes quiz at A1, then syncs.  
Both try to update Firebase at same time.

**Risk:**
- Last-write-wins: Device B's older data overwrites Device A's newer data
- User loses progress

**Mitigation:**
- Use Firebase timestamps: compare `lastUpdated` fields
- Merge strategy: Newest timestamp wins
- Or: Use Cloud Functions to handle merge logic server-side

**Code:**
```javascript
const localData = {..., lastUpdated: new Date().toISOString()};
const remoteData = await fetchAdaptive(userId);

if (remoteData.lastUpdated > localData.lastUpdated) {
  // Remote is newer, use it
  return remoteData;
} else {
  // Local is newer, push it
  return firebaseWrite(localData);
}
```

**Testing (TC-039):**
- ✅ Already covered: Sync conflict with 5 local + 5 remote scores
- Add: Simultaneous writes from two devices

---

### 8.3 Partial Quiz Data Saved (Out of 6 Questions, Only 5 Saved)

**Scenario:**  
Firebase write initiated with gameEntry, but user closes browser before write completes.

**Risk:**
- Quiz partially recorded
- Scoring is wrong (5/6 vs 6/6)
- Average is skewed

**Mitigation:**
- All-or-nothing: Don't save quiz until fully scored locally
- Only call updateAdaptiveDifficulty() after all scoring complete
- Use transactions: Firebase atomic write

**Code:**
```javascript
// Don't call updateAdaptiveDifficulty until here:
const totalEarned = scoreAll6Questions();
const totalMax = 6 * maxPerQuestion;

if (totalEarned && totalMax) {
  // NOW call sync
  await updateAdaptiveDifficulty(...);
}
```

**Testing:**
- Test: Simulate browser close mid-sync
- Verify quiz not saved (or fully saved)

---

## 9. ALGORITHM ACCURACY EDGE CASES

### 9.1 First Quiz Has Extreme Score (99%, 1%)

**Scenario:**  
User's very first quiz is 99%.

**Math:**
```
masterScores[A1] = [0.99]
avgQuizScore = 0.99
With typical vocab (80%), speed (1.0):
masterScore = (0.99 × 0.5) + (0.80 × 0.3) + (1.0 × 0.2) = 0.495 + 0.24 + 0.2 = 0.935
```

**Issue:**
- recommendationCount = 1 (not 2 yet)
- Hysteresis prevents recommendation showing (good)
- But if Quiz 2 is also 99%, recommendation appears

**Edge Case:** Should exceptional first quiz allow fast progression?

**Answer:** Hysteresis says "wait for 2nd quiz" (safe)

**Testing (TC-029):**
- ✅ Already covered: First quiz no recommendation
- Add: First quiz 99% + Second quiz 99% → recommendation appears

---

### 9.2 avgQuizScore Calculated With Different Weights Accidentally

**Scenario:**  
Bug: avgQuizScore uses 3 quizzes but algorithm expects 5.

**Math:**
```
Buggy: avg = (0.75 + 0.80 + 0.85) / 3 = 0.80
Expected: (0.75 + 0.80 + 0.85 + ?) / 5
```

**Risk:**
- Recommendation threshold crossed when shouldn't have
- Student advanced too quickly

**Mitigation:**
- Validate: array length matches expectation
- Log warning: "avgQuizScore calculation uses {n} quizzes, expected 5"
- Test: Assert array length before calculation

**Testing:**
- Add: Force quiz array length != 5, verify warning logged

---

### 9.3 Multiple Quiz Attempts at Same Level — Averaging Logic

**Scenario:**  
User takes Story A at A1, scores 75%.  
User retakes Story A at A1, scores 90%.  
Should both counts be in average?

**Design Decision:** Keep only latest attempt (fairest for motivation)

**Edge Case:** What if Story B is newer, user goes back to Story A?

**Timeline:**
- Day 1: Story A (75%), Story B (80%), Story C (85%)
- Day 2: Story B (90%) [retake, score improves]
- Day 3: Story A (95%) [retake, score improves]

**Correct Average:** Only latest per story: [85%, 90%, 95%] = 90%

**Risk:** Implementation may use all attempts: [75%, 80%, 85%, 90%, 95%] = 85% (lower)

**Mitigation:**
- Track per-story best score, or latest score (both defensible)
- If using "latest", deduplicate by story ID before averaging

**Code:**
```javascript
const latestByStory = {};
games.forEach(g => {
  if (g.level === currentLevel) {
    latestByStory[g.storyId] = g.pct; // Overwrite if duplicate story
  }
});
const scores = Object.values(latestByStory);
const avgQuizScore = scores.reduce((a, b) => a + b, 0) / scores.length;
```

**Testing (TC-031):**
- ✅ Already covered: Quiz retake don't count duplicate
- Add: Multiple retakes of different stories → average uses latest only

---

## 10. RECOVERY & MITIGATION SUMMARY TABLE

| Edge Case | Risk Level | Detection | Mitigation | Test Case |
|-----------|-----------|-----------|-----------|-----------|
| Empty vocab data | Medium | isNaN(vocabMastery) | Default 0.5, log warning | TC-029 |
| Missing WPM | Medium | wpm === 0 | Default 1.0 speed ratio | Add test |
| NaN quiz score | High | isNaN(pct) | Validate, show error | Add test |
| Negative/high scores | Medium | pct < 0 \|\| pct > 100 | Clamp to 0–100 | Add test |
| Speed cap > 2.0 | Low | speedRatio > 2.0 | Cap at 2.0 | TC-032 |
| Network drops mid-sync | Medium | Retry logic | Queue pending, retry on online | TC-014-017 |
| localStorage quota | Low | QuotaExceededError | Archive old data | Add test |
| Private mode no storage | Medium | localStorage unavailable | In-memory fallback | TC-048 |
| Double-click button | Low | isTransitioning state | Debounce/disable button | Add test |
| Conflicting syncs | Medium | lastUpdated comparison | Merge by timestamp | TC-039 |
| Partial quiz save | High | Close browser mid-write | All-or-nothing, transactions | Add test |
| First quiz extreme score | Low | 1st quiz + high score | Hysteresis protects | TC-029 |
| Retake averaging bug | Medium | scores.length !== 5 | Deduplicate by story | TC-031 |

---

## 11. Failure Mode & Effects Analysis (FMEA)

### For Production Deployment

| Failure Mode | Severity | Probability | Detection | Mitigation |
|---|---|---|---|---|
| Algorithm returns NaN | Critical | Low | Console errors | Input validation |
| Recommendation wrong level | High | Low | Unit tests (10 calcs) | Algorithm verification |
| Firebase sync fails silently | High | Medium | Retry logic + logs | Exponential backoff |
| localStorage quota exceeded | Medium | Very Low | Error handling | Archive old data |
| User data lost on cache clear | High | Low | Firebase recovery | Fetch on app load |
| Modal doesn't appear | High | Medium | E2E tests | UI/component tests |
| Performance regression (>100ms) | Medium | Low | Benchmarks | Monitor metrics |
| Cross-browser compatibility | Medium | Low | CI/CD tests | Browser testing |
| Offline sync corruption | High | Low | Schema validation | Data validation tests |

---

## 12. Testing Recommendations for Edge Cases

### Add to Test Plan

1. **Empty data tests:**
   - vocabAttempted = 0 → vocabMastery = 0.5
   - wpm = 0 → speedRatio = 1.0
   - masterScores = [] → avgQuizScore = 0

2. **Boundary precision:**
   - masterScore = 0.5000001 → stay
   - masterScore = 0.4999999 → drop
   - Float comparison with epsilon

3. **Retry logic:**
   - Network drop mid-sync
   - Offline quiz → 5 quizzes offline → sync batch on reconnect
   - Multiple failed retries

4. **Performance:**
   - Memory leak check: 100 quizzes → memory growth < 50MB
   - Duplicate Firebase writes: should be 1–2 per quiz, not 100+

5. **User interaction:**
   - Rapid button clicks
   - Manual level select during pending recommendation
   - Modal dismiss cooldown

6. **Data validation:**
   - Malformed Firebase response
   - Partial quiz save
   - Sync conflict (simultaneous writes)

---

## Conclusion

The Adaptive Difficulty feature is robust to edge cases when properly implemented with:
- ✅ Input validation (NaN, out-of-range checks)
- ✅ Hysteresis (prevent recommendation bounce)
- ✅ Offline fallback (localStorage → Firebase on reconnect)
- ✅ Performance safeguards (debounce, event cleanup)
- ✅ Error handling (try/catch, graceful degradation)

**Critical tests (must pass before release):**
- TC-018 to TC-022 (Algorithm calculations)
- TC-014 to TC-017 (Offline sync)
- TC-001 to TC-003 (Happy path)
- Performance benchmarks (TC-041 to TC-043)

**Nice-to-have tests (should pass if time allows):**
- Edge case recovery scenarios
- Browser private mode handling
- Advanced retry logic

---

End of Edge Cases Analysis
