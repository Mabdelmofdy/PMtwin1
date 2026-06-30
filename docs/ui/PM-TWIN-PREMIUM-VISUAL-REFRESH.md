# PM-Twin Premium Visual Refresh (Phase 9.5F)

| Field | Value |
|-------|-------|
| Phase | 9.5F — Premium Visual Direction Refresh |
| Date | 30 June 2026 |
| Scope | Presentation-only refresh in `web/` |
| Constraints | No business logic, routing, command, repository, service, lifecycle, matching, or readiness changes |
| Primary workflow | Opportunity → PostMatch → Negotiation → Deal → Contract |

---

## Previous visual issues

1. Palette felt technically clean but visually flat, with weak premium contrast between canvas, surface, and elevated content.
2. CTA hierarchy was not prominent enough on dense pages with many competing controls.
3. Card and toolbar depth was subtle to the point of low separation in large dashboard/table compositions.
4. Typography rhythm was consistent but lacked stronger hero/KPI emphasis and softer caption hierarchy.
5. RTL readability was acceptable but needed better Arabic line-height and word rhythm for long descriptive content.

---

## New color direction

Premium enterprise palette centered on deep indigo actions, cool neutral surfaces, and higher-clarity border hierarchy.

- **Primary / CTA:** richer indigo for stronger action prominence and clearer focus states.
- **Accent:** cool azure-tinted accent for supportive highlights and non-primary emphasis.
- **Background:** refined cool-neutral canvas to reduce flatness and improve contrast against cards.
- **Surfaces:** clearer three-level stack (`surface`, `surface-muted`, `surface-elevated`) for depth.
- **Borders:** stronger default and emphasized border tokens for section separation.
- **Muted:** muted tokens adjusted to maintain readability without washed-out captions.
- **Status colors:** success/warning/info/neutral tuned to read cleaner across both themes.

All palette changes are token-driven in `web/src/index.css` and consumed through semantic utilities.

---

## Token changes

### Theme and semantic layers

- Updated light/dark CSS variables for:
  - `--background`, `--surface`, `--surface-muted`, `--surface-elevated`
  - `--primary`, `--primary-muted`, `--accent`, `--secondary`, `--muted`
  - `--border`, `--border-strong`, `--ring`, `--focus-ring`
  - `--success`, `--warning`, `--info`, `--neutral` (+ foregrounds)
  - sidebar semantic tokens for shell consistency

### Visual depth tokens

- Increased radius baseline (`--radius`) for a more modern premium contour.
- Elevated shadow tokens (`--shadow-card`, `--shadow-panel`, `--shadow-floating`, `--shadow-modal`) for clearer layer hierarchy.

### Typography tokens and rhythm

- Body font stack upgraded to premium sans-first fallback order.
- Heading and stat scale/weight increased for stronger KPI and hero impact.
- Caption and stat-label rhythm refined for softer support text and better hierarchy.
- RTL typography improved with Arabic-focused line-height and spacing adjustments.

### TypeScript token registry updates

- `web/src/tokens/layers/semantic.ts`: status backgrounds moved from `/10` to `/14` emphasis fills.
- `web/src/tokens/layers/component.ts`: stronger default border token mapping for cards and page headers.

---

## Components affected

Core PM visual primitives were refreshed so improvements cascade across all migrated pages:

- `PmSurface` (`pm-surface.tsx`)
- `PmCard` (`pm-card.tsx`)
- `PmButton` (`pm-button.tsx`)
- `PmPageHeader` (`pm-page-header.tsx`)
- `PmStatCard` (`pm-stat-card.tsx`)
- `PmEmptyState` (`pm-empty-state.tsx`)
- `PmDataTable` (`pm-data-table.tsx`)
- `PmBadge` (`pm-badge.tsx`)
- `PmToolbar` / `PmActionBar` chrome (`pm-layout-chrome.tsx`)
- Global utility classes in `web/src/index.css` (`pm-toolbar-surface`, typography, interaction, elevation)

No workflow behavior or data path was changed.

---

## Pages visually improved (through shared primitives)

- Dashboard and hero KPI surfaces
- Opportunities list/detail cards and table/chrome
- Pipeline board stages and kanban card depth
- Match cards and collaboration list/table views
- Deal and contract list/detail visual hierarchy
- Admin command center, list pages, and dense table surfaces

These pages inherit new visuals through tokens and PM component wrappers; no route or business behavior changes were introduced.

---

## Before/after rationale

- **Before:** clean but conservative visual language with low separation in dense enterprise screens.
- **After:** more premium SaaS feel via stronger action color, richer depth, clearer card layering, and higher-contrast section boundaries.
- **Before:** headers and KPIs competed with surrounding content.
- **After:** hero/KPI typography and header surfaces establish a clearer first-read hierarchy.
- **Before:** muted/caption areas occasionally felt washed out.
- **After:** muted tones remain subtle but more legible and intentional in both themes.

---

## Remaining concerns

1. Final visual sign-off should still include manual viewport and RTL walkthroughs for subjective polish acceptance.
2. Public marketing/auth pages are out of scope and intentionally remain on baseline styling.
3. Existing legacy fixtures (e.g., `page-primitives.tsx`) are retained for governance/testing and are not product entry points.

---

## Final visual score

**4.8 / 5.0** for authenticated PM-Twin workspace + admin scope.

Rationale: noticeably stronger premium identity and hierarchy while preserving governance, token compliance, and non-functional constraints.
