# DDS-001: PM-Twin Adaptive Enterprise Design System (AEDS)

| Field | Value |
|-------|-------|
| **Document** | DDS-001 |
| **Title** | Adaptive Enterprise Design System |
| **Status** | Accepted — **Constitutional** |
| **Version** | 1.0 |
| **Date** | 29 June 2026 |
| **Phase** | 1 — Design Constitution |
| **Authority** | Permanent design governance for PM-Twin presentation layer |
| **Implementation reference** | [PM-TWIN-DESIGN-SYSTEM-V2.md](../ui/PM-TWIN-DESIGN-SYSTEM-V2.md) (current token and component spec) |
| **UI freeze reference** | [PM-TWIN-UI-FREEZE.md](../ui/PM-TWIN-UI-FREEZE.md) (Phase 9 architecture freeze) |
| **Supersedes** | Informal design notes, ad-hoc style decisions, page-level visual experiments |

---

## Preamble

PM-Twin is a B2B marketplace for project management, consulting, and built-environment collaboration in Saudi Arabia and the GCC. Its users operate in high-stakes professional contexts: tenders, consortiums, negotiations, contracts, and compliance-sensitive workflows.

The Adaptive Enterprise Design System (AEDS) is the **permanent design constitution** for PM-Twin. It defines how the product may look, feel, and evolve over the next 5–10 years. It is the presentation-layer equivalent of Architecture Decision Records (ADRs).

AEDS does not describe today's CSS values or component file paths. Those live in implementation documents and code. AEDS defines **why** and **how** visual decisions are made — and what must never be sacrificed for short-term aesthetics.

---

## 1. Vision

### 1.1 Purpose

The PM-Twin design language exists to help professionals **understand, decide, and act** on complex business information with confidence. Every visual choice must serve clarity of data, trust in the platform, and efficiency of workflow — not decoration for its own sake.

### 1.2 Goals

| Goal | Meaning for PM-Twin |
|------|---------------------|
| **Enterprise-first** | The UI must scale from a solo consultant to a 10,000-seat organization without feeling toy-like or consumer-casual. Density, structure, and auditability matter. |
| **Information-first** | Data, status, and next actions are the hero. Visual chrome exists only to organize information — never to compete with it. |
| **Timeless** | The system must remain credible in 2035 without a full redesign. Favor structure, proportion, and restraint over fashion cycles. |
| **Scalable** | New modules (billing, compliance, consortium management, analytics) must slot into existing patterns without inventing new visual dialects. |
| **Accessible** | Every user — including those using keyboard, screen readers, high contrast, or reduced motion — must complete core workflows without impairment. |
| **Future-proof** | Visual evolution happens through tokens, themes, and primitives — not page-by-page rewrites. |

### 1.3 What we are not building

PM-Twin is not a marketing microsite, a social feed, or a gamified consumer app. It is not optimized for viral engagement or emotional novelty. It is a **professional operating environment** where users spend hours managing real business outcomes.

---

## 2. Design Philosophy

The PM-Twin design philosophy can be stated in seven commitments:

1. **Information over decoration.** If an element does not help the user read, compare, decide, or act — it does not belong on screen.

2. **Consistency over novelty.** Users should never need to relearn interaction patterns when navigating from opportunities to contracts to admin. Familiarity is a feature.

3. **Premium through clarity.** Perceived quality comes from precise hierarchy, generous spacing, predictable behavior, and polished details — not from ornamental effects.

4. **Large whitespace.** Breathing room between sections signals confidence and reduces cognitive load. Dense data belongs in structured containers, not cramped pages.

5. **Predictable interactions.** Buttons, links, and controls behave the same way everywhere. Surprises erode trust in enterprise software.

6. **Minimal visual noise.** Borders, shadows, colors, and badges are used with intention. Restraint is the default; emphasis is earned.

7. **Readable hierarchy.** Every screen must answer, at a glance: where am I, what matters most, what can I do next, and what is the current state?

---

## 3. Design Principles

Each principle below is **official policy**. Violations require a documented DDS amendment — not a silent exception in a pull request.

