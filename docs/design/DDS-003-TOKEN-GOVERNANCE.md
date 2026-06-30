# DDS-003: Token Governance & Enforcement

| Field | Value |
|-------|-------|
| **Document** | DDS-003 |
| **Title** | Token Governance & Enforcement |
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 29 June 2026 |
| **Phase** | 3 — Token Governance & Enforcement |
| **Authority** | Implements enforcement for [DDS-002-TOKEN-ARCHITECTURE.md](./DDS-002-TOKEN-ARCHITECTURE.md) |
| **Parent** | [DDS-001-AEDS.md](./DDS-001-AEDS.md) |
| **Guard script** | `scripts/design/validate-design-governance.mjs` |
| **Baseline report** | [DESIGN-GOVERNANCE-BASELINE.md](./DESIGN-GOVERNANCE-BASELINE.md) |

---

## 1. Purpose

Phase 3 makes DDS-002 **enforceable**. Developers must not reintroduce flat styling, direct shadcn page imports, or brand-token leakage into pages.

This phase adds:

1. Governance documentation (this document)
2. A static guard script with baseline exceptions
3. npm scripts for local and CI use

**No visual values change. No pages migrate. No components redesign.**

---

## 2. Forbidden patterns

| ID | Pattern | Scope | Severity |
|----|---------|-------|----------|
| `HEX_COLOR` | `#rgb`, `#rrggbb`, `#rrggbbaa` in TS/TSX | All except allowlist | Error |
| `RGB_COLOR` | `rgb()`, `rgba()`, `hsl()`, `hsla()` | All except allowlist | Error |
| `SHADOW_ARBITRARY` | `shadow-[...]` without `var(--` | Outside `components/ui/` | Error |
| `ROUNDED_ARBITRARY` | `rounded-[...]` | Outside `components/ui/` | Error |
| `TAILWIND_PALETTE` | `bg-emerald-500`, `text-red-700`, etc. | Outside allowlist | Warning |
| `PAGE_SHADCN_BUTTON` | `from '@/components/ui/button'` | `web/src/pages/**` | Error |
| `PAGE_SHADCN_CARD` | `from '@/components/ui/card'` | `web/src/pages/**` | Error |
| `PAGE_SHADCN_BADGE` | `from '@/components/ui/badge'` | `web/src/pages/**` | Error |
| `PAGE_BRAND_TOKENS` | `from '@/tokens/layers/brand'` | `web/src/pages/**` | Error |
| `DEPRECATED_PAGE_PRIMITIVES` | `from '@/components/shared/page-primitives'` | All except `*.test.ts` | Error |
| `DUPLICATED_STYLE_MAP` | `Record<...>` style maps with palette classes | Deprecated files | Warning |

---

## 3. Allowed patterns

| Pattern | Example | Layer |
|---------|---------|-------|
| Semantic Tailwind utilities | `bg-surface`, `text-muted-foreground`, `border-border` | Semantic |
| PM token class helpers | `pmTypography.h1`, `pmMotion.fast`, `pmElevation.card` | Component |
| Layout grid helpers | `pmLayoutGrid.detail`, `pmContentWidth.default` | Layout |
| PM primitive imports | `PmButton`, `PmCard` from `@/components/ui/pm-index` | Component |
| Layout imports | `PmPageLayout` from `@/components/layout/pm-layout-index` | Layout |
| CSS var in arbitrary value | `shadow-[0_1px_0_0_var(--border)]` | Component (token ref) |
| shadcn in `components/ui/*` | Low-level primitive wrappers | Implementation |
| Token definitions in `tokens/*` | Var names, mappings | All layers |

---

## 4. Import rules

### 4.1 Pages (`web/src/pages/**`)

| Allowed | Forbidden |
|---------|-----------|
| `@/components/ui/pm-index` | `@/components/ui/button` |
| `@/components/layout/pm-layout-index` | `@/components/ui/card` |
| `@/components/data/pm-data-index` | `@/components/ui/badge` |
| `@/components/forms/pm-form-index` | `@/tokens/layers/brand` |
| Domain section components | `@/components/shared/page-primitives` |

**Note:** Public auth/marketing pages have **baseline exceptions** for shadcn button/card until marketing migration (DDS-001 §6).

### 4.2 PM primitives (`components/ui/pm-*`)

| Allowed | Forbidden |
|---------|-----------|
| `@/tokens`, `@/components/ui/*` (shadcn) | `@/tokens/layers/brand` direct hue usage |
| Semantic utilities in `className` | Hardcoded hex/rgb |

### 4.3 Domain sections

| Allowed | Forbidden |
|---------|-----------|
| PM primitives, `@/tokens` semantic helpers | Duplicated `statusStyles` maps |
| Display modules (`*-display.ts`) | Hardcoded palette colors |

---

## 5. Component usage rules

1. **Buttons** — `PmButton` only in product pages (except documented public baseline).
2. **Cards** — `PmCard`, `PmContentCard`, `PmSurface` — not shadcn `Card` in pages.
3. **Badges** — `PmBadge`, `PmWorkflowBadge`, or domain delegates.
4. **Forms** — `PmFormField` wraps shadcn inputs; pages should not import `Input` directly in new code (existing wizard baseline documented).
5. **Tables** — `PmDataTable` + data index exports only for list pages.

