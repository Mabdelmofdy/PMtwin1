# PMTwin stakeholder report

## Requirements, implementation, and UAT position

**Review date:** 3 October 2026  
**Audience:** Company and project stakeholders, product, engineering, and UAT  
**Status of the product:** Implemented and in user acceptance testing. This is not a pre-development review.  
**Repository inspected:** local `main` at `d113b3b9a4da198d7c2f872d465b805730e1ce55` (30 September 2026)  
**Deployed UAT version:** Deployed UAT version not verified.

---

## 1. Executive summary

PMTwin is a construction collaboration marketplace. Users post what they need and what they offer, choose a collaboration model, publish, and receive matches that can proceed through negotiation, commercial agreement, and contract. That product exists today as a web application. UAT is running on browser storage, not on the unfinished server scaffold.

The original January 2025 framework asked for a bidirectional Need and Offer marketplace, five collaboration families, four matching types, and five exchange modes. A later detailed specification names thirteen sub-models, including Co-Ownership Pooling. The current registry also has thirteen stored sub-models, but it is not the same list: Co-Ownership Pooling has no key, and Equipment Sharing was added. The August 2026 company and individual workbooks propose eight company cards and three individual cards, with new fields, a different commercial matrix, and different matching labels. Those workbooks are a proposal. No statement of work, signed baseline, or change approval was in the files reviewed. A filename, a file date, or the current code does not prove client approval.

UAT is not blocked by an empty product. It is blocked by two open business decisions and by unresolved scope if the new wireframes are to be built. The handover records fifteen issues as verified and two as waiting on a client decision: whether a cash negotiation offer must include a payment schedule before it is sent, and whether an agreement may be completed while its related contract is still active. This review read the code that implements those rules. It did not repeat the browser pass and did not re-run the automated suites. Those fifteen items are therefore not re-certified here.

The wireframes change both the interface and the business rules. Some cards can sit on top of the current domain if the stored sub-models remain. Replacing the domain, enabling cash on Strategic JV or SPV, limiting individuals to three models, linking posts across different models, or changing the match formula would change who can publish and who can match. Those items need a decision before they are estimated as delivery work.

Of the 60 material rows in the traceability workbook:

| Classification | Rows |
| --- | ---: |
| 1. Implemented and verified in this review | 0 |
| 2. Implemented, with code evidence, not re-tested in this review | 20 |
| 3. Partially implemented original requirement | 8 |
| 4. Original requirement not found in the reviewed implementation | 2 |
| 5. Defect against a confirmed requirement | 0 |
| 6. Documented approved deferral | 0 |
| 7. Clarification or conflicting specifications | 21 |
| 8. Proposed change requiring scope confirmation | 9 |
| 9. Approved change request | 0 |

Class 1 is zero because this review did not execute the test suite or the UAT browser scripts. Class 2 means the behaviour is present in the source reviewed on 3 October 2026. Class 5 is zero because no previously verified issue was shown to be broken again. Class 9 is zero because no change request in the set carries approval evidence. Absence of an approved deferral means missing original items stay open; they are not automatically cancelled and they are not automatically chargeable changes.

**Decisions required before UAT can close on the agreed product**

1. Confirm or change the cash negotiation payment schedule (ISS-13).
2. Confirm or change agreement completion while a contract is active (ISS-14).
3. Confirm that the live five-family, thirteen-key domain remains the acceptance baseline unless a specific change is approved.

**Decisions required before the August 2026 wireframes become work**

4. Presentation over the current keys, or replacement of those keys.
5. Fate of Consortium, Project JV, SPV, Strategic JV, Strategic Alliance, and Competition/RFP.
6. One commercial matrix, including Custom and the cash exclusion on SPV and Strategic JV.
7. Whether company posts may be one-sided.
8. Individual creation rights versus response rights.
9. Whether the January score example replaces the live weights.
10. Whether a barter link may cross models.
11. Whether scheduled publish, GeoNames, and the new readiness formula are in scope.

No delivery commitment is made. Effort ranges in section 13 are engineering sizing for after those decisions. They are not a quotation.

---

## 2. Review scope and evidence limitations

### 2.1 What was reviewed

- Repository `D:/Cursor/PM-Twin MVP - saleh -live`, branch `main`, aligned with `origin/main`.
- Commit `d113b3b9a4da198d7c2f872d465b805730e1ce55`, message `feat(server): establish PM-Twin backend foundation scaffold`, authored 30 September 2026. The previous wireframe review cited this same commit. It is the current local tip. It is not evidence of what is deployed.
- Git history from the earliest commit on 25 January 2026 through 30 September 2026 (206 commits). No tags were present.
- `PMTwin-Need&Offer Framework-Matching Mechanizim-10Jan2025.pdf` (10 pages, text extracted).
- `web/pmtwin_collaboration_models_final.docx` (23 December 2025). The repository markdown conversion of the same title was compared with it. Both name the same thirteen sub-models, and section 3.2 lists the same co-ownership attributes.
- `PMTwin Matching Wireframes-10Aug2026 - Companyflow.xlsx` (42 worksheets).
- `PMTwin Matching Wireframes-10Aug2026-Indivadual.xlsx` (23 worksheets). The filenames requested with a `(1)` suffix were not found. These unsuffixed files were reviewed.
- `PM-Twin_Project_Master_Context_Handover.docx`.
- `PM-Twin_Wireframes_Core_CR_Review.docx`, dated 30 September 2026. Treated as secondary. Its CR table has no person-day estimates and does not use the labels CR-01a, CR-05a, or CR-07a. This review splits those packages so the decisions can be taken separately.
- Internal BRD, runtime ownership, UAT logs, lifecycle manifest, collaboration registry, matching engine, commercial validation, and the server scaffold README.
- Selected implementation files at the commit above. Line-level citations are in the traceability workbook.

### 2.2 What was not available

