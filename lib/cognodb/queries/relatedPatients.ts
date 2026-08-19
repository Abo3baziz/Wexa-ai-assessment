import { runQuery } from "./runner";

/**
 * Q3 — Related patients via shared graph relationships.
 * Finds patients connected to the selected patient through:
 *   - a shared Disease (HAS_DISEASE)
 *   - a shared Medication (TAKES)
 *   - a shared Doctor (via Visit -[:TREATED_BY]-> Doctor <-[:TREATED_BY]- Visit)
 * The relationship is graph-based, never a scalar-property match.
 */
export interface RelatedPatientRow {
  patient: {
    id: string;
    publicId: string;
    firstName: string;
    lastName: string;
  };
  sharedDiseases: string[];
  sharedMedications: string[];
  sharedDoctors: string[];
  connectionCount: number;
}

export const RELATED_PATIENTS_QUERY = `
  MATCH (p:Patient {publicId: $publicId})
  MATCH (other:Patient) WHERE other <> p
  OPTIONAL MATCH (p)-[:HAS_DISEASE]->(d:Disease)<-[:HAS_DISEASE]-(other)
  OPTIONAL MATCH (p)-[:TAKES]->(m:Medication)<-[:TAKES]-(other)
  OPTIONAL MATCH (p)-[:HAD_VISIT]->(:Visit)-[:TREATED_BY]->(doc:Doctor)
    <-[:TREATED_BY]-(:Visit)<-[:HAD_VISIT]-(other)
  WITH other,
       collect(DISTINCT d.name) AS sharedDiseases,
       collect(DISTINCT m.name) AS sharedMedications,
       collect(DISTINCT doc.name) AS sharedDoctors
  WHERE size(sharedDiseases) > 0
     OR size(sharedMedications) > 0
     OR size(sharedDoctors) > 0
  RETURN other AS patient,
    sharedDiseases,
    sharedMedications,
    sharedDoctors,
    size(sharedDiseases) + size(sharedMedications) + size(sharedDoctors) AS connectionCount
  ORDER BY connectionCount DESC, other.publicId
  LIMIT $limit
`;

export function findRelatedPatients(publicId: string, limit = 12) {
  return runQuery<RelatedPatientRow>(RELATED_PATIENTS_QUERY, {
    publicId,
    limit,
  });
}
