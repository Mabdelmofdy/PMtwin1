# PM-Twin Legacy UI & Pre Post-to-Post Workflow Audit

| Field | Value |
|-------|-------|
| Phase | 9 — Legacy UI & Workflow Cleanup Audit |
| Date | 30 June 2026 |
| Canonical flow | Opportunity → PostMatch → Negotiation → Deal → Contract |
| Scope | `web/` UI, navigation labels, presentation-only cleanup |

---

## 1. Executive summary

PM-Twin workspace UI has **migrated to PostMatch-first** presentation. Primary navigation, opportunity detail CTAs, collaboration pages, and admin marketplace views all center on PostMatches, negotiations, deals, and contracts.

**Applications remain** as an explicit **legacy / secondary** hiring path in:

- Pipeline tab (`Applications (legacy)`)
- Opportunity detail owner panel (`ApplicationsPanel` with `variant="legacy"`)
- Opportunity detail non-owner inspector (`ApplyWizard`, legacy application cards)

No active workspace page imports `page-primitives.tsx`. All high-traffic pages use `PmPageHeader`, `PmDataTable`, `PmDetailLayout`, and PM primitives.

**Phase 9 safe cleanup** relabeled UI-facing application-first copy to PostMatch-first or legacy-qualified language in marketing workflow copy, notifications, deals empty state, applications panel, apply wizard, and pipeline board.

**Business logic, commands, repositories, and lifecycle were not changed.**

---

## 2. Legacy UI system findings

### 2.1 Deprecated files (retained, zero active page imports)

| File | Status | Active imports |
|------|--------|----------------|
| `web/src/components/shared/page-primitives.tsx` | Deprecated | **0** (design-governance test only) |
| `web/src/components/shared/StatusBadge.tsx` | Deprecated wrapper → `PmWorkflowBadge` | **0** direct page imports |

`page-primitives.tsx` still contains **hardcoded palette classes** (`bg-emerald-500/10`, etc.) — frozen legacy; do not use in new code.

### 2.2 PM primitive adoption (workspace pages)

| Pattern | Workspace adoption |
|---------|-------------------|
| `PmPageHeader` | ✅ All audited pages |
| `PmDataTable` | ✅ List pages (opportunities, deals, contracts, people, admin lists) |
| `PmDetailLayout` | ✅ Opportunity, match, negotiation, deal, contract, profile detail |
| `PmForm` / wizard | ✅ Opportunity create/edit wizard |
| `PmEmptyState` | ✅ Standard empty/not-found states |
| `page-primitives` `PageHeader` / `EmptyState` | ❌ Not used |

### 2.3 Direct shadcn imports in pages

| File | Import | Classification |
|------|--------|----------------|
| `pages/public/auth-pages.tsx` | `Button`, `Card` | Public auth — deferred |
| `pages/public/marketing-pages.tsx` | `Button` | Public marketing — deferred |
| `components/layout/app-sidebar.tsx` | `Button` (sign out) | Shell — acceptable shadcn leaf |

Workspace pages do **not** import shadcn `Button`/`Card`/`Badge` directly.

### 2.4 Design guard

```bash
npm run validate:design:strict  # PASS (30 June 2026)
```

No new hardcoded palette violations introduced in Phase 9 cleanup.

### 2.5 Duplicated badge/tone maps

| Location | Notes |
|----------|-------|
| `page-primitives.tsx` `statusStyles` | Legacy hardcoded — unused |
| `PmWorkflowBadge` / `PmBadge` | Canonical for workspace |
| `OpportunityStatusBadge`, `ReadinessStatusBadge`, `AdminStatusBadge` | Domain-specific wrappers — acceptable |

---

## 3. Legacy workflow language findings

Grep scope: `web/src` UI-facing `.tsx` + selected docs.

