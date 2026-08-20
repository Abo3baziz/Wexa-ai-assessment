"use client";

import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import type { GraphCanvasHandle } from "@/components/graph/GraphCanvas";
import { flowNodeTypes, type FlowNode } from "@/components/graph/flow/FlowNode";
import {
  buildFlowEdges,
  buildFlowNodes,
  LAYOUT_SCALE,
  selectionInfo,
  type FlowEdge,
} from "@/components/graph/flow/flowElements";
import { computeForceLayout, cyIdOf } from "@/lib/graph/cytoscape";
import type { LayoutResult } from "@/lib/graph/cytoscape";
import type { GraphEdge, GraphNode } from "@/types";

interface ReactFlowCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Payload id of the root patient/entity the graph is centered on. */
  rootNodeId: string;
  /** Payload id of the currently selected node, if any. */
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode) => void;
  onDeselect: () => void;
}

function edgeStyleFor(
  edge: FlowEdge,
  highlighted: ReadonlySet<string>,
  dimmed: ReadonlySet<string>
): FlowEdge["style"] {
  if (highlighted.has(edge.id)) {
    return { stroke: "#8fa0c8", strokeWidth: 1.6, opacity: 1 };
  }
  if (dimmed.has(edge.id)) {
    return { opacity: 0.05 };
  }
  return { stroke: "#3a4b74", strokeWidth: 0.75, opacity: 0.85 };
}

/**
 * React Flow renderer with feature parity to GraphCanvas: it reuses the exact
 * cytoscape force layout (run headless) so both engines look the same, and it
 * exposes the same imperative GraphCanvasHandle (zoom/fit/reset/center).
 */
const ReactFlowCanvasInner = forwardRef<GraphCanvasHandle, ReactFlowCanvasProps>(
  function ReactFlowCanvasInner(
    { nodes, edges, rootNodeId, selectedNodeId, onSelectNode, onDeselect }: ReactFlowCanvasProps,
    ref
  ) {
  const rf = useReactFlow();
  const rfRef = useRef(rf);
  rfRef.current = rf;

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const layoutRef = useRef<LayoutResult | null>(null);
  const rootPosRef = useRef<{ x: number; y: number } | null>(null);
  const propsRef = useRef({ nodes, edges, rootNodeId, selectedNodeId });
  propsRef.current = { nodes, edges, rootNodeId, selectedNodeId };
  const nodeByPayloadId = useRef(new Map<string, GraphNode>());
  nodeByPayloadId.current = new Map(nodes.map((n) => [n.id, n]));

  const applyLayout = useCallback(
    (nodesArg: GraphNode[], edgesArg: GraphEdge[], rootId: string, fit: boolean) => {
      const layout = computeForceLayout(nodesArg, edgesArg);
      layoutRef.current = layout;
      const rootNode = nodesArg.find((n) => n.id === rootId);
      rootPosRef.current = rootNode
        ? (() => {
            const p = layout.positions.get(cyIdOf(rootNode));
            return p ? { x: p.x * LAYOUT_SCALE, y: p.y * LAYOUT_SCALE } : null;
          })()
        : null;
      const selection = selectionInfo(nodesArg, edgesArg, propsRef.current.selectedNodeId);
      setFlowNodes(buildFlowNodes(nodesArg, layout.positions, rootId, selection));
      setFlowEdges(buildFlowEdges(nodesArg, edgesArg, selection));
      if (fit) {
        requestAnimationFrame(() =>
          rfRef.current.fitView({ padding: 0.15, duration: 400 })
        );
      }
    },
    [setFlowNodes, setFlowEdges]
  );

  useEffect(() => {
    applyLayout(nodes, edges, rootNodeId, true);
  }, [nodes, edges, rootNodeId, applyLayout]);

  useEffect(() => {
    const selection = selectionInfo(nodes, edges, selectedNodeId);
    setFlowNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: selection.selectedNodeId === n.data.payloadId,
          dimmed: selection.dimmedNodeIds.has(n.data.payloadId),
        },
      }))
    );
    setFlowEdges((prev) =>
      prev.map((e) => ({
        ...e,
        style: edgeStyleFor(e, selection.highlightedEdgeIds, selection.dimmedEdgeIds),
      }))
    );
  }, [selectedNodeId, nodes, edges, setFlowNodes, setFlowEdges]);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => rfRef.current.zoomIn({ duration: 200 }),
      zoomOut: () => rfRef.current.zoomOut({ duration: 200 }),
      fit: () => rfRef.current.fitView({ padding: 0.15, duration: 400 }),
      resetLayout: () => {
        const { nodes: n, edges: e, rootNodeId: r } = propsRef.current;
        applyLayout(n, e, r, true);
      },
      centerOnRoot: () => {
        const pos = rootPosRef.current;
        if (!pos) return;
        rfRef.current.setCenter(pos.x, pos.y, {
          zoom: rfRef.current.getZoom(),
          duration: 400,
        });
      },
    }),
    [applyLayout]
  );

  return (
    <div
      role="img"
      aria-label="Interactive relationship graph"
      className="h-full w-full select-none"
    >
      <ReactFlow<FlowNode, FlowEdge>
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={flowNodeTypes}
        minZoom={0.15}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        onNodeClick={(_, nodeData) => {
          const hit = nodeByPayloadId.current.get(nodeData.data.payloadId);
          if (hit) onSelectNode(hit);
        }}
        onPaneClick={() => onDeselect()}
      >
        <Background color="#2c3a5e" gap={24} />
      </ReactFlow>
    </div>
  );
  }
);

export const ReactFlowCanvas = forwardRef<GraphCanvasHandle, ReactFlowCanvasProps>(
  function ReactFlowCanvas(props, ref) {
    return (
      <ReactFlowProvider>
        <ReactFlowCanvasInner ref={ref} {...props} />
      </ReactFlowProvider>
    );
  }
);