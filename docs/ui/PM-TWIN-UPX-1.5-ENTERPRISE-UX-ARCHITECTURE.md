# PM-Twin UPX-1.5 — Enterprise UX Architecture

| Field | Value |
|-------|-------|
| Phase | UPX-1.5 — Enterprise UX Architecture |
| Status | **Specification** (no implementation) |
| Scope | Unified design language for **all authenticated pages** (`AppShell`) |
| Out of scope | Business logic, lifecycle, commands, repositories, APIs, routing, permissions, matching |
| Authority chain | UPX-1 Audit → This document → [PM-TWIN-DESIGN-LANGUAGE.md](./PM-TWIN-DESIGN-LANGUAGE.md) → `@/tokens` |
| Audience | Product, design, engineering |
| Date | July 2026 |

---

## Executive summary

PM-Twin adopts **one authenticated design language** — **Adaptive Enterprise Modern** — across workspace, admin, and settings surfaces. Public/marketing pages are a **separate acquisition layer** that must visually converge to the same token system but are not governed by page templates in this document.

Authenticated UX is organized into **five page archetypes**:

1. **Browse** — find, filter, compare, open entities
2. **Detail** — understand state, act on one entity, inspect context
3. **Dashboard** — orient, prioritize, route to work
4. **Admin** — operate, audit, configure platform (elevated role)
5. **Settings** — manage account, preferences, and creation flows

Every authenticated page **must** compose from the same primitives: `AppShell` → `PmPage` → archetype template → governed components. No page may introduce parallel button, badge, empty-state, or layout systems.

---

## Design principles

### P1 — One surface, one primary action

Each page, card, and inspector panel exposes **at most one primary (default) button**. Secondary and destructive actions defer to outline buttons or overflow menus.

### P2 — Entity-first hierarchy

Users scan **status → entity name → context → metadata → actions**. Lifecycle state always appears before decorative metadata.

### P3 — Workspace vs marketplace is language, not layout

Browse pages use identical scaffolding whether the user is in **My Workspace** or **Marketplace**. Only copy, default filters, and available actions change — never grid density, header structure, or component choice.

### P4 — Progressive disclosure

Default density is **comfortable enterprise** (not consumer-sparse, not terminal-dense). Advanced fields, technical IDs, and audit metadata live in disclosure sections or inspector rails.

### P5 — Table when comparing; card when deciding

Tables optimize **columnar comparison** across homogeneous records. Cards optimize **entity identity and action** when records differ in shape or require rich previews.

### P6 — Fail gracefully, recover obviously

Empty, loading, and error states are **first-class templates** with prescribed copy branches and recovery CTAs. Never show a blank canvas.

### P7 — RTL-native, Arabic-ready

All layout uses **logical properties** (`start`/`end`, `ms`/`me`). Arabic is not a bolt-on theme; it is a first-class reading direction with mirrored navigation and preserved numerals policy.

### P8 — Accessibility is architectural

Keyboard paths, focus order, live regions, and touch targets are specified per archetype — not left to component defaults.

### P9 — Governance over heroics

Pages do not invent typography, color, spacing, or shadows. Tokens and templates are the only extension points.

### P10 — Admin is workspace+, not workspace−

Admin pages use the **same** primitives with an Admin context label, elevated audit affordances, and stricter read-only defaults — not a separate visual system.

---

## Global design system

### Spacing system

| Token | CSS utility | Value role |
|-------|-------------|------------|
| `--pm-space-page-x` | `.pm-page-padding` (inline) | Horizontal page inset |
| `--pm-space-page-y` | `.pm-page-padding` (block) | Vertical page inset |
| `--pm-space-section` | `.pm-section-gap` | Gap between major page sections |
| `--pm-space-card` | `.pm-card-padding` | Card interior default |
| `--pm-space-form` | `.pm-form-gap` | Form field stack |

**In-component gaps** (when no token exists):

| Gap | Use |
|-----|-----|
| `gap-1` / `gap-1.5` | Badge rows, chip internals |
| `gap-2` | Button groups, filter chip bar, action rows |
| `gap-3` | Card interior sections, list row content |
| `gap-4` | Card grids, mobile toolbar stacks |
| `gap-6` | Header title/metric split, detail column gaps |

**Rule:** Token spacing at page/section boundaries; Tailwind `gap-*` inside components.

### Typography scale

Authoritative roles via `pmTypography` (`@/tokens`). Pages **never** use ad-hoc `text-lg font-semibold`.

| Role | Class | Use |
|------|-------|-----|
| display | `pm-text-display` | Marketing only (not authenticated) |
| h1 | `pm-text-h1` | Page title (`PmPageHeader`) |
| h2 | `pm-text-h2` | Major page sections |
| h3 | `pm-text-h3` | Card titles, linked entity names |
| body | `pm-text-body` | Primary prose |
| bodySm | `pm-text-body-sm` | Secondary prose, descriptions |
| caption | `pm-text-caption` | Timestamps, hints, meta |
| label | `pm-text-label` | Form labels, filter dimension labels |
| stat | `pm-text-stat` | KPI values (`tabular-nums`) |
| statLabel | `pm-text-stat-label` | KPI captions |
| overline | `pm-text-overline` | Eyebrows, purpose labels, Admin context |
| badge | `pm-text-badge` | Badge/chip label |
| mono | `pm-text-mono` | IDs, codes, hashes |

