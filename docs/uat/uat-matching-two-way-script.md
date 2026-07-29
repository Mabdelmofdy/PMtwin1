# UAT Matching — Two-Way (`two_way`)

**UI label:** Two-Way Dependency  
**Engine key:** `two_way`  
**Collaboration path:** Service Exchange / Barter → Long-Term Strategic Alliance  
**Wizard:** Create Opportunity — 5 steps · **4 posts** required

**Runtime:** UAT · Password `Pmtwin@2026` · **Individual** account type  
Matching structure is **auto-derived** — do not pick it manually.  
Enter values **exactly** as listed. Dates must be **2026-08-01 or later**.

---

## How it goes

```text
Party A                         Party B
Need: BIM  ◄─────────────── Offer: BIM
Offer: PM  ───────────────► Need: PM

Both directions must score ≥ threshold
→ average score → two_way PostMatch
```

Each party must publish **both** a Need and an Offer.

---



## Accounts


| Role    | Login                        | Password      |
| ------- | ---------------------------- | ------------- |
| Party A | `khalid.alharbi@pmtwin.test` | `Pmtwin@2026` |
| Party B | `sara.almutairi@pmtwin.test` | `Pmtwin@2026` |


---



## Wizard map


| Step | Screen               | What you fill                                                                            |
| ---- | -------------------- | ---------------------------------------------------------------------------------------- |
| 1    | Opportunity          | Intent, title, description, category, role, location, dates                              |
| 2    | Collaboration        | Service Exchange → Strategic Alliance + alliance fields                                  |
| 3    | Scope & Work         | Skills, services, resources, work package, deliverables, milestones, timeline, documents |
| 4    | Commercial Structure | **Barter** component (not cash-only)                                                     |
| 5    | Review & Publish     | Confirm · Save Draft / Publish                                                           |


**Matching structure (auto):** Two-Way Dependency

---



# Post A1 — Khalid Need (BIM)

**Path:** Login Khalid → Create opportunity → Intent **Need**

## Step 1 — Opportunity



### Post type


| Field  | Value    |
| ------ | -------- |
| Intent | **Need** |




### Basic information


| Field                  | Value                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Title                  | `UAT TwoWay A — Need BIM coordination`                                                                                    |
| Short description      | `Need BIM coordination and Revit delivery capacity in exchange for project management support on a Riyadh tower program.` |
| Category or profession | `Construction`                                                                                                            |
| Target role            | `Architect`                                                                                                               |
| Primary location       | `Riyadh`                                                                                                                  |
| Service area           | `Riyadh metro`                                                                                                            |
| Start date             | `2026-08-01`                                                                                                              |
| Deadline               | `2026-12-31`                                                                                                              |
| Availability end date  | `2026-12-31`                                                                                                              |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                     |
| ------------------ | ----------------------------------------- |
| Main model         | **Service Exchange / Barter**             |
| Sub-model          | **Long-Term Strategic Alliance**          |
| Matching structure | Two-Way Dependency (auto — do not select) |




### Collaboration details (Strategic Alliance)


| Field                  | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Alliance Title         | `TwoWay A — BIM for PM alliance`                                                       |
| Alliance Type          | `Joint Service Offering`                                                               |
| Scope of Collaboration | `Exchange BIM/Revit coordination capacity for project management and planning support` |
| Financial Terms        | `Barter equivalence; no pure cash; services valued at market SAR rates`                |
| Duration (years)       | `3`                                                                                    |


---



## Step 3 — Scope & Work



### Requirements — Skills Required

Add **two** skills:


| Skill name | Level        | Years required | Certification required | Mandatory |
| ---------- | ------------ | -------------- | ---------------------- | --------- |
| `BIM`      | Intermediate | `3`            | Yes                    | Yes       |
| `Revit`    | Expert       | `5`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                                           |           |
| ---------------------- | ----------------------------------------------- | --------- |
| Services Required      | `BIM Coordination, Revit Modeling`              |           |
| Preferred partner type | `Senior`                                        | `Company` |
| Experience level       |                                                 |           |
| Certifications         | `LEED AP BD+C`                                  |           |
| Team size              | `1–2`                                           |           |
| Minimum qualifications | `BIM coordination on towers; Revit proficiency` |           |




### Resources


