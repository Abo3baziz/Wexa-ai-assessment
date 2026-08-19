# T-011 — Path explorer (restricted pairs, Q4)

| Field | Value |
|-------|-------|
| **ID** | T-011 |
| **Priority** | P2 |
| **Status** | todo |
| **Type** | feature |
| **Branch** | feature/path-explorer |
| **Depends on** | T-009 |
| **Blocks** | — |

## Problem

Users should be able to explore *how* two entities are connected via
variable-length path traversal (prompt §8 Q4, §16). No UI exists, and an
"any pair" picker would risk long meaningless detours.

## Goal

A restricted Path Explorer where a user picks two entities (limited to
Patient↔Disease/Medication/Doctor/Patient pairs) and sees the connecting
shortestPath rendered as a node graph with relationship labels, plus
not-found/empty/error states.

## Scope
- `components/PathExplorer.tsx` — pair picker restricted to allowed pairs,
  depth capped (≤6), calls `/api/path`.
- Render `shortestPath` result in a small graph (reuse GraphView primitives or a
  compact path renderer) showing intermediate nodes + relationship types.
- "No path found within depth" empty state; error + retry.
- Applying frontend-design + impeccable polish.

## Out of scope
- Unrestricted pair selection, modifications to Q3/Q5 (T-010 / T-005).

## Decisions needed
- [x] Allowed pairs (**done: Patient↔Disease/Medication/Doctor/Patient, depth ≤6**)

## Acceptance criteria
- [ ] Pair picker limited to allowed pairs
- [ ] shortestPath result rendered with relationship labels
- [ ] No-path and error states handled
- [ ] Typecheck/lint clean