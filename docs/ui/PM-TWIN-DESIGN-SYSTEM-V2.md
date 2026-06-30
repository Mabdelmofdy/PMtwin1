# PM-Twin Design System v2.0

| Field | Value |
|-------|-------|
| Phase | 8 — Design QA & Consistency Audit |
| Date | 29 June 2026 |
| Authority | `web/src/components/layout/*` shell, `web/src/components/ui/pm-*`, design tokens |
| Prior audit | [PM-TWIN-UI-AUDIT-V2.md](./PM-TWIN-UI-AUDIT-V2.md) |
| Status | **v2 migration complete** — see [PM-TWIN-RTL-EXCELLENCE-AUDIT.md](./PM-TWIN-RTL-EXCELLENCE-AUDIT.md) (Phase 9.5D), [PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md](./PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md) (Phase 9.5E), [PM-TWIN-PREMIUM-VISUAL-REFRESH.md](./PM-TWIN-PREMIUM-VISUAL-REFRESH.md) (Phase 9.5F), [PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md](./PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md) (Phase 9.5G) |

---

## Overview

PM-Twin v2 design language targets **premium B2B SaaS**: Linear clarity (45%), Stripe polish (30%), Vercel restraint (15%), Apple Motion subtlety (10%). No heavy glassmorphism.

Phase 2 adds:

1. **Semantic design tokens** in CSS (light + dark)
2. **Typography, spacing, shadow, and motion utilities**
3. **PM-prefixed UI primitives** that wrap shadcn/ui
4. **Token helpers** for consolidation of duplicated patterns (planned migration)

Existing pages continue using `page-primitives.tsx` and shadcn components until Phase 3+.

---

## 1. Token list

### 1.1 Color (semantic)

| Token | CSS variable | Tailwind utility | Purpose |
|-------|--------------|------------------|---------|
| background | `--background` | `bg-background` | App canvas |
| foreground | `--foreground` | `text-foreground` | Primary text |
| surface | `--surface` | `bg-surface` | Default panel |
| surface-muted | `--surface-muted` | `bg-surface-muted` | Subtle panels, empty states |
| surface-elevated | `--surface-elevated` | `bg-surface-elevated` | Raised panels |
| border | `--border` | `border-border` | Default borders |
| border-strong | `--border-strong` | `border-border-strong` | Emphasis borders |
| primary | `--primary` | `bg-primary` | Brand actions |
| primary-muted | `--primary-muted` | `bg-primary-muted` | Soft primary fills |
| success | `--success` | `text-success`, `bg-success/10` | Positive states |
| warning | `--warning` | `text-warning`, `bg-warning/10` | Caution states |
| danger | `--danger` | `text-danger`, `bg-danger/10` | Destructive states |
| info | `--info` | `text-info`, `bg-info/10` | Informational |
| neutral | `--neutral` | `text-neutral`, `bg-neutral/10` | Fallback badges |
| focus-ring | `--focus-ring` | `ring-focus-ring` | Focus visibility |
| ring | `--ring` | `ring-ring` | shadcn compatibility |

Legacy shadcn tokens (`card`, `muted`, `destructive`, `sidebar-*`) remain for existing components.

### 1.2 Typography

| Class | Use |
|-------|-----|
| `.pm-text-display` | Marketing hero |
| `.pm-text-h1` | Page titles |
| `.pm-text-h2` | Section titles |
| `.pm-text-h3` | Card titles |
| `.pm-text-body` | Default body |
| `.pm-text-body-sm` | Secondary copy |
| `.pm-text-caption` | Meta, hints |
| `.pm-text-label` | Form labels, overlines |
| `.pm-text-badge` | Badge text |
| `.pm-text-mono` | KPIs, IDs, numbers |

**Fonts (no new files added):**

| Role | Stack |
|------|-------|
| Headings | Plus Jakarta Sans Variable (`--font-heading`) — already loaded |
| Body | System UI sans (`--font-body`) |
| Mono | System monospace / Geist Mono fallback (`--font-mono`) |

TypeScript mirror: `pmTypography` in `pm-design-tokens.ts`.

### 1.3 Spacing

| Token | Variable | Utility class | Default |
|-------|----------|---------------|---------|
| Page padding X | `--pm-space-page-x` | `.pm-page-padding` | 1rem → 2rem @ md |
| Page padding Y | `--pm-space-page-y` | `.pm-page-padding` | 1.5rem → 2rem @ md |
| Section gap | `--pm-space-section` | `.pm-section-gap` | 1.5rem → 2rem @ md |
| Card padding | `--pm-space-card` | `.pm-card-padding` | 1rem → 1.25rem @ md |
| Form gap | `--pm-space-form` | `.pm-form-gap` | 1rem |
| Table density | `--pm-space-table-*` | `.pm-table-dense` | 0.75rem cell padding |

### 1.4 Radius

| Token | Tailwind | Base |
|-------|----------|------|
| sm | `rounded-sm` | `--radius - 4px` |
| md | `rounded-md` | `--radius - 2px` |
| lg | `rounded-lg` | `--radius` (0.5rem) |
| xl | `rounded-xl` | `--radius + 4px` |
| 2xl | `rounded-2xl` | `--radius + 8px` |

PM primitives default to **`rounded-xl`** for cards (Linear-style restraint).

### 1.5 Shadow

| Utility | Variable | Use |
|---------|----------|-----|
| `.pm-shadow-card` | `--shadow-card` | Cards, stat tiles |
| `.pm-shadow-panel` | `--shadow-panel` | Hover elevation |
| `.pm-shadow-floating` | `--shadow-floating` | Popovers, dropdowns |
| `.pm-shadow-modal` | `--shadow-modal` | Dialogs |

Shadows use low-opacity oklch — no blur-heavy glass.

### 1.6 Motion (DDS-005)

| Token | Duration | Utility |
|-------|----------|---------|
| fast | 120ms | `.pm-motion-fast`, `.pm-interactive-hover` |
| base | 180ms | `.pm-motion-base`, page/modal enter |
| slow | 240ms | `.pm-motion-slow`, skeleton, empty state |
| spring | 180ms + spring | `.pm-motion-spring`, toasts |

Delays: `--motion-delay-short` (40ms), `--motion-delay-base` (80ms), `--motion-delay-stagger` (60ms).

Distances: `--motion-distance-sm` (4px), `--motion-distance-md` (8px), `--motion-distance-lg` (16px).

Interaction presets: `pmInteraction`, `pmEnter`, `pmLoading`, `pmPipeline`, `pmOverlay`, `pmToast` — see [PM-TWIN-DDS-005-MOTION-SYSTEM.md](./PM-TWIN-DDS-005-MOTION-SYSTEM.md).

`prefers-reduced-motion` collapses transitions globally (existing behavior preserved).

---

## 2. Component list

### 2.1 PM primitives (`web/src/components/ui/`)

| Component | File | Wraps | Purpose |
|-----------|------|-------|---------|
| `PmSurface` | `pm-surface.tsx` | — | Base bordered surface with tone + shadow |
| `PmCard` | `pm-card.tsx` | `PmSurface` / `Card` | Refined card; `composed` mode uses shadcn slots |
| `PmButton` | `pm-button.tsx` | `Button` | Motion + focus ring defaults |
| `PmBadge` | `pm-badge.tsx` | — | Semantic tone badges |
| `PmNavBadge` | `pm-badge.tsx` | `Badge` | Nav/count chips |
| `PmStatCard` | `pm-stat-card.tsx` | `PmCard` | KPI tile |
| `PmSection` | `pm-section.tsx` | — | Section title + body rhythm |
| `PmEmptyState` | `pm-empty-state.tsx` | `PmSurface` | Dashed empty placeholder |
| `PmPageHeader` | `pm-page-header.tsx` | — | Workspace page header |
| `PmReadinessScoreBadge` | `pm-readiness-score-badge.tsx` | `PmBadge` | Readiness percent + completion tier |
| `PmMatchScoreBadge` | `pm-match-score-badge.tsx` | `PmBadge` | Match percent + compatibility tier |
| `PmScoreBadge` | `pm-score-badge.tsx` | typed badges | Unified `type: readiness \| match` delegate |

**Barrel export:** `@/components/ui/pm-index`

### 2.2 DataTable primitives (`web/src/components/data/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PmDataTable` | `pm-data-table.tsx` | Unified list table with responsive cards |
| `PmTableToolbar` | `pm-table-toolbar.tsx` | Table chrome — search, filters, actions |
| `PmTableSearch` | `pm-table-search.tsx` | Search input |
| `PmTableFilter` | `pm-table-filter.tsx` | Filter popover trigger |
| `PmTableColumnToggle` | `pm-table-column-toggle.tsx` | Show/hide columns |
| `PmTablePagination` | `pm-table-pagination.tsx` | Page controls |
| `PmTableBulkActions` | `pm-table-bulk-actions.tsx` | Multi-select action bar |
| `PmTableRowActions` | `pm-table-row-actions.tsx` | Per-row dropdown |
| `PmTableEmpty` | `pm-table-empty.tsx` | Empty list state |
| `PmTableLoading` | `pm-table-loading.tsx` | Skeleton loading |
| `PmTableError` | `pm-table-error.tsx` | Error state |

**Barrel export:** `@/components/data/pm-data-index`

### 2.3 Form primitives (`web/src/components/forms/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PmForm` | `pm-form.tsx` | Form shell with rail, loading, disabled, readonly |
| `PmFormSection` | `pm-form-section.tsx` | Grouped section with title + description |
| `PmFormField` | `pm-form-field.tsx` | Label, required, help, error, success, children |
| `PmFormGrid` | `pm-form-grid.tsx` | 1 / 2 / 3 column responsive grid |
| `PmFormActions` | `pm-form-actions.tsx` | Sticky footer — draft, submit, cancel, delete |
| `PmFormHelp` | `pm-form-help.tsx` | Helper text |
| `PmFormError` | `pm-form-error.tsx` | Inline field error |
| `PmFormSummary` | `pm-form-summary.tsx` | Form-level error summary |
| `PmFormWizard` | `pm-form-wizard.tsx` | Wizard scaffold with rail + footer |
| `PmFormStepper` | `pm-form-stepper.tsx` | Step indicators + progress |
| `PmFormReadonly` | `pm-form-readonly.tsx` | Read-only label/value detail view |

**Barrel export:** `@/components/forms/pm-form-index`

### 2.4 Token helpers (`web/src/components/shared/`)

| Module | Purpose |
|--------|---------|
| `pm-design-tokens.ts` | Class name constants, match-type style map, label formatter |
| `pm-design-tokens.test.ts` | Lightweight unit tests (no React render) |

### 2.5 Legacy (unchanged in Phase 2)

| Component | Location | Status |
|-----------|----------|--------|
| `PageHeader`, `EmptyState`, `StatCard`, `StatusBadge` | `page-primitives.tsx` | Active in all pages |
| shadcn `Button`, `Card`, `Badge`, `Table`, … | `components/ui/` | Active |

---

## 3. Usage rules

### When to use PM primitives

| Scenario | Use |
|----------|-----|
| New UI in Phase 3+ | `PmPageHeader`, `PmSection`, `PmCard`, `PmStatCard`, `PmEmptyState` |
| Semantic status chips | `PmBadge` with `tone` prop |
| Match type labels | `PmBadge` + `resolveMatchTypeStyle()` from token helpers |
| KPI metrics | `PmStatCard` |
| Primary actions in new UI | `PmButton` (or shadcn `Button` until migration) |

### When to keep legacy

| Scenario | Keep using |
|----------|------------|
| Existing pages (Phase 2) | `page-primitives.tsx` exports |
| Workflow entity status with lifecycle labels | `StatusBadge` in `page-primitives` or `shared/StatusBadge.tsx` |
| shadcn forms, selects, tables | Existing `components/ui/*` |

### Do / Don't

| Do | Don't |
|----|-------|
| Use semantic tokens (`bg-surface`, `text-success`) | Hardcode `emerald-500/10` in new code |
| Use `pmTypography.h1` for new headings | Mix arbitrary `text-3xl` without token class |
| Apply `.pm-table-dense` on new admin tables | Invent per-page cell padding |
| Use `PmBadge` tones for categories | Use raw colored spans in new code |
| Keep motion subtle (`pm-motion-fast`) | Add heavy glass, large blurs, or long animations |

