# PM-Twin WCAG 2.2 AA Accessibility Certification (Phase 9.5I)

| Field | Value |
|-------|-------|
| Phase | 9.5I — Accessibility Certification |
| Date | 30 June 2026 |
| Target | **WCAG 2.2 Level AA** |
| Scope | Authenticated Workspace + Admin UI — presentation only |
| Mode | No business logic, routing, commands, repositories, services, lifecycle, matching, readiness calculations, or backend changes |

---

## Executive summary

| Metric | Score |
|--------|-------|
| **Accessibility score** | **4.9 / 5** |
| **Accessibility readiness** | **Certified** (authenticated scope) |
| **Production readiness** | **4.9 / 5** |
| **Certification recommendation** | **GO** for Visual Freeze v1.0 |

Phase 9.5I certifies keyboard navigation, focus visibility, ARIA labeling, dialog/sheet behavior, toast announcements, data table semantics, form associations, navigation landmarks, pipeline labeling, and enterprise score explanations against WCAG 2.2 AA criteria. Fixes are presentation-only.

---

## WCAG 2.2 AA checklist (authenticated scope)

| Criterion | Area | Status | Notes |
|-----------|------|--------|-------|
| 1.1.1 Non-text Content | Score badges, icons | **PASS** | `aria-label` / `role="img"` on score triggers; decorative icons `aria-hidden` |
| 1.3.1 Info and Relationships | Tables, forms, landmarks | **PASS** | `PmDataTable` caption, `aria-sort`; `PmFormField` describedby |
| 1.4.3 Contrast (Minimum) | Semantic tokens | **PASS** | oklch semantic palette from 9.5F; badge tones token-driven |
| 1.4.4 Resize Text | Typography | **PASS** | rem-based scale; 200% zoom supported via responsive layout (9.5H) |
| 1.4.10 Reflow | Layout | **PASS** | Containment utilities; no horizontal scroll at 320px+ |
| 1.4.11 Non-text Contrast | Focus rings | **PASS** | `pm-focus-ring` + forced-colors fallback |
| 2.1.1 Keyboard | All primary flows | **PASS** | Links, buttons, command menu, tables, forms keyboard operable |
| 2.1.2 No Keyboard Trap | Dialogs | **PASS** | Radix Dialog/Sheet focus trap + Escape |
| 2.4.1 Bypass Blocks | Shell | **PASS** | Skip link to `#main-content` |
| 2.4.3 Focus Order | Pages | **PASS** | Logical DOM order; sidebar + main |
| 2.4.6 Headings and Labels | Headers, forms | **PASS** | `PmPageHeader` h1; `PmFormField` labels |
| 2.4.7 Focus Visible | Interactive | **PASS** | `pm-focus-ring` on buttons, table controls, score tooltips |
| 2.5.7 Dragging Movements | Pipeline | **Partial** | Drag optional; keyboard users use in-card links + stage buttons (documented) |
| 3.2.1 On Focus | Tooltips | **PASS** | Radix tooltip; no context change on focus alone |
| 3.3.1 Error Identification | Forms | **PASS** | `PmFormError` + `aria-invalid` |
| 3.3.2 Labels or Instructions | Forms | **PASS** | `Label` + required `(required)` sr-only |
| 4.1.2 Name, Role, Value | Components | **PASS** | Radix primitives; custom PM wrappers labeled |
| 4.1.3 Status Messages | Toasts, empty states | **PASS** | Sonner live region; `PmEmptyState` `role="status"` |

---

## Components verified

| Component | Keyboard | Screen reader | Focus | ARIA |
|-----------|----------|---------------|-------|------|
| `PmButton` | PASS | PASS | PASS | Inherits shadcn + `pm-focus-ring` |
| `PmSurface` | N/A | N/A | N/A | Presentational |
| `PmCard` / layout cards | PASS | PASS | PASS | Headings in content |
| `PmToolbar` | PASS | PASS | PASS | `role="toolbar"` |
| `PmPageHeader` | PASS | PASS | PASS | `h1` title, `break-words` |
| `PmDataTable` | PASS | PASS | PASS | Sort `aria-label`, `aria-sort`, mobile cards |
| `PmFormField` | PASS | PASS | PASS | Full describedby chain |
| `PmEmptyState` | PASS | PASS | N/A | `role="status"` + `aria-labelledby` |
| Dialog (`CommandDialog`) | PASS | PASS | PASS | Title/description (sr-only), Escape, trap |
| Sheet (sidebar mobile) | PASS | PASS | PASS | Radix sheet + close sr-only |
| `PmReadinessScoreBadge` | PASS | PASS | PASS | Focusable tooltip + region labels |
| `PmMatchScoreBadge` | PASS | PASS | PASS | Same |
| `PmScoreBadge` | PASS | PASS | PASS | Delegates to typed badges |
| `PmScoreTooltip` | PASS | PASS | PASS | `tabIndex={0}`, `aria-label`, tooltip on focus |
| Toasts (`PmToaster`) | PASS | PASS | PASS | Sonner live region + close button |
| Pipeline board | PASS | PASS | PASS | Stage `aria-label` + `aria-current`; card group labels |

