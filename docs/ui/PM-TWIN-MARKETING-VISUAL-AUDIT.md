# PM-Twin Marketing Pages Visual Audit

| Field | Value |
|-------|-------|
| Sprint | Marketing Visual Audit (Analysis Only) |
| Date | 1 July 2026 |
| Scope | `web/src/pages/public/` and supporting public shell (`public-layout.tsx`, `legacy-poc-*.css`, `components/public/*`) |
| Reference bar | Stripe · Linear · Vercel · Notion · Framer · Atlassian |
| Authority | [PM-TWIN-DESIGN-SYSTEM-V2.md](./PM-TWIN-DESIGN-SYSTEM-V2.md) · [PM-TWIN-UI-FREEZE.md](./PM-TWIN-UI-FREEZE.md) |
| Status | **Analysis complete — no code changes** |

---

## Executive Summary

PM-Twin’s public surface is a **split personality**: six routes use a ported POC “built-environment” visual language (isometric 3D motifs, grid heroes, Phosphor duotone icons, bespoke CSS), while four routes use bare shadcn/Tailwind primitives with almost no brand treatment. The workspace already reads as a premium B2B product (~93% DS v2 adoption per UI freeze); marketing pages sit at roughly **35% design-system alignment** and **do not yet deliver a cohesive premium marketing experience** comparable to Stripe, Linear, or Vercel.

**What works:** Home, Find, Workflow, Knowledge Base, and Login share a recognizable construction/BIM identity—grid backgrounds, teal/coral accents, isometric visuals, and domain-specific copy. Home in particular communicates value on the first screen (search + dual CTAs + trust chips).

**What blocks premium readiness:** (1) two incompatible visual systems on adjacent journeys, (2) no mobile navigation menu, (3) missing standard SaaS pages (About, Features, Pricing, Contact), (4) no social proof or trust layer, (5) no RTL/Arabic on public routes despite KSA positioning, (6) stub flows (Register, Collaboration Wizard), (7) weak footer/legal surface, (8) typography and motion that feel heavy versus modern reference products.

**Overall marketing readiness score: 5.1 / 10** — strong raw material on legacy hero pages, but not yet a unified, conversion-optimized marketing system.

---

## Inventory

### Routes audited (in scope)

| Route | Component | Visual system | Notes |
|-------|-----------|---------------|-------|
| `/` | `LegacyHomePage` | Legacy POC CSS | Richest marketing page |
| `/find` | `LegacyFindPage` | Legacy POC CSS | Marketplace + marketing hybrid |
| `/workflow` | `LegacyWorkflowPage` | Legacy POC CSS + seed HTML | 8-step lifecycle |
| `/knowledge-base` | `LegacyKnowledgeBasePage` | Legacy POC CSS + seed HTML | Tabbed guides + FAQ |
| `/collaboration-models` | `CollaborationModelsPage` | shadcn/Tailwind only | Minimal card grid |
| `/collaboration-wizard` | `CollaborationWizardPage` | shadcn/Tailwind only | Step 1 stub |
| `/login` | `LegacyLoginPage` | Legacy POC CSS + seed HTML | Split auth layout |
| `/register` | `LegacyRegisterPage` | Hybrid legacy + Tailwind | Step 1 only; dead end |
| `/forgot-password` | `ForgotPasswordPage` | shadcn Card | No brand shell |
| `/reset-password` | `ResetPasswordPage` | shadcn Card | No brand shell |

### Routes referenced in brief but **not implemented**

| Expected page | Status |
|---------------|--------|
| About | **Missing** — no route or content |
| Features | **Missing** — value props live only on Home sections |
| Pricing | **Missing** — no subscription/plan presentation |
| Contact | **Missing** — KB FAQ references “footer contact options when available” but no contact page or footer links |

### Shared chrome

| Asset | Role | Assessment |
|-------|------|------------|
| `public-layout.tsx` | Header + outlet + conditional footer | Functional but minimal; nav hidden below `md` with **no mobile menu** |
| `legacy-poc-tokens.css` | Legacy color/spacing tokens | Parallel token layer vs `index.css` oklch system |
| `legacy-poc-forms.css` | `.btn`, `.form-input`, badges | Used across legacy pages; font-weight 500 vs 850 headings |
| Phosphor Icons (CDN) | Duotone/fill icons | External CDN dependency; not bundled |
| `poc-site-content.json` | HTML fragments for workflow, KB, auth | CMS-ready but injects via `dangerouslySetInnerHTML` |

