# ADR-104: VAT and Financial Fields (KSA)

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Version** | 1.0 |
| **Date** | 28 June 2026 |
| **Depends on** | ADR-101, ADR-102 |
| **Phase** | Backend Foundation **Phase 2+** |
| **Regulation** | KSA VAT 15% (ZATCA alignment assessment separate) |

---

## Context

Workspace rules require **15% VAT explicit in all financial fields**. v1.0 stores commercial values (budget ranges, payment schedules, deal terms) without tax decomposition. AUDIT_REPORT and ARCHITECTURE-READINESS-ASSESSMENT flag this as a KSA compliance gap.

ADR-101 assigns VAT to **T1 calculation rules + T2 persistence**. This ADR defines the financial field model and ownership.

---

## Decision

All **display-facing monetary amounts** in contracts, deals, negotiations, and opportunities must decompose into explicit VAT components using a **single canonical calculation module**.

| Concern | Owner | Location |
|---------|-------|----------|
| VAT rate constant | T1 | `@pm-twin/finance` (new package) |
| Net / VAT / gross calculation | T1 | `@pm-twin/finance/vat.ts` — pure functions |
| Persisted amounts | T2 | PostgreSQL — store **net + vat + gross + currency** |
| Display formatting | T3 | web — SAR symbol, 2dp, RTL-safe |
| ZATCA e-invoicing | T2 (future) | Out of Phase 2 minimum; assessment only |

**VAT rate:** `0.15` (15%) — configurable constant for test; production default 15% KSA.

---

## Canonical amount shape

```typescript
type MonetaryAmount = {
  readonly net: number        // ex-VAT
  readonly vat: number        // net * rate
  readonly gross: number      // net + vat
  readonly currency: 'SAR'    // ISO 4217; extend later
  readonly vatRate: number    // e.g. 0.15 — stored for audit
}
```

**Rule:** Never persist a single opaque `amount` without VAT breakdown on entities that face users or legal snapshot (Contract, Deal commercial terms, Negotiation rounds, Opportunity budget when used in contracting).

---

## Affected aggregates

| Aggregate | Fields to migrate |
|-----------|-------------------|
| Opportunity | `exchangeData.budgetRange` → MonetaryAmount pair (min/max each) |
| Application | `commercialTerms` value fields |
| Negotiation | `rounds[].commercialTerms`, agreed terms |
| Deal | milestones payments, `valueTerms` |
| Contract | `agreedValue`, `paymentSchedule[]` |

Legacy seed JSON may remain net-only during import; migration script applies VAT decomposition with documented assumption (net input) unless `vatIncluded` flag present.

---

## Calculation rules (T1)

| Function | Behavior |
|----------|----------|
| `calculateVatFromNet(net, rate)` | Returns `{ net, vat, gross, vatRate, currency }` |
| `calculateNetFromGross(gross, rate)` | Reverse for VAT-inclusive input |
| `roundMoney(value)` | 2 decimal HALF_UP — SAR fils |

Package is **zero-dependency** (same constraints as `@pm-twin/lifecycle`).

---

## Display rules (T3)

- Always show **gross** prominently in user-facing UI
- Show VAT line item on contract/deal/negotiation summary: `VAT (15%): X SAR`
- Admin exports include net, vat, gross columns
- Arabic RTL: currency suffix/prefix per locale module (not in this ADR)

---

## ZATCA e-invoicing

| Item | Phase 2 | Phase 3+ |
|------|---------|----------|
| VAT decomposition in app | ✅ Required | — |
| QR code on invoices | ❌ | Assessment |
| Fatoora integration | ❌ | Separate ADR if pursued |
| UUID invoice numbering | ❌ | T2 invoice service |

Phase 2 delivers **correct VAT math and storage**; e-invoicing is not a blocker for Backend Foundation Phase 1.

---

## Ownership vs ADR-101

| Tier | Role |
|------|------|
| T1 `@pm-twin/finance` | Rate constants, pure VAT math, validation |
| T2 server | Persist MonetaryAmount; reject patches that omit VAT fields on governed entities |
| T3 web | Formatting; call T1 for preview before submit (optional); server re-validates |

---

## Migration from v1.0

1. Add `@pm-twin/finance` with unit tests (100% branch on vat.ts)
2. Import script: treat existing seed amounts as **net** unless metadata says otherwise
3. API returns MonetaryAmount on financial fields
4. UI read models map to display components
5. Guard test: no new raw `number` amount fields on Contract/Deal without ADR amendment

---

## Out of scope

- PDPL → [ADR-103](./ADR-103-pdpl-compliance.md)
- Multi-currency FX → future ADR
- Payroll / withholding tax

---

## Revision history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 28 June 2026 | Initial VAT model — Phase 2+ |