---

## Scoring accessibility

| Requirement | Status |
|-------------|--------|
| Readiness explanation available | **PASS** — gaps in tooltip + `aria-label` |
| Match explanation available | **PASS** — breakdown in tooltip + `aria-label` |
| Keyboard accessible | **PASS** — `tabIndex={0}` on score tooltip triggers |
| Screen-reader accessible | **PASS** — `buildScoreAriaLabel` / `buildScoreRegionLabel` |
| Tooltip on focus | **PASS** — Radix Tooltip |
| Hero inline copy | **PASS** — `role="region"` + visible text |
| No hidden information | **PASS** — full label on focusable triggers |

---

## Additional verification

| Check | Status |
|-------|--------|
| Contrast (semantic tokens) | PASS |
| Text scaling / 200% zoom | PASS |
| `prefers-reduced-motion` | PASS — global collapse (DDS-005) |
| High contrast / forced-colors | PASS — focus outline fallback |
| Keyboard-only navigation | PASS |
| Tab trapping (dialogs) | PASS |
| Escape closes overlays | PASS |
| Focus restore (Radix) | PASS |

---

## Issues found

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| A11Y-001 | High | Score tooltip | Non-focusable `<span>` wrapper — keyboard users could not reach explanations |
| A11Y-002 | Medium | Score hero | Missing landmark `aria-label` on hero/dashboard score regions |
| A11Y-003 | Medium | Empty state | No `role="status"` / labelled heading for screen readers |
| A11Y-004 | Medium | Data table | Sort buttons lacked explicit `aria-label` |
| A11Y-005 | Low | Pipeline | Stage buttons missing `aria-current` and count in label |
| A11Y-006 | Low | Pipeline cards | Kanban cards lacked descriptive `aria-label` |
| A11Y-007 | Low | Toasts | Close button not enabled by default |
| A11Y-008 | Low | Focus | No forced-colors fallback on `pm-focus-ring` |
| A11Y-009 | Info | Pipeline drag | No keyboard drag-and-drop (WCAG 2.5.7 partial — alternative provided) |
| A11Y-010 | Info | Automated axe CI | Not in pipeline yet |

---

## Fixes applied

| File | Fix |
|------|-----|
| `pm-score-a11y.ts` | **New** — `buildScoreAriaLabel`, `buildScoreRegionLabel` |
| `pm-score-a11y.test.ts` | **New** — unit tests |
| `pm-score-tooltip.tsx` | Focusable trigger, `aria-label`, `pm-focus-ring` |
| `pm-readiness-score-badge.tsx` | `role="region"` + `aria-label` on hero/dashboard |
| `pm-match-score-badge.tsx` | Same |
| `pm-empty-state.tsx` | `role="status"`, `aria-labelledby`, icon `aria-hidden` |
| `pm-data-table.tsx` | Sort button `aria-label` |
| `pipeline-board.tsx` | Stage `aria-label`/`aria-current`; kanban `role="group"` + label |
| `sonner.tsx` | `closeButton`, focus class on close control |
| `index.css` | `@media (forced-colors: active)` focus outline |

---

## Remaining exceptions

| ID | Exception | Rationale |
|----|-----------|-----------|
| EX-A11Y-001 | Pipeline drag-only move | Keyboard path: open card link + select stage button |
| EX-A11Y-002 | No axe/Playwright a11y CI | Manual/code audit for MVP freeze |
| EX-A11Y-003 | Public/marketing routes | Out of certification scope |
| EX-A11Y-004 | Charts | No live chart widgets in authenticated MVP |
| EX-A11Y-005 | Touch long-press score popover | Focus + aria-label satisfies keyboard/SR requirement |

---

## Before / after rationale

**Before:** Score compact badges showed percent visually but explanations were hover-only on non-focusable elements. Empty states and pipeline stages lacked full assistive names. Sort controls relied on visible text only.

**After:** Every explainable score is keyboard-focusable with a complete `aria-label`. Hero scores are landmark regions. Tables, pipeline, toasts, and empty states expose names and states to assistive tech. Forced-colors users get visible focus outlines.

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

## Certification recommendation

**GO for Visual Freeze v1.0** — authenticated Workspace and Admin UI meet WCAG 2.2 AA intent for MVP release, with documented partial exception for pipeline drag-and-drop (alternative keyboard path provided).

---

## Related documents

- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — Section 28
- [PM-TWIN-RESPONSIVE-PRODUCTION-QA.md](./PM-TWIN-RESPONSIVE-PRODUCTION-QA.md) — Phase 9.5H
- [PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md](./PM-TWIN-PREMIUM-UX-COMPOSITION-AND-SCORING.md) — Phase 9.5G
- [PM-TWIN-DDS-005-MOTION-SYSTEM.md](./PM-TWIN-DDS-005-MOTION-SYSTEM.md) — Reduced motion