**Fonts:** Plus Jakarta Sans (headings), system UI (body), system mono (IDs). Arabic uses the same role mapping with RTL flow.

### Card hierarchy

| Level | Primitive | Elevation | Use |
|-------|-----------|-----------|-----|
| L0 — Surface | `PmSurface` | flat / `pm-shadow-card` | Static blocks, list row containers |
| L1 — Content card | `PmContentCard` | `pm-shadow-card` | Section grouping with optional header |
| L2 — Interactive card | `PmSurface interactive` | hover lift | Browse grid items, dashboard workflow tiles |
| L3 — Metric card | `PmStatCard` | `pm-shadow-card` | KPI cells |
| L4 — Inspector panel | `PmInspectorLayout` | `pm-shadow-card`, `rounded-2xl` | Detail right rail |
| L5 — Modal / dialog | shadcn dialog + tokens | `pmElevation.modal` | Destructive confirms, multi-step interrupts |

**Nesting rule:** Cards may contain surfaces and disclosure sections. **Cards must not nest cards** deeper than one level (L1 inside L0 only). Inspector is a sibling column, not a nested card inside main.

### Elevation system

| Level | Token | Use |
|-------|-------|-----|
| 0 | none | Inline rows, table body |
| 1 | `pm-shadow-card` | Cards, inspectors, table container |
| 2 | `pmElevation.floating` | Dropdowns, popovers, tooltips |
| 3 | `pmElevation.modal` | Dialogs, command menu overlay |

No glassmorphism. No arbitrary `shadow-[rgba(...)]` — token-referenced shadows only.

### Page width rules

| Context | Max width | Behavior |
|---------|-----------|----------|
| Default authenticated content | `pmContentWidth.default` (full shell main) | Fluid within main column |
| Dashboard metric grids | full width | Columns cap via `resolveMetricColumns` |
| Settings forms | `max-w-2xl` centered in main | Single column |
| Wizard flows | `max-w-3xl` main + `max-w-xs` rail | Split within page |
| Detail layout | full main + fixed inspector (`pmLayoutGrid.detail`) | Inspector 320–380px desktop |
| Admin tables | full width | Horizontal scroll inside `PmSurface` table shell |

### Section spacing

- Between `PmPageHeader` and first content: **`gap-6`** (via `PmPage` `space-y-6`)
- Between major sections inside page body: **`pm-section-gap`**
- Between cards in a section: **`gap-4`** (mobile) → **`gap-4 md:gap-5`** for interactive grids
- Timeline / lifecycle blocks: **`space-y-4`** inside section

### Grid system

| Grid | Classes / token | Columns |
|------|-----------------|---------|
| Browse card grid | `grid gap-4 md:grid-cols-2 xl:grid-cols-3` | 1 → 2 → 3 |
| Dashboard metrics | `PmMetricGrid` / `resolveMetricColumns` | 2 → 4 by breakpoint |
| Detail layout | `pmLayoutGrid.detail` | Main fluid + inspector fixed |
| Stat row (detail) | `grid gap-3 sm:grid-cols-3` | Max **3** KPI cells |
| Board (pipeline) | `PmBoard` columns | 3–5 columns desktop, horizontal scroll mobile |

**Maximum columns:** 4 for metric strips; 3 for entity stat grids; 6 never on authenticated pages.

---

## App chrome (all authenticated pages)

### Sidebar behaviour

| Viewport | Behaviour |
|----------|-----------|
| Desktop (≥ `lg`) | Expanded by default; collapsible to icon rail; state persisted |
| Tablet (`md`–`lg`) | Collapsed icon rail default; expand overlay |
| Mobile (< `md`) | Hidden; opened via `SidebarTrigger` as sheet drawer |

- Active route: semantic highlight via `pm-nav-item`
- Badges: `PmNavBadge` for counts only (notifications, pending items)
- Admin section: visually separated group at bottom; only when `canAccessAdmin`

### Header behaviour (`AppHeader`)

- **Sticky** top (`z-20`), `h-14`, backdrop blur
- **Left:** sidebar trigger, workspace context (mobile), breadcrumbs (≥ `md`)
- **Center:** `GlobalSearch` (≥ `md` centered; compact on mobile)
- **Right:** Quick create, notifications, theme toggle, user menu
- Header **never** contains page-specific primary CTAs — those belong in `PmPageHeader`

### Navigation model

```
AppSidebar (persistent)
  → primary entity routes
  → pipeline / dashboard shortcuts
  → admin group (guarded)
AppHeader
  → breadcrumbs (contextual)
  → global search (cross-entity)
  → quick create (entity shortcuts)
Page (PmPageHeader)
  → page title + page-level actions
```

---

## Page archetypes

---

## 1. Browse Page

### Definition

A **Browse Page** helps users **discover, filter, and compare** a collection of entities before opening one. Browse is the default entry for list routes (`/opportunities`, `/deals`, `/people`, `/admin/users`, etc.).

### Layout

```
AppShell
└─ PmPage
   ├─ PmPageHeader (label, title, description, metric, badges, PmPageActions)
   ├─ PmBrowseToolbar (mandatory slot — see Filter/Search)
   └─ PmBrowseBody
      ├─ [PmDataTable | PmEntityGrid | delegated ListSection]
      └─ PmTablePagination (when paginated)
```