---

## 6. Page-level styling policy

Pages **compose structure only**:

```tsx
// ✅ Allowed
<PmPageLayout header={<PmPageHeader title="Deals" />}>
  <DealsListSection />
</PmPageLayout>

// ❌ Forbidden
<div className="bg-emerald-500/10 p-4 rounded-[12px] shadow-[0_2px_8px_#000]">
```

Pages must not:

- Define `className` color/spacing systems
- Import brand tokens
- Import shadcn primitives directly (except baseline public routes)
- Copy status color maps from deprecated `page-primitives.tsx`

---

## 7. Token usage examples

### Semantic color

```tsx
import { pmSurfaceTone } from '@/tokens'
<div className={pmSurfaceTone.muted} />
// or: className="bg-surface-muted text-foreground"
```

### Typography

```tsx
import { pmTypography } from '@/tokens'
<h1 className={pmTypography.h1}>Deals</h1>
```

### Motion + elevation

```tsx
import { pmMotion, pmElevation } from '@/tokens'
<div className={cn(pmMotion.fast, pmElevation.card)} />
```

### Component token map (primitives only)

```tsx
import { pmComponentTokens } from '@/tokens'
const { radius, motion, focus } = pmComponentTokens.button
```

---

## 8. Migration exceptions (baseline)

Documented in [DESIGN-GOVERNANCE-BASELINE.md](./DESIGN-GOVERNANCE-BASELINE.md).

| Exception | Reason | Cleanup phase |
|-----------|--------|---------------|
| Public auth `Button` + `Card` | Out of UI freeze scope | Post-backend marketing DDS |
| Public marketing `Button` | Same | Post-backend marketing DDS |
| Readiness palette colors | Pre-semantic readiness visuals | UI polish phase |
| `page-primitives.tsx` | Deprecated, zero imports | Safe delete |
| Token-var shadows in `pm-data-table`, `app-sidebar` | Acceptable until component token pass | Phase 4+ |

Baseline keys live in `scripts/design/design-governance-rules.mjs` → `BASELINE_EXCEPTION_KEYS`.

---

## 9. Guard script behavior

### Command

```bash
# From web/
npm run validate:design

# Strict mode (fail on non-baseline violations)
npm run validate:design:strict

# From repo root
node scripts/design/validate-design-governance.mjs
```

### Modes

| Mode | Exit code | Behavior |
|------|-----------|----------|
| Default (baseline) | 0 | Report all violations; baseline tagged `[baseline]` |
| `--strict` | 1 if new violations | Fail only on non-baseline violations |

### Scan scope

- **Includes:** `web/src/**/*.ts`, `web/src/**/*.tsx`
- **Excludes:** `node_modules`, `dist`, `build`, docs, snapshots

### Allowlist (no style scans)

- `web/src/tokens/**`
- `web/src/components/ui/**` (shadcn wrappers)
- `web/src/components/shared/page-primitives.tsx` (deprecated)
- `**/*.test.ts` (import-rule tests excluded from deprecated-import false positives)

### Output fields

- File path (relative to `web/src`)
- Line number
- Violation type
- Suggested replacement

---

## 10. CI recommendation

### Phase 3 (now)

```yaml
# Optional — non-blocking
- run: cd web && npm run validate:design
```

### Phase 4+ (recommended)

```yaml
# Blocking on PRs touching web/src
- run: cd web && npm run validate:design:strict
```

### Future ESLint integration

| Rule | Package |
|------|---------|
| `no-restricted-imports` for pages → shadcn | `eslint-plugin-import` |
| Custom rule for palette classes | Local ESLint plugin |

ESLint is deferred — static script provides immediate value without config churn.

---

## 11. Relationship with DDS-002

| DDS-002 concept | DDS-003 enforcement |
|-----------------|---------------------|
| Layer dependency chain | Import rules §4 |
| Page brand-token ban | `PAGE_BRAND_TOKENS` rule |
| Component token maps | Allowlist + `pmComponentTokens` |
| Validation rules §15 | Forbidden patterns §2 |
| Migration strategy | Baseline exceptions §8 |

---

## 12. Out of scope (Phase 3)

| Excluded | Confirmed |
|----------|-----------|
| Page redesign | ✅ |
| Visual value changes | ✅ |
| Component migration | ✅ |
| ESLint plugin | Deferred |
| CI mandatory fail | Deferred (--strict available) |
| Business logic | ✅ Untouched |
| Backend | ✅ Untouched |

---

## 13. Versioning

| Document | Role |
|----------|------|
| DDS-003 | Governance + enforcement policy |
| DESIGN-GOVERNANCE-BASELINE.md | Point-in-time violation inventory |
| `design-governance-rules.mjs` | Machine baseline registry |

Amendments to forbidden patterns require DDS-003 version bump.

---

*DDS-003 accepted 29 June 2026 — guardrails only; no visual changes.*
