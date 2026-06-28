# ADR-105: Domain Event Catalog

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Depends on** | ADR-100, ADR-001 (Lifecycle), ADR-002 (Commands), ADR-101 (Backend Domain Ownership) |
| **Phase** | Backend Foundation **Phase 1B+** (catalog defined now; outbox Phase 1B) |
| **Supersedes** | Ad-hoc audit `action` strings; POC `event-bus.js` string literals (non-authoritative) |

---

## Context

PM-Twin v1.0 records side effects through **audit append** in web command handlers (`auditRepository.append`). Audit actions use dot-separated strings (`post_match.discovered`, `deal.status_changed`) but there is:

- No central registry or schema versioning
- No distinction between compliance audit and integration domain events
- No persistent event bus (POC `event-bus.js` is in-memory browser-only — frozen, not authoritative)
- No cross-service propagation path for notifications, analytics, or webhooks

ADR-101 assigns **domain events (future)** to T2 outbox at `server/src/infrastructure/events/`. Before implementation, the platform needs a **canonical event catalog** aligned with ADR-002 commands and ADR-001 lifecycle entities so server handlers, notification workers, and analytics pipelines share one vocabulary.

This ADR defines that catalog, the event envelope, naming rules, and migration from v1.0 audit actions.

---

## Decision

Establish a **versioned Domain Event Catalog** as the single naming authority for all state-change notifications emitted after successful command execution.

| Concern | Owner | Location |
|---------|-------|----------|
| Event type registry & schemas | T1 | `packages/events/` (new — zero I/O) |
| Event emission | T2 | Command handlers → outbox in same DB transaction |
| Audit compliance log | T2 | `server/src/audit/` — may subscribe to events or co-write |
| Event consumption | T2 workers | notification, analytics, webhook dispatch |
| Client debug log | T3 | `VITE_WORKFLOW_LOG` only — not catalog authority |

**Rule:** Every successful lifecycle command emits **at least one** catalog event. Failed commands emit **no** domain event (audit may still record failure if required by compliance ADR).

---

## Domain event vs audit entry

| Aspect | Domain event | Audit entry |
|--------|--------------|-------------|
| Purpose | Integration, notifications, analytics, downstream workflows | Compliance, forensics, admin display |
| Mutability | Immutable once published | Append-only |
| Audience | Internal services, future webhooks | Admins, regulators, PDPL DSAR ([ADR-103](./ADR-103-pdpl-compliance.md)) |
| v1.0 | Subset via audit `action` field | `AuditEntry` in seed + overrides |
| v1.1+ | Outbox → message bus | Dedicated `audit_log` table |

In Phase 1B, each catalog event type maps to an audit action where one already exists (see §Migration). New integrations **must** subscribe to domain events, not parse audit rows ad hoc.

---

## Event envelope (canonical shape)

All catalog events use this envelope. Payload schemas are per `eventType`.

```typescript
type DomainEventEnvelope<TPayload = Record<string, unknown>> = {
  readonly eventId: string           // UUID v7 or ULID — globally unique
  readonly eventType: string         // catalog key, e.g. "post_match.discovered"
  readonly schemaVersion: number     // payload schema version for this eventType
  readonly aggregateType: EntityType // ADR-001 entity key: opportunity | match | deal | ...
  readonly aggregateId: string
  readonly occurredAt: string        // ISO 8601 UTC
  readonly correlationId: string     // clientRequestId from command
  readonly causationId?: string      // parent eventId when orchestrated
  readonly tenantId?: string         // required post ADR-102 cutover
  readonly actorId?: string
  readonly actorType?: 'user' | 'admin' | 'system' | 'service'
  readonly payload: TPayload
}
```

**Storage:** T2 `domain_events` outbox table (Phase 1B) → BullMQ/Redis or PostgreSQL `LISTEN/NOTIFY` → consumers. Not client-accessible.

---

## Naming convention

