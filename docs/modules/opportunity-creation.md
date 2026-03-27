# Opportunity creation

### What this page is

Module guide: the **create opportunity** wizard—models, sub-models, exchange modes, location, and **publish** triggering matching.

### Why it matters

This is the main input to the whole marketplace.

### What you can do here

- See all collaboration models and fields in one place.
- Trace publish → matching.

### Step-by-step actions

1. Read **Overview** and wizard steps.
2. Compare with [opportunity-workflow.md](../workflow/opportunity-workflow.md) for status names.

### What happens next

On **publish**, matching runs ([matching-workflow.md](../workflow/matching-workflow.md)).

### Tips

- Sub-model field sets come from opportunity model config—keep this doc in sync when you add models.

---

## Overview

The Opportunity Creation module is the core workflow of the PMTwin platform. It enables authenticated users (companies and professionals) to create collaboration opportunities through a 6-step wizard. The module supports 5 collaboration models with 13 sub-models, each defining a unique set of questions and fields. It also integrates 5 exchange modes for flexible financial arrangements and a hierarchical location system. Upon publication, the system triggers the matching algorithm to find suitable candidates.

## Actors

| Actor  | Description |
|--------|-------------|
| User   | An authenticated company account or individual professional/consultant who creates the opportunity. |
| System | Manages the wizard flow, validates inputs, persists data, triggers matching, and creates audit logs. |

## Table of Contents

