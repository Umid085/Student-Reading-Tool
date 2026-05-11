# Security Recommendations: Safe Implementation Path

**Date:** May 9, 2026  
**Audience:** Engineering Team  
**Status:** Ready to Implement (Phase 0 Security Foundation)

---

## Overview

This document provides a **safe implementation path** for the Adaptive Difficulty feature. It reorders the feature phases from the original ADAPTIVE_IMPLEMENTATION.md to add critical security validations upfront.

**New Phase 0 (Weeks 1–2)** focuses on backend infrastructure; Phases 1–4 follow with reduced risk.

---

## Phase 0: Security Foundation (CRITICAL - Weeks 1–2)

### P0.1: Implement Backend Quiz Validation Function

**File:** `netlify/functions/validateQuiz.js` (NEW)

**Purpose:** Prevent score spoofing by validating quiz answers server-side

```javascript
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();
const MAX_QUIZ_PER_HOUR = 15; // Rate limit
const QUIZ_TIMEOUT_MS = 30000; // 30 sec max

async function validateQuizAnswers(userId, level, answers, storyId) {
  // 1. Rate limit check
  const rateLimitKey = `rq-quiz-rate-${userId}`;
  const rateData = await fetchAdaptiveData(rateLimitKey);
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  const recentAttempts = (rateData || [])
    .filter(timestamp => timestamp > oneHourAgo)
    .length;
  
  if (recentAttempts >= MAX_QUIZ_PER_HOUR) {
    return {
      valid: false,
      error: "Too many quizzes. Try again after 1 hour.",
      statusCode: 429
    };
  }

  // 2. Retrieve or regenerate story
  let passage, questions;
  
  if (storyId) {
    // Option A: Use cached story from STORY_LIBRARY
    const cached = getStoryFromLibrary(storyId);
    if (cached) {
      passage = cached.passage;
      questions = cached.questions;
    }
  }
  
  if (!passage) {
    // Option B: Regenerate story server-side for validation
    try {
      const generateResult = await generatePassageAndQuestions(level);
      passage = generateResult.passage;
      questions = generateResult.questions;
    } catch (err) {
      return {
        valid: false,
        error: "Story generation failed. Try again.",
        statusCode: 503
      };
    }
  }

  // 3. Score answers server-side
  let totalEarned = 0, totalMax = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAnswer = answers[i];
    const points = scoreQuestionServer(q, userAnswer);
    const maxPoints = getMaxPoints(q);
    
    totalEarned += points;
    totalMax += maxPoints;
  }

  const pct = totalMax > 0 
    ? Math.round((totalEarned / totalMax) * 100) 
    : 0;

  // 4. Generate signed score certificate
  const scorePayload = {
    userId,
    level,
    pct,
    totalEarned,
    totalMax,
    timestamp: Date.now(),
    storyId: storyId || "regenerated"
  };

  const signature = createHmac("sha256", process.env.SESSION_SECRET || "")
    .update(JSON.stringify(scorePayload))
    .digest("hex");

  // 5. Record quiz attempt for rate limit
  const updated = [...(rateData || []), now]
    .filter(t => t > oneHourAgo);
  
  await saveAdaptiveData(rateLimitKey, updated).catch(() => {});

  return {
    valid: true,
    score: {
      pct,
      totalEarned,
      totalMax,
      timestamp: scorePayload.timestamp
    },
    certificate: {
      payload: scorePayload,
      signature
    }
  };
}

// Helper: Score a question server-side (mirror of client scoreQuestion())
function scoreQuestionServer(q, ans) {
  if (["mcq", "gap_word", "gap_sentence", "tfnm", "ynng"].includes(q.type)) {
    return ans === q.answer ? (Q_XP[q.type] || 1) : 0;
  }
  if (q.type === "matching") {
    let s = 0;
    for (let i = 0; i < q.correctPairs.length; i++) {
      if (ans && ans[i] === q.correctPairs[i]) s++;
    }
    return s;
  }
  if (q.type === "heading") {
    let h = 0;
    for (let j = 0; j < q.correctMap.length; j++) {
      if (ans && ans[j] === q.correctMap[j]) h++;
    }
    return h;
  }
  if (q.type === "qa") {
    if (!ans || ans.trim().length < 3) return 0;
    const lo = ans.toLowerCase();
    let hits = 0;
    for (let k = 0; k < q.keywords.length; k++) {
      if (lo.includes(q.keywords[k].toLowerCase())) hits++;
    }
    return hits >= Math.ceil(q.keywords.length / 2) ? (Q_XP.qa || 2) : 0;
  }
  return 0;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const { userId, level, answers, storyId } = JSON.parse(event.body || {});
    
    if (!userId || !level || !answers) {
      return { statusCode: 400, headers: CORS, 
        body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const result = await validateQuizAnswers(userId, level, answers, storyId);
    
    if (!result.valid) {
      return { statusCode: result.statusCode || 400, headers: CORS,
        body: JSON.stringify({ error: result.error }) };
    }

    return { statusCode: 200, headers: CORS,
      body: JSON.stringify(result.certificate) };
  } catch (err) {
    return { statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: err.message }) };
  }
};
```

