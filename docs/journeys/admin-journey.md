# Admin portal journey

### What this page is

Operator-focused walkthrough of **admin** tasks: roles, dashboard, vetting, moderation, matching, reports, and known gaps.

### Why it matters

It complements [admin-portal.md](../admin-portal.md) (route map) with **what to click** and **what to expect**.

### What you can do here

- Onboard a new moderator with section 2–6 first.
- Use status markers (✅ / ⚠️ / ❌) to set expectations.

### Step-by-step actions

1. Read **Overview** and **Admin roles**.
2. Jump to the task you perform (vetting, opportunities, matching, and so on).

### What happens next

After vetting, users follow [user-journey.md](user-journey.md) on the main portal.

### Tips

- Auditor access is intended to be read-heavy; verify UI before granting in production.

---

## 1. Overview

The admin portal governs trust, quality, and operational control across PMTwin.

- Admin functions cover vetting, moderation, matching oversight, reporting, settings, and audit visibility.
- This document reflects the current POC implementation and explicitly marks partial/missing controls.

Status markers:

- ✅ Implemented
- ⚠️ Partial
- ❌ Missing

---

## 2. Admin Roles

| Role | Primary Scope | Current State |
|---|---|---|
| `admin` | Full platform administration | ✅ |
| `moderator` | User/content operations, limited governance | ⚠️ |
| `auditor` | Audit/report visibility | ⚠️ |

Notes:

- ✅ Roles exist in config and route protection.
- ⚠️ Fine-grained role-based UI/action separation is not consistently enforced everywhere.

---

## 3. Dashboard

Admin dashboard focuses on operating signals:

- Total users and pending approvals
- Opportunity/application activity counts
- Recent actions/activity snippets
- Quick navigation to vetting, opportunities, matching, reports

Implementation:

- ✅ Dashboard page and data loading exist.
- ⚠️ Metric depth and trend analytics are limited in POC.

---

## 4. User Management (Vetting)

## 4.1 Primary Actions

- Approve
- Reject
- Suspend
- Reactivate
- Clarification requested (where surfaced)

## 4.2 Status Changes

| From | To | Trigger |
|---|---|---|
| `pending` | `active` | approve |
| `pending` | `rejected` | reject |
| `active` | `suspended` | suspend |
| `suspended` | `active` | reactivate |
| `pending` | `clarification_requested` | request clarification |

## 4.3 Notifications and Audit

- ✅ Account decision notifications are generated.
- ✅ Audit entries are created for core status actions.

Implementation summary:

- ✅ Vetting and status controls implemented.
- ⚠️ Clarification resubmission UX consistency varies by path.

---

## 5. Opportunity Moderation

Admin can:

- View all opportunities
- Filter by status/model
- Open detail context
- Close opportunity
- Delete opportunity

Important behavior:

- Publish drives matching trigger.
- Editing/moderating opportunity data does not guarantee automatic re-matching unless status update path triggers publish behavior.

Implementation:

- ✅ List/filter/actions implemented.
- ⚠️ Referential cleanup after delete is not fully enforced (orphan reference risk).

---

## 6. Matching (Admin)

Admin matching flow:

1. Select a published opportunity.
2. Run matching to preview scored results by model.
3. Inspect score breakdown and suggested participants.

Critical limitation:

- ⚠️ Admin run is preview/in-memory oriented.
- ❌ By default, admin run does **not** persist new `post_matches`.
- ✅ Persistent `post_match` creation is tied to opportunity publish trigger flow.

---

## 7. Deals Management

Admin can:

- View deals list
- Filter by status and match type
- Open deal detail context
- Track progression across lifecycle stages

Deal lifecycle observed:

`negotiating -> draft -> review -> signing -> active -> execution -> delivery -> completed -> closed`

Implementation:

- ✅ Deal visibility/tracking implemented.
- ⚠️ Advanced governance actions and policy enforcement depth vary.

---

## 8. Contracts Management

Admin can:

- View contract records
- Filter by contract status
- Open contract detail and linked deal/opportunity context

Contract lifecycle:

`pending -> active -> completed / terminated`

Implementation:

- ✅ Contract records and views implemented.
- ⚠️ Signature automation/legal e-signature integration is limited in POC.

---

## 9. Consortium Management

Admin consortium area supports:

- Viewing consortium-related collaboration contexts
- Replacement candidate discovery for missing/dropped role participants
- Controlled replacement attempts based on configured stage/attempt rules

Implementation:

- ✅ Replacement candidate matching logic exists.
- ⚠️ End-to-end enforcement of max-attempt and stage restrictions can be partially flow-dependent.

---

## 10. Reports

Available report themes include:

- Offers/applications by opportunity
- Site/location-based summaries
- Operational visibility for activity and quality

Implementation:

- ✅ Reporting surfaces exist.
- ⚠️ Deep historical analytics and backend-powered BI reporting are not implemented.

---

## 11. Settings

Admin settings include configurable system behavior such as:

- Matching thresholds
- Notification/session settings (where exposed)
- General system configuration entries

Implementation:

- ✅ Settings storage and update surfaces exist.
- ⚠️ Changes remain local/POC scoped without backend policy governance.

---

## 12. Audit

Audit capabilities:

- View log entries
- Filter by actor/action/entity/date
- Inspect timeline of key platform operations

Implementation:

- ✅ Audit log list and retrieval exist.
- ⚠️ Advanced compliance features (immutable audit chain, external SIEM export) are missing.

---

## 13. Limitations

Current known limitations for admin operations:

- ❌ No backend authority layer; POC is localStorage-based.
- ❌ Admin matching run does not persist matches by default.
- ⚠️ Moderator/auditor permission slicing is partially enforced.
- ❌ Bulk governance operations (bulk approve/reject/export) are not fully implemented.
- ❌ Full moderation queue/case management is not implemented.
- ⚠️ Referential integrity/cascade controls are partial.

---

## Operational Summary

- ✅ Core admin portal functions are available and usable for POC governance.
- ⚠️ Some enforcement depth is UI-path dependent.
- ❌ Production-grade governance architecture requires backend, policy enforcement, and stronger security/compliance layers.
