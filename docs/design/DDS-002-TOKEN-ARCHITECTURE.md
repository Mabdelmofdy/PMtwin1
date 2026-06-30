# DDS-002: Adaptive Token Architecture

| Field | Value |
|-------|-------|
| **Document** | DDS-002 |
| **Title** | Adaptive Token Architecture |
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 29 June 2026 |
| **Phase** | 2 — Adaptive Token Architecture |
| **Authority** | Implements token philosophy from [DDS-001-AEDS.md](./DDS-001-AEDS.md) |
| **Implementation** | `web/src/index.css` (values) · `web/src/tokens/` (layer registry) |
| **Prior spec** | [PM-TWIN-DESIGN-SYSTEM-V2.md](../ui/PM-TWIN-DESIGN-SYSTEM-V2.md) (flat token list — superseded for governance by this document) |

---

## Preamble

DDS-001 established **why** PM-Twin visual decisions are made. DDS-002 establishes **how visual values are organized** so the product can evolve for 5–10 years without rebuilding components or pages.

Phase 2 transforms the existing flat token system into a **ten-layer Adaptive Token Architecture**. Token **values are unchanged** in this phase — only ownership, hierarchy, and governance are formalized.

**Goal:** Every visual decision in PM-Twin must originate from one of the official token layers. No component should own permanent visual values.

---

## 1. Architecture overview

### 1.1 Layer stack

```
Layer 1  — Brand Tokens
Layer 2  — Semantic Tokens
Layer 3  — Component Tokens
Layer 4  — Layout Tokens
Layer 5  — Typography Tokens
Layer 6  — Radius Tokens
Layer 7  — Elevation Tokens
Layer 8  — Motion Tokens
Layer 9  — Icon Tokens
Layer 10 — Chart Tokens (reserved)
```

### 1.2 Dependency chain

```
Brand
  ↓
Semantic
  ↓
Typography · Radius · Elevation · Motion · Icon
  ↓
Layout
  ↓
Component
  ↓
PM Primitives
  ↓
Domain Sections
  ↓
Pages (layout composition only)
```

**Rule:** Pages must never consume Brand tokens directly.

### 1.3 Physical locations

| Artifact | Path | Role |
|----------|------|------|
| CSS token values | `web/src/index.css` | Theme-scoped custom properties |
| Layer registry (TS) | `web/src/tokens/layers/*.ts` | Class names, var names, mappings |
| Ownership registry | `web/src/tokens/pm-token-registry.ts` | Governance metadata |
| Public API | `web/src/tokens/index.ts` | Canonical import for new code |
| Legacy shim | `web/src/components/shared/pm-design-tokens.ts` | Re-exports from `@/tokens` |
| Legacy shim | `web/src/components/shared/pm-layout-tokens.ts` | Re-exports from `@/tokens` |

---

## 2. Layer 1 — Brand Tokens

### Purpose

Brand identity only. The smallest set of hues and accents that define PM-Twin as a product.

### Tokens

| Token | CSS variable | Role |
|-------|--------------|------|
| Primary | `--primary` | Brand action hue |
| Primary foreground | `--primary-foreground` | Text on primary |
| Primary muted | `--primary-muted` | Soft primary fills |
| Secondary | `--secondary` | Secondary brand accent |
| Success | `--success` | Positive brand signal |
| Warning | `--warning` | Caution brand signal |
| Danger | `--danger` | Destructive brand signal |
| Info | `--info` | Informational brand signal |
| Neutral | `--neutral` | Fallback brand neutral |
| Destructive | `--destructive` | shadcn compatibility alias |

Brand gradients are **reserved** for future DDS amendment — not introduced in DDS-002.

### Rules

- Brand tokens **never reference components**.
- Brand tokens are modified only when identity changes (rebrand).
- Components and pages **never import** `@/tokens/layers/brand`.

---

## 3. Layer 2 — Semantic Tokens

### Purpose

Meaning. Semantic tokens translate brand hues into roles the UI can reason about.

### Tokens

| Category | Examples | CSS variables |
|----------|----------|---------------|
| Canvas | Background, foreground | `--background`, `--foreground` |
| Surfaces | Default, muted, elevated | `--surface`, `--surface-muted`, `--surface-elevated` |
| Borders | Default, strong | `--border`, `--border-strong` |
| Text | Primary, secondary, muted | `--foreground`, `--muted-foreground` |
| Focus | Focus ring | `--focus-ring`, `--ring` |
| Status fills | Success/warning/danger backgrounds | Semantic utilities `bg-success/10`, etc. |
| Chrome | Card, popover, sidebar, input | `--card`, `--popover`, `--sidebar-*`, `--input` |
| Disabled | Muted surfaces | `--muted`, `--muted-foreground` |

