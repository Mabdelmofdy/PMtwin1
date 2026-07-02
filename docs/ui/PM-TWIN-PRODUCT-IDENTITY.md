# PM-Twin Product Identity

## Product Philosophy

PM-Twin is a **Construction Collaboration Marketplace**. Users operate in two distinct mental models:

| Domain | Mental model | Language |
|--------|----------------|----------|
| **My Workspace** | Execution, ownership, progress | My, Assigned, Pending, Needs Action, Executing, Completed |
| **Marketplace** | Discovery, exploration, availability | Explore, Discover, Recommended, Trending, Available, Latest |

Presentation and information architecture express this split. Business logic, routes, permissions, and data models are unchanged.

## Marketplace vs Workspace

### My Workspace

Everything **owned by or assigned to** the signed-in user:

- Dashboard (My Workspace home)
- My Opportunities
- My Matches
- My Negotiations
- My Deals
- My Contracts

### Marketplace

Everything for **browsing and discovery**:

- Discover (directory)
- Browse Opportunities
- Browse Companies
- Browse Professionals
- Browse Matches (Preview — viewer-scoped data only today)
- Map (Preview)

### Communication

Notifications and Messages remain a shared communication group.

## Navigation Changes

**Before:** Workspace, Marketplace, Pipeline, Execution, Communication (with duplicate Matches links).

**After:**

```
My Workspace
├── My Workspace (dashboard)
├── My Opportunities
├── My Matches
├── My Negotiations
├── My Deals
└── My Contracts

Marketplace
├── Discover
├── Browse Opportunities
├── Browse Companies
├── Browse Professionals
├── Browse Matches (Preview)
└── Map (Preview)

Communication
├── Notifications
└── Messages
```

Nav items pass optional **route state** (`domain`, `ownershipScope`, `peopleScope`, `matchView`) to set presentation defaults without changing URLs.

Implementation: `web/src/config/navigation.ts`, `web/src/config/product-identity.ts`, `web/src/components/layout/app-sidebar.tsx`.

## Ownership Model

Opportunity ownership is resolved client-side via `resolveOpportunityOwnershipScope`:

| Scope | Badge | Meaning |
|-------|-------|---------|
| `marketplace` | Marketplace | Published by others outside your organization |
| `mine` | Mine | Created by the signed-in user |
| `company` | Company | Same organization, different creator |

Card order: **Ownership → Need/Offer → Status → Action**.

## Opportunity Separation

`/opportunities` uses segmented tabs (presentation filter only):

1. **All Marketplace** — `marketplace` ownership
2. **My Opportunities** — `mine` ownership
3. **Company Opportunities** — `company` ownership

Filtering uses `filterOpportunitiesByOwnershipFilter` layered on existing `filterOpportunitiesForListScope`. Page headers and search placeholders adapt to marketplace vs workspace context.

## Match Separation

`/matches` uses segmented tabs:

1. **My Matches** — existing viewer-scoped dataset (enabled)
2. **Marketplace Matches** — Preview (disabled; no cross-marketplace browse dataset yet)
3. **Recommended Matches** — top-scored discovered/accepted matches from existing data

## Dashboard Changes

Dashboard is **My Workspace** — execution-focused, not marketplace browsing.

| Section | Purpose |
|---------|---------|
| My KPIs | My opportunities, matches, negotiations, deals, contracts counts |
| My tasks | Action hub — items needing response |
| My workflow | Active negotiations and deals in progress |
| Blocked — needs decision | Declined/expired matches, stalled negotiations |
| Next action | Single recommended execution step |
| My notifications | Recent alerts (aside) |
| Recommended from marketplace | Top match scores — link to marketplace browse |

## Visual Language

- **Marketplace pages:** `label="Marketplace"`, discovery copy (explore, browse, available).
- **Workspace pages:** `label="My Workspace"`, execution copy (my, assigned, pending, needs action).

## Future Roadmap

1. **Marketplace match browse** — dedicated cross-marketplace dataset and enable Browse Matches tab.
2. **Map integration** — wire `/opportunities/map` to geo service; remove Preview badge.
3. **Dedicated marketplace landing** — optional `/discover` hub without new backend.
4. **Pipeline** — retain route for power users; not in primary nav to reduce overlap with My Workspace.
5. **Company workspace** — extend company-scoped defaults for multi-user org dashboards.
6. **Trending / Latest** — marketplace feeds when analytics APIs exist.

## Validation

```bash
cd web
npm run type-check
npm test
npm run validate:design:strict
```

## References

- Nav config: `web/src/config/navigation.ts`
- Product identity helpers: `web/src/config/product-identity.ts`
- Dashboard: `web/src/components/layout/workspace-dashboard-composition.tsx`
- Opportunity cards: `web/src/components/opportunity/opportunity-card.tsx`
