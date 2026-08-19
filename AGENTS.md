# AGENTS.md

Guidance for agentic coding tools working in this repository.

## Project overview

**Hospital Graph Explorer** is a Next.js (App Router) demonstration app that lets
hospital staff explore a patient's fictional medical history and the graph of
relationships between Patients, Visits, Doctors, Departments, Diseases,
Medications, Diagnoses and Prescriptions. It reads and writes**CognoDB** (a
managed graph database) through the **official Neo4j JavaScript driver** over
Bolt, using parameterized **Cypher**.

The product's core value is *graph traversal* — multi-hop paths and
"related patients" discovery — so the graph is central, not an accessory. All
data is synthetic. Do not present it as real clinical software.

Key architecture files:
- `lib/cognodb/driver.ts` — driver singleton (`globalThis`-cached), session
  lifecycle, typed `CognodbError`.
- `lib/cognodb/config.ts` — env validation → `loadCognoDBConfig()`.
- `lib/cognodb/queries/*.ts` — parameterized Cypher (Q1–Q5 + search).
- `services/*.ts` — record → DTO mappers + param validation (per-task in progress).
- `app/api/*` — thin API routes; no Cypher.
- `types/index.ts` — shared domain + DTO types.
- `scripts/seed/seed.ts` — deterministic, idempotent data seed.
- `docs/data-model.md` — authoritative schema (the source of truth).

## Commands

```bash
npm run dev            # dev server
npm run build          # production build (must pass)
npm start              # serve production build
npm run lint           # next lint (eslint-config-next)
npm run typecheck      # tsc --noEmit (strict)
npm run seed           # tsx scripts/seed/seed.ts — seeds CognoDB
npm test               # vitest run (unit tests, offline)
npm run test:integration  # vitest run tests/integration (needs COGNODB_URI)
```

### Running a single test

Unit tests (no DB needed):

```bash
npx vitest run tests/services/patient.test.ts        # one file
npx vitest run tests/services/patient.test.ts -t "related"   # by name pattern
npx vitest related                                    # watch mode
```

Always run **`npm run typecheck` and `npm run lint`** before finishing any
change; both must be green. Tests live under `tests/` (`tests/services/` for
unit, `tests/integration/` for live-DB). Prefer `npx vitest run <file>` to avoid
accidentally hitting the live integration suite.

## Environment & secrets

- Connection config comes only from env vars: `COGNODB_URI`,
  `COGNODB_USERNAME` (always `cognodb`), `COGNODB_PASSWORD`, optional
  `COGNODB_DATABASE` (default `neo4j`).
- Copy `.env.example` → `.env.local` and fill real values. `.env`/`.env.local`
  are gitignored.
- **Never commit credentials.** Never log or leak the password or URI auth.
- `.env.example` is the only env file that may be committed.
- Env is parsed/validated by `lib/cognodb/config.ts`. Do not read
  `process.env.COGNODB_*` directly elsewhere.

## Code style guidelines

### Language & types
- TypeScript, strict mode. **No `any`.** Prefer `unknown` and narrow with
  type guards/`instanceof`.
- `tsconfig` enables `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals`, `noUnusedParameters` — write code that satisfies these.
- Use `interface` for object shapes, `type` for unions and derived types.
- Prefer explicit return types on exported functions and interfaces for
  queries/services. Use `ReadonlyArray<T>` / `as const` for constants.
- Keep types in `types/index.ts` (shared), co-located interfaces (e.g.
  `*Row` in each query module) where they are only used locally.

### Imports
- Sort imports sensibly: side-effect imports first (e.g. `import "server-only"`),
  then external packages, then relative/local modules.
- Use the `@/*` path alias for imports from the project root (`@/types`,
  `@/lib/...`). Relative imports are acceptable within a module folder.
- Import types with `import { type Foo }` (inline) or `import type { Foo }`.

### Formatting & conventions
- Single quotes, no semicolons not required by style; follow the existing
  Prettier-ish style in `lib/`, `services/`, `app/`, `scripts/`. Match the
  surrounding file.
- 2-space indent. `camelCase` for variables/functions, `PascalCase` for types
  and components, `UPPER_SNAKE_CASE` for constants (e.g. query strings like
  `PATIENT_HISTORY_QUERY`).
