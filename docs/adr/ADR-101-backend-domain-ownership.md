# ADR-101: Backend Domain Ownership

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Depends on** | ADR-100 (Architecture Freeze v1.0), ADR-001 (Lifecycle), ADR-002 (Commands) |
| **Supersedes** | Implicit client-only ownership in ADR-100 §Explicitly NOT frozen |
| **Authority chain** | ADR-100 → ADR-101 → Backend Foundation implementation |

---

## Context

ADR-100 frozen the **client architecture at v1.0**: `web/` owns runtime orchestration, `packages/` owns pure lifecycle/commands/matching, and `localStorage` is the sole write store. That model is sufficient for MVP demo but cannot support SaaS requirements (PDPL, concurrency, server RBAC, tenancy, audit integrity).

Backend Foundation introduces a **server-authoritative runtime**. Without explicit domain ownership rules, logic will duplicate across `web/` command handlers and a new API layer — recreating the POC/web drift ADR-100 eliminated.

This ADR defines **who owns what** after Backend Foundation: bounded contexts, layer responsibilities, and migration rules from the frozen v1.0 client.

---

## Decision

**Establish a three-tier domain ownership model:**

| Tier | Role | Location |
|------|------|----------|
| **T1 — Shared pure domain** | Business rules with zero I/O; consumed by server and optionally web during transition | `packages/*` |
| **T2 — Server application domain** | Authoritative command execution, persistence, auth, RBAC, orchestration | `server/` (new) |
| **T3 — Client presentation domain** | UI, read models, optimistic UX, API client | `web/` |

**Rule:** Lifecycle mutations and aggregate state changes are **owned exclusively by T2** once Backend Foundation Phase 1 is complete. T1 defines *rules*; T2 *executes* and *persists*; T3 *displays* and *requests*.

---

## Target topology

```
┌──────────────────────────────────────────────────────────────┐
│  web/ — T3 Client (presentation)                              │
│  React UI → api client → read models / view-models            │
│  No authoritative lifecycle writes after Phase 1 cutover      │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS (commands + queries)
┌────────────────────────────▼─────────────────────────────────┐
│  server/ — T2 Server application (authoritative)              │
│  API → CommandGateway → Handlers → Repositories → PostgreSQL  │
│  Auth (JWT) │ RBAC │ Audit │ Matching orchestration │ Events  │
└────────────────────────────┬─────────────────────────────────┘
                             │ imports (pure only)
┌────────────────────────────▼─────────────────────────────────┐
│  packages/ — T1 Shared pure domain                            │
│  lifecycle │ commands │ matching │ readiness (extracted)        │
└──────────────────────────────────────────────────────────────┘
```

POC remains seed source and regression harness only ([ADR-100](../adr/ADR-100-architecture-freeze-v1.md)). No new product logic in `POC/src/`.

---

## Bounded contexts and aggregate ownership

Each row is the **single authoritative owner** for that aggregate's lifecycle and persistence after cutover.

| Bounded context | Aggregate root | T2 owner module | T1 shared rules | T3 client responsibility |
|-----------------|----------------|-----------------|-----------------|--------------------------|
| **Identity** | User, Company (PlatformUser) | `server/src/identity/` | — | Login forms, profile editor, session display |
| **Opportunity** | Opportunity | `server/src/opportunity/` | lifecycle, readiness, publish gate | Create/edit draft fields, publish UI, pipeline |
| **Application** | Application | `server/src/application/` | lifecycle | Apply wizard, pipeline, status display |
| **Matching** | PostMatch | `server/src/matching/` | matching engine, strong-key, discover validation | Match list, accept/decline UI |
| **Negotiation** | Negotiation | `server/src/negotiation/` | lifecycle | Counter-offer UI |
| **Deal** | Deal | `server/src/deal/` | lifecycle | Deal workspace, milestones |
| **Contract** | Contract | `server/src/contract/` | lifecycle | Sign/complete UI |
| **Notification** | Notification | `server/src/notification/` | — | Notification center |
| **Governance** | AuditEntry | `server/src/audit/` | — | Admin audit log (read-only) |
| **Platform** | Tenant, Org (future) | `server/src/platform/` | RBAC policy evaluators (pure) | Admin settings |