| Rule | Example |
|------|---------|
| Format | `{aggregate_snake}.{past_tense_verb}` or `{aggregate_snake}.{past_tense_verb}_{qualifier}` |
| Aggregate | Matches lifecycle entity: `opportunity`, `application`, `post_match`, `negotiation`, `deal`, `contract` |
| Lifecycle orchestration | Prefix `lifecycle.` for cross-aggregate sync (not aggregate roots) |
| Matching batch jobs | Prefix `matching_run.` |
| Identity (future) | Prefix `identity.` |
| Platform (future) | Prefix `platform.` |
| Versioning | Breaking payload change → increment `schemaVersion`; never rename published `eventType` |

Legacy POC/browser event strings are **not** catalog entries.

---

## Catalog — Opportunity context

| eventType | schemaVersion | Trigger (command / rule) | Status | Primary consumers |
|-----------|:-------------:|--------------------------|--------|-------------------|
| `opportunity.status_changed` | 1 | `TransitionOpportunityStatus` | **Implemented (audit)** | Audit, analytics, pipeline |
| `opportunity.published` | 1 | `TransitionOpportunityStatus` → `published` | Planned | Matching orchestrator, notifications |
| `opportunity.publish_blocked` | 1 | Publish gate failure (readiness/RBAC) | Planned | Analytics, admin alerts |
| `opportunity.matched` | 1 | First PostMatch linked to opportunity | Planned | Pipeline UI sync |
| `opportunity.negotiating` | 1 | Linked negotiation becomes active | Planned | Pipeline |
| `opportunity.contracted` | 1 | Contract created from linked deal | Planned | Pipeline |
| `opportunity.completed` | 1 | Lifecycle orchestrator sync from deal | Planned | Analytics, notifications |

### Payload — `opportunity.status_changed` (v1)

```typescript
{
  readonly fromStatus: string
  readonly toStatus: string
  readonly reason?: string
}
```

---

## Catalog — Application context

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `application.submitted` | 1 | `SubmitApplication` | **Implemented (audit)** | Notifications, audit |
| `application.status_changed` | 1 | `AcceptApplication`, `RejectApplication`, `TransitionApplicationStatus` | **Implemented (audit)** | Pipeline, audit |
| `application.accepted` | 1 | `AcceptApplication` | Planned | Deal/negotiation eligibility |
| `application.rejected` | 1 | `RejectApplication` | Planned | Notifications |
| `application.withdrawn` | 1 | `TransitionApplicationStatus` → withdrawn | Planned | Notifications |

---

## Catalog — Matching context (PostMatch)

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `post_match.discovered` | 1 | `DiscoverPostMatch` (all topologies) | **Implemented (audit)** | Notifications, matching analytics |
| `post_match.accepted` | 1 | `AcceptPostMatch` (participant accept, pre-confirm) | **Implemented (audit)** | Notifications |
| `post_match.confirmed` | 1 | `AcceptPostMatch` (quorum → confirmed) or `ConfirmPostMatch` | **Implemented (audit)** | Negotiation eligibility, notifications |
| `post_match.declined` | 1 | `DeclinePostMatch` | Planned | Notifications, funnel analytics |
| `post_match.expired` | 1 | `ExpirePostMatch` | Planned | Notifications |
| `post_match.superseded` | 1 | `SupersedePostMatch` | Planned | Consortium replacement flows |
| `post_match.status_changed` | 1 | `TransitionPostMatchStatus`, decline/expire/supersede paths | **Implemented (audit)** | Audit, analytics |

### Payload — `post_match.discovered` (v1)

```typescript
{
  readonly matchType: 'one_way' | 'two_way' | 'consortium' | 'circular'
  readonly matchScore: number
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
  readonly participantIds: readonly string[]
  readonly strongKey?: string
}
```

---

## Catalog — Negotiation context

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `negotiation.started_from_post_match` | 1 | `StartNegotiationFromPostMatch` | **Implemented (audit)** | Notifications, deal eligibility |
| `negotiation.agreed` | 1 | `AgreeNegotiation` | **Implemented (audit)** | Deal creation, notifications |
| `negotiation.cancelled` | 1 | `CancelNegotiation` | **Implemented (audit)** | Notifications |
| `negotiation.status_changed` | 1 | `TransitionNegotiationStatus` | **Implemented (audit)** | Audit |
| `negotiation.countered` | 1 | Counter-offer round added (future command) | Planned | Notifications |

