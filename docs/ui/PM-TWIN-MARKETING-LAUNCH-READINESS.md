# PM-Twin Marketing Launch Readiness

| Field | Value |
|-------|-------|
| Sprint | P3 Public Launch Completion |
| Date | 1 July 2026 |
| Scope | `web/` public marketing and auth presentation |
| Authority | [PM-TWIN-MARKETING-VISUAL-AUDIT.md](./PM-TWIN-MARKETING-VISUAL-AUDIT.md) |

---

## Launch decision

| Gate | Status |
|------|--------|
| **Internal demo** | **Ready** — demo login, marketplace browse, guided wizard, registration preview |
| **Stakeholder review** | **Ready** — commercial pages, legal drafts, honest CTAs, cohesive marketing system |
| **Full public launch** | **Not ready** — see remaining blockers below |

**Overall public launch readiness score: 7.4 / 10** (up from ~5.1 at initial audit)

---

## Completed public routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | Complete | Motion, trust band, honest CTAs |
| `/features` | Complete | Capability overview |
| `/pricing` | Complete | No fabricated prices |
| `/about` | Complete | KSA/GCC positioning |
| `/contact` | Complete | Channel placeholders, no fake form |
| `/find` | Complete | Tab a11y, auth-gated detail links |
| `/workflow` | Complete | Anonymous link sanitization |
| `/knowledge-base` | Complete | FAQ accordion + client search |
| `/collaboration-models` | Complete | Premium redesign |
| `/collaboration-wizard` | Complete | Rule-based guided selector |
| `/login` | Complete | Demo accounts |
| `/register` | Preview | 3-step journey, no account creation |
| `/forgot-password` | Preview | Honest stub |
| `/reset-password` | Preview | Honest stub |
| `/privacy` | Draft | Non-binding principles |
| `/terms` | Draft | Non-binding preview terms |

---

## Register status

**Decision: Option B — Registration preview (polished, no fake submission)**

- No `register()` API exists in `auth-provider`; account creation is not implemented.
- `/register` now walks through three preview steps:
  1. Account type (accessible radio cards)
  2. Goal selection (publish / partner / explore)
  3. “Registration opening soon” with clear CTAs
- **No account is created.** No success toast implying signup.
- Exit paths: demo sign-in, marketplace, contact sales.

---

## Collaboration wizard status

**Decision: Option A — Transparent rule-based guided model selector**

- Implemented in `web/src/lib/collaboration-model-selector.ts`
- Three questions → scored recommendations across four models:
  - Cash Subcontracting
  - Service Exchange / Barter
  - Joint Venture
  - Resource Sharing
- Copy explicitly states **rule-based, not AI**
- Unit tests in `collaboration-model-selector.test.ts`

---

## Legal / content disclaimers

| Page | Disclaimer |
|------|------------|
| `/privacy` | “Draft policy — final legal review required” |
| `/terms` | “Draft terms — not binding until commercial launch” |
| Pricing | No subscription amounts published |
| Contact | No message submission until backend connected |
| Register | Preview only — no account creation |
| Trust band | Neutral principles only — no fake metrics |

Footer links to Privacy (draft) and Terms (draft) are live.

---

## Arabic / RTL status

| Item | Status |
|------|--------|
| `PmDirectionProvider` | Active app-wide |
| `public-i18n.ts` | Arabic label map prepared (not wired) |
| Footer notice | “العربية — coming soon” |
| `public-rtl.css` | Smoke fixes for header/footer/cards/auth/wizard |
| Full translation | **Not shipped** |

---

## CTA audit table

| Route | Primary CTAs | Expectation set correctly? |
|-------|--------------|----------------------------|
| `/` | Registration preview, Explore marketplace, Guided model selector | Yes |
| `/features` | Explore, Sign in demo | Yes |
| `/pricing` | Contact sales, Sign in demo, Registration preview | Yes |
| `/about` | Features, Pricing, Contact | Yes |
| `/contact` | Demo, Marketplace, Registration preview | Yes — no form submit |
| `/find` | Login / Registration preview (anonymous) | Yes |
| `/workflow` | Register preview path, marketplace (anonymous sanitized) | Yes |
| `/knowledge-base` | Wizard link in seed FAQ text | Partial — seed HTML unchanged |
| `/collaboration-models` | Marketplace, KB, wizard, auth-aware CTAs | Yes |
| `/collaboration-wizard` | Rule-based results + next steps | Yes — not AI |
| `/login` | Demo accounts, forgot password stub | Yes |
| `/register` | 3-step preview → demo/marketplace/contact | Yes |
| `/forgot-password` | Honest stub + back to login | Yes |
| `/reset-password` | Honest stub + back to login | Yes |
| `/privacy` | Contact sales | Yes |
| `/terms` | Privacy cross-link | Yes |

**Anonymous workspace/admin links:** Stripped from workflow step HTML via `sanitizeAnonymousPublicLinks` when not authenticated. Authenticated users retain workspace CTAs in workflow next-steps.

---

## Remaining blockers (full public launch)

1. **Real account registration** and vetting backend
2. **Contact form** with verified delivery channel
3. **Legal review** — binding Privacy Policy and Terms of Use
4. **Published pricing** when commercial terms are approved
5. **Full Arabic content** and functional language toggle
6. **Seed HTML cleanup** — some injected POC copy still references “AI wizard” / “Create account” in KB/models panels (display-normalized where parsed; raw panels unchanged)
7. **Real social proof** when approved customer logos/quotes exist

---

## Risks and assumptions

- Workflow/KB seed HTML is not modified (POC freeze); client-side sanitization and brand normalization mitigate but do not replace seed edits.
- Rule-based wizard scores are educational, not contractual recommendations.
- Legal pages are **draft placeholders** — counsel review required before production reliance.
- `PUBLIC_CONTACT.salesEmail` is `null` until a verified address is configured.

---

*Generated as part of P3 Public Launch Completion Sprint.*
