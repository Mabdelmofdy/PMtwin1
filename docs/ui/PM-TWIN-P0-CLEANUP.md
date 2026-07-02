# PM-Twin P0 Cleanup Sprint — Phase A

| Field | Value |
|-------|-------|
| Sprint | Enterprise P0 Cleanup (Presentation Only) |
| Date | 1 July 2026 |
| Authority | [PM-TWIN-ENTERPRISE-UI-AUDIT.md](./PM-TWIN-ENTERPRISE-UI-AUDIT.md) |
| Scope | `web/` presentation layer + `docs/` |
| Status | **Complete** |

---

## Executive Summary

Phase A removes prototype-grade developer artifacts from the authenticated workspace UI without changing business logic, routing architecture, or data models. Internal IDs remain in storage and APIs; users now see **business titles**, **ownership badges**, and **Match** (not PostMatch) terminology.

**P0 items delivered:**

| P0 | Item | Status |
|----|------|--------|
| P0-1 | Human display titles for contracts, negotiations, deals, matches | Done |
| P0-2 | Technical IDs gated behind collapsed “Technical details” | Done |
| P0-3 | Dynamic sidebar badges (notifications/messages) | Done |
| P0-4 | PostMatch → Match in all user-visible copy | Done |
| P0-5 | Negotiations added to sidebar + `/negotiations` list route | Done |

**Not in scope (deferred P1+):** marketing/workspace brand bridge, pipeline funnel expansion, hero pattern variety, Messages demotion, async loading skeletons.

---

## Files Changed

### New files

| File | Purpose |
|------|---------|
| `web/src/lib/entity-display-titles.ts` | Business titles for opportunity, deal, contract, negotiation |
| `web/src/lib/entity-display-titles.test.ts` | Unit tests for display titles |
| `web/src/lib/match-display.ts` | Need ↔ Offer pairing labels for matches |
| `web/src/lib/match-display.test.ts` | Unit tests for match display |
| `web/src/lib/breadcrumb-display.ts` | Entity ID → business title breadcrumb resolution |
| `web/src/components/opportunity/opportunity-identity.tsx` | Ownership + intent badge strip |
| `web/src/components/ui/pm-technical-details.tsx` | Collapsed technical reference section |
| `docs/ui/PM-TWIN-P0-CLEANUP.md` | This document |

### Modified files

| Area | Files |
|------|-------|
| Navigation | `config/navigation.ts`, `routes.tsx`, `app-sidebar.tsx`, `page-breadcrumbs.tsx` |
| Opportunity identity | `opportunity-display.ts`, `opportunity-list-labels.tsx`, `opportunity-card.tsx`, `opportunity-detail-page.tsx`, `opportunity-timeline.tsx`, `opportunity-collaboration-constants.ts` |
| Matches | `match-card.tsx`, `matches-list-section.tsx`, `pipeline-pages.tsx` |
| Deals & contracts | `deals-pages.tsx`, `contracts-pages.tsx` |
| Dashboard & people | `workspace-dashboard-composition.tsx`, `people-pages.tsx`, `user-dashboard-section.tsx` |
| Settings & messages | `settings-view.tsx`, `messages-view.tsx`, `user-display.ts` |
| Copy cleanup | `applications-panel.tsx`, `apply-wizard.tsx`, `admin-pages.tsx` |
| Tests | `opportunity-display.test.ts`, `opportunity-collaboration-ux.test.ts` |
| Minor | `marketing-pages.tsx` (unused import) |

---

## Developer Terms Removed (User-Facing)

| Before | After |
|--------|-------|
| `seed-contract-oneway-01` as contract list title | `Hospital Design Collaboration Contract` (derived from deal/opportunity titles) |
| `Contract ${id}` header | `formatContractDisplayTitle(...)` |
| `Negotiation ${neg.id}` | `{Subject} Negotiation` |
| PostMatch / Post-match / post-matches | Match / matches |
| `PostMatch ID`, `Deal ID`, `Contract ID` in default summary | Collapsed **Technical details** with “reference” labels |
| Copyable **User ID** in Settings | **Account type** (human role label) |
| Raw `user.role` in sidebar | `Platform admin` / `Company account` / `Professional` |
| Breadcrumb `Seed Opp 001` | Opportunity business title |
| `Search match type or ID…` | `Search need, offer, or partner…` |
| `Thread t1 — message history placeholder` | Neutral messaging copy |

