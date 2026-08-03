# UAT Matching — Final four-type checklist

**Purpose:** End-to-end UAT after Target Role publish gate, canonical multi-location (Primary + Coverage Areas), coverage-aware location scoring, and matching diagnostics.  
**Do not rely on unit tests alone** — run these scenarios in the UAT runtime.

**Runtime:** UAT · Password `Pmtwin@2026`  
**Admin:** Matching → recent runs → **View** diagnostics  
**Shared gates:** Target role required to publish · Title is never used for role matching · Location is soft-scored (no hard city reject) · Primary location is a **canonical picker** · Coverage Areas / Available In is optional multi-select

Detailed field scripts: [four-types index](./uat-matching-four-types-examples.md)

---

## Shared pre-checks (once)

| # | Check | Expected |
|---|--------|----------|
| P1 | Publish opportunity with empty Target role | **Blocked** — clear Target role message |
| P2 | Publish with title containing a role but no Target role | Still **blocked** |
| P3 | Admin → Matching after any publish / Re-run | Diagnostics panel shows scanned / rejected / matched |
| P4 | Opportunity step: Primary location is a searchable picker (not free text); Coverage Areas is multi-select chips | Can select **Riyadh City**, **Dammam**, **Nationwide — Saudi Arabia**, **GCC**, **Remote** |

---

## 1. One-Way — Riyadh ↔ Dammam

**Scripts:** [uat-matching-one-way-script.md](./uat-matching-one-way-script.md)  
**Accounts:** Khalid (Need) · Sara (Offer)

| Step | Action | Prediction |
|------|--------|------------|
| 1 | Follow one-way script but set Need **Primary location = Riyadh City**, Offer **Primary location = Dammam** (Coverage Areas empty; same Target role `Architect`, skills `BIM`+`Revit`, cash) | Posts publish |
| 2 | Wait for auto-match (or Admin → **Re-run matching**) | **PostMatch created** (`one_way`) |
| 3 | Open match / notifications | **New match found** for both |
| 4 | Admin → Matching → diagnostics for the run | Candidate **matched**; location tier **Same Country** (~0.75); reject list empty or unrelated |
| 5 | Optional: Need Coverage Areas = **Nationwide — Saudi Arabia** + Offer Dammam | Location tier **Nationwide** (full location fit) |
| 6 | Optional: Offer Primary = **Dubai**, Coverage Areas includes **Riyadh City**, Need = **Riyadh City** | Location tier **Coverage Overlap** (full location fit) |

**Pass criteria:** Match + Diagnostics + Notification

---

## 2. Two-Way — mutual Need↔Offer

**Scripts:** [uat-matching-two-way-script.md](./uat-matching-two-way-script.md)  
**Accounts:** Khalid (Party A Need+Offer) · Sara (Party B Need+Offer)

| Step | Action | Prediction |
|------|--------|------------|
| 1 | Publish all four posts per two-way script (Target role filled on every post) | All published |
| 2 | Auto-match or Admin **Re-run matching** | **`two_way` PostMatch** |
| 3 | Admin diagnostics | Candidates evaluated; matched pair present; reject reasons if any direction fails role/skills/threshold |
| 4 | Both parties Accept | Match `confirmed` |

**Pass criteria:** Match + Diagnostics

---

## 3. Consortium — three or more parties

**Scripts:** [uat-matching-group-script.md](./uat-matching-group-script.md)  
**Accounts:** Al Riyadh Construction (lead Need + roles) · Khalid (Architect Offer) · Hala (Structural Offer)

| Step | Action | Prediction |
|------|--------|------------|
| 1 | Publish lead Need with member roles + partner Offers (Target role on each Offer) | All published |
| 2 | Auto-match or Admin **Re-run matching** | **`consortium` PostMatch** with roles filled |
| 3 | Admin diagnostics | Per-offer / role-slot checks; unfilled roles show `ROLE_UNFILLED` if a partner is missing |
| 4 | All participants Accept | Match `confirmed` |

**Pass criteria:** Consortium Match + Diagnostics