- A signed statement of work, approved proposal, requirements baseline, change log, or meeting decision record.
- `PMTwin_UAT_and_Matching_Requirements_Review.docx` was not found. The collaboration-models Word file was found in `web/` and agrees with the specification text used in this report.
- Walid’s email body. The user described it as presenting eight company models, three individual models, and the workbook field lists. The workbooks match that description. The email itself was not reviewed, so it is not treated as approval.
- The exact `(1)` workbook copies. If they differ from the files reviewed, the cell references in this report apply only to the files named above.
- Deployment records, release tags, and a UAT environment URL tied to a commit.

### 2.3 What this review did not do

- No application code, configuration, dependency, seed, or workbook was modified.
- No commit, push, merge, deploy, or migration was run.
- No UAT data was changed and no message was sent.
- Workbook formulas were read. They were not recalculated in Excel.
- Automated tests were not executed. Browser UAT was not repeated.
- The working tree before this review was clean on `main`. The only new files are this review directory.

### 2.4 How to read the classifications

A feature can be original scope and still touch matching, money, or lifecycle. Technical impact and commercial treatment are separate. “Proposed” means the client has not approved it in the evidence set. “Not chargeable yet” means the same thing: engineering effort is described so it can be planned, not invoiced.

---

## 3. Project history and major milestones

Approval status below is based on the documents in hand. “In repository” is not “approved by the client.”

| Date | Requirement or decision | Source and approval | Related commit or release | Effect | Verification | Uncertainty |
| --- | --- | --- | --- | --- | --- | --- |
| 10 Jan 2025 | Bidirectional Need/Offer, five families, headline of 15 models, five exchange modes, four match types, example score 40/30/15/10/5 | PDF. No signature page | None in this repo | Design baseline | Text extracted from all 10 pages | The 15 models are not named. The score is an example totalling 82% |
| 23 Dec 2025 file date | Thirteen sub-models, including Co-Ownership Pooling, with attributes and relationship tables | `web/pmtwin_collaboration_models_final.docx`. Filename says final. Approval not found | Present in the repository | Intended schema, wizard, and matching inputs | Section 3.2 read in the Word file and the markdown conversion | Approval of the file is still not evidenced |
| 25 Jan 2026 | First repository commit | Internal | `378ea62` | Project enters version control | Git history | Does not prove a client kickoff |
| 5 Mar 2026 | Matching workflow added to the legacy app | Internal commit message | `926a653` | Early matching | Not re-tested | POC is now frozen |
| 10 Mar 2026 | Internal BRD and workflows committed | `BRD/08_Business_Requirements_Document.md`. Not a signed SOW | `3e8be32` | States four post-to-post routes and defers payments, binding signatures, full disputes, and external KYC | Document read | BRD date line says 2025-03-07 |
| Jun 2026 | Runtime ownership: `web/` is the product, `packages/` hold shared logic, `POC/src` is frozen | `docs/runtime-ownership.md` | Internal architecture | New behaviour goes through the web command gateway | Document read | Not a client change request |
| Jul–Aug 2026 | Matching, timeline, coverage, and close/archive behaviour tightened | Internal commits | Including `b869e61` on 3 Aug 2026 | UAT findings log of that date covers a different issue set (match expiry and wizard taxonomy) | Log read. Tests not re-run | That log’s “verified” is not the ISS-01–17 list |
| 10 Aug 2026 | Filename date of the company and individual wireframes | Workbooks. Approval not found | None | Proposed UI and rule changes | 42 and 23 sheets inspected | File-system timestamp is 30 Sep 2026. That is not an approval date |
| 3 Aug 2026 | Internal UAT completion note for match expiry | `docs/uat/uat-final-completion-report.md` at `b869e61` | `b869e61` | Event-driven match expiry | Historical | Different from the later ISS list |
| 10 Sep 2026 | Category scoring, rematch, timeline UTC | Commits `a61b680`, `85d5e40`, `50d684c` | Those SHAs | Hard model check, category bonus, inclusive timeline | Code read | Weight change versus the PDF was not approved in the files reviewed |
| 30 Sep 2026 | UAT matching and deal-flow fix commit, then a server scaffold commit | Internal | `5be41ac` then `d113b3b` | Web fixes, then an API scaffold that the web app does not call | Code and server README read | Which of these, if either, is deployed is unknown |
| 30 Sep 2026 | Handover: 15 UAT items verified, ISS-13 and ISS-14 open. Wireframe CR review issued | Internal documents | Same commit cited | Sets the UAT conversation and a proposed CR split | Documents read. Browser pass not repeated | Customer reply on ISS-13 and ISS-14 was not in the file set |
| 3 Oct 2026 | This review | Evidence listed in section 2 | HEAD unchanged | Report and matrix only | Source inspection | Deployed UAT version not verified |

The product path in the repository is: a January 2025 concept, a detailed thirteen-model specification, a legacy proof of concept, a move of the live product into `web/` and `packages/`, a long UAT fix cycle, and a proposal in August 2026 to present fewer cards and richer fields. The August proposal has not replaced the domain.

---

## 4. Original requirements and subsequent decisions

### 4.1 What the January 2025 PDF requests

The PDF is a ten-page framework, not a field dictionary.

- Needs and Offers are equal posts. A need is “I am seeking.” An offer is “I can provide.”
- Attributes are semantically mirrored. Required skills correspond to available skills. Budget corresponds to rate.
- Five main collaboration families and a headline of fifteen collaboration models, from task engagements to SPVs and strategic JVs. The fifteen are not listed.
- Five exchange modes: Cash, Equity, Profit-Sharing, Barter, and Hybrid. The examples include milestones, a 40% equity contribution, a 60/40 profit split, office space for engineering, and an SPV mix of cash, equity, and barter.
- Selecting Barter opens an offer register. The user can link one need to multiple offers.
- Four matching types: one-way, two-way dependency, group formation, and circular exchange.
- The one-way example scores attribute overlap 40%, budget fit 30%, timeline 15%, location 10%, and reputation 5%, shown as 82%. The page does not say this is the only legal formula, and it does not say it is only an illustration.
- Group formation is one need with multiple offers, with use cases for consortium, bulk purchasing, co-ownership pooling, and resource sharing.
- Circular exchange is three or more parties. The example is office space, an excavator, and accounting services, with no cash.
- The journey is sign-in, post, model, sub-model, attributes, system matching, comparison, negotiation, agreement, and follow-up, for companies and individuals.

