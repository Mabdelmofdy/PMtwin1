# Script B — UAT Offer Opportunity (Readiness + Matching)

**Account:** `sara.almutairi@pmtwin.test` / `Pmtwin@2026` (Individual)  
**Intent:** Offer  
**Wizard:** Create Opportunity — 5 steps  
**Pairs with:** [Script A — Need](./uat-need-opportunity-script.md)

## Goal

Fill a publish-ready **Offer** that auto-matches Khalid’s Need. Use this to show **opportunity readiness**, then **matching redesign** after publish.

Enter values **exactly** as listed. Dates must be **today or later** (do not use 2024 dates).

---

## Step 1 — Opportunity

### Post type


| Field  | Value     |
| ------ | --------- |
| Intent | **Offer** |




### Basic information


| Field                  | Value                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title                  | `UAT Offer — BIM Architect delivery (Revit)`                                                                                                                      |
| Short description      | `Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.` |
| Category or profession | `Construction`                                                                                                                                                    |
| Target role            | `Architect`                                                                                                                                                       |
| Primary location       | `Riyadh`                                                                                                                                                          |
| Service area           | `Riyadh metro`                                                                                                                                                    |
| Start date             | `2026-08-01`                                                                                                                                                      |
| Deadline               | `2026-12-31`                                                                                                                                                      |
| Availability end date  | `2026-12-31`                                                                                                                                                      |


---



## Step 2 — Collaboration



### Main collaboration model


| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| Main model         | **Cash subcontracting**                    |
| Sub-model          | **Task-Based Engagement** (Task based)     |
| Matching structure | **One Way** (auto-derived — do not select) |




### Collaboration details (Task-based)


| Field            | Value                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Task Title       | `BIM Architect — Revit delivery`                                                         |
| Task Type        | `Design`                                                                                 |
| Detailed Scope   | `BIM federation, clash detection support, and Revit package delivery for tower projects` |
| Duration (days)  | `180`                                                                                    |
| Required Skills  | `BIM`, `Revit`                                                                           |
| Experience Level | `Senior`                                                                                 |
| Start Date       | `2026-08-01`                                                                             |
| Payment Terms    | `Milestone-Based`                                                                        |


---



## Step 3 — Scope & Work



### Requirements — Skills Offered

Add **two** skills:


| Skill name | Level        | Years required | Certification required | Mandatory |
| ---------- | ------------ | -------------- | ---------------------- | --------- |
| `BIM`      | Intermediate | `3`            | Yes                    | Yes       |
| `Revit`    | Expert       | `5`            | Yes                    | Yes       |




### Requirements — other


| Field                  | Value                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| Services Offered       | `BIM Coordination, Revit Modeling`                                |
| Preferred partner type | `Company`                                                         |
| Experience level       | `Senior`                                                          |
| Certifications         | `LEED AP BD+C`                                                    |
| Team size              | `1`                                                               |
| Minimum qualifications | `BIM Architect with Revit delivery on mixed-use / tower projects` |




### Resources


| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| Type         | `people`                                    |
| Name         | `BIM Architect (Sara)`                      |
| Quantity     | `1`                                         |
| Unit         | `FTE`                                       |
| Availability | `Available from 2026-08-01`                 |
| Work package | Global (opportunity-level)                  |
| Mandatory    | Yes                                         |
| Notes        | `Hybrid delivery; Riyadh on-site as needed` |




### Available capacity (Offer only)


| Field              | Value |
| ------------------ | ----- |
| Available capacity | `1`   |
| Reserved capacity  | `0`   |
| Maximum capacity   | `1`   |




### Work package


| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Title          | `Revit modeling & coordination`                                               |
| Description    | `BIM federation support, clash detection, and Revit package delivery`         |
| Package skills | `BIM, Revit` (auto-seeded from Skills Offered if empty — confirm both appear) |
| Start date     | `2026-08-01`                                                                  |
| Deadline       | `2026-09-15`                                                                  |




#### Tasks (inside the work package)