---

## Cross-Cutting Findings

### 1. Brand identity

| Signal | Assessment |
|--------|------------|
| Construction / BIM / collaboration | **Strong** on Home, Find, Workflow, KB, Login marketing columns |
| PM-Twin vs PMTwin naming | **Inconsistent** — `APP_NAME` vs copy uses “PMTwin” and “PMTwin” interchangeably |
| Logo / mark | Text wordmark only (`#0369a1`); no icon lockup in header |
| Premium B2B feel | **Partial** — distinctive isometric art direction, but execution feels POC-era vs Stripe/Linear polish |
| KSA / GCC positioning | Mentioned in copy; **no Arabic RTL, Hijri dates, or PDPL trust badges** on public pages |

### 2. Visual hierarchy

Legacy pages follow a repeatable pattern: **kicker → oversized H1 → subtitle → body → CTA → isometric visual**. Hierarchy is clear on desktop. Issues:

- H1 sizes use `line-height: 0.92–0.99` and `font-weight: 850` — punchy but can feel cramped and non-premium at scale.
- Collaboration Models / Wizard / Forgot / Reset have **flat hierarchy** (single H1, muted body, no hero).
- Workflow page uses **multiple `<h2>` inside step cards** after page-level `<h1>` — semantically noisy; step titles should be `<h3>`.

### 3. Typography

| Aspect | Finding |
|--------|---------|
| Font family | Plus Jakarta Sans loaded globally — good alignment with workspace |
| Heading scale | Legacy pages: `clamp(2.35rem, 5vw, 6.4rem)` H1s; workspace uses calmer PM scale |
| Body text | ~1rem, line-height 1.55–1.75 — readable |
| Weight contrast | Extreme jump: body 400–500 vs kickers/headlines **800–850** |
| shadcn pages | Default `text-2xl` / `text-3xl` — under-scaled vs legacy neighbors |

### 4. Layout

| Aspect | Finding |
|--------|---------|
| Container width | Consistent `1180px` / `max-w-7xl` intent across legacy pages |
| Section rhythm | Legacy: `clamp(3rem–6rem)` vertical padding — good |
| Grid | 2-col heroes collapse at 1024px; content grids at 720px |
| White space | Generous on legacy heroes; cramped on stub pages |
| Footer | **Suppressed** on flush paths (`/`, `/find`, `/workflow`, `/knowledge-base`, `/login`, `/register`) — no site-wide footer on primary journeys |

### 5. Components

| Component | Legacy pages | shadcn pages | Gap vs reference products |
|-----------|--------------|--------------|---------------------------|
| Buttons | `.btn` / `.pm-btn` — 8px radius, heavy weight | `Button` — 10px+ radius, tokenized | Two button languages |
| Cards | Bordered white, subtle shadow | `border-border/60` minimal | No elevated pricing/testimonial cards |
| Icons | Phosphor duotone | Lucide in shadcn only | Inconsistent icon families |
| Testimonials | **None** | — | Missing social proof |
| Pricing cards | **None** | — | Missing |
| FAQ | Static Q&A blocks in KB | — | No accordion, no schema markup |
| Feature blocks | Home audience + models sections | Collaboration Models only | Uneven depth |

### 6. Colors

| Layer | Values | Issue |
|-------|--------|-------|
| Legacy primary CTA | `#0369a1` / `#0284c7` | Matches legacy tokens |
| DS v2 primary | `oklch(0.455 0.154 261)` | Slightly different perceptual hue on shadcn pages |
| Accent palette | Teal `#0891b2`, coral `#e85d4f`, green `#2f9f7b` | Rich but **not tokenized** in marketing system |
| Backgrounds | `#f7f9fb`, grid overlays | Cohesive on legacy routes |
| CTA on dark band | Home `.pm-cta` inverts to white button on `#101820` | Effective contrast |

### 7. Motion

| Pattern | Present | Recommendation |
|---------|---------|----------------|
| Hero pointer tilt (Home) | Yes — respects `prefers-reduced-motion` | Keep, extend subtly to card hovers |
| Section reveal on scroll | **No** | Add lightweight stagger (Framer/Linear pattern) |
| Card hover lift | Minimal border change | Add translateY + shadow on feature cards |
| Tab transitions | Instant show/hide | Add cross-fade for KB tabs |
| Button micro-interactions | Color only | Add press scale, focus ring consistency |

