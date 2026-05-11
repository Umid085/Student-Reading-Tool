# 🔄 Core Team Workflows & Commands

## Quick Command Reference

### 🎨 Frontend Engineer Workflows

**Check Performance:**
```
/agent performance-optimizer "Analyze bundle size and Lighthouse scores for Student Reading Tool"
```

**Component Review:**
```
/agent react-specialist "Review student-reading-quest.jsx for optimization opportunities"
```

**Animation Validation:**
```
/agent frontend-specialist "Test all micro-animations: XP float-up, badge pop, answer bounce on different devices"
```

**Design System Audit:**
```
/agent design-system-architect "Review designSystem.js for color, spacing, and typography consistency"
```

---

### 🔧 Backend Engineer Workflows

**API Security:**
```
/agent api-architect "Design secure REST API for the 10 new features (vocab game, weekly board, etc)"
```

**Firebase Optimization:**
```
/agent database-optimizer "Optimize Firebase queries in storage.js - analyze read/write patterns"
```

**Function Review:**
```
/agent backend-architect "Review netlify/functions/generate.js and storage.js for performance and security"
```

**Environment Setup:**
```
/agent backend-specialist "Create .env configuration guide for GOOGLE_API_KEY and FIREBASE_DB_URL"
```

---

### 📚 EdTech Specialist Workflows

**Feature Validation:**
```
/agent edtech-specialist "Validate that all 10 advanced features align with CEFR learning objectives"
```

**CEFR Progression:**
```
/agent learning-designer "Review CEFR A1-C2 level progression: difficulty curves, XP multipliers, quiz difficulty"
```

**Engagement Analysis:**
```
/agent product-manager "Prioritize remaining features: vocabulary heatmap, smart recommendations, translation"
```

**UX Research:**
```
/agent ux-researcher "Analyze student workflow: Reading → Quiz → Results → Leaderboard → Social"
```

---

### ✅ QA Engineer Workflows

**Test Plan:**
```
/testing:tdd "Create TDD test plan for: skeleton loaders, theme system, empty states, micro-animations"
```

**Expand Coverage:**
```
/agent test-architect "Design test strategy to reach 95% coverage (currently 70 tests, 70 passing)"
```

**Performance Baseline:**
```
/agent performance-profiler "Establish performance baselines: bundle size, Firebase latency, render times"
```

**Regression Testing:**
```
/agent qa-specialist "Create regression test suite for all 6 redesign phases"
```

---

### 🔐 Security Engineer Workflows

**Auth Audit:**
```
/agent security-auditor "Security review: base64 auth → recommend bcrypt/proper password hashing implementation"
```

**Data Protection:**
```
/agent security-expert "Review user data handling: localStorage vs Firebase, PII encryption, session security"
```

**API Hardening:**
```
/api-security "Harden API endpoints: rate limiting, input validation, error handling"
```

**GDPR Compliance:**
```
/agent compliance-checker "Ensure student data compliance: FERPA-like requirements, data deletion, privacy policy"
```

---

## 🎯 Workflow Templates

### Template 1: New Feature Launch
```
1. EdTech Specialist validates feature against learning goals
2. Backend Engineer designs API & database schema
3. Frontend Engineer plans UI/UX & animations
4. Security Engineer reviews data handling
5. QA Engineer creates test plan
6. Full team review before deployment
```

**Example: Implement Vocabulary Game**
```
/agent edtech-specialist "Design vocabulary game that reinforces reading passages from A1-C2"
/agent api-architect "Design vocabulary game API endpoints and Firebase schema"
/agent frontend-specialist "Create vocabulary game UI with 3 game modes (flashcard, MCQ, fill-blank)"
/agent security-auditor "Review vocabulary game data storage and word list handling"
/testing:tdd "Create comprehensive tests for vocabulary game scoring and progression"
```

---

### Template 2: Performance Optimization Sprint
```
1. QA Engineer profiles app (bundle, Firebase, render)
2. Frontend Engineer optimizes components & animations
3. Backend Engineer optimizes Firebase queries
4. Performance Optimizer validates improvements
5. Team signs off on metrics
```

