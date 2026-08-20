# T-014 — README: overview, why-graph, mermaid, queries, setup

| Field | Value |
|-------|-------|
| **ID** | T-014 |
| **Priority** | P2 |
| **Status** | done |
| **Type** | docs |
| **Branch** | docs/readme |
| **Depends on** | T-009, T-010 |
| **Blocks** | — |

## Problem

The deliverable requires a strong README (prompt §20): Overview, a mandatory
"Why a Graph Database?" section, Architecture + Data Model Mermaid diagrams,
explanation of important queries, and setup instructions. `docs/data-model.md`
(T-002) exists but a full README does not.

## Goal

A complete, accurate README that communicates the product, justifies the graph
choice honestly (no exaggerated SQL claims), documents architecture and schema
with Mermaid diagrams matching the real code, explains each important query
(question / relationships followed / why traversal helps), and gives a runnable
setup path.

## Scope
- README sections: Overview, **Why a Graph Database?**, Architecture (Mermaid),
  Data Model (Mermaid, matches T-002), Main Queries (per query: question /
  relationships / why traversal), Setup (CognoDB account → instance → creds →
  .env.local → install → seed → dev), Screenshots (from T-016), Demo URL (T-015),
  Video link.
- Explain why traversal is first-class vs SQL recursive CTEs without claiming
  SQL cannot do it (prompt §8 Q5 note).
- Reference actual file paths so docs cannot drift from schema.

## Out of scope
- Live screenshots/demo/video (T-015/T-016), deploy.

## Acceptance criteria
- [x] All required README sections present — Overview (synthetic-data disclaimer,
      graph-first value), Why a Graph Database?, Architecture (Mermaid
      flowchart, layers + rules), Data Model (Mermaid), Main Queries table
      (Q1–Q5 + search + expand, each with question / relationships / why),
      Setup (CognoDB → `.env.local` → install → seed → dev), Testing, Demo
      placeholders for T-015/T-016, Repository map.
- [x] Data Model Mermaid matches the real schema (T-002) — diagram copied from
      `docs/data-model.md` (8 node types, 9 typed relationships) and linked as
      the authoritative source so they stay in sync.
- [x] Every important query explained (question/relationships/why) — table maps
      each query module in `lib/cognodb/queries/` to the question it answers,
      the relationship types it traverses, and why traversal helps; each entry
      references the actual module path.
- [x] "Why a Graph Database?" is honest, no exaggerated SQL claims — covers the
      five traversal questions, quotes the real Q5 Cypher, and explicitly notes
      SQL *can* express these with recursive CTEs; the argument is
      ergonomics/first-class traversal, not capability.

## Implementation notes
- `README.md` created. Architecture section documents the real layering rules
  (thin API routes, parameterized Cypher with allowlist-only label exception,
  server-only driver, schema single-source-of-truth) so the README cannot
  drift from the code.
- Setup steps verified against `.env.example` (COGNODB_URI / USERNAME /
  PASSWORD / DATABASE) and `npm run seed` / `npm run dev`; Testing section
  matches `package.json` scripts (`npm test` runs the offline suites only).