### 4.2 What the detailed specification adds

The specification organises five families and thirteen sub-models:

1. Task-Based Engagement, Consortium, Project-Specific Joint Venture, SPV.
2. Strategic Joint Venture, Long-Term Strategic Alliance, Mentorship.
3. Bulk Purchasing, Co-Ownership Pooling, Resource Sharing and Exchange.
4. Professional Hiring, Consultant Hiring.
5. Competition/RFP.

Mentorship is mostly individual, and company-to-company mentorship is marked limited, not forbidden. Co-ownership is specified in section 3.2 as joint purchase and scheduled use of equipment or facilities, with required commercial and exit fields. It is not specified as a property-investment or company-share product.

The PDF’s “15” and the specification’s “13” are unresolved. Two named models were not found to explain the difference. Neither document cancels the other.

### 4.3 What was not found as an approved decision

- No approval to replace Co-Ownership Pooling with Equipment Sharing.
- No approval to adopt the live weights 25/20/20/10/10/10/5, the 50% threshold, or the category bonus.
- No approval of the August 2026 cards, matrices, readiness formula, or scheduled publish.
- No client answer to ISS-13 or ISS-14.
- No approved change request. The 30 September review proposed packages. It did not approve them.

Internal documents do record engineering choices: revenue sharing as a component, hybrid derived from multiple components, localStorage as the UAT store, and a warning not to change accepted or confirmed matches without a product decision. Those are the current build. They become the acceptance baseline only if the client accepts the UAT system as built.

---

## 5. Current architecture and verified UAT baseline

### 5.1 Runtime

The active product is the `web/` React application. Shared rules live in `packages/` (`lifecycle`, `commands`, `matching`, `collaboration-models`, `validation`). `POC/src` is a frozen legacy reference. Seed JSON is read-only at runtime. User changes go to browser storage under `pmtwin_web_overrides`, with `PMTWIN_DEMO_` and `PMTWIN_UAT_` prefixes for those environments.

The `server/` folder is a local scaffold. Its README states that the SPA is not wired to it, that `VITE_USE_SERVER_API` must stay off, and that the command route returns HTTP 501. Login and a few reads exist on that scaffold. It does not run UAT matching or publishing.

There is no release tag and no workflow in the repository that identifies a deployed commit. **Deployed UAT version not verified.** Local `main` and `origin/main` both point at `d113b3b` as of this review. That fact must not be read as the UAT release.

### 5.2 What the UAT build actually does

- A five-step wizard: opportunity, collaboration, scope and work, commercial structure, review and publish.
- Stored intents: need, offer, and hybrid. The create draft used by the wizard is need or offer.
- Five main keys: `cash_subcontracting`, `service_exchange`, `joint_venture`, `resource_sharing`, `hiring`.
- Thirteen sub-model keys, listed in section 6.
- Exchange modes: cash, barter, equity, profit sharing, hybrid. Revenue sharing and custom are components. Hybrid is derived.
- Match engines: one-way, two-way, consortium, and circular (minimum cycle length 3).
- Match states: discovered, accepted, confirmed, declined, expired, superseded.
- Publish gate: every core required field, and a readiness score of at least 80 from 80% required-field ratio plus 20% recommended-field ratio.
- Marketplace cards hide commercial amounts.
- Close or archive expires discovered and accepted matches and leaves confirmed matches. A later edit can run matching again when the matching fingerprint changes. Accepted, confirmed, and negotiation records are not rewritten by that path.

UI behaviour and stored behaviour are not the same. The wizard can show a label that the matching engine does not use. A workbook label is neither.

---

## 6. Requirement-to-implementation findings

The full row set is the workbook `PMTwin-UAT-Requirements-Traceability-2026-10-03.xlsx`, sheet `Traceability`. This section states the findings that change scope or UAT closure.

### 6.1 Collaboration models

The new cards do not have to replace the domain. They can be a guided view if every card still writes one or more existing keys, and if keys with no card remain available or are explicitly retired.

| Proposed card | Can it keep the current domain? | What must not be assumed |
| --- | --- | --- |
| JV | Yes, as a router among `consortium`, `project_jv`, `spv`, and `strategic_jv` | One commercial row for all four. Cash is legal on project JV and excluded on SPV and strategic JV |
| Co-ownership | Only partly, through `equipment_sharing` | A new key is required if real estate and company stakes are in scope. Section 3.2 is already an original gap |
| Resource Sharing | Yes, across `resource_sharing` and `equipment_sharing`, including the pooling variant | Pool member limits are data. They are not a booking or settlement system |
| Resource Exchange | Yes, as a variant of `resource_sharing` or `equipment_sharing` | A new key is a migration, not a label change |
| Bulk Purchasing | Yes, key `bulk_purchasing` | Barter is excluded today. The suggested matrix would allow it as an edge case |
| Task-based Collaboration | Yes, key `task_based` | The workbook’s two-way label is eligibility, not proof of a match. The registry topology is one-way |
| Hiring | Yes, if `professional_hiring` and `consultant_hiring` stay separate underneath | Merging them merges different barter and company rules |
| Mentorship | Yes, key `mentorship` | Company-to-company mentorship was limited in the specification, removed in code, and broadened in the workbook |

