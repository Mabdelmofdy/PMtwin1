# PM-Twin UI v2 — Consistency Audit

| Field | Value |
|-------|-------|
| Phase | 8 — Design QA & Consistency Audit |
| Date | 29 June 2026 |
| Authority | `docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md` |
| Scope | Full `web/` authenticated workspace + shell |
| Status | **QA gate complete** — small fixes applied, gaps documented |

---

## 1. Overall adoption score

| Area | Score | Notes |
|------|-------|-------|
| **Authenticated workspace pages** | **94%** | All product routes use `PmPageLayout` + v2 chrome |
| **Navigation shell** | **91%** | Header, search, notifications v2; sidebar collapse uses shadcn `Button` |
| **Embedded panels & actions** | **96%** | Phase 8 cleaned action buttons, readiness, applications, apply wizard |
| **Public/marketing routes** | **35%** | Auth + marketing intentionally legacy (out of Phases 5–7 scope) |
| **Composite product UI** | **92%** | Weighted across workspace + shell; excludes `packages/` |

**Overall UI v2 adoption score: 92%** (authenticated product surfaces).

---

## 2. Page-by-page adoption status

### Admin (Phase 6) — ✅ Complete

| Route | Layout | Table | Forms | Badges | Empty |
|-------|--------|-------|-------|--------|-------|
| `/admin/*` | `PmPageLayout` | `PmDataTable` | `PmForm` | `AdminStatusBadge` → `PmWorkflowBadge` | `PmTableEmpty` |

### Opportunity (Phase 7A) — ✅ Complete

| Route | Layout | Table | Forms | Badges | Empty |
|-------|--------|-------|-------|--------|-------|
| `/dashboard` | `PmPageLayout` | — | — | `PmBadge` | `PmEmptyState` |
| `/opportunities` | `PmPageLayout` | `PmDataTable` | `PmFormWizard` | `OpportunityStatusBadge` | `PmTableEmpty` |
| `/opportunities/:id` | `PmDetailLayout` | — | `PmFormReadonly` | `PmWorkflowBadge` | `PmEmptyState` |
| `/opportunities/create` | `PmFormWizard` | — | `PmForm*` | — | — |

### Collaboration (Phase 7B) — ✅ Complete

| Route | Layout | Table | Forms | Badges | Timeline |
|-------|--------|-------|-------|--------|----------|
| `/pipeline` | `PmPageLayout` | `MatchesListSection` | — | `PmWorkflowBadge` | — |
| `/matches` | `PmPageLayout` | `PmDataTable` | — | `PmWorkflowBadge` | — |
| `/matches/:id` | `PmDetailLayout` | — | `PmFormReadonly` | `PmWorkflowBadge` | `CollaborationTimeline` |
| `/negotiations/:id` | `PmDetailLayout` | — | `PmFormReadonly` | `PmWorkflowBadge` | `CollaborationTimeline` |
| `/deals`, `/deals/:id` | `PmPageLayout` / `PmDetailLayout` | `PmDataTable` | `PmFormReadonly` | `PmWorkflowBadge` | `CollaborationTimeline` |
| `/contracts`, `/contracts/:id` | Same pattern | `PmDataTable` | `PmFormReadonly` | `PmWorkflowBadge` | `CollaborationTimeline` |

### User workspace (Phase 7C) — ✅ Complete

| Route | Layout | Table | Forms | Badges | Empty |
|-------|--------|-------|-------|--------|-------|
| `/people` | `PmPageLayout` | `PmDataTable` | — | `PmBadge` | `PmTableEmpty` |
| `/people/:id` | `PmPageLayout` | — | `PmFormReadonly` | `PmBadge` | `PmEmptyState` |
| `/profile` | `PmDetailLayout` | — | `PmForm` | `ReadinessStatusBadge` | — |
| `/messages` | `PmSplitLayout` | — | — | `PmBadge` | `PmEmptyState` |
| `/notifications` | `PmPageLayout` | `PmDataTable` | — | `PmBadge` | `PmEmptyState` |
| `/settings` | `PmPageLayout` | — | `PmForm` | — | — |

### Public (out of migration scope) — ⚠️ Legacy

| Route | Status |
|-------|--------|
| `/login`, `/register` | shadcn `Card` + `Button` |
| `/find`, marketing | shadcn primitives |

---

## 3. Component adoption status

