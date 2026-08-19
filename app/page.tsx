"use client";

import { useCallback, useState } from "react";

import { ConnectionBanner } from "@/components/ConnectionBanner";
import { PatientOverview } from "@/components/PatientOverview";
import { PatientSearch } from "@/components/PatientSearch";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { getApi } from "@/lib/fetchApi";
import type { PatientOverview as PatientOverviewData, SearchResult } from "@/types";

type View =
  | { kind: "empty" }
  | { kind: "loading"; publicId: string }
  | { kind: "success"; data: PatientOverviewData }
  | { kind: "error"; message: string; retry: boolean; publicId: string };

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
      const message = err instanceof Error ? err.message : "Something went wrong.";
      const retry = err instanceof Error && "retry" in err
        ? Boolean((err as { retry?: boolean }).retry)
        : false;
      setView({ kind: "error", message, retry, publicId });
    }
  }, []);

  function handleSelect(result: SearchResult) {
    void loadPatient(result.subtitle);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-node-patient" aria-hidden="true" />
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Hospital Graph Explorer
            </h1>
            <span className="hidden text-xs text-ink-muted sm:inline">
              synthetic demo data
            </span>
          </div>
          <ConnectionBanner />
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
        {view.kind === "empty" ? (
          <EmptyState
            title="Select a patient to begin"
            message="Use the search box above to find a patient by name. Their overview, current conditions, and medications will appear here."
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
          <PatientOverview overview={view.data} />
        ) : null}
      </main>
    </div>
  );
}