**Cross-context orchestration** (contract → deal → opportunity sync) moves from `web/src/services/lifecycle-orchestrator.ts` to **`server/src/orchestration/lifecycle-orchestrator.ts`**, using the same pure lifecycle rules from `@pm-twin/lifecycle`.

---

## Layer ownership within `server/`

| Layer | Path pattern | Owns | Must not own |
|-------|--------------|------|--------------|
| **API** | `server/src/api/` | HTTP routing, request validation, auth middleware, DTO mapping | Business rules, FSM transitions |
| **Application** | `server/src/application/` | Command gateway, handlers, RBAC gate, idempotency, unit-of-work | React/DOM, SQL in handlers |
| **Domain adapters** | `server/src/domain/` | Server-specific ports (repository interfaces, event types) | Duplicate pure rules already in packages |
| **Infrastructure** | `server/src/infrastructure/` | Prisma repos, JWT, email stubs, job queue | UI concerns |
| **Orchestration** | `server/src/orchestration/` | Cross-aggregate side effects, matching runs | Entity policy definitions |

### Command execution ownership

The server **must** mirror the frozen v1.0 gateway contract ([ADR-100](../adr/ADR-100-architecture-freeze-v1.md)):

```
HTTP POST /api/v1/commands
  → auth middleware (JWT)
  → server CommandGateway.execute(ADR-002 Command)
  → evaluateCommandRbac (authoritative)
  → EntityCommandHandler (server copy or shared handler lib)
  → Repository (PostgreSQL)
  → audit append + optional domain event
```

| Concern | v1.0 owner (web) | v1.1 owner (server) |
|---------|------------------|---------------------|
| Command DTO shape | `@pm-twin/commands` | Same — no server-local command types |
| FSM validation | `@pm-twin/lifecycle` in handler | Same |
| Publish readiness gate | `web/src/domain/publish-readiness/` | `@pm-twin/readiness` (extracted) in handler |
| Publish RBAC | `web/src/domain/rbac/command-rbac.ts` | Server gateway — same policy inputs, server actor |
| Matching discover | `web/src/services/matching-service.ts` | `server/src/matching/matching-service.ts` |
| Persistence | `localStorage` overrides | PostgreSQL via Prisma |

---

## Package extraction plan (T1)

Logic currently in `web/src/domain/` that **must** move to `packages/` before or during Backend Foundation:

| Package | Source (web v1.0) | Priority | Rationale |
|---------|-------------------|----------|-----------|
| `@pm-twin/readiness` | `profile-readiness/`, `opportunity-readiness/`, `publish-readiness/` | **P0** | Handlers on server and pre-checks on client need identical gate |
| `@pm-twin/readiness-analytics` | `readiness-analytics/`, `matching-quality/` | P1 | Admin queries; pure aggregation |
| `@pm-twin/rbac-policies` | `web/src/domain/rbac/policies/*`, `registry.ts`, `policy-utils.ts` | P1 | Server and client advisory checks share rules |
| `@pm-twin/matching` | already exists | — | No change to engine internals |
| `@pm-twin/lifecycle` | already exists | — | ADR-001 authority |
| `@pm-twin/commands` | already exists | — | ADR-002 authority |

**Stay in web (T3 only):**

| Module | Reason |
|--------|--------|
| `components/readiness/*` | Presentation |
| `lib/publish-opportunity-ui-actions.ts` | UI orchestration; calls API after cutover |
| `lib/*-read-model.ts` | View-model shaping |
| `domain/normalized/` (interim) | Client read adapters until API returns canonical DTOs |

**Deprecate after cutover:**

| Module | Replacement |
|--------|-------------|
| `web/src/commands/handlers/*` | Server handlers (or shared `@pm-twin/handlers` if extracted) |
| `web/src/repositories/*` | Server Prisma repositories + thin API client |
| `web/src/infrastructure/storage/local-storage-adapter.ts` | Session/theme only |

---

## Read vs write ownership

| Operation | v1.0 | v1.1 authoritative owner |
|-----------|------|----------------------------|
| List opportunities | web repository + seed merge | `GET /api/v1/opportunities` → server read repo |
| Patch draft fields (non-lifecycle) | web `opportunitiesApi.update` | `PATCH /api/v1/opportunities/:id` — server validates no status in patch |
| Publish opportunity | web command gateway + matching service | `POST /api/v1/commands` (`TransitionOpportunityStatus`) + server matching job |
| Accept PostMatch | web command gateway | Same command via server API |
| Admin analytics | web pure functions over local data | `GET /api/v1/admin/analytics/*` — server aggregates from DB |

