# T-012 — Service mapper unit tests and vitest config

| Field | Value |
|-------|-------|
| **ID** | T-012 |
| **Priority** | P2 |
| **Status** | done |
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
- [x] Vitest configured and `npm test` green — `vitest.config.ts` (node env,
      `@/*` alias, `server-only` stub) already existed; added the missing test
      suites. `npm test` runs 55 tests across 6 files, all green, with no DB.
- [x] Mappers and validation covered without DB — `mapPatientOverview`,
      `mapRelatedPatients`, `mapCarePathway`, `mapSearchResults`,
      `mapPathResult`, `buildNeighborhoodPayload` (pre-existing), plus every
      validator in `services/validate.ts`.
- [x] Empty-input cases covered — empty row arrays for overview/related/
      pathway/path/search, absent/blank query strings, and absent depth values.

## Implementation notes
- New files: `tests/services/patient.test.ts`, `tests/services/search.test.ts`,
  `tests/services/validate.test.ts`, `tests/services/path.test.ts`.
- The path suite surfaced a real bug in T-011's `mapPathResult`: the known-type
  guard ran `typeFromLabel(routeLabel(n.label)) !== null` over the **mapped**
  nodes, whose `label` is the display title (not the node type), and `!== null`
  can never reject an `undefined` return — so paths containing unknown labels
  were reported as found, and the mapped label would have let any unknown node
  through as `Patient`. Fixed to check `row.nodes` raw labels with
  `!== undefined` (services/path.ts). Re-verified live: `P-1007 → d-1` still
  found at 3 hops; `depth` > 10 still 400.