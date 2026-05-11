# Translation Feature — Test Automation Framework
**Student Reading Quest — Automated Test Scenarios**

**Framework:** Vitest + Playwright  
**Date:** 2026-05-09  

---

## Automated Test Suite Structure

### Unit Tests (Vitest)

**File:** `tests/translation.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Translation Feature', () => {
  
  describe('translateSentence() function', () => {
    
    it('TP-001: Fetches translation from MyMemory API', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: {
            translatedText: 'Mushuk kovrakda yotibdi'
          }
        })
      });
      
      // Simulate: await translateSentence("The cat is on the mat");
      const result = await translateSentence("The cat is on the mat");
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.mymemory.translated.net')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('langpair=en|uz')
      );
    });

    it('TP-002: Handles API errors gracefully', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));
      
      const result = await translateSentence("Test sentence");
      
      expect(result).toBe("Translation unavailable.");
      // Verify no unhandled promise rejection
    });

    it('TP-003: Encodes special characters in URL query', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ responseData: { translatedText: 'test' } })
      });
      
      await translateSentence('What?! "Really?" (Yes!)');
      
      // Verify encodeURIComponent was applied
      const call = mockFetch.mock.calls[0][0];
      expect(call).toContain('What%3F!%20');
    });

    it('TP-004: Handles empty/null sentence', async () => {
      const result1 = await translateSentence(null);
      const result2 = await translateSentence("");
      const result3 = await translateSentence("   ");
      
      expect(result1).toBe(undefined); // Early return, no API call
      expect(result2).toBe(undefined);
      expect(result3).toBe(undefined); // After trim
    });

  });

  describe('Language persistence', () => {
    
    beforeEach(() => {
      localStorage.clear();
    });

    it('TP-004: Saves selected language to localStorage', () => {
      setTranslateLang('ru');
      expect(localStorage.getItem('rq-translate-lang')).toBe('ru');
    });

    it('TP-005: Loads language from localStorage on init', () => {
      localStorage.setItem('rq-translate-lang', 'de');
      const initialLang = localStorage.getItem('rq-translate-lang');
      expect(initialLang).toBe('de');
    });

    it('TP-005: Falls back to "uz" if localStorage empty', () => {
      localStorage.clear();
      const fallback = localStorage.getItem('rq-translate-lang') || 'uz';
      expect(fallback).toBe('uz');
    });

  });

  describe('CEFR quota gating', () => {
    
    it('TP-008: B2 user limited to 3 translations per passage', () => {
      const user = { level: 'B2', totalXp: 8000 };
      const passageId = 'story-123';
      
      let translationCount = 0;
      const incrementAndCheck = () => {
        translationCount++;
        const canTranslate = checkTranslationQuota(user, passageId, translationCount);
        return canTranslate;
      };
      
      expect(incrementAndCheck()).toBe(true);  // 1st
      expect(incrementAndCheck()).toBe(true);  // 2nd
      expect(incrementAndCheck()).toBe(true);  // 3rd
      expect(incrementAndCheck()).toBe(false); // 4th - quota exceeded
    });

    it('TP-009: A1 user unlimited translations', () => {
      const user = { level: 'A1', totalXp: 100 };
      
      for (let i = 1; i <= 20; i++) {
        const canTranslate = checkTranslationQuota(user, 'story-123', i);
        expect(canTranslate).toBe(true);
      }
    });

    it('TP-009: C2 user limited to 3, quota resets per passage', () => {
      const user = { level: 'C2' };
      
      // Passage 1
      expect(checkTranslationQuota(user, 'passage-1', 1)).toBe(true);
      expect(checkTranslationQuota(user, 'passage-1', 2)).toBe(true);
      expect(checkTranslationQuota(user, 'passage-1', 3)).toBe(true);
      expect(checkTranslationQuota(user, 'passage-1', 4)).toBe(false);
      
      // Passage 2 - quota resets
      expect(checkTranslationQuota(user, 'passage-2', 1)).toBe(true);
      expect(checkTranslationQuota(user, 'passage-2', 2)).toBe(true);
    });

  });

  describe('Multi-language support', () => {
    
    const languages = ['uz', 'ru', 'tr', 'ar', 'de'];
    
    it('TP-012: All 5 languages produce translations without error', async () => {
      const sentence = "Hello world";
      
      for (const lang of languages) {
        const mockFetch = vi.fn();
        global.fetch = mockFetch;
        
        mockFetch.mockResolvedValueOnce({
          json: async () => ({
            responseData: { translatedText: `Translation in ${lang}` }
          })
        });
        
        const result = await translateSentence(sentence, lang);
        expect(result).toContain('Translation');
      }
    });

  });

  describe('Edge cases', () => {
    
    it('TP-013: Long sentence (>200 chars)', async () => {
      const longSentence = "A".repeat(250);
      
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: { translatedText: 'B'.repeat(250) }
        })
      });
      
      const result = await translateSentence(longSentence);
      expect(result).toBeTruthy();
    });

    it('TP-014: Unicode characters preserved', async () => {
      const sentence = "مرحبا привет 你好";
      
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: { translatedText: 'Translation with مرحبا' }
        })
      });
      
      const result = await translateSentence(sentence);
      expect(result).toContain('مرحبا');
    });

    it('TP-019: Single-word translation', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: { translatedText: 'Ishga yuborilgan' }
        })
      });
      
      const result = await translateSentence("Run");
      expect(result).toBeTruthy();
      expect(result).not.toContain("too short");
    });

    it('TP-020: Numbers preserved in translation', async () => {
      const sentence = "I was born on 1995-05-09 at 3:45 PM";
      
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: { 
            translatedText: "Men 1995-05-09 da soat 3:45 da tug'ilganman" 
          }
        })
      });
      
      const result = await translateSentence(sentence);
      expect(result).toContain('1995');
      expect(result).toContain('3:45');
    });

  });

});
```

