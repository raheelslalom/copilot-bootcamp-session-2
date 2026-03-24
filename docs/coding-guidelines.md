# Coding Guidelines — TODO App

## General Formatting

All JavaScript and JSX files must be consistently formatted. Use **2-space indentation** (no tabs). Lines should not exceed **100 characters**. Files must end with a single newline. Use **single quotes** for strings in JavaScript; JSX attribute values use double quotes as per JSX convention.

---

## Linting

**ESLint** is the required linter for both the frontend and backend. The frontend extends `react-app` and `react-app/jest`; the backend uses Node.js-compatible rules. Run `npx eslint .` before committing to ensure there are no lint errors. Do not disable ESLint rules with inline comments (`// eslint-disable`) unless there is a well-documented reason.

---

## Import Organisation

Organise imports in the following order, with a blank line separating each group:

1. **Node built-ins** (e.g. `path`, `fs`)
2. **Third-party packages** (e.g. `express`, `react`, `axios`)
3. **Internal modules** — absolute or relative imports from within the project

Within each group, sort imports alphabetically. Do not mix default and named imports on the same line when it reduces readability.

---

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Variables and functions | `camelCase` | `fetchItems`, `dueDate` |
| React components | `PascalCase` | `TaskCard`, `FilterBar` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH` |
| CSS classes | `kebab-case` | `task-card`, `delete-btn` |
| Files (JS/JSX) | `camelCase` or `PascalCase` matching export | `app.js`, `TaskCard.jsx` |

---

## DRY Principle

Do not repeat yourself. If the same logic appears in two or more places, extract it into a shared utility function or custom React hook. Place shared backend utilities in `packages/backend/src/utils/` and shared frontend utilities or hooks in `packages/frontend/src/utils/` or `packages/frontend/src/hooks/` respectively.

---

## Functions and Components

- Keep functions and React components **small and focused** — each should do one thing.
- Prefer **arrow functions** for callbacks and React components.
- Extract complex `useEffect` logic into named functions or custom hooks to keep component bodies readable.
- Avoid deeply nested conditionals; use **early returns** to handle error or edge cases first.

---

## Error Handling

- Backend route handlers must wrap database calls in `try/catch` blocks and return structured JSON error responses with an appropriate HTTP status code.
- Frontend fetch calls must handle errors gracefully. Display user-friendly error messages in the UI — never expose raw error stack traces to the user.
- Do not swallow errors silently (empty `catch` blocks are forbidden).

---

## Comments

Write code that is self-explanatory. Only add comments when the **why** behind a decision is not obvious from the code itself. Keep comments up-to-date — stale or misleading comments are worse than no comments.

---

## Environment Variables

Never hard-code environment-specific values (ports, URLs, secrets) in source files. Always read them from `process.env` with a sensible default. Document all required environment variables in the project `README.md`.

---

## Dependencies

- Before adding a new dependency, check whether the existing packages already provide the functionality.
- Keep `dependencies` and `devDependencies` correctly separated in `package.json`.
- Do not commit `node_modules/` — it is excluded by `.gitignore`.

---

## Version Control

- Write clear, imperative commit messages (e.g. `Add due date field to task form`).
- Each commit should represent a single logical change.
- Never commit commented-out code or debug `console.log` statements.
