# T-009 — Graph visualization and node detail panel

| Field | Value |
|-------|-------|
| **ID** | T-009 |
| **Priority** | P2 |
| **Status** | todo |
| **Type** | feature |
| **Branch** | feature/graph-viz |
| **Depends on** | T-008 |
| **Blocks** | T-011 |

## Problem

The medical relationship graph is the heart of the product, but there is no
visualization. A raw dump would be an unreadable "spaghetti graph" (prompt §16).
Users must identify node types, understand relationship types, select a node,
inspect details, and control expansion.

## Goal

A client-side relationship graph rendered with react-force-graph-2d that shows
the selected patient's medical subgraph, color-coded by node type, with
hover/selected labels, a legend, click-to-inspect details, and controlled
neighbor expansion — wired to the loading/empty/error states.

## Scope
- `components/GraphView.tsx` — react-force-graph-2d, dynamically imported with
  `ssr:false` (client-only canvas), colored nodes by type, link labels, card layout.
- `lib/graph/colors.ts` — node-type color/label maps shared with UI + legend.
- `components/NodeDetailPanel.tsx` — inspect selected node properties.
- Controlled expansion: show patient ego subgraph first; expand neighbors on click
  (no full-network dump).
- Graph table wrapper with loading/empty/error states.
- Compact for CognoDB free tier (small subgraph only).

## Out of scope
- Related-patients panel (T-010), path explorer (T-011).

## Decisions needed
- [x] Viz library (**done: react-force-graph-2d, dynamically imported**)

## Acceptance criteria
- [ ] Nodes color-coded by type with legend; links labeled by relationship type
- [ ] Click node → detail panel shows properties
- [ ] Expansion is controlled (no unreadable full-graph dump)
- [ ] Handles loading/empty/error states
- [ ] `ssr:false` and typecheck-clean