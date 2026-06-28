# Implementation status

### What this page is

Module-by-module checklist: **done**, **partial**, or **missing**. Sourced from the codebase only.

### Why it matters

Product and engineering use it for roadmaps and release notes—without rereading every file.

### What you can do here

- Scan a module (Auth, Opportunities, Matching, and so on).
- Jump to [gaps-and-missing.md](gaps-and-missing.md) for narrative severity.

### Step-by-step actions

1. Find the module you care about.
2. Read the table rows and Notes.
3. Confirm behavior in the app when a row is ⚠️.

### What happens next

Prioritize ⚠️ and ❌ items against your release goals.

### Tips

- Status reflects codebase snapshots. **Active runtime is `web/`** — prefer web command paths for new work. See [runtime-ownership.md](runtime-ownership.md).
- POC rows describe the legacy reference app where still applicable.

---

## 1. Authentication & authorization

| Item | Status | Notes |
|------|--------|-------|
| Register (individual) | ✅ | auth-service + register page + data-service.createUser |
| Register (company) | ✅ | Company account creation path exists |
| Login (user + company) | ✅ | Account type on login; individual vs company lookup |
| Pending read-only mode | ✅ | assertCanMutate + data-service _assertPortalCanMutate |
| Logout | ✅ | Session cleared |
| Forgot password | ✅ | Reset token created; reset-password page |
| Reset password | ✅ | Token validation; password update |
| Session restore (checkAuth) | ✅ | On load, restore user from session |
| Role-based route protection | ✅ | auth-guard.protect(handler, requiredRoles) |
| Admin access check | ✅ | canAccessAdmin(), isAdmin() |
| Social login | ❌ | CONFIG.AUTH.SOCIAL_LOGIN_ENABLED: false; placeholder only |
| Password hashing (real) | ❌ | POC uses encode only, not secure hash |

---

## 2. Users & Companies

| Item | Status | Notes |
|------|--------|-------|
| User CRUD (data layer) | ✅ | getUsers, getUserById, getUserByEmail, createUser, updateUser |
| Company CRUD (data layer) | ✅ | getCompanies, getCompanyById, createCompany, updateCompany, normalizeCompaniesForMatching |
| User profile view/edit | ✅ | profile page, settings page |
| Company profile | ⚠️ | Stored and used; company-specific profile UI may be shared with user |
| User status (pending/active/suspended/rejected) | ✅ | CONFIG.USER_STATUS; admin can update |
| Verification status | ✅ | Stored; display in profile; admin can set (if UI exposed) |
| Normalize users/companies for matching | ✅ | normalizeUsersForMatching, normalizeCompaniesForMatching on init/merge |
| Profile completeness on publish | ✅ | assertProfileReadyForPublish in updateOpportunity |
| Company members / roles (invite, assign) | ❌ | BRD; not implemented in POC |

---

## 3. Opportunities

| Item | Status | Notes |
|------|--------|-------|
| Create opportunity | ✅ | opportunity-create page + opportunity-service + data-service |
| Edit opportunity | ✅ | `/opportunities/:id/edit` uses opportunity-create (edit mode); standalone opportunity-edit page is deprecated |
| Delete opportunity | ✅ | data-service.deleteOpportunity |
| Opportunity list (my / all) | ✅ | opportunities, find, pipeline |
| Opportunity detail | ✅ | opportunity-detail page |
| Intent (request/offer/hybrid) | ✅ | Stored; used by matching |
| Collaboration model | ✅ | Wizard step; stored |
| Payment modes / value_exchange | ✅ | Stored; used by matching and scoring |
| Unified status lifecycle | ✅ | draft → published → in_negotiation → contracted → in_execution → completed → closed/cancelled |
| Model/sub-model attributes | ✅ | opportunity-models.js; dynamic form |
| Publish triggers matching | ✅ | updateOpportunity → persistPostMatches on status published |
| Opportunity map view | ✅ | opportunity-map page |
| Migration to unified workflow | ✅ | migrateOpportunitiesToUnifiedWorkflow in data-service |

---

## 4. Applications

| Item | Status | Notes |
|------|--------|-------|
| Create application | ✅ | From opportunity detail; data-service.createApplication |
| Application list by opportunity | ✅ | getApplicationsByOpportunityId |
| Application status (pending/shortlisted/accepted/rejected) | ✅ | CONFIG.APPLICATION_STATUS |
| Pipeline Kanban (applications) | ✅ | pipeline feature; columns by status |
| Application requirements/deliverables/files/payment terms | ⚠️ | View in application modal; owners can add requirement rows; deliverables/files still partial |
| Application count by opportunity | ✅ | getApplicationCountByOpportunityId (API/reports) |

---

## 5. Matching Engine (Post-to-Post)

