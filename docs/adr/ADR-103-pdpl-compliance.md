# ADR-103: PDPL Compliance

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Depends on** | ADR-101, ADR-102 (tenancy for data scoping) |
| **Phase** | Backend Foundation **Phase 2+** |
| **Regulation** | KSA Personal Data Protection Law (PDPL) |

---

## Context

PM-Twin processes personal data (names, emails, profiles, commercial terms). Workspace rules require PDPL compliance, but v1.0 has:

- No consent capture workflow
- No data subject access/export/delete flows
- No retention policy enforcement
- Client-only storage (bypassable)
- No documented data residency requirement

ADR-101 defers PDPL to Phase 2+ with T2 ownership. This ADR defines **what** the platform must implement and **who owns each capability**.

---

## Decision

PDPL compliance capabilities are **server-authoritative (T2)** with **audit trail** and **tenant scoping (ADR-102)**.

| Capability | Owner | Module |
|------------|-------|--------|
| Lawful basis / consent records | T2 | `server/src/compliance/pdpl/consent.ts` |
| Data subject access (export) | T2 | `server/src/compliance/pdpl/data-subject-access.ts` |
| Data subject erasure (delete/anonymize) | T2 | `server/src/compliance/pdpl/erasure.ts` |
| Retention policy enforcement | T2 | `server/src/compliance/pdpl/retention.ts` |
| Processing activity log | T2 | extends `server/src/audit/` |
| Data residency config | T2 infra | deployment ADR / tenant settings |
| Consent UI | T3 | `web/` forms; server stores consent record |
| Privacy policy display | T3 | static + API version check |

---

## Data categories

| Category | Examples | PDPL sensitivity |
|----------|----------|------------------|
| Identity | email, name, CR number | Personal data |
| Professional | skills, certifications, case studies | Personal data |
| Commercial | budget, payment terms, contract value | May include personal + business |
| Behavioral | audit log, matching history | Personal data |
| Technical | session tokens, IP (future) | Personal data |

All categories are **tenant-scoped** and subject to export/erasure within tenant boundaries.

---

## Required workflows (Phase 2 minimum)

### 1. Consent at registration

- Explicit checkbox for processing + link to privacy policy
- Server stores: `userId`, `consentVersion`, `timestamp`, `ip` (optional), `tenantId`
- No account activation without consent record

### 2. Data subject access request (DSAR)

- Authenticated user requests full export (JSON bundle)
- Server aggregates tenant-scoped personal data across aggregates
- Response within PDPL SLA (target: 30 days; implement async job + notification)

### 3. Erasure request

- Soft-delete user account; anonymize PII fields where legal retention allows
- Block erasure when active contracts/deals require retention (legal hold flag)
- Cascade rules documented per aggregate (opportunity `creatorId` → anonymized placeholder)

### 4. Retention

- Default retention: configurable per tenant (suggest 7 years for commercial/audit — legal review required)
- Scheduled job marks eligible records; hard delete after grace period
- Audit log append-only; never deleted without legal approval workflow

---

## Data residency

| Requirement | Decision |
|-------------|----------|
| Primary storage region | KSA or approved GCC (e.g. AWS `me-south-1`) — **deployment constraint**, not application code |
| Cross-border transfer | Prohibited without explicit PDPL legal basis; tenant config flag |
| Backup region | Same jurisdiction or encrypted with DPA |

Infrastructure ADR (hosting) references this section; application code enforces tenant export only from authorized region endpoints.

---

## Ownership vs ADR-101 tiers

| Tier | PDPL role |
|------|-----------|
| T1 packages | No PII storage; pure rules may reference field names only |
| T2 server | All compliance workflows, encryption at rest (infra), audit |
| T3 web | Consent UI, DSAR request button, export download link |

Client **must not** hold sole copy of consent or erasure state after Phase 2 cutover.

---

## Out of scope (this ADR)

- VAT / ZATCA e-invoicing → [ADR-104](./ADR-104-vat-financial-fields.md)
- Multi-tenant provisioning → [ADR-102](./ADR-102-multi-tenancy.md)
- Legal text of privacy policy (product/legal team)

---

## Compliance checklist (implementation gate)

- [ ] Consent record on registration
- [ ] DSAR export endpoint + async job
- [ ] Erasure with legal hold
- [ ] Retention scheduler
- [ ] Audit entries for all compliance actions
- [ ] Tenant-scoped exports only
- [ ] Data residency documented in deployment runbook

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial PDPL ownership — Phase 2+ |
