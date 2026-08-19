"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApi } from "@/lib/fetchApi";
import type { NodeType, SearchResult } from "@/types";

const TYPE_LABEL: Record<NodeType, string> = {
  Patient: "Patient",
  Visit: "Visit",
  Doctor: "Doctor",
  Department: "Department",
  Disease: "Disease",
  Medication: "Medication",
  Diagnosis: "Diagnosis",
  Prescription: "Prescription",
};

const TYPE_DOT: Record<NodeType, string> = {
  Patient: "bg-node-patient",
  Visit: "bg-node-visit",
  Doctor: "bg-node-doctor",
  Department: "bg-node-department",
  Disease: "bg-node-disease",
  Medication: "bg-node-medication",
  Diagnosis: "bg-node-diagnosis",
  Prescription: "bg-node-prescription",
};

export function PatientSearch({
  onSelect,
  selectedPublicId,
}: {
  onSelect: (result: SearchResult) => void;
  selectedPublicId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [active, setActive] = useState(0);
  const [loadedQuery, setLoadedQuery] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setStatus("idle");
      setLoadedQuery("");
      setOpen(false);
      return;
    }
    setStatus("loading");
    try {
      const data = await getApi<SearchResult[]>(
        `/api/search?q=${encodeURIComponent(trimmed)}`
      );
      setResults(data);
      setLoadedQuery(trimmed);
      setActive(0);
      setStatus("done");
      setOpen(true);
    } catch (err) {
      setStatus("error");
      setOpen(false);
      void err;
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, runSearch]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleSelect(result: SearchResult) {
    if (result.type !== "Patient") return;
    onSelect(result);
    setQuery(result.label);
    setOpen(false);
    setStatus("idle");
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = results[active];
      if (current) handleSelect(current);
    }
  }

  const showResults = open && status === "done";
  const isEmpty = showResults && results.length === 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            showResults && results[active]
              ? `result-${active}`
              : undefined
          }
          placeholder="Search a patient, national ID, doctor, disease, or medication"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-brand focus:outline-none"
        />
        {selectedPublicId ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
            {selectedPublicId}
          </span>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-surface p-3 shadow-card">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
        </div>
      ) : null}

      {showResults && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-card"
        >
          {isEmpty ? (
            <li className="px-4 py-6 text-center text-sm text-ink-muted">
              No matches for “{loadedQuery}”.
            </li>
          ) : (
            results.map((result, index) => {
              const isPatient = result.type === "Patient";
              const isActive = index === active;
              return (
                <li
                  key={`${result.type}-${result.id}`}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    type="button"
                    id={`result-${index}`}
                    disabled={!isPatient}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => handleSelect(result)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive ? "bg-brand-soft" : ""
                    } ${isPatient ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_DOT[result.type]}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {result.label}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {result.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {TYPE_LABEL[result.type]}
                    </span>
                    {!isPatient ? (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-ink-muted">
                        not a patient
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