### 8. Mobile UX

| Issue | Severity | Affected routes |
|-------|----------|-----------------|
| **No hamburger / mobile nav** | Critical | All public pages |
| Nav links `hidden md:flex` | Critical | Find, Workflow, KB unreachable from header on mobile |
| Hero visuals scale down | Medium | Acceptable but busy below 440px |
| Trust row hidden `<440px` | Low | Home — loses credibility chips |
| Full-width CTAs at 720px | Good | Home, Find login banner |
| Auth split stacks at 980px | Good | Login, Register |

### 9. Accessibility

| Check | Status |
|-------|--------|
| Color contrast (legacy CTAs) | Generally passes on primary buttons |
| Focus states | Legacy forms have focus rings; some legacy links lack visible focus |
| Heading order | **Fails** on Workflow steps (h1 → h2 intro → h2 per step) |
| Keyboard — Find tabs | Buttons work; **missing `role="tab"` / `aria-selected`** pattern |
| Keyboard — KB tabs | Partial — `role="tab"` present; panels use `hidden` not `aria-hidden` coordination |
| Semantic landmarks | `<main>` in layout; sections labeled on Home |
| Screen reader — decorative 3D | Mostly `aria-hidden` — good |
| RTL | **Not supported** on marketing (`dir="ltr"` fixed in `index.html`) |
| Social login buttons | Toast-only placeholders — **misleading affordance** |

### 10. Conversion optimization

| Element | Assessment |
|---------|------------|
| Hero effectiveness | **Strong** on Home (search + register + explore) |
| CTA clarity | Good labels; **competing CTAs** on some pages (search vs register) |
| Trust signals | Trust chips on Home only; **no logos, metrics, case studies, certifications** |
| Customer journey | Home → Find/Register works; **Wizard and Register dead-end** |
| Social proof | **Absent** |
| Pricing presentation | **Absent** |
| Login gate on Find | Effective urgency banner for anonymous users |

### 11. Consistency between pages

```
┌─────────────────────────────────────────────────────────────┐
│  TIER A — Legacy POC visual language (premium-ish, bespoke) │
│  Home · Find · Workflow · KB · Login (marketing column)      │
├─────────────────────────────────────────────────────────────┤
│  TIER B — Hybrid / incomplete                              │
│  Register (legacy shell + Tailwind form card)                │
├─────────────────────────────────────────────────────────────┤
│  TIER C — Baseline shadcn (generic SaaS starter)           │
│  Collaboration Models · Wizard · Forgot · Reset Password     │
└─────────────────────────────────────────────────────────────┘
```

Transition whiplash is highest on: **Home → Collaboration Wizard**, **Login → Forgot Password**, **KB → Collaboration Models**.

---

## Page-by-Page Audit

### Home (`/`)

**Role:** Primary landing — marketplace search, value proposition, audience segmentation, collaboration models teaser, closing CTA.

**Strengths**
- Best-in-class public hero: kicker, value prop, search with suggestion chips, dual CTAs, isometric BIM visual with match panels.
- Clear section narrative: metrics → process → audience → models → CTA.
- Pointer-tilt interaction on hero visual (accessible fallback).
- Responsive grid collapse and full-width mobile CTAs.

**Weaknesses**
- Brand name “PMTwin” in H1 vs “PM-Twin” in app title.
- No customer logos, stats, or testimonials.
- Trust row hidden on smallest breakpoints.
- No footer on flush layout (legal, contact, social).
- Typography extremely heavy vs workspace calmness.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **7** | Distinctive art direction; not yet Stripe-tier polish |
| UX | **7** | Clear paths to Find and Register |
| Consistency | **6** | Matches Tier A; diverges from Tier C routes |
| Accessibility | **6** | Good landmarks; tight H1 line-height; trust row removed on mobile |
| Conversion | **7** | Strong hero; lacks social proof |
| Responsiveness | **7** | Solid breakpoints; hero visual busy on small screens |
| **Page average** | **6.7** | |

---

### Find (`/find`)

**Role:** Public marketplace discovery — people, companies, opportunities with filters and auth gate.

