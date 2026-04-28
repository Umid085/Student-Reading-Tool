# End-to-End Testing Guide
## Student Reading Tool — QA Testing Plan

**Date:** 2026-04-28  
**Scope:** All screens, features, bugs, and design improvements  
**Target:** WCAG 2.1 AA accessibility + zero critical bugs

---

## Test Environment Setup

### Prerequisites
- [ ] Dev server running: `npm run dev` (port 5173)
- [ ] Browser DevTools open (F12)
- [ ] Network inspector ready (to watch API calls)
- [ ] Mobile emulator/real device available
- [ ] Screen reader installed (NVDA, JAWS, or VoiceOver)

### Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (iPhone)
- [ ] Chrome Mobile (Android)

### Test Devices
- [ ] Desktop (1920px or wider)
- [ ] Tablet (768px)
- [ ] Small phone (320px - iPhone SE)
- [ ] Large phone (480px)

---

## Test Suite 1: Authentication Flow

### 1.1 Register New User
**Steps:**
1. Click "Register" button
2. Enter username: `testuser` + timestamp (e.g., `testuser1234567890`)
3. Enter password: `TestPass123`
4. Click "Register"

**Expected Results:**
- [ ] Form validates (no empty fields allowed)
- [ ] Username uniqueness checked
- [ ] New user created successfully
- [ ] Auto-logged in after registration
- [ ] Redirected to Home screen (level selector)
- [ ] Session saved to localStorage

**Bugs to Check:**
- [ ] No XSS on username input
- [ ] Password encrypted (base64) in storage
- [ ] Can't register with duplicate username

---

### 1.2 Login Existing User
**Steps:**
1. Logout (if needed)
2. Click "Login" button
3. Enter username and password
4. Click "Log In"

**Expected Results:**
- [ ] Successful login
- [ ] Redirected to Home screen
- [ ] User profile loads correctly
- [ ] Session persists on page refresh

**Bugs to Check:**
- [ ] Invalid credentials show error message
- [ ] Account locked after 5 failed attempts (if implemented)

---

### 1.3 Auto-Login on Page Load
**Steps:**
1. Login with test account
2. Refresh page (Ctrl+R)

**Expected Results:**
- [ ] User stays logged in
- [ ] No login screen shown
- [ ] User data loads immediately
- [ ] Session timestamp updated

---

## Test Suite 2: Quiz Flow (Critical Path)

### 2.1 Level Selection
**Steps:**
1. Go to Home screen
2. View all 6 levels (A1-C2)
3. Click on B1 level

**Expected Results:**
- [ ] All levels displayed with correct colors
- [ ] Level description shown (e.g., "Intermediate")
- [ ] Color matches design system
- [ ] Selected level highlighted
- [ ] Option to choose question types visible

**Responsive Check:**
- [ ] Mobile (320px): Stack vertically, full width
- [ ] Tablet (768px): Grid layout
- [ ] Desktop: All visible

---

### 2.2 Question Type Selection
**Steps:**
1. After selecting level, see question type options
2. Select 2-3 question types (e.g., MCQ, Gap-Fill, Matching)
3. Click "Generate Quiz"

**Expected Results:**
- [ ] All 8 question types visible
- [ ] Can select/deselect types
- [ ] At least 1 type required
- [ ] "Generate Quiz" button enabled
- [ ] Loading screen shown with animated messages

**Loading Screen:**
- [ ] Messages rotate: "Picking a topic..." → "Writing passage..." → "Crafting questions..." → "Almost ready..."
- [ ] Level color displayed
- [ ] No timeout (should complete in <5 seconds normally)

**Bugs to Check:**
- [ ] Can't generate with 0 types selected
- [ ] Loading doesn't freeze UI

---

### 2.3 Reading Stage
**Steps:**
1. Wait for quiz to load
2. Read the passage
3. Scroll if passage is long

**Expected Results:**
- [ ] Passage displayed clearly
- [ ] Topic name shown
- [ ] Level color accent visible
- [ ] Readable on mobile (text not cut off)
- [ ] Can scroll passage on mobile
- [ ] "Start Quiz" button visible

**Typography Check:**
- [ ] Font size 14-16px for body text
- [ ] Adequate line height (1.5-1.8)
- [ ] Color contrast meets WCAG AA

---