**Consortium** remains a company, multi-party, B2B sub-model. It is not named as its own card.  
**Project JV** remains a company sub-model with equity, profit sharing, hybrid, and cash, plus a capital contribution field.  
**SPV** remains company-only. Cash is not an allowed exchange mode. The workbooks also offer “SPV” and “Special Purpose Vehicle” as two entity labels.  
**Strategic JV** remains company-only and excludes cash. That is the ISS-15 rule.  
**Strategic Alliance** has no card. Omission is not retirement.  
**Competition/RFP** has no card. Omission is not retirement.  
**Professional Hiring** is company-created, B2P and P2B, cash and hybrid.  
**Consultant Hiring** allows B2B and barter. Deliverables are a tag attribute. The review screen’s structured deliverable count can stay at zero when the tag is saved. That was the ISS-17 explanation, and the save path is present in `draft-model.ts`.

### 6.2 Co-ownership

Section 3.2 requires an asset description and type, purchase price, ownership structure, number of co-owners, equity per owner, initial investment, ongoing costs, cost sharing, usage schedule, location, maintenance responsibility, insurance, exit strategy, and dispute resolution. Matching criteria in that section are financial capacity, usage fit, distance, reliability, and maintenance capability.

Implemented on `equipment_sharing`: description, type, location, availability, and a usage-terms list whose options are Rotation, Booking System, and Priority by Ownership %. The words “Booking System” record a rule. They do not create a calendar, a reservation ledger, or a payment. Purchase price, owner count, equity, investment, ongoing costs, insurance, exit, and dispute fields were not found. No co-ownership match metric was found.

The workbook card goes further into real estate, land, companies, and SPVs. That is a proposed widening of section 3.2, which is about shared equipment and facilities. Recording those commercial terms at publish time is still not the same as executing a purchase or a settlement. The internal BRD already places payment settlement outside the current phase.

### 6.3 Need and Offer

The PDF requires both sides as first-class posts and semantic mirroring. The product stores `need`, `offer`, and `hybrid`. The wizard draft type used for creation is need or offer. Skills are stored as `requiredSkills` or `offeredSkills`. The framework’s display name “available skills” is a label, not the stored field.

Four different shapes are in play:

| Shape | Where it is defined | What the product does |
| --- | --- | --- |
| Need only | PDF; workbook Step 1 | Supported as an intent |
| Offer only | PDF; workbook Step 1 | Supported as an intent |
| Both sides on one opportunity | Workbook “Need & Offer”; domain value `hybrid` | Domain allows it. The wizard command path does not send hybrid. Company Step 3 text requires both sides even when Step 1 does not |
| Separate linked posts | PDF pages 4 and 9; workbook A23 for different models | The engine can find many offers for one need. A user-managed link was not found |

Company Step 3 forms for JV, co-ownership, sharing, exchange, bulk purchasing, task-based work, hiring, and mentorship say both sides are required. Step 1 says a single-sided post is allowed and that a complementary post is only a suggestion. Those instructions cannot both be built. Individual forms follow the side the user selected.

Hiring needs four meanings: a company demanding a person, a company offering a role or compensation, a professional offering expertise, and a professional seeking an engagement. Compensation in the current product is a commercial component on the opportunity. It is not automatically a second Offer post. The company hiring form’s offer fields ask for discipline, experience, and visa-related information, which reads as the professional’s side, while the introduction says the company is offering compensation. Two needs that both say Hiring must not match each other.

Limiting individuals to three cards would remove their ability to create other models. It would not, by itself, remove their ability to respond to a company post, lead a group, or accept a match. Those four permissions need separate answers. Mentorship’s original “limited B2B” relationship is not a new idea. The code dropped it. The workbook expands it.

### 6.4 Matching policy

| Rule | PDF | Current code | Approval found |
| --- | --- | --- | --- |
| Attribute or skill | 40% in the example | Skill 25%. Attribute overlap remains as a 25% alias, not a second added term | No |
| Exchange compatibility | Not in the example | 20% | No |
| Value compatibility | Not in the example | 20% | No |
| Budget | 30% | 10% | No |
| Timeline | 15% | 10%. Inclusive overlap days divided by the need window. Missing dates score 0. Disjoint dates score 0 | No |
| Location | 10% | 10% | No |
| Reputation | 5% | 5% | No |
| Category | Not in the example | Bonus of category score times 5%, added after the weights, then the total is capped at 1 | No |
| Threshold | Not stated. The example result is 82% | 50%, plus a 50% skill floor when required services exist | No |
| Model compatibility | Same model family is implied by the wizard | Hard rejection when both sides have model or sub-model tokens and none are shared. Empty tokens do not reject | No |
| Role | Not stated as a hard gate | Exact role match when strict settings are on. Missing role rejects | No |
| Self-match | Not stated | Same creator is excluded. Company persistence also drops same-party pairs | No |
| Missing dates as a filter | Not stated | The candidate overlap check allows a pair with no dates. The score still contributes 0 | No |

The original formula is neither proven illustrative nor proven mandatory. UAT-26 in the August findings log records the split and asks for a product decision. That log is internal.

Proposed workbook fields should be tagged before build:

- **Informational:** title, short description, barter balance label, “to be agreed.”
- **Eligibility:** model key, party type, required role, publish state, self-match.
- **Score factor:** skills, exchange, value, budget, timeline, location, reputation, and category only while the current profile stands.
- **Preference:** language, credentials, and soft category choices, unless a decision promotes one of them to eligibility.

Readiness is a publish gate. It is not a match score.

### 6.5 Matching types and barter

One-way, reciprocal two-way, group formation, and circular matching all exist in the engine. A workbook cell that says “Type 4 — highest match value” does not create a match and does not raise the score. Company Step 2-Lists Q9 labels a Resource Exchange post with both sides as Type 4. The PDF’s Type 4 is a cycle of at least three parties. A two-party swap is two-way. Circular routing is added for `resource_sharing` and `equipment_sharing` only, and a cycle shorter than three is discarded.

The office, excavator, and accounting example can work only when the three posts are compatible on sub-model and role. If accounting is posted as task-based or consultant hiring, and the excavator is posted as equipment sharing, the hard model check rejects the pair. The example therefore does not succeed under today’s classification unless all three posts are placed in compatible sharing sub-models. That is a gap against the example, not proof that circular matching is absent.

