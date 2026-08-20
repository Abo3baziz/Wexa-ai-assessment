# T-021 — Graph engine toggle: feature-parity React Flow renderer

| Field | Value |
|-------|-------|
| **ID** | T-021 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/graph-engine-toggle |
| **Depends on** | T-020, T-011 |
| **Blocks** | — |

## Problem

The graph explorer runs on Cytoscape.js (T-020), but there is no way to
compare it against another rendering engine. The old React Flow renderer
(T-009) was deleted when Cytoscape replaced it. Users should be able to
switch engines at runtime and get the **same features** in both.

## Goal

A header control that switches the graph engine between **Cytoscape.js** and
**React Flow** (persisted in localStorage, default Cytoscape). The React Flow
renderer must match every feature of the Cytoscape explorer and the path
explorer canvas.

## Decisions (confirmed)
- **Layout**: React Flow uses the *same* algorithms by running Cytoscape
  **headless** (force cose-bilkent for the explorer, breadthfirst for paths)
  and feeding the computed positions to React Flow — true visual parity.
- **Persistence**: engine choice stored in localStorage (`hge.graph-engine`).
- **Scope**: toggle applies to the main Graph Explorer **and** the path
  explorer's shortest-path canvas.
- **Bundle**: static import of `@xyflow/react` (both engines shipped).

## Scope
- `components/GraphEngineToggle.tsx` — header popover menu with the two
  engines, checkmark on active, outside-click close; `useGraphEngine()` hook.
- `lib/graph/engine.ts` — `GraphEngine` type + localStorage read/write.
- `lib/graph/cytoscape.ts` — headless `computeForceLayout` /
  `computePathLayout` returning positions by cytoscape node id.
- `components/graph/ReactFlowCanvas.tsx` — React Flow renderer implementing
  the same `GraphCanvasHandle` (zoom in/out, fit, resetLayout, center on
  root) with parity: Obsidian-style nodes (per-type shapes, root ring,
  selected ring, hover), always-visible edge labels, selection dimming +
  neighbor-edge highlight, drag/pan/wheel-zoom, click select / pane deselect.
- `components/graph/GraphExplorer.tsx` — `library` prop switching between
  `GraphCanvas` (Cytoscape) and `ReactFlowCanvas`.
- `components/path/PathCanvas.tsx` — `library` prop; React Flow variant
  renders the breadthfirst spine read-only (edge labels, root ring).
- `app/page.tsx` — engine state at top level, toggle in header, prop drilling.

## Out of scope
- Changing explorer behavior; new layouts; React Flow for other surfaces.

## Acceptance criteria
- [x] Header toggle switches engine, persisted across reloads (default Cytoscape) —
      `components/GraphEngineToggle.tsx` + `lib/graph/engine.ts` (localStorage
      `hge.graph-engine`); E2E: toggled Cytoscape→React Flow in the header menu,
      reloaded and the header still read "Engine React Flow"; fresh session
      defaults to Cytoscape.
- [x] React Flow explorer parity: depth 1|2|3 reveal, type filters, expand
      relationships, node detail panel, patient click-through, legend, root
      ring, selected/hover/dim highlight, always-visible edge labels,
      drag/pan/zoom, zoom/fit/center controls, empty/loading/error states —
      `components/graph/ReactFlowCanvas.tsx` (same `GraphCanvasHandle`:
      zoomIn/zoomOut/fit/resetLayout/centerOnRoot). E2E on Ashley Jones:
      52 nodes + 61 labeled edges at depth 2; depth 3 revealed 169 nodes / 276
      edges; Patient filter removed all Patient nodes; selecting a node dimmed
      45/52 nodes, highlighted its 6 incident edges (stroke #8fa0c8) and dimmed
      the other 55; detail panel opened for disease and patient nodes;
      "Open Patient Profile" navigated to Carol Rodriguez's overview; zoom-in,
      fit-viewport, reset-layout and center-on-root all moved the viewport as
      expected. Headless cose-bilkent layout (`computeForceLayout`, scaled 2.5×)
      gives visual parity; invisible `<Handle>` anchors (left/right) were
      required for edges to draw.
- [x] Path explorer canvas switchable to React Flow (same spine, edge labels) —
      `PathCanvas`/`PathExplorer` take a `library` prop; `PathCanvasFlow` reuses
      the headless breadthfirst layout. E2E: Ashley→Sumatriptan at depth 6
      rendered 6 nodes / 5 labeled edges (HAS_DISEASE×4, TAKES) in React Flow,
      and re-rendered on the Cytoscape canvas after switching back.
- [x] Typecheck/lint/test/build green; both engines verified live —
      `npm run typecheck`, `npm run lint`, `npm test` (55 tests), `npm run build`
      all pass; engine switching verified in the production server on
      localhost:3000 with agent-browser.