### 3.1 Hierarchy

**Why it exists.** Enterprise users process large volumes of structured data. Without clear visual hierarchy, critical status and actions are buried.

**What it protects.** Scanability, decision speed, and reduced error rates. Users must identify page purpose, primary content, and secondary context within seconds.

### 3.2 Consistency

**Why it exists.** PM-Twin spans dozens of entity types and lifecycle stages. Inconsistency forces users to interpret the UI instead of their work.

**What it protects.** Muscle memory, training cost, and cross-module trust. The same patterns for lists, detail views, forms, and status apply everywhere.

### 3.3 Accessibility

**Why it exists.** Enterprise procurement and KSA public-sector requirements demand inclusive design. Accessibility is not a polish pass — it is a baseline.

**What it protects.** Legal compliance, user reach, and quality under stress (bright sunlight, aging displays, assistive technology). See Section 10.

### 3.4 Performance

**Why it exists.** Heavy visual effects and unbounded animation degrade perceived and actual performance, especially on mid-range devices common in field environments.

**What it protects.** Time-to-interactive, scroll smoothness, and battery life. Visual richness must never come at the cost of responsiveness.

### 3.5 Scalability

**Why it exists.** New entity types, admin modules, and regional variants will be added for years. The design system must absorb growth without fragmentation.

**What it protects.** Long-term maintainability. One primitive layer, one token layer, one composition model — extended, not forked.

### 3.6 Responsiveness

**Why it exists.** Users review opportunities on desktop, approve actions on tablet, and check status on mobile. Layouts must adapt without losing capability.

**What it protects.** Workflow continuity across devices. Responsive behavior is a layout concern — never a reason to duplicate business logic.

### 3.7 Maintainability

**Why it exists.** A design system maintained only by its original authors is a liability. Patterns must be documented, token-driven, and composable by any engineer.

**What it protects.** Onboarding speed, refactor safety, and the ability to ship visual updates globally through tokens rather than file-by-file edits.

### 3.8 Future evolution

**Why it exists.** Markets, regulations, and brand requirements change. The system must evolve without architectural collapse.

**What it protects.** Investment in existing pages and components. Evolution flows through documented DDS versions and token/theme layers — not wholesale redesigns.

---

## 4. Enterprise Modern Style

This section defines the **official visual direction** for PM-Twin. It describes intent and character — not pixel values or class names.

### 4.1 Surfaces

Surfaces are the foundation of every screen. The app canvas is calm and neutral. Content panels sit on clearly defined surfaces with subtle differentiation between default, muted, and elevated levels. Surfaces communicate **containment** — what belongs together — not decoration.

### 4.2 Borders

Borders are structural, not ornamental. They separate regions and define interactive boundaries. Default borders are light and consistent; emphasis borders are reserved for focus, selection, or warning states. Heavy outlines and double borders are avoided.

### 4.3 Elevation

Elevation is expressed sparingly through shadow and surface level — not through arbitrary z-index stacking. Cards rest slightly above the canvas; floating elements (menus, popovers, modals) rise one level further. Elevation communicates **layer and priority**, not depth for its own sake.

### 4.4 Spacing

Spacing follows a disciplined rhythm. Page margins breathe. Sections are separated by consistent gaps. Form fields, table rows, and card interiors use predictable padding scales. Whitespace is a first-class design element — not leftover space.

### 4.5 Typography

Typography establishes hierarchy through size, weight, and color — not through excessive font families. Headings are confident but restrained. Body text is optimized for long reading sessions. Labels, captions, and metadata are visually subordinate. Numeric data (KPIs, IDs, financial figures) may use a distinct mono treatment for scanability.

### 4.6 Icons

Icons clarify meaning and accelerate recognition. They accompany labels for primary actions; icon-only controls require accessible names. Icons are consistent in stroke weight and size within a context. Decorative icons do not compete with data.

### 4.7 Cards

Cards group related information into scannable units. They have clear titles, optional descriptions, and defined action zones. Cards are not used when a table row or inline field would be more appropriate. Card density adapts to context — dashboard KPIs are compact; detail summaries are spacious.

