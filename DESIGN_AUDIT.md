# Student Reading Tool - Design Audit Report
**Date:** 2026-04-28  
**Status:** In Progress - Initial Findings

---

## Executive Summary

The Student Reading Tool has a solid dark-theme foundation with good level-based color coding, but lacks several critical web design standards around accessibility, design system organization, and responsive behavior. The app is highly functional but needs refinement for professional quality.

**Critical Issues:** 8  
**Major Issues:** 12  
**Minor Issues:** 15+

---

## Critical Issues (Must Fix)

### 1. **Missing ARIA Labels on Interactive Elements**
- **Severity:** CRITICAL (WCAG Violation)
- **Location:** `student-reading-quest.jsx` - all button components
- **Issue:** Buttons throughout the app (MCQ options, matching pairs, etc.) lack `aria-label` attributes
- **Example:** Lines 237-241 (McqQ component) - circle buttons with letters A/B/C/D have no labels
- **Impact:** Screen reader users cannot understand button purposes
- **Fix Required:** Add `aria-label` to every interactive button element

### 2. **No Focus Indicators for Keyboard Navigation**
- **Severity:** CRITICAL (WCAG Violation)
- **Location:** All interactive elements
- **Issue:** No visible `:focus-visible` or focus outline styles applied
- **Impact:** Keyboard users cannot see which element has focus
- **Fix Required:** Add focus ring styles to all buttons and interactive elements

### 3. **Form Inputs Lack Labels**
- **Severity:** CRITICAL (WCAG Violation)
- **Location:** Auth screen (login/register form), profile form
- **Issue:** Input fields like username, password have no associated `<label>` elements or `aria-label`
- **Impact:** Inaccessible to screen reader users
- **Fix Required:** Wrap inputs with `<label>` elements or add `aria-label`

### 4. **No Error Handling Display**
- **Severity:** CRITICAL (UX Issue)
- **Location:** Auth screen, quiz submission, data saving
- **Issue:** API errors or validation failures may not display user-friendly messages
- **Impact:** Users don't know why an action failed
- **Fix Required:** Add error state UI with clear messaging

### 5. **Hardcoded Color Values (No Design Tokens)**
- **Severity:** CRITICAL (Maintainability)
- **Location:** Throughout entire component (200+ hex color codes)
- **Issue:** Colors like `#818cf8`, `#34d399`, `#ef4444` repeated throughout inline styles
- **Impact:** Impossible to maintain consistent palette; difficult to update branding
- **Fix Required:** Extract all colors into a design system object

### 6. **No Loading States**
- **Severity:** CRITICAL (UX Issue)
- **Location:** API calls (generate quiz, save progress)
- **Issue:** No visual feedback when fetching from Anthropic API or Firebase
- **Impact:** Users don't know if action is processing or failed
- **Fix Required:** Add loading spinner/skeleton during API calls

### 7. **Inline Styles Make Code Unmaintainable**
- **Severity:** CRITICAL (Code Quality)
- **Location:** Nearly all JSX elements
- **Issue:** 1100+ lines with inline `style={{}}` objects repeated
- **Impact:** Hard to refactor, impossible to apply global changes, breaks design consistency
- **Fix Required:** Extract styles into constants or CSS classes

### 8. **No Responsive Mobile Testing**
- **Severity:** CRITICAL (UX Issue)
- **Location:** Quiz stage, Results screen
- **Issue:** Complex layouts (matching pairs, chart visualization) untested on mobile (320px)
- **Impact:** Poor experience on phones; may break layout
- **Fix Required:** Test and fix mobile layout at 320px, 480px, 768px breakpoints

---

## Major Issues

### A. **Color Contrast (WCAG AA)**
- `#6b7280` (gray text) on `#0d0d1a` (dark bg) may not meet 4.5:1 ratio
- Need to verify all text colors meet WCAG AA standard
- **Fix:** Use tools like WebAIM contrast checker

### B. **No Semantic HTML**
- All buttons use custom styled `<button>` elements
- Quiz screen layout should use `<form>` elements
- Could use `<fieldset>` and `<legend>` for question groups
- **Impact:** Screen readers struggle with structure

### C. **Accessibility: Missing Keyboard Navigation**
- Matching game requires mouse clicks on both left and right items
- No tab order or keyboard shortcuts defined
- **Fix:** Implement keyboard navigation for all interactive elements

### D. **Visual Hierarchy Issues**
- Quiz questions are long blocks of inline text
- No clear distinction between question text, options, and instructions
- Typography uses same font-size throughout (13px, 12px)
- **Fix:** Establish typography scale (H1, H2, Body, Caption)

### E. **Leaderboard Layout**
- User rankings display without clear visual separation
- Spacing inconsistent between entries
- No visual emphasis for current user's position
- **Fix:** Improve card-based layout with better contrast

### F. **Friends/Social Features UI**
- Friend request buttons have no confirmation feedback
- No "toast" notification when action succeeds
- Unclear which items are pending vs. accepted
- **Fix:** Add status badges and success notifications

### G. **Results Screen Visualization**
- Score display lacks visual hierarchy
- XP calculation not explained to user
- Streak bonus, time bonus not visually distinguished
- **Fix:** Create visual breakdown of score components

### H. **Form Validation**
- No inline validation feedback as user types
- Errors appear only after submit
- No success confirmation message
- **Fix:** Add real-time validation with clear messaging

### I. **Mobile Touch Targets**
- Buttons are small (around 22-30px) - WCAG requires 44x44px minimum
- Interactive elements too close together for reliable touch
- **Fix:** Increase button sizes and padding for touch screens

