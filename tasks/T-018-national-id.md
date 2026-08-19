# T-018 — Patient national ID + search by national ID

| Field | Value |
|-------|-------|
| **ID** | T-018 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/national-id |
| **Depends on** | T-017 |
| **Blocks** | — |

## Problem

Patients were identified only by `publicId` (`P-1001`) and could only be found
by name. There was no realistic national identity number and no way to look a
patient up by it.

## Goal

Give every patient a unique national ID and allow search to match by name *or*
national ID. `publicId` remains the API/URL identity key; `nationalId` is an
additional searchable property.

## Scope
- `types/index.ts`: add `nationalId` to `Patient`.
- `scripts/seed/seed.ts`:
  - Add `nationalId` to the `Patient` interface and generation (unique 12-digit
    numeric ID via `randomNationalId`, re-picking on collision).
  - Write `nationalId` in the Patient MERGE.
  - Add a unique constraint on `Patient.nationalId`.
- `lib/cognodb/queries/search.ts`: match patients by name **or** national ID;
  show national ID as the patient result subtitle.
- `services/record.ts` + `services/patient.ts`: map `nationalId` (incl. empty
  fallbacks).
- Row interfaces in `patientHistory.ts`, `carePathway.ts`, `relatedPatients.ts`,
  `connectedPatients.ts`: add `nationalId` to the patient shape.
- UI: show national ID in `PatientOverview`; update search placeholder; hide it
  in `NodeDetailPanel` (`HIDDEN_KEYS`).
- `docs/data-model.md`: document `nationalId` on `Patient`.
- `tests/integration/db.test.ts`: assert `nationalId` present and searchable.

## Out of scope
- Replacing `publicId` (stays the URL/identity key). Routing/validation unchanged.

## Decisions needed
- [x] Replace or add (**done: add `nationalId` alongside `publicId`**)
- [x] ID format (**done: generic 12-digit numeric**)
- [x] Search scope (**done: name OR national ID**)

## Acceptance criteria
- [x] Each patient has a unique national ID (verified: live DB, 0 duplicate nationalIds)
- [x] Search matches patients by national ID (verified: search by a nationalId returns 1 patient hit)
- [x] `publicId` still used as the identity/URL key (verified: routes/validation untouched)
- [x] National ID surfaced in the UI (verified: PatientOverview shows `NID <id>`)
- [x] Schema documented (verified: `docs/data-model.md` Patient row updated)
- [x] `npm run typecheck` and `npm run lint` green; seed runs against live instance
