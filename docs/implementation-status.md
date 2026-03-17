# Implementation Status

Per-module status: ✅ Implemented, ⚠️ Partial, ❌ Missing. Based only on existing codebase; no invented features.

---

## 1. Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| Register (individual) | ✅ | auth-service + register page + data-service.createUser |
| Register (company) | ✅ | Company account creation path exists |
| Login (user + company) | ✅ | getUserOrCompanyByEmail; session in sessionStorage |
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
| Company members / roles (invite, assign) | ❌ | BRD; not implemented in POC |

---

## 3. Opportunities

| Item | Status | Notes |
|------|--------|-------|
| Create opportunity | ✅ | opportunity-create page + opportunity-service + data-service |
| Edit opportunity | ✅ | opportunity-edit page |
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
| Application requirements/deliverables/files/payment terms | ⚠️ | Storage keys and demo data exist; UI integration may be partial |
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
| persistPostMatches on publish | ✅ | In updateOpportunity when status === 'published' |
| createPostMatch + dedupe (signature) | ✅ | data-service.createPostMatch; _postMatchSignature |
| notifyPostMatch | ✅ | matching-service.notifyPostMatch |
| Legacy findMatchesForOpportunity | ✅ | User–opportunity matching; creates pmtwin_matches |
| findOpportunitiesForCandidate | ✅ | Candidate-centric; returns list, no persist |

---

## 6. Matches (User-Facing)

| Item | Status | Notes |
|------|--------|-------|
| Matches list (post_matches for user) | ✅ | matches page; getPostMatchesForUser |
| Match detail | ✅ | match-detail page; getPostMatchById |
| Filter by type (one_way, two_way, consortium, circular) | ✅ | getPostMatchesByType or client filter |
| Accept / decline | ✅ | updatePostMatchStatus; declinePostMatch |
| Status: pending → accepted/declined/confirmed | ✅ | All participants accepted → confirmed |
| Create deal from confirmed match | ⚠️ | Deal creation exists; “Start deal” from match detail may be wired (check feature) |
| Match cards (templates) | ✅ | match-card-one-way, two-way, consortium, circular |
| Expiry (expiresAt) | ⚠️ | Field stored; no cron/job to set status expired |

---

## 7. Deals

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

## 8. Contracts

| Item | Status | Notes |
|------|--------|-------|
| createContract | ✅ | data-service.createContract; parties, scope, paymentMode, agreedValue, milestonesSnapshot |
| getContractById, getContractsByUserId | ✅ | data-service |
| updateContract | ✅ | data-service |
| Contract list (user) | ✅ | contracts page |
| Contract detail | ✅ | contract-detail page |
| Sign contract (party signedAt) | ⚠️ | updateContract to set signedAt; “all signed → active” logic may be in UI/feature |
| Contract status (pending/active/completed/terminated) | ✅ | CONFIG.CONTRACT_STATUS |

---

## 9. Notifications & Audit

| Item | Status | Notes |
|------|--------|-------|
| createNotification | ✅ | data-service; used by matching and admin flows |
| Notifications list (user) | ✅ | notifications page |
| Mark read | ⚠️ | Stored; UI may support toggle read |
| createAuditLog | ✅ | data-service; called on match_created, etc. |
| Audit list (admin) | ✅ | admin-audit page |
| Audit filters | ⚠️ | By user, action, entity, date (if implemented in UI) |

---

## 10. Pipeline & Discovery

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

## 11. Admin Portal

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
| Admin subscriptions | ✅ | admin-subscriptions |
| Admin collaboration models | ✅ | admin-collaboration-models |
| Persist matches from admin run | ❌ | Admin “Run matching” shows results; persist only on publish unless extra button added |
| Moderator vs Admin permission split | ⚠️ | Roles exist; UI may not hide by role everywhere |
| Bulk user actions | ❌ | BRD future |

---

## 12. Infrastructure & Data

| Item | Status | Notes |
|------|--------|-------|
| localStorage storage-service | ✅ | get, set, remove, clear |
| data-service (CRUD all entities) | ✅ | Full CRUD for users, companies, opportunities, applications, matches, post_matches, deals, contracts, notifications, audit, etc. |
| Seed from JSON | ✅ | initializeFromJSON; domains from data/ |
| Merge demo data | ✅ | mergeDemoData; demo-users, demo-companies, demo-40-opportunities, demo-deals, demo-contracts, demo-matches, demo-post-matches, etc. |
| Seed version migration | ✅ | CURRENT_SEED_VERSION; clear + re-seed on change |
| Hash router | ✅ | router.js; register, navigate, path params |
| Layout (public vs portal) | ✅ | layout-service; sidebar for portal; admin area |
| API service (abstraction) | ✅ | api-service.js; delegates to data-service; ready for fetch swap |
| Config (CONFIG) | ✅ | config.js; roles, statuses, storage keys, routes, API endpoints, matching weights |

---

## 13. Public & Content

| Item | Status | Notes |
|------|--------|-------|
| Home | ✅ | home page |
| Collaboration wizard | ✅ | collaboration-wizard |
| Collaboration models (public) | ✅ | collaboration-models page |
| Knowledge base | ✅ | knowledge-base page |
| Workflow (public) | ✅ | workflow page |
| Messages | ⚠️ | messages page exists; full threading may be partial |
| Connections | ⚠️ | Storage key exists; connection request flow may be partial |

---

## Summary

- **Core flows:** Auth, opportunities, matching (all four models), post_matches, deals, contracts, pipeline, admin list/detail/vetting/matching/reports/settings are **implemented**.
- **Partial:** Application sub-entities (requirements/deliverables) UI, contract “all signed → active” automation, notification mark read, moderator vs admin UI, messages/connections, match expiry handling, “Start deal” from match explicitly wired.
- **Missing:** Real password hashing, social login, company member management, bulk admin actions, persist-from-admin-run button, scheduled jobs (expiry, etc.).

---

## Related Documentation

- [Gaps and Missing](gaps-and-missing.md) — Detailed gaps and broken flows.
- [Overview](overview.md) — System summary.
