# Adaptive Difficulty Feature - Test Matrix & Execution Tracker

**Version:** 1.0  
**Date:** 2026-05-09  
**Status:** Test Execution Template

---

## Quick Reference: All 51 Test Cases

| ID | Test Case | Category | Priority | Status | Result | Notes |
|----|----|----------|----------|--------|--------|-------|
| TC-001 | User scores 85% → A2 recommendation appears | Happy Path | P0 | ⏳ | - | Modal timing, accuracy |
| TC-002 | Click "Try It" → Navigate to A2 stories | Happy Path | P0 | ⏳ | - | Navigation speed <500ms |
| TC-003 | Recommendation persists across sessions | Happy Path | P0 | ⏳ | - | Session recovery test |
| TC-004 | Score 80% exactly = Recommendation (boundary) | Mastery Thresholds | P0 | ⏳ | - | Inclusive comparison |
| TC-005 | Score 79.9% = Stay (boundary) | Mastery Thresholds | P0 | ⏳ | - | No false positive |
| TC-006 | Score 50% exactly = Drop (boundary) | Mastery Thresholds | P0 | ⏳ | - | Downgrade trigger |
| TC-007 | Score 50.1% = Stay (middle zone) | Mastery Thresholds | P1 | ⏳ | - | Stay logic |
| TC-008 | Avg [90,85,80,70,65]=78% = Stay | Mastery Thresholds | P0 | ⏳ | - | Rolling average |
| TC-009 | Hysteresis: 1@85%=No, 2@85%=Yes | Mastery Thresholds | P0 | ⏳ | - | Prevent bouncing |
| TC-010 | A1→A2→B1→B2→C1→C2 (6-level journey) | Multi-Level Progression | P0 | ⏳ | - | Full progression chain |
| TC-011 | Jump prevention: A1→B1 blocked (stuck A2) | Multi-Level Progression | P0 | ⏳ | - | Max jump = 1 level |
| TC-012 | B2@40% → Drops to B1 | Multi-Level Progression | P0 | ⏳ | - | Downward progression |
| TC-013 | B1@70% for 10 quizzes → Stay B1 | Multi-Level Progression | P1 | ⏳ | - | Plateau stability |
| TC-014 | Quiz offline → Stored in localStorage | Offline & Sync | P0 | ⏳ | - | No network errors |
| TC-015 | Come online → Auto-sync to Firebase | Offline & Sync | P0 | ⏳ | - | <500ms sync |
| TC-016 | 5 quizzes offline → All sync on reconnect | Offline & Sync | P0 | ⏳ | - | Batch sync accuracy |
| TC-017 | Browser crash → localStorage persists | Offline & Sync | P0 | ⏳ | - | Resilience test |
| TC-018 | Manual calc: 90%+75%+0.96 = 0.875 | Algorithm Accuracy | P0 | ⏳ | - | ≥0.80 → recommend |
| TC-019 | Manual calc: 60%+60%+0.69 = 0.618 | Algorithm Accuracy | P0 | ⏳ | - | Stay zone |
| TC-020 | Manual calc: 30%+20%+0.41 = 0.292 | Algorithm Accuracy | P0 | ⏳ | - | <0.50 → drop |
| TC-021 | Vocab mastery from heatmap (24/32=75%) | Algorithm Accuracy | P0 | ⏳ | - | Correct extraction |
| TC-022 | Reading speed normalization (100/145=0.69) | Algorithm Accuracy | P0 | ⏳ | - | Cap at 2.0 |
| TC-023 | Modal appears post-quiz (not during reading) | UI/UX | P0 | ⏳ | - | Correct timing |
| TC-024 | "Try It" button → Navigate to next level | UI/UX | P0 | ⏳ | - | CTA effectiveness |
| TC-025 | "Stay at Current" → Close modal, return home | UI/UX | P1 | ⏳ | - | Graceful dismissal |
| TC-026 | Snooze: "Ask in 3 sessions" works | UI/UX | P2 | ⏳ | - | Snooze counter |
| TC-027 | Progress bar: A1--A2[YOU]--B1[REC]--B2 | UI/UX | P1 | ⏳ | - | Visual clarity |
| TC-028 | Profile shows learning journey timeline | UI/UX | P1 | ⏳ | - | History display |
| TC-029 | First quiz: No recommendation (wait 2) | Edge Cases | P0 | ⏳ | - | Minimum 2 quiz rule |
| TC-030 | Manual level select → Reset recommendation | Edge Cases | P1 | ⏳ | - | Fresh hysteresis |
| TC-031 | Quiz retake at same level → Use latest | Edge Cases | P1 | ⏳ | - | Duplicate handling |
| TC-032 | 98% score → Cap at "next level" (no jump) | Edge Cases | P0 | ⏳ | - | Max jump = 1 |
| TC-033 | 5%+ low scores → Recommend stepping back | Edge Cases | P0 | ⏳ | - | Compassionate UX |
| TC-034 | 2-week gap → Recommendation still valid | Edge Cases | P2 | ⏳ | - | No expiration |
| TC-035 | Multiple quizzes same day → Correct avg | Edge Cases | P1 | ⏳ | - | Same-day handling |
| TC-036 | Block permission → No modal (calc still runs) | Edge Cases | P2 | ⏳ | - | GDPR-friendly |
| TC-037 | localStorage keys properly set | Data Persistence | P0 | ⏳ | - | Format check |
| TC-038 | Firebase JSON structure correct | Data Persistence | P0 | ⏳ | - | Schema validation |
| TC-039 | Sync conflict: 5 local + 5 remote = 10 | Data Persistence | P1 | ⏳ | - | Merge strategy |
| TC-040 | Clear cache → Firebase as source of truth | Data Persistence | P0 | ⏳ | - | Recovery from cache loss |
| TC-041 | Algorithm calculation <50ms | Performance | P0 | ⏳ | - | Speed benchmark |
| TC-042 | Firebase write <500ms (non-blocking) | Performance | P0 | ⏳ | - | Async behavior |
| TC-043 | Modal display <100ms after quiz | Performance | P0 | ⏳ | - | UX responsiveness |
| TC-044 | Modal fits 320px iPhone SE | Mobile Responsive | P0 | ⏳ | - | Mobile layout |
| TC-045 | Progress bar readable on 768px tablet | Mobile Responsive | P1 | ⏳ | - | Tablet layout |
| TC-046 | Touch targets ≥44px (WCAG) | Mobile Responsive | P1 | ⏳ | - | Accessibility |
| TC-047 | Chrome, Safari, Firefox, Edge compatibility | Browser Compatibility | P0 | ⏳ | - | Cross-browser |
| TC-048 | localStorage JSON consistency | Browser Compatibility | P0 | ⏳ | - | Private browsing |
| TC-049 | Quiz flow unchanged (no breakage) | Regression | P0 | ⏳ | - | Core functionality |
| TC-050 | WPM tracker still updates | Regression | P0 | ⏳ | - | Data collection |
| TC-051 | Vocabulary heatmap still highlights | Regression | P0 | ⏳ | - | Vocab integration |

