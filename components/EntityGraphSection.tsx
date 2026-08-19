"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GraphView } from "@/components/GraphView";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { EmptyState } from "@/components/states/EmptyState";
import {
  NODE_TYPE_COLORS,
  NODE_TYPE_LABELS,
  NODE_TYPES,
} from "@/lib/graph/colors";
import { getApi } from "@/lib/fetchApi";
import type {
  EntitySummary,
  GraphEdge,
  GraphNode,
  GraphPayload,
  NodeType,
} from "@/types";

type State =
  | { kind: "loading" }
  | { kind: "success"; payload: GraphPayload }
  | { kind: "error"; message: string; retry: boolean };

function neighborsOf(id: string, edges: GraphEdge[]): Set<string> {
  const out = new Set<string>();
  for (const edge of edges) {
    if (edge.source === id) out.add(edge.target);
    if (edge.target === id) out.add(edge.source);
  }
  return out;
}

export function EntityGraphSection({
  entity,
  onSelectPatient,
}: {
  entity: EntitySummary;
  onSelectPatient: (publicId: string) => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    setSelected(null);
    try {
      const payload = await getApi<GraphPayload>(
        `/api/entities/${encodeURIComponent(entity.type)}/${encodeURIComponent(
          entity.id
        )}/graph`
      );
      const initial = new Set<string>();
      initial.add(entity.id);
      for (const n of neighborsOf(entity.id, payload.edges)) initial.add(n);
      setRevealed(initial);
      setState({ kind: "success", payload });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const retry =
        err instanceof Error && "retry" in err
          ? Boolean((err as { retry?: boolean }).retry)
          : false;
      setState({ kind: "error", message, retry });
    }
  }, [entity.type, entity.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { nodes, edges } = useMemo(() => {
    if (state.kind !== "success") return { nodes: [], edges: [] };
    const visible = new Set<string>();
    for (const id of revealed) visible.add(id);
    const visibleNodes: GraphNode[] = state.payload.nodes.filter((n) =>
      visible.has(n.id)
    );
    const visibleEdges: GraphEdge[] = state.payload.edges.filter(
      (e) => visible.has(e.source) && visible.has(e.target)
    );
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [state, revealed]);

  function handleNodeClick(node: GraphNode) {
    if (node.type === "Patient") {
      const publicId = node.properties.publicId;
      if (publicId) {
        onSelectPatient(publicId);
        return;
      }
    }
    setSelected(node);
    const next = new Set(revealed);
    for (const n of neighborsOf(
      node.id,
      state.kind === "success" ? state.payload.edges : []
    )) {
      next.add(n);
    }
    setRevealed(next);
  }

  const nodeCount = state.kind === "success" ? state.payload.nodes.length : 0;
  const visibleCount = nodes.length;

  return (
    <section aria-label="Entity graph" className="mt-6">
      <header className="mb-3 flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: NODE_TYPE_COLORS[entity.type] }}
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {entity.label}
        </h2>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted">
          {NODE_TYPE_LABELS[entity.type]}
        </span>
        {state.kind === "success" ? (
          <span className="text-sm text-ink-muted">
            {visibleCount} of {nodeCount} nodes ({edges.length} connections)
          </span>
        ) : null}
      </header>

      {state.kind === "loading" ? (
        <div className="h-[60vh] min-h-[360px] w-full animate-pulse rounded-xl bg-surface-2" />
      ) : null}

      {state.kind === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-12 text-center"
        >
          <p className="text-sm text-ink-muted">{state.message}</p>
          {state.retry ? (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {state.kind === "success" && nodeCount === 0 ? (
        <EmptyState
          title="No graph found"
          message="This entity has no relationships to visualize."
        />
      ) : null}

      {state.kind === "success" && nodeCount > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {NODE_TYPES.filter((type) =>
              state.payload.nodes.some((n) => n.type === type)
            ).map((type: NodeType) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-muted"
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

          <GraphView
            nodes={nodes}
            edges={edges}
            onSelectNode={handleNodeClick}
          />

          <div className="mt-3">
            <NodeDetailPanel node={selected} onClose={() => setSelected(null)} />
          </div>

          {visibleCount < nodeCount ? (
            <p className="mt-2 text-xs text-ink-muted">
              Click a node to reveal its connected neighbors. Click a patient to
              open their overview.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