### 4.8 Buttons

Buttons communicate action hierarchy: primary (commit), secondary (alternative), ghost (tertiary), and destructive (irreversible). One primary action per context is preferred. Button labels are verbs that describe outcomes. Disabled and loading states are always visible — never silent.

### 4.9 Tables

Tables are the primary instrument for enterprise list views. They support sort, filter, search, selection, pagination, and row actions without sacrificing readability. Column alignment follows data type (text left, numbers right). Empty, loading, and error states are first-class — never blank space.

### 4.10 Forms

Forms are structured, labeled, and validated. Fields are grouped into logical sections with clear progression in wizards. Read-only detail views use the same field vocabulary as editable forms — reducing cognitive switching. Error messages are specific, adjacent to fields, and recoverable.

### 4.11 Status badges

Status is always visible and semantically colored. Lifecycle states (draft, active, completed, cancelled) use a single canonical badge vocabulary across all entity types. Decorative badges (counts, tags, intent labels) are visually distinct from workflow status — users must never confuse the two.

### 4.12 Charts

Charts support decisions — they do not decorate dashboards. Axes, labels, and legends are readable at default size. Color encodes meaning consistently with the semantic token palette. Chart density respects the surrounding layout; sparklines and full charts serve different purposes.

### 4.13 Dashboards

Dashboards answer operational questions: what needs attention, what changed, what is blocked. KPI tiles lead; detail follows. Dashboards use metric grids, trend indicators, and quick actions — not wallpaper or hero imagery. Every widget must link to actionable detail.

---

## 5. Information Architecture

Layout hierarchy is **more important than decoration**. A well-structured page needs minimal visual embellishment; a poorly structured page cannot be saved with styling.

### 5.1 Core belief

Users navigate PM-Twin to **find, understand, and act on records**. Page structure must mirror mental models: entity → context → related entities → history.

### 5.2 Preferred page structure

Most workspace pages follow this vertical rhythm:

```
Hero (page header: title, description, primary actions)
        ↓
KPIs (metric tiles, readiness scores, summary counts)
        ↓
Quick Actions (stage transitions, create, publish, negotiate)
        ↓
Filters (search, status, date, entity-specific filters)
        ↓
Primary Content (table, kanban, form, or detail body)
        ↓
Inspector (sidebar metadata, readonly fields, related IDs)
        ↓
Activity (timeline, audit trail, collaboration history)
        ↓
Related Records (linked matches, deals, contracts, people)
```

Not every page includes every layer. The order is canonical — layers are omitted when irrelevant, never reordered without DDS justification.

### 5.3 Layout archetypes

| Archetype | Use | Structure |
|-----------|-----|-----------|
| **List** | Index pages (opportunities, deals, people) | Hero → filters → table → pagination |
| **Detail** | Single record inspection | Hero → KPI strip → detail layout (main + inspector) → activity → related |
| **Dashboard** | Operational overview | Hero → metric grid → sectioned widgets |
| **Wizard** | Multi-step creation | Stepper → form sections → summary → actions |
| **Split** | Master-detail (messages, queues) | List pane + detail pane — responsive stack on narrow viewports |

### 5.4 Navigation hierarchy

Global navigation (sidebar, command palette) provides **where to go**. Page headers provide **where you are**. Breadcrumbs provide **how you got here**. These three layers must never contradict each other.

---

## 6. Component Philosophy

Components are the contract between design governance and implementation. They must be stable, composable, and token-driven.

### 6.1 Composition rules

1. **Pages compose components.** Pages arrange layout primitives and domain sections. They do not implement visual styling.

2. **Components consume tokens.** All color, spacing, typography, shadow, and motion values flow from the token hierarchy (Section 7). Hardcoded visual values in components are a governance violation.

3. **Pages never own visual styling.** Pages pass data and structure — not `className` overrides, inline colors, or one-off margins.

4. **No page-specific UI components unless justified.** Reusable patterns belong in `pm-*` primitives or domain sections. Page-local components require DDS documentation explaining why shared primitives are insufficient.

