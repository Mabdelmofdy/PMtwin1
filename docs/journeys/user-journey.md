# PMTwin user journey

### What this page is

A **journey-style** view of the same lifecycle as [full-user-journey.md](../full-user-journey.md): what **you** do, what the **system** does, and how status changes.

### Why it matters

Use it for onboarding scripts, QA checklists, and support playbooks.

### What you can do here

- Walk onboarding → opportunity → match → deal → contract → execution.
- See **✅ / ⚠️ / ❌** markers for what is fully built vs partial vs missing.

### What happens next

After this, open workflow docs (for example [user-workflow.md](../workflow/user-workflow.md)) for step-by-step mechanics.

### Tips

- “System action” here means automatic behavior in the POC, not a human operator.

---

**Legend:** ✅ Implemented · ⚠️ Partial · ❌ Missing

---

## 1. Overview

### What this section covers

PMTwin’s main path:

**Opportunity → Match → Deal → Contract**

You publish an opportunity, receive **matches**, confirm with all parties, form a **deal**, then formalize a **contract** for execution.

---

## 2. Actors

### User (professional / consultant)

- ✅ Creates opportunities, applies where enabled, views matches, accepts or declines, joins deals and contracts.
- ✅ Maintains profile fields used in matching.
- ⚠️ Profile completeness is not strictly enforced on every publish path.

### Company

- ✅ Registers, logs in, creates opportunities as the owning organization.
- ✅ Participates in matching, deals, and contracts.
- ⚠️ Member invite / role management is not fully built.

### System

- ✅ Runs matching when an opportunity is **published**; creates match records; sends notifications.
- ✅ Writes audit entries for key actions.
- ⚠️ No scheduled jobs (reminders, auto-expiry, cleanup) in the POC.

---

## 3. Onboarding

### 3.1 Register

| | |
|--|--|
| **Your action** | Choose individual or company, complete the form, submit. |
| **System action** | Creates account with status **pending**; stores profile and documents when provided. |
| **Status** | `(new) → pending` |
| **Implementation** | ✅ Core flows · ⚠️ OTP / document depth varies · ❌ production password security |

### What happens next

You wait for an admin decision unless your tenant auto-approves.

---

### 3.2 Approval (admin)

| | |
|--|--|
| **Your action** | Wait, or resubmit if asked for clarification. |
| **System action** | Admin updates status; notification is sent. |
| **Status** | `pending → active` or `rejected` or `clarification_requested` |
| **Implementation** | ✅ |

### What happens next

When **active**, you can use the full portal (subject to role).

---

### 3.3 Login

| | |
|--|--|
| **Your action** | Enter email and password. |
| **System action** | Validates credentials, opens a session, applies route protection. |
| **Implementation** | ✅ session restore · ❌ production-grade token model |

### What happens next

You land on the **Dashboard**.

---

### 3.4 Profile completion

| | |
|--|--|
| **Your action** | Update skills, certifications, experience, sectors, links. |
| **System action** | Saves data used for discovery and matching. |
| **Implementation** | ✅ editing · ⚠️ gating before publish inconsistent |

### Tips

- Refresh profile after major career changes so matches stay relevant.

---

## 4. Opportunity journey

### 4.1 Create (draft)

| | |
|--|--|
| **Your action** | Fill title, intent, model, scope, value. |
| **System action** | Saves with status **draft**. |
| **Status** | `(new) → draft` |
| **Implementation** | ✅ |

### What happens next

Edit until you are ready to publish.

---

### 4.2 Edit

| | |
|--|--|
| **Your action** | Change fields any time while allowed. |
| **System action** | Updates stored opportunity. |
| **Implementation** | ✅ |

---

### 4.3 Publish

| | |
|--|--|
| **Your action** | Set status to **published** (Publish button). |
| **System action** | Saves status; runs matching; creates match rows; notifies people. |
| **Status** | `draft → published` |
| **Implementation** | ✅ · ⚠️ re-publish can duplicate similar matches if signatures shift |

### What happens next

Open **Matches** and watch **Notifications**.

---

### 4.4 Validation (core ideas)

- Skills and scope should be meaningful.
- Budget and exchange fields support value fit.
- Timeline and location improve ranking.