**`PmBrowseToolbar`** is a new governance name for the standardized composition:

`PmToolbarSurface` → `PmTableToolbar` → (search + filters + view tabs) → `PmFilterChips`

Toolbar is always **`PmPage` `toolbar` prop** — never embedded inconsistently inside table vs page.

### Components

| Slot | Component |
|------|-----------|
| Page shell | `PmPage` |
| Header | `PmPageHeader` + `PmPageHeroMetric` |
| Actions | `PmPageActions` (max 1 primary — e.g. Create) |
| Toolbar | `PmBrowseToolbar` |
| Data (tabular) | `PmDataTable` |
| Data (entity) | `PmEntityGrid` wrapping domain cards OR `PmEntityListCard` |
| Row actions | `PmTableRowActions` or `PmCardActions` |
| Mobile | `renderMobileCard` → `PmEntityListCard` |
| Pagination | `PmTablePagination` |

### Information hierarchy

1. **Context label** (Marketplace / My Workspace / Admin)
2. **Page title** + optional description
3. **Hero metric** (count in current view)
4. **Status summary badges** (aggregate counts by key states)
5. **Primary page action** (create, export)
6. **Toolbar** (view mode, search, filters)
7. **Active filter chips**
8. **Results** (table rows or cards)
9. **Pagination** footer

### Interaction model

- **Click row/card title** → navigate to Detail
- **Row/card actions** → inline secondary (view) or overflow
- **Search** debounced 300ms; resets page to 1
- **Filters** apply immediately; chips removable individually
- **Sort** via column header (tables only)
- **Selection** (future): bulk bar replaces toolbar when ≥1 selected

### Navigation

- Breadcrumb: `Home icon → Section → [Current list]`
- Back navigation is browser/sidebar — browse pages are top-level destinations
- Cross-links in empty states route to creation or related browse pages

### Responsive behaviour

| Viewport | Behaviour |
|----------|-----------|
| Mobile | Toolbar stacks vertical; tables → card list; filters in sheet/drawer if >3 controls |
| Tablet | 2-column card grid; table optional if ≥ `sm` |
| Desktop | Full table or 3-column card grid |

### Empty state

Branch via `resolveListEmptyState`:

| Branch | Component | Copy pattern |
|--------|-----------|--------------|
| First-run | `PmEmptyState` (default) | "No {entities} yet" + create CTA |
| Filtered | `PmTableEmpty` `no-results` | "No results" + clear filters |
| Error | `PmTableEmpty` `error-recovery` | Retry + support link |

### Loading state

- **Table:** `PmTableLoading` skeleton (5 rows default)
- **Grid:** 6 `PmSurface` pulse skeleton cards
- Toolbar remains interactive; results area skeleton only

### Error state

- Inline `PmTableEmpty` `error-recovery` in results slot
- Page header remains visible
- Do not redirect on recoverable list errors

### Action hierarchy

| Level | Allowed |
|-------|---------|
| Page header | 1 primary, 1 secondary, overflow |
| Row/card | 1 primary OR 1 secondary + overflow |
| Bulk (future) | 1 primary bulk, rest overflow |

### Status presentation

- Table status column: **`PmWorkflowBadge`** with entity context
- Card status: badge top-right or below title — consistent per entity type
- Scores: `PmMatchScoreBadge`, `PmReadinessScoreBadge` — never raw percentages in body text

---

## 2. Detail Page

### Definition

A **Detail Page** presents **one entity** with lifecycle context, recommended actions, related records, and activity history. Detail routes use `:id` params.

### Layout

```
AppShell
└─ PmPage
   ├─ PmPageHeader (tone = entity, metric, badges, PmPageActions)
   └─ PmDetailLayout
      ├─ main
      │  ├─ EntityLimitedViewBanner (if applicable)
      │  ├─ PmLifecycleMap
      │  ├─ PmActionHub ("Recommended next step")
      │  ├─ PmWorkflowLinksCard (related entities)
      │  └─ PmContentCard sections (domain panels)
      ├─ inspector (PmInspectorLayout)
      │  ├─ PmSectionHeader
      │  ├─ readonly fields / stage actions
      │  └─ footer: PmMoreActions (mutations)
      └─ timeline
         └─ PmTimeline | CollaborationTimeline | OpportunityTimeline
```

**Mandatory for workflow entities:** opportunity, match, negotiation, deal, contract.

**Required for all detail pages:** `PmPageHeader` + at least one content column. `PmDetailLayout` required when entity has inspector-worthy metadata or mutations.

### Components

| Slot | Component |
|------|-----------|
| Layout | `PmDetailLayout`, `PmInspectorLayout` |
| Lifecycle | `PmLifecycleMap` |
| Recommendation | `PmActionHub` |
| Related links | `PmWorkflowLinksCard` (extracted shared primitive) |
| Sections | `PmContentCard`, `PmDisclosureSection` |
| Readonly data | `PmFormReadonly` |
| Stage mutations | Domain action panel (e.g. `DealStageActions`) in inspector |
| Access | `EntityAccessDenied`, `EntityLimitedViewBanner` |
| Topology | `PmTopologyGraph` (match only) |

### Information hierarchy

