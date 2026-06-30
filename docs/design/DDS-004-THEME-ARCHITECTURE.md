# DDS-004: Theme Architecture

| Field | Value |
|-------|-------|
| **Document** | DDS-004 |
| **Title** | Theme Architecture |
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 29 June 2026 |
| **Phase** | 4 — Theme Architecture |
| **Authority** | Implements theme philosophy from [DDS-001-AEDS.md](./DDS-001-AEDS.md) §8 |
| **Token architecture** | [DDS-002-TOKEN-ARCHITECTURE.md](./DDS-002-TOKEN-ARCHITECTURE.md) |
| **Enforcement** | [DDS-003-TOKEN-GOVERNANCE.md](./DDS-003-TOKEN-GOVERNANCE.md) |
| **Implementation** | `web/src/theme/*` |
| **CSS values** | `web/src/index.css` (unchanged in Phase 4) |
| **Runtime provider** | `web/src/providers/theme-provider.tsx` (unchanged in Phase 4) |

---

## 1. Purpose

Phase 4 defines **how PM-Twin themes are named, registered, and evolved** without rebuilding components or pages.

Themes modify **token values in CSS** — not component code. The theme registry is the contract between design governance and future theme implementation.

**Phase 4 delivers architecture only.** Current light/dark visual appearance is unchanged.

---

## 2. Theme philosophy

1. **Themes are token bundles** — A theme is a complete mapping of brand and semantic token values for a visual mode.
2. **Components are theme-agnostic** — PM primitives read semantic tokens; they never branch on theme id.
3. **One active color mode at a time** — Document root receives at most one color-mode class (`light` or `dark`).
4. **Additive evolution** — New themes register alongside existing ones; active themes are never broken silently.
5. **Placeholder-first** — Planned themes exist in the registry before CSS implementation to prevent ad-hoc naming.

---

## 3. Supported theme types

| Theme ID | Label | Status (Phase 4) | Maps to current behavior |
|----------|-------|------------------|--------------------------|
| `enterprise-light` | Enterprise Light | **Active** | Yes — `:root` / `.light` |
| `enterprise-dark` | Enterprise Dark | **Active** | Yes — `.dark` |
| `high-contrast` | High Contrast | Planned | No — metadata only |
| `compact` | Compact | Planned | No — metadata only |
| `future-refresh-placeholder` | Future Brand Refresh | Planned | No — reserved slot |

---

## 4. Theme contract

Defined in `web/src/theme/pm-theme-contract.ts`.

| Type | Purpose |
|------|---------|
| `ThemeId` | Canonical registry key |
| `ThemeMode` | Resolved color mode: `light` \| `dark` |
| `ThemeDensity` | `comfortable` \| `compact` |
| `ThemeContrast` | `standard` \| `high` |
| `ThemeDirection` | `ltr` \| `rtl` (future) |
| `ThemeStatus` | `active` \| `planned` \| `experimental` |
| `ThemeCapabilities` | Feature flags (selectable, tokens implemented, etc.) |
| `PmThemeDefinition` | Full theme metadata + CSS wiring contract |
| `LegacyThemePreference` | `light` \| `dark` \| `system` — existing provider API |

**No business logic** in theme modules. Pure types and metadata only.

---

## 5. Theme token responsibilities

| Layer | Theme responsibility |
|-------|---------------------|
| **Brand** | Primary hue, status colors — overridden per theme |
| **Semantic** | Surface, border, text roles — primary theme target |
| **Component** | Unchanged — reads semantic tokens |
| **Layout** | Compact theme may override spacing scale (future) |
| **Typography** | Compact theme may reduce scale (future) |
| **Elevation** | High contrast may intensify shadows (future) |
| **Motion** | Unchanged across themes |
| **Chart** | Series colors follow semantic theme (future) |

Themes **never** embed component-specific values.

---

## 6. Theme boundaries

### In scope for themes

