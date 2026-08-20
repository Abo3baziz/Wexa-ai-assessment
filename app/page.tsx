"use client";

import { useCallback, useState } from "react";

import { ConnectionBanner } from "@/components/ConnectionBanner";
import { GraphExplorer } from "@/components/graph/GraphExplorer";
import { PatientOverview } from "@/components/PatientOverview";
import { PatientSearch } from "@/components/PatientSearch";
import { PathExplorer } from "@/components/path/PathExplorer";
import { RelatedPatients } from "@/components/RelatedPatients";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { getApi } from "@/lib/fetchApi";
import type {
  EntitySummary,
  PatientOverview as PatientOverviewData,
  SearchResult,
} from "@/types";

type View =
  | { kind: "empty" }
  | { kind: "loading"; publicId: string }
  | { kind: "success"; data: PatientOverviewData }
  | { kind: "error"; message: string; retry: boolean; publicId: string }
  | { kind: "graph"; publicId: string }
  | { kind: "entity"; summary: EntitySummary }
  | { kind: "path" };

export default function Home() {
  const [view, setView] = useState<View>({ kind: "empty" });

  const loadPatient = useCallback(async (publicId: string) => {
    setView({ kind: "loading", publicId });
    try {
      const data = await getApi<PatientOverviewData>(
        `/api/patients/${encodeURIComponent(publicId)}/history`
      );
      setView({ kind: "success", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const retry =
        err instanceof Error && "retry" in err
          ? Boolean((err as { retry?: boolean }).retry)
          : false;
      setView({ kind: "error", message, retry, publicId });
    }
  }, []);

  function handleSelect(result: SearchResult) {
    if (result.type === "Patient") {
      void loadPatient(result.publicId);
    } else {
      setView({
        kind: "entity",
        summary: {
          type: result.type as EntitySummary["type"],
          id: result.id,
          label: result.label,
          properties: {},
        },
      });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-node-patient"
              aria-hidden="true"
            />
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Hospital Graph Explorer
            </h1>
            <span className="hidden text-xs text-ink-muted sm:inline">
              synthetic demo data
            </span>
          </div>
          <ConnectionBanner />
          <button
            type="button"
            onClick={() => setView({ kind: "path" })}
            aria-pressed={view.kind === "path"}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view.kind === "path"
                ? "bg-brand text-white"
                : "border border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            Path Explorer
          </button>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <PatientSearch
            onSelect={handleSelect}
            selectedPublicId={
              view.kind === "success" ? view.data.patient.publicId : null
            }
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {view.kind === "success" || view.kind === "entity" || view.kind === "graph" || view.kind === "path" ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 text-sm"
          >
            <button
              type="button"
              onClick={() => setView({ kind: "empty" })}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              Home
            </button>
            <span className="text-ink-muted" aria-hidden="true">
              ›
            </span>
            {view.kind === "path" ? (
              <span className="text-ink">Path Explorer</span>
            ) : view.kind === "graph" ? (
              <>
                <button
                  type="button"
                  onClick={() => void loadPatient(view.publicId)}
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  Patient
                </button>
                <span className="text-ink-muted" aria-hidden="true">
                  ›
                </span>
                <span className="text-ink">Graph Explorer</span>
              </>
            ) : (
              <span className="text-ink">
                {view.kind === "success"
                  ? `${view.data.patient.firstName} ${view.data.patient.lastName}`
                  : view.summary.label}
              </span>
            )}
          </nav>
        ) : null}

        {view.kind === "empty" ? (
          <EmptyState
            title="Select a patient to begin"
            message="Use the search box above to find a patient by name or national ID, or explore a doctor, department, disease, or medication."
          />
        ) : null}

        {view.kind === "loading" ? <LoadingState /> : null}

        {view.kind === "error" ? (
          <ErrorState
            message={view.message}
            retry={view.retry}
            onRetry={() => void loadPatient(view.publicId)}
          />
        ) : null}

        {view.kind === "success" ? (
          <>
            <PatientOverview
              overview={view.data}
              onExploreGraph={() =>
                setView({ kind: "graph", publicId: view.data.patient.publicId })
              }
            />
            <RelatedPatients
              publicId={view.data.patient.publicId}
              onSelect={(publicId) => void loadPatient(publicId)}
            />
          </>
        ) : null}

        {view.kind === "graph" ? (
          <GraphExplorer
            root={{ kind: "patient", publicId: view.publicId }}
            onSelectPatient={(publicId) => void loadPatient(publicId)}
          />
        ) : null}

        {view.kind === "entity" ? (
          <GraphExplorer
            root={{ kind: "entity", summary: view.summary }}
            onSelectPatient={(publicId) => void loadPatient(publicId)}
          />
        ) : null}

        {view.kind === "path" ? <PathExplorer /> : null}
      </main>
    </div>
  );
}
