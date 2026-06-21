# Domain Hardening Report

**Project:** PMTwin Web (Pre Sprint 2)  
**Date:** 2026-06-21  
**Scope:** Phases A–G — relationship integrity, vocabulary normalization, type hardening, model expansion, multi-tenant preparation, organization prep, duplicate cleanup  
**Build status:** `npm run build` — **PASS**

---

## Summary

Sprint 1 repository architecture is preserved. Domain types are expanded and normalized without UI, auth, or backend changes. The P0 deal referential integrity break is fixed. Seed data is the single source of truth for deals; runtime negotiation-to-deal bootstrap is removed.

---

## Phase A — Relationship Integrity (P0)

| Action | Detail |
|--------|--------|
| Created `POC/data/demo-deals.json` | 3 deals: `seed-deal-oneway-01`, `seed-deal-consortium-01`, `seed-deal-exchange-01` |
| Created `POC/data/demo-contracts.json` | 3 contracts linked to deals |
| Added missing post-match | `demo-pm-consortium-wind` in `demo-post-matches.json` (referenced by negotiation/deal/contract/audit) |
| Removed bootstrap | `loadDeals()` no longer derives deal IDs from negotiation IDs |
| Added validator | `web/src/infrastructure/validation/relationship-integrity.ts` |
| Added CLI script | `web/scripts/validate-relationships.mjs` |

**Verification:** All `Application.dealId` references resolve. See `RELATIONSHIP-INTEGRITY-REPORT.md`.

---

## Phase B — Domain Vocabulary Normalization (P1)

### B1 — Participant terminology

| Canonical | Legacy alias | Applied to |
|-----------|--------------|------------|
| `participants` | `parties` (deprecated) | Negotiation, Deal, Contract |

- `web/src/types/participant.ts` — `Participant` type + `normalizeParticipants()`
- `web/src/domain/normalizers.ts` — maps `parties` → `participants` at load time
- `NegotiationRepository.getByParty()` reads `participants ?? parties`

### B2 — Commercial terms

| Canonical | Legacy fields (deprecated) |
|-----------|----------------------------|
| `commercialTerms` | `terms`, `valueTerms`, `agreedTerms`, `initialTerms`, `application_value` |

- `web/src/types/commercial-terms.ts` — `CommercialTerms` + normalization helpers
- Normalizers populate `commercialTerms` from legacy shapes on seed load
- `DealService.createDealFromNegotiation()` writes `participants` + `commercialTerms`

---

## Phase C — Type Hardening (P1)

New file: `web/src/types/enums.ts`

| Enum | Values (includes legacy seed compat) |
|------|--------------------------------------|
| `OpportunityStatus` | draft, published, matched, negotiation, in_negotiation, contracted, execution, in_execution, completed, cancelled, closed |
| `ApplicationStatus` | submitted, pending, reviewing, shortlisted, accepted, rejected, withdrawn, negotiation, in_negotiation, contracted |
| `NegotiationStatus` | active, countered, counter_offered, agreed, expired, cancelled |
| `DealStatus` | draft, active, execution, completed, cancelled, negotiating, signing |
| `ContractStatus` | draft, pending_signature, pending, active, completed, terminated |
| `UserRole` | professional, company_owner, admin, moderator, auditor |
| `MatchType` | one_way, two_way, consortium, circular, replacement |
| `NotificationType` | Derived from seed (new_match_found, deal_created_from_application, etc.) |
| `AuditActorType` | user, system, admin, service |
| `EntityType` | opportunity, application, match, negotiation, deal, contract, user |

Entity status fields use `EnumType | string` union to avoid breaking screens that compare raw seed strings.

---

## Phase D — Expanded Domain Models (P1)

### Deal (`web/src/types/domain.ts`)

Added: `matchId`, `applicationId`, `opportunityIds[]`, `matchType`, `participants[]`, `commercialTerms`, `milestones[]`, `deliverables`, `contractId`, `completedAt`, `closedAt`. Legacy fields preserved.

### Contract

Added: `opportunityId`, `opportunityIds[]`, `matchId`, `applicationId`, `negotiationId`, `participants[]`, `commercialTerms`, `milestonesSnapshot`, `signedAt`, `version`. Legacy payment fields preserved.

