import type { PathStepRow } from "@/lib/cognodb/queries/pathBetween";
import type { GraphNode, PathLink, PathResult } from "@/types";
import { typeFromLabel } from "./record";

function routeLabel(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Map a shortestPath result into a PathResult. Returns `found: false` when no
 * path exists (empty rows) or when the shortestPath result is malformed.
 * The restricted-pair invariant (Patient ↔ Disease/Medication/Doctor/Patient)
 * is enforced by the picker and the route's `requirePathTargetLabel`; nodes in
 * the middle of a valid path may be any entity (Visit, Department, …).
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
      label: routeLabel(n.title) || routeLabel(n.label),
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

  const knownTypes = row.nodes.every((n) => {
    return typeFromLabel(routeLabel(n.label)) !== undefined;
  });

  const valid = nodes.every((n) => n.id !== "") && knownTypes;

  return { found: valid && nodes.length > 0, links, nodes };
}
