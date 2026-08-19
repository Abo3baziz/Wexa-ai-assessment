# T-014 — README: overview, why-graph, mermaid, queries, setup

| Field | Value |
|-------|-------|
| **ID** | T-014 |
| **Priority** | P2 |
| **Status** | todo |
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
- [ ] All required README sections present
- [ ] Data Model Mermaid matches the real schema (T-002)
- [ ] Every important query explained (question/relationships/why)
- [ ] "Why a Graph Database?" is honest, no exaggerated SQL claims