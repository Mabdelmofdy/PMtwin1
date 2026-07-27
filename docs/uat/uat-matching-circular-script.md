# UAT Matching — Circular Exchange (`circular`)

**UI label:** Circular Exchange  
**Engine key:** `circular`  
**Collaboration path:** Resource Sharing → Resource Sharing & Exchange (Barter)  
**Wizard:** Create Opportunity — 5 steps · **6 posts** required (3 parties × Need + Offer)

**Runtime:** UAT · Password `Pmtwin@2026` · **Individual** account type  
Matching structure is **auto-derived**. Circular also runs as a **separate pass** on publish when a ring exists.  
Enter values **exactly** as listed. Dates must be **2026-08-01 or later**.

---

## How it goes

```text
Omar Needs BIM          ◄── Layla Offers BIM
Layla Needs Structural  ◄── Faisal Offers Structural
Faisal Needs PM         ◄── Omar Offers PM

Ring: Omar → Layla → Faisal → Omar
→ circular PostMatch (min cycle length 3)
```

---

## Accounts

| Party | Login | Need | Offer | Password |
|-------|-------|------|-------|----------|
| Omar | `omar.alsubaie@pmtwin.test` | BIM / Revit | Project Management | `Pmtwin@2026` |
| Layla | `layla.alanzi@pmtwin.test` | Structural Analysis | BIM / Revit | `Pmtwin@2026` |
| Faisal | `faisal.almalki@pmtwin.test` | Project Management | Structural Analysis | `Pmtwin@2026` |

---

## Wizard map

| Step | Screen | What you fill |
|------|--------|----------------|
| 1 | Opportunity | Intent, title, description, category, role, location, dates |
| 2 | Collaboration | Resource Sharing → Resource Sharing & Exchange + resource fields |
| 3 | Scope & Work | Skills, services, resources, work package, deliverables, milestones, timeline, documents |
| 4 | Commercial Structure | **Barter** |
| 5 | Review & Publish | Confirm · Publish |

---

# Omar — Need BIM

**Path:** Login Omar → Create opportunity → Intent **Need**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Need** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Omar Need BIM` |
| Short description | `Need BIM/Revit coordination capacity via resource barter ring on Riyadh projects.` |
| Category or profession | `Construction` |
| Target role | `Architect` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Omar — BIM capacity needed` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Required

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `BIM` | Intermediate | `3` | Yes | Yes |
| `Revit` | Expert | `5` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Required | `BIM Coordination, Revit Modeling` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `LEED AP BD+C` |
| Team size | `1` |
| Minimum qualifications | `BIM coordination for towers` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `BIM coordinator` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Full-time from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `On-site / hybrid BIM coordination` |

### Work package