---

## Test Execution Summary

### By Category

| Category | Count | P0 | P1 | P2 | Pass | Fail | Block |
|----------|-------|----|----|----|----|-----|-------|
| Happy Path | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Mastery Thresholds | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| Multi-Level Progression | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Offline & Sync | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Algorithm Accuracy | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| UI/UX | 6 | 2 | 3 | 1 | 0 | 0 | 0 |
| Edge Cases | 8 | 4 | 3 | 1 | 0 | 0 | 0 |
| Data Persistence | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Performance | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Mobile Responsive | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| Browser Compatibility | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Regression | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **51** | **38** | **11** | **2** | **0** | **0** | **0** |

### By Status

- **Pending:** 51 tests
- **In Progress:** 0 tests
- **Passed:** 0 tests
- **Failed:** 0 tests
- **Blocked:** 0 tests
- **Pass Rate:** 0% (ready to execute)

---

## Priority Breakdown

**P0 (Critical - 38 tests)**  
Must pass before release. Includes algorithm accuracy, core happy path, offline sync, and performance.

**P1 (High - 11 tests)**  
Should pass. Includes edge case handling, middle-zone scenarios, and responsive design.

**P2 (Medium - 2 tests)**  
Nice-to-have. Permission handling and time-gap recovery.

---

## Test Execution Schedule

| Phase | Tests | Duration | Start | End | Owner |
|-------|-------|----------|-------|-----|-------|
| **Phase 1: Unit** | TC-018 to TC-022 | 2 days | Day 1 | Day 2 | Engineer 1 |
| **Phase 2: Integration** | TC-014 to TC-017, TC-037 to TC-040 | 3 days | Day 3 | Day 5 | Engineer 2 |
| **Phase 3: Happy Path** | TC-001 to TC-003, TC-010 to TC-013 | 2 days | Day 6 | Day 7 | Lead |
| **Phase 4: Thresholds & Edges** | TC-004 to TC-009, TC-029 to TC-036 | 3 days | Day 8 | Day 10 | Engineer 1 |
| **Phase 5: UI & Perf** | TC-023 to TC-028, TC-041 to TC-043 | 2 days | Day 11 | Day 12 | Engineer 2 |
| **Phase 6: Mobile & Browser** | TC-044 to TC-048 | 2 days | Day 13 | Day 14 | Lead |
| **Phase 7: Regression** | TC-049 to TC-051 | 1 day | Day 15 | Day 15 | Engineer 1 |
| **Phase 8: Retest & Sign-Off** | Failures + final checks | 2 days | Day 16 | Day 17 | Lead |
| **TOTAL** | **51 tests** | **17 days** | | | |

