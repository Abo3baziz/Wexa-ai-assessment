import { runQuery } from "./runner";

/**
 * Q4 — Path exploration between two entities (shortestPath, variable depth).
 * Restricted to meaningful pairs (Patient ↔ Disease/Medication/Doctor/Patient)
 * so users discover *why* entities are connected without meaningless detours.
 */
export interface PathStepRow {
  nodes: Array<{ id: string; label: string; title: string }>;
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
  const depth = clampDepth(maxDepth);
  const query = `
    MATCH (a:Patient {publicId: $fromId})
    MATCH (b:${toLabel} {id: $toId})
    MATCH p = shortestPath((a)-[*1..${depth}]-(b))
    RETURN
      [n IN nodes(p) | {
        id: coalesce(n.publicId, n.id),
        label: head(labels(n)),
        title: coalesce(n.name, n.firstName + ' ' + n.lastName, n.id)
      }] AS nodes,
      [r IN relationships(p) | {type: type(r)}] AS relationships
  `;
  return runQuery<PathStepRow>(query, { fromId, toId });
}

/**
 * Neo4j forbids parameters inside variable-length relationship bounds
 * (`[*1..$max]` is a syntax error), so the depth must appear as a literal.
 * Clamp to the safe range [1, 10]; callers validate the user-supplied value
 * before reaching here.
 */
function clampDepth(maxDepth: number): number {
  if (!Number.isInteger(maxDepth) || maxDepth < 1) return 1;
  if (maxDepth > 10) return 10;
  return maxDepth;
}
