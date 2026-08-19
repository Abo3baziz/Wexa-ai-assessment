# T-017 — American names with gender-consistent surnames in the seed

| Field | Value |
|-------|-------|
| **ID** | T-017 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/seed-american-names |
| **Depends on** | T-004 |
| **Blocks** | — |

## Problem

The seed (`scripts/seed/seed.ts`) used Arabic/Middle-Eastern first and last names
(Ahmed, Sara, …) and assigned each patient's `gender` randomly, independent of the
chosen first name. This made names feel inconsistent with a US-English demo and
broke the intuition that a first name implies a gender.

## Goal

Use American first names and surnames, and make the first name *determine* the
gender (Paul → male, Maria → female). Every person's surname comes from a shared
family (father's) surname list, used for both male and female patients. Doctors
follow the same gendered-first-name + family-surname pattern.

## Scope
- `scripts/seed/seed.ts`:
  - Replace `FIRST_NAMES` / `LAST_NAMES` with `MALE_FIRST_NAMES`,
    `FEMALE_FIRST_NAMES` (US first names) and `SURNAMES` (US family surnames).
  - Add `randomPersonName(rng)`: ~50/50 gender split, first name from the
    gender-appropriate pool (so it determines gender), surname from `SURNAMES`.
  - Patients derive `firstName`, `lastName`, `gender` from the helper (no more
    random `gender`).
  - Doctors derive `Dr. <first> <surname>` from the helper (gender discarded).
- Determinism, diseases, medications, departments, visits, diagnoses,
  prescriptions, edges, constraints and `generateDataset` remain unchanged.

## Out of scope
- Queries, API, UI, types, data-model doc (names/gender are opaque strings).

## Decisions needed
- [x] Name pools (**done: gendered US first-name pools + shared US SURNAMES list**)
- [x] Doctors (**done: same gendered-first-name + family-surname pattern**)
- [x] Gender split (**done: ~50/50 via `pick(["male", "female"])`**)

## Acceptance criteria
- [x] First name determines gender; no mismatches (verified: `generateDataset`
      over 30 patients produced 0 gender/first-name mismatches; 16 male / 14 female)
- [x] American first names and surnames (verified: e.g. "Karen Brown", "Dr. Cynthia Sanchez")
- [x] Surname from a shared family list used for both male and female patients
      (verified: `randomPersonName` returns `pick(SURNAMES)` for all genders)
- [x] Doctors follow the same naming pattern (verified: "Dr. <first> <surname>")
- [x] Determinism preserved (verified: fixed seed, `generateDataset` unchanged)
- [x] `npm run typecheck` and `npm run lint` green