1. Entity type label + purpose overline
2. **Title** (entity name)
3. **Description** (subtitle / summary)
4. **Hero metric** (score, readiness, participant count)
5. **Status badges** (workflow + domain chips)
6. **Page actions** (mutate lifecycle — primary forward action)
7. Lifecycle position (where am I in the flow?)
8. Recommended next step (single CTA hub)
9. Related workflow links
10. Domain content sections (progressive disclosure)
11. Inspector: actionable metadata + secondary mutations
12. Timeline: chronological activity (newest first or per product convention)

### Interaction model

- **Primary page action** advances lifecycle or opens primary downstream entity
- **Inspector actions** are secondary mutations (sign, terminate, stage move)
- **Disclosure sections** collapsed by default for technical/verbose content
- **Timeline** items link to related entities when applicable
- **Access denied** shows `EntityAccessDenied` with `backHref` → parent **Browse** route (entity list, not pipeline — standardized)

### Navigation

- Breadcrumb: `Section → List → [Entity title truncated]`
- `backHref` on access denied: always entity browse route (`/deals`, `/matches`, etc.)
- Workflow links card: outline buttons to related entities

### Responsive behaviour

| Viewport | Behaviour |
|----------|-----------|
| Mobile | Single column; inspector **below** main; timeline last |
| Tablet | Main + inspector stack or 60/40 if ≥ `lg` |
| Desktop | `pmLayoutGrid.detail` — main fluid + inspector sticky |

Inspector sticky: `PmStickyHeader` for inspector section headers on desktop.

### Empty state

| Case | Pattern |
|------|---------|
| Entity not found | `PmEmptyState` + link back to browse |
| Sub-section empty (e.g. attachments) | `PmEmptyState` `size="compact"` inside `PmContentCard` |
| No timeline events | Timeline shows single "No activity yet" caption row |

### Loading state

- Full page: `PmPage` with header skeleton + 3 content card skeletons
- Section lazy load: `PmDisclosureSection` skeleton inside card

### Error state

- Not found → empty state
- Permission denied → `EntityAccessDenied`
- Partial load failure → section-level error card with retry

### Action hierarchy

| Zone | Rules |
|------|-------|
| `PmPageHeader` | 1 primary forward lifecycle action |
| `PmActionHub` | 1 primary + 1 optional secondary |
| Inspector footer | Mutations via `PmMoreActions` if >1 |
| Section cards | No primary buttons — link style only |

**Never** duplicate the same lifecycle action in header and inspector.

### Status presentation

- Header: `PmWorkflowBadge` (canonical lifecycle from `@pm-twin/lifecycle`)
- Domain chips: `MatchTypeChip`, need/offer framework badge — max **3** badges in header row
- Lifecycle map: step states via `pmComponentTokens.lifecycle`

---

## 3. Dashboard Page

### Definition

A **Dashboard** orients the user, surfaces **metrics and attention queues**, and routes to Browse or Detail pages. It does not replace entity management.

**Includes:** `/dashboard`, `/pipeline` (workflow hub), `/admin` (admin command center).

### Layout

```
AppShell
└─ PmPage
   ├─ PmPageHeader (greeting/mission, hero metric, PmPageActions)
   └─ PmDashboardLayout
      ├─ PmStatsStrip (linked KPIs)
      ├─ PmActionHub | attention sections
      ├─ PmContentCard sections (queues, recommendations)
      └─ optional PmBoard (pipeline kanban)
```

### Components

| Slot | Component |
|------|-----------|
| Layout | `PmDashboardLayout`, `PmMetricGrid` |
| KPIs | `PmStatsStrip`, `PmStatCard` |
| Attention | `PmActionHub`, workflow card lists |
| Kanban | `PmBoard`, `PipelineBoard` |
| Recommendations | Domain cards (`MatchCard`, `OpportunityCard`) |
| Section chrome | `PmSectionHeader` |

### Information hierarchy

1. Context label ("My Workspace" / "Workflow" / "Admin")
2. Greeting or mission title
3. **Single hero metric** (readiness OR active workflow count)
4. Aggregate badges
5. Primary + secondary page actions
6. KPI strip (5 max linked stats)
7. **Needs attention** queue (max 5 items)
8. Active workflows / board
9. Recommendations / secondary feeds
10. Activity digest

### Interaction model

- KPI strip cells link to filtered Browse pages
- Action hub items: primary opens Detail, secondary opens Browse
- Board cards drag-disabled in MVP; click opens Detail
- Section "View all" links to Browse

### Navigation

- Dashboard is a **root** — sidebar highlights Dashboard or Pipeline
- No `:id` segment in URL for main dashboard

### Responsive behaviour

| Viewport | Behaviour |
|----------|-----------|
| Mobile | KPI strip scrolls horizontal; single column sections |
| Tablet | 2-column metric grid; board horizontal scroll |
| Desktop | Full metric grid; board columns visible |

### Empty state

- Per-section `PmEmptyState` `size="compact"` — dashboard **never** fully empty
- If all sections empty: single hero empty with onboarding CTAs

### Loading state

- KPI strip skeleton (5 cells)
- Section card skeletons (3)

### Error state

- Section-level error with retry; other sections remain visible

### Action hierarchy

- Page header: 1 primary (e.g. "Post opportunity"), 1 secondary ("My pipeline")
- Action hub: per-item primary only
- Section headers: text link only, not buttons

### Status presentation

