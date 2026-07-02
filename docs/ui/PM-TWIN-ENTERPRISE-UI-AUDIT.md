# PM-Twin Enterprise UI & UX Audit v1.0

| Field | Value |
|-------|-------|
| Sprint | Enterprise UI & UX Audit (Analysis Only) |
| Date | 1 July 2026 |
| Scope | `web/` authenticated workspace + admin (`web/src/pages/workspace/*`, `web/src/pages/dashboard-page.tsx`, `web/src/pages/admin/*`, supporting layout/components) |
| Out of scope | `POC/`, `packages/`, backend, business logic |
| Reference bar (evaluation only) | Linear · Stripe Dashboard · Vercel · Notion · Figma · GitHub |
| Prior docs | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) · [PM-TWIN-UI-FREEZE.md](./PM-TWIN-UI-FREEZE.md) · [PM-TWIN-MARKETING-VISUAL-AUDIT.md](./PM-TWIN-MARKETING-VISUAL-AUDIT.md) · [PM-TWIN-VISUAL-COMPONENT-NORMALIZATION.md](./PM-TWIN-VISUAL-COMPONENT-NORMALIZATION.md) |
| Status | **Analysis complete — no code changes** |

---

## 1. Executive Summary

PM-Twin’s authenticated workspace has completed a rigorous **Design System v2 migration** (~93% composite adoption per UI freeze). Pages share a consistent shell (`AppShell`, `PmPage`, `PmPageHeader`, `PmDataTable`, `PmWorkflowJourney`) and tokenized typography/spacing. On paper, the product should feel enterprise-ready.

**In practice, it still reads as a generic admin dashboard** rather than a premium Enterprise SaaS product. The gap is not primarily missing components — it is **product presentation, information hierarchy, navigation coherence, and developer-oriented data exposure** layered on top of a uniform but repetitive page template.

### Why it feels generic despite DS compliance

| Factor | Evidence in code |
|--------|------------------|
| **Template sameness** | Nearly every page repeats the same hero: overline label → H1 → description → `PmPageHeroMetric` → badge row → toolbar → table/card grid. Visual rhythm is consistent but monotonous. |
| **Internal vocabulary in UI** | “PostMatch”, “Post-match”, seed IDs (`seed-contract-oneway-01`), raw negotiation IDs in titles, topology column labels. |
| **Workflow fragmentation** | Negotiations have no sidebar entry; Deals and Contracts are separated from Matches; Pipeline partially overlaps Opportunities + Matches but not Deals/Contracts/Negotiations. |
| **Weak entity identity** | Match cards show topology type, not opportunity title or counterparty. Contracts list shows monospace contract IDs as the primary column. |
| **Stub / placeholder surfaces** | Messages (mock threads), Profile (portfolio/services stubs), Opportunity map (“coming soon”), Settings save is no-op. |
| **Marketing ↔ workspace disconnect** | Public routes use legacy POC CSS and construction/BIM art direction; workspace uses neutral oklch SaaS tokens with no brand bridge. |

### Top-line verdict

The workspace is **architecturally mature** (tokens, primitives, RBAC-aware visibility, workflow journey components) but **experientially immature** for enterprise buyers. It resembles an internal ops console built on shadcn + a design system checklist, not a confidence-inspiring collaboration platform like Linear or Stripe Dashboard.

---

## 2. Overall Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Overall Enterprise UI** | **5.9 / 10** | Polished primitives; repetitive layout; seed-era identifiers; incomplete features visible in UI |
| **Overall UX** | **5.6 / 10** | Workflow exists in code but not in navigation/IA; duplicated sections; unclear priorities on several detail pages |
| **Visual Consistency** | **7.1 / 10** | High intra-workspace consistency; low distinctiveness; hero/card patterns overused |
| **Design System Compliance** | **8.4 / 10** | Workspace/admin largely on PM primitives; minor shadcn leakage on forms; no page-level legacy CSS |
| **Navigation** | **5.2 / 10** | Naming mismatches, missing negotiations route, hardcoded badges, breadcrumb ID exposure |
| **Information Architecture** | **5.7 / 10** | Detail pages rich but dense; list pages thin; dashboard action-first but uses internal labels |
| **Data Presentation** | **4.3 / 10** | Seed IDs, repository fields, and developer terms visible to end users in multiple surfaces |
| **Marketing vs Workspace consistency** | **3.8 / 10** | Two visual systems; `/find` (public) vs `/people` (workspace “Find”); brand only on marketing |

---

## 3. Marketing vs Workspace Consistency

