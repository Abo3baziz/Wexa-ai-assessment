# T-015 — Deploy to Vercel and verify live demo

| Field | Value |
|-------|-------|
| **ID** | T-015 |
| **Priority** | P1 |
| **Status** | todo |
| **Type** | chore |
| **Branch** | chore/deploy |
| **Depends on** | T-013 |
| **Blocks** | T-016 |

## Problem

Definition of Done requires the app to be deployed with a live demo against the
hosted CognoDB instance (prompt §26). No deployment exists.

## Goal

The app is built and deployed to Vercel with environment variables configured,
the demo works against the hosted CognoDB instance, and the deploy is
reproducible from the repo.

## Scope
- Ensure `next build` succeeds.
- Configure Vercel env vars (COGNODB_URI, COGNODB_USERNAME, COGNODB_PASSWORD,
  COGNODB_DATABASE) — never committed.
- Deploy project to Vercel; verify production URL serves the explorer.
- Verify a patient search/overview/graph/related/path flow works against the
  hosted instance (seed must already be present via T-004/T-013).
- Note the deploy URL for README (T-014) and screenshots (T-016).

## Out of scope
- Building the app features themselves.

## Acceptance criteria
- [ ] `next build` succeeds
- [ ] Vercel deployment live at a URL using hosted CognoDB
- [ ] Core explorer flow works against the hosted instance
- [ ] No credentials committed

## References
Deployment blocker: needs reachable CognoDB + Vercel credentials/CLI.