| Task title                | Task description                                      |
| ------------------------- | ----------------------------------------------------- |
| `Revit model setup`       | `Prepare Revit model packages for tower coordination` |
| `Clash detection support` | `Support clash detection cycles and issue tracking`   |
| `Coordination handoff`    | `Deliver coordination handoff pack to Need owner`     |




#### Package deliverables (inside the work package)


| Title                           |
| ------------------------------- |
| `Revit model packages`          |
| `Clash detection support notes` |
| `Coordination handoff pack`     |




### Deliverables (opportunity-level)


| Title                           | Acceptance criteria                                    | Linked work package           |
| ------------------------------- | ------------------------------------------------------ | ----------------------------- |
| `Revit model packages`          | `Packages open in Revit; naming and LOD agreed`        | Revit modeling & coordination |
| `Clash detection support notes` | `Notes cover open clashes and recommended resolutions` | Revit modeling & coordination |
| `Coordination handoff pack`     | `Includes model views, reports, and handoff checklist` | Revit modeling & coordination |




### Milestones


| Title              | Target date  | Completion criteria                               | Payment trigger |
| ------------------ | ------------ | ------------------------------------------------- | --------------- |
| `Delivery kickoff` | `2026-09-15` | `Kickoff workshop complete; delivery plan agreed` | Yes             |




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


| Field                   | Value                            |
| ----------------------- | -------------------------------- |
| Attachments             | `portfolio.pdf`                  |
| Compliance requirements | `Saudi Building Code`            |
| Portfolio references    | `Tower BIM coordination samples` |


---



## Step 4 — Commercial Structure



### Exchange components


| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Enable              | **Cash** only                                               |
| Do not enable       | Barter / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `cash`                                                      |




### Cash component


| Field           | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Component title | `BIM Architect delivery fee`                                |
| Applies to      | `Entire opportunity`                                        |
| Currency        | `SAR`                                                       |
| Budget type     | `Range`                                                     |
| Fixed amount    | `235000` (mid estimate — required so cash budget validates) |
| Advance %       | `10`                                                        |
| Retention %     | `5`                                                         |
| Payment terms   | `Milestone-Based`                                           |
| VAT handling    | `15% VAT exclusive`                                         |
| Bank guarantee  | leave blank                                                 |
| Notes           | `Fee range 120000 – 350000 SAR`                             |




### Payment schedule


| Title                                | %    | Amount  |
| ------------------------------------ | ---- | ------- |
| `Kickoff workshop`                   | `25` | `58750` |
| `Mid delivery package`               | `35` | `82250` |
| `Final Revit / coordination handoff` | `40` | `94000` |




### Commercial constraints


| Label         | Value    |
| ------------- | -------- |
| `Fee ceiling` | `350000` |


---



## Step 5 — Review & Publish

1. Confirm executive summary shows Offer · Cash subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner on Review
3. Open **View Details** readiness drawer — score should be high / near 100%
4. **Save Draft** → Details readiness redesign
5. **Publish** Offer (and Need if still draft)
6. Check Matching workspace + bell: **New match found** (`one_way`)



### Recommended checklist (100% readiness)

Already covered above — confirm these are filled:

- Preferred partner: `Company`
- Attachment: `portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Delivery kickoff — 2026-09-15`

---



## Demo steps

1. Logout Khalid → login Sara
2. Create opportunity → fill Steps 1–4 above
3. Step 5 Review → readiness drawer / Details readiness
4. **Publish** Offer (and Need if still draft)
5. Check Matching workspace + bell: **New match found** (`one_way`)



## Matching verify


| Check                     | Expected              |
| ------------------------- | --------------------- |
| Match type                | `one_way`             |
| Role / skills             | Architect + BIM/Revit |
| Notifications             | Both users            |
| Opp status after discover | still `published`     |
| After both Accept         | `matched`             |


Full walkthrough: [manual-need-offer-readiness-matching-scripts.md](./manual-need-offer-readiness-matching-scripts.md)