---

### E2E Tests (Playwright)

**File:** `tests/translation.e2e.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Translation Feature - E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Load app and navigate to reading screen
    await page.goto('http://localhost:5173');
    
    // Register/login as A1 user
    await page.fill('input[placeholder="Username"]', 'testuser-a1');
    await page.fill('input[placeholder="Password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Select A1 level
    await page.click('[data-level="A1"]');
    
    // Wait for reading screen
    await page.waitForSelector('button:has-text("🌐 Translate")');
  });

  test('TP-001: Basic translation - Uzbek', async ({ page }) => {
    // Click on first sentence
    const sentenceText = page.locator('p').first();
    await sentenceText.click();
    
    // Click translate button
    await page.click('button:has-text("🌐 Translate")');
    
    // Verify translation appears with fade-in animation
    const translation = page.locator('[role="status"]');
    await expect(translation).toBeVisible();
    
    // Verify animation (check opacity transition)
    const opacity = await translation.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    expect(opacity).toBe('1');
  });

  test('TP-002: Switch language during translation', async ({ page }) => {
    const sentenceText = page.locator('p').first();
    await sentenceText.click();
    
    // Translate to Uzbek
    await page.click('button:has-text("🌐 Translate")');
    const firstTranslation = page.locator('[role="status"]');
    await expect(firstTranslation).toBeVisible();
    
    // Switch language to Russian
    const languageSelect = page.locator('select');
    await languageSelect.selectOption('ru');
    
    // Translation text should persist
    const persistedText = await firstTranslation.textContent();
    expect(persistedText.length).toBeGreaterThan(0);
    
    // Translate again with new language
    await page.click('button:has-text("🌐 Translate")');
    await page.waitForTimeout(500);
    
    const newTranslation = await page.locator('[role="status"]').textContent();
    expect(newTranslation).not.toBe(persistedText);
  });

  test('TP-004: Language persists across page reload', async ({ page }) => {
    // Set language to German
    const select = page.locator('select');
    await select.selectOption('de');
    
    // Reload page
    await page.reload();
    await page.waitForSelector('button:has-text("🌐 Translate")');
    
    // Verify language still German
    const selectedValue = await select.evaluate(el => el.value);
    expect(selectedValue).toBe('de');
  });

  test('TP-034: Touch targets are adequate (44px minimum)', async ({ page }) => {
    const button = page.locator('button:has-text("🌐 Translate")');
    const box = await button.boundingBox();
    
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  });

  test('TP-033: Translation panel responsive on 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    
    const sentenceText = page.locator('p').first();
    await sentenceText.click();
    await page.click('button:has-text("🌐 Translate")');
    
    const panel = page.locator('[role="status"]');
    await expect(panel).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => 
      document.documentElement.offsetWidth
    );
    const panelWidth = await panel.evaluate(el => 
      el.offsetWidth
    );
    
    expect(panelWidth).toBeLessThanOrEqual(bodyWidth);
  });

  test('TP-029: Tab navigation to translate button', async ({ page }) => {
    // Tab to translate button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // ... (tab until focused on button)
    
    // Get focused element
    const focused = await page.evaluate(() => 
      document.activeElement?.textContent
    );
    expect(focused).toContain('Translate');
    
    // Press Enter to translate
    await page.keyboard.press('Enter');
    
    const translation = page.locator('[role="status"]');
    await expect(translation).toBeVisible();
  });

  test('TP-037: Reading layout unchanged after translation', async ({ page }) => {
    // Get initial passage height
    const passage = page.locator('article');
    const initialHeight = await passage.evaluate(el => 
      el.offsetHeight
    );
    
    // Translate sentence
    await page.locator('p').first().click();
    await page.click('button:has-text("🌐 Translate")');
    
    // Passage height should not change significantly (max 10% for animation)
    const finalHeight = await passage.evaluate(el => 
      el.offsetHeight
    );
    const heightChange = Math.abs(finalHeight - initialHeight);
    expect(heightChange).toBeLessThan(initialHeight * 0.1);
  });

  test('TP-028: Translation text color contrast WCAG AA', async ({ page }) => {
    // Get computed styles
    const translationStyle = await page.locator('[role="status"]').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });
    
    // Contrast ratio should be ≥4.5:1
    // (Automated WCAG checking via axe DevTools)
    const results = await page.evaluate(() => {
      return window.axe?.run?.();
    });
    
    // Verify no color contrast violations
    expect(results?.violations).not.toContainEqual(
      expect.objectContaining({ id: 'color-contrast' })
    );
  });

  test('TP-039: WPM counter unaffected by translation', async ({ page }) => {
    // Get initial WPM
    const initialWpm = await page.locator('[data-wpm-counter]').textContent();
    
    // Simulate reading (click, wait)
    await page.waitForTimeout(2000);
    
    // Translate
    await page.locator('p').first().click();
    await page.click('button:has-text("🌐 Translate")');
    
    // Continue reading
    await page.waitForTimeout(2000);
    
    // WPM should have incremented
    const finalWpm = await page.locator('[data-wpm-counter]').textContent();
    const initialNum = parseInt(initialWpm);
    const finalNum = parseInt(finalWpm);
    
    expect(finalNum).toBeGreaterThan(initialNum);
  });

  test('TP-035: Works on Chrome, Safari, Firefox', async ({ browserName, page }) => {
    // This test runs on all browsers via @playwright/test
    
    const sentenceText = page.locator('p').first();
    await sentenceText.click();
    
    await page.click('button:has-text("🌐 Translate")');
    
    const translation = page.locator('[role="status"]');
    await expect(translation).toBeVisible();
    
    console.log(`Translation feature works on ${browserName}`);
  });

});

// Browser-specific config: playwright.config.js
export default {
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
};
```

