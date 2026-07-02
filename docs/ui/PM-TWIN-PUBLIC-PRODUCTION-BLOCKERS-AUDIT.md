# PM-Twin Public Production Blockers Audit

| Field | Value |
|---|---|
| Sprint | P4 Public Production Blockers Audit (analysis-only) |
| Date | 2 July 2026 |
| Scope | `web/` public marketing/auth routes and supporting config |
| Authority chain | Marketing audit -> P0 -> Modern Experience -> P2 -> P3 |
| Implementation | **No product code changes in this audit** |

---

## Executive Summary

PM-Twin public marketing is **ready for internal demo and stakeholder review**, but still **not ready for full public launch**. The current public experience is honest and safer than earlier phases, yet core production gates remain open:

1. **No real registration** path (preview-only flow)
2. **No live contact channel** (sales email/form not configured)
3. **Legal pages are draft placeholders** (not counsel-approved)
4. **Arabic content not ready** (RTL smoke only)
5. **No launch analytics instrumentation** for funnel measurement
6. **Demo credentials expose passwords in UI** (high risk for public internet exposure)

Launch recommendation:
- Internal demo: **Go**
- Stakeholder review: **Go**
- Limited private beta: **Conditional Go** (after P0 blockers)
- Full public launch: **No-Go** until P0 blockers close

---

## Current Launch Status

| Gate | Decision | Reason |
|---|---|---|
| Internal demo | Go | Preview flows are intentional and transparent |
| Stakeholder review | Go | Commercial pages + wizard + legal drafts are coherent |
| Limited private beta | Conditional Go | Requires registration/contact/legal minimums first |
| Full public launch | No-Go | Missing production registration/contact/legal readiness |

---

## Blocker Table (P0/P1/P2)

| Severity | Blocker | Evidence | Launch impact |
|---|---|---|---|
| P0 | No real account creation | `auth-provider.tsx` exposes `login/signOut` only; no register API | Cannot onboard real users |
| P0 | Auth uses local/demo data only | `auth-service.ts` authenticates against `peopleApi` seed-like local data | Unsafe/inapplicable for internet launch |
| P0 | No contact channel configured | `PUBLIC_CONTACT.salesEmail = null` and contact page says coming soon | No conversion path for sales/demo inquiries |
| P0 | Legal pages are non-binding drafts | `/privacy` and `/terms` explicitly labeled draft/non-binding | Legal/compliance readiness not met |
| P1 | Demo credentials/passwords visible in UI | `demo-credentials-dialog.tsx` renders admin/workflow passwords | Security and abuse risk on public web |
| P1 | Arabic content not available | `public-i18n.ts` label map only, no translated route content | Bilingual launch not ready |
| P1 | No analytics funnel events | No public CTA tracking hooks found in public route components | Cannot measure launch funnel quality |
| P2 | Pricing lacks commercial definitions | Pricing page has indicative plan cards only, no approved packaging | Weak public conversion and sales qualification |
| P2 | Forgot/reset are preview stubs | `auth-pages.tsx` explicitly toasts non-connected behavior | Acceptable for review, not ideal for public trust |

---

## Route-by-Route Public Launch Readiness

Legend: `Ready` = production-safe; `Preview` = honest but not production-complete; `Draft` = legal/content draft.

| Route | Status | Notes |
|---|---|---|
| `/` | Preview-ready | Honest CTAs; points to registration preview and guided selector |
| `/features` | Preview-ready | Marketing-safe capability framing |
| `/pricing` | Preview-ready | No fake prices; still missing business-approved packaging |
| `/about` | Preview-ready | Credible high-level positioning |
| `/contact` | **Blocked** | No live channel; only placeholders + alternatives |
| `/find` | Preview-ready | Public browsing works; auth-gated deeper actions |
| `/workflow` | Preview-ready | Anonymous link sanitization in place |
| `/knowledge-base` | Preview-ready | FAQ accordion/search works; some seed text still legacy in tone |
| `/collaboration-models` | Preview-ready | Strong page with honest CTAs |
| `/collaboration-wizard` | Preview-ready | Rule-based and transparent (not AI) |
| `/login` | **Risky for public** | Demo credentials UX exposes passwords in dialog |
| `/register` | **Blocked** | Explicit preview only; no registration persistence |
| `/forgot-password` | Preview stub | Honest non-functional flow |
| `/reset-password` | Preview stub | Honest non-functional flow |
| `/privacy` | Draft | Requires legal approval and final text |
| `/terms` | Draft | Requires legal approval and final text |

---

## Registration Production Readiness Findings

### Already implemented
- Login session handling in browser storage (`localStorage`/`sessionStorage`)
- Account type selection on login (individual/company)
- Registration preview UX with accessible multi-step flow and honest messaging

### Local/demo-only
- Authentication checks against local in-app data (`peopleApi`)
- Password handling based on local `passwordHash` matching in client code
- Demo account path heavily optimized for preview access

### Missing backend/API and product gates
- Registration endpoint(s) for individual/company creation
- Server-side validation and duplicate checks
- Persistence in production datastore
- Email verification / ownership checks (if required)
- Registration approval/vetting pipeline integration (if business-required)
- Abuse/rate limiting/captcha protections
- Structured backend error model for user-safe feedback