---

## 4. Migration rules

### General

1. **One surface at a time** — migrate a page section, not the whole app.
2. **Swap imports** — replace `page-primitives` imports with `pm-*` equivalents.
3. **Preserve props** — `PmPageHeader` mirrors `PageHeader` API; `PmEmptyState` mirrors `EmptyState`.
4. **No business logic** — migration is className/import only.
5. **Verify** — type-check + `npm test` after each migration batch.

### Deprecation path for `page-primitives.tsx`

After full migration, `page-primitives.tsx` becomes a thin re-export:

```tsx
export { PmPageHeader as PageHeader } from '@/components/ui/pm-page-header'
// … etc.
```

Not done in Phase 2.

---

## 5. Duplication replacement map

| Current duplicate | Phase 2 foundation | Phase 3+ target | Notes |
|-------------------|-------------------|-----------------|-------|
| `StatCard` in `page-primitives.tsx` | `PmStatCard` | Replace all stat tiles | Dashboard local `StatCard` merges here |
| `StatCard` in `dashboard-page.tsx` | `PmStatCard` | Dashboard migration | Card-based vs div-based unified |
| `PageHeader` in `page-primitives.tsx` | `PmPageHeader` | All workspace/admin pages | Same props |
| `EmptyState` in `page-primitives.tsx` | `PmEmptyState` | All list pages | Add icon slot |
| `StatusBadge` in `page-primitives.tsx` | `PmBadge` + workflow map (Phase 3) | Workflow statuses | Keep lifecycle label logic in wrapper |
| `StatusBadge` in `shared/StatusBadge.tsx` | `PmWorkflowBadge` (planned) | Lifecycle-aware badge | Wraps `toCanonical` + `PmBadge` |
| `MatchTypeBadge` × 2 | `PmBadge` + `resolveMatchTypeStyle()` | `pipeline-pages`, `related-matches-panel` | Styles centralized in `pm-design-tokens.ts` |
| `AdminTablePage` | `PmDataTable` + `PmTableToolbar` | All admin lists | **Created Phase 5A** — migrate in Phase 5B |
| Deal/Contract detail layout | `PmDetailLayout` + `PmContentCard` + `PmInspectorLayout` | `deals-pages`, `contracts-pages`, `match-detail` | Phase 3 layout ready — migrate in Phase 4+ |
| `getInitials` × 2 | `shared/user-display.ts` (planned) | sidebar, user menu | Pure util |
| `formatRelativeTime` duplicate | `lib/format.ts` only | `notification-center` | Remove local copy on migration |

### Planned components (not in Phase 2)

| Component | Purpose |
|-----------|---------|
| `PmWorkflowBadge` | Lifecycle status + canonical labels |
| `PmMatchTypeBadge` | Thin wrapper over `PmBadge` + token helpers |
| `PmDataTable` | Stripe-dense admin/user table system | **Created Phase 5A** |
| `PmDetailLayout` | Summary + main/inspector columns | **Created Phase 3** |
| `PmEntityCard` | List card for opportunities/matches/deals | Planned |
| `PmWizardLayout` | Opportunity create/edit stepper | **Created Phase 3** |

---

## 6. Import examples

```tsx
import {
  PmPageHeader,
  PmSection,
  PmStatCard,
  PmEmptyState,
  PmCard,
  PmButton,
  PmBadge,
} from '@/components/ui/pm-index'

import { pmTypography, resolveMatchTypeStyle } from '@/components/shared/pm-design-tokens'
```

```tsx
<PmPageHeader
  label="Workspace"
  title="Dashboard"
  description="Overview of your marketplace activity."
  actions={<PmButton>Post opportunity</PmButton>}
/>

<PmSection title="Key metrics">
  <div className="grid gap-4 sm:grid-cols-3">
    <PmStatCard label="Published" value={12} hint="Last 30 days" />
  </div>
</PmSection>

<PmBadge tone="info" uppercase>
  {formatMatchTypeLabel('one_way')}
</PmBadge>
```

---

## 7. Testing

| Layer | Status |
|-------|--------|
| `pm-design-tokens.test.ts` | **6 unit tests** — class constants, match-type helpers |
| `pm-table-*.test.ts` | **19 unit tests** — density, selection, columns, empty helpers |
| `pm-form-*.test.ts` | **26 unit tests** — layout, validation, state, readonly helpers |
| React component render tests | **Not in repo** — existing suite is Node test runner on logic/helpers only |
| Type-check | `npm run type-check` — required pass |
| Full suite | `npm test` — required pass |

**Limitation:** PM primitives are not mount-tested. Phase 3 should add visual regression or Storybook when introduced.

---

## 8. Phase confirmations

| Phase | Check | Status |
|-------|-------|--------|
| 2 | Design tokens documented | Yes |
| 2 | Foundational PM UI components | Yes (8 files + barrel) |
| 3 | Layout primitives documented | Yes (§10) |
| 4 | Workspace shell redesigned | Yes (§11) |
| 4 | Entity page migration | **No** |
| 5A | DataTable system | Yes (§12) |
| 5A | Admin/User page migration | **No** |
| 5B | Form system | Yes (§13) |
| 5B | Admin/User page migration | **No** |
| 6 | Admin experience migrated | Yes (§14) |
| 6 | User workspace migration | **No** |
| 7 | Started | **No** |
| All | Business logic changed | **No** |
| All | Existing UI broken | **No** — legacy pages untouched |

---

## 9. File reference

```
web/src/index.css                          # Token source of truth
web/src/components/shared/pm-design-tokens.ts
web/src/components/shared/pm-design-tokens.test.ts
web/src/components/ui/pm-surface.tsx
web/src/components/ui/pm-card.tsx
web/src/components/ui/pm-button.tsx
web/src/components/ui/pm-badge.tsx
web/src/components/ui/pm-stat-card.tsx
web/src/components/ui/pm-section.tsx
web/src/components/ui/pm-empty-state.tsx
web/src/components/ui/pm-page-header.tsx
web/src/components/ui/pm-index.ts
web/src/components/shared/pm-layout-tokens.ts
web/src/components/shared/pm-layout-tokens.test.ts
web/src/components/layout/pm-page-layout.tsx
web/src/components/layout/pm-detail-layout.tsx
web/src/components/layout/pm-dashboard-layout.tsx
web/src/components/layout/pm-split-layout.tsx
web/src/components/layout/pm-layout-chrome.tsx
web/src/components/layout/pm-layout-panels.tsx
web/src/components/layout/pm-layout-index.ts
web/src/components/layout/app-shell.tsx
web/src/components/layout/app-sidebar.tsx
web/src/components/layout/app-header.tsx
web/src/components/layout/workspace-switcher.tsx
web/src/components/layout/workspace-header.tsx
web/src/components/layout/workspace-display.ts
web/src/components/layout/global-search.tsx
web/src/components/layout/quick-create-menu.tsx
web/src/components/layout/theme-toggle.tsx
web/src/components/layout/page-chrome.tsx
web/src/components/layout/notification-display.ts
web/src/components/layout/recent-pages.ts
web/src/components/layout/workspace-shell.test.ts
web/src/components/data/pm-data-table.tsx
web/src/components/data/pm-table-toolbar.tsx
web/src/components/data/pm-table-search.tsx
web/src/components/data/pm-table-filter.tsx
web/src/components/data/pm-table-column-toggle.tsx
web/src/components/data/pm-table-pagination.tsx
web/src/components/data/pm-table-bulk-actions.tsx
web/src/components/data/pm-table-row-actions.tsx
web/src/components/data/pm-table-empty.tsx
web/src/components/data/pm-table-empty-helpers.ts
web/src/components/data/pm-table-loading.tsx
web/src/components/data/pm-table-error.tsx
web/src/components/data/pm-table-selection.ts
web/src/components/data/pm-table-density.ts
web/src/components/data/pm-table-columns.ts
web/src/components/data/pm-data-index.ts
web/src/components/data/pm-table-density.test.ts
web/src/components/data/pm-table-selection.test.ts
web/src/components/data/pm-table-columns.test.ts
web/src/components/data/pm-table-empty.test.ts
web/src/components/forms/pm-form.tsx
web/src/components/forms/pm-form-section.tsx
web/src/components/forms/pm-form-field.tsx
web/src/components/forms/pm-form-grid.tsx
web/src/components/forms/pm-form-actions.tsx
web/src/components/forms/pm-form-help.tsx
web/src/components/forms/pm-form-error.tsx
web/src/components/forms/pm-form-summary.tsx
web/src/components/forms/pm-form-wizard.tsx
web/src/components/forms/pm-form-stepper.tsx
web/src/components/forms/pm-form-readonly.tsx
web/src/components/forms/pm-form-layout.ts
web/src/components/forms/pm-form-validation.ts
web/src/components/forms/pm-form-state.ts
web/src/components/forms/pm-form-readonly-helpers.ts
web/src/components/forms/pm-form-index.ts
web/src/components/forms/pm-form-layout.test.ts
web/src/components/forms/pm-form-validation.test.ts
web/src/components/forms/pm-form-state.test.ts
web/src/pages/admin/admin-pages.tsx
web/src/pages/admin/admin-list-page.tsx
web/src/pages/admin/admin-display.tsx
web/src/pages/admin/admin-display.test.ts
docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md        # This document
```

---

## 10. Layout system (Phase 3)

### 10.1 Layout hierarchy

Every workspace and admin page should eventually follow this vertical rhythm (Linear hierarchy + Stripe spacing):

```txt
PmPageLayout
├── PmPageHeader          (or header slot)
├── PmToolbar             (optional — search, filters, view toggles)
├── Content region
│   ├── PmDetailLayout / PmDashboardLayout / PmSplitLayout / PmWizardLayout
│   └── PmContentCard / PmMetricGrid / tables (Phase 4+)
├── Activity / Timeline   (optional)
└── PmActionBar           (optional — wizard footer, bulk actions)
```

**Import:** `@/components/layout/pm-layout-index`

### 10.2 Layout components

| Component | File | Purpose |
|-----------|------|---------|
| `PmPageLayout` | `pm-page-layout.tsx` | Top-level page scaffold with optional inspector rail |
| `PmContentLayout` | `pm-page-layout.tsx` | Width + padding wrapper (`default` / `narrow` / `wide` / `full`) |
| `PmDetailLayout` | `pm-detail-layout.tsx` | Main 2/3 + inspector 1/3 + timeline + actions |
| `PmInspectorLayout` | `pm-detail-layout.tsx` | Right-rail panel with sticky header |
| `PmDashboardLayout` | `pm-dashboard-layout.tsx` | Header → KPIs → charts → main + aside |
| `PmMetricGrid` | `pm-dashboard-layout.tsx` | Responsive KPI grid (3 or 4 columns) |
| `PmSplitLayout` | `pm-split-layout.tsx` | Master-detail: list left, detail right |
| `PmSidebarLayout` | `pm-split-layout.tsx` | Secondary sidebar + main (left or right) |
| `PmWizardLayout` | `pm-split-layout.tsx` | Stepper → form (+ readiness rail) → footer |
| `PmToolbar` | `pm-layout-chrome.tsx` | Sticky page toolbar |
| `PmActionBar` | `pm-layout-chrome.tsx` | Sticky footer actions |
| `PmStickyHeader` | `pm-layout-chrome.tsx` | Sticky sub-header (filters, inspector title) |
| `PmSectionHeader` | `pm-layout-chrome.tsx` | In-page section title row |
| `PmContentCard` | `pm-layout-panels.tsx` | Titled content section card |
| `PmScrollablePanel` | `pm-layout-panels.tsx` | Bounded scroll region |

**Token helpers:** `pm-layout-tokens.ts` — breakpoints, grid class maps, sticky offsets.

### 10.3 When to use each layout

