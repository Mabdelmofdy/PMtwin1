# PM-Twin Workflow & Information Architecture

| Field | Value |
|---|---|
| Sprint | Workflow & Information Architecture (Phase B Implementation) |
| Date | 2 July 2026 |
| Scope | `web/`, `docs/` |
| Out of scope | Visual redesign, colors, typography, spacing, animations, business logic, routes, URLs |
| Status | Implemented (IA-only updates) |

---

## Implemented Changes

This sprint implemented the approved IA recommendations as presentation and structure updates only:

1. Navigation groups and ordering were reorganized to a workflow-centered product model.
2. Pipeline messaging was aligned to current functionality (truthful scope copy).
3. Dashboard hierarchy was restructured to explain action, workflow progress, blockers, activity, and recommended next step.
4. A consistent relationship chain block was added to all workflow detail pages.
5. Detail pages now front-load workflow context without changing route structure or lifecycle behavior.

No URLs were changed. No routes were added or removed.

---

## Navigation Updates

Implemented authenticated sidebar hierarchy:

1. **Workspace**
   - Dashboard
2. **Marketplace**
   - Find
   - Opportunities
3. **Pipeline**
   - Pipeline
   - Matches
   - Negotiations
4. **Execution**
   - Deals
   - Contracts
5. **Communication**
   - Notifications
   - Messages
6. **Administration** (role-gated)
   - Admin

What changed:

- Renamed workspace nav item from "Workflow pipeline" to "Pipeline".
- Moved `Find` from Workspace to Marketplace.
- Moved `Matches` into Pipeline group.
- Moved `Deals` and `Contracts` into new Execution group.
- Reordered Communication to `Notifications` then `Messages`.
- Updated route label `pipeline` to "Pipeline".

---

## Dashboard Restructuring

Dashboard content now follows the required IA order:

1. **What needs my attention**
   - `PmActionHub` now explicitly titled and described as priority actions.
2. **My workflow progress**
   - Stage-aware metric strip shows counts for Opportunity, Match, Negotiation, Deal, Contract.
   - In-progress workflow cards remain directly actionable.
3. **Blocked items**
   - Added explicit blocked queue for declined/expired matches and countered/cancelled negotiations.
4. **Recent activity**
   - Activity section now surfaces current match activity cards in this slot.
5. **Recommended actions**
   - Added dedicated "Recommended actions" section with next-best CTA.

This keeps existing components and visual tokens while changing information structure and copy framing.

---

## Pipeline Changes

Pipeline was updated for truthful scope communication:

- Header title changed to **Pipeline**.
- Description now states:
  - Pipeline currently tracks opportunities and matches.
  - Negotiations, deals, and contracts continue in their dedicated sections.
- Added badge cue: "Next: Negotiations -> Deals -> Contracts".

No lifecycle logic, tab data model, or route behavior was changed.

---

## Relationship Chain Implementation

Added a shared IA component:

- `web/src/components/ui/pm-relationship-chain.tsx`

Exported via:

- `web/src/components/ui/pm-index.ts`

Applied on all detail pages:

- Opportunity detail: Opportunity -> Matches -> Negotiations -> Deals -> Contracts
- Match detail: Need -> Offer -> Match -> Negotiation -> Deal -> Contract
- Negotiation detail: Opportunity -> Match -> Negotiation -> Deal
- Deal detail: Negotiation -> Deal -> Contract
- Contract detail: Deal -> Negotiation -> Original opportunity -> Contract

Each chain uses existing links when available and safe fallback links when downstream records are not yet created.

---

## Pages Updated

- `web/src/config/navigation.ts`
- `web/src/components/layout/workspace-dashboard-composition.tsx`
- `web/src/pages/workspace/pipeline-pages.tsx`
- `web/src/pages/workspace/opportunity-detail-page.tsx`
- `web/src/pages/workspace/deals-pages.tsx`
- `web/src/pages/workspace/contracts-pages.tsx`
- `web/src/components/ui/pm-index.ts`
- `web/src/components/ui/pm-relationship-chain.tsx` (new)

---

## Remaining P1 Work

These items remain for the next IA iteration or redesign-adjacent sprint:

1. Full stage-complete pipeline surface (negotiations/deals/contracts as first-class pipeline tabs/board).
2. Richer "who is waiting on me" context on every workflow list row.
3. Deeper first-time orientation cues for role-specific journeys (company/admin narratives).
4. Cross-section admin-to-workflow unblocking signals.

---

## Validation Results

Executed in `web/`:

- `npm run type-check` -> PASS
- `npm test` -> PASS
- `npm run validate:design:strict` -> PASS

---

## Final Recommendation

Phase B IA implementation is complete and provides a workflow-centered product structure without visual redesign or business logic changes.  
Proceed next with Enterprise Visual Redesign v1.0 as a separate sprint, using this IA structure as the locked product foundation.

