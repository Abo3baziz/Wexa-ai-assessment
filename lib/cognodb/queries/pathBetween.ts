import { runQuery } from "./runner";

/**
 * Q4 — Path exploration between two entities (shortestPath, variable depth).
 * Restricted to meaningful pairs (Patient ↔ Disease/Medication/Doctor/Patient)
 * so users discover *why* entities are connected without meaningless detours.
 */
export interface PathStepRow {
  nodes: Array<{ id: string; label: string }>;
  relationships: Array<{ type: string }>;
}

/**
 * Labels a Patient can connect to in the path explorer.
 * `toLabel` is validated against this allowlist before being embedded; the id
 * values are always passed as parameters.
 */
export const PATH_TARGET_LABELS = [
  "Disease",
  "Medication",
  "Doctor",
  "Patient",
] as const;

export type PathTargetLabel = (typeof PATH_TARGET_LABELS)[number];

export interface PathParams {
  fromId: string;
  toId: string;
  toLabel: PathTargetLabel;
  maxDepth: number;
}

export function buildPathParams(
  toLabel: PathTargetLabel,
  toId: string,
  fromId: string,
  maxDepth = 6
): PathParams {
  return { fromId, toId, toLabel, maxDepth };
}

export function findPathBetween({
  fromId,
  toId,
  toLabel,
  maxDepth,
}: PathParams) {
  const query = `
    MATCH (a:Patient {publicId: $fromId})
    MATCH (b:${toLabel} {id: $toId})
    MATCH p = shortestPath((a)-[*1..$maxDepth]-(b))
    RETURN
      [n IN nodes(p) | {id: coalesce(n.publicId, n.id), label: head(labels(n))}] AS nodes,
      [r IN relationships(p) | {type: type(r)}] AS relationships
  `;
  return runQuery<PathStepRow>(query, { fromId, toId, maxDepth });
}
