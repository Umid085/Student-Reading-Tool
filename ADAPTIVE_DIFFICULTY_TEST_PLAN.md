# Adaptive Difficulty Feature - Comprehensive Test Plan

**Version:** 1.0  
**Date:** 2026-05-09  
**QA Specialist:** Test Plan Framework  
**Status:** Ready for Implementation & QA Execution

---

## Executive Summary

This test plan provides 40+ test cases covering the Adaptive Difficulty feature, which automatically recommends CEFR level progression based on quiz performance, vocabulary mastery, and reading speed. The feature uses a weighted algorithm with hysteresis logic to prevent level bouncing, stores data in Firebase with localStorage fallback, and displays recommendations via modal, home screen, and profile views.

**Key Deliverables:**
- 40 structured test cases across 12 categories
- Edge case analysis and failure scenarios
- Performance benchmarks and responsive design validation
- Manual algorithm verification with 10+ calculations
- Offline sync behavior testing
- Mobile responsiveness (320px–2560px)

---

## Test Strategy

### Approach
- **Unit Testing:** Algorithm calculations in isolation
- **Integration Testing:** Algorithm + Firebase/localStorage sync
- **UI/UX Testing:** Modal, buttons, navigation flows
- **Performance Testing:** Response times and no memory leaks
- **Mobile Testing:** Responsive layout across screen sizes
- **Offline Testing:** localStorage fallback and sync recovery

### Test Environment
- **Browsers:** Chrome, Safari, Firefox, Edge (latest versions)
- **Devices:** Desktop (1920×1080), Tablet (768×1024), Mobile (320×568)
- **Network:** Online, Offline (simulate with DevTools), Poor Network (throttled 4G)
- **Database:** Test Firebase instance + localStorage inspection via DevTools

### Assumptions
- Feature is fully implemented per ADAPTIVE_IMPLEMENTATION.md
- Firebase is configured and accessible
- WPM tracker captures reading time correctly
- Vocabulary tracker maintains word status ("known" / "learning")
- User session and credentials are persisted in localStorage

---

## Test Execution Timeline

| Phase | Duration | Start Date | End Date | Owner |
|-------|----------|-----------|----------|-------|
| Setup & Configuration | 2 days | Day 1 | Day 2 | QA Lead |
| Unit Testing | 3 days | Day 3 | Day 5 | QA Engineer 1 |
| Integration Testing | 4 days | Day 6 | Day 9 | QA Engineer 2 |
| UI/UX Testing | 3 days | Day 10 | Day 12 | QA Engineer 1 |
| Performance & Mobile | 3 days | Day 13 | Day 15 | QA Engineer 2 |
| Regression Testing | 2 days | Day 16 | Day 17 | QA Lead |
| **Total** | **17 days** | | | |

---

## 1. HAPPY PATH TESTS (3 test cases)

### TC-001: User Scores 85% on A1 Quiz → Recommendation for A2 Appears

**Preconditions:**
- User is logged in at A1 level
- User has completed at least 1 prior quiz at A1 to establish history
- Recommendation modal component is rendered in quiz results screen

**Steps:**
1. Complete A1 reading passage (any story)
2. Answer 6-question quiz with 85% accuracy (≥5 correct answers)
3. Observe results screen after quiz submission

**Expected Results:**
- Recommendation modal appears within 1 second of quiz completion
- Modal displays: "Great job! You're ready for A2" or similar message
- Master score displays as 0.80+ (calculated from 85% quiz + vocab/speed metrics)
- "Try A2" button is visible and clickable
- "Stay at A1" button is visible for dismissal
- Modal is centered on screen with appropriate z-index above content

**Acceptance Criteria:**
- Modal appears consistently (100% reproducibility across 5 quiz attempts)
- Correct recommendation level (A2) is displayed
- No console errors or network failures during calculation

---

### TC-002: User Clicks "Try It" Button → Navigation to A2 Story List

**Preconditions:**
- TC-001 passed (recommendation modal visible)
- A2 stories are available in backend

**Steps:**
1. From recommendation modal, click "Try A2" button
2. Observe screen transition
3. Verify story list loads

**Expected Results:**
- Modal closes immediately
- Navigation to home screen occurs smoothly (no visual glitch)
- Story list displays A2-level stories only (not A1)
- Story difficulty labels show "A2" badge
- WPM target updates to A2 baseline (115 WPM)
- User's currentLevel state updates to "A2"

**Acceptance Criteria:**
- Navigation completes in <500ms
- A2 stories load without delay
- No broken links or missing story data
- Level indicator reflects new level immediately

---

### TC-003: Recommendation Persists Across Sessions

**Preconditions:**
- TC-002 passed (user has moved to A2)
- User has completed ≥2 A2 quizzes with high scores (≥80%)

**Steps:**
1. Complete second A2 quiz with 82% score (master score ≥0.80)
2. Verify B1 recommendation appears
3. Close browser completely (clear session)
4. Re-open app and log in with same credentials
5. Navigate to profile or home screen

**Expected Results:**
- On first login after session clear, user is on A2 level (currentLevel = "A2")
- If navigating to results screen from stored game history, B1 recommendation still appears
- Profile shows A2 as current level and B1 as recommended level
- Firebase shows recommendedLevel = "B1" in rq-adapted-v1/{userId}

**Acceptance Criteria:**
- Recommendation persists in Firebase (not ephemeral)
- Session recovery doesn't lose adaptive state
- localStorage and Firebase are in sync post-login

---

## 2. MASTERY THRESHOLDS (6 test cases)

### TC-004: Score 80% Exactly = Recommendation Appears (Boundary)

**Preconditions:**
- User at A1, prior quiz average = 70%
- Current quiz setup with exactly 80% correct answers possible

**Steps:**
1. Complete A1 quiz scoring exactly 80% (4/5 or 8/10 depending on format)
2. Calculate: avgQuizScore = (70% + 80%) / 2 = 75% = 0.75
3. With typical vocab (70%) and speed (100%) metrics:
   - masterScore = (0.75 × 0.5) + (0.70 × 0.3) + (1.0 × 0.2)
   - masterScore = 0.375 + 0.21 + 0.2 = 0.785 (78.5%)
4. If only 1 quiz prior, avgQuizScore = 80% alone → 0.8 masterScore

**Expected Results:**
- If avgQuizScore reaches exactly 0.80 or higher, recommendation appears
- Boundary case: 80% is treated as "≥0.80" (inclusive), triggers recommendation
- Modal shows recommendation to next level

**Acceptance Criteria:**
- Exact 80% threshold correctly triggers recommendation
- No off-by-one errors in comparison logic
- Algorithm matches documented specification

---

### TC-005: Score 79.9% = Stay at Current Level

**Preconditions:**
- User at A1 with prior average scores, unable to reach 80% on current quiz
- Quiz design allows 79.9% (e.g., 7.99/10 if fractional scoring)

**Steps:**
1. Complete A1 quiz scoring 79.9%
2. Calculate masterScore with typical metrics
3. Verify masterScore < 0.80 (likely 0.799)

**Expected Results:**
- Recommendation modal does NOT appear
- Quiz results screen shows "Keep practicing" or "Good effort" message
- Current level remains A1
- No recommendation change logged