| Page type | Layout | Example routes (future migration) |
|-----------|--------|----------------------------------|
| List + filters | `PmPageLayout` + `PmToolbar` + grid/table | `/opportunities`, `/admin/users` |
| Dashboard | `PmDashboardLayout` + `PmMetricGrid` | `/dashboard`, `/admin` |
| Entity detail | `PmDetailLayout` + `PmContentCard` + `PmInspectorLayout` | `/deals/:id`, `/contracts/:id`, `/matches/:id` |
| Master-detail | `PmSplitLayout` | `/messages`, admin negotiation inspector |
| Multi-step form | `PmWizardLayout` + `PmActionBar` | `/opportunities/create` |
| Settings / narrow form | `PmPageLayout` + `PmContentLayout width="narrow"` | `/settings` |
| Admin dense view | `PmContentLayout dense` + `PmToolbar sticky` | `/admin/matching` |

### 10.4 Sticky areas

| Component | Sticky behavior | Offset |
|-----------|-----------------|--------|
| `PmToolbar` | Below app header (`top-14`) | Matches `AppHeader` height |
| `PmStickyHeader` (`offset="toolbar"`) | Below toolbar | Filter row |
| `PmStickyHeader` (default) | Inspector title on mobile; static on desktop lg+ | — |
| `PmActionBar` | Bottom of viewport | Wizard / mutation flows |

Classes defined in `pmSticky` (`pm-layout-tokens.ts`).

### 10.5 Responsive strategy

Breakpoints (Tailwind defaults, documented in `pmBreakpoints`):

| Name | Min width | Behavior |
|------|-----------|----------|
| Mobile | `< 640px` | Single column; split layouts stack (list above detail); toolbar stacks vertically |
| Tablet (`sm`–`md`) | 640–1023px | Metric grids 2 columns; breadcrumbs in mobile header |
| Laptop (`lg`) | 1024px+ | Detail 2+1 grid; split panes side-by-side; wizard readiness rail |
| Desktop (`xl`) | 1280px+ | Dashboard aside column; wider content utilization |
| Wide (`2xl`) | 1536px+ | Optional `PmContentLayout width="wide"` for admin analytics |

**Rules:**

- Never hide primary actions on mobile — move to `PmActionBar`.
- Split layouts use `PmScrollablePanel` with `native` on long lists for touch scroll.
- Inspector rail stacks below main content below `lg`.
- Sticky toolbars use backdrop blur at low opacity — no heavy glass.

### 10.6 Layout migration strategy

1. **Shell first** — wrap page body in `PmPageLayout` without changing inner content.
2. **Header swap** — replace `PageHeader` with `PmPageHeader` in `header` slot.
3. **Structure** — replace ad-hoc grids with `PmDetailLayout` / `PmDashboardLayout`.
4. **Chrome** — extract filter rows to `PmToolbar`; wizard footers to `PmActionBar`.
5. **Cards** — replace raw `Card` blocks with `PmContentCard` on detail pages.
6. **Shell** — completed in Phase 4 (`AppShell`, sidebar, topbar).

| Legacy pattern | PM layout target |
|----------------|------------------|
| `ContentContainer` + manual `space-y-6` | `PmPageLayout` inside existing shell |
| Deal/contract `lg:grid-cols-3` | `PmDetailLayout` |
| Dashboard stat grid | `PmDashboardLayout` + `PmMetricGrid` |
| Messages `lg:grid-cols-3` | `PmSplitLayout` |
| Opportunity wizard inline | `PmWizardLayout` |
| `AdminTablePage` wrapper | `PmPageLayout` + `PmTableToolbar` + `PmDataTable` |

### 10.7 Layout import example

```tsx
import { PmPageHeader } from '@/components/ui/pm-index'
import {
  PmPageLayout,
  PmDetailLayout,
  PmContentCard,
  PmInspectorLayout,
  PmToolbar,
  PmMetricGrid,
} from '@/components/layout/pm-layout-index'
import { PmStatCard } from '@/components/ui/pm-index'

<PmPageLayout
  header={<PmPageHeader title="Deal" description="Collaboration summary" />}
  toolbar={<PmToolbar leading={<SearchInput />} trailing={<StatusFilter />} />}
>
  <PmDetailLayout
    main={
      <>
        <PmContentCard title="Linked records">{/* … */}</PmContentCard>
        <PmContentCard title="Participants">{/* … */}</PmContentCard>
      </>
    }
    inspector={
      <PmInspectorLayout header="Lifecycle" footer={<StageActions />}>
        {/* sidebar actions */}
      </PmInspectorLayout>
    }
  />
</PmPageLayout>
```

### 10.8 Layout testing

| Layer | Status |
|-------|--------|
| `pm-layout-tokens.test.ts` | **6 unit tests** — breakpoints, grids, metric resolver |
| React layout mount tests | **Not in repo** — same limitation as Phase 2 primitives |
| Type-check / full suite | Required pass on every phase |

---

## 11. Navigation & workspace shell (Phase 4)

### 11.1 Shell architecture

```txt
SidebarProvider
├── AppSidebar
│   ├── WorkspaceSwitcher
│   ├── Nav groups (active indicator)
│   └── Sign out
└── SidebarInset
    ├── AppHeader (sticky)
    │   ├── SidebarTrigger
    │   ├── Workspace title + Breadcrumbs
    │   ├── GlobalSearch
    │   ├── QuickCreateMenu
    │   ├── NotificationCenter
    │   ├── ThemeToggle
    │   └── UserMenu
    ├── RecentPageTracker (localStorage, UI only)
    └── AppPageChrome → Outlet (entity pages unchanged)
CommandMenu (global palette)
```

### 11.2 Navigation components

| Component | Purpose |
|-----------|---------|
| `AppShell` | Root authenticated layout |
| `AppSidebar` | Grouped nav, collapsible icon mode, mobile drawer via shadcn |
| `AppHeader` | Sticky topbar with workspace context |
| `WorkspaceSwitcher` | Workspace dropdown + multi-tenant placeholder |
| `PageBreadcrumbs` | Route-aware crumbs; admin-aware home link |
| `GlobalSearch` | Opens command palette (`Ctrl+K`) |
| `QuickCreateMenu` | Create opportunity / company dashboard shortcuts |
| `ThemeToggle` | Light / dark / system in topbar |
| `NotificationCenter` | Grouped feed, icons, empty state (logic unchanged) |
| `UserMenu` | Profile links + sign out |
| `CommandMenu` | Navigation, recent pages, quick actions, coming-soon placeholders |
| `WorkspaceHeader` | Reusable page header for entity migration (not used in shell) |
| `AppPageChrome` | Standard content padding + enter motion |

### 11.3 Sidebar rules

- **Groups** use uppercase muted labels (Workspace, Opportunities, Collaboration, …).
- **Active item** — inset primary left border + accent background (`data-[active=true]`).
- **Icons** — fixed `size-4`, aligned with label baseline.
- **Badges** — `PmNavBadge` for counts (messages, notifications in nav config).
- **Collapse** — icon-only mode via shadcn `collapsible="icon"`; `WorkspaceSwitcher` collapses to icon link.
- **Keyboard** — `Ctrl/Cmd+B` toggles sidebar (shadcn default); tooltips on collapsed items.
- **Admin** — separate nav tree; “Back to workspace” when in admin area.
- **Future** — `WorkspaceSwitcher` reserved for multi-tenant workspaces.

### 11.4 Topbar rules

- **Height** — `h-14` (3.5rem); sticky with light backdrop blur.
- **Mobile** — workspace title + compact search icon; breadcrumbs in strip below header.
- **Tablet+** — breadcrumbs inline; centered search (`max-w-md` → `lg`).
- **Desktop (`xl`)** — workspace label column beside breadcrumbs.
- **Actions order** (right): Search (mobile) → Create → Notifications → Theme → Profile.

### 11.5 Command palette

| Section | Content |
|---------|---------|
| Recent | Last 5 routes from `recent-pages.ts` (localStorage) |
| Navigation | `mainNavigation` groups |
| Quick actions | `commandActions` from config |
| Account | Profile, settings, sign out |
| Admin | Admin nav groups (RBAC-gated display only) |
| Coming soon | Disabled placeholder commands |

No backend — navigation uses existing `react-router` + config.

### 11.6 Notifications (visual only)

- Grouped by **Today / Yesterday / Earlier**
- Type-based icons (`notification-display.ts`)
- `formatRelativeTime` from `@/lib/format`
- Unread badge on bell; mark read / mark all unchanged
- `PmEmptyState` when empty

### 11.7 Workspace header (page-level)

Use `WorkspaceHeader` when migrating entity pages:

```tsx
<WorkspaceHeader
  label="Deal"
  title={deal.title}
  subtitle="Created …"
  status={<PmBadge tone="success">Active</PmBadge>}
  primaryAction={<PmButton>Sign contract</PmButton>}
  secondaryActions={<PmButton variant="outline">Back</PmButton>}
/>
```

### 11.8 Responsive navigation

| Breakpoint | Sidebar | Topbar |
|------------|---------|--------|
| Mobile `< md` | Sheet drawer | Title stack; icon search |
| Tablet `md–lg` | Collapsible rail | Breadcrumbs + search |
| Laptop `lg+` | Full sidebar | Full action strip |
| Desktop `xl+` | Full sidebar | Workspace label + breadcrumbs |

### 11.9 Entity page migration (Phase 6+)

Shell, DataTable, and Form infrastructure are complete. Phase 6 migrates **page content only**:

1. Replace `PageHeader` → `WorkspaceHeader` or `PmPageHeader`
2. Wrap body in `PmPageLayout` + domain layouts
3. Replace `AdminTablePage` / ad-hoc tables → `PmDataTable`
4. Replace ad-hoc forms / wizards → `PmForm` / `PmFormWizard`
5. Do **not** modify `AppShell` unless adding global features

---

## 12. DataTable system (Phase 5A)

### 12.1 Overview

`PmDataTable` is the unified list infrastructure for admin and user pages. Phase 5A delivers **reusable primitives only** — no page migrations, no API wiring, no data sorting implementation.

**Import:** `@/components/data/pm-data-index`

Design targets: Linear hierarchy, Stripe table density, Vercel spacing, PM-Twin v2 tokens.

### 12.2 Component map

| Component | File | Purpose |
|-----------|------|---------|
| `PmDataTable` | `pm-data-table.tsx` | Orchestrator — sticky header, slots, responsive |
| `PmTableToolbar` | `pm-table-toolbar.tsx` | Title, description, search, filters, export, bulk, create |
| `PmTableSearch` | `pm-table-search.tsx` | Search input with icon |
| `PmTableFilter` | `pm-table-filter.tsx` | Filter button + popover slot |
| `PmTableColumnToggle` | `pm-table-column-toggle.tsx` | Column visibility dropdown |
| `PmTablePagination` | `pm-table-pagination.tsx` | Page size + prev/next controls |
| `PmTableBulkActions` | `pm-table-bulk-actions.tsx` | Selected-count bar + action slot |
| `PmTableRowActions` | `pm-table-row-actions.tsx` | View / Edit / Delete / Duplicate dropdown |
| `PmTableEmpty` | `pm-table-empty.tsx` | Icon, title, description, primary/secondary actions |
| `PmTableLoading` | `pm-table-loading.tsx` | Skeleton rows (5 / 10 / 20 variants) |
| `PmTableError` | `pm-table-error.tsx` | Error message + retry slot |

### 12.3 PmDataTable capabilities

| Capability | Status |
|------------|--------|
| Sticky header | Yes — `stickyHeader` prop (default `true`) |
| Search / filter / toolbar slots | Yes |
| Bulk actions slot | Yes |
| Row actions slot | Yes |
| Empty / loading / error states | Yes |
| Pagination slot | Yes |
| Density modes (`comfortable` / `compact`) | Yes — uses `.pm-table-dense` for compact |
| Sorting UI | Yes — controlled `sortColumnId` + `onSortChange` (no data sort) |
| Column visibility API | Yes — controlled `columnVisibility` + `PmTableColumnToggle` |
| Selection (single / multiple / select-all / indeterminate) | Yes — controlled via `selection` helpers |
| Responsive | Yes — table `sm+`, cards `< sm` |
| API wiring | **No** — Phase 5B+ |

### 12.4 Toolbar

`PmTableToolbar` composes:

- **Title** + **description** (optional header row)
- **Search** slot (`PmTableSearch` or custom)
- **Filter** slot (`PmTableFilter` or custom)
- **Export** placeholder button (`showExport` — no implementation)
- **Bulk actions** bar (auto-shown when `selectedCount > 0`)
- **Create** action slot (top-right when title present)
- **Column toggle** + trailing slot

Pair with `PmPageLayout` toolbar or use standalone inside `PmDataTable.toolbar`.

### 12.5 Selection model

Pure helpers in `pm-table-selection.ts`:

| Helper | Purpose |
|--------|---------|
| `createSelectionState(mode)` | Initialize `none` / `single` / `multiple` |
| `toggleRowSelection(state, rowId)` | Toggle one row |
| `toggleSelectAll(state, visibleRowIds)` | Select/deselect all visible |
| `resolveHeaderCheckboxState(state, rowIds)` | `unchecked` / `checked` / `indeterminate` |
| `clearSelection(state)` | Reset |
| `hasSelection(state)` | Bulk bar visibility |

Controlled pattern — parent owns state, passes `selection` + `onSelectionChange` to `PmDataTable`. No backend persistence.

### 12.6 Density

| Mode | Behavior |
|------|----------|
| `comfortable` | Default cell padding (`p-3`, `h-12` headers) |
| `compact` | Applies `.pm-table-dense` token + tighter skeleton rows |

Helpers: `resolveTableDensityClasses`, `resolveTableCellPadding`, `normalizeTableDensity`.

**Future:** user preference hook — reserved via `normalizeTableDensity`; no localStorage in Phase 5A.

### 12.7 Empty, loading, and error states

**Empty** (`PmTableEmpty`):

- Variants: `no-data`, `no-results`, `error-recovery` via `resolveTableEmptyState`
- Slots: icon, title, description, primary action, secondary action (`PmTableEmptySecondaryAction`)

**Loading** (`PmTableLoading`):

- Skeleton header + body rows
- `rowCount`: `5` | `10` | `20`
- Respects density + selection/actions column flags

**Error** (`PmTableError`):

- Alert layout with optional `retryAction` slot or `onRetry` button (visual only)

### 12.8 Responsive tables

| Breakpoint | Layout |
|------------|--------|
| Desktop / tablet (`sm+`) | Full table inside `PmSurface`; horizontal scroll in bounded container; sticky thead |
| Tablet | Same table with reduced toolbar wrapping (Tailwind `sm:` breakpoints) |
| Mobile (`< sm`) | Stacked `PmSurface` cards per row; label + value pairs; row actions top-right |

Override mobile layout with `renderMobileCard(row, visibleColumns)`.

Documented attributes: `data-responsive="table"` / `data-responsive="cards"`.

### 12.9 Column visibility

| Rule | Behavior |
|------|----------|
| `hideable: false` | Column always visible (e.g. ID, primary label) |
| `hideable: true` (default) | Togglable via `PmTableColumnToggle` |
| `defaultVisible: false` | Hidden until user enables |

Helpers: `buildDefaultColumnVisibility`, `resolveVisibleColumns`, `toggleColumnVisibility`.

### 12.10 Row actions

`PmTableRowActions` dropdown (visual only):

- View, Edit, Duplicate, Delete (configurable via `hiddenActions`)
- Destructive styling on Delete
- `children` slot for custom menu items

### 12.11 Import example

```tsx
import {
  PmDataTable,
  PmTableToolbar,
  PmTableSearch,
  PmTableFilter,
  PmTablePagination,
  PmTableRowActions,
  PmTableColumnToggle,
  createSelectionState,
  toggleRowSelection,
  buildDefaultColumnVisibility,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmButton } from '@/components/ui/pm-index'

const columns: PmDataTableColumn<Row>[] = [
  { id: 'name', label: 'Name', sortable: true, cell: (r) => r.name },
  { id: 'status', label: 'Status', cell: (r) => r.status },
]

<PmDataTable
  columns={columns}
  data={rows}
  getRowId={(r) => r.id}
  density="compact"
  toolbar={
    <PmTableToolbar
      title="Users"
      description="Manage platform users."
      search={<PmTableSearch placeholder="Search users…" />}
      filters={<PmTableFilter activeCount={2}>{/* filter panel */}</PmTableFilter>}
      columnToggle={
        <PmTableColumnToggle
          columns={columns}
          visibility={visibility}
          onVisibilityChange={setVisibility}
        />
      }
      createAction={<PmButton size="sm">Add user</PmButton>}
      showExport
    />
  }
  rowActions={() => (
    <PmTableRowActions onView={() => {}} onEdit={() => {}} />
  )}
  pagination={
    <PmTablePagination page={1} pageSize={20} totalItems={100} />
  }
/>
```

### 12.12 Migration guide (Phase 6)

1. **One list at a time** — migrate a single admin or user list page per PR.
2. **Keep data layer unchanged** — page still calls existing APIs/repositories; only presentation swaps.
3. **Replace `AdminTablePage`** — use `PmPageLayout` + `PmTableToolbar` + `PmDataTable`.
4. **Map columns** — convert string column arrays to `PmDataTableColumn<T>` with `cell` renderers.
5. **Wire search/filters** — connect existing page state to `PmTableSearch` / `PmTableFilter` (UI already supports controlled props).
6. **Defer sorting/pagination API** — use controlled props; implement server-side sort/page when backend ready.
7. **Verify** — type-check + `npm test` after each page migration.
8. **Do not** modify `packages/*`, `domain/*`, `commands/*`, `services/*`, or `repositories/*`.

| Legacy | Phase 6 target |
|--------|-----------------|
| `AdminTablePage` in `admin-pages.tsx` | `PmDataTable` + toolbar |
| shadcn `Table` on list pages | `PmDataTable` |
| `EmptyState` on lists | `PmTableEmpty` |
| Ad-hoc loading spinners | `PmTableLoading` |

### 12.13 DataTable testing

| Layer | Status |
|-------|--------|
| `pm-table-density.test.ts` | **5 tests** |
| `pm-table-selection.test.ts` | **6 tests** |
| `pm-table-columns.test.ts` | **4 tests** |
| `pm-table-empty.test.ts` | **4 tests** |
| React mount tests | **Not in repo** — same limitation as other PM primitives |
| Type-check / full suite | **Pass** (573 tests at Phase 5A) |

---

## 13. Form system (Phase 5B)

### 13.1 Overview

`PmForm` is the unified form infrastructure for admin and user pages. Phase 5B delivers **reusable primitives only** — no page migrations, no validation logic changes, no API wiring.

**Import:** `@/components/forms/pm-form-index`

Design targets: Stripe field clarity, Linear section hierarchy, Vercel density, PM-Twin v2 tokens.

### 13.2 Component map

| Component | File | Purpose |
|-----------|------|---------|
| `PmForm` | `pm-form.tsx` | Form shell — loading, disabled, readonly, rail slot |
| `PmFormSection` | `pm-form-section.tsx` | Bordered section with title + description |
| `PmFormField` | `pm-form-field.tsx` | Accessible field wrapper for existing inputs |
| `PmFormGrid` | `pm-form-grid.tsx` | 1 / 2 / 3 column field grid |
| `PmFormActions` | `pm-form-actions.tsx` | Sticky footer — draft, submit, cancel, delete |
| `PmFormHelp` | `pm-form-help.tsx` | Helper text |
| `PmFormError` | `pm-form-error.tsx` | Inline field error with icon |
| `PmFormSummary` | `pm-form-summary.tsx` | Form-level error list |
| `PmFormWizard` | `pm-form-wizard.tsx` | Wizard body + rail + footer |
| `PmFormStepper` | `pm-form-stepper.tsx` | Steps, progress bar, status indicators |
| `PmFormReadonly` | `pm-form-readonly.tsx` | Detail view label/value pairs |

### 13.3 PmForm capabilities

| Capability | Status |
|------------|--------|
| Form shell | Yes |
| Section title + description | Yes |
| Field label, required, optional markers | Yes |
| Helper, hint, error, success text | Yes |
| Inline validation display | Yes — UI only |
| Form-level summary | Yes |
| 1 / 2 / 3 column grid | Yes |
| Sticky action footer | Yes — uses `pmSticky.actionFooter` |
| Loading / disabled / readonly modes | Yes |
| Wizard stepper + progress | Yes |
| Right-side rail slot | Yes — form + wizard |
| Responsive behavior | Yes — grids stack on mobile |
| Validation logic / API wiring | **No** — Phase 6+ |

### 13.4 Field patterns

`PmFormField` wraps existing shadcn `Input`, `Select`, `Textarea` — does **not** replace them.

| Prop | Purpose |
|------|---------|
| `label` | Connected via `htmlFor` / `id` |
| `description` | Above control — section-level field intro |
| `required` | Asterisk + `aria-required` + sr-only "(required)" |
| `optional` | "Optional" caption — not color-only |
| `help` | Persistent helper below control |
| `hint` | Secondary hint text |
| `error` | Inline error via `PmFormError` + `aria-invalid` |
| `success` | Positive feedback when no error |
| `children` | Control slot — receives aria props via clone |

Helpers: `resolveFieldValidationState`, `resolveFieldDescribedByIds`, `shouldShowFieldError`.

### 13.5 Validation display

Display-only — no schema or command validation changes.

| Layer | Component | When shown |
|-------|-----------|------------|
| Field error | `PmFormError` | `error` set and touched |
| Field success | inline `<p role="status">` | `success` set, no error |
| Form summary | `PmFormSummary` | One or more errors in `errors` record |

`collectFormErrors` aggregates field errors for the summary list.

### 13.6 Action footer

`PmFormActions` sticky footer supports:

| Action | Prop | Notes |
|--------|------|-------|
| Submit | `onSubmit` / `submitLabel` | Shows spinner when `loading` |
| Save draft | `onSaveDraft` | Outline variant |
| Cancel | `onCancel` | Outline variant |
| Delete | `onDelete` | Ghost danger styling |
| Secondary | `secondaryActions` | Custom slot |
| Custom | `children` | Leading group |

Visual only — no behavior or command gateway changes.

### 13.7 Wizard pattern

`PmFormWizard` + `PmFormStepper` for multi-step flows (Opportunity Wizard migration target).

| Feature | Implementation |
|---------|----------------|
| Steps | `steps` array with `id`, `label`, `optional` |
| Active step | `activeStepId` |
| Completed | `completedStepIds` — checkmark indicator |
| Error step | `errorStepIds` — danger styling |
| Optional step | `optional: true` — "(optional)" label |
| Progress | Bar + percentage from required steps |
| Footer | `footer` slot — typically `PmFormActions` |
| Rail | `rail` slot — readiness / help panel |
| Step content | `PmFormWizardStep` — conditional render |

Helpers: `resolveWizardStepStatus`, `resolveWizardProgress`, `isWizardStepNavigable`.

Pairs with existing `PmWizardLayout` from layout system — form wizard adds step state UI.

### 13.8 Read-only detail pattern

`PmFormReadonly` + `PmFormReadonlySection` + `PmFormReadonlyField`:

| Feature | Behavior |
|---------|----------|
| Label/value pairs | Semantic `<dl>` grid |
| Grouped sections | `PmFormReadonlySection` with optional border |
| Empty fallback | `—` default via `resolveReadonlyValue` |
| Copyable values | `copyable` + `onCopy` on field |
| Boolean / array formatting | Built-in helpers |

Use on entity detail inspectors and read-only settings views.

### 13.9 Accessibility

| Rule | Implementation |
|------|----------------|
| Labels connected | `Label htmlFor` + control `id` |
| Errors readable | `role="alert"` on `PmFormError` and summary |
| Required not color-only | Asterisk + sr-only "(required)" |
| Focus visible | `pm-focus-ring` on inputs; stepper buttons |
| Disabled clear | `pointer-events-none` + opacity on form shell |
| Described by | `aria-describedby` merges help, hint, error, success ids |

### 13.10 Import example

