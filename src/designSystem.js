// ═════════════════════════════════════════════════════════
// DESIGN SYSTEM — Central token store for Student Reading Quest
// ═════════════════════════════════════════════════════════

// CEFR Level color mappings (matches existing LEVELS array)
const LEVEL_COLORS = {
  A1: "#22c55e", // bright green
  A2: "#16a34a", // darker green
  B1: "#f59e0b", // amber
  B2: "#d97706", // darker amber
  C1: "#6366f1", // indigo
  C2: "#ec4899", // pink
};

// ═════════════════════════════════════════════════════════
// COLOR TOKENS
// ═════════════════════════════════════════════════════════

export const colors = {
  // Base palette
  black: "#000000",
  white: "#ffffff",
  transparent: "transparent",

  // Semantic colors
  primary: "#5af0b3", // electric mint (matches --rq-accent)
  secondary: "#a78bfa", // light violet (matches --rq-secondary)
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  info: "#0ea5e9",

  // Backgrounds & surfaces
  bg: {
    darkest: "#0d0d1a", // main dark bg
    dark: "#1a1a2e",
    darker: "#2a2a3e",
    light: "#ffffff",
    overlay: "rgba(13, 13, 26, 0.8)",
    card: "rgba(255, 255, 255, 0.05)", // glassmorphism
  },

  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)",
    inverse: "#0d0d1a",
  },

  // CEFR Level colors
  levels: LEVEL_COLORS,

  // Utility helpers
  rgba: (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};

// ═════════════════════════════════════════════════════════
// SPACING SCALE (8px base unit)
// ═════════════════════════════════════════════════════════

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "48px",

  // Numeric values for calculations
  values: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
  },
};

// ═════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═════════════════════════════════════════════════════════

export const typography = {
  h1: {
    fontSize: "32px",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "1.2",
  },
  h2: {
    fontSize: "20px",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "1.3",
  },
  h3: {
    fontSize: "16px",
    fontWeight: 800,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "1.4",
  },
  body: {
    fontSize: "14px",
    fontWeight: 400,
    fontFamily: "'Inter', 'Trebuchet MS', sans-serif",
    lineHeight: "1.6",
  },
  bodySmall: {
    fontSize: "12px",
    fontWeight: 400,
    fontFamily: "'Inter', 'Trebuchet MS', sans-serif",
    lineHeight: "1.5",
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Inter', 'Trebuchet MS', sans-serif",
    lineHeight: "1.4",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  button: {
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'Inter', 'Trebuchet MS', sans-serif",
    lineHeight: "1.5",
  },
  mono: {
    fontSize: "13px",
    fontWeight: 400,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: "1.5",
  },
  monoLarge: {
    fontSize: "16px",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: "1.4",
  },
};

// ═════════════════════════════════════════════════════════
// REUSABLE STYLE OBJECTS
// ═════════════════════════════════════════════════════════

export const styles = {
  buttonBase: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    ...typography.button,
    transition: "all 0.15s ease",
  },

  buttonPrimary: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    color: colors.white,
    boxShadow: `0 0 20px ${colors.rgba(colors.primary, 0.3)}`,
  },

  ghostButton: {
    background: "transparent",
    color: colors.text.primary,
    border: `1px solid ${colors.rgba(colors.primary, 0.5)}`,
    boxShadow: `inset 0 0 10px ${colors.rgba(colors.primary, 0.1)}`,
  },

  inputBase: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: "8px",
    border: `1px solid ${colors.rgba(colors.primary, 0.3)}`,
    background: colors.bg.card,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    transition: "all 0.2s ease",
  },

  card: {
    padding: spacing.lg,
    borderRadius: "18px",
    background: colors.bg.card,
    border: `1px solid ${colors.rgba(colors.primary, 0.2)}`,
    backdropFilter: "blur(10px)",
    transition: "all 0.15s ease",
  },

  focusRing: {
    outline: "none",
    boxShadow: `0 0 0 3px ${colors.rgba(colors.primary, 0.4)}`,
  },
};

// ═════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════

export function getOptionStyle(isSelected, isCorrect, isConfirmed) {
  if (isConfirmed) {
    if (isCorrect) {
      return { background: colors.rgba(colors.success, 0.2), borderColor: colors.success };
    }
    return { background: colors.rgba(colors.error, 0.2), borderColor: colors.error };
  }
  if (isSelected) {
    return { background: colors.rgba(colors.primary, 0.3), borderColor: colors.primary };
  }
  return {};
}

export function getLevelColor(level) {
  return colors.levels[level] || colors.primary;
}

export function getLevelGlow(level) {
  const color = getLevelColor(level);
  return `0 0 20px ${colors.rgba(color, 0.4)}`;
}

export function getTextColor(level) {
  return getLevelColor(level);
}

// ═════════════════════════════════════════════════════════
// CSS CUSTOM PROPERTIES (use in global styles)
// ═════════════════════════════════════════════════════════

export function getCSSVariables() {
  return {
    "--rq-accent": colors.primary,
    "--rq-secondary": colors.secondary,
    "--rq-accent-rgb": "129, 140, 248",
    "--rq-secondary-rgb": "167, 139, 250",
    "--rq-accent-border": colors.rgba(colors.primary, 0.3),
    "--rq-accent-glow": `0 0 20px ${colors.rgba(colors.primary, 0.4)}`,
    "--rq-transition": "all 0.15s ease",
    "--rq-card-radius": "18px",
  };
}
