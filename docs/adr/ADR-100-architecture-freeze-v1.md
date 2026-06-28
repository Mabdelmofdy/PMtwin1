# ADR-100: PM-Twin Architecture Freeze v1.0

| Field | Value |
|-------|-------|
| **Status** | Accepted — **Frozen** |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Supersedes** | Informal Phase 10.x ownership notes (now codified) |
| **Depends on** | ADR-001 (Lifecycle), ADR-002 (Commands) |
| **Authority chain** | Domain Blueprint → Command Architecture → Unified Lifecycle Engine → ADR-100 |

---

## Context

PM-Twin has completed two preparatory sprints before Backend Foundation:

1. **Matching Readiness Foundation** — profile/opportunity readiness, publish gate, matching quality analytics, optional score adjustment (disabled).
2. **Backend Readiness Hardening** — pipeline publish→matching parity, repository `entityKey` cleanup, publish RBAC at command gateway.

The codebase previously relied on dual runtimes (`POC/` + `web/`) with undocumented boundaries. Phase 10.3 established runtime ownership; this ADR **freezes** the resulting architecture as **v1.0** so Backend Foundation may proceed without structural drift.

---

## Decision

**Freeze PM-Twin client architecture at v1.0** with the following non-negotiable boundaries until Backend Foundation Phase 1 delivers server-authoritative persistence.

| Layer | Authority | Location |
|-------|-----------|----------|
| Active runtime | **Web SPA only** | `web/` |
| Lifecycle vocabulary | **ADR-001 registry** | `packages/lifecycle/` |
| Command contracts | **ADR-002 DTOs** | `packages/commands/` |
| Matching engine (pure) | **Package** | `packages/matching/` |
| Readiness domain (client) | **Web domain modules** | `web/src/domain/*-readiness/` |
| Seed source (physical) | **Immutable at runtime** | `POC/data/` via `@seed-data` |
| Legacy runtime | **Frozen** | `POC/src/` |

No new product behavior in `POC/src/`. No imports from `POC/src` into `web/`. No imports from `web/` into `POC/`.

---

## Frozen runtime topology

```
┌─────────────────────────────────────────────────────────────┐
│  web/ — ACTIVE RUNTIME (v1.0)                               │
│  UI → services → DefaultCommandGateway → handlers → repos   │
│  Persistence: localStorage (pmtwin_web_overrides)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ consumes
┌──────────────────────────▼──────────────────────────────────┐
│  packages/ — PURE SHARED LOGIC                                │
│  @pm-twin/lifecycle │ @pm-twin/commands │ @pm-twin/matching  │
└──────────────────────────┬──────────────────────────────────┘
                           │ seed JSON (build-time)
┌──────────────────────────▼──────────────────────────────────┐
│  POC/data/ — PHYSICAL SEED (@seed-data alias)                 │
│  POC/src/ — FROZEN REFERENCE (no new product logic)           │
└───────────────────────────────────────────────────────────────┘
```

**Detailed boundaries:** [docs/runtime-ownership.md](../runtime-ownership.md), [docs/architecture/runtime-boundaries.md](../architecture/runtime-boundaries.md).

---

## Frozen domain modules (Matching Readiness Foundation)

All modules live in `web/src/domain/` unless noted.

| Module | Path | Purpose |
|--------|------|---------|
| Profile readiness | `profile-readiness/` | Profile completeness evaluator |
| Opportunity readiness | `opportunity-readiness/` | Intent-aware opportunity evaluator |
| Publish readiness (gate) | `publish-readiness/` | Blocks publish unless both sides `ready_for_matching` |
| Readiness analytics | `readiness-analytics/` | Admin readiness aggregates |
| Matching quality | `matching-quality/` | Funnel analytics (acceptance, negotiation, deal rates) |
| Matching adjustment | `matching-readiness-adjustment/` | Tier score adjustment — **disabled** (`ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT = false`) |
| Readiness UI | `web/src/components/readiness/` | Cards, alerts, score display |

**Dependency direction (acyclic):**

```
profile-readiness ──┐
                    ├──► publish-readiness ──► command handler + UI
opportunity-readiness ─┘         │
                                 ▼
                          publish orchestration
                                 │
                                 ▼
                          matching-service ──► @pm-twin/matching
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          readiness-analytics      matching-quality
```

