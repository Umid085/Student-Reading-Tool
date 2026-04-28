# Student Reading Tool - Bugs & Issues Found
**Date:** 2026-04-28  
**Task:** Identify and document existing bugs

---

## Recent Bug Fixes (From Git History)

✅ **Fixed:** Undefined .reduce() error in friends list (commit 3c4677c)
✅ **Fixed:** Node modules in git (commit 6ea2ce9)
✅ **Fixed:** Vite dependency conflict - downgraded to v7 (commit e15db97)
✅ **Fixed:** Defensive checks for undefined .length access (commit 75eb2e6)

---

## Active Bugs & Issues Found

### 🔴 CRITICAL BUGS

#### 1. **Potential Undefined Array Error in GameChart**
- **File:** `student-reading-quest.jsx:178`
- **Code:** `var maxXp=Math.max.apply(null,games.map(function(g){return g.xp;}))`
- **Issue:** If `games` array is empty, `Math.max.apply(null, [])` returns `-Infinity`
- **Impact:** Can crash chart rendering or show invalid values
- **Fix:** Check if `games.length > 0` before calculating `maxXp`
- **Current Workaround:** Line 175 has guard: `if(!games.length)return<div...>` ✓ SAFE

#### 2. **Friend Data Access Without Null Check**
- **File:** `student-reading-quest.jsx:1008`
- **Code:** `var fTotalXp=fuGames.reduce(function(s,g){return s+g.xp;},0)`
- **Issue:** `fuGames` could be undefined if friend data not loaded
- **Status:** Has defensive check on line 1004: `var fuGames=fu&&fu.games?fu.games:[]` ✓ SAFE

#### 3. **Profile Comparison XP Calculation Error**
- **File:** `student-reading-quest.jsx:1061`
- **Code:** `var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct);},0)/fuGames.length):0`
- **Issue:** Assumes all game objects have `.pct` property
- **Impact:** `undefined` values in reduce will produce `NaN`
- **Severity:** HIGH - Shows wrong percentage on friend profile
- **Fix:** Add property existence check in reduce: `var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct||0);},0)/fuGames.length):0`

#### 4. **Missing XP Property in Game Object**
- **File:** Multiple locations (1065, 1111)
- **Code:** Uses `g.xp` without checking existence
- **Issue:** If API returns incomplete game objects, `.xp` might be undefined
- **Impact:** Total XP becomes `NaN`
- **Fix:** Add fallback: `.reduce(function(s,g){return s+(g.xp||0);},0)`

#### 5. **Challenge Data Timestamp Issue**
- **File:** `student-reading-quest.jsx:160`
- **Code:** `n[to].challenges.push({from:from,level:level,types:types,date:new Date().toLocaleDateString(),status:"pending"})`
- **Issue:** `toLocaleDateString()` produces format like "4/28/2026" which differs by locale
- **Impact:** Can't reliably match/compare dates, especially in challenges
- **Fix:** Use ISO format: `date:new Date().toISOString().split('T')[0]`

#### 6. **Quiz State Not Reset on Level Change**
- **File:** Needs investigation - likely in Home screen click handler
- **Issue:** If user selects a new level without completing previous quiz, state carries over
- **Impact:** Old quiz questions might appear in new level
- **Fix:** Clear `questions`, `userAnswers`, `matchState`, `headingState` when starting new quiz

---

### 🟠 HIGH PRIORITY ISSUES

#### 7. **Social Data Deserialization Inconsistency**
- **File:** `student-reading-quest.jsx:113-114`
- **Code:** Uses `JSON.parse(JSON.stringify(social))` for deep copy
- **Issue:** Expensive operation called repeatedly; dates become strings not Date objects
- **Impact:** Performance degradation with large friend lists
- **Recommendation:** Use structured clone or implement proper deep copy

#### 8. **Password Storage in localStorage**
- **File:** `student-reading-quest.jsx:7, CREDS_KEY`
- **Issue:** `localStorage` is not encrypted; base64 is not encryption
- **Impact:** SECURITY RISK - anyone with access to browser can read passwords
- **Note:** This is by design (no backend auth), but users should be warned
- **Recommendation:** Add security notice in auth screen

#### 9. **Firebase Sync Race Condition**
- **File:** `apiSet()` function - fire-and-forget pattern
- **Issue:** Local change succeeded, but Firebase fails silently
- **Impact:** User's data looks saved but is actually lost when page reloads
- **Current State:** Line 97 has silent failure: `catch(e){}` 
- **Fix:** Show user warning if Firebase sync fails; implement retry logic

#### 10. **Missing Loading Indicator During API Calls**
- **File:** Generate quiz API call (likely around line 600+)
- **Issue:** 3-5 second wait for Anthropic API with no feedback
- **Impact:** Users think app is frozen
- **Fix:** Add loading state, spinner, or skeleton component

#### 11. **Time Tracking Not Implemented**
- **File:** Quiz screen - timer shows but doesn't prevent submission after limit
- **Issue:** Users can continue answering after time expires
- **Impact:** Time bonus calculation may be incorrect
- **Fix:** Disable submissions when `timeRemaining <= 0`