### Rules

- Components consume semantic tokens — **not brand utilities directly**.
- Pages consume semantic tokens **only through PM primitives** — never raw CSS vars.
- Theme changes remap semantic values; components require no edits.

---

## 4. Layer 3 — Component Tokens

### Purpose

Reusable component appearance. Maps semantic, typography, radius, elevation, motion, and layout tokens into per-primitive defaults.

### Component categories

| Category | Mapped tokens | Consumer |
|----------|---------------|----------|
| Button | radius, motion, focus | `PmButton` |
| Card | radius, padding, elevation, border | `PmCard`, `PmSurface` |
| Badge | typography, radius | `PmBadge`, `PmWorkflowBadge` |
| Input | radius, border, focus | `PmFormField` → shadcn `Input` |
| Table | density, border | `PmDataTable` |
| Dialog | elevation, radius | shadcn `Dialog` via command menu |
| Navigation | motion, badge typography | `AppSidebar`, nav badges |
| Tooltip | elevation, caption typography | shadcn `Tooltip` |
| Inspector | section gap, label/value typography | `PmFormReadonly`, detail layouts |
| Timeline | section gap, status icon size | `CollaborationTimeline` |
| Wizard | form gap, step typography | `PmFormWizard` |

### Registry

TypeScript mappings live in `web/src/tokens/layers/component.ts` as `pmComponentTokens`.

### Rules

- Component tokens may depend on layers 2, 4–9 — **never brand directly**.
- Pages **never import** component token mappings.
- Domain sections compose PM primitives; they do not redefine component token maps.

---

## 5. Layer 4 — Layout Tokens

### Purpose

Page structure, spatial rhythm, breakpoints, and responsive grid patterns.

### Tokens

| Category | Examples | Source |
|----------|----------|--------|
| Page padding | `--pm-space-page-x/y` | `index.css` |
| Section spacing | `--pm-space-section` | `index.css` |
| Card padding | `--pm-space-card` | `index.css` |
| Form gap | `--pm-space-form` | `index.css` |
| Table density | `--pm-space-table-x/y` | `index.css` |
| Container width | `pmContentWidth.*` | `tokens/layers/layout.ts` |
| Sidebar width | `16rem` / collapsed `3rem` | `pmShellDimensions` |
| Header height | `3.5rem` | `pmShellDimensions` |
| Inspector width | `minmax(16rem, 22rem)` | `pmLayoutGrid.split` |
| Grid patterns | detail, dashboard, split, wizard | `pmLayoutGrid` |
| Breakpoints | sm/md/lg/xl/2xl | `pmBreakpoints` |

### Rules

- Layout tokens may depend on semantic canvas colors for sticky chrome backgrounds.
- Pages may import layout grid helpers via `@/components/layout/pm-layout-index`.
- Layout tokens **never depend on** component or chart layers.

---

## 6. Layer 5 — Typography Tokens

### Purpose

Type scale, font families, weights, line heights, and responsive scaling policy.

### Roles

| Role | Utility class | Use |
|------|---------------|-----|
| Display | `.pm-text-display` | Marketing hero (future PM marketing phase) |
| Heading 1 | `.pm-text-h1` | Page titles |
| Heading 2 | `.pm-text-h2` | Section titles |
| Heading 3 | `.pm-text-h3` | Card titles |
| Body | `.pm-text-body` | Default copy |
| Body small | `.pm-text-body-sm` | Secondary copy |
| Label | `.pm-text-label` | Form labels, overlines |
| Caption | `.pm-text-caption` | Meta, hints |
| Badge | `.pm-text-badge` | Badge text |
| Mono | `.pm-text-mono` | KPIs, IDs, financial figures |

### Font stacks

| Role | Variable |
|------|----------|
| Headings | `--font-heading` (Plus Jakarta Sans Variable) |
| Body | `--font-body` (system UI sans) |
| Mono | `--font-mono` (system monospace) |

### Responsive scaling policy

- Display and h1–h2 scale up at `md` breakpoint.
- Body, caption, label, badge, mono remain fixed for readability.
- Future **Compact** theme may reduce scale via token overrides — not component edits.

### Rules

