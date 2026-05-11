# 🎬 Live Team Collaboration Sessions - Ready to Run

**This document shows you exactly how to run a real team collaboration session.**

Choose a session below and follow it exactly. Copy-paste the commands and contexts.

---

## 🚀 Session 1: Feature Design Sprint (3 Hours)

**Objective:** Design the Translation Feature completely  
**Agents:** 6 (EdTech, Product, Frontend, Backend, Security, QA)  
**Output:** Complete launch-ready specification

### PHASE 1: TIER 2 VALIDATION (30 min)

**Step 1a: EdTech Specialist Validates Learning Fit**

```bash
/agent edtech-specialist "

TASK: Validate if a 'Sentence Translation' feature aligns with CEFR learning.

CONTEXT: Student Reading Tool is CEFR A1-C2. Currently includes:
- AI-generated reading passages
- 6 question types (MCQ, gap-fill, matching, etc)
- 10 advanced features (weekly board, challenges, heatmap, etc)

PROPOSED: Add 'Translate any sentence in the passage' feature.
- Tap sentence → see translation (6 languages: Uzbek, Russian, Turkish, Arabic, German, Spanish)
- Translations are accurate (via MyMemory API)
- Shows vocabulary & grammar patterns

QUESTIONS TO ANSWER:
1. Does this support CEFR learning goals or distract from reading?
2. Should we limit translations (e.g., only 3 per passage)?
3. Best placement: toggle on reading screen, or inline?
4. Does this help or hurt reading fluency development?

DELIVERABLE: Learning impact assessment + recommendation.
"
```

**Example Output You Might Get:**
```
✅ LEARNING IMPACT: Positive (with guardrails)
- Supports comprehension building (foundation for fluency)
- Reduces cognitive overload for A1-B1 learners
- Risk: Could reduce reading effort if overused

RECOMMENDATION: Build it, but add guardrails:
- Limit to 5 translations per passage
- Show word-by-word breakdown (learning opportunity)
- Hide translations for B2+ (train fluency)

BEST PLACEMENT: Inline with 🌐 icon (minimal disruption)
```

---

