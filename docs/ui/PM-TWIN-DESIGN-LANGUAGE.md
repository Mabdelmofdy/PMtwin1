# PM-Twin Design Language

| Field | Value |
|-------|-------|
| Sprint | A — Foundation & Visual Consistency |
| Audience | Practitioners building UI in `web/` |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md), `@/tokens`, `pm-*` primitives |
| Status | Active reference for presentation-layer work |

---

## Visual north star: Adaptive Enterprise Modern

PM-Twin targets **premium B2B SaaS** for Saudi construction collaboration:

- **Linear clarity** — restrained density, obvious hierarchy, one primary action per surface
- **Stripe polish** — semantic tokens, consistent radii, subtle elevation
- **Vercel restraint** — no glassmorphism, no decorative chrome
- **Apple motion subtlety** — short transitions; respect `prefers-reduced-motion`

Surfaces feel **calm, trustworthy, and execution-focused**. Marketplace discovery and workspace execution share the same visual language; tone shifts via entity gradients (`PmPageHeader` `tone` prop), not ad-hoc colors.

---

## Typography decision tree

Use `pmTypography` from `@/tokens` (or `@/components/shared/pm-design-tokens`). Never invent one-off `text-sm` / `font-semibold` stacks unless mapping to a documented exception.

```
Is it a page title?
  └─ yes → pmTypography.h1 (PmPageHeader)

Is it a section or content-card title?
  └─ yes → pmTypography.h2 or h3 (PmContentCard uses h3)

Is it a list/card entity name (linked)?
  └─ yes → pmTypography.h3

Is it primary body copy?
  └─ yes → pmTypography.body

Is it secondary/supporting copy?
  └─ yes → pmTypography.bodySm

Is it meta, timestamps, hints?
  └─ yes → pmTypography.caption

Is it a form label or filter dimension label?
  └─ yes → pmTypography.label

Is it a KPI number?
  └─ yes → pmTypography.stat (+ tabular-nums)

Is it a KPI label above a number?
  └─ yes → pmTypography.statLabel

Is it a badge or chip label?
  └─ yes → pmTypography.badge

Is it an overline / eyebrow / purpose label?
  └─ yes → pmTypography.overline

Is it an ID, code, or monospace value?
  └─ yes → pmTypography.mono
```

**Authoritative scale** (CSS: `web/src/index.css`, TS: `tokens/layers/typography.ts`):

| Role | Class | Typical use |
|------|-------|-------------|
| display | `pm-text-display` | Marketing hero only |
| h1 | `pm-text-h1` | Page titles |
| h2 | `pm-text-h2` | Major sections |
| h3 | `pm-text-h3` | Card titles, list entity names |
| body | `pm-text-body` | Default prose |
| bodySm | `pm-text-body-sm` | Secondary prose |
| caption | `pm-text-caption` | Meta, hints |
| label | `pm-text-label` | Form labels, filter labels |
| stat | `pm-text-stat` | KPI values |
| statLabel | `pm-text-stat-label` | KPI captions |
| overline | `pm-text-overline` | Eyebrows, purpose labels |

Fonts: **Plus Jakarta Sans** (headings), system UI (body), system mono (IDs/numbers). Arabic RTL inherits the same roles via logical properties.

---

## Spacing rhythm

### Token spacing (`--pm-space-*`)

Use semantic spacing utilities for **page-level rhythm**:

| Token | Utility | When to use |
|-------|---------|-------------|
| `--pm-space-page-x/y` | `.pm-page-padding` | Page shell insets |
| `--pm-space-section` | `.pm-section-gap` | Vertical gap between major page sections |
| `--pm-space-card` | `.pm-card-padding` | Default card interior (`PmCard`, `PmContentCard`) |
| `--pm-space-form` | `.pm-form-gap` | Stacked form fields |

### Tailwind gap scale (`gap-4`, `gap-6`, …)

Use Tailwind gaps for **in-component layout** where no token exists:

