# PMTwin Repository Pattern Migration Report

**Date:** 2026-06-21  
**Scope:** Sprint 1 — frontend repository pattern refactor (no backend, no PostgreSQL, no auth redesign)

## Summary

The PMTwin web app was migrated from a monolithic `dataStore` pattern to a layered architecture:

```
UI → API layer → Services (workflows) / Repositories (CRUD) → StorageAdapter → localStorage + seed JSON
```

Backward compatibility is preserved via a deprecated `dataStore` facade and the same `pmtwin_web_overrides` localStorage key.

---

## Files Created

### Types & Infrastructure (Phase 1)
| File | Purpose |
|------|---------|
| `web/src/types/domain.ts` | Canonical domain types (Deal, Negotiation, PostMatch, etc.) |
| `web/src/types/storage.ts` | `IStorageAdapter`, `Overrides`, `OVERRIDES_KEY` |
| `web/src/infrastructure/storage/storage-adapter.ts` | Re-exports `IStorageAdapter` |
| `web/src/infrastructure/storage/local-storage-adapter.ts` | Single localStorage access point |
| `web/src/infrastructure/storage/session-storage-adapter.ts` | Single sessionStorage access point |
| `web/src/infrastructure/seed/seed-loader.ts` | JSON seed imports and typed loaders |

### Repositories (Phase 2) — 11 files
| Repository | Entity |
|------------|--------|
| `base-repository.ts` | Shared override-merge + `notifyDataStore()` |
| `user-repository.ts` | PlatformUser (read-only seed) |
| `company-repository.ts` | Company (read-only seed) |
| `opportunity-repository.ts` | Opportunity (CRUD overrides) |
| `application-repository.ts` | Application (CRUD overrides) |
| `deal-repository.ts` | Deal (dedicated persistence) |
| `post-match-repository.ts` | PostMatch (first-class) |
| `negotiation-repository.ts` | Negotiation (first-class) |
| `contract-repository.ts` | Contract (placeholder) |
| `notification-repository.ts` | AppNotification (full CRUD) |
| `audit-repository.ts` | AuditEntry (read-only seed) |
| `index.ts` | Singleton instances barrel |

### Services (Phase 3) — 6 files
| Service | Responsibility |
|---------|----------------|
| `matching-service.ts` | Match queries, application value formatting/sorting |
| `deal-service.ts` | Deal lifecycle, pipeline opportunity bucketing |
| `negotiation-service.ts` | Application workflow, eligibility, pipeline app bucketing |
| `contract-service.ts` | Contract queries (placeholder) |
| `notification-service.ts` | Notification CRUD orchestration |
| `index.ts` | Barrel exports |

### API Layer (Phase 4) — 9 files
| Module | Routes to |
|--------|-----------|
| `api/opportunities.ts` | OpportunityRepository |
| `api/deals.ts` | DealService |
| `api/negotiations.ts` | NegotiationRepository |
| `api/matches.ts` | PostMatchRepository + MatchingService |
| `api/notifications.ts` | NotificationService |
| `api/contracts.ts` | ContractService |
| `api/people.ts` | UserRepository + CompanyRepository |
| `api/admin.ts` | Audit, pending users, site content |
| `api/index.ts` | Barrel |

---

## Files Modified

| File | Change |
|------|--------|
| `web/src/lib/data-store.ts` | Gutted to deprecated facade delegating to repositories/services |
| `web/src/lib/applications.ts` | Slimmed to display constants only; types re-exported from `domain.ts` |
| `web/src/lib/auth-service.ts` | Uses `LocalStorageAdapter` + `SessionStorageAdapter`; user lookup via `peopleApi` |
| `web/src/providers/theme-provider.tsx` | Uses `LocalStorageAdapter` for theme key |
| `web/src/providers/auth-provider.tsx` | Type import moved to `types/domain.ts` |
| `web/tsconfig.app.json` | `ignoreDeprecations` updated to `"6.0"` for TS 6 build |
| `web/src/components/opportunity/apply-wizard.tsx` | `negotiationService.submitApplication()` |
| `web/src/components/opportunity/applications-panel.tsx` | `negotiationService` workflow methods |
| `web/src/components/pipeline/pipeline-board.tsx` | API + services for pipeline data/mutations |
| `web/src/components/layout/notification-center.tsx` | `notificationsApi` + `useDataStoreVersion()` reactivity |
| `web/src/pages/dashboard-page.tsx` | API layer for opportunities, matches, notifications |
| `web/src/pages/workspace/opportunity-detail-page.tsx` | API + services |
| `web/src/pages/workspace/opportunities-pages.tsx` | `opportunitiesApi` |
| `web/src/pages/workspace/deals-pages.tsx` | `dealsApi` (DealRepository, not derived negotiations) |
| `web/src/pages/workspace/pipeline-pages.tsx` | `matchesApi`, `negotiationsApi` |
| `web/src/pages/workspace/people-pages.tsx` | `peopleApi`, `notificationsApi` |
| `web/src/pages/admin/admin-pages.tsx` | Admin API modules |

