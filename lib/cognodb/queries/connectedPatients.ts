import { runQuery } from "./runner";

/**
 * Q5 — Connected patients via variable-depth traversal.
 * The "relationally awkward" query: find patients within a bounded traversal
 * depth of the selected patient through disease, medication, or doctor links,
 * ranked by the number of distinct connection paths between them.
 *
 * In a relational database this needs multiple recursive CTEs and manual path
 * handling; here variable-length relationship traversal is a first-class
 * operation.
 */
export interface ConnectedPatientRow {
  patient: {
    id: string;
    publicId: string;
    nationalId: string;
    firstName: string;
    lastName: string;
  };
  pathPattern: string[];
  pathCount: number;
}

export const MAX_DEPTH = 10;

export const CONNECTED_PATIENTS_QUERY = (maxDepth: number) => `
  MATCH path = (p:Patient {publicId: $publicId})
    -[:HAS_DISEASE|TAKES|HAD_VISIT*1..${clampDepth(maxDepth)}]-
    (other:Patient)
  WHERE other <> p
    AND ALL(r IN relationships(path) WHERE type(r) IN ['HAS_DISEASE','TAKES','HAD_VISIT'])
  WITH other, path
  RETURN other AS patient,
    [r IN relationships(path) | type(r)] AS pathPattern,
    count(path) AS pathCount
  ORDER BY pathCount DESC, other.publicId
  LIMIT $limit
`;

/**
 * Neo4j forbids parameters inside variable-length relationship bounds, so the
 * depth must appear as a literal. Clamp to the safe range [1, 10].
 */
function clampDepth(maxDepth: number): number {
  if (!Number.isInteger(maxDepth) || maxDepth < 1) return 1;
  if (maxDepth > MAX_DEPTH) return MAX_DEPTH;
  return maxDepth;
}

export function findConnectedPatients(publicId: string, maxDepth = 3, limit = 12) {
  return runQuery<ConnectedPatientRow>(CONNECTED_PATIENTS_QUERY(maxDepth), {
    publicId,
    limit,
  });
}
