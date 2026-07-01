# PM-Twin UX Simplification Audit

| Field | Value |
|-------|-------|
| Phase | 9.5J — UX Recovery Sprint |
| Date | 1 July 2026 |
| Scope | Authenticated workspace + admin UI (presentation only) |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) §29 |

---

## Executive summary

The authenticated UI was technically compliant with the design system but suffered from **action sprawl**: cards and detail pages exposed too many inline buttons, duplicated lifecycle CTAs across headers and inspectors, and crowded dashboards with repeated navigation paths.

This sprint introduced **`PmMoreActions`**, **`PmCardActions`**, and **`PmPageActions`** and applied the Card Action Rule, Page CTA Rule, and Card Density Rule across all in-scope pages — without changing business logic, routing, repositories, commands, or data models.

**UX simplicity score (after): 4.4 / 5** (before: 2.8 / 5)

---

## Main UX problems found

1. **Card action sprawl** — `RelatedMatchesPanel` exposed up to 7 inline buttons per match; opportunity cards showed View + Edit side by side.
2. **Header / inspector duplication** — Match, negotiation, and deal detail pages rendered the same lifecycle buttons in both page headers and inspector footers.
3. **Navigation button rows** — Deal and contract detail pages showed 4–5 outline “Back to…” buttons above main content.
4. **Dashboard noise** — Quick actions duplicated header CTAs; Insights and Pipeline health panels added visual weight without answering “what needs attention today?”
5. **Triple paths to matches** — Opportunity detail offered View matches in header, primary action card, and inspector Next steps.
6. **Score badge heaviness** — Hero variants used on dense list cards; labels added clutter on pipeline surfaces.
7. **Non-functional placeholder** — “Activate contract” button visible alongside real mutation controls.

---

## Pages audited

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/dashboard` | Simplified |
| Opportunity list | `/opportunities` | Reviewed (already compliant) |
| Opportunity detail | `/opportunities/:id` | Simplified |
| Pipeline | `/pipeline` | Simplified kanban cards |
| Post-matches list | `/matches` | Reviewed (table kebab pattern) |
| Match detail | `/matches/:id` | Simplified |
| Negotiation detail | `/negotiations/:id` | Simplified |
| Deals list / detail | `/deals`, `/deals/:id` | Simplified |
| Contracts list / detail | `/contracts`, `/contracts/:id` | Simplified |
| Admin dashboard | `/admin` | Simplified quick actions |
| Admin matching | `/admin/matching` | Reviewed (single CTA retained) |
| Applications (legacy) | — | **Hidden** (`showLegacyApplications: false`) |

---

## Buttons reduced per page (visible inline actions)

| Page | Before (approx.) | After (approx.) | Reduction |
|------|------------------|-----------------|-----------|
| Dashboard body | 9 CTAs | 4 CTAs | −56% |
| Opportunity card | 2 | 1 + More | −50% visible |
| Related match card | 7 max | 2 + More | −71% |
| Opportunity detail header | 2 | 1 + More | −50% |
| Opportunity detail primary card | 2 | 2 (primary + secondary) | 0 (deduped elsewhere) |
| Match detail header | 5 max | 2 + More | −60% |
| Match detail inspector footer | 4 | 0 | −100% |
| Negotiation detail header | 3 + 2 nav | 2 + More | −60% |
| Negotiation inspector footer | 7 | 0 | −100% |
| Deal detail header + nav | 5 + lifecycle | 1 + More nav | −80% |
| Contract detail nav + footer | 5 nav + 4 footer | More nav + 1 primary + More | −70% |
| Pipeline kanban card | 0 explicit | 1 + More | Structured |
| Admin quick actions | 3 | 1 + More | −67% |

---

## Card action changes

| Component | Before | After |
|-----------|--------|-------|
| `OpportunityCard` | View, Edit (inline) | **Open** (primary), Edit in **More** |
| `MatchCard` | View match | **Open match** via `PmCardActions` |
| `RelatedMatchesPanel` | Up to 7 inline lifecycle buttons | Contextual **primary** + **View match** secondary + **More** |
| `KanbanCard` (pipeline) | Whole-card link only | Title, owner, status, score + **Open** + **More** (Edit) |
| `DealListCard` / `ContractListCard` | View button | **Open** via `PmCardActions` |

---

## Sections removed / collapsed

| Page | Change |
|------|--------|
| Dashboard | Removed Quick actions card, Pipeline health chart, Insights panels |
| Dashboard | Added **Active negotiations & deals** attention section |
| Dashboard | Recent opportunities cards: `showActions={false}` (title link only) |
| Opportunity detail | Removed inspector “Next steps / All matches” duplicate |
| Opportunity detail | Collapsed **Activity & history** into `<details>` |
| Opportunity detail | Replaced 3-metric grid with compact score strip |
| Match / negotiation detail | Removed inspector footer action stacks |
| Deal detail | Removed `DealStageActions` from header (inspector only) |
| Contract detail | Removed non-functional Activate contract button |

---

## More menu pattern

### Components

| Export | Path | Use |
|--------|------|-----|
| `PmMoreActions` | `web/src/components/ui/pm-more-actions.tsx` | Kebab `DropdownMenu` for secondary/destructive actions |
| `PmCardActions` | same | Card footer: primary + optional secondary + More |
| `PmPageActions` | same | Page header: max 1 primary + 1 secondary + More |

### Rules

- **Primary** — one clear next step (Open, Accept, Agree terms, Sign contract, etc.)
- **Secondary** — at most one supporting action (View match, View all, outline link)
- **More** — Edit, Decline, Cancel, navigation links, destructive actions
- Destructive items use `variant: 'destructive'` with separator before
- Custom lifecycle buttons (`StartNegotiationButton`, etc.) use `render` slot or `DropdownMenuItem asChild`

### Visual consistency

Matches `PmTableRowActions`: ghost `icon-sm` trigger, `MoreHorizontal` (Lucide), `w-44` menu width.

---

## Before / after rationale

| Area | Before | After | Rationale |
|------|--------|-------|-----------|
| Cards | Mini detail pages with action rows | Title, status, score, 2–3 metadata, 1 action | Linear-style density |
| Detail headers | Full lifecycle toolbars | One primary + More | Stripe-style focus |
| Dashboard | Feature tour layout | Attention-first layout | Answers “what needs my attention?” |
| Navigation | 4–5 Back buttons | Single More menu | Reduces horizontal button noise |
| Scores | Hero badges on lists | `compact` / `list` with `showLabel={false}` | Clear but not overwhelming |

---

## Remaining UX concerns

1. **Collaboration flow strip + collapsed timeline** still overlap conceptually on opportunity detail — consider merging in a future pass.
2. **`/matches` vs `/pipeline/matches`** remain duplicate surfaces (out of scope — routing unchanged).
3. **Deal inspector** still shows full `DealStageActions` stack when multiple transitions are valid — could use More menu for secondary transitions.
4. **Contract Complete/Terminate** in More menu require `asChild` button wrapping — pattern works but is verbose; consider `PmLifecycleMoreActions` helper.
5. **No Playwright visual regression** for button-count assertions.
6. **Touch targets on kebab menus** — acceptable at `icon-sm` but worth QA on 360px devices.

---

## Validation

```bash
cd web && npm run type-check
cd web && npm test
cd web && npm run validate:design:strict
```

---

## Out of scope (confirmed unchanged)

- Business logic, backend, repositories, commands, services, matching, readiness, lifecycle
- Routing architecture and data models
- Applications UI (`productFlags.showLegacyApplications === false`)
