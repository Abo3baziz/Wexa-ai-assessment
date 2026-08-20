"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";

import { NODE_TYPE_COLORS } from "@/lib/graph/colors";
import type { NodeType } from "@/types";

export interface FlowNodeData {
  /** The payload id (un-namespaced). */
  payloadId: string;
  label: string;
  type: NodeType;
  isRoot: boolean;
  selected: boolean;
  dimmed: boolean;
  [key: string]: unknown;
}

export type FlowNode = Node<FlowNodeData, "graph">;

const FLOW_SHAPES: Record<
  NodeType,
  { kind: "ellipse" | "rect" | "roundrect" | "triangle" | "diamond" | "hexagon" | "pentagon"; size: number }
> = {
  Patient: { kind: "ellipse", size: 54 },
  Visit: { kind: "ellipse", size: 22 },
  Doctor: { kind: "hexagon", size: 34 },
  Department: { kind: "roundrect", size: 28 },
  Disease: { kind: "triangle", size: 30 },
  Medication: { kind: "diamond", size: 28 },
  Diagnosis: { kind: "rect", size: 24 },
  Prescription: { kind: "pentagon", size: 26 },
};

const DEFAULT_STROKE = "#3d5480";

function shapeElement(
  kind: (typeof FLOW_SHAPES)[NodeType]["kind"],
  size: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  strokeOpacity: number
): React.ReactElement {
  const common = { fill, stroke, strokeWidth, strokeOpacity };
  switch (kind) {
    case "ellipse":
      return <ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} {...common} />;
    case "rect":
      return <rect x="0" y="0" width={size} height={size} {...common} />;
    case "roundrect":
      return <rect x="1" y="1" width={size - 2} height={size - 2} rx="6" {...common} />;
    case "triangle":
      return <polygon points={`${size / 2},0 ${size},${size} 0,${size}`} {...common} />;
    case "diamond":
      return (
        <polygon
          points={`${size / 2},0 ${size},${size / 2} ${size / 2},${size} 0,${size / 2}`}
          {...common}
        />
      );
    case "hexagon":
      return (
        <polygon
          points={`${size * 0.25},0 ${size * 0.75},0 ${size},${size / 2} ${size * 0.75},${size} ${size * 0.25},${size} 0,${size / 2}`}
          {...common}
        />
      );
    case "pentagon":
      return (
        <polygon
          points={`${size / 2},0 ${size},${size * 0.38} ${size * 0.82},${size} ${size * 0.18},${size} 0,${size * 0.38}`}
          {...common}
        />
      );
  }
}

/**
 * Obsidian-style node element: colored shape per node type (same shapes and
 * sizes as the Cytoscape stylesheet), white ring for root/selected, label
 * below. Selection/dimming are data-driven to mirror the Cytoscape classes.
 */
export function GraphFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const [hovered, setHovered] = useState(false);
  const shape = FLOW_SHAPES[data.type];
  const stroke = selected || data.isRoot || hovered ? "#ffffff" : DEFAULT_STROKE;
  const strokeWidth = selected ? 3 : data.isRoot ? 2.5 : hovered ? 2.5 : 1.5;
  const strokeOpacity = selected ? 1 : data.isRoot ? 0.9 : hovered ? 0.4 : 0.75;

  return (
    <div
      className={`flex select-none flex-col items-center ${data.dimmed ? "opacity-15" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <svg
        width={shape.size}
        height={shape.size}
        viewBox={`0 0 ${shape.size} ${shape.size}`}
        aria-hidden="true"
      >
        {shapeElement(
          shape.kind,
          shape.size,
          NODE_TYPE_COLORS[data.type],
          stroke,
          strokeWidth,
          strokeOpacity
        )}
      </svg>
      <div className="mt-1 max-w-[150px] break-words text-center text-[10px] leading-tight text-[#c9d4ea]">
        {data.label}
      </div>
    </div>
  );
}

export const flowNodeTypes = { graph: GraphFlowNode };