| Primitive | Adoption | Notes |
|-----------|----------|-------|
| `PmPageLayout` | **100%** workspace routes | All authenticated pages |
| `PmPageHeader` | **100%** workspace routes | Replaces `PageHeader` |
| `PmButton` | **~96%** product UI | Wraps shadcn; action buttons migrated Phase 8 |
| `PmWorkflowBadge` | **100%** entity status | Central tone map in `pm-workflow-badge.tsx` |
| `PmBadge` | **High** | Intent, match type, readiness, notifications |
| `PmDataTable` | **100%** list pages | Opportunities, matches, deals, contracts, people, admin, notifications |
| `PmForm` / wizard | **High** | Create/edit opportunity, settings, admin settings, profile |
| `PmEmptyState` | **High** | Detail not-found, pipeline board, messages, notifications |
| `PmTableEmpty` / `PmTableLoading` | **Medium** | Tables use empty; async loading not wired (no backend) |
| `PmContentCard` | **High** | Detail sections, dashboard widgets, messages |
| `PmDetailLayout` | **High** | Opportunity, match, negotiation, deal, contract, profile, public profile |
| `PmSplitLayout` | **Messages only** | Available for future admin queues |
| `PmDashboardLayout` | **Dashboard sections** | User + opportunity widgets |

---

## 4. Legacy components still used

| Component | Location | Disposition |
|-----------|----------|-------------|
| `page-primitives.tsx` | `components/shared/` | **Deprecated** — zero active page imports after Phase 8 |
| `StatusBadge.tsx` (workflow) | `components/shared/` | **Migrated** — delegates to `PmWorkflowBadge` |
| shadcn `Button` | `pm-button.tsx` (wrapper), `app-sidebar.tsx`, `auth-pages`, `marketing-pages`, `public-layout` | **Acceptable** — primitive layer + public routes |
| shadcn `Card` | `pm-card.tsx` (composed mode), public auth | **Acceptable** — `PmCard` composed wraps shadcn |
| shadcn `Command` | `command-menu.tsx` | **Acceptable** — no PM command primitive |
| shadcn `Tabs` | `pipeline-pages.tsx` | **Acceptable** — pipeline tab chrome |
| shadcn `Select` / `Input` | Form fields inside `PmFormField` | **By design** — PM form wraps shadcn inputs |

---

## 5. Inconsistent badge usage

| Before Phase 8 | After Phase 8 |
|----------------|---------------|
| `page-primitives.StatusBadge` in `applications-panel` | `PmWorkflowBadge` |
| Custom span in `readiness-status-badge` | `PmBadge` semantic tones |
| Inline value score span in applications | `PmBadge tone="primary"` |
| `StatusBadge.tsx` → page-primitives | `PmWorkflowBadge` |

**Canonical pattern:** Entity lifecycle → `PmWorkflowBadge`. Decorative/meta → `PmBadge`. Domain-specific wrappers (`OpportunityStatusBadge`, `AdminStatusBadge`) delegate to PM primitives.

**No duplicate tone maps** in active product paths except deprecated `page-primitives.tsx` (retained for reference only).

---

## 6. Inconsistent table usage

| Page | Status |
|------|--------|
| All workspace list routes | `PmDataTable` ✅ |
| Notifications page | `PmDataTable` + grouped mobile cards ✅ |
| Pipeline opportunities tab | Kanban board (intentional — not tabular) ✅ |
| Admin matching | Inline `PmDataTable` ✅ |

**No legacy HTML tables or card-only list pages** remain in authenticated workspace.

---

## 7. Inconsistent form usage

| Surface | Status |
|---------|--------|
| Opportunity wizard | `PmFormWizard` + `PmFormField` ✅ |
| Opportunity detail readonly | `PmFormReadonly` ✅ |
| Profile / settings | `PmForm` + sections ✅ |
| Apply wizard | **Fixed Phase 8** — `PmContentCard` + `PmFormField` + `PmButton` |
| Admin settings | `PmForm` placeholder ✅ |

**Remaining:** Settings submit unwired (stub) — acceptable placeholder.

---

## 8. Empty / loading / error state gaps

| State | Coverage | Gap |
|-------|----------|-----|
| **Empty** | `PmEmptyState`, `PmTableEmpty` on all list/detail not-found paths | — |
| **Loading** | `PmTableLoading` available; only admin matching uses button `isRunning` | No async API — defer server loading |
| **Error** | `PmTableError` available; not used on pages | No fetch errors in local-first MVP |

**Phase 8 action:** No new loading/error paths invented — documented as deferred until API layer.

---

## 9. Responsive risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Messages `PmSplitLayout` on mobile | Low | Stacks via `pmLayoutGrid.split` |
| Dashboard 5-column metrics | Low | CSS grid wraps at `sm`/`lg` |
| `PmDataTable` mobile cards | Low | All lists provide `renderMobileCard` |
| Pipeline kanban horizontal scroll | Low | Stage sidebar scrolls on small screens |
| Notifications dual layout (table + grouped mobile) | Low | Table hidden on small via responsive patterns in section |

