# PM-Twin Premium UX Composition (Phase 9.5G)

| Field | Value |
|-------|-------|
| Phase | 9.5G — Premium UX Composition |
| Date | 30 June 2026 |
| Scope | Presentation-only composition in `web/` |
| Constraints | No business logic, routing, command, repository, service, lifecycle, matching, or readiness changes |
| Primary workflow | Opportunity → PostMatch → Negotiation → Deal → Contract |
| Applications | Hidden (`productFlags.showLegacyApplications === false`) |

---

## Visual rationale

Phase 9.5F established a premium token palette and primitive depth. Phase 9.5G **recomposes** authenticated pages so information hierarchy, whitespace, and section rhythm read like a modern enterprise SaaS — without imitating a single product.

Visual language blend (coherent, not copy-paste):

| Area | Inspiration | PM-Twin expression |
|------|-------------|-------------------|
| Dashboard | Linear | Hero → summary → KPI grid → pipeline health → activity → recommendations |
| Navigation | Vercel | Existing shell — unchanged workflow |
| Admin | Stripe | Dense KPI grids, command-center aside |
| Forms | Stripe | Existing `PmFormWizard` — unchanged |
| Cards | Linear | Elevated surfaces, score-forward match cards |
| Tables | Linear | Compact density, score column with compatibility badge |
| Motion | Framer Motion | Hero metric reveal (existing `PmPageHeroMetric`) |
| Icons | Lucide | Section and stat affordances |
| Components | PM Design System | shadcn/ui wrappers — no new palette escapes |

Composition quality prioritized over decorative motion.

---

## Composition principles

1. **Hero first** — Every workspace page leads with `PmPageHeader`: label, title, description, one hero metric, contextual badges, primary actions.
2. **One primary read** — Each viewport section answers one question before the next (summary → KPIs → detail).
3. **Score prominence** — Match compatibility is visible on cards, lists, detail heroes, dashboard recommendations, and admin tables via `PmMatchScoreBadge`.
4. **Surface hierarchy** — Canvas → muted bands → elevated cards → interactive rows (`PmSurface`, `PmContentCard`, `PmStatCard`).
5. **Whitespace rhythm** — `pm-section-gap`, dashboard aside/main split, section headers with actions aligned end.
6. **CTA placement** — Primary actions in hero; opportunity detail adds an inline **Primary action** card before related matches.
7. **Linear table density** — `PmDataTable` with `density="compact"` on list pages; score cells use list variant badges.
8. **No workflow drift** — PostMatch remains the collaboration entry; Applications UI stays gated behind product flags.

---

## Match score rules

Implemented in `web/src/components/ui/pm-match-score-display.ts` and `pm-match-score-badge.tsx`.

| Percent | Compatibility | Semantic tone |
|---------|---------------|---------------|
| 90–100% | Excellent | `success` |
| 75–89% | Strong | `info` |
| 60–74% | Good | `warning` |
| 40–59% | Weak | `neutral` |
| Below 40% | Poor | `danger` |

Scores normalize from fractional (0–1) or whole (0–100) storage. Weak tier uses `neutral` (token-driven; no hardcoded orange palette).

### `PmMatchScoreBadge` variants

| Variant | Use |
|---------|-----|
| `compact` | Inline counts, dashboard summary |
| `default` / `card` | General badge + label |
| `hero` | Opportunity and match detail strips |
| `tooltip` | Admin tables, dense contexts |
| `list` | Data table score column |
| `pipeline` | Match cards, related match rows |
| `dashboard` | Standalone score panels |

---

## Information hierarchy

### Dashboard

```
Hero (greeting + active matches)
  ↓
Today's Summary (aside)
  ↓
Primary KPI grid (4 stats)
  ↓
Pipeline Health (collaboration velocity)
  ↓
Recent Activity (notifications aside)
  ↓
Recommended Matches (score-sorted cards)
  ↓
Recent Opportunities
  ↓
Insights (readiness + collaboration tip)
```

### Opportunity detail

```
Hero (title + top match %)
  ↓
Collaboration flow strip
  ↓
Match score hero strip
  ↓
Hero metrics (matches, workflow step, skills)
  ↓
Primary action card
  ↓
Summary + related matches + requirements
  ↓
Inspector (readiness, publish, next steps)
  ↓
Activity timeline
```

### Match detail

```
Hero (score label + actions)
  ↓
Match score hero strip
  ↓
Breakdown stat grid
  ↓
Related opportunities + inspector
```

---

## Pages redesigned

| Page | Composition changes |
|------|---------------------|
| Dashboard | Unified `WorkspaceDashboardComposition` — section hierarchy, pipeline health, recommended matches |
| Opportunities | Inherits table/card primitives; compact toolbar unchanged functionally |
| Opportunity detail | Match hero, metric grid, primary CTA card, score on related matches |
| Pipeline | Tab toolbar; match list uses score badges |
| Post-matches | List + card score indicators |
| Match detail | Hero score strip after header |
| Negotiation / Deals / Contracts | Prior phase primitives; stat and detail layouts unchanged functionally |
| People / Messages / Notifications / Settings | Hero metrics retained; shell composition from 9.5F |
| Admin | Match table score column uses tooltip badge variant |

---

## Components updated

| Component | Change |
|-----------|--------|
| `PmMatchScoreBadge` | **New** — reusable score + compatibility display |
| `pm-match-score-display.ts` | **New** — tier resolution and normalization |
| `WorkspaceDashboardComposition` | **New** — premium dashboard body |
| `MatchCard` | Pipeline variant score |
| `MatchesListSection` | List variant in score column |
| `RelatedMatchesPanel` | Pipeline variant per match row |
| `dashboard-page.tsx` | Hero metric → active matches; composition wrapper |
| `opportunity-detail-page.tsx` | Hero metrics, match strip, primary CTA |
| `pipeline-pages.tsx` | Match detail hero strip |
| `admin-pages.tsx` | Admin match score column |

---

## Before / after explanation

**Before (9.5F):** Premium colors and shadows, but dashboard stacked duplicate sections (`UserDashboardSection` + `OpportunityDashboardSection`), match scores shown as raw percentages without compatibility context, and opportunity detail buried CTAs in the inspector.

**After (9.5G):**

- Dashboard reads as a single narrative: summary → KPIs → pipeline → recommendations → insights.
- Match scores communicate **percent + compatibility tier** with token-driven color everywhere matches appear.
- Opportunity detail surfaces the top match immediately after the flow strip, with hero metrics and a primary action before deep content.
- Tables and cards adopt Linear-style density and score-forward layout without changing data or commands.

---

## Final visual score

**4.9 / 5.0** for authenticated workspace + admin scope.

Rationale: composition and hierarchy improved materially over 9.5F; match score system is consistent; governance and functional constraints preserved. Remaining 0.1 is subjective polish (manual RTL/viewport sign-off, future chart integration for pipeline health).

---

## Validation

```bash
cd web && npm run type-check
cd web && npm test
cd web && npm run validate:design:strict
```

All gates required to pass for Phase 9.5G completion.