- Typography utilities reference semantic text colors (`text-foreground`, `text-muted-foreground`).
- Components apply typography via `pmTypography.*` class names — not ad-hoc `text-lg font-bold`.

---

## 7. Layer 6 — Radius Tokens

### Purpose

Border radius scale derived from a single `--radius` base.

### Scale

| Token | Derivation | Utility |
|-------|------------|---------|
| Small | `--radius - 4px` | `rounded-sm` |
| Medium | `--radius - 2px` | `rounded-md` |
| Large (base) | `--radius` (0.5rem) | `rounded-lg` |
| XL | `--radius + 4px` | `rounded-xl` |
| 2XL | `--radius + 8px` | `rounded-2xl` |
| Round | — | `rounded-full` |

### Default assignments (component policy)

| Component | Default radius |
|-----------|----------------|
| Card | XL |
| Button | LG |
| Input | MD |
| Badge | MD |

### Future scaling policy

Modify `--radius` in theme layer only. All `pmRadius.*` references update globally.

---

## 8. Layer 7 — Elevation Tokens

### Purpose

Shadow levels express **surface priority** — not decorative depth.

### Levels

| Level | CSS variable | Utility | Use |
|-------|--------------|---------|-----|
| Flat | — | — | Inline content, default surfaces |
| Card | `--shadow-card` | `.pm-shadow-card` | Cards, stat tiles |
| Raised | `--shadow-panel` | `.pm-shadow-panel` | Hover elevation |
| Floating | `--shadow-floating` | `.pm-shadow-floating` | Popovers, dropdowns |
| Modal | `--shadow-modal` | `.pm-shadow-modal` | Dialogs, sheets |
| Overlay | *(reserved)* | — | Scrim behind modals — future theme |

### Shadow philosophy

- Low-opacity oklch shadows — **no blur-heavy glass**.
- Elevation communicates layer priority, not skeuomorphism.
- Dark theme uses separate shadow opacity values — same level names.

---

## 9. Layer 8 — Motion Tokens

### Purpose

Duration, easing, and reduced-motion policy.

### Tokens

| Token | Value | Utility |
|-------|-------|---------|
| Fast | 120ms | `.pm-motion-fast` |
| Normal (base) | 180ms | `.pm-motion-base` |
| Slow | 240ms | `.pm-motion-slow` |
| Spring | 180ms + spring curve | `.pm-motion-spring` |
| Ease out | `cubic-bezier(0.25, 0.1, 0.25, 1)` | default transitions |
| Ease spring | `cubic-bezier(0.34, 1.2, 0.64, 1)` | micro-interactions |

### Specialized durations

| Context | Duration |
|---------|----------|
| Hover | 120ms (fast) |
| Transition | 180ms (normal) |

### Reduced motion

`@media (prefers-reduced-motion: reduce)` in `index.css` collapses all transitions globally. No component may bypass this policy.

### Rules

- Motion communicates state — never decorates.
- PM primitives use `pmMotion.*` — never inline `duration-*` values.

---

## 10. Layer 9 — Icon Tokens

### Purpose

Consistent icon sizing and spacing for lucide icons.

### Sizes

| Token | Class | Use |
|-------|-------|-----|
| Compact | `size-3.5` | Inline with caption |
| Default | `size-4` | Standard UI |
| Medium | `size-5` | Button-adjacent |
| Large | `size-6` | Section headers, empty states |
| XL | `size-8` | Dashboard emphasis |
| Navigation | `size-4` | Sidebar items |
| Status | `size-3.5` | Timelines, badges |
| Interactive | `size-4` | Icon buttons |

### Spacing rules

| Context | Gap |
|---------|-----|
| Button icon + label | `gap-2` |
| Nav item | `gap-2` |
| List row | `gap-3` |

### Rules

- Directional icons flip in RTL (DDS-001 §12).
- Icon tokens do not depend on brand colors.

---

## 11. Layer 10 — Chart Tokens (reserved)

### Purpose

Prepare future analytics without implementing charts in Phase 2.

### Reserved variables

| Token | Future role |
|-------|-------------|
| `--chart-positive` | Uptrend, success metrics |
| `--chart-negative` | Downtrend, risk metrics |
| `--chart-neutral` | Baseline, comparison |
| `--chart-series-1..4` | Multi-series palette |
| `--chart-grid` | Grid lines |
| `--chart-axis` | Axis labels |
| `--chart-tooltip-bg/fg` | Tooltip surface |
| `--chart-legend-fg` | Legend text |

