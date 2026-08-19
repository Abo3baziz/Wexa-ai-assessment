import {
  isInt,
  isNode,
  isPath,
  isRelationship,
} from "neo4j-driver";

import { withSession } from "../driver";

/**
 * Recursively convert neo4j values (Nodes, Relationships, Integers, Paths,
 * arrays, plain objects) into plain JS. Nodes and Relationships become their
 * property map so the service layer can read fields as ordinary properties.
 */
function toPlain(value: unknown): unknown {
  if (isNode(value)) {
    return toPlain(value.properties);
  }
  if (isRelationship(value)) {
    return toPlain(value.properties);
  }
  if (isPath(value)) {
    return value.segments.length === 0
      ? null
      : {
          nodes: value.segments.map((s) => toPlain(s.start)),
          relationships: value.segments.map((s) => toPlain(s.relationship)),
        };
  }
  if (isInt(value)) {
    return value.toNumber();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPlain(item));
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.get === "function" && typeof record.toObject === "function") {
      return toPlain(record.toObject());
    }
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      out[key] = toPlain(item);
    }
    return out;
  }
  return value;
}

/**
 * Run a Cypher query inside a managed session with the given parameters.
 * The structure of the query is kept separate from parameters (never
 * interpolated). Each neo4j Record is flattened to a plain object (Nodes,
 * Relationships and Integers recursively unwrapped) so the service layer can
 * read them as ordinary properties.
 */
export async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(async (session) => {
    const result = await session.run(cypher, params);
    return result.records.map((record) => toPlain(record.toObject()) as T);
  });
}
