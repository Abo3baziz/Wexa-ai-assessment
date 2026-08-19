# T-003 — Server-side driver, config, and server-only guard

| Field | Value |
|-------|-------|
| **ID** | T-003 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/cognodb-driver |
| **Depends on** | T-001 |
| **Blocks** | T-004, T-005, T-013 |

## Problem

`lib/cognodb/` does not exist. Connection env vars are only documented in
`.env.example`; nothing reads them. Without a driver singleton, later work
would either create a driver per request or leak DB access into UI/API layers.

## Goal

A hardened, reusable, server-only CognoDB driver module that validates env
config, creates a lazily-initialized singleton over the official Neo4j driver,
and executes queries with safe session lifecycle and typed readable errors.

## Scope
- Add `server-only` dependency and `import "server-only"` at top of driver.
- `lib/cognodb/config.ts`: parse/validate `COGNODB_URI`, `COGNODB_USERNAME`,
  `COGNODB_PASSWORD`, optional `COGNODB_DATABASE`; throw a typed, readable error
  enumerating missing vars; never include the password value in messages.
- `lib/cognodb/driver.ts`: `getDriver()` singleton via `globalThis` (Next dev
  hot-reload safe), `neo4j.auth.basic`, `bolt+s` enforced for remote URIs;
  `verifyConnectivity()`; `withSession(fn)` helper closing sessions in `finally`;
  map driver errors to `CognodbError` (wraps connection/auth failures).
- Wire `npm run seed`'s future env loading to reuse `config.ts` (no code here).
- Grounding: `prompt.md` §4, §11; `.env.example`.

## Out of scope
- Cypher queries, services, API routes, seed data.

## Acceptance criteria
- [x] `getDriver()` throws typed readable error when `COGNODB_URI`/`PASSWORD` missing (verified: loadCognoDBConfig throws ConfigError listing missing vars)
- [x] Singleton reused across calls in dev (no driver per request) (verified: globalThis-cached driver in lib/cognodb/driver.ts)
- [x] Sessions always closed (finally) (verified: withSession closes in finally)
- [x] `npm run typecheck` passes (verified: clean)