| Aspect | Marketing (`web/src/pages/public/*`) | Workspace (`web/src/pages/*`, shell) |
|--------|--------------------------------------|--------------------------------------|
| Visual system | Legacy POC CSS, isometric motifs, Phosphor icons, teal/coral | PM DS v2, oklch tokens, Lucide, neutral SaaS palette |
| Typography | Extreme weight contrast (850 headings) | Calm Plus Jakarta scale via `pmTypography` |
| Brand story | Construction / BIM / GCC marketplace | Generic “Workspace” overlines |
| Find experience | `/find` — rich marketplace search UI | `/people` — professional directory table |
| Auth journey | Legacy split login | Same shell as workspace post-login — **jarring transition** |
| RTL / Arabic | Absent on public | Settings offers RTL toggle; partial shell support |
| Readiness score | ~5.1/10 (marketing audit) | ~5.9/10 enterprise UI (this audit) |

**Gap:** A user who discovers PM-Twin on Home/Find and signs in lands in a visually unrelated product. Enterprise SaaS products (Stripe, Linear) maintain brand continuity from marketing through app.

---

## 4. Part 1 — Visual Consistency Audit (Authenticated Pages)

### Scoring rubric

| Score | Meaning |
|-------|---------|
| 9–10 | Premium enterprise polish; clear hierarchy; distinctive but restrained |
| 7–8 | Consistent DS usage; minor rhythm or density issues |
| 5–6 | Functional; templated; noticeable gaps (stubs, dev copy, weak empty states) |
| 3–4 | Mixed legacy patterns; hierarchy problems |
| 1–2 | Broken or largely unstyled |

### Page-by-page scores

| Page | Route | Score | DS Class | Summary |
|------|-------|-------|----------|---------|
| **Dashboard** | `/dashboard`, `/company-dashboard` | **7.0** | A | Strong `PmActionHub` + `PmStatsStrip`; negotiation titles use raw IDs; “PostMatch” in copy |
| **Find (People)** | `/people` | **6.5** | A | Nav says “Find”; page title “People”. Clean table; no marketplace/search parity with public Find |
| **Opportunities** | `/opportunities` | **7.5** | A | Card grid, filters, intent badges; filter includes legacy status `in_negotiation` |
| **Opportunity Map** | `/opportunities/map` | **5.0** | B | Map empty state placeholder; sidebar list is basic links |
| **Opportunity Create/Edit** | `/opportunities/create`, `/:id/edit` | **7.0** | B | `PmFormWizard` + readiness rail; shadcn `Input`/`Textarea`; create-without-persist messaging |
| **Opportunity Detail** | `/opportunities/:id` | **7.5** | A | Richest page: journey, action hub, matches panel; dense inspector; good RBAC banners |
| **Pipeline** | `/pipeline`, `/pipeline/:tab` | **6.8** | A | Kanban + matches tab; does not surface deals/contracts/negotiations in funnel |
| **Matches** | `/matches` | **6.5** | A | Table + cards; caption “Post-matches”; search by ID |
| **Match Detail** | `/matches/:id` | **7.0** | A | Journey + breakdown stats; label “Post-match”; negotiation ID in inspector |
| **Negotiation Detail** | `/negotiations/:id` | **6.3** | A | Not in sidebar; title falls back to `Negotiation ${neg.id}` |
| **Deals** | `/deals` | **7.0** | A | Title column human-friendly; description mentions “PostMatches” |
| **Deal Detail** | `/deals/:id` | **7.2** | A | Journey, timeline, stage actions; exposes PostMatch ID in readonly fields |
| **Deal Rate** | `/deals/:id/rate` | **6.5** | A | Functional sub-flow; less hero polish |
| **Contracts** | `/contracts` | **5.5** | A | **Primary column is monospace contract ID**; mobile cards titled `Contract ${id}` |
| **Contract Detail** | `/contracts/:id` | **6.8** | A | Full journey; inspector shows Contract/Deal/PostMatch/Negotiation IDs |
| **Notifications** | `/notifications` | **6.8** | A | Clean list; falls back to `seed-user-001` when unauthenticated edge case |
| **Messages** | `/messages`, `/messages/:id` | **5.0** | B | Mock threads; placeholder copy (“Thread {id} — message history placeholder”) |
| **Profile** | `/profile` | **6.0** | B | Readonly form; stub sections for portfolio/services |
| **Settings** | `/settings` | **6.2** | B | RTL preference (good); **User ID copyable**; save is no-op |
| **Person Profile** | `/people/:id` | **6.8** | A | Public profile view; depends on seed data quality |
| **Admin Dashboard** | `/admin` | **6.5** | A | Dense KPI grids; “Post-matches” label; ops-console feel |
| **Admin list pages** | `/admin/users`, `/admin/opportunities`, etc. | **6.8** | A | Consistent `AdminListPage` scaffold; tables often show raw IDs |
| **Admin Matching** | `/admin/matching` | **7.0** | A | Analytics + run matching; technical but appropriate for admin |
| **Admin User Detail** | `/admin/users/:id` | **6.5** | A | Shows User ID field |
| **Admin Negotiation Detail** | `/admin/negotiations/:id` | **6.3** | A | Reuses workspace negotiation patterns |

