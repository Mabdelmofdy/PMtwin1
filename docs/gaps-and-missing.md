# Gaps and missing

### What this page is

Audit-style list of **gaps**: security, backend, matching, UX, admin, and data—nothing invented.

### Why it matters

Stakeholders use it to see **risk** and **severity** in one place.

### What you can do here

- Triage by **severity** column.
- Cross-link to [implementation-status.md](implementation-status.md) for “what exists.”

### Step-by-step actions

1. Read **Security & auth** and **Backend & persistence** first.
2. Drill into matching or admin sections for your team.

### What happens next

Turn rows into tickets; owners estimate fix vs accept.

### Tips

- POC limits (local storage, no real email) are expected—call them out in client communications.

---

## 1. Security & auth

| Gap | Severity | Description |
|-----|----------|-------------|
| **Password storage** | High | Passwords are encoded (POC), not hashed. Not safe for production. |
| **Session persistence** | Medium | Session in sessionStorage only; no refresh token or server-side session. |
| **Login for non-active users** | Medium | POC may allow login for pending/suspended; production should block or show “pending approval” page. |
| **Social login** | Low | CONFIG.AUTH.SOCIAL_LOGIN_ENABLED: false; OAuth not implemented. |
| **Rate limiting / brute force** | Medium | No rate limiting on login or forgot-password. |
| **CSRF / XSS** | Medium | No explicit CSRF tokens; user-generated content should be sanitized. |

---

## 2. Backend & Persistence

| Gap | Severity | Description |
|-----|----------|-------------|
| **No backend server** | High | All data in localStorage; no API server, no DB. Cannot scale or multi-device. |
| **No real API** | High | api-service delegates to data-service; no REST/GraphQL for mobile or external clients. |
| **No server-side validation** | High | All validation is client-side; easy to bypass. |
| **No file storage** | Medium | Documents/attachments referenced by URL or path; no upload or blob storage. |
| **No email sending** | High | Forgot/reset password “sends” token but no actual email; notifications are in-app only. |
| **No scheduled jobs** | Medium | No cron/jobs for: post_match expiry, reminder notifications, cleanup. |

---

## 3. Matching Engine

| Gap | Severity | Description |
|-----|----------|-------------|
| **Duplicate post_matches** | Medium | Dedupe by _postMatchSignature; re-publishing or slight payload change can create duplicates. No “already matched these two opportunities” check. |
| **Circular only for publishing creator** | Low | persistPostMatches only persists circular cycles that include the publishing opportunity’s creator; other cycles are computed but not stored. |
| **Expiry not enforced** | Low | post_match.expiresAt stored; no job or filter to set status expired or hide expired. |
| **Legacy vs post_match duality** | Low | Two systems (pmtwin_matches vs pmtwin_post_matches); some UI or reports might still use legacy. |
| **Admin “Run matching” does not persist** | Low | Admin sees results in memory; only publish triggers persistPostMatches unless a separate “Save matches” is added. |
| **No matching history/versioning** | Low | No record of “matching run at T for opportunity O” for analytics. |

---

## 4. Deals & Contracts

| Gap | Severity | Description |
|-----|----------|-------------|
| **Deal from match** | Medium | “Start deal” from confirmed match: flow may exist but not clearly wired (createDeal with post_match payload). |
| **Contract “all signed” automation** | Medium | When all parties have signedAt, contract status and deal status should auto-update to active; may be done in UI only or partially. |
| **Document signing** | High | No e-signature integration; signedAt is a timestamp only. |
| **Milestone approval workflow** | Medium | Milestone submit/approve stored; notifications or strict workflow (e.g. only creator can approve) may be partial. |
| **Deal/contract versioning** | Low | No version history for deal or contract amendments. |

---

## 5. Notifications & Comms

| Gap | Severity | Description |
|-----|----------|-------------|
| **No push/email** | High | Notifications only in-app; no email or push. |
| **Mark read** | Low | Notification read flag may not be toggled in all flows. |
| **Messages** | Medium | messages page and storage exist; full threading, attachments, and real-time may be partial. |
| **Connections** | Medium | connections storage; connection request/accept flow may be partial. |

---

## 6. Admin

| Gap | Severity | Description |
|-----|----------|-------------|
| **Moderator vs Admin** | Medium | Both can access same admin routes; fine-grained permission (e.g. hide settings from moderator) may be incomplete. |
| **Auditor read-only** | Medium | No enforcement that auditor cannot edit; role check only. |
| **Bulk actions** | Low | No bulk approve/reject/suspend or bulk export (BRD future). |
| **Content moderation queue** | Low | No “flagged” queue or assignment to moderators. |
| **Run matching and persist** | Low | Admin run shows results; optional “Save these matches” not implemented. |

---

## 7. Company & Profiles

| Gap | Severity | Description |
|-----|----------|-------------|
| **Company members** | Medium | No invite member, assign company role (owner/admin/member). |
| **Profile completeness** | Low | profile-completion utility exists; enforcement (e.g. block publish until complete) may be partial. |
| **Verification workflow** | Medium | Verification status stored; no clear “submit for verification” or admin verification flow. |

---

## 8. Applications

| Gap | Severity | Description |
|-----|----------|-------------|
| **Application sub-entities UI** | Low | application_requirements, application_deliverables, application_files, application_payment_terms have storage and demo data; full create/edit in UI may be partial. |
| **Application → deal** | Medium | Creating a deal from an accepted application: path exists (applicationId on deal); UI flow may be incomplete. |

---

## 9. Data & Integrity

| Gap | Severity | Description |
|-----|----------|-------------|
| **No referential integrity** | Medium | Deleting a user/opportunity does not cascade or soft-delete related matches/deals; can leave orphaned refs. |
| **No backup/export** | Medium | No user-triggered export or backup of localStorage. |
| **Seed overwrite** | Low | Re-seed on version change clears data; no “merge only” option for production. |
| **Pagination** | Low | Lists (users, opportunities, matches) may load all; no server-side pagination. |

---

## 10. UX & Edge Cases

| Gap | Severity | Description |
|-----|----------|-------------|
| **Offline** | Low | No offline support or service worker. |
| **Loading/error states** | Low | Some pages may not show loading or consistent error messages. |
| **Empty states** | Low | Empty lists may not have clear “no matches yet” / “create first opportunity” messaging. |
| **Clarification requested** | Low | status clarification_requested exists; resubmit flow for user may be unclear. |

---

## 11. Broken or Weak Flows (Summary)

1. **Forgot password:** Token created but no real email; user cannot reset without manual link/token.
2. **Deal from match:** Create deal from confirmed post_match may not be one-click from match detail.
3. **Contract signing:** All-parties-signed → active may be manual or only in one place.
4. **Company login vs user login:** Same form; company and user can have same email in different tables — which one wins on login is implementation-dependent (getUserOrCompanyByEmail order).
5. **Re-publish:** Editing and re-publishing an opportunity runs persistPostMatches again; can create duplicate-looking post_matches if signature differs slightly.
6. **Expired matches:** No automatic status update or filter; expired matches may still show as pending.

---

## Related Documentation

- [Implementation Status](implementation-status.md) — Per-module ✅/⚠️/❌.
- [Scenarios](scenarios.md) — Success and failure scenarios.
- [Admin Portal](admin-portal.md) — Admin capabilities.
