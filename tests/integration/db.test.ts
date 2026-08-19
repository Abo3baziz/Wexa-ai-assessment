import { config as loadDotenv } from "dotenv";
import neo4j from "neo4j-driver";
import { afterAll, describe, expect, it } from "vitest";

import { findCarePathway } from "@/lib/cognodb/queries/carePathway";
import { findConnectedPatients } from "@/lib/cognodb/queries/connectedPatients";
import { findEntityGraph } from "@/lib/cognodb/queries/entityGraph";
import { findPathBetween } from "@/lib/cognodb/queries/pathBetween";
import { findPatientHistory } from "@/lib/cognodb/queries/patientHistory";
import { findRelatedPatients } from "@/lib/cognodb/queries/relatedPatients";
import { searchEntities } from "@/lib/cognodb/queries/search";
import { getDriver, closeDriver } from "@/lib/cognodb/driver";
import { buildEntityGraphPayload } from "@/services/entityGraph";
import {
  mapCarePathway,
  mapPatientOverview,
  mapRelatedPatients,
} from "@/services/patient";
import { mapPathResult } from "@/services/path";
import { mapSearchResults } from "@/services/search";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const uri = process.env.COGNODB_URI;

const gated = describe.skipIf(
  !uri || typeof uri !== "string" || uri.trim() === ""
);

afterAll(async () => {
  await closeDriver();
});

gated("CognoDB integration (live instance)", () => {
  it("connects to the live instance", async () => {
    await expect(getDriver().verifyConnectivity()).resolves.toBeTruthy();
  });

  it("seeded patient exists and returns a populated history", async () => {
    const rows = await findPatientHistory("P-1001");
    expect(rows.length).toBeGreaterThan(0);

    const overview = mapPatientOverview(rows);
    expect(overview.patient.publicId).toBe("P-1001");
    expect(overview.patient.firstName).not.toBe("");
    expect(overview.patient.nationalId).not.toBe("");
    expect(overview.stats.visits).toBeGreaterThan(0);
    expect(overview.stats.diseases).toBeGreaterThan(0);
  });

  it("finds a patient multi-hop care pathway", async () => {
    const rows = await findCarePathway("P-1001");
    const pathway = mapCarePathway(rows);

    expect(pathway.patient.publicId).toBe("P-1001");
    expect(pathway.visits.length).toBeGreaterThan(0);

    const withDoctor = pathway.visits.find((v) => v.doctor !== null);
    expect(withDoctor).toBeDefined();
  });

  it("finds related patients through the graph", async () => {
    const rows = await findRelatedPatients("P-1001", 12);
    const related = mapRelatedPatients(rows);

    expect(Array.isArray(related)).toBe(true);
    const first = related[0];
    if (first) {
      expect(first.patient.publicId).not.toBe("P-1001");
      expect(first.connectionCount).toBeGreaterThan(0);
      expect(first.reasons.length).toBeGreaterThan(0);
    }
  });

  it("finds connected patients via bounded traversal", async () => {
    const rows = await findConnectedPatients("P-1001", 3, 12);
    expect(Array.isArray(rows)).toBe(true);
  });

  it("finds a shortest path between a patient and a disease", async () => {
    const rows = await findPathBetween({
      fromId: "P-1001",
      toId: "d-1",
      toLabel: "Disease",
      maxDepth: 6,
    });
    const result = mapPathResult(rows);
    expect(result.found).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(1);
  });

  it("returns an empty result for a nonexistent patient id", async () => {
    const rows = await findPatientHistory("P-9999");
    expect(rows).toHaveLength(0);
  });

  it("returns empty search matches for a nonsense query", async () => {
    const rows = await searchEntities("zzzz-no-such-term", 8);
    expect(mapSearchResults(rows)).toHaveLength(0);
  });

  it("finds a patient by national ID", async () => {
    const history = await findPatientHistory("P-1001");
    const nationalId = history[0]?.patient.nationalId ?? "";
    expect(nationalId).not.toBe("");

    const rows = await searchEntities(nationalId, 8);
    const results = mapSearchResults(rows);
    const patient = results.find((r) => r.type === "Patient");
    expect(patient).toBeDefined();
    expect(patient?.subtitle).toBe(nationalId);
  });

  it("national-id mode matches only patients by national ID", async () => {
    const history = await findPatientHistory("P-1001");
    const nationalId = history[0]?.patient.nationalId ?? "";

    const rows = await searchEntities(nationalId, 8, "national-id");
    const results = mapSearchResults(rows);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.type).toBe("Patient");
    }
  });

  it("doctor mode returns only doctors", async () => {
    const rows = await searchEntities("Dr.", 8, "doctor");
    const results = mapSearchResults(rows);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.type).toBe("Doctor");
    }
  });

  it("department mode returns departments", async () => {
    const rows = await searchEntities("Department of", 8, "department");
    const results = mapSearchResults(rows);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.type).toBe("Department");
    }
  });

  it("builds an entity graph for a doctor", async () => {
    const search = mapSearchResults(await searchEntities("Dr. ", 8, "doctor"));
    const doctor = search[0];
    if (!doctor) return;
    const rows = await findEntityGraph("Doctor", doctor.id);
    const payload = buildEntityGraphPayload(rows);
    expect(payload.nodes.length).toBeGreaterThan(0);
    expect(payload.nodes.some((n) => n.type === "Patient")).toBe(true);
  });

  it("rejects when the database is unreachable", async () => {
    // A throwaway driver pointed at a closed/local port must fail to connect,
    // exercising the DB-unavailable path without depending on live credentials.
    const bad = neo4j.driver(
      "bolt://127.0.0.1:1",
      neo4j.auth.basic("cognodb", "wrong")
    );
    try {
      await expect(bad.verifyConnectivity()).rejects.toBeTruthy();
    } finally {
      await bad.close();
    }
  });
});