- CSS custom property values in `index.css` theme blocks
- Document root class (`light`, `dark`)
- Future `data-pm-theme` attribute for multi-axis themes
- Registry metadata and capability flags

### Out of scope for themes

- Component structure or APIs
- Page layouts
- Business rules (lifecycle, commands, matching)
- Per-tenant feature flags (ADR-102 — separate from theme id)

---

## 7. Dark mode policy

| Rule | Implementation |
|------|----------------|
| Current provider | `web/src/providers/theme-provider.tsx` — **unchanged** |
| User preference | `light`, `dark`, `system` stored in `pm-twin-theme` localStorage |
| Resolved mode | `system` → `prefers-color-scheme` |
| CSS application | `document.documentElement.classList` adds `light` or `dark` |
| Registry mapping | `enterprise-light` ↔ `light`, `enterprise-dark` ↔ `dark` |
| Tailwind dark variant | `@custom-variant dark (&:is(.dark *))` |

Phase 4 does **not** replace the existing provider. Utilities bridge legacy mode to `ThemeId` for future integration.

---

## 8. High contrast policy

| Field | Phase 4 value |
|-------|---------------|
| Status | `planned` |
| Selectable | `false` |
| Tokens implemented | `false` |
| Target | WCAG AAA contrast on semantic tokens |
| CSS strategy | New theme block or `[data-pm-theme="high-contrast"]` overrides |
| DDS amendment | DDS-005+ when implemented |

High contrast adjusts **semantic token values only** — not component markup.

---

## 9. Compact mode policy

| Field | Phase 4 value |
|-------|---------------|
| Status | `planned` |
| Selectable | `false` |
| Adjusts density | `true` (when implemented) |
| Target tokens | `--pm-space-*`, typography scale |
| UX intent | Power users, admin tables, data-heavy screens |
| Independence | May combine with light or dark in future (`compact` + `enterprise-dark`) |

Compact is a **density axis** — may compose with color mode in a future multi-axis theme engine.

---

## 10. Tenant / white-label future policy

| Concern | Policy |
|---------|--------|
| Multi-tenancy | ADR-102 — tenant identity is architectural, not a theme toggle |
| White-label | `future-refresh-placeholder` reserves brand-layer replacement per tenant |
| Implementation | Brand tokens (`--primary`, etc.) overridden per tenant CSS injection or build-time theme pack |
| Registry flag | `supportsWhiteLabel: true` on placeholder only |
| DDS required | New DDS per white-label delivery model |

Themes modify presentation. Tenancy modifies data isolation — never conflate the two.

---

## 11. Theme utilities

`web/src/theme/pm-theme-utils.ts` — pure functions:

| Function | Purpose |
|----------|---------|
| `normalizeThemeId` | Alias resolution (`light` → `enterprise-light`) |
| `resolveThemeById` | Registry lookup |
| `isThemeSupported` | Active + selectable check |
| `resolveThemeCapabilities` | Capability flags |
| `resolveThemeClassName` | CSS root class for active themes |
| `resolveThemeIdFromLegacyMode` | Bridge to existing provider |
| `listActiveThemeIds` | `['enterprise-light', 'enterprise-dark']` |
| `listPlannedThemeIds` | Planned themes |

**No DOM mutations in Phase 4.**

---

## 12. Governance rules

1. New themes require DDS amendment and registry entry before CSS work.
2. Theme ids are kebab-case strings — never renamed once active.
3. Planned themes must have `selectable: false` until tokens are implemented.
4. Components must not import `@/theme` for styling — themes affect CSS only.
5. `ThemeProvider` changes require explicit phase charter (not Phase 4).
6. Design guard (`validate:design`) must pass after theme changes.

---

## 13. Migration rules

### Phase 4 → future ThemeProvider integration

```
Current:  ThemeProvider → light/dark class on <html>
Future:   ThemeProvider → resolveThemeById → apply cssRootClass + data-pm-theme
          Token CSS blocks keyed by theme id
```

### Adding a new theme

