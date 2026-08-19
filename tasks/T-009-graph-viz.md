# T-009 — Graph visualization and node detail panel

| Field | Value |
|-------|-------|
| **ID** | T-009 |
| **Priority** | P2 |
| **Status** | done |
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

A client-side relationship graph rendered with React Flow (@xyflow/react) that
shows the selected patient's medical subgraph, color-coded by node type, with
full node labels, relationship labels on edges, a legend, click-to-inspect
details, controlled neighbor expansion, and a dagre auto-layout (LR rankdir) so
nodes do not overlap — wired to the loading/empty/error states.

## Scope
- `components/GraphView.tsx` — React Flow (@xyflow/react) client-only graph with
  colored nodes by type, full node labels, relationship labels on edges, dagre
  auto-layout, and card layout.
- `lib/graph/colors.ts` — node-type color/label maps shared with UI + legend.
- `components/NodeDetailPanel.tsx` — inspect selected node properties.
- Controlled expansion: show patient ego subgraph first; expand neighbors on click
  (no full-network dump).
- Graph table wrapper with loading/empty/error states.
- Compact for CognoDB free tier (small subgraph only).

## Out of scope
- Related-patients panel (T-010), path explorer (T-011).

## Decisions needed
- [x] Viz library (**done: React Flow / @xyflow/react, client-only**)

## Acceptance criteria
- [x] Nodes color-coded by type with legend; links labeled by relationship type
      (`lib/graph/colors.ts` maps `NodeType` → color/label; `GraphView.tsx` fills
      each node by type; `GraphSection.tsx` renders a legend of present types)
- [x] Click node → detail panel shows properties
      (`GraphSection.tsx` `handleNodeClick` sets selection →
      `NodeDetailPanel.tsx` lists non-hidden node properties)
- [x] Expansion is controlled (no unreadable full-graph dump)
      (`GraphSection.tsx` reveals the patient ego-subgraph first and expands a
      clicked node's immediate neighbors only)
- [x] Handles loading/empty/error states
      (`GraphSection.tsx` renders a pulse skeleton, `EmptyState` for no graph,
      and an error box with retry via the API error envelope)
- [x] `ssr:false` and typecheck-clean
      (`GraphView.tsx` is a `"use client"` component using `@xyflow/react` with
      `react-dom/client`-rendered canvas — no SSR graph; `npm run typecheck` and
      `npm run lint` are green)