---

## Test Data Requirements

### Test Accounts
```
Username            Level  Prior Quizzes  Avg Score  Purpose
testuser_happy      A1     0              -          Happy path progression
testuser_plateau    B1     0              -          Stable plateau
testuser_struggle   B2     0              -          Downgrade scenario
testuser_fresh      A1     0              -          No recommendation (1 quiz)
testuser_offline    A1     0              -          Offline sync test
testuser_advanced   A2     0              -          Near-boundary tests
```

### Test Fixtures
- **Stories per Level:** ≥3 stories per CEFR level
- **Questions:** 6 per story (MCQ, gap_word, gap_sentence, matching, heading, qa/tfnm/ynng)
- **Vocab:** ≥50 words per story with known/learning status
- **WPM Baseline:** 100 words per passage (adjustable for speed tests)

---

## Failure & Retry Protocol

### If Test Fails
1. Document failure in "Notes" column
2. Capture screenshot/error log
3. Categorize:
   - **Blocker:** Blocks other tests or release (retry after fix)
   - **Major:** Feature broken but workaround exists (retest after fix)
   - **Minor:** UI glitch, non-critical data issue (log, retest later)
4. Create bug report with test ID reference
5. Re-run after fix applied

### Acceptance Criteria for Test Pass
- ✅ Expected result matches actual result
- ✅ No console errors (warnings allowed if documented)
- ✅ No data corruption or loss
- ✅ Performance within threshold
- ✅ Mobile rendering without layout breaks

---

## Sign-Off Checklist

Before marking feature as "Ready for Release":

- [ ] All 51 tests executed at least once
- [ ] P0 tests: 100% pass rate (38/38)
- [ ] P1 tests: ≥95% pass rate (≥10/11)
- [ ] P2 tests: ≥80% pass rate (≥1/2)
- [ ] Algorithm verification: 10 calculations verified (Appendix A)
- [ ] Performance baselines met (all 3 perf tests pass)
- [ ] Mobile: 3 breakpoints tested and responsive
- [ ] Browser: Chrome, Safari, Firefox, Edge all pass
- [ ] Regression: No breakage in quiz, WPM, vocab features
- [ ] Firebase config correct and tested
- [ ] localStorage fallback verified working
- [ ] Offline sync tested (5 quizzes offline → sync on reconnect)
- [ ] Bug report(s) reviewed and prioritized
- [ ] Known limitations documented
- [ ] QA Sign-Off: [Name] __________________ Date: _________
- [ ] Product Owner Approval: [Name] ________________ Date: _________

---

## Known Issues & Limitations

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
| (To be filled during execution) | | | |

---

## Test Notes Template

For each test case execution, use this template:

```
Test ID: TC-XXX
Title: [From table]
Tester: [Name]
Date: YYYY-MM-DD
Duration: X minutes

Setup:
- [List any specific setup steps]

Observations:
- [What happened during test]
- [Any unexpected behavior]
- [Performance metrics captured]

Result: PASS / FAIL / BLOCKED

If FAIL:
- Bug Description: [Clear description]
- Reproduction Steps: [Step-by-step]
- Expected vs Actual: [Comparison]
- Screenshot/Log: [Attached]
- Severity: P0 / P1 / P2

Notes:
- [Any additional context]
```

---

## Performance Baseline Targets

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Algorithm calc | <50ms | -- | ⏳ |
| Firebase write | <500ms | -- | ⏳ |
| Modal display | <100ms | -- | ⏳ |
| Page load with adaptive | <2s | -- | ⏳ |
| Memory leak check (10 quizzes) | <50MB growth | -- | ⏳ |

---

## Test Automation Opportunities

For future automation:

| Test | Automation Type | Effort | ROI |
|------|-----------------|--------|-----|
| TC-018 to TC-022 | Unit tests (Jest) | Low | High |
| TC-041 to TC-043 | Perf benchmarks (Lighthouse) | Medium | High |
| TC-037 to TC-040 | Integration tests (Cypress) | High | Medium |
| TC-001 to TC-013 | E2E tests (Playwright) | High | Medium |
| TC-044 to TC-046 | Responsive tests (Percy) | Medium | High |

---

End of Test Matrix
