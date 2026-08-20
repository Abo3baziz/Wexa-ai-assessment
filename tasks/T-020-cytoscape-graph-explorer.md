# T-020 — Obsidian-style graph explorer on Cytoscape.js

| Field | Value |
|-------|-------|
| **ID** | T-020 |
| **Priority** | P2 (graph is the core assessment feature but the demo has no real traffic) |
| **Status** | done |
| **Type** | feature |
| **Branch** | feature/cytoscape-graph-explorer |
| **Depends on** | T-009 (replaces its React Flow implementation), T-010 (reuses related-patient data) |
| **Blocks** | T-014 (README must document the new explorer) |

## Problem

`PROMPT.md` mandates an Obsidian Graph View-style interactive explorer rendered
with **Cytoscape.js**, with force-directed layout, depth control, node-type
filters, selection highlighting, and related-patient explanation. The current
graph (T-009) uses **React Flow + dagre** with a hierarchical LR layout — the
prompt explicitly forbids this ("DO NOT replace Cytoscape.js with React Flow,
D3, or another graph library"). The graph is the assessment's core deliverable
(multi-hop traversal, related-patient discovery), so this must feel like a
polished network explorer, not a flowchart widget.

## Goal

Replace React Flow with an Obsidian-inspired Cytoscape.js explorer: dark
floating canvas, thin relationship lines, force-directed layout, smooth
zoom/pan/fit/reset, node-type filters, server-validated depth (1–3, default 2),
click-to-select with neighbor highlight + dimming, a type-aware details panel,
client-side expansion (no re-query when data is local), and an explanation of
*why* a discovered patient is related. Preserves loading/empty/error states and
the existing entity explorer by migrating it onto the same component.

## Scope

- **Dependencies**: add `cytoscape` + `cytoscape-cose-bilkent` (and types);
  remove `@xyflow/react`, `dagre`, `@types/dagre`.
- **`components/graph/`** (new modular folder, existing conventions):
  - `GraphExplorer.tsx` — state container: payload load (patient or entity
    root), depth, filters, selection, reveal-set expansion; renders canvas,
    controls, filters, legend, details panel; loading/empty/error states with
    PROMPT copy.
  - `GraphCanvas.tsx` — `"use client"` Cytoscape mount: stylesheet, layout run,
    zoom/pan/fit/reset/center actions (imperative handle), tap + hover wiring,
    selection highlight (dim unrelated, emphasize neighbors + their edges).
  - `GraphControls.tsx` — zoom in/out, fit, reset layout, center on root,
    depth selector `[1][2][3]` (default 2).
  - `GraphFilters.tsx` — node-type checkboxes (Patients, Doctors, Visits,
    Diseases, Medications, Departments, + Diagnosis/Prescription).
  - `GraphDetailsPanel.tsx` — type-aware selected-node details; actions
    `Open Patient Profile` (Patient) and `Expand Relationships`; for a
    non-root Patient, shows the *why* (shared disease / medication / doctor
    from the existing related-patients payload); bottom-sheet/overlay on
    small screens.
  - `GraphLegend.tsx` — legend of node types present.
- **`lib/graph/`**:
  - `cytoscape.ts` — isolated Cytoscape code: stylesheet (dark canvas, node
    shapes + colors per type, thin edges), layout options, element factory.
  - `graph-types.ts` — `GraphDepth`, `GraphFilters`, `SelectedNode`,
    `RelationshipType` (added to `types/index.ts`).
  - `graph-transform.ts` — business logic, Cytoscape-free and unit-testable:
    payload → elements, filter application (hide nodes + orphan edges),
    neighbor/highlight sets.
- **Server**:
  - New `lib/cognodb/queries/patientGraph.ts` — bounded multi-hop ego
    neighborhood (patient root, variable-length traversal). Neo4j cannot
    parameterize hop counts, so the safest alternative is used: depth is
    validated against an allowlist `1|2|3` server-side and selects one of
    **three pre-written constant query strings** (zero string interpolation of
    user input; matches the `PATH_TARGET_LABELS` allowlist precedent).
  - `services/graph.ts` — `buildNeighborhoodPayload` mapper (dedup nodes +
    edges, mirrors `services/entityGraph.ts` pattern).
  - `app/api/patients/[publicId]/graph/route.ts` — accept `?depth=1|2|3`
    (validated, default 2, never unlimited).
  - `app/api/entities/[type]/[id]/graph/route.ts` — keep, entity explorer
    migrates to the same `GraphExplorer` component.
- **Entry point**: patient profile gains an **"Explore Graph"** action that
  opens the explorer as a dedicated view (breadcrumb Home › Patient › Graph);
  `components/GraphSection.tsx` + `components/GraphView.tsx` (React Flow)
  are replaced and removed; `EntityGraphSection.tsx` delegates to
  `GraphExplorer`.
- **Unit tests** under `tests/services/`: graph-transform filters + payload
  builder (offline, vitest).
- **Related-patient explanation**: fetch the existing related-patients payload
  once alongside the graph; the details panel explains connections without new
  queries per click (perf rule: no re-query when data is local).

## Out of scope

- README documentation (already assigned to T-014; T-014 must document the new
  explorer), screenshots (T-016), Vercel deploy (T-015), path explorer (T-011).

## Decisions needed

- [x] Viz library (**done: Cytoscape.js — mandated by PROMPT.md**)
- [x] Layout (**done: `cose-bilkent` via `cytoscape-cose-bilkent` — best
      Obsidian-like force-directed quality for small/medium subgraphs; fall
      back to built-in `cose` if the plugin misbehaves**)
- [x] Depth handling (**done: Neo4j cannot parameterize hop counts → depth
      allowlist `1|2|3` selects one of three constant query strings; no
      interpolation of user input**)
- [x] Expansion (**done: the depth-bounded payload is revealed in full, so the
      depth control directly shows more/fewer hops; "Expand Relationships"
      loads the clicked node's 1-hop ego neighborhood via a new bounded query
      (`/api/nodes/[type]/[id]/graph`) and merges it into the payload —
      an explicit user action to fetch data that does not exist locally,
      which the perf rule allows**)
- [x] Related explanation (**done: reuse existing related-patients endpoint
      data in the details panel**)
- [x] Entity explorer (**done: migrate onto the same GraphExplorer component;
      no second viz library**)

## Acceptance criteria

- [x] Cytoscape.js replaces React Flow; `@xyflow/react`, `dagre`,
      `@types/dagre` removed; `npm run typecheck` and `npm run lint` green
      (evidence: `package.json`/`package-lock.json`, both commands pass)
- [x] Obsidian-like experience: dark canvas, force-directed layout (cose-bilkent
      with fit-on-stop), thin relationship lines with relationship labels
      always visible, zoom/pan/fit/reset/center-on-root, node hover feedback,
      plenty of empty space, root patient visually prominent (white ring)
- [x] "Explore Graph" entry on the patient profile opens the explorer centered
      on the patient (verified live: depth 1 → 7 nodes, depth 2 → 52,
      depth 3 → 169 nodes incl. Department/Doctors)
- [x] Depth control `[1][2][3]` default 2; depth validated server-side
      (allowlist), never unlimited; API rejects invalid depth
      (`depth=99` → 400, verified live)
- [x] Multi-hop neighborhood query is parameterized, bounded, and mapped to a
      deduplicated `{ nodes, edges }` payload (typed `GraphNode`/`GraphEdge`,
      no raw driver objects to the client); three constant query strings —
      zero interpolation of user input
- [x] Node-type filters hide nodes and their orphaned edges client-side
      (unit-tested in `tests/services/graph-transform.test.ts`)
- [x] Node selection highlights the node, dims unrelated nodes, highlights
      directly connected nodes and their edges; details panel updates per type
      (verified live: Amlodipine tap → 1 selected, 5 dimmed, `TAKES` edge
      highlighted, panel shows Medication details)
- [x] Expand Relationships loads the node's 1-hop ego neighborhood
      (`/api/nodes/[type]/[id]/graph`, allowlist-validated type, 400 on
      invalid) and merges it into the payload (dedupe unit-tested); invalid
      types rejected
- [x] Selecting a non-root Patient explains the connection (shared disease /
      medication / doctor) using existing related-patient data — never just
      "Related"
- [x] Loading ("Loading patient relationships..."), empty ("No graph
      relationships available yet…"), and friendly error ("Unable to load the
      patient graph. Please try again.") states; no credentials/stack
      traces/raw Cypher exposed (uniform `handle()` error envelope)
- [x] Responsive: full explorer on desktop; details panel becomes a bottom
      sheet/overlay on small screens; controls accessible
- [x] Cytoscape-specific code isolated in `lib/graph/cytoscape.ts`; transform
      logic is Cytoscape-free and unit-tested (`tests/services/`,
      13 tests total green)
- [x] Entity explorer (Doctor/Department/Disease/Medication) uses the same
      GraphExplorer component (depth control hidden for entity roots)
- [x] `npm test` green (existing + new unit tests: graph-transform 8,
      graph payload 5)