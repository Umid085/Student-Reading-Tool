// ═══════════════════════════════════════════════════════════════════
// ACCESSIBILITY UTILITIES
// WCAG 2.1 AA compliance helpers and focus management
// ═══════════════════════════════════════════════════════════════════

import { colors, radius } from './designSystem.js';

// ───────────────────────────────────────────────────────────────────
// FOCUS RING STYLE — For keyboard navigation visibility
// ───────────────────────────────────────────────────────────────────

export const focusRingStyle = {
  outline: 'none',
  boxShadow: '0 0 0 3px rgba(129,140,248,0.5)',
  borderRadius: radius.md,
};

// Apply to interactive elements for keyboard focus
export const accessibleButtonStyle = {
  position: 'relative',
  transition: 'box-shadow 150ms ease-in-out',
};

// ───────────────────────────────────────────────────────────────────
// ARIA LABELS & SEMANTIC ATTRIBUTES
// ───────────────────────────────────────────────────────────────────

// Quiz question option button with ARIA
export function getOptionButtonA11y(index, optionText, questionNumber, totalQuestions) {
  var letterMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var letter = letterMap[index] || 'Option ' + (index + 1);

  return {
    role: 'radio',
    'aria-label': letter + ': ' + optionText,
    'aria-checked': false, // Updated dynamically when selected
    tabIndex: 0,
  };
}

// Quiz screen semantic structure
export function getQuizSectionA11y(level, questionNumber, totalQuestions) {
  return {
    role: 'region',
    'aria-label': 'Quiz: ' + level + ' Level, Question ' + questionNumber + ' of ' + totalQuestions,
    'aria-live': 'polite',
  };
}

// Results section
export function getResultsSectionA11y(score, level) {
  return {
    role: 'region',
    'aria-label': 'Quiz Results: ' + score + '% on ' + level + ' level quiz',
    'aria-live': 'assertive',
  };
}

// Leaderboard region
export function getLeaderboardA11y(level, rank) {
  return {
    role: 'region',
    'aria-label': 'Leaderboard for ' + level + ' level, your rank: ' + rank,
  };
}

// ───────────────────────────────────────────────────────────────────
// FOCUS MANAGEMENT
// ───────────────────────────────────────────────────────────────────

export function useFocusManagement(elementRef) {
  return {
    focus: function() {
      if (elementRef && elementRef.current) {
        elementRef.current.focus();
      }
    },
    blur: function() {
      if (elementRef && elementRef.current) {
        elementRef.current.blur();
      }
    },
  };
}

