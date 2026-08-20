import cytoscape, {
  type Core,
  type Css,
  type ElementDefinition,
  type LayoutOptions,
} from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";

import { NODE_TYPE_COLORS } from "@/lib/graph/colors";
import type { GraphEdge, GraphNode, NodeType } from "@/types";

cytoscape.use(coseBilkent);

/** Cytoscape node id — namespaced by type so ids stay unique across entities. */
export function cyIdOf(node: { id: string; type: NodeType }): string {
  return `${node.type}:${node.id}`;
}

/** Convert a typed payload into Cytoscape element definitions. */
export function payloadToElements(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[]
): ElementDefinition[] {
  const cyId = new Map(nodes.map((n) => [n.id, cyIdOf(n)]));
  return [
    ...nodes.map((n) => ({
      data: { id: cyIdOf(n), payloadId: n.id, type: n.type, label: n.label },
    })),
    ...edges.map((e) => ({
      data: {
        id: e.id,
        source: cyId.get(e.source) ?? e.source,
        target: cyId.get(e.target) ?? e.target,
        rel: e.type,
      },
    })),
  ];
}

const FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const TYPE_SHAPES: Record<NodeType, { shape: Css.Node["shape"]; size: number }> = {
  Patient: { shape: "ellipse", size: 54 },
  Visit: { shape: "ellipse", size: 22 },
  Doctor: { shape: "hexagon", size: 34 },
  Department: { shape: "round-rectangle", size: 28 },
  Disease: { shape: "triangle", size: 30 },
  Medication: { shape: "diamond", size: 28 },
  Diagnosis: { shape: "rectangle", size: 24 },
  Prescription: { shape: "pentagon", size: 26 },
};

const NODE_BASE: Css.Node = {
  label: "data(label)",
  "font-family": FONT_FAMILY,
  "font-size": 11,
  color: "#c9d4ea",
  "text-valign": "bottom",
  "text-halign": "center",
  "text-margin-y": 8,
  "text-wrap": "wrap",
  "text-max-width": "150px",
  "background-color": "#1d2a47",
  "border-width": 1.5,
  "border-color": "#3d5480",
  "border-opacity": 0.75,
  "overlay-opacity": 0,
  width: 26,
  height: 26,
  "z-index": 10,
};

const EDGE_BASE: Css.Edge = {
  width: "0.75px",
  "line-color": "#3a4b74",
  opacity: 0.85,
  "curve-style": "bezier",
  label: "data(rel)",
  "font-family": FONT_FAMILY,
  "font-size": 9.5,
  color: "#8fa0c8",
  "text-opacity": 1,
  "text-background-color": "#0b1020",
  "text-background-opacity": 0.9,
  "text-background-padding": "2px",
  "text-background-shape": "roundrectangle",
  "z-index": 5,
};

/**
 * Obsidian-inspired dark stylesheet: floating nodes, thin relationship lines,
 * labels below nodes, relationship labels always visible.
 */
type GraphStylesheetEntry = {
  selector: string;
  style: Css.Node | Css.Edge;
};

export const GRAPH_STYLESHEET: GraphStylesheetEntry[] = [
  { selector: "node", style: NODE_BASE },
  ...(Object.entries(TYPE_SHAPES) as [NodeType, { shape: Css.Node["shape"]; size: number }][]).map(
    ([type, { shape, size }]) => ({
      selector: `node[type = "${type}"]`,
      style: {
        shape,
        width: size,
        height: size,
        "background-color": NODE_TYPE_COLORS[type],
        "border-color": NODE_TYPE_COLORS[type],
      } satisfies Css.Node,
    })
  ),
  {
    selector: "node.root",
    style: {
      "border-width": 2.5,
      "border-color": "#ffffff",
      "border-opacity": 0.9,
      "z-index": 60,
    } satisfies Css.Node,
  },
  {
    selector: "node.hovered",
    style: {
      "border-width": 2.5,
      "border-color": "#ffffff",
      "border-opacity": 0.4,
      "z-index": 70,
    } satisfies Css.Node,
  },
  {
    selector: "node.selected",
    style: {
      "border-width": 3,
      "border-color": "#ffffff",
      "border-opacity": 1,
      "z-index": 80,
    } satisfies Css.Node,
  },
  {
    selector: "node.dimmed",
    style: { opacity: 0.12, "border-opacity": 0.15, "z-index": 1 } satisfies Css.Node,
  },
  { selector: "edge", style: EDGE_BASE },
  {
    selector: "edge.highlighted",
    style: {
      width: "1.6px",
      "line-color": "#8fa0c8",
      opacity: 1,
      "text-opacity": 1,
      "z-index": 40,
    } satisfies Css.Edge,
  },
  {
    selector: "edge.dimmed",
    style: { opacity: 0.05, "z-index": 0 } satisfies Css.Edge,
  },
];

/**
 * Force-directed layout (cose-bilkent): connected nodes group together, nodes
 * repel, the result feels organic rather than like a static flowchart.
 */
const LAYOUT_OPTIONS = {
  name: "cose-bilkent",
  animate: "end",
  animationDuration: 600,
  animationEasing: "ease-out",
  quality: "default",
  nodeRepulsion: 9000,
  idealEdgeLength: 100,
  edgeElasticity: 0.6,
  nestingFactor: 0.1,
  gravity: 0.3,
  numIter: 1000,
  initialEnergyOnIncremental: 0.5,
  randomize: true,
} as LayoutOptions;

export function createGraph(container: HTMLElement): Core {
  return cytoscape({
    container,
    elements: [],
    style: GRAPH_STYLESHEET,
    minZoom: 0.15,
    maxZoom: 4,
    wheelSensitivity: 0.2,
  });
}

export function runForceLayout(cy: Core): void {
  cy.layout({ ...LAYOUT_OPTIONS, stop: () => fitGraph(cy) }).run();
}

export function zoomBy(cy: Core, factor: number): void {
  cy.zoom({
    level: cy.zoom() * factor,
    renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
  });
}

export function fitGraph(cy: Core): void {
  cy.fit(undefined, 40);
}

export function centerOn(cy: Core, id: string): void {
  const el = cy.getElementById(id);
  if (el.nonempty()) {
    cy.animate({ center: { eles: el }, duration: 350 });
  }
}