import { describe, expect, it } from "vitest";

import type { PathStepRow } from "@/lib/cognodb/queries/pathBetween";
import { mapPathResult } from "@/services/path";

function step(
  overrides: Partial<PathStepRow>
): PathStepRow {
  return {
    nodes: [
      { id: "P-1007", label: "Patient", title: "Ashley Jones" },
      { id: "v-1", label: "Visit", title: "v-1" },
      { id: "d-1", label: "Disease", title: "Type 2 Diabetes" },
    ],
    relationships: [{ type: "HAD_VISIT" }, { type: "RESULTED_IN" }],
    ...overrides,
  };
}

describe("mapPathResult", () => {
  it("maps a found path to nodes and labeled links", () => {
    const result = mapPathResult([step({})]);

    expect(result.found).toBe(true);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[0]).toEqual({
      id: "P-1007",
      type: "Patient",
      label: "Ashley Jones",
      properties: {},
    });
    expect(result.nodes[2]?.type).toBe("Disease");

    expect(result.links).toEqual([
      {
        fromId: "P-1007",
        fromType: "Patient",
        toId: "v-1",
        toType: "Visit",
        relationship: "HAD_VISIT",
      },
      {
        fromId: "v-1",
        fromType: "Visit",
        toId: "d-1",
        toType: "Disease",
        relationship: "RESULTED_IN",
      },
    ]);
  });

  it("allows intermediate nodes of any known type (multi-hop paths)", () => {
    const result = mapPathResult([
      step({
        nodes: [
          { id: "P-1007", label: "Patient", title: "Ashley Jones" },
          { id: "v-1", label: "Visit", title: "v-1" },
          { id: "doc-1", label: "Doctor", title: "Dr. Sarah Connor" },
          { id: "dept-1", label: "Department", title: "Cardiology" },
        ],
        relationships: [{ type: "HAD_VISIT" }, { type: "TREATED_BY" }, { type: "WORKS_IN" }],
      }),
    ]);

    expect(result.found).toBe(true);
    expect(result.nodes.map((n) => n.type)).toEqual([
      "Patient",
      "Visit",
      "Doctor",
      "Department",
    ]);
    expect(result.links[1]?.relationship).toBe("TREATED_BY");
  });

  it("uses the display title for node labels", () => {
    const result = mapPathResult([
      step({ nodes: [{ id: "P-1007", label: "Patient", title: "Ashley Jones" }] }),
    ]);
    expect(result.nodes[0]?.label).toBe("Ashley Jones");
    expect(result.nodes[0]?.type).toBe("Patient");
  });

  it("falls back to the type label when the title is missing", () => {
    const result = mapPathResult([
      step({
        nodes: [
          { id: "x-1", label: "Visit", title: "" },
        ],
      }),
    ]);
    expect(result.nodes[0]?.label).toBe("Visit");
  });

  it("reports not found for an empty result", () => {
    const result = mapPathResult([]);
    expect(result.found).toBe(false);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it("reports not found when a node type is unknown", () => {
    const result = mapPathResult([
      step({
        nodes: [
          { id: "P-1007", label: "Patient", title: "Ashley Jones" },
          { id: "alien-1", label: "Alien", title: "Zorp" },
        ],
      }),
    ]);
    expect(result.found).toBe(false);
  });

  it("fills an unknown relationship with UNKNOWN", () => {
    const result = mapPathResult([
      step({
        nodes: [
          { id: "P-1007", label: "Patient", title: "Ashley Jones" },
          { id: "d-1", label: "Disease", title: "Flu" },
        ],
        relationships: [],
      }),
    ]);
    expect(result.links[0]?.relationship).toBe("UNKNOWN");
  });
});