- Workflow cards: `PmWorkflowBadge`
- Match types: `resolveMatchTypeStyle` chips
- Blocked items: warning-bordered `PmSurface`

---

## 4. Admin Page

### Definition

An **Admin Page** supports **platform operators** — user management, vetting, matching runs, audit, health, configuration. Uses authenticated design language with **Admin context** and elevated read-only defaults.

**Subtypes:** Admin Browse, Admin Detail, Admin Dashboard, Admin Settings.

### Layout

**Admin Browse** — identical to Browse with:

- `PmPageHeader` `label="Admin"` (or domain-specific queue label, e.g. "Queue" for vetting — badge must also show Admin in breadcrumb)
- `AdminListPage` scaffold → migrates to `PmBrowsePage` template

**Admin Dashboard** (`/admin`) — Dashboard template with platform health metrics.

**Admin Detail** — Detail template; readonly default; mutations gated.

**Admin Settings** — Settings template.

### Components

| Slot | Component |
|------|-----------|
| Lists | `PmDataTable` via `AdminListPage` → `PmBrowsePage` |
| Status | `AdminStatusBadge` → `PmWorkflowBadge` |
| Scores | `PmReadinessScoreBadge`, `PmMatchScoreBadge` |
| Health | Service list in `PmContentCard` (not ad-hoc divs) |
| Placeholder | `PmEmptyState` `variant="coming-soon"` (governed) |

### Information hierarchy

Same as Browse/Detail/Dashboard with addition:

- **Admin label** always visible in header or breadcrumb
- Audit metadata (actor, timestamp) prioritized on admin detail
- Destructive actions require confirmation dialog

### Interaction model

- Row actions: **view-only** default on admin lists
- Bulk export: secondary page action, not primary
- "Run matching" and similar: primary on Admin Matching only
- Admin detail pages that are stubs must show **coming soon** pattern, not blank

### Navigation

- Breadcrumb: `Admin → [Section] → [Entity]`
- Admin sidebar group isolated from workspace nav
- Reused workspace detail (`DealDetailPage` on admin route) still shows Admin breadcrumb context

### Responsive behaviour

Same as Browse/Detail templates.

### Empty state

- Seed-empty datasets: explicit copy ("No records in seed") + docs link for operators
- Coming soon pages: `PmTableEmpty` with `coming-soon` variant

### Loading state

Same as Browse.

### Error state

Same as Browse; add audit log entry on admin mutation failure (future).

### Action hierarchy

- Stricter than workspace: **no destructive primary** in page header
- Platform mutations (run matching) are primary only on their owning page

### Status presentation

- Always `PmWorkflowBadge` / `AdminStatusBadge` — no custom admin-only colors

---

## 5. Settings Page

### Definition

A **Settings Page** manages **user account, preferences, profile, and creation/edit flows** where the user is the subject or author. Includes `/settings`, `/profile`, opportunity create/edit, deal rate, admin settings.

### Layout

**Account settings** (`/settings`, `/profile`):

```
AppShell
└─ PmPage
   ├─ PmPageHeader (minimal: label + title)
   └─ SettingsView | ProfileView (max-w-2xl)
      └─ PmContentCard sections + PmForm*
```

**Creation/edit wizard:**

```
AppShell
└─ PmPage (no header prop)
   └─ PmFormWizard
      ├─ PmPageHeader (embedded, bordered={false})
      ├─ step content
      ├─ rail (readiness, summary)
      └─ PmFormActions footer
```

### Components

| Slot | Component |
|------|-----------|
| Forms | `PmForm`, `PmFormSection`, `PmFormField`, `PmFormGrid` |
| Wizard | `PmFormWizard`, `PmFormActions` |
| Readonly | `PmFormReadonly` (admin settings stubs) |
| Profile | `ProfileView`, `SettingsView`, `PublicProfileView` |

### Information hierarchy

1. Settings category label ("Account", "Profile")
2. Section title
3. Field labels → values
4. Save actions at section or page footer — **not** in `AppHeader`

### Interaction model

- Explicit save (no silent auto-save in MVP)
- Validation inline per field
- Wizard: linear steps with back/next; draft save on create flows
- Destructive account actions in overflow at page bottom

### Navigation

- Breadcrumb: `Settings` or `Create opportunity` — no sidebar sub-route explosion
- Wizard cancel returns to parent Browse or Detail

### Responsive behaviour

- Single column always for settings forms
- Wizard rail collapses below main on mobile

### Empty state

- Rare; profile sections may show "Not set" placeholder text, not empty state component

### Loading state

- Form skeleton fields (3–5 rows)

### Error state

- Field-level errors + form-level banner
- Toast on save failure with retry

### Action hierarchy

- Wizard footer: 1 primary (continue/publish), 1 secondary (save draft), cancel as ghost/link
- Settings: 1 primary save per form section max

### Status presentation

- Profile readiness: `PmReadinessScoreBadge` in profile header
- Verification status: `PmBadge` tone variants

---

## Cross-cutting interaction systems

### Filter behaviour

| Rule | Specification |
|------|---------------|
| Placement | Always inside `PmBrowseToolbar` on `PmPage` `toolbar` slot |
| Structure | `PmTableToolbar` wrapping controls |
| Popover labels | `pmTypography.label` |
| Active filters | `PmFilterChips` below toolbar |
| Clear all | Shown when **≥2** active chips |
| Filter types | Select, multi-select, date range (future), ownership tabs |
| Persistence | URL query params for shareable filter state (future UPX phase) |