```tsx
import {
  PmForm,
  PmFormSection,
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
  PmFormActions,
  PmFormSummary,
} from '@/components/forms/pm-form-index'
import { Input } from '@/components/ui/input'

<PmForm
  onSubmit={(e) => e.preventDefault()}
  footer={
    <PmFormActions
      onCancel={() => {}}
      onSaveDraft={() => {}}
      onSubmit={() => {}}
      submitLabel="Publish"
    />
  }
>
  <PmFormSummary errors={{ title: 'Title is required' }} />
  <PmFormSection title="Basics" description="Core opportunity details.">
    <PmFormGrid columns={2}>
      <PmFormField id="title" label="Title" required error={errors.title}>
        <Input placeholder="e.g. Senior PM for NEOM" />
      </PmFormField>
      <PmFormGridItem gridColumns={2}>
        <PmFormField id="location" label="Location" optional help="City or region.">
          <Input />
        </PmFormField>
      </PmFormGridItem>
    </PmFormGrid>
  </PmFormSection>
</PmForm>
```

### 13.11 Migration guide (Phase 6)

1. **One form at a time** — migrate a single create/edit flow per PR.
2. **Keep validation logic** — existing page validation stays; wire errors to `PmFormField.error`.
3. **Wrap, don't replace** — keep shadcn inputs inside `PmFormField`.
4. **Opportunity wizard** — replace inline step UI with `PmFormWizard` + `PmFormStepper`.
5. **Detail read-only blocks** — replace ad-hoc label/value divs with `PmFormReadonly`.
6. **Verify** — type-check + `npm test` after each migration.
7. **Do not** modify `packages/*`, `domain/*`, `commands/*`, `services/*`, or `repositories/*`.

| Legacy | Phase 6 target |
|--------|----------------|
| Inline form sections in `opportunities-pages.tsx` | `PmFormWizard` + `PmFormSection` |
| `ApplyWizard` field layout | `PmFormField` + `PmFormGrid` |
| Ad-hoc sticky footers | `PmFormActions` |
| Detail label/value blocks | `PmFormReadonly` |
| Raw shadcn `Label` + `Input` pairs | `PmFormField` wrapper |

### 13.12 Form testing

| Layer | Status |
|-------|--------|
| `pm-form-layout.test.ts` | **5 tests** |
| `pm-form-validation.test.ts` | **7 tests** |
| `pm-form-state.test.ts` | **7 tests** |
| `pm-form-readonly-helpers.test.ts` | **7 tests** |
| React mount tests | **Not in repo** |
| Type-check / full suite | **Pass** (599 tests) |

---

*Phase 6 complete — Phases 7A–7C + Phase 8 consistency audit complete.*

---

## 14. Admin migration (Phase 6)

### 14.1 Overview

Admin pages in `web/src/pages/admin/admin-pages.tsx` now use v2 layout, DataTable, Form, and badge primitives. **User workspace pages are untouched.**

| Helper | File | Purpose |
|--------|------|---------|
| `AdminListPage` | `admin-list-page.tsx` | `PmPageLayout` + `PmDataTable` + search + pagination |
| `AdminStatusBadge` | `admin-display.tsx` | `PmBadge` + lifecycle tone mapping |
| `resolveAdminStatusTone` | `admin-display.tsx` | Pure tone resolver for tests |

### 14.2 Admin dashboard layout

`AdminDashboardPage` uses:

- `PmDashboardLayout` — header, metrics, main, aside
- `PmPageHeader` — admin command center title
- `PmMetricGrid` + `PmStatCard` — platform KPIs (dense)
- `PmSectionHeader` — readiness + matching quality sections
- `PmContentCard` — profile/opportunity readiness breakdowns, quick actions, recent activity

KPI calculations unchanged — same `buildReadinessAnalytics` and `buildMatchingQualityAnalytics` calls.

### 14.3 Admin table usage

List pages use `AdminListPage` which composes:

| Piece | Component |
|-------|-----------|
| Page chrome | `PmPageLayout` + `PmPageHeader` |
| Table | `PmDataTable` (`density="compact"`) |
| Toolbar | `PmTableToolbar` + `PmTableSearch` (UI-only client filter) |
| Pagination | `PmTablePagination` (client-side) |
| Row actions | `PmTableRowActions` (View → navigate) |
| Empty | `PmTableEmpty` |
| Mobile | PmDataTable card fallback (`< sm`) |

**Migrated list pages:** Users, Vetting, Opportunities, Negotiations, Deals, Consortium, Audit, Subscriptions, Disputes (empty), Contracts (empty).

**Special case:** `AdminMatchingPage` — inline `PmDataTable` for matching runs + recent matches; run button in `PmPageHeader` actions.

### 14.4 Admin forms / settings

| Page | v2 pattern |
|------|------------|
| `AdminSettingsPage` | `PmForm` + `PmFormSection` (read-only placeholder) |
| `AdminUserDetailPage` | `PmFormReadonly` + `PmFormReadonlySection` + fields |
| `AdminNegotiationDetailPage` | `PmPageLayout` + `PmContentCard` placeholder |

Validation and submit behavior unchanged — settings remain unwired placeholders.

### 14.5 Badge consistency

`AdminStatusBadge` replaces `StatusBadge` on admin pages:

- Uses `PmBadge` semantic tones (`success`, `warning`, `danger`, `info`, `muted`, `neutral`)
- Entity-aware labels via `formatCanonicalStatusLabel` when `entity` prop provided
- No status value changes

### 14.6 Empty / loading / error states

| Before | After |
|--------|-------|
| Placeholder rows (`['—', 'No items', '—']`) | `PmTableEmpty` with titled description |
| No search on lists | UI-only `PmTableSearch` client filter |
| Skills / CMS placeholders | `PmTableEmpty` via `AdminPlaceholderPage` |

No new async loading or backend error paths invented — matching page retains existing `isRunning` button state only.

### 14.7 Remaining admin gaps

| Area | Status |
|------|--------|
| Companies admin page | **Not in routes** — deferred |
| Notifications admin | **Not in routes** — deferred |
| Roles / Permissions | **Not in routes** — deferred |
| Settings form fields | Placeholder sections — wire in future phase |
| Negotiation detail inspector | Placeholder card |
| Deal/contract admin detail | Reuses workspace detail routes (`DealDetailPage`, `ContractDetailPage`) — not restyled in Phase 6 |
| Server-side table pagination | Client-side only — defer until API ready |
| `PmWorkflowBadge` | Not created — `AdminStatusBadge` used instead |

### 14.8 Admin migration testing

| Layer | Status |
|-------|--------|
| `admin-display.test.ts` | **4 tests** — tone resolver |
| Type-check / full suite | **Pass** (603 tests) |

---

## 15. Opportunity Experience (Phase 7A)

### 15.1 Overview

The opportunity workflow — highest-priority user journey — now uses v2 layout, DataTable, Form, badge, and card primitives. **Messages, notifications, profile, settings, people, and companies pages are untouched.**

| Component | File | Purpose |
|-----------|------|---------|
| `OpportunityDashboardSection` | `opportunity-dashboard-section.tsx` | `PmDashboardLayout` widgets on workspace dashboard |
| `OpportunityCard` | `opportunity-card.tsx` | Premium card for grid + mobile list |
| `OpportunityStatusBadge` | `opportunity-status-badge.tsx` | Canonical status via `PmBadge` |
| `OpportunityTimeline` | `opportunity-timeline.tsx` | Collaboration path + activity events |
| `OpportunityPublishPanel` | `opportunity-publish-experience.tsx` | Draft / ready / blocked / published chrome |
| `OpportunityPublishExperience` | `opportunity-publish-experience.tsx` | Full publish step in wizard |
| Display helpers | `opportunity-display.ts` | Bucket counts, publish visual state, intent labels |

### 15.2 Opportunity dashboard

`DashboardPage` embeds `OpportunityDashboardSection` with:

- `PmDashboardLayout` — metrics, main grid, quick actions, recent activity
- `PmMetricGrid` + `PmStatCard` — My drafts, Published, Matched, Negotiating, Completed
- `OpportunityCard` — recent user opportunities (top 3)
- `PmContentCard` — quick actions + audit recent activity

KPI calculations unchanged — `countOpportunityBuckets` uses existing `resolveCanonicalStatus`.

### 15.3 Opportunity list

`OpportunitiesListPage` in `opportunities-pages.tsx`:

| Piece | Component |
|-------|-----------|
| Desktop table | `PmDataTable` (`density="comfortable"`) |
| Mobile | `OpportunityCard` via `renderMobileCard` |
| Toolbar | `PmTableToolbar` + `PmTableSearch` + status filter |
| Pagination | `PmTablePagination` (client-side 12/24/48) |
| Empty / loading | `PmTableEmpty` |
| Row actions | View, Edit links |

Filtering logic unchanged — search and status filters use existing client-side predicates. Scope filter ("My opportunities") is UI-only presentation.

### 15.4 Opportunity cards

`OpportunityCard` surfaces:

- Title (linked), category sector, intent badge
- Location, updated date
- `OpportunityStatusBadge`, readiness score badge, related matches count
- Primary (View) and secondary (Edit) actions

Uses `PmSurface`, `PmBadge`, `PmButton`. Readiness tone via `getReadinessStatusTone` — no evaluator changes.

### 15.5 Opportunity detail

`OpportunityDetailPage` uses:

- `PmPageLayout` + `PmPageHeader` — title, status, intent, owner actions
- `CollaborationFlowStrip` — active collaboration step (unchanged logic)
- `PmDetailLayout` — main content + inspector + timeline slot
- `OpportunitySummaryCard` — `PmContentCard` overview
- `RelatedMatchesPanel` — `PmContentCard` + `PmBadge` + `PmEmptyState`
- `PmFormReadonly` — budget, timeline, requirements sections
- `OpportunityReadinessCard` + `OpportunityPublishPanel` — inspector sidebar
- `OpportunityTimeline` — activity events in timeline slot

Business rules unchanged — publish via `publishOpportunityUiAction`, matches via `buildOpportunityMatchesReadModel`.

### 15.6 Wizard guidelines

`OpportunityCreatePage` / `OpportunityEditPage` wizard:

```tsx
import {
  PmFormWizard,
  PmFormStepper,
  PmFormSection,
  PmFormField,
  PmFormGrid,
  PmFormActions,
} from '@/components/forms/pm-form-index'
```

| Step | Content |
|------|---------|
| 1 Type | Intent selection |
| 2 Scope | Title, description, sectors |
| 3 Exchange | Model type, location |
| 4 Skills | Core skills multi-select |
| 5 Timeline | Start/end dates |
| 6 Review | Read-only summary |
| 7 Publish | `OpportunityPublishExperience` |

**Preserved:** `buildOpportunityDraftInput`, `handleSaveDraft`, `handlePublish`, `publishOpportunityUiAction`, sessionStorage draft for create-without-id, `OpportunityReadinessCard` evaluation.

**Do not** nest `PmForm` inside `PmFormWizard` — the wizard provides the form wrapper.

Wizard collapses naturally on mobile via `PmFormStepper` responsive layout.

### 15.7 Publish experience

`OpportunityPublishPanel` visual states:

| State | Badge tone | When |
|-------|------------|------|
| Draft | muted | Default draft, needs review |
| Ready | success | Readiness tone = ready |
| Blocked | warning | Readiness incomplete |
| Published | info | Already published / matched / negotiating |

Uses existing `resolveOpportunityReadiness` and `PublishReadinessAlert` — **publish gate logic not modified**.

`resolvePublishVisualState` maps `ready_for_matching` → ready via `getReadinessStatusTone`.

### 15.8 Related matches panel

`RelatedMatchesPanel` redesign only:

- `PmContentCard` container
- Match type badges (`one_way`, `two_way`, `consortium`, `circular`)
- `PmEmptyState` when no matches
- Action buttons unchanged (`acceptPostMatchUiAction`, `StartNegotiationButton`, etc.)

### 15.9 Timeline

`OpportunityTimeline` composes:

1. Collaboration path strip (`COLLABORATION_FLOW_STEPS` from `opportunity-collaboration-constants.ts`)
2. Activity event list with status dots (`done`, `active`, `upcoming`)

Visual only — detail page builds events from `createdAt`, `updatedAt`, and match count. No data model changes.

### 15.10 Migration notes