---

## Frozen publish flow (v1.0)

Publishing is **`TransitionOpportunityStatus`** with `targetStatus: 'published'` — there is no separate `PublishCommand`.

| Layer | Enforcement |
|-------|-------------|
| Readiness gate (SoT) | `evaluatePublishReadiness()` in `publish-readiness-gate.ts` |
| UI pre-check | `publishOpportunityUiAction()` |
| Command handler | `OpportunityCommandHandler` — readiness re-evaluated |
| RBAC gateway | Owner (`creatorId`) or admin required to publish |
| Matching | `executePublishOpportunityOrchestration()` after successful transition |

**Both entry points must trigger matching:**

| Entry | Path |
|-------|------|
| Publish button | `publishOpportunityUiAction()` → transition → `runPublishMatchingForOpportunity()` |
| Pipeline drag to published | `pipelineOpportunityDrop()` → same orchestration via `publishOpportunityUiAction()` |

Shared helpers:

- `resolvePublishReadinessContextForOpportunity()` — creator profile resolution
- `executePublishOpportunityOrchestration()` — transition + matching after gate passes

---

## Frozen command gateway contract

```
UI / service
  → DefaultCommandGateway.execute(command)
  → evaluateCommandRbac (when enforceCommandRbac !== false)
  → EntityCommandHandler.handle(command)
  → Repository → pmtwin_web_overrides
```

| Entity | Handler | Governed commands (RBAC) |
|--------|---------|--------------------------|
| Opportunity | `OpportunityCommandHandler` | `TransitionOpportunityStatus` → `published` requires owner/admin |
| PostMatch | `PostMatchCommandHandler` | Admin platform commands (`ConfirmPostMatch`, etc.) |
| Application, Deal, Negotiation, Contract | respective handlers | Participant-deferred or entity-specific |

Wiring: `web/src/commands/application-command-gateway.ts`.

**Lifecycle bypass guards** remain mandatory for non-command write paths (`lifecycle-status-guard.ts`, `dormant-bypass-guard.test.ts`).

---

## Frozen repository entity keys

| Repository | `entityKey` | Notes |
|------------|-------------|-------|
| `ApplicationRepository` | `applications` | |
| `OpportunityRepository` | `opportunities` | |
| `UserRepository` | `users` | Read-only seed |
| `CompanyRepository` | `companies` | Read-only seed |
| `AuditRepository` | `newAuditEntries` | Append-only |
| `PostMatchRepository` | `postMatches` | |
| `DealRepository` | `deals` | |
| `NegotiationRepository` | `negotiations` | |
| `ContractRepository` | `contracts` | |
| `NotificationRepository` | `notifications` | |

Registry: `web/src/repositories/repository-entity-keys.ts`  
Guard: `web/src/repositories/repository-entity-keys.test.ts`

---

## Frozen matching behavior

| Concern | Frozen state |
|---------|--------------|
| Engine | `@pm-twin/matching` — scoring, ranking, model routing unchanged |
| Publish matching | `runPublishMatchingForOpportunity()` — engine scores passed through unchanged |
| Score adjustment | **Off** — design-only; must not enable until explicit post-backend approval |
| Manual discover | `discoverNeedOfferMatch()` — adjustment wired but no-op while flag false |
| Context | `matching-engine-context.ts` — canonical from `@seed-data/skill-canonical.json` |

---

## Frozen import rules

| From | To | Allowed |
|------|-----|---------|
| `web/src` | `packages/*` | ✅ |
| `web/src` | `@seed-data` (JSON only) | ✅ — via seed-loader or matching-engine-context |
| `web/src` | `POC/src` | ❌ |
| `packages/*` | `web/`, `POC/`, I/O | ❌ |
| `POC/src` | new product logic | ❌ |
| `POC/data` | seed content edits | ✅ |

Automated guard: `web/src/infrastructure/seed/runtime-ownership.guard.test.ts`

---

## Frozen test baseline (web)

| Metric | Value | Method |
|--------|-------|--------|
| Test files | **53** | `web/src/**/*.test.ts` |
| Test cases | **526** | `^\s*it\(` per file |
| Full runner | **535 pass** | `npm test` in `web/` |

