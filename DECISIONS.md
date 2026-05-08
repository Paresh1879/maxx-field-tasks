# Maxx Field Tasks — Decisions & Learnings

## HubSpot Task Creation — Scope Issues

**Problem:** `crm.objects.tasks.read` and `crm.objects.tasks.write` do not appear in HubSpot's developer app scope selector UI. The CRM objects tasks API returns 403 MISSING_SCOPES.

**Attempted:** HubSpot Engagements API (`/engagements/v1/engagements`) — also rejected with 403, requires `tasks-write` or `engagements-write` scopes which are also not in the UI.

**Decision:** Use a HubSpot Service Key for task creation. OAuth handles user identity and deal reads; the Service Key handles task writes. Store as `HUBSPOT_SERVICE_KEY` in `.env.local`.

HubSpot now recommends Service Keys over legacy private apps for single-account access — full platform support, no app management overhead, same Bearer token mechanic.

**Status:** `app/api/tasks/route.ts` still uses `session.accessToken` — needs to swap to `process.env.HUBSPOT_SERVICE_KEY` in the `Authorization` header. This is the active blocker before the app end-to-end works.

---

## HubSpot Client — Server Component vs Route Handler

**Problem:** `session.save()` (sets a cookie) throws in Next.js Server Components — only allowed in Route Handlers and Server Actions.

**Decision:** Split `lib/hubspot.ts` into two functions:
- `getHubspotClient()` — for Server Components, read-only, no cookie writes, throws "Not authenticated" if token expired
- `withHubspot()` — for Route Handlers only, full proactive refresh + save

---

## Claude Model

**Brief specifies:** `claude-sonnet-4-20250514`
**Status:** Deprecated, retires June 15 2026. Using as specified by brief for now.
**Note:** Migrate to `claude-sonnet-4-6` before retirement.

---

## HubSpot OAuth Scopes — Final List

Scopes that actually appear in the developer portal and are needed:
- `crm.objects.deals.read`
- `crm.objects.contacts.read`
- `crm.objects.owners.read`
- `crm.schemas.deals.read`
- `oauth`

Scopes NOT in the portal UI (as of May 2026):
- `crm.objects.tasks.read`
- `crm.objects.tasks.write`

---

## FilterOperatorEnum — HubSpot Client

`FilterOperatorEnum` is not re-exported from the top-level `@hubspot/api-client` package. Must import directly:
```ts
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/deals/models/Filter";
```

---

## Next.js Version

Running 16.2.4 (Turbopack). Key differences from training data:
- `params` and `searchParams` are now Promises — must `await` them
- `PageProps` and `LayoutProps` are globally available helpers
- Cookies can only be modified in Route Handlers / Server Actions

---

## Current Status (as of May 2026)

Commits 1–11 landed. Two files are modified but uncommitted:
- `app/api/tasks/route.ts` — still uses OAuth token (403s); needs private app token
- `app/deals/[id]/new/TaskDraftForm.tsx` — loading states + error handling already present (commit 12 content)

Remaining work: fix `route.ts` → commit 10/12 → README (13) → Vercel deploy (14).

---

## Known Limitations (for README)

- HubSpot access tokens expire in 30 min — token refresh only works in Route Handlers
- Claude API key requires credits — no fallback if balance is zero
- Task creation requires a HubSpot Service Key (`HUBSPOT_SERVICE_KEY`) alongside the OAuth credentials
- `zlib.bytesRead` deprecation warning from `@hubspot/api-client` — harmless, from dependency
- Multiple lockfiles warning from Turbopack — stray `package-lock.json` at `/Users/paresh/`
