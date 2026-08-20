# T-023 — Widen path explorer "To" search results dropdown

| Field | Value |
|-------|-------|
| **ID** | T-023 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | bugfix |
| **Branch** | bugfix/path-to-search-width |
| **Depends on** | T-011 |
| **Blocks** | — |

## Problem

In the Path Explorer, the "To" target picker shares its column with the target
type chips, so the input (and its results dropdown, sized `w-full`) was only
~120px wide — search results were cramped and hard to read.

## Fix

In `components/path/EntityPicker.tsx` the dropdown and the "no matches" message
are now right-aligned (`right-0`) and use `w-full` with a
`min-w-[min(360px,calc(100vw-2rem))]` floor. The results list widens to 360px
(desktop) or the viewport minus padding (mobile), extending left over the chips
column instead of matching the narrow input. The From picker is unaffected
(its input is already wider than 360px, so `min-width` never applies there).

## Acceptance criteria
- [x] To search results dropdown is meaningfully wider than the input — live
      E2E: input measured 120px wide, dropdown 360px wide (left edge 673 vs
      input left 913), right-aligned to the input, not clipped.
- [x] Selecting a result still works — picked "Type 2 Diabetes" from the widened
      dropdown; the To picker showed its "Clear selection" chip.
- [x] From picker unchanged (its input is wider than the 360px floor).
- [x] `npm run typecheck`, `npm run lint` and `npm run build` green; verified
      live on the production server at localhost:3000.