**Client read cache (optional Phase 1B):** `web/` may retain a read-through cache (TanStack Query or equivalent) but **must not** treat `localStorage` overrides as source of truth after cutover.

---

## RBAC and auth ownership

| Concern | Owner | Notes |
|---------|-------|-------|
| JWT issuance / validation | **T2** `server/src/infrastructure/auth/` | Replaces `auth-service.ts` Base64 |
| Permission policy definitions | **T1** `@pm-twin/rbac-policies` (extracted) | Pure `evaluate*Policy()` functions |
| Command RBAC enforcement | **T2** server gateway | Authoritative; client checks are advisory UX only |
| Admin route access | **T2** API middleware + **T3** route guard | Defense in depth; server wins |
| Actor context | **T2** from JWT claims (`userId`, `role`, `tenantId`) | Replaces `CommandPermissionActor` thread-local |

Frozen v1.0 rules carry forward:

- Publish requires owner (`creatorId`) or admin ([ADR-100](../adr/ADR-100-architecture-freeze-v1.md))
- Admin PostMatch platform commands require admin role
- Non-publish opportunity transitions remain ungoverned at gateway unless policy added via ADR amendment

---

## Matching domain ownership

| Step | Owner | Location |
|------|-------|----------|
| Score calculation | T1 | `@pm-twin/matching` |
| Model routing / ranking | T1 | `@pm-twin/matching` |
| Publish matching trigger | T2 | Server handler after `published` transition |
| Discover command persistence | T2 | `PostMatchCommandHandler` on server |
| Readiness score adjustment | T1 rule, T2 toggle | `@pm-twin/readiness`; env flag on server only |
| Skill canonical data | T1 config | `packages/seed-data/skill-canonical.json` or DB lookup table |
| Matching run audit | T2 | `server/src/matching/matching-run-audit.ts` |

Client **must not** call `@pm-twin/matching` directly after cutover; matching runs server-side only.

---

## Persistence ownership

| Entity | PostgreSQL table owner | Migration from v1.0 |
|--------|------------------------|---------------------|
| users, companies | `server/prisma/schema` Identity context | Seed JSON → import script |
| opportunities | Opportunity context | `pmtwin_web_overrides.opportunities` + seed |
| applications | Application context | overrides + seed |
| post_matches | Matching context | overrides + seed |
| deals, negotiations, contracts | respective contexts | overrides + seed |
| notifications | Notification context | overrides + seed |
| audit_log | Governance context | append-only; no client write |

Repository `entityKey` registry in ADR-100 maps 1:1 to override buckets today and informs Prisma model naming — not client storage keys post-cutover.

---

## Events and audit ownership

| Type | Owner | v1.1 behavior |
|------|-------|---------------|
| Audit append | T2 only | Every command handler writes audit row in same transaction |
| Domain events (future) | T2 outbox | `server/src/infrastructure/events/` — catalog in [ADR-105](./ADR-105-domain-event-catalog.md); outbox Phase 1B |
| Workflow log | T3 debug | `VITE_WORKFLOW_LOG` remains client-only |
| Matching run audit | T2 | Persists run status, counts, errors |

Client audit display reads via API; no `auditRepository.append` in web after cutover.

---

## Tenancy and KSA compliance (ownership declaration)

| Concern | Phase | Owner | ADR |
|---------|-------|-------|-----|
| `tenantId` on entities | Phase 2+ | T2 platform context | [ADR-102](./ADR-102-multi-tenancy.md) |
| PDPL data residency & subject rights | Phase 2+ | T2 compliance + infra | [ADR-103](./ADR-103-pdpl-compliance.md) |
| VAT 15% on financial fields | Phase 2+ | T1 `@pm-twin/finance` + T2 persistence | [ADR-104](./ADR-104-vat-financial-fields.md) |
| Arabic RTL | Phase 1+ | T3 | web UI (no separate ADR) |
| Hijri dates | Phase 1+ | T3 display, T2 ISO storage | web locale (no separate ADR) |

ADR-101 declares ownership boundaries only; compliance implementation is out of Phase 1 scope.

