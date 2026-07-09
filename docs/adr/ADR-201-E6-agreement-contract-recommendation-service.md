# ADR-201-E6: Agreement + Contract Adapters + RecommendationService

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E6 — Agreement + contract adapters + RecommendationService |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprints E1–E5 delivered profile, vetting, opportunity/readiness, matching, and negotiation adapters. Commercial agreement (`deal`) and contract lifecycles exist in `@pm-twin/lifecycle` and web read models, but no canonical `ExplanationBundle` mapping or cross-engine recommendation aggregation exists yet.

E0 defined the `RecommendationService` interface; E6 implements it alongside agreement and contract adapters **without modifying** deal/contract command handlers, FSM, decision-engine, or web UI (deferred to E7).

---

## Decision

### 1. Agreement adapter (includes commercial approval gates)

Implement `agreementExplainabilityAdapter` accepting `AgreementExplainabilitySnapshot`. Commercial approval/decision gates use `COMMERCIAL_*` reason codes within the agreement adapter — no separate `commercialExplainabilityAdapter` file. This avoids duplication because approval gates are always evaluated in agreement context.

**Engine:** `ENGINE_ID.AGREEMENT`

### 2. Contract adapter

Implement `contractExplainabilityAdapter` accepting `ContractExplainabilitySnapshot`.

**Engine:** `ENGINE_ID.CONTRACT`

### 3. RecommendationService implementation

Implement `createRecommendationService()` and `aggregateRecommendations()` in `recommendation-service-impl.ts`.

**Rules:**

1. Web callers map read models into snapshot types; adapters never import from `web/`.
2. Progress `score` and `health` are **read-only display heuristics** — lifecycle FSM remains authoritative.
3. `aggregateRecommendations()` de-duplicates by `reasonCode + label`, sorts by priority then `impactPercent` desc, caps at configurable limit (default 10).
4. Commercial approval uses `COMMERCIAL_*` codes; stage/status uses `AGREEMENT_*` codes.

---

## Adapter APIs

### Agreement

```typescript
type AgreementExplainabilitySnapshot = {
  entityId: string
  status: 'draft' | 'review' | 'signing' | 'executing' | 'completed' | 'cancelled'
  decisionStatus?: 'pending' | 'approved' | 'rejected' | 'not_required'
  awardStatus?: 'pending' | 'awarded' | 'not_applicable'
  linkedNegotiationId?, linkedContractId?
  pendingSignatures?, totalSignatures?, canCreateContract?
  stageBlockers?: readonly { code, label, resolutionHint? }[]
  createdAt?, stageTransitions?, timelineEvents?, evaluatedAt?, locale?
}

const agreementExplainabilityAdapter: ExplainabilityAdapter<AgreementExplainabilitySnapshot>
buildAgreementExplanation(snapshot): ExplanationBundle  // engine: agreement
computeAgreementProgressScore(snapshot): number
```

### Contract

```typescript
type ContractExplainabilitySnapshot = {
  entityId: string
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated'
  parties?, partiesSigned?, totalParties?
  canSign?, canComplete?, canTerminate?
  terminationReason?, completionReason?, milestones?
  createdAt?, activatedAt?, completedAt?, terminatedAt?
  timelineEvents?, evaluatedAt?, locale?
}

const contractExplainabilityAdapter: ExplainabilityAdapter<ContractExplainabilitySnapshot>
buildContractExplanation(snapshot): ExplanationBundle  // engine: contract
computeContractProgressScore(snapshot): number
```

### RecommendationService

```typescript
createRecommendationService(): RecommendationService
aggregateRecommendations(bundles: ExplanationBundle[], options?: { limit?: number }): Recommendation[]
```

| Method | Adapter source |
|--------|----------------|
| `forProfile()` | `profileExplainabilityAdapter.buildRecommendations()` |
| `forVetting()` | `vettingExplainabilityAdapter.buildRecommendations()` |
| `forOpportunity()` | `opportunityExplainabilityAdapter` or `readinessExplainabilityAdapter` (when `input.engine === 'readiness'`) |
| `forMatching()` | `matchingExplainabilityAdapter.buildRecommendations()` |
| `forNegotiation()` | `negotiationExplainabilityAdapter.buildRecommendations()` |
| `forAgreement()` | `agreementExplainabilityAdapter.buildRecommendations()` |
| `forContract()` | `contractExplainabilityAdapter.buildRecommendations()` |

---

## Status → reason code mapping

### Agreement status

