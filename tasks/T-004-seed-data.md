# T-004 — Seed script with constraints and deterministic data

| Field | Value |
|-------|-------|
| **ID** | T-004 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/seed-data |
| **Depends on** | T-002, T-003 |
| **Blocks** | T-005, T-013 |

## Problem

CognoDB has no data. `scripts/seed/` does not exist. Without a reproducible,
idempotent seed, the demo cannot run, traversals have nothing to explore, and
integration tests cannot be gated on a live instance.

## Goal

An idempotent `npm run seed` that populates CognoDB with a deterministic
synthetic dataset (~30 patients, 15 doctors, 8 departments, 25 diseases,
35 medications) with overlapping visits/diagnoses/prescriptions and current-state
edges, matching the schema in T-002.

## Scope
- `scripts/seed/seed.ts`: load env via `dotenv` reusing `config.ts`.
- Create uniqueness constraints/indexes on `id` per node label.
- Seeded PRNG (mulberry32, fixed seed) for deterministic output.
- MERGE nodes and relationships idempotently, in transactional batches.
- Current-state `HAS_DISEASE` / `TAKES` edges with `status` + `since`.
- Overlapping relationships so related-patient and multi-hop queries are interesting.
- Clear, non-credential-leaking failure messages.
- Wire `npm run seed` script in `package.json`.

## Out of scope
- Queries, API, UI.

## Decisions needed
- [x] Deterministic PRNG vs random (**done: seeded mulberry32, fixed seed**)

## Acceptance criteria
- [x] `npm run seed` runs against live `.env` instance and exits 0 (verified: completed; 30 patients, 15 doctors, 8 departments, 25 diseases, 35 medications, 104 visits, 147 diagnoses, 104 prescriptions)
- [x] Re-running is idempotent (no duplicates) (verified: graph cleared + reseeded; counts stable on re-run)
- [x] Constraints/indexes created (verified: CREATE CONSTRAINT ... REQUIRE ... IS UNIQUE)
- [x] Dataset sizes within targets and relationships overlap (verified: 9 relationship types; multi-hop and related-patient queries return results)
- [x] No credentials appear in any output (verified: only counts/messages printed)