### Unsafe to expose publicly
- Presenting registration as “open” before backend and validation exist
- Client-side-only credential authority for production accounts

---

## Contact Readiness Findings

### Current state
- Contact page is honest and non-fake
- `PUBLIC_CONTACT.salesEmail` is unset (`null`)
- No backend form endpoint or webhook integration exposed in public layer

### Safe production options (choose one)
1. Configure verified `mailto` sales inbox in `PUBLIC_CONTACT.salesEmail`
2. Wire backend contact endpoint with validation + abuse protection
3. Use approved third-party lead form (with legal/privacy review)
4. CRM webhook integration behind secure backend proxy

### Blocking gap
- No primary inbound lead channel currently exists

---

## Legal Readiness Findings

### Current state
- `/privacy` and `/terms` are explicitly marked draft placeholders
- Content is intentionally non-binding and high-level

### Minimum legal set required before full launch
1. Final Privacy Policy (counsel-reviewed)
2. Final Terms of Use (counsel-reviewed)
3. Legal entity and contact details (operator identity)
4. Cookie notice/policy if tracking cookies or third-party analytics are enabled
5. PDPL-aligned notices and lawful basis language where required

### Claims requiring counsel review
- Any references to PDPL alignment
- Data handling, retention, transfer, subprocessors
- Liability, warranty, jurisdiction/dispute terms

---

## Arabic / RTL Readiness Findings

### RTL technical readiness
- `PmDirectionProvider` is active
- `public-rtl.css` exists and provides smoke-level layout protections
- Header/footer/cards/auth/wizard have baseline RTL tolerance

### Arabic content readiness
- Not ready: route content is still English across public pages
- `public-i18n.ts` only provides a small future-label map

### Language toggle readiness
- Not functionally implemented (only “Arabic coming soon” style notice)
- No content switching architecture wired at page content level

### Conclusion
- RTL technical smoke: **partial pass**
- Arabic launch: **not ready**

---

## Pricing / Commercial Readiness Findings

### Current state
- No fake pricing (good)
- Pricing page uses Pilot/Team/Enterprise indicative framing

### Required business inputs for public production pricing
- Final plan names
- Plan target personas
- Included capabilities per plan
- Usage limits/thresholds
- Trial/pilot qualification policy
- Sales SLA expectations and contact ownership

### Risk
- Launch without concrete commercial definitions reduces conversion confidence

---

## CTA Audit Summary

### Overall
- CTA honesty has improved significantly
- No obvious fake success paths in public routes
- Admin/workspace exposure to anonymous users is mostly controlled

### Remaining CTA risks
- Login route still promotes demo credentials with visible passwords (public abuse risk)
- Register CTA correctly says preview, but this remains a hard launch blocker for self-serve onboarding
- Contact CTA has no live channel destination

---

## Analytics & Launch Measurement Readiness

### Current state
- No explicit public marketing event tracking hooks found in route components
- Domain-level analytics modules exist elsewhere, but not wired for public funnel events

### Recommended safe event set (future implementation)
- `public.hero_cta_click`
- `public.pricing_contact_click`
- `public.register_preview_start`
- `public.wizard_completed`
- `public.marketplace_explore_click`
- `public.demo_signin_intent`

### Note
- Add only after privacy/legal consent strategy is decided

---

## Security / Public Exposure Notes

High-priority findings:
1. Demo credential dialog exposes reusable passwords in clear text (`admin123`, shared workflow password)
2. Client-side auth authority model is not suitable for public internet deployment

Moderate findings:
1. Public copy includes preview/draft disclosures (good honesty, but indicates non-production state)
2. Some seed-driven marketing text remains legacy in style and may need final editorial pass

No critical evidence found of:
- Anonymous admin navigation in main public nav
- Exposed internal seed IDs on public pages

---

## Exact Recommended Implementation Order

1. **Registration backend readiness (P0)**
   - Define/register API contract
   - Implement persistence + validation + error model
   - Wire frontend register flow to real backend path
2. **Contact channel go-live (P0)**
   - Configure verified sales channel (email/endpoint/CRM)
   - Replace placeholders with real channel
3. **Legal finalization (P0)**
   - Counsel-approved Privacy + Terms
   - Add legal entity/contact details
   - Add cookie/consent layer if analytics enabled
4. **Security hardening for public auth UX (P1)**
   - Remove plaintext demo password exposure from public path
   - Gate demo credentials for internal/staging use
5. **Analytics instrumentation (P1)**
   - Add agreed funnel events
   - Validate event taxonomy and consent compliance
6. **Arabic launch tranche planning (P1/P2)**
   - Translation source of truth
   - Toggle behavior and locale routing/content strategy
7. **Commercial packaging finalization (P2)**
   - Final plan details and sales qualification copy

---

## Go / No-Go Recommendation

| Stage | Decision | Condition |
|---|---|---|
| Internal demo | **Go** | Current build is suitable |
| Stakeholder review | **Go** | Current build is suitable |
| Limited private beta | **Conditional Go** | Close registration/contact/legal P0 blockers first |
| Full public launch | **No-Go** | Requires P0 blockers resolved and validated |

---

## Command/Inspection Notes

- This audit used repository inspection (read/search) only.
- No runtime commands were required to establish blocker status.

