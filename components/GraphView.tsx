"use client";

import {
  Background,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useMemo } from "react";

import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/colors";
import type { GraphEdge, GraphNode, NodeType } from "@/types";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 56;
const RANK_SEP = 90;
const NODE_SEP = 40;

type GraphNodeData = {
  label: string;
  type: NodeType;
};

type FlowNode = Node<GraphNodeData, "graph">;

type FlowEdgeData = { type: string };

type FlowEdge = Edge<FlowEdgeData, "default">;

function GraphNodeElement({ data, selected }: NodeProps<FlowNode>) {
  const color = NODE_TYPE_COLORS[data.type];
  return (
    <div
      className="relative flex items-center gap-2 rounded-xl px-3 py-2 shadow-md"
      style={{
        backgroundColor: "#111a30",
        border: `1.5px solid ${selected ? color : "#2c3a5e"}`,
        minWidth: NODE_WIDTH,
      }}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">
          {data.label}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-ink-muted">
          {NODE_TYPE_LABELS[data.type]}
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function layout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: NODE_SEP, ranksep: RANK_SEP });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

const edgeLabelStyle = {
  fill: "#8fa0c8",
  fontSize: 11,
  fontWeight: 500,
};

export function GraphView({
  nodes,
  edges,
  onSelectNode,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode) => void;
}) {
  const initial = useMemo(() => {
    const flowNodes: FlowNode[] = nodes.map((n) => ({
      id: n.id,
      type: "graph" as const,
      data: { label: n.label, type: n.type },
      position: { x: 0, y: 0 },
    }));
    const flowEdges: FlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "default" as const,
      data: { type: e.type },
      label: e.type,
      labelStyle: edgeLabelStyle,
      labelBgStyle: { fill: "#0b1020", fillOpacity: 0.75 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }));
    return {
      nodes: layout(flowNodes, flowEdges),
      edges: flowEdges,
    };
  }, [nodes, edges]);

  const [reactNodes, , onNodesChange] = useNodesState(initial.nodes);
  const [reactEdges, , onEdgesChange] = useEdgesState(initial.edges);

  return (
    <div className="h-[60vh] min-h-[360px] w-full overflow-hidden rounded-xl border border-border bg-surface">
      <ReactFlow
        nodes={reactNodes}
        edges={reactEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        onNodeClick={(_, nodeData) => {
          const hit = nodes.find((n) => n.id === nodeData.id);
          if (hit) onSelectNode(hit);
        }}
      >
        <Background color="#2c3a5e" gap={24} />
      </ReactFlow>
    </div>
  );
}

const nodeTypes = { graph: GraphNodeElement };