// Move focus to first interactive element in a region
export function focusFirstElement(containerId) {
  var container = document.getElementById(containerId);
  if (container) {
    var firstFocusable = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// KEYBOARD NAVIGATION
// ───────────────────────────────────────────────────────────────────

export function handleKeyboardNavigation(event, callbacks) {
  var key = event.key;

  // Arrow keys for option selection
  if (key === 'ArrowDown' || key === 'ArrowRight') {
    event.preventDefault();
    if (callbacks.selectNext) callbacks.selectNext();
  }

  if (key === 'ArrowUp' || key === 'ArrowLeft') {
    event.preventDefault();
    if (callbacks.selectPrevious) callbacks.selectPrevious();
  }

  // Enter to confirm selection
  if (key === 'Enter') {
    event.preventDefault();
    if (callbacks.submit) callbacks.submit();
  }

  // Escape to close modals/cancel
  if (key === 'Escape') {
    event.preventDefault();
    if (callbacks.cancel) callbacks.cancel();
  }
}

// ───────────────────────────────────────────────────────────────────
// COLOR CONTRAST CHECKING
// ───────────────────────────────────────────────────────────────────

// Simple contrast ratio calculator (for reference)
function getLuminance(r, g, b) {
  var rgb = [r, g, b].map(function(x) {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function getContrastRatio(color1, color2) {
  // color1 and color2 should be hex strings like '#ffffff'
  var rgb1 = parseInt(color1.slice(1), 16);
  var r1 = (rgb1 >> 16) & 255,
    g1 = (rgb1 >> 8) & 255,
    b1 = rgb1 & 255;

  var rgb2 = parseInt(color2.slice(1), 16);
  var r2 = (rgb2 >> 16) & 255,
    g2 = (rgb2 >> 8) & 255,
    b2 = color2 & 255;

  var lum1 = getLuminance(r1, g1, b1);
  var lum2 = getLuminance(r2, g2, b2);

  var lighter = Math.max(lum1, lum2);
  var darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Verify WCAG AA contrast (4.5:1 for normal text, 3:1 for large text)
export function meetsWCAG_AA(foreground, background, largeText) {
  var ratio = getContrastRatio(foreground, background);
  var required = largeText ? 3 : 4.5;
  return ratio >= required;
}

// ───────────────────────────────────────────────────────────────────
// SCREEN READER ANNOUNCEMENTS
// ───────────────────────────────────────────────────────────────────

export function announceToScreenReader(message, priority) {
  // Create a live region div if it doesn't exist
  var existingRegion = document.getElementById('sr-announcements');
  if (!existingRegion) {
    var region = document.createElement('div');
    region.id = 'sr-announcements';
    region.setAttribute('aria-live', priority || 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
    existingRegion = region;
  }

  existingRegion.setAttribute('aria-live', priority || 'polite');
  existingRegion.textContent = message;
}

// Announce quiz results
export function announceQuizResult(score, totalQuestions, correct) {
  var message = correct + ' out of ' + totalQuestions + ' questions correct. Your score is ' + score + ' percent.';
  announceToScreenReader(message, 'assertive');
}

// Announce new question
export function announceNewQuestion(questionNumber, totalQuestions, questionText) {
  var message = 'Question ' + questionNumber + ' of ' + totalQuestions + '. ' + questionText;
  announceToScreenReader(message, 'assertive');
}

// Announce button click
export function announceAction(action, detail) {
  var message = action + (detail ? ': ' + detail : '');
  announceToScreenReader(message, 'polite');
}

// ───────────────────────────────────────────────────────────────────
// FORM ACCESSIBILITY
// ───────────────────────────────────────────────────────────────────

export function getInputA11y(inputId, labelText, isRequired) {
  return {
    id: inputId,
    'aria-label': labelText + (isRequired ? ' (required)' : ''),
    'aria-required': isRequired || false,
    'aria-invalid': false, // Set to true if input has error
    'aria-describedby': inputId + '-help', // Points to error/help text
  };
}

export function getLabelA11y(inputId, labelText) {
  return {
    htmlFor: inputId,
    style: {
      cursor: 'pointer',
      fontWeight: 600,
      marginBottom: '4px',
      display: 'block',
    },
  };
}

// ───────────────────────────────────────────────────────────────────
// SKIP LINKS
// ───────────────────────────────────────────────────────────────────

export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: '-10000px',
        zIndex: 999,
        padding: '8px 16px',
        background: colors.primary,
        color: colors.bg,
        textDecoration: 'none',
        borderRadius: radius.md,
      }}
      onFocus={function(e) {
        e.target.style.left = '0';
        e.target.style.top = '0';
      }}
      onBlur={function(e) {
        e.target.style.left = '-10000px';
      }}
    >
      Skip to main content
    </a>
  );
}

// ───────────────────────────────────────────────────────────────────
// REDUCED MOTION SUPPORT
// ───────────────────────────────────────────────────────────────────

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationStyle(normalStyle, reduceMotionStyle) {
  return prefersReducedMotion() ? reduceMotionStyle : normalStyle;
}

// Usage: style={getAnimationStyle({transition: '200ms'}, {transition: 'none'})}

// ───────────────────────────────────────────────────────────────────
// MOBILE TOUCH ACCESSIBILITY
// ───────────────────────────────────────────────────────────────────

export const touchAccessibleButtonStyle = {
  minHeight: '44px',
  minWidth: '44px',
  // Ensures touch targets are at least 44x44 pixels (WCAG 2.1 AA)
};

// ───────────────────────────────────────────────────────────────────
// SEMANTIC HTML HELPERS
// ───────────────────────────────────────────────────────────────────

// Use <button> instead of <div> for clickable elements
// Use <label> with <input> instead of custom inputs
// Use <h1>, <h2>, <h3> for headings (never skip levels)
// Use <section>, <article>, <nav> for page regions
// Use <ul>/<ol> for lists, never use <div> as list

export function semanticButtonProps(type, ariaLabel) {
  return {
    type: type || 'button',
    'aria-label': ariaLabel,
  };
}

// ───────────────────────────────────────────────────────────────────
// TESTING CHECKLIST (for manual QA)
// ───────────────────────────────────────────────────────────────────

export const a11yTestingChecklist = [
  {
    category: 'Keyboard Navigation',
    tests: [
      'Tab through all interactive elements',
      'Shift+Tab goes backward',
      'Can reach all buttons, links, inputs',
      'Focus order is logical',
      'Focus visible indicator clear (blue ring)',
    ],
  },
  {
    category: 'Screen Reader (NVDA/JAWS/VoiceOver)',
    tests: [
      'Page title announced',
      'Headings announced correctly (h1 → h2 → h3)',
      'Buttons have labels',
      'Form inputs have labels',
      'Images have alt text (if needed)',
      'Quiz questions read clearly',
      'Results announced with scores',
    ],
  },
  {
    category: 'Color Contrast',
    tests: [
      'Text vs background 4.5:1 minimum',
      'Large text vs background 3:1 minimum',
      'Icons have sufficient contrast',
      'Links distinguishable without color alone',
    ],
  },
  {
    category: 'Responsive & Touch',
    tests: [
      'Buttons are 44x44px minimum',
      'Spacing between touch targets adequate',
      'Zoom to 200% doesn\'t break layout',
      'Works on 320px screens (iPhone SE)',
      'Works on 768px tablets',
    ],
  },
  {
    category: 'Motion & Animation',
    tests: [
      'prefers-reduced-motion is respected',
      'Animations can be interrupted',
      'No auto-playing videos with sound',
      'No flashing content (>3Hz)',
    ],
  },
];

export default {
  focusRingStyle,
  accessibleButtonStyle,
  getOptionButtonA11y,
  getQuizSectionA11y,
  getResultsSectionA11y,
  getLeaderboardA11y,
  handleKeyboardNavigation,
  announceToScreenReader,
  announceQuizResult,
  announceNewQuestion,
  prefersReducedMotion,
  getAnimationStyle,
  touchAccessibleButtonStyle,
  a11yTestingChecklist,
};
