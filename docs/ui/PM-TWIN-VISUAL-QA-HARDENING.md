# PM-Twin Visual QA & Hardening Report

| Field | Value |
|-------|-------|
| Phase | 8 — Visual QA & Hardening |
| Date | 30 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md` §18–19 |
| Scope | UI-only polish after Phase 6 (visual language) and Phase 7 (page heroes) |

---

## 1. Visual hierarchy score

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Page hero clarity | 4.5 | All high-traffic workspace/admin pages use `PmPageHeader` + `PmPageHeroMetric`; secondary pages upgraded in Phase 8 |
| KPI hierarchy | 4.0 | Duplicate KPI rows removed on dashboard and list pages; hero metric + badges preferred over redundant grids |
| Section spacing | 4.0 | `pm-section-gap`, muted `PmSurface` bands on nested dashboard sections |
| Toolbar hierarchy | 4.0 | `pm-toolbar-surface` standardized on list toolbars (people, notifications, admin lists, pipeline tabs) |
| Card hierarchy | 4.0 | Kanban cards, map listings, wizard intent tiles migrated to `PmSurface` |
| Inspector hierarchy | 3.5 | Detail pages retain nav link strips below header — acceptable for MVP |

**Overall visual hierarchy: 4.2 / 5**

---

## 2. Page-by-page visual status

| Page | Status | Phase 8 changes |
|------|--------|-----------------|
| Dashboard | ✅ Hardened | Removed hero badge duplication; nested sections in muted surfaces; removed nested KPI grids |
| Opportunities list | ✅ Hardened | Removed duplicate metric grid (hero carries counts) |
| Opportunity detail | ✅ Hardened | `PmEmptyState` for not-found |
| Opportunity map | ✅ Hardened | Hero metric, list action, `PmEmptyState` placeholder, surfaced nearby items |
| Opportunity wizard | ✅ Hardened | Step progress hero metric; intent tiles use `PmSurface` |
| Pipeline | ✅ Hardened | Tab bar on `pm-toolbar-surface` |
| Matches list | ✅ Hardened | Compact KPI strip below hero |
| Match / negotiation detail | ✅ Good | Heroes from Phase 7; no change required |
| Deals / contracts list | ✅ Hardened | Removed duplicate grids; active count in badges |
| Deal / contract detail | ✅ Good | Heroes from Phase 7 |
| Admin dashboard | ✅ Good | Phase 7 hero intact |
| Admin list pages | ✅ Hardened | Queue count hero metric + surfaced toolbar (via `AdminListPage`) |
| Admin reports / health / matching | ✅ Hardened | Hero metrics and badges added |
| Profile | ✅ Good | Phase 7 hero intact |
| People directory | ✅ Hardened | Profile count hero; surfaced toolbar |
| Messages | ✅ Hardened | Thread count hero; unread badge |
| Notifications | ✅ Hardened | Unread hero; surfaced toolbar; page header owns counts |
| Settings | ✅ Adequate | Label overline added |
| Navigation shell | ⚠️ Adequate | App shell unchanged; breadcrumbs mobile-only (deferred) |

---

## 3. Remaining flatness risks

| Risk | Severity | Location |
|------|----------|----------|
| Detail nav link rows (deal/contract back-links) | Low | `deals-pages.tsx`, `contracts-pages.tsx` |
| Negotiation round list items | Low | `pipeline-pages.tsx` |
| Legacy applications panel | Medium | `opportunity-detail-page.tsx` |
| Admin user/negotiation detail placeholders | Medium | `admin-pages.tsx` |
| Marketing/public pages | Medium | `marketing-pages.tsx` — not migrated |
| Wizard footer still uses `PmFormActions` | Low | `opportunities-pages.tsx` — `PmActionBar` deferred |

---

## 4. Component consistency issues

| Issue | Resolution | Status |
|-------|------------|--------|
| Duplicate KPI rows (hero + grid) | Keep one source of truth per page | ✅ Fixed on dashboard, opportunities, deals, contracts |
| Unsurfaced table toolbars | `pm-toolbar-surface rounded-xl px-4 py-3` | ✅ Fixed on people, notifications, admin lists, pipeline tabs |
| Raw border div kanban cards | `PmSurface shadow="card"` | ✅ Fixed in `pipeline-board.tsx` |
| Raw wizard intent buttons | `PmSurface` tiles | ✅ Fixed |
| Plain text 404 states | `PmEmptyState` | ✅ Fixed opportunity detail |
| `page-primitives.tsx` legacy exports | Still present for compatibility | ⚠️ Deferred — no active page imports |

---

## 5. Pages improved (Phase 8)

- `dashboard-page.tsx`
- `user-dashboard-section.tsx`
- `opportunity-dashboard-section.tsx`
- `opportunities-pages.tsx` (list, map, wizard)
- `opportunity-detail-page.tsx`
- `pipeline-pages.tsx`
- `pipeline-board.tsx`
- `deals-pages.tsx`
- `contracts-pages.tsx`
- `people-pages.tsx`
- `people-list-section.tsx`
- `notifications-list-section.tsx`
- `admin-list-page.tsx`
- `admin-pages.tsx` (reports, health, matching)

---

## 6. Pages deferred

| Page / area | Reason |
|-------------|--------|
| Public/marketing pages | Out of scope unless trivial; full migration is Phase 9+ |
| `ApplyWizard` | Legacy layout; functional, not blocking |
| Admin user detail / negotiation detail | Placeholder content — needs product design before visual polish |
| Desktop breadcrumbs in app header | Shell change — low ROI for MVP |
| `PmActionBar` for wizard/settings footers | Requires layout slot wiring |
| RTL visual pass | Tokens support RTL; no page-level audit run |
| Dark mode pixel audit | Semantic tokens in place; spot-check only |

---

## 7. Public / marketing gap

Marketing pages (`marketing-pages.tsx`, `public-layout.tsx`) still use public layout patterns. They do not block workspace readiness. A future pass should apply `PmPageHeader` and surface tokens to landing sections only — no route or content changes.

---

## 8. RTL / dark mode / responsive risks

| Risk | Assessment |
|------|------------|
| RTL | `PmPageHeader` flex layout is RTL-safe; table toolbars may need `rtl:` spacing audit before Arabic launch |
| Dark mode | All fixes use semantic tokens (`bg-surface-muted`, `pm-toolbar-surface`); no hardcoded palette added |
| Responsive | Hero metric stacks below title on mobile (Phase 6 behavior); dashboard KPI grid collapses to 2-col |
| Reduced motion | `pmMotion` utilities respect `prefers-reduced-motion` |

---

## 9. Final visual readiness score

| Category | Weight | Score |
|----------|--------|-------|
| Workspace high-traffic pages | 40% | 4.5 |
| Collaboration flow pages | 25% | 4.2 |
| Admin & directory | 20% | 4.0 |
| Shell & secondary pages | 15% | 3.5 |

**Final visual readiness: 4.2 / 5** — suitable for MVP demo and internal QA. Remaining gaps are documented above and deferred to Phase 9.

---

## Validation

| Check | Result |
|-------|--------|
| `npm run type-check` | Pass |
| `npm test` | Pass |
| `npm run validate:design:strict` | Pass |

---

## Phase boundaries

- **Phase 8:** Complete — visual QA and hardening
- **Phase 9:** NOT started

*Report generated 30 June 2026.*