| Gap | Use |
|-----|-----|
| `gap-1` / `gap-1.5` | Chip internals, tight badge rows |
| `gap-2` | Button groups, action rows, filter chip bar |
| `gap-3` | Card interior sections, list rows |
| `gap-4` | Grid of cards, toolbar stacks (mobile) |
| `gap-6` | Page header title/metric split, major column gaps |

**Rule:** Prefer `--pm-space-*` at page/section boundaries; use `gap-*` inside components. Card list grids: `gap-4` (mobile) → `gap-4 md:gap-5` for premium cards. Match `p-4 md:p-5` on interactive list cards when not using `pm-card-padding`.

---

## Icon rules

- **Library:** Lucide React only in product UI (`lucide-react`)
- **Sizing:** `pmIconSize` from `@/tokens` — never raw `size-3` unless mapping to a token

| Token | Class | Use |
|-------|-------|-----|
| compact / status | `size-3.5` | Inline with caption, map pins, status dots |
| default / interactive / navigation | `size-4` | Buttons, nav, More menu trigger |
| medium | `size-5` | Emphasized inline icons |
| large | `size-8` | Empty states, section emphasis |
| xl | `size-8` | Dashboard hero accents |

**Spacing:** `pmIconSpacing.buttonGap` (`gap-2`) between icon and label in buttons; `listGap` (`gap-3`) in list rows.

Always set `aria-hidden` on decorative icons; icon-only buttons need `aria-label`.

---

## Card variants

All product cards default to **`rounded-2xl`** + `pm-shadow-card` unless noted.

| Variant | Primitive | Border / surface | Interaction |
|---------|-----------|------------------|-------------|
| **default** | `PmSurface` / `PmCard` | `border-border/70`, `bg-surface` | Static content blocks |
| **interactive** | `PmSurface` `interactive` | Same + hover lift | List cards, clickable tiles |
| **status** | `PmContentCard` + semantic border | `border-success/30`, `border-warning/30`, etc. | Readiness, workflow state |
| **metric** | `PmStatCard`, `PmStatsStrip` | `variant="muted"` strip cells | KPI rows |
| **recommendation** | `PmSurface` interactive + score badge | Match/opportunity cards | Marketplace suggestions |
| **warning** | `PmSurface` + `border-warning/30` | Blocked items, attention panels | Needs-decision queues |

**Padding:** `pm-card-padding` (token) or `p-4 md:p-5` for grid cards.

**Footer actions:** Use `PmCardActions` — one primary, optional one secondary, overflow to `PmMoreActions`. Reference: `opportunity-card.tsx`, `match-card.tsx`, `pm-entity-list-card.tsx`.

---

## Button & action hierarchy

### Page level (`PmPageActions`)

- **Max one** `variant="default"` primary per page header
- **Max one** `variant="outline"` secondary
- Additional actions → `PmMoreActions` (kebab)
- Never duplicate the same CTA in header **and** inspector footer

### Card level (`PmCardActions`)

- **One primary** (default variant) — e.g. "Open", "Accept"
- **One secondary** (outline) — e.g. "Edit", "View profile"
- Destructive, infrequent, or >2 actions → More menu
- Never render multiple `variant="default"` buttons in one card row

### Inspector / stage transitions

- One forward primary transition (e.g. "Move to signing")
- Cancel and alternate paths → More menu
- See `deal-stage-actions.tsx` after Sprint A

---

## Header rules (`PmPageHeader`)

- Every workspace list/detail page uses `PmPageHeader` inside `PmPage`
- Set `tone` to entity context: `mission`, `opportunity`, `match`, `negotiation`, `deal`, `contract`
- Structure: optional `label` (overline) → `title` (h1) → `description` (bodySm) → `badges` → `metric` → `actions`
- Actions slot receives `PmPageActions`, not a raw button group
- Entity purpose line uses `pmTypography.overline` / caption — do not duplicate with custom tracking classes

---

## Empty state rules

Branch with `resolveListEmptyState` (`pm-table-empty-helpers.ts`):

