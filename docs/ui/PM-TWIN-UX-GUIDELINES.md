# PM-Twin UX Guidelines

Sprint B product experience guidelines for the active `web/` runtime. Presentation and information architecture only — no workflow or business-logic changes.

## Orientation framework

Every authenticated page should answer:

1. **Where am I?** — `PmPage` + `PmPageHeader` (label, title, entity tone, metric).
2. **What is happening?** — Status badges, lifecycle map, inspector summary, or list context.
3. **What is my next action?** — One primary CTA via `PmPageActions` or `PmActionHub`; secondary/advanced in More menu.

## Information tiers

| Tier | Purpose | Components | Examples |
|------|---------|------------|----------|
| **Primary** | Identity, status, main CTA | `PmPageHeader`, `PmLifecycleMap`, `PmActionHub`, `PmPageActions` primary | Opportunity detail lifecycle → recommended action |
| **Secondary** | Summary, key fields, active lists | `PmContentCard`, `PmDataTable`, `PmDetailLayout` main | Requirements, parties, related matches |
| **Advanced** | Technical refs, legacy paths, framework reference | `PmDisclosureSection`, `PmTechnicalDetails`, muted cards | Need/Offer framework reference, legacy applications |

### By page type

| Page type | Primary tier | Secondary tier | Advanced tier |
|-----------|--------------|----------------|---------------|
| Dashboard | Header + My tasks | Active workflow, recommendations | Matching summary by topology |
| List | Header + toolbar | Table/cards + pagination | Export (admin) |
| Detail | Header actions + lifecycle + recommended action | Summary, participants | Technical IDs, legacy panels |
| Wizard | Stepper + active step | Step form sections | Framework reference panels |
| Admin | Command center KPIs + quick actions | Queues, analytics | Audit detail |

## Layout patterns

### Dashboard scaffold

Use **`PmDashboardLayout`** with embedded **`PmPageHeader`** (admin and workspace dashboards). Do not wrap `PmDashboardLayout` in an outer `PmPage` — that creates double scaffold.

### Standard page

```
PmPage
├── header: PmPageHeader
├── toolbar: PmToolbarSurface (search, filters, chips)
└── children: table | cards | PmDetailLayout
```

### Toolbar placement

List filters and search belong at **page level** (`PmPage` `toolbar` slot), not buried inside section components.

### Wizard exception

Opportunity create/edit wizard uses `PmPage` → `PmFormWizard` with an inline `PmPageHeader` (bordered={false}) inside the wizard body. This is intentional: the stepper owns vertical rhythm; a second full page header is not used.

## Empty states

Use `resolveListEmptyState` branching:

| Branch | Component | When |
|--------|-----------|------|
| `first-run` | `PmEmptyState` | No source data, no active filters |
| `filtered` | `PmTableEmpty` variant `no-results` | Active search/filters |
| `error` | `PmTableEmpty` variant `error-recovery` | Load failure |

Admin first-run queues use `PmEmptyState` (not `PmTableEmpty`).

## Action hierarchy

- **One primary** per page header (`PmPageActions.primary`).
- **One secondary** max (`PmPageActions.secondary`, usually `variant="outline"`).
- **Advanced** actions in More menu — never `variant="default"` inside More dropdown items.
- Contract sign, deal stage actions, and negotiation agree belong in `PmPageActions`, not loose buttons in the header row.

## Responsive lists

- Desktop: `PmDataTable` inside `hidden lg:block` when a separate mobile path exists.
- Mobile: cards via `renderMobileCard` or grouped `PmContentCard` lists with `lg:hidden`.

---

## Appendix A — Product vocabulary

Use **one verb per action type** across matches, negotiations, deals, contracts, and opportunities.

| Action type | Canonical label | Avoid |
|-------------|-----------------|-------|
| Navigate to entity detail | **Open** {entity} | View, Start, Go to |
| Open match | Open match | View match |
| Open negotiation | Open negotiation | View negotiation, Start negotiation (button component name unchanged) |
| Open deal | Open deal | View deal, Start deal |
| Open contract | Open contract | View contract |
| Open opportunity | Open opportunity | View opportunity |
| Open profile | Open profile | View profile |
| Create new | Create {entity} | Add, New |
| Publish | Publish for matching | Post (header CTA may use "Post opportunity" as product phrase) |
| Accept / Decline | Accept, Decline | — |
| Sign | Sign contract | — |
| Admin audit | Open audit log | View audit log |

Entity nouns in titles: **My matches**, **My negotiations**, **My deals**, **My contracts** (possessive workspace framing).
