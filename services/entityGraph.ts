import type {
  EntityGraphLabel,
  EntityGraphRow,
} from "@/lib/cognodb/queries/entityGraph";
import { ENTITY_GRAPH_LABELS } from "@/lib/cognodb/queries/entityGraph";
import type { GraphEdge, GraphNode, GraphPayload } from "@/types";
import { typeFromLabel } from "./record";

type UnknownRecord = Record<string, unknown>;

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

function labelOf(value: UnknownRecord): string {
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
        label: labelOf(record),
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
    const ek = `${row.sourceId}->${row.targetId}::${row.relType}`;
    if (!edges.has(ek)) {
      edges.set(ek, {
        id: ek,
        source: row.sourceId,
        target: row.targetId,
        type: row.relType,
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
    label: labelOf(root),
    properties: propsOf(root),
  };
}
