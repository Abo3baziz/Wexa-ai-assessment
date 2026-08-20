import { describe, expect, it } from "vitest";

import type { CarePathwayRow } from "@/lib/cognodb/queries/carePathway";
import type { PatientHistoryRow } from "@/lib/cognodb/queries/patientHistory";
import type { RelatedPatientRow } from "@/lib/cognodb/queries/relatedPatients";
import {
  mapCarePathway,
  mapPatientOverview,
  mapRelatedPatients,
} from "@/services/patient";

const patientProps = {
  id: "p1",
  publicId: "P-1001",
  nationalId: "528207534761",
  firstName: "Ashley",
  lastName: "Jones",
  dateOfBirth: "1990-06-15",
  gender: "female",
};

function historyRow(
  overrides: Partial<PatientHistoryRow>
): PatientHistoryRow {
  return {
    patient: patientProps,
    visit: { id: "v1", visitDate: "2026-01-10", reason: "Check-up", notes: "OK" },
    doctor: { id: "doc1", name: "Dr. Sarah Connor", specialty: "Cardiology" },
    department: null,
    diagnosis: null,
    disease: null,
    medication: null,
    prescription: null,
    hasDisease: null,
    takes: null,
    activeDisease: null,
    activeMedication: null,
    ...overrides,
  };
}

describe("mapPatientOverview", () => {
  it("returns an empty DTO for no rows", () => {
    const overview = mapPatientOverview([]);
    expect(overview.patient.id).toBe("");
    expect(overview.stats).toEqual({
      diseases: 0,
      visits: 0,
      medications: 0,
      doctors: 0,
    });
    expect(overview.health.currentDiseases).toEqual([]);
    expect(overview.health.currentMedications).toEqual([]);
  });

  it("maps the patient and counts distinct entities across rows", () => {
    const overview = mapPatientOverview([
      historyRow({}),
      historyRow({
        visit: { id: "v2", visitDate: "2026-02-01", reason: "Follow-up", notes: "" },
        doctor: { id: "doc2", name: "Dr. Alan Turing", specialty: "Neurology" },
      }),
      historyRow({
        diagnosis: { id: "dg1", diagnosedAt: "2026-01-10", severity: "mild" },
        disease: { id: "d1", name: "Anxiety Disorder", category: "Mental" },
      }),
      historyRow({
        prescription: { id: "rx1", prescribedAt: "2026-01-10" },
        medication: { id: "m1", name: "Sertraline", dosageForm: "Tablet" },
      }),
    ]);

    expect(overview.patient).toEqual({
      id: "p1",
      publicId: "P-1001",
      nationalId: "528207534761",
      firstName: "Ashley",
      lastName: "Jones",
      dateOfBirth: "1990-06-15",
      gender: "female",
    });
    expect(overview.stats).toEqual({
      diseases: 1,
      visits: 2,
      medications: 1,
      doctors: 2,
    });
  });

  it("collects current diseases with status and since", () => {
    const overview = mapPatientOverview([
      historyRow({
        hasDisease: { status: "active", since: "2025-03-01" },
        activeDisease: { id: "d2", name: "Type 2 Diabetes", category: "Metabolic" },
      }),
      historyRow({
        hasDisease: { status: "resolved", since: "2024-01-01" },
        activeDisease: { id: "d3", name: "Flu", category: "Infectious" },
      }),
    ]);

    expect(overview.health.currentDiseases).toHaveLength(2);
    const diabetes = overview.health.currentDiseases.find(
      (d) => d.disease.id === "d2"
    );
    expect(diabetes?.status).toBe("active");
    expect(diabetes?.since).toBe("2025-03-01");
    expect(diabetes?.disease.name).toBe("Type 2 Diabetes");
    const flu = overview.health.currentDiseases.find(
      (d) => d.disease.id === "d3"
    );
    expect(flu?.status).toBe("resolved");
  });

  it("collects current medications and maps status", () => {
    const overview = mapPatientOverview([
      historyRow({
        takes: { status: "active", since: "2025-06-01" },
        activeMedication: { id: "m2", name: "Metformin", dosageForm: "Tablet" },
      }),
      historyRow({
        takes: { status: "discontinued", since: "2024-12-01" },
        activeMedication: { id: "m3", name: "Warfarin", dosageForm: "Tablet" },
      }),
    ]);

    const metformin = overview.health.currentMedications.find(
      (m) => m.medication.id === "m2"
    );
    expect(metformin?.status).toBe("active");
    const warfarin = overview.health.currentMedications.find(
      (m) => m.medication.id === "m3"
    );
    expect(warfarin?.status).toBe("discontinued");
  });

  it("falls back to active status for unknown status values", () => {
    const overview = mapPatientOverview([
      historyRow({
        hasDisease: { status: "weird", since: "2025-01-01" },
        activeDisease: { id: "d4", name: "Asthma", category: "Respiratory" },
      }),
    ]);
    expect(overview.health.currentDiseases[0]?.status).toBe("active");
  });
});

