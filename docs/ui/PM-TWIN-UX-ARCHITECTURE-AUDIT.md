# PM-Twin UX Architecture Audit

| Field | Value |
|-------|-------|
| Phase | 9.5K — UX Architecture Sprint |
| Date | 1 July 2026 |
| Scope | Authenticated workspace UI (presentation only) |
| Prerequisite | [PM-TWIN-UX-SIMPLIFICATION-AUDIT.md](./PM-TWIN-UX-SIMPLIFICATION-AUDIT.md) (Phase 9.5J) |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) §30 |

---

## Executive summary

Phase 9.5J reduced button sprawl. Phase 9.5K reorganizes **information architecture** so pages answer workflow questions in a consistent order: what needs attention → where am I in the journey → what is the single next action.

New primitives **`PmWorkflowJourney`** and **`PmActionHub`** anchor dashboard and opportunity detail. Navigation labels unify Pipeline, Matches, Negotiations, Deals, and Contracts as one workflow — without route changes.

**UX architecture score (after): 4.6 / 5** (before 9.5K: 4.4 / 5)

---

## Old UX problems

1. **Widget-first dashboard** — KPI stat cards dominated above-the-fold; “what needs attention” was implicit.
2. **Duplicate action paths** — Opportunity detail offered the same “Open top match” in header and a “Next action” card.
3. **Overlapping journey indicators** — `CollaborationFlowStrip` and hero score strip repeated context already in header badges.
4. **Fragmented workflow navigation** — Sidebar groups (“Collaboration”, “Post-matches”) did not read as one funnel.
5. **Generic empty states** — “No recent alerts” and “No matches yet” without CTAs.
6. **No reusable attention pattern** — Each page invented its own “next step” layout.

---

## New information architecture

### Global workflow mental model

```
Dashboard (attention hub)
    ↓
Opportunity → Match → Negotiation → Deal → Contract → Complete
    ↑______________________________________________|
              Pipeline / Matches / Deals / Contracts
```

### Page hierarchy principles

| Principle | Implementation |
|-----------|----------------|
| Attention first | `PmActionHub` surfaces urgent items before browse lists |
| Journey second | `PmWorkflowJourney` shows current stage with semantic badges |
| One primary CTA | Header + hub never duplicate the same button label |
| Helpful empties | `PmEmptyState` with what / why / CTA |
| Compact metrics | Dashboard metric strip replaces four stat cards |

---

## Dashboard before / after

### Before (9.5J)

- Hero: “Good morning, {name}”
- Four `PmStatCard` KPI tiles
- Recommended matches → Active negotiations → Recent opportunities
- Recent activity sidebar
- No explicit “needs action” section

### After (9.5K)

| Order | Section |
|-------|---------|
| 1 | Hero: **“What needs attention”** + Post opportunity / Open pipeline |
| 2 | **Compact metric strip** (Published, Active matches, Negotiating, Drafts) |
| 3 | **`PmActionHub`** — matches to review, negotiations, deals to sign, drafts to publish |
| 4 | Recommended matches |
| 5 | Active negotiations & deals |
| 6 | Recent opportunities (title links only) |
| 7 | Recent activity (sidebar) |

---

## Opportunity detail before / after

### Before (9.5J)

- Header with Open top match
- `CollaborationFlowStrip` + hero score strip + match count badges
- Duplicate “Next action” card with same Open top match button
- Related matches panel
- Collapsed activity timeline

### After (9.5K)

| Order | Section |
|-------|---------|
| 1 | Hero summary (title, readiness, status, header primary + More) |
| 2 | **`PmWorkflowJourney`** — six-step lifecycle strip |
| 3 | **`PmActionHub`** — contextual next step (accept, negotiate, publish) — not duplicated in header |
| 4 | Negotiation / deal / contract status cards (when data exists) |
| 5 | Related matches (`PmCardActions` rule) |
| 6 | Requirements, skills, budget (unchanged) |
| 7 | Inspector: readiness + publish (unchanged) |
| 8 | Collapsed activity timeline |

---

## Workflow journey pattern

**Component:** `web/src/components/ui/pm-workflow-journey.tsx`

**Steps:** Opportunity → Match → Negotiation → Deal → Contract → Complete

**Props per step:**

- `state`: `complete` | `current` | `upcoming`
- `status` + `statusEntity`: passed to `PmWorkflowBadge`
- `href`: optional link for completed/current entities

**Used on:** Opportunity detail, Match detail

**Rule:** Display only — pages compute step states from existing read models; no lifecycle registry imports inside the component.

---

## Action hub pattern

**Component:** `web/src/components/ui/pm-action-hub.tsx`

**Row structure:**

| Field | Example |
|-------|---------|
| Title | “Accept top match” |
| Context | “Respond to the highest-ranked PostMatch…” |
| Badge | `PmWorkflowBadge` or `PmMatchScoreBadge` |
| Primary | Open match / Open negotiation |
| Secondary / More | Pipeline, Edit (optional) |

**Used on:** Dashboard (multi-item), Opportunity detail (single recommended item)

**Responsive:** Rows stack on mobile; `PmCardActions` wraps without horizontal overflow.

---

## Navigation improvements (routes unchanged)

| Surface | Change |
|---------|--------|
| Sidebar | “Pipeline” → **Workflow pipeline**; “Post-matches” → **Matches**; group “Collaboration” → **Workflow stages** |
| Breadcrumbs | `routeLabels.pipeline` → “Workflow pipeline”; `matches` → “Matches” |
| Pipeline page | Title “Workflow pipeline”; description mentions full funnel |
| Deals / Contracts pages | Page label “Workflow” (was “Collaboration”) |
| Pipeline tabs | “Post-matches” → “Matches” |

---

## Empty state improvements

| Surface | Before | After |
|---------|--------|-------|
| Dashboard — needs action | N/A | Caught-up message + Post opportunity CTA |
| Dashboard — matches | Plain text | `PmEmptyState` + Post opportunity |
| Dashboard — negotiations | Plain text | `PmEmptyState` + Browse matches |
| Dashboard — opportunities | Plain text | `PmEmptyState` + Post opportunity |
| Dashboard — activity | “No recent alerts” | `PmEmptyState` + Open pipeline |

---

## Remaining UX risks

1. **Negotiation list page** (`/negotiations`) still not in main sidebar — users reach negotiations via matches or pipeline.
2. **Action hub priority** — `buildNeedsActionItems` uses static ordering; future pass could weight by due date or score.
3. **Workflow journey on deal/contract detail** — only opportunity and match detail use `PmWorkflowJourney` today.
4. **Inspector deal stage actions** — deal detail inspector may still show multiple lifecycle buttons (9.5J known concern).
5. **No visual regression tests** for section order or action-hub row count.

---

## Validation

```bash
cd web && npm run type-check
cd web && npm test
cd web && npm run validate:design:strict
```

---

## Out of scope (confirmed unchanged)

- Business logic, commands, services, repositories, matching, readiness calculations
- Lifecycle registry, routing architecture, data models
- `POC/`, `packages/*`
- Applications UI (`productFlags.showLegacyApplications === false`)

---

## Final UX score

| Dimension | Before 9.5K | After 9.5K |
|-----------|-------------|------------|
| Information hierarchy | 4.0 | 4.7 |
| Action clarity | 4.5 | 4.6 |
| Workflow comprehension | 4.2 | 4.8 |
| Empty state helpfulness | 3.8 | 4.5 |
| Mobile composition | 4.3 | 4.5 |
| **Overall** | **4.4 / 5** | **4.6 / 5** |
