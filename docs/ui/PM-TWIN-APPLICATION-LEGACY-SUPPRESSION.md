# PM-Twin Application Legacy UI Suppression

| Field | Value |
|-------|-------|
| Phase | 9.5E — Application Legacy UI Suppression |
| Date | 30 June 2026 |
| Mode | UI presentation only — no domain, command, repository, or service deletion |
| Authority | Visual Freeze v1.0 product decision |

---

## 1. Executive summary

Phase 9.5E hides all **user-facing legacy Application workflow** surfaces by default before Visual Freeze v1.0. The primary visible collaboration path is:

**Opportunity → PostMatch → Negotiation → Deal → Contract**

Application domain models, repositories, commands, services, seed structures, and tests remain in the codebase. Only render paths, copy, dashboard stats, tabs, panels, and CTAs are gated behind feature flags defaulting to **off**.

---

## 2. Product decision

Direct applications (legacy hiring / apply-to-opportunity) must **not** appear as a visible product workflow for normal users. PostMatch-first presentation is mandatory for Visual Freeze v1.0.

---

## 3. Feature flag behavior

### React web (`web/src/config/product-flags.ts`)

```ts
export const productFlags = {
  showLegacyApplications: false,
} as const
```

When `showLegacyApplications === false`:

- Pipeline applications tab, badge, and `TabsContent` are omitted
- `/pipeline/applications` redirects to `/pipeline`
- `countPipelineWorkflowItems` receives `applicationCount: 0`
- `ApplicationsPanel` and `ApplyWizard` return `null`
- Opportunity detail application CTAs and cards are not rendered
- Auth copy uses PostMatch-first language

When `true`: all legacy surfaces restore for dev/QA without code deletion.

### POC runtime (`POC/src/core/config/config.js`)

```js
PRODUCT_FLAGS: {
    SHOW_LEGACY_APPLICATIONS: false
}
```

Helper: `window.isLegacyApplicationUiEnabled()` (returns `false` by default).

---

## 4. React web — references found

| File | Surface |
|------|---------|
| `pages/workspace/pipeline-pages.tsx` | Applications tab, badge, workflow count, `/pipeline/applications` route |
| `components/pipeline/pipeline-board.tsx` | `mode="applications"` kanban (code retained) |
| `pages/workspace/opportunity-detail-page.tsx` | `ApplicationsPanel`, `ApplyWizard`, legacy application cards |
| `components/opportunity/applications-panel.tsx` | Owner application list + status actions |
| `components/opportunity/apply-wizard.tsx` | Direct apply wizard |
| `components/layout/page-hero-display.ts` | `countPipelineWorkflowItems` signature (applications param) |
| `pages/public/auth-pages.tsx` | Login marketing copy |
| `pages/dashboard-page.tsx` | No Applications stat (already PostMatch-first) |
| `config/navigation.ts` | No Applications nav item (confirmed) |

---

## 5. React web — references hidden (default flag)

| Surface | Mechanism |
|---------|-----------|
| Pipeline Applications tab | `getVisiblePipelineTabs(false)` filters tab |
| Pipeline applications badge | Conditional render |
| Pipeline applications `TabsContent` | Wrapped in `showLegacyApplications` |
| `/pipeline/applications` | `useEffect` redirect to `/pipeline` |
| Workflow hero count | `applicationCount` passed as `0` |
| `ApplicationsPanel` | Early `return null` + call-site gate |
| `ApplyWizard` | Early `return null` + call-site gate |
| Opportunity detail legacy cards/CTAs | `productFlags.showLegacyApplications` guards |
| Auth page copy | PostMatch-first string |

---

## 6. POC runtime — references found

| File | Surface |
|------|---------|
| `pages/dashboard/index.html` | Applications stat card, recent applications, applications received |
| `features/dashboard/dashboard.js` | Stat load, copy, match card Apply CTAs, company applications received |
| `pages/pipeline/index.html` | Applications tab + panel |
| `features/pipeline/pipeline.js` | Applications kanban, export, stage nav |
| `features/opportunities/opportunities.js` | `canApply`, application status on cards |
| `features/match-detail/match-detail.js` | Application block, Invite to Apply |
| `src/utils/page-context-header.js` | Application-first preset copy |

---

## 7. POC runtime — references hidden (default flag)