#### 12. **Streak Calculation Locale Issue**
- **File:** `calcStreak()` function line 29-30
- **Code:** `var d=games[i].date;if(dates.indexOf(d)===-1)dates.push(d);`
- **Issue:** Date strings might have different formats depending on locale
- **Impact:** Streak counter could be wrong
- **Fix:** Parse dates to consistent ISO format before comparison

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 13. **Leaderboard Entry Duplication**
- **File:** `student-reading-quest.jsx:656`
- **Code:** `var filtered=cur.filter(...); var merged=filtered.concat([lbEntry])`
- **Issue:** If user plays multiple times same level, could create duplicates
- **Status:** Code deduplicates by name, so should be safe
- **Recommendation:** Add test case for rapid submissions

#### 14. **Matching Game - Incorrect Pair Shuffle**
- **File:** `student-reading-quest.jsx:305`
- **Code:** Uses `shuffled.map()` but `shuffled` might not be shuffled properly
- **Issue:** If shuffle algorithm is weak, patterns might be predictable
- **Recommendation:** Use Fisher-Yates shuffle algorithm

#### 15. **No Validation of API Response**
- **File:** Quiz generation endpoint
- **Issue:** Doesn't validate that returned questions have required properties
- **Impact:** UI crashes if Anthropic returns malformed data
- **Fix:** Add schema validation for quiz response

#### 16. **Session Persistence Not Cleared on Logout**
- **File:** Logout action not found - needs verification
- **Issue:** User session token might persist if logout removed but localStorage not cleared
- **Recommendation:** Implement proper logout that clears `rq-session` and all user data

#### 17. **No Conflict Resolution for Offline Changes**
- **File:** Storage layer - `apiGet()` and `apiSet()`
- **Issue:** If user makes changes offline then comes online, might conflict with server state
- **Impact:** Data loss possible
- **Fix:** Implement conflict detection (last-write-wins vs. merge strategy)

#### 18. **Mobile - Touch Events Not Optimized**
- **File:** All button components
- **Issue:** No `onTouchEnd`, only `onClick` handlers
- **Impact:** May have slight lag on mobile devices
- **Recommendation:** Add touch event handlers or use React's synthetic events (should already work)

---

### 🔵 LOW PRIORITY ISSUES

19. **Hardcoded API Endpoint** - `var API = "/.netlify/functions/generate"` - Not configurable for different environments
20. **No Request Timeout** - API calls could hang indefinitely
21. **Accessibility: Tab Order** - No explicit tab order defined
22. **Performance: No Memoization** - Components re-render unnecessarily
23. **Error Message Clarity** - Generic errors like "not ok" shown to users
24. **No Cache Busting** - Users might see stale data even after logout/login
25. **Hardcoded Level Colors** - If wanting to change theme, need to edit code in 3+ places

---

## Bug Fix Priority Matrix

| Bug ID | Severity | Effort | Impact | Priority |
|--------|----------|--------|--------|----------|
| #3 | HIGH | Low | Avg Score shows NaN | 1 (Do First) |
| #5 | HIGH | Low | Challenges misaligned by date | 2 |
| #10 | HIGH | Low | UX is frozen during load | 3 |
| #6 | HIGH | Medium | State corruption | 4 |
| #4 | MEDIUM | Low | Total XP shows NaN | 5 |
| #9 | MEDIUM | Medium | Data loss risk | 6 |
| #11 | MEDIUM | Low | Time limit not enforced | 7 |
| #12 | MEDIUM | Low | Streak counter wrong | 8 |
| #1 | CRITICAL | Low | Chart might not render | 9 |
| #15 | MEDIUM | High | UI crashes on bad API | 10 |
| #7 | LOW | Medium | Performance issue | 11 |

---

## Testing Recommendations

### Before Bug Fixes
- [ ] Test with empty games array
- [ ] Test with friends having no games data
- [ ] Test with incomplete game objects (missing `.xp`, `.pct` properties)
- [ ] Test rapid level selection changes
- [ ] Test adding friends across different timezones
- [ ] Test offline mode then going online
- [ ] Test with very large friend lists (100+ friends)

### After Bug Fixes
- [ ] Verify XP calculations match formula: `base_points × level_multiplier × 100 + time_bonus + streak_bonus`
- [ ] Verify average percentage shows correctly (not NaN)
- [ ] Verify streak calculates properly across date boundaries
- [ ] Verify time limit is enforced on quiz
- [ ] Verify challenges show correct dates
- [ ] Test in multiple browsers and on mobile devices

---

## Code Quality Issues (Not Bugs, But Should Fix)

1. **Pre-ES6 Var Usage** - Uses `var` instead of `let`/`const`
2. **No JSDoc Comments** - Functions lack documentation
3. **Magic Numbers** - Hard-coded values like `864e5` (milliseconds in a day)
4. **No Error Boundaries** - React error boundary not implemented
5. **No PropTypes** - Components don't validate props
6. **Large Component** - 1100+ lines in single file
7. **No Unit Tests** - No test framework configured

---

## Next Steps

1. **Immediate (This Week):** Fix bugs #3, #5, #10, #6
2. **Short Term (Next Week):** Fix bugs #4, #9, #11, #12
3. **Medium Term (Week 3+):** Fix bugs #1, #15, #7, others
4. **Refactor (Month 2):** Address code quality and split component

