"use client";

import type { RefObject } from "react";

import type { GraphCanvasHandle } from "@/components/graph/GraphCanvas";
import { GRAPH_DEPTHS, type GraphDepth } from "@/types";

interface GraphControlsProps {
  /** Current depth; null hides the depth control (entity-rooted graphs). */
  depth: GraphDepth | null;
  onDepthChange: (depth: GraphDepth) => void;
  disabled: boolean;
  canvasRef: RefObject<GraphCanvasHandle | null>;
}

const ICON_CLASS = "h-4 w-4";

function ZoomInIcon() {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M11 8v6M8 11h6" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M8 11h6" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 3-6.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v5h5" />
    </svg>
  );
}

function CenterIcon() {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

const CONTROL_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

export function GraphControls({
  depth,
  onDepthChange,
  disabled,
  canvasRef,
}: GraphControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {depth !== null ? (
        <div role="group" aria-label="Graph depth" className="flex items-center gap-1.5">
          <span className="text-xs text-ink-muted">Depth</span>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {GRAPH_DEPTHS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onDepthChange(d)}
                aria-pressed={d === depth}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  d === depth
                    ? "bg-brand text-white"
                    : "bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
                } disabled:cursor-not-allowed`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5" role="group" aria-label="Graph view controls">
        <button
          type="button"
          disabled={disabled}
          onClick={() => canvasRef.current?.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
          className={CONTROL_BUTTON_CLASS}
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => canvasRef.current?.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
          className={CONTROL_BUTTON_CLASS}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => canvasRef.current?.fit()}
          aria-label="Fit graph to viewport"
          title="Fit to viewport"
          className={CONTROL_BUTTON_CLASS}
        >
          <FitIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => canvasRef.current?.resetLayout()}
          aria-label="Reset graph layout"
          title="Reset layout"
          className={CONTROL_BUTTON_CLASS}
        >
          <ResetIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => canvasRef.current?.centerOnRoot()}
          aria-label="Center graph on selected patient"
          title="Center on patient"
          className={CONTROL_BUTTON_CLASS}
        >
          <CenterIcon />
        </button>
      </div>
    </div>
  );
}