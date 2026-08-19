import { runQuery } from "./runner";

/**
 * Search modes the client can select. Each maps to a `$type` filter (post-UNION)
 * and, for patients, a `$mode` that controls whether name matching is included
 * (`national-id` matches only the national ID; other patient modes also match
 * the name, to disambiguate name collisions).
 */
export const SEARCH_MODES = [
  "all",
  "national-id",
  "patient-name",
  "doctor",
  "medication",
  "department",
  "disease",
] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

/**
 * The node type a non-"all" mode should filter to. Empty string means "all".
 * `$mode` is passed to the query and compared as a value (never interpolated);
 * `$type` is likewise compared against the returned `type` column.
 */
export const SEARCH_MODE_TYPE: Record<SearchMode, string> = {
  all: "",
  "national-id": "Patient",
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
    WHERE ($mode <> 'national-id' AND toLower(p.firstName + ' ' + p.lastName) CONTAINS toLower($q))
       OR toLower(p.nationalId) CONTAINS toLower($q)
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
  return runQuery<SearchRow>(SEARCH_QUERY, {
    q,
    limit,
    mode,
    type: SEARCH_MODE_TYPE[mode],
  });
}
