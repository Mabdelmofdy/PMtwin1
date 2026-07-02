# PM-Twin Visual Language

Sprint B visual hierarchy rules for DS v2 pages in `web/`.

## Eye flow

Default vertical scan order on detail pages:

```
Header (PmPageHeader)
  → Status (lifecycle map + status card)
    → Primary action (PmPageActions / PmActionHub)
      → Summary (key fields, hero metrics)
        → Main content (tables, cards, forms)
          → Secondary / advanced (muted surfaces, disclosures)
```

## Typography weight

| Role | Token | Use |
|------|-------|-----|
| Page title | `pmTypography.h1` via `PmPageHeader` | One per page |
| Section title | `pmTypography.h3` via `PmSectionHeader` / card titles | My workflow, card titles |
| Card/list title | `pmTypography.h3` | `PmEntityListCard`, negotiation cards |
| Body | `pmTypography.body` / `bodySm` | Descriptions, meta |
| KPI value | `pmTypography.stat` | Dashboard topology counts, `PmStatsStrip` |
| KPI label | `pmTypography.statLabel` | Strip labels |
| Caption / meta | `pmTypography.caption` | Timestamps, hints |

Do not use raw `text-2xl font-semibold` for KPIs when `pmTypography.stat` exists.

## Spacing & card rhythm

- **List cards:** `p-4 md:p-5` padding; action footer `mt-4` above `PmCardActions`.
- **Section stacks:** `space-y-4` or `pmLayoutGrid.pageStack` between major blocks.
- **Toolbar:** `PmToolbarSurface` at page level, `space-y-3` when tabs + filters stack.

## Color weight

| Weight | Treatment | When |
|--------|-----------|------|
| **Emphasis** | `tone` on `PmPageHeader`, primary buttons, active badges | Status, primary CTA |
| **Default** | `PmSurface variant="default"` | Active workflow cards, primary lists |
| **Demoted** | `variant="muted"`, `bg-surface-muted/30`, `border-border/60` | Requirements, skills, topology, matching summary |
| **Warning** | `border-warning/30 bg-warning/5` | Pending approval banners |

Secondary sections on high-traffic detail pages (opportunity, match, dashboard) should use **demoted** surfaces so primary lifecycle + action paths dominate.

## Entity tones

`PmPageHeader` `tone` prop aligns page chrome with lifecycle entity:

| Entity | Tone |
|--------|------|
| Workspace / pipeline | `mission` |
| Opportunity | `opportunity` |
| Match | `match` |
| Negotiation | `negotiation` |
| Deal | `deal` |
| Contract | `contract` |
| Directory / neutral | `default` |

## Icons

- Primary header CTAs may include trailing arrow (`ArrowRight`, RTL-aware).
- Toolbar/filter icons: `size-4`, `aria-hidden` on decorative icons.
- Notification row icons: `size-4` inside `size-8` rounded container.

## Sprint B reference implementations

| Page | Hierarchy changes |
|------|-------------------|
| **Dashboard** | Single `PmDashboardLayout` header; KPI strip uses `pmTypography.stat`; matching summary demoted |
| **Opportunity detail** | Lifecycle → recommended action → summary; requirements/skills muted |
| **Match detail** | Status card before score grid; topology/participants demoted |
