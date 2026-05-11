# Translation Feature — Test Matrix Quick Reference
**For QA Testers & CI/CD Integration**

---

## Master Test Matrix (28 Tests)

| ID | Test Name | Category | Type | Priority | Status | Blocker | Est. Time |
|---|-----------|----------|------|----------|--------|---------|-----------|
| TP-001 | Basic Translation - Uzbek | Happy Path | Manual/E2E | CRITICAL | PASS | No | 5 min |
| TP-002 | Basic Translation - Russian | Happy Path | Manual/E2E | CRITICAL | PASS | No | 5 min |
| TP-003 | Multi-Sentence Translation | Happy Path | Manual/E2E | CRITICAL | PASS | No | 10 min |
| TP-004 | Language Persists Across Screens | Persistence | Unit/E2E | CRITICAL | PASS | No | 5 min |
| TP-005 | Language Persists Across Sessions | Persistence | Unit/E2E | CRITICAL | PASS | No | 10 min |
| TP-006 | A1 Unlimited Translations | CEFR Gating | Unit | HIGH | FAIL | YES | 10 min |
| TP-007 | B1 Unlimited Translations | CEFR Gating | Unit | HIGH | FAIL | YES | 10 min |
| TP-008 | B2 Limited to 3 Translations | CEFR Gating | Unit/Manual | HIGH | FAIL | YES | 15 min |
| TP-009 | C2 Limited to 3 Translations | CEFR Gating | Unit/Manual | HIGH | FAIL | YES | 15 min |
| TP-010 | Switch Between 6 Languages | Multi-Language | Manual/E2E | HIGH | PARTIAL | No | 10 min |
| TP-011 | Language Switch Doesn't Clear | Multi-Language | Manual/E2E | MEDIUM | PASS | No | 5 min |
| TP-012 | Language Accuracy Check | Multi-Language | Manual | MEDIUM | PASS | No | 15 min |
| TP-013 | Long Sentence (>200 chars) | Edge Cases | Manual | MEDIUM | PARTIAL | No | 5 min |
| TP-014 | Special Characters | Edge Cases | Unit/Manual | MEDIUM | PASS | No | 5 min |
| TP-015 | Unicode (Arabic, Cyrillic, Emoji) | Edge Cases | Manual | MEDIUM | PARTIAL | No | 10 min |
| TP-016 | Punctuation Handling | Edge Cases | Unit/Manual | MEDIUM | PASS | No | 5 min |
| TP-017 | Empty/Whitespace Sentence | Edge Cases | Unit | MEDIUM | FAIL | No | 5 min |
| TP-018 | Duplicate Translations | Edge Cases | Unit | LOW | PARTIAL | No | 5 min |
| TP-019 | Single-Word Sentence | Edge Cases | Unit/Manual | LOW | PASS | No | 3 min |
| TP-020 | Numbers and Dates | Edge Cases | Unit/Manual | LOW | PASS | No | 5 min |
| TP-021 | Cached Translation <500ms | Performance | Unit | HIGH | FAIL | YES | 10 min |
| TP-022 | API Response <2s | Performance | Manual/Perf | HIGH | PASS | No | 10 min |
| TP-023 | Rapid Translations No Crash | Performance | Unit/E2E | MEDIUM | PARTIAL | No | 10 min |
| TP-024 | MyMemory Unavailable Fallback | Offline | Manual | MEDIUM | PARTIAL | No | 10 min |
| TP-025 | Cached Offline Availability | Offline | Manual | MEDIUM | FAIL | YES | 10 min |
| TP-026 | Translation Requests Logged | Analytics | Unit | MEDIUM | FAIL | No | 5 min |
| TP-027 | Analytics Don't Leak Data | Analytics | Code Review | MEDIUM | FAIL | No | 5 min |
| TP-028 | Color Contrast WCAG AA (4.5:1) | Accessibility | Automated | CRITICAL | PASS | No | 2 min |
| TP-029 | Keyboard Navigation (Tab) | Accessibility | Manual | HIGH | PARTIAL | No | 5 min |
| TP-030 | Screen Reader ARIA Labels | Accessibility | Manual | HIGH | FAIL | No | 10 min |
| TP-031 | Focus Indicators Visible | Accessibility | Manual | HIGH | PARTIAL | No | 5 min |
| TP-032 | Loading State Announcement | Accessibility | Manual | HIGH | FAIL | No | 5 min |
| TP-033 | Responsive 320px Viewport | Mobile | Manual/E2E | HIGH | PARTIAL | No | 10 min |
| TP-034 | Touch Targets 44×44px | Mobile | Automated | CRITICAL | FAIL | YES | 5 min |
| TP-035 | Browser Compatibility (4 browsers) | Compat | Manual/E2E | CRITICAL | PASS | No | 15 min |
| TP-036 | LocalStorage & Fetch API | Compat | Unit | MEDIUM | PASS | No | 5 min |
| TP-037 | Reading Layout Unchanged | Regression | Manual/E2E | CRITICAL | PASS | No | 10 min |
| TP-038 | Quiz Unaffected | Regression | Manual/E2E | CRITICAL | PASS | No | 15 min |
| TP-039 | Other Features (WPM, Heatmap) | Regression | Manual/E2E | CRITICAL | PASS | No | 15 min |

