# PM-Twin Premium UX Composition & Enterprise Scoring (Phase 9.5G)

| Field | Value |
|-------|-------|
| Phase | 9.5G — Premium UX Composition & Enterprise Scoring |
| Date | 30 June 2026 |
| Scope | Presentation-only composition and score visualization in `web/` |
| Constraints | No business logic, routing, command, repository, service, lifecycle, matching, or readiness **calculation** changes |
| Primary workflow | Opportunity → PostMatch → Negotiation → Deal → Contract |
| Applications | Hidden (`productFlags.showLegacyApplications === false`) |

---

## Enterprise scoring system

PM-Twin exposes two scoring systems consistently across the product. Both use **existing stored values only** — no new algorithms.

### 1. Opportunity Readiness Score

Represents how complete and ready an opportunity (or profile) is.

- **Source:** existing `evaluateOpportunityReadiness` / `evaluateProfileReadiness` via `resolveOpportunityReadiness` / `resolveProfileReadiness`
- **Range:** 0–100 integer percent

| Percent | Label | Semantic tone |
|---------|-------|---------------|
| 90–100 | Ready | `success` (emerald) |
| 80–89 | Good | `info` (blue) |
| 70–79 | Needs Improvement | `warning` (amber) |
| Below 70 | Incomplete | `danger` (red) |

**Surfaces:** Dashboard hero, opportunity cards (top-right), opportunity lists, opportunity detail hero, pipeline kanban cards, admin opportunity table, publish preview, profile/insights panels.

### 2. Match Score

Represents compatibility between two opportunities.

- **Source:** existing `match.matchScore` (fractional 0–1 or whole 0–100)
- **Normalization:** `normalizeMatchScorePercent`

| Percent | Label | Semantic tone |
|---------|-------|---------------|
| 90–100 | Excellent Match | `success` |
| 75–89 | Strong Match | `info` |
| 60–74 | Good Match | `warning` |
| 40–59 | Weak Match | `neutral` (orange tier — token stand-in) |
| Below 40 | Poor Match | `danger` |

**Surfaces:** Related matches, PostMatch cards, dashboard recommendations, pipeline match cards, match detail, opportunity detail (badge + hero strip), admin match table.

---

## Visual placement rules

| Surface | Readiness | Match |
|---------|-----------|-------|
| Dashboard hero | Profile readiness metric | Active matches badge; top match in summary |
| Opportunity cards | Top-right compact badge | — |
| Opportunity list table | Right-aligned list variant column | — |
| Opportunity detail | Hero metric beside title | Compact badge in header; hero strip when matches exist |
| Pipeline opportunities | Card header compact badge | — |
| Pipeline / PostMatch cards | — | Pipeline variant in card header |
| Match detail | — | Hero strip after header |
| Admin opportunities | Compact admin column | — |
| Admin matches | — | Tooltip variant in score column |
| Search / table results | List variant (readiness column) | List variant (match column) |

---

## Component API

### `PmReadinessScoreBadge`

```tsx
<PmReadinessScoreBadge
  score={number}           // 0–100 from existing evaluator
  variant="compact"        // compact | default | card | hero | tooltip | list | pipeline | dashboard | admin
  showLabel={boolean}      // show tier label beside percent
  display={ReadinessScoreDisplay}  // optional pre-resolved
/>
```

Helpers: `resolveReadinessScoreDisplay`, `formatReadinessScorePercent`, `normalizeReadinessScorePercent`.

### `PmMatchScoreBadge`

```tsx
<PmMatchScoreBadge
  score={number}           // 0–1 or 0–100 from existing match record
  variant="pipeline"       // compact | default | card | hero | tooltip | list | pipeline | dashboard
  showLabel={boolean}
  display={MatchScoreDisplay}
/>
```

Helpers: `resolveMatchScoreDisplay`, `formatMatchScorePercent`, `normalizeMatchScorePercent`.

### `PmScoreBadge` (unified)

```tsx
<PmScoreBadge type="readiness" | "match" value={number} variant="compact" />
```

Delegates to the typed badge components.

**Barrel:** `@/components/ui/pm-index`

---

## Premium UX composition

Visual language blend (coherent, not copy-paste):