| Field        | Value                               |
| ------------ | ----------------------------------- |
| Type         | `people`                            |
| Name         | `BIM coordinator`                   |
| Quantity     | `1`                                 |
| Unit         | `FTE`                               |
| Availability | `Full-time from 2026-08-01`         |
| Work package | Global (opportunity-level)          |
| Mandatory    | Yes                                 |
| Notes        | `On-site / hybrid BIM coordination` |




### Work package


| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Title          | `BIM federation package`                              |
| Description    | `Model federation and clash detection for tower core` |
| Package skills | `BIM, Revit`                                          |
| Start date     | `2026-08-01`                                          |
| Deadline       | `2026-09-15`                                          |




#### Tasks (inside the work package)


| Task title               | Task description                                      |
| ------------------------ | ----------------------------------------------------- |
| `Prepare BIM model`      | `Set up federated model structure for tower core`     |
| `Clash detection report` | `Run clash detection and produce coordination report` |




#### Package deliverables (inside the work package)


| Title                    |
| ------------------------ |
| `Federated BIM model`    |
| `Clash detection report` |




### Deliverables (opportunity-level)


| Title                    | Acceptance criteria                                        | Linked work package    |
| ------------------------ | ---------------------------------------------------------- | ---------------------- |
| `Federated BIM model`    | `Model opens without critical clash errors; LOD agreed`    | BIM federation package |
| `Clash detection report` | `Report lists open / closed clashes with owners and dates` | BIM federation package |




### Milestones


| Title         | Target date  | Completion criteria                               | Payment trigger |
| ------------- | ------------ | ------------------------------------------------- | --------------- |
| `BIM concept` | `2026-09-15` | `Concept federation accepted by partner BIM lead` | Yes             |




### Timeline & location


| Field              | Value        |
| ------------------ | ------------ |
| Location           | `Riyadh`     |
| Start date         | `2026-08-01` |
| Deadline           | `2026-12-31` |
| Flexible start     | No           |
| Weekend allowed    | No           |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months`   |
| Working days       | `Sun–Thu`    |
| Shift type         | `Day`        |




### Documents & compliance


| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Attachments             | `twoway-a-need-brief.pdf`   |
| Compliance requirements | `Saudi Building Code`       |
| Portfolio references    | `Tower BIM need references` |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Enable              | **Barter** (do not enable Cash only)                           |
| Do not enable       | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter`                                                       |




### Barter component


| Field                      | Value                                                     |     |
| -------------------------- | --------------------------------------------------------- | --- |
| Component title            | `BIM capacity requested via barter`                       |     |
| Applies to                 | `Entire opportunity`                                      |     |
| Offered value              | `Project Management and Planning capacity (see Offer A2)` |     |
| Requested value            | `BIM Coordination and Revit Modeling`                     |     |
| Estimated equivalent value | `180000` SAR                                              |     |
| Exchange conditions        | `Reciprocal service exchange; milestone handoffs`         |     |
| VAT handling               | `15% VAT exclusive if any cash top-up`                    |     |
| Notes                      | `Barter equivalence at market SAR rates`                  |     |




### Commercial constraints


| Label                      | Value    |
| -------------------------- | -------- |
| `Equivalent value ceiling` | `180000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary: Need · Service Exchange · Strategic Alliance · barter · Riyadh
2. Confirm no red error banner on Review
3. Open **View Details** readiness drawer — score should be high / near 100%
4. **Save Draft** (optional) → **Publish**



### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `twoway-a-need-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `BIM concept — 2026-09-15`
- Barter component with estimated equivalent value

---



# Post A2 — Khalid Offer (PM)

**Path:** Same session (Khalid) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity



### Post type


| Field  | Value     |
| ------ | --------- |
| Intent | **Offer** |




### Basic information


| Field                  | Value                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Title                  | `UAT TwoWay A — Offer Project Management`                                                                                                    |
| Short description      | `Offering project management and planning services for construction programs in Riyadh, available for barter exchange against BIM capacity.` |
| Category or profession | `Construction`                                                                                                                               |
| Target role            | `Project Manager`                                                                                                                            |
| Primary location       | `Riyadh`                                                                                                                                     |
| Service area           | `Riyadh metro`                                                                                                                               |
| Start date             | `2026-08-01`                                                                                                                                 |
| Deadline               | `2026-12-31`                                                                                                                                 |
| Availability end date  | `2026-12-31`                                                                                                                                 |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                     |
| ------------------ | ----------------------------------------- |
| Main model         | **Service Exchange / Barter**             |
| Sub-model          | **Long-Term Strategic Alliance**          |
| Matching structure | Two-Way Dependency (auto — do not select) |