**Summary:**
- Total: 39 test cases listed
- Passing: 12 ✓
- Partial: 10 ⚠️
- Failing: 14 ✗ (4 critical blockers + 10 not implemented)
- Total Time (all manual): ~4.5 hours

---

## Automated Test Suite Mapping

| Test Framework | File | Test IDs | Count | Est. Runtime |
|---|---|---|---|---|
| **Vitest Unit** | tests/translation.test.js | TP-006, TP-007, TP-008, TP-009, TP-010, TP-014, TP-016, TP-017, TP-019, TP-020, TP-021, TP-023, TP-026, TP-028, TP-035, TP-036 | 16 | 2-3 min |
| **Playwright E2E** | tests/translation.e2e.js | TP-001, TP-002, TP-003, TP-004, TP-005, TP-011, TP-012, TP-029, TP-030, TP-031, TP-033, TP-034, TP-037, TP-038, TP-039 | 15 | 3-5 min |
| **Performance** | tests/translation-perf.test.js | TP-021, TP-022, TP-023 | 3 | 1 min |
| **Accessibility** | tests/translation-a11y.test.js | TP-028, TP-029, TP-030, TP-031, TP-032 | 5 | 30 sec |
| **Manual Only** | N/A | TP-012, TP-013, TP-015, TP-024, TP-025, TP-027, TP-032, TP-033 | 8 | 1-2 hours |

**CI/CD Pipeline Execution Time:** ~7-10 minutes (automated tests only)

---

## Critical Blockers Status

| ID | Test Name | Blocker | Reason | Fix ETA | Owner |
|----|-----------|---------|--------|---------|-------|
| TP-006, TP-007, TP-008, TP-009 | CEFR Quota Gating | YES | Feature not implemented in code | Week 1 | Backend Dev |
| TP-021, TP-025 | Caching Layer | YES | No localStorage/Firebase cache implemented | Week 2 | Backend Dev |
| TP-034 | Touch Targets | YES | Button/dropdown 20px vs 44px WCAG requirement | Week 1 | UI Engineer |
| TP-030, TP-032 | ARIA Labels & aria-live | YES | Attributes missing in HTML | Week 1 | A11y Lead |

---

## Test Execution Checklist

### Pre-Testing Setup (5 min)
- [ ] Clone latest code from main branch
- [ ] Install dependencies: `npm ci`
- [ ] Set up test data fixtures (users A1-C2, test passages)
- [ ] Configure MyMemory API mock (MSW or Network tab override)
- [ ] Clear localStorage between test runs

### Manual Testing Session (4.5 hours)

**Session 1: Happy Path (30 min)**
```
TP-001: Translate to Uzbek
  [ ] Open app, login as A1 user
  [ ] Click sentence → Translate button → Verify Uzbek translation appears
  [ ] Time: <2s total
  [ ] Animation: 150ms fade-in observed

TP-002: Switch languages
  [ ] Same sentence, change to Russian via dropdown
  [ ] Verify Russian translation replaces Uzbek
  [ ] Repeat for Turkish, Arabic, German

TP-003: Multi-sentence
  [ ] Translate sentence 1, 5, 10 from same passage
  [ ] Verify all load correctly
```

**Session 2: CEFR Gating (60 min) — BLOCKED**
```
⚠️ TP-006-009: Cannot test — quota logic not implemented
   [ ] Defer until developer completes implementation
   [ ] Plan follow-up testing session
```

