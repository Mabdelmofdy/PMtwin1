# PM-Twin Visual Component Normalization

| Field | Value |
|-------|-------|
| Phase | Visual Component Normalization Sprint |
| Date | 1 July 2026 |
| Scope | Authenticated workspace + admin UI (presentation only) |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) |

---

## Executive summary

Workspace and admin pages were already largely on PM primitives (`PmPageHeader`, `PmContentCard`, `PmDataTable`, `PmEmptyState`, `PmWorkflowJourney`, `PmActionHub`). This sprint extracted the remaining repeated page-specific visual patterns into shared components and migrated consumers.

**Public routes** (`web/src/pages/public/*`) remain under UI freeze — excluded.

**`PmLoadingState`** deferred — no async loading boundaries exist today (data is synchronous).

---

## Visual consistency audit (before)

| Pattern | Occurrences | Issue |
|---------|-------------|-------|
| Hand-rolled `DashboardMetricStrip` | 1 (dashboard) | Duplicated metric strip layout |
| `pm-toolbar-surface rounded-xl px-4 py-3` div | 8+ files | Repeated toolbar container |
| `DealListCard` / `ContractListCard` | 2 pages | Identical mobile card structure |
| Inline `<p>…No … recorded</p>` | 6+ spots | Inconsistent empty treatment |
| Per-page `build*WorkflowSteps` | 5 detail pages | Duplicated journey step builders |
| `PmPageLayout` direct import | All workspace/admin | No single page primitive in `pm-index` |

---

## Components extracted

| Component | File | Purpose |
|-----------|------|---------|
| `PmPage` | `web/src/components/ui/pm-page.tsx` | Top-level page wrapper (standardizes `PmPageLayout`) |
| `PmStatsStrip` | `web/src/components/ui/pm-stats-strip.tsx` | Horizontal divided KPI strip |
| `PmToolbarSurface` | `web/src/components/ui/pm-toolbar-surface.tsx` | Standard table/tab toolbar container |
| `PmEntityListCard` | `web/src/components/ui/pm-entity-list-card.tsx` | Mobile list card (title + badge + meta + actions) |
| Workflow step builders | `web/src/components/ui/pm-workflow-journey-steps.ts` | Shared `build*WorkflowSteps` display helpers |

All exported from `web/src/components/ui/pm-index.ts`.

---

## Legacy CSS reduced

- Removed private `DashboardMetricStrip` from `workspace-dashboard-composition.tsx`
- Removed duplicate `DealListCard` / `ContractListCard` surface markup
- Replaced 8+ inline `pm-toolbar-surface …` class strings with `PmToolbarSurface`
- Replaced 6+ inline empty `<p>` blocks with `PmEmptyState size="compact"`

---

## Pages normalized

| Area | Changes |
|------|---------|
| Dashboard | `PmStatsStrip`, `PmPage` |
| Opportunities | `PmPage`, `PmToolbarSurface` |
| Opportunity detail | `PmPage`, centralized workflow steps |
| Pipeline / matches / negotiations | `PmPage`, `PmToolbarSurface`, workflow builders, compact empties |
| Deals / contracts | `PmPage`, `PmEntityListCard`, `PmToolbarSurface`, workflow builders, compact empties |
| People / notifications | `PmPage`, `PmToolbarSurface` |
| Admin (dashboard, list scaffold, matching) | `PmPage`, `PmToolbarSurface`, compact empty for audit activity |

---

## Remaining legacy pages

| Surface | Status |
|---------|--------|
| Public marketing (`marketing-pages.tsx`) | Frozen — shadcn Card/Button, zero PM components |
| Public auth (`auth-pages.tsx`) | Frozen — shadcn Card/Button baseline exception |
| `PmLoadingState` | Not created — no consumers until async data boundaries |
| `page-primitives.tsx` | Deprecated — zero imports, scheduled removal |
| Detail page scaffold (`PmDetailLayout` + journey + inspector) | Pattern repeated but structurally consistent; optional future `PmWorkflowDetailScaffold` |

---

## Validation

```bash
cd web
npm run type-check
npm test
npm run validate:design:strict
```

---

## Out of scope (confirmed unchanged)

- Business logic, commands, services, repositories, matching, readiness, lifecycle
- Routing, state management, data models
- `POC/`, `packages/*`
- Public route visual migration