### Collaboration details (Strategic Alliance)


| Field                  | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| Alliance Title         | `TwoWay A — PM for BIM alliance`                             |
| Alliance Type          | `Joint Service Offering`                                     |
| Scope of Collaboration | `Provide PM/planning in exchange for BIM/Revit coordination` |
| Financial Terms        | `Barter equivalence; services valued at market SAR rates`    |
| Duration (years)       | `3`                                                          |


---



## Step 3 — Scope & Work



### Requirements — Skills Offered

Add **two** skills:


| Skill name           | Level        | Years required | Certification required | Mandatory |
| -------------------- | ------------ | -------------- | ---------------------- | --------- |
| `Project Management` | Expert       | `5`            | Yes                    | Yes       |
| `Planning`           | Intermediate | `3`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                                     |
| ---------------------- | ----------------------------------------- |
| Services Offered       | `Project Management, Planning`            |
| Preferred partner type | `Company`                                 |
| Experience level       | `Senior`                                  |
| Certifications         | `PMP`                                     |
| Team size              | `1`                                       |
| Minimum qualifications | `PMP or equivalent; tower / mixed-use PM` |




### Resources


| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Type         | `people`                                       |
| Name         | `PM (Khalid)`                                  |
| Quantity     | `1`                                            |
| Unit         | `FTE`                                          |
| Availability | `Available from 2026-08-01`                    |
| Work package | Global (opportunity-level)                     |
| Mandatory    | Yes                                            |
| Notes        | `Hybrid PM delivery; Riyadh on-site as needed` |




### Available capacity (Offer only)


| Field              | Value |
| ------------------ | ----- |
| Available capacity | `1`   |
| Reserved capacity  | `0`   |
| Maximum capacity   | `1`   |




### Work package


| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Title          | `PM & planning package`                                  |
| Description    | `Programme planning, progress control, and coordination` |
| Package skills | `Project Management, Planning`                           |
| Start date     | `2026-08-01`                                             |
| Deadline       | `2026-09-30`                                             |




#### Tasks (inside the work package)


| Task title           | Task description                     |
| -------------------- | ------------------------------------ |
| `Baseline schedule`  | `Prepare programme baseline and WBS` |
| `Progress reporting` | `Produce monthly progress packs`     |




#### Package deliverables (inside the work package)


| Title                   |
| ----------------------- |
| `Master schedule`       |
| `Monthly progress pack` |




### Deliverables (opportunity-level)


| Title                   | Acceptance criteria                         | Linked work package   |
| ----------------------- | ------------------------------------------- | --------------------- |
| `Master schedule`       | `Baseline approved; critical path visible`  | PM & planning package |
| `Monthly progress pack` | `Includes SPI/CPI and risk register update` | PM & planning package |




### Milestones


| Title        | Target date  | Completion criteria                          | Payment trigger |
| ------------ | ------------ | -------------------------------------------- | --------------- |
| `PM kickoff` | `2026-09-01` | `Kickoff workshop complete; baseline agreed` | Yes             |




### Timeline & location


| Field                             | Value        |
| --------------------------------- | ------------ |
| Preferred location / service area | `Riyadh`     |
| Availability from                 | `2026-08-01` |
| Flexible start                    | Yes          |
| Weekend allowed                   | No           |
| Must finish before                | `2026-12-31` |
| Estimated duration                | `6 months`   |
| Working days                      | `Sun–Thu`    |
| Shift type                        | `Day`        |




### Documents & compliance


| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Attachments             | `twoway-a-offer-portfolio.pdf` |
| Compliance requirements | `Saudi Building Code`          |
| Portfolio references    | `PM delivery samples`          |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Enable              | **Barter**                                                     |
| Do not enable       | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter`                                                       |




### Barter component


| Field                      | Value                                       |
| -------------------------- | ------------------------------------------- |
| Component title            | `PM capacity offered via barter`            |
| Applies to                 | `Entire opportunity`                        |
| Offered value              | `Project Management and Planning`           |
| Requested value            | `BIM Coordination and Revit Modeling`       |
| Estimated equivalent value | `180000` SAR                                |
| Exchange conditions        | `Reciprocal with Need A1 / partner Need B1` |
| VAT handling               | `15% VAT exclusive if any cash top-up`      |
| Notes                      | `Barter equivalence at market SAR rates`    |




### Commercial constraints


| Label                      | Value    |
| -------------------------- | -------- |
| `Equivalent value ceiling` | `180000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Service Exchange · Strategic Alliance · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**



### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `twoway-a-offer-portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `PM kickoff — 2026-09-01`
- Barter component with estimated equivalent value

---



# Post B1 — Sara Need (PM)

**Path:** Logout → Login Sara → Create opportunity → Intent **Need**

## Step 1 — Opportunity



### Post type


| Field  | Value    |
| ------ | -------- |
| Intent | **Need** |




### Basic information


| Field                  | Value                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Title                  | `UAT TwoWay B — Need Project Management`                                                                           |
| Short description      | `Need project management and planning support in exchange for BIM/Revit coordination capacity on Riyadh projects.` |
| Category or profession | `Construction`                                                                                                     |
| Target role            | `Project Manager`                                                                                                  |
| Primary location       | `Riyadh`                                                                                                           |
| Service area           | `Riyadh metro`                                                                                                     |
| Start date             | `2026-08-01`                                                                                                       |
| Deadline               | `2026-12-31`                                                                                                       |
| Availability end date  | `2026-12-31`                                                                                                       |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                     |
| ------------------ | ----------------------------------------- |
| Main model         | **Service Exchange / Barter**             |
| Sub-model          | **Long-Term Strategic Alliance**          |
| Matching structure | Two-Way Dependency (auto — do not select) |




### Collaboration details (Strategic Alliance)


| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Alliance Title         | `TwoWay B — PM for BIM alliance`                          |
| Alliance Type          | `Joint Service Offering`                                  |
| Scope of Collaboration | `Request PM/planning in exchange for BIM/Revit delivery`  |
| Financial Terms        | `Barter equivalence; services valued at market SAR rates` |
| Duration (years)       | `3`                                                       |


---



## Step 3 — Scope & Work



### Requirements — Skills Required

Add **two** skills:


| Skill name           | Level        | Years required | Certification required | Mandatory |
| -------------------- | ------------ | -------------- | ---------------------- | --------- |
| `Project Management` | Expert       | `5`            | Yes                    | Yes       |
| `Planning`           | Intermediate | `3`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                                   |
| ---------------------- | --------------------------------------- |
| Services Required      | `Project Management, Planning`          |
| Preferred partner type | `Company`                               |
| Experience level       | `Senior`                                |
| Certifications         | `PMP`                                   |
| Team size              | `1`                                     |
| Minimum qualifications | `Senior PM for construction programmes` |




### Resources


| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Type         | `people`                                   |
| Name         | `Project manager`                          |
| Quantity     | `1`                                        |
| Unit         | `FTE`                                      |
| Availability | `Full-time from 2026-08-01`                |
| Work package | Global (opportunity-level)                 |
| Mandatory    | Yes                                        |
| Notes        | `Programme schedule control and reporting` |




### Work package


| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Title          | `PM support package`                      |
| Description    | `Schedule control and progress reporting` |
| Package skills | `Project Management, Planning`            |
| Start date     | `2026-08-01`                              |
| Deadline       | `2026-09-30`                              |




#### Tasks (inside the work package)


| Task title          | Task description                            |
| ------------------- | ------------------------------------------- |
| `Schedule review`   | `Review baseline and critical path`         |
| `Reporting cadence` | `Define and run progress reporting cadence` |




#### Package deliverables (inside the work package)


| Title                 |
| --------------------- |
| `Reviewed baseline`   |
| `Progress dashboards` |




### Deliverables (opportunity-level)


| Title                 | Acceptance criteria                       | Linked work package |
| --------------------- | ----------------------------------------- | ------------------- |
| `Reviewed baseline`   | `Baseline signed off by programme lead`   | PM support package  |
| `Progress dashboards` | `Dashboards updated monthly with SPI/CPI` | PM support package  |




### Milestones


| Title       | Target date  | Completion criteria                                  | Payment trigger |
| ----------- | ------------ | ---------------------------------------------------- | --------------- |
| `PM intake` | `2026-09-01` | `Intake workshop complete; reporting cadence agreed` | Yes             |




### Timeline & location


| Field              | Value        |
| ------------------ | ------------ |
| Location           | `Riyadh`     |
| Start date         | `2026-08-01` |
| Deadline           | `2026-12-31` |
| Flexible start     | No           |
| Weekend allowed    | No           |
| Must finish before | `2026-12-31` |
| Estimated duration | `6 months`   |
| Working days       | `Sun–Thu`    |
| Shift type         | `Day`        |