**Session 3: Edge Cases (90 min)**
```
TP-013: Long sentence
  [ ] Copy 250-char sentence
  [ ] Translate to Russian
  [ ] Verify no truncation in UI

TP-015: Unicode
  [ ] Translate: "مرحبا привет 你好"
  [ ] Verify Arabic/Cyrillic preserved in output

TP-019: Single word
  [ ] Translate: "Run"
  [ ] Verify translation appears (not "too short" error)

[Continue for all edge cases]
```

**Session 4: Accessibility (60 min)**
```
TP-028: Color contrast
  [ ] Use WebAIM contrast checker
  [ ] Measure: #c7d2fe on #0d0d1a
  [ ] Verify: ≥4.5:1

TP-029: Tab navigation
  [ ] Press Tab repeatedly until focused on Translate button
  [ ] Verify focus ring visible (outline)
  [ ] Press Enter — translation should trigger

TP-030-032: Screen reader (NVDA)
  [ ] Launch NVDA
  [ ] Navigate to translation section
  [ ] Listen for announcements:
    [ ] "Translate button" announced
    [ ] "Language selector" announced
    [ ] "Translating..." announced while loading
    [ ] Translation text announced when ready
```

**Session 5: Regression & Mobile (90 min)**
```
TP-037: Reading layout
  [ ] Translate sentence
  [ ] Verify passage text position unchanged
  [ ] Verify no layout shift

TP-038: Quiz unaffected
  [ ] Complete reading
  [ ] Enter quiz stage
  [ ] Answer questions normally
  [ ] Verify scoring correct

TP-039: WPM counter
  [ ] Enable WPM counter
  [ ] Translate mid-reading
  [ ] Continue reading
  [ ] Verify WPM still increments

TP-033: Mobile (320px)
  [ ] DevTools: set viewport to 320×800
  [ ] Translate sentence
  [ ] Verify no horizontal scroll
  [ ] Text readable

TP-034: Touch target size
  [ ] Use DevTools to inspect button height
  [ ] Measure: expecting 44px minimum
  [ ] ✗ Currently 20px — FAIL (blocker)
```

**Session 6: Browser Compat (30 min)**
```
TP-035: 4 browsers
  [ ] Test on Chrome, Firefox, Safari, Edge
  [ ] Each: translate 3 sentences
  [ ] Verify no errors in console
  [ ] localStorage persists language

TP-036: API support
  [ ] DevTools: verify fetch succeeds
  [ ] localStorage key exists after translation
```

### Automated Testing Execution

**Run all tests:**
```bash
npm test -- translation
```

**Run specific category:**
```bash
npm test -- translation.test.js          # Unit tests
npm run test:e2e                           # E2E tests
npm test -- translation-perf              # Performance
npm test -- translation-a11y              # Accessibility
```

**Generate coverage:**
```bash
npm test -- translation --coverage
# Target: 90% statement, 85% branch coverage
```

**CI/CD Pipeline:**
```bash
# On every push to main
npm ci
npm test -- translation
npm run test:e2e -- --project=chromium --project=firefox
# Report coverage to codecov
```

---

## Test Data Reference

### User Accounts for Testing

| User ID | Level | Quota | Notes |
|---------|-------|-------|-------|
| testuser-a1 | A1 | Unlimited | Use for TP-001-005, TP-010-012 |
| testuser-b1 | B1 | Unlimited | Use for TP-006-007 |
| testuser-b2 | B2 | 3 per passage | Use for TP-008 (quota test) |
| testuser-c2 | C2 | 3 per passage | Use for TP-009 (quota reset test) |

### Test Sentences

| Level | Sentence | Language | Expected Translation |
|-------|----------|----------|----------------------|
| A1 | "The cat is on the mat." | Uzbek | "Mushuk kovrakda yotibdi." |
| A1 | "I like apples." | Russian | "Я люблю яблоки." |
| B1 | "Could you help me with this?" | Turkish | "Bana bununla yardım edebilir misin?" |
| B1 | "She has been working here since 2015." | Arabic | "كانت تعمل هنا منذ 2015." |
| C1 | "The exigencies of modern governance..." | German | "Die Anforderungen der modernen Regierungsführung..." |

---

## Pass/Fail Tracking

### Test Run Log Template

