import { runQuery } from "./runner";

import type { GraphDepth } from "@/types";

/**
 * Q-graph — a patient's ego neighborhood within `depth` hops (multi-hop
 * traversal). Returns every relationship in the subgraph with its endpoints'
 * id, label and properties, so the service can build a deduplicated
 * GraphPayload. Example chains at depth 2–3:
 *
 *   Patient → Visit → Doctor → Department
 *   Patient → Visit → Diagnosis → Disease
 *   Patient → Visit → Prescription → Medication
 *   Patient → Disease ← Patient   (related patient)
 *
 * Neo4j cannot take variable-length bounds as parameters, so instead of
 * interpolating user input the depth is allowlist-validated server-side
 * (1|2|3) and picks one of three pre-written constant queries below — never a
 * string-concatenated bound. Bounded depth keeps CognoDB's free tier safe.
 */
export interface NeighborhoodRow {
  sourceId: string;
  sourceType: string;
  sourceProps: Record<string, unknown>;
  relType: string;
  targetId: string;
  targetType: string;
  targetProps: Record<string, unknown>;
}

function neighborhoodQuery(depth: GraphDepth): string {
  const queries: Record<GraphDepth, string> = {
    1: `
      MATCH (p:Patient {publicId: $publicId})
      MATCH path = (p)-[*1..1]-(n)
      UNWIND relationships(path) AS rel
      WITH DISTINCT rel
      WITH rel AS r, startNode(rel) AS a, endNode(rel) AS b
      RETURN
        a.id AS sourceId, head(labels(a)) AS sourceType, properties(a) AS sourceProps,
        type(r) AS relType,
        b.id AS targetId, head(labels(b)) AS targetType, properties(b) AS targetProps
    `,
    2: `
      MATCH (p:Patient {publicId: $publicId})
      MATCH path = (p)-[*1..2]-(n)
      UNWIND relationships(path) AS rel
      WITH DISTINCT rel
      WITH rel AS r, startNode(rel) AS a, endNode(rel) AS b
      RETURN
        a.id AS sourceId, head(labels(a)) AS sourceType, properties(a) AS sourceProps,
        type(r) AS relType,
        b.id AS targetId, head(labels(b)) AS targetType, properties(b) AS targetProps
    `,
    3: `
      MATCH (p:Patient {publicId: $publicId})
      MATCH path = (p)-[*1..3]-(n)
      UNWIND relationships(path) AS rel
      WITH DISTINCT rel
      WITH rel AS r, startNode(rel) AS a, endNode(rel) AS b
      RETURN
        a.id AS sourceId, head(labels(a)) AS sourceType, properties(a) AS sourceProps,
        type(r) AS relType,
        b.id AS targetId, head(labels(b)) AS targetType, properties(b) AS targetProps
    `,
  };
  return queries[depth];
}

export function findPatientGraph(publicId: string, depth: GraphDepth) {
  return runQuery<NeighborhoodRow>(neighborhoodQuery(depth), { publicId });
}