**Visual consistency average (authenticated): 6.7 / 10**

### Cross-cutting visual findings

| Element | Assessment | File references |
|---------|------------|-----------------|
| **Visual hierarchy** | Page headers are strong; body sections flatten into same-density cards | `web/src/components/ui/pm-page-header.tsx`, all `*pages.tsx` |
| **Typography** | Consistent `pmTypography`; mono used for IDs (contracts) undermines premium feel | `web/src/pages/workspace/contracts-pages.tsx` L144–145 |
| **Spacing / white space** | Tokenized page padding; sections stack with uniform `gap-4`/`gap-6` — little breathing hierarchy | `web/src/index.css`, `PmPage` |
| **Section rhythm** | `PmSectionHeader` → content → repeat; dashboard has better variety via `PmActionHub` | `workspace-dashboard-composition.tsx` |
| **Cards** | `PmSurface`/`PmContentCard` consistent; opportunity cards best-in-class | `opportunity-card.tsx` |
| **Tables** | `PmDataTable` comfortable density; contracts/deals differ in primary column strategy | `contracts-pages.tsx`, `deals-pages.tsx` |
| **Forms** | `PmForm*` system on profile/settings/wizards; shadcn inputs on opportunity wizard | `opportunities-pages.tsx` L40–48 |
| **Buttons** | `PmButton` hierarchy clear; primary actions generally correct | `pm-button.tsx` |
| **Icons** | Lucide throughout; consistent 16px | Shell + pages |
| **Sidebar** | shadcn sidebar + PM nav badges; role shown raw (`user.role`) | `app-sidebar.tsx` L65–67 |
| **Header** | Sticky, search, notifications; mobile title from `resolveWorkspaceContext` | `app-header.tsx` |
| **Page hero** | Gradient `PmPageHeader` on every page — becomes wallpaper | `pm-page-header.tsx` L63–65 |
| **Empty states** | `PmEmptyState` / `PmTableEmpty` — good copy, consistent CTAs | Normalization sprint |
| **Loading states** | **Not implemented** — `PmTableLoading` exists but pages use synchronous APIs | `pm-table-loading.tsx`, UI freeze notes |
| **Responsive** | Split layouts hide panels on mobile; breadcrumbs mobile-only below header | `app-shell.tsx` L49–51, `messages-view.tsx` |

---

## 5. Part 2 — Design System Consistency

### Classification key

| Class | Definition |
|-------|------------|
| **A** | `PmPage`, PM layout primitives, PM data/form components; no page-specific CSS |
| **B** | Mostly PM; shadcn primitives for inputs/tabs/dropdowns; or minor pattern duplication |
| **C** | Mixed PM + hand-rolled layout or inconsistent empty/hero treatment |
| **D** | Legacy layout/CSS or pre-PM patterns |

### Page classifications

| Area | Pages | Class |
|------|-------|-------|
| Workspace core | Dashboard, Opportunities, Opportunity Detail, Pipeline, Matches, Match Detail, Negotiation Detail, Deals, Contracts | **A** |
| Workspace secondary | People, Notifications, Profile, Person Profile | **A** |
| Workspace forms/stubs | Opportunity wizard, Map, Messages, Settings | **B** |
| Admin | All `/admin/*` routes | **A** |
| Public (reference only) | `/`, `/find`, `/login`, etc. | **D** (legacy POC CSS) |

### DS violations and duplications found

| Issue | Severity | Locations |
|-------|----------|-----------|
| shadcn `Input`/`Textarea`/`Select` imported in pages (should route through PM form layer) | Low | `opportunities-pages.tsx`, `settings-view.tsx`, `matches-list-section.tsx` |
| Hardcoded toolbar class strings removed in normalization — **resolved** | — | Per `PM-TWIN-VISUAL-COMPONENT-NORMALIZATION.md` |
| `page-primitives.tsx` deprecated, zero imports | — | Confirmed |
| `WorkspaceHeader` duplicate of `PmPageHeader` — unused migration target | Low | `workspace-header.tsx` |
| Every detail page hand-assembles `PmDetailLayout` + journey + inspector (structural duplication, not visual drift) | Medium | `opportunity-detail-page.tsx`, `pipeline-pages.tsx`, `deals-pages.tsx`, `contracts-pages.tsx` |
| Contract list uses different identity pattern than deal list | Medium | `contracts-pages.tsx` vs `deals-pages.tsx` |
| Nav badge counts hardcoded (`Messages: 3`, `Notifications: 5`) | Medium | `config/navigation.ts` L104–111 |
| No `PmLoadingState` wired | Medium | All data pages |