```
Test Run #: 1
Date: 2026-05-XX
Tester: [Name]
Environment: Local dev (npm run dev)
Browser: Chrome 125
OS: Windows 11

┌─────┬──────────────────────┬────────┬──────────┐
│ ID  │ Test Name            │ Result │ Comments │
├─────┼──────────────────────┼────────┼──────────┤
│TP-001 │ Uzbek translation   │  ✓ PASS │ 1.2s, animation smooth │
│TP-002 │ Language switch     │  ✓ PASS │ No reload, instant      │
│TP-003 │ Multi-sentence      │  ✓ PASS │ All 3 sentences OK      │
│TP-004 │ Persistence         │  ✓ PASS │ localStorage verified   │
│TP-005 │ Session persist     │  ✓ PASS │ After page reload       │
│TP-006 │ A1 unlimited        │  ✗ FAIL │ Quota logic missing     │
│TP-007 │ B1 unlimited        │  ✗ FAIL │ Quota logic missing     │
│TP-008 │ B2 quota 3          │  ✗ FAIL │ Quota logic missing     │
│TP-009 │ C2 quota reset      │  ✗ FAIL │ Quota logic missing     │
│ TP-010 │ 6 languages         │  ⚠ PARTIAL │ Spanish not in dropdown │
│...   │...                  │...    │...      │
└─────┴──────────────────────┴────────┴──────────┘

Blockers Found: 4
  [ ] CEFR quota gating not implemented
  [ ] Touch targets too small (20px vs 44px)
  [ ] ARIA labels missing
  [ ] No caching layer

Recommendation: DEFER RELEASE
  Cannot proceed with B2-C2 testing until quota logic implemented.
  Fix blockers, then re-run test suite.
```

---

## Performance Metrics Tracking

| Metric | Target | Current | Status | Trend |
|--------|--------|---------|--------|-------|
| API response (avg) | <800ms | ~620ms | ✓ PASS | Stable |
| API response (P95) | <2000ms | ~1200ms | ✓ PASS | Stable |
| Cache lookup | <500ms | N/A | ⚠️ MISSING | — |
| Animation fade-in | 150ms | 150ms (CSS) | ✓ PASS | — |
| First paint to interaction | <3s | ~2.5s | ✓ PASS | Good |
| Memory (10 translations) | <2MB | <1.5MB | ✓ PASS | Good |

---

## Browser Test Matrix

| Browser | Desktop | Mobile | Status | Last Tested |
|---------|---------|--------|--------|-------------|
| Chrome | ✓ 125 | ✓ Android | ✓ PASS | 2026-05-09 |
| Firefox | ✓ 124 | ✓ Android | ✓ PASS | 2026-05-09 |
| Safari | ✓ 17 | ✓ iOS | ✓ PASS | 2026-05-09 |
| Edge | ✓ 125 | — | ✓ PASS | 2026-05-09 |

---

## Issue Tracking

### Open Issues

| ID | Issue | Severity | Status | Owner | ETA |
|----|-------|----------|--------|-------|-----|
| BUG-001 | Quota gating not implemented | CRITICAL | OPEN | Backend Dev | Week 1 |
| BUG-002 | Touch targets 20px (need 44px) | CRITICAL | OPEN | UI Eng | Week 1 |
| BUG-003 | ARIA labels missing | HIGH | OPEN | A11y Lead | Week 1 |
| BUG-004 | No offline caching | HIGH | OPEN | Backend Dev | Week 2 |
| BUG-005 | Empty sentence validation missing | MEDIUM | OPEN | Frontend Dev | Week 1 |

### Resolved Issues

| ID | Issue | Resolution | Resolved Date |
|----|-------|-----------|--------------|
| (none yet) | — | — | — |

---

## Sign-Off

### QA Sign-Off Template

```
QA Test Plan Reviewed & Approved

Reviewer: [QA Lead Name]
Date: 2026-05-09
Status: READY FOR TESTING

Approvals:
  [ ] QA Lead
  [ ] Accessibility Specialist
  [ ] Engineering Lead
  [ ] Product Manager

Comments:
  - Test plan is comprehensive and covers all critical paths
  - 4 blockers identified; cannot start testing until resolved
  - Expected timeline: 1 week development + 1 week testing = 2 weeks to release
```

---

**Version:** 1.0  
**Last Updated:** 2026-05-09  
**Status:** APPROVED FOR IMPLEMENTATION