**Acceptance Criteria:**
- Below-0.80 threshold correctly prevents recommendation
- No false positives at boundary

---

### TC-006: Score 50% Exactly = Drop Recommendation Appears (Boundary)

**Preconditions:**
- User at B1 level
- Score 50% on quiz, with low vocabulary/speed metrics such that masterScore < 0.50

**Steps:**
1. Complete B1 quiz with 50% accuracy
2. Assume low vocab mastery (30%) and slow reading (80 WPM vs 145 target):
   - readingSpeed = 80/145 = 0.55
   - masterScore = (0.50 × 0.5) + (0.30 × 0.3) + (0.55 × 0.2)
   - masterScore = 0.25 + 0.09 + 0.11 = 0.45 (45%) < 0.50
3. Verify recommendation appears to drop to B1 (or A2 if hysteresis permits)

**Expected Results:**
- If masterScore < 0.50 exactly (0.50 is not inclusive), drop recommendation appears
- Modal suggests: "Try B1 to consolidate skills" or "Move to easier level"
- Recommended level = prevLevel(B1) = B1 or B2 depending on prior state

**Acceptance Criteria:**
- Below-0.50 threshold triggers downward recommendation
- Correct previous level is offered

---

### TC-007: Score 50.1% = Stay at Current Level

**Preconditions:**
- User at B1, prior scores average around 55%
- Current quiz scores 50.1% with metrics that keep masterScore 0.50–0.80

**Steps:**
1. Complete B1 quiz with 50.1% accuracy
2. Calculate masterScore = 0.52 (example within stay zone)
3. Verify no recommendation (neither up nor down)

**Expected Results:**
- Recommendation modal does NOT appear
- Results show "Steady progress" message
- Current level remains B1
- No level change logged

**Acceptance Criteria:**
- Middle-zone (0.50–0.80) correctly prevents recommendation
- User stays at current level

---

### TC-008: Average of 5 Scores [90, 85, 80, 70, 65] = 78% = Stay (Not Yet at 80%)

**Preconditions:**
- User has taken 5 quizzes at A2:
  - Quiz 1: 90%
  - Quiz 2: 85%
  - Quiz 3: 80%
  - Quiz 4: 70%
  - Quiz 5: 65%

**Steps:**
1. Calculate avgQuizScore = (90 + 85 + 80 + 70 + 65) / 5 = 390 / 5 = 78%
2. With typical vocab (72%) and speed (100%):
   - masterScore = (0.78 × 0.5) + (0.72 × 0.3) + (1.0 × 0.2)
   - masterScore = 0.39 + 0.216 + 0.2 = 0.806 (80.6%) ≥ 0.80
3. If vocab is lower (60%):
   - masterScore = 0.39 + 0.18 + 0.2 = 0.77 (77%) < 0.80

**Expected Results:**
- Depending on vocab/speed metrics, recommendation may or may not appear
- If masterScore < 0.80 (e.g., 77%), no recommendation appears
- Results show user is "close to leveling up" with progress bar
- Next quiz can push over 80% if scores continue upward

**Acceptance Criteria:**
- Averaging algorithm correctly computes 78% baseline
- Weighted formula applies vocab and speed correctly
- Boundary behavior at ~79–81% is consistent

---

### TC-009: Hysteresis: 1 Score at 85% = No Recommendation; 2 Scores at 85% = Yes

**Preconditions:**
- User at A2 level, no prior recommendation for B1

**Steps:**
1. **Quiz 1:** Score 85% → masterScore 0.83 → recommendationCount = 1
2. Verify recommendation NOT shown yet
3. Navigate away from results screen (back to home)
4. **Quiz 2:** Score 84% → masterScore 0.82 → recommendationCount = 2
5. Verify recommendation now shown

**Expected Results:**
- After Quiz 1:
  - recommendedLevel updates to B1 internally
  - recommendationCount = 1
  - Modal does NOT appear (wait for confirmation)
- After Quiz 2:
  - recommendationCount = 2 (≥2 threshold met)
  - Recommendation modal appears
  - Message: "You've consistently performed well. Ready for B1?"

**Acceptance Criteria:**
- Hysteresis logic requires 2+ consecutive same-direction recommendations
- Single spike in performance doesn't trigger recommendation
- UI prevents recommendation display until threshold met

---

## 3. MULTI-LEVEL PROGRESSION (4 test cases)

### TC-010: A1 → A2 → B1 → B2 → C1 → C2 (6-Level Journey)

**Preconditions:**
- Fresh user account at A1
- Stories available for all 6 levels
- Firebase configured for tracking progression

**Steps:**
1. Complete 3–5 A1 quizzes, scoring average 82% → trigger A2 recommendation (hysteresis met)
2. Accept "Try A2" recommendation
3. Verify currentLevel = "A2" in state
4. Complete 3–5 A2 quizzes, scoring average 83% → trigger B1 recommendation
5. Accept B1 → currentLevel = "B1"
6. Complete 3–5 B1 quizzes, scoring average 84% → trigger B2 recommendation
7. Accept B2 → currentLevel = "B2"
8. Complete 3–5 B2 quizzes, scoring average 85% → trigger C1 recommendation
9. Accept C1 → currentLevel = "C1"
10. Complete 3–5 C1 quizzes, scoring average 86% → trigger C2 recommendation
11. Accept C2 → currentLevel = "C2"
12. Verify profile shows complete level history with dates

**Expected Results:**
- User progresses through all 6 levels without skipping
- Each level change is logged in Firebase (levelHistory array)
- Profile displays timeline: A1 (dates) → A2 (dates) → ... → C2 (dates)
- Total progression takes ~15–20 quizzes (3–4 days of activity)
- No console errors or data corruption

**Acceptance Criteria:**
- Complete progression chain with all intermediate levels
- Data integrity: no orphaned records or lost history
- Firebase records all transitions with timestamps

---

### TC-011: Jump Prevention: Cannot Jump A1 → B1 (Stuck at A2)

**Preconditions:**
- User at A1 with exceptional quiz scores (90%+)
- Recommendation system attempts to recommend B1

**Steps:**
1. Complete A1 quiz with 95% score
2. Even with masterScore 0.90 (>0.80), system recommends nextLevel(A1) = A2
3. Accept A2 recommendation
4. Still at A2, attempt to manually change level to B1 in UI
5. Or complete A2 quiz with 95% and trigger B1 recommendation
6. Verify system prevents direct A1→B1 jump

**Expected Results:**
- Algorithm only recommends nextLevel() = A2 (not B1)
- If user tries to manually select B1 from home screen (if UI allows), system resets to A2
- Jump prevention logic executes: `MAX_JUMP = 1 level per recommendation`
- Error message or notification: "Please master A2 first"

**Acceptance Criteria:**
- No level jumps >1 allowed
- Manual selection also respects jump limit
- Clear messaging to user about progression rules

---

### TC-012: Downward Progression: B2 at 40% → Drops to B1

**Preconditions:**
- User currently at B2 level (from prior progression)
- User struggles with B2 content