**Design System Compliance Score: 8.4 / 10** (workspace/admin only)

The system is **followed**; the product does not yet **exploit** it for brand differentiation.

---

## 6. Part 3 — Information Architecture Audit

### Dashboard — priorities

| Works | Issues |
|-------|--------|
| `PmActionHub` surfaces urgent items first | Negotiation items titled `Negotiation ${n.id}` — not human-scannable |
| Metrics strip shows pipeline buckets | “Published / Active matches / Negotiating / Drafts” — no deals/contracts attention |
| Recommended matches section | `MatchCard` shows match type, not opportunity or partner name |
| Recent activity | Notification-driven — good |

**Path:** `web/src/pages/dashboard-page.tsx`, `web/src/components/layout/workspace-dashboard-composition.tsx`

### Opportunity Detail — information order

| Order (current) | Assessment |
|-----------------|------------|
| Header (title, intent, readiness/match score) | Good — title first |
| `PmWorkflowJourney` | Good — workflow context early |
| `PmActionHub` recommended action | Good for owners |
| Summary / publish / matches / applications / timeline | Matches section is correct priority for owners; **participants** see teaser banner then limited view — good RBAC |
| Inspector: readiness, metadata | Metadata can expose internal fields depending on visibility |

**Verdict:** Best IA in the product for owners. Participants lack “who am I collaborating with” above the fold.

**Path:** `web/src/pages/workspace/opportunity-detail-page.tsx`

### Match Detail — story clarity

| Works | Issues |
|-------|--------|
| Participants list with roles | Match title uses type + names — good when participants exist |
| Related opportunities cross-links | “Post-match” label in header |
| Score breakdown stat cards | Timeline is minimal (2–3 events) |
| Negotiation inspector | Shows raw negotiation ID |

**Path:** `web/src/pages/workspace/pipeline-pages.tsx` (MatchDetailPage)

### Pipeline — funnel coherence

Pipeline tabs: **Opportunities | Matches | (Applications legacy)**. Missing: Negotiations, Deals, Contracts stages as first-class tabs or unified board columns.

`PipelineBoard` mode=opportunities shows kanban by status — overlaps `/opportunities` list.

**Path:** `web/src/pages/workspace/pipeline-pages.tsx`, `web/src/components/pipeline/pipeline-board.tsx`

### Duplicated information

| Duplication | Where |
|-------------|-------|
| Opportunity lists | Dashboard recent, Opportunities page, Pipeline kanban |
| Match lists | Dashboard recommended, Matches page, Pipeline tab, Opportunity detail related matches |
| Workflow journey | Repeated on opportunity, match, negotiation, deal, contract detail with shared builders (good DRY, but user sees same strip multiple times per session) |
| Status badges | Header badge + journey step + table column — triple status on some pages |

### Unnecessary / low-value sections

| Section | Page | Issue |
|---------|------|-------|
| “Services & experience” / “Portfolio” stubs | Profile | Signals incompleteness |
| Map placeholder | Opportunity Map | Should not ship in enterprise demo |
| Applications panel (flag-gated) | Opportunity Detail | Legacy path conflicts with PostMatch-first messaging |
| Topology column (hidden by default) | Matches table | Developer-oriented |

---

## 7. Part 4 — Navigation Audit

### Sidebar structure (workspace)

```
Workspace:     Dashboard | Workflow pipeline | Find (/people)
Opportunities: Opportunities | Matches
Workflow:      Deals | Contracts
Communication: Messages (badge 3) | Notifications (badge 5)
Admin:         Admin (if permitted)
```

### Issues

| Issue | Impact | Evidence |
|-------|--------|----------|
| **“Find” → `/people`** but page title is **“People”** | Cognitive mismatch | `navigation.ts` L56–59 vs `people-pages.tsx` L27 |
| **No Negotiations** in nav | Users must discover via match detail or dashboard | No route in `mainNavigation` |
| **Deals ≠ Negotiations** in naming but workflow is O→M→N→D→C | Users may not understand Deals vs Negotiations | Nav group “Workflow stages” only has Deals + Contracts |
| **Hardcoded badges** (3 messages, 5 notifications) | Breaks trust — badges lie | `navigation.ts` L104–111 |
| **Company Dashboard** vs Dashboard — same component | Label changes only | `routes.tsx` L99–100, `dashboard-page.tsx` |
| **Role shown raw** in sidebar (`admin`, `individual`) | Developer terminology | `app-sidebar.tsx` L67 |
| **Messages** in nav but mock data | Dead-end feature prominence | `messages-view.tsx` |