| Surface | Mechanism |
|---------|-----------|
| Dashboard applications stat card | `hideLegacyApplicationDashboardSurfaces()` |
| Recent applications section | Hidden via DOM |
| Applications received (company) | `loadApplicationsReceived` skipped |
| Application stat/count loading | Skipped in `loadDashboardData` |
| Dashboard welcome copy | PostMatch-first |
| Pipeline applications tab/panel | `display: none` on init |
| `/pipeline/applications` route | Redirect to `/pipeline` |
| Applications kanban setup | `setupApplicationStageNav` skipped |
| Opportunities list — Applied quick filter / category | `hideLegacyApplicationOpportunitiesSurfaces()` |
| Opportunities card — Apply button / status bar | `hasApplied` forced false when suppressed |
| Opportunity detail — apply / owner applications panel | `legacyAppsUi` in `opportunity-detail.js` |
| Opportunity `canApply` | Forced `false` |
| Application status bars on cards | Empty labels when suppressed |
| Match detail application block | `legacyAppsUi` guard |
| Invite to Apply button | `legacyAppsUi` guard |
| Match card secondary Apply actions | Replaced with View Offer/Need |
| Page context headers | PostMatch-first copy |

---

## 8. Copy changes

| Location | Before | After |
|----------|--------|-------|
| `web/.../auth-pages.tsx` | opportunities, applications, pipeline | opportunities, Post-matches, pipeline |
| POC `dashboard.js` (individual) | Track opportunities, applications, and post-to-post matches | Track opportunities, Post-matches, and pipeline progress |
| POC `dashboard.js` (company) | review applicants | review Post-matches |
| POC `page-context-header.js` (opportunities) | drafts and applications | drafts and Post-matches |
| POC `page-context-header.js` (notifications) | applications, matches, messages | Post-matches, deals, and messages |

---

## 9. Routes behavior

| Route | Flag `false` (default) | Flag `true` |
|-------|------------------------|-------------|
| `/pipeline/applications` (web) | Redirect to `/pipeline` | Applications tab visible |
| `/pipeline/applications` (POC) | Redirect to `/pipeline` | Applications tab visible |

Routing architecture unchanged; guard is presentation-only.

---

## 10. What remains in code only

| Layer | Status |
|-------|--------|
| `Application` domain type | Retained |
| `applicationRepository` | Retained |
| `ApplicationCommandHandler` / gateway | Retained |
| `negotiationService.submitApplication` etc. | Retained |
| `lib/applications.ts`, normalized adapters | Retained |
| `pipeline-application-drop.ts` + tests | Retained |
| `application-command-handler.test.ts` | Retained |
| `opportunity-collaboration-ux.test.ts` | Retained (legacy constant exports) |
| Seed `demo-applications.json` | Retained (empty) |
| `PmWorkflowBadge entity="application"` | Retained (internal; not surfaced when UI hidden) |

---

## 11. Deferred exceptions

| Area | Reason |
|------|--------|
| POC admin dashboard/reports application KPIs | Admin-internal analytics; not primary user workflow |
| POC admin audit `application` entity filter | Admin audit tooling |
| `applicationDeadline` opportunity attribute | Scheduling field, not hiring workflow |
| `application/json` drag MIME types | Technical, not product copy |
| Notification entity icon map `application` | Internal type mapping |

---

## 12. Application UI visibility score

| Area | Before 9.5E | After 9.5E (default) |
|------|-------------|----------------------|
| Web dashboard | ✅ No Applications stat | ✅ |
| Web pipeline tab/badge | ❌ Visible (legacy tab) | ✅ Hidden |
| Web opportunity detail | ❌ Panel + wizard visible | ✅ Hidden |
| Web auth copy | ⚠️ Mentioned applications | ✅ PostMatch-first |
| POC dashboard stat/sections | ❌ Full applications UI | ✅ Hidden |
| POC pipeline tab | ❌ Visible | ✅ Hidden |
| POC opportunity apply/status | ❌ Visible | ✅ Hidden |
| POC match Invite to Apply | ❌ Visible | ✅ Hidden |
| Domain/commands/tests | Present | Present (unchanged) |
| **Overall user-facing** | **~55% suppressed** | **100%** |

---

## 13. Validation

```bash
npm run type-check
npm test
npm run validate:design:strict
```

Record results in PR / commit when merging.

---

## 14. Related documents

- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — §24
- [PM-TWIN-LEGACY-UI-WORKFLOW-AUDIT.md](./PM-TWIN-LEGACY-UI-WORKFLOW-AUDIT.md) — superseded for **visibility** (not domain)
- [PM-TWIN-ZERO-LEGACY-UI-VERIFICATION.md](./PM-TWIN-ZERO-LEGACY-UI-VERIFICATION.md) — application UI items now suppressed

*Phase 9.5E — Application Legacy UI Suppression — 30 June 2026.*
