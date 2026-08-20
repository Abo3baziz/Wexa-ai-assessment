"use client";

import { useState } from "react";

import { EntityPicker } from "@/components/path/EntityPicker";
import { PathCanvas } from "@/components/path/PathCanvas";
import { postApi } from "@/lib/fetchApi";
import type { PathTargetLabel } from "@/lib/cognodb/queries/pathBetween";
import type { SearchMode } from "@/lib/cognodb/queries/search";
import type {
  GraphEdge,
  PathResult,
  SearchResult,
} from "@/types";

const TARGET_TYPES: PathTargetLabel[] = [
  "Disease",
  "Medication",
  "Doctor",
  "Patient",
];

const DEPTHS = [4, 6] as const;

const TARGET_MODE: Record<PathTargetLabel, SearchMode> = {
  Disease: "disease",
  Medication: "medication",
  Doctor: "doctor",
  Patient: "patient-name",
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: PathResult }
  | { kind: "error"; message: string; retry: boolean };

function pathEdges(result: PathResult): GraphEdge[] {
  return result.links.map((link) => ({
    id: `${link.fromId}->${link.toId}::${link.relationship}`,
    source: link.fromId,
    target: link.toId,
    type: link.relationship as GraphEdge["type"],
  }));
}

export function PathExplorer() {
  const [from, setFrom] = useState<SearchResult | null>(null);
  const [targetType, setTargetType] = useState<PathTargetLabel>("Disease");
  const [to, setTo] = useState<SearchResult | null>(null);
  const [depth, setDepth] = useState<(typeof DEPTHS)[number]>(6);
  const [state, setState] = useState<State>({ kind: "idle" });

  const ready = from !== null && to !== null;

  async function findPath() {
    if (!ready) return;
    setState({ kind: "loading" });
    try {
      const result = await postApi<PathResult>("/api/path", {
        from: from.publicId,
        to: to.id,
        toLabel: targetType,
        depth: String(depth),
      });
      setState({ kind: "success", result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const retry =
        err instanceof Error && "retry" in err
          ? Boolean((err as { retry?: boolean }).retry)
          : false;
      setState({ kind: "error", message, retry });
    }
  }

  const result = state.kind === "success" ? state.result : null;

  return (
    <section aria-label="Path explorer" className="animate-fade-in">
      <div className="mb-1">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Path Explorer
        </h2>
        <p className="text-sm text-ink-muted">
          Trace the shortest connection between a patient and a disease,
          medication, doctor, or another patient.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <EntityPicker
            label="From patient"
            placeholder="Search a patient by name"
            mode="patient-name"
            value={from}
            onSelect={setFrom}
          />
          <span
            className="hidden pb-2.5 text-xl text-ink-muted sm:block"
            aria-hidden="true"
          >
            →
          </span>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              To
            </span>
            <div className="flex gap-2">
              <div
                role="group"
                aria-label="Target type"
                className="flex shrink-0 overflow-hidden rounded-lg border border-border"
              >
                {TARGET_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTargetType(t);
                      setTo(null);
                    }}
                    aria-pressed={t === targetType}
                    className={`px-2.5 py-2 text-xs transition-colors ${
                      t === targetType
                        ? "bg-brand text-white"
                        : "bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <EntityPicker
                label=""
                placeholder={`Search a ${targetType.toLowerCase()}`}
                mode={TARGET_MODE[targetType]}
                value={to}
                onSelect={setTo}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Maximum path depth" className="flex items-center gap-1.5">
            <span className="text-xs text-ink-muted">Max hops</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {DEPTHS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  aria-pressed={d === depth}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    d === depth
                      ? "bg-brand text-white"
                      : "bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!ready || state.kind === "loading"}
            onClick={() => void findPath()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.kind === "loading" ? "Tracing…" : "Find path"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {state.kind === "idle" ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
            <p className="text-sm text-ink-muted">
              Pick a patient and a target above, then press{" "}
              <span className="font-medium text-ink">Find path</span>.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Paths are capped at {depth} hops and traverse the hospital graph
              (visits, doctors, departments, diagnoses, prescriptions).
            </p>
          </div>
        ) : null}

        {state.kind === "loading" ? (
          <div className="flex h-40 animate-pulse flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface-2/50">
            <div className="h-3 w-48 rounded-full bg-surface-2" />
            <p className="text-sm text-ink-muted">Tracing the shortest path…</p>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-border bg-surface-2/50 px-6 text-center">
            <p className="text-sm text-ink-muted">
              Unable to trace a path right now. Please try again.
            </p>
            {state.retry ? (
              <button
                type="button"
                onClick={() => void findPath()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {result ? (
          result.found && result.nodes.length > 1 ? (
            <div className="space-y-3">
              <PathCanvas
                nodes={result.nodes}
                edges={pathEdges(result)}
                startId={result.nodes[0]!.id}
              />
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {result.nodes.map((node, i) => (
                  <span key={`${node.type}:${node.id}`} className="flex items-center gap-1.5">
                    {i > 0 ? (
                      <span className="text-ink-muted" aria-hidden="true">
                        {result.links[i - 1]?.relationship} →
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border border-border px-2 py-0.5 ${
                        i === 0 ? "bg-canvas font-medium text-ink" : "bg-surface text-ink-muted"
                      }`}
                    >
                      {node.label}
                      <span className="ml-1 text-[10px] uppercase tracking-wide">
                        {node.type}
                      </span>
                    </span>
                  </span>
                ))}
                <span className="ml-1 text-ink-muted">
                  ({result.links.length} hop{result.links.length === 1 ? "" : "s"})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFrom(null);
                  setTo(null);
                  setState({ kind: "idle" });
                }}
                className="text-sm text-ink-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-ink"
              >
                Trace another pair
              </button>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-border bg-surface-2/50 px-6 text-center">
              <p className="text-sm text-ink-muted">
                No path found within {depth} hops between{" "}
                <span className="font-medium text-ink">{from?.label}</span> and{" "}
                <span className="font-medium text-ink">{to?.label}</span>.
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Try a higher hop limit, a different target, or another patient.
              </p>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}