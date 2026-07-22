# Script A — UAT Need Opportunity (Readiness + Matching)

**Account:** `khalid.alharbi@pmtwin.test` / `Pmtwin@2026` (Individual)  
**Intent:** Need  
**Pairs with:** [Script B — Offer](./uat-offer-opportunity-script.md)

## Goal

Fill a publish-ready **Need** that will auto-match Sara’s Offer after both are published. Use this to show **opportunity readiness** UI before publish.

## Wizard values

### Opportunity
- Intent: **Need**
- Title: `UAT Need — BIM Architect for Riyadh tower`
- Description: `Need a BIM-capable Architect for coordination and Revit delivery on a mixed-use tower in Riyadh. Scope includes model federation, clash detection handoff, and design packages.`
- Sector: `Construction`
- Target role: `Architect`
- Location: `Riyadh`
- Start date: `2026-08-01`

### Collaboration
- Model: Cash subcontracting → Project based → Task based
- Exchange: Cash only
- Matching structure: One Way (auto-derived — do not select)

#### Collaboration Details (Task-based)
- Task Title: `BIM Architect — tower coordination`
- Task Type: `Design`
- Detailed Scope: `Design coordination for tower core and shell; BIM federation and clash reports`
- Duration (days): `180`
- Required Skills: `BIM`, `Revit`
- Experience Level: `Senior`
- Start Date: `2026-08-01`
- Payment Terms: `Milestone-Based`

### Scope & Work

#### Requirements
- Skills Required: `BIM`, `Revit`
- Services Required: `BIM Coordination, Revit Modeling`
- Preferred partner type: `Company`
- Experience level: `Senior`
- Certifications: `LEED AP BD+C` (optional)
- Team size: `1–2`
- Minimum qualifications: `5+ years BIM coordination on towers; Revit proficiency`

#### Work package (optional)
- Title: `BIM federation & clash package`
- Description: `Model federation, clash detection, and coordination reports for core and shell`
- Skills: `BIM`, `Revit`
- Deadline: `2026-09-01`

#### Deliverables (optional)
- `Federated BIM model`
- `Clash detection report`
- `Design coordination package`

#### Milestones
- Title: `Concept design`
- Due date: `2026-09-01`

#### Timeline & Location
- Location: `Riyadh`
- Start date: `2026-08-01`
- Deadline: `2026-12-31`
- Estimated duration: `6 months`
- Flexible start: No
- Weekend allowed: No
- Must finish before: `2026-12-31` (optional)
- Work mode: `Hybrid` (optional)

#### Documents & Compliance
- Attachments: `design-brief.pdf`
- Compliance requirements: `Saudi Building Code`
- Portfolio references: (optional)

### Commercial Structure
- Exchange components: enable **Cash** only (do not enable Barter / Equity / Profit-sharing — keeps derived mode `cash`)
- Derived mode (auto): `cash`

#### Cash component
- Component title: `BIM Architect cash engagement`
- Applies to: `Entire opportunity`
- Currency: `SAR`
- Budget type: `Range`
- Fixed amount: leave blank (use Notes for range) — or enter mid estimate `275000` if a number is required
- Notes: `Budget range 150000 – 400000 SAR`
- Advance %: `10` (optional)
- Retention %: `5` (optional)
- Payment terms: `Milestone-Based`
- VAT handling: `15% VAT exclusive`
- Bank guarantee: leave blank (optional)

#### Payment schedule
1. Title: `Kickoff / mobilisation` — `%`: `20` — Amount: `55000` (optional)
2. Title: `Concept design package` — `%`: `40` — Amount: `110000` (optional)
3. Title: `Final coordination handoff` — `%`: `40` — Amount: `110000` (optional)

#### Commercial constraints (optional)
- Type: Budget ceiling — Label: `Budget ceiling` — Value: `400000`

### Recommended (100% readiness)
Fill under Scope & Work:
- Preferred partner: `Company`
- Attachment: `design-brief.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Concept design — 2026-09-01`

## Demo steps
1. Create → fill fields above  
2. Open readiness drawer — show rising score / complete stages  
3. Save Draft → Details readiness redesign  
4. Publish after Script B is ready (or publish first; match appears when Offer publishes)

Full walkthrough: [manual-need-offer-readiness-matching-scripts.md](./manual-need-offer-readiness-matching-scripts.md)
