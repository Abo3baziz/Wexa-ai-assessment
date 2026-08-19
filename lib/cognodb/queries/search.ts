import { runQuery } from "./runner";

/**
 * Typed search across Patient, Doctor, Disease, Medication.
 * One parameterized query using UNION; each row carries a type discriminant.
 */
export interface SearchRow {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  publicId: string;
}

export const SEARCH_QUERY = `
  CALL {
    MATCH (p:Patient) WHERE toLower(p.firstName + ' ' + p.lastName) CONTAINS toLower($q) OR toLower(p.nationalId) CONTAINS toLower($q)
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
  }
  RETURN type, id, label, subtitle, publicId
  ORDER BY type, label
  LIMIT $limit
`;

export function searchEntities(q: string, limit = 8) {
  return runQuery<SearchRow>(SEARCH_QUERY, { q, limit });
}
