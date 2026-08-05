# Development Standards

This document defines the baseline development standards that apply to all projects, regardless of language, framework, or team size. Project-specific documentation may extend these standards but should not contradict them without an explicitly documented reason.

## 1. Code Style Guidelines

### 1.1 Naming Conventions
- Use descriptive, unabbreviated names for variables, functions, classes, and files. Prefer `userAccountBalance` over `uab`.
- Follow the idiomatic casing convention of the language in use rather than imposing a foreign style:
  - `camelCase` for variables and functions in JavaScript/TypeScript, Java, Swift.
  - `snake_case` for variables and functions in Python, Ruby, Rust.
  - `PascalCase` for classes, types, interfaces, and components in all languages.
  - `SCREAMING_SNAKE_CASE` for constants and environment variables.
- Boolean variables and functions should read as a predicate: `isActive`, `hasPermission`, `canRetry`.
- Avoid single-letter names except for trivial, short-lived loop indices (`i`, `j`) or well-known mathematical variables.
- Files and directories use `kebab-case` or the convention native to the ecosystem's tooling (e.g., `PascalCase.tsx` for React components).

### 1.2 Indentation and Formatting
- Indent with spaces, not tabs, unless the language ecosystem mandates otherwise (e.g., Go uses `gofmt`'s tabs).
- Use 2 spaces for web-ecosystem languages (JS/TS, HTML, CSS, JSON, YAML) and 4 spaces for Python, Java, C#, and C-family languages, unless a project-wide formatter config says otherwise.
- Every project must define its formatting rules in a machine-enforced config file (`.editorconfig`, `.prettierrc`, `pyproject.toml`, etc.) and run the formatter automatically via a pre-commit hook or CI check.
- Maximum line length: 100 characters as a default; exceptions are permitted for URLs, long strings, and generated code.
- Use a linter appropriate to the language (ESLint, Ruff/Flake8, RuboCop, Clippy) with rules enforced in CI, not just locally.

### 1.3 Commenting
- Code should be self-explanatory through naming and structure; comments explain **why**, not **what**.
- Avoid comments that restate the code (`// increment i` above `i++`).
- Document non-obvious business logic, workarounds, and known limitations with a brief comment and, where relevant, a link to the originating ticket or discussion.
- Use `TODO(username): description` for deferred work so it is attributable and searchable.
- Avoid commented-out code in committed changes; rely on version control history instead.

### 1.4 File Organization
- Group files by feature/domain rather than by type when a project grows beyond a trivial size (e.g., `features/checkout/` rather than scattering checkout logic across generic `controllers/`, `models/`, `views/` folders).
- Keep one primary export (class, component, or module concern) per file where practical.
- Co-locate tests with the code they cover (`foo.ts` + `foo.test.ts`) unless the language ecosystem convention dictates a separate test tree (e.g., Go, Java).
- Maintain a consistent top-level structure: `src/`, `tests/`, `docs/`, `scripts/`, `config/`.
- Keep configuration, secrets templates, and environment files out of source directories; use a dedicated `config/` or root-level dotfiles.

## 2. Version Control Practices

### 2.1 Branching Strategy
- Default branch is `main`; it must always be in a deployable state.
- Use short-lived feature branches named with a type prefix and short description: `feature/add-oauth-login`, `fix/null-pointer-on-checkout`, `chore/upgrade-deps`.
- Include a ticket/issue reference in the branch name when available: `feature/APP-123-add-oauth-login`.
- Avoid long-lived branches that diverge significantly from `main`; rebase or merge from `main` regularly to minimize conflicts.
- Delete branches after merge.

### 2.2 Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

<optional body explaining what and why, not how>

<optional footer: BREAKING CHANGE, Closes #123>
```

- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`.
- Subject line: imperative mood, no trailing period, under 72 characters (`fix: prevent race condition in session refresh`).
- Each commit should represent one logical, working change — avoid bundling unrelated changes.
- Reference the relevant issue/ticket number in the body or footer.

### 2.3 Merge Protocols
- All changes land via pull/merge request — direct pushes to `main` are disallowed.
- A PR requires at least one approving review before merge (two for changes touching security, auth, payments, or data migrations).
- All CI checks (build, lint, tests) must pass before merge.
- Prefer squash-merge for feature branches to keep `main` history clean; use merge commits only when preserving granular history is intentionally valuable.
- PR descriptions must state what changed, why, and how it was tested; link the originating issue.
- Resolve all review comments (via fix or documented discussion) before merge — don't merge over unresolved "changes requested."
- Rebase (not force-push over shared history) when updating a branch that others may have pulled.

## 3. Testing Requirements

### 3.1 Unit Testing
- New logic must be accompanied by unit tests covering the primary behavior and realistic edge cases (empty input, boundary values, error paths).
- Unit tests must be deterministic, isolated (no network/filesystem/database dependency), and fast (milliseconds, not seconds).
- Use the standard test framework for the language/ecosystem (Jest/Vitest for JS/TS, pytest for Python, JUnit for Java, `go test` for Go).
- Mock or stub external dependencies at the unit level; reserve real integrations for integration tests.

### 3.2 Integration Testing
- Cover interactions between components: API endpoints, database access layers, third-party service integrations.
- Run against realistic (containerized or ephemeral) environments rather than production systems.
- Integration tests must clean up any state they create (database rows, files, queued jobs).
- Critical user flows (auth, checkout, data submission) require at least one end-to-end or integration test.

### 3.3 Code Coverage
- Minimum coverage target: 80% line coverage for new and modified code; critical paths (security, payments, data integrity) target 90%+.
- Coverage is a signal, not a goal in itself — do not write low-value tests purely to hit a number.
- Coverage reports are generated in CI and must not regress below the project's configured threshold on a PR.
- Untested code paths introduced deliberately (e.g., defensive code that should be unreachable) should be documented with a comment explaining why they're excluded.

## 4. Documentation Standards

### 4.1 Code Comments
- Public functions, classes, and modules with non-trivial behavior require a docstring/doc-comment describing purpose, parameters, return values, and exceptions/errors thrown.
- Use the language-native doc format (JSDoc, Python docstrings, Javadoc, Rustdoc) so documentation can be tooling-generated.
- Keep comments and docstrings updated alongside code changes in the same PR — stale documentation is treated as a bug.

### 4.2 README Requirements
Every repository must have a root `README.md` containing:
1. **Project name and one-paragraph description** of what it does and who it's for.
2. **Getting started**: prerequisites, installation steps, environment setup.
3. **Usage**: how to run the project locally, common commands (build, test, lint, run).
4. **Architecture overview** (or link to `docs/architecture.md` for larger systems).
5. **Contributing guidelines** (or link to `CONTRIBUTING.md`).
6. **License** information.
- Keep README instructions verified — treat a broken "getting started" step as a bug.

### 4.3 API Documentation
- All public APIs (REST, GraphQL, RPC, or library/package APIs) must be documented with:
  - Endpoint/method signature, parameters, request/response schemas or types.
  - Authentication/authorization requirements.
  - Example requests and responses.
  - Error responses and status codes.
- Prefer generated documentation from source annotations (OpenAPI/Swagger, GraphQL schema introspection, TypeDoc) over hand-maintained duplicates that can drift.
- Breaking API changes must be documented in a `CHANGELOG.md` and versioned according to semantic versioning.

## 5. Security Best Practices

### 5.1 Input Validation
- Treat all input from users, external systems, and third-party APIs as untrusted.
- Validate type, format, length, and range at the system boundary before processing.
- Use allow-lists over deny-lists when validating structured input (e.g., known-good characters/formats rather than blocking known-bad ones).
- Use parameterized queries or an ORM for all database access — never build SQL via string concatenation.
- Escape/encode output appropriately for its context (HTML, URL, shell, SQL) to prevent injection attacks (XSS, SQLi, command injection).
- Validate and sanitize file uploads: check content type, size limits, and store outside the web root or in isolated storage.

### 5.2 Authentication and Authorization
- Never store passwords in plaintext; use a modern adaptive hash (bcrypt, scrypt, Argon2) with per-user salts.
- Use short-lived access tokens with refresh tokens for session management; avoid long-lived static API keys embedded in clients.
- Enforce the principle of least privilege — grant the minimum role/permission required for a given action.
- Perform authorization checks server-side on every request; never rely on client-side checks or hidden UI elements alone.
- Support and encourage multi-factor authentication for privileged accounts.
- All authentication-related failures should return generic error messages (avoid revealing whether a username exists).

### 5.3 Dependency Management
- Pin dependency versions (lockfiles: `package-lock.json`, `poetry.lock`, `Cargo.lock`, etc.) and commit them to version control.
- Run automated vulnerability scanning (`npm audit`, `pip-audit`, Dependabot, Snyk) in CI on every PR and on a recurring schedule.
- Patch critical/high-severity vulnerabilities within a defined SLA (recommended: 7 days for critical, 30 days for high).
- Avoid adding a new dependency for functionality trivially implemented in-house; each dependency is an ongoing security and maintenance liability.
- Remove unused dependencies promptly.

### 5.4 Secrets and Configuration
- Never commit secrets, API keys, credentials, or tokens to version control — use environment variables or a secrets manager (Vault, AWS Secrets Manager, etc.).
- Provide a `.env.example` (with placeholder values only) documenting required environment variables.
- Rotate credentials that have ever been exposed, even if the exposure was in a private repository.
- Enforce `.gitignore` rules for local env files, credentials, and build artifacts before the first commit of a new project.

---

*This document defines minimum baseline standards. Individual projects may adopt stricter rules but should document and justify any deviation from these defaults in their own `CONTRIBUTING.md` or equivalent.*