| Field | Value |
|-------|--------|
| Title | `BIM need package` |
| Description | `Federation and clash support needed` |
| Package skills | `BIM, Revit` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-15` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Receive BIM model` | `Intake federated model from offering party` |
| `Clash review` | `Review clash log and assign owners` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Federated model intake` |
| `Clash log` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Federated model intake` | `Model opens; LOD agreed with offering party` | BIM need package |
| `Clash log` | `Open / closed clashes listed with owners and dates` | BIM need package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `BIM intake` | `2026-09-15` | `Model intake accepted; clash log baseline set` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Location | `Riyadh` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Flexible start | No |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-omar-need.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Prior BIM need references` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `BIM capacity requested (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `Project Management / Planning (Omar Offer)` |
| Requested value | `BIM Coordination / Revit Modeling` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; milestone handoffs` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Need · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-omar-need.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `BIM intake — 2026-09-15`
- Barter component with estimated equivalent value

---

# Omar — Offer PM

**Path:** Same session (Omar) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Omar Offer PM` |
| Short description | `Offering project management and planning capacity for circular resource barter in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Project Manager` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Omar — PM capacity offered` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Offered

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `Project Management` | Expert | `5` | Yes | Yes |
| `Planning` | Intermediate | `3` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Offered | `Project Management, Planning` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `PMP` |
| Team size | `1` |
| Minimum qualifications | `PMP or equivalent; construction PM` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `PM (Omar)` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Available from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Hybrid PM delivery; Riyadh on-site as needed` |

### Available capacity (Offer only)

| Field | Value |
|-------|--------|
| Available capacity | `1` |
| Reserved capacity | `0` |
| Maximum capacity | `1` |

### Work package

| Field | Value |
|-------|--------|
| Title | `PM offer package` |
| Description | `Programme planning and progress control` |
| Package skills | `Project Management, Planning` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Baseline schedule` | `Prepare programme baseline and WBS` |
| `Progress reports` | `Produce progress packs for receiving party` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Master schedule` |
| `Progress pack` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Master schedule` | `Baseline approved; critical path visible` | PM offer package |
| `Progress pack` | `Includes SPI/CPI and risk register update` | PM offer package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `PM kickoff` | `2026-09-01` | `Kickoff workshop complete; baseline agreed` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Preferred location / service area | `Riyadh` |
| Availability from | `2026-08-01` |
| Flexible start | Yes |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-omar-offer.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `PM delivery samples` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `PM capacity offered (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `Project Management / Planning` |
| Requested value | `BIM Coordination / Revit Modeling` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; reciprocal with Omar Need BIM` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-omar-offer.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `PM kickoff — 2026-09-01`
- Barter component with estimated equivalent value

---

# Layla — Need Structural

**Path:** Logout → Login Layla → Create opportunity → Intent **Need**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Need** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Layla Need Structural` |
| Short description | `Need structural analysis / SAP2000 capacity via circular resource barter in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Civil Engineer` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Layla — Structural capacity needed` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Required

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `Structural Analysis` | Expert | `5` | Yes | Yes |
| `SAP2000` | Intermediate | `3` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Required | `Structural Design, Structural Analysis` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `PE / SCE` |
| Team size | `1` |
| Minimum qualifications | `Structural analysis for KSA towers` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `Structural engineer` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Full-time from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Analysis and foundation design support needed` |

### Work package

| Field | Value |
|-------|--------|
| Title | `Structural need package` |
| Description | `Analysis and foundation design support needed` |
| Package skills | `Structural Analysis, SAP2000` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Model intake` | `Receive SAP2000 model from offering party` |
| `Analysis review` | `Review analysis outputs and foundation checklist` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Analysis brief` |
| `Foundation checklist` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Analysis brief` | `Governing cases and utilization ratios documented` | Structural need package |
| `Foundation checklist` | `Checklist completed and signed by receiving lead` | Structural need package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Structural intake` | `2026-09-30` | `Model intake accepted; analysis brief baseline set` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Location | `Riyadh` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Flexible start | No |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-layla-need.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Structural need references` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `Structural capacity requested (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `BIM Coordination / Revit Modeling (Layla Offer)` |
| Requested value | `Structural Analysis / SAP2000` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; milestone handoffs` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Need · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-layla-need.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Structural intake — 2026-09-30`
- Barter component with estimated equivalent value

---

# Layla — Offer BIM

**Path:** Same session (Layla) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Layla Offer BIM` |
| Short description | `Offering BIM/Revit coordination for circular resource barter in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Architect` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Layla — BIM capacity offered` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Offered

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `BIM` | Intermediate | `3` | Yes | Yes |
| `Revit` | Expert | `5` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Offered | `BIM Coordination, Revit Modeling` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `LEED AP BD+C` |
| Team size | `1` |
| Minimum qualifications | `BIM Architect with Revit delivery` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `BIM (Layla)` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Available from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Hybrid BIM delivery; Riyadh on-site as needed` |

### Available capacity (Offer only)

| Field | Value |
|-------|--------|
| Available capacity | `1` |
| Reserved capacity | `0` |
| Maximum capacity | `1` |

### Work package

| Field | Value |
|-------|--------|
| Title | `BIM offer package` |
| Description | `Revit packages and clash support` |
| Package skills | `BIM, Revit` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-15` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Revit setup` | `Prepare Revit model packages` |
| `Clash support` | `Support clash detection cycles` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Revit packages` |
| `Clash notes` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Revit packages` | `Packages open in Revit; naming and LOD agreed` | BIM offer package |
| `Clash notes` | `Notes cover open clashes and recommended resolutions` | BIM offer package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `BIM offer kickoff` | `2026-09-15` | `Kickoff workshop complete; delivery plan agreed` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Preferred location / service area | `Riyadh` |
| Availability from | `2026-08-01` |
| Flexible start | Yes |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-layla-offer.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `BIM delivery samples` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `BIM capacity offered (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `BIM Coordination / Revit Modeling` |
| Requested value | `Structural Analysis / SAP2000` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; reciprocal with Layla Need Structural` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-layla-offer.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `BIM offer kickoff — 2026-09-15`
- Barter component with estimated equivalent value

---

# Faisal — Need PM

**Path:** Logout → Login Faisal → Create opportunity → Intent **Need**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Need** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Faisal Need PM` |
| Short description | `Need project management / planning capacity via circular resource barter in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Project Manager` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Faisal — PM capacity needed` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Required

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `Project Management` | Expert | `5` | Yes | Yes |
| `Planning` | Intermediate | `3` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Required | `Project Management, Planning` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `PMP` |
| Team size | `1` |
| Minimum qualifications | `Senior PM for construction programmes` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `Project manager` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Full-time from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Schedule control and reporting needed` |

### Work package

| Field | Value |
|-------|--------|
| Title | `PM need package` |
| Description | `Schedule control and reporting needed` |
| Package skills | `Project Management, Planning` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Schedule review` | `Review baseline and critical path` |
| `Reporting` | `Define and run progress reporting cadence` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Reviewed baseline` |
| `Progress dashboards` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Reviewed baseline` | `Baseline signed off by programme lead` | PM need package |
| `Progress dashboards` | `Dashboards updated monthly with SPI/CPI` | PM need package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `PM intake` | `2026-09-01` | `Intake workshop complete; reporting cadence agreed` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Location | `Riyadh` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Flexible start | No |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-faisal-need.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `PM need programme references` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `PM capacity requested (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `Structural Analysis / SAP2000 (Faisal Offer)` |
| Requested value | `Project Management / Planning` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; milestone handoffs` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Need · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-faisal-need.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `PM intake — 2026-09-01`
- Barter component with estimated equivalent value

---

# Faisal — Offer Structural

**Path:** Same session (Faisal) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Circle — Faisal Offer Structural` |
| Short description | `Offering structural analysis / SAP2000 capacity for circular resource barter in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Civil Engineer` |
| Primary location | `Riyadh` |
| Service area | `Riyadh metro` |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

---

## Step 2 — Collaboration

### Main collaboration model

| Field | Value |
|-------|--------|
| Main model | **Resource Sharing** |
| Sub-model | **Resource Sharing & Exchange** |
| Matching structure | may show One Way / Circular alternatives (auto — do not select) |

### Collaboration details (Resource Sharing & Exchange)

| Field | Value |
|-------|--------|
| Resource Title | `Faisal — Structural capacity offered` |
| Resource Type | `Services` |
| Location | `Riyadh` |
| Availability start | `2026-08-01` |
| Availability end | `2026-12-31` |
| Transaction Type | `Barter` |

---

## Step 3 — Scope & Work

### Requirements — Skills Offered

Add **two** skills:

| Skill name | Level | Years required | Certification required | Mandatory |
|------------|-------|----------------|------------------------|-----------|
| `Structural Analysis` | Expert | `5` | Yes | Yes |
| `SAP2000` | Intermediate | `3` | Yes | Yes |

### Requirements — other

| Field | Value |
|-------|--------|
| Services Offered | `Structural Design, Structural Analysis` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `PE / SCE` |
| Team size | `1` |
| Minimum qualifications | `Structural Engineer for KSA towers` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `Structural (Faisal)` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Available from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Hybrid structural delivery; Riyadh on-site as needed` |

### Available capacity (Offer only)

| Field | Value |
|-------|--------|
| Available capacity | `1` |
| Reserved capacity | `0` |
| Maximum capacity | `1` |

### Work package

| Field | Value |
|-------|--------|
| Title | `Structural offer package` |
| Description | `SAP2000 models and analysis reports` |
| Package skills | `Structural Analysis, SAP2000` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Model setup` | `Prepare SAP2000 model for analysis` |
| `Analysis runs` | `Run load cases and produce analysis outputs` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `SAP2000 model` |
| `Analysis report` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `SAP2000 model` | `Model opens; load cases documented` | Structural offer package |
| `Analysis report` | `Report covers governing cases and utilization ratios` | Structural offer package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Structural offer kickoff` | `2026-09-30` | `Kickoff workshop complete; analysis plan agreed` | Yes |

### Timeline & location

| Field | Value |
|-------|--------|
| Preferred location / service area | `Riyadh` |
| Availability from | `2026-08-01` |
| Flexible start | Yes |
| Weekend allowed | No |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months` |
| Working days | `Sun–Thu` |
| Shift type | `Day` |

### Documents & compliance

| Field | Value |
|-------|--------|
| Attachments | `circle-faisal-offer.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Structural delivery samples` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Barter** |
| Do not enable | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter` |

### Barter component

| Field | Value |
|-------|--------|
| Component title | `Structural capacity offered (circular barter)` |
| Applies to | `Entire opportunity` |
| Offered value | `Structural Analysis / SAP2000` |
| Requested value | `Project Management / Planning` |
| Estimated equivalent value | `150000` SAR |
| Exchange conditions | `Circular resource barter ring; reciprocal with Faisal Need PM` |
| VAT handling | `15% VAT exclusive if any cash top-up` |
| Notes | `Barter equivalence at market SAR rates` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Equivalent value ceiling` | `150000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Resource Sharing · Resource Sharing & Exchange · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `circle-faisal-offer.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Structural offer kickoff — 2026-09-30`
- Barter component with estimated equivalent value

---

## Matching check

| Check | Expected |
|-------|----------|
| Match type | `circular` |
| Cycle length | 3 |
| Links | Omar←Layla (BIM), Layla←Faisal (Structural), Faisal←Omar (PM) |
| Notifications | **New match found** for all three |
| After all Accept | match `confirmed` · opps → `matched` |

> Circular-only Admin recovery does **not** create Need↔Offer `one_way` matches. For one-way recovery use **Re-run matching**.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No circular ring | All 6 published; ≥ 3 creators; reciprocal skill edges; try Admin circular recovery |
| Resource step blocks publish | Fill Resource Title, Type, Location, Availability, Transaction Type = **Barter** |
| Only one_way appears | Also check Matching for `circular` type (separate pass) |
| Expert skill rejected | Years ≥ 5 for Expert level |

---

## Related

- [uat-matching-one-way-script.md](./uat-matching-one-way-script.md)
- [uat-matching-two-way-script.md](./uat-matching-two-way-script.md)
- [uat-matching-group-script.md](./uat-matching-group-script.md)
- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md)
- [matching-workflow.md](../workflow/matching-workflow.md)
