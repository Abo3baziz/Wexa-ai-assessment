"use client";

import type { Core } from "cytoscape";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import {
  centerOn,
  createGraph,
  cyIdOf,
  fitGraph,
  payloadToElements,
  runForceLayout,
  zoomBy,
} from "@/lib/graph/cytoscape";
import type { GraphEdge, GraphNode } from "@/types";

export interface GraphCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  resetLayout: () => void;
  centerOnRoot: () => void;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Payload id of the root patient/entity the graph is centered on. */
  rootNodeId: string;
  /** Payload id of the currently selected node, if any. */
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode) => void;
  onDeselect: () => void;
}

/**
 * Cytoscape canvas. Owns the graph instance lifecycle and all Cytoscape
 * events/classes; everything else (data, selection semantics) stays in
 * GraphExplorer / graph-transform.
 */
export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas(
    { nodes, edges, rootNodeId, selectedNodeId, onSelectNode, onDeselect },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);
    const nodeByPayloadId = useRef(new Map<string, GraphNode>());
    const onSelectNodeRef = useRef(onSelectNode);
    const onDeselectRef = useRef(onDeselect);

    useEffect(() => {
      onSelectNodeRef.current = onSelectNode;
      onDeselectRef.current = onDeselect;
    }, [onSelectNode, onDeselect]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const cy = createGraph(container);
      cyRef.current = cy;

      cy.on("tap", "node", (event) => {
        const node = nodeByPayloadId.current.get(event.target.data("payloadId"));
        if (node) onSelectNodeRef.current(node);
      });
      cy.on("tap", (event) => {
        if (event.target === cy) onDeselectRef.current();
      });
      cy.on("mouseover", "node", (event) => event.target.addClass("hovered"));
      cy.on("mouseout", "node", (event) => event.target.removeClass("hovered"));

      return () => {
        cy.destroy();
        cyRef.current = null;
      };
    }, []);

    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;
      nodeByPayloadId.current = new Map(nodes.map((n) => [n.id, n]));
      cy.elements().remove();
      cy.add(payloadToElements(nodes, edges));
      const rootNode = nodes.find((n) => n.id === rootNodeId);
      if (rootNode) {
        cy.getElementById(cyIdOf(rootNode)).addClass("root");
      }
      runForceLayout(cy);
    }, [nodes, edges, rootNodeId]);

    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;
      const all = cy.elements();
      all.removeClass("selected dimmed highlighted");
      if (!selectedNodeId) return;
      const node = nodes.find((n) => n.id === selectedNodeId);
      const selected = node ? cy.getElementById(cyIdOf(node)) : cy.collection();
      if (selected.nonempty()) {
        const neighborhood = selected.closedNeighborhood();
        all.difference(neighborhood).addClass("dimmed");
        selected.addClass("selected");
        neighborhood.edges().addClass("highlighted");
      }
    }, [selectedNodeId, nodes]);

    const rootCyId = useMemo(() => {
      const rootNode = nodes.find((n) => n.id === rootNodeId);
      return rootNode ? cyIdOf(rootNode) : "";
    }, [nodes, rootNodeId]);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => {
          const cy = cyRef.current;
          if (cy) zoomBy(cy, 1.3);
        },
        zoomOut: () => {
          const cy = cyRef.current;
          if (cy) zoomBy(cy, 1 / 1.3);
        },
        fit: () => {
          const cy = cyRef.current;
          if (cy) fitGraph(cy);
        },
        resetLayout: () => {
          const cy = cyRef.current;
          if (cy) runForceLayout(cy);
        },
        centerOnRoot: () => {
          const cy = cyRef.current;
          if (cy && rootCyId) centerOn(cy, rootCyId);
        },
      }),
      [rootCyId]
    );

    return (
      <div
        ref={containerRef}
        role="img"
        aria-label="Interactive relationship graph"
        className="h-full w-full select-none"
      />
    );
  }
);