**Strengths**
- Hero consistent with Home visual language.
- Functional tabs, filters, and result cards.
- Login banner for anonymous users drives registration.
- Empty states with icons.

**Weaknesses**
- Blends marketing hero with product UI — may confuse “marketing” vs “app” boundary.
- Tab list lacks full ARIA tabs pattern.
- Preview cards tease but frustrate without login — intentional but needs clearer value exchange.
- `font-weight: 850` on Find search button uses ink black, not brand primary — CTA inconsistency vs Home.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **6** | Cohesive hero; results area is utilitarian |
| UX | **7** | Search + filter workflow is clear |
| Consistency | **6** | Tier A hero; product-like results grid |
| Accessibility | **5** | Incomplete tabs semantics; filter labels ok |
| Conversion | **6** | Login banner helps; no guest preview limit messaging |
| Responsiveness | **6** | Filters stack; map visual degrades |
| **Page average** | **6.0** | |

---

### How it works / Workflow (`/workflow`)

**Role:** Explain end-to-end platform lifecycle from registration to closure.

**Strengths**
- Hero matches Tier A pattern with lifecycle visual.
- Eight numbered steps cover full product story.
- Links into product routes aid discovery for signed-up users.

**Weaknesses**
- “Quick links” block is an unstyled link dump — breaks premium feel.
- Links expose `/admin/matching`, `/contracts` to anonymous users — cognitive leak from marketing to ops.
- Heading hierarchy incorrect (multiple h2 step titles).
- No progressive disclosure — wall of 8 equal-weight cards.
- Seed HTML via `PocHtmlBlock` — harder to maintain than React components.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **7** | Hero strong; steps grid functional not inspirational |
| UX | **6** | Comprehensive but dense; quick links amateur |
| Consistency | **7** | Tier A visual language |
| Accessibility | **4** | Heading order issues; link list not a nav landmark |
| Conversion | **6** | Register CTA in hero; steps link away from funnel |
| Responsiveness | **6** | 2-col steps → 1-col; readable |
| **Page average** | **6.0** | |

---

### Knowledge Base (`/knowledge-base`)

**Role:** Education — collaboration models, SPV/legal basics, FAQ.

**Strengths**
- Hero + sidebar + tabbed content structure is sound IA.
- FAQ content addresses real user questions.
- CTA to Collaboration Wizard in FAQ panel.
- Sticky sidebar on desktop.

**Weaknesses**
- FAQ is static text — no expand/collapse (Notion/Atlassian pattern).
- Sidebar content duplicates tab function partially.
- Tab panels use `hidden` attribute without smooth transition.
- No search within KB.
- No contact/support escalation despite FAQ mention.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **6** | Clean but documentation-style, not marketing-premium |
| UX | **6** | Tabs work; content scanning is hard in long panels |
| Consistency | **6** | Tier A hero; body is docs UI |
| Accessibility | **5** | Tabs partially implemented; FAQ not accordion |
| Conversion | **5** | Wizard CTA only; no lead capture |
| Responsiveness | **6** | Sidebar stacks below 900px |
| **Page average** | **5.7** | |

---

### Collaboration Models (`/collaboration-models`)

**Role:** Overview of four collaboration model categories.

**Strengths**
- Content matches Home models section (consistent messaging).
- Simple card grid is scannable.
- Link to wizard.

**Weaknesses**
- **No hero, no visual brand** — generic bordered cards on default background.
- Duplicates Home/KB content without added depth.
- Uses shadcn `Button` while neighbors use `.pm-btn`.
- Footer appears (non-flush) but minimal — only copyright line.
- Richer version exists in `site-content.json` but **not wired** to this route.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **4** | Placeholder-tier |
| UX | **5** | Readable; no reason to visit over Home section |
| Consistency | **3** | Tier C — sharp break from Tier A |
| Accessibility | **6** | Simple structure; headings ok |
| Conversion | **4** | Weak CTA presentation |
| Responsiveness | **5** | Basic grid |
| **Page average** | **4.5** | |

---

### Collaboration Wizard (`/collaboration-wizard`)

**Role:** Guided model recommendation (expected AI wizard per seed content).

**Strengths**
- Step 1 question UI is clean enough.
- Sets expectation of personalization.

