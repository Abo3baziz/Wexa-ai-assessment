# T-010 — Related patients panel with click-through

| Field | Value |
|-------|-------|
| **ID** | T-010 |
| **Priority** | P1 |
| **Status** | todo |
| **Type** | feature |
| **Branch** | feature/related-patients |
| **Depends on** | T-008 |
| **Blocks** | — |

## Problem

Discovering patients connected to the selected patient through shared diseases,
medications, or doctors is a core product ability (prompt §8 Q3) and the reason
graph relationships matter. No UI exposes it.

## Goal

A "Related Patients" panel that lists patients connected via the graph (shared
disease/medication/doctor), shows the shared reasons and counts, allows
selecting a related patient to explore them, and handles empty/error states.

## Scope
- `components/RelatedPatients.tsx` — fetch `/api/patients/[id]/related`.
- Show each related patient with shared reasons (disease/medication/doctor) and
  connection counts (Q3 data).
- Selecting a related patient switches the explorer to that patient.
- Empty state ("no related patients found") and error + retry.
- Applying frontend-design + impeccable polish consistent with T-008 aesthetic.

## Out of scope
- Graph rendering (T-009), path explorer (T-011).

## Acceptance criteria
- [ ] Related patients listed with shared reasons + counts
- [ ] Click-through switches context to the related patient
- [ ] Empty and error states handled
- [ ] Typecheck/lint clean