1. Import opportunity components from `@/components/opportunity/*` — not ad-hoc card markup.
2. List pages → `PmDataTable` + `OpportunityCard` mobile fallback.
3. Create/edit → `PmFormWizard` — one step migration per PR if splitting work.
4. Detail read-only blocks → `PmFormReadonly` sections.
5. Status badges → `OpportunityStatusBadge` or `PmBadge` with canonical tones.
6. **Do not** modify `packages/*`, `domain/*`, `commands/*`, `services/*`, or `repositories/*`.
7. Phase 7B (matches, deals, pipeline, etc.) — **not started**.

| Legacy | Phase 7A target |
|--------|-----------------|
| shadcn `Card` opportunity lists | `PmDataTable` + `OpportunityCard` |
| Inline wizard steps | `PmFormWizard` + `PmFormStepper` |
| `collaboration-flow-strip` only | `OpportunityTimeline` (strip + events) |
| Raw status text | `OpportunityStatusBadge` |
| Dashboard stat cards | `OpportunityDashboardSection` |

### 15.11 Opportunity testing

| Layer | Status |
|-------|--------|
| `opportunity-display.test.ts` | **3 tests** — buckets, publish visual, intent |
| `opportunity-collaboration-ux.test.ts` | Existing — `COLLABORATION_FLOW_STEPS` re-export |
| React mount tests | **Not in repo** |
| Type-check / full suite | **Pass** (see completion report) |

### 15.12 Remaining opportunity gaps

| Area | Status |
|------|--------|
| `ApplyWizard` | Legacy layout — not in Phase 7A scope |
| `publish-readiness-alert.tsx` | Functional — minor visual polish possible |
| Opportunity map view | Migrated chrome only — map library unchanged |
| Server-side list pagination | Client-side only |
| Phase 7B workspace pages | **Complete** — see §16 |

---

*Phase 7A complete — opportunity workflow migrated.*

---

## 16. Collaboration Experience (Phase 7B)

### 16.1 Overview

The collaboration lifecycle — Post Match → Negotiation → Deal → Contract — now uses a unified v2 experience. **Profile, messages, notifications, settings, search, people, and companies are untouched.**

| Component | File | Purpose |
|-----------|------|---------|
| `PmWorkflowBadge` | `pm-workflow-badge.tsx` | Lifecycle-aware status badge (all entities) |
| `CollaborationTimeline` | `collaboration-timeline.tsx` | Shared path strip + activity events |
| `MatchCard` | `match-card.tsx` | Premium post-match card (mobile) |
| `MatchesListSection` | `matches-list-section.tsx` | Shared `PmDataTable` list for matches |
| Display helpers | `collaboration-display.ts` | Active step, match type tones |

### 16.2 Pipeline

`PipelinePage` uses `PmPageLayout` + `PmPageHeader` with tabbed content:

| Tab | v2 pattern |
|-----|------------|
| Opportunities | `PipelineBoard` with `PmWorkflowBadge` kanban cards |
| Post-matches | `MatchesListSection` (compact) |
| Applications (legacy) | `PmContentCard` + `PipelineBoard` — **hidden by default** (`productFlags.showLegacyApplications === false`, Phase 9.5E) |

`PipelineBoard` kanban cards use `PmWorkflowBadge` and `PmEmptyState` for empty stages. Drag/drop logic unchanged.

### 16.3 Post-matches

`MatchesPage` and pipeline matches tab use `MatchesListSection`:

- Desktop: `PmDataTable` with score, status, topology badges
- Mobile: `MatchCard` via `renderMobileCard`
- Status filter: discovered / accepted / confirmed / declined / expired (UI-only client filter)
- Detail: `MatchDetailPage` with `PmDetailLayout`, `PmStatCard` fit scores, `CollaborationTimeline`

### 16.4 Negotiations

`NegotiationDetailPage` (no workspace list route exists):

- `PmPageLayout` + `PmPageHeader` with workflow badge and action buttons
- `PmDetailLayout` — discussion main + actions inspector
- `PmFormReadonly` for participants and current offer
- `CollaborationTimeline` with negotiation history events
- Cross-links to match and deal

Negotiation workflow (`transitionNegotiationStatusUiAction`, agree/cancel/create deal) unchanged.

### 16.5 Deals

`DealsPage` — `PmDataTable` + mobile `DealListCard`, search, pagination, `PmTableEmpty`.

`DealDetailPage` — `PmDetailLayout`:

- Main: linked records (`PmFormReadonly`), participants, commercial terms
- Inspector: `DealStageActions`, contract creation/link
- Timeline: `CollaborationTimeline`
- Nav links to match, negotiation, opportunities

`DealRatePage` — `PmPageLayout` + `PmContentCard` placeholder.

### 16.6 Contracts

`ContractsPage` — `PmDataTable` + mobile `ContractListCard`.

`ContractDetailPage` — `PmDetailLayout`:

- Main: summary, parties & signatures, milestones/payment schedule, attachments placeholder
- Inspector: scope + sign/complete/terminate actions
- Timeline: `CollaborationTimeline`
- Nav links across collaboration chain

### 16.7 Shared timeline

`CollaborationTimeline` wraps `OpportunityTimeline` with shared visual language:

```
Opportunity → PostMatch → Negotiation → Deal → Contract
```

Active step resolved per entity via `collaboration-display.ts` helpers. Activity events built from entity timestamps — no data model changes.

### 16.8 Status consistency

`PmWorkflowBadge` replaces page-local `StatusBadge` and `MatchTypeBadge` on collaboration pages:

- Entity-aware labels via `formatCanonicalStatusLabel`
- Tone mapping via `resolveWorkflowStatusTone`
- Match topology uses `PmBadge` with `MATCH_TYPE_TONE`

`AdminStatusBadge` now delegates to `PmWorkflowBadge` (admin tests preserved).

### 16.9 Migration notes

1. List pages → `PmDataTable` + mobile card fallback.
2. Detail pages → `PmDetailLayout` (main + inspector + timeline).
3. Status badges → `PmWorkflowBadge` only (no local span badges).
4. Cross-entity nav links preserved at top of detail pages.
5. **Do not** modify `packages/*`, `domain/*`, `commands/*`, `services/*`, or `repositories/*`.
6. Phase 7C — **complete** (see §17).

| Legacy | Phase 7B target |
|--------|-----------------|
| `PageHeader` + shadcn `Card` grids | `PmPageLayout` + `PmDataTable` |
| Manual `lg:grid-cols-3` detail grids | `PmDetailLayout` |
| `StatusBadge` / `MatchTypeBadge` | `PmWorkflowBadge` + `PmBadge` |
| No timeline on match/deal/contract | `CollaborationTimeline` |
| `EmptyState` from page-primitives | `PmEmptyState` / `PmTableEmpty` |

### 16.10 Collaboration testing

| Layer | Status |
|-------|--------|
| `collaboration-display.test.ts` | **3 tests** — step resolution, match tones |
| `admin-display.test.ts` | **4 tests** — tone resolver (via `PmWorkflowBadge`) |
| React mount tests | **Not in repo** |
| Type-check / full suite | **Pass** (609 tests) |

### 16.11 Remaining collaboration gaps

| Area | Status |
|------|--------|
| Negotiations list page (`/negotiations`) | **No route** — detail-only; admin list exists |
| Negotiation discussion UI | Placeholder — terms sheet not wired |
| Contract attachments | Placeholder section |
| Action buttons (`StartNegotiationButton`, etc.) | Still shadcn `Button` internally |
| Server-side pagination | Client-side only |
| Phase 7C | **Complete** — see §17 |

---

*Phase 7B complete — collaboration workflow migrated.*

---

## 17. User Experience (Phase 7C)

### 17.1 Overview

Remaining user-facing workspace pages now use v2 layout, DataTable, Form, and badge primitives. **Opportunity, collaboration, and admin pages are untouched.**

| Component | File | Purpose |
|-----------|------|---------|
| `UserDashboardSection` | `user-dashboard-section.tsx` | Recent activity widgets |
| `PeopleListSection` | `people-list-section.tsx` | Directory `PmDataTable` |
| `PersonCard` | `person-card.tsx` | Mobile person/company card |
| `PublicProfileView` | `public-profile-view.tsx` | Public profile hero + detail |
| `ProfileView` | `profile-view.tsx` | Authenticated profile + readiness |
| `MessagesView` | `messages-view.tsx` | `PmSplitLayout` conversations |
| `NotificationsListSection` | `notifications-list-section.tsx` | Grouped notifications page |
| `SettingsView` | `settings-view.tsx` | Settings form sections |
| Display helpers | `user-display.ts` | Search/scope filters, mock threads |

### 17.2 User dashboard

`DashboardPage` uses `PmPageLayout` + `PmPageHeader` with:

- `UserDashboardSection` — recent opportunities, matches, negotiations, notifications, messages, profile completion, quick actions
- `OpportunityDashboardSection` — unchanged from Phase 7A

Calculations use existing APIs (`opportunitiesApi`, `matchesApi`, `negotiationsApi`, `notificationsApi`, `resolveProfileReadiness`).

### 17.3 Profile

`ProfilePage` uses `PmDetailLayout`:

- Main: `PmForm` + `PmFormReadonly` sections (summary, skills, services, experience, portfolio, company)
- Inspector: `ProfileReadinessCard`

No profile evaluator or readiness logic changes.

### 17.4 Public profile

`PersonProfilePage` / `PublicProfileView`:

- Hero gradient section with entity badge
- Summary, skills badges, portfolio placeholder
- Inspector: statistics, company block, achievement badges
- Resolves users and companies via `peopleApi.get`

### 17.5 Messages

`MessagesPage` uses `PmSplitLayout`:

- Left: conversation list (`PmContentCard`)
- Right: thread, composer, attachments placeholder, typing placeholder
- Mock threads preserved from legacy page (`MOCK_MESSAGE_THREADS`)
- Collapses naturally on mobile (stacked split layout)

### 17.6 Notifications

`NotificationsPage` uses `NotificationsListSection`:

- Desktop: `PmDataTable` with read/unread filter
- Mobile: grouped cards via `groupNotifications` (Today / Yesterday / Earlier)
- Icons via `resolveNotificationIcon`
- Relative time via `formatNotificationTime`
- Mark-all-read uses existing `notificationsApi.markAllRead`

### 17.7 People & companies

`PeoplePage` uses `PeopleListSection`:

- `PmDataTable` desktop + `PersonCard` mobile
- Client-side search (name, headline, location, skills) — same predicate scope as legacy filter
- Entity type filter: All / Professionals / Companies (UI-only)
- Companies identified via `peopleApi.listCompanies()` IDs

No separate `/companies` route — companies remain in unified directory.

### 17.8 Search UI

`GlobalSearch` — migrated to `PmButton` with keyboard hint (`Ctrl+K`).

`CommandMenu` improvements:

- Richer empty state copy
- Keyboard hints footer (↑↓ Navigate · Enter Select · Esc Close)
- Recent pages group unchanged

No search algorithm changes — navigation/command palette only.

### 17.9 Settings

`SettingsPage` uses `SettingsView` with `PmForm` sections:

| Section | Content |
|---------|---------|
| Account | Read-only email, ID, role |
| Preferences | Placeholder |
| Appearance | Theme toggle reference |
| Notifications | Placeholder |
| Security | Password fields (stub preserved) |
| Read-only information | Status, member since |

Submit behavior unchanged — form stub only.

### 17.10 Migration notes

1. User pages extracted to `web/src/components/user/*` — `people-pages.tsx` is thin route wrapper.
2. Do not modify opportunity (`opportunities-pages.tsx`), collaboration (`pipeline-pages.tsx`, `deals-pages.tsx`, `contracts-pages.tsx`), or admin pages.
3. **Do not** modify `packages/*`, `domain/*`, `commands/*`, `services/*`, or `repositories/*`.
4. Phase 8 — **complete** — see [PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md](./PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md).

| Legacy | Phase 7C target |
|--------|-----------------|
| `PageHeader` + shadcn `Card` in `people-pages.tsx` | `PmPageLayout` + v2 components |
| Manual messages grid | `PmSplitLayout` |
| Flat notification list | `PmDataTable` + grouped mobile cards |
| People card grid | `PmDataTable` + `PersonCard` |
| Settings password card | `PmForm` + `PmFormSection` |

