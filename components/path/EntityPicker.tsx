"use client";

import { useEffect, useRef, useState } from "react";

import { getApi } from "@/lib/fetchApi";
import type { SearchMode } from "@/lib/cognodb/queries/search";
import type { SearchResult } from "@/types";

interface EntityPickerProps {
  label: string;
  placeholder: string;
  mode: SearchMode;
  value: SearchResult | null;
  onSelect: (result: SearchResult | null) => void;
  disabled?: boolean;
}

/**
 * Debounced search-as-you-type picker backed by the shared `/api/search`
 * route. Emits the picked SearchResult; selection clears when the chip's × is
 * clicked. Used by the path explorer for both the patient and the target.
 */
export function EntityPicker({
  label,
  placeholder,
  mode,
  value,
  onSelect,
  disabled,
}: EntityPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedId = value === null ? "" : value.id;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      void getApi<SearchResult[]>(
        `/api/search?q=${encodeURIComponent(q)}&mode=${mode}&limit=6`
      )
        .then((rows) => {
          setResults(rows);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, mode]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      {label ? (
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
      ) : null}
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-ink">
            {value.label}
          </span>
          <span className="shrink-0 text-[11px] text-ink-muted">{value.subtitle}</span>
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()} selection`}
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="shrink-0 rounded p-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          />
          {loading ? (
            <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-ink-muted border-t-transparent" />
          ) : null}
          {open && results.length > 0 ? (
            <ul
              role="listbox"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              {results.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  role="option"
                  aria-selected={selectedId === r.id}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(r);
                      setQuery("");
                      setResults([]);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {r.label}
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-muted">
                      {r.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {open && results.length === 0 && query.trim().length >= 2 && !loading ? (
            <p className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-muted shadow-card">
              No matches for “{query.trim()}”.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}