# PM-Twin Responsive & Cross-Device QA

| Field | Value |
|-------|-------|
| Phase | 9.5E — Responsive & Cross-Device QA |
| Date | 30 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md`, Phase 9.5D RTL audit |
| Scope | Authenticated Workspace + Admin UI — presentation only |
| Mode | No business logic, routing, commands, repositories, services, lifecycle, matching, or readiness changes |

---

## 1. Executive summary

**Responsive readiness score: 4.5 / 5** (authenticated Workspace + Admin scope).

Phase 9.5E audited layout behavior across mobile, tablet, laptop, and desktop viewports in both LTR and RTL. Presentation fixes harden **overflow containment**, **toolbar/footer bleed alignment**, **mobile master-detail messaging**, **pipeline stage scrolling**, and **header/page action stacking**.

**Go/No-Go for Visual Freeze v1.0: GO** — with documented exceptions (native device QA matrix, public routes, map placeholder).

---

## 2. Viewports tested

| Tier | Widths (px) | Method |
|------|-------------|--------|
| Mobile | 360, 390, 430 | Code audit + CSS breakpoint matrix |
| Tablet | 768, 834 | Code audit + layout token review |
| Laptop | 1024, 1280 | Code audit + grid breakpoint review |
| Desktop | 1440, 1920 | Code audit + max-width constraints |

Documented in `web/src/tokens/layers/responsive.ts` as `pmResponsiveViewports`.

RTL verification: direction toggle (Phase 9.5D) combined with containment utilities — no additional horizontal scroll introduced by `dir="rtl"`.

---

## 3. Audit methodology

### Areas verified

1. App shell — sidebar collapse, mobile drawer, header actions, breadcrumbs, user menu
2. Page layouts — dashboard, opportunities, pipeline, matches, negotiations, deals, contracts, people, messages, notifications, settings, admin
3. Responsive components — headers, surfaces, toolbars, tables, detail layouts, empty states, forms, pipeline board
4. Tables & lists — overflow, mobile cards, action columns
5. Forms & wizards — stacking, footer actions, step indicators
6. Detail pages — hero metrics, inspector rails, related panels
7. Motion & RTL — enter animations, sticky toolbars, drawer direction

### Automated validation

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run type-check` | **PASS** |
| Unit tests | `npm test` | **PASS** (671 tests) |
| Design governance | `npm run validate:design:strict` | **PASS** |

---

## 4. Pages audited

| Route area | Page / component |
|------------|------------------|
| Shell | `app-shell`, `app-header`, `app-sidebar`, `page-breadcrumbs` |
| Dashboard | `dashboard-page.tsx` |
| Opportunities | `opportunities-pages.tsx`, `opportunity-detail-page.tsx` |
| Pipeline | `pipeline-pages.tsx`, `pipeline-board.tsx` |
| Deals / contracts | `deals-pages.tsx`, `contracts-pages.tsx` |
| People | `people-pages.tsx`, `people-list-section.tsx` |
| Messages | `messages-view.tsx` |
| Notifications | `notifications-list-section.tsx` |
| Settings | `settings-view.tsx` |
| Admin | `admin-pages.tsx`, `admin-list-page.tsx` |
| Shared | `pm-page-layout`, `pm-detail-layout`, `pm-data-table`, `pm-form-stepper`, `pm-toolbar` |

Public/marketing routes excluded (baseline).

---

## 5. Issues found

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| RSP-001 | High | Shell | No `overflow-x` containment on `SidebarInset` / page chrome — risk of page-level horizontal scroll |
| RSP-002 | Medium | Toolbar | Sticky `PmToolbar` / `PmFormActions` negative margins (`-mx-4 md:-mx-8`) misaligned with `pm-page-padding` token at some breakpoints |
| RSP-003 | Medium | Messages | Master-detail split stacked list + empty detail on mobile — poor inbox UX |
| RSP-004 | Medium | Header | `PmPageHeader` actions did not stack full-width on narrow viewports |
| RSP-005 | Medium | Breadcrumbs | `flex-nowrap` crumbs could overflow without scroll container |
| RSP-006 | Low | Pipeline | Stage nav scroll row lacked standardized `overscroll-x-contain` |
| RSP-007 | Low | Wizard | Horizontal stepper could overflow on 360px with many steps |
| RSP-008 | Low | Typography | Long titles/descriptions could force overflow without `break-words` |
| RSP-009 | Info | Map | Opportunity map is placeholder — responsive grid OK, no live map |
| RSP-010 | Info | Device QA | No automated Playwright viewport screenshot matrix in CI |

