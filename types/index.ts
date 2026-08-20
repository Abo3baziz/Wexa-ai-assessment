export type NodeType =
  | "Patient"
  | "Visit"
  | "Doctor"
  | "Department"
  | "Disease"
  | "Medication"
  | "Diagnosis"
  | "Prescription";

export const GRAPH_DEPTHS = [1, 2, 3] as const;
export type GraphDepth = (typeof GRAPH_DEPTHS)[number];

export type RelationshipType =
  | "HAD_VISIT"
  | "TREATED_BY"
  | "WORKS_IN"
  | "RESULTED_IN"
  | "FOR_DISEASE"
  | "GENERATED"
  | "FOR_MEDICATION"
  | "HAS_DISEASE"
  | "TAKES";

export type Gender = "male" | "female" | "other";

export interface Patient {
  id: string;
  publicId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
}

export interface Visit {
  id: string;
  visitDate: string;
  reason: string;
  notes: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Disease {
  id: string;
  name: string;
  category: string;
}

export interface Medication {
  id: string;
  name: string;
  dosageForm: string;
}

export interface Diagnosis {
  id: string;
  diagnosedAt: string;
  severity: string;
  notes: string;
}

export interface Prescription {
  id: string;
  prescribedAt: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PatientStats {
  diseases: number;
  visits: number;
  medications: number;
  doctors: number;
}

export type ConditionStatus = "active" | "resolved";
export type MedicationStatus = "active" | "discontinued";

export interface CurrentDisease {
  disease: Disease;
  status: ConditionStatus;
  since: string;
}

export interface CurrentMedication {
  medication: Medication;
  status: MedicationStatus;
  since: string;
}

export interface PatientHealthSummary {
  currentDiseases: CurrentDisease[];
  currentMedications: CurrentMedication[];
}

export interface PatientOverview {
  patient: Patient;
  stats: PatientStats;
  health: PatientHealthSummary;
}

/** A single visit in a patient's care pathway, with its doctor/department and
 * any diagnoses made (and the diseases they were for). */
export interface PlanDiagnosis {
  id: string;
  diagnosedAt: string;
  severity: string;
  disease: Disease | null;
}

export interface CarePathwayEntry {
  visit: Visit;
  doctor: Doctor | null;
  department: Department | null;
  diagnoses: PlanDiagnosis[];
  medications: Medication[];
}

export interface CarePathway {
  patient: Patient;
  visits: CarePathwayEntry[];
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, string>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Per-type visibility toggle for the graph explorer (all on by default). */
export type GraphFilters = Record<NodeType, boolean>;

/** The node currently inspected in the graph explorer. */
export interface SelectedNode {
  node: GraphNode;
  /** True when this is the root patient/entity the graph is centered on. */
  isRoot: boolean;
  /** Ids of directly connected nodes (from the loaded payload). */
  neighbors: string[];
  /** Why a discovered patient is related, when known (non-root patients). */
  related: RelatedPatient | null;
}

/** A non-patient entity (Doctor/Department/Disease/Medication) to explore. */
export interface EntitySummary {
  type: Exclude<NodeType, "Patient" | "Visit" | "Diagnosis" | "Prescription">;
  id: string;
  label: string;
  properties: Record<string, string>;
}

export type RelatedReason = "shared_disease" | "shared_medication" | "shared_doctor";

export interface RelatedPatient {
  patient: Patient;
  reasons: RelatedReason[];
  sharedDiseases: string[];
  sharedMedications: string[];
  sharedDoctors: string[];
  connectionCount: number;
}

export interface SearchResult {
  type: NodeType;
  id: string;
  label: string;
  subtitle: string;
  /** The publicId used to load a patient; empty for non-patient entities. */
  publicId: string;
}

export interface PathLink {
  fromId: string;
  fromType: NodeType;
  toId: string;
  toType: NodeType;
  relationship: string;
}

export interface PathResult {
  found: boolean;
  links: PathLink[];
  nodes: GraphNode[];
}

export interface HealthStatus {
  ok: boolean;
  connected: boolean;
}
