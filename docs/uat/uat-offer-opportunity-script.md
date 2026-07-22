# Script B — UAT Offer Opportunity (Readiness + Matching)

**Account:** `sara.almutairi@pmtwin.test` / `Pmtwin@2026` (Individual)  
**Intent:** Offer  
**Pairs with:** [Script A — Need](./uat-need-opportunity-script.md)

## Goal

Fill a publish-ready **Offer** that auto-matches Khalid’s Need. Use this to show **opportunity readiness**, then **matching redesign** after publish.

## Wizard values

### Opportunity
- Intent: **Offer**
- Title: `UAT Offer — BIM Architect delivery (Revit)`
- Description: `Offering BIM Architect services with Revit modeling and coordination for tower and mixed-use projects in Riyadh. Available for cash subcontracting engagements.`
- Sector: `Construction`
- Target role: `Architect`
- Location: `Riyadh`
- Start date: `2026-08-01`

### Collaboration
- Model: Cash subcontracting → Project based → Task based
- Exchange: Cash only
- Matching structure: One Way (auto-derived — do not select)

#### Collaboration Details (Task-based)
- Task Title: `BIM Architect — Revit delivery`
- Task Type: `Design`
- Detailed Scope: `BIM federation, clash detection support, and Revit package delivery for tower projects`
- Duration (days): `180`
- Required Skills: `BIM`, `Revit`
- Experience Level: `Senior`
- Start Date: `2026-08-01`
- Payment Terms: `Milestone-Based`

### Scope & Work

#### Requirements
- Skills Offered: `BIM`, `Revit`
- Services Offered: `BIM Coordination, Revit Modeling`
- Preferred partner type: `Company`
- Experience level: `Senior`
- Certifications: `LEED AP BD+C`
- Team size: `1`
- Minimum qualifications: `BIM Architect with Revit delivery on mixed-use / tower projects`
- Available capacity: `1` (Offer only — if capacity field is shown)

#### Work package (optional)
- Title: `Revit modeling & coordination`
- Description: `BIM federation support, clash detection, and Revit package delivery`
- Skills: `BIM`, `Revit`
- Deadline: `2026-09-15`

#### Deliverables (optional)
- `Revit model packages`
- `Clash detection support notes`
- `Coordination handoff pack`

#### Milestones
- Title: `Delivery kickoff`
- Due date: `2026-09-15`

#### Timeline & Location
- Preferred location / service area: `Riyadh`
- Availability from: `2026-08-01`
- Estimated duration: `6 months`
- Flexible start: Yes
- Weekend allowed: No
- Must finish before: `2026-12-31` (optional)
- Work mode: `Hybrid` (optional)

#### Documents & Compliance
- Attachments: `portfolio.pdf`
- Compliance requirements: `Saudi Building Code`
- Portfolio references: `Tower BIM coordination samples` (optional)

### Commercial Structure
- Exchange components: enable **Cash** only (do not enable Barter / Equity / Profit-sharing — keeps derived mode `cash`)
- Derived mode (auto): `cash`

#### Cash component
- Component title: `BIM Architect delivery fee`
- Applies to: `Entire opportunity`
- Currency: `SAR`
- Budget type: `Range`
- Fixed amount: leave blank (use Notes for range) — or enter mid estimate `235000` if a number is required
- Notes: `Fee range 120000 – 350000 SAR`
- Advance %: `10` (optional)
- Retention %: `5` (optional)
- Payment terms: `Milestone-Based`
- VAT handling: `15% VAT exclusive`
- Bank guarantee: leave blank (optional)

#### Payment schedule
1. Title: `Kickoff workshop` — `%`: `25` — Amount: `58750` (optional)
2. Title: `Mid delivery package` — `%`: `35` — Amount: `82250` (optional)
3. Title: `Final Revit / coordination handoff` — `%`: `40` — Amount: `94000` (optional)

#### Commercial constraints (optional)
- Type: Budget ceiling — Label: `Fee ceiling` — Value: `350000`

### Recommended (100% readiness)
Fill under Scope & Work:
- Preferred partner: `Company`
- Attachment: `portfolio.pdf`
- Compliance: `Saudi Building Code`
- Milestone: `Delivery kickoff — 2026-09-15`

## Demo steps
1. Logout Khalid → login Sara  
2. Create → fill fields above  
3. Show readiness drawer / Details readiness  
4. **Publish** Offer (and Need if still draft)  
5. Check Matching workspace + bell: **New match found** (one_way)

## Matching verify
| Check | Expected |
|-------|----------|
| Match type | one_way |
| Role / skills | Architect + BIM/Revit |
| Notifications | Both users |
| Opp status after discover | still `published` |
| After both Accept | `matched` |

Full walkthrough: [manual-need-offer-readiness-matching-scripts.md](./manual-need-offer-readiness-matching-scripts.md)