| Term / pattern | Count (approx.) | Classification |
|----------------|-----------------|----------------|
| `application` / `applications` in UI strings | ~25 | Mix: legacy-secondary (12), relabeled Phase 9 (8), domain internal (5+) |
| `apply` / `Apply` | ~8 UI | Legacy-secondary (`ApplyWizard`, legacy CTAs) |
| `applicant` | ~6 UI | Legacy-secondary (`ApplicationsPanel`, `ApplyWizard` props) |
| `candidate` | 0 UI-facing | Internal code only (matching algorithms) |
| `invite to apply` | 0 | — |
| `job application` | 0 | — |
| `application pipeline` | 0 | Pipeline uses "Applications (legacy)" tab label |

### Relabeled in Phase 9 (presentation-only)

| File | Before | After |
|------|--------|-------|
| `marketing-pages.tsx` | "Applicants negotiate…" / "Accepted applications become contracts" | PostMatch / deal language |
| `deals-pages.tsx` | "accepted matches and applications" | "accepted PostMatches and negotiations" |
| `notifications-list-section.tsx` | "matches, applications, deals" | "matches, deals, negotiations" |
| `people-pages.tsx` | same | same |
| `applications-panel.tsx` | "Applied", generic toasts | "Submitted (legacy)", legacy-qualified toasts |
| `apply-wizard.tsx` | "Apply to this opportunity" | Always "Legacy direct application" |
| `opportunity-detail-page.tsx` | "Edit application" | "Edit legacy application" |
| `pipeline-board.tsx` | "applications" stage labels | "legacy applications" |

### Backend / domain internal (unchanged — correct)

- `applicationRepository`, `ApplicationCommandHandler`, `submitApplication`, RBAC `application.*` permissions
- `applicationId` fields on negotiation/deal entities
- Test fixtures and normalized adapters

---

## 4. Navigation findings

**File:** `web/src/config/navigation.ts`

### Primary workspace nav (PostMatch-first ✅)

| Group | Items |
|-------|-------|
| Workspace | Dashboard, **Pipeline**, Find |
| Opportunities | **Opportunities**, **Post-matches** |
| Collaboration | **Deals**, **Contracts** |
| Communication | Messages, Notifications |

**Applications are NOT in primary navigation.** ✅

### Pipeline sub-navigation

`PIPELINE_TABS` in `pipeline-pages.tsx`:

- Opportunities (primary)
- Post-matches (primary)
- **Applications (legacy)** — explicitly marked ✅

### Gap (deferred)

- No top-level **Negotiations** list route (`/negotiations/:id` detail only). Users reach negotiations via matches/pipeline — acceptable for MVP; not application-first.

### Admin nav

Marketplace group: Opportunities, Matching, **Negotiations**, Deals, Contracts — PostMatch-aligned. No Applications admin list page.

---

## 5. Opportunity UI findings

| Surface | PostMatch-first? | Notes |
|---------|------------------|-------|
| Opportunities list | ✅ | Table + cards; no apply CTA |
| Opportunity detail — matches | ✅ | `RelatedMatchesPanel` above applications |
| Opportunity detail — next steps | ✅ | "Open top match" / "View matches" primary |
| Opportunity detail — owner applications | ⚠️ Legacy-secondary | `ApplicationsPanel variant="legacy"` below matches |
| Opportunity detail — non-owner apply | ⚠️ Legacy-secondary | Outline CTA only; PostMatch path explained |
| Opportunity wizard | ✅ | Publish for matching; no apply flow |
| Publish / readiness panels | ✅ | Matching-oriented |
| `ApplyWizard` | ⚠️ Legacy only | Default `legacy=true`; muted surface |

**Section order on detail (owner):** Summary → Related matches → Requirements → Skills → Budget → **Applications (legacy)** ✅

---

## 6. Collaboration UI findings

| Page | PostMatch-first? | Notes |
|------|------------------|-------|
| Pipeline — opportunities | ✅ | Kanban by opportunity stage |
| Pipeline — matches | ✅ | `MatchesListSection` |
| Pipeline — applications | ⚠️ Legacy tab | Explicitly labeled |
| Matches list/detail | ✅ | Score, accept, negotiate, deal CTAs |
| Negotiation detail | ✅ | Agree, create deal actions |
| Deals list/detail | ✅ | Phase 9 copy fix on empty state |
| Contracts list/detail | ✅ | Deal-linked flow |