---

## Catalog — Deal context

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `deal.created_from_post_match` | 1 | `CreateDealFromPostMatch` | **Implemented (audit)** | Notifications, contract eligibility |
| `deal.created_from_negotiation` | 1 | `CreateDealFromNegotiation` | **Implemented (audit)** | Notifications |
| `deal.status_changed` | 1 | `TransitionDealStatus` | **Implemented (audit)** | Lifecycle orchestrator, audit |
| `deal.milestone_submitted` | 1 | Milestone submit (future command) | Planned | Notifications, admin |
| `deal.milestone_approved` | 1 | Milestone approve (future command) | Planned | Notifications |
| `deal.completed` | 1 | `TransitionDealStatus` → completed | Planned | Opportunity sync, analytics |

---

## Catalog — Contract context

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `contract.created_from_deal` | 1 | `CreateContractFromDeal` | **Implemented (audit)** | Notifications, legal snapshot |
| `contract.signed` | 1 | `SignContract` | **Implemented (audit)** | Notifications, deal sync |
| `contract.activated` | 1 | `ActivateContract` | **Implemented (audit)** | Execution workspace |
| `contract.completed` | 1 | `CompleteContract` | **Implemented (audit)** | Lifecycle orchestrator |
| `contract.terminated` | 1 | `TerminateContract` | **Implemented (audit)** | Notifications, audit |

Financial amounts in contract event payloads **must** use `MonetaryAmount` per [ADR-104](./ADR-104-vat-financial-fields.md) from Phase 2+.

---

## Catalog — Lifecycle orchestration (cross-aggregate)

Emitted by `lifecycle-orchestrator` (T2) after contract/deal transitions — not direct user commands.

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `lifecycle.deal_synced` | 1 | Contract handler orchestration success | **Implemented (audit)** | Audit, debug |
| `lifecycle.deal_sync_failed` | 1 | Deal sync error | **Implemented (audit)** | Admin alerts |
| `lifecycle.opportunity_synced` | 1 | Opportunity status sync success | **Implemented (audit)** | Pipeline |
| `lifecycle.opportunity_sync_failed` | 1 | Opportunity sync error | **Implemented (audit)** | Admin alerts |

---

## Catalog — Matching runs (batch)

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `matching_run.circular` | 1 | Circular matching batch complete | **Implemented (audit)** | Admin matching oversight |
| `matching_run.publish` | 1 | Publish-triggered matching for one opportunity | Planned | Analytics |
| `matching_run.completed` | 1 | Generic run completion wrapper | Planned | Analytics |

Payload follows `MatchingRunAuditDetails` (`web/src/domain/matching-run-audit/types.ts`) until extracted to `packages/events/schemas/`.

---

## Catalog — Identity context (Phase 2+)

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `identity.user_registered` | 1 | Registration API | Planned | Vetting queue, PDPL consent |
| `identity.user_approved` | 1 | Admin vetting approve | Planned | Notifications, login unlock |
| `identity.user_rejected` | 1 | Admin vetting reject | Planned | Notifications |
| `identity.user_suspended` | 1 | Admin suspend | Planned | Session revoke worker |
| `identity.session_created` | 1 | Login success | Planned | Security analytics |
| `identity.session_revoked` | 1 | Logout / suspend | Planned | Token blacklist |

PDPL export/erasure completion events → see [ADR-103](./ADR-103-pdpl-compliance.md).

---

## Catalog — Notification context

Notifications are **consumers**, not producers, of domain events. Optional feedback events:

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `notification.delivered` | 1 | Delivery worker success | Planned | Analytics |
| `notification.failed` | 1 | Delivery worker failure | Planned | Retry / DLQ |

---

## Catalog — Platform context (Phase 2+)

| eventType | schemaVersion | Trigger | Status | Primary consumers |
|-----------|:-------------:|---------|--------|-------------------|
| `platform.tenant_provisioned` | 1 | Tenant create | Planned | Billing stub |
| `platform.subscription_created` | 1 | Billing integration | Planned | Feature flags |

Tenant-scoped events include `tenantId` per [ADR-102](./ADR-102-multi-tenancy.md).