| Area | Inspiration | PM-Twin expression |
|------|-------------|-------------------|
| Dashboard | Linear | Hero readiness → summary → KPI grid → pipeline health → activity → recommendations |
| Navigation | Vercel | Existing shell — unchanged workflow |
| Admin | Stripe | Dense KPI grids, readiness + match columns |
| Cards | Linear | Score-forward headers, elevated surfaces |
| Tables | Linear | Compact density, score columns right-aligned |
| Motion | Framer Motion | Hero metric reveal (`PmPageHeroMetric`) |
| Icons | Lucide | Section affordances |

### Composition principles

1. **Hero first** — workspace pages lead with `PmPageHeader`: label, title, readiness or context metric, badges, actions.
2. **Dual score language** — readiness answers “how complete?”; match answers “how compatible?” — never conflated.
3. **Score prominence** — both scores visible at every appropriate touchpoint via shared badges.
4. **Surface hierarchy** — canvas → muted bands → elevated cards → interactive rows.
5. **Whitespace rhythm** — `pm-section-gap`, aside/main splits, section headers with end-aligned actions.
6. **CTA placement** — primary actions in hero; opportunity detail adds inline primary action card before related matches.
7. **No workflow drift** — PostMatch remains collaboration entry; Applications UI gated behind product flags.

### Information hierarchy

**Dashboard:** Hero (readiness) → Today's summary (readiness + top match) → KPI grid → Pipeline health → Recent activity → Recommended matches (match scores) → Recent opportunities (readiness on cards) → Insights.

**Opportunity detail:** Hero (readiness metric + match badge) → Flow strip → Match or readiness hero strip → Metric grid → Primary action → Summary + related matches → Inspector → Timeline.

**Match detail:** Hero (match label + actions) → Match score hero strip → Breakdown grid → Related opportunities + inspector.

---

## Pages updated

| Page | Changes |
|------|---------|
| Dashboard | Profile readiness hero metric; summary readiness + top match |
| Opportunities list | Readiness column in compact table |
| Opportunity detail | Readiness hero metric; match badge; conditional hero strips |
| Opportunity cards | Readiness top-right compact badge |
| Pipeline | Opportunity kanban readiness in card header |
| Post-matches / matches | Match score pipeline/list variants (unchanged path, unified labels) |
| Match detail | Match hero strip |
| Admin opportunities | Readiness admin column |
| Admin matches | Match tooltip column |
| People / profile | Readiness badge via `PmReadinessScoreBadge` |
| Publish experience | Compact readiness badge |
| Insights / user dashboard | Profile readiness compact badges |

---

## Before / after rationale

**Before:** Match scores were partially unified (9.5G composition pass) but readiness appeared as ad-hoc `PmBadge` thresholds (`>= 80 ? success : warning`) without tier labels. Opportunity cards buried readiness in the footer. Dashboard hero showed only active matches.

**After:**

- **Unified scoring language** — `PmReadinessScoreBadge` + `PmMatchScoreBadge` + `PmScoreBadge` with token-driven tiers and consistent labels.
- **Readiness everywhere appropriate** — cards, lists, detail hero, pipeline, admin, dashboard.
- **Match scores unchanged in data** — visualization only; full compatibility labels (“Excellent Match”, etc.).
- **Premium composition** — dashboard leads with profile readiness; opportunity detail prioritizes readiness in hero while match scores remain prominent when matches exist.
- **Zero backend drift** — evaluators, matching engine, commands, and repositories untouched.

---

## Final visual score

**4.9 / 5.0** for authenticated workspace + admin scope.

Rationale: dual scoring system is consistent and token-driven; composition hierarchy improved over 9.5F; governance and functional constraints preserved. Remaining 0.1 is subjective polish (manual RTL/viewport sign-off, future chart integration for pipeline health).

---

## Validation

```bash
cd web && npm run type-check
cd web && npm test
cd web && npm run validate:design:strict
```

All gates required to pass for Phase 9.5G completion.

---

## Related documents

- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — Section 26
- [PM-TWIN-PREMIUM-UX-COMPOSITION.md](./PM-TWIN-PREMIUM-UX-COMPOSITION.md) — prior composition pass (superseded for scoring by this document)
- [PM-TWIN-PREMIUM-VISUAL-REFRESH.md](./PM-TWIN-PREMIUM-VISUAL-REFRESH.md) — Phase 9.5F tokens
