# PM-Twin DDS-005 — Motion & Interaction System

| Field | Value |
|-------|-------|
| Phase | 9.5C — Motion & Interaction System |
| Date | 30 June 2026 |
| Authority | `web/src/index.css`, `web/src/tokens/layers/motion.ts`, `web/src/components/motion/*` |
| Prerequisite | [PM-TWIN-DESIGN-COMPLIANCE-AUDIT.md](./PM-TWIN-DESIGN-COMPLIANCE-AUDIT.md) (Phase 9.5B) |
| Scope | Authenticated Workspace + Admin UI — presentation only |

---

## 1. Motion principles

PM-Twin motion follows **Adaptive Enterprise Modern** restraint:

1. **Purposeful** — Motion confirms interaction, reveals hierarchy, or signals state — never decorates.
2. **Fast** — Default durations 120–240ms; no long easing curves on data-dense screens.
3. **Token-driven** — All durations, delays, distances, and easings flow from Layer 8 motion tokens.
4. **Accessible** — `prefers-reduced-motion: reduce` collapses non-essential animation globally.
5. **Consistent** — Same hover/press/focus language on buttons, cards, rows, nav, and pipeline items.

**Inspiration mix:** Linear responsiveness (45%), Stripe polish (30%), Apple Motion subtlety (10%), Vercel restraint (15%).

**Avoid:** parallax, bounce loops, glass blur animation, scale-on-hover layout shift, motion-only status cues.

---

## 2. Motion tokens

### 2.1 CSS variables (`index.css` `:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--motion-fast` | 120ms | Hover, press, nav, table rows |
| `--motion-base` | 180ms | Cards, page enter, modals, toasts |
| `--motion-slow` | 240ms | Empty states, skeleton pulse, KPI count |
| `--motion-ease-out` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Default easing |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.2, 0.64, 1)` | Toasts, modal content, micro-interactions |
| `--motion-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Skeleton, drawer slide |
| `--motion-delay-short` | 40ms | Hero metric stagger |
| `--motion-delay-base` | 80ms | Empty state CTA delay |
| `--motion-delay-stagger` | 60ms | Staggered list children |
| `--motion-distance-sm` | 4px | Page enter, reveal, hero slide |
| `--motion-distance-md` | 8px | Reserved — section reveals |
| `--motion-distance-lg` | 16px | Reserved — drawer slide distance |

### 2.2 TypeScript registry (`tokens/layers/motion.ts`)

| Export | Purpose |
|--------|---------|
| `pmMotion` | Base duration utilities (`pm-motion-fast`, `base`, `slow`, `spring`) |
| `pmMotionDuration` | Numeric ms values for JS / Framer Motion |
| `pmMotionDelay` | Stagger and reveal delays |
| `pmMotionDistance` | Enter animation distances |
| `pmMotionEasing` | CSS + Framer tuple presets |
| `pmInteraction` | Hover, press, focus, card, nav, toolbar, table row |
| `pmEnter` | Fade, reveal, hero, empty, stagger |
| `pmLoading` | Skeleton, pulse, inline spin, section fade |
| `pmPipeline` | Drag, drop zone, drop active highlight |
| `pmOverlay` | Modal and drawer overlay/content |
| `pmToast` | Sonner enter + stack transition |

### 2.3 Framer Motion presets (`components/motion/pm-motion-presets.ts`)

| Helper | Consumer |
|--------|----------|
| `pmFramerTransition` | Shared `{ duration, ease }` objects |
| `pmPageEnterVariants(reduced)` | `AppPageChrome` route enter |
| `pmHeroRevealVariants(reduced)` | `PmPageHeroMetric` |
| `pmEmptyStateVariants(reduced)` | `PmEmptyState` + CTA delay |
| `pmMetricCountDuration(reduced)` | `PmAnimatedMetric` count-up |

### 2.4 Hooks & components

| Module | Purpose |
|--------|---------|
| `usePmReducedMotion()` | `matchMedia('prefers-reduced-motion')` hook |
| `PmAnimatedMetric` | KPI count-up with eased reveal |
| `@/components/motion/pm-motion-index` | Barrel export |

---

## 3. Interaction catalog

### 3.1 Hover states

