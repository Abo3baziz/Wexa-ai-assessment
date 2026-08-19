# T-016 — Screenshots, screen recording, and repo cleanup

| Field | Value |
|-------|-------|
| **ID** | T-016 |
| **Priority** | P2 |
| **Status** | todo |
| **Type** | chore |
| **Branch** | chore/final-cleanup |
| **Depends on** | T-015 |
| **Blocks** | — |

## Problem

Definition of Done requires screenshots of the actual UI, a short screen
recording, and a clean reviewable repo with no committed credentials (prompt
§26). These artifacts do not yet exist.

## Goal

A final polish pass that captures UI screenshots and a short screen recording,
links them from the README, and verifies the repository contains no secrets and
no stray/unreviewable files.

## Scope
- Capture screenshots of search, patient overview, graph, related patients, and
  path explorer into `public/` (referenced by README via T-014).
- Prepare a short screen recording walking the core flow; link in README.
- Audit repo: confirm no `.env*` with real creds committed, no `node_modules`,
  no build artifacts, `gitignore` respected.
- Remove old phase files (`tasks/01-*.md` … `tasks/09-*.md`) superseded by the
  T-XXX backlog (post-migration).
- Final `npm run typecheck` + `npm run lint` + `npm test` green.

## Out of scope
- Any feature work not already shipped.

## Acceptance criteria
- [ ] Screenshots present in `public/` and referenced in README
- [ ] Screen recording prepared and linked
- [ ] No credentials committed; gitignore respected
- [ ] Old phase task files removed; `typecheck`/`lint`/`test` green