Linking one need to many offers is already in the PDF. The engine’s candidate list is the automatic form of that idea. The user-facing register is not built. The workbook sentence that says to create two posts when the models differ, and to link them at Step 4, is a different proposal. It would bypass the hard model rule. It needs its own decision.

### 6.6 Commercial structure

| Mechanism | PDF | Registry | Company workbook live matrix | Individual workbook live matrix |
| --- | --- | --- | --- | --- |
| Cash | Mode | Mode, with model exceptions | Valid on most cards, edge case on Resource Exchange | Valid on the three cards |
| Barter | Mode | Mode, with model exceptions | Hidden on Co-ownership and Bulk Purchasing | Valid or edge case on the three cards |
| Equity | Mode | Mode on JV family | Valid on JV, Co-ownership, and company Mentorship | Edge case on the three cards |
| Profit sharing | Mode | Mode on JV family | Valid on JV; edge case elsewhere; hidden on Resource Exchange | Hidden on Mentorship; edge case on the other two |
| Revenue sharing | Not a named mode | Component, can derive hybrid | A column | A column; hidden on individual Mentorship |
| Custom | Not named | Component. One custom component is stored as hybrid | Activates every non-hidden mechanism for the model | Same prose |
| Hybrid | Mode, a mix | Derived, not a button | Shown when two or more mechanisms are selected | Same |

Cash paid for work is not the same as cash contributed as capital. Project JV has both a capital contribution attribute and a cash exchange mode.

Custom text in Commercial STR says there is no free-text field and that no section is individually required. The wireframe formulas M18 to M23 turn Cash and Barter on when Custom is selected, and M24 to M25 then require their fields for the gate. Those sentences disagree. The suggested matrix, which is marked as not wired, would show Co-ownership barter, Bulk Purchasing barter, and Mentorship equity as edge cases. The live product follows neither workbook matrix.

Publication amounts and bands are indicative. Negotiation and agreement terms are the binding record. The workbook’s “to be agreed” and percentage bands fit the first stage. They do not answer ISS-13.

The barter ratio uses a USD midpoint table. Open-ended bands receive arbitrary midpoints. Zero means “not calculable,” including Free / goodwill. Monthly bands and project totals share one list. Currencies are not converted. The 0.85 to 1.15 band is a label on the prototype, not a match weight. The formulas were inspected and not recalculated.

### 6.7 Publication, geography, privacy, and verification

The current publish gate is the 80/20 readiness rule plus required fields. The workbook formula is 60% base, 15% for declaring both sides, 10% deliverables, 5% milestones, 5% value, and 5% coverage. That formula is a proposal. It would treat a deliberate single-sided post as less ready.

Schedule publish is a field in Step 5 (S5-F13) and a list of times in Step 5-Lists. No scheduler was found in the web application. A future publish has to be stored, authorised, revalidated at execution time, cancellable, safe against duplicates, and able to start matching. Browser storage cannot do that reliably after the browser closes. The server scaffold does not do it either.

Cities column A contains 198 values, including “Other (not listed),” so 197 named entries. Step 1 claims 195 ISO countries. City lists mix cities with regions, coasts, and projects, including Qassim, North Coast, New Administrative Capital, and NEOM. GeoNames is recommended in a developer note. It is not a requirement that has been accepted, and it is not integrated.

Visibility is also inconsistent: Step 1 says every post is visible only to vetted subscribers, and Step 5 says the review screen is exactly what a match sees. The product redacts amounts on marketplace cards and derives vetted access from the account. “PMTwin vetted” as a dropdown credential would let the user claim a platform status.

### 6.8 Match and deal lifecycles

Discovered means the engine persisted a pair above the threshold after the hard checks. Accepted means a party has agreed and quorum is not yet reached. Confirmed is the point from which negotiation starts. Expired is used when a discovered or accepted match is withdrawn with the opportunity, or when an expiry command runs. Declined and superseded are terminal. Supersede is an explicit command. An edit does not silently supersede a confirmed match.

Time-based expiry is still lazy. Many matches have no `expiresAt`, and there is no job runner. That limitation is recorded internally. It is not a client-approved deferral.

Changing these states to fit a wireframe label would rewrite UAT history. It is a product decision, not a clean-up.

---

## 7. Comparison with the latest wireframes

The five-step journey matches the product. Draft, validation, and publish already exist. The change is inside the steps.

**Interface changes**

- Routing questions before the cards.
- Eight company cards and three individual cards instead of family plus sub-model.
- Per-side category, value, location, and credential dropdowns.
- A readiness presentation with different weights.
- A schedule-publish control.
- A barter ratio display.

**Business-rule changes**

- Possible removal of the sub-model as a stored compatibility key.
- No home for Strategic Alliance and Competition/RFP.
- JV treated as one commercial policy.
- Co-ownership extended beyond equipment.
- Individuals limited to three creation paths and to match types 1 and 2.
- Company forms requiring both sides.
- New edge-case profit sharing, equity, and barter combinations.
- Custom redefined.
- Cross-model links.
- A different publish score.
- Member-only visibility and self-selected verification.

The workbooks therefore change the interface and the core rules. Building the screens without the rule decisions would hard-code the conflicts.

---

## 8. Workbook contradictions and corrections required

Formulas were inspected with a library that reads the stored formula text. Excel did not recalculate them. No claim is made that a cached value is the current Excel result.

