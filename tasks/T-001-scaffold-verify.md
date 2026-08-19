# T-001 — Verify scaffold: typecheck and lint green

| Field | Value |
|-------|-------|
| **ID** | T-001 |
| **Priority** | P1 |
| **Status** | done |
| **Type** | chore |
| **Branch** | chore/scaffold-verify |
| **Depends on** | — |
| **Blocks** | T-002, T-003 |

## Problem

The project scaffold was created (package.json, tsconfig.json, next.config.mjs,
.eslintrc.json, tailwind.config.ts, postcss.config.js, .env.example, .gitignore)
but neither `npm run typecheck` nor `npm run lint` has been run against it. The
strict tsconfig (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`)
and next lint config may surface errors. Pending item: "Verify typecheck and lint on scaffold" from `tasks/01-scaffold.md`.

## Goal

The committed scaffold compiles and lints cleanly so every later task starts from
a known-green baseline.

## Scope
- Run `npm run typecheck` (`tsc --noEmit`) and `npm run lint`.
- Fix any strict-mode or lint errors that appear in scaffold/config files.
- Do not alter architecture decisions or add feature code.

## Acceptance criteria
- [x] `npm run typecheck` exits 0 with no errors (verified: tsc --noEmit clean)
- [x] `npm run lint` exits 0 with no errors (verified: next lint clean)
- [x] No scaffold files beyond init are required for both commands to pass (added app/layout.tsx, app/page.tsx, app/globals.css) 
  (verified: `npm run lint` initially failed without an app/ dir; minimal shell added)