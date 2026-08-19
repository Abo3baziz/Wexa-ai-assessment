import type {
  Department,
  Disease,
  Doctor,
  Gender,
  Medication,
  NodeType,
  Patient,
} from "@/types";

type UnknownRecord = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function genderFrom(value: unknown): Gender {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }
  return "other";
}

export function patientFromRecord(value: UnknownRecord): Patient {
  return {
    id: str(value.id),
    publicId: str(value.publicId),
    nationalId: str(value.nationalId),
    firstName: str(value.firstName),
    lastName: str(value.lastName),
    dateOfBirth: str(value.dateOfBirth),
    gender: genderFrom(value.gender),
  };
}

export function doctorFromRecord(value: UnknownRecord): Doctor {
  return {
    id: str(value.id),
    name: str(value.name),
    specialty: str(value.specialty),
  };
}

export function departmentFromRecord(value: UnknownRecord): Department {
  return { id: str(value.id), name: str(value.name) };
}

export function diseaseFromRecord(value: UnknownRecord): Disease {
  return {
    id: str(value.id),
    name: str(value.name),
    category: str(value.category),
  };
}

export function medicationFromRecord(value: UnknownRecord): Medication {
  return {
    id: str(value.id),
    name: str(value.name),
    dosageForm: str(value.dosageForm),
  };
}

/** Map a Cypher node label to a domain NodeType, or undefined when unknown. */
const LABEL_TO_TYPE: Record<string, NodeType> = {
  Patient: "Patient",
  Visit: "Visit",
  Doctor: "Doctor",
  Department: "Department",
  Disease: "Disease",
  Medication: "Medication",
  Diagnosis: "Diagnosis",
  Prescription: "Prescription",
};

export function typeFromLabel(label: string): NodeType | undefined {
  return LABEL_TO_TYPE[label];
}