| Status | Reason code |
|--------|-------------|
| `draft` | `AGREEMENT_STATUS_DRAFT` |
| `review` | `AGREEMENT_STATUS_REVIEW` |
| `signing` | `AGREEMENT_STATUS_SIGNING` |
| `executing` | `AGREEMENT_STATUS_EXECUTING` |
| `completed` | `AGREEMENT_STATUS_COMPLETED` |
| `cancelled` | `AGREEMENT_STATUS_CANCELLED` |

### Agreement friction

| Source | Reason code |
|--------|-------------|
| Score summary | `AGREEMENT_SCORE_SUMMARY` |
| Review incomplete | `AGREEMENT_REVIEW_INCOMPLETE` |
| Signatures pending | `AGREEMENT_SIGNATURES_PENDING` |
| Stage gate blocked | `AGREEMENT_STAGE_GATE_BLOCKED` |
| Contract missing | `AGREEMENT_CONTRACT_MISSING` |
| Award pending | `AGREEMENT_AWARD_PENDING` |

### Commercial gates (within agreement adapter)

| Source | Reason code |
|--------|-------------|
| Decision/approval pending | `COMMERCIAL_APPROVAL_PENDING` |
| Award pending | `COMMERCIAL_AWARD_PENDING` |
| Stage gate (commercial) | `COMMERCIAL_STAGE_GATE_BLOCKED` |

### Contract status

| Status | Reason code |
|--------|-------------|
| `draft` | `CONTRACT_STATUS_DRAFT` |
| `pending_signature` | `CONTRACT_STATUS_PENDING_SIGNATURE` |
| `active` | `CONTRACT_STATUS_ACTIVE` |
| `completed` | `CONTRACT_STATUS_COMPLETED` |
| `terminated` | `CONTRACT_STATUS_TERMINATED` |

### Contract friction

| Source | Reason code |
|--------|-------------|
| Score summary | `CONTRACT_SCORE_SUMMARY` |
| Signature pending | `CONTRACT_SIGNATURE_PENDING` |
| Signatures incomplete | `CONTRACT_SIGNATURES_INCOMPLETE` |
| Activation pending | `CONTRACT_ACTIVATION_PENDING` |
| Completion ready | `CONTRACT_COMPLETION_READY` |
| Termination available | `CONTRACT_TERMINATION_AVAILABLE` |
| Milestone blocked | `CONTRACT_MILESTONE_BLOCKED` |

---

## Score breakdown dimensions

### Agreement

| Dimension | Weight |
|-----------|--------|
| Stage progression | 35% |
| Commercial approval | 25% |
| Signatures | 25% |
| Contract linkage | 15% |

### Contract

| Dimension | Weight |
|-----------|--------|
| Party signatures | 35% |
| Activation readiness | 25% |
| Execution progress | 25% |
| Milestone delivery | 15% |

---

## Web integration (deferred to E7)

E6 does **not** wire adapters into web read models or UI. E7 should:

1. Map `CommercialAgreementDetailReadModel` → `AgreementExplainabilitySnapshot`
2. Map `ContractDetailReadModel` → `ContractExplainabilitySnapshot`
3. Instantiate `createRecommendationService()` in a web explainability service
4. Call `aggregateRecommendations()` for cross-engine dashboard recommendations
5. Render `ExplanationBundle` in agreement/contract detail panels

---

## Consequences

### Positive

- Canonical explainability for commercial agreement and contract lifecycles
- Cross-engine recommendation aggregation without FSM or handler changes
- Commercial approval gates surface as auditable `COMMERCIAL_*` reasons within agreement context

### Deferred

- Web wiring in agreement/contract detail UI (E7)
- KnowledgeBridge enrichment for `AGREEMENT_*`, `COMMERCIAL_*`, `CONTRACT_*` codes (E8)

---

## References

- `packages/explainability/src/adapters/agreement-adapter.ts`
- `packages/explainability/src/adapters/agreement-field-map.ts`
- `packages/explainability/src/adapters/agreement-types.ts`
- `packages/explainability/src/adapters/contract-adapter.ts`
- `packages/explainability/src/adapters/contract-field-map.ts`
- `packages/explainability/src/adapters/contract-types.ts`
- `packages/explainability/src/services/recommendation-service-impl.ts`
- `packages/explainability/tests/agreement-adapter.test.js`
- `packages/explainability/tests/contract-adapter.test.js`
- `packages/explainability/tests/recommendation-service.test.js`
- `web/src/lib/commercial-agreement-detail-read-model.ts` (input shape reference only)
- `web/src/lib/contract-detail-read-model.ts` (input shape reference only)
- [ADR-201-E5: Negotiation Adapter](./ADR-201-E5-negotiation-adapter.md)
- [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md)