---

## Command → event mapping (Phase 1 minimum)

Every ADR-002 command that mutates state must emit the events below on **success**:

| Command | Required event(s) |
|---------|-------------------|
| `TransitionOpportunityStatus` | `opportunity.status_changed`; add `opportunity.published` when target is `published` |
| `SubmitApplication` | `application.submitted` |
| `AcceptApplication` | `application.status_changed` + `application.accepted` |
| `RejectApplication` | `application.status_changed` + `application.rejected` |
| `TransitionApplicationStatus` | `application.status_changed` |
| `DiscoverPostMatch` | `post_match.discovered` |
| `AcceptPostMatch` | `post_match.accepted` and/or `post_match.confirmed` |
| `DeclinePostMatch` | `post_match.declined` or `post_match.status_changed` |
| `ConfirmPostMatch` | `post_match.confirmed` |
| `ExpirePostMatch` | `post_match.expired` or `post_match.status_changed` |
| `SupersedePostMatch` | `post_match.superseded` or `post_match.status_changed` |
| `TransitionPostMatchStatus` | `post_match.status_changed` |
| `StartNegotiationFromPostMatch` | `negotiation.started_from_post_match` |
| `AgreeNegotiation` | `negotiation.agreed` |
| `CancelNegotiation` | `negotiation.cancelled` |
| `TransitionNegotiationStatus` | `negotiation.status_changed` |
| `CreateDealFromPostMatch` | `deal.created_from_post_match` |
| `CreateDealFromNegotiation` | `deal.created_from_negotiation` |
| `TransitionDealStatus` | `deal.status_changed` |
| `CreateContractFromDeal` | `contract.created_from_deal` |
| `SignContract` | `contract.signed` |
| `ActivateContract` | `contract.activated` |
| `CompleteContract` | `contract.completed` |
| `TerminateContract` | `contract.terminated` |

Orchestration side effects emit additional `lifecycle.*` events in the same transaction when sync runs.

---

## Implementation phases

### Phase 1A — Catalog + audit alignment (current → server Phase 1A)

- Accept this ADR as naming authority
- Web handlers continue audit append only
- Server handlers write audit rows using **identical** `eventType` strings from catalog
- Add `packages/events/src/catalog.ts` — const registry + TypeScript payload types

### Phase 1B — Outbox + consumers

- `server/src/infrastructure/events/outbox.ts` — insert envelope in command transaction
- Worker: notification projection from `post_match.*`, `deal.*`, `contract.*`
- Worker: analytics projection (matching funnel)
- Idempotent consumers keyed by `eventId`

### Phase 2 — Tenancy + compliance events

- Mandatory `tenantId` on envelope ([ADR-102](./ADR-102-multi-tenancy.md))
- `identity.*` and PDPL events ([ADR-103](./ADR-103-pdpl-compliance.md))
- VAT-bearing payloads on financial events ([ADR-104](./ADR-104-vat-financial-fields.md))

### Phase 3 — External integration

- Webhook subscriptions per tenant (filtered by eventType)
- Event replay API (admin-only, tenant-scoped)
- Dead letter queue + alerting

---

## Package structure (`packages/events/`)

```
packages/events/
├── src/
│   ├── catalog.ts          # eventType constants + metadata
│   ├── envelope.ts         # DomainEventEnvelope type
│   ├── schemas/            # per-event payload types (v1, v2, ...)
│   │   ├── post-match.ts
│   │   ├── opportunity.ts
│   │   └── ...
│   └── index.ts
├── package.json            # zero dependencies
└── catalog.test.ts         # every eventType has schemaVersion + aggregateType
```

**Guard (future):** server handlers must import `eventType` from `@pm-twin/events` — no string literals in application code.

---

## v1.0 migration (web audit → catalog)