### Breadcrumbs

- Built from URL segments; unknown segments title-cased — **exposes raw IDs** (`/opportunities/seed-opp-001` → breadcrumb “Seed Opp 001”).
- Hidden on shallow routes and only in header desktop + mobile strip below header.

**Path:** `web/src/components/layout/page-breadcrumbs.tsx` L17–33

### Page titles

- Page `<title>` not audited in DOM (SPA); in-app titles come from `PmPageHeader.title` — generally good except contract/negotiation fallbacks.

### Enterprise SaaS navigation bar

| Criterion | PM-Twin | Reference products |
|-----------|---------|-------------------|
| Predictable grouping | Partial | Linear: issue-centric; Stripe: business domains |
| Workflow as primary nav | Fragmented across 4 groups | Stripe: Payments / Customers / etc. |
| Badge accuracy | Static mock counts | Real-time everywhere |
| Command palette | Present (`CommandMenu`) | Linear/GitHub — good parity |
| Admin separation | Clean context switch | Good |

**Navigation Score: 5.2 / 10**

---

## 8. Part 5 — Data Presentation Audit

### Developer-oriented UI exposure

| Pattern | Example | File / path |
|---------|---------|-------------|
| Seed contract IDs as primary label | `seed-contract-oneway-01` in table link (mono) | `contracts-pages.tsx` L144–145 |
| Contract mobile card title | `Contract ${contract.id}` | `contracts-pages.tsx` L94 |
| Deal search includes raw ID | `d.id.toLowerCase().includes(q)` | `deals-pages.tsx` L124 |
| Contract search by ID + dealId | `contracts-pages.tsx` L130 | |
| Match search placeholder | “Search match type or **ID**…” | `matches-list-section.tsx` L121 |
| Negotiation dashboard title | `Negotiation ${n.id}` | `workspace-dashboard-composition.tsx` L134 |
| Negotiation detail fallback title | `Negotiation ${neg.id}` | `pipeline-pages.tsx` L740 |
| Inspector: PostMatch ID | Readonly field on deal/contract detail | `deals-pages.tsx` L384, `contracts-pages.tsx` L395 |
| Inspector: Contract ID, Deal ID, Negotiation ID | Contract detail | `contracts-pages.tsx` L392–396 |
| Settings: User ID (copyable) | Account section | `settings-view.tsx` L97 |
| Admin user detail: User ID | | `admin-pages.tsx` L328 |
| Match detail: Negotiation ID | Inspector | `pipeline-pages.tsx` L625 |
| Messages placeholder | `Thread ${activeThread.id}` | `messages-view.tsx` L71 |
| Sidebar role badge | `user.role` enum | `app-sidebar.tsx` L67 |
| Breadcrumb from URL segment | `seed-opp-001` → “Seed Opp 001” | `page-breadcrumbs.tsx` |
| Table caption | “Post-matches” | `matches-list-section.tsx` L115 |
| Copy: PostMatch / Post-match | Throughout dashboard, matches, pipeline | Multiple |
| Legacy status in filter | `in_negotiation` | `opportunities-pages.tsx` L261 |
| Fallback user | `seed-user-001` | `people-pages.tsx` L97, `notification-center.tsx` L101 |

### Business-friendly alternatives needed

| Current | Recommended direction |
|---------|----------------------|
| `seed-contract-oneway-01` | Contract title or “{Need title} ↔ {Offer title}” |
| `Negotiation seed-neg-02` | “Rate negotiation — {Partner name}” |
| `PostMatch` / `Post-match` | “Match” or “Collaboration match” |
| `one_way` / `two_way` topology | “Direct match” / “Mutual match” (user-facing) |
| `user.role` in sidebar | “Company account” / “Professional” |
| Monospace ID links | Human title with ID in metadata (admin/debug only) |

**Data Presentation Score: 4.3 / 10**

---

## 9. Part 6 — Opportunity Identity Audit

### Can users identify My / Company / Marketplace opportunity?

| Identity | Supported? | Evidence |
|----------|------------|----------|
| **My opportunity** | **Yes** — `OpportunityListLabels` shows “My opportunity” badge when `viewerUserId === creatorId` | `opportunity-list-labels.tsx` L36–39 |
| **Company opportunity** | **No** — no badge for company-owned vs individual-owned third-party listings | No `companyId` or org badge in card labels |
| **Marketplace opportunity** | **Implicit only** — absence of “My opportunity” badge; no positive “Marketplace” chip | `opportunity-card.tsx` |

### Can users identify Need vs Offer?

