# T-002 — Graph data model doc, Mermaid, and domain types

| Field | Value |
|-------|-------|
| **ID** | T-002 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | docs |
| **Branch** | docs/data-model |
| **Depends on** | T-001 |
| **Blocks** | T-004 |

## Problem

There is no authoritative schema. `prompt.md` §5–7 propose 8 node types and 9
relationships but leave modeling decisions open (e.g. whether `HAS_DISEASE` /
`TAKES` are redundant given visit-derived paths, and why `Diagnosis` /
`Prescription` are nodes). `docs/` does not exist. `types/index.ts` exists but
lacks current-state properties for `HAS_DISEASE` / `TAKES`.

## Goal

A single authoritative `docs/data-model.md` that a reviewer can read to
understand every node, property, and typed relationship and the modeling
rationale, plus domain types that match it exactly.

## Scope
- Create `docs/` and write `docs/data-model.md`:
  - Node property table for all 8 node types.
  - Relationship list with type, source, target, and direction.
  - Mermaid graph diagram matching the real schema.
  - Modeling rationale: `Diagnosis`/`Prescription` as property-bearing nodes;
    `HAS_DISEASE`/`TAKES` kept as **current-state** edges with `status` and
    `since` properties (current condition vs historical visit events).
- Extend `types/index.ts` so `Patient` supports `activeDiseases` / `activeMedications`
  or type companions for current-state edges, in lockstep with the doc.
- Grounding: `prompt.md` §5–7 (docs/ does not exist yet).

## Out of scope
- Driver, queries, seed, UI, API.

## Acceptance criteria
- [x] `docs/data-model.md` documents every node, property, relationship and the Mermaid diagram renders (verified: docs/data-model.md written with node table, relationship list, current-state rationale, mermaid LR diagram)
- [x] `types/index.ts` matches the documented schema (verified: added ConditionStatus/MedicationStatus, CurrentDisease/CurrentMedication, PatientHealthSummary to PatientOverview)
- [x] `npm run typecheck` passes (verified: clean)