### 17.11 User testing

| Layer | Status |
|-------|--------|
| `user-display.test.ts` | **3 tests** — search, scope, public filter |
| React mount tests | **Not in repo** |
| Type-check / full suite | **Pass** (612 tests) |

### 17.12 Remaining user workspace gaps

| Area | Status |
|------|--------|
| Messages backend | Mock threads only — no messaging service |
| Settings API wiring | Placeholder sections |
| Profile edit forms | Read-only display — inline edit deferred |
| Portfolio/projects data | Placeholder until profile storage wired |
| Dedicated `/companies` route | Not in scope — unified `/people` directory |
| Phase 8 | **Complete** — consistency audit |
| Phase 9 | **Complete** — legacy UI & workflow audit |
| Phase 9.5B | **Complete** — design system compliance (see §20) |
| Phase 9.5C | **Complete** — motion & interaction DDS-005 (see §21) |
| Phase 9.5D | **Complete** — RTL excellence audit (see §22) |
| Phase 9.5E | **Complete** — responsive cross-device QA (see §23) |

---

*Phase 7C complete — Phases 8–9.5C complete.*

---

## 18. Phase 6 — Adaptive Enterprise Modern visual language

| Field | Value |
|-------|-------|
| Phase | 6 — Visual Language Upgrade |
| Date | 29 June 2026 |
| Authority | `index.css`, `web/src/tokens/*`, PM primitives |
| Scope | Appearance only — no business logic, routes, or data changes |

### 18.1 Design direction

**Adaptive Enterprise Modern** — timeless enterprise SaaS, modern but not trendy, information-first. Premium through typography, spacing, hierarchy, and surfaces.

**Avoid:** heavy glassmorphism, neon/glow, gradient-heavy UI, decorative effects that age quickly.

**Inspiration mix:** Linear clarity (45%), Stripe polish (30%), Attio card hierarchy, Notion workspace simplicity, Vercel density.

### 18.2 Surface hierarchy

| Level | Token | Usage |
|-------|-------|-------|
| Canvas | `bg-background` | App shell |
| Panel | `bg-surface` | Default cards |
| Muted | `bg-surface-muted` | Table headers, subtle fills |
| Elevated | `bg-surface-elevated` + `pm-shadow-panel` | Hover states, raised panels |
| Toolbar | `.pm-toolbar-surface` | Sticky toolbars |

### 18.3 Card hierarchy

**Opportunity cards** — sectioned layout:

1. Title + status badge row
2. Intent / category caption
3. Description (2-line clamp)
4. Location + updated date (border-top metadata row)
5. Readiness badge + match count
6. Actions (border-top)

**Match cards** — score as hero metric, workflow badge in status section.

**PmCard / PmSurface** — interactive variants elevate on hover via semantic tokens.

### 18.4 KPI hierarchy

`PmStatCard`:

- Label: `pm-text-stat-label` (uppercase overline)
- Value: `pm-text-stat` (2.25rem → 2.5rem responsive)
- Optional icon block: `bg-primary-muted rounded-lg`
- Optional trend row (display slot only)

### 18.5 Page hero rules

`PmPageHeader` extended props (optional, no page rewrites required):

| Slot | Typography | Notes |
|------|------------|-------|
| `label` | `pm-text-overline` | Section context |
| `title` | `pm-text-h1` | Primary heading |
| `description` | `pm-text-body-sm` | Muted, max-w-2xl |
| `metric` | `pm-text-stat` (consumer) | Left-border separator on sm+ |
| `badges` | `PmBadge` children | Below title block |
| `actions` | `PmButton` children | Right on lg+ |

### 18.6 Badge hierarchy

- Workflow badges: unchanged status values, tighter presentation via `PmBadge`
- Readiness: single badge per opportunity card; ring uses semantic `text-warning/info/success`
- Intent/category: caption text instead of extra badges where possible

### 18.7 Typography refresh

New utilities in `index.css` + `pmTypography` registry:

| Role | Class | Use |
|------|-------|-----|
| Overline | `pm-text-overline` | Page labels, stat labels |
| Stat | `pm-text-stat` | KPI numbers |
| Stat label | `pm-text-stat-label` | KPI captions |
| Table header | `pm-text-table-header` | Sortable column headers |

Refined `h1`–`h3` tracking and weight in `@layer components`.

### 18.8 Hover / focus polish

| Target | Treatment |
|--------|-----------|
| Cards | `border-primary/25`, `bg-surface-elevated`, `pm-shadow-panel` |
| Table rows | `.pm-table-row-hover` |
| Buttons | `shadow-sm` default variant |
| Focus | Existing `pm-focus-ring` — unchanged for a11y |

### 18.9 Before / after summary

| Screen / component | Visible change |
|--------------------|----------------|
| Dashboard KPI row | Larger numbers, icon blocks |
| Opportunities list (grid/mobile) | Cleaner card sections, less badge clutter |
| Matches grid | Score prominence, structured layout |
| Data tables | Muted header band, row hover |
| Readiness panels | Semantic color ring (no amber/emerald hardcode) |
| Sticky toolbars | Surface-tinted bar vs flat background |

### 18.10 Token-driven constraints

All changes flow through:

1. `web/src/index.css` CSS variables and component utilities
2. `web/src/tokens/layers/*` TypeScript token maps
3. PM primitives (`pm-*` components)
4. Semantic Tailwind utilities (`text-success`, `bg-surface-elevated`, etc.)

Pages must not add hardcoded palette classes. `npm run validate:design:strict` enforces this.

### 18.11 Phase boundaries

- **Phase 6:** Complete — visual language upgrade
- **Phase 7:** Complete — page-level hero adoption (see §19)
- **Phase 8:** NOT started

---

## 19. Phase 7 — Page-level hero adoption

| Field | Value |
|-------|-------|
| Phase | 7 — Hero & Page-Level Visual Adoption |
| Date | 30 June 2026 |
| Authority | `PmPageHeader`, `PmPageHeroMetric`, `page-hero-display.ts` |
| Scope | Appearance only — no business logic, routes, or data changes |

### 19.1 Objective

Apply Phase 6 primitives at the **page level**: enhanced `PmPageHeader` heroes, KPI rhythm, and visual hierarchy on high-traffic workspace and admin screens.

### 19.2 Page hero pattern

Every upgraded page uses `PmPageHeader` with the Phase 6 extended slots:

| Slot | Component / helper | Example |
|------|-------------------|---------|
| `label` | `pm-text-overline` | `Workspace`, `Collaboration`, `Admin` |
| `title` | `pm-text-h1` | Page name or entity title |
| `description` | contextual subtitle | Scope, location, dates |
| `metric` | `PmPageHeroMetric` | `39` + `Active` |
| `badges` | `PmBadge` children | Drafts, Published, Matches counts |
| `actions` | `PmButton` children | Primary + secondary CTAs |

**Display helpers** (`web/src/components/layout/page-hero-display.ts`):

- `summarizeOpportunityListHero` — active, draft, published, in-pipeline counts
- `countPipelineWorkflowItems` — opportunities + matches + applications (applications count passed as `0` when legacy UI suppressed)
- `countActiveMatches` / `countActiveDeals` / `countActiveContracts` / `countActiveNegotiations`
- `formatPlatformHealthMetric` — admin command center health %

### 19.3 Page hero examples

| Page | Overline | Metric | Badges |
|------|----------|--------|--------|
| Dashboard | Workspace | Published count | Drafts, active matches, in pipeline |
| Opportunities list | Workspace | Active count | Drafts, published, matches |
| Opportunity detail | Intent (Need/Offer) | Match count | Status, skills |
| Pipeline | Workflow | Active workflows | Opportunities, matches (applications badge omitted when suppressed) |
| Matches list | Collaboration | Active matches | Total, accepted |
| Match detail | Post-match | Match score | Type, workflow status |
| Negotiation detail | Negotiation | Round count | Workflow status |
| Deals / Contracts list | Collaboration | Active count | Total |
| Admin dashboard | Admin | Platform health % | Readiness, match quality, vetting |
| Profile | Account | Readiness % | Readiness status |

### 19.4 KPI usage rules

1. **Page hero metric** — one primary number beside the title (`PmPageHeroMetric`).
2. **Summary row** — `PmMetricGrid` + `PmStatCard` directly below hero on list pages (opportunities, deals, contracts).
3. **Dashboard opening** — top-level KPI strip before `UserDashboardSection` / `OpportunityDashboardSection`.
4. **Nested dashboards** — existing `PmDashboardLayout` sections retain their own KPI grids; do not duplicate counts unnecessarily.
5. **Dense admin tiles** — `PmStatCard dense` in admin command center unchanged; hero metric is additive.

### 19.5 Dashboard rhythm rules

1. Use `pm-section-gap` between major dashboard sections.
2. Opening KPI row uses full `PmStatCard` (with optional icons) — not dense.
3. Quick actions stay in `PmContentCard` aside columns via `PmDashboardLayout`.
4. List toolbars use `pm-toolbar-surface rounded-xl px-4 py-3` on `PmTableToolbar` for lighter filter chrome.
5. Avoid flat white-on-white: rely on `bg-surface-muted`, `pm-toolbar-surface`, and card elevation — not hardcoded colors.

### 19.6 Pages upgraded (Phase 7)

- Dashboard (`dashboard-page.tsx`)
- Opportunities list + detail (`opportunities-pages.tsx`, `opportunity-detail-page.tsx`)
- Pipeline, Matches list + detail, Negotiation detail (`pipeline-pages.tsx`)
- Deals list + detail (`deals-pages.tsx`)
- Contracts list + detail (`contracts-pages.tsx`)
- Admin dashboard (`admin-pages.tsx`)
- Profile (`people-pages.tsx` → `ProfilePage`)

Public/marketing pages intentionally excluded.

### 19.7 Phase boundaries

- **Phase 7:** Complete — page-level hero adoption
- **Phase 8:** Complete — visual QA and hardening (see `docs/ui/PM-TWIN-VISUAL-QA-HARDENING.md`)
- **Phase 9.5B:** Complete — design system compliance audit (see `docs/ui/PM-TWIN-DESIGN-COMPLIANCE-AUDIT.md`)
- **Phase 9.5A:** Complete — zero-legacy workspace UI verification (see `docs/ui/PM-TWIN-ZERO-LEGACY-UI-VERIFICATION.md`)

---

*Phase 7 page-level hero adoption documented — 30 June 2026.*

---

## 20. Phase 9.5B — Design System Compliance Audit

