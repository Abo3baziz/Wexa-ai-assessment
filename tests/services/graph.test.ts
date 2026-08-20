import { describe, expect, it } from "vitest";

import type { NeighborhoodRow } from "@/lib/cognodb/queries/patientGraph";
import { buildNeighborhoodPayload } from "@/services/graph";

const patientProps = {
  id: "p1",
  publicId: "P-1001",
  firstName: "Ahmed",
  lastName: "Hassan",
  dateOfBirth: "1998-04-12",
  gender: "male",
};

function row(overrides: Partial<NeighborhoodRow>): NeighborhoodRow {
  return {
    sourceId: "p1",
    sourceType: "Patient",
    sourceProps: patientProps,
    relType: "HAD_VISIT",
    targetId: "v1",
    targetType: "Visit",
    targetProps: { id: "v1", visitDate: "2026-01-10", reason: "Check-up" },
    ...overrides,
  };
}

describe("buildNeighborhoodPayload", () => {
  it("builds nodes and edges from neighborhood rows", () => {
    const payload = buildNeighborhoodPayload([
      row({}),
      row({
        sourceId: "v1",
        sourceType: "Visit",
        relType: "TREATED_BY",
        targetId: "doc1",
        targetType: "Doctor",
        targetProps: { id: "doc1", name: "Dr. Ahmed Ali", specialty: "Cardiology" },
      }),
    ]);

    expect(payload.nodes.map((n) => n.type).sort()).toEqual([
      "Doctor",
      "Patient",
      "Visit",
    ]);
    expect(payload.edges.map((e) => e.type).sort()).toEqual(["HAD_VISIT", "TREATED_BY"]);
    const doctor = payload.nodes.find((n) => n.type === "Doctor");
    expect(doctor?.label).toBe("Dr. Ahmed Ali");
    const patient = payload.nodes.find((n) => n.type === "Patient");
    expect(patient?.label).toBe("Ahmed Hassan");
    expect(patient?.properties.gender).toBe("male");
  });

  it("deduplicates nodes and relationships shared across paths", () => {
    const payload = buildNeighborhoodPayload([
      row({}),
      row({
        sourceId: "v1",
        sourceType: "Visit",
        relType: "TREATED_BY",
        targetId: "doc1",
        targetType: "Doctor",
        targetProps: { id: "doc1", name: "Dr. Ahmed Ali" },
      }),
      row({
        sourceId: "v1",
        sourceType: "Visit",
        relType: "TREATED_BY",
        targetId: "doc1",
        targetType: "Doctor",
        targetProps: { id: "doc1", name: "Dr. Ahmed Ali" },
      }),
    ]);

    expect(payload.nodes).toHaveLength(3);
    expect(payload.edges).toHaveLength(2);
  });

  it("skips edges with an unknown relationship type", () => {
    const payload = buildNeighborhoodPayload([row({ relType: "MYSTERY_REL" })]);
    expect(payload.edges).toHaveLength(0);
    expect(payload.nodes.map((n) => n.type).sort()).toEqual(["Patient", "Visit"]);
  });

  it("skips nodes with an unknown label", () => {
    const payload = buildNeighborhoodPayload([
      row({ targetType: "Alien", targetProps: { id: "x1" } }),
    ]);
    expect(payload.nodes.map((n) => n.type)).toEqual(["Patient"]);
  });

  it("returns an empty payload for no rows", () => {
    expect(buildNeighborhoodPayload([])).toEqual({ nodes: [], edges: [] });
  });
});