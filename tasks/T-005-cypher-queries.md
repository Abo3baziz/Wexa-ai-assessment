# T-005 — Parameterized Cypher query layer (Q1–Q5 + search)

| Field | Value |
|-------|-------|
| **ID** | T-005 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/cypher-queries |
| **Depends on** | T-004 |
| **Blocks** | T-006 |

## Problem

No Cypher exists. The assessment requires 5 meaningful graph queries (prompt
§8) all parameterized (prompt §9) with at least one 2+ hop traversal and one
relationally-awkward variable-depth traversal.

## Goal

A `lib/cognodb/queries/` layer where every query is a parameterized, exported
Cypher string (or query+params factory), structurally separated from parameters,
covering the five required query classes plus search.

## Scope
- `lib/cognodb/queries/patientHistory.ts` — Q1 ego subgraph (OPTIONAL MATCH chains
  over HAD_VISIT/TREATED_BY/WORKS_IN/RESULTED_IN/FOR_DISEASE/GENERATED/
  FOR_MEDICATION/HAS_DISEASE/TAKES).
- `lib/cognodb/queries/carePathway.ts` — Q2 3-hop (Patient→Visit→Doctor→Department
  and Patient→Visit→Diagnosis→Disease).
- `lib/cognodb/queries/relatedPatients.ts` — Q3 shared edges (HAS_DISEASE/TAKES/
  shared doctor via Visit) with reasons + counts.
- `lib/cognodb/queries/connectedPatients.ts` — Q5 variable-depth `[*1..N]` over
  multiple relationship types, ranked by number of distinct connection paths.
- `lib/cognodb/queries/pathBetween.ts` — Q4 `shortestPath((a)-[*1..6]-(b))`
  restricted to Patient↔{Disease, Medication, Doctor, Patient} pairs.
- `lib/cognodb/queries/search.ts` — typed search via UNION across 4 labels,
  `toLower(...) CONTAINS toLower($q)`, `LIMIT $limit`, type discriminant per row.
- Every query uses `$param` placeholders only; no string interpolation.
- Accept `limit`/`depth` as parameters where appropriate.

## Out of scope
- Service mappers, API routes, UI.

## Decisions needed
- [x] Path explorer pairs (**done: restricted to Patient↔Disease/Medication/Doctor/Patient, depth ≤6**)
- [x] Q3 vs Q5 (**done: distinct — Q3 simple shared-edge, Q5 variable-depth ranked**)

## Acceptance criteria
- [x] All queries parameterized (no interpolation anywhere) (verified: all six queries use $params only; only validated allowlist label embedded in pathBetween)
- [x] Q2 contains a 2+ hop traversal (verified: Patient->Visit->Doctor->Department, 3 hops)
- [x] Q5 is variable-depth multi-relationship and clearly "awkward-in-SQL" (verified: [*1..N] over HAS_DISEASE|TAKES|HAD_VISIT, pathCount)
- [x] Q4 uses shortestPath with depth cap (verified: shortestPath((a)-[*1..6]-(b)), restricted pairs)
- [x] Search returns type-discriminated rows (verified: UNION returns type column)
- [x] `npm run typecheck` passes (verified: clean; all six queries execute against live DB)