| Branch | When | Component |
|--------|------|-----------|
| **first-run** | No source data, no active filters | `PmEmptyState` (dashed, centered) |
| **filtered** | Source data exists OR user applied search/filters | `PmTableEmpty` `variant="no-results"` + clear CTA |
| **error** | Load failure | `PmTableEmpty` `variant="error-recovery"` |

Reference: `opportunities-pages.tsx` (~lines 367–405). Do not show "no results" when the dataset is genuinely empty on first visit.

---

## Filter rules

- Toolbar: `PmTableToolbar` inside `PmToolbarSurface`
- Active filters: `PmFilterChips` below toolbar when chips exist
- Filter popover labels: `pmTypography.label`
- Chip remove buttons: `pmIconSize.compact` for the X icon
- "Clear all" only when **2+** active chips

---

## Mobile & RTL summary

- **Mobile:** Tables collapse to `renderMobileCard` using `PmEntityListCard` or domain cards; touch targets ≥ 44px; page actions stack `flex-col` → `sm:flex-row`
- **RTL:** Use logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start`, `end`); `PmPageHeader` accent bar uses `start-0`; test Arabic with `dir="rtl"`
- **Responsive type:** h1/h2 scale at `md:` per `pmTypographyScale`; body sizes are fixed
- **Reduced motion:** Framer empty-state enter respects `usePmReducedMotion`; no essential info in motion-only cues

---

## Do / Don't checklist

### Do

- [ ] Use `pmTypography` roles for all visible text
- [ ] Use `rounded-2xl` on cards, inspectors, and metric strips
- [ ] Enforce one primary action per card/page via `PmCardActions` / `PmPageActions`
- [ ] Branch empty states: first-run vs filtered vs error
- [ ] Use `pmIconSize` for Lucide icons
- [ ] Keep presentation changes in `web/` and `docs/ui/` only

### Don't

- [ ] Don't stack multiple primary (default) buttons on one surface
- [ ] Don't duplicate header CTAs in inspector footers
- [ ] Don't show "no results" when the list has never had data
- [ ] Don't use `rounded-xl` for new cards (legacy inspector migration in progress)
- [ ] Don't add raw `text-lg font-semibold` instead of token typography
- [ ] Don't introduce new icon libraries or arbitrary `size-*` without mapping to `pmIconSize`
- [ ] Don't change business logic, commands, or repository behavior in visual sprints

---

## UPX PR-A1 — Workflow detail primitives

Workflow detail pages use **`PmWorkflowLinksCard`** (`@/components/ui/pm-index`) for related entity links.

Recommended action hubs use **`PM_RECOMMENDED_NEXT_STEP`** from `@/components/layout/pm-layout-index` (`title` + `description(entity)`).

Access denied recovery uses **`EntityAccessDenied`** with `entity` prop (`opportunity` | `match` | `negotiation` | `deal` | `contract`) for canonical browse `backHref` via `entity-browse-routes.ts`.

---

## UPX PR-A2 — Browse layout primitives

Authenticated browse pages should compose **`PmBrowsePage`** (`@/components/layout/pm-layout-index`):

| Slot | Content |
|------|---------|
| `header` | `PmPageHeader` + `PmPageActions` |
| `summary` | Optional KPI strip or hero metrics (between header and toolbar) |
| `toolbar` | **`PmBrowseToolbar`** — always passed to `PmPage` `toolbar` slot |
| `children` | Table, card grid, or delegated list section |
| `pagination` | `PmTablePagination` when paginated |

**`PmBrowseToolbar`** wraps `PmToolbarSurface` with `data-slot="pm-browse-toolbar"` and default `space-y-3` for filter stacks.

Page migrations to this scaffold happen in UPX Phase B — do not mix browse redesign into detail or workflow PRs.

---

## Related documents

- [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) — token catalog & primitives
- [PM-TWIN-PRODUCT-IDENTITY.md](./PM-TWIN-PRODUCT-IDENTITY.md) — workspace vs marketplace language
- [PM-TWIN-DDS-005-MOTION-SYSTEM.md](./PM-TWIN-DDS-005-MOTION-SYSTEM.md) — motion tokens
