# PM-Twin RTL Excellence Audit

| Field | Value |
|-------|-------|
| Phase | 9.5D — RTL Excellence & Presentation Hardening |
| Date | 30 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md`, KSA compliance (Arabic RTL) |
| Scope | Authenticated Workspace + Admin UI — presentation only |
| Mode | No business logic, routing, commands, repositories, services, lifecycle, matching, or readiness changes |

---

## 1. Executive summary

**RTL readiness score: 4.5 / 5** (authenticated Workspace + Admin scope).

Phase 9.5D established a **direction bridge + provider**, **logical layout tokens**, **Arabic typography CSS**, and migrated PM-owned workspace components from physical `left`/`right` utilities to logical `start`/`end` patterns. Hero motion, toast placement, and collaboration timeline separators are direction-aware.

**Go/No-Go for Visual Freeze v1.0: GO** — with documented exceptions below (shadcn primitive layer, public routes, and copy/i18n deferred to Phase 10+).

---

## 2. Audit methodology

### Manual review areas

1. Layout direction (shell, header, sidebar, hero, toolbars, detail pages)
2. Logical CSS (margin, padding, border, inset, translate, icons)
3. Arabic typography rhythm
4. RTL tables (alignment, row actions, sort indicators)
5. RTL forms (labels, inputs, wizard steps)
6. Workflow UI (pipeline, match cards, timelines, badges, CTAs)
7. RTL motion (hero reveal, toasts, reduced motion)
8. Responsive RTL (desktop, tablet, mobile, collapsed sidebar)

### Automated validation

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run type-check` | **PASS** |
| Unit tests | `npm test` | **PASS** (668 tests) |
| Design governance | `npm run validate:design:strict` | **PASS** |

---

## 3. RTL infrastructure (new)

| Module | Purpose |
|--------|---------|
| `web/src/components/layout/pm-direction-bridge.ts` | Pure direction helpers (lang, toast position, motion offset) |
| `web/src/components/layout/pm-direction-bridge.test.ts` | Unit tests for bridge |
| `web/src/components/layout/pm-direction-provider.tsx` | React provider — `document.documentElement` `dir`/`lang` from `localStorage` |
| `web/src/components/layout/pm-toaster.tsx` | Direction-aware Sonner position |
| `web/src/tokens/layers/rtl.ts` | `pmLogical`, `pmLogicalAlign`, `pmRtlTypography` tokens |
| `web/index.html` | Default `dir="ltr"` (provider overrides on mount) |
| `web/src/index.css` | `[dir="rtl"]` Arabic body font stack + heading/table/badge rhythm |

**Preference surface:** Settings → Preferences → Layout direction (`English (LTR)` / `العربية (RTL)`). Presentation stub only — persists to `pm-twin-direction` in localStorage.

---

## 4. Files audited

### Layout shell

- `web/src/components/layout/app-shell.tsx`
- `web/src/components/layout/app-sidebar.tsx`
- `web/src/components/layout/app-header.tsx`
- `web/src/components/layout/workspace-switcher.tsx`
- `web/src/components/layout/global-search.tsx`
- `web/src/components/layout/notification-center.tsx`
- `web/src/components/layout/theme-toggle.tsx`
- `web/src/components/layout/page-chrome.tsx`
- `web/src/providers/app-providers.tsx`

### PM primitives

- `web/src/components/ui/pm-page-header.tsx`
- `web/src/components/ui/pm-page-hero-metric.tsx`
- `web/src/components/ui/dialog.tsx`
- `web/src/components/ui/sheet.tsx`

### Data & forms

- `web/src/components/data/pm-data-table.tsx`
- `web/src/components/data/pm-table-search.tsx`
- `web/src/components/data/pm-table-bulk-actions.tsx`
- `web/src/components/forms/pm-form-stepper.tsx`

### Workflow

- `web/src/components/pipeline/pipeline-board.tsx`
- `web/src/components/opportunity/opportunity-timeline.tsx`
- `web/src/components/readiness/readiness-list.tsx`
- `web/src/components/readiness/publish-readiness-alert.tsx`
- `web/src/components/collaboration/match-card.tsx` (no physical-direction issues)

### Motion

- `web/src/components/motion/pm-motion-presets.ts`

### User / settings

- `web/src/components/user/settings-view.tsx`

### Workspace & admin pages (grep + spot check)

- `web/src/pages/dashboard-page.tsx`
- `web/src/pages/workspace/*-pages.tsx`
- `web/src/pages/workspace/opportunity-detail-page.tsx`
- `web/src/pages/admin/admin-pages.tsx`
- `web/src/pages/admin/admin-list-page.tsx`

### Out of scope (noted)

- `web/src/pages/public/*` — marketing/auth retain physical directions (baseline)
- `web/src/components/ui/sidebar.tsx`, `table.tsx`, `command.tsx`, `dropdown-menu.tsx` — shadcn allowlist layer

---

