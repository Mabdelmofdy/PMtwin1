# UAT Manual Scripts — Need + Offer (Readiness & Matching)

Use these two fill scripts in **UAT** to create complementary opportunities by hand and demo:

1. **Opportunity readiness** (wizard stages, readiness drawer, publish gate)
2. **Matching redesign** (publish → auto-match → `new_match_found` → Matching workspace)

**Runtime:** UAT (`VITE_RUNTIME_MODE=uat` or your UAT URL). Data stays in this browser’s namespaced LocalStorage.

**Locations:** Primary location is a **canonical searchable picker** (e.g. select **Riyadh City**) — do not type free text. Coverage Areas / Available In is optional multi-select (e.g. **Riyadh** region). Matching uses both fields.

**Detailed field lists:**  
- [Script A — Need](./uat-need-opportunity-script.md)  
- [Script B — Offer](./uat-offer-opportunity-script.md)

---

## Accounts (two different users)

| Role | Script | Login | Password |
|------|--------|-------|----------|
| Need owner | Script A | `khalid.alharbi@pmtwin.test` | `Pmtwin@2026` |
| Offer owner | Script B | `sara.almutairi@pmtwin.test` | `Pmtwin@2026` |

Use **Individual** account type if the login screen asks.

> Same user cannot match need ↔ offer to themselves. Always use two accounts.

---

## Wizard map (Creation Experience 3.0)

Both scripts use the same **5-step** wizard. Matching structure is **auto-derived** (do not pick One Way / Two Way manually).

| Step | Screen | What you fill |
|------|--------|----------------|
| 1 | Opportunity | Intent, title, description, category, role, primary location, coverage areas, dates |
| 2 | Collaboration | Main model, sub-model, task-based collaboration details |
| 3 | Scope & Work | Skills, services, resources, work packages/tasks, deliverables, milestones, timeline, documents |
| 4 | Commercial Structure | Cash component, payment schedule, constraints |
| 5 | Review & Publish | Confirm summary + readiness; Save Draft / Publish |

**Dates:** use `2026-08-01` and later only. Past dates (e.g. 2024) turn the stepper red.

**Skills:** Expert needs **≥ 5 years**. Intermediate / Expert with 3 and 5 years is valid.

**Work packages:** each package needs **skills** and a **deadline**. Skills auto-seed from opportunity skills when empty — confirm `BIM, Revit` appear.

---

## What you should see

### After Script A (Need) — before publish

- Wizard readiness stages fill as you complete Opportunity → Collaboration → Scope & Work → Commercial → Review
- Readiness drawer / score moves up (aim for publish-ready ≥ ~80%; with recommended fields aim ~100%)
- Save Draft → Opportunity Details shows filled fields + readiness presentation

### After both published

- Related / Matching workspace shows a **one_way** PostMatch
- Both users get **New match found** notification
- Match score reflects BIM / Architect / cash overlap

---

## Script A — Need (User: Khalid)

**Path:** Login as Khalid → **Create opportunity** → Intent **Need**  
**Full field tables:** [uat-need-opportunity-script.md](./uat-need-opportunity-script.md)

### Step 1 — Opportunity

| Field | Enter exactly |
|-------|----------------|
| Intent | **Need** |
| Title | `UAT Need — BIM Architect for Riyadh tower` |
| Short description | `Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.` |
| Category or profession | `Construction` |
| Target role | `Architect` |
| Primary location | Select **Riyadh City** |
| Coverage Areas / Available In | Select **Riyadh** (region) — optional; Primary is always included |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

### Step 2 — Collaboration

| Field | Enter exactly |
|-------|----------------|
| Main collaboration model | Cash subcontracting |
| Sub-model | Task-Based Engagement |
| Matching structure | One Way (auto — do not select) |
| Task Title | `BIM Architect — tower coordination` |
| Task Type | `Design` |
| Detailed Scope | `Design coordination for tower core and shell; BIM federation and clash reports` |
| Duration (days) | `180` |
| Required Skills | `BIM`, `Revit` |
| Experience Level | `Senior` |
| Start Date | `2026-08-01` |
| Payment Terms | `Milestone-Based` |

### Step 3 — Scope & Work