---

## Migration rules (v1.0 → v1.1)

### Phase 1A — Dual write forbidden

During migration, **either** client **or** server is authoritative — never both writing lifecycle state.

### Phase 1B — Handler parity

Server handlers must pass the same test scenarios as frozen web handlers:

| Test source | Server requirement |
|-------------|-------------------|
| `opportunity-command-handler.test.ts` | Port or share; publish gate + RBAC |
| `publish-readiness-gate.test.ts` | Run against `@pm-twin/readiness` |
| `command-rbac.test.ts` | Server gateway identical outcomes |
| `publish-matching.test.ts` | Server matching integration test |

### Phase 1C — Client thin-cutover

1. Replace `getApplicationCommandGateway()` with `commandApi.execute()`.
2. Remove lifecycle writes from web repositories.
3. Keep read models; point at REST queries.
4. Delete deprecated `data-store.ts` callers.

---

## Import rules (v1.1)

| From → To | `packages/*` | `server/` | `web/` | `POC/` |
|-----------|:------------:|:---------:|:------:|:------:|
| **`packages/*`** | ✅ | ❌ I/O | ❌ | ❌ |
| **`server/`** | ✅ | ✅ | ❌ | ❌ (seed import scripts only) |
| **`web/`** | ✅ types/rules | ❌ | ✅ | ❌ |
| **`POC/src`** | ❌ | ❌ | ❌ | frozen |

Server **must not** import from `web/src`. Shared handler logic extracts to `packages/` if duplication would otherwise occur.

---

## Consequences

### Positive

- Single authoritative runtime for mutations eliminates DevTools bypass.
- Package extraction makes readiness and RBAC rules testable once, run everywhere.
- Command API maps cleanly from frozen ADR-100 gateway contract.
- Clear bounded contexts simplify team ownership and schema evolution.

### Negative / accepted cost

- Short-term duplication during migration (web handlers + server handlers) unless `@pm-twin/handlers` extracted early.
- Client offline/demo mode requires explicit feature flag — not default after cutover.
- Normalized shadow layer in web adds migration complexity until API returns canonical DTOs.

---

## Compliance

| Rule | Enforcement |
|------|-------------|
| ADR-100 freeze respected until server cutover | No removal of client guards before server parity tests pass |
| ADR-001 lifecycle vocabulary | Server handlers use `@pm-twin/lifecycle` only |
| ADR-002 command shapes | API accepts/produces ADR-002 DTOs only |
| Publish gate on server | `@pm-twin/readiness` in server `OpportunityCommandHandler` |
| No client matching writes | Lint/guard: web must not import `runMatchingForPost` after Phase 1C |
| POC freeze | Unchanged from ADR-100 |

---

## Backend Foundation phase mapping

| Phase | ADR-101 deliverable |
|-------|---------------------|
| **1A — Hardening** | Complete (ADR-100 checklist) |
| **1B — Persistence** | Prisma schema per bounded context; seed import |
| **1C — Command API** | `server/` gateway + handler parity tests |
| **1D — Auth & RBAC** | JWT + authoritative `evaluateCommandRbac` |
| **1E — Package extraction** | `@pm-twin/readiness`, `@pm-twin/rbac-policies` |
| **1F — Client cutover** | web API client; deprecate local command handlers |

---

## Related documents

| Document | Role |
|----------|------|
| [ADR-100-architecture-freeze-v1.md](./ADR-100-architecture-freeze-v1.md) | Frozen v1.0 client baseline |
| [ADR-102-multi-tenancy.md](./ADR-102-multi-tenancy.md) | Multi-tenancy (Phase 2+) |
| [ADR-103-pdpl-compliance.md](./ADR-103-pdpl-compliance.md) | PDPL compliance (Phase 2+) |
| [ADR-104-vat-financial-fields.md](./ADR-104-vat-financial-fields.md) | VAT 15% financial fields (Phase 2+) |
| [runtime-ownership.md](../runtime-ownership.md) | Current web ownership (until cutover) |
| [database-schema.md](../database-schema.md) | Entity shapes for Prisma design |
| [api-structure.md](../api-structure.md) | Endpoint map for API layer |
| [data-model.md](../data-model.md) | Aggregate relationships |

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial backend domain ownership — post ADR-100 freeze |
