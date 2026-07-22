# UAT Manual Scripts — Need + Offer (Readiness & Matching)

Use these two fill scripts in **UAT** to create complementary opportunities by hand and demo:

1. **Opportunity readiness** (wizard stages, readiness drawer, publish gate)
2. **Matching redesign** (publish → auto-match → `new_match_found` → Matching workspace)

**Runtime:** UAT (`VITE_RUNTIME_MODE=uat` or your UAT URL). Data stays in this browser’s namespaced LocalStorage.

---

## Accounts (two different users)

| Role | Script | Login | Password |
|------|--------|-------|----------|
| Need owner | Script A | `khalid.alharbi@pmtwin.test` | `Pmtwin@2026` |
| Offer owner | Script B | `sara.almutairi@pmtwin.test` | `Pmtwin@2026` |

Use **Individual** account type if the login screen asks.

> Same user cannot match need ↔ offer to themselves. Always use two accounts.

---

## What you should see

### After Script A (Need) — before publish

- Wizard readiness stages fill as you complete Opportunity → Collaboration → Scope → Commercial → Review
- Readiness drawer / score moves up (aim for publish-ready ≥ ~80%)
- Save Draft → Opportunity Details shows filled fields + readiness presentation

### After both published

- Related / Matching workspace shows a **one_way** PostMatch
- Both users get **New match found** notification
- Match score reflects BIM / Architect / cash overlap

---

## Script A — Need (User: Khalid)

**Path:** Login as Khalid → **Create opportunity** / wizard → Intent **Need**

### Step 1 — Opportunity

| Field | Enter exactly |
|-------|----------------|
| Intent | **Need** |
| Title | `UAT Need — BIM Architect for Riyadh tower` |
| Description | `Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.` |
| Category / sector | `Construction` |
| Target role | `Architect` |
| Location | `Riyadh` (or Remote / Riyadh if both options exist) |
| Start date | `2026-08-01` |

### Step 2 — Collaboration

| Field | Enter exactly |
|-------|----------------|
| Main collaboration model | Cash subcontracting / `cash_subcontracting` |
| Model type | Project based |
| Sub-model | Task based |
| Exchange mode | Cash |
| Accepted modes | Cash only |

### Step 3 — Scope & work

| Field | Enter exactly |
|-------|----------------|
| Required skills | `BIM`, `Revit` (add both) |
| Services required | `BIM Coordination, Revit Modeling` |
| Detailed scope | `Design coordination for tower core and shell; BIM federation and clash reports` |
| Estimated duration | `6 months` |
| Timeline / tender | End or tender around `2026-11-01` if asked |

### Step 4 — Commercial

| Field | Enter exactly |
|-------|----------------|
| Budget min | `150000` |
| Budget max | `400000` |
| Currency | `SAR` |
| Payment schedule | `Milestone` |

### Step 5 — Recommended (for 100% readiness demo)

| Field | Enter exactly |
|-------|----------------|
| Preferred partner | Company |
| Attachments note | `design-brief.pdf` |
| Compliance | `Saudi Building Code` |
| Delivery milestone | `Concept design — 2026-09-01` |

### Actions to show readiness

1. Open **Readiness** drawer — stages complete, score high  
2. **Save Draft** → open Details → confirm fields + readiness UI  
3. **Do not publish yet** until Script B is ready (or publish Need first — match appears when Offer publishes)

---

## Script B — Offer (User: Sara)

**Path:** Logout → Login as Sara → **Create opportunity** / wizard → Intent **Offer**

### Step 1 — Opportunity

| Field | Enter exactly |
|-------|----------------|
| Intent | **Offer** |
| Title | `UAT Offer — BIM Architect delivery (Revit)` |
| Description | `Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.` |
| Category / sector | `Construction` |
| Target role | `Architect` |
| Location | `Riyadh` |
| Start date | `2026-08-01` |

### Step 2 — Collaboration

| Field | Enter exactly |
|-------|----------------|
| Main collaboration model | Cash subcontracting / `cash_subcontracting` |
| Model type | Project based |
| Sub-model | Task based |
| Exchange mode | Cash |
| Accepted modes | Cash only |

### Step 3 — Scope & work

| Field | Enter exactly |
|-------|----------------|
| Offered skills | `BIM`, `Revit` |
| Services offered | `BIM Coordination, Revit Modeling` |
| Detailed scope | `BIM federation, clash detection support, and Revit package delivery for tower projects` |
| Estimated duration | `6 months` |

### Step 4 — Commercial

| Field | Enter exactly |
|-------|----------------|
| Budget / fee min | `120000` |
| Budget / fee max | `350000` |
| Currency | `SAR` |
| Payment schedule | `Milestone` |

### Step 5 — Recommended

| Field | Enter exactly |
|-------|----------------|
| Preferred partner | Company |
| Attachments note | `portfolio.pdf` |
| Compliance | `Saudi Building Code` |
| Delivery milestone | `Delivery kickoff — 2026-09-15` |

### Actions to show readiness

1. Readiness drawer → high score  
2. Save Draft → Details readiness redesign  
3. **Publish** the Offer (and publish Need if still draft)

---

## Matching check (after both published)

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
| No match after publish | Confirm both are **published**, different users, same role `Architect`, skills `BIM`+`Revit`, cash task-based |
| Same user both sides | Switch to the second account — same-owner matches are blocked |
| Old data noise | Admin → Environments → reset UAT, or use a clean browser profile |

---

## Related

- [matching-workflow.md](../workflow/matching-workflow.md) — when matching runs  
- [opportunity-workflow.md](../workflow/opportunity-workflow.md) — status policy B  
- Demo credentials: `POC/docs/DEMO_CREDENTIALS.md`
