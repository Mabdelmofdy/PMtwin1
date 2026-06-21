# Relationship Integrity Report

**Project:** PMTwin Web (Pre Sprint 2)  
**Date:** 2026-06-21  
**Validator:** `web/scripts/validate-relationships.mjs`  
**Result:** **VALID** (0 errors, 0 warnings)

---

## Executive Summary

The P0 broken deal relationship is resolved. Every cross-entity reference to deals, contracts, negotiations, and post-matches in seed data now resolves correctly.

---

## Broken References Found (Pre-Fix)

| Entity | Field | Value | Problem |
|--------|-------|-------|---------|
| Application | `dealId` | `seed-deal-oneway-01` | Deal did not exist — `demo-deals.json` was empty |
| AppNotification | `entityId` | `seed-deal-oneway-01`, `seed-deal-consortium-01`, `seed-deal-exchange-01` | Same — no deal records |
| AuditEntry | `entityId` | `seed-deal-oneway-01`, `seed-deal-consortium-01`, `seed-deal-exchange-01` | Same |
| Contract | `dealId` | (missing file) | `demo-contracts.json` did not exist |
| Deal (runtime) | `id` | `seed-neg-01` | `loadDeals()` bootstrap created deals from negotiation IDs |
| Deal | `matchId` | `demo-pm-consortium-wind` | Post-match missing from `demo-post-matches.json` |
| Negotiation | `matchId` | `demo-pm-consortium-wind` | Same |

**Root cause:** Empty deal seed + runtime bootstrap that used negotiation IDs as deal IDs, breaking `Application.dealId = "seed-deal-oneway-01"`.

---

## Broken References Fixed

| Fix | Detail |
|-----|--------|
| Populated `demo-deals.json` | 3 deals with IDs matching all seed references |
| Created `demo-contracts.json` | 3 contracts with reciprocal `dealId` / `contractId` links |
| Removed negotiation bootstrap | `seed-loader.ts` → `loadDeals()` reads JSON only |
| Added `demo-pm-consortium-wind` | Post-match entry for wind consortium E2E path |
| Wired `loadContracts()` | Contract repository uses seed JSON, not empty stub |

---

## Current Validation Results

```json
{
  "valid": true,
  "summary": {
    "applicationDealRefs": 1,
    "resolvedDealRefs": 1,
    "notificationDealRefs": 5,
    "auditDealRefs": 5,
    "contractDealRefs": 3,
    "totalDeals": 3,
    "totalContracts": 3,
    "errorCount": 0,
    "warningCount": 0
  }
}
```

### Reference matrix (seed data)

| Source entity | Reference field | Target | Count | Resolved |
|---------------|-----------------|--------|-------|----------|
| Application | `dealId` | Deal | 1 | 1/1 |
| Application | `negotiationId` | Negotiation | (checked) | ✓ |
| AppNotification | `entityId` (deal) | Deal | 5 | 5/5 |
| AppNotification | `entityId` (contract) | Contract | (checked) | ✓ |
| AuditEntry | `entityId` (deal) | Deal | 5 | 5/5 |
| Contract | `dealId` | Deal | 3 | 3/3 |
| Deal | `contractId` | Contract | 3 | 3/3 |
| Deal | `negotiationId` | Negotiation | 3 | 3/3 |
| Deal | `matchId` | PostMatch | 3 | 3/3 |
| Negotiation | `matchId` | PostMatch | (checked) | ✓ |

### Deal ID inventory

| Deal ID | Negotiation | Contract | Application ref |
|---------|-------------|----------|-----------------|
| `seed-deal-oneway-01` | `seed-neg-01` | `seed-contract-oneway-01` | `seed-app-001` |
| `seed-deal-consortium-01` | `seed-neg-04` | `seed-contract-consortium-01` | — |
| `seed-deal-exchange-01` | `seed-neg-07` | `seed-contract-exchange-01` | — |

---

## Remaining Unresolved References

### Seed data (POC JSON)

**None.** All checked cross-references resolve.

### Out of validator scope

| Area | Notes |
|------|-------|
| `localStorage` overrides (`pmtwin_web_overrides`) | User-created entities at runtime are not scanned |
| `demo-reviews.json` | References `seed-deal-oneway-01` — deal exists; validator does not yet include Review entity |
| POC-only entities | Some POC scripts may reference additional IDs not loaded by web app |

---

## How to Re-Run

```bash
cd web
node scripts/validate-relationships.mjs
```

Programmatic (in app/tests):

```typescript
import { validateRelationshipIntegrity } from '@/infrastructure/validation/relationship-integrity.ts'
const report = validateRelationshipIntegrity()
```

---

## Recommendations for Sprint 2

1. Extend validator to cover `opportunityId`, `applicationId`, and `userId` participant refs.
2. Run integrity check in CI after seed data changes.
3. Validate localStorage overrides on app boot (non-destructive warning mode).
4. Add Review entity to web repository layer and include in integrity checks.
