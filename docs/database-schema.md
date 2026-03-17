# Database Schema (Storage / Future DB)

The POC uses **localStorage** with string keys. There is no SQL or NoSQL database. This document lists storage keys, the shape of stored data, and notes for a future database migration.

---

## 1. Storage Keys (CONFIG.STORAGE_KEYS)

| Key | Domain (for seed) | Contents |
|-----|-------------------|----------|
| `pmtwin_users` | users | Array of User objects |
| `pmtwin_companies` | companies | Array of Company objects |
| `pmtwin_sessions` | sessions | Array (seed only; live session in sessionStorage) |
| `pmtwin_opportunities` | opportunities | Array of Opportunity objects |
| `pmtwin_applications` | applications | Array of Application objects |
| `pmtwin_application_requirements` | — | Array (demo/merge) |
| `pmtwin_application_deliverables` | — | Array (demo/merge) |
| `pmtwin_application_files` | — | Array (demo/merge) |
| `pmtwin_application_payment_terms` | — | Array (demo/merge) |
| `pmtwin_matches` | matches | Array of Match (legacy opportunity–candidate) |
| `pmtwin_post_matches` | — | Array of PostMatch (demo merge: demo-post-matches.json) |
| `pmtwin_audit` | audit | Array of AuditLog |
| `pmtwin_notifications` | notifications | Array of Notification |
| `pmtwin_connections` | connections | Array |
| `pmtwin_messages` | messages | Array |
| `pmtwin_contracts` | contracts | Array of Contract |
| `pmtwin_deals` | — | Array of Deal (demo merge: demo-deals.json) |
| `pmtwin_negotiations` | — | Array (demo merge: demo-negotiations.json) |
| `pmtwin_reviews` | reviews | Array |
| `pmtwin_system_settings` | — | Object (key-value by category) |
| `pmtwin_lookups_override` | — | Object/array |
| `pmtwin_skill_canonical_override` | — | Object/array |
| `pmtwin_subscription_plans` | — | Array |
| `pmtwin_subscriptions` | — | Array |
| `pmtwin_reset_tokens` | — | Array (forgot password) |
| `pmtwin_seed_version` | — | String (e.g. '1.21.0') |

---

## 2. Entity Shapes (Summary)

See [Data Model](data-model.md) for full field lists. Below is a minimal schema for reference.

**User:** id, email, passwordHash, role, status, profile (object), createdAt, updatedAt.

**Company:** id, email, passwordHash, status, profile (object), createdAt, updatedAt.

**Opportunity:** id, title, description, creatorId, modelType, subModelType, status, intent, collaborationModel, paymentModes/exchangeMode, value_exchange, scope, attributes, exchangeData, normalized, createdAt, updatedAt.

**Application:** id, opportunityId, applicantId, proposal, status, createdAt, updatedAt.

**Match (legacy):** id, opportunityId, candidateId, matchScore, criteria, notified, createdAt.

**PostMatch:** id, matchType, status, matchScore, participants (array), payload (object), createdAt, updatedAt, expiresAt, isReplacement, replacementDealId, replacementRole, replacementPayload.

**Deal:** id, matchId, applicationId, opportunityId, opportunityIds, matchType, status, title, participants, roleSlots, payload, scope, timeline, exchangeMode, valueTerms, deliverables, milestones, negotiationId, contractId, createdAt, updatedAt, completedAt, closedAt.

**Contract:** id, dealId, opportunityId, applicationId, parties, scope, paymentMode, agreedValue, duration, paymentSchedule, equityVesting, profitShare, milestonesSnapshot, status, signedAt, createdAt, updatedAt.

**Notification:** id, userId, type, title, message, link, read, createdAt.

**AuditLog:** id, userId, action, entityType, entityId, timestamp, details.

---

## 3. Relationships (FKs in Application Logic)

| Parent | Child | Foreign key (logical) |
|--------|--------|------------------------|
| User / Company | Opportunity | opportunity.creatorId |
| Opportunity | Application | application.opportunityId |
| User / Company | Application | application.applicantId |
| Opportunity | Match (legacy) | match.opportunityId |
| User / Company | Match (legacy) | match.candidateId |
| (Opportunity, User) | PostMatch | post_match.participants[].opportunityId, .userId; payload.needOpportunityId, .offerOpportunityId, .leadNeedId, .roles[].opportunityId, .cycle |
| PostMatch / Application | Deal | deal.matchId (optional), deal.applicationId (optional); deal.opportunityId, deal.opportunityIds |
| Deal | Contract | contract.dealId; deal.contractId |
| User / Company | Notification | notification.userId |
| User | AuditLog | auditLog.userId |

No database constraints exist; duplicates or orphaned references are possible (e.g. delete user leaves opportunities with creatorId pointing to deleted id).

---

## 4. Seed and Merge

- **Initial load:** `data-service.initializeFromJSON()` fetches JSON from `POC/data/{domain}.json` for domains: users, companies, opportunities, applications, matches, notifications, connections, messages, audit, sessions, contracts, reviews. Each file is expected to have `{ data: [] }`. Stored under the corresponding storage key.
- **Merge:** After seed, `mergeDemoData()` fetches demo-*.json files and merges by id into the stored arrays (users, companies, opportunities, applications, deals, contracts, matches, notifications, post_matches, negotiations, application_requirements, application_deliverables, application_files, application_payment_terms). Demo data adds or overwrites by id.
- **Version:** If stored `pmtwin_seed_version` differs from `CURRENT_SEED_VERSION`, data is cleared and seed + merge run again; then version is stored.

---

## 5. Future Database Notes

- **Tables:** One table per entity (users, companies, opportunities, applications, matches, post_matches, deals, contracts, notifications, audit_log, etc.); optional lookup tables (subscription_plans, skill_canonical).
- **Indexes:** Primary key id; unique email on users and companies; indexes on creatorId, opportunityId, applicantId, userId, status, createdAt for queries and filters.
- **Migrations:** Export localStorage (or use seed JSON) → transform to DB rows → import; then point data-service to API that reads/writes DB.
- **Referential integrity:** Add FK constraints and decide cascade behavior (e.g. on delete user: set opportunity.creatorId to null or block delete).
- **Pagination:** Replace “return full array” with limit/offset or cursor in API.

---

## Related Documentation

- [Data Model](data-model.md) — Full entity and field description.
- [Overview](overview.md) — Storage and data flow.
- [BRD Data Models](../BRD/06_Data_Models.md) — Original BRD reference.
