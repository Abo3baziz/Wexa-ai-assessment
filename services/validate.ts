import {
  PATH_TARGET_LABELS,
  type PathTargetLabel,
} from "@/lib/cognodb/queries/pathBetween";
import {
  SEARCH_MODES,
  type SearchMode,
} from "@/lib/cognodb/queries/search";
import {
  ENTITY_GRAPH_LABELS,
  type EntityGraphLabel,
} from "@/lib/cognodb/queries/entityGraph";

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

/** Validate a search mode against the allowlist; empty/absent → "all". */
export function requireSearchMode(
  value: string | null | undefined
): SearchMode {
  const v = (value ?? "").trim();
  if (v === "") return "all";
  if (!SEARCH_MODES.includes(v as SearchMode)) {
    throw new ValidationError("Unsupported search mode.");
  }
  return v as SearchMode;
}

/** Validate an entity graph label against the allowlist used by the query layer. */
export function requireEntityGraphLabel(
  value: string | null | undefined
): EntityGraphLabel {
  const v = (value ?? "").trim();
  if (!ENTITY_GRAPH_LABELS.includes(v as EntityGraphLabel)) {
    throw new ValidationError("Unsupported entity type.");
  }
  return v as EntityGraphLabel;
}