- [Step 1 – Basic Information](#step-1-basic-information)
- [Step 2 – Intent Label](#step-2-intent-label)
- [Step 3 – Scope and Capabilities](#step-3-scope-and-capabilities)
- [Step 4 – Category and Sub-Model Selection](#step-4-category-and-sub-model-selection)
- [Collaboration Models and Sub-Models](#collaboration-models-and-sub-models)
- [Step 5 – Exchange Mode and Financial Terms](#step-5-exchange-mode-and-financial-terms)
- [Step 6 – Review and Publish](#step-6-review-and-publish)
- [Field Types Reference](#field-types-reference)
- [State Changes](#state-changes)
- [Error and Edge Cases](#error-and-edge-cases)
- [Output Data](#output-data)

---

## Step-by-Step Flow

The opportunity creation wizard consists of 6 sequential steps. The user can navigate forward (with validation) and backward freely.

---

<a id="step-1-basic-information"></a>
### Step 1 -- Basic Information

**Primary Question**
"What is this opportunity about and where is it located?"

**Why This Question Exists**
Every opportunity needs a title and location for identification, search, and geographic matching. The description provides context for potential applicants.

**User Inputs**

| Field       | Type     | Required | Constraints               |
|-------------|----------|----------|---------------------------|
| title       | text     | Yes      | maxLength: 150            |
| description | textarea | No       | maxLength: 2000           |
| location    | composite| Yes      | Hierarchical selection    |

Location is a 4-level hierarchical selection:

| Level    | Type   | Required | Source                              |
|----------|--------|----------|-------------------------------------|
| Country  | select | Yes      | `locations.json > countries`        |
| Region   | select | No       | Cascading based on country          |
| City     | select | No       | Cascading based on region           |
| District | select | No       | Cascading based on city             |

**Dropdown Values -- Countries**
- Saudi Arabia (with 13 regions, each with cities and districts)
- UAE
- Qatar
- Kuwait
- Bahrain
- Oman
- Remote

**Conditional Logic**
- Region populates when a country is selected.
- City populates when a region is selected.
- District populates when a city is selected.

**Validation Rules**
- `title` -- Required.
- Location (at least country) -- Required.

**System Actions**
- Store values in wizard state.
- Navigate to Step 2.

---

<a id="step-2-intent-label"></a>
### Step 2 -- Intent Label

**Primary Question**
"Are you requesting something or offering something?"

**Why This Question Exists**
The intent label (NEED vs OFFER) fundamentally changes how the opportunity is interpreted by other users and the matching algorithm. A NEED seeks collaborators to fulfill a need; an OFFER provides capabilities seeking a match.

**User Inputs**

| Field  | Type  | Required | Values                    |
|--------|-------|----------|---------------------------|
| intent | radio | Yes      | `request` (NEED), `offer` (OFFER) |

**Dropdown Values**
N/A -- radio buttons. Values from `lookups.json > intentLabels`:
- `{ id: "request", label: "NEED" }`
- `{ id: "offer", label: "OFFER" }`

**Conditional Logic**
- Intent cannot be changed after the opportunity is created.

**Validation Rules**
- One option must be selected.

**System Actions**
- Store intent in wizard state.
- Navigate to Step 3.

---

<a id="step-3-scope-and-capabilities"></a>
### Step 3 -- Scope and Capabilities

**Primary Question**
"What skills, sectors, and certifications are relevant to this opportunity?"

**Why This Question Exists**
Scope data (skills, sectors, interests, certifications) is the primary input for the matching algorithm. It determines which users are shown as potential matches.

**User Inputs**

| Field          | Type | Required | Notes                          |
|----------------|------|----------|--------------------------------|
| requiredSkills | tags | Yes      | Comma-separated tag input      |
| sectors        | tags | No       | Comma-separated tag input      |
| interests      | tags | No       | Comma-separated tag input      |
| certifications | tags | No       | Comma-separated tag input      |

**Dropdown Values**
N/A -- free-form tag inputs.

**Conditional Logic**
None.

**Validation Rules**
- `requiredSkills` -- Required. At least one skill must be entered.

**System Actions**
- Store scope data in wizard state.
- Navigate to Step 4.

---

<a id="step-4-category-and-sub-model-selection"></a>
### Step 4 -- Category and Sub-Model Selection

**Primary Question**
"What type of collaboration are you looking for?"

**Why This Question Exists**
The collaboration model and sub-model determine the entire set of model-specific questions. Each sub-model represents a distinct business arrangement with its own attributes, validation rules, and conditional fields.

**User Inputs**

| Field     | Type  | Required | Source                                 |
|-----------|-------|----------|----------------------------------------|
| category  | radio | Yes      | 5 parent models (see below)            |
| subModel  | radio | Yes      | Sub-models for the selected category   |

Plus: all model-specific attribute fields (see detailed sub-model sections below).

**Category (Parent Model) Selection**

| Key                    | Label                      |
|------------------------|----------------------------|
| `project_based`        | Project-Based Collaboration|
| `strategic_partnership` | Strategic Partnerships     |
| `resource_pooling`     | Resource Pooling & Sharing |
| `hiring`               | Hiring a Resource          |
| `competition`          | Call for Competition       |

**Conditional Logic**
- Selecting a category shows its available sub-models.
- Selecting a sub-model dynamically loads and renders all attribute fields for that sub-model.
- Within sub-models, individual fields may have conditional visibility rules (documented per sub-model below).

**Validation Rules**
- Category selection -- Required.
- Sub-model selection -- Required.
- All required attributes for the selected sub-model must be filled.

**System Actions**
- Store `modelType` and `subModelType` in wizard state.
- Render dynamic form based on the selected sub-model's attribute definitions.
- Navigate to Step 5.

---

<a id="collaboration-models-and-sub-models"></a>
## Collaboration Models and Sub-Models

### MODEL 1: Project-Based Collaboration (`project_based`)

---

#### Sub-Model 1.1: Task-Based Engagement (`task_based`)

| # | Field Key           | Label                | Type     | Required | Constraints / Options                                                   | Conditional Logic |
|---|---------------------|----------------------|----------|----------|-------------------------------------------------------------------------|-------------------|
| 1 | `taskTitle`         | Task Title           | text     | Yes      | maxLength: 100                                                          | None |
| 2 | `taskType`          | Task Type            | select   | Yes      | Design, Engineering, Consultation, Review, Analysis, Other              | None |
| 3 | `detailedScope`     | Detailed Scope       | textarea | Yes      | maxLength: 2000                                                         | None |
| 4 | `duration`          | Duration (days)      | number   | Yes      |                                                                         | None |
| 5 | `requiredSkills`    | Required Skills      | tags     | Yes      |                                                                         | None |
| 6 | `experienceLevel`   | Experience Level     | select   | Yes      | Junior, Mid-Level, Senior, Expert                                       | None |
| 7 | `locationRequirement`| Location Requirement | select   | No       | Remote, On-Site, Hybrid                                                 | None |
| 8 | `startDate`         | Start Date           | date     | Yes      |                                                                         | None |
| 9 | `deliverableFormat` | Deliverable Format   | text     | Yes      |                                                                         | None |
| 10| `paymentTerms`      | Payment Terms        | select   | Yes      | Upfront, Milestone-Based, Upon Completion, Monthly                      | None |
| 11| `exchangeType`      | Exchange Type        | select   | Yes      | Cash, Barter, Mixed                                                     | None |
| 12| `barterOffer`       | Barter Offer         | textarea | No       | maxLength: 500                                                          | Shown when `exchangeType` is `Barter` or `Mixed` |

---

#### Sub-Model 1.2: Consortium (`consortium`)

| # | Field Key                 | Label                      | Type            | Required | Constraints / Options                                         | Conditional Logic |
|---|---------------------------|----------------------------|-----------------|----------|---------------------------------------------------------------|-------------------|
| 1 | `projectTitle`            | Project Title              | text            | Yes      | maxLength: 150                                                | None |
| 2 | `projectType`             | Project Type               | select          | Yes      | Infrastructure, Building, Industrial, Energy, Other           | None |
| 3 | `projectValue`            | Project Value              | currency        | Yes      |                                                               | None |
| 4 | `projectDuration`         | Project Duration (months)  | number          | Yes      |                                                               | None |
| 5 | `projectLocation`         | Project Location           | text            | Yes      |                                                               | None |
| 6 | `leadMember`              | Are you the lead member?   | boolean         | Yes      |                                                               | None |
| 7 | `requiredMembers`         | Required Members           | number          | Yes      |                                                               | None |
| 8 | `memberRoles`             | Member Roles               | array-objects   | Yes      |                                                               | None |
| 9 | `scopeDivision`           | Scope Division             | select          | Yes      | By Trade, By Phase, By Geography, Mixed                       | None |
| 10| `liabilityStructure`      | Liability Structure        | select          | Yes      | Individual, Joint & Several, Mixed                            | None |
| 11| `clientType`              | Client Type                | select          | Yes      | Government, Private, PPP, Other                               | None |
| 12| `tenderDeadline`          | Tender Deadline            | date            | No       |                                                               | None |
| 13| `prequalificationRequired`| Prequalification Required  | boolean         | Yes      |                                                               | None |
| 14| `minimumRequirements`     | Minimum Requirements       | array-objects   | Yes      |                                                               | None |
| 15| `consortiumAgreement`     | Formal Consortium Agreement| boolean         | Yes      |                                                               | None |
| 16| `paymentDistribution`     | Payment Distribution       | select          | Yes      | Per Scope, Proportional, Fixed Percentage                     | None |
| 17| `requiredSkills`          | Required Skills            | tags            | No       |                                                               | None |

---

#### Sub-Model 1.3: Project-Specific Joint Venture (`project_jv`)

| # | Field Key              | Label                  | Type              | Required | Constraints / Options                                                                  | Conditional Logic |
|---|------------------------|------------------------|-------------------|----------|----------------------------------------------------------------------------------------|-------------------|
| 1 | `projectTitle`         | Project Title          | text              | Yes      | maxLength: 150                                                                         | None |
| 2 | `projectType`          | Project Type           | select            | Yes      | Building, Infrastructure, Industrial, Energy, Real Estate Development, Other           | None |
| 3 | `projectValue`         | Project Value          | currency          | Yes      |                                                                                        | None |
| 4 | `projectDuration`      | Project Duration (months)| number          | Yes      |                                                                                        | None |
| 5 | `projectLocation`      | Project Location       | text              | Yes      |                                                                                        | None |
| 6 | `jvStructure`          | JV Structure           | select            | Yes      | Contractual, Incorporated LLC, Incorporated Corporation                                | None |
| 7 | `equitySplit`          | Equity Split           | array-percentages | Yes      |                                                                                        | None |
| 8 | `capitalContribution`  | Capital Contribution   | currency          | Yes      |                                                                                        | None |
| 9 | `partnerRoles`         | Partner Roles          | array-objects     | Yes      |                                                                                        | None |
| 10| `managementStructure`  | Management Structure   | select            | Yes      | Equal Management, Lead Partner, Management Committee, Professional Manager             | None |
| 11| `profitDistribution`   | Profit Distribution    | select            | Yes      | Proportional to Equity, Fixed Percentage, Performance-Based                            | None |
| 12| `riskAllocation`       | Risk Allocation        | textarea          | Yes      | maxLength: 1000                                                                        | None |
| 13| `exitStrategy`         | Exit Strategy          | select            | Yes      | Dissolution, Asset Sale, Buyout Option, Conversion to Strategic JV                     | None |
| 14| `governance`           | Governance Structure   | textarea          | No       | maxLength: 1000                                                                        | Shown when `jvStructure` is `Incorporated LLC` or `Incorporated Corporation` |
| 15| `disputeResolution`    | Dispute Resolution     | select            | Yes      | Arbitration, Mediation, Court, Other                                                   | None |
| 16| `partnerRequirements`  | Partner Requirements   | array-objects     | Yes      |                                                                                        | None |
| 17| `requiredSkills`       | Required Skills        | tags              | No       |                                                                                        | None |

---

#### Sub-Model 1.4: Special Purpose Vehicle -- SPV (`spv`)

| # | Field Key                    | Label                         | Type         | Required | Constraints / Options                                                       | Conditional Logic |
|---|------------------------------|-------------------------------|--------------|----------|-----------------------------------------------------------------------------|-------------------|
| 1 | `projectTitle`               | Project Title                 | text         | Yes      | maxLength: 150                                                              | None |
| 2 | `projectType`                | Project Type                  | select       | Yes      | Infrastructure, Energy, Real Estate, PPP, Industrial, Other                 | None |
| 3 | `projectValue`               | Project Value (Minimum 50M SAR)| currency    | Yes      | min: 50000000                                                               | None |
| 4 | `projectDuration`            | Project Duration (years)      | number       | Yes      |                                                                             | None |
| 5 | `projectLocation`            | Project Location              | text         | Yes      |                                                                             | None |
| 6 | `spvLegalForm`               | SPV Legal Form                | select       | Yes      | LLC, Limited Partnership, Corporation, Trust                                | None |
| 7 | `sponsors`                   | Sponsors                      | array-objects| Yes      |                                                                             | None |
| 8 | `equityStructure`            | Equity Structure              | array-objects| Yes      |                                                                             | None |
| 9 | `debtFinancing`              | Debt Financing                | currency     | Yes      |                                                                             | None |
| 10| `debtType`                   | Debt Type                     | select       | Yes      | Non-Recourse, Limited Recourse, Recourse                                    | None |
| 11| `lenders`                    | Target Lenders                | tags         | No       |                                                                             | None |
| 12| `projectPhase`               | Project Phase                 | select       | Yes      | Concept, Feasibility, Financing, Construction, Operation                    | None |
| 13| `revenueModel`               | Revenue Model                 | select       | Yes      | User Fees, Government Payments, Asset Sale, Lease, Other                    | None |
| 14| `riskAllocation`             | Risk Allocation               | textarea     | Yes      | maxLength: 2000                                                             | None |
| 15| `governanceStructure`        | Governance Structure          | textarea     | Yes      | maxLength: 1000                                                             | None |
| 16| `regulatoryApprovals`        | Regulatory Approvals          | tags         | Yes      |                                                                             | None |
| 17| `exitStrategy`               | Exit Strategy                 | select       | Yes      | Asset Transfer, Liquidation, Sale, Conversion to Permanent Entity           | None |
| 18| `professionalServicesNeeded` | Professional Services Needed  | multi-select | Yes      | Legal, Financial, Technical, Environmental, Other                           | None |
| 19| `requiredSkills`             | Required Skills               | tags         | No       |                                                                             | None |

---

### MODEL 2: Strategic Partnerships (`strategic_partnership`)

---

#### Sub-Model 2.1: Strategic Joint Venture (`strategic_jv`)

| # | Field Key              | Label                  | Type              | Required | Constraints / Options                                                        | Conditional Logic |
|---|------------------------|------------------------|-------------------|----------|------------------------------------------------------------------------------|-------------------|
| 1 | `jvName`               | JV Name                | text              | Yes      | maxLength: 150                                                               | None |
| 2 | `strategicObjective`   | Strategic Objective    | textarea          | Yes      | maxLength: 1000                                                              | None |
| 3 | `businessScope`        | Business Scope         | textarea          | Yes      | maxLength: 1000                                                              | None |
| 4 | `targetSectors`        | Target Sectors         | multi-select      | Yes      | Construction, Energy, Real Estate, Manufacturing, Technology, Other          | None |
| 5 | `geographicScope`      | Geographic Scope       | multi-select      | Yes      | Saudi Arabia, GCC, MENA, Global                                             | None |
| 6 | `duration`             | Duration               | select            | Yes      | 10-15 years, 15-20 years, Indefinite, Until specific milestone              | None |
| 7 | `jvStructure`          | JV Structure           | select            | Yes      | Incorporated LLC, Incorporated Corporation, Limited Partnership             | None |
| 8 | `equitySplit`          | Equity Split           | array-percentages | Yes      |                                                                              | None |
| 9 | `initialCapital`       | Initial Capital        | currency          | Yes      |                                                                              | None |
| 10| `ongoingFunding`       | Ongoing Funding        | select            | Yes      | Partner Contributions, Retained Earnings, External Financing, Mixed         | None |
| 11| `partnerContributions` | Partner Contributions  | array-objects     | Yes      |                                                                              | None |
| 12| `managementStructure`  | Management Structure   | select            | Yes      | Equal Management, Lead Partner, Professional CEO, Management Committee      | None |
| 13| `governance`           | Governance Structure   | textarea          | Yes      | maxLength: 1000                                                              | None |
| 14| `profitDistribution`   | Profit Distribution    | select            | Yes      | Proportional to Equity, Reinvested, Performance-Based                       | None |
| 15| `exitOptions`          | Exit Options           | multi-select      | Yes      | Buyout, IPO, Sale to Third Party, Dissolution                               | None |
| 16| `nonCompete`           | Non-Compete Clauses    | boolean           | Yes      |                                                                              | None |
| 17| `technologyTransfer`   | Technology Transfer Involved | boolean      | No       |                                                                              | None |
| 18| `partnerRequirements`  | Partner Requirements   | array-objects     | Yes      |                                                                              | None |
| 19| `requiredSkills`       | Required Skills        | tags              | No       |                                                                              | None |

---

#### Sub-Model 2.2: Long-Term Strategic Alliance (`strategic_alliance`)

| # | Field Key              | Label                  | Type         | Required | Constraints / Options                                                                             | Conditional Logic |
|---|------------------------|------------------------|--------------|----------|---------------------------------------------------------------------------------------------------|-------------------|
| 1 | `allianceTitle`        | Alliance Title         | text         | Yes      | maxLength: 150                                                                                    | None |
| 2 | `allianceType`         | Alliance Type          | select       | Yes      | Preferred Supplier, Technology Licensing, Market Access, Knowledge Sharing, Joint Service Offering, Other | None |
| 3 | `strategicObjective`   | Strategic Objective    | textarea     | Yes      | maxLength: 1000                                                                                   | None |
| 4 | `scopeOfCollaboration` | Scope of Collaboration | textarea     | Yes      | maxLength: 1000                                                                                   | None |
| 5 | `duration`             | Duration (years)       | number       | Yes      | min: 3                                                                                            | None |
| 6 | `exclusivity`          | Exclusive Arrangement  | boolean      | Yes      |                                                                                                   | None |
| 7 | `geographicScope`      | Geographic Scope       | tags         | Yes      |                                                                                                   | None |
| 8 | `financialTerms`       | Financial Terms        | textarea     | Yes      | maxLength: 1000                                                                                   | None |
| 9 | `performanceMetrics`   | Performance Metrics    | array-objects| Yes      |                                                                                                   | None |
| 10| `governance`           | Governance             | textarea     | Yes      | maxLength: 500                                                                                    | None |
| 11| `terminationConditions`| Termination Conditions | textarea     | Yes      | maxLength: 500                                                                                    | None |
| 12| `partnerRequirements`  | Partner Requirements   | array-objects| Yes      |                                                                                                   | None |
| 13| `requiredSkills`       | Required Skills        | tags         | No       |                                                                                                   | None |

---

#### Sub-Model 2.3: Mentorship Program (`mentorship`)

| # | Field Key            | Label                    | Type         | Required | Constraints / Options                                                                  | Conditional Logic |
|---|----------------------|--------------------------|--------------|----------|----------------------------------------------------------------------------------------|-------------------|
| 1 | `mentorshipTitle`    | Mentorship Title         | text         | Yes      | maxLength: 100                                                                         | None |
| 2 | `mentorshipType`     | Mentorship Type          | select       | Yes      | Technical, Career Development, Business, Leadership, Project Management, Design, Other | None |
| 3 | `experienceLevel`    | Mentee Experience Level  | select       | Yes      | Entry-Level, Junior, Mid-Level, Senior transitioning to leadership                     | None |
| 4 | `targetSkills`       | Target Skills            | tags         | Yes      |                                                                                        | None |
| 5 | `duration`           | Duration (months)        | number       | Yes      |                                                                                        | None |
| 6 | `frequency`          | Meeting Frequency        | select       | Yes      | Weekly, Bi-Weekly, Monthly, As Needed                                                  | None |
| 7 | `format`             | Format                   | select       | Yes      | In-Person, Virtual, Hybrid, On-Site Shadowing                                          | None |
| 8 | `compensation`       | Compensation             | select       | Yes      | Unpaid, Paid Hourly, Paid Monthly, Barter                                              | None |
| 9 | `barterOffer`        | Barter Offer             | textarea     | No       | maxLength: 500                                                                         | Shown when `compensation` is `Barter` |
| 10| `mentorRequirements` | Mentor Requirements      | array-objects| No       |                                                                                        | None |
| 11| `menteeBackground`   | Mentee Background        | textarea     | No       | maxLength: 500                                                                         | None |
| 12| `successMetrics`     | Success Metrics          | tags         | No       |                                                                                        | None |
| 13| `requiredSkills`     | Required Skills          | tags         | No       |                                                                                        | None |

---

### MODEL 3: Resource Pooling & Sharing (`resource_pooling`)

---

#### Sub-Model 3.1: Bulk Purchasing (`bulk_purchasing`)

| # | Field Key            | Label                  | Type       | Required | Constraints / Options                                             | Conditional Logic |
|---|----------------------|------------------------|------------|----------|-------------------------------------------------------------------|-------------------|
| 1 | `productService`     | Product/Service        | text       | Yes      | maxLength: 150                                                    | None |
| 2 | `category`           | Category               | select     | Yes      | Materials, Equipment, Software, Services, Other                   | None |
| 3 | `quantityNeeded`     | Quantity Needed        | number     | Yes      |                                                                   | None |
| 4 | `unitOfMeasure`      | Unit of Measure        | text       | Yes      |                                                                   | None |
| 5 | `targetPrice`        | Target Price per Unit  | currency   | Yes      |                                                                   | None |
| 6 | `currentMarketPrice` | Current Market Price   | currency   | No       |                                                                   | None |
| 7 | `expectedSavings`    | Expected Savings (%)   | number     | No       |                                                                   | None |
| 8 | `deliveryTimeline`   | Delivery Timeline      | date-range | Yes      |                                                                   | None |
| 9 | `deliveryLocation`   | Delivery Location      | text       | Yes      |                                                                   | None |
| 10| `paymentStructure`   | Payment Structure      | select     | Yes      | Upfront Collection, Escrow, Pay on Delivery, Other                | None |
| 11| `participantsNeeded` | Participants Needed    | number     | Yes      |                                                                   | None |
| 12| `minimumOrder`       | Minimum Order Quantity | number     | No       |                                                                   | None |
| 13| `leadOrganizer`      | Are you the organizer? | boolean    | Yes      |                                                                   | None |
| 14| `supplier`           | Preferred Supplier     | text       | No       |                                                                   | None |
| 15| `distributionMethod` | Distribution Method    | select     | Yes      | Centralized Pickup, Individual Delivery, Organizer Distributes    | None |
| 16| `requiredSkills`     | Required Skills        | tags       | No       |                                                                   | None |

---

#### Sub-Model 3.2: Equipment Sharing (`equipment_sharing`)

| # | Field Key                 | Label                       | Type     | Required | Constraints / Options                                                  | Conditional Logic |
|---|---------------------------|-----------------------------|----------|----------|------------------------------------------------------------------------|-------------------|
| 1 | `assetDescription`        | Asset Description           | text     | Yes      | maxLength: 150                                                         | None |
| 2 | `assetType`               | Asset Type                  | select   | Yes      | Heavy Equipment, Vehicles, Tools, Technology, Facility, Other          | None |
| 3 | `purchasePrice`           | Purchase Price              | currency | Yes      |                                                                        | None |
| 4 | `ownershipStructure`      | Ownership Structure         | select   | Yes      | Equal Shares, Proportional to Investment, LLC, Partnership             | None |
| 5 | `numberOfCoOwners`        | Number of Co-Owners         | number   | Yes      |                                                                        | None |
| 6 | `equityPerOwner`          | Equity Per Owner (%)        | number   | Yes      |                                                                        | None |
| 7 | `initialInvestment`       | Initial Investment per Owner| currency | Yes      |                                                                        | None |
| 8 | `ongoingCosts`            | Ongoing Costs               | array-objects | Yes |                                                                        | None |
| 9 | `costSharing`             | Cost Sharing                | select   | Yes      | Equally, Proportional to Usage, Proportional to Ownership              | None |
| 10| `usageSchedule`           | Usage Schedule              | select   | Yes      | Rotation, Booking System, Priority by Ownership %                      | None |
| 11| `assetLocation`           | Asset Location              | text     | Yes      |                                                                        | None |
| 12| `maintenanceResponsibility`| Maintenance Responsibility | select   | Yes      | Shared, Designated Owner, Third-Party Service                          | None |
| 13| `insurance`               | Asset Insured               | boolean  | Yes      |                                                                        | None |
| 14| `exitStrategy`            | Exit Strategy               | select   | Yes      | Sell Share to Other Owners, Sell to Third Party, Liquidate Asset       | None |
| 15| `disputeResolution`       | Dispute Resolution          | select   | Yes      | Arbitration, Mediation, Court                                          | None |
| 16| `requiredSkills`          | Required Skills             | tags     | No       |                                                                        | None |

---

#### Sub-Model 3.3: Resource Sharing & Exchange (`resource_sharing`)

| # | Field Key          | Label              | Type         | Required | Constraints / Options                                                       | Conditional Logic |
|---|--------------------|--------------------|--------------|----------|-----------------------------------------------------------------------------|-------------------|
| 1 | `resourceTitle`    | Resource Title     | text         | Yes      | maxLength: 150                                                              | None |
| 2 | `resourceType`     | Resource Type      | select       | Yes      | Materials, Equipment, Labor, Services, Knowledge, Other                     | None |
| 3 | `transactionType`  | Transaction Type   | select       | Yes      | Sell, Buy, Rent, Barter, Donate                                            | None |
| 4 | `detailedDescription`| Detailed Description| textarea   | Yes      | maxLength: 1000                                                             | None |
| 5 | `quantity`         | Quantity           | number       | Yes      |                                                                             | None |
| 6 | `unitOfMeasure`    | Unit of Measure    | text         | Yes      |                                                                             | None |
| 7 | `condition`        | Condition          | select       | No       | New, Like New, Good, Fair, Poor                                             | Shown when `resourceType` is `Materials` or `Equipment` |
| 8 | `location`         | Location           | text         | Yes      |                                                                             | None |
| 9 | `availability`     | Availability       | date-range   | Yes      |                                                                             | None |
| 10| `price`            | Price              | currency     | No       |                                                                             | Shown when `transactionType` is `Sell` or `Rent` |
| 11| `barterOffer`      | Barter Offer       | textarea     | No       | maxLength: 1000                                                             | Shown when `transactionType` is `Barter` |
| 12| `barterPreferences`| Barter Preferences | multi-select | No       | Materials, Equipment, Labor, Services, Knowledge, Certification, Other      | Shown when `transactionType` is `Barter` |
| 13| `delivery`         | Delivery           | select       | Yes      | Buyer Pickup, Seller Delivery, Negotiable                                   | None |
| 14| `paymentTerms`     | Payment Terms      | select       | No       | Upfront, On Delivery, Installments                                          | Shown when `transactionType` is `Sell` or `Rent` |
| 15| `urgency`          | Urgency            | select       | Yes      | Immediate, Within 1 Week, Within 1 Month, Flexible                         | None |
| 16| `requiredSkills`   | Required Skills    | tags         | No       |                                                                             | None |

---

### MODEL 4: Hiring a Resource (`hiring`)

---

#### Sub-Model 4.1: Professional Hiring (`professional_hiring`)

| # | Field Key                | Label                     | Type           | Required | Constraints / Options                                                                    | Conditional Logic |
|---|--------------------------|---------------------------|----------------|----------|------------------------------------------------------------------------------------------|-------------------|
| 1 | `jobTitle`               | Job Title                 | text           | Yes      | maxLength: 100                                                                           | None |
| 2 | `jobCategory`            | Job Category              | select         | Yes      | Engineering, Project Management, Architecture, Quantity Surveying, Site Supervision, Safety, Other | None |
| 3 | `employmentType`         | Employment Type           | select         | Yes      | Full-Time, Part-Time, Contract, Freelance, Temporary                                     | None |
| 4 | `contractDuration`       | Contract Duration (months)| number         | No       |                                                                                          | Shown when `employmentType` is `Contract` or `Temporary` |
| 5 | `jobDescription`         | Job Description           | textarea       | Yes      | maxLength: 2000                                                                          | None |
| 6 | `requiredQualifications` | Required Qualifications   | tags           | Yes      |                                                                                          | None |
| 7 | `requiredExperience`     | Required Experience (years)| number        | Yes      |                                                                                          | None |
| 8 | `requiredSkills`         | Required Skills           | tags           | Yes      |                                                                                          | None |
| 9 | `preferredSkills`        | Preferred Skills          | tags           | No       |                                                                                          | None |
| 10| `location`               | Location                  | text           | Yes      |                                                                                          | None |
| 11| `workMode`               | Work Mode                 | select         | Yes      | On-Site, Remote, Hybrid                                                                  | None |
| 12| `salaryRange`            | Salary Range              | currency-range | Yes      |                                                                                          | None |
| 13| `benefits`               | Benefits                  | tags           | No       |                                                                                          | None |
| 14| `startDate`              | Start Date                | date           | Yes      |                                                                                          | None |
| 15| `reportingTo`            | Reporting To              | text           | No       |                                                                                          | None |
| 16| `teamSize`               | Team Size                 | number         | No       |                                                                                          | None |
| 17| `applicationDeadline`    | Application Deadline      | date           | No       |                                                                                          | None |

---

#### Sub-Model 4.2: Consultant Hiring (`consultant_hiring`)

| # | Field Key                | Label                  | Type           | Required | Constraints / Options                                                           | Conditional Logic |
|---|--------------------------|------------------------|----------------|----------|---------------------------------------------------------------------------------|-------------------|
| 1 | `consultationTitle`      | Consultation Title     | text           | Yes      | maxLength: 100                                                                  | None |
| 2 | `consultationType`       | Consultation Type      | select         | Yes      | Legal, Financial, Technical, Sustainability, Safety, Design, Project Management, Other | None |
| 3 | `scopeOfWork`            | Scope of Work          | textarea       | Yes      | maxLength: 2000                                                                 | None |
| 4 | `deliverables`           | Deliverables           | tags           | Yes      |                                                                                 | None |
| 5 | `duration`               | Duration (days/weeks)  | number         | Yes      |                                                                                 | None |
| 6 | `requiredExpertise`      | Required Expertise     | tags           | Yes      |                                                                                 | None |
| 7 | `requiredCertifications` | Required Certifications| tags           | No       |                                                                                 | None |
| 8 | `experienceLevel`        | Experience Level       | select         | Yes      | Mid-Level, Senior, Expert                                                       | None |
| 9 | `locationRequirement`    | Location Requirement   | select         | Yes      | Remote, On-Site, Hybrid                                                         | None |
| 10| `budget`                 | Budget                 | currency-range | Yes      |                                                                                 | None |
| 11| `paymentTerms`           | Payment Terms          | select         | Yes      | Upfront, Milestone-Based, Upon Completion                                       | None |
| 12| `startDate`              | Start Date             | date           | Yes      |                                                                                 | None |
| 13| `exchangeType`           | Exchange Type          | select         | Yes      | Cash, Barter, Mixed                                                             | None |
| 14| `barterOffer`            | Barter Offer           | textarea       | No       | maxLength: 500                                                                  | Shown when `exchangeType` is `Barter` or `Mixed` |
| 15| `requiredSkills`         | Required Skills        | tags           | No       |                                                                                 | None |

---

### MODEL 5: Call for Competition (`competition`)

---

#### Sub-Model 5.1: Competition/RFP (`competition_rfp`)

| # | Field Key                | Label                  | Type              | Required | Constraints / Options                                                               | Conditional Logic |
|---|--------------------------|------------------------|-------------------|----------|-------------------------------------------------------------------------------------|-------------------|
| 1 | `competitionTitle`       | Competition Title      | text              | Yes      | maxLength: 150                                                                      | None |
| 2 | `competitionType`        | Competition Type       | select            | Yes      | Design Competition, RFP, RFQ, Solution Challenge, Innovation Contest, Other         | None |
| 3 | `competitionScope`       | Competition Scope      | textarea          | Yes      | maxLength: 2000                                                                     | None |
| 4 | `participantType`        | Participant Type       | select            | Yes      | Companies Only, Professionals Only, Both                                            | None |
| 5 | `competitionFormat`      | Competition Format     | select            | Yes      | Open to All, Invited Only, Prequalified Participants                                | None |
| 6 | `eligibilityCriteria`    | Eligibility Criteria   | array-objects     | Yes      |                                                                                     | None |
| 7 | `submissionRequirements` | Submission Requirements| tags              | Yes      |                                                                                     | None |
| 8 | `evaluationCriteria`     | Evaluation Criteria    | array-objects     | Yes      |                                                                                     | None |
| 9 | `evaluationWeights`      | Evaluation Weights     | array-percentages | Yes      |                                                                                     | None |
| 10| `prizeContractValue`     | Prize/Contract Value   | currency          | Yes      |                                                                                     | None |
| 11| `numberOfWinners`        | Number of Winners      | number            | Yes      |                                                                                     | None |
| 12| `submissionDeadline`     | Submission Deadline    | date              | Yes      |                                                                                     | None |
| 13| `announcementDate`       | Announcement Date      | date              | Yes      |                                                                                     | None |
| 14| `competitionRules`       | Competition Rules      | textarea          | Yes      | maxLength: 2000                                                                     | None |
| 15| `intellectualProperty`   | Intellectual Property  | select            | Yes      | Submitter Retains, Client Owns, Shared, Winner Transfers                            | None |
| 16| `submissionFee`          | Submission Fee         | currency          | No       |                                                                                     | None |
| 17| `requiredSkills`         | Required Skills        | tags              | No       |                                                                                     | None |

---

<a id="step-5-exchange-mode-and-financial-terms"></a>
### Step 5 -- Exchange Mode and Financial Terms

**Primary Question**
"What are the financial terms for this opportunity?"

**Why This Question Exists**
PMTwin supports multiple value exchange mechanisms beyond traditional cash payments. This step captures the budget range, selected exchange mode, and mode-specific financial details.

**User Inputs -- Common Fields**

| Field              | Type           | Required | Notes                        |
|--------------------|----------------|----------|------------------------------|
| budgetRange.min    | currency       | Yes      | Minimum budget (SAR)         |
| budgetRange.max    | currency       | Yes      | Maximum budget (SAR)         |
| exchangeMode       | card-select    | Yes      | One of 5 exchange modes      |
| exchangeTermsSummary | textarea     | No       | Additional terms and notes   |
| exchangeAgreement  | checkbox       | Yes      | Must accept exchange terms   |

**Exchange Mode Options**
- Cash
- Equity
- Profit-Sharing
- Barter
- Hybrid

---

#### Exchange Mode: Cash

| Field              | Type   | Required | Options                                                           |
|--------------------|--------|----------|-------------------------------------------------------------------|
| cashAmount         | currency| Yes     |                                                                   |
| cashPaymentTerms   | select | Yes      | Upfront, Milestone-Based, Upon Completion, Monthly, Installments  |
| currency           | select | Yes      | SAR, USD, EUR, AED, KWD                                          |
| cashMilestones     | textarea| No      | Payment schedule description                                      |

---

#### Exchange Mode: Equity

| Field              | Type    | Required | Options / Constraints                                       |
|--------------------|---------|----------|-------------------------------------------------------------|
| equityPercentage   | number  | Yes      | 0-100%                                                      |
| equityVesting      | select  | No       | Immediate, 1 Year, 2 Years, 3 Years, 4 Years, Custom       |
| equityContribution | textarea| No       | Description of what contribution earns the equity           |

---

#### Exchange Mode: Profit-Sharing

| Field              | Type    | Required | Options                                                        |
|--------------------|---------|----------|----------------------------------------------------------------|
| profitSplit        | text    | Yes      | e.g., "60-40" or "50-30-20"                                   |
| profitBasis        | select  | No       | Revenue Share, Profit Share (After Costs), Gross Profit Share  |
| profitDistribution | textarea| No       | Distribution schedule description                               |

---

#### Exchange Mode: Barter

| Field         | Type    | Required | Notes                         |
|---------------|---------|----------|-------------------------------|
| barterOffer   | textarea| Yes      | What you are offering         |
| barterNeed    | textarea| Yes      | What you need in return       |
| barterValue   | textarea| No       | Estimated equivalent value    |

---

#### Exchange Mode: Hybrid

| Field              | Type    | Required | Notes                              |
|--------------------|---------|----------|------------------------------------|
| currency           | select  | Yes      | SAR, USD, EUR, AED, KWD           |
| hybridCash         | number  | No       | Cash component percentage          |
| hybridEquity       | number  | No       | Equity component percentage        |
| hybridBarter       | number  | No       | Barter component percentage        |
| hybridCashDetails  | textarea| No       | Details about cash component       |
| hybridEquityDetails| textarea| No       | Details about equity component     |
| hybridBarterDetails| textarea| No       | Details about barter component     |

**Validation**: `hybridCash + hybridEquity + hybridBarter` must equal 100%. At least one component must be specified.

---

**Conditional Logic**
- Mode-specific fields appear/disappear based on `exchangeMode` selection.
- Currency field is shown only for Cash and Hybrid modes.
- Budget range is always shown regardless of mode.

**Validation Rules**
- Budget range (min and max) -- Required.
- Exchange mode -- Required.
- Exchange agreement checkbox -- Required.
- Mode-specific required fields (see tables above).
- Hybrid mode: percentages must sum to 100%.

**System Actions**
- Store exchange data in wizard state under `exchangeData`.
- Navigate to Step 6.

---

<a id="step-6-review-and-publish"></a>
### Step 6 -- Review and Publish

**Primary Question**
"Review your opportunity and choose whether to save as draft or publish."

**Why This Question Exists**
The review step gives the creator a final chance to verify all entered data. The status selection allows saving incomplete work as a draft or publishing immediately.

**User Inputs**

| Field  | Type   | Required | Options                  |
|--------|--------|----------|--------------------------|
| status | select | Yes      | `draft`, `published`     |

**Conditional Logic**
- `draft` -- Opportunity is saved but not visible to other users. Matching is not triggered.
- `published` -- Opportunity is visible to all users. Matching algorithm runs automatically.

**Validation Rules**
- Status must be selected.

**System Actions**
1. Assemble the complete opportunity object from all wizard steps.
2. Persist the opportunity via `dataService.createOpportunity()`.
3. Create audit log entry:
   - `action`: `opportunity_created`
   - `entityType`: `opportunity`
4. If status is `published`:
   - Trigger matching algorithm (`matchingService.findMatchesForOpportunity()`).
   - Auto-notify candidates with match score >= 80%.
5. Redirect to the opportunity detail page.

---

<a id="field-types-reference"></a>
## Field Types Reference

| Type              | Description                                                    |
|-------------------|----------------------------------------------------------------|
| `text`            | Single-line text input                                         |
| `textarea`        | Multi-line text input (rich text editor for long fields >300 chars) |
| `number`          | Numeric input                                                  |
| `currency`        | Numeric input formatted as currency                            |
| `currency-range`  | Two currency inputs (min and max)                              |
| `date`            | Date picker                                                    |
| `date-range`      | Two date pickers (start and end)                               |
| `select`          | Single-selection dropdown                                      |
| `multi-select`    | Multiple-selection dropdown                                    |
| `boolean`         | Toggle / checkbox (Yes/No)                                     |
| `tags`            | Comma-separated tag input (free-form)                          |
| `array-objects`   | Dynamic array of objects (add/remove rows)                     |
| `array-percentages`| Comma-separated percentages (must sum to 100%)                |

---

<a id="state-changes"></a>
## State Changes

| Trigger                    | Status Transition                     |
|----------------------------|---------------------------------------|
| Save as draft              | (new) -> `draft`                      |
| Publish                    | (new) -> `published`                  |
| First application received | `published` -> `in_negotiation`       |
| Application accepted       | `in_negotiation` -> `contracted`      |
| Execution started          | `contracted` -> `in_execution`        |
| All milestones completed   | `in_execution` -> `completed`         |
| Owner closes               | `completed` -> `closed`               |
| Owner cancels              | any active status -> `cancelled`      |

Full opportunity status lifecycle: `draft` -> `published` -> `in_negotiation` -> `contracted` -> `in_execution` -> `completed` -> `closed`

---

<a id="error-and-edge-cases"></a>
## Error and Edge Cases

| Scenario                                         | Behavior                                               |
|--------------------------------------------------|--------------------------------------------------------|
| Title not provided                               | Step 1 validation fails                                |
| Location not selected                            | Step 1 validation fails                                |
| Intent not selected                              | Step 2 validation fails                                |
| No skills entered                                | Step 3 validation fails                                |
| Category or sub-model not selected               | Step 4 validation fails                                |
| Required model attribute missing                 | Step 4 validation fails per field                      |
| SPV project value below 50M SAR                  | Model-specific validation fails (`min: 50000000`)      |
| Strategic Alliance duration below 3 years        | Model-specific validation fails (`min: 3`)             |
| Hybrid percentages do not sum to 100%            | Step 5 validation fails                                |
| Budget range not provided                        | Step 5 validation fails                                |
| Exchange mode not selected                       | Step 5 validation fails                                |
| Exchange agreement not checked                   | Step 5 validation fails                                |
| Status not selected on review step               | Step 6 validation fails                                |
| User not authenticated                           | Redirected to login by auth guard                      |

---

<a id="output-data"></a>
## Output Data

### Opportunity Object (stored)
```
{
  id:              string (generated),
  creatorId:       string,
  title:           string,
  description:     string,
  location:        string (formatted),
  locationCountry: string,
  locationRegion:  string,
  locationCity:    string,
  locationDistrict:string,
  intent:          "request" | "offer",
  scope: {
    requiredSkills:  string[],
    sectors:         string[],
    interests:       string[],
    certifications:  string[]
  },
  modelType:       string (e.g., "project_based"),
  subModelType:    string (e.g., "task_based"),
  attributes:      { ... model-specific fields },
  exchangeMode:    "cash" | "equity" | "profit_sharing" | "barter" | "hybrid",
  exchangeData:    { ... mode-specific fields, budgetRange },
  status:          "draft" | "published",
  createdAt:       ISO string,
  updatedAt:       ISO string
}
```
