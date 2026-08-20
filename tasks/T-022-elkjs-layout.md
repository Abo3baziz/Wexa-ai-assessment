# T-022 — ElkJS tree layout for the React Flow renderer

| Field | Value |
|-------|-------|
| **ID** | T-022 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/elkjs-layout |
| **Depends on** | T-020, T-011, T-021 |
| **Blocks** | — |

## Problem

The React Flow renderer (T-021) reused Cytoscape's force/breadthfirst layouts
headless, so it did not look like a tree and its edge labels scaled with zoom,
becoming unreadable when zoomed out. The goal is a proper hierarchical (tree)
layout via ElkJS and guaranteed readable labels on every connection.

## Goal

- The React Flow explorer lays out with **ElkJS layered** ("tree") growing
  **down from the root**, edges oriented away from the root via BFS.
- The React Flow path canvas lays out with ElkJS layered **RIGHT** (horizontal
  spine).
- Every edge renders its relationship label in **screen space** (constant size
  at any zoom) via a custom smoothstep edge.
- The Cytoscape engine is unchanged.

## Scope
- `lib/graph/elk.ts` — lazy-loaded elkjs (`elkjs/lib/elk.bundled.js`, dynamic
  import so SSR/prerender and the Cytoscape-only bundle stay lean),
  `orientEdgesAwayFromRoot` (BFS parent→child by depth), `computeElkTreeLayout`
  (layered, DOWN|RIGHT, node box 150×90).
- `components/graph/flow/LabeledEdge.tsx` — `LabeledSmoothStepEdge` custom edge
  (smoothstep path + `EdgeLabelRenderer` label that does not scale with zoom);
  `edgeTypes` map.
- `components/graph/flow/flowElements.ts` — `buildFlowNodes` takes an edge
  `orientation` ("vertical"|"horizontal") and uses ELK top-left positions
  directly (dropped the old center-offset + `LAYOUT_SCALE`); `buildFlowEdges`
  emits `type: "labeled-smoothstep"` with `data.rel`/`data.dimmed`.
- `components/graph/flow/FlowNode.tsx` — handles attach top/bottom (vertical) or
  left/right (horizontal) per orientation.
- `components/graph/ReactFlowCanvas.tsx` — async `applyLayout` via
  `computeElkTreeLayout(..., "DOWN")`, `edgeTypes` wired, selection effect also
  updates `data.dimmed` so dimmed edge labels dim too.
- `components/path/PathCanvas.tsx` — `PathCanvasFlow`/`PathFlowInner` use
  `computeElkTreeLayout(..., "RIGHT")` + horizontal orientation + manual fitView.
- `lib/graph/cytoscape.ts` — removed the now-dead headless
  `computeForceLayout`/`computePathLayout`/`LayoutResult`.
- `package.json` — added `elkjs@^0.12.0` (ships its own types).

## Out of scope
- Changing the Cytoscape engine or its layouts; new features beyond layout/labels.

## Acceptance criteria
- [x] Explorer uses ElkJS layered DOWN from the root — live E2E on Ashley Jones:
      node positions form a 3-level tree (root `Patient:pat-7` at y=40; 6 direct
      neighbors at y=260; 45 nodes at y=650) — a clean root-down hierarchy
      instead of a force-directed scatter.
- [x] Path canvas uses ElkJS layered RIGHT — live E2E Ashley→Sumatriptan (depth
      6) rendered 6 nodes in a single row (all y=40, evenly spaced x 40→1440)
      in path order.
- [x] Every connection shows its label — 61/61 explorer edges and 5/5 path
      edges rendered labels; labels live in the screen-space
      `EdgeLabelRenderer` and stay 10.5px while zooming 0.15→0.18 (constant
      size, unlike the built-in scaling label).
- [x] Selection dim/highlight parity — clicking a node dimmed 29/52 nodes,
      highlighted its 22 incident edge paths, and dimmed 39/61 edge labels
      (`data.dimmed` propagated by the selection effect).
- [x] Cytoscape engine unchanged and toggle works both ways — switching back to
      Cytoscape on the path view rendered the spine (11 elements, draw-layer
      pixels present).
- [x] `npm run typecheck`, `npm run lint`, `npm test` (55 tests) and
      `npm run build` all green; verified live on the production server at
      localhost:3000 with agent-browser.