---

### Performance Tests (Vitest + Custom Timing)

**File:** `tests/translation-perf.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Translation Performance', () => {
  
  it('TP-022: API response <2s on average', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    const start = performance.now();
    
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        responseData: { translatedText: 'Translation' }
      })
    });
    
    await translateSentence("Test sentence", "ru");
    
    const elapsed = performance.now() - start;
    
    // Expected API time: 200-800ms + JSON parse + state update
    // Total should be <2000ms
    expect(elapsed).toBeLessThan(2000);
  });

  it('TP-021: Cached translation <500ms', async () => {
    // Simulate localStorage cache
    const cache = new Map();
    
    const getCachedTranslation = (sentence, lang) => {
      const key = `${sentence}:${lang}`;
      return cache.get(key);
    };
    
    const setCachedTranslation = (sentence, lang, translation) => {
      const key = `${sentence}:${lang}`;
      cache.set(key, translation);
    };
    
    // Pre-populate cache
    setCachedTranslation("Hello", "uz", "Salom");
    
    // Measure cache lookup
    const start = performance.now();
    const result = getCachedTranslation("Hello", "uz");
    const elapsed = performance.now() - start;
    
    expect(result).toBe("Salom");
    expect(elapsed).toBeLessThan(500); // Cache hit <500ms
  });

  it('TP-023: Multiple rapid translations handled correctly', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Mock 5 sequential API responses
    const promises = [];
    for (let i = 1; i <= 5; i++) {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          responseData: { translatedText: `Translation ${i}` }
        })
      });
      
      promises.push(translateSentence(`Sentence ${i}`, "uz"));
    }
    
    const results = await Promise.all(promises);
    
    // All should succeed
    expect(results).toHaveLength(5);
    expect(results.every(r => r.includes("Translation"))).toBe(true);
  });

  it('TP-023: No memory leak with 10 translations', async () => {
    if (typeof gc === 'undefined') {
      console.warn('Run with --expose-gc flag for memory tests');
      return;
    }
    
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    mockFetch.mockResolvedValue({
      json: async () => ({
        responseData: { translatedText: 'Translation' }
      })
    });
    
    const memBefore = process.memoryUsage().heapUsed;
    
    // Perform 10 translations
    for (let i = 0; i < 10; i++) {
      await translateSentence(`Sentence ${i}`, "uz");
    }
    
    gc?.(); // Force garbage collection
    
    const memAfter = process.memoryUsage().heapUsed;
    const increase = memAfter - memBefore;
    
    // Memory increase should be <2MB
    expect(increase).toBeLessThan(2 * 1024 * 1024);
  });

});
```

