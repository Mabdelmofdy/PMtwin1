# Enterprise Identity Refactor — Final Delivery Report

Date: 2026-07-12 (final-closure remediation)

## 1. Architecture implemented

Canonical model: **User → Business Workspace (`personal` | `company`) → Party → Actor**, with **PlatformAccessContext** separate from Marketplace Workspaces.

- Package `@pm-twin/identity` owns types, capabilities, ownership integrity, migration projection, schema versions, and actor resolvers.
- Web runtime: workspace repositories, auth session (`activeWorkspaceId`), membership-backed Workspace Switcher, dual-read ownership adapters.
- Matching discover, negotiation writes, and commercial agreement writes now stamp canonical party/workspace/actor metadata at write time.

## 2. Final-closure remediation (this pass)

| Area | Status |
|------|--------|
| Matching discover canonical scoping | **Complete** — owner party/workspace scoping; no business scoping via `creatorId` |
| Negotiation write paths | **Complete** — create, messages, attachments, offers, accept/reject, transcript, agree |
| Commercial Agreement write paths | **Complete** — create, transition, award, contract handoff |
| Seed Opportunity backfill | **Complete** — 55 records in `opportunities.json` |
| Legacy compatibility guards/tests | **Complete** |
| Remaining-field inventory | **Complete** — see §15 |

## 3. Root causes fixed

1. **Matching discover** used `creatorId` for barter-side hydration, participant construction, two-way exclusion, consortium/circular anchors, and circular anchor deduplication — conflating human actor with business owner.
2. **Negotiation/Agreement handlers** persisted legacy `userId`-only participants and transcript/events without `partyId` / `workspaceId` / `actorUserId` at write time.
3. **Seed opportunities** lacked canonical `workspaceId` / `ownerPartyId`, forcing runtime inference on every load.

## 4. Matching paths migrated

| Path | Change |
|------|--------|
| `model-run-discover-adapter.ts` | Owner-party hydration, participant building, same-party exclusion, consortium/circular party dedupe |
| `matching-service.ts` | `anchorsByOwnerParty` replaces `anchorsByCreator`; ownership context from user/company repos |
| `opportunity-post-adapter.ts` | Passes `ownerPartyId`, `workspaceId` on `OpportunityPost` |
| `negotiation-service.ts` | `canUserApplyToOpportunity` uses `isOpportunityOwnedByContext` |
| `matching-discovery-context.ts` | Shared resolver helpers |

Engine (`@pm-twin/matching`) algorithms unchanged; web layer post-processes with canonical ownership.

## 5. Negotiation write paths migrated

- `negotiation-command-handler.ts`: create from post-match/application stamps `initiatingPartyId`, `initiatedByWorkspaceId`, `createdByUserId`, `createdByActorType`, canonical participants; agree stamps `lastModifiedByUserId`
- `negotiation-room-command-handler.ts`: messages, attachments, offers, accept/reject, transcript lock stamp `partyId`, `workspaceId`, `actorUserId`, `actorType`

## 6. Commercial Agreement write paths migrated

- `deal-command-handler.ts`: create stamps canonical metadata + enriched participants; transition stamps `lastModifiedByUserId`; award stamps `awardDecisionByPartyId`, `awardedByUserId`, `awardedPartyId`, `awardedWorkspaceId`; contract handoff stamps `createdByUserId` / `createdByActorType`

Lifecycle statuses and award safety rollback behavior unchanged.

## 7. Seed records backfilled

- Script: `POC/scripts/backfill-opportunity-canonical-ownership.mjs`
- `POC/data/opportunities.json`: 55 opportunities — all have `workspaceId`, `ownerPartyId`
- Company-owned records (19): `createdByUserId: system-migration-actor`, `createdByActorType: system`, audit evidence in `POC/data/opportunities-ownership-audit.json`
- Human-owned records: `createdByUserId` from known creator
- `demo-40-opportunities.json`: empty (no records to backfill)

## 8. Tests added

- `web/src/domain/identity/matching-discovery-isolation.test.ts` — personal/company isolation, employee shared context, workspace switch, creatorId not ownership, no cross-workspace leakage
- `web/src/domain/identity/legacy-compatibility.test.ts` — auth not from creatorId alone, canonical write stamping

