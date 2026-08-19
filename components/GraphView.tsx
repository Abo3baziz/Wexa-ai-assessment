"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { NODE_TYPE_COLORS } from "@/lib/graph/colors";
import type { GraphEdge, GraphNode, NodeType } from "@/types";

const ForceGraph = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: undefined,
});

interface VizNode {
  id: string;
  type: NodeType;
  label: string;
}

interface VizLink {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface VizData {
  nodes: VizNode[];
  links: VizLink[];
}

function nodeColor(node: VizNode): string {
  return NODE_TYPE_COLORS[node.type] ?? "#9aa7c2";
}

export function GraphView({
  nodes,
  edges,
  onSelectNode,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode) => void;
}) {
  const data = useMemo<VizData>(() => {
    const seen = new Set<string>();
    const vizNodes: VizNode[] = nodes
      .filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      })
      .map((n) => ({ id: n.id, type: n.type, label: n.label }));

    const linkSeen = new Set<string>();
    const vizLinks: VizLink[] = edges
      .filter((e) => {
        if (linkSeen.has(e.id)) return false;
        linkSeen.add(e.id);
        return true;
      })
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
      }));

    return { nodes: vizNodes, links: vizLinks };
  }, [nodes, edges]);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border bg-surface">
      <ForceGraph
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        width={undefined}
        height={420}
        nodeRelSize={5}
        linkColor={() => "#2c3a5e"}
        linkWidth={1.2}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.9}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as unknown as VizNode;
          const color = nodeColor(n);
          const radius = 6;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#0b1020";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const label = n.label;
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#cfd8ee";
          ctx.fillText(
            label.length > 16 ? `${label.slice(0, 16)}…` : label,
            node.x ?? 0,
            (node.y ?? 0) + radius + 2
          );
        }}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, 9, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        onNodeClick={(node) => {
          const hit = nodes.find((n) => n.id === (node as { id: string }).id);
          if (hit) onSelectNode(hit);
        }}
      />
    </div>
  );
}
