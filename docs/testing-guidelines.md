# Testing Guidelines — TODO App

## Unit Tests

- Use **Jest** to test individual functions and React components in isolation.
- Unit test files must use the naming convention `*.test.js` or `*.test.ts`.
- Backend unit tests must be placed in `packages/backend/__tests__/` directory.
- Frontend unit tests must be placed in `packages/frontend/src/__tests__/` directory.
- Name unit test files to match the source file they test (e.g. `app.test.js` for `app.js`).

---

## Integration Tests

- Use **Jest + Supertest** to test backend API endpoints with real HTTP requests.
- Integration tests must be placed in `packages/backend/__tests__/integration/` directory.
- Integration test files must use the naming convention `*.test.js` or `*.test.ts`.
- Name integration test files based on what they test (e.g. `todos-api.test.js` for TODO API endpoints).

---

## End-to-End (E2E) Tests

- Use **Playwright** (required framework) to test complete UI workflows through browser automation.
- E2E tests must be placed in the `tests/e2e/` directory.
- E2E test files must use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they test (e.g. `todo-workflow.spec.js`).
- Playwright tests must run against **one browser only** (Chromium).
- Playwright tests must follow the **Page Object Model (POM)** pattern — each page or major UI section has a corresponding page object class in `tests/e2e/pages/`.
- Limit E2E tests to **5–8 critical user journeys**. Focus on happy paths and key edge cases; do not aim for exhaustive coverage.

---

## Port Configuration

Always use environment variables with sensible defaults for port configuration so that CI/CD workflows can dynamically detect ports.

- **Backend:** `const PORT = process.env.PORT || 3030;`
- **Frontend:** React's default port is `3000`, but can be overridden with the `PORT` environment variable.

---

## Test Isolation & Independence

- Every test must be **fully isolated and independent** — it must not rely on state left by another test.
- Each test must set up its own data and clean up after itself.
- **Setup and teardown hooks are required** (`beforeEach` / `afterEach` or `beforeAll` / `afterAll` as appropriate) so that the full test suite succeeds on multiple consecutive runs without manual intervention.

---

## Coverage & New Features

- All new features must include appropriate tests at the relevant level (unit, integration, and/or E2E).
- Tests must be maintainable and follow best practices: clear naming, single responsibility per test, and descriptive failure messages.
