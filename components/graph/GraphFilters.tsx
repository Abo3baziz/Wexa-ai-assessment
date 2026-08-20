"use client";

import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/colors";
import type { GraphFilters, NodeType } from "@/types";

interface GraphFiltersProps {
  filters: GraphFilters;
  /** Node types present in the loaded payload (only these are listed). */
  present: NodeType[];
  onToggle: (type: NodeType) => void;
}

export function GraphFilters({ filters, present, onToggle }: GraphFiltersProps) {
  if (present.length === 0) return null;
  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">Show or hide node types</legend>
      {present.map((type) => {
        const enabled = filters[type];
        return (
          <label
            key={type}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              enabled
                ? "border-border bg-surface text-ink"
                : "border-border/60 bg-surface/40 text-ink-muted opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => onToggle(type)}
              className="sr-only"
            />
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
              aria-hidden="true"
            />
            {NODE_TYPE_LABELS[type]}
          </label>
        );
      })}
    </fieldset>
  );
}