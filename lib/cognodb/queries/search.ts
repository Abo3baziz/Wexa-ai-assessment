import { runQuery } from "./runner";

/**
 * Search modes the client can select. Each maps to a `$type` filter (post-UNION)
 * and, for patients, controls whether name and/or national ID matching applies:
 * `name` matches the name only, `national-id` matches the ID only, and the
 * other patient modes (`patient-name`, `all`) match either.
 */
export const SEARCH_MODES = [
  "all",
  "national-id",
  "name",
  "patient-name",
  "doctor",
  "medication",
  "department",
  "disease",
] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

/**
 * The node type a non-"all" mode should filter to. Empty string means "all".
 * `$type` is compared against the returned `type` column (never interpolated).
 */
export const SEARCH_MODE_TYPE: Record<SearchMode, string> = {
  all: "",
  "national-id": "Patient",
  name: "Patient",
  "patient-name": "Patient",
  doctor: "Doctor",
  medication: "Medication",
  department: "Department",
  disease: "Disease",
};

export interface SearchRow {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  publicId: string;
}

export const SEARCH_QUERY = `
  CALL {
    MATCH (p:Patient)
    WHERE ($matchName AND toLower(p.firstName + ' ' + p.lastName) CONTAINS toLower($q))
       OR ($matchId AND toLower(p.nationalId) CONTAINS toLower($q))
    RETURN 'Patient' AS type, p.id AS id, p.firstName + ' ' + p.lastName AS label,
      p.nationalId AS subtitle, p.publicId AS publicId
    UNION
    MATCH (d:Doctor) WHERE toLower(d.name) CONTAINS toLower($q)
    RETURN 'Doctor' AS type, d.id AS id, d.name AS label, d.specialty AS subtitle, '' AS publicId
    UNION
    MATCH (dis:Disease) WHERE toLower(dis.name) CONTAINS toLower($q)
    RETURN 'Disease' AS type, dis.id AS id, dis.name AS label, dis.category AS subtitle, '' AS publicId
    UNION
    MATCH (m:Medication) WHERE toLower(m.name) CONTAINS toLower($q)
    RETURN 'Medication' AS type, m.id AS id, m.name AS label, m.dosageForm AS subtitle, '' AS publicId
    UNION
    MATCH (dep:Department) WHERE toLower(dep.name) CONTAINS toLower($q)
    RETURN 'Department' AS type, dep.id AS id, dep.name AS label, dep.name AS subtitle, '' AS publicId
  }
  WITH type, id, label, subtitle, publicId
  WHERE $type = '' OR type = $type
  RETURN type, id, label, subtitle, publicId
  ORDER BY type, label
  LIMIT $limit
`;

export function searchEntities(q: string, limit = 8, mode: SearchMode = "all") {
  const matchName = mode === "all" || mode === "patient-name" || mode === "name";
  const matchId = mode === "all" || mode === "patient-name" || mode === "national-id";
  return runQuery<SearchRow>(SEARCH_QUERY, {
    q,
    limit,
    mode,
    type: SEARCH_MODE_TYPE[mode],
    matchName,
    matchId,
  });
}
