# T-026 — Scale seed to a large demo dataset

| Field | Value |
|-------|-------|
| **ID** | T-026 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feat |
| **Branch** | feature/large-seed |
| **Depends on** | T-004 |
| **Blocks** | — |

## Problem

The seed produced a small demo (~30 patients). The user asked for a large
dataset (~1500 patients).

Scaling the count alone broke two committed features: with the fixed
25-disease / 35-medication catalog every entity is shared by hundreds of
patients, so the graph explorer's depth-2 ego query returned 3302 nodes
(unrenderable) and the path explorer's `shortestPath` was killed by the
managed DB ("Connection was closed by server" after ~21s). A 500-patient
test still returned 1629 nodes at depth 2.

## Decision (confirmed with user)

**Smaller seed instead** — scale to a size that keeps current behavior intact
with **no query changes**. The real density driver was that every patient
accumulated ~7 *current* diseases (one random disease per visit diagnosis), so
the fix also caps each patient's current conditions to realistic, sparse
numbers.

## Solution (`scripts/seed/seed.ts`)

- Default **250 patients** (≈8× the original; still a "large" demo), with a
  `SEED_PATIENTS` env override; doctors 40, departments 10.
- **Current-condition caps**: each patient keeps at most 3 `HAS_DISEASE` and 2
  `TAKES` edges (`maxCurrentDiseases`/`maxCurrentMedications`) — visit/diagnosis/
  prescription history stays rich; only the current-state edges that drive the
  ego-graph fan-out are bounded.
- **Batched writes**: `runBatched` chunks each `UNWIND` into 500-row statements
  so thousands of visits/diagnoses/prescriptions don't exceed per-request
  limits.
- Deterministic (same `mulberry32` seed), idempotent (clears first), unchanged
  constraints and entity catalog.

## Acceptance criteria
- [x] `npm run seed` completes against the live instance: 250 patients, 40
      doctors, 10 departments, 25 diseases, 35 medications, 885 visits, 1316
      diagnoses, 885 prescriptions.
- [x] Graph explorer stays usable — depth 2 returned ~292 nodes; verified
      rendered live in both engines (Cytoscape 309 nodes / 336 edges; React
      Flow 309 nodes / 336 edges, all edges labeled). Depth 3 = 767 nodes
      (opt-in "full reveal", still completes).
- [x] Path explorer works — Melissa Harris → Type 2 Diabetes traced a 3-hop
      path (~3.5s) with labels on every edge; a not-found case resolved in
      254ms.
- [x] `npm run typecheck`, `npm run lint` and `npm test` green.
- [x] Density limits documented in the `SEED` comment (why 1500/500 are not
      viable with the fixed catalog).