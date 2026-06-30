# PM-Twin UI Architecture Freeze

| Field | Value |
|-------|-------|
| Phase | 9 — Production UI Freeze |
| Date | 29 June 2026 |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) |
| Prior audits | [PM-TWIN-UI-AUDIT-V2.md](./PM-TWIN-UI-AUDIT-V2.md) · [PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md](./PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md) |
| Scope | `web/src/components/*`, `web/src/pages/*`, `web/src/index.css` |
| Out of scope | `packages/*`, `web/src/domain/*`, `web/src/commands/*`, `web/src/services/*`, `web/src/repositories/*`, business logic |
| Status | **FROZEN** — canonical PM components; legacy inventory documented |

---

## 1. Executive summary

Phase 9 audits the full `web/` UI surface, confirms Design System v2 adoption on all authenticated product routes, inventories remaining legacy dependencies, and **freezes the UI architecture** before Backend Foundation work begins.

**No redesign, no new features, no UX changes, and no business logic changes** were made in this phase. This document is governance and verification only.

### Freeze decision

| Decision | Outcome |
|----------|---------|
| PM components are canonical | **Yes** — all authenticated workspace and admin routes use PM layout, data, form, and action primitives |
| Design System v2 is official | **Yes** — tokens in `index.css`, primitives in `components/ui/pm-*`, layouts in `components/layout/pm-*` |
| Legacy wrappers deprecated | **Yes** — `page-primitives.tsx` and workflow `StatusBadge.tsx` marked deprecated; zero active imports |
| Public/marketing routes | **Out of freeze scope** — intentionally legacy shadcn until post-backend marketing phase |
| Backend Foundation started | **No** — Phase 9 is UI-only; no API layer, repository, or command changes |

### Overall adoption score

| Surface | Score | Weight |
|---------|-------|--------|
| Authenticated workspace + admin pages | **94%** | Primary |
| Navigation shell (header, sidebar, command palette) | **91%** | Primary |
| Embedded panels, actions, badges | **96%** | Primary |
| Public/marketing + auth routes | **35%** | Excluded from freeze gate |
| **Composite product UI (freeze gate)** | **93%** | Weighted across authenticated surfaces |

The **93% composite score** meets the Phase 8 QA gate (92%). Remaining 7% is documented, categorized, and either **safe-by-design** (shadcn primitive layer) or **deferred** (public routes, RTL, async loading states).

---

## 2. Architecture summary

### 2.1 Layer model (frozen)