| Field | Enter exactly |
|-------|----------------|
| Skills Required | `BIM` (Intermediate, 3 yrs, cert + mandatory) · `Revit` (Expert, 5 yrs, cert + mandatory) |
| Services Required | `BIM Coordination, Revit Modeling` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `LEED AP BD+C` |
| Team size | `1–2` |
| Minimum qualifications | `5+ years BIM coordination on towers; Revit proficiency` |
| Resource | people · `BIM coordinator` · qty `1` · unit `FTE` · mandatory |
| Work package title | `BIM federation & clash package` |
| Package description | `Model federation, clash detection, and coordination reports for core and shell` |
| Package skills | `BIM, Revit` |
| Package start / deadline | `2026-08-01` / `2026-09-01` |
| Tasks | `Prepare BIM model` · `Clash detection report` · `Design coordination package` |
| Deliverables | Federated BIM model · Clash detection report · Design coordination package |
| Milestone | `Concept design` · `2026-09-01` · payment trigger On |
| Estimated duration | `6 months` |
| Working days / shift | `Sun–Thu` / `Day` |
| Must finish before | `2026-12-31` |
| Flexible start / weekend | No / No |
| Attachments | `design-brief.pdf` |
| Compliance | `Saudi Building Code` |
| Portfolio references | `Prior tower BIM coordination references available on request` |

### Step 4 — Commercial Structure

| Field | Enter exactly |
|-------|----------------|
| Components | **Cash** only (derived mode `cash`) |
| Component title | `BIM Architect cash engagement` |
| Applies to | Entire opportunity |
| Currency | `SAR` |
| Budget type | `Range` |
| Min amount | `150000` |
| Max amount | `400000` |
| Notes | `Budget range 150000 – 400000 SAR` |
| Advance % / Retention % | `10` / `5` |
| Payment terms | `Milestone-Based` |
| VAT handling | `15% VAT exclusive` |
| Payment schedule | Kickoff 20% / Concept 40% / Final 40% |
| Constraint | Budget ceiling `400000` |

### Step 5 — Review & Publish

1. Confirm no red validation banner  
2. Open readiness drawer — high score  
3. **Save Draft** → Details readiness UI  
4. Publish when Script B is ready (or publish Need first)

---

## Script B — Offer (User: Sara)

**Path:** Logout → Login as Sara → **Create opportunity** → Intent **Offer**  
**Full field tables:** [uat-offer-opportunity-script.md](./uat-offer-opportunity-script.md)

### Step 1 — Opportunity

| Field | Enter exactly |
|-------|----------------|
| Intent | **Offer** |
| Title | `UAT Offer — BIM Architect delivery (Revit)` |
| Short description | `Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.` |
| Category or profession | `Construction` |
| Target role | `Architect` |
| Primary location | Select **Riyadh City** |
| Coverage Areas / Available In | Select **Riyadh** (region) — optional; Primary is always included |
| Start date | `2026-08-01` |
| Deadline | `2026-12-31` |
| Availability end date | `2026-12-31` |

### Step 2 — Collaboration

| Field | Enter exactly |
|-------|----------------|
| Main collaboration model | Cash subcontracting |
| Sub-model | Task-Based Engagement |
| Matching structure | One Way (auto — do not select) |
| Task Title | `BIM Architect — Revit delivery` |
| Task Type | `Design` |
| Detailed Scope | `BIM federation, clash detection support, and Revit package delivery for tower projects` |
| Duration (days) | `180` |
| Required Skills | `BIM`, `Revit` |
| Experience Level | `Senior` |
| Start Date | `2026-08-01` |
| Payment Terms | `Milestone-Based` |

### Step 3 — Scope & Work

