// ═══════════════════════════════════════════════════════════════════
// STUDENT READING TOOL — DESIGN SYSTEM
// Centralized design tokens for consistent UI across the app
// ═══════════════════════════════════════════════════════════════════

export const colors = {
  // Primary & Semantic
  primary: '#818cf8',           // Interactive elements, focus states
  primaryLight: '#c7d2fe',      // Hover states
  primaryDark: '#6366f1',       // Pressed/darker variant

  success: '#34d399',           // Correct answers, confirmations
  successLight: 'rgba(52,211,153,0.15)',
  error: '#ef4444',             // Wrong answers, errors
  errorLight: 'rgba(239,68,68,0.15)',
  warning: '#f59e0b',           // Warnings, cautions
  warningLight: 'rgba(245,158,11,0.25)',

  // Backgrounds
  bg: '#0d0d1a',                // Main background
  bgSecondary: 'rgba(0,0,0,0.2)',  // Elevated surfaces
  surface: 'rgba(255,255,255,0.04)',  // Cards, modals
  surfaceHover: 'rgba(255,255,255,0.07)',

  // Text & Borders
  text: '#e5e7eb',              // Primary text
  textSecondary: '#9ca3af',     // Secondary text
  textMuted: '#6b7280',         // Muted text
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Level-specific colors (CEFR levels)
  levelA1: '#22c55e',
  levelA2: '#16a34a',
  levelB1: '#f59e0b',
  levelB2: '#d97706',
  levelC1: '#6366f1',
  levelC2: '#ec4899',

  // Level glows (semi-transparent for backgrounds)
  levelA1Glow: 'rgba(34,197,94,0.25)',
  levelA2Glow: 'rgba(22,163,74,0.25)',
  levelB1Glow: 'rgba(245,158,11,0.25)',
  levelB2Glow: 'rgba(217,119,6,0.25)',
  levelC1Glow: 'rgba(99,102,241,0.25)',
  levelC2Glow: 'rgba(236,72,153,0.25)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
};

export const typography = {
  // Page headings
  h1: {
    fontSize: '28px',
    fontWeight: 900,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '24px',
    fontWeight: 900,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '18px',
    fontWeight: 800,
    lineHeight: 1.4,
  },
  // Body text
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  bodySmall: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  // Labels & captions
  label: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  // Interactive
  button: {
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
};

export const shadows = {
  sm: '0 2px 4px rgba(0,0,0,0.2)',
  md: '0 4px 8px rgba(0,0,0,0.25)',
  lg: '0 8px 16px rgba(0,0,0,0.3)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
};

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '10px',
  xl: '14px',
  full: '999px',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// ───────────────────────────────────────────────────────────────────
// REUSABLE STYLE OBJECTS
// ───────────────────────────────────────────────────────────────────

export const styles = {
  // Buttons
  buttonBase: {
    fontFamily: 'inherit',
    border: 'none',
    borderRadius: radius.md,
    cursor: 'pointer',
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    transition: transitions.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
  },

  buttonPrimary: {
    background: colors.primary,
    color: colors.bg,
    fontWeight: 700,
    padding: `10px 16px`,
  },

  buttonGhost: {
    background: 'transparent',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    ':hover': {
      background: colors.surfaceHover,
    },
  },

  // Ghost button (commonly used)
  ghostButton: {
    background: 'transparent',
    border: 'none',
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: typography.body.fontSize,
    fontWeight: 600,
    transition: transitions.normal,
  },

  // Form inputs
  inputBase: {
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.text,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.body.fontSize,
    fontFamily: 'inherit',
    transition: transitions.normal,
  },

  // Cards & containers
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  // Modal overlay
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text utilities
  textTruncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Focus ring (for accessibility)
  focusRing: {
    outline: 'none',
    boxShadow: `0 0 0 3px rgba(129,140,248,0.5)`,
  },
};

// ───────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────────

export function getOptionStyle(isSelected, isCorrect, isConfirmed) {
  const base = {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.text,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  if (isConfirmed) {
    if (isCorrect) {
      return {
        ...base,
        background: colors.successLight,
        border: `1px solid ${colors.success}`,
        color: colors.success,
      };
    } else if (isSelected) {
      return {
        ...base,
        background: colors.errorLight,
        border: `1px solid ${colors.error}`,
        color: colors.error,
      };
    }
  } else if (isSelected) {
    return {
      ...base,
      background: 'rgba(99,102,241,0.2)',
      border: `1px solid ${colors.primary}`,
      color: colors.primaryLight,
    };
  }

  return base;
}

export function getTextColor(percentage) {
  if (percentage >= 80) return colors.success;
  if (percentage >= 60) return colors.warning;
  return colors.error;
}

export function getLevelColor(levelKey) {
  const levelColors = {
    A1: colors.levelA1,
    A2: colors.levelA2,
    B1: colors.levelB1,
    B2: colors.levelB2,
    C1: colors.levelC1,
    C2: colors.levelC2,
  };
  return levelColors[levelKey] || colors.primary;
}

export function getLevelGlow(levelKey) {
  const glows = {
    A1: colors.levelA1Glow,
    A2: colors.levelA2Glow,
    B1: colors.levelB1Glow,
    B2: colors.levelB2Glow,
    C1: colors.levelC1Glow,
    C2: colors.levelC2Glow,
  };
  return glows[levelKey] || colors.primaryLight;
}

// ───────────────────────────────────────────────────────────────────
// RESPONSIVE BREAKPOINTS
// ───────────────────────────────────────────────────────────────────

export const breakpoints = {
  mobile: '320px',    // Small phones
  mobileLandscape: '480px',  // Landscape phones
  tablet: '640px',    // Tablets
  desktop: '1024px',  // Desktop
  wide: '1920px',     // Wide screens
};

// Usage: if (window.innerWidth < parseInt(breakpoints.tablet)) { /* mobile */ }

export default {
  colors,
  spacing,
  typography,
  shadows,
  radius,
  transitions,
  styles,
  breakpoints,
};