**Integration into `doFinish()`:**

```javascript
// In doFinish(), BEFORE saveUsers():

// Step 1: Compute score client-side (for UX)
var totalEarned = 0, totalMax = 0, ...;
// ... existing score calculation ...
var pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

// Step 2: Validate server-side
let validatedScore = null;
try {
  const validationResp = await fetch('/.netlify/functions/validateQuiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.name,
      level: lvObj.key,
      answers: userAnswers, // Client's answers array
      storyId: currentStoryId
    })
  });

  if (validationResp.ok) {
    const cert = await validationResp.json();
    validatedScore = cert.payload.pct; // Use server score, not client
    var pct = validatedScore;  // ← OVERRIDE client pct
    console.log("Score validated by server:", pct);
  } else if (validationResp.status === 429) {
    setError("Too many quizzes. Please wait 1 hour.");
    return;
  } else {
    console.warn("Validation failed, using client score (offline fallback)");
    // Offline fallback: use client score, but flag for audit
  }
} catch (err) {
  console.warn("Validation network error:", err);
  // Offline: proceed with client score, will be marked "unvalidated"
}

// Step 3: Continue with rest of doFinish() using validated score
var gameEntry = { 
  level: lvObj.key, 
  pct: pct,  // Now server-validated
  validated: validatedScore !== null, // Flag for audit
  ...
};

// ... saveUsers, saveBoards, etc. ...
```

**Tests:** `tests/validateQuiz.test.js`

```javascript
import { validateQuizAnswers } from '../netlify/functions/validateQuiz.js';

describe('Quiz Validation', () => {
  test('correctly scores multiple choice', async () => {
    const answers = [2, 1, 3]; // Correct answers
    const result = await validateQuizAnswers('alice', 'A1', answers, 'a1_1');
    expect(result.valid).toBe(true);
    expect(result.score.pct).toBe(100);
  });

  test('rate limits after 15 quizzes per hour', async () => {
    for (let i = 0; i < 15; i++) {
      await validateQuizAnswers('bob', 'A1', [0, 0, 0], 'a1_1');
    }
    const result = await validateQuizAnswers('bob', 'A1', [0, 0, 0], 'a1_1');
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(429);
  });

  test('detects wrong answers', async () => {
    const answers = [0, 0, 0]; // All wrong for A1_1
    const result = await validateQuizAnswers('charlie', 'A1', answers, 'a1_1');
    expect(result.valid).toBe(true);
    expect(result.score.pct).toBeLessThan(50);
  });
});
```

---

### P0.2: Implement Encryption Layer for Firebase Storage

**File:** `src/crypto.js` (NEW)

```javascript
// AES-256-GCM encryption for sensitive data
// Uses libsodium (easier than Web Crypto API)

async function deriveKey(password, userId) {
  // Derive 32-byte key from password + userId (deterministic)
  // So same user gets same key on every login
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(userId);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  return new Uint8Array(derivedBits);
}

async function encryptAES256(plaintext, key) {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  // Generate random 12-byte IV for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    plaintextBytes
  );

  // Return IV + ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined)); // Base64 encode
}

async function decryptAES256(ciphertext, key) {
  // Decode from base64
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    cipher
  );

  return new TextDecoder().decode(plaintext);
}

export { deriveKey, encryptAES256, decryptAES256 };
```

**Integration into Adaptive Engine:**

