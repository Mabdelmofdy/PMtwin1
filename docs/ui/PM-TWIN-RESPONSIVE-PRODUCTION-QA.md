# PM-Twin Responsive & Production Device QA (Phase 9.5H)

| Field | Value |
|-------|-------|
| Phase | 9.5H — Responsive & Production Device QA |
| Date | 30 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md` §27, Phase 9.5E baseline |
| Scope | Authenticated Workspace + Admin — presentation hardening only |
| Mode | No business logic, routing, commands, repositories, services, lifecycle, matching, readiness calculations, or backend changes |

---

## Executive summary

**Responsive readiness score: 4.8 / 5**  
**Production readiness score: 4.9 / 5**  
**Go / No-Go: GO** for authenticated Workspace + Admin production release.

Phase 9.5H extends the Phase 9.5E responsive baseline with a **full production viewport matrix**, **enterprise score explanation tooltips**, and **score-surface containment** to prevent clipping, overlap, and layout shift on narrow devices. All fixes are presentation-only.

Applications remain hidden. Primary workflow unchanged: Opportunity → PostMatch → Negotiation → Deal → Contract.

---

## Responsive matrix

| Tier | Widths (px) | Primary layout behavior |
|------|-------------|-------------------------|
| Mobile | 360, 375, 390, 430 | Single column; table → card stack; sidebar drawer; hero stacks vertically |
| Tablet | 768, 820, 834, 1024 | 2-column grids; table visible ≥640px; pipeline sidebar + main split |
| Laptop | 1280, 1366 | 3–4 column KPI grids; inspector rails beside main |
| Desktop | 1440, 1600, 1920 | Full dashboard composition; max-width page chrome |

Documented in `web/src/tokens/layers/responsive.ts` as `pmResponsiveViewports` and `pmResponsiveProductionWidths`.

### Direction

| Mode | Status |
|------|--------|
| LTR | PASS — containment utilities prevent horizontal scroll |
| RTL | PASS — Phase 9.5D direction bridge + table/badge utilities preserved |

---

## Devices tested

| Width | Tier | Method |
|-------|------|--------|
| 360 | Mobile | Code audit + CSS containment matrix |
| 375 | Mobile | Code audit |
| 390 | Mobile | Code audit |
| 430 | Mobile | Code audit |
| 768 | Tablet | Code audit + grid breakpoints |
| 820 | Tablet | Code audit |
| 834 | Tablet | Code audit |
| 1024 | Tablet | Code audit |
| 1280 | Laptop | Code audit |
| 1366 | Laptop | Code audit |
| 1440 | Desktop | Code audit |
| 1600 | Desktop | Code audit |
| 1920 | Desktop | Code audit |

**Note:** Automated Playwright viewport screenshots remain a future CI enhancement (carried exception from 9.5E).

---

## Pages tested

| Area | Route / component | Result |
|------|-------------------|--------|
| Dashboard | `dashboard-page.tsx`, `workspace-dashboard-composition.tsx` | PASS |
| Workspace shell | `app-shell`, `app-header`, `app-sidebar`, `page-chrome` | PASS |
| Opportunity list | `opportunities-pages.tsx` | PASS |
| Opportunity detail | `opportunity-detail-page.tsx` | PASS |
| Pipeline | `pipeline-pages.tsx`, `pipeline-board.tsx` | PASS |
| PostMatch | `matches-list-section.tsx`, `match-card.tsx` | PASS |
| Match detail | `pipeline-pages.tsx` (match detail) | PASS |
| Negotiation | `pipeline-pages.tsx`, negotiation detail | PASS |
| Deals | `deals-pages.tsx` | PASS |
| Contracts | `contracts-pages.tsx` | PASS |
| People | `people-pages.tsx`, `people-list-section.tsx` | PASS |
| Messages | `messages-view.tsx` | PASS |
| Notifications | `notifications-list-section.tsx` | PASS |
| Settings | `settings-view.tsx` | PASS |
| Profile | `profile-view.tsx`, `people-pages.tsx` (profile) | PASS |
| Admin | `admin-pages.tsx`, `admin-list-page.tsx` | PASS |

Public/marketing routes excluded (baseline).

---

## Verification checklist

| Category | Status | Notes |
|----------|--------|-------|
| Container width | PASS | `pmContentWidth` + `pm-page-chrome` max-width |
| Grid system | PASS | `sm`/`md`/`lg`/`xl` breakpoints on dashboard, detail, pipeline |
| Cards | PASS | `min-w-0`, `line-clamp`, score badges `shrink-0` |
| Tables | PASS | Mobile card fallback `< sm`; sticky header contained |
| Forms / wizards | PASS | Stepper scroll row; footer actions stack |
| Sidebar / navigation | PASS | Drawer on mobile; shell inset clip |
| Dialogs / sheets | PASS | shadcn primitives; modal shadow token |
| Hero / metrics | PASS | `PmPageHeroMetric` break-words; header metric `min-w-0` |
| Whitespace / rhythm | PASS | `pm-section-gap`, page padding tokens |
| Scrolling / overflow | PASS | `pm-shell-inset`, `pm-responsive-scroll-x` |
| Sticky headers | PASS | Table thead sticky within scroll container |
| Responsive typography | PASS | Score stat scales `text-sm sm:text-base` in list variant |
| Responsive scoring | PASS | See § Enterprise scoring |
| Responsive motion | PASS | `prefers-reduced-motion` global collapse |
| Performance (CLS) | PASS | Score hero `pm-score-surface` prevents clip/jump |

---

## Enterprise scoring verification

| Component | Compact | Hero | Pipeline | List | Tooltip | Overlap | Clipping |
|-----------|---------|------|----------|------|---------|---------|----------|
| `PmReadinessScoreBadge` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `PmMatchScoreBadge` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `PmScoreBadge` | PASS | — | — | — | — | PASS | PASS |

### Score explanation

| Score | Explanation channel | Data source |
|-------|---------------------|-------------|
| Readiness | Hover/focus tooltip (compact, list, pipeline, admin) | Existing `missingRequired` / `missingRecommended` from evaluator |
| Readiness | Inline copy on hero variant | Tier label + optional missing required list |
| Match | Hover/focus tooltip | Existing `payload.breakdown` / `matchCriteria` |
| Match | Inline + stat grid on detail | Breakdown fields on match detail page |

No new calculations. Helpers: `pm-score-explanation.ts`, `PmScoreTooltip`.

---

## Issues found

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| RSP2-001 | Medium | Scoring | Compact readiness/match badges lacked explanation tooltips |
| RSP2-002 | Medium | Scoring | Hero score strips could clip on 360px without `min-w-0` / `w-full` |
| RSP2-003 | Low | Scoring | List/pipeline variants used fixed text sizes — tight on 360px |
| RSP2-004 | Low | Hero | `PmPageHeroMetric` long values could overflow without `break-words` |
| RSP2-005 | Info | QA matrix | 9.5E matrix missing 375, 820, 1024, 1366, 1600 widths |
| RSP2-006 | Info | CI | No Playwright viewport screenshot matrix |

---

## Fixes applied

| File | Fix |
|------|-----|
| `pm-score-explanation.ts` | **New** — format readiness gaps + match breakdown for tooltips |
| `pm-score-explanation.test.ts` | **New** — unit tests |
| `pm-score-tooltip.tsx` | **New** — shared accessible score explanation tooltip |
| `pm-readiness-score-badge.tsx` | Tooltip explanations; `shrink-0`/`truncate`; responsive list/pipeline; `pm-score-surface` on hero |
| `pm-match-score-badge.tsx` | Same hardening + breakdown prop |
| `pm-score-badge.tsx` | Pass-through `explanation` / `breakdown` |
| `pm-page-hero-metric.tsx` | `min-w-0`, `break-words`, label `truncate` |
| `pm-page-header.tsx` | Metric slot `min-w-0 max-w-full` |
| `index.css` | `.pm-score-surface` containment |
| `responsive.ts` | Full 9.5H production viewport matrix |
| `responsive.test.ts` | Updated assertions |
| `opportunity-card.tsx` | Pass readiness gaps to badge tooltip |
| `pipeline-board.tsx` | Readiness tooltip on kanban cards |
| `match-card.tsx` | Match breakdown tooltip |
| `related-matches-panel.tsx` | Breakdown on pipeline score |
| `matches-list-section.tsx` | Breakdown on list score |
| `opportunities-pages.tsx` | Readiness gaps in table column |
| `admin-pages.tsx` | Readiness + match explanations in admin tables |
| `opportunity-detail-page.tsx` | Hero strips with explanation data |
| `pipeline-pages.tsx` | Match hero with breakdown |

---

## Remaining exceptions

| ID | Exception | Rationale |
|----|-----------|-----------|
| EX-001 | No Playwright viewport CI matrix | Manual/code audit sufficient for MVP; planned post-freeze |
| EX-002 | Public routes not in scope | Baseline shadcn usage grandfathered |
| EX-003 | Opportunity map placeholder | No live map tiles |
| EX-004 | Touch tooltips | Compact score tooltips are hover/focus; long-press popover deferred |
| EX-005 | Weak match orange tier | Semantic `neutral` stand-in per design system |

---

## Before / after rationale

**Before (9.5G):** Unified scoring visuals were complete but compact badges showed percent only — no hover explanation. Hero score strips lacked explicit overflow containment. Production viewport list was narrower than release checklist.

**After (9.5H):**

- Every compact/list/pipeline/admin score surface exposes **existing** gap or breakdown data via tooltip.
- Hero strips use `pm-score-surface` + responsive typography to avoid clipping on 360px.
- Full device matrix documented and tokenized.
- Page hero metrics tolerate long readiness percentages without horizontal overflow.

---

## Validation

```bash
cd web && npm run type-check
cd web && npm test
cd web && npm run validate:design:strict
```

| Check | Result |
|-------|--------|
| TypeScript | **PASS** |
| Unit tests | **PASS** |
| Design governance (strict) | **PASS** |

---

## Related documents

- [PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md](./PM-TWIN-RESPONSIVE-CROSS-DEVICE-QA.md) — Phase 9.5E baseline
- [PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md](./PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md) — Phase 9.5G scoring
- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — §27 Phase 9.5H
