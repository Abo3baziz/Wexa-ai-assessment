"use client";

import { useCallback, useEffect, useState } from "react";

import { getApi } from "@/lib/fetchApi";
import { EmptyState } from "@/components/states/EmptyState";
import type { RelatedPatient, RelatedReason } from "@/types";

const REASON_LABEL: Record<RelatedReason, string> = {
  shared_disease: "Shared disease",
  shared_medication: "Shared medication",
  shared_doctor: "Shared doctor",
};

const REASON_CHIP: Record<RelatedReason, string> = {
  shared_disease: "bg-node-disease",
  shared_medication: "bg-node-medication",
  shared_doctor: "bg-node-doctor",
};

type State =
  | { kind: "loading" }
  | { kind: "success"; items: RelatedPatient[] }
  | { kind: "error"; message: string; retry: boolean };

export function RelatedPatients({
  publicId,
  onSelect,
}: {
  publicId: string;
  onSelect: (publicId: string) => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const data = await getApi<RelatedPatient[]>(
        `/api/patients/${encodeURIComponent(publicId)}/related?limit=12`
      );
      setState({ kind: "success", items: data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const retry =
        err instanceof Error && "retry" in err
          ? Boolean((err as { retry?: boolean }).retry)
          : false;
      setState({ kind: "error", message, retry });
    }
  }, [publicId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-label="Related patients" className="mt-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Related patients
        </h2>
        {state.kind === "success" ? (
          <span className="text-sm text-ink-muted">
            connected through shared conditions, medications, or doctors
          </span>
        ) : null}
      </div>

      {state.kind === "loading" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse rounded-xl bg-surface-2"
            />
          ))}
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-10 text-center"
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

      {state.kind === "success" && state.items.length === 0 ? (
        <EmptyState
          title="No related patients found"
          message="This patient has no other patients connected through shared diseases, medications, or doctors in the graph."
        />
      ) : null}

      {state.kind === "success" && state.items.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {state.items.map((related) => (
            <li key={related.patient.publicId}>
              <button
                type="button"
                onClick={() => onSelect(related.patient.publicId)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left transition-colors hover:border-brand/50 hover:bg-surface-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-node-patient"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-ink">
                      {related.patient.firstName} {related.patient.lastName}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      {related.patient.publicId}
                    </span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {related.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${REASON_CHIP[reason]}`}
                          aria-hidden="true"
                        />
                        {REASON_LABEL[reason]}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-brand">
                  {related.connectionCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
