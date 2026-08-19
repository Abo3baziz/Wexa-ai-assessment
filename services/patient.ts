import type { CarePathwayRow } from "@/lib/cognodb/queries/carePathway";
import type { PatientHistoryRow } from "@/lib/cognodb/queries/patientHistory";
import type { RelatedPatientRow } from "@/lib/cognodb/queries/relatedPatients";
import type {
  CarePathway,
  CarePathwayEntry,
  ConditionStatus,
  CurrentDisease,
  CurrentMedication,
  MedicationStatus,
  PatientOverview,
  PatientStats,
  RelatedPatient,
  RelatedReason,
} from "@/types";
import {
  departmentFromRecord,
  diseaseFromRecord,
  doctorFromRecord,
  medicationFromRecord,
  patientFromRecord,
} from "./record";

type UnknownRecord = Record<string, unknown>;

function conditionStatus(value: unknown): ConditionStatus {
  return value === "resolved" ? "resolved" : "active";
}

function medicationStatus(value: unknown): MedicationStatus {
  return value === "discontinued" ? "discontinued" : "active";
}

/** Aggregate a patient's ego-subgraph rows into a single PatientOverview. */
export function mapPatientOverview(rows: PatientHistoryRow[]): PatientOverview {
  if (rows.length === 0) {
    return {
      patient: {
        id: "",
        publicId: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "other",
      },
      stats: { diseases: 0, visits: 0, medications: 0, doctors: 0 },
      health: { currentDiseases: [], currentMedications: [] },
    };
  }

  const first = rows[0]!;
  const patient = patientFromRecord(first.patient as UnknownRecord);

  const diseases = new Set<string>();
  const medications = new Set<string>();
  const doctors = new Set<string>();
  const visits = new Set<string>();

  const currentDiseases = new Map<string, CurrentDisease>();
  const currentMedications = new Map<string, CurrentMedication>();

  for (const row of rows) {
    if (row.visit) {
      const id = typeof row.visit.id === "string" ? row.visit.id : "";
      if (id) visits.add(id);
    }
    if (row.doctor) {
      doctors.add(doctorFromRecord(row.doctor as UnknownRecord).id);
    }
    if (row.disease) {
      diseases.add(diseaseFromRecord(row.disease as UnknownRecord).id);
    }
    if (row.diagnosis && row.disease) {
      diseases.add(diseaseFromRecord(row.disease as UnknownRecord).id);
    }
    if (row.medication) {
      medications.add(medicationFromRecord(row.medication as UnknownRecord).id);
    }
    if (row.prescription && row.medication) {
      medications.add(medicationFromRecord(row.medication as UnknownRecord).id);
    }
    if (row.activeDisease && row.hasDisease) {
      currentDiseases.set(
        strId(row.activeDisease),
        {
          disease: diseaseFromRecord(row.activeDisease as UnknownRecord),
          status: conditionStatus(row.hasDisease.status),
          since: row.hasDisease.since,
        }
      );
    }
    if (row.activeMedication && row.takes) {
      currentMedications.set(
        strId(row.activeMedication),
        {
          medication: medicationFromRecord(row.activeMedication as UnknownRecord),
          status: medicationStatus(row.takes.status),
          since: row.takes.since,
        }
      );
    }
  }

  const stats: PatientStats = {
    diseases: diseases.size,
    visits: visits.size,
    medications: medications.size,
    doctors: doctors.size,
  };

  return {
    patient,
    stats,
    health: {
      currentDiseases: [...currentDiseases.values()],
      currentMedications: [...currentMedications.values()],
    },
  };
}

function strId(value: UnknownRecord): string {
  return typeof value.id === "string" ? value.id : "";
}

/** Map related-patient rows to typed RelatedPatient DTOs. */
export function mapRelatedPatients(rows: RelatedPatientRow[]): RelatedPatient[] {
  return rows.map((row) => {
    const sharedDiseases = row.sharedDiseases ?? [];
    const sharedMedications = row.sharedMedications ?? [];
    const sharedDoctors = row.sharedDoctors ?? [];

    const reasons: RelatedReason[] = [];
    if (sharedDiseases.length > 0) reasons.push("shared_disease");
    if (sharedMedications.length > 0) reasons.push("shared_medication");
    if (sharedDoctors.length > 0) reasons.push("shared_doctor");

    const patient = patientFromRecord(row.patient as UnknownRecord);

    return {
      patient,
      reasons,
      sharedDiseases,
      sharedMedications,
      sharedDoctors,
      connectionCount: row.connectionCount ?? 0,
    };
  });
}

/** Map care-pathway rows into a typed CarePathway grouped by visit. */
export function mapCarePathway(rows: CarePathwayRow[]): CarePathway {
  if (rows.length === 0) {
    return {
      patient: {
        id: "",
        publicId: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "other",
      },
      visits: [],
    };
  }

  const first = rows[0]!;
  const patient = patientFromRecord(first.patient as UnknownRecord);
  const byId = new Map<
    string,
    { entry: CarePathwayEntry; indexes: Map<string, number> }
  >();

  for (const row of rows) {
    const visit = row.visit as UnknownRecord;
    const visitId = strId(visit);
    let bucket = byId.get(visitId);
    if (!bucket) {
      bucket = {
        entry: {
          visit: {
            id: visitId,
            visitDate: strField(visit, "visitDate"),
            reason: strField(visit, "reason"),
            notes: strField(visit, "notes"),
          },
          doctor: null,
          department: null,
          diagnoses: [],
          medications: [],
        },
        indexes: new Map(),
      };
      byId.set(visitId, bucket);
    }
    if (row.doctor) {
      bucket.entry.doctor = doctorFromRecord(row.doctor as UnknownRecord);
    }
    if (row.department) {
      bucket.entry.department = departmentFromRecord(
        row.department as UnknownRecord
      );
    }
    if (row.diagnosis) {
      const diagnosisId = strId(row.diagnosis as UnknownRecord);
      if (!bucket.indexes.has(diagnosisId)) {
        bucket.indexes.set(diagnosisId, bucket.entry.diagnoses.length);
        bucket.entry.diagnoses.push({
          id: diagnosisId,
          diagnosedAt: strField(row.diagnosis as UnknownRecord, "diagnosedAt"),
          severity: strField(row.diagnosis as UnknownRecord, "severity"),
          disease: null,
        });
      }
      if (row.disease) {
        const idx = bucket.indexes.get(diagnosisId);
        const diagnosis = idx !== undefined ? bucket.entry.diagnoses[idx] : undefined;
        if (diagnosis) {
          diagnosis.disease = diseaseFromRecord(row.disease as UnknownRecord);
        }
      }
    }
  }

  const visits = [...byId.values()]
    .map((b) => b.entry)
    .sort((a, b) => b.visit.visitDate.localeCompare(a.visit.visitDate));

  return { patient, visits };
}

function strField(value: UnknownRecord, key: string): string {
  return typeof value[key] === "string" ? (value[key] as string) : "";
}
