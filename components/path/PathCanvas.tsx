"use client";

import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Core } from "cytoscape";
import { useEffect, useMemo, useRef } from "react";

import { flowNodeTypes, type FlowNode } from "@/components/graph/flow/FlowNode";
import {
  buildFlowEdges,
  buildFlowNodes,
  EMPTY_SELECTION,
  type FlowEdge,
} from "@/components/graph/flow/flowElements";
import {
  computePathLayout,
  createGraph,
  cyIdOf,
  payloadToElements,
  runPathLayout,
} from "@/lib/graph/cytoscape";
import type { GraphEngine } from "@/lib/graph/engine";
import type { GraphEdge, GraphNode } from "@/types";

interface PathSpineProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Payload id of the starting patient; gets the prominent root ring. */
  startId: string;
}

interface PathCanvasProps extends PathSpineProps {
  library: GraphEngine;
}

/**
 * Minimal Cytoscape canvas for a single shortestPath result. Reuses the
 * explorer's stylesheet and element factory; the start node is emphasised
 * with the `root` style. No selection/interaction — it is a read-only spine.
 */
export function PathCanvasCytoscape({ nodes, edges, startId }: PathSpineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cy = createGraph(container);
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    cy.add(payloadToElements(nodes, edges));
    const start = nodes.find((n) => n.id === startId);
    if (start) {
      cy.getElementById(cyIdOf(start)).addClass("root");
    }
    runPathLayout(cy);
  }, [nodes, edges, startId]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Shortest path between the selected patient and target"
      className="h-72 w-full select-none rounded-xl border border-border bg-canvas"
    />
  );
}

/**
 * Read-only React Flow variant of the path spine. Reuses the headless
 * breadthfirst layout so both engines render the same horizontal chain.
 */
function PathCanvasFlow({ nodes, edges, startId }: PathSpineProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const positions = computePathLayout(nodes, edges).positions;
    return {
      flowNodes: buildFlowNodes(nodes, positions, startId, EMPTY_SELECTION),
      flowEdges: buildFlowEdges(nodes, edges, EMPTY_SELECTION),
    };
  }, [nodes, edges, startId]);

  return (
    <div
      role="img"
      aria-label="Shortest path between the selected patient and target"
      className="h-72 w-full select-none overflow-hidden rounded-xl border border-border bg-canvas"
    >
      <ReactFlow<FlowNode, FlowEdge>
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={flowNodeTypes}
        minZoom={0.15}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        elementsSelectable={false}
      >
        <Background color="#2c3a5e" gap={24} />
      </ReactFlow>
    </div>
  );
}

/** Path spine renderer, switching between the Cytoscape and React Flow engines. */
export function PathCanvas({ library, ...rest }: PathCanvasProps) {
  if (library === "react-flow") return <PathCanvasFlow {...rest} />;
  return <PathCanvasCytoscape {...rest} />;
}