| Context | Supported? | Evidence |
|---------|------------|----------|
| Opportunity cards | **Yes** — Need/Offer/Hybrid badges with semantic tones | `opportunity-list-labels.tsx`, `opportunity-display.ts` |
| Opportunity detail header | **Yes** — intent as overline label | `opportunity-detail-page.tsx` L383 |
| Match cards | **No** — shows match topology type, not need/offer pairing | `match-card.tsx` L33 |
| Dashboard match section | **No** — same | `match-card.tsx` |

### Ownership visual clarity

| Viewer | Clarity |
|--------|---------|
| Owner on list | Good — “My opportunity” + readiness score |
| Owner on detail | Good — publish panel, edit actions, full matches |
| Marketplace browser | Moderate — sees Need/Offer but not “who posted” unless creator shown in detail |
| Company workspace | **Weak** — `isCompanyUser` changes dashboard href label only; no company-scoped opportunity visual system |

**Opportunity identity score: 6.0 / 10** — intent labeling is strong; ownership scope (my/company/marketplace) is incomplete.

---

## 10. Part 7 — Visual Workflow Audit

### Expected journey

```
Opportunity → Match → Negotiation → Deal → Contract
```

### Journey component coverage

| Entity | `PmWorkflowJourney` on detail? | List entry in nav? |
|--------|-------------------------------|-------------------|
| Opportunity | Yes | Yes |
| Match | Yes | Yes |
| Negotiation | Yes | **No** |
| Deal | Yes | Yes |
| Contract | Yes | Yes |

Shared step builders: `web/src/components/ui/pm-workflow-journey-steps.ts` — **good implementation**, uneven discoverability.

### Pages missing workflow context

| Page | Gap |
|------|-----|
| **People / Find** | No link to collaboration workflow |
| **Notifications** | Alerts list without workflow stage grouping |
| **Messages** | Mock — no workflow tie-in |
| **Profile / Settings** | Readiness only — no “your pipeline” snapshot |
| **Opportunity Map** | No workflow |
| **Admin list pages** | Tables without journey strip (acceptable for admin) |

### Pipeline page mismatch

Description claims: “Track opportunities, matches, negotiations, deals, and contracts in one funnel.”  
Implementation: only Opportunities + Matches tabs (+ legacy Applications).

**Path:** `pipeline-pages.tsx` L261–264 vs L295–310

### Workflow context strengths

- Opportunity detail: `resolveCollaborationActiveStepFromMatches` drives journey highlight.
- Match → negotiation → deal links in `buildMatchDetailReadModel` actions.
- Deal/contract detail: cross-links via `buildDealNavMoreItems` / `buildContractNavMoreItems`.

**Workflow UX score: 6.2 / 10** — components exist; navigation and list surfaces do not tell the story.

---

## 11. Part 8 — Enterprise Readiness (Reference Comparison)

Comparison is **gap analysis only** — not a recommendation to copy.

| Dimension | PM-Twin today | Reference bar |
|-----------|---------------|---------------|
| **First impression** | Clean SaaS shell; gradient heroes feel templated | Stripe: restrained, one focal metric; Linear: instant context |
| **Professionalism** | Undermined by seed IDs, placeholders, mock messages | Vercel: no placeholder features in primary nav |
| **Usability** | Many CTAs; action hubs help; nav gaps hurt | Notion: predictable sidebar; GitHub: breadcrumbs resolve to names |
| **Visual maturity** | DS v2 complete; low brand character | Figma: strong product personality within system |
| **Enterprise confidence** | RBAC banners good; debug fields visible | Stripe: no internal IDs in customer views |

### Where PM-Twin falls short

1. **Identity resolution** — Enterprise products show *names*, not *IDs*, in lists and breadcrumbs.
2. **Feature completeness signals** — Mock messages and stub profile sections erode trust.
3. **Workflow as product** — Reference products make the “thing you’re doing” the hero; PM-Twin makes the “page type” the hero.
4. **Brand continuity** — Marketing ≠ workspace.
5. **Density without insight** — Admin-style tables everywhere; insufficient summarization / narrative.
6. **Motion and delight** — Tokens exist; `PmAnimatedMetric` rarely used outside hero metrics.
7. **Loading/async** — Enterprise apps show skeletons; PM-Twin is synchronous (MVP constraint visible).

---

## 12. Problem Screenshots / Paths

No screenshots were captured in this audit sprint. **File paths and line references** below serve as reproduction map for a follow-up visual capture pass.