### Search behaviour

| Rule | Specification |
|------|---------------|
| Scope | Page-local on Browse; global in `AppHeader` |
| Debounce | 300ms page-local |
| Placeholder | "Search {entity plural}…" |
| Empty query | Shows full filtered set (not empty state) |
| Global search | Command menu pattern; groups by entity type |
| Minimum chars | Global: 2; page-local: 0 (instant filter) |

### Table usage policy

**Use `PmDataTable` when:**

- Records are **homogeneous** (same columns for all rows)
- User needs **sort** or **column comparison**
- Row count often **>20**
- Admin operational lists

**Do not use tables when:**

- Records need **rich previews** (avatars, scores, multi-line summaries)
- Mobile is primary interaction mode for that entity
- Column count would exceed **6** visible — use cards or disclosure

### Card usage policy

**Cards mandatory when:**

- Browse entity is **opportunity, match, negotiation** (identity-rich)
- Mobile breakpoint for any browse view
- Dashboard recommendations and workflow tiles
- Related entity previews on Detail pages

**Card grid specs:**

- `PmEntityGrid` with domain card component
- Max **3** columns desktop
- Every card: title, status badge, meta line, `PmCardActions`

### Button hierarchy

| Variant | Role | Max per surface |
|---------|------|-----------------|
| `default` | Primary forward action | **1** |
| `outline` | Secondary alternative | **1** |
| `ghost` | Tertiary / cancel / navigation | **2** |
| `destructive` | Irreversible | **0** in header; overflow only with confirm |
| Overflow | `PmMoreActions` | Unlimited (grouped) |

### Badge hierarchy

| Priority | Component | Use |
|----------|-----------|-----|
| 1 | `PmWorkflowBadge` | Lifecycle status (always first) |
| 2 | Domain chip | Match type, need/offer |
| 3 | Score badge | Match/readiness scores |
| 4 | `PmBadge` | Counts, unread, neutral tags |
| 5 | `PmNavBadge` | Sidebar counts only |

Max **4** badges visible in header; overflow to "+N" tooltip.

### Icon usage

- **Library:** Lucide React only
- **Sizes:** `pmIconSize` tokens — never arbitrary
- Decorative: `aria-hidden`
- Icon-only buttons: required `aria-label`
- Entity icons: consistent per entity in nav and cards

### Timeline usage

| Context | Component |
|---------|-----------|
| Collaboration entities | `CollaborationTimeline` |
| Opportunity | `OpportunityTimeline` |
| Generic / admin audit | `PmTimeline` |

**Rules:**

- Timelines live in Detail `timeline` slot or inside disclosure — not in Browse
- Newest event first unless regulatory requirement says otherwise
- Max **50** events visible; older paginated

### Inspector usage

| Use inspector when | Use main column when |
|--------------------|----------------------|
| Mutations/stage actions | Primary content |
| Participant lists | Lifecycle map |
| Commercial terms readonly | Action hub |
| Sign / terminate footer actions | Domain panels |

Inspector width: 320px mobile full-width, 360px desktop. Sticky header on desktop.

### Primary / secondary / overflow actions

| Surface | Primary | Secondary | Overflow |
|---------|---------|-----------|----------|
| Page header | 1 × default | 1 × outline | `PmMoreActions` |
| Action hub | 1 × default per item | 1 × outline | — |
| Card | 1 × default | 1 × outline | `PmMoreActions` |
| Inspector footer | — | — | mutations |
| Table row | — | 1 × view | rare |

---

## Design rules (hard limits)

| Rule | Limit |
|------|-------|
| Primary buttons per card | **1** |
| Primary buttons per page header | **1** |
| Secondary buttons per card | **1** |
| Visible buttons per card (incl. overflow trigger) | **3** max |
| Badges in page header | **4** visible |
| Table visible columns | **6** max |
| Nesting: card in card | **1** level |
| Nesting: disclosure depth | **2** levels |
| Action hub items on dashboard | **5** max |
| KPI strip cells | **5** max |
| Stat grid columns | **3** max |
| Timeline initial render | **50** events |
| Information density | Comfortable default; compact only in tables via `density="compact"` admin option |

### When tables are allowed

Homogeneous admin/workspace lists with comparison need and predictable columns.

### When cards are mandatory

Identity-rich entities, mobile browse, dashboard tiles, recommendation grids.

### Maximum information density

- Body text: never below `pmTypography.caption` for essential content
- Table comfortable density: default; compact admin-only
- No more than **3** metadata lines per card subtitle

### Maximum nesting

- Page → Section (`PmContentCard`) → Disclosure → Field group
- **No fourth level** without explicit UPX exception

---

## Responsive rules

### Mobile (< `md`, < 768px)

- Sidebar → drawer sheet
- Browse tables → card list (`renderMobileCard`)
- Page actions stack vertical full-width
- Inspector below main on Detail
- Filter overflow → sheet if >3 controls
- Touch targets ≥ **44×44px**
- Sticky header remains; no double-sticky (header + toolbar)

### Tablet (`md`–`lg`, 768–1024px)

- Sidebar collapsed icon rail
- 2-column card grids
- Tables allowed at `sm` breakpoint
- Detail: optional 60/40 split at `lg`

