# ADR-201-E3: Opportunity + Readiness Explainability Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E3 — Opportunity + readiness adapter |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprints E1–E2 delivered profile and vetting adapters. Opportunity readiness scoring and explainability already exist in `@pm-twin/collaboration-models` via `evaluateReadiness()` and `ReadinessResult` — the richest explainability engine in PM-Twin today (explanations, blockingReasons, nextBestActions, fieldContributions).

The web runtime (`opportunity-readiness-evaluator.ts`) currently strips this richness via `toOpportunityReadinessResult()`. E3 bridges the gap by mapping `ReadinessResult` fields to the canonical `ExplanationBundle` **without modifying** the readiness engine, web evaluator, or UI.

---

## Decision

Implement `opportunityExplainabilityAdapter` and `readinessExplainabilityAdapter` (alias) in `@pm-twin/explainability` accepting a minimal `OpportunityReadinessSnapshot` input — decoupled from collaboration-models types.

**Rules:**

1. Web callers map `evaluateReadiness()` / `ReadinessResult` into `OpportunityReadinessSnapshot`; the adapter never imports from `collaboration-models` or `web/`.
2. Scoring weights (80% required / 20% recommended) are duplicated in the adapter **for breakdown display only** — `readiness-engine.ts` remains authoritative for `score`.
3. Collaboration-models `ReadinessReasonCode` values translate to canonical `READINESS_*` codes via `opportunityReasonCodeToCanonical()`.
4. `readinessExplainabilityAdapter` is an alias — same snapshot input, `engine: readiness` on the bundle.

---

## Adapter API

```typescript
type OpportunityReadinessSnapshot = {
  entityId: string
  subModelKey?: string
  score: number
  requiredScore: number
  recommendedScore: number
  publishReady: boolean
  readinessLevel: 'draft' | 'basic' | 'partial' | 'ready' | 'excellent'
  health: 'excellent' | 'good' | 'warning' | 'critical'
  missingRequiredFields: readonly string[]
  missingRecommendedFields: readonly string[]
  completedRequiredFields?: readonly string[]
  completedRecommendedFields?: readonly string[]
  fieldContributions: readonly OpportunityFieldContribution[]
  explanations: readonly OpportunityExplanation[]
  nextBestActions: readonly OpportunityAction[]
  blockingReasons: readonly OpportunityBlockingReason[]
  snapshot: { generatedAt; knowledgeVersion; formVersion; engineVersion }
  evaluatedAt?: string
  locale?: string
  createdAt?: string
}

const opportunityExplainabilityAdapter: ExplainabilityAdapter<OpportunityReadinessSnapshot>
const readinessExplainabilityAdapter: ExplainabilityAdapter<OpportunityReadinessSnapshot>
buildOpportunityExplanation(snapshot): ExplanationBundle  // engine: opportunity
buildReadinessExplanation(snapshot): ExplanationBundle    // engine: readiness
```

### Method responsibilities

| Method | Output |
|--------|--------|
| `buildExplanation()` | Full `ExplanationBundle` with `engine: opportunity` or `readiness` |
| `buildRecommendations()` | `Recommendation[]` from `nextBestActions` with `impactPercent`, `estimatedScore` |
| `buildBreakdown()` | Required (80%) + recommended (20%) `ScoreBreakdownEntry[]` |
| `buildTimeline()` | `opportunity-created` (if `createdAt`) + `opportunity-evaluated` + `opportunity-publish-ready` (if `publishReady`) |

---

## ReadinessResult → ExplanationBundle mapping

| ReadinessResult field | ExplanationBundle field |
|-----------------------|-------------------------|
| `score` | `score` |
| `health` | `health` (direct enum map) |
| `explanations[]` | `reasons[]` (code translation + severity) |
| `blockingReasons[]` | `blockers[]` |
| `nextBestActions[]` | `recommendations[]` |
| `fieldContributions` + `requiredScore` / `recommendedScore` | `scoreBreakdown[]` (80/20) |
| `completedRequiredFields` / `completedRecommendedFields` | `strengths[]` |
| `missingRequiredFields` / `missingRecommendedFields` | `weaknesses[]` |
| `publishReady` + `evaluatedAt` | `timeline[]` milestone events |
| `snapshot.*` | `metadata.engineVersion`, `metadata.extensions` |

---

## Reason code mapping

### Core opportunity fields