| # | Problem | Path |
|---|---------|------|
| 1 | Contract list shows seed ID as primary column | `web/src/pages/workspace/contracts-pages.tsx` ~L139–147 |
| 2 | Contract mobile card titled with raw ID | `web/src/pages/workspace/contracts-pages.tsx` ~L91–99 |
| 3 | Negotiation titled with raw ID on dashboard | `web/src/components/layout/workspace-dashboard-composition.tsx` ~L133–134 |
| 4 | Match card shows topology not opportunity | `web/src/components/collaboration/match-card.tsx` ~L32–34 |
| 5 | PostMatch terminology in matches table | `web/src/components/collaboration/matches-list-section.tsx` ~L115–121 |
| 6 | Breadcrumb exposes seed segment | `web/src/components/layout/page-breadcrumbs.tsx` ~L23–27 |
| 7 | User ID in settings (copyable) | `web/src/components/user/settings-view.tsx` ~L97 |
| 8 | Contract detail inspector IDs | `web/src/pages/workspace/contracts-pages.tsx` ~L392–396 |
| 9 | Messages mock placeholder | `web/src/components/user/messages-view.tsx` ~L71 |
| 10 | Map “coming soon” | `web/src/pages/workspace/opportunities-pages.tsx` ~L341–345 |
| 11 | Hardcoded nav badges | `web/src/config/navigation.ts` ~L104–111 |
| 12 | Nav “Find” vs page “People” | `navigation.ts` L56 vs `people-pages.tsx` L27 |
| 13 | Profile stub sections | `web/src/components/user/profile-view.tsx` ~L67–76 |
| 14 | Sidebar shows raw role | `web/src/components/layout/app-sidebar.tsx` ~L67 |
| 15 | Pipeline description vs tabs mismatch | `web/src/pages/workspace/pipeline-pages.tsx` ~L261–310 |

---

## 13. Detailed Recommendations

### Visual / brand

1. **Reduce hero homogeneity** — Not every page needs `PmPageHeroMetric` + three badges. Use narrative headers on detail pages; reserve metrics for dashboard and analytics.
2. **Introduce workspace brand accents** — Bridge marketing teal/coral as restrained accents in workspace (primary actions, empty states), without importing legacy POC CSS.
3. **Humanize list primary columns** — Contracts follow deals pattern (title first, ID in secondary column or admin-only).
4. **Enrich match cards** — Show opportunity title(s) and counterparty name, not only `formatMatchTypeBadgeLabel`.

### Information architecture

5. **Unify workflow under Pipeline** — Add Negotiations, Deals, Contracts tabs or a single staged board; align copy with implementation.
6. **Dashboard negotiation titles** — Resolve display names from linked opportunities/people.
7. **Remove or hide stub sections** — Profile portfolio/services until data exists.
8. **Demote or hide Map** until implemented.

### Navigation

9. **Add Negotiations** to sidebar under Workflow.
10. **Rename alignment** — “Find” → `/people` title “Find talent” OR rename nav to “People”.
11. **Wire real badge counts** from `notificationsApi` / messages service.
12. **Breadcrumb entity resolution** — Map IDs to titles via lightweight lookup.

### Data presentation

13. **User-facing display ID layer** — `formatContractDisplayName`, `formatNegotiationDisplayName` using linked entities.
14. **Remove copyable User ID** from Settings for non-admin users.
15. **Replace PostMatch in UI copy** with “Match”.
16. **Filter legacy status values** from opportunity filters (`in_negotiation` → canonical `negotiating`).

### Opportunity identity

17. **Add Marketplace badge** for non-owned published opportunities.
18. **Add Company opportunity** badge when `creatorId` belongs to same org as viewer (requires company membership model in UI).
19. **Need ↔ Offer pairing chip** on match cards and match detail header.

### Workflow

20. **Pipeline as home for stage transitions** — Deep-link from journey steps to filtered pipeline tab.
21. **Notification grouping by workflow stage** — Not only chronological.

### Enterprise polish

22. **Implement loading skeletons** on list/detail pages when async boundaries arrive.
23. **Remove mock Messages from primary nav** until real, or mark “Preview” with `PmBadge`.
24. **Page title tag** resolution for browser tabs (accessibility + professionalism).

---

## 14. Prioritized Redesign Roadmap

### P0 — Critical (blocks enterprise credibility)

| # | Item | Why it matters |
|---|------|----------------|
| P0-1 | **Replace seed IDs as primary display names** (contracts list/cards, negotiation titles, breadcrumbs) | First thing executives notice; screams “prototype” |
| P0-2 | **Remove developer inspector fields from default contract/deal detail** (PostMatch ID, etc.) or gate behind “Technical details” | Breaks immersion on legal/commercial surfaces |
| P0-3 | **Fix navigation lies** — hardcoded message/notification badges | Destroys trust in shell chrome |
| P0-4 | **Rename PostMatch → Match in all user-visible copy** | Internal ADR vocabulary visible to customers |
| P0-5 | **Add Negotiations to sidebar** | Workflow stage invisible despite being core |

### P1 — High impact

