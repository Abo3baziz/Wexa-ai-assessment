"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GraphCanvas, type GraphCanvasHandle } from "@/components/graph/GraphCanvas";
import { GraphControls } from "@/components/graph/GraphControls";
import { GraphDetailsPanel } from "@/components/graph/GraphDetailsPanel";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { getApi } from "@/lib/fetchApi";
import {
  applyTypeFilters,
  mergePayloads,
  neighborsOf,
  presentTypes,
} from "@/lib/graph/graph-transform";
import type {
  EntitySummary,
  GraphDepth,
  GraphFilters as GraphFiltersState,
  GraphNode,
  GraphPayload,
  NodeType,
  RelatedPatient,
  SelectedNode,
} from "@/types";

type ExplorerRoot =
  | { kind: "patient"; publicId: string }
  | { kind: "entity"; summary: EntitySummary };

type State =
  | { kind: "loading" }
  | { kind: "success"; payload: GraphPayload; related: Map<string, RelatedPatient> }
  | { kind: "error"; message: string; retry: boolean };

interface GraphExplorerProps {
  root: ExplorerRoot;
  onSelectPatient: (publicId: string) => void;
}

const ALL_TYPES_ON: GraphFiltersState = {
  Patient: true,
  Visit: true,
  Doctor: true,
  Department: true,
  Disease: true,
  Medication: true,
  Diagnosis: true,
  Prescription: true,
};

function rootNodeOf(payload: GraphPayload, root: ExplorerRoot): GraphNode | null {
  if (root.kind === "patient") {
    return (
      payload.nodes.find(
        (n) => n.type === "Patient" && n.properties.publicId === root.publicId
      ) ?? null
    );
  }
  return (
    payload.nodes.find(
      (n) => n.type === root.summary.type && n.id === root.summary.id
    ) ?? null
  );
}

export function GraphExplorer({ root, onSelectPatient }: GraphExplorerProps) {
  const [depth, setDepth] = useState<GraphDepth>(2);
  const [filters, setFilters] = useState<GraphFiltersState>(ALL_TYPES_ON);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const canvasRef = useRef<GraphCanvasHandle | null>(null);

  const isPatient = root.kind === "patient";

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    setSelected(null);
    try {
      const url =
        root.kind === "patient"
          ? `/api/patients/${encodeURIComponent(root.publicId)}/graph?depth=${depth}`
          : `/api/entities/${encodeURIComponent(root.summary.type)}/${encodeURIComponent(
              root.summary.id
            )}/graph`;
      const payload = await getApi<GraphPayload>(url);
      let related = new Map<string, RelatedPatient>();
      if (root.kind === "patient") {
        try {
          const rows = await getApi<RelatedPatient[]>(
            `/api/patients/${encodeURIComponent(root.publicId)}/related`
          );
          related = new Map(
            rows
              .filter((r) => r.patient.publicId !== "")
              .map((r) => [r.patient.publicId, r])
          );
        } catch {
          related = new Map();
        }
      }
      const rootNode = rootNodeOf(payload, root);
      void rootNode;
      setState({ kind: "success", payload, related });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const retry =
        err instanceof Error && "retry" in err
          ? Boolean((err as { retry?: boolean }).retry)
          : false;
      setState({ kind: "error", message, retry });
    }
  }, [root, depth]);

  useEffect(() => {
    void load();
  }, [load]);

  const payload = state.kind === "success" ? state.payload : null;
  const rootNode = payload ? rootNodeOf(payload, root) : null;
  const rootLabel = rootNode?.label ?? (root.kind === "entity" ? root.summary.label : "");

  const visible = useMemo(() => {
    if (state.kind !== "success") return { nodes: [], edges: [] };
    return applyTypeFilters(state.payload, filters);
  }, [state, filters]);

  const present = useMemo(
    () => (payload ? (Object.keys(presentTypes(payload)) as NodeType[]) : []),
    [payload]
  );

  function toggleFilter(type: NodeType) {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  function handleSelectNode(node: GraphNode) {
    if (!payload) return;
    const rootId = rootNode?.id ?? "";
    setSelected({
      node,
      isRoot: node.id === rootId,
      neighbors: [...neighborsOf(node.id, payload.edges)],
      related:
        node.type === "Patient"
          ? state.kind === "success"
            ? (state.related.get(node.properties.publicId ?? "") ?? null)
            : null
          : null,
    });
  }

  async function handleExpand() {
    if (!selected || !payload) return;
    const { node } = selected;
    try {
      const extra = await getApi<GraphPayload>(
        `/api/nodes/${encodeURIComponent(node.type)}/${encodeURIComponent(node.id)}/graph`
      );
      setState((prev) =>
        prev.kind === "success"
          ? { ...prev, payload: mergePayloads(prev.payload, extra) }
          : prev
      );
    } catch {
      // Expansion is best-effort; the already-loaded graph stays usable.
    }
  }

  const loadingCopy = isPatient
    ? "Loading patient relationships..."
    : "Loading entity relationships...";
  const errorCopy = isPatient
    ? "Unable to load the patient graph."
    : "Unable to load the entity graph.";

  return (
    <section aria-label="Graph explorer" className="animate-fade-in">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Graph Explorer
          </h2>
          {rootLabel ? (
            <p className="truncate text-sm text-ink-muted">
              Network centered on {rootLabel}
            </p>
          ) : null}
        </div>
        <GraphControls
          depth={isPatient ? depth : null}
          onDepthChange={(d) => setDepth(d)}
          disabled={state.kind !== "success"}
          canvasRef={canvasRef}
        />
      </div>

      <div className="mb-3">
        <GraphFilters filters={filters} present={present} onToggle={toggleFilter} />
      </div>

      <div className="relative h-[68vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-border bg-canvas">
        {state.kind === "loading" ? (
          <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-3 bg-surface-2/50">
            <div className="h-3 w-40 rounded-full bg-surface-2" />
            <p className="text-sm text-ink-muted">{loadingCopy}</p>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-ink-muted">
              {errorCopy} Please try again.
            </p>
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

        {state.kind === "success" && payload && payload.nodes.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-ink-muted">
              No graph relationships available yet.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Add a visit or medical record to start building this patient&apos;s graph.
            </p>
          </div>
        ) : null}

        {state.kind === "success" && payload && payload.nodes.length > 0 ? (
          <>
            <GraphCanvas
              ref={canvasRef}
              nodes={visible.nodes}
              edges={visible.edges}
              rootNodeId={rootNode?.id ?? ""}
              selectedNodeId={selected?.node.id ?? null}
              onSelectNode={handleSelectNode}
              onDeselect={() => setSelected(null)}
            />
            <GraphLegend visible={[...new Set(visible.nodes.map((n) => n.type))]} />
            {!selected ? (
              <p className="pointer-events-none absolute left-2 top-2 rounded-lg border border-border/70 bg-canvas/80 px-2.5 py-1.5 text-[11px] text-ink-muted backdrop-blur">
                Click a node to inspect it · drag a node to move it · drag to pan · scroll to zoom
              </p>
            ) : null}
            <GraphDetailsPanel
              selected={selected}
              onClose={() => setSelected(null)}
              onExpand={handleExpand}
              onOpenPatient={onSelectPatient}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}