**Weaknesses**
- **Stub only** — one step, no progression, no results (seed `result-block` unused).
- No hero, no explanation of outcome.
- “AI Collaboration Wizard” promised in site content; UI says generic “Collaboration Wizard”.
- Dead end hurts trust after KB/Home CTAs.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **3** | Minimal unstyled wizard shell |
| UX | **4** | Incomplete flow — high abandonment risk |
| Consistency | **2** | Lowest alignment in public set |
| Accessibility | **5** | Step buttons lack selected state semantics |
| Conversion | **3** | Broken promise vs marketing CTAs |
| Responsiveness | **5** | Narrow container ok |
| **Page average** | **3.7** | |

---

### Login (`/login`)

**Role:** Authentication entry with marketing story column.

**Strengths**
- Split layout: marketing visual + form — Stripe/Linear pattern.
- Account type selector cards are well designed.
- Demo credentials dialog supports evaluators.
- Error alert, remember me, forgot password link.
- Marketing column from seed content reinforces product value.

**Weaknesses**
- Social login buttons are **non-functional** (toast only) — trust risk.
- Register page uses different form styling — auth pair inconsistent.
- `pm-auth-kicker` in form header uses uppercase label styling for “PMTwin portal” — minor hierarchy oddity.
- No link to Features/Pricing/Contact.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **7** | Strong split auth layout |
| UX | **7** | Complete login path; demo accounts help |
| Consistency | **5** | Pairs poorly with Forgot/Reset |
| Accessibility | **6** | Radio group labeled; social buttons misleading |
| Conversion | **6** | Good for returning users; weak for new visitor trust |
| Responsiveness | **6** | Stacks at 980px |
| **Page average** | **6.2** | |

---

### Register (`/register`)

**Role:** Account creation entry (6-step flow in design).

**Strengths**
- Marketing column matches Login pattern.
- Step nav shows full intended journey.
- Account type cards use accessible radio pattern with Tailwind polish.

**Weaknesses**
- **Only step 1 implemented** — Continue button leads nowhere.
- Hybrid CSS: legacy page shell + Tailwind card + unused seed header elements (`Try Demo Data` button in HTML not wired).
- Duplicate “Login here” links (seed header + bottom).
- Highest frustration point in acquisition funnel.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **5** | Split layout good; form area stylistically mixed |
| UX | **3** | Broken registration funnel |
| Consistency | **3** | Hybrid Tier A/B; diverges from Login form CSS |
| Accessibility | **5** | Step nav visual only — not interactive |
| Conversion | **2** | Critical funnel failure |
| Responsiveness | **5** | Acceptable stacking |
| **Page average** | **3.8** | |

---

### Forgot Password (`/forgot-password`)

**Role:** Password reset request.

**Strengths**
- shadcn Card is accessible baseline.
- Simple single-field form.

**Weaknesses**
- **No brand treatment** — could be any SaaS template.
- Flush layout off → gray `bg-background` vs legacy `#f7f9fb`.
- Seed content in `site-content.json` **not used** — duplicate copy maintenance.
- No visual continuity with Login.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **4** | Generic card |
| UX | **5** | Clear but minimal |
| Consistency | **2** | Worst auth sibling mismatch |
| Accessibility | **7** | shadcn labels/inputs ok |
| Conversion | **4** | N/A — utility page |
| Responsiveness | **6** | Fine |
| **Page average** | **4.7** | |

---

### Reset Password (`/reset-password`)

**Role:** Set new password after reset link.

**Assessment:** Same tier as Forgot Password — generic shadcn card, no branding, no token validation UI, link back to login only.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual Design | **4** | Generic |
| UX | **5** | Minimal |
| Consistency | **2** | Auth family outlier |
| Accessibility | **7** | Baseline ok |
| Conversion | **3** | No reassurance copy |
| Responsiveness | **6** | Fine |
| **Page average** | **4.5** | |

---

## Screens Requiring Redesign

Priority order for full visual/UX redesign (not implementation — planning only):

| Priority | Screen | Why |
|----------|--------|-----|
| P0 | **Register** | Broken funnel — blocks acquisition |
| P0 | **Collaboration Wizard** | CTAs across site point here; stub damages credibility |
| P0 | **Public header (mobile)** | Navigation failure on all marketing pages |
| P1 | **Collaboration Models** | Tier C orphan; duplicates Home without polish |
| P1 | **Forgot / Reset Password** | Auth family visual break |
| P1 | **Site footer + legal** | Missing on primary flush routes |
| P2 | **Workflow quick links** | Off-brand; exposes admin URLs |
| P2 | **Find (marketing layer)** | Clarify marketplace vs marketing boundary |
| P3 | **Home** | Elevate to reference-product polish, add social proof |
| P3 | **Knowledge Base** | Accordion FAQ, search, support CTA |

