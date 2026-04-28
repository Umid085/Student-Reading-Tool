// ═══════════════════════════════════════════════════════════════════
// MICRO-INTERACTIONS UTILITIES
// JavaScript helpers for dynamic animations and interactive feedback
// ═══════════════════════════════════════════════════════════════════

import { prefersReducedMotion } from './a11yUtils.js';

// ───────────────────────────────────────────────────────────────────
// DYNAMIC ANIMATION STYLES
// ───────────────────────────────────────────────────────────────────

export function getAnimatedStyle(baseStyle, animationName, duration = 300) {
  if (prefersReducedMotion()) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    animation: animationName + ' ' + duration + 'ms ease-out forwards',
  };
}

export function getTransitionStyle(baseStyle, properties = 'all', duration = 150) {
  return {
    ...baseStyle,
    transition: properties + ' ' + duration + 'ms ease-in-out',
  };
}

// ───────────────────────────────────────────────────────────────────
// BUTTON INTERACTIONS
// ───────────────────────────────────────────────────────────────────

// Ripple effect on button click (visual feedback)
export function createRipple(event) {
  var button = event.currentTarget;
  var ripple = document.createElement('span');

  var rect = button.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var x = event.clientX - rect.left - size / 2;
  var y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple';

  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(255,255,255,0.5)';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'rippleExpand 600ms ease-out';

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(function() {
    ripple.remove();
  }, 600);
}

// ───────────────────────────────────────────────────────────────────
// SUCCESS FEEDBACK ANIMATIONS
// ───────────────────────────────────────────────────────────────────

// Checkmark animation for correct answer
export function showCorrectFeedback(elementRef) {
  if (!elementRef || !elementRef.current) return;

  elementRef.current.classList.add('animate-success');

  setTimeout(function() {
    elementRef.current.classList.remove('animate-success');
  }, 500);
}

// Shake animation for incorrect answer
export function showErrorFeedback(elementRef) {
  if (!elementRef || !elementRef.current) return;

  elementRef.current.classList.add('animate-shake');

  setTimeout(function() {
    elementRef.current.classList.remove('animate-shake');
  }, 400);
}

// ───────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ───────────────────────────────────────────────────────────────────

export function showToast(message, type = 'info', duration = 3000) {
  var toast = document.createElement('div');
  var colors = {
    success: '#34d399',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#818cf8',
  };

  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = colors[type] || colors.info;
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '9999';
  toast.style.maxWidth = '300px';
  toast.style.animation = 'toastSlideIn 300ms ease-out';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(function() {
    toast.style.animation = 'toastSlideOut 300ms ease-in';
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, duration);
}

// ───────────────────────────────────────────────────────────────────
// STAGGERED LIST ANIMATIONS
// ───────────────────────────────────────────────────────────────────

export function addStaggerAnimation(containerRef, itemSelector) {
  if (!containerRef || !containerRef.current) return;

  var items = containerRef.current.querySelectorAll(itemSelector);
  items.forEach(function(item, index) {
    var delay = index * 100;
    item.style.animation = 'listItemSlideIn 300ms ease-out';
    item.style.animationDelay = delay + 'ms';
    item.style.animationFillMode = 'both';
  });
}

// ───────────────────────────────────────────────────────────────────
// SCORE COUNTER ANIMATION
// ───────────────────────────────────────────────────────────────────

export function animateScoreCounter(elementRef, startValue, endValue, duration = 1000) {
  if (!elementRef || !elementRef.current) return;

  var startTime = null;
  var element = elementRef.current;

  function animateFrame(currentTime) {
    if (!startTime) startTime = currentTime;
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);

    var currentValue = Math.floor(startValue + (endValue - startValue) * progress);
    element.textContent = currentValue + '%';

    if (progress < 1) {
      requestAnimationFrame(animateFrame);
    }
  }

  requestAnimationFrame(animateFrame);
}

// ───────────────────────────────────────────────────────────────────
// CONFETTI EFFECT (optional celebration)
// ───────────────────────────────────────────────────────────────────

