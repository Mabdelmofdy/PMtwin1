# EOX — Enterprise Operations Experience (Executive Summary)

Demo/UAT Admin Portal UX transformation. UI composition only — no guarded engines, backends, APIs, fake metrics, or repository architecture changes.

## 1. Executive UX Summary

The Admin Portal homepage and workspaces are now **action-driven operational consoles**. Administrators see what needs attention, what is at risk, pipeline progress, and where to intervene next — not a static KPI dashboard.

## 2. UX Architecture Changes

| Before | After |
|--------|-------|
| Dashboard-first Command Center | Requires Action → Health → Pipeline → Risk → Recent Ops |
| Workspace = KPI + hyperlinks | Workspace = Queue + Analytics + Tiles + Risk + Recent Ops |
| Simple list tables | Enterprise grid (search, filters, columns, views, sort, density, selection, export) |
| Ad-hoc detail pages | Shared `AdminEntityDetailShell` |
| Stat cards only | SVG/CSS analytics with drill-down |

## 3. Command Center Improvements

- Primary band: **Requires My Action** (expanded ops cards)
- **Platform Health** facets (Marketplace, Commercial, Matching, Readiness, Compliance, Data Quality)
- Drillable **Pipeline**
- **Risk Panel** (Critical / Warning / Blocked / Healthy)
- **Recent Operations** from live audit (operational hints)
- Secondary KPIs demoted below operational content

## 4. Workspace Improvements

All workspaces (`identity`, `compliance`, `marketplace`, `commercial`, `reports`, `configuration`, `system`) use filled `AdminWorkspaceShell` slots with domain-focused queues, analytics, nav tiles, and risk chips.

## 5. Data Grid Improvements

`AdminListPage` now supports search, toolbar filters, column chooser, saved views, sorting, density, sticky header, pagination, selection, bulk export, CSV export, refresh, and contextual row actions.

## 6. Detail Page Improvements

Shared shell applied to Users, Parties, Opportunities (new `/admin/opportunities/:id`). Negotiations / CA / Contracts retain existing routes with catalogue actions expanded for navigation.

## 7. Analytics Improvements

Reports page uses live aggregations: conversion funnel, matching trend, velocity (age), top regions/models/modes/companies, status distribution. Empty when data cannot support a series — never fabricated.

## 8. Design System Improvements

Barrel: `web/src/components/admin/admin-index.ts` — workspace, command-center, entity, analytics, severity, states (permission denied, skeleton).

## 9. Navigation Improvements

Command palette adds Command Center, Operations, Analytics shortcuts. Workspace domain tiles replace plain link lists. Pipeline/KPI tiles deep-link to filtered lists.

## 10. Responsive Improvements

Command Center and workspace panels stack on narrow viewports; grids keep mobile card layout from `PmDataTable`; sticky toolbars use backdrop blur.

## 11. Accessibility Improvements

Focus rings on operational cards/tiles; aria labels on pipeline/funnel charts; keyboard-usable density/column/row action controls; RTL-safe flex (`ms-`/`me-` patterns retained).

## 12. Components Created

- Command Center panels (Requires Action, Health, Pipeline, Risk, Recent Ops)
- `AdminDomainNavTiles`, `AdminEntityDetailShell`, analytics charts
- Severity helpers, `AdminPermissionDenied`, `AdminSkeletonBlock`
- `admin-analytics-adapter`, expanded command-center / workspace adapters

## 13. Components Updated

- `AdminOpsActionCard`, `AdminWorkspaceShell` / Header, `AdminListPage`, Executive / Workspace / Reports / User / Party pages, Command Menu, Quick Action catalogue

## 14. Routes Updated

- `/admin/opportunities/:id` → `AdminOpportunityDetailPage`

## 15. UX Consistency Matrix

See [UX-CONSISTENCY-MATRIX.md](./UX-CONSISTENCY-MATRIX.md).

## 16. Screens Updated

Executive CC, all Workspace homes, Admin lists via `AdminListPage`, Users/Parties/Opportunity details, Reports/Analytics, Moderation links, Command palette.

## 17. Verification

```bash
cd web
npm test
npm run type-check
npm run build
```

## 18. Confirmation

- No guarded engine changed
- No backend / REST / GraphQL / DB added
- No business lifecycle logic changed
- No workflow / decision engine changed
- No repository architecture / persistence model changed
- No fake analytics or placeholder metrics