### Net-new pages to design (missing today)

| Page | Business need |
|------|---------------|
| **Features** | Deep product marketing beyond Home sections |
| **Pricing** | Subscription/plan transparency (admin has `/admin/subscriptions`) |
| **About** | Company story, KSA focus, team/trust |
| **Contact** | Sales/support lead capture |

---

## Priority List (Implementation Sprint)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 1 | Unify marketing design system (tokens, components, motion) | Very high | High |
| 2 | Mobile navigation drawer | Very high | Medium |
| 3 | Complete Register + Wizard flows | Very high | High |
| 4 | Auth page family consistency (Login → Forgot → Reset) | High | Medium |
| 5 | Global marketing footer (legal, contact, social, RTL toggle) | High | Medium |
| 6 | Collaboration Models page — Tier A treatment | Medium | Medium |
| 7 | Social proof band on Home (logos, metrics, quote) | Medium | Medium |
| 8 | KB FAQ accordion + in-page search | Medium | Low–Medium |
| 9 | Features + Pricing + About + Contact pages | Medium | High |
| 10 | RTL/Arabic public shell | High (KSA) | High |
| 11 | Remove or clearly disable social login placeholders | Medium | Low |
| 12 | Workflow heading semantics + remove admin quick links | Low | Low |

---

## Quick Wins (Low effort, visible improvement)

1. **Add mobile nav menu** in `public-layout.tsx` (sheet/drawer with existing links).
2. **Show minimal footer** on flush routes — copyright, Privacy, Contact, language.
3. **Normalize brand string** to “PM-Twin” everywhere in public copy.
4. **Wire Collaboration Models** to existing `site-content.json` hero/cards or redirect to KB.
5. **Style Forgot/Reset** with `legacy-poc-login` split shell (marketing column reuse).
6. **Fix Workflow heading levels** — step titles as `<h3>`.
7. **Add `aria-selected` / `role="tab"`** to Find tabs.
8. **Hide or badge social login** as “Coming soon” visually, not just toast.
9. **Unify primary button** — pick DS v2 primary or legacy `#0369a1` and document marketing exception.
10. **Register Continue** — disable with honest “Coming soon” or link to demo login until full flow ships.

---

## Major Redesign Opportunities

1. **Marketing Design System (MDS)** — Parallel to PM DS v2: `PmMarketingHero`, `PmFeatureGrid`, `PmPricingTable`, `PmTestimonial`, `PmFaq`, `PmCtaBand` with shared motion and token bridge to brand colors (teal/coral/ink).

2. **Hero evolution** — Retain isometric BIM identity but refine toward Linear/Vercel restraint: lighter headline weights, more whitespace, optional product screenshot/video beside 3D scene.

3. **Conversion architecture** — Single primary CTA per viewport (`Start collaborating` / `Explore marketplace` hierarchy), secondary paths de-emphasized; add proof layer between hero and features.

4. **Content architecture** — Migrate `PocHtmlBlock` sections to typed React components for maintainability, i18n, and RTL.

5. **Find as growth surface** — Treat as “logged-out product preview” with blurred fields, sample counts, and progressive signup — not a separate visual tier.

6. **KSA localization** — Public `PmDirectionProvider` mirror, Arabic marketing pages, Hijri in any date copy, PDPL/privacy prominence.

7. **Motion system** — Apply DDS-005 patterns to marketing only: section fade-up, staggered cards, reduced-motion off switch.

---

## Before Redesign Recommendations

1. **Stakeholder sign-off on brand direction** — Evolve legacy isometric look vs clean screenshot-first (Stripe) vs dark premium (Linear).

2. **Define marketing IA** — Confirm required pages: Features, Pricing, About, Contact, Blog?, Careers?

3. **Funnel truth** — Do not point CTAs to Register/Wizard until flows complete; or ship MVP registration.

4. **Token strategy** — Document marketing token aliases mapping legacy `--pm-teal` etc. to DDS-002 layers — avoid third color system.

