import { CognodbError } from "@/lib/cognodb/driver";
import { ConfigError } from "@/lib/cognodb/config";
import { ValidationError } from "@/services/validate";
import type { ApiFailure, ApiResponse } from "./types";

export interface HttpResult<T = unknown> {
  status: number;
  body: ApiResponse<T>;
}

function failure(status: number, message: string, retry: boolean): HttpResult {
  const body: ApiFailure = {
    ok: false,
    error: { message, retry },
  };
  return { status, body };
}

/**
 * Map an unhandled error to a friendly HTTP response. Never exposes
 * credentials, connection strings, or stack traces to the client.
 */
export function toHttpError(err: unknown): HttpResult {
  if (err instanceof ValidationError) {
    return failure(400, err.message, false);
  }
  if (err instanceof CognodbError) {
    return failure(503, err.message, err.retryable);
  }
  if (err instanceof ConfigError) {
    return failure(503, err.message, true);
  }
  return failure(500, "Something went wrong. Please try again.", false);
}

/**
 * Run a route's data-producing function, mapping success to a 200 JSON envelope
 * and any thrown error to its friendly HTTP equivalent.
 */
export async function handle<T>(fn: () => Promise<T>): Promise<HttpResult<T>> {
  try {
    return { status: 200, body: { ok: true, data: await fn() } };
  } catch (err) {
    return toHttpError(err) as HttpResult<T>;
  }
}