## 9. Verification gate results

| Gate | Result |
|------|--------|
| `packages/identity` `npm test` | **10 pass / 0 fail** |
| `web` `npm test` | **1269 pass / 0 fail** |
| `web` `npm run type-check` | **Pass** |
| `web` `npm run build` | **Pass** |
| `web` `npm run lint` | Pre-existing repo debt (171 problems); no new blockers from this pass |
| `web` `npm run validate:design` | **Pass** (baseline mode; 4 pre-existing actionable violations) |
| `web` `npm run validate:domain` | **Skipped** — vite-node env resolution failure in this environment (`Cannot find module '/@vite/env'`) |

## 10. Completion bar

| Criterion | Met |
|-----------|-----|
| Matching discovery no longer uses `creatorId` for business scoping | Yes |
| New Negotiation writes persist Party, Workspace, Actor metadata | Yes |
| New Commercial Agreement writes persist Party, Workspace, Actor metadata | Yes |
| Seed Opportunities contain canonical ownership | Yes |
| No business authorization depends on `creatorId` alone (when canonical fields present) | Yes |

---

## 15. Remaining `creatorId` / `userId` / `companyId` classified inventory

**Zero unresolved business ownership or business authorization usages.**

### `creatorId`

| Location / pattern | Classification |
|--------------------|----------------|
| `Opportunity.creatorId` field on entity | Legacy read compatibility + legitimate actor/audit field (human creator) |
| `ownership-adapters.ts` dual-read fallback | Legacy read compatibility — only when `workspaceId`/`ownerPartyId` absent |
| `command-rbac.ts` dual-read fallback | Legacy read compatibility — only when canonical fields absent |
| `deal-service.ts` pipeline dual-read | Legacy read compatibility — only when no active workspace context |
| `opportunity-post-adapter.ts` → engine DTO | Legacy read compatibility — engine self-match exclusion (algorithm unchanged) |
| `packages/matching` engine internals | Migration-only at engine layer — web scoping overrides at discover adapter |
| Admin/read-model display, wizard draft | Route/internal reference / display |
| Test fixtures | Test-only |

### `userId`

| Location / pattern | Classification |
|--------------------|----------------|
| Auth session / `CommandPermissionActor.userId` | Authentication identity |
| Audit `userId` / `actorUserId` | Legitimate actor/audit field |
| Participant `userId` | Legacy read compatibility + representative identity (canonical: `partyId`/`workspaceId`) |
| Command payloads `userId` (negotiation room) | Actor identity on command — stamped to canonical fields at write |
| Notification recipient `userId` | Authentication identity / recipient targeting |
| Route params / repository keys | Route/internal reference |

### `companyId`

| Location / pattern | Classification |
|--------------------|----------------|
| `resolveLegacyOpportunityOwnership` companyIds set | Migration-only — idempotent projection input |
| Seed backfill script account classification | Migration-only |
| Legacy party synthesis in `@pm-twin/party` | Legacy read compatibility |
| No runtime field `companyId` on Opportunity for auth | N/A — not used for business authorization |

---

## Files changed (this pass)

**Created:** `web/src/domain/identity/matching-discovery-context.ts`, `web/src/domain/identity/command-actor-stamping.ts`, `web/src/domain/identity/matching-discovery-isolation.test.ts`, `web/src/domain/identity/legacy-compatibility.test.ts`, `POC/scripts/backfill-opportunity-canonical-ownership.mjs`, `POC/data/opportunities-ownership-audit.json`

**Modified:** `web/src/services/matching/model-run-discover-adapter.ts`, `web/src/services/matching-service.ts`, `web/src/services/matching/opportunity-post-adapter.ts`, `web/src/services/negotiation-service.ts`, `web/src/commands/handlers/negotiation-command-handler.ts`, `web/src/commands/handlers/negotiation-room-command-handler.ts`, `web/src/commands/handlers/deal-command-handler.ts`, `web/src/types/domain.ts`, `packages/matching/src/types/opportunity.ts`, `packages/commands/src/contracts/post-match-types.ts`, `POC/data/opportunities.json`, `docs/identity-ownership-delivery-report.md`
