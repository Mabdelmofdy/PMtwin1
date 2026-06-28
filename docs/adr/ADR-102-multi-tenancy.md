# ADR-102: Multi-Tenancy

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Depends on** | ADR-101 (Backend Domain Ownership) |
| **Phase** | Backend Foundation **Phase 2+** (not Phase 1) |
| **Supersedes** | Optional `tenantId` stubs without enforcement (v1.0) |

---

## Context

PM-Twin v1.0 includes optional `tenantId` fields on normalized schemas and RBAC context builders, but **no tenant isolation** is enforced. All seed data is global; repositories do not filter by tenant.

SaaS deployment for KSA B2B marketplace customers requires row-level isolation, tenant-scoped RBAC, and org hierarchy (company within tenant).

ADR-101 assigns tenancy to **T2 Platform context** in Phase 2+. This ADR defines the tenancy model before implementation.

---

## Decision

Adopt **shared-database, row-level tenancy** with `tenant_id` on all tenant-owned aggregates.

| Model | Choice | Rationale |
|-------|--------|-----------|
| Isolation strategy | Shared DB + `tenant_id` column | Cost-effective for MVP SaaS; migrate to schema-per-tenant only if contractually required |
| Tenant root | `Tenant` aggregate | Billing, settings, data residency config attach here |
| Org within tenant | `Organization` (existing type) | Company accounts belong to a tenant |
| User scope | User belongs to one primary tenant; cross-tenant admin is platform role only |

---

## Ownership (per ADR-101)

| Layer | Owner | Responsibility |
|-------|-------|----------------|
| T2 Platform | `server/src/platform/` | Tenant CRUD, provisioning, JWT `tenantId` claim |
| T2 all contexts | Repository base | Mandatory `WHERE tenant_id = :actorTenantId` on reads/writes |
| T2 API | Middleware | Reject requests where JWT tenant ≠ resource tenant |
| T1 | — | No tenancy in pure packages (tenant passed as context) |
| T3 | web | Display org switcher (future); never trust client-supplied tenantId for auth |

---

## Schema rules

1. Every tenant-owned table includes `tenant_id UUID NOT NULL` with index.
2. Foreign keys are tenant-scoped (composite or validated in application layer).
3. Platform admin bypass requires explicit `platform.admin` role — not default admin.
4. Seed/demo data uses a single `tenant_demo` id for migration compatibility.

**Tenant-owned aggregates:** Opportunity, Application, PostMatch, Deal, Negotiation, Contract, Notification, AuditEntry (scoped), User (membership).

**Global/reference data:** Skill canonical, lifecycle manifest — not tenant-scoped.

---

## JWT claims (Phase 2)

```json
{
  "sub": "user-id",
  "role": "company_owner",
  "tenantId": "tenant-uuid",
  "organizationId": "org-uuid"
}
```

Server RBAC ([ADR-101](./ADR-101-backend-domain-ownership.md)) resolves actor from JWT; client `CommandPermissionActor` deprecated.

---

## Migration from v1.0

| Step | Action |
|------|--------|
| 1 | Add `tenants` table + default demo tenant |
| 2 | Backfill `tenant_id` on imported seed rows |
| 3 | Add repository tenant filter middleware |
| 4 | Enable API rejection on cross-tenant access |
| 5 | Remove optional `tenantId?` — required post-cutover |

---

## Out of scope (this ADR)

- PDPL data subject rights → [ADR-103](./ADR-103-pdpl-compliance.md)
- VAT on commercial fields → [ADR-104](./ADR-104-vat-financial-fields.md)
- Billing/subscription per tenant → future ADR-105

---

## Consequences

**Positive:** Clear isolation model; aligns with existing schema stubs.  
**Negative:** Every query gains tenant predicate; integration tests need tenant fixtures.

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial tenancy model — Phase 2+ |