| Item | Status | Notes |
|------|--------|-------|
| Model detection | ✅ | detectMatchingModel(opportunity) |
| findOffersForNeed | ✅ | matching-models.js |
| findNeedsForOffer | ✅ | matching-models.js |
| findBarterMatches | ✅ | matching-models.js |
| findConsortiumCandidates | ✅ | matching-models.js |
| findCircularExchanges | ✅ | matching-models.js |
| findReplacementCandidatesForRole | ✅ | matching-models.js (consortium replacement) |
| Post-to-post scoring (scorePair) | ✅ | post-to-post-scoring.js; weights from CONFIG |
| Candidate generator | ✅ | candidate-generator.js; budget, location, timeline, category |
| Post-preprocessor | ✅ | extractAndNormalize; skill canonical |
| Semantic profile | ✅ | semantic-profile.js |
| Value compatibility | ✅ | value-compatibility.js; oneWay, barter, consortium, circular |
| rankMatches (tier, compositeRank) | ✅ | matching-service.rankMatches |
| persistPostMatches on publish | ✅ | Runs all detectMatchingModel results + circular pass |
| Admin bulk save selected opps | ✅ | persistPreviewOpportunities + admin-matching UI |
| Matching run metadata | ✅ | matching_runs: modelsRun, threshold, counts, durationMs |
| createPostMatch + dedupe | ✅ | data-service.createPostMatch; strong keys plus signature fallback |
| notifyPostMatch | ✅ | matching-service.notifyPostMatch |
| Legacy findMatchesForOpportunity | ❌ Removed from product | Deprecated API; no-op when `LEGACY_PERSON_OPPORTUNITY_ENABLED` is false; not called on publish |
| findOpportunitiesForCandidate | ❌ Removed from product | Deprecated API; no-op when legacy flag is false |
| Legacy `pmtwin_matches` seed/UI | ❌ Removed from product | `post_matches` only; `matches.json` / `demo-matches.json` not merged when legacy off |

---

## 6. Matches (User-Facing)

| Item | Status | Notes |
|------|--------|-------|
| Matches list (post_matches for user) | ✅ | matches page; getPostMatchesForUser |
| Match detail | ✅ | match-detail page; getPostMatchById |
| Filter by type (one_way, two_way, consortium, circular) | ✅ | getPostMatchesByType or client filter |
| Accept / decline | ✅ | updatePostMatchStatus; declinePostMatch |
| Status: pending → accepted/declined/confirmed | ✅ | All participants accepted → confirmed |
| Create deal from confirmed match | ✅ | Start Deal requires `post_match` status confirmed; `assertDealCreationSource` enforces |
| Create deal from agreed negotiation | ✅ | createDealFromNegotiation; multi-party agree in agreeNegotiation |
| Create deal from accepted application | ✅ | createDealFromApplication on opportunity detail |
| Match cards (templates) | ✅ | match-card-one-way, two-way, consortium, circular |
| Expiry (expiresAt) | ⚠️ | Read-time expiry exists for pending matches; generated records usually have no default expiresAt and no scheduled job |

---

## 7. Negotiation

| Item | Status | Notes |
|------|--------|-------|
| startNegotiationFromMatch | ✅ | data-service; links opportunity, notifies parties |
| startNegotiationFromApplication | ✅ | Owner or applicant; may delegate to match |
| agreeNegotiation (multi-party) | ✅ | participantAgreements → agreed + finalAgreedSnapshot |
| createDealFromNegotiation | ✅ | Requires status agreed |
| Negotiation workflow doc | ✅ | docs/workflow/negotiation-workflow.md |
| Negotiation expiry job | ✅ | expireStaleNegotiations on getNegotiations; default expiresAt on create |
| Round/counter UI | ⚠️ | Storage + service; full UI may be minimal on some screens |

---

## 8. Deals

| Item | Status | Notes |
|------|--------|-------|
| createDeal | ✅ | data-service.createDeal |
| getDealById, getDealsByUserId | ✅ | data-service |
| updateDeal, addDealMilestone, updateDealMilestone | ✅ | data-service |
| Deal list (user) | ✅ | deals page |
| Deal detail | ✅ | deal-detail page |
| Deal status flow | ✅ | negotiating → draft → review → signing → active → execution → delivery → completed → closed |
| Milestones (pending, in_progress, submitted, approved, rejected) | ✅ | Stored and normalized on deal |
| Deal rate (review) | ✅ | deal-rate page; reviews storage |
| Migration (deal/contract lifecycle) | ✅ | migrateContractsToDealContractLifecycle |
| roleSlots / payload (consortium) | ✅ | Stored on deal |
| Link to contract (contractId) | ✅ | deal.contractId set when contract created |

---

## 9. Contracts

| Item | Status | Notes |
|------|--------|-------|
| createContract | ✅ | data-service.createContract; parties, scope, paymentMode, agreedValue, milestonesSnapshot |
| getContractById, getContractsByUserId | ✅ | data-service |
| updateContract | ✅ | data-service |
| Contract list (user) | ✅ | contracts page |
| Contract detail | ✅ | contract-detail page |
| Sign contract (party signedAt) | ✅ | signContractParty / updateContract |
| All signed → active (contract + deal) | ✅ | Automated in data-service.updateContract |
| Contract status (pending/active/completed/terminated) | ✅ | CONFIG.CONTRACT_STATUS |

---

## 10. Notifications & Audit