5. **Prefer composition over duplication.** Extend existing primitives through props and slots — do not fork a new card, button, or badge variant for a single screen.

### 6.2 Component layers (frozen)

| Layer | Responsibility | May import from |
|-------|----------------|-----------------|
| Pages | Route-level composition | PM layout index, domain sections |
| Domain sections | Entity-specific UI (opportunity card, match timeline) | PM primitives, display helpers |
| PM primitives | Canonical product API (`PmButton`, `PmCard`, etc.) | Tokens, shadcn implementation layer |
| shadcn/ui | Headless/styled primitives | Tokens only |
| Tokens | Visual values | Nothing |

### 6.3 Domain component guidance

Domain components (e.g., `OpportunityStatusBadge`, `ReadinessCard`) wrap PM primitives with business semantics. They delegate visual styling to PM layers. They may contain display logic but not lifecycle or command logic.

---

## 7. Token Philosophy

Tokens are the **single source of visual truth**. All visual change should be achievable by updating tokens — not by editing individual components or pages.

### 7.1 Token hierarchy

```
Brand
  ↓
Semantic
  ↓
Component
  ↓
Layout
  ↓
Motion
```

### 7.2 Layer responsibilities

| Layer | Responsibility | Examples | Who changes it |
|-------|----------------|----------|----------------|
| **Brand** | Identity constants that rarely change | Primary brand hue, logo spacing, heading font family | Brand / leadership — DDS amendment |
| **Semantic** | Meaning-based colors and roles | `success`, `warning`, `danger`, `surface`, `foreground` | Design system maintainer — DDS or patch |
| **Component** | Defaults for primitive types | Button height, card radius, badge padding, table row density | Design system maintainer — implementation doc |
| **Layout** | Spatial rhythm | Page padding, section gap, grid columns, breakpoint behavior | Design system maintainer |
| **Motion** | Duration, easing, transition scope | Fast/base/slow durations, reduced-motion overrides | Design system maintainer |

### 7.3 Token rules

- Tokens are **semantic**, not presentational. Prefer `surface-elevated` over `gray-100`.
- Components reference tokens — never raw color values or magic numbers.
- New tokens require justification: what semantic meaning does this encode that existing tokens cannot?
- Deprecated tokens are documented and removed on a schedule — not left indefinitely alongside replacements.

---

## 8. Theme Philosophy

Themes modify **tokens**, not **components**. A button component does not know whether the user is in light or dark mode — it reads `primary` and `foreground` from the active theme.

### 8.1 Official theme targets

| Theme | Purpose | Status |
|-------|---------|--------|
| **Enterprise Light** | Default professional workspace | Active |
| **Enterprise Dark** | Low-light environments, extended sessions | Active |
| **High Contrast** | Accessibility and regulatory compliance | Planned |
| **Compact** | Increased data density for power users | Planned |
| **Future themes** | Regional, white-label, or partner branding | As needed — DDS amendment |

### 8.2 Theme rules

1. Every semantic token must define values for every supported theme.
2. Components must not contain theme-specific branching (`if dark mode then...`). The token layer handles this.
3. New themes are additive — they do not break existing themes.
4. Theme switching is instant and preserves user preference across sessions.
5. Public/marketing surfaces may lag authenticated themes — but must eventually conform.

---

## 9. Motion Philosophy

Motion in PM-Twin is **functional**, not decorative.

### 9.1 Principles

| Principle | Meaning |
|-----------|---------|
| **Small** | Motion affects small regions — a button state, a panel entrance, a badge update. Full-page animations are rare. |
| **Fast** | Durations are short enough to feel responsive. Users waiting for animation are not working. |
| **Meaningful** | Animation communicates state change: opened, closed, added, removed, loading, success. |
| **Accessible** | `prefers-reduced-motion` is honored globally. No essential information is conveyed only through animation. |

### 9.2 Approved motion contexts

- Page enter fade (subtle orientation)
- Panel and modal open/close
- List item add/remove
- Loading indicators
- Status badge transition
- Hover and focus feedback

