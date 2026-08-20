"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export interface LabeledEdgeData {
  /** Relationship label shown on the edge. */
  rel: string;
  /** True when the edge belongs to the dimmed set (selection active). */
  dimmed: boolean;
  [key: string]: unknown;
}

export type LabeledFlowEdge = Edge<LabeledEdgeData, "labeled-smoothstep">;

/**
 * Smoothstep (orthogonal) edge that always draws its relationship label in
 * *screen space* via EdgeLabelRenderer — so labels stay readable at any zoom,
 * unlike the built-in label which scales with the viewport.
 */
export function LabeledSmoothStepEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps<LabeledFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {data && data.rel ? (
        <EdgeLabelRenderer>
          <div
            className={`pointer-events-none absolute rounded-[4px] bg-[#0b1020] px-[4px] py-[1px] text-[10.5px] font-medium leading-none text-[#8fa0c8] ${
              data.dimmed ? "opacity-5" : ""
            }`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.rel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const edgeTypes = { "labeled-smoothstep": LabeledSmoothStepEdge };