# Coding style: professional software engineering (web apps)

Write production-quality, maintainable code, as a senior engineer would
for a team codebase. Correctness, clarity, and maintainability come
before brevity.

## Stack (edit per project)
- Language/runtime: TypeScript, Node 20
- Frontend: <React / Vue / Svelte / ...>
- Backend: <Express / FastAPI / Django / ...>
- Database: <PostgreSQL / SQLite / ...>
- Package manager: <npm / pnpm / uv / ...>
- Always follow the conventions already present in the codebase over
  these defaults.

## Before coding
- Read the relevant existing code and match its patterns, naming, and
  folder structure before adding anything.
- For any change touching more than ~3 files, or any new feature, give a
  short plan first (files affected, approach, risks) and wait for my OK.
- Prefer small, focused, reviewable changes over large rewrites.

## Architecture
- Separate concerns: UI, business logic, data access, and configuration
  live in different layers/modules.
- Single responsibility: small functions and components with clear names
  and clear inputs/outputs. Avoid side effects where possible.
- Reuse existing utilities and components before creating new ones.
  Follow DRY, but do not abstract until a pattern appears a second or
  third time.
- Configuration via environment variables and a typed config module.
  Never hardcode secrets, URLs, or environment-specific values.
- Keep dependencies minimal. Before adding a package, say why and
  wait for my approval.

## Code quality
- Use strict typing (TypeScript strict mode / Python type hints). No
  `any` or untyped public interfaces without a justification comment.
- Descriptive names (`getUserById`, not `gub`). No abbreviations except
  universal ones.
- Comments explain *why*, not *what*. Public functions and modules get
  concise docstrings/JSDoc.
- Follow the project linter and formatter (ESLint/Prettier, Ruff/Black,
  etc.). Never disable a lint rule without telling me.
- No dead code, commented-out code, or leftover debug logs.

## Error handling and logging
- Handle errors explicitly and at the right layer. Never swallow
  exceptions silently.
- Validate and sanitize all external input (requests, forms, URL params,
  files) at the boundary, using a schema validator (zod, pydantic, etc.).
- Return consistent, typed error responses from APIs with correct HTTP
  status codes.
- Use the project's logger with levels. Never log secrets, tokens, or
  personal data.

## Security
- Follow OWASP basics: parameterized queries only (no string-built SQL),
  output escaping, CSRF protection, secure cookies, proper CORS.
- Authentication and authorization checks are enforced on the server,
  never only in the UI.
- Never commit secrets. Use `.env` (git-ignored) and provide a
  `.env.example` with placeholder values.
- Flag any dependency or pattern with a known security concern.

## Testing
- New logic comes with tests: unit tests for business logic, integration
  tests for API endpoints, component tests for UI where relevant.
- Bug fixes start with a failing test that reproduces the bug.
- Tests must be deterministic and independent (no shared state, no real
  network or external services; mock them).
- Run the relevant tests and the linter/type-checker after changes and
  report the result. Do not claim something works without running it.

## Frontend specifics
- Small, composable, typed components. Keep state as local as possible.
- Accessibility is required: semantic HTML, labels, keyboard navigation,
  sufficient contrast, alt text.
- Responsive by default. Handle loading, empty, and error states in
  every data-driven view.
- Avoid unnecessary re-renders and large bundles; lazy-load heavy parts.

## Backend and data specifics
- Database changes go through migrations, never manual edits. Migrations
  must be reversible when possible.
- Index and paginate queries that can grow. Avoid N+1 queries.
- APIs are versioned or backward compatible. Document endpoints
  (OpenAPI or equivalent).
- Make operations idempotent where it matters (payments, webhooks, jobs).

## Git and workflow
- Never commit, push, or open PRs unless I ask. When I do ask, use
  Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
  with atomic commits.
- Do not modify unrelated files, reformat untouched code, or bump
  dependency versions as a side effect.
- Update README/docs and `.env.example` when behavior or setup changes.

## Behavior
- If requirements are ambiguous, ask one concise question before coding.
- When you make a trade-off or deviate from these rules, say so briefly.
- Summaries: what changed, why, how it was tested, and any follow-ups or risks.
- Prefer simplicity and shorter amount of code.