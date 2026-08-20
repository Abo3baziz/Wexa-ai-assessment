"use client";

import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/colors";
import type { NodeType } from "@/types";

interface GraphLegendProps {
  /** Node types currently visible in the graph. */
  visible: NodeType[];
}

export function GraphLegend({ visible }: GraphLegendProps) {
  if (visible.length === 0) return null;
  return (
    <div
      aria-label="Graph legend"
      className="pointer-events-none absolute bottom-2 left-2 flex max-w-[70%] flex-wrap gap-1.5 rounded-xl border border-border/70 bg-canvas/80 px-2.5 py-2 backdrop-blur"
    >
      {visible.map((type) => (
        <span
          key={type}
          className="inline-flex items-center gap-1 text-[10px] text-ink-muted"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
            aria-hidden="true"
          />
          {NODE_TYPE_LABELS[type]}
        </span>
      ))}
    </div>
  );
}