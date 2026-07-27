# UAT Matching — Group Formation (`consortium`)

**UI label:** Group Formation  
**Engine key:** `consortium`  
**Collaboration path:** Joint Venture → Consortium  
**Wizard:** Create Opportunity — 5 steps · **3 posts** required

**Runtime:** UAT · Password `Pmtwin@2026`  
Matching structure is **auto-derived** — do not pick it manually.  
Enter values **exactly** as listed. Dates must be **2026-08-01 or later**.

---

## How it goes

```text
Lead NEED (company)
  roles: [Architect, Structural Engineer]
           │
           ├─ best Offer for Architect  → Khalid
           └─ best Offer for Structural → Hala
                    │
                    ▼
         consortium PostMatch
```

A **lead Need** lists required **member roles**. Matching picks the best Offer **per role** from distinct creators.

---

## Accounts

| Role | Login | Account type | Password |
|------|-------|--------------|----------|
| Consortium lead | `contact@alriyadh-construction.test` | **Company** | `Pmtwin@2026` |
| Role: Architect | `khalid.alharbi@pmtwin.test` | Individual | `Pmtwin@2026` |
| Role: Structural Engineer | `hala.alghamdi@pmtwin.test` | Individual | `Pmtwin@2026` |

---

## Wizard map

| Step | Screen | What you fill |
|------|--------|----------------|
| 1 | Opportunity | Intent, title, description, category, role, location, dates |
| 2 | Collaboration | Lead: JV → Consortium + JSON Member Roles / Minimum Requirements · Partners: Cash → Task-Based |
| 3 | Scope & Work | Skills, services, resources, work package, deliverables, milestones, timeline, documents |
| 4 | Commercial Structure | Cash (or hybrid on lead) |
| 5 | Review & Publish | Confirm · Publish |

**Matching structure (auto on lead):** Group Formation

---

# Post L — Lead Need (Al-Riyadh Construction)

