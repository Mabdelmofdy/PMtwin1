# ADR-201-E2: Vetting Explainability Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E2 — Vetting adapter |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprint E1 delivered `profileExplainabilityAdapter` as the first reference implementation. Vetting readiness scoring exists in `web/src/domain/vetting-readiness/` via `evaluateVettingReadiness()`.

E2 delivers the **second engine adapter**, mapping vetting readiness outputs to the canonical `ExplanationBundle` contract without modifying scoring logic or UI.

---

## Decision

Implement `vettingExplainabilityAdapter` in `@pm-twin/explainability` accepting a minimal `VettingReadinessSnapshot` input — decoupled from web domain types.

**Rules:**

1. Web callers map `evaluateVettingReadiness()` output + document/review metadata into `VettingReadinessSnapshot`; the adapter never imports from `web/`.
2. Scoring weights (80% documents / 20% review) are duplicated in the adapter **for impact estimates and breakdown display only** — the evaluator remains authoritative for `score`.
3. Document labels from `vetting-readiness-rules.ts` map to registered `DOCUMENT_*` reason codes; review states and gaps map to `VETTING_*` codes.
4. `buildExplanation()` composes recommendations, breakdown, and timeline from the same snapshot helpers.

---

## Adapter API

```typescript
type VettingReadinessSnapshot = {
  entityId: string
  score: number
  status: 'incomplete' | 'needs_review' | 'ready_for_matching'
  missingRequired: readonly string[]
  missingRecommended: readonly string[]
  recommendations: readonly string[]
  documentsProgress: { approvedRequired: number; totalRequired: number }
  reviewProgress: 'not_started' | 'in_review' | 'changes_requested' | 'approved'
  changesResolved?: boolean
  accountStatus?: string | null
  documents?: readonly VettingDocumentEntry[]
  createdAt?: string
  evaluatedAt?: string
  reviewStartedAt?: string
  changesRequestedAt?: string
  resubmittedAt?: string
  reviewApprovedAt?: string
  locale?: string
}

const vettingExplainabilityAdapter: ExplainabilityAdapter<VettingReadinessSnapshot>
buildVettingExplanation(snapshot): ExplanationBundle
```

### Method responsibilities

| Method | Output |
|--------|--------|
| `buildExplanation()` | Full `ExplanationBundle` with `engine: vetting` |
| `buildRecommendations()` | `Recommendation[]` with `reasonCode`, `impactPercent`, `href` |
| `buildBreakdown()` | Documents (80%) + Review (20%) `ScoreBreakdownEntry[]` |
| `buildTimeline()` | Upload/review/resubmit events when timestamps exist; else evaluation event |

---

## Reason code mapping

### Required documents

| Document type / label | Reason code |
|-----------------------|-------------|
| Commercial Registration | `DOCUMENT_CR_MISSING` |
| VAT Certificate | `DOCUMENT_VAT_MISSING` |
| Insurance Certificate | `DOCUMENT_INSURANCE_MISSING` |
| License | `DOCUMENT_LICENSE_MISSING` |
| National ID | `DOCUMENT_NATIONAL_ID_MISSING` |

### Review states

| Review progress | Reason code |
|-----------------|-------------|
| `not_started` | `VETTING_REVIEW_NOT_STARTED` |
| `in_review` | `VETTING_REVIEW_IN_PROGRESS` |
| `changes_requested` | `VETTING_REVIEW_CHANGES_REQUESTED` |
| `approved` | `VETTING_REVIEW_APPROVED` |

### Review gap labels (from evaluator)

| Gap label | Reason code |
|-----------|-------------|
| Start admin review | `VETTING_REVIEW_NOT_STARTED` |
| Resolve requested changes and resubmit | `VETTING_REVIEW_CHANGES_REQUESTED` |

### Synthetic codes

`VETTING_ACTIVE`, `VETTING_DOCUMENTS_COMPLETE`, `VETTING_REVIEW_PENDING`, `VETTING_COMPLETE`, `VETTING_SCORE_SUMMARY`.

---

## Health mapping

| Readiness status / account | Bundle `health` |
|----------------------------|-----------------|
| `accountStatus: active` or `ready_for_matching` | `excellent` |
| `needs_review` | `warning` |
| `incomplete` | `critical` |

---

## Web integration (deferred to E7)

E2 does **not** wire the adapter into UI. Future web service:

```typescript
import { vettingExplainabilityAdapter } from '@pm-twin/explainability'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness'

const result = evaluateVettingReadiness(input)
const bundle = vettingExplainabilityAdapter.buildExplanation({
  entityId,
  ...result,
  reviewProgress: input.reviewProgress ?? 'not_started',
  accountStatus: input.accountStatus,
  documents: input.documents?.map((doc) => ({
    type: doc.documentType,
    status: doc.status,
    uploadedAt: doc.uploadedAt,
  })),
})
```

---

## Consequences

### Positive

- Second reference implementation validating the E1 adapter pattern
- Contract-tested mapping from real vetting readiness labels and review states
- No web dependency — package stays portable

### Deferred

- UI rendering (E7)
- KnowledgeBridge enrichment for vetting codes (E8)
- Cross-engine `RecommendationService` aggregation (E6)

---

## References

- `packages/explainability/src/adapters/vetting-adapter.ts`
- `packages/explainability/src/adapters/vetting-field-map.ts`
- `packages/explainability/tests/vetting-adapter.test.js`
- `web/src/domain/vetting-readiness/vetting-readiness-evaluator.ts`
- [ADR-201-E1: Profile adapter](./ADR-201-E1-profile-adapter.md)