**Steps:**
1. Complete B2 quiz with 40% accuracy
2. Assume low vocab (30%) and slow speed (140 WPM vs 175 target):
   - masterScore = (0.40 × 0.5) + (0.30 × 0.3) + (0.80 × 0.2)
   - masterScore = 0.20 + 0.09 + 0.16 = 0.45 (45%) < 0.50
3. Trigger drop recommendation
4. Complete second B2 quiz at 42% (masterScore still <0.50)
5. Hysteresis met → recommendation confirmed

**Expected Results:**
- Recommendation modal: "B2 is challenging. Let's move to B1 to strengthen skills."
- "Move to B1" button appears
- Upon acceptance, currentLevel = "B1"
- Firebase logs level change: {from: "B2", to: "B1", reason: "low_mastery"}

**Acceptance Criteria:**
- Downward recommendations work symmetrically with upward
- User can move backward without penalty or friction
- Clear explanation provided

---

### TC-013: Plateau: B1 at 70% for 10 Quizzes → Stays B1 (No Up, No Down)

**Preconditions:**
- User at B1 level
- Ability to simulate 10 consecutive quizzes

**Steps:**
1. Complete 10 B1 quizzes, each scoring 70%
2. Assume stable vocab (65%) and speed (130 WPM vs 145 target):
   - masterScore = (0.70 × 0.5) + (0.65 × 0.3) + (0.90 × 0.2)
   - masterScore = 0.35 + 0.195 + 0.18 = 0.725 (72.5%) ∈ [0.50, 0.80]
3. Verify no recommendation appears across all 10 quizzes
4. Check profile learning journey: B1 duration increases

**Expected Results:**
- No recommendation modal appears after any of 10 quizzes
- masterScore stays ~0.72, always in "stay current" zone
- recommendedLevel = "B1" throughout
- Profile shows extended time at B1 without transition
- User gets motivational message: "You're building strong skills at B1"

**Acceptance Criteria:**
- Stable, consistent performance prevents unnecessary level changes
- Psychological safety: user isn't penalized for steady progress
- Plateau is healthy and normal

---

## 4. OFFLINE & SYNC (4 test cases)

### TC-014: Take Quiz Offline → Recommendation Stored in localStorage

**Preconditions:**
- User logged in and app cached
- Network connectivity disabled (DevTools → Offline)
- User has prior quiz history

**Steps:**
1. Disable network (DevTools Network tab → Offline)
2. Verify page still loads and app is functional
3. Complete A1 quiz, score 82% (masterScore 0.81)
4. Observe results screen with recommendation modal
5. Click "Stay at A1" or "Try A2"
6. Verify localStorage contains new quiz data

**Expected Results:**
- Quiz is scored and stored in localStorage immediately
- recommendedLevel is calculated and stored locally
- Modal displays recommendation normally (no error)
- localStorage key "rq-adapted-scores-A1" contains latest 5 scores
- localStorage key "rq-adapted-recommended" = "A2"
- No network error messages or failed API calls blocking UX

**Acceptance Criteria:**
- Offline quiz completion works seamlessly
- All adaptive data written to localStorage
- No "offline" warning unless critical (auto-sync queued)

---

### TC-015: Come Online → Sync to Firebase Automatically

**Preconditions:**
- TC-014 passed (quiz completed offline)
- User is still on app or returns shortly after

**Steps:**
1. Re-enable network (DevTools → Online)
2. Verify app detects online status
3. Wait 2 seconds for auto-sync to trigger
4. Check Firebase console (or test function logs)
5. Verify firebase write to rq-adapted-v1/{userId}/

**Expected Results:**
- Auto-sync fires without user interaction
- Firebase document receives:
  ```json
  {
    "userId": "user123",
    "currentLevel": "A1",
    "recommendedLevel": "A2",
    "masterScores": { "A1": [0.70, 0.75, 0.81] },
    "lastUpdated": "2026-05-09T12:00:00Z"
  }
  ```
- localStorage and Firebase match exactly
- No duplicate writes or corruption
- Sync completes in <500ms

**Acceptance Criteria:**
- Auto-sync works reliably on reconnect
- Data integrity: no loss or duplication
- Firebase is source of truth post-sync

---

### TC-016: Take 5 Quizzes Offline → All Sync on Reconnect

**Preconditions:**
- Network disabled at start of session
- User can complete multiple quizzes in offline mode

**Steps:**
1. Disable network
2. Complete 5 quizzes offline (A1, A1, A2, A2, B1):
   - Quiz 1: 75% at A1
   - Quiz 2: 80% at A1
   - Quiz 3: 78% at A2
   - Quiz 4: 82% at A2
   - Quiz 5: 85% at B1
3. Verify all 5 stored in localStorage
4. Re-enable network
5. Wait for sync to complete

**Expected Results:**
- All 5 quizzes sync to Firebase as a batch
- Firebase receives aggregate data:
  - masterScores: { A1: [0.75, 0.80], A2: [0.78, 0.82], B1: [0.85] }
  - recommendedLevel: "B1" (from B1 quiz)
- No quiz is lost or duplicated
- User sees "Synced 5 quizzes" or similar confirmation
- No slow-down or lag during batch sync

**Acceptance Criteria:**
- Batch sync handles multiple quizzes correctly
- Timestamp ordering is preserved
- No data loss or conflicts

---

### TC-017: Browser Crash → localStorage Persists Data on Restart

**Preconditions:**
- App has cached data and functioning localStorage
- Simulate browser crash or force close

**Steps:**
1. Complete 2 quizzes at A1 (80%, 85%)
2. Verify localStorage has rq-adapted-scores-A1 = [0.80, 0.85]
3. Force close browser (kill process, not graceful close)
4. Re-open browser to same app URL
5. Log in with same user
6. Navigate to profile or results history

**Expected Results:**
- App restarts successfully
- localStorage data is still present (not cleared)
- User sees correct quiz history
- Adaptive state is accurate: currentLevel = A1, scores = [0.80, 0.85]
- No "data corruption" warnings
- If online, data syncs to Firebase post-login

**Acceptance Criteria:**
- localStorage is resilient to browser crashes
- No data loss on restart
- Session recovery is automatic and transparent

---

## 5. ALGORITHM ACCURACY (5 test cases)

### TC-018: Manual Calculation Verification 1

**Formula:** masterScore = (avgQuizScore × 0.5) + (vocabMastery × 0.3) + (readingSpeed × 0.2)

**Test Data:**
- Quiz score: 90% = 0.90
- Vocabulary: 75% known = 0.75
- Reading speed: 110 WPM vs 115 target = 0.957 (capped at 1.0 for formula)

**Calculation:**
```
masterScore = (0.90 × 0.5) + (0.75 × 0.3) + (1.0 × 0.2)
            = 0.45 + 0.225 + 0.2
            = 0.875 (87.5%)
```

**Expected Result:** masterScore ≥ 0.80 → recommend next level

**Test Steps:**
1. Input test data into algorithm function
2. Capture actual result
3. Verify actual = expected (0.875)
4. Verify recommendation = "next level"

**Acceptance Criteria:**
- Calculation exact match (±0.001 tolerance)
- Recommendation logic correct

---

### TC-019: Manual Calculation Verification 2

**Test Data:**
- Quiz score: 60%
- Vocabulary: 60% known
- Reading speed: 100 WPM vs 145 target = 0.69

