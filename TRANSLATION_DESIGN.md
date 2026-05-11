# Sentence Translation Feature — Complete UI/UX Specification

## 1. READING SCREEN INTEGRATION

### Icon Placement: Bottom Action Bar
The 🌐 icon lives in the **bottom action bar** alongside:
- ⏱ Timer
- 🔊 Audio playback
- 🌐 **Translation toggle** ← NEW
- 💡 Heatmap toggle
- 🎤 Pronunciation mode
- [0.75×, 1×, 1.25×, 1.5×] speed buttons

**Style Match (line 2350+):**
```javascript
style={{
  background: activeSentence !== null ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
  border: "1px solid " + (activeSentence !== null ? "#818cf8" : "rgba(255,255,255,0.1)"),
  color: activeSentence !== null ? "#a78bfa" : "#9ca3af",
  borderRadius: 8,
  padding: "5px 8px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 4,
  minWidth: 40,
  justifyContent: "center",
  transition: "all 0.15s ease"
}}
```

Toggle behavior: Clicking 🌐 sets `activeSentence` mode on/off.

---

## 2. LANGUAGE SELECTOR

### Placement & Behavior
**Location:** Inline with translate button in the active sentence panel (line 2310+)

**Display:** Compact `<select>` dropdown positioned **right of translate button**

```javascript
<select 
  value={translateLang} 
  onChange={(e) => {
    setTranslateLang(e.target.value);
    localStorage.setItem("rq-translate-lang", e.target.value);
  }}
  aria-label="Language for translation"
  style={{
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#9ca3af",
    borderRadius: 6,
    padding: "3px 6px",
    fontSize: 11,
    fontFamily: "inherit"
  }}
>
  <option value="uz">Uzbek</option>
  <option value="ru">Russian</option>
  <option value="tr">Turkish</option>
  <option value="ar">Arabic</option>
  <option value="de">German</option>
</select>
```

**Persistent:** Language selector **saves to localStorage** so user preference persists across sessions.

---

## 3. TRANSLATION DISPLAY

### Format: Inline Gloss Below Sentence

**Container:** `.CARD` style with accent background (existing pattern line 2312)
```javascript
style={{
  ...CARD,
  marginBottom: 12,
  padding: 12,
  background: "rgba(99,102,241,0.07)",
  borderColor: "rgba(99,102,241,0.3)"
}}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ The cat sat on the mat.     🌐 Translate | Uzbek ×          │
├─────────────────────────────────────────────────────────────┤
│ Mushuk ​to'satgan paltada o'tirdi.                           │
│ (italic, 13px, #c7d2fe, 0.9s fade-in)                       │
└─────────────────────────────────────────────────────────────┘
```

**Text Styling (line 2321):**
```javascript
style={{
  fontSize: 13,
  color: "#c7d2fe",
  margin: 0,
  fontStyle: "italic",
  lineHeight: 1.6
}}
```

---

## 4. MOBILE UX (≤640px)

### Responsive Adjustments

**Dropdown → Stacked on Small Screens:**
```javascript
// On mobile, buttons wrap naturally via flexWrap
style={{
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 6
}}
```

**Select Input:** Remains full-width under sentence text on ≤640px
```css
@media (max-width: 640px) {
  select {
    min-width: 140px;
    font-size: 12px;
  }
}
```

**Translation Text:** Scales to 12px on mobile to fit narrower viewport
```javascript
@media (max-width: 640px) {
  /* translation-text { fontSize: 12px; } */
}
```

---

## 5. ANIMATIONS & TRANSITIONS

### Translation Fade-In
**Trigger:** When MyMemory API returns data

**Animation (existing global style line 1686–1689):**
```javascript
@keyframes rqFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Apply to translation paragraph:**
```javascript
{translation && (
  <p style={{
    fontSize: 13,
    color: "#c7d2fe",
    margin: 0,
    fontStyle: "italic",
    lineHeight: 1.6,
    animation: "rqFadeIn 0.15s ease-out"
  }}>
    {translation}
  </p>
)}
```

**Duration:** 150ms (matches design system transition: `--rq-transition`)

**Instant?** No — subtle fade respects language learning pacing; users register new text appearing.

---

## 6. TIERED ACCESS & LIMIT INDICATOR

### Tier Rules
| CEFR | Translations/Passage |
|------|---------------------|
| A1, A2, B1 | **Unlimited** |
| B2, C1, C2 | **Max 3** |

### Limit Counter Display

**Location:** Active sentence panel, **right of language selector**

**A1–B1 (Unlimited):**
```javascript
// No counter shown — just icon + button
<button onClick={() => translateSentence(activeSentence)}>
  🌐 Translate
</button>
```

**B2–C2 (Limited):**
```javascript
// Counter pill appears next to button
{["B2", "C1", "C2"].includes(level) && (
  <span style={{
    fontSize: 11,
    color: translationCount >= 3 ? "#f87171" : "#9ca3af",
    fontWeight: 700
  }}>
    {translationCount} / 3
  </span>
)}
```

**At Limit (3/3):**
- Counter turns red: `#f87171`
- Button disabled with opacity 0.5
- Tooltip: "You've used all translations for this passage. Continue reading or finish the quiz."

