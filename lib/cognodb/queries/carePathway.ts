import { runQuery } from "./runner";

/**
 * Q2 — Care pathway (multi-hop traversal).
 * Traverses Patient -> Visit -> Doctor -> Department (3 hops) and
 * Patient -> Visit -> Diagnosis -> Disease (3 hops).
 * Demonstrates that Cypher expresses multi-hop paths natively.
 */
export interface CarePathwayRow {
  patient: {
    id: string;
    publicId: string;
    nationalId: string;
    firstName: string;
    lastName: string;
  };
  visit: { id: string; visitDate: string; reason: string };
  doctor: { id: string; name: string; specialty: string } | null;
  department: { id: string; name: string } | null;
  diagnosis: { id: string; diagnosedAt: string; severity: string } | null;
  disease: { id: string; name: string; category: string } | null;
}

export const CARE_PATHWAY_QUERY = `
  MATCH (p:Patient {publicId: $publicId})-[:HAD_VISIT]->(v:Visit)
  OPTIONAL MATCH (v)-[:TREATED_BY]->(doc:Doctor)
  OPTIONAL MATCH (doc)-[:WORKS_IN]->(dept:Department)
  OPTIONAL MATCH (v)-[:RESULTED_IN]->(dg:Diagnosis)
  OPTIONAL MATCH (dg)-[:FOR_DISEASE]->(dis:Disease)
  RETURN
    p AS patient,
    v AS visit,
    doc AS doctor,
    dept AS department,
    dg AS diagnosis,
    dis AS disease
  ORDER BY v.visitDate DESC
`;

export function findCarePathway(publicId: string) {
  return runQuery<CarePathwayRow>(CARE_PATHWAY_QUERY, { publicId });
}