**Calculation:**
```
masterScore = (0.60 × 0.5) + (0.60 × 0.3) + (0.69 × 0.2)
            = 0.30 + 0.18 + 0.138
            = 0.618 (61.8%)
```

**Expected Result:** 0.50 ≤ masterScore < 0.80 → stay current level

**Acceptance Criteria:**
- Exact calculation match
- Recommendation = "stay current"

---

### TC-020: Manual Calculation Verification 3 (Low Scores)

**Test Data:**
- Quiz score: 30%
- Vocabulary: 20% known
- Reading speed: 60 WPM vs 145 target = 0.41

**Calculation:**
```
masterScore = (0.30 × 0.5) + (0.20 × 0.3) + (0.41 × 0.2)
            = 0.15 + 0.06 + 0.082
            = 0.292 (29.2%)
```

**Expected Result:** masterScore < 0.50 → recommend previous level

**Acceptance Criteria:**
- Exact calculation match
- Recommendation = "previous level"

---

### TC-021: Vocabulary Mastery Extraction from Heatmap

**Preconditions:**
- User has vocab array with word objects:
  ```javascript
  [
    { word: "apple", status: "known", seen: 3 },
    { word: "difficult", status: "learning", seen: 1 },
    { word: "beautiful", status: "known", seen: 2 },
    ...
  ]
  ```

**Test Steps:**
1. Count words with status === "known": 24 out of 32 total
2. Calculate vocabMastery = 24 / 32 = 0.75 (75%)
3. Verify UI heatmap highlights correct words
4. Feed vocabMastery (0.75) into masterScore formula

**Expected Results:**
- vocabMastery correctly extracted from vocab array
- Only "known" status words counted (not "learning")
- Heatmap shows 75% of words highlighted (visual check)
- Algorithm receives correct percentage

**Acceptance Criteria:**
- Vocab parsing is bug-free
- Edge case: empty vocab array → vocabMastery = 0.5 (default)

---

### TC-022: Reading Speed Normalization Correctly Applied

**Preconditions:**
- WPM tracker captures reading time and word count
- User reads 300-word passage in 180 seconds

**Calculation:**
- WPM = 300 words / (180 sec / 60) = 300 / 3 = 100 WPM
- At B1 level, target = 145 WPM
- readingSpeed ratio = 100 / 145 = 0.69

**Test Steps:**
1. Complete B1 reading in timed mode
2. Verify WPM calculated as ~100
3. In algorithm, normalize: speedRatio = 0.69
4. Cap at 2.0: 0.69 → stays 0.69 (below cap)
5. Apply weight: 0.69 × 0.2 = 0.138 in formula

**Expected Results:**
- WPM tracked accurately from passage length / reading time
- Speed ratio correctly normalized
- Cap at 2.0 prevents outliers (e.g., 300 WPM reading doesn't distort score)
- Fast readers get appropriate credit without dominating algorithm

**Acceptance Criteria:**
- Speed calculation matches implementation
- No division-by-zero errors
- Outlier handling works (cap at 2.0)

---

## 6. UI/UX (6 test cases)

### TC-023: Recommendation Modal Appears Post-Quiz (Not During Reading)

**Preconditions:**
- User qualifies for recommendation (masterScore ≥0.80)
- Quiz is completed

**Steps:**
1. Start reading passage (reading screen active)
2. Verify NO recommendation modal appears while reading
3. Complete quiz (quiz screen shows questions)
4. Verify NO recommendation modal appears during quiz (only after submission)
5. Submit final answer
6. Observe results screen

**Expected Results:**
- Recommendation modal appears only after quiz completion
- Modal not shown during reading or mid-quiz
- Modal appears within 1 second of results screen load
- Modal has z-index above all content, centered on screen
- User cannot scroll past modal without interacting (semi-transparent overlay)

**Acceptance Criteria:**
- Modal timing is correct (post-quiz only)
- Modal is intrusive but not blocking (can close)
- No modal shown prematurely

---

### TC-024: "Try It" Button Navigates to Next Level Stories

**Preconditions:**
- TC-023 passed (recommendation modal visible)
- User at A1, recommendation for A2 shown

**Steps:**
1. Click "Try A2" or similar button in modal
2. Observe page transition
3. Verify home screen loads
4. Check story list

**Expected Results:**
- Modal closes
- Screen transitions to home (level selector may show)
- Story library filters to A2 stories only
- Each story card shows "A2" badge
- WPM target updates to A2 (115 WPM)
- User state: currentLevel = "A2"
- Page title or nav updates to show A2

**Acceptance Criteria:**
- Navigation is smooth (<500ms)
- Level correctly updated
- No stories from other levels shown

---

### TC-025: "Stay at Current" Button Hides Modal, Returns to Home

**Preconditions:**
- Recommendation modal visible (TC-023)
- User wants to ignore recommendation

**Steps:**
1. Click "Stay at A1" or similar button
2. Observe modal close behavior
3. Verify page state

**Expected Results:**
- Modal fades out or slides away smoothly
- Home screen remains visible (or user returns to prev screen)
- currentLevel unchanged (still A1)
- Recommendation not shown again immediately (wait for next quiz)
- recommendedLevel still stored (next quiz may show again if hysteresis met)

**Acceptance Criteria:**
- Graceful modal dismissal
- No data loss (recommendation still tracked)
- User can dismiss without side effects

---

### TC-026: Snooze Option: "Ask me again in 3 sessions" Works

**Preconditions:**
- Recommendation modal with snooze option visible
- Feature implemented in modal component

**Steps:**
1. Click "Snooze" or "Ask later" button in modal
2. Complete 2 more quizzes at current level
3. Verify no recommendation shown (even if threshold met)
4. Complete 3rd quiz
5. Verify recommendation reappears (if threshold still met)

**Expected Results:**
- Modal closes on snooze click
- Next 2 quizzes: recommendation suppressed (not shown)
- On 3rd quiz: recommendation shown again if conditions met
- Backend tracks: snoozeUntilSession = currentSession + 3
- No error messages

**Acceptance Criteria:**
- Snooze counter increments correctly
- Recommendation reappears after 3 sessions
- User preferences respected

---

### TC-027: Progress Bar Shows: A1--A2[YOU]--B1[RECOMMENDED]--B2

**Preconditions:**
- User at A2 level
- Recommendation for B1 exists
- Home screen progress card visible

**Steps:**
1. Navigate to home screen
2. Observe progress card/bar
3. Verify visual layout

**Expected Results:**
- Horizontal bar shows all 6 CEFR levels: A1, A2, B1, B2, C1, C2
- A2 shows "YOU" indicator or highlight
- B1 shows "RECOMMENDED" label or star icon
- Levels below A2 are grayed out (completed)
- Levels above B1 are grayed out (future)
- Clicking bar does NOT change level (info only)
- Tooltip on hover shows level descriptions

**Acceptance Criteria:**
- Visual clarity: user understands current and next level
- No accidental level changes from bar click
- Responsive: bar adjusts on mobile (linear vs grid)

---

### TC-028: Profile Shows Learning Journey Timeline

**Preconditions:**
- User has progressed through multiple levels (TC-010 passed)
- Profile/stats screen accessible

**Steps:**
1. Navigate to profile or "My Learning" section
2. Scroll to learning journey
3. Verify timeline display

**Expected Results:**
- Timeline shows entries for each level:
  ```
  A1: Started 2026-04-15, 8 quizzes, avg score 74%
  A2: Started 2026-04-18, 7 quizzes, avg score 79%
  B1: Started 2026-04-21, 5 quizzes, avg score 81%
  ```
- Each entry shows:
  - Level name and color
  - Date range (start – end or "current")
  - Number of quizzes at level
  - Average score
  - Avg WPM (if available)
  - Vocab mastery % at level
- Timeline is chronological, newest at top or bottom (consistent)
- Visual: timeline line with dots for each level

**Acceptance Criteria:**
- Accurate data display
- Clear progression narrative
- Responsive layout on mobile

---

## 7. EDGE CASES (8 test cases)

### TC-029: First Quiz Ever: No Prior Data → No Recommendation (Wait for 2 Quizzes)

**Preconditions:**
- Fresh user account at A1
- No prior quiz history
- completedQuizzes.length = 0

**Steps:**
1. Complete first A1 quiz with 90% score
2. Observe results screen

**Expected Results:**
- Recommendation modal does NOT appear
- Results show: "Great start! Complete more quizzes to unlock level recommendations."
- masterScore calculated (0.90 weighted), but recommendation held back
- Internal state: recommendationCount = 0 (not incremented until 2nd quiz)
- After next quiz (2nd), if threshold met, hysteresis counter starts

**Acceptance Criteria:**
- Single quiz never triggers recommendation
- Minimum 2 quizzes required to start hysteresis
- User guided: "Complete one more quiz to unlock recommendation"

---

### TC-030: User Manually Selects Different Level: Reset Recommendation for New Level

**Preconditions:**
- User at A2 with B1 recommendation pending
- Home screen level selector allows manual selection (if implemented)

**Steps:**
1. From home screen, manually click "B1" in level selector (or dropdown)
2. Confirm "Switch to B1?"
3. Verify state changes
4. Complete B1 quiz
5. Observe recommendation calculation

**Expected Results:**
- currentLevel switches to B1
- previousLevel/levelHistory updated
- recommendationCount reset to 0
- recommendedLevel reset to null or same as currentLevel
- Next B1 quiz recommendation is calculated fresh (not influenced by prior A2 scores)
- Firebase logs: {action: "manual_level_select", from: "A2", to: "B1"}

**Acceptance Criteria:**
- Manual selection clears pending recommendation
- No carryover from prior level
- Fresh hysteresis counter for new level

---

### TC-031: Quiz Retake at Same Level: Don't Count Duplicate Attempts in Average

**Preconditions:**
- User completed A1 quiz 1, score 75%
- User retakes same story/quiz at A1

**Steps:**
1. Complete A1 quiz (Quiz 1): 75%
2. Store in system: quizzes = [0.75]
3. Retake same A1 quiz (Quiz 2): 82%
4. Store in system
5. Calculate avgQuizScore

**Expected Results:**
- System should flag Quiz 2 as "retake" or "duplicate"
- Average calculation options:
  - A) Use both: avg = 78.5% (less desirable)
  - B) Use only latest: avg = 82% (most desirable for motivation)
  - C) Use only first: avg = 75% (punitive)
