import {
  PATH_TARGET_LABELS,
  type PathTargetLabel,
} from "@/lib/cognodb/queries/pathBetween";

export class ValidationError extends Error {
  override readonly name = "ValidationError";
  constructor(message: string) {
    super(message);
  }
}

const PUBLIC_ID_RE = /^P-\d{4,}$/;

/** Validate a patient publicId (e.g. P-1001). Throws on invalid. */
export function requirePublicId(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!PUBLIC_ID_RE.test(v)) {
    throw new ValidationError("Invalid patient identifier.");
  }
  return v;
}

/** Validate a search query string (non-empty, length-bounded). */
export function requireSearchQuery(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (v.length === 0) {
    throw new ValidationError("Search query is empty.");
  }
  if (v.length > 100) {
    throw new ValidationError("Search query is too long.");
  }
  return v;
}

export function requireOptionalInt(
  value: string | null | undefined,
  fallback: number,
  max: number
): number {
  if (value === null || value === undefined || value.trim() === "") {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw new ValidationError("Invalid numeric parameter.");
  }
  return n;
}

/** Non-empty, length-bounded entity id (e.g. a Doctor or Disease node). */
export function requireEntityId(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (v.length === 0 || v.length > 64) {
    throw new ValidationError("Invalid entity identifier.");
  }
  return v;
}

/** Bounded traversal depth for path / connected-patient queries. */
export function requireDepth(
  value: string | null | undefined,
  fallback = 6,
  max = 10
): number {
  return requireOptionalInt(value, fallback, max);
}

/** Validate a path target label against the allowlist used by the query layer. */
export function requirePathTargetLabel(
  value: string | null | undefined
): PathTargetLabel {
  const v = (value ?? "").trim();
  if (!PATH_TARGET_LABELS.includes(v as PathTargetLabel)) {
    throw new ValidationError("Unsupported path target.");
  }
  return v as PathTargetLabel;
}
