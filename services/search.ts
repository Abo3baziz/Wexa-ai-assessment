import type { SearchRow } from "@/lib/cognodb/queries/search";
import type { NodeType, SearchResult } from "@/types";
import { typeFromLabel } from "./record";

/** Map raw search rows to typed SearchResult DTOs, dropping unknown labels. */
export function mapSearchResults(rows: SearchRow[]): SearchResult[] {
  return rows.reduce<SearchResult[]>((acc, row) => {
    const type = typeFromLabel(row.type);
    if (!type) return acc;
    acc.push({
      type: type as NodeType,
      id: row.id,
      label: row.label,
      subtitle: row.subtitle,
    });
    return acc;
  }, []);
}
