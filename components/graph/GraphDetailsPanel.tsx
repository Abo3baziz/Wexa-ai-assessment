"use client";

import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/colors";
import type { SelectedNode } from "@/types";

interface GraphDetailsPanelProps {
  selected: SelectedNode | null;
  onClose: () => void;
  onExpand: () => void;
  onOpenPatient: ((publicId: string) => void) | null;
}

function pretty(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const HIDDEN_KEYS = new Set(["id", "publicId", "nationalId", "firstName", "lastName"]);

function nameOf(node: SelectedNode["node"]): string {
  if (node.properties.firstName && node.properties.lastName) {
    return `${node.properties.firstName} ${node.properties.lastName}`;
  }
  return node.properties.name || node.label;
}

function sharedItems(label: string, items: readonly string[]): string[] | null {
  const distinct = [...new Set(items)];
  return distinct.length > 0 ? distinct.map((item) => `${label}: ${item}`) : null;
}

export function GraphDetailsPanel({
  selected,
  onClose,
  onExpand,
  onOpenPatient,
}: GraphDetailsPanelProps) {
  if (!selected) return null;
  const { node, isRoot, related } = selected;

  const entries = Object.entries(node.properties).filter(
    ([key, value]) => !HIDDEN_KEYS.has(key) && value !== ""
  );
  const publicId = node.properties.publicId;

  return (
    <div
      className="absolute inset-x-2 bottom-2 z-20 max-h-[45%] overflow-y-auto rounded-xl border border-border bg-surface/95 shadow-card backdrop-blur animate-fade-in sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto sm:w-80 sm:max-h-[calc(100%-1.5rem)]"
      aria-live="polite"
      role="dialog"
      aria-label="Selected node details"
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-0">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }}
            aria-hidden="true"
          />
          <h3 className="truncate text-base font-semibold text-ink">{nameOf(node)}</h3>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted">
            {NODE_TYPE_LABELS[node.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 p-4">
        {isRoot ? (
          <p className="text-xs text-ink-muted">
            This is the patient the graph is centered on.
          </p>
        ) : null}

        {!isRoot && related && (
          <div className="rounded-lg border border-border bg-surface-2/60 p-3">
            <p className="text-xs font-medium text-ink">Related patient</p>
            <ul className="mt-1.5 space-y-1">
              {[
                sharedItems("Shared disease", related.sharedDiseases),
                sharedItems("Shared medication", related.sharedMedications),
                sharedItems("Shared doctor", related.sharedDoctors),
              ]
                .filter((item): item is string[] => item !== null)
                .flat()
                .map((item) => (
                  <li key={item} className="text-xs text-ink-muted">
                    {item}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5">
          {entries.length === 0 ? (
            <dd className="text-sm text-ink-muted">No additional details.</dd>
          ) : (
            entries.map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-2">
                <dt className="text-xs text-ink-muted">{pretty(key)}</dt>
                <dd className="text-sm text-ink">{value}</dd>
              </div>
            ))
          )}
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            Expand Relationships
          </button>
          {node.type === "Patient" && publicId && onOpenPatient ? (
            <button
              type="button"
              onClick={() => onOpenPatient(publicId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface-2"
            >
              Open Patient Profile
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}