| Target | Class / component | Behavior |
|--------|-------------------|----------|
| Buttons | `pm-interactive-hover` on `PmButton` | Color, shadow, border transitions @ 120ms |
| Cards / surfaces | `pm-interactive-card` on `PmSurface`, `PmCard`, `PmStatCard` | Border, elevation, background @ 180ms |
| Table rows | `pm-table-row-hover` | Muted background @ 120ms |
| Nav items | `pm-nav-item` on sidebar `SidebarMenuButton` | Background, inset accent @ 120ms |
| Toolbar actions | `pm-toolbar-action` on `PmToolbar` slots | Color transitions @ 120ms |

### 3.2 Press states

| Target | Class | Behavior |
|--------|-------|----------|
| Buttons | `pm-interactive-press` | `translateY(1px) scale(0.99)` on `:active` |
| Interactive cards | `pm-interactive-card:active` | `scale(0.995)` subtle depress |
| Menu items | shadcn dropdown (inherits fast transition) | Native focus/active via Radix |

### 3.3 Focus states

| Target | Class | Behavior |
|--------|-------|----------|
| All PM buttons | `pm-focus-ring` | `ring-2 ring-focus-ring ring-offset-2` |
| Forms | `pm-focus-ring` on inputs (existing) | Keyboard-visible focus |
| Dialogs / sheets | Radix focus trap + overlay | No motion-only focus |

### 3.4 Loading states

| Pattern | Class | Consumer |
|---------|-------|----------|
| Skeleton pulse | `pm-skeleton` | `Skeleton`, `PmTableLoading` rows |
| Section fade-in | `pm-loading-section` | `PmTableLoading` wrapper |
| Inline spinner | `pm-loading-inline` | Sonner loading icon |
| Soft pulse | `pm-loading-pulse` | Reserved for inline placeholders |

### 3.5 Empty state motion

| Pattern | Implementation |
|---------|----------------|
| Container reveal | `pm-enter-empty` CSS + Framer fade/slide |
| CTA appearance | `pmEmptyStateVariants().cta` with 80ms delay |
| Reduced motion | Instant opacity — no slide |

### 3.6 Toast motion

| Pattern | Implementation |
|---------|----------------|
| Enter | `pm-toast-enter` keyframe reveal |
| Stack shift | `pm-toast-root [data-sonner-toast]` transition @ spring |
| Exit | Sonner default + global reduced-motion collapse |

### 3.7 Modal motion

| Element | Class |
|---------|-------|
| Overlay fade | `pm-overlay-modal` @ 120ms |
| Content zoom | `pm-overlay-modal-content` @ 180ms spring |

### 3.8 Drawer motion

| Element | Class |
|---------|-------|
| Overlay fade | `pm-overlay-drawer` @ 120ms |
| Panel slide | `pm-overlay-drawer-content` @ 180ms ease-in-out |

### 3.9 Navigation motion

| Pattern | Implementation |
|---------|----------------|
| Page transition | `AppPageChrome` → `pmPageEnterVariants` (opacity + 4px Y) |
| Hero reveal | `PmPageHeroMetric` → `pm-enter-hero` + slide from left |
| Detail enter | Same page chrome — no route-level Framer layout animation |

### 3.10 KPI motion

| Pattern | Implementation |
|---------|----------------|
| Metric reveal | `PmPageHeroMetric` hero variants |
| Counter animation | `PmAnimatedMetric` — ease-out cubic over 240ms |
| Static fallback | Non-numeric `value` or `animate={false}` |

### 3.11 Pipeline motion

| Pattern | Class | Behavior |
|---------|-------|----------|
| Drag feedback | `pm-pipeline-drag` | Opacity + scale on `:active` while dragging |
| Drop zone | `pm-pipeline-drop` | Border/background transition |
| Drop highlight | `pm-pipeline-drop-active` | Primary-muted fill + panel shadow |

---

## 4. Transition rules