- One focused responsibility per file/function. Keep functions small and named.

### Server-side only
- `lib/cognodb/` (and anything touching the Neo4j driver or `process.env` DB
  creds) is **server-only**. Keep `import "server-only"` at the top of driver
  modules. Never import DB code from client components.
- Seed scripts (`scripts/seed/`) create their own driver via `neo4j.driver`
  directly (because `server-only` blocks `tsx`); do not import `driver.ts` from
  the seed.
- API route handlers must not contain Cypher or DB logic — call services.

### Error handling
- Wrap DB failures as `CognodbError` (see `lib/cognodb/driver.ts`): set
  `retryable = true` for connectivity/auth issues, `false` otherwise. Preserve
  a human-readable, credential-free message.
- Do **not** swallow errors silently; rethrow as the typed error.
- Validate incoming params with `services/validate.ts` helpers (e.g.
  `requirePublicId`, `requireSearchQuery`) and reject invalid values early with
  a clear `ValidationError` — before any DB access.
- Return friendly error messages to the UI; never raw stack traces or
  credentials. API routes return a uniform error envelope with a `retry` flag.

### Cypher
- **Always parameterized:** use `$param` placeholders and pass a params object
  via `runQuery`. Never string-interpolate data/user values into Cypher.
- The only exception: a label from a **validated allowlist** (e.g.
  `PATH_TARGET_LABELS` in `lib/cognodb/queries/pathBetween.ts`).
- Keep query structure separate from params. Export query strings as named
  constants (e.g. `PATIENT_HISTORY_QUERY`) and a thin query function.

### Data model
- Follow `docs/data-model.md` exactly; keep the Mermaid diagram in sync with the
  real schema (nodes `Patient | Visit | Doctor | Department | Disease |
  Medication | Diagnosis | Prescription`; typed relationships `HAD_VISIT`,
  `TREATED_BY`, `WORKS_IN`, `RESULTED_IN`, `FOR_DISEASE`, `GENERATED`,
  `FOR_MEDICATION`, `HAS_DISEASE`, `TAKES`).

## Git conventions

### Commit message format

`<type>: <summary>` — one line, sentence-case summary, no trailing period.

- **feat** — new capability (query, service, component, endpoint)
- **fix** — bug or incorrect behavior
- **chore** — scaffolding, tooling, config, build (no behavior change)
- **docs** — documentation, comments, README, task files
- **test** — adding/changing tests
- **refactor** — restructuring with no behavior change

The summary must be imperative, concise, and state *what changed* plus enough
*why* to orient a reader. Match the existing history's style:

```bash
feat: add parameterized Cypher query layer (history, pathway, related, connected, path, search)
feat: add deterministic idempotent seed script for CognoDB
docs: add authoritative graph data model and domain types
```

Examples:
```bash
feat: add patient history endpoint with related-entity counts
fix: deduplicate graph edges when multiple paths share a relationship
chore: pin Next.js version and lockfile
```

### Scoping

- One logical change per commit; do **not** mix unrelated work (e.g. never
  bundle a security fix with a docs edit).
- Keep commits small and reviewable. A large feature can land as several
  focused commits (query layer, then services, then API routes).
- Do not commit unless the user asks; never force-push or rewrite pushed
  history without explicit approval.

### Task linkage

This repo uses a sequential `T-XXX` backlog under `tasks/` (files
`tasks/T-XXX-*.md` + `tasks/README.md` index). When finishing a task, commit
its work first with the message above, then update the task file: mark
`Status: done`, tick acceptance criteria `[x]` with evidence, and update the
status column in `tasks/README.md`. A finished task's `.md` **and the updated
`tasks/README.md`** both live in the same commit as that task's implementation —
commit them together so the backlog index always reflects done tasks.

### Safety

- Never commit `.env`, `.env.local`, real passwords, or URIs with auth — they
  are gitignored. `verifyConnection` errors must stay credential-free.
- `npm run typecheck && npm run lint && npm test` must be green before
  committing a code change.

## Scope discipline

The 48-hour assessment deliberately excludes billing, insurance, payroll,
inventory, HR, auth and microservices. Do not add unnecessary abstractions or
features. If a change grows the product beyond the assessment's definition of
done, confirm with the user first.
