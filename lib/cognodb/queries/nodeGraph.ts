import { runQuery } from "./runner";

import type { NeighborhoodRow } from "./patientGraph";

/**
 * Labels a node can be expanded from in the graph explorer. The id is always
 * passed as a parameter; `type` is compared against `labels()` as a value
 * (never embedded as a Cypher label), so it is allowlist-validated.
 */
export const NODE_GRAPH_LABELS = [
  "Patient",
  "Visit",
  "Doctor",
  "Department",
  "Disease",
  "Medication",
  "Diagnosis",
  "Prescription",
] as const;

export type NodeGraphLabel = (typeof NODE_GRAPH_LABELS)[number];

/**
 * Q-expand — the 1-hop ego neighborhood of any single node (of any type),
 * used when the user clicks "Expand Relationships" on a node that is already
 * on the canvas. Returns the same NeighborhoodRow shape as the patient graph
 * query so the payload mapper is shared. Bounded to 1 hop keeps the free tier
 * safe regardless of which node the user expands.
 */
export const NODE_GRAPH_QUERY = `
  MATCH (n) WHERE n.id = $id AND $type IN labels(n)
  MATCH path = (n)-[*1..1]-(m)
  UNWIND relationships(path) AS rel
  WITH DISTINCT rel
  WITH rel AS r, startNode(rel) AS a, endNode(rel) AS b
  RETURN
    a.id AS sourceId, head(labels(a)) AS sourceType, properties(a) AS sourceProps,
    type(r) AS relType,
    b.id AS targetId, head(labels(b)) AS targetType, properties(b) AS targetProps
`;

export function findNodeGraph(type: NodeGraphLabel, id: string) {
  return runQuery<NeighborhoodRow>(NODE_GRAPH_QUERY, { type, id });
}