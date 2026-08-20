export interface ApiErrorBody {
  message: string;
  retry: boolean;
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorBody;
}

export class ApiClientError extends Error {
  override readonly name = "ApiClientError";

  constructor(
    message: string,
    readonly status: number,
    readonly retry: boolean
  ) {
    super(message);
  }
}

const cache = new Map<string, Promise<unknown>>();

/**
 * Fetch a JSON API route and return the typed payload, throwing an
 * ApiClientError (with a friendly message + retry flag) on failure.
 */
export async function getApi<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body || !body.ok) {
    const message = body?.error?.message ?? "Something went wrong.";
    const retry = body?.error?.retry ?? false;
    throw new ApiClientError(message, res.status, retry);
  }

  return body.data as T;
}

/** Get from cache, avoiding duplicate in-flight requests for the same path. */
export function getApiCached<T>(path: string): Promise<T> {
  const key = `GET ${path}`;
  let pending = cache.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = getApi<T>(path).finally(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

/**
 * POST a JSON body to an API route and return the typed payload, throwing an
 * ApiClientError (with a friendly message + retry flag) on failure.
 */
export async function postApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const parsed = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !parsed || !parsed.ok) {
    const message = parsed?.error?.message ?? "Something went wrong.";
    const retry = parsed?.error?.retry ?? false;
    throw new ApiClientError(message, res.status, retry);
  }

  return parsed.data as T;
}
