"use client";

import { useEffect, useRef, useState } from "react";

import { readGraphEngine, writeGraphEngine, type GraphEngine } from "@/lib/graph/engine";

const ENGINES: { value: GraphEngine; label: string; hint: string }[] = [
  { value: "cytoscape", label: "Cytoscape.js", hint: "canvas renderer" },
  { value: "react-flow", label: "React Flow", hint: "svg renderer" },
];

/** Read the persisted engine once on mount; changing it persists immediately. */
export function useGraphEngine(): [GraphEngine, (engine: GraphEngine) => void] {
  const [engine, setEngine] = useState<GraphEngine>("cytoscape");
  useEffect(() => {
    setEngine(readGraphEngine());
  }, []);
  function choose(next: GraphEngine) {
    setEngine(next);
    writeGraphEngine(next);
  }
  return [engine, choose];
}

/** Header control: shows the active engine, opens a menu to switch. */
export function GraphEngineToggle({
  engine,
  onChange,
}: {
  engine: GraphEngine;
  onChange: (engine: GraphEngine) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const active = ENGINES.find((e) => e.value === engine) ?? ENGINES[0]!;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <span className="hidden text-xs text-ink-muted sm:inline">Engine</span>
        <span className="font-medium text-ink">{active.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className={open ? "rotate-180" : ""}>
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <ul
          role="menu"
          aria-label="Graph engine"
          className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg shadow-black/40"
        >
          {ENGINES.map((e) => (
            <li key={e.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={e.value === engine}
                onClick={() => {
                  onChange(e.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  e.value === engine
                    ? "bg-surface-2 text-ink"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>
                  <span className="block font-medium">{e.label}</span>
                  <span className="block text-[11px] text-ink-muted">{e.hint}</span>
                </span>
                {e.value === engine ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}