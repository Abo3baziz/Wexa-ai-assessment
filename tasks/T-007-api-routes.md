# T-007 — API routes, error envelope, and health endpoint

| Field | Value |
|-------|-------|
| **ID** | T-007 |
| **Priority** | P1 |
| **Status** | todo |
| **Type** | feature |
| **Branch** | feature/api-routes |
| **Depends on** | T-006 |
| **Blocks** | T-008 |

## Problem

No API exists. The UI needs typed endpoints, and the app must degrade gracefully
when CognoDB is unreachable (prompt §15, §19) with friendly messages + retry,
never leaking credentials.

## Goal

Thin Next.js App Router API routes that call services (no Cypher in handlers),
return a uniform JSON envelope, and map DB/validation failures to friendly
messages with a `retry` flag.

## Scope
- `lib/api/types.ts` — success/error response envelopes.
- `lib/api/errors.ts` — map `CognodbError`/validation → JSON error shape; generic
  "database temporarily unavailable" for connection failures; never expose creds
  or stack traces.
- `app/api/health/route.ts` — connectivity check (drives status banner).
- `app/api/search/route.ts` — `GET ?q=`.
- `app/api/patients/[publicId]/history/route.ts`.
- `app/api/patients/[publicId]/related/route.ts`.
- `app/api/patients/[publicId]/pathway/route.ts`.
- `app/api/path/route.ts` — `POST {from, to}` with restricted-pair validation.
- Validate `publicId` format in routes (reject before DB).

## Out of scope
- UI components, Cypher, styling.

## Acceptance criteria
- [ ] All endpoints return the uniform envelope
- [ ] DB-unavailable produces friendly message + `retry: true`, no creds/stack
- [ ] Invalid params return 400 without DB access
- [ ] `/api/health` reflects connectivity
- [ ] `npm run typecheck` passes