| Issue | Where | Correction |
| --- | --- | --- |
| Two individual schemas | Company `Step8-Mentorship-Ind` and `Step3-TaskBColl-Ind` versus individual `Step3-ind-mentor` and `Step3-ind-task-based-coll`. Example: company individual mentorship O01 is domain; the individual workbook O00 is intent and O01 is domain | One field dictionary. Map or delete the duplicate |
| Trigger text is not a dropdown value | `Step8-Mentorship` A71, “Include individual professionals.” Values are Companies only, Individual professionals only, Both | Conditions must use the option identifier |
| Duplicate legal form | `Step3-Cownr` A38 and JV need structure: “SPV” and “Special Purpose Vehicle” | One identifier |
| Combined language | “Arabic & English” as a single option on mentorship and task lists | Two language identifiers, multi-select |
| Platform status as a credential | “PMTwin vetted” in credential lists | Remove it from user entry, or rename it as an unverified claim |
| Company note in the individual file | Individual `Step 4-Lists` N15 discusses Co-ownership and Bulk Purchasing | Replace with the three-model note |
| Copied formula range | Individual `Step 5-Lists` Q6 matches rows 6 through 13. Only rows 6 through 8 are individual models | Point the formula at the three rows |
| Geography | `Step1-Details` A48 versus `Cities` column A. Mixed place types in the narrative lists | Identifiers and place types |
| Custom contradiction | Commercial STR A142 versus Step 4 wireframe M18:M25 | One Custom rule |
| Barter ratio | `Step 4-Lists` AP6:AQ38 and AT11 | Same currency, unit, and period, or remove the ratio |
| Type labels | `Step 2-Lists` Q9 calls a both-sides exchange Type 4. L15 says the columns are a proposed default | Do not treat the label as a match |
| Live versus suggested matrix | `Step 4-Lists` F4 says the live matrix is wired. N4 says the revision is not | Approve one matrix |

### Recommended control sheets

These sheets should be added to the specification set before build. They were not added to the source workbooks.

**Model Mapping.** Columns: original specification name, PDF reference, stored key, proposed card, decision (keep, alias, retire), commercial policy inherited, eligibility inherited, migration treatment of existing records, decision owner, approval reference. Owner: client product owner with engineering.

**Field Dictionary.** Columns: field ID, label, model, side (need, offer, shared), data type, required on draft, required on publish, storage path, role (informational, eligibility, score, preference), missing-value behaviour, conditional rule by option ID, source sheet and cell. Owner: business analyst with engineering.

**Matching Policy.** Columns: factor, weight, hard or soft, formula, missing data, cap, explanation text shown to the user, approval reference. Owner: client product owner with engineering.

**Commercial Compatibility.** Columns: actor type, model key, mechanism, valid / edge / hidden, indicative or binding stage, currency, unit, period, zero-value behaviour, approval reference. Owner: commercial owner with the client product owner.

**Party Eligibility.** Columns: model key, actor, may create, may respond, may lead a group, may accept, relationship (B2B, B2P, P2B, P2P), approval reference. Owner: client product owner.

**Decisions, Scope and Acceptance.** Columns: decision ID, question, options, decision, date, decider, affected requirement IDs, acceptance test, release. Owner: client decision owner, with QA recording the test.

---

## 9. Revised scope and CR classification

The 30 September review grouped work as CR-01 through CR-07 and said CR-07 should be split. It published no effort numbers. This review keeps that substance and uses the finer IDs so original work is not priced as a change, and so a proposal is not treated as approved.

| ID | Treatment | Why |
| --- | --- | --- |
| CR-01a | Proposed UI. Not approved | Cards and routing over retained keys |
| CR-01b | Proposed domain replacement. Not approved | Removing sub-model keys changes matching and history |
| CR-02 | Split | Section 3.2 equipment record is original completion if that specification is accepted. Real estate, company stakes, booking, and settlement are proposals |
| CR-03 | Retain, split by decision | Four match types are original. New hard filters and type labels are proposals |
| CR-04 | Proposed matrix change. Not approved | Current restrictions stay until one matrix is chosen |
| CR-05a | Data work after the country list is chosen | Identifiers, not a new product |
| CR-05b | Withdraw from UAT scope | GeoNames is a recommendation |
| CR-05c | Policy decision | Some redaction already exists |
| CR-06 | Proposed formula. Not approved | Current gate stays |
| CR-07a | Proposed, and blocked on a backend | No scheduler exists |
| CR-07b | Original completion if the PDF is binding | User linking of one need to many offers. Not a new idea |
| CR-07c | Proposed policy change | Cross-model links are not in the PDF |
| ISS-13 | Open decision | Do not implement either answer yet |
| ISS-14 | Open decision | Do not implement either answer yet |

None of these IDs is an approved change request.

---

## 10. UAT issue status and evidence

The handover’s customer email draft says browser verification was completed for the listed flows and that automated tests, type-check, and the production build passed. That draft is the evidence of the claim. This review did not see the test log, the browser notes, or the client’s reply.

| ID | Handover | This review | Evidence class |
| --- | --- | --- | --- |
| ISS-01 | Verified. Consortium match after the partner publishes | Re-anchor function and a test are in the tree | Historical claim. Code present. Not re-run |
| ISS-02 | Verified. Company can open its match | Viewer check includes the company party and `actingForPartyId` | Same |
| ISS-03 | Verified. Company name shown | Match detail uses the company display name. Opportunity details still ask `getPersonName` for `ownerPartyId` | Historical claim. Residual path not proven. Not re-opened |
| ISS-04 | Verified. Equity publishes | Validator reads the current equity component | Code present. Not re-run |
| ISS-05 | Verified. Profit sharing publishes | Same pattern | Same |
| ISS-06 | Verified. Hybrid and Custom save | A single Custom component is stored as hybrid | Same. Confirm only if Custom is redefined |
| ISS-07 | Verified. Messages use current labels | Registry labels are the error source | Weaker test coverage. Spot-check in final UAT |
| ISS-08 | Verified. Revenue sharing can be chosen | Added when hybrid is allowed. It is not a sixth mode | Code present |
| ISS-09 | Verified. Collaboration step reports missing fields | Step advance calls sub-model validation | Code present. One manual check still useful |
| ISS-10 | Verified. Current step remains indicated | `aria-current` follows the active step | Code present. Not seen in a browser here |
| ISS-11 | Verified. Create Commercial Agreement | Action follows the workflow gate | Code and test present. Not re-run |
| ISS-12 | Verified. Complete Contract | Action is on the contract read model | Same |
| ISS-13 | Decision required | Cash negotiation offers still require `paymentSchedule` | Open. Code confirms the current rule |
| ISS-14 | Decision required | Agreement completion is not blocked by an active contract. Completing the contract can complete the linked agreement | Open. Code confirms the current rule |
| ISS-15 | Verified. Strategic JV publishes without offering cash | `strategic_jv` modes are equity, profit sharing, and hybrid | Code present. No dedicated exclusion test found |
| ISS-16 | Verified. Tags keep separators while typing | Parser keeps a trailing comma or space | Test present. Not re-run |
| ISS-17 | Verified. Consultant tag deliverables reload | Draft builder keeps the tags. A zero on the scope counter can be expected | Test present. Not re-run |