**Step 1b: Product Manager Validates Market Fit** (Using EdTech's output)

```bash
/agent product-manager "

CONTEXT: EdTech specialist validated that translation feature:
[PASTE EdTech's output above]

MARKET ANALYSIS NEEDED:
1. Is this competitive advantage? (Do competitors offer it?)
2. Will it increase engagement/retention?
3. Should this be free or premium feature?
4. Priority vs other features: translation vs heatmap vs recommendations?

DELIVERABLE: Market fit assessment + strategic recommendation.
"
```

**Example Output You Might Get:**
```
✅ MARKET FIT: Strong (Duolingo doesn't do this well)
- Competitors: Busuu has basic translation, Babbel shows hints
- Student demand: High (survey data: 78% want translations)
- Engagement impact: +12% session length, +8% daily return

STRATEGIC RECOMMENDATION:
- Build as FREE feature (acquisition tool)
- Launch Month 2 (after vocabulary game)
- Priority: HIGH (competitive advantage)
```

---

### PHASE 2: DESIGN PHASE (Parallel - Run these 3 simultaneously)

**Step 2a: Frontend Specialist Designs UI**

```bash
/agent frontend-specialist "

TASK: Design UI for sentence translation feature.

CONTEXT: 
- Reading screen has passages, each sentence clickable for definitions
- Adding: Tap sentence → Translation overlay
- Languages: Uzbek, Russian, Turkish, Arabic, German, Spanish
- Accessibility required (WCAG AA)
- Mobile-first, responsive

REQUIREMENTS:
1. Translation UI: Should translations be inline, modal, or panel?
2. Language selector: How do users choose language?
3. Animations: How should translation appear/disappear?
4. Mobile: How to show translation on small screens?
5. Accessibility: ARIA labels, keyboard nav, screen reader support

DELIVERABLE: Wireframes + design specifications + accessibility notes
"
```

---

**Step 2b: Backend Architect Designs API**

```bash
/agent backend-architect "

TASK: Design API for sentence translation feature.

CONTEXT:
- Currently use MyMemory API for translations
- Store user preference (default language) in Firebase
- Track which sentences students translate (analytics)
- Cache translations (same sentence, multiple users)

REQUIREMENTS:
1. API endpoint: GET /translate with sentence + language
2. Caching: How to cache translations efficiently?
3. Rate limiting: MyMemory has limits—how to manage?
4. User preference: Save default language
5. Analytics: Track translation usage patterns
6. Fallback: What if MyMemory is down?

DELIVERABLE: API spec + Firebase schema + rate limit strategy
"
```

---

**Step 2c: Accessibility Checker Reviews Designs**

```bash
/agent accessibility-checker "

TASK: WCAG AA audit for translation feature.

CONTEXT: Feature adds translation overlay on reading screen.

CHECK THESE:
1. Color contrast: Overlay text readable? (minimum 4.5:1)
2. Keyboard navigation: Can users navigate without mouse?
3. Screen reader: Can blind users access translations?
4. Language selector: Accessible dropdown or menu?
5. Focus management: Is focus trap appropriate?
6. Motor accessibility: Large touch targets? (minimum 44x44px)
7. Cognitive: Is interface simple to understand?

DELIVERABLE: Accessibility assessment + 3 critical issues + fixes
"
```

---

### PHASE 3: SECURITY & TESTING (Sequential)

**Step 3a: Security Auditor Reviews Data Handling**

```bash
/agent security-auditor "

TASK: Security review of translation feature.

CONTEXT:
- User preferences stored in Firebase (language choice)
- Translation requests logged for analytics
- Third-party API: MyMemory (external service)
- Cache store: translations in Redis/Firestore

SECURITY QUESTIONS:
1. Is user language preference secure? (Can it leak?)
2. Are translation logs sensitive? (Should they be anonymized?)
3. Third-party API: Is MyMemory trustworthy? (Privacy?)
4. Cache: Could cache be poisoned? (Inject wrong translations?)
5. API endpoint: Rate limiting strong enough?

DELIVERABLE: Security assessment + 0-3 issues + remediation
"
```

---

**Step 3b: QA Specialist Creates Test Plan**

```bash
/agent qa-specialist "

TASK: Create test plan for translation feature.

CONTEXT: Feature allows translating sentences to 6 languages.

SCENARIOS TO TEST:
1. Happy path: Tap sentence → See correct translation
2. Multiple languages: Switch between 6 languages
3. Language preference: Save default language, test persistence
4. Edge cases: Very long sentences, special characters, Unicode
5. Performance: Translation should appear in <1s
6. Offline: What happens if MyMemory is unreachable?
7. Analytics: Track translations correctly
8. Accessibility: All WCAG checks pass
9. Mobile: Works on small screens
10. Browser: Chrome, Safari, Firefox compatibility

DELIVERABLE: Complete test matrix with test cases, edge cases, acceptance criteria
"
```

---

### PHASE 4: SYNTHESIS (Orchestrator)

**Step 4: Orchestrator Creates Launch Specification**

```bash
/agent orchestrator "

TASK: Create complete launch specification for Translation Feature.

INPUTS FROM TEAM:
- EDTECH LEARNING ASSESSMENT: [PASTE from Step 1a]
- PRODUCT MARKET ANALYSIS: [PASTE from Step 1b]
- FRONTEND DESIGN: [PASTE from Step 2a]
- BACKEND API SPEC: [PASTE from Step 2b]
- ACCESSIBILITY REPORT: [PASTE from Step 2c]
- SECURITY ASSESSMENT: [PASTE from Step 3a]
- QA TEST PLAN: [PASTE from Step 3b]

SYNTHESIZE INTO:
1. Executive Summary: What are we building and why?
2. Feature Spec: Complete user-facing description
3. Technical Design: Architecture, APIs, database
4. Accessibility: WCAG requirements + fixes needed
5. Security: Risk assessment + mitigations
6. Test Strategy: How to validate quality
7. Launch Checklist: Step-by-step launch plan
8. Timeline: Estimated effort per component
9. Success Metrics: How we measure success
10. Risks & Mitigations: Potential issues + backups

DELIVERABLE: 5-10 page complete specification, ready for development
"
```

---

## 📊 Session 2: Performance Crisis Response (2 Hours)

**Objective:** Diagnose and fix performance issues  
**Agents:** 4 (QA, Data Analyst, Backend, Frontend)  
**Output:** Prioritized fix list with implementation plan

### Crisis: App Loading Takes 5 Seconds (Too Slow!)

**Phase 1: Parallel Diagnosis (30 min)**

```bash
# Run all 4 commands ASAP (parallel investigation)

/agent qa-specialist "
CRISIS: App takes 5 seconds to load. Students leaving.
DIAGNOSE: Where is the bottleneck?
- Is it JavaScript bundle? (378KB currently)
- Is it Firebase query?
- Is it Gemini API call?
- Is it rendering?
- Is it network latency?
TEST: Use performance profiler. Identify top 3 slow operations.
DELIVERABLE: Performance bottleneck report with timing breakdown.
"

/agent data-analyst "
CRISIS: Loading time = 5 seconds. High bounce rate.
ANALYZE: Which features/screens are slowest?
- Home screen: ? seconds
- Quiz screen: ? seconds
- Results screen: ? seconds
- Leaderboard: ? seconds
- Social features: ? seconds
ANALYZE: Do slower screens have higher bounce rate?
DELIVERABLE: Feature performance ranking + bounce correlation.
"

/agent backend-architect "
CRISIS: App slow, likely Firebase bottleneck.
DIAGNOSE: Are there slow queries?
- Leaderboard queries: select top 20 per level → joins
- User stats: sum XP across games → N+1?
- Social data: friends list → requires multiple calls?
MEASURE: Current Firebase response times
DELIVERABLE: Query performance audit + optimization ideas.
"

/agent frontend-specialist "
CRISIS: App slow, likely rendering issue.
DIAGNOSE: Are components re-rendering excessively?
- Does every keystroke re-render whole app? (React optimization)
- Are animations blocking render? (GPU acceleration needed?)
- Is bundle size the issue? (378KB = large)
MEASURE: Component render times, bundle analysis
DELIVERABLE: Frontend performance audit + optimization ideas.
"

# Let all 4 complete (2-3 minutes)
```

---

**Phase 2: Synthesis & Prioritization (30 min)**

```bash
/agent orchestrator "

CRISIS: App takes 5 seconds to load. Bounce rate high.

TEAM REPORTS:
QA PERFORMANCE REPORT: [PASTE]
DATA ANALYSIS: [PASTE]
BACKEND DIAGNOSIS: [PASTE]
FRONTEND DIAGNOSIS: [PASTE]

SYNTHESIZE:
1. Root cause: What's the #1 slow operation?
2. Impact: How many users affected?
3. Fixes: List top 5 fixes ranked by impact/effort
4. Timeline: Can we fix in 1 day? 1 week?
5. Rollout: Can we hotfix or need testing?

DELIVERABLE: Prioritized fix list with implementation plan
"
```

---

**Phase 3: Implementation Plan**

```bash
/agent backend-architect "

GIVEN these are the top 3 slow operations (from orchestrator):
[PASTE orchestrator's findings]

CREATE implementation plan:
- Fix #1: What code changes? Estimated effort?
- Fix #2: What code changes? Estimated effort?
- Fix #3: What code changes? Estimated effort?
- Total: How long to implement all 3?
- Testing: What needs to be tested after?

DELIVERABLE: Implementation roadmap, ready for coding
"
```

---

## 📋 Session 3: Strategic Planning Debate (90 min)

**Objective:** Decide between 3 feature options  
**Agents:** 5 (Product Manager, EdTech, Data Analyst, Growth, Frontend)  
**Output:** Team consensus on next priority

### The Debate: What to build next?

**Option A: Vocabulary Heatmap** (Highlight difficult words)  
**Option B: Translation Feature** (Translate sentences)  
**Option C: Smart Recommendations** (Suggest stories by level)

---

**Round 1: Opening Arguments**

```bash
/agent product-manager "
DEBATE TOPIC: What should we build first?
OPTION A: Vocabulary Heatmap
OPTION B: Translation Feature  
OPTION C: Smart Recommendations

MY POSITION: I recommend Option B (Translation).
REASONING:
- Competitors don't do it well
- Students want it (survey: 78%)
- Fastest to market (2 weeks)
- Competitive advantage

QUESTION FOR TEAM: What am I missing?
"

/agent edtech-specialist "
DEBATE TOPIC: What should we build first?

MY POSITION: I recommend Option A (Vocabulary Heatmap).
REASONING:
- Better CEFR alignment (targets vocabulary gaps)
- Improves reading fluency (learning science supports this)
- Students see their progress (motivating)
- Long-term retention benefit

QUESTION FOR TEAM: How do you weigh engagement vs learning?
"

/agent growth-strategist "
DEBATE TOPIC: What should we build first?

MY POSITION: I recommend Option C (Smart Recommendations).
REASONING:
- Increases session length (+20% expected)
- Improves retention (+15% expected)
- Personalization drives growth
- 10x growth potential vs competitors

QUESTION FOR TEAM: Can we A/B test each feature?
"

/agent data-analyst "
HERE'S THE DATA (no opinion yet):
Option A engagement: Existing heatmap feature = 5% usage
Option B demand: Survey shows 78% want translations
Option C personalization: Netflix-style recommendations drive 25% revenue
Competitor analysis: [provide your data]

Which matters most to Student Reading Tool?
"
```

---

**Round 2: Debate with Data**

```bash
/agent orchestrator "

ROUND 1 SUMMARY:
PRODUCT: Recommends Option B (Translation) - speed & differentiation
EDTECH: Recommends Option A (Heatmap) - learning outcomes
GROWTH: Recommends Option C (Recommendations) - retention & growth
DATA: Shows Option A low usage, Option B high demand, Option C drives revenue

ROUND 2 QUESTIONS FOR TEAM:
1. Can we do translations well with limited resources?
2. How important is learning outcome vs engagement?
3. What does data show about similar features?
4. Can we launch 2 of the 3 together?
5. What's our company strategy: learning-first or growth-first?

TASK FOR TEAM: Reconsider your position with new data.
"
```

---

**Round 3: Final Recommendation**

```bash
/agent product-manager "

GIVEN the debate above, HERE'S MY FINAL RECOMMENDATION:

We should build: [OPTION X]
BECAUSE:
- [Learning outcome: from EdTech]
- [Growth impact: from Growth]
- [Data support: from Data]
- [Feasibility: from Engineering]
- [Strategic fit: overall vision]

TIMELINE: Launch in [WEEKS]
EXPECTED IMPACT: [metrics from data team]
RISKS: [mitigations from team]

This balances learning + growth + feasibility.
"
```

---

## 🎯 Ready to Run a Session?

All 3 sessions are ready to execute RIGHT NOW.

**Which would you like to run first?**

**A) Feature Design Sprint** (3 hours)
- Design translation feature completely
- Get launch-ready spec
- See 6 agents collaborate

**B) Performance Crisis Response** (2 hours)
- Diagnose app slowness
- Get prioritized fixes
- See 4 agents work in parallel

**C) Strategic Planning Debate** (90 min)
- Decide next 3 features
- See 5 agents debate
- Get team consensus with data

---

## 💡 How to Run ANY Session

**Step 1:** Copy a session above  
**Step 2:** Copy each command into Claude Code (one agent at a time)  
**Step 3:** Wait for agent's response  
**Step 4:** Paste response into next agent's context  
**Step 5:** Continue to synthesis step  
**Step 6:** Get final artifact

**Time per session:** 2-4 hours of actual work  
**Output:** Professional specification ready for implementation  
**Cost:** $0 (toolkit agents)  
**Team:** Assembled instantly  

---

## ✨ Your Agent Team is Ready!

You can run live team collaborations starting TODAY.

**Next step:** Pick Session A, B, or C and follow it exactly.

Ready? 🚀