export function triggerConfetti(targetElement) {
  if (prefersReducedMotion()) return;

  var colors = ['#34d399', '#818cf8', '#f59e0b', '#ef4444', '#ec4899'];
  var confettiPieces = 30;

  for (var i = 0; i < confettiPieces; i++) {
    var confetti = document.createElement('div');
    var color = colors[Math.floor(Math.random() * colors.length)];
    var startX = Math.random() * window.innerWidth;
    var startY = targetElement ? targetElement.offsetTop : 0;

    confetti.style.position = 'fixed';
    confetti.style.left = startX + 'px';
    confetti.style.top = startY + 'px';
    confetti.style.width = '8px';
    confetti.style.height = '8px';
    confetti.style.background = color;
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.animation = 'confetti 2s ease-out forwards';
    confetti.style.animationDelay = i * 50 + 'ms';

    document.body.appendChild(confetti);

    setTimeout(function() {
      confetti.remove();
    }, 2000 + i * 50);
  }
}

// ───────────────────────────────────────────────────────────────────
// PROGRESS BAR ANIMATION
// ───────────────────────────────────────────────────────────────────

export function animateProgressBar(elementRef, fromValue, toValue, duration = 800) {
  if (!elementRef || !elementRef.current) return;

  var element = elementRef.current;
  var startTime = null;

  function animateFrame(currentTime) {
    if (!startTime) startTime = currentTime;
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);

    var currentValue = fromValue + (toValue - fromValue) * progress;
    element.style.width = currentValue + '%';

    if (progress < 1) {
      requestAnimationFrame(animateFrame);
    }
  }

  requestAnimationFrame(animateFrame);
}

// ───────────────────────────────────────────────────────────────────
// DELAYED RENDER (stagger child elements)
// ───────────────────────────────────────────────────────────────────

export function useStaggeredRender(itemCount, delayBetween = 50) {
  var visibleIndices = {};

  for (var i = 0; i < itemCount; i++) {
    visibleIndices[i] = true;
  }

  return visibleIndices;
}

// ───────────────────────────────────────────────────────────────────
// HOVER SCALE EFFECT
// ───────────────────────────────────────────────────────────────────

export function getHoverScaleStyle(scale = 1.05) {
  return {
    transition: 'transform 150ms ease-in-out',
    cursor: 'pointer',
  };
}

export function getHoverScaleOnHover() {
  return {
    onMouseEnter: function(e) {
      e.currentTarget.style.transform = 'scale(1.05)';
    },
    onMouseLeave: function(e) {
      e.currentTarget.style.transform = 'scale(1)';
    },
  };
}

// ───────────────────────────────────────────────────────────────────
// LOADING SPINNER
// ───────────────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 40, color = '#818cf8' }) {
  return {
    style: {
      width: size + 'px',
      height: size + 'px',
      border: '4px solid rgba(255,255,255,0.1)',
      borderTop: '4px solid ' + color,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };
}

// ───────────────────────────────────────────────────────────────────
// FOCUS ANIMATION (for accessibility)
// ───────────────────────────────────────────────────────────────────

export function getFocusAnimationStyle() {
  return {
    transition: 'box-shadow 150ms ease-in-out, outline 150ms ease-in-out',
  };
}

// ───────────────────────────────────────────────────────────────────
// SHAKE ANIMATION (for errors)
// ───────────────────────────────────────────────────────────────────

export function triggerShake(elementRef) {
  if (!elementRef || !elementRef.current) return;

  elementRef.current.style.animation = 'shake 400ms ease-in-out';

  setTimeout(function() {
    elementRef.current.style.animation = '';
  }, 400);
}

// ───────────────────────────────────────────────────────────────────
// TIMING PRESETS
// ───────────────────────────────────────────────────────────────────

export const timings = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
};

export const easings = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

export default {
  getAnimatedStyle,
  getTransitionStyle,
  createRipple,
  showCorrectFeedback,
  showErrorFeedback,
  showToast,
  animateScoreCounter,
  triggerConfetti,
  animateProgressBar,
  triggerShake,
  timings,
  easings,
};