| # | Item | Why it matters |
|---|------|----------------|
| P1-1 | **Match card/list shows opportunity + counterparty** | Users think in deals, not topology |
| P1-2 | **Pipeline funnel includes all stages** (or honest copy trim) | IA promise must match UI |
| P1-3 | **Marketplace / My / Company opportunity badges** | Marketplace product needs instant ownership context |
| P1-4 | **Demote Messages + Map until real** | Placeholders in primary nav signal immaturity |
| P1-5 | **Breadcrumb entity title resolution** | URL IDs in chrome feel broken |
| P1-6 | **Dashboard action items use human names** | “What needs attention” fails with `Negotiation seed-neg-02` |
| P1-7 | **Marketing → workspace visual bridge** | Login transition should feel like same product |

### P2 — Medium

| # | Item | Why it matters |
|---|------|----------------|
| P2-1 | **Vary page header pattern** — not every page needs metric + 3 badges | Reduces “admin template” fatigue |
| P2-2 | **Profile completion** — real portfolio/services or remove sections | Empty sections harm credibility |
| P2-3 | **Settings save + hide User ID** | Enterprise account pages don’t expose GUIDs |
| P2-4 | **Opportunity filter canonical statuses only** | Legacy alias in filter confuses |
| P2-5 | **Company dashboard differentiation** | Company users need org-level metrics, not relabeled individual dashboard |
| P2-6 | **PmLoadingState wired when async lands** | Expected in enterprise apps |
| P2-7 | **Optional `PmWorkflowDetailScaffold`** | Reduces detail page duplication |

### P3 — Low

| # | Item | Why it matters |
|---|------|----------------|
| P3-1 | Remove deprecated `WorkspaceHeader` | Hygiene |
| P3-2 | Route shadcn inputs through PM form wrappers | DS purity |
| P3-3 | Hide topology column entirely from matches table | Developer column |
| P3-4 | Sidebar role → human label | Minor polish |
| P3-5 | More `PmAnimatedMetric` on dashboard KPIs | Delight, not critical |

---

## 15. Final Recommendation

**Do not start a visual redesign by adding new components.** The PM Design System v2 foundation is sufficient. The product feels like a generic admin dashboard because:

1. **Presentation layer exposes implementation** (seed IDs, PostMatch jargon, raw roles).
2. **Navigation understates the core workflow** (negotiations hidden; pipeline incomplete).
3. **Every page uses the same hero template**, producing consistency without hierarchy.
4. **Marketing and workspace are different products visually.**
5. **Placeholder features sit in primary navigation.**

### Recommended sequence

```
Phase A (P0): Display names + copy + nav fixes — no new layouts
Phase B (P1): IA/workflow unification (pipeline, match identity, opportunity badges)
Phase C (P1): Marketing/workspace brand bridge
Phase D (P2+): Header pattern variety, profile/messages completion, loading states
```

Proceed with redesign only after **P0 data presentation and navigation fixes** — otherwise new visuals will still sit on prototype-grade information.

---

## Appendix A — Audit Method

- Static analysis of `web/src/routes.tsx` route inventory
- Page component review: all workspace and admin pages
- Component review: layout shell, opportunity/collaboration/user modules, PM index exports
- Cross-reference with `PM-TWIN-UI-FREEZE.md`, `PM-TWIN-VISUAL-COMPONENT-NORMALIZATION.md`, `PM-TWIN-MARKETING-VISUAL-AUDIT.md`
- Grep for seed IDs, mono typography on IDs, PostMatch terminology, and readonly ID fields
- **No code modifications. No runtime screenshots. No browser automation.**

## Appendix B — Authenticated Route Inventory

| Route | Component |
|-------|-----------|
| `/dashboard`, `/company-dashboard` | `DashboardPage` |
| `/people`, `/people/:id` | `PeoplePage`, `PersonProfilePage` |
| `/opportunities`, `/opportunities/map`, `/opportunities/create`, `/opportunities/:id`, `/opportunities/:id/edit` | `opportunities-pages.tsx`, `OpportunityDetailPage` |
| `/pipeline`, `/pipeline/:tab` | `PipelinePage` |
| `/matches`, `/matches/:id` | `MatchesPage`, `MatchDetailPage` |
| `/negotiations/:id` | `NegotiationDetailPage` |
| `/deals`, `/deals/:id`, `/deals/:id/rate` | `deals-pages.tsx` |
| `/contracts`, `/contracts/:id` | `contracts-pages.tsx` |
| `/messages`, `/messages/:id` | `MessagesPage` |
| `/notifications` | `NotificationsPage` |
| `/profile`, `/settings` | `ProfilePage`, `SettingsPage` |
| `/admin/*` | `admin-pages.tsx`, `admin-list-page.tsx` |

---

*End of audit — analysis only, no implementation.*
