import { describe, expect, it } from "vitest";

import {
  applyTypeFilters,
  mergePayloads,
  neighborsOf,
  presentTypes,
} from "@/lib/graph/graph-transform";
import type { GraphPayload } from "@/types";

const payload: GraphPayload = {
  nodes: [
    { id: "p1", type: "Patient", label: "Ahmed Hassan", properties: {} },
    { id: "v1", type: "Visit", label: "visit-1", properties: {} },
    { id: "d1", type: "Doctor", label: "Dr. Ahmed Ali", properties: {} },
    { id: "m1", type: "Medication", label: "Amlodipine", properties: {} },
  ],
  edges: [
    { id: "e1", source: "p1", target: "v1", type: "HAD_VISIT" },
    { id: "e2", source: "v1", target: "d1", type: "TREATED_BY" },
    { id: "e3", source: "p1", target: "m1", type: "TAKES" },
  ],
};

describe("neighborsOf", () => {
  it("finds neighbors in both edge directions", () => {
    expect([...neighborsOf("p1", payload.edges)].sort()).toEqual(["m1", "v1"]);
    expect([...neighborsOf("v1", payload.edges)].sort()).toEqual(["d1", "p1"]);
  });

  it("returns an empty set for an isolated node", () => {
    expect([...neighborsOf("nope", payload.edges)]).toEqual([]);
  });
});

describe("applyTypeFilters", () => {
  const allOn = {
    Patient: true,
    Visit: true,
    Doctor: true,
    Department: true,
    Disease: true,
    Medication: true,
    Diagnosis: true,
    Prescription: true,
  };

  it("keeps everything when all types are enabled", () => {
    const out = applyTypeFilters(payload, allOn);
    expect(out.nodes).toHaveLength(4);
    expect(out.edges).toHaveLength(3);
  });

  it("hides filtered nodes and edges touching them", () => {
    const out = applyTypeFilters(payload, { ...allOn, Visit: false });
    expect(out.nodes.map((n) => n.type)).toEqual(["Patient", "Doctor", "Medication"]);
    expect(out.edges.map((e) => e.type)).toEqual(["TAKES"]);
  });

  it("removes edges when either endpoint is hidden", () => {
    const out = applyTypeFilters(payload, { ...allOn, Medication: false });
    expect(out.nodes).toHaveLength(3);
    expect(out.edges.map((e) => e.type)).toEqual(["HAD_VISIT", "TREATED_BY"]);
  });
});

describe("presentTypes", () => {
  it("flags exactly the types present in the payload", () => {
    const present = presentTypes(payload);
    expect(present.Patient).toBe(true);
    expect(present.Visit).toBe(true);
    expect(present.Doctor).toBe(true);
    expect(present.Medication).toBe(true);
    expect(present.Disease).toBe(false);
    expect(present.Department).toBe(false);
  });
});

describe("mergePayloads", () => {
  const extra: GraphPayload = {
    nodes: [
      { id: "v1", type: "Visit", label: "visit-1", properties: {} },
      { id: "rx1", type: "Prescription", label: "rx-1", properties: {} },
    ],
    edges: [
      { id: "e3", source: "p1", target: "m1", type: "TAKES" },
      { id: "e4", source: "v1", target: "rx1", type: "GENERATED" },
    ],
  };

  it("merges new nodes and edges while deduplicating shared ones", () => {
    const merged = mergePayloads(payload, extra);
    expect(merged.nodes).toHaveLength(5);
    expect(merged.edges).toHaveLength(4);
    expect(merged.edges.find((e) => e.id === "e3")).toEqual(payload.edges[2]);
  });

  it("dedupes nodes by type:id when the same node reappears", () => {
    const merged = mergePayloads(payload, { nodes: [...payload.nodes], edges: [] });
    expect(merged.nodes).toHaveLength(4);
  });
});