The August 2026 internal log (UAT-01 through UAT-30, dated 3 August, commit `b869e61`) is a different list. It must not be used to mark ISS-01 through ISS-17 as passed or failed.

---

## 11. Decision register

Owners are roles. Naira is named only where the handover already assigns the decision. Walid is the sender described in the review request. The email was not in the file set, so Walid is not recorded here as the approver.

| ID | Decision | Proposed owner |
| --- | --- | --- |
| D-01 | Eight and three cards as a view, or as a replacement of stored sub-models | Client product owner |
| D-02 | Retain, alias, or retire Consortium, Project JV, SPV, Strategic JV, Strategic Alliance, and Competition/RFP | Client product owner |
| D-03 | Which commercial matrix is binding, including cash on SPV and Strategic JV | Client product owner and commercial owner |
| D-04 | Whether a company post may be need-only or offer-only | Client product owner |
| D-05 | Individual create, respond, lead, and accept rights | Client product owner |
| D-06 | Whether the PDF score example replaces the live weights | Client product owner |
| D-07 | Accept or change the 50% threshold, missing dates, inclusive overlap, category bonus, hard model check, role check, and self-match exclusion | Client product owner |
| D-08 | Whether a barter link may cross models | Client product owner |
| D-09 | What Custom requires at publish | Client product owner |
| D-10 | ISS-13 payment schedule | Client decision owner named in the handover (Naira) |
| D-11 | ISS-14 agreement and contract completion | Client decision owner named in the handover (Naira) |
| D-12 | Whether scheduled publish is in this UAT scope | Client product owner and engineering |
| D-13 | Field role: informational, eligibility, score, or preference | Client product owner |
| D-14 | Release-one countries, currencies, and place types. GeoNames yes or no | Client product owner |
| D-15 | Which amounts a counterparty may see before negotiation | Client product owner and privacy owner |

The full wording is on the Decisions sheet of the traceability workbook.

---

## 12. Prioritised completion and change plan

**Now, to close the current UAT baseline**

1. Record D-10 and D-11. Implement only the chosen rule, with one regression test each.
2. Re-run the existing UAT scripts for ISS-01 through ISS-12 and ISS-15 through ISS-17 on the build that will be accepted. Include the company name on the opportunity header (ISS-03 residual) and one empty profit-sharing publish (ISS-07).
3. Freeze the live domain as the acceptance baseline: five families, thirteen keys, current commercial restrictions, current weights, current readiness gate.
4. Update the user guide only after those decisions, as the handover already promised.
5. Write down the deployed commit when the accepted build is promoted. Until then the release line remains “Deployed UAT version not verified.”

**Next, only after D-01 to D-09**

6. Publish the six control sheets in section 8 and obtain approval references.
7. If cards are a view, implement CR-01a without deleting keys.
8. Complete original gaps that the client confirms are still binding: co-ownership record (section 3.2), and the offer register for same-model links (CR-07b).
9. Leave CR-01b, CR-07c, CR-06, CR-05b, and CR-07a unbuilt until each decision is yes.

**Separate from UAT closure**

10. Production persistence, workers, VAT completeness, and Arabic RTL. These are release conditions for a KSA production service. They are not solved by the wireframes, and the current UAT system does not claim to be that service.

---

## 13. Effort assessment

Ranges are person-days for one engineer who already knows this repository, after the named decisions, including focused tests. They exclude client workshops, visual design, content authoring, legal drafting, production infrastructure, data entry of the full city catalog, and any booking, procurement, or payment-settlement product.

Confidence is medium where the code path is known and low where a decision can multiply the work. Ranges are not additive into a project total. Overlapping regression is counted once in the last row. Nothing here is a delivery date or a chargeable scope.

| Work | Kind | Prerequisite | Range (person-days) | Confidence |
| --- | --- | --- | --- | --- |
| ISS-13 rule change or explicit keep | Decision implementation | D-10 | 1–3 | High |
| ISS-14 rule change or explicit keep | Decision implementation | D-11 | 2–5 | High |
| CR-07b offer register, same model | Original completion | PDF accepted; D-08 is no | 8–15 | Medium |
| Section 3.2 equipment co-ownership record | Original completion | Specification accepted | 8–14 | Medium |
| CR-01a cards over current keys | Proposed enhancement | D-01 is “view”; D-02 keeps keys | 8–15 | Medium |
| CR-03 field mapping without new hard filters | Original completion plus UI | Field dictionary | 8–15 | Medium |
| CR-04 matrix implementation | Proposed enhancement | D-03 and D-09 | 6–12 | Medium |
| CR-05a location identifiers for an approved country list | Data | D-14 | 8–14 | Medium |
| CR-05c visibility contract | Clarification | D-15 | 5–10 | Medium |
| CR-06 readiness formula | Proposed enhancement | Formula and single-sided rule approved | 5–10 | Medium |
| CR-02 real-estate and company-stake extension, still without booking or settlement | Proposed enhancement | D-01 and D-02 | 12–25 | Low |
| CR-03 weight or hard-filter change | Proposed policy | D-06, D-07, D-13 | 10–20 | Low |
| CR-07c cross-model links | Proposed policy | D-08 is yes | 10–20 | Low |
| CR-01b domain replacement | Proposed replacement | D-01 is “replace” | 25–45, plus migration 10–20 | Low |
| CR-07a scheduled publish | Proposed enhancement | Backend worker in scope | 15–30 | Low |
| CR-05b GeoNames | Proposed enhancement | D-14 is yes | 10–18, otherwise 0 | Medium |
| Migration of existing UAT records if keys or locations change | Data migration | Only if keys change | 10–20, otherwise 2–5 | Low |
| Regression and UAT of the accepted slice | Verification | Scope frozen | 8–15 | Medium |

