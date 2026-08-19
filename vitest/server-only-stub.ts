// Stub replacement for the `server-only` package during vitest runs.
// `server-only` intentionally throws when imported outside a React server
// build; tests run in plain Node, so we substitute an empty module.
export {};