**Example: Optimize Bundle Size**
```
/agent performance-profiler "Analyze current bundle (380KB) and identify optimization opportunities"
/agent frontend-specialist "Code-split components, lazy load non-critical features"
/agent backend-architect "Minimize Firebase payload sizes, implement response caching"
/agent performance-optimizer "Validate new bundle size and measure improvement"
```

---

### Template 3: Security Hardening Sprint
```
1. Security Engineer audits codebase
2. Backend Engineer implements fixes
3. QA Engineer creates security tests
4. Security Engineer validates fixes
5. Team reviews compliance checklist
```

**Example: Upgrade Authentication**
```
/agent security-auditor "Full audit of current base64 auth system - identify vulnerabilities"
/agent backend-architect "Implement bcrypt password hashing, secure session management, JWT tokens"
/agent security-expert "Review password reset flow, session timeout, CORS configuration"
/testing:tdd "Create security test suite: password validation, session management, token refresh"
/agent compliance-checker "Verify GDPR/student data compliance in new auth system"
```

---

### Template 4: Feature Validation Sprint
```
1. EdTech Specialist reviews learning design
2. Frontend Engineer validates UX
3. QA Engineer tests functionality
4. Backend Engineer optimizes performance
5. Security Engineer reviews data handling
```

**Example: Weekly Challenge Board Launch**
```
/agent edtech-specialist "Validate weekly challenge motivates daily engagement without burnout"
/agent frontend-specialist "Review weekly board UI: leaderboard, progress tracking, goal visualization"
/testing:tdd "Test weekly reset mechanics, XP calculation, streak preservation"
/agent backend-architect "Optimize weekly leaderboard queries, implement caching"
/agent security-auditor "Verify user privacy in leaderboard rankings (no data exposure)"
```

---

## 🚀 Common Commands Cheat Sheet

| Task | Command |
|------|---------|
| **Start Sprint** | `/agent product-manager "Prioritize next 3 features for Student Reading Tool"` |
| **Security Check** | `/agent security-auditor "Full security audit of Student Reading Tool"` |
| **Performance Check** | `/agent performance-optimizer "Analyze app performance: bundle, Firebase, render times"` |
| **Test Coverage** | `/testing:tdd "Expand test coverage from 70 to 100+ tests"` |
| **API Design** | `/api:architect "Design new social feature APIs: friend requests, challenges"` |
| **WCAG Check** | `/accessibility:wcag "Validate WCAG 2.1 AA compliance for entire app"` |
| **Code Review** | `/agent code-reviewer "Comprehensive review of latest redesign implementation"` |
| **Team Huddle** | `/agent orchestrator "Gather all 5 specialists for feature design review"` |

---

## 📋 Typical Sprint Structure

### Monday: Planning
```
/agent product-manager "What should we build this week?"
/agent edtech-specialist "Validate feature against learning goals"
```

### Tuesday-Thursday: Development
```
Frontend: /agent frontend-specialist "Implement feature UI"
Backend: /agent backend-architect "Implement API & database"
Security: /agent security-auditor "Review data handling"
```

### Friday: QA & Security
```
/testing:tdd "Run comprehensive test suite"
/agent security-auditor "Final security review"
/agent performance-optimizer "Performance regression testing"
```

### Before Deployment
```
/agent security-auditor "Final security sign-off"
/testing:tdd "All tests passing"
/agent performance-profiler "Performance baseline met"
```

---

## 🎓 Learning Resources

Each team member has access to:

- **Agents:** 135+ specialized agents for any task
- **Skills:** 35+ ready-to-use workflows
- **Plugins:** 176+ tools for code quality
- **MCP:** Integrations with Firebase, GitHub, Analytics

**Pro Tip:** Chain multiple agents for complex work:
```
"I need the backend + security engineers to design a new social API endpoint"
"Can the frontend specialist + edtech specialist review the quiz difficulty?"
"Full team review: is the weekly challenge feature complete?"
```

---

## ✨ Your Core Team is Ready!

**Current Status:** ✅ Assembled and equipped  
**Available Skills:** 35+  
**Available Agents:** 135+  
**Available Plugins:** 176+  

Start using them in your next conversation with any of these commands:
- `/agent [specialist-name]`
- `/testing:tdd`, `/api:architect`, `/security:audit`
- Direct role reference: "Frontend specialist, optimize this component"

**Let's build something great!** 🚀