1. Add `PmThemeDefinition` to `pm-theme-registry.ts` with `status: 'planned'`
2. Document in DDS addendum
3. Implement CSS token overrides
4. Set `tokensImplemented: true`, `selectable: true`, `status: 'active'`
5. Wire ThemeProvider (separate phase)
6. Add tests

### Brand refresh

1. Update brand tokens in `index.css` for `enterprise-light` / `enterprise-dark`
2. No component or page changes required
3. Optionally activate `future-refresh-placeholder` as new theme id

---

## 14. Relationship with prior DDS documents

| Document | Relationship |
|----------|--------------|
| DDS-001 §8 | Constitutional theme philosophy — this document implements |
| DDS-002 §16 | Future themes table — registry now owns theme ids |
| DDS-003 | Guard rules unchanged — no new page styling |
| PM-TWIN-DESIGN-SYSTEM-V2 | CSS token values — still authoritative for current values |

---

## 15. Out of scope (Phase 4)

| Excluded | Confirmed |
|----------|-----------|
| ThemeProvider rewrite | ✅ Deferred to Phase 5 |
| CSS token value changes | ✅ Unchanged |
| Page / component visual changes | ✅ None |
| High contrast CSS | ✅ Placeholder only |
| Compact CSS | ✅ Placeholder only |
| White-label implementation | ✅ Metadata only |
| Business logic | ✅ Untouched |

---

## 16. Phase 5 — Theme Provider Bridge (complete)

Phase 5 connects the existing `ThemeProvider` to the PM theme registry **without changing visual appearance**.

### Provider bridge

| Concern | Implementation |
|---------|----------------|
| DOM classes | `resolveDocumentThemeClasses()` — still applies `light` / `dark` |
| Registry metadata | `pmThemeId`, `pmTheme` exposed on `useTheme()` |
| Legacy API | `theme`, `resolvedTheme`, `setTheme`, `toggleTheme` preserved |
| New API | `themeMode`, `setThemeMode` added |
| Data attribute | `data-pm-theme="enterprise-light"` / `enterprise-dark` on `<html>` |
| System preference | `systemResolved` state syncs OS theme changes to context |

### Legacy compatibility

| Legacy | PM registry |
|--------|-------------|
| `light` | `enterprise-light` |
| `dark` | `enterprise-dark` |
| `system` | resolves to active enterprise theme |
| localStorage `pm-twin-theme` | unchanged |

### Active themes

Only `enterprise-light` and `enterprise-dark` are applied. `setThemeMode` and `setTheme` reject planned themes implicitly (no API to select them).

### Planned themes

`high-contrast`, `compact`, `future-refresh-placeholder` remain `selectable: false`. No CSS or provider behavior introduced.

### Remaining work (Phase 6+)

- [ ] High contrast CSS token block
- [ ] Compact density CSS overrides
- [ ] Theme selector UI for planned themes
- [ ] Remove `next-themes` from `package.json` if unused elsewhere
- [ ] Multi-axis theme composition (compact + dark)

### Sonner / toaster

`web/src/components/ui/sonner.tsx` now uses `@/providers/theme-provider` instead of `next-themes`. Passes resolved `light`/`dark` to Sonner when preference is `system`.

### Files added in Phase 5

```
web/src/theme/pm-theme-provider-bridge.ts
web/src/theme/pm-theme-provider-bridge.test.ts
```

`web/src/providers/theme-provider.tsx` — minimal bridge wiring.

---

## Appendix — File map

```
web/src/theme/
├── index.ts                      # Public API
├── pm-theme-contract.ts          # Types
├── pm-theme-registry.ts          # Theme definitions
├── pm-theme-utils.ts             # Pure utilities
├── pm-theme-provider-bridge.ts   # Provider bridge (Phase 5)
├── pm-theme.test.ts              # Registry tests
└── pm-theme-provider-bridge.test.ts
```

---

*DDS-004 updated 29 June 2026 — Phase 5 provider bridge complete; appearance unchanged.*