## 5. Issues found

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| RTL-001 | High | Infrastructure | No `dir`/`lang` on document; theme registry `direction` unused |
| RTL-002 | High | Layout | Physical `border-r`, `ml-auto`, `focus:left-2` in shell chrome |
| RTL-003 | Medium | Tables | Row actions `text-right`; search icon `left-3`/`pl-9` |
| RTL-004 | Medium | Forms | Wizard tiles `text-left`; step hint `ml-1` |
| RTL-005 | Medium | Workflow | Pipeline stage buttons `text-left`; timeline `border-l` + `→` separator |
| RTL-006 | Medium | Motion | Hero KPI reveal assumed LTR (`x: -distance`) |
| RTL-007 | Medium | Toasts | Fixed `bottom-right` position |
| RTL-008 | Low | Typography | No Arabic font/line-height overrides |
| RTL-009 | Low | Settings | Missing `useAuth` import; no direction preference UI |
| RTL-010 | Info | Copy | All UI strings remain English — i18n not in scope |

---

## 6. Presentation-only fixes applied

| File | Fix |
|------|-----|
| `app-sidebar.tsx` | `border-e`, `ms-auto`, RTL-flipped active nav inset shadow |
| `app-header.tsx` | `ms-auto` toolbar cluster |
| `app-shell.tsx` | Skip link `focus:start-2` |
| `workspace-switcher.tsx` | `text-start` |
| `global-search.tsx` | `ms-auto` kbd |
| `notification-center.tsx` | `-end-0.5` badge |
| `theme-toggle.tsx` | `ms-2` label gap |
| `pm-page-header.tsx` | `border-s` / `ps-6` hero metric separator |
| `pm-data-table.tsx` | `text-end` actions; `pm-rtl-table` class |
| `pm-table-search.tsx` | `start-3` / `ps-9` |
| `pm-table-bulk-actions.tsx` | `ms-auto` clear button |
| `pm-form-stepper.tsx` | `text-start`, `ms-1` |
| `pipeline-board.tsx` | `text-start` stage buttons |
| `opportunity-timeline.tsx` | `ChevronRight` + `rtl:rotate-180`; `border-s`/`ps-3` |
| `readiness-list.tsx`, `publish-readiness-alert.tsx` | `ps-5` list indent |
| `opportunities-pages.tsx` | Wizard intent tiles `text-start` |
| `dialog.tsx`, `sheet.tsx` | Close button `end-4` |
| `pm-motion-presets.ts` | `pmHeroRevealVariants(reduced, direction)` |
| `pm-page-hero-metric.tsx` | Consumes `usePmDirection()` |
| `settings-view.tsx` | Direction select + `useAuth` import fix |
| `app-providers.tsx` | `PmDirectionProvider` + `PmToaster` |
| `index.css` | `[dir="rtl"]` typography block |
| `index.html` | Default `dir="ltr"` |

---

## 7. Remaining exceptions

| Exception | Rationale | Phase |
|-----------|-----------|-------|
| shadcn `sidebar.tsx` physical `left`/`right` positioning | Allowlisted primitive; partial `rtl:` variants exist | 10+ optional hardening |
| shadcn `table.tsx` header `text-left` | Inherited by all tables; PM columns use `text-start` where needed | 10+ |
| `command.tsx` / `dropdown-menu.tsx` `ml-auto` shortcuts | Command palette allowlist | 10+ |
| Public marketing/auth pages | Out of authenticated scope | Post–Visual Freeze |
| No translated Arabic copy | i18n/API not started; direction-only stub | Phase 10+ |
| Theme registry `direction: 'ltr'` on all themes | Document `dir` is source of truth for layout | DDS theme RTL themes later |
| Hijri date formats | Not in presentation scope | Phase 10+ |

---

## 8. Verification checklist (manual QA)

- [ ] Settings → switch to **العربية (RTL)** — sidebar moves to inline-end, header actions mirror
- [ ] Data tables — row actions align to inline-end; search icon on correct side
- [ ] Pipeline board — stage filter buttons readable in RTL
- [ ] Opportunity detail — collaboration path chevrons point correctly
- [ ] Hero KPI — metric slides from inline-start
- [ ] Toasts — appear bottom-inline-end (physical left in RTL)
- [ ] Reduced motion — hero/toast animations respect `prefers-reduced-motion`
- [ ] Mobile — collapsed sidebar + breadcrumbs in RTL

---

## 9. Go/No-Go recommendation

| Criterion | Status |
|-----------|--------|
| Workspace/Admin logical layout | **Pass** |
| Direction toggle + document `dir`/`lang` | **Pass** |
| PM primitive physical-direction debt | **Cleared** |
| Arabic typography baseline | **Pass** (CSS layer) |
| Full Arabic copy / i18n | **Deferred** (expected) |
| Business logic unchanged | **Pass** |

**Recommendation: GO** for Visual Freeze v1.0 on authenticated surfaces, with exceptions in §7 tracked for Phase 10+.

---

*Phase 9.5D RTL excellence audit — 30 June 2026.*
