# 📋 Student Reading Tool - Core Team Setup

**Project:** Student Reading Tool (AI-powered CEFR language learning)  
**Team Size:** 5 specialists  
**Toolkit:** awesome-claude-code-toolkit (135+ agents, 35+ skills, 176+ plugins)

---

## 🎯 Core Team Members

### 1. **Frontend Engineer** (React/TypeScript Specialist)
**Role:** UI/UX, component architecture, animations, responsive design  
**Responsibilities:**
- React component optimization & performance
- Micro-interactions & animations (skeleton loaders, transitions)
- Mobile-first responsive design
- Design system maintenance

**Available Skills & Agents:**
- `/testing:frontend` - Component testing
- `react-specialist` agent
- `typescript-expert` agent
- `accessibility-checker` - Accessibility review
- `performance-optimizer` - Bundle optimization
- `design-system-architect` - Design tokens

**Current Focus:** 
- Maintaining design system (colors, spacing, typography)
- Micro-animation implementation ✅
- Theme system (4 preset themes) ✅

---

### 2. **Backend/API Engineer** (Node.js + Firebase Specialist)
**Role:** Netlify Functions, Firebase integration, API design  
**Responsibilities:**
- Netlify Functions optimization
- Firebase Realtime Database schema design
- REST API design & security
- Environment configuration

**Available Skills & Agents:**
- `backend-architect` agent
- `api-architect` - API design & documentation
- `firebase-specialist` agent
- `security-auditor` - API security review
- `performance-optimizer` - Query optimization
- `database-optimizer` - Firebase efficiency

**Current Focus:**
- Google Gemini API integration
- Firebase dual-write pattern (localStorage + Firebase)
- Rate limiting & quota management

---

### 3. **EdTech Specialist** (Learning Platform Expert)
**Role:** CEFR pedagogy, learning progression, feature strategy  
**Responsibilities:**
- CEFR level progression & difficulty curves
- Quiz design & question type validation
- Learning analytics interpretation
- Feature prioritization (10 advanced features)
- User engagement strategy

**Available Skills & Agents:**
- `edtech-specialist` agent
- `learning-designer` - CEFR/pedagogy
- `product-manager` - Feature prioritization
- `ux-researcher` - Student UX research
- `data-analyst` - Learning patterns analysis
- `content-strategist` - Reading materials strategy

**Current Focus:**
- 10 advanced features integration
- Weekly challenge board UX
- Reading difficulty analysis
- Vocabulary progression system

---

### 4. **QA & Testing Engineer** (Test Architect)
**Role:** Testing strategy, comprehensive coverage, quality assurance  
**Responsibilities:**
- Unit & integration test coverage (currently 70 tests)
- E2E testing strategy
- Performance profiling
- Regression testing
- Bug identification & triage

**Available Skills & Agents:**
- `/testing:tdd` - Test-driven development
- `qa-specialist` agent
- `test-architect` agent
- `performance-profiler` - Benchmarking
- `security-tester` - Penetration testing
- `accessibility-tester` - A11y validation

**Current Focus:**
- Vitest configuration & test expansion
- Firebase integration testing
- Netlify Functions testing
- UI component testing

---

### 5. **Security & Compliance Engineer**
**Role:** User data protection, auth hardening, compliance  
**Responsibilities:**
- Authentication system security (currently base64)
- User data privacy & encryption
- OAuth/JWT implementation
- OWASP compliance
- Security audit & penetration testing

**Available Skills & Agents:**
- `security-auditor` agent
- `security-expert` - Code security review
- `secrets-manager` - Credential management
- `compliance-checker` - GDPR/legal
- `api-security` - API hardening
- `authentication-architect` - Auth system design

**Current Focus:**
- Base64 auth → proper password hashing (bcrypt)
- User data encryption
- Session management security
- Student data compliance (FERPA-like)

---

## 🔧 How to Invoke the Team

### Direct Agent Invocation
```
/agent frontend-specialist "Optimize the theme selector performance"
/agent backend-architect "Design Firebase schema for new feature"
/agent edtech-specialist "Review CEFR difficulty curve for B2 level"
/agent qa-specialist "Create comprehensive test plan for leaderboard"
/agent security-auditor "Audit the authentication system"
```

### Skill-Based Tasks
```
/testing:tdd "Set up TDD for new quiz question type"
/api:architect "Design new social API endpoints"
/accessibility:wcag "Check WCAG compliance for new empty states"
/performance:optimize "Profile and optimize Firebase queries"
/security:audit "Review auth system implementation"
```

### Team Collaboration Request
```
"Assemble the core team to design the new translation feature"
"I need frontend + edtech specialist review for the vocab game"
"Security + backend engineer audit the user data flow"
```

---

## 📊 Toolkit Resources Available to Team

### Skills (35+)
- **Testing:** TDD, E2E, unit testing, integration testing
- **Security:** Audit, penetration testing, secrets management
- **API:** Design, documentation, versioning
- **Performance:** Optimization, profiling, monitoring
- **Accessibility:** WCAG, a11y testing, screen reader validation
- **Database:** Query optimization, schema design, indexing
- **DevOps:** Deployment, CI/CD, monitoring

### Agents (135+)
- Language experts (TypeScript, JavaScript, Python)
- Domain specialists (EdTech, Healthcare, Finance, etc.)
- Infrastructure (DevOps, Cloud, Deployment)
- Quality assurance (Testing, QA, Security)
- Data/AI (Analytics, ML, Data Science)

### Plugins (176+)
- Code review assistants
- Security scanners
- Performance analyzers
- Documentation generators
- Deployment automation
- Analytics tools

### MCP Configs
- GitHub integration
- Firebase admin SDK
- Analytics platforms
- Monitoring tools
- Collaboration platforms

---

## 📈 Current Project Status

**Completed:**
- ✅ Full UI redesign (6 phases)
- ✅ Skeleton loaders & animations
- ✅ Theme system (4 presets)
- ✅ Empty state improvements
- ✅ 70 unit tests

**In Progress:**
- 🔄 Vite dev server running (port 5173)
- 🔄 Theme customization testing

**Next Priorities (Per Team):**
1. **Frontend:** Test animations in browser, polish transitions
2. **Backend:** Optimize Firebase queries, implement caching
3. **EdTech:** Validate CEFR progression curves
4. **QA:** Expand test coverage to 90%+
5. **Security:** Upgrade auth from base64 to bcrypt

---

## 💡 Team Usage Guidelines

**When to Invoke:**
- Feature design → EdTech Specialist
- Performance issues → Frontend + Backend Engineers
- New API endpoint → Backend + Security Engineer
- Testing strategy → QA Engineer
- Security concerns → Security Engineer
- Complex refactoring → Full team review

**Skill Selection:**
- Start with `/testing:tdd` for new features
- Use `/api:architect` before backend changes
- Run `/security:audit` before deployment
- Use `/accessibility:wcag` for UI changes
- Use `/performance:optimize` for slow features

---

## 🚀 Quick Start Commands

```bash
# Audit current code
/agent security-auditor "Full security review of auth system and Firebase integration"

# Test improvement
/testing:tdd "Create test plan for all 10 advanced features"

# API review
/api:architect "Review and optimize Netlify Functions API design"

# Accessibility check
/accessibility:wcag "Check WCAG 2.1 AA compliance for the entire app"

# Performance profile
/performance:optimize "Profile bundle size and Firebase query performance"
```

---

**Team is ready to roll!** 🎯  
Use this document to reference roles, skills, and when to invoke each specialist.