### Documents & compliance


| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Attachments             | `twoway-b-need-brief.pdf`      |
| Compliance requirements | `Saudi Building Code`          |
| Portfolio references    | `PM need programme references` |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Enable              | **Barter**                                                     |
| Do not enable       | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter`                                                       |




### Barter component


| Field                      | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| Component title            | `PM capacity requested via barter`                   |
| Applies to                 | `Entire opportunity`                                 |
| Offered value              | `BIM Coordination and Revit Modeling (see Offer B2)` |
| Requested value            | `Project Management and Planning`                    |
| Estimated equivalent value | `180000` SAR                                         |
| Exchange conditions        | `Reciprocal with Offer B2 / partner Offer A2`        |
| VAT handling               | `15% VAT exclusive if any cash top-up`               |
| Notes                      | `Barter equivalence at market SAR rates`             |




### Commercial constraints


| Label                      | Value    |
| -------------------------- | -------- |
| `Equivalent value ceiling` | `180000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary: Need · Service Exchange · Strategic Alliance · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**



### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `twoway-b-need-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `PM intake — 2026-09-01`
- Barter component with estimated equivalent value

---



# Post B2 — Sara Offer (BIM)

**Path:** Same session (Sara) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity



### Post type


| Field  | Value     |
| ------ | --------- |
| Intent | **Offer** |




### Basic information


| Field                  | Value                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Title                  | `UAT TwoWay B — Offer BIM coordination`                                                                                              |
| Short description      | `Offering BIM Architect services with Revit modeling for Riyadh projects, available for barter against project management capacity.` |
| Category or profession | `Construction`                                                                                                                       |
| Target role            | `Architect`                                                                                                                          |
| Primary location       | `Riyadh`                                                                                                                             |
| Service area           | `Riyadh metro`                                                                                                                       |
| Start date             | `2026-08-01`                                                                                                                         |
| Deadline               | `2026-12-31`                                                                                                                         |
| Availability end date  | `2026-12-31`                                                                                                                         |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                     |
| ------------------ | ----------------------------------------- |
| Main model         | **Service Exchange / Barter**             |
| Sub-model          | **Long-Term Strategic Alliance**          |
| Matching structure | Two-Way Dependency (auto — do not select) |




### Collaboration details (Strategic Alliance)


| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Alliance Title         | `TwoWay B — BIM for PM alliance`                          |
| Alliance Type          | `Joint Service Offering`                                  |
| Scope of Collaboration | `Provide BIM/Revit in exchange for PM/planning`           |
| Financial Terms        | `Barter equivalence; services valued at market SAR rates` |
| Duration (years)       | `3`                                                       |


---



## Step 3 — Scope & Work



### Requirements — Skills Offered

Add **two** skills:


| Skill name | Level        | Years required | Certification required | Mandatory |
| ---------- | ------------ | -------------- | ---------------------- | --------- |
| `BIM`      | Intermediate | `3`            | Yes                    | Yes       |
| `Revit`    | Expert       | `5`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                               |
| ---------------------- | ----------------------------------- |
| Services Offered       | `BIM Coordination, Revit Modeling`  |
| Preferred partner type | `Company`                           |
| Experience level       | `Senior`                            |
| Certifications         | `LEED AP BD+C`                      |
| Team size              | `1`                                 |
| Minimum qualifications | `BIM Architect with Revit delivery` |




### Resources


| Field        | Value                                           |
| ------------ | ----------------------------------------------- |
| Type         | `people`                                        |
| Name         | `BIM Architect (Sara)`                          |
| Quantity     | `1`                                             |
| Unit         | `FTE`                                           |
| Availability | `Available from 2026-08-01`                     |
| Work package | Global (opportunity-level)                      |
| Mandatory    | Yes                                             |
| Notes        | `Hybrid BIM delivery; Riyadh on-site as needed` |




### Available capacity (Offer only)


| Field              | Value |
| ------------------ | ----- |
| Available capacity | `1`   |
| Reserved capacity  | `0`   |
| Maximum capacity   | `1`   |




### Work package


| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Title          | `Revit & BIM delivery`                      |
| Description    | `BIM federation and Revit package delivery` |
| Package skills | `BIM, Revit`                                |
| Start date     | `2026-08-01`                                |
| Deadline       | `2026-09-15`                                |




