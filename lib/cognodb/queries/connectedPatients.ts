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
    firstName: string;
    lastName: string;
  };
  pathPattern: string[];
  pathCount: number;
}

export const CONNECTED_PATIENTS_QUERY = `
  MATCH path = (p:Patient {publicId: $publicId})
    -[:HAS_DISEASE|TAKES|HAD_VISIT*1..$maxDepth]-
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

export function findConnectedPatients(publicId: string, maxDepth = 3, limit = 12) {
  return runQuery<ConnectedPatientRow>(CONNECTED_PATIENTS_QUERY, {
    publicId,
    maxDepth,
    limit,
  });
}