**Path:** Login as Company → **Create opportunity** → Intent **Need**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Need** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Group — Tower consortium lead (Architect + Structural)` |
| Short description | `Lead need seeking consortium partners for tower delivery: BIM Architect and Structural Engineer packages in Riyadh.` |
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
| Main model | **Joint Venture** |
| Sub-model | **Consortium** |
| Matching structure | Group Formation (auto — do not select) |

### Collaboration details (Consortium)

Fill **every** field below. **Member Roles** and **Minimum Requirements** are JSON textareas — paste the JSON exactly (do not use free-text tables).

| Field | Value |
|-------|--------|
| Project Title | `Riyadh tower consortium delivery` |
| Required Members | `2` (minimum 2; must equal number of member roles) |
| Scope Division | `By Trade` (options: By Trade · By Phase · By Geography · Mixed) |
| Tender Deadline | `2026-08-15` |

### Member Roles (JSON textarea — paste as-is)

Paste into the **Member Roles** field:

```json
[
  {
    "role": "Architect",
    "scope": "BIM coordination, Revit modeling, design packages"
  },
  {
    "role": "Structural Engineer",
    "scope": "Structural analysis, SAP2000 models, foundation design"
  }
]
```

| Key | Meaning |
|-----|---------|
| `role` | Member role name (must match partner Offer target roles) |
| `scope` | Scope / package description for that role |

### Minimum Requirements (JSON textarea — paste as-is)

Paste into the **Minimum Requirements** field:

```json
[
  { "requirement": "Experience: KSA tower experience" },
  { "requirement": "Compliance: Saudi Building Code" },
  { "requirement": "Capacity: Available from 2026-08-01" }
]
```

| Key | Meaning |
|-----|---------|
| `requirement` | One minimum requirement string (no separate Detail column in UI) |

**Publish blockers if empty:** Project Title · Required Members (≥ 2) · Member Roles · Scope Division · Minimum Requirements

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
| Services Required | `BIM Coordination, Structural Design` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `LEED AP BD+C` |
| Team size | `2–4` |
| Minimum qualifications | `KSA tower experience; SBC compliance` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `Consortium coordinator` |
| Quantity | `1` |
| Unit | `FTE` |
| Availability | `Full-time from 2026-08-01` |
| Work package | Global (opportunity-level) |
| Mandatory | Yes |
| Notes | `Lead coordination across Architect and Structural packages` |

### Work package

| Field | Value |
|-------|--------|
| Title | `Consortium lead coordination package` |
| Description | `Lead coordination across Architect and Structural packages` |
| Package skills | `BIM, Revit` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Role briefings` | `Brief Architect and Structural partners on scope and interfaces` |
| `Interface matrix` | `Build and maintain interface matrix across trades` |
| `Consortium kickoff pack` | `Assemble kickoff pack and role SOWs` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Interface matrix` |
| `Kickoff pack` |
| `Role SOWs` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Interface matrix` | `All Architect ↔ Structural interfaces listed with owners` | Consortium lead coordination package |
| `Kickoff pack` | `Kickoff agenda, RACI, and calendar agreed` | Consortium lead coordination package |
| `Role SOWs` | `SOW per member role signed by lead` | Consortium lead coordination package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Consortium kickoff` | `2026-09-01` | `Kickoff held; both roles onboarded` | Yes |

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
| Attachments | `group-lead-brief.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Prior consortium tower references` |

---

## Step 4 — Commercial Structure

### Exchange components

| Field | Value |
|-------|--------|
| Enable | **Cash** (Profit-sharing optional / allowed) |
| Do not enable | Barter-only / Equity / Revenue-sharing / Custom |
| Derived mode (auto) | `cash` (or hybrid if profit-sharing also on) |

### Cash component

| Field | Value |
|-------|--------|
| Component title | `Consortium lead cash envelope` |
| Applies to | `Entire opportunity` |
| Currency | `SAR` |
| Budget type | `Range` |
| Min amount | `400000` |
| Max amount | `900000` |
| Advance % | `10` |
| Retention % | `5` |
| Payment terms | `Milestone-Based` |
| VAT handling | `15% VAT exclusive` |
| Bank guarantee | leave blank |
| Notes | `Envelope covers Architect + Structural partner packages` |

### Payment schedule

| Title | % | Amount |
|-------|---|--------|
| `Kickoff / mobilisation` | `20` | `130000` |
| `Mid consortium delivery` | `40` | `260000` |
| `Final handoff` | `40` | `260000` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Budget ceiling` | `900000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Need · Joint Venture · Consortium · cash · Riyadh
2. Confirm both member roles appear (Architect + Structural Engineer)
3. Confirm no red error banner; readiness high / near 100%
4. **Save Draft** (optional) → **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `group-lead-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Consortium kickoff — 2026-09-01`
- Commercial cash: enabled with notes and/or payment schedule
- Member roles: Architect + Structural Engineer

---

# Post P1 — Partner Offer Architect (Khalid)

**Path:** Logout → Login Khalid (Individual) → Create opportunity → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Group — Offer Architect BIM package` |
| Short description | `Offering BIM Architect package for consortium tower delivery in Riyadh — Revit modeling and coordination.` |
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
| Matching structure | One Way Matching (auto) — OK for partner offer |

### Collaboration details (Task-based)

| Field | Value |
|-------|--------|
| Task Title | `Architect BIM consortium package` |
| Task Type | `Design` |
| Detailed Scope | `BIM federation, clash detection, and design packages for consortium lead` |
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
| Minimum qualifications | `BIM Architect for tower consortium packages` |

### Resources

| Field | Value |
|-------|--------|
| Type | `people` |
| Name | `BIM Architect (Khalid)` |
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
| Title | `Architect BIM package` |
| Description | `Revit modeling and coordination for consortium` |
| Package skills | `BIM, Revit` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-15` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Revit setup` | `Prepare Revit model packages for consortium coordination` |
| `Clash cycles` | `Run clash detection cycles and issue tracking` |
| `Design handoff` | `Deliver design handoff pack to consortium lead` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `Revit packages` |
| `Clash notes` |
| `Handoff pack` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `Revit packages` | `Packages open in Revit; naming and LOD agreed` | Architect BIM package |
| `Clash notes` | `Notes cover open clashes and recommended resolutions` | Architect BIM package |
| `Handoff pack` | `Includes model views, reports, and handoff checklist` | Architect BIM package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Architect kickoff` | `2026-09-15` | `Kickoff workshop complete; delivery plan agreed` | Yes |

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
| Attachments | `group-arch-portfolio.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `Tower BIM Architect samples` |

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
| Component title | `Architect consortium package fee` |
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
| `Final design handoff` | `40` | `94000` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Fee ceiling` | `350000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Cash Subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `group-arch-portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Architect kickoff — 2026-09-15`

---

# Post P2 — Partner Offer Structural (Hala)

**Path:** Logout → Login Hala → Create opportunity → Intent **Offer**

## Step 1 — Opportunity

### Post type

| Field | Value |
|-------|--------|
| Intent | **Offer** |