Module breakdown (primary path assignment):

| Module | Files | Cases |
|--------|:-----:|:-----:|
| Readiness domains | 5 | 56 |
| Publish gate | 5 | 42 |
| Matching quality | 1 | 9 |
| Matching adjustment | 2 | 19 |
| Command handlers | 7 | 123 |
| Services | 7 | 63 |
| Infrastructure | 4 | 40 |

---

## Explicitly NOT frozen (Backend Foundation scope)

The following are **out of v1.0 freeze** and expected to change in Backend Foundation:

| Area | Current v1.0 | Backend Foundation target |
|------|--------------|---------------------------|
| Persistence | `localStorage` | PostgreSQL + server API |
| Auth | Client Base64 session | JWT / OAuth |
| RBAC | Client gateway enforcement | Server-authoritative |
| Readiness modules | `web/src/domain/` | Extract to `packages/readiness` (optional) |
| Seed alias | `@seed-data` → `POC/data/` | `packages/seed-data/` or DB seed |
| Score adjustment flag | Hardcoded `false` | Env-driven, server-governed |
| E2E tests | None | Playwright smoke suite |

---

## Consequences

### Positive

- Single active runtime eliminates dual-implementation drift.
- Publish readiness + RBAC + matching orchestration are centralized and tested.
- Backend Foundation can map command gateway → REST API without redesigning client domain.
- POC remains regression harness and seed source without blocking web velocity.

### Negative / accepted debt

- All data bypassable via DevTools until backend exists.
- Readiness logic not yet in `packages/` — port cost during backend extraction.
- Admin routes client-guarded only.
- Direct `opportunityRepository.update({ status })` from new internal code remains a bypass vector — backend must close this.

---

## Compliance

| Rule | Enforcement |
|------|-------------|
| POC freeze | `.cursor/rules/pm-twin-runtime-ownership.mdc` |
| Architecture resolution | `.cursor/rules/pm-twin-architecture.mdc` |
| No `@poc-data` in web | `runtime-ownership.guard.test.ts` |
| Lifecycle vocabulary | ADR-001 manifest only |
| Command shapes | ADR-002 contracts only |
| Repository entity keys | `repository-entity-keys.test.ts` |
| Publish gate active | `publish-readiness-gate.test.ts`, handler tests |
| Pipeline publish parity | `pipeline-opportunity-drop.test.ts` |
| Publish RBAC | `command-rbac.test.ts`, `default-command-gateway.rbac.test.ts` |

---

## Approval gate for Backend Foundation

Backend Foundation Phase 1 may start when:

- [x] ADR-100 accepted (this document)
- [x] Pipeline publish → matching parity
- [x] Repository `entityKey` cleanup
- [x] `TransitionOpportunityStatus` publish RBAC
- [x] `npm test` green (535 pass)
- [x] `npm run type-check` green

---

## Related documents

| Document | Role |
|----------|------|
| [runtime-ownership.md](../runtime-ownership.md) | Operational ownership |
| [runtime-boundaries.md](../architecture/runtime-boundaries.md) | Import/matrix detail |
| [ADR-101-backend-domain-ownership.md](./ADR-101-backend-domain-ownership.md) | Backend domain ownership (Backend Foundation) |
| [ADR-102-multi-tenancy.md](./ADR-102-multi-tenancy.md) | Multi-tenancy (Phase 2+) |
| [ADR-103-pdpl-compliance.md](./ADR-103-pdpl-compliance.md) | PDPL compliance (Phase 2+) |
| [ADR-104-vat-financial-fields.md](./ADR-104-vat-financial-fields.md) | VAT 15% financial fields (Phase 2+) |
| [ADR-105-domain-event-catalog.md](./ADR-105-domain-event-catalog.md) | Domain event catalog (Phase 1B+) |
| ADR-001 (`packages/lifecycle/src/registry/manifest.json`) | Lifecycle source of truth |
| ADR-002 (`packages/commands/`) | Command contracts |
| `ARCHITECTURE-READINESS-ASSESSMENT.md` | Full audit (June 2026) |

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial architecture freeze — post Matching Readiness Foundation + Backend Readiness Hardening |
