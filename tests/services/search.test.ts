import { describe, expect, it } from "vitest";

import type { SearchRow } from "@/lib/cognodb/queries/search";
import { mapSearchResults } from "@/services/search";

function searchRow(overrides: Partial<SearchRow>): SearchRow {
  return {
    type: "Patient",
    id: "pat-7",
    label: "Ashley Jones",
    subtitle: "528207534761",
    publicId: "P-1007",
    ...overrides,
  };
}

describe("mapSearchResults", () => {
  it("maps known rows to typed SearchResult DTOs", () => {
    const results = mapSearchResults([
      searchRow({}),
      searchRow({
        type: "Disease",
        id: "d-1",
        label: "Type 2 Diabetes",
        subtitle: "Metabolic",
        publicId: "",
      }),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      type: "Patient",
      id: "pat-7",
      label: "Ashley Jones",
      subtitle: "528207534761",
      publicId: "P-1007",
    });
    expect(results[1]?.type).toBe("Disease");
    expect(results[1]?.publicId).toBe("");
  });

  it("drops rows with an unknown node label", () => {
    const results = mapSearchResults([
      searchRow({ type: "Alien" }),
      searchRow({}),
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe("Patient");
  });

  it("returns an empty list for no rows", () => {
    expect(mapSearchResults([])).toEqual([]);
  });
});