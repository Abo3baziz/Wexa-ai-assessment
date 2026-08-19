"use client";

import { useCallback, useEffect, useState } from "react";

import { getApi } from "@/lib/fetchApi";
import type { HealthStatus } from "@/types";

type BannerState =
  | { kind: "checking" }
  | { kind: "online" }
  | { kind: "offline"; message: string };

export function ConnectionBanner() {
  const [state, setState] = useState<BannerState>({ kind: "checking" });

  const check = useCallback(async () => {
    setState({ kind: "checking" });
    try {
      const health = await getApi<HealthStatus>("/api/health");
      if (health.connected) {
        setState({ kind: "online" });
      } else {
        setState({ kind: "offline", message: "Database unreachable." });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Database unreachable.";
      setState({ kind: "offline", message });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  if (state.kind === "online") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Connected
      </div>
    );
  }

  if (state.kind === "offline") {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
        role="alert"
      >
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span>{state.message}</span>
        <button
          type="button"
          onClick={() => void check()}
          className="ml-1 font-medium text-red-200 underline underline-offset-2 hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted">
      <span className="h-2 w-2 animate-pulse rounded-full bg-border" />
      Checking connection…
    </div>
  );
}