| Field | Value |
|-------|-------|
| Phase | 9.5B — Design System Compliance & UI Standardization |
| Date | 30 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-COMPLIANCE-AUDIT.md` |
| Scope | Authenticated workspace + admin pages and shared components — presentation only |

### 20.1 Objective

Achieve **100% Design System v2 compliance** across the authenticated application: tokens, PM primitives, surface hierarchy, typography, spacing, and elevation — with zero business-logic changes.

### 20.2 Outcomes

| Metric | Result |
|--------|--------|
| Compliance (authenticated scope) | **100%** (62/62 files) |
| Design guard strict mode | **PASS** (0 non-baseline violations) |
| Final Design System score | **5.0 / 5** |
| Type-check / tests | **PASS** (655 tests) |

### 20.3 Fixes applied

1. **Surfaces** — `applications-panel.tsx`, `related-matches-panel.tsx`: raw `<article>` cards → `PmSurface`.
2. **Buttons** — `app-sidebar.tsx`, `admin-route-guard.tsx`: shadcn `Button` → `PmButton`.
3. **Typography** — 20+ shared components migrated from raw `text-sm` / `text-xs` to `pmTypography.*`.
4. **Workflow actions** — `StartNegotiationButton` / `CreateDealButton`: `size` prop replaces `text-xs` class hacks.

### 20.4 Documented exceptions

- Public routes (`auth-pages`, `marketing-pages`) — baseline shadcn exceptions
- Dead `page-primitives.tsx` — zero imports, governance fixture
- shadcn form controls inside `PmFormField` — acceptable leaf pattern
- `PmToolbar` / `PmActionBar` — exported, unused; `PmTableToolbar` / `PmFormActions` adopted instead
- Legacy application workflow UI — **suppressed from default UI in Phase 9.5E** (`productFlags.showLegacyApplications`); domain/code remains; flag-gated for dev/legacy use only. Primary visible workflow: PostMatch-first.

### 20.5 Phase boundaries

- **Phase 9.5B:** Complete
- **Phase 9.5A:** Zero-legacy verification (read-only) — prerequisite
- **Phase 10+:** Backend / API — NOT started

*Phase 9.5B compliance audit documented — 30 June 2026.*

---

## 21. Phase 9.5C — Motion & Interaction System (DDS-005)

| Field | Value |
|-------|-------|
| Phase | 9.5C — Motion & Interaction System |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-DDS-005-MOTION-SYSTEM.md](./PM-TWIN-DDS-005-MOTION-SYSTEM.md) |
| Scope | Authenticated Workspace + Admin — presentation only |

### 21.1 Objective

Unified, token-driven interaction language: hover, press, focus, loading, empty states, toasts, modals, drawers, navigation enter, KPI reveal, and pipeline drag/drop — with full `prefers-reduced-motion` support.

### 21.2 Token expansion (Layer 8)

Extended `--motion-*` CSS variables with delay, distance, and `ease-in-out` curves. TypeScript exports: `pmInteraction`, `pmEnter`, `pmLoading`, `pmPipeline`, `pmOverlay`, `pmToast`.

### 21.3 New modules

| Path | Purpose |
|------|---------|
| `web/src/components/motion/pm-motion-presets.ts` | Framer Motion variants aligned to tokens |
| `web/src/components/motion/use-pm-reduced-motion.ts` | Reduced-motion hook |
| `web/src/components/motion/pm-animated-metric.tsx` | KPI count-up |
| `web/src/tokens/layers/motion.test.ts` | Token unit tests |

### 21.4 Wired primitives

`PmButton`, `PmSurface`/`PmCard`/`PmStatCard`, `PmEmptyState`, `PmPageHeroMetric`, `AppPageChrome`, `PmTableLoading`, `Skeleton`, `Dialog`/`Sheet`, `Sonner`, `AppSidebar`, `PmToolbar`, `PipelineBoard`.

### 21.5 Phase boundaries

- **No layout redesign**
- **No business logic / routing / backend changes**
- **Public pages** — global reduced-motion only

*Phase 9.5C documented — 30 June 2026.*

---

## 22. Phase 9.5D — RTL Excellence Audit

| Field | Value |
|-------|-------|
| Phase | 9.5D — RTL Excellence & Presentation Hardening |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-RTL-EXCELLENCE-AUDIT.md](./PM-TWIN-RTL-EXCELLENCE-AUDIT.md) |
| Scope | Authenticated Workspace + Admin — presentation only |

### 22.1 Objective

Verify and harden Arabic/RTL readiness before Visual Freeze v1.0: logical CSS, direction provider, typography, tables, forms, workflow UI, and direction-aware motion.

### 22.2 RTL readiness score

**4.5 / 5** — PM workspace layer is Arabic-first layout ready; full i18n copy deferred.

### 22.3 New modules

| Path | Purpose |
|------|---------|
| `web/src/components/layout/pm-direction-bridge.ts` | Pure direction helpers |
| `web/src/components/layout/pm-direction-provider.tsx` | Document `dir`/`lang` provider |
| `web/src/components/layout/pm-toaster.tsx` | Direction-aware toast anchor |
| `web/src/tokens/layers/rtl.ts` | Logical layout tokens (`pmLogical`, `pmRtlTypography`) |

### 22.4 Logical CSS policy

Prefer `text-start`/`text-end`, `ms-*`/`me-*`, `ps-*`/`pe-*`, `border-s`/`border-e`, `start-*`/`end-*` in PM-owned workspace components. Physical `left`/`right` reserved for centered modals and shadcn allowlist primitives.

### 22.5 User preference stub

Settings → Preferences → **Layout direction** persists to `pm-twin-direction` (localStorage). Sets `document.documentElement` `dir` and `lang` (`ar` for RTL).

### 22.6 Go/No-Go

**GO** for Visual Freeze v1.0 — see audit doc §7 for remaining shadcn/public/i18n exceptions.

### 22.7 Phase boundaries

- **No business logic / routing / backend changes**
- **Public pages** — not in scope
- **Full Arabic copy** — Phase 10+

*Phase 9.5D documented — 30 June 2026.*

---

## 23. Phase 9.5E — Responsive & Cross-Device QA

| Field | Value |
|-------|-------|
| Phase | 9.5E — Responsive & Cross-Device QA |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md](./PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md) |
| Scope | Authenticated Workspace + Admin — presentation only |

### 23.1 Objective

Audit and harden responsive behavior across mobile (360–430px), tablet (768–834px), laptop (1024–1280px), and desktop (1440–1920px) in LTR and RTL before Visual Freeze v1.0.

### 23.2 Responsive readiness score

**4.5 / 5** — containment, toolbar bleed, mobile messaging, and scroll rows hardened; CI viewport screenshots deferred.

### 23.3 New modules

| Path | Purpose |
|------|---------|
| `web/src/tokens/layers/responsive.ts` | `pmResponsive`, `pmResponsiveViewports` |
| `web/src/tokens/layers/responsive.test.ts` | Token unit tests |
| `web/src/index.css` | `.pm-shell-inset`, `.pm-page-chrome`, `.pm-responsive-scroll-x` |

### 23.4 Containment policy

- Shell inset and page chrome use `overflow-x: clip` + `min-w-0`
- Sticky toolbars/footers bleed with `-mx-[var(--pm-space-page-x)]` aligned to page padding
- Intentional horizontal scroll only inside `.pm-responsive-scroll-x` regions (breadcrumbs, pipeline stages, wizard steps)

### 23.5 Go/No-Go

**GO** for Visual Freeze v1.0 — see QA doc §8 for exceptions.

### 23.6 Phase boundaries

- **No business logic / routing / backend changes**
- **Public pages** — not in scope
- **Automated viewport screenshots** — Phase 10+

*Phase 9.5E documented — 30 June 2026.*

---

## 24. Phase 9.5E — Application Legacy UI Suppression

| Field | Value |
|-------|-------|
| Phase | 9.5E — Application Legacy UI Suppression |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-APPLICATION-LEGACY-SUPPRESSION.md](./PM-TWIN-APPLICATION-LEGACY-SUPPRESSION.md) |
| Scope | UI presentation only — no domain/command/repository deletion |

### 24.1 Product decision

Applications are **hidden from the default user experience** before Visual Freeze v1.0. The visible workflow is:

**Opportunity → PostMatch → Negotiation → Deal → Contract**

### 24.2 Feature flags

| Runtime | Flag | Default |
|---------|------|---------|
| `web/` | `productFlags.showLegacyApplications` | `false` |
| `POC/` | `CONFIG.PRODUCT_FLAGS.SHOW_LEGACY_APPLICATIONS` | `false` |

When `false`: pipeline applications tab, `ApplicationsPanel`, `ApplyWizard`, application badges/stats, and application-first copy are not rendered. Domain models, repositories, commands, services, and tests remain.

### 24.3 Application UI visibility score

**100% suppressed** for normal users (default flag). Legacy surfaces available only when flag is explicitly `true` for dev/QA.

*Phase 9.5E application suppression documented — 30 June 2026.*

---

## 25. Phase 9.5F — Premium Visual Direction Refresh

| Field | Value |
|-------|-------|
| Phase | 9.5F — Premium Visual Direction Refresh |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-PREMIUM-VISUAL-REFRESH.md](./PM-TWIN-PREMIUM-VISUAL-REFRESH.md) |
| Scope | Authenticated workspace + admin presentation layer only |

### 25.1 Objective

Upgrade PM-Twin visual identity from "technically compliant" to "premium SaaS" before Visual Freeze while keeping strict token governance and zero functional drift.

### 25.2 Core changes

1. **Palette refresh** — stronger primary/CTA, refined accent, deeper neutral surfaces, and clearer border contrast in light + dark themes.
2. **Depth refresh** — elevated card/panel/floating/modal shadow tokens and improved interactive lift behavior.
3. **Typography refresh** — stronger hero/KPI hierarchy, softer captions, better section rhythm.
4. **RTL readability polish** — Arabic line-height and spacing adjustments at token/base style level.
5. **Primitive-first rollout** — updates applied in shared PM primitives (`PmSurface`, `PmCard`, `PmPageHeader`, `PmStatCard`, `PmDataTable`, `PmBadge`, `PmButton`, `PmToolbar`, `PmEmptyState`) to propagate across major pages.

### 25.3 Governance and constraints

- Token-driven updates only (`index.css`, `web/src/tokens/layers/*`, PM primitives).
- No business logic, route, command, repository, service, lifecycle, matching, or readiness changes.
- Applications remain hidden by default (`productFlags.showLegacyApplications === false`); primary visible workflow remains:
  - Opportunity → PostMatch → Negotiation → Deal → Contract

### 25.4 Visual outcome

- Dashboard, hero sections, KPI cards, toolbars, cards, tables, pipeline, opportunities, matches, deals/contracts, and admin surfaces receive improved premium contrast and hierarchy through shared primitives.
- Final visual quality score: **4.8 / 5.0** in authenticated scope.

### 25.5 Validation gates

Required validation commands for Phase 9.5F:

- `npm run type-check`
- `npm test`
- `npm run validate:design:strict`

---

## 26. Phase 9.5G — Premium UX Composition & Enterprise Scoring

| Field | Value |
|-------|-------|
| Phase | 9.5G — Premium UX Composition & Enterprise Scoring |
| Date | 30 June 2026 |
| Authority | [PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md](./PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md) |
| Scope | Authenticated workspace layout, unified readiness + match score presentation |

### 26.1 Objective

Recompose authenticated pages for premium enterprise SaaS information hierarchy and expose a **unified scoring language** (readiness + match) using existing evaluator values only.

### 26.2 Score components

| Component | File | Purpose |
|-----------|------|---------|
| `PmReadinessScoreBadge` | `pm-readiness-score-badge.tsx` | Opportunity/profile readiness percent + completion tier |
| `PmMatchScoreBadge` | `pm-match-score-badge.tsx` | Match compatibility percent + tier |
| `PmScoreBadge` | `pm-score-badge.tsx` | Unified delegate (`type: 'readiness' \| 'match'`) |

Display helpers: `pm-readiness-score-display.ts`, `pm-match-score-display.ts`.

### 26.3 Readiness score token mapping

| Tier | Percent | Label | `PmBadge` tone |
|------|---------|-------|----------------|
| Ready | 90–100 | Ready | `success` |
| Good | 80–89 | Good | `info` |
| Needs improvement | 70–79 | Needs Improvement | `warning` |
| Incomplete | &lt;70 | Incomplete | `danger` |

### 26.4 Match score token mapping

| Tier | Percent | Label | `PmBadge` tone |
|------|---------|-------|----------------|
| Excellent | 90–100 | Excellent Match | `success` |
| Strong | 75–89 | Strong Match | `info` |
| Good | 60–74 | Good Match | `warning` |
| Weak | 40–59 | Weak Match | `neutral` |
| Poor | &lt;40 | Poor Match | `danger` |

Weak tier uses `neutral` as the semantic stand-in for orange (no palette escape).

### 26.5 Composition changes

1. **`WorkspaceDashboardComposition`** — summary → KPIs → pipeline health → activity → recommended matches → insights; profile readiness in summary.
2. **Dashboard hero** — profile readiness metric + active match badge.
3. **Opportunity surfaces** — readiness top-right on cards; list/admin columns; detail hero metric.
4. **Match surfaces** — cards, tables, related panels, admin columns use `PmMatchScoreBadge`.
5. **Pipeline** — opportunity kanban cards show compact readiness in header.
6. **Composition-only** — no command, repository, service, lifecycle, matching engine, or readiness calculation changes.

### 26.6 Visual outcome

- Final composition score: **4.9 / 5.0** in authenticated scope.
- Applications remain hidden; primary path unchanged.

### 26.7 Validation gates

- `npm run type-check`
- `npm test`
- `npm run validate:design:strict`

