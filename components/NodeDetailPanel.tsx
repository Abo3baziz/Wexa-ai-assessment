import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/colors";
import type { GraphNode } from "@/types";

function pretty(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const HIDDEN_KEYS = new Set(["id", "publicId", "firstName", "lastName"]);

export function NodeDetailPanel({
  node,
  onClose,
}: {
  node: GraphNode | null;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
        Select a node to inspect its details.
      </div>
    );
  }

  const entries = Object.entries(node.properties).filter(
    ([key, value]) => !HIDDEN_KEYS.has(key) && value !== ""
  );
  const name =
    node.properties.firstName && node.properties.lastName
      ? `${node.properties.firstName} ${node.properties.lastName}`
      : node.properties.name || node.label;

  return (
    <div
      className="rounded-xl border border-border bg-surface p-4 animate-fade-in"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }}
            aria-hidden="true"
          />
          <h3 className="text-base font-semibold text-ink">{name}</h3>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted">
            {NODE_TYPE_LABELS[node.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {entries.length === 0 ? (
          <dd className="col-span-full text-sm text-ink-muted">
            No additional details.
          </dd>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-2">
              <dt className="text-xs text-ink-muted">{pretty(key)}</dt>
              <dd className="text-sm text-ink">{value}</dd>
            </div>
          ))
        )}
      </dl>
    </div>
  );
}
