# Gap solutions

### What this page is

Fix plan and **implementation status** for gaps from [gaps-and-missing.md](gaps-and-missing.md).

### Status legend

| Status | Meaning |
|--------|---------|
| **Planned** | Documented; not implemented |
| **Done** | Shipped in POC |
| **Pre-existing** | Already worked before this sprint |

---

## Implementation summary (POC sprint)

| ID | Gap | Status |
|----|-----|--------|
| GAP-P01 | Pending read-only central guard | **Done** |
| GAP-P02 | Login account type (Individual / Company) | **Done** |
| GAP-P03 | Negotiation workflow doc | **Done** |
| GAP-P04 | Negotiation expiry on read | **Done** |
| GAP-P05 | Profile gate on publish | **Done** |
| GAP-P06 | Application action labels | **Done** |
| GAP-P07 | Match default expiresAt | **Pre-existing** |
| GAP-P08 | Start deal only when confirmed | **Pre-existing** |
| GAP-P09 | Mark notifications read on route | **Pre-existing** |
| GAP-P10 | Auditor read-only all admin writes | **Done** |
| GAP-P11 | Moderator vs admin UI capability audit | **Done** |
| GAP-P12 | Connection notifications | **Done** |

---

## Done — what was implemented

### GAP-P01 — Pending mutate guard

- `authService.assertCanMutate()` throws for `status === pending`.
- `dataService._assertPortalCanMutate()` on portal writes: opportunities, applications, matches, deals, negotiations, connections, messages, contract sign.

### GAP-P02 — Login account type

- Login page: **Individual / Company** radio.
- `authService.login(email, password, { accountType: 'individual' | 'company' })` looks up the correct store.

### GAP-P04 — Negotiation expiry

- `createNegotiation` sets default `expiresAt` (14 days from config).
- `expireStaleNegotiations()` runs on `getNegotiations()`.

### GAP-P05 — Profile gate on publish

- `profileCompletion.assertProfileReadyForPublish()` (≥ 70% + required fields).
- Called in `updateOpportunity` when status becomes `published`.
- Tests: `POC/tests/profile-completion-publish.test.js`.

### GAP-P06 — Application UX

- **Discuss terms** and **Accept & create deal** buttons with tooltips on opportunity detail.

### GAP-P12 — Connection notifications

- Notify on connection request, accept, reject.

---

## Pre-existing (no code change needed)

- **GAP-P07:** `createPostMatch` → `getDefaultPostMatchExpiresAt`.
- **GAP-P08:** `unified-match-view-model` exposes Start Deal only when `status === confirmed`.
- **GAP-P09:** `router.handleRoute` → `markNotificationsReadForRoute`.

---

## Still planned

_None from the POC sprint list — backend items remain in Priority 3 below._

---

## Done — P10 & P11 (this continuation)

### GAP-P10 — Auditor read-only on all admin writes

- `dataService._assertNotAuditorWrite()` on user/company/opportunity/plan/subscription mutators.
- `authService.assertNotReadOnlyAdmin()` on vetting approve/reject/clarification.
- Expanded `applyAuditorReadOnlyAdmin()` (vetting actions, bulk bar, skills/subscription write controls).

### GAP-P11 — Moderator vs admin UI capability audit

- Route guards: matching, deals, contracts, consortium, reports, audit use `hasAdminCapability`.
- Collaboration models: `admin.settings.write` (was admin role only — same effective access).
- Admin skills: write controls hidden when missing `admin.skills.write`.
- Subscriptions already gated by `canWrite`.

---

## Priority 3 — Production / backend (defer)

| ID | Gap | Direction |
|----|-----|-----------|
| GAP-B01 | No backend / real API | REST + fetch in api-service |
| GAP-B02 | Password hashing | Server-side bcrypt/argon2 |
| GAP-B03 | Email | SendGrid / transactional provider |
| GAP-B04 | E-signature | DocuSign adapter |
| GAP-B05 | Scheduled jobs | Cron for expiry sweeps |
| GAP-B06 | Company members | Invite + roles entity |

---

## Related documentation

- [Gaps and missing](gaps-and-missing.md)
- [Implementation status](implementation-status.md)
- [Negotiation workflow](workflow/negotiation-workflow.md)