### J. **Theme Color Not Set**
- No `<meta name="theme-color">` in HTML
- App won't display app-like color bar on mobile
- **Fix:** Add theme color meta tag for level colors

### K. **No Animation Responsiveness**
- No `prefers-reduced-motion` support
- Animations may cause issues for users with vestibular disorders
- **Fix:** Check animations and respect `prefers-reduced-motion`

### L. **Data Export/Long Content**
- Long quiz passages might overflow on narrow screens
- No `text-wrap: balance` on headings
- No handling of very long user-generated content (profiles)
- **Fix:** Add proper text wrapping and overflow handling

---

## Minor Issues & Best Practices

1. **Auto-complete Attributes Missing** - Username/password inputs lack `autocomplete="username"` and `autocomplete="current-password"`
2. **Images/Icons** - SVG icons in charts lack `aria-hidden` or descriptions
3. **Deep Linking** - No URL state management; can't bookmark quiz or leaderboard screens
4. **Empty States** - "No games to chart yet" message is minimal; could be more helpful
5. **Date Formatting** - Uses `.toLocaleDateString()` but should use `Intl.DateTimeFormat` for i18n
6. **Timestamps** - Friend request dates don't use proper formatting
7. **Button Cursor** - Some buttons switch cursor to `default` when disabled, should be `not-allowed`
8. **Z-Index Management** - No clear stacking context for modals or overlays (if any)
9. **Password Field** - No type validation; shows plaintext in localStorage
10. **Session Timeout** - No warning before session expires
11. **Error Recovery** - No "retry" button for failed API calls
12. **Analytics** - No tracking of which question types users struggle with
13. **Print Styles** - No print-friendly styles for certificates or results
14. **Favicon** - App likely lacks favicon in HTML head
15. **Meta Description** - Missing SEO meta tags if this becomes public

---

## Accessibility Audit (WCAG 2.1 AA)

| Criterion | Status | Details |
|-----------|--------|---------|
| Color Contrast (4.5:1) | ⚠️ NEEDS VERIFICATION | Gray text needs testing |
| Focus Indicators | ❌ FAIL | No visible focus rings |
| ARIA Labels | ❌ FAIL | Missing on all buttons |
| Form Labels | ❌ FAIL | Inputs lack associated labels |
| Keyboard Navigation | ❌ FAIL | Matching game not keyboard accessible |
| Semantic HTML | ⚠️ PARTIAL | Uses buttons but missing form semantics |
| Alt Text | N/A | No images with alt needed |
| Animations | ⚠️ CHECK | No prefers-reduced-motion support |
| Language | ✅ PASS | All content in English |
| Error Messages | ⚠️ INCOMPLETE | Some errors not displayed |

**Overall WCAG Score:** ~40% (Currently at Level C, target Level AA)

---

## Responsive Design Review

### Mobile (320px)
- **Issue:** Charts may not scale properly at small viewport
- **Issue:** Matching pairs interface may need two-column layout
- **Issue:** Friend list/leaderboard needs scrolling
- **Issue:** Quiz buttons may be hard to tap at 30px

### Tablet (768px)
- **Status:** Likely adequate but needs testing

### Desktop (1920px)
- **Status:** Likely adequate but needs testing

**Recommendation:** Test on actual devices (iPhone 12 Mini, iPad, etc.)

---

## Design System Assessment

**Current State:** ❌ NO DESIGN SYSTEM
- 200+ hardcoded hex colors
- No spacing scale defined (margins/padding arbitrary)
- No typography scale
- No component library
- No border-radius/shadow standards

**Required Design Tokens:**
```javascript
// Colors (by semantic meaning, not usage)
colors = {
  primary: '#818cf8',      // Interactive elements
  success: '#34d399',      // Correct answers
  error: '#ef4444',        // Wrong answers/errors
  warning: '#f59e0b',      // Warnings
  bg: '#0d0d1a',           // Main background
  surface: 'rgba(255,255,255,0.04)',  // Cards
  text: '#e5e7eb',         // Primary text
  textSecondary: '#9ca3af', // Secondary text
  border: 'rgba(255,255,255,0.1)', // Borders
}

// Spacing (8px base)
spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  2xl: '24px',
}

// Typography
typography = {
  h1: { size: '28px', weight: 700 },
  h2: { size: '24px', weight: 700 },
  body: { size: '14px', weight: 400 },
  small: { size: '12px', weight: 400 },
}
```

---

## Priority Fixes (Next Steps)

### Phase 1 (Critical - Week 1)
1. [ ] Add ARIA labels to all buttons
2. [ ] Add focus rings and keyboard navigation
3. [ ] Create design tokens object for colors
4. [ ] Add loading states for API calls
5. [ ] Test on mobile (320px) and fix layout

### Phase 2 (High Priority - Week 2)
6. [ ] Extract inline styles to constants
7. [ ] Add form labels and validation UI
8. [ ] Improve leaderboard/results visualization
9. [ ] Add error messaging and recovery
10. [ ] Set up design system documentation

### Phase 3 (Medium Priority - Week 3+)
11. [ ] Test and verify WCAG AA contrast
12. [ ] Add prefers-reduced-motion support
13. [ ] Implement notification system
14. [ ] Responsive grid improvements
15. [ ] Mobile touch target optimization

---

## Tools Recommended

- **Accessibility:** WAVE, Axe DevTools, NVDA Screen Reader
- **Contrast:** WebAIM Contrast Checker
- **Design:** Figma (create component library)
- **Testing:** Playwright for automated visual regression
- **Responsive:** Chrome DevTools device emulation + real devices

---

## Next Action

Start with Task #4: Fix critical bugs and incorporate accessibility fixes.  
Then proceed with Task #3: Redesign high-impact screens using the new design system.

