# T-019 — Selectable search mode + clickable entity results

| Field | Value |
|-------|-------|
| **ID** | T-019 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/search-mode |
| **Depends on** | T-008, T-018 |
| **Blocks** | — |

## Problem

Search was a single free-text box that matched patients (by name or national ID),
doctors, diseases and medications — with no way to scope it, and no Department
support. Non-patient results were shown but not clickable, so a user could not
explore a doctor, department, disease or medication beyond a name.

## Goal

Let the user choose a search mechanism via buttons (All, National ID, Name + ID,
Doctor, Medication, Department, Disease) and make every result clickable — patients
open their overview, and other entities open an entity detail + expandable graph
with breadcrumb navigation and patient click-through.

## Scope
- `lib/cognodb/queries/search.ts`: add Department branch; `$mode` + `$type` params
  (`national-id` matches only the ID; `patient-name`/`all` match name or ID);
  post-UNION type filter; `searchEntities(q, limit, mode)`.
- `lib/cognodb/queries/entityGraph.ts` (new): `findEntityGraph(type, id)` returns
  the root + neighborhood relationships within 3 hops (reaches patients).
- `services/entityGraph.ts` (new): `buildEntityGraphPayload` (deduped GraphPayload,
  root always included) + `buildEntitySummary`.
- `services/validate.ts`: `SEARCH_MODES` + `requireSearchMode`;
  `ENTITY_GRAPH_LABELS` + `requireEntityGraphLabel`.
- `app/api/search/route.ts`: accept + validate `mode`.
- `app/api/entities/[type]/[id]/graph/route.ts` (new): entity graph endpoint.
- `components/PatientSearch.tsx`: flat 7-chip mode row (All default), mode-aware
  placeholder, all results clickable.
- `components/EntityGraphSection.tsx` (new): entity detail + expandable graph
  (root + direct neighbors first, expand on click); Patient node → open overview.
- `app/page.tsx`: entity view state + breadcrumb navigation.
- `types/index.ts`: `EntitySummary`.
- `tests/integration/db.test.ts`: mode-scoped search + entity graph tests.

## Out of scope
- Path explorer (T-011). Changing patient `publicId` identity (T-018 kept).

## Decisions needed
- [x] Non-patient entities clickable (**done: open entity detail + expandable graph**)
- [x] Mode UI (**done: flat 7-chip row, wraps on mobile**)
- [x] Default mode (**done: All**)
- [x] Department search (**done: added**)
- [x] Breadcrumb navigation (**done**) + root/direct-neighbors reveal (**done**)

## Acceptance criteria
- [x] Search scopes by selected mode (verified: doctor mode returns only doctors;
      department mode returns departments; national-id mode returns only patients)
- [x] Department is searchable (verified: `Department of ...` results returned)
- [x] Non-patient results are clickable and open an entity view (verified: entity
      graph endpoint returns the entity neighborhood incl. patients)
- [x] Entity graph reveals root + direct neighbors, expands on click (verified:
      EntityGraphSection mirrors GraphSection reveal/expansion)
- [x] Patient click-through from an entity graph (verified: Patient nodes carry
      `publicId` used to load the overview)
- [x] Breadcrumb navigation (verified: Home › current patient/entity)
- [x] `npm run typecheck`, `npm run lint`, `npm run build` green; integration tests pass (14/14)
