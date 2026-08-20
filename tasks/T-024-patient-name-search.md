# T-024 — Pure "Name" patient search mode

| Field | Value |
|-------|-------|
| **ID** | T-024 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/patient-name-search |
| **Depends on** | T-007 (search route), T-008 (search UI) |
| **Blocks** | — |

## Problem

The header search's only patient-name option ("Name + ID") matched names **or**
national IDs, so there was no way to search strictly by patient name.

## Goal

Add a dedicated **"Name"** search chip that matches patients by name only,
distinct from "Name + ID" (name or ID) and "National ID" (ID only).

## Scope
- `lib/cognodb/queries/search.ts` — new `"name"` mode in `SEARCH_MODES` +
  `SEARCH_MODE_TYPE` (`Patient`); patient `WHERE` branch now keys off two
  boolean parameters (`$matchName`, `$matchId`) computed from the mode instead
  of the old `$mode <> 'national-id'` test, keeping the query fully
  parameterized. Matching semantics unchanged for existing modes
  (`all`/`patient-name` = name OR id, `national-id` = id only).
- `components/PatientSearch.tsx` — `"Name"` chip (between All and National ID)
  with placeholder "Search a patient by name".
- `tests/services/validate.test.ts` — `requireSearchMode("name")` accepted.
- The `/api/search` route needs no change: `requireSearchMode` validates via
  `SEARCH_MODES.includes`, so the new mode passes through automatically.

## Out of scope
- Path explorer pickers (already search patients by name); changing existing
  mode semantics.

## Acceptance criteria
- [x] Header shows a "Name" chip — live E2E on the production server.
- [x] "Name" mode matches by name only — searching `528207` (a national ID)
      returned "No matches for 528207"; searching `Ashley` returned Ashley
      Jones and Ashley Sanchez.
- [x] Existing modes unaffected — "Name + ID" still returned Ashley Jones for
      `528207`.
- [x] `npm run typecheck`, `npm run lint`, `npm test` (55 tests) and
      `npm run build` all green.