import type { GraphEdge, GraphFilters, GraphPayload } from "@/types";

/** Ids of every node directly connected to `id` via any edge. */
export function neighborsOf(id: string, edges: readonly GraphEdge[]): Set<string> {
  const out = new Set<string>();
  for (const edge of edges) {
    if (edge.source === id) out.add(edge.target);
    if (edge.target === id) out.add(edge.source);
  }
  return out;
}

/**
 * Hide nodes whose type is filtered out, and remove any edge that touches a
 * hidden node so the visible graph stays structurally consistent.
 */
export function applyTypeFilters(
  payload: GraphPayload,
  filters: GraphFilters
): GraphPayload {
  const visible = new Set<string>(
    payload.nodes.filter((n) => filters[n.type]).map((n) => n.id)
  );
  return {
    nodes: payload.nodes.filter((n) => visible.has(n.id)),
    edges: payload.edges.filter(
      (e) => visible.has(e.source) && visible.has(e.target)
    ),
  };
}

/** Node types actually present in a payload (for legend + filter chips). */
export function presentTypes(payload: GraphPayload): GraphFilters {
  const out = {
    Patient: false,
    Visit: false,
    Doctor: false,
    Department: false,
    Disease: false,
    Medication: false,
    Diagnosis: false,
    Prescription: false,
  };
  for (const node of payload.nodes) {
    out[node.type] = true;
  }
  return out;
}

/**
 * Merge a newly fetched neighborhood into an existing payload, deduplicating
 * by node (type:id) and edge id. Used when "Expand Relationships" loads the
 * ego neighborhood of a node that was not part of the initial fetch.
 */
export function mergePayloads(
  base: GraphPayload,
  extra: GraphPayload
): GraphPayload {
  const nodes = new Map<string, GraphPayload["nodes"][number]>();
  for (const node of base.nodes) {
    nodes.set(`${node.type}:${node.id}`, node);
  }
  for (const node of extra.nodes) {
    nodes.set(`${node.type}:${node.id}`, node);
  }
  const edges = new Map<string, GraphPayload["edges"][number]>();
  for (const edge of base.edges) {
    edges.set(edge.id, edge);
  }
  for (const edge of extra.edges) {
    if (!edges.has(edge.id)) edges.set(edge.id, edge);
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}