**Implementation:** ✅ baseline validation · ⚠️ strict quality gates not uniform

---

## 5. Matching journey

### 5.1 Trigger and routing

- Matching runs when you **publish**.
- Models include **one-way**, **two-way**, **consortium**, **circular**.
- Candidates above the score threshold become **match** records.

### 5.2–5.5 Model types

- **One-way:** need ↔ offer pairing. ✅  
- **Two-way:** barter; both directions must pass. ✅  
- **Consortium:** roles on a lead need. ✅  
- **Circular:** multi-party chain. ✅ · ⚠️ persistence scope can depend on publish context  

### 5.6 Notifications

- Participants receive in-app notifications when matches are created. ✅

---

## 6. Match interaction

### 6.1 View matches

| | |
|--|--|
| **Your action** | Open list/detail; filter by type when available. |
| **System action** | Loads matches relevant to you. |
| **Implementation** | ✅ |

---

### 6.2 Accept / decline

| | |
|--|--|
| **Your action** | Choose **Accept** or **Decline**. |
| **System action** | Updates participant row and aggregate match status. |
| **Implementation** | ✅ |

---

### 6.3 Confirm logic

- Any **decline** → aggregate **declined**.
- **All accept** → **confirmed** (deal-ready).

---

### 6.4 Status transitions

| Stage | Meaning |
|-------|---------|
| `pending` | Awaiting responses |
| `accepted` | Your side accepted |
| `confirmed` | Everyone accepted |
| `declined` | Someone declined |
| `expired` | Time-based (⚠️ enforcement partial) |

### What happens next

On **confirmed**, open or create the **deal** (see Deals).

---

## 7. Deal journey

### 7.1 Create deal

- From **confirmed** match, or from **accepted application** where supported.

**Implementation:** ✅ create and views · ⚠️ “Start deal” shortcut not identical on every screen

---

### 7.2 Negotiation

- Early deal statuses are for aligning scope, value, timeline.

**Implementation:** ✅ statuses · ⚠️ negotiation UX depth varies

---

### 7.3 Milestones

- Milestones live on the deal and move through the lifecycle.

**Implementation:** ✅ · ⚠️ approval rules not fully hardened

---

### 7.4 Deal status lifecycle

`negotiating → draft → review → signing → active → execution → delivery → completed → closed`

---

## 8. Contract journey

### 8.1 Create (at signing)

- Linked to deal via ids on both sides. ✅

### 8.2 Signing

- Parties sign; timestamps recorded. ⚠️ No full e-signature vendor integration.

### 8.3 Activation

- Target: all required signatures → contract **active**. ⚠️ enforcement can vary by path.

### What happens next

Execution milestones run under the active contract.

---

## 9. Execution and completion

### 9.1 Milestones

`pending → in_progress → submitted → approved / rejected` ✅

### 9.2 Delivery and completion

- Delivery phase, then **completed** / **closed** on the deal. ✅

### 9.3 Review

- Post-completion review possible. ⚠️ depth varies by UI.

---

## 10. Edge cases

| Topic | Outcome |
|-------|---------|
| No matches | Nothing wrong with publish—just no candidates | ✅ |
| Declined match | Aggregate declined | ✅ |
| Expired | Field exists; auto handling partial | ⚠️ |
| Consortium replacement | Candidate discovery exists; governance varies | ⚠️ |
| Circular | Implemented; persistence bounded by context | ⚠️ |

---

## 11. System triggers (quick table)

| You do | System does |
|--------|-------------|
| Register | Pending account |
| Admin approves | Active + notification |
| Publish opportunity | Matching + matches + notifications |
| Accept/decline | Updates match status |
| All accept | Confirmed |
| Create deal | Deal record |
| Deal enters signing | Contract created/linked |
| Sign | Signature state updates |
| Milestone moves | Status + timestamps |
| Complete deal | Terminal states + optional review |

---

## 12. Status tables

(Same meanings as [full-user-journey.md](../full-user-journey.md) — see sections 12.1–12.4 there for full tables.)

---

## Implementation notes

- ✅ Core journey works end-to-end in the POC.
- ⚠️ Governance automation is partial (expiry, strict gates, role slices).
- ❌ Server-side enforcement and production security are not part of this POC.