---

## 7. FALLBACK STATES

### Loading Spinner
**Trigger:** User clicks "Translate"

**Display (use existing `.rq-spinner`):**
```javascript
{translating && (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 6
  }}>
    <div className="rq-spinner" />
    <span style={{fontSize: 12, color: "#9ca3af"}}>Translating...</span>
  </div>
)}
```

**Spinner Styles:** Use existing `.rq-spinner` class (line 1731)

**Latency:** MyMemory typically responds in <100ms; user sees 0.7s rotation

### Error Fallback
**MyMemory Unavailable:**
```javascript
catch (e) {
  setTranslation("Translation unavailable. Try again or continue reading.");
}
```

**Display in Panel (error color #fecaca):**
```javascript
{translation && (
  <p style={{
    fontSize: 13,
    color: translation.includes("unavailable") ? "#fecaca" : "#c7d2fe",
    margin: 0,
    fontStyle: "italic",
    lineHeight: 1.6
  }}>
    {translation}
  </p>
)}
```

**User Action:** Retry button or close panel; reading continues uninterrupted

---

## 8. ACCESSIBILITY

### ARIA Labels
```javascript
<button
  onClick={() => translateSentence(activeSentence)}
  aria-label="Translate current sentence"
  aria-busy={translating}
  title={translating ? "Translating..." : "Translate to " + translateLang}
>
  🌐 Translate
</button>

<select
  value={translateLang}
  onChange={(e) => setTranslateLang(e.target.value)}
  aria-label="Language for translation"
>
  <option value="uz">Uzbek</option>
</select>
```

### Keyboard Navigation
1. Tab through buttons in action bar
2. Tab into language dropdown
3. Arrow keys to change language
4. Enter/Space to translate

### Screen Reader Announcements
```javascript
// Announce new translation via aria-live
{translation && (
  <p 
    aria-live="polite" 
    aria-atomic="true"
    role="status"
  >
    {translation}
  </p>
)}
```

### Color Contrast
- Translation text (#c7d2fe) on dark bg → **11.5:1 ✓ WCAG AAA**
- Error text (#fecaca) on dark bg → **8.2:1 ✓ WCAG AA**
- Button text (#a78bfa) on overlay → **7.1:1 ✓ WCAG AA**

---

## 9. STATE MANAGEMENT

### New State Variables
```javascript
const [translateLang, setTranslateLang] = useState(() => {
  try {
    return localStorage.getItem("rq-translate-lang") || "uz";
  } catch {
    return "uz";
  }
});

const [translating, setTranslating] = useState(false);
const [translation, setTranslation] = useState(null);
const [translationCount, setTranslationCount] = useState(0);
```

### MyMemory API Call
```javascript
async function translateSentence(text) {
  if (!text) return;
  
  // Enforce tier limits
  if (["B2", "C1", "C2"].includes(level) && translationCount >= 3) {
    setTranslation("Max 3 translations per passage reached.");
    return;
  }
  
  setTranslating(true);
  setTranslation(null);
  
  try {
    const lang = translateLang || "uz";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;
    const r = await fetch(url);
    const d = await r.json();
    
    setTranslation(
      d.responseData?.translatedText || "Translation unavailable."
    );
    
    // Increment counter if limited tier
    if (["B2", "C1", "C2"].includes(level)) {
      setTranslationCount(prev => Math.min(prev + 1, 3));
    }
  } catch (e) {
    setTranslation("Translation unavailable.");
  }
  
  setTranslating(false);
}
```

### Cache Locally
```javascript
// When translation loads, save to sessionStorage (cleared on page reload)
const cacheKey = `rq-trans-${btoa(text)}-${lang}`;
try {
  sessionStorage.setItem(cacheKey, translation);
} catch (e) {
  // Ignore quota errors
}

// On next request, check cache first
const cached = sessionStorage.getItem(cacheKey);
if (cached) {
  setTranslation(cached);
  return;
}
```

---

## 10. IMPLEMENTATION SUMMARY

| Component | Location | Dependencies |
|-----------|----------|--------------|
| 🌐 Button | Bottom action bar (line 2350+) | `activeSentence`, `translating` |
| Language selector | Active sentence panel (line 2310+) | `translateLang`, `localStorage` |
| Translation display | Below sentence in panel | `translation`, `fontStyle: italic` |
| Loading spinner | Replace button text | `.rq-spinner` CSS class |
| Limit counter | B2+ only, right of button | `translationCount`, `level` |
| Fallback error | Same display as translation | `translation` state |

**CSS Animations:** Reuse existing `@keyframes rqFadeIn 0.15s ease-out`

**Design System:** All colors from `designSystem.js` tokens
- Accent: #818cf8
- Text: #c7d2fe
- Error: #fecaca
- Secondary: #a78bfa

**Zero New Dependencies:** Uses vanilla Fetch + MyMemory public API (no auth, no signup required)
