# Design System & Tokens Guide
## Student Reading Tool

---

## Quick Start

Import design tokens in any React component:

```javascript
import { colors, spacing, typography, styles, getOptionStyle, getLevelColor } from '../designSystem.js';
```

---

## Color Tokens

### Semantic Colors

Use these for intent-based styling:

```javascript
// Text
style={{ color: colors.text }}           // Primary text (#e5e7eb)
style={{ color: colors.textSecondary }}  // Secondary text (#9ca3af)
style={{ color: colors.textMuted }}      // Muted text (#6b7280)

// Status
style={{ color: colors.success }}        // Correct answers (#34d399)
style={{ color: colors.error }}          // Wrong answers (#ef4444)
style={{ color: colors.warning }}        // Warnings (#f59e0b)

// Backgrounds
style={{ background: colors.bg }}              // Main bg (#0d0d1a)
style={{ background: colors.surface }}        // Cards (rgba(255,255,255,0.04))
style={{ background: colors.surfaceHover }}   // Hover (rgba(255,255,255,0.07))
```

### CEFR Level Colors

```javascript
// Use helper function
style={{ color: getLevelColor('A1') }}  // Returns #22c55e

// Or direct access
colors.levelA1   // #22c55e
colors.levelA2   // #16a34a
colors.levelB1   // #f59e0b
colors.levelB2   // #d97706
colors.levelC1   // #6366f1
colors.levelC2   // #ec4899

// For background glows
style={{ background: colors.levelA1Glow }}  // rgba(34,197,94,0.25)
```

---

## Spacing Scale

All values based on **8px base unit**:

```javascript
spacing.xs    = '4px'   // Tiny gaps, icon sizes
spacing.sm    = '8px'   // Small buttons, tight spacing
spacing.md    = '12px'  // Default padding/margin
spacing.lg    = '16px'  // Standard section spacing
spacing.xl    = '20px'  // Large sections
spacing['2xl'] = '24px' // Extra large
spacing['3xl'] = '32px' // Hero sections
spacing['4xl'] = '40px' // Page margins
```

### Usage Examples

```javascript
// Button padding
style={{ padding: `${spacing.sm} ${spacing.md}` }}  // 8px 12px

// Flex gaps
style={{ gap: spacing.md }}

// Margins
style={{ marginBottom: spacing.lg }}

// Container padding
style={{ padding: spacing.xl }}
```

---

## Typography Scale

### Heading Levels

```javascript
typography.h1  // 28px, weight 900 — Page title
typography.h2  // 24px, weight 900 — Section title
typography.h3  // 18px, weight 800 — Subsection

// Usage
style={{ 
  fontSize: typography.h2.fontSize, 
  fontWeight: typography.h2.fontWeight 
}}

// Or apply all properties
style={{ ...typography.h2 }}
```

### Body Text

```javascript
typography.body       // 14px, weight 400 — Default body text
typography.bodySmall  // 13px, weight 400 — Compact text
typography.label      // 12px, weight 600 — Input labels
typography.caption    // 11px, weight 500 — Small captions
typography.button     // 13px, weight 600 — Button text
```

### Usage

```javascript
<h2 style={{ fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight }}>
  Quiz Results
</h2>

<p style={{ fontSize: typography.body.fontSize, color: colors.text }}>
  Great job! You scored 85%.
</p>
```

---

## Reusable Style Objects

### Button Styles

```javascript
// Base button structure
style={{ ...styles.buttonBase }}

// Primary button (filled)
style={{ ...styles.buttonBase, ...styles.buttonPrimary }}
// Background: primary color, text: dark
// Good for: Main CTAs, submit actions

// Ghost button (outlined)
style={{ ...styles.ghostButton }}
// Background: transparent, border: outline
// Good for: Secondary actions, navigation

// Custom button variant
style={{
  ...styles.buttonBase,
  background: colors.success,
  color: colors.bg,
  fontSize: typography.button.fontSize
}}
```

### Form Input Style

```javascript
<input 
  type="text" 
  style={{
    ...styles.inputBase,
    // Add custom properties if needed
    width: '100%'
  }} 
  placeholder="Enter username"
/>

// Styled: bgSecondary background, border, rounded corners
```

### Card Style

```javascript
<div style={{ ...styles.card }}>
  Card content goes here
</div>

// Styled: surface background, border, padding, rounded
```

### Focus Ring (Accessibility)

```javascript
<button style={{ ...styles.focusRing }}>
  Accessible Button
</button>

// Adds blue focus outline for keyboard navigation
```

---

## Helper Functions

### `getOptionStyle(isSelected, isCorrect, isConfirmed)`

Returns appropriate styles for quiz answer options:

```javascript
// MCQ option button
<button 
  style={getOptionStyle(
    isSelected={selectedIndex === i},
    isCorrect={i === q.answer},
    isConfirmed={confirmed}
  )}
>
  {option}
</button>

// Returns:
// - Normal: gray background
// - Selected: blue background (before confirmation)
// - Correct & confirmed: green background
// - Wrong & confirmed: red background
```

### `getTextColor(percentage)`

Returns color based on score percentage:

```javascript
<span style={{ color: getTextColor(avgPct) }}>
  {avgPct}%
</span>

// Returns:
// - >= 80: green (#34d399)
// - >= 60: amber (#f59e0b)
// - < 60: red (#ef4444)
```

### `getLevelColor(levelKey)`

Returns CEFR level color:

```javascript
style={{ color: getLevelColor('B2') }}  // Returns #d97706 (orange)

// Usage
<button style={{ 
  background: getLevelColor(level),
  color: colors.bg 
}}>
  {level}
</button>
```

### `getLevelGlow(levelKey)`

Returns semi-transparent level color for background glow:

```javascript
style={{
  background: getLevelGlow('C1'),
  padding: spacing.xl
}}

// Returns rgba(99,102,241,0.25) — semi-transparent blue
```

---

## Common Patterns

### Quiz Option Button (Before Confirmation)

```javascript
<button 
  onClick={() => selectOption(i)}
  style={{
    background: selectedIndex === i ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${selectedIndex === i ? colors.primary : colors.border}`,
    borderRadius: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: selectedIndex === i ? colors.primaryLight : colors.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: typography.bodySmall.fontSize,
    fontWeight: 600,
  }}
>
  Option A
</button>

// Better: Use helper
<button 
  onClick={() => selectOption(i)}
  style={getOptionStyle(selectedIndex === i, false, false)}
>
  Option A
</button>
```

### Section Card

```javascript
<div style={{
  ...styles.card,
  marginBottom: spacing.lg
}}>
  <h3 style={{ 
    fontSize: typography.h3.fontSize, 
    fontWeight: typography.h3.fontWeight,
    marginBottom: spacing.md,
    color: getLevelColor(level)
  }}>
    Quiz Results
  </h3>
  <p style={{ color: colors.textSecondary }}>
    Your score: 85%
  </p>
</div>
```

### Stats Display

```javascript
<div style={{ display: 'flex', gap: spacing.lg }}>
  <div style={{
    ...styles.card,
    flex: 1,
    textAlign: 'center'
  }}>
    <div style={{ 
      fontSize: typography.h2.fontSize,
      fontWeight: 900,
      color: getLevelColor('B1'),
      marginBottom: spacing.sm
    }}>
      {xpTotal}
    </div>
    <div style={{ 
      fontSize: typography.caption.fontSize,
      color: colors.textMuted 
    }}>
      Total XP
    </div>
  </div>
</div>
```

---

## Mobile Responsive Patterns

### Mobile-First Approach

```javascript
// Default (mobile): single column
style={{
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md
}}

// Desktop: check window width
{window.innerWidth >= 768 && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
    {/* Two columns */}
  </div>
)}
```

### Breakpoints

```javascript
breakpoints.mobile = '320px'      // Small phones
breakpoints.mobileLandscape = '480px'
breakpoints.tablet = '640px'      // Tablets
breakpoints.desktop = '1024px'    // Desktop
breakpoints.wide = '1920px'       // Wide screens
```

---

## Dos and Don'ts

### ✅ DO

```javascript
// ✅ Good: Use design tokens
style={{ color: colors.success, padding: spacing.md }}

// ✅ Good: Use helper functions
style={getOptionStyle(...)}

// ✅ Good: Reuse style objects
style={{ ...styles.card, marginBottom: spacing.lg }}

// ✅ Good: Use semantic color names
style={{ color: colors.error }}  // Clear intent

// ✅ Good: Apply typography scale
style={{ fontSize: typography.h2.fontSize }}
```

### ❌ DON'T

```javascript
// ❌ Bad: Hardcoded colors
style={{ color: '#818cf8' }}

// ❌ Bad: Magic numbers
style={{ padding: '12px' }}

// ❌ Bad: Inconsistent sizing
style={{ fontSize: '16px', margin: '15px' }}

// ❌ Bad: New color values
style={{ background: '#a1b2c3' }}

// ❌ Bad: Mixing approaches
style={{ color: colors.text, padding: '16px' }}  // Mix of token and magic number
```

---

## Migration Guide

If updating existing code to use design tokens:

### Before
```javascript
style={{
  color: '#e5e7eb',
  background: 'rgba(255,255,255,0.05)',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  fontSize: '14px'
}}
```

### After
```javascript
style={{
  color: colors.text,
  background: colors.surface,
  padding: `${spacing.md} ${spacing.lg}`,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  fontSize: typography.body.fontSize
}}
```

---

## Questions?

Refer to `src/designSystem.js` for all available tokens and their values.