```javascript
// In src/adaptiveEngine.js:

import { encryptAES256, decryptAES256, deriveKey } from './crypto.js';

async function saveAdaptiveDataAsync(userId, data, password) {
  try {
    // Derive encryption key from password
    const key = await deriveKey(password, userId);
    
    // Encrypt adaptive data
    const plaintext = JSON.stringify(data);
    const encrypted = await encryptAES256(plaintext, key);

    // Save to localStorage (encrypted)
    localStorage.setItem('rq-adaptive-v1-' + userId, encrypted);

    // Fire-and-forget Firebase write
    fetch('/.netlify/functions/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'rq-adaptive-v1-' + userId,
        value: encrypted,  // Store encrypted in Firebase too
        encrypted: true
      })
    }).catch(err => console.log("Firebase write failed:", err));
  } catch (err) {
    console.error("Error saving adaptive data:", err);
  }
}

async function fetchAdaptiveDataSafe(userId, password) {
  try {
    const key = await deriveKey(password, userId);
    
    // Try Firebase first
    const resp = await fetch('/.netlify/functions/storage?key=' + 
      encodeURIComponent('rq-adaptive-v1-' + userId));
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.value) {
        // Decrypt
        const plaintext = await decryptAES256(data.value, key);
        return JSON.parse(plaintext);
      }
    }
  } catch (e) {
    console.log("Firebase fetch failed, falling back to localStorage");
  }

  // Fallback to localStorage
  try {
    const key = await deriveKey(password, userId);
    const cached = localStorage.getItem('rq-adaptive-v1-' + userId);
    if (cached) {
      const plaintext = await decryptAES256(cached, key);
      return JSON.parse(plaintext);
    }
  } catch (e) {
    console.error("Failed to decrypt cached adaptive data:", e);
  }

  return null;
}

export { saveAdaptiveDataAsync, fetchAdaptiveDataSafe };
```

**Test:** `tests/crypto.test.js`

```javascript
import { deriveKey, encryptAES256, decryptAES256 } from '../src/crypto.js';

describe('Encryption', () => {
  test('encrypt and decrypt round-trip', async () => {
    const key = await deriveKey('password123', 'alice');
    const plaintext = JSON.stringify({ level: 'A2', score: 0.85 });
    
    const encrypted = await encryptAES256(plaintext, key);
    const decrypted = await decryptAES256(encrypted, key);
    
    expect(decrypted).toBe(plaintext);
  });

  test('different passwords produce different keys', async () => {
    const key1 = await deriveKey('pass1', 'alice');
    const key2 = await deriveKey('pass2', 'alice');
    
    expect(new Uint8Array(key1)).not.toEqual(new Uint8Array(key2));
  });

  test('corrupted ciphertext fails gracefully', async () => {
    const key = await deriveKey('password', 'alice');
    
    expect(async () => {
      await decryptAES256('invalid-base64-!!!', key);
    }).rejects.toThrow();
  });
});
```

---

### P0.3: Update Firebase Rules for Data Protection

**File:** `database.rules.json` (MODIFY)

```json
{
  "rules": {
    "rq": {
      "rq-auth-v6": {
        ".read": false,
        ".write": false
      },
      "rq-adapted-v1-$userId": {
        ".read": "auth.uid === $userId || root.child('admins').child(auth.uid).exists()",
        ".write": "auth.uid === $userId || root.child('admins').child(auth.uid).exists()",
        "encrypted": { ".validate": true }
      },
      "rq-quiz-rate-$userId": {
        ".read": "auth.uid === $userId",
        ".write": "auth.uid === $userId"
      },
      "rq-boards-v6": {
        ".read": true,
        ".write": false
      },
      "rq-users-v6": {
        ".read": true,
        ".write": false
      },
      "rq-$key": {
        ".read": true,
        ".write": false
      }
    },
    "rl": {
      ".read": false,
      ".write": false
    }
  }
}
```

---

### P0.4: Add Privacy Policy Updates

**File:** Update `README.md` or create `PRIVACY.md`

```markdown
# Privacy Policy - Adaptive Difficulty Feature

## Data Collection

We collect the following to personalize your learning:
- Quiz scores and answers
- Vocabulary mastery (words marked "known")
- Reading speed (WPM measurement)
- Level progression history

## Data Protection

- All learning data is encrypted at rest (AES-256-GCM)
- Encrypted in transit (HTTPS)
- Never shared with third parties
- Accessible only by you and app administrators

## Your Rights

**EU (GDPR):**
- Right to access your data: Contact support
- Right to deletion: Will delete all adaptive records
- Right to portability: Download your data as JSON

**US (FERPA):**
- Your learning records are protected
- Teachers cannot access your full profile without consent
- Annual notice of privacy practices available

**California (CCPA):**
- Right to opt-out of adaptive recommendations
- We do not sell learning data

## Data Retention

- Adaptive data stored for 2 years
- After account deletion: permanently removed
- Backup retention: 30 days
```

---

## Phase 1: Safe Integration (Original + Validation)

**Timeline:** Week 3

**Files Modified:**
- `src/student-reading-quest.jsx` — Modify doFinish() to use validateQuiz
- `src/adaptiveEngine.js` — Add encryption (from P0.2)
- `src/adaptiveUtils.js` — No changes

**Checklist:**
- [ ] doFinish() calls validateQuiz before saving
- [ ] Offline fallback works (client score used if validate fails)
- [ ] Encryption round-trip tested
- [ ] Rate limit triggered at 15 quizzes/hour
- [ ] Level recommendations still appear after 2 valid quizzes

---

## Phase 2–4: UI & Analytics (Unchanged)