### Semantic mapping (planned)

| Chart role | Derives from |
|------------|--------------|
| Positive | `success` |
| Negative | `danger` |
| Neutral | `muted-foreground` |
| Grid | `border` |
| Tooltip | `popover` |

**No chart implementation in Phase 2.** Variables are documented in `tokens/layers/chart.ts` only.

---

## 12. Dependency rules

### 12.1 Allowed dependency matrix

| Layer | May depend on |
|-------|---------------|
| Brand | — |
| Semantic | Brand |
| Typography | Brand, Semantic |
| Radius | Brand |
| Elevation | Brand, Semantic |
| Motion | Brand |
| Icon | Layout |
| Layout | Semantic |
| Component | Semantic, Typography, Radius, Elevation, Motion, Icon, Layout |
| Chart | Brand, Semantic |

### 12.2 Forbidden dependencies

| From | Must never depend on |
|------|----------------------|
| Brand | Any higher layer |
| Semantic | Component, Layout, Chart |
| Component | Brand (direct), Chart |
| Layout | Brand, Component, Chart |
| Pages | Brand, Chart, Component token maps |

### 12.3 Page consumption rule

Pages compose **PM layout primitives** and **PM UI primitives**. Pages:

- ✅ May use `pmLayoutGrid`, `pmContentWidth` via layout index
- ❌ May not import `pmBrandVars`, `pmBrandColor`
- ❌ May not hardcode colors, shadows, spacing, radius, typography, or animation

---

## 13. Token ownership matrix

| Layer | Owner | Consumers | Allowed deps | Forbidden deps |
|-------|-------|-----------|--------------|----------------|
| **Brand** | `index.css` theme blocks | Semantic, theme engine | — | Component, Layout, Chart |
| **Semantic** | `index.css` + `semantic.ts` | Component, primitives, shadcn mapping | Brand | Layout, Chart |
| **Component** | `component.ts` + `pm-*` | Primitives, domain sections | Semantic, Typography, Radius, Elevation, Motion, Icon, Layout | Brand, Chart |
| **Layout** | `index.css` + `layout.ts` | Layout components, pages via index | Semantic | Brand, Component, Chart |
| **Typography** | `index.css` + `typography.ts` | Component, primitives | Semantic, Brand | Component, Layout, Chart |
| **Radius** | `index.css` + `radius.ts` | Component, primitives | Brand | Component, Layout, Chart |
| **Elevation** | `index.css` + `elevation.ts` | Component, primitives | Semantic, Brand | Component, Layout, Chart |
| **Motion** | `index.css` + `motion.ts` | Component, primitives | Brand | Component, Layout, Chart |
| **Icon** | `icon.ts` | Component, shell, domain sections | Layout | Brand, Chart |
| **Chart** | `chart.ts` (reserved) | Future analytics | Semantic, Brand | Component, Layout |

Machine-readable registry: `web/src/tokens/pm-token-registry.ts`

---

## 14. Migration strategy

### 14.1 How visual change propagates

```
Change brand primary hue
        ↓
Update --primary in :root / .dark (Brand layer)
        ↓
Semantic tokens referencing primary update automatically
        ↓
Component token mappings unchanged (they reference semantic utilities)
        ↓
PM primitives render new colors
        ↓
Entire UI updates — pages untouched
```

### 14.2 Change categories

| Change type | Touch | DDS required |
|-------------|-------|--------------|
| Brand hue adjustment | `index.css` brand vars | Patch — no DDS |
| New semantic role (e.g. `--surface-inverse`) | `index.css` + `semantic.ts` | DDS addendum |
| New component category token | `component.ts` | DDS addendum |
| New theme (High Contrast) | Theme block in `index.css` | DDS-003+ |
| Chart token activation | `index.css` + `chart.ts` | DDS-00x |

### 14.3 Legacy migration path

| Legacy import | New import | Status |
|---------------|------------|--------|
| `@/components/shared/pm-design-tokens` | `@/tokens` | Shim active — deprecated |
| `@/components/shared/pm-layout-tokens` | `@/tokens` | Shim active — deprecated |
| Flat token list in PM-TWIN-DESIGN-SYSTEM-V2.md | This document | Governance superseded |

**No page files were modified in Phase 2.** Existing imports continue to work via shims.

---

## 15. Validation rules

### 15.1 Forbidden in PM primitives and domain sections