#### Tasks (inside the work package)


| Task title          | Task description                                    |
| ------------------- | --------------------------------------------------- |
| `Revit model setup` | `Prepare Revit model packages for coordination`     |
| `Clash support`     | `Support clash detection cycles and issue tracking` |




#### Package deliverables (inside the work package)


| Title            |
| ---------------- |
| `Revit packages` |
| `Clash notes`    |




### Deliverables (opportunity-level)


| Title            | Acceptance criteria                                    | Linked work package  |
| ---------------- | ------------------------------------------------------ | -------------------- |
| `Revit packages` | `Packages open in Revit; naming and LOD agreed`        | Revit & BIM delivery |
| `Clash notes`    | `Notes cover open clashes and recommended resolutions` | Revit & BIM delivery |




### Milestones


| Title                  | Target date  | Completion criteria                               | Payment trigger |
| ---------------------- | ------------ | ------------------------------------------------- | --------------- |
| `BIM delivery kickoff` | `2026-09-15` | `Kickoff workshop complete; delivery plan agreed` | Yes             |




### Timeline & location


| Field                             | Value        |
| --------------------------------- | ------------ |
| Preferred location / service area | `Riyadh`     |
| Availability from                 | `2026-08-01` |
| Flexible start                    | Yes          |
| Weekend allowed                   | No           |
| Must finish before                | `2026-12-31` |
| Estimated duration                | `6 months`   |
| Working days                      | `Sun–Thu`    |
| Shift type                        | `Day`        |




### Documents & compliance


| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Attachments             | `twoway-b-offer-portfolio.pdf` |
| Compliance requirements | `Saudi Building Code`          |
| Portfolio references    | `BIM delivery samples`         |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Enable              | **Barter**                                                     |
| Do not enable       | Cash-only / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `barter`                                                       |




### Barter component


| Field                      | Value                                       |
| -------------------------- | ------------------------------------------- |
| Component title            | `BIM capacity offered via barter`           |
| Applies to                 | `Entire opportunity`                        |
| Offered value              | `BIM Coordination and Revit Modeling`       |
| Requested value            | `Project Management and Planning`           |
| Estimated equivalent value | `180000` SAR                                |
| Exchange conditions        | `Reciprocal with Need B1 / partner Need A1` |
| VAT handling               | `15% VAT exclusive if any cash top-up`      |
| Notes                      | `Barter equivalence at market SAR rates`    |




### Commercial constraints


| Label                      | Value    |
| -------------------------- | -------- |
| `Equivalent value ceiling` | `180000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Service Exchange · Strategic Alliance · barter · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**



### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `twoway-b-offer-portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `BIM delivery kickoff — 2026-09-15`
- Barter component with estimated equivalent value

---



## Matching check


| Check             | Expected                                            |
| ----------------- | --------------------------------------------------- |
| Match type        | `two_way`                                           |
| Payload           | sideA (Khalid need+offer) ↔ sideB (Sara need+offer) |
| Direction scores  | scoreAtoB and scoreBtoA both above threshold        |
| Diagnostics       | Admin → Matching → View — candidates matched/rejected with reasons |
| Notification      | **New match found** for both                        |
| After both Accept | match `confirmed` · opps → `matched`                |


> If only `one_way` appears: confirm **Barter** on all four + Service Exchange, and each user published both Need and Offer.

**Final four-type sign-off:** [uat-matching-final-four-type-checklist.md](./uat-matching-final-four-type-checklist.md)

---



## Troubleshooting


| Symptom                          | Fix                                                             |
| -------------------------------- | --------------------------------------------------------------- |
| Expected two_way but got one_way | All four published; Barter enabled; each party has Need + Offer |
| Cannot publish alliance step     | Fill Alliance Title, Type, Scope, Financial Terms, Duration ≥ 3 |
| No match                         | Align Riyadh dates/skills; Admin → **Re-run matching**; check diagnostics |
| Cannot publish                   | Target role required on every post                              |


---



## Related

- [uat-matching-final-four-type-checklist.md](./uat-matching-final-four-type-checklist.md)
- [uat-matching-one-way-script.md](./uat-matching-one-way-script.md)
- [uat-matching-group-script.md](./uat-matching-group-script.md)
- [uat-matching-circular-script.md](./uat-matching-circular-script.md)
- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md)
- [matching-workflow.md](../workflow/matching-workflow.md)