| Scenario | Duration | Easing | Property scope |
|----------|----------|--------|----------------|
| Hover (buttons, nav) | fast (120ms) | ease-out | color, background, border, shadow |
| Hover (cards) | base (180ms) | ease-out | box-shadow, border, background |
| Press | fast (120ms) | ease-out | transform only |
| Page enter | base (180ms) | ease-out | opacity, transform |
| Hero / KPI | base + 40ms delay | ease-out | opacity, transform X |
| Empty state | slow (240ms) | ease-out | opacity, transform Y |
| Modal overlay | fast | ease-out | opacity |
| Modal content | base | spring | opacity, scale |
| Drawer | base | ease-in-out | transform, opacity |
| Toast | base | spring | opacity, transform, stack position |
| Skeleton | slow | ease-in-out | opacity pulse (infinite) |
| Pipeline drag | fast | ease-out | opacity, transform, shadow |

**Rule:** Never set raw `duration-200`, `transition-all` with >300ms, or `animate-bounce` in workspace components. Use token classes.

---

## 5. Accessibility rules

| Rule | Implementation |
|------|----------------|
| Reduced motion | Global `@media (prefers-reduced-motion: reduce)` collapses all `animation-duration` and `transition-duration` to `0.01ms` |
| JS animations | `usePmReducedMotion()` + preset helpers skip transform/opacity animation when reduced |
| KPI count-up | `PmAnimatedMetric` shows final value immediately when reduced |
| Focus visibility | `pm-focus-ring` on interactive PM primitives — never remove for aesthetics |
| No motion-only state | Status, errors, and readiness use color + text + badges — not animation alone |
| Pause not required | No auto-playing decorative loops >5s in workspace UI |

---

## 6. Reduced motion behavior

When the user enables **Reduce motion** at the OS level:

1. **CSS** — All transitions and animations complete near-instantly (existing global policy preserved and extended to new keyframes).
2. **Framer Motion** — `pmPageEnterVariants`, `pmHeroRevealVariants`, `pmEmptyStateVariants` return zero-duration transitions.
3. **KPI counter** — `PmAnimatedMetric` renders the target number without count-up.
4. **Pipeline drag** — Visual scale/opacity feedback still applies via `:active` but collapses to instant per global rule.

**Policy constant:** `pmReducedMotionPolicy = 'global-collapse'`

---

## 7. Component wiring map

| Component | Motion applied |
|-----------|----------------|
| `PmButton` | hover + press + focus |
| `PmSurface` / `PmCard` / `PmStatCard` | interactive card hover + press |
| `PmDataTable` rows | `pm-table-row-hover` |
| `PmTableLoading` | `pm-loading-section` + `pm-skeleton` |
| `PmEmptyState` | enter + CTA stagger (Framer) |
| `PmPageHeroMetric` | hero reveal + optional `PmAnimatedMetric` |
| `AppPageChrome` | page enter (Framer + tokens) |
| `AppSidebar` nav | `pm-nav-item` |
| `PmToolbar` | `pm-toolbar-action` on action slots |
| `PipelineBoard` | drag + drop zone classes |
| `Dialog` / `Sheet` | overlay + content token durations |
| `Sonner` / `Toaster` | toast enter + stack transition |
| `Skeleton` | `pm-skeleton` pulse |

---

## 8. Import examples

```tsx
import { pmInteraction, pmEnter, pmPipeline } from '@/tokens'
import {
  pmPageEnterVariants,
  usePmReducedMotion,
  PmAnimatedMetric,
} from '@/components/motion/pm-motion-index'

// CSS-only card
<PmSurface interactive className={pmPipeline.drag}>…</PmSurface>

// Framer page enter
const reduced = usePmReducedMotion()
<motion.div {...pmPageEnterVariants(reduced)}>{content}</motion.div>

// Animated KPI
<PmPageHeroMetric value={42} label="Active" />
```

---

## 9. Validation

| Command | Result |
|---------|--------|
| `npm run type-check` | **PASS** |
| `npm test` | **PASS** (663 tests — includes `motion.test.ts`) |
| `npm run validate:design:strict` | **PASS** |

---

## 10. Phase boundaries

- **Presentation only** — no business logic, routing, commands, services, repositories, lifecycle, matching, or readiness changes.
- **Layouts unchanged** — motion applied to existing primitives; no page restructure.
- **Public routes** — inherit global reduced-motion policy; full motion wiring deferred.

*DDS-005 Motion & Interaction System — 30 June 2026.*
