# T-025 — Fix truncated entity name in path explorer "To" field

| Field | Value |
|-------|-------|
| **ID** | T-025 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | bugfix |
| **Branch** | bugfix/path-to-target-layout |
| **Depends on** | T-011, T-023 |
| **Blocks** | — |

## Problem

In the Path Explorer's "To" column the target-type chips (Disease /
Medication / Doctor / Patient) sat **beside** the picker in the same row
(`flex gap-2`, chips `shrink-0`), squeezing the picker to ~120px. When an
entity was selected, the value chip (`label + subtitle + ✕`) truncated the
entity name until it effectively disappeared.

## Fix

In `components/path/PathExplorer.tsx` the target-type selector moved onto its
own row (the "To" label row, `flex flex-wrap items-center gap-2`) above the
picker, so the `EntityPicker` now gets the full column width. The selected
value chip renders the entity name in full; the wider input also makes the
results dropdown (already widened in T-023) match the field.

## Acceptance criteria
- [x] Entity name no longer disappears — live E2E: the To field measured 382px
      (was ~120px); selecting "Type 2 Diabetes" showed the full name with
      `nameTruncated: false` in the value chip ("Type 2 Diabetes" + "Metabolic"
      + ✕).
- [x] Target-type chips still work on their own row (wrap on narrow screens).
- [x] `npm run typecheck`, `npm run lint` and `npm run build` green; verified
      live on the production server at localhost:3000.