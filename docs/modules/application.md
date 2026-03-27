# Application

### What this page is

Module guide: **applications** to opportunities—wizard steps, scoring, pipeline, and what happens when an owner **accepts**.

### Why it matters

Applications are the manual path next to automatic **matching**; owners need a clear review flow.

### What you can do here

- Walk the six-step wizard outline.
- See actor roles and status transitions.

### Step-by-step actions

1. Read **Overview** and **Actors**.
2. Jump to the wizard step you are building or testing.

### What happens next

Accepted applications may create contracts per module rules—see **Contract and Execution** and [deal-workflow.md](../workflow/deal-workflow.md).

### Tips

- Automatic contract creation depends on implementation path—verify in code for your branch.

---

## Overview

The Application module enables authenticated users to apply for published opportunities and allows opportunity owners to review, manage, and act on received applications. The module implements a 6-step application wizard with conditional steps, a matching algorithm that scores candidate-opportunity compatibility, and a pipeline/kanban view for application management. Accepting an application triggers automatic contract creation (documented in the Contract and Execution module).

## Actors

| Actor             | Description |
|-------------------|-------------|
| Applicant         | An authenticated user (company or individual) who submits an application for an opportunity they did not create. |
| Opportunity Owner | The user who created the opportunity. Reviews applications and can accept, reject, or shortlist them. |
| System            | Manages application creation, status transitions, matching, notifications, and automatic contract creation on acceptance. |

## Table of Contents