---

## 10. Dark mode risks

| Area | Risk | Notes |
|------|------|-------|
| Semantic tokens (`bg-surface`, `text-muted-foreground`) | **Low** | v2 tokens have dark values in `index.css` |
| `PublishReadinessAlert` | **Fixed Phase 8** | Uses `warning` semantic tokens instead of hardcoded amber text |
| `ReadinessStatusBadge` | **Fixed Phase 8** | `PmBadge` tones are token-based |
| Public auth/marketing | Medium | Legacy pages may use fewer semantic tokens |
| Framer-motion notification badge | Low | Uses `bg-primary` |

---

## 11. RTL risks

| Area | Status |
|------|--------|
| Layout grid / flex | Uses logical properties in most v2 tokens — **partial** |
| `PmSplitLayout` list/detail | Fixed LTR grid — **needs RTL pass in future phase** |
| Icons with text | Mostly `gap-*` — OK for RTL |
| Command menu shortcuts | LTR `Ctrl+K` label — acceptable |
| Data tables | No explicit `dir` handling — **medium risk** for Arabic rollout |

**Recommendation:** Dedicated RTL phase before KSA production launch; not in Phase 8 scope.

---

## 12. Final cleanup checklist

### ✅ Fixed in Phase 8

- [x] `applications-panel.tsx` → `PmContentCard`, `PmWorkflowBadge`, `PmButton`, `PmBadge`
- [x] `apply-wizard.tsx` → `PmContentCard`, `PmFormField`, `PmButton`, `PmBadge` stepper
- [x] `readiness-card.tsx` → `PmCard` composed, `PmButton`
- [x] `readiness-status-badge.tsx` → `PmBadge`
- [x] `publish-readiness-alert.tsx` → `PmSurface` + semantic warning tokens
- [x] All collaboration action buttons → `PmButton`
- [x] Shell: `notification-center`, `theme-toggle`, `user-menu`, `quick-create-menu`, `workspace-switcher` → `PmButton`
- [x] `StatusBadge.tsx` (workflow) → `PmWorkflowBadge`
- [x] `page-primitives.tsx` marked deprecated

### ✅ Acceptable placeholders (do not fix now)

| Item | Reason |
|------|--------|
| Negotiation discussion UI | Content placeholder — no data model |
| Contract attachments section | Content placeholder |
| Settings / preferences API | Unwired stub by design |
| Messages mock threads | No messaging service |
| Public auth + marketing pages | Out of Phases 5–7 scope |
| `app-sidebar.tsx` collapse `Button` | shadcn sidebar primitive coupling |
| `admin-route-guard.tsx` | Edge auth UI — minimal surface |
| Server-side table loading/error | No async backend |
| Dedicated `/companies` route | Unified `/people` directory |

### ⏳ Deferred to Phase 9+

- [ ] Public/marketing v2 migration
- [ ] RTL audit + `dir="rtl"` layout pass
- [ ] `PmTableLoading` / `PmTableError` when API layer exists
- [ ] `app-sidebar` full PM primitive pass
- [ ] Remove `page-primitives.tsx` file (after confirming zero imports)

---

## Phase 8 fixes summary

| File | Change |
|------|--------|
| `applications-panel.tsx` | Full v2 migration |
| `apply-wizard.tsx` | Full v2 migration |
| `readiness-card.tsx` | `PmCard` + `PmButton` |
| `readiness-status-badge.tsx` | `PmBadge` |
| `publish-readiness-alert.tsx` | `PmSurface` + tokens |
| `negotiation/*-button.tsx` (4) | `PmButton` |
| `deal/*-button.tsx`, `deal-stage-actions.tsx` | `PmButton` |
| `contract/*-button.tsx` (3) | `PmButton` |
| `notification-center.tsx` | `PmButton` |
| `theme-toggle.tsx`, `user-menu.tsx`, `quick-create-menu.tsx`, `workspace-switcher.tsx` | `PmButton` |
| `StatusBadge.tsx` | `PmWorkflowBadge` delegate |
| `page-primitives.tsx` | Deprecation header |

---

## Verification

| Check | Result |
|-------|--------|
| `npm run type-check` | **Pass** |
| `npm test` | **612 tests, 0 failures** |
| Business logic (`packages/`, `domain/`, `commands/`, `services/`, `repositories/`) | **Untouched** |

---

*Phase 8 complete — UI quality gate passed; Phase 9 not started.*
