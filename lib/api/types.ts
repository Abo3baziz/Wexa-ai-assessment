export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  message: string;
  retry: boolean;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorBody;
}

/** Uniform JSON envelope returned by every API route. */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
