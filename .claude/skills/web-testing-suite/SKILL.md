---
name: web-testing-suite
description: Detailed instructions for running Vitest and Playwright tests.
---

# Web Testing Procedures
- Always use `npm test` for unit tests.
- When writing E2E tests, save them in the `/tests/e2e` directory.
- Use the "Screen Object Model" pattern for all Playwright scripts.
- If a test fails, check the logs in `./test-results` before retrying.
