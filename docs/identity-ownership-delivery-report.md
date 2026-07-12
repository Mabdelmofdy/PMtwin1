# Enterprise Identity Refactor — Final Delivery Report

Date: 2026-07-12

## 1. Architecture implemented

Canonical model: **User → Business Workspace (`personal` | `company`) → Party → Actor**, with **PlatformAccessContext** separate from Marketplace Workspaces.

- Package `@pm-twin/identity` owns types, capabilities, ownership integrity, migration projection, schema versions, and actor resolvers.
- `@pm-twin/party` remains eligibility + legacy Party synthesis; Party records gain optional `workspaceId` / profile refs.
- Web runtime: workspace repositories, auth session (`activeWorkspaceId`), membership-backed Workspace Switcher, dual-read ownership adapters.

Platform context is **not** a Marketplace ownership Workspace (no `ownerPartyId`; excluded from ownership resolvers).

## 2. New domain entities and types

| Type | Location |
|------|----------|
| `BusinessWorkspace`, `WorkspaceMembership`, `PlatformAccessContext` | `packages/identity` |
| `WorkspaceRole`, `WorkspaceCapability`, `PlatformRole` | `packages/identity` |
| `WorkflowActorContext`, `CreatedByActor`, `BusinessParticipant` | `packages/identity` |
| `IDENTITY_SCHEMA_VERSION` / `OWNERSHIP_SCHEMA_VERSION` | `packages/identity` |
| Web repos | `workspace-repository.ts`, `workspace-membership-repository.ts` |

## 3. Legacy fields deprecated (dual-read retained)

- `creatorId` — no longer sole ownership/auth key; dual-read when canonical fields absent
- `PlatformUser.role` as mixed marketplace+platform role — staged via `resolveLegacyRoleToPlatformRoles` / `resolveLegacyRoleToWorkspaceMembership`
- Global `company_owner` — registration uses membership `workspace_owner`; user role `user`
- Participant `userId`-only — optional `partyId` / `workspaceId` / `actorUserId` added

## 4. Entities migrated (canonical fields + adapters)

- Opportunity: `workspaceId`, `ownerPartyId`, `createdByUserId`, `lastModifiedByUserId`, `createdByActorType`
- PostMatch / Negotiation / CommercialAgreement / Contract: multi-party fields + participant party metadata
- Notifications: recipient targeting fields + workspace visibility filter
- Audit: extended actor snapshot fields (auto-enriched on append)
- Negotiation messages/offers/transcript: party/workspace/actor optional fields

## 5. Commands and workflows updated

- Command actor context extended (`activeWorkspaceId`, `workspaceRole`, `capabilities`, `actorType`, `platformRoles`)
- Opportunity create dual-writes canonical ownership from actor
- PostMatch accept/decline records `actorUserId` / party / workspace; party-aware matching; party-level accept uniqueness
- UpdateOpportunity RBAC uses owner + capability (Admin RBAC preserved for admin edit)

## 6. Permission model updated

- Marketplace: `resolveWorkspaceCapabilities` / `hasWorkspaceCapability`
- Admin: existing Admin RBAC / `hasAdminCapability` unchanged and separate; `canAccessAdminForRole` uses PlatformRole resolution (marketplace `company_owner` denied)
- Publish/edit ownership: workspace/party first; `creatorId` dual-read only when canonical fields absent

## 7. Authentication and registration

- Session: `activeWorkspaceId`, `platformContextActive`
- Hooks: `useCurrentUser`, `useActiveWorkspace`, `useActiveParty`, `useWorkspaceMembership`, `usePlatformRole`
- Registration: Personal/Company Workspace atomic create; one login User for Company; Company profile is not a login principal
- UI copy: Create your workspace / Personal Workspace / Company Workspace

## 8. Workspace switching

- Membership-backed switcher (not pathname)
- Platform entry via `enterPlatformContext` (no Marketplace `ownerPartyId`)
- Cache invalidation: `workspace-cache.ts`
- Recovery: `recoverActiveBusinessContext`
- Deep-link: `resolveDeepLinkWorkspaceContext`

## 9. UI surfaces updated

- `OwnershipMeta` + `ownership-display.ts`
- Opportunity executive header / overview: **Owned by** vs **Created by**
- Registration workspace wording

## 10. Admin boundaries

- Platform roles resolved separately; no automatic Marketplace Party for platform staff in projection
- Admin portal remains `/admin`; deep-links stay admin without marketplace context switch
- Audit append stores `actorType: platform_operator` when platform roles present
- Admin RBAC engine preserved

## 11. Seed, Demo/UAT, export/import

- Deterministic identity projection from users/companies
- Export schema `1.1` includes `workspaces`, `workspaceMemberships`, `parties`, identity/ownership schema versions
- Import accepts `1.0` (identity collections optional) and `1.1`
- Bootstrap metadata stores schema versions
- Migration timestamps deterministic for idempotency

## 12. Tests added

- `packages/identity/tests/identity.test.js`
- `web/src/domain/identity/*` (projection, participants, isolation, migration idempotency, notification targeting)
- Existing suites updated (registration, RBAC, export/import)

## 13. Verification gate results

| Gate | Result |
|------|--------|
| `packages/identity` `npm test` | Pass |
| `web` `npm test` | **1258+ pass / 0 fail** (re-verify after final UI/audit commits) |
| `web` `npm run type-check` | Pass |
| `web` `npm run build` | Pass |
| `web` `npm run lint` | Pre-existing repo lint debt remains (not introduced as identity-only blockers) |

## 14. Remaining limitations

- Seed JSON opportunities may still lack backfilled `workspaceId`/`ownerPartyId` until runtime dual-read; full seed rewrite is incremental.
- Negotiation/Agreement/Contract command write paths still often userId-centric; types/adapters ready for fuller migration.
- Execution modules (projects/tasks) lightly touched — notification/isolation helpers prepared.
- Matching discover still has `creatorId` scoping (classified debt below).
- Repo-wide ESLint has pre-existing errors unrelated to this refactor.

## 15. Files created / changed (high level)

**Created:** `packages/identity/**`, `docs/identity-ownership-inventory-phase0.md`, `docs/identity-ownership-delivery-report.md`, `web/src/domain/identity/**`, `web/src/repositories/workspace-*.ts`, `web/src/providers/identity-hooks.ts`, `web/src/components/identity/ownership-meta.tsx`, related tests.

**Changed:** auth provider/service, registration, command RBAC/gateway, post-match handler, opportunity types/handler/UI, participant types, export/import/bootstrap, party membership primary resolution, deal-service pipeline dual-read, audit repository actor enrichment, admin-access PlatformRole check, vite/package wiring.

---

## Remaining `creatorId` / `userId` / `companyId` classification

| Pattern | Classification |
|---------|----------------|
| Opportunity `creatorId` dual-read / dual-write | Legacy compatibility field |
| Auth `userId` / session `userId` | Authentication identity field |
| Audit `userId` / `actorUserId` | Legitimate audit field |
| Participant `userId` | Legacy compatibility + representative identity |
| Notification `userId` | Recipient targeting (plus new recipient* fields) |
| Command payloads `userId` | Actor identity on command |
| `companyId` in ownership resolve fallback | Migration-only / legacy compatibility — not authoritative ownership |
| Route params / internal keys using ids | Route or internal reference |
| Matching discover by `creatorId` | Unresolved technical debt (prefer workspace/party filters next) |
| Pipeline dual-read `creatorId` when no active workspace context | Legacy compatibility field |

**Completion bar:** business authorization for Opportunity publish/edit no longer depends on `creatorId` alone when canonical `workspaceId`/`ownerPartyId` are present.