---

## Direct localStorage Usages Removed

| Before (file) | Key | After |
|---------------|-----|-------|
| `lib/data-store.ts` | `pmtwin_web_overrides` | `BaseRepository` → `LocalStorageAdapter` |
| `lib/auth-service.ts` | `pmtwin_web_session` | `LocalStorageAdapter` + `SessionStorageAdapter` |
| `providers/theme-provider.tsx` | `pm-twin-theme` | `LocalStorageAdapter` |

**Total direct usages removed:** 3 files, 7 call sites  
**Remaining direct access:** 0 outside `infrastructure/storage/*`

---

## Repositories Created

10 entity repositories + 1 base class:

1. UserRepository  
2. CompanyRepository  
3. OpportunityRepository  
4. ApplicationRepository  
5. DealRepository *(dedicated, not derived from Negotiations at runtime)*  
6. PostMatchRepository *(first-class)*  
7. NegotiationRepository *(first-class)*  
8. ContractRepository  
9. NotificationRepository *(create, update, delete, markRead, markAllRead)*  
10. AuditRepository  

---

## Services Created

5 services:

1. **MatchingService** — match queries, application value helpers  
2. **DealService** — deal CRUD via repository; `createDealFromNegotiation()` is the only deal creation path  
3. **NegotiationService** — application workflow, eligibility, pipeline bucketing  
4. **ContractService** — placeholder contract queries  
5. **NotificationService** — notification CRUD orchestration  

---

## API Modules Created

8 domain API modules + barrel (`web/src/api/`)

---

## Architecture Decisions

- **Deal entities** are bootstrapped once from seed negotiations when `demo-deals.json` is empty (module load time). After creation, deals persist independently via `DealRepository` and are never regenerated from negotiations.
- **Deal creation at runtime** only through `DealService.createDealFromNegotiation()`.
- **`notifyDataStore()`** preserved; repositories call it on every override write.
- **`dataStore` facade** retained with `@deprecated` JSDoc for backward compatibility.
- **Same localStorage key** (`pmtwin_web_overrides`) — existing user data preserved.
- **Services for workflows**, **API layer for CRUD/data access** from UI components.

---

## Remaining Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| `dataStore` facade still imported nowhere from UI (all migrated) | Low | Facade can be removed in Sprint 2 |
| Most pages lack `useDataStoreVersion()` subscription | Medium | Only pipeline, opportunity-detail, notification-center re-render on mutations |
| `ContractRepository.create/update` are placeholders | Low | No contract seed data yet |
| `ContractRepository` uses wrong `entityKey` in base constructor | Low | No persistence until implemented |
| `PostMatchRepository` entityKey unused (read-only) | Low | Cosmetic |
| `demo-deals.json` empty — deals bootstrapped from negotiations at seed load | Info | By design for Sprint 1 backward compat |
| No backend API / PostgreSQL | Planned | Sprint 2+ |
| Auth still client-side mock | Planned | No auth redesign in Sprint 1 |
| `web/src/lib/mock-user.ts` unused | Low | Can delete |
| Dashboard/admin pages read once on mount | Medium | Add `useDataStoreVersion()` if live updates needed |

---

## Verification

- [x] `npm run build` passes (TypeScript + Vite)
- [x] No UI JSX changes (import swaps only)
- [x] All existing screens preserved
- [x] localStorage keys unchanged
- [x] No backend code introduced
- [x] No PostgreSQL code introduced
- [x] No authentication redesign

---

## Commit History (this migration)

1. Phase 1: Foundation — types, storage adapters, seed loader  
2. Phase 2: Repository Layer — 10 entity repositories  
3. Phase 3: Service Layer — 5 services  
4. Phase 4: API abstraction layer  
5. Phase 5: data-store.ts deprecated facade  
6. Phase 6: Component integration + providers  
7. Phase 7: Cleanup + this report  
