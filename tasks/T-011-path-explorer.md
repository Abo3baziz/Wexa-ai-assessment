# T-011 — Path explorer (restricted pairs, Q4)

| Field | Value |
|-------|-------|
| **ID** | T-011 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/path-explorer |
| **Depends on** | T-009 |
| **Blocks** | — |

## Problem

Users should be able to explore *how* two entities are connected via
variable-length path traversal (prompt §8 Q4, §16). No UI exists, and an
"any pair" picker would risk long meaningless detours.

## Goal

A restricted Path Explorer where a user picks two entities (limited to
Patient↔Disease/Medication/Doctor/Patient pairs) and sees the connecting
shortestPath rendered as a node graph with relationship labels, plus
not-found/empty/error states.

## Scope
- `components/path/PathExplorer.tsx` — pair picker restricted to allowed pairs,
  depth capped (≤6), calls `/api/path`.
- Render `shortestPath` result in a small graph (reuse GraphView primitives or a
  compact path renderer) showing intermediate nodes + relationship types.
- "No path found within depth" empty state; error + retry.
- Applying frontend-design + impeccable polish.

## Out of scope
- Unrestricted pair selection, modifications to Q3/Q5 (T-010 / T-005).

## Decisions needed
- [x] Allowed pairs (**done: Patient↔Disease/Medication/Doctor/Patient, depth ≤6**)

## Acceptance criteria
- [x] Pair picker limited to allowed pairs — target-type chips (Disease /
      Medication / Doctor / Patient) + debounced entity search; only these four
      targets are selectable (Patient↔Patient supported).
- [x] shortestPath result rendered with relationship labels — compact
      Cytoscape canvas (`PathCanvas`) reusing the explorer stylesheet + a new
      left-to-right `runPathLayout` (breadthfirst); edge labels show the
      relationship type; start node gets the root ring; hop chips below the
      canvas list every node and relation with a hop count.
- [x] No-path and error states handled — idle ("Pick a patient and a target"),
      loading skeleton, "No path found within N hops" with guidance, and an
      error state with a retry button when the API reports a retryable failure.
- [x] Typecheck/lint clean — `npm run typecheck`, `npm run lint`, `npm test`
      (13), and `npm run build` all green.

## Implementation notes
- New: `components/path/PathExplorer.tsx`, `components/path/EntityPicker.tsx`,
  `components/path/PathCanvas.tsx`; `runPathLayout` in
  `lib/graph/cytoscape.ts`; `postApi` in `lib/fetchApi.ts`; a `"path"` view,
  breadcrumb, and header entry button in `app/page.tsx`.
- Query/service improvements so paths render with names: `pathBetween.ts` now
  returns `title` (display name) alongside the node `label` (type), and
  `mapPathResult` uses the title for the node label. Fixed a latent bug: the old
  `ALLOWED_NODE_TYPES` check rejected valid multi-hop paths through intermediate
  Visit/Diagnosis/Department nodes — the restricted-pair invariant is enforced
  by the picker + `requirePathTargetLabel` instead.
- Verified live: depth 4 vs 6 (Ashley Jones → Sumatriptan is 5 hops: not found
  at 4, found at 6 with canvas + all relationship labels); isolated medication
  (Furosemide) shows the "No path found" state; API rejects `depth` > 10 and
  non-allowlisted target labels with HTTP 400. Note: the route's `toStringValue`
  drops JSON-number `depth`, so the UI sends `depth` as a string.