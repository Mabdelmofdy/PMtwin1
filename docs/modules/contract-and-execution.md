# Contract and execution

### What this page is

Module guide: **after acceptance**—contracts, milestones, execution, and closing work.

### Why it matters

This is where promises turn into delivered outcomes.

### What you can do here

- Follow contract creation triggers.
- See milestone and completion patterns.

### Step-by-step actions

1. Read **Overview** and actors.
2. Cross-check [contract-workflow.md](../workflow/contract-workflow.md) and [deal-workflow.md](../workflow/deal-workflow.md).

### What happens next

Completed deals may feed reviews and future matching reputation.

### Tips

- “Automatic contract on application accept” must match your branch—confirm in feature code.

---

## Overview

The Contract and Execution module manages the post-acceptance lifecycle of an opportunity. When an application is accepted, the system automatically creates a contract record linking the opportunity creator and the accepted applicant. The module then provides tools for starting execution, managing milestones, confirming completion, and closing the opportunity. This module bridges the gap between agreement and delivery.

## Actors

| Actor             | Description |
|-------------------|-------------|
| Opportunity Owner | The user who created the opportunity. Controls execution start, milestone management, completion confirmation, and opportunity closure. |
| Contractor        | The applicant whose application was accepted. Participates in the contracted engagement. |
| System            | Automatically creates the contract on application acceptance. Manages status transitions, milestone tracking, and UI rendering. |

## Table of Contents

