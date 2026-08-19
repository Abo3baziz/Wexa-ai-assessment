import "server-only";

import neo4j, { type Driver, type Session } from "neo4j-driver";
import { loadCognoDBConfig } from "./config";

export class CognodbError extends Error {
  override readonly name = "CognodbError";

  /** True when the failure is a connectivity/auth issue and retrying may help. */
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, cause?: unknown) {
    super(message);
    this.retryable = retryable;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

const globalForCognodb = globalThis as unknown as {
  cognodbDriver?: Driver;
};

/**
 * Lazy, cached CognoDB driver using the official Neo4j driver.
 * Reused across requests in dev (Next.js hot-reload safe via globalThis).
 */
export function getDriver(): Driver {
  if (!globalForCognodb.cognodbDriver) {
    const config = loadCognoDBConfig();
    globalForCognodb.cognodbDriver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      { connectionTimeout: 10_000 }
    );
  }
  return globalForCognodb.cognodbDriver;
}

/** Verify the driver can reach CognoDB. Resolves true, or throws CognodbError. */
export async function verifyConnection(): Promise<boolean> {
  const driver = getDriver();
  try {
    await driver.verifyConnectivity();
    return true;
  } catch (err) {
    throw new CognodbError(
      "The hospital graph database is temporarily unavailable.",
      true,
      err
    );
  }
}

export async function closeDriver(): Promise<void> {
  const driver = globalForCognodb.cognodbDriver;
  if (driver) {
    await driver.close();
    globalForCognodb.cognodbDriver = undefined;
  }
}

type WithSessionFn<T> = (session: Session) => Promise<T>;

/**
 * Run a function inside a dedicated session and always close it.
 */
export async function withSession<T>(fn: WithSessionFn<T>): Promise<T> {
  const driver = getDriver();
  const config = loadCognoDBConfig();
  const session = driver.session({ database: config.database });
  try {
    return await fn(session);
  } catch (err) {
    if (err instanceof CognodbError) {
      throw err;
    }
    if (err instanceof Error && isConnectivityError(err)) {
      throw new CognodbError(
      "The hospital graph database is temporarily unavailable. Please try again.",
      true,
      err
    );
    }
    throw new CognodbError(
      "Unable to read from the hospital graph database.",
      false,
      err
    );
  } finally {
    await session.close();
  }
}

function isConnectivityError(err: Error): boolean {
  return (
    err instanceof Error &&
    /(ServiceUnavailable|ConnectionError|failed to connect|Could not perform discovery)/i.test(
      err.message
    )
  );
}