### Basic information

| Field | Value |
|-------|--------|
| Title | `UAT Group — Offer Structural Engineer package` |
| Short description | `Offering Structural Engineer package for consortium tower delivery — analysis, SAP2000, and foundation design in Riyadh.` |
| Category or profession | `Construction` |
| Target role | `Structural Engineer` |
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
| Matching structure | One Way Matching (auto) — OK for partner offer |

### Collaboration details (Task-based)

| Field | Value |
|-------|--------|
| Task Title | `Structural Engineer consortium package` |
| Task Type | `Engineering` |
| Detailed Scope | `Structural analysis, SAP2000 models, and foundation design for consortium lead` |
| Duration (days) | `180` |
| Required Skills | `Structural Analysis`, `SAP2000` |
| Experience Level | `Senior` |
| Start Date | `2026-08-01` |
| Payment Terms | `Milestone-Based` |

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
| Name | `Structural Engineer (Hala)` |
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
| Title | `Structural analysis package` |
| Description | `SAP2000 models and foundation design deliverables` |
| Package skills | `Structural Analysis, SAP2000` |
| Start date | `2026-08-01` |
| Deadline | `2026-09-30` |

#### Tasks (inside the work package)

| Task title | Task description |
|------------|------------------|
| `Model setup` | `Prepare SAP2000 model for tower structural analysis` |
| `Analysis runs` | `Run load cases and produce analysis outputs` |
| `Foundation memo` | `Draft foundation design memo for consortium lead` |

#### Package deliverables (inside the work package)

| Title |
|-------|
| `SAP2000 model` |
| `Analysis report` |
| `Foundation design memo` |

### Deliverables (opportunity-level)

| Title | Acceptance criteria | Linked work package |
|-------|---------------------|---------------------|
| `SAP2000 model` | `Model opens; load cases documented` | Structural analysis package |
| `Analysis report` | `Report covers governing cases and utilization ratios` | Structural analysis package |
| `Foundation design memo` | `Memo approved by lead structural reviewer` | Structural analysis package |

### Milestones

| Title | Target date | Completion criteria | Payment trigger |
|-------|-------------|---------------------|-----------------|
| `Structural kickoff` | `2026-09-30` | `Kickoff workshop complete; analysis plan agreed` | Yes |

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
| Attachments | `group-struct-portfolio.pdf` |
| Compliance requirements | `Saudi Building Code` |
| Portfolio references | `KSA tower structural samples` |

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
| Component title | `Structural consortium package fee` |
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
| Notes | `Fee range 150000 – 400000 SAR` |

### Payment schedule

| Title | % | Amount |
|-------|---|--------|
| `Kickoff workshop` | `20` | `55000` |
| `Mid analysis package` | `40` | `110000` |
| `Final structural handoff` | `40` | `110000` |

### Commercial constraints

| Label | Value |
|-------|--------|
| `Fee ceiling` | `400000` |

---

## Step 5 — Review & Publish

1. Confirm executive summary: Offer · Cash Subcontracting · Task-Based · cash · Riyadh
2. Confirm no red error banner · readiness high
3. **Publish**

### Recommended checklist (100% readiness)

- Preferred partner: `Company`
- Attachment: `group-struct-portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Structural kickoff — 2026-09-30`

---

## Matching check

| Check | Expected |
|-------|----------|
| Match type | `consortium` |
| Roles filled | Architect + Structural Engineer (distinct creators) |
| Notification | **New match found** for lead + partners |
| After all Accept | match `confirmed` · opps → `matched` |
| Incomplete | Only one role Offer → match incomplete / may be hidden |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wrong match type | Lead must be **Joint Venture** → **Consortium** with member roles |
| Consortium incomplete | Publish Offer for **every** role from **distinct** users |
| Cannot publish lead | Fill Project Title, Required Members ≥ 2, Member Roles (JSON), Scope Division, Minimum Requirements (JSON) |
| No match after publish | Publish **all three** posts first, then Admin → Matching → **Re-run matching** (not Re-run circular) |
| Re-run shows toast but still 0 | Confirm Member Roles JSON has `role` keys matching partner **Target role** (`Architect`, `Structural Engineer`) |

---

## Related

- [uat-matching-one-way-script.md](./uat-matching-one-way-script.md)
- [uat-matching-two-way-script.md](./uat-matching-two-way-script.md)
- [uat-matching-circular-script.md](./uat-matching-circular-script.md)
- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md)
- [matching-workflow.md](../workflow/matching-workflow.md)