| Field ID | Reason code |
|----------|-------------|
| `title` | `READINESS_MISSING_TITLE` |
| `intent` | `READINESS_MISSING_INTENT` |
| `categoryProfession` | `READINESS_MISSING_CATEGORY_PROFESSION` |
| `roleIntent` | `READINESS_MISSING_ROLE_INTENT` |
| `skillsIntent` | `READINESS_MISSING_SKILLS_INTENT` |
| `servicesIntent` | `READINESS_MISSING_SERVICES_INTENT` |
| `location` | `READINESS_MISSING_LOCATION` |
| `timeline` | `READINESS_MISSING_TIMELINE` |
| `collaborationModel` | `READINESS_MISSING_COLLABORATION_MODEL` |
| `descriptionScope` | `READINESS_MISSING_DESCRIPTION_SCOPE` |
| `budgetValueTerms` | `READINESS_MISSING_BUDGET_VALUE_TERMS` |
| `preferredPartnerType` | `READINESS_MISSING_PREFERRED_PARTNER_TYPE` |
| `attachments` | `READINESS_MISSING_ATTACHMENTS` |
| `compliance` | `READINESS_MISSING_COMPLIANCE` |
| `deliveryMilestones` | `READINESS_MISSING_DELIVERY_MILESTONES` |

### Translation examples

| collaboration-models code | Canonical code |
|---------------------------|----------------|
| `READINESS_MISSING_BUDGET_VALUE_TERMS` | `READINESS_MISSING_BUDGET_VALUE_TERMS` |
| `READINESS_MISSING_DESCRIPTION_SCOPE` | `READINESS_MISSING_DESCRIPTION_SCOPE` |
| `READINESS_MISSING_SCOPE` | `READINESS_MISSING_DESCRIPTION_SCOPE` (alias) |
| `READINESS_SCORE_SUMMARY` | `READINESS_SCORE_SUMMARY` |
| `READINESS_RECOMMENDED_GAPS` | `READINESS_RECOMMENDED_GAPS` |
| `READINESS_PUBLISH_BLOCKED` | `READINESS_PUBLISH_BLOCKED` |

Sub-model field IDs fall through to parameterized `READINESS_MISSING_${SNAKE_FIELD_ID}` codes.

---

## Health mapping

| ReadinessHealth | Bundle `health` |
|-----------------|-----------------|
| `excellent` | `excellent` |
| `good` | `good` |
| `warning` | `warning` |
| `critical` | `critical` |

---

## Web integration (deferred to E7)

E3 does **not** wire the adapter into UI or modify `toOpportunityReadinessResult()`. Future web service:

```typescript
import { opportunityExplainabilityAdapter } from '@pm-twin/explainability'
import { evaluateReadiness } from '@pm-twin/collaboration-models'

const result = evaluateReadiness({ formState, subModelKey })
const bundle = opportunityExplainabilityAdapter.buildExplanation({
  entityId: opportunityId,
  subModelKey,
  score: result.score,
  requiredScore: result.requiredScore,
  recommendedScore: result.recommendedScore,
  publishReady: result.publishReady,
  readinessLevel: result.readinessLevel,
  health: result.health,
  missingRequiredFields: result.missingRequiredFields,
  missingRecommendedFields: result.missingRecommendedFields,
  completedRequiredFields: result.completedRequiredFields,
  completedRecommendedFields: result.completedRecommendedFields,
  fieldContributions: result.fieldContributions,
  explanations: result.explanations,
  nextBestActions: result.nextBestActions,
  blockingReasons: result.blockingReasons,
  snapshot: result.snapshot,
})
```

---

## Consequences

### Positive

- Bridges the richest existing explainability engine to the canonical contract
- Preserves `nextBestActions` impact estimates and `blockingReasons` without engine changes
- Dual engine IDs (`opportunity` / `readiness`) support both opportunity UI and generic readiness surfaces

### Deferred

- UI rendering (E7)
- Matching adapter (E4)
- KnowledgeBridge enrichment for readiness codes (E8)

---

## References

- `packages/explainability/src/adapters/opportunity-adapter.ts`
- `packages/explainability/src/adapters/opportunity-field-map.ts`
- `packages/explainability/src/adapters/opportunity-types.ts`
- `packages/explainability/tests/opportunity-adapter.test.js`
- `packages/collaboration-models/src/readiness/readiness-engine.ts`
- `packages/collaboration-models/src/knowledge/opportunity-core-readiness.ts`