- Hardcoded colors (`#`, `rgb`, `oklch` literals)
- Hardcoded `box-shadow` values
- Hardcoded spacing (`p-4`, `gap-6` acceptable only when mapping to layout grid patterns from `pmLayoutGrid`)
- Hardcoded `rounded-*` outside `pmRadius.*`
- Hardcoded `text-*` / `font-*` outside `pmTypography.*`
- Hardcoded `duration-*` / `transition-*` outside `pmMotion.*`

### 15.2 Allowed

- Token utility class names from `@/tokens`
- Semantic Tailwind utilities (`bg-surface`, `text-muted-foreground`, `border-border`)
- Layout grid classes from `pmLayoutGrid`, `pmContentWidth`
- Component token references from `pmComponentTokens` inside PM primitives

### 15.3 Enforcement roadmap

| Phase | Enforcement |
|-------|-------------|
| Phase 2 (now) | Documentation + registry tests |
| Phase 3+ | ESLint rules for forbidden imports and hardcoded values |
| Future | CI token compliance check |

---

## 16. Future themes

Themes modify **token values in CSS** — not component code.

| Theme | Status | Token impact |
|-------|--------|--------------|
| **Enterprise Light** | Active | Default `:root` block |
| **Enterprise Dark** | Active | `.dark` block |
| **High Contrast** | Planned | New theme class — semantic contrast overrides |
| **Compact** | Planned | Layout + typography scale reduction |
| **Future / white-label** | As needed | Brand layer replacement per tenant |

### Theme rules (from DDS-001)

1. Every semantic token defines values for every supported theme.
2. Components contain no theme-branching logic.
3. New themes are additive.
4. Chart tokens activate per-theme when analytics ships.

---

## 17. Relationship with DDS-001 and ADRs

| Document | Relationship |
|----------|--------------|
| **DDS-001** | Constitutional parent — this document implements §7 Token Philosophy |
| **PM-TWIN-UI-FREEZE** | UI architecture frozen — token reorganization does not unfreeze pages |
| **PM-TWIN-DESIGN-SYSTEM-V2** | Implementation detail reference — flat list superseded for governance |
| **ADR-100** | Architecture freeze — token code lives in `web/` only |
| **ADR-104** | VAT fields — chart/mono typography tokens support financial display |

DDS-002 does not override ADRs. Token architecture is presentation-only.

---

## 18. Out of scope (Phase 2)

| Excluded | Confirmed |
|----------|-----------|
| Page redesign | ✅ No page files modified |
| Page migration | ✅ No route or layout changes |
| Component visual changes | ✅ PM primitives unchanged |
| CSS value changes | ✅ Only organizational comments added |
| Tailwind config changes | ✅ None |
| New theme implementation | ✅ None |
| Chart implementation | ✅ Reserved names only |
| Business logic | ✅ Untouched |
| Backend | ✅ Untouched |

---

## Appendix A — Existing token inventory (pre-Phase 2)

| Location | Contents | Phase 2 action |
|----------|----------|----------------|
| `index.css` `:root` / `.dark` | Brand + semantic CSS vars, layout spacing, elevation, motion | Layer comments added; values unchanged |
| `index.css` `@theme inline` | Tailwind v4 mappings | Unchanged |
| `index.css` `@layer components` | Typography, layout, elevation, motion utilities | Layer comments added |
| `pm-design-tokens.ts` | Flat exports: motion, shadow, typography, layout, radius, surface, match types | Converted to shim → `@/tokens` |
| `pm-layout-tokens.ts` | Breakpoints, grids, sticky, content width | Converted to shim → `@/tokens` |

## Appendix B — New token architecture files

```
web/src/tokens/
├── index.ts                    # Public API
├── pm-token-layers.ts          # Layer identifiers + dependency order
├── pm-token-registry.ts        # Ownership matrix + validation rules
├── pm-token-registry.test.ts   # Registry tests
└── layers/
    ├── brand.ts                # Layer 1
    ├── semantic.ts             # Layer 2
    ├── component.ts            # Layer 3
    ├── layout.ts               # Layer 4
    ├── typography.ts           # Layer 5
    ├── radius.ts               # Layer 6
    ├── elevation.ts            # Layer 7
    ├── motion.ts               # Layer 8
    ├── icon.ts                 # Layer 9
    └── chart.ts                # Layer 10 (reserved)
```

---

*DDS-002 accepted 29 June 2026. Token architecture phase — no visual values changed.*