- Implementation should choose option B: only count latest attempt at story
- avgQuizScore = 82% (not 78.5%)

**Acceptance Criteria:**
- Retakes don't penalize user or inflate average unfairly
- System tracks "first attempt" vs "retake"
- Latest score is used for recommendation (fairest for growth)

---

### TC-032: Very High Scores (98%, 99%): Cap at "Ready for Next Level" (No Multi-Jump)

**Preconditions:**
- User scores 99% on A1 quiz
- masterScore = 0.99 (or higher due to vocab/speed bonuses)

**Steps:**
1. Complete A1 quiz: 99% accuracy
2. Assume perfect vocab (100%) and excellent speed (150%):
   - masterScore = (0.99 × 0.5) + (1.0 × 0.3) + (1.0 × 0.2) = 0.995
3. Verify recommendation

**Expected Results:**
- Recommendation = "A2" (not B1, even though masterScore >> 0.80)
- nextLevel(A1) = A2 always, regardless of score magnitude
- No "jump to B1" recommendation even if student is exceptional
- Message: "Excellent work! Ready for A2."
- Cap on recommendation: always recommend single level increment

**Acceptance Criteria:**
- Very high scores don't trigger multi-level jumps
- nextLevel() function used consistently
- User progression is gradual and safe

---

### TC-033: Very Low Scores (5%, 10%): Below Floor, Recommend Stepping Back

**Preconditions:**
- User at B1, scores 5% on B1 quiz
- masterScore < 0.50, recommends A2
- But user continues failing at B1

**Steps:**
1. Score 5% at B1 → recommend A2 (hysteresis)
2. User ignores, retakes B1 and scores 8%
3. Recommendation persists: A2 (or remains open)
4. User now has 2 low scores → confirm downgrade

**Expected Results:**
- Repeated low scores (2+ quizzes <0.50) trigger clear downgrade recommendation
- Message: "B1 is too challenging. Let's strengthen skills at A2 first."
- prevLevel(B1) = A2 offered
- No floor below A1 (A1 is minimum)
- User feels supported, not penalized for struggle

**Acceptance Criteria:**
- Low score floor handling is compassionate and clear
- Repeated failure triggers action
- No user left stuck at impossible level

---

### TC-034: Long Time Gap (User Returns After 2 Weeks): Recommendation From Prior Level Still Valid?

**Preconditions:**
- User completed A2 quizzes, received B1 recommendation
- User then inactive for 14 days
- User logs back in

**Steps:**
1. Last quiz: B1 recommendation generated 14 days ago
2. User logs in after 2 weeks
3. Navigate to home screen or prior results
4. Check if recommendation still shown

**Expected Results:**
- Recommendation for B1 is still valid (not time-limited)
- Show prompt: "You were recommended for B1. Still interested?"
- User can accept "Try B1" or dismiss
- If user declines or completes more quizzes at B1, update recommendation
- Optionally: show motivational message "You've been away. Let's get back on track!"

**Acceptance Criteria:**
- Recommendations persist across time
- No expiration on pending recommendations
- User re-engagement is encouraged

---

### TC-035: Multiple Quizzes Same Day: Accumulate Scores Correctly in Rolling Average

**Preconditions:**
- User completes multiple quizzes in rapid succession (same day)
- System uses rolling average of last 5 quizzes

**Steps:**
1. Quiz 1 (9:00 AM): 75% at A1
2. Quiz 2 (10:30 AM): 80% at A1
3. Quiz 3 (2:00 PM): 85% at A1
4. Quiz 4 (4:00 PM): 88% at A1
5. Quiz 5 (5:30 PM): 90% at A1
6. Calculate rolling avg = (75 + 80 + 85 + 88 + 90) / 5 = 83.6%
7. Quiz 6 (6:30 PM): 92% at A1
8. Recalculate rolling avg = (80 + 85 + 88 + 90 + 92) / 5 = 87%

