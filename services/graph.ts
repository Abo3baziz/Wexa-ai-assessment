import type { PatientHistoryRow } from "@/lib/cognodb/queries/patientHistory";
import type {
  GraphEdge,
  GraphNode,
  GraphPayload,
  NodeType,
} from "@/types";

type UnknownRecord = Record<string, unknown>;

function keyOf(id: string, type: NodeType): string {
  return `${type}:${id}`;
}

function nodeId(value: UnknownRecord): string {
  return typeof value.id === "string" ? value.id : "";
}

function label(value: UnknownRecord): string {
  if (typeof value.name === "string") return value.name;
  if (typeof value.publicId === "string") return value.publicId;
  if (typeof value.id === "string") return value.id;
  return "";
}

function propsOf(value: UnknownRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== null && typeof v === "string") out[k] = v;
  }
  return out;
}

/**
 * Build a deduplicated GraphPayload (nodes + edges) from a patient's history
 * ego-subgraph. Multi-hop paths that share a relationship are coalesced so each
 * node and each relationship appears exactly once.
 */
export function buildGraphPayload(rows: PatientHistoryRow[]): GraphPayload {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (record: UnknownRecord, type: NodeType, id: string) => {
    if (!id) return;
    const k = keyOf(id, type);
    if (!nodes.has(k)) {
      nodes.set(k, {
        id,
        type,
        label: label(record),
        properties: propsOf(record),
      });
    }
  };

  const addEdge = (
    sourceRecord: UnknownRecord,
    targetRecord: UnknownRecord,
    relType: string
  ) => {
    const source = nodeId(sourceRecord);
    const target = nodeId(targetRecord);
    if (!source || !target) return;
    const ek = `${source}->${target}::${relType}`;
    if (!edges.has(ek)) {
      edges.set(ek, {
        id: ek,
        source,
        target,
        type: relType,
      });
    }
  };

  for (const row of rows) {
    const patient = row.patient as UnknownRecord;
    const patientId = nodeId(patient);
    addNode(patient, "Patient", patientId);

    if (row.visit) {
      const visit = row.visit as UnknownRecord;
      addNode(visit, "Visit", nodeId(visit));
      addEdge(patient, visit, "HAD_VISIT");
    }
    if (row.doctor) {
      const doctor = row.doctor as UnknownRecord;
      addNode(doctor, "Doctor", nodeId(doctor));
      if (row.visit) {
        addEdge(row.visit as UnknownRecord, doctor, "TREATED_BY");
      }
    }
    if (row.department) {
      const dept = row.department as UnknownRecord;
      addNode(dept, "Department", nodeId(dept));
      if (row.doctor) {
        addEdge(row.doctor as UnknownRecord, dept, "WORKS_IN");
      }
    }
    if (row.diagnosis) {
      const dg = row.diagnosis as UnknownRecord;
      addNode(dg, "Diagnosis", nodeId(dg));
      if (row.visit) {
        addEdge(row.visit as UnknownRecord, dg, "RESULTED_IN");
      }
    }
    if (row.disease && row.diagnosis) {
      const dis = row.disease as UnknownRecord;
      addNode(dis, "Disease", nodeId(dis));
      addEdge(row.diagnosis as UnknownRecord, dis, "FOR_DISEASE");
    }
    if (row.prescription) {
      const rx = row.prescription as UnknownRecord;
      addNode(rx, "Prescription", nodeId(rx));
      if (row.visit) {
        addEdge(row.visit as UnknownRecord, rx, "GENERATED");
      }
    }
    if (row.medication && row.prescription) {
      const med = row.medication as UnknownRecord;
      addNode(med, "Medication", nodeId(med));
      addEdge(row.prescription as UnknownRecord, med, "FOR_MEDICATION");
    }
    if (row.activeDisease) {
      const dis = row.activeDisease as UnknownRecord;
      addNode(dis, "Disease", nodeId(dis));
      addEdge(patient, dis, "HAS_DISEASE");
    }
    if (row.activeMedication) {
      const med = row.activeMedication as UnknownRecord;
      addNode(med, "Medication", nodeId(med));
      addEdge(patient, med, "TAKES");
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