### 9.3 Prohibited motion

- Auto-playing loops on workspace pages
- Parallax scrolling in product UI
- Animation that delays user input
- Bouncing, pulsing, or shaking except for critical alerts
- Motion as the sole indicator of success or failure

---

## 10. Accessibility

Accessibility is a **non-negotiable requirement** for all PM-Twin surfaces — workspace, admin, and public.

### 10.1 Requirements

| Requirement | Standard |
|-------------|----------|
| **Keyboard navigation** | All interactive elements reachable and operable via keyboard. Logical tab order. Escape closes overlays. |
| **Focus visibility** | Focus rings are always visible on keyboard focus. Custom focus styles must meet contrast requirements. |
| **Contrast** | Text and interactive elements meet WCAG 2.1 AA minimum. Status colors are distinguishable without color alone. |
| **Reduced motion** | `prefers-reduced-motion` disables non-essential animation globally. |
| **Screen readers** | Meaningful labels on all controls. `aria-*` attributes on dynamic regions. Live regions for async updates. |
| **Touch targets** | Minimum 44×44 CSS pixels for touch-interactive elements on mobile. |
| **Readable typography** | Body text minimum 14px equivalent. Line height supports extended reading. User zoom to 200% without horizontal scroll on primary content. |

### 10.2 Enterprise accessibility expectations

- Form errors are announced and associated with fields.
- Tables provide column headers and row context for screen readers.
- Status changes in workflow entities are communicated without relying on color alone.
- Skip links and landmark regions exist in the app shell.

---

## 11. Responsive Design

### 11.1 Philosophy

PM-Twin is **desktop-first** for workspace and admin — reflecting how enterprise users perform complex work. Mobile support ensures **read, review, and approve** workflows — not full data entry parity on every screen.

### 11.2 Principles

| Principle | Application |
|-----------|-------------|
| **Desktop-first workspace** | Primary layouts, tables, and detail inspectors are designed for ≥1024px. |
| **Mobile-friendly** | Critical paths (view status, approve action, read notification) work on ≤640px. |
| **Adaptive layouts** | Split panes stack vertically. Tables degrade to card lists. Sidebars become sheets. |
| **Progressive disclosure** | Secondary detail hides behind panels, tabs, or expanders on narrow viewports — primary content remains visible. |
| **No duplicated business logic** | Responsive behavior is a **layout concern**. The same data and commands power all breakpoints. |

### 11.3 Breakpoint intent

Breakpoints express **layout adaptation points** — not separate products. A user who starts on desktop and continues on mobile sees the same record, same status, same actions (where screen size permits).

---

## 12. RTL Philosophy

PM-Twin targets Saudi Arabia and the GCC. Arabic RTL support is a **strategic requirement**, not an afterthought.

### 12.1 Requirements

| Requirement | Guidance |
|-------------|----------|
| **Arabic support** | Full UI translation with RTL layout. Hijri date display preferred where culturally appropriate. |
| **Mirrored layouts** | Navigation, split panes, inspectors, and toolbars mirror correctly in RTL. |
| **Logical spacing** | Use logical properties (`margin-inline`, `padding-inline`, `inset-inline`) — not hardcoded `left`/`right`. |
| **Logical icons** | Directional icons (chevrons, arrows, back) flip in RTL. Symmetric icons do not. |
| **Locale-aware typography** | Arabic script uses appropriate font stack and line height. Mixed LTR/RTL content (IDs, emails, URLs) is handled inline. |

### 12.2 RTL governance

- No new component may ship with hardcoded physical direction (`ml-4`, `text-left`) where logical equivalents exist.
- RTL validation is a **release gate** for KSA production — not a post-launch patch.
- DDS amendments related to RTL are documented as DDS-00x entries when regional launch approaches.

---

## 13. Future Evolution

The design system must evolve without rebuilding the product.

### 13.1 Approved evolution paths

