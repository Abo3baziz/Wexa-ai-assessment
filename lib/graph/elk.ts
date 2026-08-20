import type ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk.bundled.js";

import { cyIdOf } from "@/lib/graph/cytoscape";
import type { GraphEdge, GraphNode } from "@/types";

/** Bounding box ELK lays out with (comfortably larger than rendered content). */
export const ELK_NODE_WIDTH = 150;
export const ELK_NODE_HEIGHT = 90;

/** ELK layered direction. */
export type ElkDirection = "DOWN" | "RIGHT";

/** Which node sides edges attach to in the React Flow renderer. */
export type EdgeOrientation = "vertical" | "horizontal";

export interface ElkLayoutResult {
  /** Node top-left position by cytoscape node id (`type:payloadId`). */
  positions: Map<string, { x: number; y: number }>;
}

/**
 * elkjs is heavy (~1 MB) and only needed when a React Flow canvas mounts, so
 * the bundled build is loaded lazily instead of at import time (keeps SSR and
 * the Cytoscape-only bundle lean).
 */
let elkInstance: InstanceType<typeof ELK> | null = null;

async function getElk(): Promise<InstanceType<typeof ELK>> {
  if (!elkInstance) {
    const mod = await import("elkjs/lib/elk.bundled.js");
    elkInstance = new mod.default();
  }
  return elkInstance;
}

interface DirectionalEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Orient every edge AWAY from the root (BFS over the undirected graph, then
 * parent → child by depth). ELK's layered algorithm then grows a clean tree
 * from the root instead of scattering layers arbitrarily.
 */
function orientEdgesAwayFromRoot(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  rootId: string,
  cyId: ReadonlyMap<string, string>
): DirectionalEdge[] {
  const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
    adjacency.get(e.target)?.push(e.source);
  }
  const depth = new Map<string, number>();
  const queue: string[] = [];
  if (adjacency.has(rootId)) {
    depth.set(rootId, 0);
    queue.push(rootId);
  }
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]!;
    const d = depth.get(id) ?? 0;
    for (const next of adjacency.get(id) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  return edges.map((e) => {
    const ds = depth.get(e.source) ?? Number.POSITIVE_INFINITY;
    const dt = depth.get(e.target) ?? Number.POSITIVE_INFINITY;
    const [source, target] =
      dt < ds
        ? [e.target, e.source]
        : ds <= dt
          ? [e.source, e.target]
          : [e.target, e.source];
    return {
      id: e.id,
      source: cyId.get(source) ?? source,
      target: cyId.get(target) ?? target,
    };
  });
}

/**
 * Run the ELK "layered" (tree) algorithm on the payload and return node
 * top-left positions. `direction` DOWN grows a top-down tree (explorer);
 * RIGHT grows a horizontal spine (path canvas). Resolves asynchronously.
 */
export async function computeElkTreeLayout(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  rootId: string,
  direction: ElkDirection = "DOWN"
): Promise<ElkLayoutResult> {
  const cyId = new Map(nodes.map((n) => [n.id, cyIdOf(n)]));
  const oriented = orientEdgesAwayFromRoot(nodes, edges, rootId, cyId);
  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "130",
      "elk.layered.nodePlacement.strategy": "SIMPLE",
      "elk.layered.layering.strategy": "LONGEST_PATH",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=40,left=40,bottom=40,right=40]",
    },
    children: nodes.map((n) => ({
      id: cyIdOf(n),
      width: ELK_NODE_WIDTH,
      height: ELK_NODE_HEIGHT,
    })),
    edges: oriented.map(
      (e) =>
        ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        }) as ElkExtendedEdge
    ),
  };
  const elk = await getElk();
  const layout = await elk.layout(graph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of layout.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }
  return { positions };
}