### AuditEntry

Added: `entityType`, `entityId`, `details`, `actorType`, `requestId`, `ipAddress`. Legacy `timestamp` preserved.

---

## Phase E — Multi-Tenant Readiness

`TenantScoped` mixin added with optional `tenantId?` and `organizationId?` on:

- PlatformUser / Company / PendingUser
- Opportunity, Application, PostMatch, Negotiation, Deal, Contract, AppNotification, AuditEntry

No tenancy logic, filtering, or UI changes.

---

## Phase F — Organization Preparation

- `web/src/types/organization.ts` — `Organization` type (preparation only)
- `Company = PlatformUser` alias retained with `@deprecated` JSDoc pointing to Organization
- No data migration, no repository wiring

---

## Phase G — Duplicate Type Cleanup

| File | Change |
|------|--------|
| `web/src/lib/mock-user.ts` | Removed duplicate `AppNotification` / conflicting user types; marked as deprecated unused fixtures |
| `web/src/lib/auth-service.ts` | Already uses canonical `PlatformUser` from `@/types/domain.ts` — no change needed |
| `web/src/types/domain.ts` | Single canonical source for all entity types |
| `web/src/lib/applications.ts` | Re-exports `ApplicationValue` from `commercial-terms.ts` |

---

## Entities Updated

| Entity | Files touched |
|--------|---------------|
| Deal | `domain.ts`, `demo-deals.json`, `normalizers.ts`, `deal-service.ts`, `deal-repository.ts`, `seed-loader.ts` |
| Contract | `domain.ts`, `demo-contracts.json`, `normalizers.ts`, `contract-repository.ts`, `seed-loader.ts` |
| Application | `domain.ts`, `normalizers.ts`, `commercial-terms.ts` |
| Negotiation | `domain.ts`, `normalizers.ts`, `negotiation-repository.ts` |
| PostMatch | `domain.ts`, `demo-post-matches.json` |
| AuditEntry | `domain.ts` |
| AppNotification | `domain.ts`, `enums.ts` |
| PlatformUser / Company | `domain.ts`, `organization.ts` |
| All (tenant) | `TenantScoped` on domain entities |

---

## Validation Per Phase

| Check | Result |
|-------|--------|
| TypeScript (`tsc -b`) | PASS |
| Production build (`vite build`) | PASS |
| Relationship integrity script | PASS (0 errors, 0 warnings) |

---

## Remaining Technical Debt

1. **Runtime Zod validation** — enums are TypeScript-only; no schema validation at API/repository boundaries yet.
2. **Full enum migration in UI** — components still compare raw seed strings; union types allow this but Zod will need legacy value maps.
3. **Company ≠ Organization** — `Company` remains `PlatformUser`; Organization type is not wired.
4. **POC JSON vs TS drift** — seed JSON still contains legacy field names (`parties`, `valueTerms`); normalizers bridge at load time only.
5. **localStorage overrides** — user-created deals/contracts in `pmtwin_web_overrides` are not validated by the seed integrity script.
6. **Review entity** — `demo-reviews.json` references deals but is not in the web repository layer yet.
7. **Status state machines** — workflow services exist but transitions are not formally defined or guarded.
8. **RBAC** — `UserRole` enum exists; no permission matrix or enforcement layer.

---

## Files Created

```
web/src/types/enums.ts
web/src/types/commercial-terms.ts
web/src/types/participant.ts
web/src/types/organization.ts
web/src/domain/normalizers.ts
web/src/infrastructure/validation/relationship-integrity.ts
web/scripts/validate-relationships.mjs
POC/data/demo-deals.json (populated)
POC/data/demo-contracts.json (populated)
```

## Files Modified (key)

```
web/src/types/domain.ts
web/src/types/storage.ts
web/src/infrastructure/seed/seed-loader.ts
web/src/repositories/contract-repository.ts
web/src/repositories/negotiation-repository.ts
web/src/repositories/index.ts
web/src/services/deal-service.ts
web/src/lib/mock-user.ts
web/src/lib/applications.ts
POC/data/demo-post-matches.json
```
