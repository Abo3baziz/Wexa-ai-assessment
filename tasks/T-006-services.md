# T-006 — Service mappers and param validation

| Field | Value |
|-------|-------|
| **ID** | T-006 |
| **Priority** | P1 |
| **Status** | todo |
| **Type** | feature |
| **Branch** | feature/services |
| **Depends on** | T-005 |
| **Blocks** | T-007, T-012 |

## Problem

Query results are raw neo4j `Record`s. API routes and UI must not know about
records or graph internals; bad params would otherwise reach the DB.

## Goal

A `services/` layer that maps raw neo4j records to the typed domain DTOs in
`types/index.ts` and validates incoming params up front, so API routes stay
thin and types stay strict (`no any`).

## Scope
- `services/validate.ts` — param validation helpers (publicId, entity ids,
  entity types, depth/limit bounds); reject invalid values early.
- `services/patient.ts` — map history/related/pathway records → PatientOverview,
  RelatedPatient, PatientStats.
- `services/graph.ts` — build GraphPayload (nodes/edges) for the viz from graph
  records; typed and deduplicated.
- `services/search.ts` — map search records → typed SearchResult[].
- `services/path.ts` — map shortestPath results → PathResult with restricted-pair
  checks.
- Return typed errors for empty/missing results so callers can render empty states.

## Out of scope
- Query definitions, API routes, UI.

## Acceptance criteria
- [ ] Mappers are pure (given Records → DTOs), typed, no `any`
- [ ] Invalid ids/types/depths rejected before DB access
- [ ] Empty results produce typed empty DTOs, not throws
- [ ] `npm run typecheck` passes