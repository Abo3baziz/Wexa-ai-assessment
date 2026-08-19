# T-013 — Integration tests gated on COGNODB_URI

| Field | Value |
|-------|-------|
| **ID** | T-013 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | test |
| **Branch** | test/integration |
| **Depends on** | T-004 |
| **Blocks** | T-015 |

## Problem

The graph behavior (patient retrieval, multi-hop, related patients, empty
results, invalid ids, DB failure handling) is only meaningfully verified against
a real CognoDB instance (prompt §22). These require live credentials that should
not block offline dev or CI builds.

## Goal

Integration tests that run against the live instance referenced by the local
`.env` when `COGNODB_URI` is present, and are cleanly skipped otherwise, covering
connection, seed, retrieval, traversal, related patients, empty results and
invalid ids.

## Scope
- `tests/integration/db.test.ts` — skip when `COGNODB_URI` is unset.
- Cover: connection (`verifyConnectivity`), seed idempotency, patient history
  retrieval, multi-hop pathway, related patients, empty results, invalid ids,
  DB-failure path (bad URI → friendly error).
- Use `vitest` `describe.skipIf` / env gating; do not hardcode creds in tests
  (read from env only).
- Add `test:integration` npm script.

## Decisions needed
- [x] Creds availability (**done: user created CognoDB instance; `.env` present**)

## Acceptance criteria
- [x] Integration tests skip cleanly when `COGNODB_URI` unset (CI-safe) — `tests/integration/db.test.ts` uses `describe.skipIf(!COGNODB_URI)`; verified all 9 tests skip with `.env` absent.
- [x] With `.env` set, tests run green against live instance — `npm run test:integration` → 9/9 passed (connectivity, history, care pathway, related, connected, shortest path, empty history, empty search, DB-unreachable).
- [x] No credentials hardcoded in tests or committed — config read from env only via `loadCognoDBConfig()`; `.env` is gitignored.

## Notes
- `vitest.config.ts` aliases `@/*` and stubs `server-only` (to a no-op) so the real query/service/driver modules can run under plain-node vitest.
- `npm test` is scoped to `tests/services` (offline unit tests) so it never hits the live integration suite; `npm run test:integration` targets `tests/integration`.