| Path | What changes | What does not change |
|------|--------------|----------------------|
| **Themes** | Color values, contrast levels, density | Component APIs, page structure |
| **Tokens** | Spacing scale, radius, shadow depth | Component composition model |
| **Motion** | Duration, easing curves | Motion philosophy (small, fast, meaningful) |
| **Typography** | Font family, scale, weight | Hierarchy levels (display, h1–h3, body, caption) |
| **Elevation** | Shadow intensity, surface levels | Elevation semantics (card vs floating vs modal) |

### 13.2 Prohibited evolution paths

- Rebuilding pages to chase visual trends
- Introducing page-specific CSS that bypasses tokens
- Adding visual variants outside the PM primitive layer
- Forking components for a single customer or screen
- Embedding presentation logic in domain or command layers

### 13.3 Evolution cadence

- **Patch** — token value adjustments, contrast fixes, bug fixes (no DDS required)
- **Minor** — new primitive, new theme, new token category (DDS addendum or DDS-00x)
- **Major** — philosophy change, hierarchy model change, breaking primitive API (new DDS version)

---

## 14. Governance Rules

### 14.1 Component introduction policy

**No new visual component may be introduced unless:**

1. Existing PM components cannot solve the problem.
2. Design documentation is updated (DDS addendum or implementation spec in `docs/ui/`).
3. Naming follows PM conventions (`Pm*` prefix, `pm-*.tsx` file).
4. Visual decisions are token-driven — no hardcoded values.

### 14.2 Page change policy

| Allowed without DDS amendment | Requires DDS or implementation doc update |
|-------------------------------|-------------------------------------------|
| Wiring data into existing PM shells | New layout archetype |
| Adding rows to existing tables | New primitive category |
| New domain section composing PM primitives | New theme |
| Connecting loading/error states to API | Philosophy change |

### 14.3 Review checklist

Before merging any UI change, reviewers confirm:

- [ ] Uses PM primitives — no direct shadcn from pages
- [ ] No hardcoded colors, spacing, or font sizes
- [ ] Status badges use canonical workflow vocabulary
- [ ] Empty, loading, and error states are present
- [ ] Keyboard and screen reader accessibility considered
- [ ] No business logic added to UI components
- [ ] Implementation doc updated if tokens or primitives changed

### 14.4 Relationship to UI freeze

[PM-TWIN-UI-FREEZE.md](../ui/PM-TWIN-UI-FREEZE.md) (Phase 9) froze the **current implementation**. DDS-001 governs **all future implementation**. The freeze remains in force until Backend Foundation completes and a new UI phase is explicitly chartered.

---

## 15. Versioning

### 15.1 DDS numbering

Design decisions are documented as **DDS-NNN** — the presentation-layer parallel to **ADR-NNN**.

| Document | Scope |
|----------|-------|
| **DDS-001** | AEDS — constitutional design governance (this document) |
| **DDS-002+** | Specific design decisions: new theme, RTL rollout, chart system, marketing visual language, white-label policy |

### 15.2 DDS lifecycle

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion — not binding |
| **Accepted** | Binding governance — team must follow |
| **Superseded** | Replaced by a newer DDS — historical reference only |
| **Constitutional** | Foundational — amendments require explicit versioning (DDS-001 only) |

### 15.3 Amendment process

1. Author drafts DDS-NNN with context, decision, consequences, and alternatives.
2. Design system maintainer and tech lead review.
3. On acceptance, implementation docs (`docs/ui/`) are updated if tokens or primitives are affected.
4. ADRs are consulted — presentation changes must not violate architecture boundaries.

### 15.4 Implementation doc relationship

| Document type | Role |
|---------------|------|
| **DDS** | Why and what policy |
| **docs/ui/PM-TWIN-DESIGN-SYSTEM-V2.md** | Current token and primitive specification (how) |
| **docs/ui/PM-TWIN-UI-FREEZE.md** | Current adoption and legacy inventory (as-is) |

When implementation and DDS conflict, **DDS wins** — implementation must be updated to conform.

---

## 16. Relationship with ADRs

Architecture Decision Records (ADRs) and Design Decision Specifications (DDS) are **parallel governance systems**. Neither overrides the other.

