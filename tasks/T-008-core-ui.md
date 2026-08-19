# T-008 — Core UI shell, search, overview, and states

| Field | Value |
|-------|-------|
| **ID** | T-008 |
| **Priority** | P1 |
| **Status** | todo |
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
- [ ] Search returns typed results and handles empty matches
- [ ] Patient overview + stat cards render from history endpoint
- [ ] Loading/empty/error states visible for their relevant cases
- [ ] DB-unavailable banner with retry on connection failure
- [ ] Layout responsive, accessible, intentionally designed
- [ ] UI code imports no server-only modules / DB access