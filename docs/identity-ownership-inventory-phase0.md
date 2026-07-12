# Phase 0 — Identity & Ownership Inventory

Baseline recorded: 2026-07-12

## Schema versions (starting)

| Key | Version |
|-----|---------|
| `identitySchemaVersion` | `0` (pre-refactor) → target `1` |
| `ownershipSchemaVersion` | `0` (pre-refactor) → target `1` |

## Authorization checks using `creatorId === userId` (must migrate)

| File | Usage |
|------|--------|
| `web/src/domain/rbac/command-rbac.ts` | Publish ownership: `creatorId === actor.userId` |
| `web/src/lib/entity-view-visibility.ts` | Owner visibility |
| `web/src/components/opportunity/opportunity-display.ts` | Filter + owner check |
| `web/src/components/layout/workspace-dashboard-composition.tsx` | Draft/dashboard filters |
| `web/src/components/user/user-dashboard-section.tsx` | User opportunity filter |
| `web/src/components/opportunity/opportunity-dashboard-section.tsx` | Dashboard filter |
| `web/src/pages/workspace/pipeline-pages.tsx` | Pipeline ownership |
| `web/src/components/pipeline/pipeline-board.tsx` | `isOwner` |
| `web/src/components/opportunity/wizard/opportunity-wizard-page.tsx` | Draft ownership |
| `web/src/services/deal-service.ts` | Opportunity list by creator |
| `web/src/services/negotiation-service.ts` | Self-negotiation guard |
| `web/src/services/matching/model-run-discover-adapter.ts` | Match discovery by creator |
| `web/src/domain/admin/read-models/related-objects-adapter.ts` | Related opportunities |

## Queries scoped by User instead of Workspace/Party

- Opportunity dashboards and pipeline boards (`creatorId`)
- Matching discover adapter (`creatorId`)
- Negotiation service self-checks (`creatorId`)
- Deal service opportunity filter (`creatorId`)

## Ownership / participant / creator fields (baseline)

| Field | Entities | Classification |
|-------|----------|----------------|
| `creatorId` | Opportunity | Legacy ownership + actor (must split) |
| `ownerPartyId` | Opportunity, PartyDocument, vetting | Canonical when present |
| `userId` | Participant, notifications, commands | Actor / legacy participant |
| `companyId` | Rare; ownership fallback in `@pm-twin/party` | Legacy |
| `applicantId` | Application | Legacy actor |
| `PlatformUser.role` | User | Mixed marketplace + platform |

## Roles inventory

- Marketplace (legacy): `professional`, `user`, `company_owner`
- Platform (on same `role` field): `admin`, `moderator`, `auditor`, plus Demo/UAT staff vocabulary in `canonical-roles.ts`

## Baseline regression

See `packages/identity` tests and `web/src/domain/identity/*` for locked invariants after Phase 1+.