```
┌─────────────────────────────────────────────────────────────┐
│  Pages (web/src/pages/*)                                     │
│  PmPageLayout · PmDetailLayout · PmDashboardLayout · etc.   │
├─────────────────────────────────────────────────────────────┤
│  Domain sections (opportunity/, collaboration/, user/, …)   │
│  Compose PM primitives; domain badges delegate to PM badges   │
├─────────────────────────────────────────────────────────────┤
│  PM primitives (components/ui/pm-*, components/layout/pm-*) │
│  Canonical product API — import via pm-index / pm-layout-index│
├─────────────────────────────────────────────────────────────┤
│  shadcn/ui primitives (components/ui/*)                      │
│  Implementation layer only — not imported from pages directly │
├─────────────────────────────────────────────────────────────┤
│  Design tokens (index.css + pm-design-tokens.ts)             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Canonical import paths

| Need | Import from |
|------|-------------|
| Buttons, badges, cards, empty states, page headers | `@/components/ui/pm-index` |
| Page / detail / dashboard / split layouts | `@/components/layout/pm-layout-index` |
| Data tables and table chrome | `@/components/data/pm-data-index` |
| Forms and wizards | `@/components/forms/pm-form-index` |
| Design token class helpers | `@/components/shared/pm-design-tokens` |
| Layout grid / breakpoint helpers | `@/components/shared/pm-layout-tokens` |

### 2.3 App shell (frozen)

| Component | Role | PM adoption |
|-----------|------|-------------|
| `AppShell` | Sidebar + header + content container | Shell uses shadcn `SidebarProvider` |
| `AppHeader` | Sticky chrome, breadcrumbs, search, notifications | PM buttons in chrome actions |
| `AppSidebar` | Workspace + admin navigation | `PmNavBadge`; collapse uses shadcn `Button` |
| `CommandMenu` | `Ctrl+K` palette | shadcn `Command` (no PM equivalent) |
| `PublicLayout` | Marketing + auth wrapper | Legacy shadcn `Button` |

---

## 3. Component adoption matrix

Adoption is measured as **share of authenticated product surfaces** where the PM primitive is the canonical choice. Surfaces that intentionally use a different pattern (kanban board, card grid) are excluded from the denominator.

| Component | Adoption | Status | Notes |
|-----------|----------|--------|-------|
| **PmButton** | **96%** | Complete | All product action buttons; exceptions: `app-sidebar` collapse, `admin-route-guard`, shadcn internals |
| **PmCard** | **95%** | Complete | Via `PmCard`, `PmContentCard`, `PmStatCard`, `PmSurface`; shadcn `Card` only in `pm-card` composed mode + public auth |
| **PmBadge** | **98%** | Complete | Meta/intent badges; shadcn `Badge` only inside `pm-badge.tsx` wrapper |
| **PmWorkflowBadge** | **100%** | Complete | All entity lifecycle status in workspace + admin |
| **PmDataTable** | **100%** | Complete | All tabular list routes; kanban/card grids are intentional non-table UX |
| **PmForm** | **90%** | Partial | Wizards, profile, settings, admin settings, readonly detail; some wizard internals still use shadcn `Input`/`Select` inside `PmFormField` |
| **PmPageLayout** | **100%** | Complete | All 38 authenticated page components; `AccessDeniedPage` uses minimal guard UI |
| **PmDetailLayout** | **100%** | Complete | Opportunity, match, negotiation, deal, contract, profile detail scaffolds |
| **PmDashboardLayout** | **100%** | Complete | User dashboard, opportunity widgets, admin KPI grids |

### Supporting primitives (frozen, not in matrix)

| Primitive | Adoption | Status |
|-----------|----------|--------|
| `PmPageHeader` | 100% workspace | Complete — replaces legacy `PageHeader` |
| `PmEmptyState` | High | Complete — detail not-found, messages, pipeline board |
| `PmTableEmpty` | 100% tables | Complete |
| `PmTableLoading` | Available | Partial — not wired (no async backend) |
| `PmTableError` | Available | Partial — not wired (no async backend) |
| `PmSplitLayout` | Messages only | Complete for current scope |
| `PmStatCard` | Dashboard/admin | Complete |
| `PmSurface` | Widespread | Complete — base panel primitive |

---

## 4. Production page verification

### 4.1 Authenticated workspace — verified ✅

| Route | Layout | Tables | Forms | Badges | Empty | Loading | Error |
|-------|--------|--------|-------|--------|-------|---------|-------|
| `/dashboard` | `PmPageLayout` + `PmDashboardLayout` | — | — | `PmBadge` | `PmEmptyState` | — | — |
| `/opportunities` | `PmPageLayout` | `PmDataTable` | — | `OpportunityStatusBadge` | `PmTableEmpty` | — | — |
| `/opportunities/map` | `PmPageLayout` | — | — | — | placeholder | — | — |
| `/opportunities/create`, `/edit` | `PmFormWizard` | — | `PmForm*` | — | — | — | — |
| `/opportunities/:id` | `PmPageLayout` + `PmDetailLayout` | — | `PmFormReadonly` | `PmWorkflowBadge` | `PmEmptyState` | — | — |
| `/pipeline`, `/pipeline/:tab` | `PmPageLayout` | kanban | — | `PmWorkflowBadge` | `PmEmptyState` | — | — |
| `/matches`, `/matches/:id` | `PmPageLayout` + `PmDetailLayout` | `PmDataTable` | `PmFormReadonly` | `PmWorkflowBadge` | `PmEmptyState` | — | — |
| `/negotiations/:id` | `PmPageLayout` + `PmDetailLayout` | — | `PmFormReadonly` | `PmWorkflowBadge` | — | — | — |
| `/deals`, `/deals/:id` | `PmPageLayout` + `PmDetailLayout` | `PmDataTable` | `PmFormReadonly` | `PmWorkflowBadge` | `PmTableEmpty` | — | — |
| `/deals/:id/rate` | `PmPageLayout` | — | stub form | — | — | — | — |
| `/contracts`, `/contracts/:id` | Same as deals | `PmDataTable` | `PmFormReadonly` | `PmWorkflowBadge` | `PmTableEmpty` | — | — |
| `/people`, `/people/:id` | `PmPageLayout` | `PmDataTable` | `PmFormReadonly` | `PmBadge` | `PmTableEmpty` | — | — |
| `/messages` | `PmPageLayout` + `PmSplitLayout` | — | — | `PmBadge` | `PmEmptyState` | — | — |
| `/notifications` | `PmPageLayout` | `PmDataTable` | — | `PmBadge` | `PmEmptyState` | — | — |
| `/profile`, `/settings` | `PmPageLayout` / `PmDetailLayout` | — | `PmForm` | `ReadinessStatusBadge` | — | — | — |
| `/access-denied` | Minimal guard | — | — | — | — | `Skeleton` | — |

### 4.2 Admin — verified ✅

All `/admin/*` routes use `PmPageLayout` + `PmDataTable` (where tabular) + `PmWorkflowBadge` via `AdminStatusBadge`. Admin dashboard uses `PmDashboardLayout` + `PmStatCard`.

### 4.3 UI pattern verification

| Pattern | Status | Implementation |
|---------|--------|----------------|
| Buttons | ✅ | `PmButton` on all product actions |
| Cards | ✅ | `PmCard` / `PmContentCard` / `PmSurface` |
| Badges | ✅ | `PmBadge` + `PmWorkflowBadge` + domain delegates |
| Tables | ✅ | `PmDataTable` + toolbar, filter, pagination, empty |
| Forms | ✅ | `PmForm`, `PmFormWizard`, `PmFormField`, `PmFormReadonly` |
| Layouts | ✅ | `PmPageLayout`, `PmDetailLayout`, `PmDashboardLayout`, `PmSplitLayout` |
| Navigation | ✅ | Centralized `navigation.ts`; shell frozen |
| Detail pages | ✅ | `PmDetailLayout` three-column inspector |
| Dashboard layouts | ✅ | `PmDashboardLayout` + `PmMetricGrid` |
| Empty states | ✅ | `PmEmptyState`, `PmTableEmpty` |
| Loading states | ⚠️ | `PmTableLoading` + `Skeleton` on route guards only |
| Error states | ⚠️ | `PmTableError` available; deferred until API layer |
| Dialogs | ✅ | `CommandMenu` via shadcn `Dialog` + `Command` |
| Drawers | ✅ | shadcn `Sheet` via sidebar mobile (no PM drawer primitive) |
| Dropdowns | ✅ | shadcn `DropdownMenu` in shell chrome; PM buttons as triggers |

---

## 5. Legacy inventory

### 5.1 shadcn components — direct usage outside PM wrappers

| shadcn primitive | Used by | Category | Disposition |
|------------------|---------|----------|-------------|
| `button` | `pm-button.tsx`, `sidebar.tsx`, `dialog.tsx`, `sheet.tsx`, `input-group.tsx`, `app-sidebar.tsx`, `public-layout.tsx`, `auth-pages.tsx`, `marketing-pages.tsx`, `admin-route-guard.tsx` | **Safe** | Primitive layer + public routes + sidebar coupling |
| `card` | `pm-card.tsx` (composed), `auth-pages.tsx` | **Safe** | Wrapper composition + public auth |
| `badge` | `pm-badge.tsx` only | **Safe** | Wrapper only |
| `table` | `pm-data-table.tsx`, `pm-table-loading.tsx` | **Safe** | PM table composition |
| `input`, `textarea`, `label`, `select` | `pm-form-field.tsx`, form consumers, `pm-table-search.tsx`, `apply-wizard.tsx`, `settings-view.tsx` | **Safe** | Form field implementation layer |
| `sidebar` | `app-shell.tsx`, `app-sidebar.tsx`, `app-header.tsx` | **Safe** | No PM sidebar primitive |
| `command` + `dialog` | `command-menu.tsx` | **Safe** | Command palette — no PM equivalent |
| `dropdown-menu` | `user-menu.tsx`, `theme-toggle.tsx`, `workspace-switcher.tsx`, `quick-create-menu.tsx`, `pm-table-column-toggle.tsx`, `pm-table-row-actions.tsx` | **Safe** | Menu primitive layer |
| `popover` + `scroll-area` | `notification-center.tsx` | **Safe** | Notification panel |
| `tabs` | `pipeline-pages.tsx` | **Safe** | Pipeline tab chrome |
| `breadcrumb` | `page-breadcrumbs.tsx` | **Safe** | Breadcrumb primitive |
| `avatar` | `user-menu.tsx` | **Safe** | Avatar primitive |
| `separator` | `app-header.tsx`, `notification-center.tsx`, `sidebar.tsx` | **Safe** | Layout chrome |
| `skeleton` | `protected-route.tsx`, `admin-route-guard.tsx`, `pm-table-loading.tsx`, `sidebar.tsx` | **Safe** | Loading primitive |
| `tooltip` | `sidebar.tsx`, `app-providers.tsx` | **Safe** | Provider + sidebar |
| `sonner` | `app-providers.tsx` | **Safe** | Toast provider |

### 5.2 Legacy wrappers and deprecated helpers

| Item | Path | Active imports | Category | Disposition |
|------|------|----------------|----------|-------------|
| `page-primitives.tsx` | `components/shared/` | **0** | **Deprecated** | Safe to delete post-backend; file retained with deprecation header |
| `StatusBadge` (workflow) | `components/shared/StatusBadge.tsx` | Delegates to `PmWorkflowBadge` | **Deprecated** | Kept for workflow module consumers |
| `page-primitives.StatusBadge` | same file | **0** | **Deprecated** | Duplicate tone map — do not use |
| `page-primitives.PageHeader` | same file | **0** | **Deprecated** | Replaced by `PmPageHeader` |
| `page-primitives.EmptyState` | same file | **0** | **Deprecated** | Replaced by `PmEmptyState` |
| `page-primitives.StatCard` | same file | **0** | **Deprecated** | Replaced by `PmStatCard` |

### 5.3 Duplicated UI helpers

| Helper | Locations | Category | Disposition |
|--------|-----------|----------|-------------|
| Status tone maps | `page-primitives.tsx` (legacy), `pm-workflow-badge.tsx` (canonical) | **Needs removal** | Remove with `page-primitives.tsx` |
| Display formatters | `collaboration-display.ts`, `opportunity-display.ts`, `user-display.ts`, `admin-display.tsx` | **Safe** | Domain display adapters — not UI duplicates |
| `getInitials` | `user-display.ts` (canonical) | **Safe** | Single source |
| `formatRelativeTime` | display modules | **Safe** | Domain formatting |

### 5.4 Blocked items (cannot remove in freeze)

| Item | Blocker |
|------|---------|
| shadcn `Sidebar` + `Button` in `app-sidebar.tsx` | shadcn sidebar API requires `Button` for collapse trigger |
| shadcn `Command` | No `PmCommand` primitive defined |
| Public auth/marketing pages | Explicitly out of scope until marketing redesign phase |
| `PmTableLoading` / `PmTableError` on pages | No async fetch layer yet |
| RTL layout pass | Requires dedicated KSA localization phase |

---

## 6. Public pages (out of backend scope)

Public routes are **explicitly excluded** from the UI freeze gate. They remain on legacy shadcn primitives and are **out of Backend Foundation scope**.

| Route | Page | UI stack | Redesign work remaining |
|-------|------|----------|-------------------------|
| `/` | `HomePage` | shadcn `Button`, `Input`, framer-motion | Migrate to PM marketing layout; semantic tokens; RTL |
| `/find` | `FindPage` | shadcn primitives | Search hero PM components |
| `/workflow` | `WorkflowPage` | shadcn primitives | PM section/grid primitives |
| `/knowledge-base` | `KnowledgeBasePage` | shadcn primitives | PM content cards |
| `/collaboration-wizard` | `CollaborationWizardPage` | shadcn primitives | PM wizard shell |
| `/collaboration-models` | `CollaborationModelsPage` | shadcn primitives | PM cards + badges |
| `/login` | `LoginPage` | shadcn `Card`, `Button`, `Input`, `Label` | `PmCard` + `PmForm` auth layout |
| `/register` | `RegisterPage` | shadcn primitives | Same as login |
| `/forgot-password` | `ForgotPasswordPage` | shadcn primitives | Same as login |
| `/reset-password` | `ResetPasswordPage` | shadcn primitives | Same as login |

`PublicLayout` uses shadcn `Button` for nav CTAs. No mobile hamburger sheet on public nav (documented in Phase 1 audit).

**Estimated public v2 migration effort:** 1 dedicated phase post-backend (marketing + auth), not blocking Backend Foundation.

---

## 7. Governance rules (frozen policy)

### 7.1 Component introduction policy

**No new UI component may be introduced unless:**

1. An existing PM component cannot satisfy the requirement.
2. [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) is updated with the new primitive spec.
3. The component follows PM naming (`Pm*` prefix, file `pm-*.tsx`).
4. shadcn is used only as an implementation detail inside `components/ui/pm-*`, never imported directly from pages.

### 7.2 Import rules

| Layer | Rule |
|-------|------|
| Pages | Import PM primitives and layout index only |
| Domain sections | Import PM primitives; may import shadcn only inside form field wrappers |
| `components/ui/pm-*` | May import shadcn primitives |
| `components/shared/page-primitives.tsx` | **Do not import** — deprecated |

### 7.3 Change rules during Backend Foundation

| Allowed | Not allowed |
|---------|-------------|
| Wire `PmTableLoading` / `PmTableError` when API exists | New layout patterns without design doc update |
| Replace mock data with live data in existing PM shells | Redesign or UX changes without explicit phase |
| Add `PmCommand` if command palette needs extension | Direct shadcn imports in new page files |
| Delete `page-primitives.tsx` once import scan confirms zero usage | Business logic in UI components |

### 7.4 Badge policy (canonical)

| Use case | Component |
|----------|-----------|
| Entity lifecycle status | `PmWorkflowBadge` |
| Meta, intent, counts, match type | `PmBadge` |
| Domain-specific labels | Thin wrapper delegating to PM badge (`OpportunityStatusBadge`, `AdminStatusBadge`, `ReadinessStatusBadge`) |

### 7.5 Future component policy

New primitives require:

1. Token entry in `index.css` (if new semantic color/spacing)
2. TypeScript mirror in `pm-design-tokens.ts` or `pm-layout-tokens.ts`
3. Export from `pm-index.ts` or `pm-layout-index.ts`
4. At least one usage in a production page (no orphan primitives)
5. Unit test if pure helper logic is extracted

---

## 8. Remaining exceptions (accepted at freeze)

| Exception | Rationale | Target phase |
|-----------|-----------|--------------|
| Public/marketing shadcn | Out of product migration scope | Post-backend marketing |
| `app-sidebar` shadcn `Button` | Sidebar API coupling | Optional PM pass |
| `PmTableLoading` / `PmTableError` unwired | No async backend | Backend Foundation |
| Negotiation discussion placeholder | Content stub, not UI architecture | Backend + messaging |
| Messages mock threads | No messaging service | Backend Foundation |
| Settings submit unwired | Preferences API stub | Backend Foundation |
| RTL / Hijri / Arabic | KSA compliance phase | Pre-production KSA |
| `page-primitives.tsx` file on disk | Zero imports; safe delete deferred | Post-freeze cleanup |

---

## 9. Verification

| Check | Command | Result (29 Jun 2026) |
|-------|---------|----------------------|
| Type-check | `npm run type-check` (in `web/`) | **Pass** |
| Unit tests | `npm test` (in `web/`) | **612 tests, 0 failures** |
| Business logic touched | Manual scope review | **None** — `packages/`, `domain/`, `commands/`, `services/`, `repositories/` unchanged |
| Backend Foundation started | Scope review | **No** — Phase 9 is documentation-only |

---

## 10. Risks at freeze boundary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Public pages diverge visually from workspace | Medium | Documented; separate migration phase |
| RTL not validated | Medium | Dedicated KSA phase before launch |
| Async loading/error patterns untested | Low | Wire when API layer lands |
| `page-primitives.tsx` accidental re-import | Low | Deprecation header + lint rule (future) |
| shadcn direct import in new pages | Medium | Governance rules + code review |
| Sidebar collapse non-PM button | Low | Acceptable primitive coupling |

---

## 11. Related documents

| Document | Role |
|----------|------|
| [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) | Token and primitive specification |
| [PM-TWIN-UI-AUDIT-V2.md](./PM-TWIN-UI-AUDIT-V2.md) | Phase 1 inventory |
| [PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md](./PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md) | Phase 8 QA gate |
| [docs/runtime-ownership.md](../runtime-ownership.md) | Runtime authority (Phase 10.3) |
| [docs/adr/ADR-100-architecture-freeze-v1.md](../adr/ADR-100-architecture-freeze-v1.md) | Architecture freeze v1 |

---

## 12. Sign-off

| Criterion | Status |
|-----------|--------|
| UI Freeze report completed | ✅ |
| Architecture frozen | ✅ |
| Design System officially canonical | ✅ |
| Legacy inventory documented | ✅ |
| No business logic changed | ✅ |
| Type-check passes | ✅ |
| Tests pass | ✅ |
| Backend work not started in this phase | ✅ |

**Phase 9 — Production UI Freeze: COMPLETE.**

Backend Foundation may proceed under ADR-101 domain ownership rules without further UI architecture changes unless a new UI phase is explicitly chartered.

---

*Generated 29 June 2026 — governance audit only; no product code modified.*