| Dimension | ADR (Architecture) | DDS (Design) |
|-----------|---------------------|--------------|
| **Governs** | Behavior, structure, data flow, boundaries | Presentation, visual language, interaction patterns |
| **Examples** | Lifecycle vocabulary, command gateway, repository ownership, multi-tenancy | Token hierarchy, theme policy, motion rules, RTL requirements |
| **Authority** | `docs/adr/ADR-NNN.md` | `docs/design/DDS-NNN.md` |
| **Frozen by** | ADR-100 (Architecture Freeze v1.0) | DDS-001 (this document) + Phase 9 UI Freeze |
| **Changes require** | New ADR with acceptance | New DDS with acceptance |

### 16.1 Interaction rules

1. **ADR defines what the system does.** DDS defines how it looks and feels.
2. **ADR-001 lifecycle states** determine what status badges display — DDS determines how badges appear.
3. **ADR-103 (PDPL)** and **ADR-104 (VAT)** impose data presentation requirements — DDS ensures they are displayed clearly and accessibly.
4. **ADR-100** froze runtime topology — DDS does not change where code lives, only how UI code consumes tokens.
5. A proposed change that affects **both** behavior and presentation requires **both** an ADR and a DDS (or amendments to each).

### 16.2 Current ADR cross-reference

| ADR | DDS interaction |
|-----|-----------------|
| ADR-100 Architecture Freeze | UI architecture frozen; DDS governs future visual evolution within frozen layers |
| ADR-101 Backend Domain Ownership | Presentation stays in `web/`; DDS does not move UI into packages |
| ADR-102 Multi-tenancy | Future white-label theming governed by DDS theme philosophy (Section 8) |
| ADR-103 PDPL Compliance | DDS accessibility and data display clarity support compliance |
| ADR-104 VAT Financial Fields | DDS table and form hierarchy ensures financial data is prominent and explicit |
| ADR-105 Domain Event Catalog | Activity timelines and audit displays follow DDS information architecture (Section 5) |

---

## 17. Out of Scope

This document and Phase 1 (DDS-001) explicitly exclude:

| Excluded | Notes |
|----------|-------|
| CSS changes | No edits to `index.css` or stylesheets |
| Component changes | No edits to `pm-*` primitives or domain components |
| Redesign | No visual changes to any page |
| Backend work | No API, repository, or command changes |
| Token updates | No new or modified design token values |
| Theme implementation | No new themes built or shipped |
| Tailwind changes | No configuration or utility changes |
| Page migration | No public/marketing or legacy page migration |
| Business logic changes | No domain, lifecycle, or command changes |

**Phase 1 is documentation only.** Implementation of DDS policies occurs in future phases, each explicitly chartered.

---

## Appendix A — Document map

| Document | Layer | Status |
|----------|-------|--------|
| DDS-001 (this document) | Constitutional design governance | Accepted |
| PM-TWIN-DESIGN-SYSTEM-V2.md | Implementation spec (tokens, primitives) | Active |
| PM-TWIN-UI-FREEZE.md | Architecture freeze (as-is inventory) | Frozen |
| PM-TWIN-UI-AUDIT-V2.md | Phase 1 UI inventory | Historical |
| PM-TWIN-UI-V2-CONSISTENCY-AUDIT.md | Phase 8 QA gate | Historical |
| ADR-100 | Architecture freeze | Frozen |

## Appendix B — Glossary

| Term | Definition |
|------|------------|
| **AEDS** | Adaptive Enterprise Design System — the PM-Twin design constitution |
| **DDS** | Design Decision Specification — a governed design document (DDS-NNN) |
| **PM primitive** | Canonical UI component prefixed with `Pm` (e.g., `PmButton`, `PmCard`) |
| **Token** | A named visual value (color, spacing, shadow, motion) consumed by components |
| **Theme** | A complete set of token values for a visual mode (light, dark, high contrast) |
| **Domain section** | Entity-specific UI component composing PM primitives (e.g., `OpportunityCard`) |

---

*DDS-001 accepted 29 June 2026. Constitutional governance — documentation only; no code modified.*
