/** Graph rendering engines the explorer can run on. */
export type GraphEngine = "cytoscape" | "react-flow";

const ENGINE_KEY = "hge.graph-engine";

/** Read the persisted engine; defaults to Cytoscape on first visit. */
export function readGraphEngine(): GraphEngine {
  if (typeof window === "undefined") return "cytoscape";
  return window.localStorage.getItem(ENGINE_KEY) === "react-flow"
    ? "react-flow"
    : "cytoscape";
}

/** Persist the engine choice (localStorage, best-effort). */
export function writeGraphEngine(engine: GraphEngine): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENGINE_KEY, engine);
  } catch {
    // Storage may be unavailable (private mode); the choice just won't persist.
  }
}