Defect correction inside the current baseline, other than the two open decisions, was not identified as a build queue. The ISS items have code in place. Final UAT is a re-test, not a rewrite.

---

## 14. Release-specific acceptance criteria

These criteria apply to the UAT system as it is, plus only the decisions in D-10 and D-11. They do not accept the August 2026 wireframes.

1. A company user and an individual user can each publish a need and an offer on a model they are allowed to create today.
2. Strategic JV and SPV cannot select cash. Project JV can select equity, profit sharing, and cash, and capital contribution remains a separate field.
3. A single missing required collaboration field is reported on that step, and the step indicator still shows the current step.
4. Consortium: a lead published first, then a compatible partner, produces a match that both company parties can open, and the company name is the party name.
5. One-way, two-way, group, and a three-party circular match can be demonstrated on compatible sub-models. A workbook type label is not accepted as evidence.
6. A match below 50%, a self-match, and a sub-model mismatch do not persist.
7. Closing an opportunity expires discovered and accepted matches, leaves confirmed matches, and does not notify twice.
8. An agreed negotiation can start a commercial agreement. An active contract can be completed from the contract page.
9. ISS-13 and ISS-14 behave exactly as the written decision, including the negative case.
10. Marketplace cards do not show commercial amounts to a browser who is not a party.
11. Consultant hiring deliverables entered as tags are present after reload.
12. The accepted build’s commit is recorded. Until that record exists, the release statement remains: Deployed UAT version not verified.
13. Arabic RTL and Hijri display remain a separate production check. They are not claimed as done by this report.

Acceptance of any wireframe item requires the control sheets in section 8, an approval reference, and a test that names the old key and the new card.

---

## 15. Sources and traceability references

**Client and specification sources**

- `PMTwin-Need&Offer Framework-Matching Mechanizim-10Jan2025.pdf`, pages 1–10.
- `web/pmtwin_collaboration_models_final.docx`, especially Sub-Model 3.2 Co-Ownership Pooling and Sub-Model 2.3 Mentorship. The markdown conversion in the repository matches those headings and attributes.
- Company workbook `PMTwin Matching Wireframes-10Aug2026 - Companyflow.xlsx`, 42 sheets. Material cells include Step1-Details A19:A23, A48, A60, A112; Step2 A47, A55:A62; Step 2-Lists Q9, L15; Step3-Cownr A5, A26, A38; Step3-Hiring A5; Step8-Mentorship A71; Step 4-Lists F6:L13, N6:T15, AP6:AT11; Commercial STR A142:A144; Step5 A112; Step 5-Lists F6:F11.
- Individual workbook `PMTwin Matching Wireframes-10Aug2026-Indivadual.xlsx`, 23 sheets. Material cells include Step 2-Lists B3:B4 and R6:R8; Step 4-Lists N15; Step 5-Lists Q6; Step3-ind-mentor field IDs from O00.

**Internal sources, not client approval**

- `PM-Twin_Project_Master_Context_Handover.docx`, sections 2–18.
- `PM-Twin_Wireframes_Core_CR_Review.docx`, 30 September 2026.
- `docs/runtime-ownership.md`, `docs/uat/uat-findings-log.md`, `docs/uat/uat-final-completion-report.md`, `BRD/08_Business_Requirements_Document.md`, `server/README.md`.

**Implementation, commit `d113b3b9a4da198d7c2f872d465b805730e1ce55`**

- `packages/collaboration-models/src/registry/registry-data.ts`
- `packages/collaboration-models/src/registry/applicability-data.ts`
- `packages/collaboration-models/src/registry/legacy-attributes.ts`
- `packages/collaboration-models/src/readiness/readiness-engine.ts`
- `packages/collaboration-models/src/exchange/value-exchange.ts`
- `packages/matching/src/config/defaults.ts`
- `packages/matching/src/scoring/post-to-post-scoring.ts`
- `packages/matching/src/routing/detect-model.ts`
- `packages/matching/src/constraints/hard-constraints.ts`
- `packages/lifecycle` match states in the lifecycle manifest
- `web/src/domain/opportunity-commercial-structure/allowed-components.ts`
- `web/src/domain/opportunity-commercial-structure/visibility.ts`
- `web/src/services/matching/matching-fingerprint.ts`
- `web/src/domain/matching/expire-matches-on-opportunity-withdrawn.ts`

**This review’s outputs**

- This report.
- `PMTwin-UAT-Requirements-Traceability-2026-10-03.xlsx`, sheets Traceability, Classification totals, Decisions, CR reassessment, and Model mapping.
- CSV export of the traceability sheet.

**Repository identity**

- Path: `D:/Cursor/PM-Twin MVP - saleh -live`
- Branch: `main`, tracking `origin/main`
- HEAD: `d113b3b9a4da198d7c2f872d465b805730e1ce55`
- Remotes present: `origin` and `just2pay`. No tags.
- Review date: 3 October 2026
- Application files were not changed.

---

## Closing position

The UAT product implements the January framework’s main shape: needs and offers, five families, four match types, and five exchange modes, with a thirteen-key model list that overlaps the detailed specification and does not copy it. Co-ownership as specified, and a user-controlled link from one need to many offers, are the clearest original gaps. The August wireframes are a serious next design. They are not the current acceptance baseline, and they are not yet an approved change.

Close UAT by deciding ISS-13 and ISS-14, re-testing the fifteen previously claimed fixes on a named build, and writing down that build’s commit. Open the wireframe programme only after the model map, the commercial matrix, party rights, and the match formula are decided in writing.