| Item | Status | Notes |
|------|--------|-------|
| createNotification | ✅ | data-service; used by matching and admin flows |
| Notifications list (user) | ✅ | notifications page |
| Mark read | ⚠️ | Stored; UI may support toggle read |
| createAuditLog | ✅ | data-service; called on match_created, etc. |
| Audit list (admin) | ✅ | admin-audit page |
| Audit filters | ⚠️ | By user, action, entity, date (if implemented in UI) |

---

## 11. Pipeline & Discovery

| Item | Status | Notes |
|------|--------|-------|
| Pipeline page | ✅ | pipeline.js; tabs: opportunities, applications, matches |
| My opportunities (draft/published/closed) | ✅ | Filter by creatorId and status |
| Publish from pipeline | ✅ | updateOpportunity(id, { status: 'published' }) |
| Find (browse published) | ✅ | find page; filter by status published |
| Opportunity map | ✅ | opportunity-map |
| People list | ✅ | people page |
| Person profile | ✅ | person-profile page |

---

## 12. Admin Portal

| Item | Status | Notes |
|------|--------|-------|
| Admin dashboard | ✅ | admin-dashboard |
| Admin users list | ✅ | admin-users |
| Admin user detail | ✅ | admin-user-detail |
| Admin vetting | ✅ | admin-vetting |
| Admin opportunities | ✅ | admin-opportunities |
| Admin matching (run + view) | ✅ | admin-matching |
| Admin deals | ✅ | admin-deals |
| Admin contracts | ✅ | admin-contracts |
| Admin consortium | ✅ | admin-consortium (replacement flow) |
| Admin health | ✅ | admin-health |
| Admin audit | ✅ | admin-audit |
| Admin reports | ✅ | admin-reports |
| Admin settings | ✅ | admin-settings |
| Admin skills | ✅ | admin-skills |
| Admin subscriptions | ✅ | admin-subscriptions page at `/admin/subscriptions` |
| Admin site content (CMS) | ✅ | `/admin/site-content`; public pages hydrate from site-content.json + localStorage overrides |
| Admin collaboration models | ✅ | admin-collaboration-models |
| Admin matching Run report | ✅ | Preview only (in-memory); does not persist |
| Persist matches from admin matching (Save) | ✅ | Per-opportunity Save → `persistPostMatches` |
| Bulk save selected opportunities | ✅ | `persistPreviewOpportunities` + checkbox UI |
| Moderator vs Admin permission split | ✅ | Route guards + skills write UI; subscriptions/settings already gated |
| Auditor read-only enforcement | ✅ | data-service _assertNotAuditorWrite + admin-readonly-guard + vetting |
| Bulk user actions | ❌ | BRD future |

---

## 13. Infrastructure & Data

| Item | Status | Notes |
|------|--------|-------|
| localStorage storage-service | ✅ | get, set, remove, clear |
| data-service (CRUD all entities) | ✅ | Full CRUD for users, companies, opportunities, applications, matches, post_matches, deals, contracts, notifications, audit, etc. |
| Seed from JSON | ✅ | initializeFromJSON; domains from data/ |
| Merge demo data | ✅ | mergeDemoData; demo-post-matches (canonical matches), demo-users, demo-companies, demo-40-opportunities, demo-deals, demo-contracts, etc.; legacy demo-matches not merged when legacy off |
| Seed version migration | ✅ | CURRENT_SEED_VERSION; clear + re-seed on change |
| Hash router | ✅ | router.js; register, navigate, path params |
| Layout (public vs portal) | ✅ | layout-service; sidebar for portal; admin area |
| API service (abstraction) | ✅ | api-service.js; delegates to data-service; ready for fetch swap |
| Config (CONFIG) | ✅ | config.js; roles, statuses, storage keys, routes, API endpoints, matching weights |

---

## 14. Public & Content

| Item | Status | Notes |
|------|--------|-------|
| Home | ✅ | home page |
| Collaboration wizard | ✅ | collaboration-wizard |
| Collaboration models (public) | ✅ | collaboration-models page (CMS sections via site-content-service) |
| Knowledge base | ✅ | knowledge-base page |
| Workflow (public) | ✅ | workflow page |
| Messages | ⚠️ | messages page exists; full threading may be partial |
| Connections | ✅ | create/accept/reject + request/accept/reject notifications |

---

## Summary

- **Core flows:** Auth, opportunities, matching (all four models + multi-model persist), post_matches, negotiation, deals, contracts (incl. auto-activate on sign), pipeline, admin matching (preview + bulk save) are **implemented**.
- **Partial:** Pending read-only enforcement, login user/company same-email, profile gate on publish, match/negotiation expiry defaults, application action UX, moderator/admin UI, messages, connection notifications.
- **Missing (POC):** Real password hashing, social login, company members, negotiation expiry sweep, scheduled jobs.
- **Fix plan (before code):** [gap-solutions.md](gap-solutions.md) — GAP-P01–P12 prioritized.

---

## Related Documentation

- [Gaps and Missing](gaps-and-missing.md) — Detailed gaps and workflow overview.
- [Gap solutions](gap-solutions.md) — Proposed fixes (not yet implemented).
- [Negotiation workflow](workflow/negotiation-workflow.md) — Negotiation path.
- [Overview](overview.md) — System summary.