5. **RTL scope decision** — Full Arabic marketing mirror vs bilingual toggle for launch.

6. **Social proof sourcing** — Real customer logos/quotes or omit until available (no fake testimonials).

7. **Pricing model** — Align with `admin/subscriptions` seed before designing Pricing page.

8. **Freeze lift** — Update [PM-TWIN-UI-FREEZE.md](./PM-TWIN-UI-FREEZE.md) exception table when marketing migration begins.

9. **Accessibility gate** — Fix heading order and tabs before visual polish (cheaper now).

10. **Analytics hooks** — Plan CTA tracking points before redesign to measure uplift.

---

## Final Scores Summary

| Page | Visual | UX | Consistency | A11y | Conversion | Responsive | **Avg** |
|------|--------|-----|-------------|------|------------|------------|---------|
| Home `/` | 7 | 7 | 6 | 6 | 7 | 7 | **6.7** |
| Find `/find` | 6 | 7 | 6 | 5 | 6 | 6 | **6.0** |
| Workflow `/workflow` | 7 | 6 | 7 | 4 | 6 | 6 | **6.0** |
| Knowledge Base `/knowledge-base` | 6 | 6 | 6 | 5 | 5 | 6 | **5.7** |
| Collaboration Models | 4 | 5 | 3 | 6 | 4 | 5 | **4.5** |
| Collaboration Wizard | 3 | 4 | 2 | 5 | 3 | 5 | **3.7** |
| Login `/login` | 7 | 7 | 5 | 6 | 6 | 6 | **6.2** |
| Register `/register` | 5 | 3 | 3 | 5 | 2 | 5 | **3.8** |
| Forgot Password | 4 | 5 | 2 | 7 | 4 | 6 | **4.7** |
| Reset Password | 4 | 5 | 2 | 7 | 3 | 6 | **4.5** |
| **Set mean** | **5.3** | **5.5** | **4.6** | **5.6** | **4.6** | **5.8** | **5.1** |

### Dimension rollups

| Dimension | Marketing average | vs reference products (approx.) |
|-----------|-------------------|----------------------------------|
| Visual Design | 5.3 / 10 | Stripe ~9, current gap ~3.7 |
| UX | 5.5 / 10 | Blocked by incomplete flows |
| Consistency | 4.6 / 10 | Largest gap — three tiers |
| Accessibility | 5.6 / 10 | Below workspace certification scope |
| Conversion | 4.6 / 10 | No pricing/proof |
| Responsiveness | 5.8 / 10 | Mobile nav is critical blocker |

---

## Overall Marketing Readiness Score

### **5.1 / 10**

| Readiness gate | Status |
|----------------|--------|
| Cohesive premium visual language | ❌ Three tiers |
| Complete acquisition funnel | ❌ Register/Wizard stubs |
| Standard SaaS page coverage | ❌ Missing Features, Pricing, About, Contact |
| Mobile navigation | ❌ |
| KSA/RTL public support | ❌ |
| Trust / social proof | ❌ |
| DS v2 alignment path documented | ⚠️ Partial — workspace ready, marketing not |
| Strong hero / value communication | ✅ Home + Login marketing columns |
| Domain brand identity (construction/BIM) | ✅ Tier A pages |

**Verdict:** Marketing pages are **not ready for a premium public launch** without a dedicated redesign sprint. The legacy Tier A pages provide a **differentiated creative foundation** worth preserving and refining—not discarding—but they must be extended into a unified Marketing Design System, completed funnels, mobile navigation, and missing commercial pages before matching the reference product bar.

---

## Appendix: File Reference

| Area | Primary files |
|------|----------------|
| Page exports | `web/src/pages/public/marketing-pages.tsx`, `auth-pages.tsx` |
| Legacy implementations | `legacy-home-page.tsx`, `legacy-find-page.tsx`, `legacy-workflow-page.tsx`, `legacy-knowledge-base-page.tsx`, `legacy-login-page.tsx`, `legacy-register-page.tsx` |
| Layout | `web/src/components/layout/public-layout.tsx` |
| Styles | `web/src/styles/legacy-poc-*.css` (8 files) |
| Seed HTML | `POC/data/site-content.json` |
| Routes | `web/src/routes.tsx` lines 77–89 |

---

*This document is analysis-only. No code was modified during this sprint. Implementation recommendations await approval in a follow-up redesign sprint.*