Continue with original ADAPTIVE_IMPLEMENTATION.md Phases 2–4, but now with:
- ✅ Server-validated quiz scores
- ✅ Encrypted adaptive data
- ✅ Rate limiting in place
- ✅ Privacy-compliant storage

---

## Implementation Checklist

### Before Code
- [ ] Review SECURITY_ASSESSMENT_ADAPTIVE.md with team
- [ ] Get sign-off on backend validation approach
- [ ] Confirm Firebase Blaze plan (free tier allows Realtime DB)
- [ ] Assign security review (code + architecture)

### Phase 0 (Weeks 1–2)
- [ ] Implement validateQuiz.js function
- [ ] Add encryption library (crypto.js)
- [ ] Update Firebase rules (database.rules.json)
- [ ] Update privacy policy

### Phase 0 Testing
- [ ] Unit tests: validateQuiz.test.js passes
- [ ] Unit tests: crypto.test.js passes
- [ ] Integration test: doFinish() → validateQuiz → adaptiveEngine flow
- [ ] Manual test: Attempt score spoofing (should fail)
- [ ] Manual test: Offline quiz (uses client score, marked unvalidated)

### Phase 1 (Week 3)
- [ ] Wire validateQuiz into doFinish()
- [ ] Test with 5 users: full quiz → result → recommendation flow
- [ ] Verify encrypted localStorage works
- [ ] Check Firebase read rules enforced (non-owner can't read adaptive data)

### Staging (Week 4)
- [ ] Deploy to staging environment
- [ ] 10-user beta test: complete 2+ quizzes each
- [ ] Monitor Firefox, Chrome, Safari encryption
- [ ] Check API latencies (validateQuiz should <1s)
- [ ] Simulate offline: app should work with cached data

### Pre-Launch
- [ ] Security audit pass (third-party or internal)
- [ ] GDPR compliance sign-off
- [ ] Monitoring + alerting set up:
  - Rate limit hits (alert if >10 per user/day)
  - Validation failures (alert if >5%)
  - Encryption errors (alert immediately)
- [ ] Rollback plan tested

### Launch
- [ ] Feature flag enabled (gradual rollout: 10% → 50% → 100%)
- [ ] Customer notification: "Adaptive feature now available with privacy protections"
- [ ] Support training: How to explain to customers

---

## Success Criteria

| Criterion | Acceptable | Target |
|-----------|-----------|--------|
| **Validation latency** | <2s | <500ms |
| **Encryption CPU** | <5% | <1% |
| **API error rate** | <1% | <0.1% |
| **Security findings** | 0 critical | 0 all |
| **Privacy compliance** | GDPR only | GDPR + FERPA + CCPA |
| **User adoption** | >50% enable | >80% enable |
| **False positives** (rate limit) | <5% | <1% |

---

## Questions for Product/Legal

1. **Age of users?** (Affects COPPA compliance if <13)
2. **Geographic coverage?** (EU = GDPR mandatory)
3. **School integrations?** (School = FERPA / COPPA requirements)
4. **Data sharing with teachers?** (Affects privacy policy)
5. **Monetization plans?** (Affects CCPA "do not sell")
6. **Incident response plan?** (Do we have <24hr breach notification?)

---

## Estimated Timeline & Cost

| Phase | Duration | Engineering Hours | Cloud Cost |
|-------|----------|-------------------|-----------|
| Phase 0 (Security) | 2 weeks | 40 | $200 (extra API calls) |
| Phase 1 (Integration) | 1 week | 20 | $50 |
| Phase 2–4 (UI) | 2 weeks | 30 | $50 |
| Testing + Launch | 1 week | 20 | $100 |
| **TOTAL** | **6 weeks** | **110** | **$400** |

---

## Rollback Plan

If security issues discovered during beta:

1. **Stop feature flag** (disable for new users)
2. **Keep existing data** (don't delete encrypted records)
3. **Revert to Phase 1** (remove UI, keep backend)
4. **Audit logs** (review who accessed what)
5. **Customer communication** (transparency on issue + fix)

**Estimated time:** <2 hours

---

## Final Recommendation

**✅ Proceed with Phase 0 Security Foundation BEFORE implementing original Phases 1–4**

This adds 2 weeks but eliminates the 3 CRITICAL vulnerabilities identified in SECURITY_ASSESSMENT_ADAPTIVE.md.

**Risk of skipping Phase 0:** Potential GDPR fines + customer trust damage.

**Approval needed from:**
- [ ] Engineering Lead
- [ ] Product Manager
- [ ] Legal/Compliance
- [ ] Security Architect

---

**Prepared by:** Security Team  
**Date:** May 9, 2026  
**Status:** Ready for stakeholder review
