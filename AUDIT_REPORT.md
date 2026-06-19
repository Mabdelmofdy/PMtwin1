# PMTwin — SaaS Readiness Audit Report

**Audit Date:** June 16, 2026  
**Auditor:** CTO-Level Technical Review  
**Scope:** Full repository — architecture, domain model, APIs, workflows, permissions, scalability, SaaS readiness  
**Target Scale:** 100,000+ concurrent users  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Architecture](#2-current-state-architecture)
3. [Domain Model Analysis](#3-domain-model-analysis)
4. [Entity Relationships — Gaps](#4-entity-relationships--gaps)
5. [Missing Database Tables](#5-missing-database-tables)
6. [Missing APIs](#6-missing-apis)
7. [Missing Business Logic](#7-missing-business-logic)
8. [Missing Matching Engine Logic](#8-missing-matching-engine-logic)
9. [Missing Negotiation Workflow](#9-missing-negotiation-workflow)
10. [Missing Deal Lifecycle](#10-missing-deal-lifecycle)
11. [Missing Contract Lifecycle](#11-missing-contract-lifecycle)
12. [Missing Notification Architecture](#12-missing-notification-architecture)
13. [Missing Audit Trail](#13-missing-audit-trail)
14. [Missing Permission Matrix](#14-missing-permission-matrix)
15. [Missing Event System](#15-missing-event-system)
16. [Missing Analytics](#16-missing-analytics)
17. [Missing Reporting](#17-missing-reporting)
18. [Missing Multi-Tenancy Architecture](#18-missing-multi-tenancy-architecture)
19. [Missing Enterprise Features](#19-missing-enterprise-features)
20. [Target Production Architecture](#20-target-production-architecture)
21. [Gap Analysis Summary](#21-gap-analysis-summary)
22. [P0 — Critical Blockers (Must Fix Before Launch)](#22-p0--critical-blockers)
23. [P1 — High Priority (Must Fix for Production Readiness)](#23-p1--high-priority)
24. [P2 — Medium Priority (Required for Scale)](#24-p2--medium-priority)
25. [Production Roadmap — MVP to 100K Users](#25-production-roadmap)

---

## 1. Executive Summary

PMTwin is a **B2B collaboration marketplace** connecting Project Managers, consultants, and companies in Saudi Arabia. The system allows opportunity publishing, AI-assisted matching across four exchange models (one-way, two-way barter, consortium, circular), negotiation, deal management, and contract lifecycle.

**Current State:** The system is a **sophisticated browser-based POC** with business logic implemented entirely in `localStorage`-backed JavaScript. The POC layer (`POC/`) is the production system — there is no backend. The `web/` layer is a React/TypeScript shell that imports static JSON files directly, with no API layer.

**SaaS Readiness Score: 8/100**

| Dimension | Score | Reason |
|-----------|-------|--------|
| Data Persistence | 2/10 | localStorage only — wiped per browser, no server |
| Authentication | 1/10 | btoa() password encoding, no JWT, no server sessions |
| API Layer | 0/10 | No backend API exists |
| Multi-Tenancy | 0/10 | No tenant isolation concept |
| Scalability | 0/10 | Single-browser execution, no concurrency model |
| Security | 1/10 | XSS-vulnerable, no CSRF, plaintext-equivalent passwords |
| Business Logic | 6/10 | Rich matching engine exists in JS but entirely client-side |
| Domain Model | 7/10 | Well-designed entities, gaps in billing/tenant/compliance |
| Observability | 1/10 | Console.warn only; localStorage audit log |
| Enterprise Features | 0/10 | No SSO, no billing, no SLA, no tenant management |

---

## 2. Current State Architecture

### 2.1 Layer Map

```
┌──────────────────────────────────────────────────────────────────┐
│  POC/ (Primary System — Vanilla HTML/JS/CSS)                     │
│                                                                  │
│  pages/          → 40+ HTML pages (MPA, no bundler)             │
│  features/       → JS feature modules (dashboard, deals, etc.)  │
│  src/core/       → auth-service.js, data-service.js,            │
│                    router.js, api-service.js (stub)             │
│  src/services/   → matching-service.js (1450 lines),            │
│                    deal-lifecycle.js, negotiation-lifecycle.js   │
│                    dispute-lifecycle.js, replacement-lifecycle.js│
│  data/           → JSON seed files (users, opportunities, etc.) │
│  Storage Layer   → window.localStorage (browser)                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  web/ (React/TypeScript Shell — partially wired)                 │
│                                                                  │
│  src/lib/data-store.ts  → imports JSON directly, localStorage   │
│  src/lib/auth-service.ts→ btoa() passwords, localStorage session│
│  src/pages/             → React pages (incomplete)              │
│  src/providers/         → React providers                       │
│  No real API calls anywhere                                      │
└──────────────────────────────────────────────────────────────────┘

NO BACKEND EXISTS.
NO DATABASE EXISTS.
NO SERVER EXISTS.
```

### 2.2 Data Flow (Current)

```
User Action → Feature JS → DataService (localStorage) → UI Update
             ↓
        MatchingService (runs in browser)
             ↓
        postMatches → localStorage → Notification → localStorage
```

### 2.3 What Actually Works (POC)

- User registration/login (btoa encoding)
- Company/professional profile creation
- Opportunity creation with 5 model types and sub-models
- Matching algorithm: one_way, two_way, consortium, circular — **all client-side**
- Negotiation rounds with counter-offers
- Deal workspace with milestones
- Contract creation linked to deals
- Admin vetting, user management, matching command center
- Audit log (localStorage)
- Notification system (localStorage)
- Role-based admin capabilities (admin/moderator/auditor)

### 2.4 What Does NOT Work in Production Context

- Any data persists only in one browser tab — another user sees nothing
- Matching runs only when admin triggers it in-browser — no background jobs
- Notifications only exist in localStorage — no email, no push, no SMS
- Passwords are Base64 encoded (reversible, not hashed)
- Sessions expire only on tab close — no token rotation, no revocation
- No concurrent user isolation
- No file uploads (PDFs, contracts, deliverables referenced but not implemented)
- No payment processing
- No e-signature integration
- No email delivery

---

## 3. Domain Model Analysis

### 3.1 Core Entities (Exist in POC)

| Entity | File | Status | Production-Ready |
|--------|------|--------|-----------------|
| User | `POC/data/users.json`, `src/core/auth/auth-service.js` | Implemented | No — no server, no real hash |
| Company | `POC/data/companies.json` | Implemented | No — merged with User table |
| Opportunity | `POC/data/opportunities.json`, `src/services/opportunities/` | Rich model | No — no versioning, no search index |
| Application | `POC/data/applications.json` | Implemented | No — no file attachments |
| PostMatch | `POC/data/demo-post-matches.json`, `matching-service.js` | Sophisticated | No — runs client-side only |
| Deal | `POC/data/demo-deals.json`, `deal-lifecycle.js` | Implemented | No — no state machine enforcement |
| Contract | `POC/data/demo-contracts.json` | Implemented | No — no e-signature, no PDF |
| Negotiation | `POC/data/demo-negotiations.json`, `negotiation-lifecycle.js` | Implemented | No — no real-time sync |
| Notification | `POC/data/notifications.json`, `notification-delivery.js` | Skeleton | No — no delivery channel |
| AuditLog | `POC/data/audit.json` | Partial | No — missing many events |

### 3.2 Identified Design Strengths

- Opportunity `modelType` / `subModelType` taxonomy is well-structured (project_based, strategic_partnership, resource_pooling, hiring, competition)
- PostMatch `matchType` (one_way, two_way, consortium, circular) maps to real business models
- Deal milestones with `submitted/approved` states exist
- Negotiation rounds with `participantAgreements` exist
- Admin capability matrix in `auth-service.js` is role-granular

### 3.3 Domain Model Flaws

1. **User and Company are separate tables** with no unified identity model — `applicantId` can reference either; no FK enforced
2. **Opportunity `intent`** (request/offer/hybrid) duplicates `modelType` semantics — needs normalization
3. **Deal `status`** has 9 states (`negotiating, draft, review, signing, active, execution, delivery, completed, closed`) but no state machine enforces transitions — any code can set any status
4. **No Tenant entity** — system has no concept of organization/workspace
5. **No Subscription entity** linked to a real billing system (keys exist in storage but no logic)
6. **No File/Attachment entity** — deliverables reference documents but there is no blob storage layer
7. **No Review/Rating entity** linked to completed deals (reviews.json exists but not wired)

---

## 4. Entity Relationships — Gaps

### 4.1 Missing Referential Integrity

Documented in `docs/database-schema.md` line 105:  
> "No database constraints exist; duplicates or orphaned references are possible"

Specific gaps:

| Relationship | Current State | Required |
|---|---|---|
| `opportunity.creatorId` → User/Company | String field only | FK with CASCADE rules |
| `application.applicantId` → User/Company | Polymorphic string | Separate applicant_type discriminator |
| `deal.participants[].userId` | Array in JSON blob | Normalized deal_participants table |
| `contract.parties` | Array in JSON blob | Normalized contract_parties table |
| `postMatch.participants` | Array in JSON blob | Normalized post_match_participants table |
| Negotiation → Deal | `deal.negotiationId` exists | Bidirectional FK + uniqueness |
| Subscription → User/Company | Storage key exists | No actual subscription entity |

### 4.2 Missing Entities

| Missing Entity | Why Needed |
|---|---|
| `Tenant` | Multi-tenancy isolation |
| `Subscription` / `Plan` | Billing enforcement |
| `Payment` / `Invoice` | Revenue tracking |
| `File` / `Attachment` | Document management for contracts, deliverables |
| `Message` / `Thread` | In-app messaging (key exists but no thread model) |
| `Review` / `Rating` | Trust signals for matching algorithm |
| `Webhook` | Third-party integrations |
| `ApiKey` | B2B API access |
| `FeatureFlag` | Gradual rollout |
| `MatchingRun` | Matching job tracking (partially wired in `matching-service.js:1272`) |
| `SkillCanonical` | Skill normalization (exists in seed but no service API) |
| `Dispute` | Dispute lifecycle exists in `dispute-lifecycle.js` but entity not in main schema |

---

## 5. Missing Database Tables

The system uses localStorage exclusively. For production the following SQL tables are required:

### 5.1 Core Platform Tables (Missing)

```sql
-- Tenant isolation (CRITICAL for SaaS)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(32) DEFAULT 'active', -- active, suspended, churned
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unified identity (User + Company unified)
CREATE TABLE identities (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt/argon2
  identity_type VARCHAR(32) NOT NULL,  -- individual, company
  role VARCHAR(32) NOT NULL,           -- professional, consultant, company_owner, admin, moderator, auditor
  status VARCHAR(32) DEFAULT 'pending',
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions and billing
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  tier VARCHAR(32) NOT NULL, -- free, starter, growth, enterprise
  price_monthly NUMERIC(12,2),
  price_annual NUMERIC(12,2),
  max_opportunities INT,
  max_applications INT,
  matching_models TEXT[], -- one_way, two_way, consortium, circular
  features JSONB,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  identity_id UUID REFERENCES identities(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(32) DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'SAR',
  status VARCHAR(32),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMPTZ
);

-- File storage registry
CREATE TABLE files (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES identities(id),
  entity_type VARCHAR(64), -- contract, deal, application, profile
  entity_id UUID,
  file_name VARCHAR(512),
  mime_type VARCHAR(128),
  storage_key VARCHAR(1024), -- S3 key
  size_bytes BIGINT,
  is_deleted BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- E-signature tracking
CREATE TABLE signatures (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  signer_id UUID REFERENCES identities(id),
  status VARCHAR(32) DEFAULT 'pending', -- pending, signed, declined
  provider VARCHAR(64), -- docusign, adobe_sign, internal
  provider_envelope_id VARCHAR(255),
  signed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
);

-- Real-time messaging threads
CREATE TABLE message_threads (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(64), -- deal, negotiation, match
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id),
  sender_id UUID REFERENCES identities(id),
  body TEXT NOT NULL,
  attachments UUID[], -- file ids
  read_by JSONB, -- { userId: timestamp }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skill taxonomy (currently in skill-canonical.json)
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  canonical_name VARCHAR(255) UNIQUE NOT NULL,
  aliases TEXT[],
  category VARCHAR(128),
  is_active BOOLEAN DEFAULT true
);

-- Dispute management (dispute-lifecycle.js exists, entity missing)
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  deal_id UUID REFERENCES deals(id),
  raised_by UUID REFERENCES identities(id),
  reason TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'open', -- open, investigating, resolved, escalated
  resolution TEXT,
  resolved_by UUID REFERENCES identities(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook registrations
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  identity_id UUID REFERENCES identities(id),
  url VARCHAR(2048) NOT NULL,
  events TEXT[],
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_delivered_at TIMESTAMPTZ
);

-- API keys for B2B integrations
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  identity_id UUID REFERENCES identities(id),
  name VARCHAR(128),
  key_hash VARCHAR(255) NOT NULL,
  permissions TEXT[],
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  key VARCHAR(128) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INT DEFAULT 0,
  tenant_overrides JSONB
);

-- Matching runs (partially implemented in matching-service.js)
CREATE TABLE matching_runs (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id),
  models_run TEXT[],
  source VARCHAR(64), -- publish, admin_save, scheduled
  actor_id UUID REFERENCES identities(id),
  threshold NUMERIC(5,4),
  candidate_count INT,
  result_count INT,
  created_count INT,
  skipped_duplicate_count INT,
  top_scores NUMERIC[],
  duration_ms INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### 5.2 Tables That Need Major Restructuring

| Current "Table" (localStorage) | Problem | Required Change |
|---|---|---|
| `pmtwin_users` + `pmtwin_companies` | Two separate collections with identical schemas | Merge into `identities` with `identity_type` discriminator |
| `pmtwin_post_matches` with `participants` as JSON array | Unindexable, no FK | Normalize to `post_match_participants` join table |
| `pmtwin_deals` with `milestones` as JSON array | Cannot query milestones independently | `deal_milestones` table |
| `pmtwin_deals` with `participants` as JSON array | Cannot enforce per-participant state | `deal_participants` table |
| `pmtwin_audit` | Flat array, no partitioning | Partitioned by month, immutable with append-only write |
| `pmtwin_notifications` | Polling only, no push | Keep table + add delivery_channels table + queue |

---

## 6. Missing APIs

### 6.1 No API Layer Exists

The system has `POC/src/core/api/api-service.js` which is a **stub** — it wraps localStorage operations and makes them look like API calls. Zero HTTP endpoints exist anywhere.

The `web/src/lib/data-store.ts` imports JSON files directly at build time:
```typescript
// web/src/lib/data-store.ts:3-14
import opportunitiesBase from '@poc-data/opportunities.json'
import demoOpportunities from '@poc-data/demo-40-opportunities.json'
// ... 10 more static imports
```

### 6.2 Required REST API Surface (Complete)

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/mfa/setup
POST   /api/v1/auth/mfa/verify
```

#### Users & Companies
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:id/profile (public profile)
GET    /api/v1/companies/:id/profile

GET    /api/v1/admin/users          (paginated, filtered)
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/status  (approve/reject/suspend)
GET    /api/v1/admin/users/pending-vetting
```

#### Opportunities
```
GET    /api/v1/opportunities         (paginated, filtered, searched)
POST   /api/v1/opportunities
GET    /api/v1/opportunities/:id
PATCH  /api/v1/opportunities/:id
DELETE /api/v1/opportunities/:id
POST   /api/v1/opportunities/:id/publish
POST   /api/v1/opportunities/:id/close
GET    /api/v1/opportunities/:id/applications
GET    /api/v1/opportunities/:id/matches
GET    /api/v1/me/opportunities      (my opportunities)
```

#### Applications
```
POST   /api/v1/opportunities/:id/applications
GET    /api/v1/applications/:id
PATCH  /api/v1/applications/:id/status  (shortlist/accept/reject)
POST   /api/v1/applications/:id/withdraw
GET    /api/v1/me/applications
```

#### Matching
```
GET    /api/v1/matches               (my matches)
GET    /api/v1/matches/:id
POST   /api/v1/matches/:id/accept
POST   /api/v1/matches/:id/decline
POST   /api/v1/admin/matching/run    (trigger matching for opportunity)
POST   /api/v1/admin/matching/bulk-run
GET    /api/v1/admin/matching/runs
GET    /api/v1/admin/matching/runs/:id
```

#### Negotiations
```
POST   /api/v1/negotiations          (create from match/application)
GET    /api/v1/negotiations/:id
POST   /api/v1/negotiations/:id/rounds     (add counter-offer)
POST   /api/v1/negotiations/:id/agree
POST   /api/v1/negotiations/:id/cancel
GET    /api/v1/me/negotiations
```

#### Deals
```
POST   /api/v1/deals                 (create from confirmed match/negotiation)
GET    /api/v1/deals/:id
PATCH  /api/v1/deals/:id
POST   /api/v1/deals/:id/milestones
PATCH  /api/v1/deals/:id/milestones/:milestoneId
POST   /api/v1/deals/:id/milestones/:milestoneId/submit
POST   /api/v1/deals/:id/milestones/:milestoneId/approve
POST   /api/v1/deals/:id/milestones/:milestoneId/reject
POST   /api/v1/deals/:id/complete
POST   /api/v1/deals/:id/close
GET    /api/v1/me/deals
```

#### Contracts
```
POST   /api/v1/contracts             (generate from deal)
GET    /api/v1/contracts/:id
POST   /api/v1/contracts/:id/sign
POST   /api/v1/contracts/:id/terminate
GET    /api/v1/me/contracts
GET    /api/v1/contracts/:id/download  (PDF)
```

#### Disputes
```
POST   /api/v1/deals/:id/disputes
GET    /api/v1/disputes/:id
POST   /api/v1/admin/disputes/:id/resolve
GET    /api/v1/admin/disputes
```

#### Notifications
```
GET    /api/v1/notifications
POST   /api/v1/notifications/:id/read
POST   /api/v1/notifications/read-all
GET    /api/v1/notifications/preferences
PATCH  /api/v1/notifications/preferences
```

#### Messaging
```
GET    /api/v1/threads/:entityType/:entityId
POST   /api/v1/threads/:entityType/:entityId/messages
GET    /api/v1/threads/:entityType/:entityId/messages (paginated)
```

#### Analytics & Reports
```
GET    /api/v1/admin/analytics/overview
GET    /api/v1/admin/analytics/matching
GET    /api/v1/admin/analytics/deals
GET    /api/v1/admin/analytics/users
GET    /api/v1/admin/reports/export?type=csv&entity=deals
```

#### Billing
```
GET    /api/v1/billing/plans
POST   /api/v1/billing/subscribe
PATCH  /api/v1/billing/subscription
DELETE /api/v1/billing/subscription
GET    /api/v1/billing/invoices
POST   /api/v1/billing/webhooks  (Stripe webhook receiver)
```

#### Files
```
POST   /api/v1/files/upload         (multipart/form-data)
GET    /api/v1/files/:id
DELETE /api/v1/files/:id
```

#### Webhooks & API Keys
```
GET    /api/v1/webhooks
POST   /api/v1/webhooks
DELETE /api/v1/webhooks/:id
POST   /api/v1/webhooks/:id/test
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

---

## 7. Missing Business Logic

### 7.1 No Server-Side Enforcement

All business rules currently live in JavaScript executed in a browser. Any user with DevTools can bypass every rule. Critical missing enforcement:

| Rule | Current Location | Production Requirement |
|---|---|---|
| "Users cannot apply to own opportunities" | `application-validator.js` (client) | Server-side check before INSERT |
| "One application per user per opportunity" | Client validator | Unique constraint on DB + server check |
| "SPV requires 50M SAR minimum" | `matching-service.js:533` (hardcoded) | Configurable business rule table |
| "Admin cannot approve own account" | Client check | Server-side identity check |
| "Published opportunity triggers matching" | Client-side `persistPostMatches()` | Background job queue (BullMQ/SQS) |
| Subscription limits (max opportunities) | Keys exist, logic absent | Enforced at API layer with plan checks |
| Match score threshold (70%/80%) | `CONFIG.MATCHING` (client config) | Server-side config with admin override |

### 7.2 Missing Idempotency

`matching-service.js` has deduplication logic (`_createPostMatchForPersist`) but it runs in-memory per browser session. In a distributed system:
- Two admin users triggering matching simultaneously = duplicate PostMatches
- No distributed lock mechanism
- No idempotency keys on mutations

### 7.3 Missing Rate Limiting

No rate limiting on any operation. In production, required on:
- Login attempts (brute force)
- Opportunity creation (spam)
- Application submission (abuse)
- Matching runs (expensive compute)
- File uploads (storage abuse)

### 7.4 Missing Data Validation (Server)

`POC/src/core/validation/` has 10 validator files — all client-side only. Required:
- Server-side schema validation (Zod/Joi on Node.js, Pydantic on Python)
- Database-level constraints
- Input sanitization to prevent XSS/SQL injection

### 7.5 Missing Opportunity Versioning

Opportunities can be edited after matching. There is no:
- Snapshot of opportunity state at time of match
- Versioning of opportunity for audit purposes
- Lock on editing when in `in_negotiation` or `contracted` status

---

## 8. Missing Matching Engine Logic

### 8.1 What Exists (POC)

File: `POC/src/services/matching/matching-service.js` (1461 lines)

Sophisticated algorithm with:
- 4 exchange models: one_way, two_way (barter), consortium, circular
- Composite scoring: skills (50%), sector (15%), certifications (15%), payment (10%), value (15%)
- Reputation scoring via `getPastPerformanceScore()`
- Hard constraints via `hard-constraints.js`
- Post-preprocessor via `post-preprocessor.js`
- Consortium replacement via `replacement-lifecycle.js`

**This is genuinely good business logic trapped in a browser.**

### 8.2 What Is Missing

| Gap | Impact | File Reference |
|---|---|---|
| **No background job execution** | Matching never runs without manual admin trigger | Need: cron job / event-driven trigger on publish |
| **No ML/embedding-based semantic matching** | Pure keyword/tag matching only | `semantic-profile.js` exists but is stub |
| **Reputation score is acceptance rate only** | Easily gamed, no review integration | `getPastPerformanceScore()` line 709: trivial |
| **Circular exchange limited to 3-party** | Real markets need N-party chains | `matching-models.js` circular algorithm |
| **No geographic matching** | Location check is hardcoded `score += 10` (line 476) | Requires geolocation API / PostGIS |
| **No real-time match expiry** | `expiresAt` field exists but never enforced | Need: scheduled job to expire stale matches |
| **Score weights are hardcoded** | Admin cannot tune per-sector weights | `CONFIG.MATCHING.WEIGHTS_PROFILE` referenced but not implemented |
| **No A/B testing of matching algorithms** | Cannot measure algorithm quality | Feature flag + experiment framework needed |
| **No feedback loop** | Declined matches don't improve future scoring | Need: ML retraining pipeline |
| **Consortium role-fill completeness** | No enforcement that all roles are filled before deal | Missing: "consortium readiness" gate |

### 8.3 Matching Engine Architecture Required

```
Opportunity Published
       ↓
   Event Bus (Kafka/SQS)
       ↓
Matching Worker (Node.js/Python)
       ↓
   Pre-filter (hard constraints)
       ↓
   Scoring Engine (existing JS logic → ported to server)
       ↓
   Post-ranking (composite score + reputation)
       ↓
   Dedupe check (Redis/DB unique constraint)
       ↓
   PostMatch saved to DB
       ↓
   Notification Job → Email + In-app + Push
```

---

## 9. Missing Negotiation Workflow

### 9.1 What Exists

File: `POC/src/services/matching/negotiation-lifecycle.js`  
File: `POC/features/negotiation-detail/negotiation-detail.js`  
File: `POC/src/core/validation/negotiation-validator.js`

The lifecycle helpers exist: `isActiveNegotiation()`, `canAddNegotiationRound()`, `allRequiredParticipantsAgreed()`, `participantAgreements` tracking.

### 9.2 What Is Missing

| Missing Component | Description |
|---|---|
| **Multi-party negotiation protocol** | Current: 2-party only. Consortium negotiations need N-party round management |
| **Negotiation templates** | No pre-built term sheets per model type (SPV vs task-based differ dramatically) |
| **Counterparty timeout / expiry** | No SLA on response times; no auto-cancel after N days |
| **Negotiation escrow linkage** | Value exchange negotiations need escrow concept before deal confirmation |
| **Real-time sync** | Two parties editing simultaneously causes data conflicts (localStorage) |
| **Audit trail per round** | Rounds exist but no immutable hash-chain for legal validity |
| **Legal template generation** | Agreed terms → draft contract PDF not implemented |
| **Redline/markup tracking** | Term changes are not diff-tracked across rounds |
| **Admin mediation workflow** | Admin can view negotiations but no formal mediation tool |
| **Notification per round** | Currently global notification only, not per-round trigger |

### 9.3 Missing State Machine

Current negotiation statuses: `open, counter_offered, agreed, failed, expired, cancelled`

Missing transitions:
- `open` → `awaiting_escrow` (when value is confirmed)
- `agreed` → `contract_draft_generated`
- No enforced participant quorum before `agreed` state (validated client-side only)
- No admin intervention state (mediation, arbitration)

---

## 10. Missing Deal Lifecycle

### 10.1 What Exists

File: `POC/src/services/matching/deal-lifecycle.js`  
File: `POC/features/deal-detail/deal-detail.js`  
File: `POC/src/core/validation/deal-validator.js`

Deal statuses: `negotiating, draft, review, signing, active, execution, delivery, completed, closed`  
Milestone statuses: `pending, in_progress, submitted, approved, rejected`

### 10.2 Critical Gaps

| Gap | File Reference | Impact |
|---|---|---|
| **No state machine enforcement** | `deal-validator.js` validates client-side only | Any client can set `deal.status = 'completed'` bypassing milestones |
| **No milestone gating** | Deals can reach `completed` without all milestones approved | Revenue leakage risk |
| **No payment release trigger** | Milestones have no linkage to payment events | Finance system cannot be integrated |
| **No deliverable file attachments** | `deal.deliverables` is a text string | No actual file submission mechanism |
| **Consortium slot tracking incomplete** | `deal.roleSlots` exists but not enforced | Consortium deals can proceed with empty roles |
| **No deal amendment workflow** | Once active, scope cannot be changed through controlled process | Change-order management missing |
| **No KPI tracking** | `deal.scope` is text only | No structured performance metrics |
| **Circular deal value reconciliation** | No settlement mechanism for multi-party circular exchanges | Legal/financial risk |
| **Deal expiry/abandonment** | No timeout mechanism for stalled deals | DB accumulates zombie deals |
| **Dispute integration** | `dispute-lifecycle.js` exists but not linked to deal state transitions | Disputes don't pause/affect deal progression |

---

## 11. Missing Contract Lifecycle

### 11.1 What Exists

File: `POC/features/contracts/contracts.js`  
File: `POC/features/contract-detail/contract-detail.js`  
File: `POC/src/core/validation/contract-validator.js`

Contract has: parties, scope, paymentMode, agreedValue, duration, paymentSchedule, equityVesting, profitShare, milestonesSnapshot, status fields.

### 11.2 Critical Gaps

| Gap | Impact |
|---|---|
| **No PDF generation** | Contracts exist as database records only; no legal document generated |
| **No e-signature integration** | Parties cannot digitally sign (DocuSign / Adobe Sign / internal PKI) |
| **No contract template engine** | Each contract type (SPV, consortium, barter, service) needs different legal template |
| **No version control on contracts** | Amendments create new versions, must track changes |
| **No legal review workflow** | Contracts go directly to signing with no legal hold/review state |
| **No automatic renewal** | Recurring contracts have no renewal trigger |
| **Contract termination clauses** | `contract.status = 'terminated'` but no termination reason, compensation, or notice period |
| **Multi-currency support** | `agreedValue` is single number; no currency normalization |
| **Tax compliance** | No VAT calculation (15% in KSA) built into contract value |
| **Contract archival** | No long-term archival strategy with immutability guarantees |

---

## 12. Missing Notification Architecture

### 12.1 What Exists

File: `POC/src/services/notifications/notification-delivery.js`  
File: `POC/data/notifications.json`

Notification types: `new_match_found, application_received, application_status_changed, account_approved, account_rejected, account_suspended, account_activated`

### 12.2 Critical Gaps

| Gap | Impact |
|---|---|
| **No delivery channel** | Notifications only exist in localStorage — never sent to user |
| **No email delivery** | Zero email integration (SendGrid/SES/Mailgun absent) |
| **No push notifications** | No Web Push / Firebase Cloud Messaging |
| **No SMS notifications** | No Twilio / AWS SNS integration for critical events |
| **No notification preferences** | Users cannot choose email vs in-app vs SMS |
| **No notification digest** | No daily/weekly summary emails |
| **No notification queue** | High-volume events (matching run creates N notifications) processed synchronously |
| **No retry mechanism** | Failed delivery has no retry |
| **No read receipts** | `read: boolean` exists but no analytics on open rates |
| **Missing notification types** | Milestone due, contract expiry, deal stalling, negotiation timeout, payment due, dispute opened |
| **Admin notifications absent** | Admins not notified of: new vetting requests, disputes, system health events |

### 12.3 Required Architecture

```
Event Bus
    ↓
Notification Service
    ├── In-App (WebSocket / SSE → PostgreSQL)
    ├── Email (SendGrid → templates by event type)
    ├── SMS (Twilio → critical events only)
    └── Push (FCM/APNs → mobile app)
         ↓
    Delivery Queue (Redis/SQS)
         ↓
    Delivery Log (DB) with retry + dead-letter
```

---

## 13. Missing Audit Trail

### 13.1 What Exists

File: `POC/data/audit.json`  
Entity: `{ id, userId, action, entityType, entityId, timestamp, details }`

Actions logged: `user_registered, opportunity_created, match_created` etc.

### 13.2 Critical Gaps

| Gap | Impact |
|---|---|
| **Mutable audit log** | localStorage can be modified by any user — legally inadmissible |
| **No server-side audit writes** | Audit entries only created by client JS — can be bypassed |
| **Missing audit events** | Negotiation rounds, contract signing, milestone approvals, payment events, admin actions not audited |
| **No tamper-proof mechanism** | No append-only DB guarantee; no hash-chain; no WORM storage |
| **No audit export** | Cannot export audit log in structured format (CSV/JSON) for compliance |
| **No retention policy** | No configurable retention (SAMA/PDPL regulations in KSA may require 5-7 years) |
| **No PII redaction in audit** | Audit `details` may contain PII — no redaction mechanism |
| **IP address / User-Agent absent** | No forensic metadata in audit entries |
| **Admin action logging incomplete** | `admin-validator.js` validates but doesn't log all admin actions |

### 13.3 Required Audit Architecture

```sql
-- Immutable, append-only audit table
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  actor_id UUID REFERENCES identities(id),
  actor_role VARCHAR(32),
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64),
  entity_id UUID,
  entity_snapshot JSONB,  -- before/after snapshot
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  prev_hash VARCHAR(64),  -- hash chain for tamper detection
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
) PARTITION BY RANGE (created_at);  -- monthly partitions

-- Row-level security: no UPDATE, no DELETE
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_log FOR INSERT;
-- No UPDATE or DELETE policies → effectively append-only
```

---

## 14. Missing Permission Matrix

### 14.1 What Exists

File: `POC/src/core/auth/auth-service.js`

Admin capability matrix: 20 capabilities across 3 roles (admin, moderator, auditor). Well-designed.  
File: `POC/src/services/matching/matching-lifecycle-permissions.js`

### 14.2 Critical Gaps

| Gap | Impact |
|---|---|
| **No resource-level permissions** | Current: role only. Missing: "can edit OWN opportunity only" |
| **No API-level enforcement** | Permissions checked in browser JS — zero server enforcement |
| **Professional vs Company permissions differ** | Both exist as user role types but same code paths |
| **No data scoping** | A professional can theoretically see all opportunities, all users |
| **No team/organization permissions** | Companies have no sub-user management (employee accounts) |
| **No permission inheritance** | Flat role model — no RBAC tree |
| **Subscription-gated features absent** | Free users can access all features (subscription logic not wired) |
| **No field-level permissions** | Sensitive fields (salary, financialCapacity) visible to all |
| **No IP allowlisting** | Admin portal has no network access restriction |

### 14.3 Required Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│  Resource         │ Super Admin │ Admin │ Moderator │ Auditor  │
│                   │             │       │           │ (Read)   │
├───────────────────┼─────────────┼───────┼───────────┼──────────┤
│ Tenants           │  CRUD       │  R    │  -        │  R       │
│ Users             │  CRUD       │  CRUD │  R,U(st.) │  R       │
│ Opportunities     │  CRUD       │  CRUD │  R,U(st.) │  R       │
│ Matching.run      │  CRUD       │  CRU  │  R        │  R       │
│ Negotiations      │  CRUD       │  CRU  │  R        │  R       │
│ Deals             │  CRUD       │  CRU  │  R        │  R       │
│ Contracts         │  CRUD       │  CRU  │  R        │  R       │
│ Disputes          │  CRUD       │  CRUD │  CRU      │  R       │
│ Audit Log         │  R          │  R    │  R        │  R       │
│ Billing           │  CRUD       │  R    │  -        │  -       │
│ System Settings   │  CRUD       │  CRU  │  R        │  -       │
└───────────────────┴─────────────┴───────┴───────────┴──────────┘

User-facing:
┌─────────────────────────────────────────────────────────────────┐
│  Resource         │ Company Owner │ Professional │ Consultant  │
├───────────────────┼───────────────┼──────────────┼─────────────┤
│ Own Opportunities │  CRUD         │  CRUD        │  CRUD       │
│ Others' Opps      │  R (public)   │  R (public)  │  R (public) │
│ Applications      │  R (received) │  R (own)     │  R (own)    │
│ Own Deals         │  CRUD         │  CRUD        │  CRUD       │
│ Others' Deals     │  -            │  -           │  -          │
│ Profiles          │  R (public)   │  R (public)  │  R (public) │
└───────────────────┴───────────────┴──────────────┴─────────────┘
```

---

## 15. Missing Event System

### 15.1 What Exists

File: `POC/src/core/events/event-bus.js`

A simple browser-side `EventEmitter` pattern. Purely in-memory, lost on page reload.

### 15.2 Critical Gaps

| Gap | Impact |
|---|---|
| **No persistent event store** | Events lost on page reload; cannot replay |
| **No distributed event bus** | Single browser instance — no cross-user event propagation |
| **No event schema registry** | Event types are string literals, no versioning |
| **No event consumer isolation** | All consumers in same process |
| **No event replay** | Cannot replay events for audit or debug |
| **No dead letter queue** | Failed event processing is silently dropped |

### 15.3 Required Event Architecture

```
Domain Events (Server-side):
  opportunity.published
  opportunity.expired
  match.created
  match.accepted / match.declined
  match.expired
  negotiation.round_added
  negotiation.agreed
  negotiation.expired
  deal.created
  deal.milestone.submitted
  deal.milestone.approved
  deal.completed
  contract.signed
  contract.terminated
  payment.received
  dispute.opened
  dispute.resolved
  user.registered
  user.approved / user.rejected
  user.suspended
  subscription.created / subscription.cancelled

Event Bus Options:
  - BullMQ (Redis-backed, Node.js) — recommended for < 100K users
  - Kafka — recommended for > 100K users
  - AWS EventBridge — recommended for serverless

Each event triggers:
  - Notification Service
  - Audit Writer
  - Analytics Collector
  - Webhook Dispatcher
  - Email/SMS Queue
```

---

## 16. Missing Analytics

### 16.1 What Exists

File: `POC/src/utils/post-match-analytics.js`  
File: `POC/features/admin-reports/admin-reports.js`

Basic in-browser analytics over localStorage data.

### 16.2 What Is Missing (Complete List)

**Platform Health Metrics:**
- Total active users by segment (professional / company)
- Monthly Active Users (MAU) / Daily Active Users (DAU)
- Registration conversion rate (registered → vetted → active)
- Opportunity publication rate and success rate

**Matching Funnel:**
- Match → Accepted rate by model type
- Match → Deal conversion rate
- Time from publish → first match
- Declined match reasons (no feedback mechanism exists)
- Match score distribution by model type

**Deal & Contract Metrics:**
- Deal conversion rate (match → deal)
- Average deal value by model type
- Deal completion rate
- Deal cycle time (created → completed)
- Milestone approval rate / rejection rate
- Dispute rate per deal type

**Revenue Metrics (currently zero):**
- MRR / ARR
- Churn rate
- LTV by user segment
- Revenue per opportunity type

**Missing Infrastructure:**
- No event tracking (Mixpanel / Amplitude / PostHog)
- No product analytics
- No funnel analysis
- No cohort analysis
- No A/B test results
- No BI tool integration (Metabase / Redash / Tableau)

---

## 17. Missing Reporting

### 17.1 What Exists

File: `POC/features/admin-reports/admin-reports.js`

Basic admin report page that aggregates localStorage data.

### 17.2 Missing Reports

| Report | Required By | Status |
|---|---|---|
| Platform activity report | Operations | Missing |
| Matching effectiveness report | Product | Missing |
| User vetting pipeline report | Admin | Missing |
| Deal completion report | Finance | Missing |
| Revenue report | Finance | Entirely missing (no revenue) |
| Subscription usage report | Finance | Missing |
| Audit compliance report | Legal/SAMA | Missing |
| SLA performance report | Operations | Missing |
| Skill demand vs supply gap | Product | Missing |
| Geographic distribution | Sales | Missing |
| API usage report | Engineering | Missing |

### 17.3 Required Reporting Stack

```
PostgreSQL / TimescaleDB
       ↓
Analytics Aggregation Layer (materialized views / dbt)
       ↓
BI Tool (Metabase recommended for cost efficiency)
       ↓
Admin Dashboard API (/api/v1/admin/analytics/*)
       ↓
React Admin Charts (existing admin-reports page)
```

---

## 18. Missing Multi-Tenancy Architecture

### 18.1 Current State

**Zero multi-tenancy exists.** All data is in a single namespace. The concept of "tenant" does not appear anywhere in the codebase except as a future mention in documentation.

### 18.2 Required Multi-Tenancy Model

For PMTwin, the recommended model is **Schema-per-tenant** or **Row-level-security (RLS) per tenant** depending on scale:

| Approach | When to Use | Trade-off |
|---|---|---|
| Shared DB + RLS | Up to 100K users, < 1000 tenants | Lower cost, harder debugging |
| Schema-per-tenant | Enterprise clients requiring data isolation | Higher cost, easier compliance |
| DB-per-tenant | Regulated industries requiring full isolation | Highest cost |

**Recommendation:** Start with Shared DB + PostgreSQL Row-Level Security.

### 18.3 Missing Tenant-Scoped Entities

All of the following must be tenant-scoped:
- Opportunities
- Applications
- PostMatches
- Deals
- Contracts
- Notifications
- Audit Logs
- Skill Canonical
- System Settings (each tenant may have custom thresholds)
- Matching Configuration (per-tenant weights)

### 18.4 Missing Tenant Management

- Tenant creation workflow
- Tenant suspension / deletion
- Tenant data export (GDPR-equivalent for KSA PDPL)
- Tenant-level feature flags
- Tenant usage metering
- Tenant billing portal

---

## 19. Missing Enterprise Features

### 19.1 Security

| Feature | Status |
|---|---|
| Password hashing (bcrypt/argon2) | Missing — currently `btoa()` in `web/src/lib/auth-service.ts:14` |
| MFA / TOTP | Missing |
| SSO / SAML 2.0 / OAuth2 | Missing |
| JWT with short expiry + refresh tokens | Missing |
| CSRF protection | Missing (noted in BRD as "future") |
| Rate limiting | Missing |
| SQL injection protection | Missing (no SQL exists — but required when migrating) |
| XSS protection (CSP headers) | Missing |
| Secrets management (Vault / AWS Secrets Manager) | Missing |
| Penetration testing | Not conducted |

### 19.2 Compliance (KSA-Specific)

| Requirement | Status |
|---|---|
| PDPL (Personal Data Protection Law) | Missing — no data subject request workflow |
| SAMA (Saudi Central Bank requirements for fintech) | Missing — no regulatory framework |
| NCA (National Cybersecurity Authority) | Missing — no security baseline |
| Data residency (data must stay in KSA) | Missing — no region enforcement |
| VAT (15% in KSA) | Missing — no tax computation |
| ZATCA e-invoicing | Missing — Phase 2 requires Fatoorah integration |

### 19.3 Infrastructure & DevOps

| Feature | Status |
|---|---|
| CI/CD pipeline | Missing — no `.github/workflows/` or equivalent |
| Container orchestration (Docker/K8s) | Missing |
| Horizontal scaling | Impossible — client-only architecture |
| Database backups | Not applicable (localStorage) |
| Disaster recovery plan | Missing |
| Load testing baseline | Missing |
| APM / tracing (DataDog / New Relic) | Missing |
| Log aggregation (ELK / CloudWatch) | Missing |
| Health checks / readiness probes | Missing |
| Zero-downtime deployments | Missing |

### 19.4 Integration Ecosystem

| Integration | Status | Priority |
|---|---|---|
| DocuSign / Adobe Sign | Missing | P0 — contracts cannot be legally signed |
| Stripe / HyperPay (KSA) | Missing | P0 — no revenue collection |
| SendGrid / AWS SES | Missing | P0 — no email delivery |
| Twilio / unifonic (KSA SMS) | Missing | P1 — OTP / notifications |
| AWS S3 / GCS | Missing | P0 — no file storage |
| PostGIS / Google Maps API | Missing | P1 — geographic matching |
| Elasticsearch | Missing | P1 — opportunity search at scale |
| Redis | Missing | P1 — sessions, caching, rate limiting, job queues |
| Stripe Radar / fraud detection | Missing | P1 — payment fraud |
| Sentry | Missing | P1 — error monitoring |
| ZATCA Fatoorah | Missing | P2 — e-invoicing compliance |

---

## 20. Target Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  Web App (React/Next.js)   Mobile App (React Native / Flutter)     │
│  PWA with service worker   Push notifications                       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY LAYER                              │
│                                                                     │
│  Kong / AWS API Gateway                                             │
│  - Rate limiting, Auth token validation                             │
│  - Request routing, SSL termination                                 │
│  - Tenant identification via subdomain / header                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      APPLICATION LAYER                              │
│                                                                     │
│  REST API (Node.js / Fastify or Python / FastAPI)                  │
│  Microservices or modular monolith (start monolith):                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Auth Service │ │ User Service │ │  Opp Service │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │Match Service │ │ Deal Service │ │Contract Svc  │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │Notify Service│ │Billing Svc   │ │ File Service │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      ASYNC LAYER                                    │
│                                                                     │
│  BullMQ (Redis-backed)                                              │
│  ├── matching-queue     → Matching Worker (existing JS → ported)   │
│  ├── notification-queue → Notification Worker                       │
│  ├── email-queue        → SendGrid Worker                           │
│  ├── pdf-queue          → Contract PDF Generator                   │
│  └── analytics-queue    → Analytics Collector                      │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                     │
│                                                                     │
│  PostgreSQL (primary)   Redis (cache + sessions + queues)          │
│  Elasticsearch (search) S3 (file storage)                          │
│  TimescaleDB (analytics) S3 Glacier (audit archival)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 21. Gap Analysis Summary

| Domain | Current | Required | Gap Size |
|---|---|---|---|
| Data Persistence | localStorage | PostgreSQL + Redis | CRITICAL |
| Authentication | btoa() + sessionStorage | JWT + bcrypt + MFA | CRITICAL |
| API Layer | None (localStorage wrapper) | 80+ REST endpoints | CRITICAL |
| Background Jobs | None | BullMQ + Workers | CRITICAL |
| Email Delivery | None | SendGrid integration | CRITICAL |
| File Storage | None | S3 + file service | CRITICAL |
| Multi-Tenancy | None | RLS + tenant model | HIGH |
| E-Signature | None | DocuSign/Adobe Sign | HIGH |
| Billing | None | Stripe integration | HIGH |
| Matching Engine | Client-side JS | Server-side Worker | HIGH |
| Notification Delivery | localStorage | Multi-channel delivery | HIGH |
| Audit Trail | Mutable localStorage | Immutable append-only DB | HIGH |
| Permission Enforcement | Client-side only | Server-side RBAC | HIGH |
| Search | None | Elasticsearch | MEDIUM |
| Analytics | localStorage aggregation | Analytics platform | MEDIUM |
| Geographic Matching | Hardcoded +10pts | PostGIS / Maps API | MEDIUM |
| Dispute Management | lifecycle helpers | Full workflow | MEDIUM |
| Contract PDF | None | PDF template engine | MEDIUM |
| KSA Compliance | None | PDPL + ZATCA | MEDIUM |
| SSO | None | SAML 2.0 / OAuth2 | LOW |

---

## 22. P0 — Critical Blockers

> P0 = System cannot go to production without these. They represent fundamental security, data, and functional failures.

### P0-1: Replace localStorage with PostgreSQL
**Files affected:** `POC/src/core/data/data-service.js`, `POC/src/core/storage/storage-service.js`, all 20+ localStorage calls  
**Risk:** Data exists only in one browser. Two users cannot see each other's data.  
**Action:** Stand up PostgreSQL. Port `data-service.js` to an ORM (Prisma / Drizzle). Replace localStorage CRUD with API calls.

### P0-2: Replace btoa() password encoding with bcrypt/argon2
**File:** `web/src/lib/auth-service.ts:14` — `return btoa(password)`  
**File:** `POC/src/core/auth/auth-service.js:144` — same pattern  
**Risk:** All user passwords are Base64-encoded strings. Any DB access reveals all credentials.  
**Action:** Implement bcrypt (cost factor 12) or argon2id server-side. Force password reset on migration.

### P0-3: Build a real API server
**Current state:** Zero HTTP endpoints exist anywhere.  
**Risk:** No API = no multi-user product.  
**Action:** Node.js/Fastify or Python/FastAPI. Implement auth endpoints first, then core entity CRUD.

### P0-4: Implement server-side session management
**File:** `web/src/lib/auth-service.ts:19` — `return \`${Date.now()}-${Math.random().toString(36).slice(2)}\``  
**Risk:** Tokens are client-generated pseudo-random strings stored in localStorage. No revocation. No expiry. No signature verification.  
**Action:** JWT with RS256, 15-minute access tokens, 7-day refresh tokens in httpOnly cookies.

### P0-5: Move matching engine to server
**File:** `POC/src/services/matching/matching-service.js` (1461 lines)  
**Risk:** Matching only runs when admin is logged in and manually triggers it. New user signup never sees matches.  
**Action:** Port matching service to Node.js worker. Trigger on opportunity publish event via BullMQ.

### P0-6: Implement email delivery
**Current state:** No email service referenced anywhere.  
**Risk:** Users never receive: account approval, match notifications, deal updates, contract signing requests.  
**Action:** Integrate SendGrid (or AWS SES). Build transactional email templates for all lifecycle events.

### P0-7: Implement file storage
**Current state:** Contracts, deliverables, and profile documents are referenced as text strings.  
**Risk:** No actual document can be uploaded or retrieved.  
**Action:** S3 (or Cloudflare R2) + presigned URLs. File upload API endpoint. Virus scanning.

### P0-8: Implement CSRF and XSS protection
**BRD acknowledgment:** `BRD/05_Technical_Requirements.md:238` — "CSRF protection (future)"  
**Risk:** Entire admin portal is vulnerable to CSRF attacks. No CSP headers.  
**Action:** SameSite=Strict cookies, CSRF tokens, Content-Security-Policy headers.

---

## 23. P1 — High Priority

> P1 = Required for a functioning production system that can be trusted.

### P1-1: Implement multi-tenancy
All entities need `tenant_id` FK. Row-Level Security policies on PostgreSQL. Tenant middleware on all API routes.

### P1-2: E-signature integration (DocuSign / Adobe Sign)
Contract entity exists with `signedAt` field but no signature mechanism. Without e-signatures, contracts have no legal weight.

### P1-3: Billing and subscription enforcement
`pmtwin_subscription_plans` and `pmtwin_subscriptions` storage keys exist with no logic. Integration with Stripe required. Feature gates must block access based on plan.

### P1-4: Real-time messaging
`pmtwin_messages` and `pmtwin_connections` exist but are static. Deals and negotiations require real-time chat (WebSocket via Socket.io or Supabase Realtime).

### P1-5: Immutable audit trail
Current audit log in localStorage is mutable and legally worthless. Append-only PostgreSQL table with hash chain required for regulatory compliance.

### P1-6: Server-side permission enforcement
All 20 admin capabilities in `auth-service.js` are checked client-side. Any HTTP request bypasses them. Every API endpoint needs auth middleware checking role + capability.

### P1-7: Notification delivery infrastructure
Multi-channel notification: in-app (WebSocket), email (SendGrid), SMS (Twilio/unifonic). Delivery queue, retry logic, preference management.

### P1-8: Dispute management workflow
`POC/src/services/matching/dispute-lifecycle.js` and `POC/features/admin-disputes/admin-disputes.js` exist. Full dispute entity, admin mediation workflow, and deal pause mechanism required.

### P1-9: Full-text search
Opportunity discovery currently relies on list filtering. Elasticsearch or PostgreSQL full-text search required for 100K+ opportunities.

### P1-10: KSA compliance baseline
PDPL data subject rights (access, deletion, portability). ZATCA e-invoicing for paid transactions. Data residency in KSA AWS region (me-south-1).

---

## 24. P2 — Medium Priority

> P2 = Required for scale and enterprise readiness but not blocking initial launch.

### P2-1: Geographic matching upgrade
Location scoring is `score += 10` hardcoded in `matching-service.js:476`. Requires PostGIS for proper distance-based scoring.

### P2-2: Semantic skill matching
`semantic-profile.js` exists as a stub. TF-IDF or embedding-based skill matching would significantly improve match quality.

### P2-3: Contract PDF generation
Template engine (Puppeteer/wkhtmltopdf) to generate legally-formatted contracts from deal terms.

### P2-4: Analytics platform
Integrate PostHog or Amplitude for product analytics. Build admin BI dashboard on top of TimescaleDB.

### P2-5: CI/CD pipeline
No CI/CD exists. GitHub Actions for: lint → test → build → deploy to staging → smoke test → deploy to prod.

### P2-6: SSO / Enterprise login
SAML 2.0 for enterprise companies. OAuth2 social login (Google Workspace) for individual users.

### P2-7: API key management for B2B integrations
Enterprise clients need API keys to integrate PMTwin into their ERP systems.

### P2-8: Mobile application
Progressive Web App or React Native for mobile-first Saudi market.

### P2-9: Webhook delivery system
Let third-party systems subscribe to deal and contract events.

### P2-10: Matching algorithm feedback loop
Track which matches led to deals. Feed deal outcomes back into scoring weights. A/B test algorithm variants.

---

## 25. Production Roadmap

### Phase 0 — Foundation (Weeks 1–6) — P0 Issues
**Goal:** Turn POC into a real multi-user server-based system.

| Week | Task | Owner |
|---|---|---|
| 1 | Set up Node.js/Fastify API server + PostgreSQL on Docker | Backend |
| 1 | Design final DB schema (identities, opportunities, applications, post_matches, deals, contracts, negotiations, audit_log) | Backend |
| 2 | Migrate data-service.js → Prisma ORM models | Backend |
| 2 | Implement auth API: register, login, refresh, logout with JWT + bcrypt | Backend |
| 3 | Implement core CRUD APIs: users, opportunities, applications | Backend |
| 3 | Implement server-side session middleware + permission middleware | Backend |
| 4 | Port matching-service.js → Node.js matching worker | Backend |
| 4 | Integrate BullMQ: publish opportunity → queue matching job | Backend |
| 5 | Integrate SendGrid: transactional emails for account and match events | Backend |
| 5 | Integrate S3: file upload API + presigned download URLs | Backend |
| 6 | CSRF protection, rate limiting (express-rate-limit), security headers | Backend |
| 6 | Update React web app to call real API (replace data-store.ts imports) | Frontend |

**Exit criteria:** Two users on different devices can register, create opportunities, see each other's matches.

---

### Phase 1 — Core Workflow (Weeks 7–14) — P1 Issues
**Goal:** Complete the deal → contract → signature lifecycle.

| Week | Task |
|---|---|
| 7 | Negotiation API + WebSocket for real-time round updates |
| 7 | Deal API with server-enforced state machine |
| 8 | Contract API + DocuSign integration (webhook for signature events) |
| 8 | Dispute entity + admin mediation workflow |
| 9 | Notification delivery: in-app (SSE), email (SendGrid), SMS (Twilio) |
| 9 | Notification preferences API |
| 10 | Immutable audit trail (append-only + hash chain) |
| 10 | Full server-side permission enforcement on all endpoints |
| 11 | Multi-tenancy: add tenant_id to all entities, RLS policies |
| 11 | Tenant management admin endpoints |
| 12 | Billing: Stripe integration, subscription plans, usage limits |
| 12 | Feature gates based on subscription plan |
| 13 | Full-text search: Elasticsearch for opportunities, users, skills |
| 14 | PDPL compliance: data subject request workflow, data deletion |

**Exit criteria:** Full deal lifecycle works end-to-end for 2 tenants. Contracts are digitally signed. Payments collected.

---

### Phase 2 — Scale & Reliability (Weeks 15–22) — P2 Issues
**Goal:** Prepare for 10,000+ active users.

| Week | Task |
|---|---|
| 15 | Load testing (k6 / Locust) to 1000 concurrent users |
| 15 | Redis caching for hot paths (opportunity list, user profiles) |
| 16 | PostgreSQL read replicas for analytics queries |
| 16 | CI/CD: GitHub Actions → staging → production |
| 17 | Analytics: PostHog integration, matching funnel dashboard |
| 17 | Admin BI: Metabase on TimescaleDB |
| 18 | Contract PDF generation (Puppeteer templates per model type) |
| 18 | Geographic matching: PostGIS distance scoring |
| 19 | Matching algorithm improvements: semantic skill matching |
| 19 | Matching feedback loop: deal outcomes → score recalibration |
| 20 | Mobile PWA / React Native (basic) |
| 20 | Webhook delivery system |
| 21 | API key management for B2B |
| 21 | SSO: Google Workspace OAuth2 |
| 22 | ZATCA Fatoorah e-invoicing |
| 22 | KSA data residency (migrate to AWS me-south-1) |

**Exit criteria:** System handles 10,000 MAU. SLA 99.9% uptime. All P0/P1 issues resolved.

---

### Phase 3 — Enterprise & Expansion (Weeks 23–36)
**Goal:** 100,000+ users. Enterprise sales ready.

| Task |
|---|
| Microservices split (Matching, Notification, Billing as separate services) |
| Kafka for event bus at scale |
| SAML 2.0 SSO for enterprise clients |
| A/B testing framework for matching algorithm |
| ML-powered matching (embeddings + collaborative filtering) |
| Advanced analytics (cohort analysis, LTV prediction) |
| Mobile app (React Native — iOS + Android) |
| Marketplace API for third-party integrations |
| SLA management dashboard |
| 24/7 support tooling integration |

---

## Appendix A — File Index (Key Files Referenced)

| File | Purpose | Production Status |
|---|---|---|
| `POC/src/core/auth/auth-service.js` | Auth + capability matrix | Must be ported to server |
| `POC/src/core/data/data-service.js` | Data access layer | Must be replaced with ORM |
| `POC/src/services/matching/matching-service.js` | Matching engine (1461 lines) | Must be ported to server worker |
| `POC/src/services/matching/deal-lifecycle.js` | Deal state helpers | Port to server + enforce |
| `POC/src/services/matching/negotiation-lifecycle.js` | Negotiation state helpers | Port to server + enforce |
| `POC/src/services/matching/dispute-lifecycle.js` | Dispute state helpers | Port + build full entity |
| `POC/src/services/matching/replacement-lifecycle.js` | Consortium replacement | Port to server |
| `POC/src/core/events/event-bus.js` | In-browser event bus | Replace with server event system |
| `POC/src/services/notifications/notification-delivery.js` | Notification builder | Port + add delivery channels |
| `web/src/lib/auth-service.ts` | React auth (btoa) | Replace with real JWT auth |
| `web/src/lib/data-store.ts` | Static JSON imports | Replace with API calls |
| `docs/database-schema.md` | Schema documentation | Use as migration starting point |
| `BRD/06_Data_Models.md` | Entity specs | Use for DB schema finalization |
| `POC/src/core/validation/*.js` | 10 client-side validators | Port to server (Zod/Joi) |

---

*End of PMTwin SaaS Readiness Audit Report*  
*Generated: June 16, 2026*