### 2.4 Quiz Stage — MCQ Question
**Steps:**
1. Click "Start Quiz"
2. See first question (if it's MCQ type)
3. View all 4 options
4. Click on option A
5. Verify selection visual
6. Click "Check Answer"
7. View result (correct/incorrect)

**Visual Checks:**
- [ ] Question text large and clear
- [ ] Option buttons 48px+ height (touch-friendly)
- [ ] Selected option highlighted in blue
- [ ] Progress indicator shows "1 of X"
- [ ] Timer visible and counting down
- [ ] Timer color changes: green → amber → red

**State Changes:**
- [ ] After checking, options are disabled
- [ ] Correct option shows green ✓
- [ ] Wrong options show red ✕
- [ ] "Next Question" button appears

**Accessibility:**
- [ ] Can select with arrow keys
- [ ] Can submit with Enter key
- [ ] ARIA labels on buttons
- [ ] Focus ring visible on selected option

---

### 2.5 Quiz Stage — Other Question Types
**Repeat for each question type in quiz:**

#### Gap-Fill (Word)
- [ ] Blank shown as "___"
- [ ] Options appear below
- [ ] Selected word shown in blank
- [ ] Correct/incorrect feedback works

#### Gap-Fill (Sentence)
- [ ] Longer blanks shown
- [ ] Multiple sentence options
- [ ] Correct feedback shows green

#### Matching
- [ ] Left items listed
- [ ] Right items shuffled
- [ ] Can click left, then right to match
- [ ] Matched pairs show on left
- [ ] Partial credit awarded

#### Headings
- [ ] Paragraphs shown
- [ ] Headings shuffled
- [ ] Can match heading to paragraph
- [ ] Shows correct mappings after confirmation

#### Open Answer
- [ ] Text input field visible
- [ ] Can type answer
- [ ] Keywords checked (not exact match)
- [ ] Feedback shows keywords found

---

### 2.6 Time Limit & Scoring
**Steps:**
1. Complete quiz
2. Note final time
3. See results with XP breakdown

**Expected Results:**
- [ ] Time bonus awarded if finished early
- [ ] XP calculation correct: `base_points × level_mult × 100 + time_bonus + streak_bonus`
- [ ] Streak bonus applies (if 3+ correct in a row)
- [ ] Total XP shown prominently
- [ ] Level progress updated

**Bugs to Check:**
- [ ] No NaN in XP calculations
- [ ] Time bonus decreases as time runs out
- [ ] Negative XP not possible
- [ ] Level multiplier correct for level

---

## Test Suite 3: Results Screen

### 3.1 Score Display
**Steps:**
1. Complete any quiz
2. View results screen

**Expected Results:**
- [ ] Large percentage displayed (88px)
- [ ] Color-coded: green (≥80%), amber (≥60%), red (<60%)
- [ ] Animated entrance (scale effect)
- [ ] Feedback message contextual
- [ ] Level and date shown

**Animations:**
- [ ] Score animates in
- [ ] Cards slide in with stagger
- [ ] Respects prefers-reduced-motion

---

### 3.2 Score Breakdown
**Expected Results:**
- [ ] 4 cards: Base XP, Time, Streak, Total
- [ ] Correct values shown
- [ ] Colors: amber (XP), green (bonuses)
- [ ] Mobile: 2-column grid
- [ ] Desktop: 2x2 grid

---

### 3.3 Question Summary
**Expected Results:**
- [ ] Shows correct/incorrect count
- [ ] Lists each question type
- [ ] Green ✓ for correct, red ✕ for wrong
- [ ] Scrollable if many questions

---

### 3.4 Action Buttons
**Expected Results:**
- [ ] "Play Another Level" button works
- [ ] "View Leaderboard" navigates to leaderboard
- [ ] "Challenge Friend" opens challenge dialog
- [ ] Buttons are 44px+ (touch-friendly)

---

## Test Suite 4: Leaderboard

### 4.1 Level Selection
**Steps:**
1. View leaderboard
2. Click on different levels (A1, B1, C2, etc.)

**Expected Results:**
- [ ] Level tabs show correct colors
- [ ] Leaderboard updates for selected level
- [ ] Current level highlighted
- [ ] Responsive: scrollable on mobile

---

### 4.2 Leaderboard Display
**Expected Results:**
- [ ] Users ranked 1-20 (or fewer)
- [ ] Rank badges: 👑 (1st), 🥈 (2nd), 🥉 (3rd), number (4+)
- [ ] Rank colors: gold, silver, bronze, primary
- [ ] Current user highlighted (darker bg, blue left border)
- [ ] Stats shown: "Name | 85% • 12 Games | 2450 XP"
- [ ] Highest XP at top

**Bugs to Check:**
- [ ] No NaN in XP/percentage
- [ ] Correct user highlighted
- [ ] Ranking order is correct (descending XP)

---

### 4.3 Responsive Leaderboard
- [ ] Mobile (320px): Cards stack, rank/XP visible
- [ ] Tablet (768px): Cards full width
- [ ] Desktop: Cards with side spacing

---

## Test Suite 5: Friends & Social

### 5.1 Search & Add Friend
**Steps:**
1. Go to Friends screen
2. Search for another test user
3. Click "Add Friend" / "Send Request"

**Expected Results:**
- [ ] Search works (filters by username)
- [ ] Request sent successfully
- [ ] Status shows "Pending"
- [ ] Toast notification appears

---

### 5.2 Accept/Decline Friend Request
**Steps:**
1. Go to Requests tab
2. See pending friend requests
3. Click "Accept" on one
4. Click "Decline" on another

**Expected Results:**
- [ ] Accepted: Moves to Friends list
- [ ] Declined: Request disappears
- [ ] Confirmation message shown
- [ ] List updates immediately

---

### 5.3 View Friend Profile
**Steps:**
1. Go to Friends list
2. Click on friend name
3. View their profile

**Expected Results:**
- [ ] Friend stats displayed:
  - [ ] Level, join date
  - [ ] Total XP, avg %
  - [ ] Games played
- [ ] Comparison shows: Friend vs You
- [ ] Like button visible
- [ ] "Send Challenge" button visible
- [ ] "Remove Friend" button visible

---

### 5.4 Send Challenge
**Steps:**
1. On friend profile, click "Send Challenge"
2. Select level and question types
3. Click "Send"

**Expected Results:**
- [ ] Challenge created
- [ ] Appears in "Recent Challenges"
- [ ] Shows level and status
- [ ] Friend gets notification (if implemented)

---

## Test Suite 6: Accessibility (WCAG 2.1 AA)

### 6.1 Keyboard Navigation
**Steps:**
1. Start quiz
2. Press Tab to focus first option
3. Use Arrow keys to select options
4. Press Enter to submit

**Expected Results:**
- [ ] Tab cycles through interactive elements
- [ ] Focus ring visible (blue outline)
- [ ] Arrow keys move selection
- [ ] Enter submits answer
- [ ] Escape closes modals (if applicable)
- [ ] All elements reachable via keyboard

---

### 6.2 Screen Reader Test
**Tools:** NVDA (Windows) or VoiceOver (Mac)

**Steps:**
1. Enable screen reader
2. Navigate quiz
3. Hear question text
4. Hear option labels
5. Hear results announcement

**Expected Results:**
- [ ] Page title announced
- [ ] Quiz region announced with level/question number
- [ ] Question text readable
- [ ] Options labeled (A:, B:, C:, D:)
- [ ] Results announced
- [ ] XP values readable
- [ ] Buttons have labels

---

### 6.3 Color Contrast
**Tools:** WebAIM Contrast Checker

**Checks:**
- [ ] Text color vs background: ≥4.5:1
- [ ] Large text (18px+): ≥3:1
- [ ] Icon colors: ≥3:1
- [ ] Links distinguishable (not color alone)

**Problem Areas to Check:**
- [ ] Gray text (#9ca3af) on dark bg
- [ ] Level colors for readability
- [ ] Button colors when disabled

---

### 6.4 Mobile Accessibility
- [ ] Touch targets ≥44x44px
- [ ] Can use on-screen keyboard
- [ ] Zoom to 200% doesn't break
- [ ] Text is readable without horizontal scroll

---

### 6.5 Motion Accessibility
**Steps:**
1. Enable "Reduce Motion" in OS settings
2. Take quiz, view results

**Expected Results:**
- [ ] Animations disabled or instant
- [ ] No animation-dependent interactions
- [ ] Still fully functional
- [ ] No motion sickness risk

---

## Test Suite 7: Performance & Responsiveness

### 7.1 Page Load
**Expected:**
- [ ] Initial load: <3 seconds
- [ ] Quiz generation: <5 seconds
- [ ] Leaderboard: <2 seconds

**Measure:**
- [ ] DevTools Performance tab
- [ ] Network waterfall chart
- [ ] No jank or frame drops

---

### 7.2 Responsive Breakpoints
**Test at:**
- [ ] 320px (iPhone SE)
- [ ] 480px (landscape phone)
- [ ] 640px (tablet)
- [ ] 768px (iPad)
- [ ] 1024px (desktop)
- [ ] 1920px (large desktop)

**Checks:**
- [ ] Layout adjusts correctly
- [ ] Text readable at all sizes
- [ ] Touch targets adequate
- [ ] No overflow/horizontal scroll
- [ ] Images scale properly

---

### 7.3 Network Conditions
**Tests:**
- [ ] Slow 3G (DevTools simulation)
- [ ] Offline (disable network)
- [ ] Back online (enable network)

**Expected:**
- [ ] Data saved to localStorage first
- [ ] Firebase sync happens in background
- [ ] No data loss if offline
- [ ] Toast notifications for sync status

---

## Test Suite 8: Bug Verification

### 8.1 Fixed Bugs (Verify they're resolved)

**Bug #3: Avg % Shows NaN** ✅ FIXED
- [ ] Complete friend profile view
- [ ] Avg % displays as number (not NaN)
- [ ] Friend comparison shows valid %

**Bug #4: Total XP Shows NaN** ✅ FIXED
- [ ] View leaderboard
- [ ] All XP values are numbers
- [ ] No NaN in user stats

**Bug #5: Challenge Dates Timezone Issue** ✅ FIXED
- [ ] Send challenge to friend
- [ ] View challenge date
- [ ] Date format is consistent (ISO YYYY-MM-DD)

**Bug #6: Quiz State Not Reset** ✅ FIXED
- [ ] Complete Level B1 quiz
- [ ] Select Level A1
- [ ] Generate new quiz
- [ ] Old B1 questions don't appear

---

### 8.2 Potential Remaining Issues to Watch
- [ ] Time bonus calculation accuracy
- [ ] Streak bonus applies correctly (3+ in a row)
- [ ] Leaderboard ordering (correct XP sorting)
- [ ] Friend request deduplication
- [ ] Matching game shuffle is random

---

## Test Suite 9: Design System & UI

### 9.1 Color Consistency
**Verify:**
- [ ] Primary (#818cf8) used for interactive elements
- [ ] Success (#34d399) for correct answers
- [ ] Error (#ef4444) for wrong answers
- [ ] Warning (#f59e0b) for time warnings
- [ ] Level colors match design system

---

### 9.2 Spacing & Typography
**Checks:**
- [ ] Padding/margins use spacing scale (8px base)
- [ ] Typography hierarchy clear (h1 > h2 > h3 > body)
- [ ] Font weights consistent (700 for bold, 400 for regular)
- [ ] Line height adequate (1.5+)

---

### 9.3 Interactive States
**For buttons, inputs, cards:**
- [ ] Normal state: default colors
- [ ] Hover state: slightly lighter/darker
- [ ] Active state: pressed effect
- [ ] Disabled state: grayed out, not clickable
- [ ] Focus state: blue ring visible

---

## Test Execution Log

### Pre-Testing Checklist
- [ ] Backup existing data
- [ ] Clear localStorage before starting
- [ ] Have multiple test accounts ready
- [ ] Device list prepared
- [ ] Browser list prepared

### During Testing
- [ ] Document bugs found
- [ ] Screenshot errors
- [ ] Note exact reproduction steps
- [ ] Test on multiple devices per bug

### Bug Reporting Format
```
Bug ID: [number]
Title: [short description]
Severity: Critical | High | Medium | Low
Device: [device/browser/resolution]
Steps to Reproduce:
1. ...
2. ...
3. ...
Expected Result: [what should happen]
Actual Result: [what actually happened]
Screenshot/Video: [attach]
Notes: [additional context]
```

---

## Test Results Summary

**Date:** ___________  
**Tester:** ___________

### Results
- [ ] All tests passed
- [ ] Critical bugs: ___
- [ ] High bugs: ___
- [ ] Medium bugs: ___
- [ ] Low bugs: ___

### Sign-Off
- [ ] Approved for staging deployment
- [ ] Approved for production deployment
- [ ] More testing needed

**Signature:** _________________ **Date:** ________

---

## Next Steps After Testing

1. **Fix any critical/high bugs** (create new commits)
2. **Re-test fixed bugs** to verify
3. **Deploy to staging** (Netlify preview)
4. **Final UAT** (user acceptance testing)
5. **Deploy to production** (main release)

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Initial Load | <3s | ____ |
| Quiz Generation | <5s | ____ |
| Quiz Load | <1s | ____ |
| Leaderboard | <2s | ____ |
| Profile Load | <2s | ____ |
| Page Responsiveness | 60fps | ____ |
| Accessibility Score | 95+ | ____ |

