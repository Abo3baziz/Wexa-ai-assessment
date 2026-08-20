"use client";

import type { Core } from "cytoscape";
import { useEffect, useRef } from "react";

import {
  createGraph,
  cyIdOf,
  payloadToElements,
  runPathLayout,
} from "@/lib/graph/cytoscape";
import type { GraphEdge, GraphNode } from "@/types";

interface PathCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Payload id of the starting patient; gets the prominent root ring. */
  startId: string;
}

/**
 * Minimal Cytoscape canvas for a single shortestPath result. Reuses the
 * explorer's stylesheet and element factory; the start node is emphasised
 * with the `root` style. No selection/interaction — it is a read-only spine.
 */
export function PathCanvas({ nodes, edges, startId }: PathCanvasProps) {
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