**Expected Results:**
- All 6 scores stored (not de-duplicated by time)
- Rolling average uses only last 5
- After Quiz 5: avg = 83.6% (no recommendation yet, hysteresis)
- After Quiz 6: avg = 87% (if hysteresis met, recommend B1)
- Timestamps recorded for each quiz
- No data loss or averaging errors

**Acceptance Criteria:**
- Multiple same-day quizzes handled correctly
- Rolling window maintains data integrity
- Rapid-fire completion is supported

---

### TC-036: User Blocks Recommendation Permission (If Permission-Based)

**Preconditions:**
- Feature implementation includes notification/permission API
- User denies permission to show recommendations

**Steps:**
1. App requests: "Allow notifications for level recommendations?"
2. User clicks "Block"
3. Complete qualifying quiz (masterScore ≥0.80)
4. Check if modal appears

**Expected Results:**
- Recommendation still calculated and stored (backend)
- Modal recommendation does NOT appear (permissions honored)
- Recommendation data available in profile (user can check anytime)
- Option to re-enable: Settings → "Adaptive Difficulty" → enable notifications
- No console errors or broken state

**Acceptance Criteria:**
- Permissions are respected (GDPR-friendly)
- Recommendations calculated regardless
- User has control over notification frequency

---

## 8. DATA PERSISTENCE (4 test cases)

### TC-037: localStorage Keys Properly Set and Formatted

**Preconditions:**
- User completes quiz with adaptive metrics
- Browser DevTools → Application → LocalStorage open

**Steps:**
1. Complete A1 quiz (80% score)
2. Open DevTools → Storage → LocalStorage
3. Inspect keys

**Expected Results:**
- Key `rq-adapted-scores-A1` contains: [0.75, 0.80] (last 5 scores at A1)
- Key `rq-adapted-vocab-A1` contains: {known: 24, attempted: 32, pct: 0.75}
- Key `rq-adapted-speed-A1` contains: {wpm: 110, count: 1}
- Key `rq-adapted-recommended` contains: "A2"
- Key `rq-adapted-history` contains array of {level, date, scores, reason}
- All values are JSON-serializable (no undefined or circular refs)
- Keys are lowercase, hyphen-separated

**Acceptance Criteria:**
- localStorage is consistently formatted
- No malformed JSON
- Keys follow naming convention

---

### TC-038: Firebase Path Receives Correct JSON Structure

**Preconditions:**
- Firebase rules allow write to rq-adapted-v1/
- User completes quiz and syncs (online)

**Steps:**
1. Complete A1 quiz (82% score, 110 WPM, vocab 75%)
2. Wait for auto-sync to Firebase
3. Open Firebase Console → Realtime Database
4. Navigate to `rq-adapted-v1/{userId}/`
5. Inspect JSON structure

**Expected Results:**
```json
{
  "userId": "user123",
  "currentLevel": "A1",
  "recommendedLevel": "A2",
  "recommendationCount": 1,
  "masterScores": {
    "A1": [0.70, 0.75, 0.80, 0.78, 0.82]
  },
  "vocabMastery": {
    "A1": {
      "known": 24,
      "attempted": 32,
      "pct": 0.75
    }
  },
  "readingSpeed": {
    "A1": {
      "wpm": 110,
      "count": 1
    }
  },
  "levelHistory": [
    {
      "level": "A1",
      "startDate": "2026-05-09",
      "endDate": null,
      "quizzes": 5,
      "avgScore": 0.81,
      "avgWpm": 108,
      "vocabMastery": 0.75,
      "reason": "User initialization"
    }
  ],
  "lastUpdated": "2026-05-09T12:05:00Z",
  "createdAt": "2026-05-09T10:00:00Z"
}
```

**Acceptance Criteria:**
- Structure matches design spec
- No null values (use 0 or empty arrays instead)
- Timestamps in ISO 8601 format
- Numbers not stringified

---

### TC-039: Sync Conflict: Local 5 Scores + Remote 5 New Scores → Total 10

**Preconditions:**
- User completed 5 quizzes locally (offline)
- User logs in on different device/browser with 5 quizzes already synced to Firebase
- User switches back to first device

**Steps:**
1. Device A (offline): Complete 5 quizzes, store locally
2. Device B (online): Completes 5 quizzes, syncs to Firebase (scores: [0.70, 0.75, 0.80, 0.75, 0.78])
3. Device A comes online
4. Sync logic detects conflict:
   - Local: [0.75, 0.80, 0.85, 0.82, 0.80]
   - Remote: [0.70, 0.75, 0.80, 0.75, 0.78]
5. Merge strategy: Keep remote, append local non-duplicates

