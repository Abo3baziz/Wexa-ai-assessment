import type { PathStepRow } from "@/lib/cognodb/queries/pathBetween";
import type { GraphNode, NodeType, PathLink, PathResult } from "@/types";
import { typeFromLabel } from "./record";

/** Enforce the restricted-pair invariant: only hops between a Patient and the
 * allowed target labels (Disease/Medication/Doctor/Patient). */
const ALLOWED_NODE_TYPES: ReadonlySet<NodeType> = new Set([
  "Patient",
  "Disease",
  "Medication",
  "Doctor",
]);

function routeLabel(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Map a shortestPath result into a PathResult. Returns `found: false` when no
 * path exists (empty rows) or when the shortestPath result is malformed.
 */
export function mapPathResult(rows: PathStepRow[]): PathResult {
  const row = rows[0];
  if (!row) {
    return { found: false, links: [], nodes: [] };
  }

  const nodes: GraphNode[] = row.nodes.map((n) => {
    const type = typeFromLabel(routeLabel(n.label));
    return {
      id: routeLabel(n.id),
      type: type ?? "Patient",
      label: routeLabel(n.label),
      properties: {},
    };
  });

  const links: PathLink[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i]!;
    const to = nodes[i + 1]!;
    const relationship = row.relationships[i]?.type ?? "UNKNOWN";
    links.push({
      fromId: from.id,
      fromType: from.type,
      toId: to.id,
      toType: to.type,
      relationship,
    });
  }

  const valid = nodes.every(
    (n) => n.id !== "" && ALLOWED_NODE_TYPES.has(n.type)
  );

  return { found: valid && nodes.length > 0, links, nodes };
}