| v1.0 audit `action` | Catalog `eventType` | Notes |
|---------------------|---------------------|-------|
| `opportunity.status_changed` | `opportunity.status_changed` | 1:1 |
| `application.submitted` | `application.submitted` | 1:1 |
| `application.status_changed` | `application.status_changed` | 1:1 |
| `post_match.discovered` | `post_match.discovered` | 1:1 |
| `post_match.accepted` | `post_match.accepted` | 1:1 |
| `post_match.confirmed` | `post_match.confirmed` | 1:1 |
| `post_match.status_changed` | `post_match.status_changed` | 1:1 |
| `negotiation.started_from_post_match` | `negotiation.started_from_post_match` | 1:1 |
| `negotiation.agreed` | `negotiation.agreed` | 1:1 |
| `negotiation.cancelled` | `negotiation.cancelled` | 1:1 |
| `negotiation.status_changed` | `negotiation.status_changed` | 1:1 |
| `deal.created_from_post_match` | `deal.created_from_post_match` | 1:1 |
| `deal.created_from_negotiation` | `deal.created_from_negotiation` | 1:1 |
| `deal.status_changed` | `deal.status_changed` | 1:1 |
| `contract.created_from_deal` | `contract.created_from_deal` | 1:1 |
| `contract.signed` | `contract.signed` | 1:1 |
| `contract.activated` | `contract.activated` | 1:1 |
| `contract.completed` | `contract.completed` | 1:1 |
| `contract.terminated` | `contract.terminated` | 1:1 |
| `lifecycle.deal_synced` | `lifecycle.deal_synced` | 1:1 |
| `lifecycle.deal_sync_failed` | `lifecycle.deal_sync_failed` | 1:1 |
| `lifecycle.opportunity_synced` | `lifecycle.opportunity_synced` | 1:1 |
| `lifecycle.opportunity_sync_failed` | `lifecycle.opportunity_sync_failed` | 1:1 |
| `matching_run.circular` | `matching_run.circular` | 1:1 |

No rename required for implemented events — catalog codifies existing strings.

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Command (ADR-002) — HTTP POST /api/v1/commands             │
└────────────────────────────┬────────────────────────────────┘
                             │ success
┌────────────────────────────▼────────────────────────────────┐
│  T2 Command Handler                                         │
│  1. Persist aggregate (PostgreSQL)                            │
│  2. Insert DomainEventEnvelope → outbox (same transaction)  │
│  3. Insert audit_log row (optional co-write or async proj.)   │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Notification    │ │ Analytics       │ │ Webhook worker  │
│ projector       │ │ collector       │ │ (Phase 3)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

v1.0 web (pre-cutover): handlers → `auditRepository.append` only — catalog documents target state.

---

## Consequences

### Positive

- One vocabulary for audit, notifications, analytics, and webhooks
- Command → event traceability simplifies Backend Foundation handler ports
- Schema versioning enables non-breaking consumer evolution
- Aligns with ADR-101 T2 event ownership without premature infrastructure

### Negative / accepted cost

- `packages/events/` not yet implemented — catalog lives in this ADR until extracted
- Some granular events (`post_match.declined`) planned but not yet distinct from `status_changed`
- Dual emission (audit + outbox) during Phase 1B until audit projection consumes events

---

## Compliance

| ADR | Relationship |
|-----|--------------|
| [ADR-100](./ADR-100-architecture-freeze-v1.md) | Frozen command gateway is event source in v1.0 web |
| [ADR-101](./ADR-101-backend-domain-ownership.md) | T2 owns emission; T3 read-only |
| [ADR-102](./ADR-102-multi-tenancy.md) | `tenantId` on envelope Phase 2+ |
| [ADR-103](./ADR-103-pdpl-compliance.md) | Audit + identity events in DSAR export |
| [ADR-104](./ADR-104-vat-financial-fields.md) | Financial payload shapes on deal/contract events |

---

## Related documents

| Document | Role |
|----------|------|
| [ADR-002](../../packages/commands/) | Command contracts — event triggers |
| [ADR-001](../../packages/lifecycle/src/registry/manifest.json) | Aggregate types and status vocabulary |
| [runtime-ownership.md](../runtime-ownership.md) | v1.0 web write paths |
| `web/src/commands/handlers/*.ts` | Current audit action implementations |
| `AUDIT_REPORT.md` §15 | Historical gap analysis (superseded by this catalog) |

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial domain event catalog — 24 implemented audit-aligned + planned entries |
