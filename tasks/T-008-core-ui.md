# T-008 — Core UI shell, search, overview, and states

| Field | Value |
|-------|-------|
| **ID** | T-008 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/core-ui |
| **Depends on** | T-007 |
| **Blocks** | T-009, T-010 |

## Problem

No UI exists. The product must be usable by a non-technical hospital staff user
(prompt §13) with a clean flow: search → select patient → overview → explore
history → discover related patients, with explicit loading/empty/error/success
states (prompt §15) and a connection-status banner.

## Goal

A polished, responsive explorer shell (per the frontend-design + impeccable
skills: intentional clinical aesthetic, clear hierarchy, accessible) that
searches and selects a patient, shows an overview with stat cards, and renders
all required UI states, including a graceful DB-unavailable banner with retry.

## Scope
- `app/layout.tsx` + `app/globals.css` — base shell, fonts, background (design tokens).
- `app/page.tsx` — explorer shell: header + search + main panel.
- `components/PatientSearch.tsx` — debounced, typed results (Patient/Doctor/
  Disease/Medication), keyboard accessible, empty-match state.
- `components/PatientOverview.tsx` + `components/StatCards.tsx` — name, DOB,
  gender, Diseases/Visits/Medications/Doctors counts.
- `components/states/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx` (with Retry).
- Connection-status banner wired to `/api/health`.
- Responsive layout; focus states; no raw stack traces surfaced.
- Apply frontend-design and impeccable skills rather than default template look.

## Out of scope
- Graph visualization (T-009), related-patient panel (T-010), path explorer (T-011).

## Acceptance criteria
- [x] Search returns typed results and handles empty matches — `components/PatientSearch.tsx` (debounced 250ms, Patient/Doctor/Disease/Medication with type dots, non-patient rows disabled, "No matches" empty state, arrow/enter keyboard nav, combobox/listbox ARIA).
- [x] Patient overview + stat cards render from history endpoint — `components/PatientOverview.tsx` + `components/StatCards.tsx` render `/api/patients/[publicId]/history` (name, publicId, DOB, gender, Diseases/Visits/Medications/Doctors, current conditions/medications).
- [x] Loading/empty/error states visible for their relevant cases — `components/states/{LoadingState,EmptyState,ErrorState}.tsx`; page routes among them.
- [x] DB-unavailable banner with retry on connection failure — `components/ConnectionBanner.tsx` polls `/api/health`; offline state shows message + Retry.
- [x] Layout responsive, accessible, intentionally designed — dark clinical shell (existing navy/graph-node theme), responsive (mobile stack), focus-visible rings, `prefers-reduced-motion` respected, browser surfaces (selection/scrollbar) themed; frontend-design + impeccable skills applied.
- [x] UI code imports no server-only modules / DB access — page/components are `"use client"`; data via `lib/fetchApi.ts` (client-safe), never importing `lib/cognodb/*`.

## Notes / fixes landed while building
- `lib/cognodb/queries/runner.ts`: neo4j `Record`s are now flattened recursively (Nodes/Relationships/Integers → plain objects) so the service layer's `.field` access works. This was silently dropping all data on every query.
- `lib/cognodb/queries/pathBetween.ts` + `connectedPatients.ts`: Neo4j forbids parameters inside variable-length bounds (`[*1..$max]` is a syntax error); depth is now clamped and interpolated as a literal.
- `app/page.tsx` selects the patient's `publicId` (the search `subtitle`) so the history route receives a valid identifier.