**Expected Results:**
- Conflict detection triggered (timestamp comparison or hash)
- Merge strategy: Remote as source of truth, local appended
- Final state: Last 5 quizzes = [0.75, 0.78, 0.75, 0.80, 0.80] (oldest 5 from full 10)
- OR: Last 5 = [0.78, 0.80, 0.85, 0.82, 0.80] (device A's latest scores)
- Recommendation recalculated on merged data
- User notified: "Synced with cloud. Your stats updated." (or silent)

**Acceptance Criteria:**
- Conflict handling is deterministic (same result every time)
- No data loss
- Recommendation consistent with merged history

---

### TC-040: Clear Cache: Losing localStorage Doesn't Break Firebase Sync (Source of Truth)

**Preconditions:**
- User has sync'd adaptive data to Firebase
- User clears browser cache (Settings → Clear Data → LocalStorage)

**Steps:**
1. User completes 3 quizzes, data syncs to Firebase
2. User clears browser cache (DevTools → Application → Clear all)
3. Verify localStorage is empty
4. User logs back in (session cookies may also be cleared, requiring re-login)
5. App fetches user data from Firebase

**Expected Results:**
- On login, app fetches adaptive data from Firebase (rq-adapted-v1/{userId}/)
- If user has currentUser object, fetch triggers Firebase read
- localStorage is repopulated from Firebase
- User sees correct quiz history and recommendation
- No "data lost" error or blank state
- Firebase is source of truth, not localStorage

**Acceptance Criteria:**
- Cache clearing doesn't permanently lose data
- Firebase read on login restores state
- User experience is seamless

---

## 9. PERFORMANCE (3 test cases)

### TC-041: Algorithm Calculation: <50ms (JSON Parsing + Arithmetic)

**Preconditions:**
- Algorithm functions implemented and optimized
- Test harness to measure execution time

**Steps:**
1. Set up test: 1000 calls to calculateMasterScore() with varying inputs
2. Measure average and max execution time
3. Input example: avgQuizScore=0.82, vocabMastery=75, readingSpeedRatio=1.1

**Expected Results:**
- Average execution: <10ms
- Max execution: <50ms
- No setTimeout or async operations
- No DOM interaction (pure function)
- Arithmetic operations only: multiplication, addition, min/max

**Acceptance Criteria:**
- Algorithm completes in <50ms (well under 100ms threshold)
- Performance is consistent across calls
- No optimization needed at this stage

---

### TC-042: Firebase Write: <500ms (Async in Background, Doesn't Block UI)

**Preconditions:**
- Network latency simulated (~100ms round-trip)
- Firebase write of full adaptive JSON object
- Browser throttle: 4G (max 10 Mbps down, 5 Mbps up)

**Steps:**
1. Complete quiz, trigger updateAdaptiveDifficulty()
2. Start timer at Firebase write call
3. User sees results/recommendation modal
4. End timer at Firebase write success callback
5. Measure elapsed time

**Expected Results:**
- Firebase write completes in <500ms
- UI is interactive during write (modal shown immediately, not waiting)
- Modal appears in <100ms (local calculation only, not blocking on Firebase)
- Background sync in progress indicator (optional): small "Syncing..." text
- No freeze or lag on main thread

**Acceptance Criteria:**
- Firebase write is non-blocking
- UX doesn't suffer (modal appears immediately)
- Write is reliable (retry on failure)

---

### TC-043: Recommendation Display: <100ms After Quiz Completion

**Preconditions:**
- Quiz submitted
- Recommendation calculation triggered
- Modal component ready to render

**Steps:**
1. Submit final quiz answer
2. Start timer at API response (results calculated)
3. Modal appears on screen
4. End timer at modal visible (requestAnimationFrame or MutationObserver)
5. Measure total time: results → calculation → modal display

**Expected Results:**
- Results API response: <100ms (from server or local if cached)
- Calculation: <50ms (algorithm)
- Modal rendering: <50ms (React re-render)
- Total: <100ms from submission to modal visible
- No visible delay or flash

**Acceptance Criteria:**
- <100ms target met consistently
- Feels instant to user
- No jank or stutter in animation

---

## 10. MOBILE RESPONSIVE (3 test cases)

### TC-044: Recommendation Modal Fits 320px Screen (iPhone SE)

**Preconditions:**
- Responsive design implemented
- Device: iPhone SE (320×568) or Chrome DevTools emulation

**Steps:**
1. Adjust browser to 320px width
2. Complete quiz qualifying for recommendation
3. Observe modal rendering

**Expected Results:**
- Modal width is 90% of viewport (max 320px - margins)
- Text is readable (no overflow, proper line-wrapping)
- Buttons stack vertically (or 2-column if space allows)
- Button text: "Try A2" / "Stay at A1" not truncated
- Modal height <80% viewport (user can see page behind)
- Padding/margin: 16px minimum
- Font size: ≥14px for body, ≥16px for buttons
- No horizontal scroll

**Acceptance Criteria:**
- Modal is usable on smallest phone screen
- Text is readable and buttons are tappable (≥44px touch target)
- No layout breaks or overlaps

---

### TC-045: Progress Bar Readable on 768px Tablet (iPad)

**Preconditions:**
- Progress bar component responsive
- Device: iPad (768×1024) or tablet emulation

**Steps:**
1. Adjust browser to 768px width
2. Navigate to home screen
3. Observe progress bar (level selector)

**Expected Results:**
- Progress bar spans full width (with padding)
- 6 level boxes clearly visible side-by-side
- Each box: ≥60px wide
- Color coding visible (green, orange, blue, pink)
- Labels (A1, A2, B1, etc.) readable (≥12px font)
- "YOU" indicator clear
- "RECOMMENDED" label visible
- Hover state works (desktop) or tap state (tablet)
- Responsive grid adjusts to 768px layout (if needed, becomes 2-row grid, still readable)

**Acceptance Criteria:**
- Progress bar is clear on tablet
- All levels identifiable
- Recommendation status obvious

---

### TC-046: Touch Targets ≥44px (Mobile)

**Preconditions:**
- Mobile design with touch-friendly targets
- Device: iPhone (375px) or Android (360px)

**Steps:**
1. Inspect button elements: "Try A2", "Stay at A1", "Snooze", etc.
2. Measure width and height in DevTools
3. Test tap accuracy on actual device (tap 10 times, all successful)

**Expected Results:**
- All buttons: width ≥44px, height ≥44px
- Padding around targets: ≥8px
- Spacing between buttons: ≥16px (no accidental adjacent taps)
- Touch target is finger-size friendly
- No "Tap missed" UX issues

**Acceptance Criteria:**
- All interactive elements meet 44px guideline (WCAG)
- Tapping is reliable and accurate

---

## 11. BROWSER COMPATIBILITY (2 test cases)

### TC-047: Chrome, Safari, Firefox, Edge (Latest) - Algorithm & Sync

**Preconditions:**
- App deployed to test environment
- Latest versions: Chrome 126, Safari 17, Firefox 125, Edge 126

**Steps:**
1. Test on each browser:
   - Complete 2 quizzes
   - Verify recommendation calculation
   - Check Firebase sync
   - Inspect localStorage
2. Repeat algorithm accuracy test (TC-018) on each browser
3. Check for console errors (F12 → Console)

**Expected Results:**
- Algorithm works identically on all browsers
- Firebase write succeeds on all browsers
- localStorage format consistent
- No browser-specific errors
- No deprecated API warnings

**Acceptance Criteria:**
- Cross-browser compatibility verified
- No major version differences in behavior

---

### TC-048: localStorage & JSON.stringify() Consistency Across Browsers

**Preconditions:**
- Test on Chrome and Safari (key difference: Safari private browsing quirks)

**Steps:**
1. Complete quiz on Chrome, inspect localStorage
2. Export localStorage JSON from Chrome
3. Repeat on Safari
4. Compare JSON structures

**Expected Results:**
- JSON.stringify() produces identical output (key order may vary in JSON, but content same)
- JSON.parse() works identically
- No encoding issues (UTF-8)
- Safari private browsing: Note if localStorage is disabled, fallback to in-memory storage (test this case too)
- localStorage.setItem() doesn't throw errors

**Acceptance Criteria:**
- JSON handling is consistent
- Safari private browsing is handled gracefully (or documented limitation)

---

## 12. REGRESSION TESTS (3 test cases)

### TC-049: Taking Quizzes Still Works (No Breakage from Adaptive Changes)

**Preconditions:**
- Adaptive feature fully integrated into quiz flow
- Quiz question generation unchanged

**Steps:**
1. Start at A1 level
2. Select story
3. Read passage
4. Answer all 6 quiz questions
5. Submit quiz
6. Verify score calculated
7. Verify recommendation displayed (if applicable)

**Expected Results:**
- Quiz flow unchanged by adaptive feature
- Questions display correctly
- Scoring logic works (6 question types supported)
- Results show: score %, XP earned, time bonus
- No new errors or slowdowns
- Quiz data saved correctly

**Acceptance Criteria:**
- Core quiz functionality intact
- No performance regression
- Scoring is accurate

---

### TC-050: WPM Tracker Still Updates (Reading Speed Data Collection)

**Preconditions:**
- WPM tracker integrated with adaptive feature
- Reading timer measures passage reading time

**Steps:**
1. Start reading passage at A1
2. Read passage at normal pace (60 seconds for ~100 words)
3. Click "Done Reading" or auto-proceed to quiz
4. Verify WPM calculated
5. Check quiz results show WPM stat

**Expected Results:**
- Reading timer works: captures start/end time
- WPM calculated: wordCount / (timeInSeconds / 60)
- Example: 100 words in 60 seconds = 100 WPM
- WPM displayed on results: "Reading speed: 100 WPM (Elementary)"
- WPM stored in gameEntry for adaptive calculation
- No calculation errors (NaN, Infinity, negative values)

**Acceptance Criteria:**
- WPM tracking unchanged and accurate
- Data feeds into adaptive algorithm correctly

---

### TC-051: Vocabulary Heatmap Still Highlights (Vocab Mastery Data Collection)

**Preconditions:**
- Vocab heatmap feature integrated
- Uncommon words tracked via COMMON_WORDS set

**Steps:**
1. Toggle vocabulary heatmap on reading screen (💡 icon)
2. Observe passage with highlighted words
3. Count highlighted words (uncommon = not in COMMON_WORDS)
4. Verify highlighting color (amber, dotted underline)
5. After quiz, check vocab data used for recommendation

**Expected Results:**
- Heatmap highlights uncommon words
- Highlighting doesn't break readability
- Counts are accurate: if 10 uncommon words, 10 highlights
- Highlighted words feed into vocabMastery % calculation
- Example: If passage has 40 words, 8 uncommon → 20% new word ratio
- Recommendation accounts for vocab difficulty

**Acceptance Criteria:**
- Heatmap functionality intact
- Vocab data accurately calculated for adaptive scoring

---

## Acceptance Criteria Summary

All test cases must achieve:

1. **Functional Correctness**: 100% of test cases pass (40/40)
2. **Algorithm Verification**: Manual calculations match code output (±0.001 tolerance)
3. **Zero Critical Bugs**: No app crashes, data loss, or security issues
4. **Performance**: 
   - Algorithm: <50ms
   - Firebase write: <500ms (non-blocking)
   - Modal display: <100ms
5. **Offline Sync**: Verified working (take 5 offline quizzes, sync on reconnect)
6. **Mobile**: Responsive on 320px–2560px (tested on 3 breakpoints)
7. **Browser**: Chrome, Safari, Firefox, Edge all pass (TC-047, TC-048)
8. **Regression**: Core quiz, WPM, vocab features unchanged

---

## Sign-Off

**Test Plan Approved By:** [QA Lead Name]  
**Date:** 2026-05-09  
**Ready for Execution:** Yes

---

## Appendix A: Algorithm Verification (10 Manual Calculations)

### Calculation 1: High Performance
- Quiz: 90%, Vocab: 75%, Speed: 110/115 = 0.96
- masterScore = (0.90 × 0.5) + (0.75 × 0.3) + (0.96 × 0.2) = 0.45 + 0.225 + 0.192 = **0.867** ✓

### Calculation 2: Average Performance
- Quiz: 75%, Vocab: 70%, Speed: 100/145 = 0.69
- masterScore = (0.75 × 0.5) + (0.70 × 0.3) + (0.69 × 0.2) = 0.375 + 0.21 + 0.138 = **0.723** ✓

### Calculation 3: Low Performance
- Quiz: 40%, Vocab: 30%, Speed: 60/145 = 0.41
- masterScore = (0.40 × 0.5) + (0.30 × 0.3) + (0.41 × 0.2) = 0.20 + 0.09 + 0.082 = **0.372** ✓

### Calculation 4: Speed Bonus
- Quiz: 80%, Vocab: 80%, Speed: 160/145 = 1.10 (capped at 1.0)
- masterScore = (0.80 × 0.5) + (0.80 × 0.3) + (1.0 × 0.2) = 0.40 + 0.24 + 0.20 = **0.84** ✓

### Calculation 5: Vocab Penalty
- Quiz: 85%, Vocab: 20%, Speed: 120/145 = 0.83
- masterScore = (0.85 × 0.5) + (0.20 × 0.3) + (0.83 × 0.2) = 0.425 + 0.06 + 0.166 = **0.651** ✓

### Calculation 6: Boundary 80%
- Quiz: 80%, Vocab: 80%, Speed: 80/115 = 0.70
- masterScore = (0.80 × 0.5) + (0.80 × 0.3) + (0.70 × 0.2) = 0.40 + 0.24 + 0.14 = **0.78** ✓

### Calculation 7: Boundary 50%
- Quiz: 50%, Vocab: 50%, Speed: 50/145 = 0.34
- masterScore = (0.50 × 0.5) + (0.50 × 0.3) + (0.34 × 0.2) = 0.25 + 0.15 + 0.068 = **0.468** ✓

### Calculation 8: Multiple Quiz Average
- Last 5 quizzes: [90, 80, 85, 75, 88] → avg = 83.6%
- With Vocab: 75%, Speed: 1.0
- masterScore = (0.836 × 0.5) + (0.75 × 0.3) + (1.0 × 0.2) = 0.418 + 0.225 + 0.20 = **0.843** ✓

### Calculation 9: Very High Speed
- Quiz: 70%, Vocab: 90%, Speed: 250/145 = 1.72 (capped at 1.0)
- masterScore = (0.70 × 0.5) + (0.90 × 0.3) + (1.0 × 0.2) = 0.35 + 0.27 + 0.20 = **0.82** ✓

### Calculation 10: Very Low Speed
- Quiz: 65%, Vocab: 65%, Speed: 30/145 = 0.21
- masterScore = (0.65 × 0.5) + (0.65 × 0.3) + (0.21 × 0.2) = 0.325 + 0.195 + 0.042 = **0.562** ✓

---

## Appendix B: Test Environment Setup Checklist

- [ ] Test Firebase project created (or test instance configured)
- [ ] Environment variables set (.env.local): FIREBASE_DB_URL, ANTHROPIC_API_KEY
- [ ] LocalStorage cleared before each test session
- [ ] DevTools open (Console, Storage, Network tabs)
- [ ] Browser set to latest version (Chrome 126+, etc.)
- [ ] Network throttling available (DevTools → Network conditions → 4G)
- [ ] Test user accounts created (5–10 test users)
- [ ] Test stories deployed (all 6 CEFR levels)
- [ ] Test timer/WPM tracker verified working
- [ ] Vocabulary tracker verified working
- [ ] Firebase rules allow test writes
- [ ] CI/CD test environment ready

---

## Appendix C: Test Data & Fixtures

### Test User 1: Happy Path Progression
- Username: `testuser_happy`
- Start Level: A1
- Quizzes Completed: 15
- Progression: A1 (5 quizzes) → A2 (5) → B1 (5)
- Avg Scores: A1=80%, A2=82%, B1=85%

### Test User 2: Plateau (No Recommendation)
- Username: `testuser_plateau`
- Start Level: B1
- Quizzes Completed: 10
- All Scores: ~70%
- Expected: Stay at B1

### Test User 3: Struggle (Downgrade)
- Username: `testuser_struggle`
- Start Level: B2
- Quizzes Completed: 5
- Scores: 35%, 38%, 40%, 42%, 45%
- Expected: Recommendation to B1

### Test User 4: Fresh User (No History)
- Username: `testuser_fresh`
- Start Level: A1
- Quizzes Completed: 1
- Expected: No recommendation yet

### Test User 5: Offline Scenario
- Username: `testuser_offline`
- Completed quizzes offline: 5
- Sync verification: Completed post-reconnection

---

End of Test Plan Document