Internal code identifiers (`postMatchId`, `PostMatch` type, command names) are unchanged.

---

## Navigation Improvements

| Change | Detail |
|--------|--------|
| **Negotiations** | Added to Workflow stages sidebar (`/negotiations`, Scale icon) |
| **Negotiations list page** | New `NegotiationsPage` with human titles and status badges |
| **Badge counts** | Removed hardcoded `3` / `5`; sidebar shows real unread notification + mock message counts |
| **Find alignment** | People page title changed to **Find** (matches nav label) |
| **Breadcrumbs** | `buildBreadcrumbLabels()` resolves entity segments to business titles |

---

## Entity Identity Improvements

### Opportunity ownership badges

| Scope | Label | Tone |
|-------|-------|------|
| Owner | My opportunity | primary |
| Same organization | Company opportunity | info |
| Other published | Marketplace opportunity | muted |

Implemented in `resolveOpportunityOwnershipScope()` and `OpportunityIdentityBadges`.

### Consistent badge order

Ownership → Need/Offer → Status (on detail pages)

### Match identity

Match cards and table primary column show:

```
Need
{Need opportunity title}
↓
Offer
{Offer opportunity title}
```

Topology (`one_way`, etc.) moved to secondary badge.

---

## Business Title Improvements

| Entity | Resolver | Fallback |
|--------|----------|----------|
| Opportunity | `formatOpportunityDisplayTitle` | Untitled Opportunity |
| Deal | `formatDealDisplayTitle` | Untitled Deal |
| Contract | `formatContractDisplayTitle` | Untitled Contract |
| Negotiation | `formatNegotiationDisplayTitle` | Untitled Negotiation |
| Match | `formatMatchDisplayTitle` | Need ↔ Offer pairing with untitled fallbacks |

---

## Before / After Examples

### Contracts list

| Before | After |
|--------|-------|
| `seed-contract-oneway-01` (monospace link) | Hospital Expansion Collaboration Contract |
| Deal column: `seed-deal-oneway-01` | Hospital Expansion Collaboration |

### Dashboard negotiations

| Before | After |
|--------|-------|
| `Negotiation seed-neg-02` | `Hospital Expansion Negotiation` |

### Match card

| Before | After |
|--------|-------|
| `One way` (topology as title) | Need: Architect Needed … Offer: Structural Engineer Available |

### Settings account

| Before | After |
|--------|-------|
| User ID: `seed-user-001` (copyable) | Account type: Professional |

### Breadcrumb

| Before | After |
|--------|-------|
| `/opportunities/seed-opp-001` → “Seed Opp 001” | `/opportunities/seed-opp-001` → “Architect Needed for Hospital Expansion” |

---

## Remaining P1 Issues

| ID | Item | Why deferred |
|----|------|--------------|
| P1-1 | Match list counterparty names (people, not only opportunities) | Needs people lookup enrichment |
| P1-2 | Pipeline funnel includes all workflow stages | IA redesign, not P0 presentation |
| P1-4 | Demote Messages / Map until real | Nav structure change |
| P1-5 | Full breadcrumb title cache / async | Current sync lookup sufficient for MVP |
| P1-6 | Dashboard action hub richer context | Copy pass beyond P0 |
| P1-7 | Marketing → workspace brand bridge | Separate visual redesign sprint |
| P2-3 | Settings save wiring | Functional, not presentation |
| P2-4 | Opportunity filter status canonicalization in data layer | Filter label fixed; status values still seed-shaped |

---

## Validation Results

```bash
cd web
npm run type-check    # PASS
npm test              # PASS (750 tests)
npm run validate:design:strict  # PASS (0 violations)
```

---

## Final Recommendation

Phase A is complete. The workspace no longer exposes seed IDs or PostMatch jargon in primary UI surfaces. **Proceed to P1** with:

1. Pipeline funnel honesty (tabs or copy)
2. Marketing/workspace visual bridge
3. Counterparty names on match surfaces
4. Messages/Map nav demotion or “Preview” labeling

Do **not** start full Enterprise Visual Redesign until P1 navigation/IA items are scheduled — the presentation layer is now demo-ready for enterprise stakeholders.