`CollaborationFlowStrip` on opportunity detail shows Opportunity → PostMatch → Negotiation → Deal → Contract.

---

## 7. Applications remaining inventory

| Location | Why it remains |
|----------|----------------|
| `ApplicationsPanel` | Owner view of direct/hiring applications — domain data still exists |
| `ApplyWizard` | Non-owner legacy submit path — command `SubmitApplication` still wired |
| Pipeline `applications` tab | Admin/owner kanban for legacy application stages |
| `pipeline-board.tsx` `mode="applications"` | Drag-drop for legacy application statuses |
| `negotiationService.submitApplication` | Service API — not UI |
| Application command handler / repository | Domain persistence — out of scope |
| Seed data applications | POC seed — immutable at runtime |
| Notification type `application` icon map | Event taxonomy — internal |

All remaining application UI is **secondary**, **muted** (`bg-surface-muted/40`), and **labeled legacy**.

---

## 8. Items cleaned up (Phase 9)

- Marketing workflow page copy (steps 6–7)
- Deals page hero/empty description
- Notifications + people page alert descriptions
- `ApplicationsPanel` labels and toasts
- `ApplyWizard` titles, buttons, toasts (always legacy presentation)
- Opportunity detail "Edit legacy application" button
- Pipeline board legacy application stage labels
- `page-primitives.tsx` deprecation comment updated
- `PM-TWIN-DESIGN-SYSTEM-V2.md` Phase 9 boundary note

---

## 9. Items deferred

| Item | Reason |
|------|--------|
| Delete `page-primitives.tsx` | Design-governance regression test references import pattern |
| Delete `StatusBadge.tsx` | May be referenced by workflow module; zero page imports confirmed |
| Public auth/marketing shadcn → PM migration | Out of workspace scope |
| Remove `ApplicationsPanel` / `ApplyWizard` entirely | Requires domain/command deprecation — not UI-only |
| Negotiations list page + nav item | New route — feature scope |
| `ApplicationsPanel` default variant | Only `legacy` variant used; default path unused |
| Legacy `ApplicationsPanel` article cards → `PmSurface` | Minor polish — Phase 10+ |

---

## 10. Risk assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users discover legacy apply before PostMatch | Low | Legacy CTA is outline/muted; PostMatch CTAs are primary |
| Marketing pages still use shadcn Button | Low | Public only; workspace unaffected |
| `page-primitives` hardcoded colors in repo | Low | Zero imports; guard blocks new usage |
| Application commands still callable | None | Intentional — data model preserved |
| Confusion from "legacy" label density | Low | Consistent labeling across panel, wizard, pipeline |

---

## 11. Final Post-to-Post UI readiness score

| Dimension | Score (1–5) |
|-----------|-------------|
| Navigation PostMatch-first | 4.5 |
| Opportunity experience | 4.5 |
| Collaboration flow | 4.5 |
| Legacy application containment | 4.0 |
| Legacy UI system removal | 4.0 |
| Documentation alignment | 4.5 |

**Final Post-to-Post UI readiness: 4.3 / 5**

Workspace is ready for PostMatch-first demos. Remaining application surfaces are explicitly legacy and subordinate to matches/negotiation/deal flow.

---

## Validation commands

```bash
npm run type-check              # PASS
npm test                        # PASS
npm run validate:design:strict  # PASS
```

### Manual grep summary (30 June 2026)

| Pattern | UI-facing hits (post-cleanup) |
|---------|-------------------------------|
| `page-primitives` import in pages | 0 |
| `StatusBadge` from shared | 0 page imports |
| `application` in workspace page strings | ~15 (all legacy-qualified or panel titles) |
| `apply` primary CTA | 0 (legacy outline only) |
| `candidate` / `invite to apply` | 0 UI-facing |

---

## Phase boundaries

- **Phase 9:** Complete — legacy UI & workflow audit + safe presentation cleanup
- **Backend / Phase 10+:** NOT started

*Audit completed 30 June 2026.*