| Field | Enter exactly |
|-------|----------------|
| Skills Offered | `BIM` (Intermediate, 3 yrs, cert + mandatory) · `Revit` (Expert, 5 yrs, cert + mandatory) |
| Services Offered | `BIM Coordination, Revit Modeling` |
| Preferred partner type | `Company` |
| Experience level | `Senior` |
| Certifications | `LEED AP BD+C` |
| Team size | `1` |
| Minimum qualifications | `BIM Architect with Revit delivery on mixed-use / tower projects` |
| Resource | people · `BIM Architect (Sara)` · qty `1` · unit `FTE` · mandatory |
| Available / reserved / max capacity | `1` / `0` / `1` |
| Work package title | `Revit modeling & coordination` |
| Package description | `BIM federation support, clash detection, and Revit package delivery` |
| Package skills | `BIM, Revit` |
| Package start / deadline | `2026-08-01` / `2026-09-15` |
| Tasks | `Revit model setup` · `Clash detection support` · `Coordination handoff` |
| Deliverables | Revit model packages · Clash detection support notes · Coordination handoff pack |
| Milestone | `Delivery kickoff` · `2026-09-15` · payment trigger On |
| Estimated duration | `6 months` |
| Working days / shift | `Sun–Thu` / `Day` |
| Must finish before | `2026-12-31` |
| Flexible start / weekend | Yes / No |
| Attachments | `portfolio.pdf` |
| Compliance | `Saudi Building Code` |
| Portfolio references | `Tower BIM coordination samples` |

### Step 4 — Commercial Structure

| Field | Enter exactly |
|-------|----------------|
| Components | **Cash** only (derived mode `cash`) |
| Component title | `BIM Architect delivery fee` |
| Applies to | Entire opportunity |
| Currency | `SAR` |
| Budget type | `Range` |
| Min amount | `120000` |
| Max amount | `350000` |
| Notes | `Fee range 120000 – 350000 SAR` |
| Advance % / Retention % | `10` / `5` |
| Payment terms | `Milestone-Based` |
| VAT handling | `15% VAT exclusive` |
| Payment schedule | Kickoff 25% / Mid 35% / Final 40% |
| Constraint | Fee ceiling `350000` |

### Step 5 — Review & Publish

1. Confirm no red validation banner  
2. Readiness drawer → high score  
3. Save Draft → Details readiness  
4. **Publish** Offer (and Need if still draft)

---

## Matching check (after both published)

Matching runs **automatically** on each successful publish (Local / Demo / UAT). No Admin → Run matching step in the happy path.

| Check | Where | Expected |
|-------|--------|----------|
| Auto-match created | Opportunity → **Matching** / Related | one_way PostMatch linking both |
| Notification | Bell | **New match found** for Khalid and Sara |
| Score | Match card | Strong overlap (role Architect + BIM/Revit) |
| Status | Opportunity | Still `published` until match is **confirmed** (policy B) |
| Confirm path | Accept (both) → confirmed | Opportunities → `matched` |

### Optional confirm demo

1. Khalid: Accept match  
2. Sara: Accept match  
3. Both opportunities should move to **matched**  
4. Start negotiation → status **negotiating**

---

## Quick copy blocks

### Need title + description

```
UAT Need — BIM Architect for Riyadh tower

Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.
```

### Offer title + description

```
UAT Offer — BIM Architect delivery (Revit)

Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Cannot publish | Complete required readiness fields; ensure account is not pending vetting |
| Red tag on step 3 with fields filled | Confirm package **skills** + **deadline**; Expert years ≥ 5; dates not in the past |
| No match after publish | Confirm both are **published**, different users, same role `Architect`, skills `BIM`+`Revit`, cash task-based. Matching runs automatically on publish — no admin step required. If still empty, Admin → Matching → **Re-run matching** (recovery only; not circular-only) |
| Admin Matching empty after circular | Circular-only recovery does not create Need↔Offer `one_way` matches. Use **Re-run matching**, or re-publish |
| Same user both sides | Switch to the second account — same-owner matches are blocked |
| Old data noise | Admin → Environments → reset UAT, or use a clean browser profile |

---

## Related

- [uat-matching-one-way-script.md](./uat-matching-one-way-script.md) — One Way matching  
- [uat-matching-two-way-script.md](./uat-matching-two-way-script.md) — Two-Way matching  
- [uat-matching-group-script.md](./uat-matching-group-script.md) — Group Formation (consortium)  
- [uat-matching-circular-script.md](./uat-matching-circular-script.md) — Circular Exchange  
- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md) — index of all four  
- [uat-need-opportunity-script.md](./uat-need-opportunity-script.md) — full Need field tables  
- [uat-offer-opportunity-script.md](./uat-offer-opportunity-script.md) — full Offer field tables  
- [matching-workflow.md](../workflow/matching-workflow.md) — when matching runs  
- [opportunity-workflow.md](../workflow/opportunity-workflow.md) — status policy B  
- Demo credentials: `POC/docs/DEMO_CREDENTIALS.md`
