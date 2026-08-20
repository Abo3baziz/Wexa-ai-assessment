import type { Edge } from "@xyflow/react";

import type { FlowNode } from "@/components/graph/flow/FlowNode";
import { cyIdOf } from "@/lib/graph/cytoscape";
import { neighborsOf } from "@/lib/graph/graph-transform";
import type { GraphEdge, GraphNode } from "@/types";

/** Bounding box used to center flow nodes on their cytoscape positions. */
export const FLOW_NODE_WIDTH = 120;
export const FLOW_NODE_HEIGHT = 88;

/**
 * Cytoscape layouts space nodes for small shapes (26–54px); React Flow node
 * boxes are larger (label below the shape), so positions are scaled up to
 * keep boxes from overlapping.
 */
export const LAYOUT_SCALE = 2.5;

export type FlowEdge = Edge<{ rel: string }, "default">;

/** Dim/highlight state mirroring the Cytoscape `dimmed`/`highlighted` classes. */
export interface FlowSelection {
  selectedNodeId: string | null;
  dimmedNodeIds: ReadonlySet<string>;
  highlightedEdgeIds: ReadonlySet<string>;
  dimmedEdgeIds: ReadonlySet<string>;
}

export const EMPTY_SELECTION: FlowSelection = {
  selectedNodeId: null,
  dimmedNodeIds: new Set(),
  highlightedEdgeIds: new Set(),
  dimmedEdgeIds: new Set(),
};

/**
 * Compute the same visual selection the Cytoscape engine derives from
 * `closedNeighborhood()`: the selected node and its neighbors stay lit,
 * everything else dims, and edges touching the selected node highlight.
 */
export function selectionInfo(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  selectedNodeId: string | null
): FlowSelection {
  if (!selectedNodeId) return EMPTY_SELECTION;
  const neighbors = neighborsOf(selectedNodeId, edges);
  const closed = new Set([selectedNodeId, ...neighbors]);
  const dimmedNodeIds = new Set(
    nodes.filter((n) => !closed.has(n.id)).map((n) => n.id)
  );
  const highlightedEdgeIds = new Set(
    edges
      .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
      .map((e) => e.id)
  );
  const dimmedEdgeIds = new Set(
    edges.filter((e) => !highlightedEdgeIds.has(e.id)).map((e) => e.id)
  );
  return { selectedNodeId, dimmedNodeIds, highlightedEdgeIds, dimmedEdgeIds };
}

const EDGE_LABEL_STYLE = { fill: "#8fa0c8", fontSize: 9.5 };
const EDGE_LABEL_BG_STYLE = { fill: "#0b1020", fillOpacity: 0.9 };
const EDGE_DEFAULT_STYLE = { stroke: "#3a4b74", strokeWidth: 0.75, opacity: 0.85 };
const EDGE_HIGHLIGHTED_STYLE = { stroke: "#8fa0c8", strokeWidth: 1.6, opacity: 1 };
const EDGE_DIMMED_STYLE = { opacity: 0.05 };

/** Map a payload into React Flow nodes, reusing cytoscape layout positions. */
export function buildFlowNodes(
  payloadNodes: readonly GraphNode[],
  positions: ReadonlyMap<string, { x: number; y: number }>,
  rootNodeId: string,
  selection: FlowSelection
): FlowNode[] {
  return payloadNodes.map((n) => {
    const pos = positions.get(cyIdOf(n)) ?? { x: 0, y: 0 };
    return {
      id: cyIdOf(n),
      type: "graph",
      position: {
        x: pos.x * LAYOUT_SCALE - FLOW_NODE_WIDTH / 2,
        y: pos.y * LAYOUT_SCALE - FLOW_NODE_HEIGHT / 2,
      },
      data: {
        payloadId: n.id,
        label: n.label,
        type: n.type,
        isRoot: n.id === rootNodeId,
        selected: selection.selectedNodeId === n.id,
        dimmed: selection.dimmedNodeIds.has(n.id),
      },
    };
  });
}

/** Map a payload into React Flow edges with always-visible relationship labels. */
export function buildFlowEdges(
  payloadNodes: readonly GraphNode[],
  payloadEdges: readonly GraphEdge[],
  selection: FlowSelection
): FlowEdge[] {
  const cyId = new Map(payloadNodes.map((n) => [n.id, cyIdOf(n)]));
  return payloadEdges.map((e) => ({
    id: e.id,
    source: cyId.get(e.source) ?? e.source,
    target: cyId.get(e.target) ?? e.target,
    type: "default",
    data: { rel: e.type },
    label: e.type,
    labelStyle: EDGE_LABEL_STYLE,
    labelBgStyle: EDGE_LABEL_BG_STYLE,
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
    style: selection.highlightedEdgeIds.has(e.id)
      ? EDGE_HIGHLIGHTED_STYLE
      : selection.dimmedEdgeIds.has(e.id)
        ? EDGE_DIMMED_STYLE
        : EDGE_DEFAULT_STYLE,
  }));
}