- [Step 1 – Overview (Read-Only)](#step-1-overview-read-only)
- [Step 2 – Proposal](#step-2-proposal)
- [Step 3 – Detailed Responses (Conditional)](#step-3-detailed-responses-conditional)
- [Step 4 – Payment Preference](#step-4-payment-preference)
- [Step 5 – Task Bidding (Conditional)](#step-5-task-bidding-conditional)
- [Step 6 – Review and Submit](#step-6-review-and-submit)
- [Application Management (Owner View)](#application-management-owner-view)
- [Matching Algorithm](#matching-algorithm)
- [Pipeline / Kanban View](#pipeline-kanban-view)
- [State Changes](#state-changes)
- [Error and Edge Cases](#error-and-edge-cases)
- [Output Data](#output-data)

---

<a id="build-proposal-workflow"></a>
## Build proposal workflow

To build and submit a proposal (application), the user opens an opportunity (e.g. from the Opportunities list), then clicks **Apply** (or "Apply Now" on the opportunity detail page). This starts the application wizard. The user completes: **Proposal** (Step 2, required), optional **Requirements** (Step 3) if the opportunity has model-specific attributes, **Payment** preference (Step 4), optional **Bidding** (Step 5) for task-based opportunities, and **Review** (Step 6), then submits. The owner can then review, shortlist, accept, or reject the application. Accepting an application creates a contract (see Contract and Execution module).

---

## Step-by-Step Flow

### Pre-Conditions

- The opportunity must have status `published` or `in_negotiation`.
- The applicant must be authenticated.
- The applicant must not be the opportunity creator.
- If the applicant has already applied, the wizard opens in edit mode.

---

<a id="step-1-overview-read-only"></a>
### Step 1 -- Overview (Read-Only)

**Primary Question**
N/A -- this step displays the opportunity summary for the applicant's review before they begin their application.

**Why This Question Exists**
The applicant needs to review the full opportunity details (title, intent, model type, status, creator, location, exchange mode, description, model-specific details) before committing to an application.

**User Inputs**
None. This is a read-only summary.

**Displayed Information**
- Opportunity title
- Intent label (NEED or OFFER)
- Model type and sub-model
- Status
- Creation date
- Creator name/email
- Location
- Exchange mode
- Description
- Model-specific attribute details
- Exchange data (budget range, payment terms, etc.)

**Conditional Logic**
- If the user has already applied, an "Already Applied" section is shown with applied date and current status, plus an "Edit Application" button.
- If the user has not applied, an "Apply Now" button is shown.

**Validation Rules**
None.

**System Actions**
- Load opportunity data and creator information.
- Check if applicant has an existing application for this opportunity.
- Determine which wizard steps are needed (Steps 3 and 5 are conditional).
- Setup wizard navigation.

---

<a id="step-2-proposal"></a>
### Step 2 -- Proposal

**Primary Question**
"Describe your proposal for this opportunity."

**Why This Question Exists**
The proposal is the core of every application. It is the primary text the opportunity owner reads to evaluate the applicant's fit, approach, and qualifications.

**User Inputs**

| Field                | Type     | Required | Notes                              |
|----------------------|----------|----------|------------------------------------|
| application-proposal | textarea | Yes      | Free-form proposal text            |

**Dropdown Values**
None.

**Conditional Logic**
None -- this step is always shown.

**Validation Rules**
- `application-proposal` -- Required. Cannot be empty (after trim). Error: "Please provide a proposal".

**System Actions**
- Store proposal text in application state.
- Navigate to Step 3 (if detailed responses are needed) or Step 4.

---

<a id="step-3-detailed-responses-conditional"></a>
### Step 3 -- Detailed Responses (Conditional)

**Primary Question**
"Provide detailed responses to each requirement of this opportunity."

**Why This Question Exists**
For opportunities that have model-specific attributes, the applicant should address each requirement individually. This step dynamically generates a response field for every relevant attribute defined in the opportunity's sub-model.

**User Inputs**

For each model-specific attribute (excluding system fields like title, description, status, location, exchangeMode, exchangeData):

| Field                     | Type     | Required | Notes                              |
|---------------------------|----------|----------|------------------------------------|
| response-{attributeKey}   | textarea | No       | Response to a specific requirement |

Each response field displays:
- The attribute label
- The requirement value from the opportunity
- A textarea for the applicant's response

**Dropdown Values**
None.

**Conditional Logic**
- This entire step is **skipped** if the opportunity's sub-model has no relevant attributes (after filtering out system fields).
- When skipped, the wizard advances directly from Step 2 to Step 4.
- The step indicator for Step 3 is hidden when the step is skipped.

**Validation Rules**
- No mandatory validation on individual response fields (responses are optional per field).

**System Actions**
- Generate dynamic form fields based on the opportunity's model definition.
- Store responses keyed as `response_{attributeKey}`.
- Navigate to Step 4.

---

<a id="step-4-payment-preference"></a>
### Step 4 -- Payment Preference

**Primary Question**
"What is your preference regarding the payment/exchange terms?"

**Why This Question Exists**
The opportunity specifies exchange terms (exchange mode and amounts). The applicant needs to indicate whether they accept the terms as stated, prefer to discuss modifications, or have custom terms.

**User Inputs**

| Field                          | Type   | Required | Options                               |
|--------------------------------|--------|----------|---------------------------------------|
| application-payment-preference | select | Yes      | `accept` (Accept as stated), `discuss` (Prefer to discuss), `custom` |
| application-payment-comments   | textarea | No    | Additional comments about payment     |

**Displayed Information**
- The opportunity's exchange mode label (e.g., "Cash Payment", "Equity", "Profit Sharing", "Barter Exchange", "Hybrid").

**Dropdown Values**
Payment preference options are static:
- `accept` -- "Accept as stated"
- `discuss` -- "Prefer to discuss"
- `custom` -- Custom terms

**Conditional Logic**
None -- this step is always shown.

**Validation Rules**
- `application-payment-preference` -- Required. Error: "Please select your payment preference".

**System Actions**
- Store payment preference and comments in application responses.
- Navigate to Step 5 (if task bidding is needed) or Step 6.

---

<a id="step-5-task-bidding-conditional"></a>
### Step 5 -- Task Bidding (Conditional)

**Primary Question**
"Submit your bid for this task."

**Why This Question Exists**
For task-based engagement opportunities (`subModelType === 'task_based'`), applicants must provide a specific bid amount, proposed duration, and approach description. This enables competitive evaluation.

**User Inputs**

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| task-bid-amount    | number   | Yes      | Bid amount in SAR, min: 0          |
| task-bid-duration  | number   | No       | Proposed duration in days, min: 1  |
| task-bid-comments  | textarea | Yes      | Description of approach/methodology|

**Displayed Information**
- Task title (from opportunity attributes)
- Task scope (from opportunity attributes)
- Budget range (from opportunity exchange data)

**Conditional Logic**
- This entire step is **skipped** if the opportunity's sub-model is NOT `task_based`.
- When skipped, the wizard advances directly from Step 4 to Step 6.
- The step indicator for Step 5 is hidden when the step is skipped.
- When Step 5 is hidden, the Review step (Step 6) is renumbered to display as "Step 5" in the UI.

**Validation Rules**
- `task-bid-amount` -- Required. Error: "Please provide a bid amount".
- `task-bid-comments` -- Required. Error: "Please provide comments about your approach".

**System Actions**
- Store bid data (`taskBidAmount`, `taskBidDuration`, `taskBidComments`) in application responses.
- Navigate to Step 6.

---

<a id="step-6-review-and-submit"></a>
### Step 6 -- Review and Submit

**Primary Question**
"Review your application before submitting."

**Why This Question Exists**
A final review step allows the applicant to verify their proposal, responses, payment preference, and bid before submission.

**User Inputs**
None (read-only review).

**Displayed Sections**
1. **Proposal** -- Full text of the proposal.
2. **Detailed Responses** (if Step 3 was active) -- Each response with its label and value.
3. **Payment Preference** -- Selected preference label and any comments.
4. **Task Bidding** (if Step 5 was active) -- Bid amount, duration, and approach.

**Conditional Logic**
- Detailed Responses section hidden if Step 3 was skipped.
- Task Bidding section hidden if Step 5 was skipped.

**Validation Rules**
None on the review step itself.

**System Actions -- New Application**
1. Collect all data: proposal, detailed responses, payment preference, task bids.
2. Create application via `dataService.createApplication()`:
   ```
   {
     opportunityId: string,
     applicantId:   string,
     proposal:      string,
     responses: {
       response_{key}: string,   // per model attribute
       paymentPreference: string,
       paymentComments:   string,
       taskBidAmount:     number, // if task-based
       taskBidDuration:   number, // if task-based
       taskBidComments:   string  // if task-based
     }
   }
   ```
3. Default status: `pending`.
4. If this is the first application for the opportunity AND the opportunity status is `published`: update opportunity status to `in_negotiation`.
5. Send notification to opportunity creator:
   - `type`: `application_received`
   - `title`: "New Application"
   - `message`: "You received a new application for '[opportunity title]'"
6. Reload the page to reflect the updated state.

**System Actions -- Edit Application (Update)**
1. Update existing application via `dataService.updateApplication()`.
2. Merge new responses with existing responses.
3. Send notification to opportunity creator:
   - `type`: `application_updated`
   - `title`: "Application Updated"
   - `message`: "[applicant email] updated their application for '[opportunity title]'"
4. Reload the page.

---

<a id="application-management-owner-view"></a>
## Application Management (Owner View)

### Applications List

When the opportunity owner views the detail page, an "Applications" section is shown with the count of applications and a list of application cards.

Each application card displays:
- Applicant name or email
- Application status badge
- Proposal text (truncated)
- Application date
- Action buttons: Accept, Reject

### Accept Application

**System Actions:**
1. Update application status to `accepted`.
2. Create a contract record automatically:
   ```
   {
     opportunityId:  string,
     applicationId:  string,
     creatorId:      string (opportunity creator),
     contractorId:   string (applicant),
     scope:          string (opportunity title),
     paymentMode:    string (opportunity exchange mode),
     duration:       string,
     status:         "pending"
   }
   ```
3. Update opportunity status to `contracted`.
4. Send notification to applicant:
   - `type`: `application_status_changed`
   - `title`: "Application Status Updated"
   - `message`: "Your application for '[opportunity title]' has been accepted"
5. Reload applications list.

### Reject Application

**System Actions:**
1. Update application status to `rejected`.
2. Send notification to applicant:
   - `type`: `application_status_changed`
   - `title`: "Application Status Updated"
   - `message`: "Your application for '[opportunity title]' has been rejected"
3. Reload applications list.

---

<a id="matching-algorithm"></a>
## Matching Algorithm

The matching algorithm calculates a compatibility score (0.0 to 1.0) between an opportunity and a candidate. It runs automatically when an opportunity is published.

### Scoring Breakdown

| Criteria                    | Max Points | Description                                                                 |
|-----------------------------|------------|-----------------------------------------------------------------------------|
| Skills Match                | 50         | Compares opportunity `requiredSkills`/`offeredSkills` against candidate `specializations`, `skills`, `classifications`. Score = (matched / total) * 50. |
| Sectors Match               | 15         | Checks if any opportunity `sectors` match candidate `sectors` or `industry`. Binary: 15 or 0. |
| Certifications Match        | 15         | Compares opportunity `certifications` against candidate `certifications`. Score = (matched / total) * 15. |
| Payment Compatibility       | 10         | Checks if opportunity `paymentModes` / `exchangeMode` matches candidate `preferredPaymentModes`. Match = 10, no prefs = 5, mismatch = 0. |
| Model-Specific Matching     | 100        | Varies by model type (see below).                                           |
| Past Performance            | 20         | Based on candidate's acceptance rate from past applications. New users get default 10 points. Score = acceptanceRate * 20. |

**Total possible points vary** depending on which criteria are present. Final score = totalScore / maxScore.

### Model-Specific Matching

**Task-Based Engagement (task_based):**
- Skill match: 40 points
- Experience match: 20 points (compares experience level to years)
- Budget compatibility: 20 points
- Location compatibility: 10 points
- Availability match: 10 points

**Consortium / Project JV:**
- Scope match (roles): 30 points
- Financial capacity: 30 points (candidate needs >= 10% of project value)
- Experience match: 20 points
- Geographic proximity: 20 points

**SPV:**
- Financial capacity: 50 points (50M SAR minimum)
- Sector expertise: 30 points
- Project experience: 20 points (10+ years for full score)

**Strategic Partnership:**
- Strategic alignment: 40 points
- Complementary strengths: 30 points
- Financial capacity: 20 points
- Market presence: 10 points

**Resource Pooling:**
- Resource match: 50 points
- Quantity alignment: 20 points
- Timeline alignment: 20 points
- Geographic proximity: 10 points

**Hiring:**
- Qualification match: 30 points
- Experience match: 30 points
- Skill match: 30 points
- Location compatibility: 10 points

**Competition:**
- Eligibility criteria: 60 points
- Experience match: 40 points

### Thresholds

| Threshold             | Value | Behavior                                               |
|-----------------------|-------|--------------------------------------------------------|
| MIN_THRESHOLD         | 0.70  | Minimum 70% score to be considered a match             |
| AUTO_NOTIFY_THRESHOLD | 0.80  | Candidates with >= 80% score are automatically notified|

### Auto-Notification

When a match score >= 80%, the system automatically:
1. Creates a notification for the candidate:
   - `type`: `match_found`
   - `title`: "New Match Found"
   - `message`: "You have a [X]% match for '[opportunity title]'"
2. Updates the match record as `notified: true`.

---

<a id="post-to-post-matching"></a>
### Post-to-Post Matching Pipeline

In addition to **opportunity–candidate** matching (above), the platform supports **Need Post ↔ Offer Post** matching with four models.

**Pipeline:** Preprocess (extract & normalize) → Semantic profile (category/skill expansion) → Candidate generation (filter) → Score pairs (weighted) → Model routing → Rank & validate.

**Post-to-Post Weights:**

| Factor              | Weight |
|---------------------|--------|
| Attribute Overlap   | 40%    |
| Budget Fit          | 30%    |
| Timeline Compatibility | 15% |
| Location Match      | 10%    |
| Reputation          | 5%     |

**Models:**

- **One-Way:** Need post → find top Offer posts that satisfy the need. `matchingService.findOffersForNeed(needPostId)` or `findMatchesForPost(opportunityId)` for a request.
- **Two-Way (Barter):** Both sides must match: Offer_A satisfies Need_B and Offer_B satisfies Need_A. Value equivalence can be returned. Use when `exchangeMode === 'barter'` or `options.model === 'two_way'`.
- **Consortium (Group):** Lead need is decomposed into required roles (e.g. from `memberRoles`); for each role, best-matching Offer posts are found and suggested as partners. Use for `subModelType === 'consortium'` or `options.model === 'consortium'`.
- **Circular Exchange:** Directed graph of creators; edge creator I → J when some offer from J satisfies some need from I. Cycles of length ≥ 3 form cash-free exchange chains. `findMatchesForPost(id, { model: 'circular' })`.

**API:** `matchingService.findMatchesForPost(opportunityId, options)` returns `{ model, matches }`. Each match includes `matchScore`, `breakdown`, `labels` (Match/Partial/No Match per factor), optional `valueEquivalence`, and `suggestedPartners` (opportunityId, creatorId, role).

**Config:** `CONFIG.MATCHING.CANDIDATE_MAX`, `POST_TO_POST_THRESHOLD`, `WEIGHTS`, `LABEL_THRESHOLDS`.

---

<a id="pipeline-kanban-view"></a>
## Pipeline / Kanban View

Applications can be viewed in a kanban board layout at `/pipeline`, organized into columns by status:

| Column       | Status          |
|--------------|-----------------|
| Pending      | `pending`       |
| Reviewing    | `reviewing`     |
| Shortlisted  | `shortlisted`   |
| Accepted     | `accepted`      |
| Rejected     | `rejected`      |

The pipeline view includes tabs for Opportunities, Applications, and Matches.

---

<a id="state-changes"></a>
## State Changes

### Application Status Transitions

| From        | To           | Trigger                     |
|-------------|--------------|-----------------------------|
| (new)       | `pending`    | Application submitted       |
| `pending`   | `reviewing`  | Owner starts review         |
| `pending`   | `shortlisted`| Owner shortlists            |
| `pending`   | `accepted`   | Owner accepts               |
| `pending`   | `rejected`   | Owner rejects               |
| `reviewing` | `shortlisted`| Owner shortlists            |
| `reviewing` | `accepted`   | Owner accepts               |
| `reviewing` | `rejected`   | Owner rejects               |
| `shortlisted`| `accepted`  | Owner accepts               |
| `shortlisted`| `rejected`  | Owner rejects               |
| any         | `withdrawn`  | Applicant withdraws         |

### Opportunity Status Transitions Triggered by Applications

| Trigger                                        | Opportunity Status Change          |
|------------------------------------------------|------------------------------------|
| First application received (status: published) | `published` -> `in_negotiation`    |
| Application accepted                          | `in_negotiation` -> `contracted`   |

---

<a id="error-and-edge-cases"></a>
## Error and Edge Cases

| Scenario                                       | Behavior                                                  |
|------------------------------------------------|-----------------------------------------------------------|
| User not logged in                             | "You must be logged in to apply"                          |
| Proposal empty                                 | "Please provide a proposal"                               |
| Payment preference not selected                | "Please select your payment preference"                   |
| Task bid amount missing (task-based)           | "Please provide a bid amount"                             |
| Task bid comments missing (task-based)         | "Please provide comments about your approach"             |
| Cancel application wizard                      | Confirmation dialog: "Are you sure? Progress will be lost"|
| Application submission fails                   | "Failed to submit application. Please try again."         |
| Application status update fails                | "Failed to update application status."                    |
| Opportunity not found                          | "Opportunity not found" error displayed                   |
| Applicant is the opportunity creator           | Apply button not shown                                    |
| Opportunity not published or in_negotiation    | Apply button not shown                                    |

---

<a id="output-data"></a>
## Output Data

### Application Object (stored)
```
{
  id:              string (generated),
  opportunityId:   string,
  applicantId:     string,
  status:          "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected" | "withdrawn",
  proposal:        string,
  responses: {
    response_{attributeKey}: string,  // per model attribute
    paymentPreference:       string,  // "accept" | "discuss" | "custom"
    paymentComments:         string,
    taskBidAmount:           number,  // only for task-based
    taskBidDuration:         number,  // only for task-based
    taskBidComments:         string   // only for task-based
  },
  createdAt:       ISO string,
  updatedAt:       ISO string
}
```

### Match Object (stored)
```
{
  id:              string (generated),
  opportunityId:   string,
  candidateId:     string,
  matchScore:      number (0.0 - 1.0),
  criteria: {
    modelType:    string,
    subModelType: string,
    matchedAt:    ISO string
  },
  notified:        boolean
}
```
