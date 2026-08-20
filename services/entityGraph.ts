import type {
  EntityGraphLabel,
  EntityGraphRow,
} from "@/lib/cognodb/queries/entityGraph";
import { ENTITY_GRAPH_LABELS } from "@/lib/cognodb/queries/entityGraph";
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

function nodeId(value: UnknownRecord): string {
  return typeof value.id === "string" ? value.id : "";
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
 * Build a deduplicated GraphPayload from an entity's neighborhood rows.
 * The root node is always included even when the entity has no relationships.
 */
export function buildEntityGraphPayload(rows: EntityGraphRow[]): GraphPayload {
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

  if (rows.length > 0) {
    const root = rows[0]!.root as UnknownRecord;
    addNode(root, rows[0]!.rootType, nodeId(root));
  }

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

export interface EntitySummary {
  type: EntityGraphLabel;
  id: string;
  label: string;
  properties: Record<string, string>;
}

/** Extract a stable summary of the root entity from the neighborhood rows. */
export function buildEntitySummary(rows: EntityGraphRow[]): EntitySummary | null {
  if (rows.length === 0) return null;
  const root = rows[0]!.root as UnknownRecord;
  const type = rows[0]!.rootType;
  if (!ENTITY_GRAPH_LABELS.includes(type as EntityGraphLabel)) return null;
  return {
    type: type as EntityGraphLabel,
    id: nodeId(root),
    label: labelOf(root, type),
    properties: propsOf(root),
  };
}
