# UAT Matching — One Way (`one_way`)

**UI label:** One Way Matching  
**Engine key:** `one_way`  
**Collaboration path:** Cash Subcontracting → Task-Based  
**Wizard:** Create Opportunity — 5 steps

**Runtime:** UAT · Password `Pmtwin@2026` · **Individual** account type  
Matching structure is **auto-derived** — do not pick it manually.  
Enter values **exactly** as listed. Dates must be **2026-08-01 or later**.

---

## How it goes

```text
Khalid publishes NEED  ──scores──►  Sara publishes OFFER
         │                                  │
         └──────── one_way PostMatch ───────┘
```

One published **Need** finds compatible published **Offers**. Score uses skills, role, location, timeline, cash fit. Threshold ≈ 0.50.

---

## Accounts

| Role | Login | Password | Account type |
|------|-------|----------|--------------|
| Need owner | `khalid.alharbi@pmtwin.test` | `Pmtwin@2026` | Individual |
| Offer owner | `sara.almutairi@pmtwin.test` | `Pmtwin@2026` | Individual |

> Same user cannot match need ↔ offer to themselves.

---

## Wizard map

| Step | Screen | What you fill |
|------|--------|----------------|
| 1 | Opportunity | Intent, title, description, category, role, location, dates |
| 2 | Collaboration | Main model, sub-model, task-based details |
| 3 | Scope & Work | Skills, services, resources, work packages, deliverables, milestones, timeline, documents |
| 4 | Commercial Structure | Cash component, payment schedule, constraints |
| 5 | Review & Publish | Confirm summary + readiness; Save Draft / Publish |

**Matching structure (auto):** One Way Matching

---

# Post A — Need (Khalid)

**Path:** Login as Khalid → **Create opportunity** → Intent **Need**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Need** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Need — BIM Architect for Riyadh tower` |
| Short description | `Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.` |
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
| Main model | **Cash Subcontracting** |
| Sub-model | **Task-Based Engagement** |
| Matching structure | One Way Matching (auto — do not select) |

### Collaboration details (Task-based)

| Field | Value |
|-------|--------|
| Task Title | `BIM Architect — tower coordination` |
| Task Type | `Design` |
| Detailed Scope | `Design coordination for tower core and shell; BIM federation and clash reports` |
| Duration (days) | `180` |
| Required Skills | `BIM`, `Revit` |
| Experience Level | `Senior` |
| Start Date | `2026-08-01` |
| Payment Terms | `Milestone-Based` |

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
| Team size | `1–2` |
| Minimum qualifications | `5+ years BIM coordination on towers; Revit proficiency` |

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
| Notes | `On-site / hybrid coordination support` |

### Work package

| Field | Value |
|-------|--------|
| Title | `BIM federation & clash package` |
| Description | `Model federation, clash detection, and coordination reports for core and shell` |
| Package skills | `BIM, Revit` (auto-seeded from Skills Required if empty — confirm both appear) |
| Start date | `2026-08-01` |
| Deadline | `2026-09-01` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Prepare BIM model` | `Set up federated model structure for tower core and shell` |
| `Clash detection report` | `Run clash detection and produce coordination report` |
| `Design coordination package` | `Assemble design coordination package for handoff` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Federated BIM model` |
| `Clash detection report` |
| `Design coordination package` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Federated BIM model` | `Model opens without critical clash errors; LOD agreed with client` | BIM federation & clash package |
| `Clash detection report` | `Report lists open / closed clashes with owners and dates` | BIM federation & clash package |
| `Design coordination package` | `Package includes drawings, model views, and coordination notes` | BIM federation & clash package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Concept design` | `2026-09-01` | `Concept package approved by client BIM lead` | Yes |

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
| Attachments | `design-brief.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Prior tower BIM coordination references available on request` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Cash** only |
| Do not enable | Barter / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `cash` |

### Cash component

| Field | Value |
|-------|--------|
| Component title | `BIM Architect cash engagement` |
| Applies to | `Entire opportunity` |
| Currency | `SAR` |
| Budget type | `Range` |
| Min amount | `150000` |
| Max amount | `400000` |
| Advance % | `10` |
| Retention % | `5` |
| Payment terms | `Milestone-Based` |
| VAT handling | `15% VAT exclusive` |
| Bank guarantee | leave blank |
| Notes | `Budget range 150000 – 400000 SAR` |

### Payment schedule

| Title | % | Amount |
|-------|---|--------|
| `Kickoff / mobilisation` | `20` | `55000` |
| `Concept design package` | `40` | `110000` |
| `Final coordination handoff` | `40` | `110000` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Budget ceiling` | `400000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary shows Need · Cash Subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner on Review (fix any listed issues first)
3. Open **View Details** readiness drawer — score should be high / near 100%
4. **Save Draft** (optional) → Opportunity Details shows fields + readiness
5. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `design-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Concept design — 2026-09-01`
- Commercial cash: enabled with notes and/or payment schedule

---

# Post B — Offer (Sara)

**Path:** Logout → Login as Sara → **Create opportunity** → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Offer — BIM Architect delivery (Revit)` |
| Short description | `Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.` |
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
| Main model | **Cash Subcontracting** |
| Sub-model | **Task-Based Engagement** |
| Matching structure | One Way Matching (auto — do not select) |

### Collaboration details (Task-based)

