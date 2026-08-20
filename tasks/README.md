# Hospital Graph Explorer — Task Backlog

Sequential `T-XXX` backlog. Each task file follows the shared template. IDs are
never renumbered. Statuses: `todo` / `in_progress` / `done` / `blocked` / `wontfix`.
Branch type must match task type (`feature/`, `bugfix/`, `refactor/`, `chore/`,
`docs/`, `test/`).

## Priority index

### P0 (production blockers — security / money / data integrity)
_None._ This is a synthetic-data demonstration app; no P0 items.

### P1 (required before real traffic)
| ID | File | Title | Status |
|----|------|-------|--------|
| T-001 | [scaffold-verify](./T-001-scaffold-verify.md) | Verify scaffold: typecheck + lint green | done |
| T-002 | [data-model-doc](./T-002-data-model-doc.md) | Graph data model doc, Mermaid, domain types | done |
| T-003 | [cognodb-driver](./T-003-cognodb-driver.md) | Server-side driver, config, server-only | done |
| T-004 | [seed-data](./T-004-seed-data.md) | Seed script with constraints + deterministic data | done |
| T-005 | [cypher-queries](./T-005-cypher-queries.md) | Parameterized Cypher query layer (Q1–Q5 + search) | done |
| T-006 | [services](./T-006-services.md) | Service mappers and param validation | done |
| T-007 | [api-routes](./T-007-api-routes.md) | API routes, error envelope, health endpoint | done |
| T-008 | [core-ui](./T-008-core-ui.md) | Core UI shell, search, overview, states | done |
| T-010 | [related-patients](./T-010-related-patients.md) | Related patients panel + click-through | done |
| T-013 | [integration-tests](./T-013-integration-tests.md) | Integration tests gated on COGNODB_URI | done |
| T-015 | [deploy-vercel](./T-015-deploy-vercel.md) | Deploy to Vercel + verify live demo | todo |

### P2 (quality / DX / polish)
| ID | File | Title | Status |
|----|------|-------|--------|
| T-009 | [graph-viz](./T-009-graph-viz.md) | Graph visualization + node detail panel | done |
| T-017 | [seed-american-names](./T-017-seed-american-names.md) | American names with gender-consistent surnames | done |
| T-018 | [national-id](./T-018-national-id.md) | Patient national ID + search by it | done |
| T-019 | [search-mode](./T-019-search-mode.md) | Selectable search mode + clickable entity results | done |
| T-020 | [cytoscape-graph-explorer](./T-020-cytoscape-graph-explorer.md) | Obsidian-style graph explorer on Cytoscape.js (replaces T-009) | done |
| T-011 | [path-explorer](./T-011-path-explorer.md) | Path explorer (restricted pairs, Q4) | done |
| T-012 | [unit-test-mappers](./T-012-unit-test-mappers.md) | Service mapper unit tests + vitest config | done |
| T-014 | [readme](./T-014-readme.md) | README: overview, why-graph, mermaid, queries, setup | done |
| T-021 | [graph-engine-toggle](./T-021-graph-engine-toggle.md) | Graph engine toggle: feature-parity React Flow renderer | done |
| T-022 | [elkjs-layout](./T-022-elkjs-layout.md) | ElkJS tree layout + always-readable edge labels for React Flow | done |
| T-023 | [path-to-search-width](./T-023-path-to-search-width.md) | Widen path explorer "To" search results dropdown | done |
| T-024 | [patient-name-search](./T-024-patient-name-search.md) | Pure "Name" patient search mode | done |
| T-025 | [path-to-target-layout](./T-025-path-to-target-layout.md) | Fix truncated entity name in path explorer "To" field | done |
| T-016 | [final-cleanup](./T-016-final-cleanup.md) | Screenshots, screen recording, repo cleanup | todo |

### P3 (future / product)
_None._

## Suggested execution order

1. **T-001** — verify scaffold (baseline gate)
2. **T-002** — data model doc + types (schema source of truth)
3. **T-003** — driver + config + server-only (enables DB)
4. **T-004** — seed data (live instance)
5. **T-005** — parameterized Cypher queries
6. **T-006** — service mappers + validation
7. **T-007** — API routes + error envelope + health
8. **T-008** — core UI + states
9. **T-010** — related patients panel
10. **T-009** — graph visualization + detail panel
11. **T-011** — path explorer
12. **T-012** — unit tests (mappers)
13. **T-013** — integration tests (live)
14. **T-014** — README
15. **T-015** — Vercel deploy
16. **T-016** — final cleanup + screenshots

Partial-order constraints: 002→004; 003→004/005/013; 004→005/013; 005→006;
006→007/012; 007→008; 008→009/010; 009→011; 013→015; 015→016; 009/010→014.

## How to use
- New task? Find next ID from the highest listed here; never renumber existing tasks.
- Keep each task on one `feature|bugfix|refactor|chore|docs|test` branch.
- `PROJECT_PROGRESS.md` is not used in this repo; completion is recorded by
  flipping the task's status to `done` and marking acceptance criteria [x] with
  evidence.
- Ground each task in the live codebase (docs/ + affected files) before writing it.
