import { runQuery } from "./runner";

/**
 * Labels an entity can be rooted at in the entity explorer. The id is always
 * passed as a parameter; `type` is compared against `labels()` as a value
 * (never embedded as a Cypher label), so it is allowlist-validated.
 */
export const ENTITY_GRAPH_LABELS = [
  "Doctor",
  "Department",
  "Disease",
  "Medication",
] as const;

export type EntityGraphLabel = (typeof ENTITY_GRAPH_LABELS)[number];

export interface EntityGraphRow {
  root: Record<string, unknown>;
  rootType: string;
  sourceId: string;
  sourceType: string;
  sourceProps: Record<string, unknown>;
  relType: string;
  targetId: string;
  targetType: string;
  targetProps: Record<string, unknown>;
}

/**
 * Q-entity — neighborhood of an entity within `hops` relationships.
 * Returns the root node plus every relationship in the subgraph, with each
 * endpoint's id, label and properties, so the service can build a deduplicated
 * GraphPayload. 3 hops reaches Patients for all entity types (e.g.
 * Department -> Doctor -> Visit -> Patient).
 */
export const ENTITY_GRAPH_QUERY = `
  MATCH (e) WHERE e.id = $id AND $type IN labels(e)
  MATCH path = (e)-[*1..3]-(n)
  UNWIND relationships(path) AS rel
  WITH DISTINCT rel, e
  WITH e AS root, rel,
    startNode(rel) AS a, endNode(rel) AS b
  RETURN
    root AS root, head(labels(root)) AS rootType,
    a.id AS sourceId, head(labels(a)) AS sourceType, properties(a) AS sourceProps,
    type(rel) AS relType,
    b.id AS targetId, head(labels(b)) AS targetType, properties(b) AS targetProps
`;

export function findEntityGraph(type: EntityGraphLabel, id: string) {
  return runQuery<EntityGraphRow>(ENTITY_GRAPH_QUERY, { type, id });
}