### Desktop (≥ `lg`, ≥ 1024px)

- Full sidebar expanded default
- 3-column card grids max
- Detail inspector sticky
- Global search centered in header
- Breadcrumbs visible

---

## Accessibility rules

| Area | Requirement |
|------|-------------|
| Focus order | Sidebar → header → page header → toolbar → main → inspector |
| Skip link | "Skip to main content" in `AppShell` |
| Headings | One `h1` per page (`PmPageHeader`); sections `h2`/`h3` |
| Tables | `<caption>` or `aria-label`; sortable headers announce state |
| Live regions | Toast for mutations; `aria-live="polite"` on filter result counts |
| Color | Status never color-only — badge includes text |
| Motion | Respect `prefers-reduced-motion`; `usePmReducedMotion` |
| Contrast | WCAG 2.1 AA minimum |
| Keyboard | All actions reachable; `PmMoreActions` menu keyboard navigable |
| Forms | Labels associated; errors linked via `aria-describedby` |

---

## RTL rules

| Rule | Specification |
|------|---------------|
| Direction | `dir="rtl"` on `html` or locale provider |
| Layout | Logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) |
| Icons | Directional icons (chevrons, arrows) flip; symmetric icons do not |
| Page header accent | Gradient bar on `start` edge (already in `PmPageHeader`) |
| Tables | Column order may mirror for RTL locales |
| Numbers | Western Arabic numerals (0–9) for IDs and currency unless user preference adds Eastern Arabic numerals (future) |
| Breadcrumbs | Order mirrors; separators flip |

---

## Arabic support rules

| Area | Rule |
|------|------|
| Copy | All authenticated UI strings externalized to i18n keys (`ar` + `en`) |
| Typography | Same `pmTypography` roles; line-height +2% for Arabic body |
| Dates | Hijri preferred display with Gregorian in tooltip or secondary line |
| Currency | SAR explicit; VAT 15% labeled per KSA compliance |
| Forms | Labels above fields; RTL field text alignment |
| Search | Arabic diacritics-insensitive matching (future) |
| QA | Every page template tested in `ar` + RTL before release |

---

## Page templates (summary)

| Template | Key components | Routes (examples) |
|----------|----------------|-------------------|
| `PmBrowsePage` | `PmPage` + `PmBrowseToolbar` + table/grid | `/deals`, `/opportunities`, `/admin/users` |
| `PmDetailPage` | `PmPage` + `PmDetailLayout` | `/deals/:id`, `/matches/:id` |
| `PmDashboardPage` | `PmPage` + `PmDashboardLayout` | `/dashboard`, `/pipeline`, `/admin` |
| `PmSettingsPage` | `PmPage` + form sections | `/settings`, `/profile` |
| `PmWizardPage` | `PmFormWizard` | `/opportunities/create` |
| `PmAdminBrowsePage` | `PmBrowsePage` + Admin label | `/admin/audit` |
| `PmAdminDetailPage` | `PmDetailPage` + readonly default | `/admin/users/:id` |

---

## Component hierarchy

```
AppShell
├── AppSidebar
├── AppHeader
│   ├── PageBreadcrumbs
│   ├── GlobalSearch
│   ├── QuickCreateMenu
│   ├── NotificationCenter
│   └── UserMenu
└── main
    └── PmPage
        ├── PmPageHeader
        │   ├── PmPageHeroMetric
        │   ├── PmWorkflowBadge / domain badges
        │   └── PmPageActions → PmMoreActions
        ├── PmBrowseToolbar | (dashboard sections) | PmFormWizard
        └── Body template
            ├── PmDataTable | PmEntityGrid | PmDashboardLayout | PmDetailLayout | Form
            ├── PmEmptyState | PmTableEmpty
            └── PmTablePagination

Detail subtree:
PmDetailLayout
├── main: PmLifecycleMap, PmActionHub, PmWorkflowLinksCard, PmContentCard
├── inspector: PmInspectorLayout
└── timeline: PmTimeline | CollaborationTimeline
```

**Pages import from `pm-index` and `pm-layout-index` only** — not raw shadcn in page files (governance enforced).

---

## Interaction rules

1. **One primary action** per surface (page header, card, action hub item).
2. **No duplicate CTAs** across header and inspector for the same mutation.
3. **Browse → Detail** via title click; actions are secondary.
4. **Filters reset page** to 1 on change.
5. **Empty states branch** first-run / filtered / error — never conflate.
6. **Destructive actions** always confirm in dialog.
7. **Lifecycle mutations** only in command gateway handlers — UI triggers commands, never local state mutation of seed.
8. **Admin mutations** log to audit (future).
9. **Wizard cancel** confirms if dirty form.
10. **Global search** does not replace page-local search — complementary.

---

## Governance rules

### Page authoring

| Rule | Enforcement |
|------|-------------|
| No raw `btn btn-*` in authenticated pages | `validate-design-governance.mjs` |
| No `page-primitives` imports | Governance script |
| No shadcn `Button`/`Badge` in pages | Governance script |
| No hex/palette colors in pages | Governance script |
| Typography via `pmTypography` only | Lint + review |
| Archetype template required | PR checklist |

### PR checklist (authenticated pages)

