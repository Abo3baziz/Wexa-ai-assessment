import { withSession } from "../driver";

/**
 * Run a Cypher query inside a managed session with the given parameters.
 * The structure of the query is kept separate from parameters (never
 * interpolated). Results are returned as raw neo4j Records for the service
 * layer to map into domain types.
 */
export async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(async (session) => {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record as unknown as T);
  });
}