---

## 4. Circular — A → B → C → A

**Scripts:** [uat-matching-circular-script.md](./uat-matching-circular-script.md)  
**Accounts:** Omar · Layla · Faisal (each Need + Offer)

| Step | Action | Prediction |
|------|--------|------------|
| 1 | Publish all six posts per circular script (Target role on each) | All published |
| 2 | Circular pass on publish and/or Admin **Re-run circular** | **`circular` PostMatch** for ring A→B→C→A |
| 3 | Admin → Matching (circular run) → diagnostics | Edge candidates scored; reject reasons for broken edges; audit row has diagnostic summary |
| 4 | All three Accept | Match `confirmed` |

**Pass criteria:** Circular Match + Diagnostics + Audit

---

## Sign-off matrix

### Automated verification (2026-08-03)

Filled from the `npm run test` pass at commit `b869e61` + UAT stabilization changes — 1454 tests / 377 suites, 0 failures. Pass means the behaviour is asserted by a suite in CI, not that a human ran the script.

| Type | Match | Diagnostics | Notification | Audit row | Evidence |
|------|-------|-------------|--------------|-----------|----------|
| One-Way (Riyadh↔Dammam) | Pass | Pass | Pass | Pass | `publish-matching.test.ts`, `matching-diagnostic-summary.test.ts`, `lifecycle-notifications.test.ts`, `opportunity-location-match.test.ts` |
| Two-Way | Pass | Pass | Pass | Pass | `four-match-types-parity.test.ts` (quorum + full lifecycle + notifications), `matching-service.test.ts` |
| Consortium | Pass | Pass | Pass | Pass | `four-match-types-parity.test.ts` (consortium lifecycle), `matching-service.test.ts` |
| Circular | Pass | Pass | Pass | Pass | `circular-matching.test.ts`, `four-match-types-parity.test.ts` (circular quorum + lifecycle) |

Match expiry on Close/Archive (all four types share the one code path):

| Behaviour | Result | Evidence |
|-----------|--------|----------|
| Open matches expire on Close / Archive | Pass | `opportunity-command-handler.test.ts` — close/archive match sync |
| Confirmed matches untouched | Pass | `opportunity-command-handler.test.ts` — close/archive match sync |
| `match_expired` to both participants, closed vs archived copy | Pass | `opportunity-command-handler.test.ts` — match expiration notifications |
| No duplicate notification on repeat Close | Pass | `opportunity-command-handler.test.ts` — match expiration notifications |
| Accept blocked after expiry | Pass | `post-match-command-handler.test.ts` |
| Opportunity leaves the matching pool | Pass | `uat-one-way-findings.test.ts` |
| End-to-end in the browser (Scenarios 1–3) | Pass | `web/e2e/uat-match-expiration.spec.ts` — 3 specs, part of a 5-spec Playwright run |

### Manual runtime sign-off

Still required for the visual / diagnostics surfaces that automation does not assert (Admin diagnostics panel rendering, RTL, cross-city scoring tiers).

| Type | Match | Diagnostics | Notification | Audit row |
|------|-------|-------------|--------------|-----------|
| One-Way (Riyadh↔Dammam) | ☐ | ☐ | ☐ | ☐ |
| Two-Way | ☐ | ☐ | ☐ (if product notifies) | ☐ |
| Consortium | ☐ | ☐ | ☐ (if product notifies) | ☐ |
| Circular | ☐ | ☐ | ☐ (if product notifies) | ☐ |

**Tester:** _________________ **Date:** _________________ **Build / env:** _________________

---

## Related

- [uat-matching-four-types-examples.md](./uat-matching-four-types-examples.md)
- [uat-matching-one-way-script.md](./uat-matching-one-way-script.md)
- [uat-matching-two-way-script.md](./uat-matching-two-way-script.md)
- [uat-matching-group-script.md](./uat-matching-group-script.md)
- [uat-matching-circular-script.md](./uat-matching-circular-script.md)
- [matching-engine.md](../matching-engine.md)
