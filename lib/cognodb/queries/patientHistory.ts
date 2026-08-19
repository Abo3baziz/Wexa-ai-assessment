import { runQuery } from "./runner";

/**
 * Q1 — Patient medical history (ego subgraph).
 * Given a patient's publicId, returns the patient and all directly connected
 * visits, doctors, departments, diagnoses, diseases, prescriptions and
 * medications, plus current-state diseases/medications.
 * Uses OPTIONAL MATCH so history renders even when branches are empty.
 */
export interface PatientHistoryRow {
  patient: {
    id: string;
    publicId: string;
    nationalId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
  visit: Record<string, unknown> | null;
  doctor: Record<string, unknown> | null;
  department: Record<string, unknown> | null;
  diagnosis: Record<string, unknown> | null;
  disease: Record<string, unknown> | null;
  medication: Record<string, unknown> | null;
  prescription: Record<string, unknown> | null;
  hasDisease: { status: string; since: string } | null;
  takes: { status: string; since: string } | null;
  /** The active/resolved Disease reached via HAS_DISEASE, when present. */
  activeDisease: Record<string, unknown> | null;
  /** The current Medication reached via TAKES, when present. */
  activeMedication: Record<string, unknown> | null;
}

export const PATIENT_HISTORY_QUERY = `
  MATCH (p:Patient {publicId: $publicId})
  OPTIONAL MATCH (p)-[:HAD_VISIT]->(v:Visit)
  OPTIONAL MATCH (v)-[:TREATED_BY]->(doc:Doctor)
  OPTIONAL MATCH (doc)-[:WORKS_IN]->(dept:Department)
  OPTIONAL MATCH (v)-[:RESULTED_IN]->(dg:Diagnosis)
  OPTIONAL MATCH (dg)-[:FOR_DISEASE]->(dis:Disease)
  OPTIONAL MATCH (v)-[:GENERATED]->(rx:Prescription)
  OPTIONAL MATCH (rx)-[:FOR_MEDICATION]->(med:Medication)
  OPTIONAL MATCH (p)-[hd:HAS_DISEASE]->(dActive:Disease)
  OPTIONAL MATCH (p)-[tk:TAKES]->(mActive:Medication)
  RETURN
    p AS patient,
    v AS visit,
    doc AS doctor,
    dept AS department,
    dg AS diagnosis,
    dis AS disease,
    med AS medication,
    rx AS prescription,
    hd AS hasDisease,
    tk AS takes,
    dActive AS activeDisease,
    mActive AS activeMedication
`;

export function findPatientHistory(publicId: string) {
  return runQuery<PatientHistoryRow>(PATIENT_HISTORY_QUERY, { publicId });
}
