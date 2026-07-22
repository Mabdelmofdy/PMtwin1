# Script A — UAT Need Opportunity (Readiness + Matching)

**Account:** `khalid.alharbi@pmtwin.test` / `Pmtwin@2026` (Individual)  
**Intent:** Need  
**Wizard:** Create Opportunity — 5 steps  
**Pairs with:** [Script B — Offer](./uat-offer-opportunity-script.md)

## Goal**adiness** UI before publish.

Enter values **exactly** as listed. Dates must be **today or later** (do not use 2024 dates).

Fill a publish-ready **Need** that will auto-match Sara’s Offer after both are published. Use this to show **opportunity re**

---

## Step 1 — Opportunity

### Post type


| Field  | Value    |
| ------ | -------- |
| Intent | **Need** |




### Basic information


| Field                  | Value                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title                  | `UAT Need — BIM Architect for Riyadh tower`                                                                                                                                       |
| Short description      | `Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.` |
| Category or profession | `Construction`                                                                                                                                                                    |
| Target role            | `Architect`                                                                                                                                                                       |
| Primary location       | `Riyadh`                                                                                                                                                                          |
| Service area           | `Riyadh metro`                                                                                                                                                                    |
| Start date             | `2026-08-01`                                                                                                                                                                      |
| Deadline               | `2026-12-31`                                                                                                                                                                      |
| Availability end date  | `2026-12-31`                                                                                                                                                                      |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| Main model         | **Cash subcontracting**                    |
| Sub-model          | **Task-Based Engagement** (Task based)     |
| Matching structure | **One Way** (auto-derived — do not select) |




### Collaboration details (Task-based)


| Field            | Value                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Task Title       | `BIM Architect — tower coordination`                                             |
| Task Type        | `Design`                                                                         |
| Detailed Scope   | `Design coordination for tower core and shell; BIM federation and clash reports` |
| Duration (days)  | `180`                                                                            |
| Required Skills  | `BIM`, `Revit`                                                                   |
| Experience Level | `Senior`                                                                         |
| Start Date       | `2026-08-01`                                                                     |
| Payment Terms    | `Milestone-Based`                                                                |


---



## Step 3 — Scope & Work



### Requirements — Skills Required

Add **two** skills:


| Skill name | Level        | Years required | Certification required | Mandatory |
| ---------- | ------------ | -------------- | ---------------------- | --------- |
| `BIM`      | Intermediate | `3`            | Yes                    | Yes       |
| `Revit`    | Expert       | `5`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Services Required      | `BIM Coordination, Revit Modeling`                       |
| Preferred partner type | `Company`                                                |
| Experience level       | `Senior`                                                 |
| Certifications         | `LEED AP BD+C`                                           |
| Team size              | `1–2`                                                    |
| Minimum qualifications | `5+ years BIM coordination on towers; Revit proficiency` |




### Resources


| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Type         | `people`                                |
| Name         | `BIM coordinator`                       |
| Quantity     | `1`                                     |
| Unit         | `FTE`                                   |
| Availability | `Full-time from 2026-08-01`             |
| Work package | Global (opportunity-level)              |
| Mandatory    | Yes                                     |
| Notes        | `On-site / hybrid coordination support` |




### Work package


| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Title          | `BIM federation & clash package`                                                 |
| Description    | `Model federation, clash detection, and coordination reports for core and shell` |
| Package skills | `BIM, Revit` (auto-seeded from Skills Required if empty — confirm both appear)   |
| Start date     | `2026-08-01`                                                                     |
| Deadline       | `2026-09-01`                                                                     |




#### Tasks (inside the work package)


| Task title                    | Task description                                            |
| ----------------------------- | ----------------------------------------------------------- |
| `Prepare BIM model`           | `Set up federated model structure for tower core and shell` |
| `Clash detection report`      | `Run clash detection and produce coordination report`       |
| `Design coordination package` | `Assemble design coordination package for handoff`          |




#### Package deliverables (inside the work package)


| Title                         |
| ----------------------------- |
| `Federated BIM model`         |
| `Clash detection report`      |
| `Design coordination package` |




### Deliverables (opportunity-level)


| Title                         | Acceptance criteria                                                 | Linked work package            |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| `Federated BIM model`         | `Model opens without critical clash errors; LOD agreed with client` | BIM federation & clash package |
| `Clash detection report`      | `Report lists open / closed clashes with owners and dates`          | BIM federation & clash package |
| `Design coordination package` | `Package includes drawings, model views, and coordination notes`    | BIM federation & clash package |




### Milestones


| Title            | Target date  | Completion criteria                           | Payment trigger |
| ---------------- | ------------ | --------------------------------------------- | --------------- |
| `Concept design` | `2026-09-01` | `Concept package approved by client BIM lead` | Yes             |




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


| Field                   | Value                                                          |
| ----------------------- | -------------------------------------------------------------- |
| Attachments             | `design-brief.pdf`                                             |
| Compliance requirements | `Saudi Building Code`                                          |
| Portfolio references    | `Prior tower BIM coordination references available on request` |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Enable              | **Cash** only                                               |
| Do not enable       | Barter / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `cash`                                                      |




### Cash component


| Field           | Value                              |
| --------------- | ---------------------------------- |
| Component title | `BIM Architect cash engagement`    |
| Applies to      | `Entire opportunity`               |
| Currency        | `SAR`                              |
| Budget type     | `Range`                            |
| Min amount      | `150000`                           |
| Max amount      | `400000`                           |
| Advance %       | `10`                               |
| Retention %     | `5`                                |
| Payment terms   | `Milestone-Based`                  |
| VAT handling    | `15% VAT exclusive`                |
| Bank guarantee  | leave blank                        |
| Notes           | `Budget range 150000 – 400000 SAR` |




### Payment schedule


| Title                        | %    | Amount   |
| ---------------------------- | ---- | -------- |
| `Kickoff / mobilisation`     | `20` | `55000`  |
| `Concept design package`     | `40` | `110000` |
| `Final coordination handoff` | `40` | `110000` |




### Commercial constraints


| Label            | Value    |
| ---------------- | -------- |
| `Budget ceiling` | `400000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary shows Need · Cash subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner on Review (fix any listed issues first)
3. Open **View Details** readiness drawer — score should be high / near 100%
4. **Save Draft** → Opportunity Details shows fields + readiness
5. **Publish** after Script B is ready (or publish Need first; match appears when Offer publishes)



### Recommended checklist (100% readiness)

Already covered above — confirm these are filled:

- Preferred partner: `Company`
- Attachment: `design-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Concept design — 2026-09-01`
- Commercial cash: enabled with notes and/or payment schedule (counts as Budget / Value Terms)

**Score note:** Required = 80%. Five recommended fields add **4% each** to reach 100% (Preferred partner, Attachments, Compliance, Delivery milestones, Budget/value terms).  
`Required items look complete` at **92%** means two recommended signals were missing from the score (usually milestones + cash before Creation 3.0 mapping). Review dashes for Capacity / Delivery method / Flexible start are display-only and do **not** change the score.

---



## Demo steps

1. Login as Khalid → Create opportunity → fill Steps 1–4 above
2. Step 5 Review → readiness drawer → rising score / complete stages
3. Save Draft → Details readiness redesign
4. Publish after Script B is ready (or publish first; match appears when Offer publishes)

Full walkthrough: [manual-need-offer-readiness-matching-scripts.md](./manual-need-offer-readiness-matching-scripts.md)