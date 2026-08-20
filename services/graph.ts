import type { NeighborhoodRow } from "@/lib/cognodb/queries/patientGraph";
import type { GraphEdge, GraphNode, GraphPayload, RelationshipType } from "@/types";

import { typeFromLabel } from "./record";

type UnknownRecord = Record<string, unknown>;

const RELATIONSHIP_TYPES: ReadonlySet<string> = new Set([
  "HAD_VISIT",
  "TREATED_BY",
  "WORKS_IN",
  "RESULTED_IN",
  "FOR_DISEASE",
  "GENERATED",
  "FOR_MEDICATION",
  "HAS_DISEASE",
  "TAKES",
]);

function relationshipTypeOf(value: string): RelationshipType | null {
  return RELATIONSHIP_TYPES.has(value) ? (value as RelationshipType) : null;
}

function propsOf(value: UnknownRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== null && typeof v === "string") out[k] = v;
  }
  return out;
}

function labelOf(value: UnknownRecord, type: string): string {
  if (type === "Patient") {
    const first = typeof value.firstName === "string" ? value.firstName : "";
    const last = typeof value.lastName === "string" ? value.lastName : "";
    if (first || last) return `${first} ${last}`.trim();
  }
  if (type === "Visit" && typeof value.visitDate === "string") {
    return value.visitDate;
  }
  if (typeof value.name === "string") return value.name;
  if (typeof value.publicId === "string") return value.publicId;
  if (typeof value.id === "string") return value.id;
  return "";
}

/**
 * Build a deduplicated GraphPayload from a patient's neighborhood rows.
 * Multi-hop paths that share a relationship are coalesced so each node and
 * each relationship appears exactly once.
 */
export function buildNeighborhoodPayload(rows: NeighborhoodRow[]): GraphPayload {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (record: UnknownRecord, type: string, id: string) => {
    const nodeType = typeFromLabel(type);
    if (!nodeType || !id) return;
    const key = `${nodeType}:${id}`;
    if (!nodes.has(key)) {
      nodes.set(key, {
        id,
        type: nodeType,
        label: labelOf(record, type),
        properties: propsOf(record),
      });
    }
  };

  for (const row of rows) {
    addNode(row.sourceProps, row.sourceType, row.sourceId);
    addNode(row.targetProps, row.targetType, row.targetId);
    if (!row.sourceId || !row.targetId) continue;
    const relType = relationshipTypeOf(row.relType);
    if (!relType) continue;
    const ek = `${row.sourceId}->${row.targetId}::${relType}`;
    if (!edges.has(ek)) {
      edges.set(ek, {
        id: ek,
        source: row.sourceId,
        target: row.targetId,
        type: relType,
      });
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}