| Field | Value |
|-------|--------|
| Task Title | `BIM Architect — Revit delivery` |
| Task Type | `Design` |
| Detailed Scope | `BIM federation, clash detection support, and Revit package delivery for tower projects` |
| Duration (days) | `180` |
| Required Skills | `BIM`, `Revit` |
| Experience Level | `Senior` |
| Start Date | `2026-08-01` |
| Payment Terms | `Milestone-Based` |

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
| Minimum qualifications | `BIM Architect with Revit delivery on mixed-use / tower projects` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `BIM Architect (Sara)` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Available from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Hybrid delivery; Riyadh on-site as needed` |

### Available capacity (Offer only)

| Field | Value |
|-------|--------|
| Available capacity | `1` |
| Reserved capacity | `0` |
| Maximum capacity | `1` |

### Work package

| Field | Value |
|-------|--------|
| Title | `Revit modeling & coordination` |
| Description | `BIM federation support, clash detection, and Revit package delivery` |
| Package skills | `BIM, Revit` (auto-seeded from Skills Offered if empty — confirm both appear) |
| Start date | `2026-08-01` |
| Deadline | `2026-09-15` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Revit model setup` | `Prepare Revit model packages for tower coordination` |
| `Clash detection support` | `Support clash detection cycles and issue tracking` |
| `Coordination handoff` | `Deliver coordination handoff pack to Need owner` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Revit model packages` |
| `Clash detection support notes` |
| `Coordination handoff pack` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Revit model packages` | `Packages open in Revit; naming and LOD agreed` | Revit modeling & coordination |
| `Clash detection support notes` | `Notes cover open clashes and recommended resolutions` | Revit modeling & coordination |
| `Coordination handoff pack` | `Includes model views, reports, and handoff checklist` | Revit modeling & coordination |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Delivery kickoff` | `2026-09-15` | `Kickoff workshop complete; delivery plan agreed` | Yes |

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
| Attachments | `portfolio.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Tower BIM coordination samples` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Cash** only |
| Do not enable | Barter / Equity / Profit-sharing / Revenue-sharing / Custom |
| Derived mode (auto) | `cash` |

### Cash component

| Field | Value |
|-------|--------|
| Component title | `BIM Architect delivery fee` |
| Applies to | `Entire opportunity` |
| Currency | `SAR` |
| Budget type | `Range` |
| Min amount | `120000` |
| Max amount | `350000` |
| Advance % | `10` |
| Retention % | `5` |
| Payment terms | `Milestone-Based` |
| VAT handling | `15% VAT exclusive` |
| Bank guarantee | leave blank |
| Notes | `Fee range 120000 – 350000 SAR` |

### Payment schedule

| Title | % | Amount |
|-------|---|--------|
| `Kickoff workshop` | `25` | `58750` |
| `Mid delivery package` | `35` | `82250` |
| `Final Revit / coordination handoff` | `40` | `94000` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Fee ceiling` | `350000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary shows Offer · Cash Subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner on Review
3. Open **View Details** readiness drawer — score should be high / near 100%
4. **Save Draft** (optional) → Details readiness redesign
5. **Publish** Offer (and Need if still draft)

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Delivery kickoff — 2026-09-15`

---

## Matching check (after both published)

| Check | Expected |
|-------|----------|
| Match type | `one_way` |
| Participants | Khalid + Sara |
| Score | Strong (Architect + BIM/Revit + cash + Riyadh) |
| Opp status on discover | still `published` |
| Notification | **New match found** for both |
| After both Accept | match `confirmed` · opps → `matched` |

---

## Target role publish gate

| Check | Expected |
|-------|----------|
| Publish without Target role | **Blocked** — message includes that Target role is required |
| Title alone (no Target role) | **Does not** satisfy role for publish or matching |
| Matching field | Engine uses `attributes.targetRole` only |

---

## Cross-city / coverage (optional QA)

| Scenario | Expected |
|----------|----------|
| Need Riyadh + Offer Dammam (city only, same role/skills) | **PostMatch created** if overall score ≥ ~0.50; location contribution reduced (same country ≈ 0.75) |
| Need Riyadh + Service area / geographic scope **Saudi Arabia** + Offer Dammam | Location fit **full** (nationwide); not penalized for city difference |
| Admin → Matching → View diagnostics | Shows scanned / rejected / matched candidates with reject reasons and scores |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Cannot publish | Complete required readiness fields **including Target role**; account not pending vetting |
| Red tag on step 3 | Confirm package **skills** + **deadline**; Expert years ≥ 5; dates not past |
| No match | Both **published**, different users, role `Architect`, skills `BIM`+`Revit` |
| Still empty | Admin → Matching → **Re-run matching** (not circular-only); open **Diagnostics** for reject reasons |
| Publish OK but no matches | Check diagnostics for `TARGET_ROLE_REQUIRED` / `BELOW_MATCH_THRESHOLD` |

---

## Related

- [uat-need-opportunity-script.md](./uat-need-opportunity-script.md) · [uat-offer-opportunity-script.md](./uat-offer-opportunity-script.md)
- [uat-matching-two-way-script.md](./uat-matching-two-way-script.md)
- [uat-matching-group-script.md](./uat-matching-group-script.md)
- [uat-matching-circular-script.md](./uat-matching-circular-script.md)
- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md)
- [matching-workflow.md](../workflow/matching-workflow.md)