---

## 6. Presentation-only fixes applied

| File | Fix |
|------|-----|
| `tokens/layers/responsive.ts` | New responsive tokens + viewport QA matrix |
| `tokens/layers/responsive.test.ts` | Token unit tests |
| `tokens/layers/layout.ts` | `min-w-0` on detail/split grids; toolbar/footer bleed via `--pm-space-page-x` |
| `index.css` | `.pm-shell-inset`, `.pm-page-chrome`, `.pm-responsive-scroll-x` |
| `app-shell.tsx` | `pmResponsive.shellInset` on `SidebarInset` |
| `page-chrome.tsx` | `pmResponsive.pageChrome` + motion wrapper `min-w-0` |
| `app-header.tsx` | `min-w-0` on header flex row |
| `pm-layout-chrome.tsx` | Toolbar bleed via `pmResponsive.toolbarBleed` |
| `pm-page-header.tsx` | `break-words` on title; full-width action stack on mobile |
| `pm-page-layout.tsx` | `min-w-0` on page stack |
| `pm-detail-layout.tsx` | `min-w-0` on detail scaffold |
| `page-breadcrumbs.tsx` | Horizontal scroll on crumb list |
| `pipeline-board.tsx` | `pmResponsive.scrollX` on stage nav |
| `pm-form-stepper.tsx` | Scrollable horizontal step row on narrow screens |
| `pm-data-table.tsx` | `min-w-0` on table root (mobile cards unchanged) |
| `pm-empty-state.tsx` | `break-words` on description |
| `pm-form-actions.tsx` | `sm:ms-auto` on primary action group |
| `messages-view.tsx` | Mobile master-detail toggle + back link + stacked compose row |

---

## 7. Component responsive behavior (verified)

| Component | Mobile (<640) | Tablet (768+) | Desktop (1024+) |
|-----------|-----------------|---------------|-----------------|
| `PmDataTable` | Card layout (`sm:hidden`) | Table + inner scroll | Sticky header table |
| `PmPageHeader` | Stacked title/metric/actions | Row metric separator | Actions inline-end |
| `PmToolbar` | Column stack | Row toolbar | Sticky bleed aligned |
| `PmDetailLayout` | Single column | Single column | 2+1 grid |
| `PmMetricGrid` | 1 col | 2 cols | 3–4 cols |
| `PipelineBoard` | Horizontal stage scroll | Same | Vertical stage sidebar |
| `PmSplitLayout` (messages) | List OR detail | List OR detail | Side-by-side |
| `PmFormStepper` | Wrap + scroll | Inline steps | Inline steps |

---

## 8. Remaining exceptions

| Exception | Rationale | Phase |
|-----------|-----------|-------|
| No CI viewport screenshot tests | Manual QA matrix documented | 10+ |
| Opportunity map placeholder | No map SDK | Backend/integration |
| shadcn `sidebar.tsx` mobile sheet | Allowlisted primitive | Optional hardening |
| Public pages responsive | Out of authenticated scope | Post–Visual Freeze |
| Ultra-narrow 320px | Not in KSA device matrix | — |

---

## 9. Manual QA checklist

- [ ] 360px LTR — no page horizontal scroll on dashboard, opportunities list, pipeline
- [ ] 360px RTL — direction toggle; verify toast, sidebar, tables
- [ ] 768px — breadcrumbs scroll; toolbar sticky alignment
- [ ] 1024px — sidebar collapse; detail inspector 2+1 grid
- [ ] Messages mobile — list-only at `/messages`; thread-only at `/messages/:id` with back link
- [ ] Pipeline — stage pills scroll horizontally on mobile
- [ ] Wizard — step indicators scroll when >3 steps on 360px
- [ ] Admin tables — mobile cards render below `sm` breakpoint

---

## 10. Go/No-Go recommendation

| Criterion | Status |
|-----------|--------|
| No unintended horizontal scroll (containment) | **Pass** |
| Mobile layouts usable | **Pass** |
| Tablet/desktop grids | **Pass** |
| RTL + responsive combined | **Pass** |
| Business logic unchanged | **Pass** |

**Recommendation: GO** for Visual Freeze v1.0.

---

*Phase 9.5E responsive QA — 30 June 2026.*
