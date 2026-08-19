# T-012 — Service mapper unit tests and vitest config

| Field | Value |
|-------|-------|
| **ID** | T-012 |
| **Priority** | P2 |
| **Status** | todo |
| **Type** | test |
| **Branch** | test/unit-mappers |
| **Depends on** | T-006 |
| **Blocks** | — |

## Problem

Service mappers (T-006) transform raw neo4j records into typed DTOs, but there
is no unit coverage and no test runner configured. Regressions in mapping
could silently corrupt UI output.

## Goal

A `vitest`-configured test setup with pure unit tests for the service mappers and
validation helpers that run without any database, keeping the mapping layer
honest.

## Scope
- `vitest.config.ts` (node environment, tsconfig paths).
- `tests/services/patient.test.ts` — history/related/pathway record→DTO mapping.
- `tests/services/graph.test.ts` — graph payload building (dedup, typed).
- `tests/services/search.test.ts` — search mapping + empty.
- `tests/services/validate.test.ts` — invalid id/type/depth rejection.
- `tests/services/path.test.ts` — restricted-pair + shortestPath mapping.
- `npm test` runs these offline (no DB).

## Out of scope
- Live integration tests against CognoDB (T-013).

## Acceptance criteria
- [ ] Vitest configured and `npm test` green
- [ ] Mappers and validation covered without DB
- [ ] Empty-input cases covered