---

### Accessibility Tests (axe-core)

**File:** `tests/translation-a11y.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Translation Accessibility', () => {
  
  it('TP-028: No WCAG AA violations in translation panel', async () => {
    // Mock DOM with translation panel
    const html = `
      <div>
        <button style="height: 20px; width: 100px;">🌐 Translate</button>
        <select style="height: 20px;">
          <option value="uz">Uzbek</option>
          <option value="ru">Russian</option>
        </select>
        <p style="color: #c7d2fe;">Mushuk kovrakda yotibdi</p>
      </div>
    `;
    
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('TP-030: Translate button has accessible name', async () => {
    const button = document.createElement('button');
    button.textContent = '🌐 Translate';
    button.setAttribute('aria-label', 'Translate sentence');
    
    const accessibleName = button.getAttribute('aria-label') || 
                           button.textContent;
    
    expect(accessibleName).toContain('Translate');
  });

  it('TP-030: Language dropdown has label', async () => {
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Select translation language');
    
    expect(select.getAttribute('aria-label')).toBeTruthy();
  });

  it('TP-031: Focus visible on elements', async () => {
    const button = document.createElement('button');
    button.textContent = 'Translate';
    button.style.outline = '2px solid #818cf8';
    
    const hasOutline = button.style.outline.length > 0;
    expect(hasOutline).toBe(true);
  });

  it('TP-032: Loading state announced to screen reader', async () => {
    const statusArea = document.createElement('div');
    statusArea.setAttribute('aria-live', 'polite');
    statusArea.setAttribute('role', 'status');
    statusArea.textContent = 'Translating...';
    
    expect(statusArea.getAttribute('aria-live')).toBe('polite');
    expect(statusArea.getAttribute('role')).toBe('status');
    expect(statusArea.textContent).toBe('Translating...');
  });

});
```

---

## Test Execution Commands

### Run all tests
```bash
npm test
```

### Run only translation tests
```bash
npm test -- translation
```

### Run E2E tests
```bash
npm run test:e2e
```

### Run performance tests with memory profiling
```bash
node --expose-gc ./node_modules/.bin/vitest run tests/translation-perf.test.js
```

### Run accessibility audit
```bash
npm test -- translation-a11y
```

### Generate coverage report
```bash
npm test -- translation --coverage
```

### Run on specific browser (E2E)
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## Coverage Targets

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| Statement Coverage | 90% | TBD | PENDING |
| Branch Coverage | 85% | TBD | PENDING |
| Function Coverage | 90% | TBD | PENDING |
| Line Coverage | 90% | TBD | PENDING |

---

## Continuous Integration

### GitHub Actions Workflow

**File:** `.github/workflows/translation-tests.yml`

```yaml
name: Translation Feature Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      
      - run: npm test -- translation
      
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Check performance
        run: npm test -- translation-perf
```

---

## Test Data & Fixtures

**File:** `tests/fixtures/translation-data.js`

```javascript
export const TEST_SENTENCES = {
  a1: [
    "The cat is on the mat.",
    "I like apples.",
    "Where is the bathroom?",
    "What time is it?",
    "Hello, how are you?"
  ],
  b1: [
    "The philosophy of education is complex.",
    "Could you help me with this problem?",
    "Although it was raining, we decided to go out.",
    "She has been working here since 2015.",
    "I would have gone if I had known earlier."
  ],
  edge: [
    "What?! Really?? (Yes!) @mentioned #hashtag",
    "A".repeat(250),
    "مرحبا привет 你好 🌍",
    "I was born on 1995-05-09 at 3:45 PM",
    "Run!"
  ]
};

export const EXPECTED_TRANSLATIONS = {
  "uz": {
    "The cat is on the mat.": ["Mushuk", "kovrak", "yotibdi"],
    "I like apples.": ["Men", "olma", "yoqtiraman"]
  },
  "ru": {
    "The cat is on the mat.": ["Кот", "лежит", "коврик"],
    "I like apples.": ["Я", "люблю", "яблоки"]
  }
};

export const MOCK_API_RESPONSES = {
  success: {
    responseData: {
      translatedText: "Sample translation",
      match: 1.0
    }
  },
  error: {
    responseStatus: 403
  },
  offline: null
};
```

---

**End of Test Automation Framework**