function relatedRow(
  overrides: Partial<RelatedPatientRow>
): RelatedPatientRow {
  return {
    patient: {
      id: "p2",
      publicId: "P-1002",
      nationalId: "123456789012",
      firstName: "Carol",
      lastName: "Rodriguez",
    },
    sharedDiseases: ["Type 2 Diabetes"],
    sharedMedications: [],
    sharedDoctors: [],
    connectionCount: 1,
    ...overrides,
  };
}

describe("mapRelatedPatients", () => {
  it("builds reasons from shared entities and counts connections", () => {
    const related = mapRelatedPatients([
      relatedRow({}),
      relatedRow({
        patient: {
          id: "p3",
          publicId: "P-1003",
          nationalId: "999888777666",
          firstName: "Bob",
          lastName: "Smith",
        },
        sharedDiseases: ["Anxiety"],
        sharedMedications: ["Sertraline"],
        sharedDoctors: ["Dr. Sarah Connor"],
        connectionCount: 3,
      }),
    ]);

    expect(related).toHaveLength(2);
    expect(related[0]?.reasons).toEqual(["shared_disease"]);
    expect(related[1]?.reasons).toEqual([
      "shared_disease",
      "shared_medication",
      "shared_doctor",
    ]);
    expect(related[1]?.connectionCount).toBe(3);
    expect(related[0]?.patient.publicId).toBe("P-1002");
  });

  it("produces no reasons for a row with no shared entities", () => {
    const related = mapRelatedPatients([
      relatedRow({
        sharedDiseases: [],
        sharedMedications: [],
        sharedDoctors: [],
        connectionCount: 0,
      }),
    ]);
    expect(related[0]?.reasons).toEqual([]);
    expect(related[0]?.connectionCount).toBe(0);
  });

  it("tolerates missing shared-entity arrays", () => {
    const related = mapRelatedPatients([
      relatedRow({
        sharedDiseases: undefined,
        sharedMedications: undefined,
        sharedDoctors: undefined,
      }),
    ]);
    expect(related[0]?.reasons).toEqual([]);
  });

  it("returns an empty list for no rows", () => {
    expect(mapRelatedPatients([])).toEqual([]);
  });
});

function pathwayRow(overrides: Partial<CarePathwayRow>): CarePathwayRow {
  return {
    patient: patientProps,
    visit: { id: "v1", visitDate: "2026-01-10", reason: "Check-up" },
    doctor: { id: "doc1", name: "Dr. Sarah Connor", specialty: "Cardiology" },
    department: { id: "dept1", name: "Cardiology" },
    diagnosis: null,
    disease: null,
    ...overrides,
  };
}

describe("mapCarePathway", () => {
  it("returns an empty pathway for no rows", () => {
    const pathway = mapCarePathway([]);
    expect(pathway.patient.id).toBe("");
    expect(pathway.visits).toEqual([]);
  });

  it("groups rows by visit and attaches doctor, department, diagnoses", () => {
    const pathway = mapCarePathway([
      pathwayRow({}),
      pathwayRow({
        diagnosis: { id: "dg1", diagnosedAt: "2026-01-10", severity: "mild" },
        disease: { id: "d1", name: "Anxiety Disorder", category: "Mental" },
      }),
    ]);

    expect(pathway.patient.publicId).toBe("P-1001");
    expect(pathway.visits).toHaveLength(1);
    const visit = pathway.visits[0]!;
    expect(visit.visit).toEqual({
      id: "v1",
      visitDate: "2026-01-10",
      reason: "Check-up",
      notes: "",
    });
    expect(visit.doctor?.name).toBe("Dr. Sarah Connor");
    expect(visit.department?.name).toBe("Cardiology");
    expect(visit.diagnoses).toHaveLength(1);
    expect(visit.diagnoses[0]?.disease?.name).toBe("Anxiety Disorder");
  });

  it("deduplicates a diagnosis that appears on multiple rows", () => {
    const pathway = mapCarePathway([
      pathwayRow({
        diagnosis: { id: "dg1", diagnosedAt: "2026-01-10", severity: "mild" },
        disease: { id: "d1", name: "Anxiety Disorder", category: "Mental" },
      }),
      pathwayRow({
        diagnosis: { id: "dg1", diagnosedAt: "2026-01-10", severity: "mild" },
        disease: { id: "d9", name: "Insomnia", category: "Mental" },
      }),
    ]);

    expect(pathway.visits[0]?.diagnoses).toHaveLength(1);
  });

  it("sorts visits newest first", () => {
    const pathway = mapCarePathway([
      pathwayRow({ visit: { id: "v1", visitDate: "2026-01-10", reason: "A" } }),
      pathwayRow({ visit: { id: "v2", visitDate: "2026-03-20", reason: "B" } }),
      pathwayRow({ visit: { id: "v3", visitDate: "2025-11-02", reason: "C" } }),
    ]);

    expect(pathway.visits.map((v) => v.visit.id)).toEqual(["v2", "v1", "v3"]);
  });
});