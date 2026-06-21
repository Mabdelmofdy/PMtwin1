# Sprint 2 Readiness Report

**Project:** PMTwin Web  
**Date:** 2026-06-21  
**Context:** Post domain hardening (Phases A–G), pre Sprint 2 implementation  
**Constraint:** No Sprint 2 work started (no Zod, RBAC, workflow engine, backend, PostgreSQL)

---

## Overall Readiness: **62 / 100**

The domain model is materially more stable than at Sprint 1 close. P0 relationship integrity is fixed. Types, enums, and normalization layers provide a foundation. Sprint 2 can proceed with validation and RBAC as the first implementation tracks.

---

## Readiness by Track

### 1. Zod Validation — **68 / 100** 🟡 Ready with prep work

| Ready | Gap |
|-------|-----|
| Canonical types in `domain.ts` | No Zod schemas yet |
| Enums defined with legacy values documented | Need `z.enum()` + `.or(z.string())` or discriminated legacy maps |
| `CommercialTerms`, `Participant` extracted | Normalizers not mirrored as parse pipelines |
| Seed loader normalizes on read | Repositories accept `Partial<T>` without runtime checks |
| API layer isolates UI from storage | No request/response validation |

**Sprint 2 entry:** Generate Zod schemas from `domain.ts` + `enums.ts`. Apply at repository `create`/`update` and API module boundaries. Preserve legacy seed values via `.transform()` or preprocess step matching `normalizers.ts`.

---

### 2. RBAC Permissions — **42 / 100** 🟠 Foundation only

| Ready | Gap |
|-------|-----|
| `UserRole` enum (professional, company_owner, admin + legacy moderator, auditor) | No permission matrix |
| Auth service + session intact | No role-based route or action guards |
| `AuditActorType` for future audit enrichment | No `can(user, action, resource)` API |
| Tenant-scoped entity types | Roles not scoped to organization |

**Sprint 2 entry:** Define permission constants per entity action (CRUD + workflow transitions). Implement guard in API layer before repository calls. Do not redesign auth — extend with permission checks.

---

### 3. Workflow State Machine — **58 / 100** 🟡 Partially ready

| Ready | Gap |
|-------|-----|
| Status enums for Opportunity, Application, Negotiation, Deal, Contract | No formal transition tables |
| Workflow services exist (`deal-service`, `negotiation-service`, etc.) | Transitions are ad-hoc string assignments |
| Legacy status values preserved (`in_negotiation`, `pending`, etc.) | State machine must accept dual vocabulary during migration |
| Expanded Deal/Contract models support lifecycle fields (`signedAt`, `completedAt`, `closedAt`) | Milestone status not enum-hardened |

**Sprint 2 entry:** Define transition maps per entity. Implement guard functions co-located with services. Map legacy → canonical status on read (reuse normalizer pattern).

---

### 4. Backend Migration — **72 / 100** 🟢 Strong foundation

| Ready | Gap |
|-------|-----|
| Repository pattern (10 entities) | Still localStorage + JSON |
| API abstraction layer (`web/src/api/`) | No HTTP/OpenAPI contract |
| Seed loader decoupled from UI | POC JSON path aliases via Vite |
| Deal bootstrap removed — explicit seed ownership | No migration scripts for PostgreSQL |
| Relationship integrity tooling | No integration tests against API |
| Deprecated `data-store.ts` facade | Some UI may still import facade |

**Sprint 2 entry:** Define repository interfaces as ports; implement HTTP adapter behind same API surface. Seed data becomes fixture for contract tests.

---

### 5. Multi-Tenant SaaS — **48 / 100** 🟠 Model prep only

| Ready | Gap |
|-------|-----|
| `tenantId?`, `organizationId?` on all major entities | No tenant isolation logic |
| `Organization` type defined | Not in repositories or seed data |
| `Company = PlatformUser` documented as legacy | No org ↔ user membership model |
| TenantScoped mixin reusable | Billing, subscription, org admin not modeled |

**Sprint 2 entry:** Add Organization repository (read-only seed first). Plan Company → Organization mapping migration. Thread `tenantId` through API context without enforcing isolation until backend exists.

---

## Readiness Scorecard

| Track | Score | Status | Blocker level |
|-------|-------|--------|---------------|
| Zod Validation | 68 | 🟡 | Low — can start immediately |
| RBAC | 42 | 🟠 | Medium — needs permission design |
| Workflow Engine | 58 | 🟡 | Medium — needs transition spec |
| Backend Migration | 72 | 🟢 | Low — architecture ready |
| Multi-Tenant SaaS | 48 | 🟠 | High — org model not wired |
| **Weighted average** | **62** | 🟡 | Domain stable enough to proceed |

---

## Recommended Sprint 2 Sequence

1. **Zod schemas + repository validation** — lowest risk, highest leverage for backend parity
2. **Workflow transition guards** — build on existing services; use enum maps from `enums.ts`
3. **RBAC permission matrix + API guards** — after transitions are defined (permissions often mirror transitions)
4. **Organization repository (read-only)** — prepare tenant context without breaking Company
5. **Backend adapter** — implement HTTP repository behind existing API modules

---

## Pre-Sprint 2 Checklist (Completed)

- [x] Fix P0 deal referential integrity
- [x] Remove runtime deal bootstrap from negotiations
- [x] Standardize `participants` + `commercialTerms` with legacy aliases
- [x] Add status enums with backward compatibility
- [x] Expand Deal, Contract, AuditEntry models
- [x] Add tenant-ready optional fields
- [x] Introduce Organization type (prep)
- [x] Clean duplicate types in `mock-user.ts`
- [x] TypeScript build passes
- [x] Relationship integrity validation passes
- [x] Generate hardening reports

---

## Explicit Non-Goals (Honored)

- No PostgreSQL, Fastify, or NestJS added
- No authentication redesign
- No UI behavior or visual changes
- No tenancy enforcement
- No Sprint 2 feature implementation started

---

## Sign-Off

Domain hardening Phases A–G are complete. The codebase is **ready to begin Sprint 2** with Zod validation and workflow/RBAC design as the first work items. Multi-tenant SaaS remains preparation-only until Organization is wired and backend tenancy exists.