- [Step 1 – Contract Auto-Creation (System-Triggered)](#step-1-contract-auto-creation-system-triggered)
- [Step 2 – Contract View](#step-2-contract-view)
- [Step 3 – Start Execution](#step-3-start-execution)
- [Step 4 – Milestone Management](#step-4-milestone-management)
- [Step 5 – Confirm Completion](#step-5-confirm-completion)
- [Step 6 – Close Opportunity](#step-6-close-opportunity)
- [Contract Data Model](#contract-data-model)
- [State Changes](#state-changes)
- [Error and Edge Cases](#error-and-edge-cases)
- [Audit Log Entries](#audit-log-entries)
- [Notifications](#notifications)
- [Output Data](#output-data)

---

## Step-by-Step Flow

<a id="step-1-contract-auto-creation-system-triggered"></a>
### Step 1 -- Contract Auto-Creation (System-Triggered)

**Primary Question**
N/A -- this step is fully automated. No user interaction occurs.

**Why This Question Exists**
When the opportunity owner accepts an application, the system must formalize the engagement by creating a contract record that captures the parties, scope, and payment terms.

**User Inputs**
None.

**Dropdown Values**
None.

**Conditional Logic**
- Contract creation is triggered exclusively by the `updateApplicationStatus(applicationId, 'accepted')` action.
- Only one application can be accepted per opportunity (acceptance changes the opportunity status to `contracted`).

**Validation Rules**
None (system-initiated).

**System Actions**
1. Application status updated to `accepted`.
2. System creates a contract record via `dataService.createContract()`:

| Field           | Type   | Value                                                          |
|-----------------|--------|----------------------------------------------------------------|
| id              | string | Auto-generated                                                 |
| opportunityId   | string | ID of the opportunity                                          |
| applicationId   | string | ID of the accepted application                                 |
| creatorId       | string | ID of the opportunity creator                                  |
| contractorId    | string | ID of the applicant (accepted user)                            |
| scope           | string | Opportunity title                                              |
| paymentMode     | string | Opportunity exchange mode (or first payment mode, default: `cash`) |
| duration        | string | Empty string (to be defined during execution)                  |
| status          | string | `pending`                                                      |
| milestones      | array  | Empty array `[]`                                               |
| signedAt        | string | Not set at creation                                            |
| createdAt       | string | ISO timestamp                                                  |
| updatedAt       | string | ISO timestamp                                                  |

3. Opportunity status updated to `contracted`.
4. Notification sent to applicant:
   - `type`: `application_status_changed`
   - `title`: "Application Status Updated"
   - `message`: "Your application for '[opportunity title]' has been accepted"

---

<a id="step-2-contract-view"></a>
### Step 2 -- Contract View

**Primary Question**
N/A -- this is a display step.

**Why This Question Exists**
Both the opportunity owner and contractor need to view the contract details, including parties, scope, payment terms, and current milestone status.

**User Inputs**
None.

**Displayed Information**
The contract section is shown on the opportunity detail page when the opportunity status is `contracted`, `in_execution`, or `completed`.

| Field                | Description                                              |
|----------------------|----------------------------------------------------------|
| Parties              | Creator name/email (creator) and Contractor name/email (contractor) |
| Scope                | Contract scope (defaults to opportunity title)           |
| Payment              | Payment mode / exchange mode                             |
| Duration             | Contract duration (if specified)                         |
| Milestones           | List of milestones with title, due date, and status      |

**Conditional Logic**
- The contract section is hidden if no contract record exists for the opportunity.
- If no contract is found but the opportunity status implies one should exist, the message "No contract record found." is shown.

**Validation Rules**
None.

**System Actions**
- Load contract by opportunity ID via `dataService.getContractByOpportunityId(opportunityId)`.
- Load creator and contractor user records for display names.
- Render contract summary and milestones.

Users can also open **Contracts** from the portal sidebar to see all contracts where they are creator or contractor, with filters by status and role. From that list, "View opportunity" navigates to the related opportunity detail page where the full contract section and workflow are available.

---

<a id="step-3-start-execution"></a>
### Step 3 -- Start Execution

**Primary Question**
"Ready to begin execution?"

**Why This Question Exists**
The transition from `contracted` to `in_execution` is an explicit action by the opportunity owner, signaling that work has formally begun. This separates the agreement phase from the active delivery phase.

**User Inputs**

| Field | Type   | Required | Notes                        |
|-------|--------|----------|------------------------------|
| N/A   | button | Yes      | "Start execution" button     |

**Dropdown Values**
None.

**Conditional Logic**
- The "Start execution" button is shown only when:
  - Opportunity status is `contracted`
  - Current user is the opportunity owner

**Validation Rules**
None.

**System Actions**
1. Update opportunity status from `contracted` to `in_execution` via `dataService.updateOpportunity()`.
2. Update contract status from `pending` to `active` via `dataService.updateContract()`.
3. Reload the opportunity detail page to reflect the new state.

---

<a id="step-4-milestone-management"></a>
### Step 4 -- Milestone Management

**Primary Question**
"What milestones need to be tracked for this engagement?"

**Why This Question Exists**
Milestones provide structured progress tracking for the contracted work. They enable both parties to monitor deliverables and timelines.

#### Step 4a -- Add Milestone

**User Inputs**

| Field    | Type   | Required | Notes                                |
|----------|--------|----------|--------------------------------------|
| title    | text   | Yes      | Entered via browser prompt dialog    |
| dueDate  | text   | No       | Format: YYYY-MM-DD, entered via prompt |

**Conditional Logic**
- The "Add milestone" button is shown only when:
  - Opportunity status is `in_execution`

**Validation Rules**
- `title` -- Required. If empty (user cancels prompt), the action is aborted.

**System Actions**
1. Create a new milestone object:
   ```
   {
     id:          "m" + Date.now(),
     title:       string,
     dueDate:     string (YYYY-MM-DD or empty),
     status:      "pending"
   }
   ```
2. Append to the contract's `milestones` array.
3. Update contract via `dataService.updateContract()`.
4. Re-render the contract section.

#### Step 4b -- Mark Milestone Complete

**User Inputs**

| Field | Type   | Required | Notes                            |
|-------|--------|----------|----------------------------------|
| N/A   | button | Yes      | "Mark complete" button per milestone |

**Conditional Logic**
- The "Mark complete" button is shown only for milestones where:
  - `milestone.status !== 'completed'`
  - Opportunity status is `in_execution`

**Validation Rules**
None.

**System Actions**
1. Update the milestone at the specified index:
   - `status`: `completed`
   - `completedAt`: current ISO timestamp
2. Update contract via `dataService.updateContract()`.
3. Re-render the contract section.

---

<a id="step-5-confirm-completion"></a>
### Step 5 -- Confirm Completion

**Primary Question**
"All milestones are complete. Confirm that the engagement is finished?"

**Why This Question Exists**
Even when all milestones are marked as complete, the owner must explicitly confirm that the overall engagement is satisfactorily completed. This prevents premature closure.

**User Inputs**

| Field | Type   | Required | Notes                          |
|-------|--------|----------|--------------------------------|
| N/A   | button | Yes      | "Confirm completion" button    |

**Conditional Logic**
- The "Confirm completion" button is shown only when:
  - Opportunity status is `in_execution`
  - ALL milestones have `status: 'completed'` (i.e., `milestones.length > 0 && milestones.every(m => m.status === 'completed')`)
  - Current user is the opportunity owner

**Validation Rules**
- At least one milestone must exist and all must be completed.

**System Actions**
1. Update opportunity status from `in_execution` to `completed`.
2. Reload the opportunity detail page.

---

<a id="step-6-close-opportunity"></a>
### Step 6 -- Close Opportunity

**Primary Question**
"Close this opportunity?"

**Why This Question Exists**
Closing is the final state transition, indicating the engagement is fully concluded. This is a separate action from completion to allow for post-completion activities (e.g., feedback, final payments).

**User Inputs**

| Field | Type   | Required | Notes                        |
|-------|--------|----------|------------------------------|
| N/A   | button | Yes      | "Close opportunity" button   |

**Conditional Logic**
- The "Close opportunity" button is shown only when:
  - Opportunity status is `completed`
  - Current user is the opportunity owner

**Validation Rules**
None.

**System Actions**
1. Update opportunity status from `completed` to `closed`.
2. Reload the opportunity detail page.

---

<a id="contract-data-model"></a>
## Contract Data Model

```
{
  id:              string (generated),
  opportunityId:   string,
  applicationId:   string,
  creatorId:       string,
  contractorId:    string,
  scope:           string,
  paymentMode:     string,
  duration:        string,
  status:          "pending" | "active" | "completed" | "terminated",
  milestones: [
    {
      id:          string,
      title:       string,
      dueDate:     string (YYYY-MM-DD or empty),
      status:      "pending" | "completed",
      completedAt: string (ISO timestamp, set when completed)
    }
  ],
  signedAt:        string | null,
  createdAt:       string (ISO timestamp),
  updatedAt:       string (ISO timestamp)
}
```

---

<a id="state-changes"></a>
## State Changes

### Contract Status Transitions

| From       | To          | Trigger                         |
|------------|-------------|---------------------------------|
| (new)      | `pending`   | Application accepted            |
| `pending`  | `active`    | Owner clicks "Start execution"  |
| `active`   | `completed` | All milestones done (implicit via opportunity status) |
| `active`   | `terminated`| Contract terminated early       |

### Opportunity Status Transitions (Contract-Related)

| From             | To              | Trigger                                            |
|------------------|-----------------|----------------------------------------------------|
| `in_negotiation` | `contracted`    | Application accepted; contract created              |
| `contracted`     | `in_execution`  | Owner clicks "Start execution"                     |
| `in_execution`   | `completed`     | Owner confirms completion (all milestones done)    |
| `completed`      | `closed`        | Owner clicks "Close opportunity"                   |

### Milestone Status Transitions

| From      | To          | Trigger                       |
|-----------|-------------|-------------------------------|
| `pending` | `completed` | Owner clicks "Mark complete"  |

---

<a id="error-and-edge-cases"></a>
## Error and Edge Cases

| Scenario                                            | Behavior                                                    |
|-----------------------------------------------------|-------------------------------------------------------------|
| No contract found for opportunity                   | "No contract record found." displayed in contract section   |
| Contract section shown for wrong status             | Section hidden unless status is `contracted`, `in_execution`, or `completed` |
| No milestones exist                                 | "No milestones yet." with "Add milestone" button            |
| Milestone title empty (user cancels prompt)         | Add milestone action aborted silently                       |
| Not all milestones completed                        | "Confirm completion" button not shown                       |
| Zero milestones exist                               | "Confirm completion" button not shown (requires at least one completed milestone) |
| Non-owner tries to manage contract                  | Action buttons not rendered for non-owners                  |
| Contract signing ceremony                           | **SCHEMA GAP DETECTED** -- No digital signature flow is implemented. The `signedAt` field exists in the data model but is not set through any UI flow. |
| Payment processing                                  | **SCHEMA GAP DETECTED** -- No actual payment integration exists. Payment mode is recorded but no payment transactions are processed. |
| Dispute resolution during execution                 | **SCHEMA GAP DETECTED** -- No dispute resolution process is implemented beyond the dispute resolution field selection in opportunity creation. |
| Contract termination                                | **SCHEMA GAP DETECTED** -- The `terminated` status exists in the contract status enum but no UI flow or action triggers it. |
| Feedback / rating after completion                  | **SCHEMA GAP DETECTED** -- No feedback or rating system is implemented post-completion. |
| Multiple application acceptance                     | Not possible -- accepting one application changes opportunity to `contracted`, preventing further acceptances. |

---

<a id="audit-log-entries"></a>
## Audit Log Entries

| Action                      | Trigger                              |
|-----------------------------|--------------------------------------|
| `opportunity_deleted`       | Owner deletes the opportunity        |

Note: Contract-specific audit log entries for milestone updates, execution start, and completion are **SCHEMA GAP DETECTED** -- not explicitly implemented in the current codebase. Status changes are persisted but not individually audited.

---

<a id="notifications"></a>
## Notifications

| Trigger                        | Recipient  | Type                          | Message                                                    |
|--------------------------------|------------|-------------------------------|------------------------------------------------------------|
| Application accepted           | Applicant  | `application_status_changed`  | "Your application for '[title]' has been accepted"         |
| Application rejected           | Applicant  | `application_status_changed`  | "Your application for '[title]' has been rejected"         |

Note: Notifications for execution start, milestone completion, and opportunity completion are **SCHEMA GAP DETECTED** -- not explicitly implemented in the current codebase.

---

<a id="output-data"></a>
## Output Data

### Contract Object (final state after full lifecycle)
```
{
  id:              "contract_abc123",
  opportunityId:   "opp_xyz789",
  applicationId:   "app_def456",
  creatorId:       "user_001",
  contractorId:    "user_002",
  scope:           "Structural Engineering Consultation",
  paymentMode:     "cash",
  duration:        "",
  status:          "completed",
  milestones: [
    {
      id:          "m1707000000000",
      title:       "Initial Assessment",
      dueDate:     "2026-03-15",
      status:      "completed",
      completedAt: "2026-03-14T10:30:00.000Z"
    },
    {
      id:          "m1707000100000",
      title:       "Final Delivery",
      dueDate:     "2026-04-30",
      status:      "completed",
      completedAt: "2026-04-28T16:45:00.000Z"
    }
  ],
  signedAt:        null,
  createdAt:       "2026-02-01T08:00:00.000Z",
  updatedAt:       "2026-04-28T16:45:00.000Z"
}
```

### Opportunity Object (final state)
```
{
  id:     "opp_xyz789",
  status: "closed",
  ...
}
```