- [ ] Uses correct archetype template
- [ ] `PmPageHeader` with appropriate `tone` and `label`
- [ ] Toolbar in `PmPage` `toolbar` slot (Browse)
- [ ] Empty states use `resolveListEmptyState`
- [ ] ≤1 primary button per surface
- [ ] Mobile card fallback for tables
- [ ] RTL logical properties verified
- [ ] No business logic changes in UI-only PRs

### Exception process

1. File UPX exception in `docs/design/` with rationale
2. Add baseline key to governance registry
3. Time-box removal in migration plan

### Authority

| Layer | Owner |
|-------|-------|
| Tokens | `@/tokens` — DDS-002 |
| Primitives | `components/ui/pm-*` |
| Layout | `components/layout/pm-*` |
| Page templates | This document |
| Marketing | Separate convergence plan (UPX-3) |

---

## Migration strategy

Phased migration from UPX-1 audit (58/100 consistency) to target **85/100** without business logic changes.

### Phase A — Foundation (P0)

- Publish this document
- Add `PmBrowsePage` template wrapper (layout only)
- Extract `PmWorkflowLinksCard`
- Standardize `backHref` on all access-denied states

**Files:** ~12 | **Risk:** Low

### Phase B — Browse unification (P1)

- Migrate Opportunities, Negotiations to `PmBrowsePage`
- Normalize toolbar placement on Deals, Contracts, People, Matches
- Apply `resolveListEmptyState` on Negotiations

**Files:** ~25 | **Risk:** Medium (visual only)

### Phase C — Detail completion (P2)

- `PmDetailLayout` for PersonProfile, AdminUserDetail
- Admin negotiation detail stub → governed coming-soon
- Deal rate → wizard/settings template

**Files:** ~15 | **Risk:** Low

### Phase D — Admin parity (P6)

- All admin pages use Admin label consistently
- Replace placeholder pages with `coming-soon` variant
- Consortium list row links

**Files:** ~8 | **Risk:** Low

### Phase E — i18n / RTL (P7)

- i18n key extraction for authenticated strings
- Arabic QA pass on all templates
- Hijri date display component

**Files:** ~40+ | **Risk:** High (cross-cutting)

### Phase F — Public convergence (out of authenticated scope)

- Legacy POC → marketing token alignment
- Auth shell unification
- Documented separately in UPX-3

### Migration principles

- **UI-only diffs** per PR
- **One archetype per PR** where possible
- **No routing changes** — URLs stable
- **Feature flags** for template swaps if needed
- **Screenshot regression** for Browse + Detail per entity

---

## Success metrics

| Metric | Baseline (UPX-1) | Target (UPX complete) | Measurement |
|--------|------------------|----------------------|-------------|
| Design consistency score | 58 | **≥85** | Weighted archetype audit |
| Browse template adoption | 2/8 pages (table only) | **8/8** | Code audit |
| Detail `PmDetailLayout` adoption | 5/8 detail routes | **8/8** | Code audit |
| Toolbar placement consistency | 3 patterns | **1 pattern** | Code audit |
| Empty state branch compliance | ~60% | **100%** | Grep `resolveListEmptyState` |
| Primary button violations | Unknown | **0** | Lint rule + manual audit |
| Governance violations (authenticated) | 0 | **0** | `validate:design:strict` |
| RTL template coverage | 0% | **100%** authenticated templates | QA checklist |
| Arabic string coverage | 0% | **100%** authenticated UI | i18n key audit |
| Task completion time (browse → detail) | TBD | −15% | Usability study |
| Accessibility violations (axe) | TBD | **0 critical** | CI axe scan |
| Mobile browse usability | Mixed table/card | **100% card fallback** | Responsive test |

---

## Appendix A — Archetype classification of current routes

| Route | Archetype |
|-------|-----------|
| `/dashboard` | Dashboard |
| `/pipeline` | Dashboard |
| `/opportunities` | Browse |
| `/opportunities/:id` | Detail |
| `/opportunities/create`, `/:id/edit` | Settings (Wizard) |
| `/matches`, `/negotiations`, `/deals`, `/contracts`, `/people` | Browse |
| `/matches/:id`, `/negotiations/:id`, `/deals/:id`, `/contracts/:id` | Detail |
| `/people/:id` | Detail |
| `/messages`, `/notifications` | Browse |
| `/profile`, `/settings` | Settings |
| `/admin` | Admin Dashboard |
| `/admin/*` lists | Admin Browse |
| `/admin/users/:id` | Admin Detail |
| `/admin/settings` | Admin Settings |

---

## Appendix B — Related documents

- [PM-TWIN-UX-ARCHITECTURE-AUDIT.md](./PM-TWIN-UX-ARCHITECTURE-AUDIT.md) — UPX-1 audit (if present)
- [PM-TWIN-DESIGN-LANGUAGE.md](./PM-TWIN-DESIGN-LANGUAGE.md) — practitioner reference
- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — token catalog
- [DESIGN-GOVERNANCE-BASELINE.md](../design/DESIGN-GOVERNANCE-BASELINE.md) — enforcement
- [PM-TWIN-PRODUCT-IDENTITY.md](./PM-TWIN-PRODUCT-IDENTITY.md) — marketplace vs workspace language

---

## Document control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | July 2026 | Initial UPX-1.5 Enterprise UX Architecture specification |

**No implementation authorized by this document alone.** Implementation requires UPX phase kickoff with scoped PRs per migration phase.
