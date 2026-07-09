# ADR-201-E1: Profile Explainability Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E1 — Profile adapter |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprint E0 established the canonical explainability contract (`ExplanationBundle`, `ReasonCode`, `ExplainabilityAdapter`). Profile readiness scoring already exists in `web/src/domain/profile-readiness/` via `evaluateProfileReadiness()`.

E1 delivers the **first engine adapter**, establishing the pattern for E2–E6 without modifying scoring logic or UI.

---

## Decision

Implement `profileExplainabilityAdapter` in `@pm-twin/explainability` accepting a minimal `ProfileReadinessSnapshot` input — decoupled from web domain types to avoid circular dependencies.

**Rules:**

1. Web callers map `evaluateProfileReadiness()` output + rule totals into `ProfileReadinessSnapshot`; the adapter never imports from `web/`.
2. Scoring weights (70% required / 30% recommended) are duplicated in the adapter **for impact estimates only** — the evaluator remains authoritative for `score`.
3. All field labels from `profile-readiness-rules.ts` map to registered `PROFILE_*` reason codes.
4. `buildExplanation()` composes recommendations, breakdown, and timeline from the same snapshot helpers.

---

## Adapter API

```typescript
type ProfileReadinessSnapshot = {
  entityId: string
  profileKind: 'individual' | 'company'
  score: number
  status: 'incomplete' | 'needs_review' | 'ready_for_matching'
  missingRequired: readonly string[]
  missingRecommended: readonly string[]
  recommendations: readonly string[]
  requiredTotal: number
  recommendedTotal: number
  completionLocked?: boolean
  createdAt?: string
  evaluatedAt?: string
  locale?: string
}

const profileExplainabilityAdapter: ExplainabilityAdapter<ProfileReadinessSnapshot>
buildProfileExplanation(snapshot): ExplanationBundle
```

### Method responsibilities

| Method | Output |
|--------|--------|
| `buildExplanation()` | Full `ExplanationBundle` with `engine: profile` |
| `buildRecommendations()` | `Recommendation[]` with `reasonCode`, `impactPercent`, `href` |
| `buildBreakdown()` | Required (70%) + recommended (30%) `ScoreBreakdownEntry[]` |
| `buildTimeline()` | `profile-created` (if `createdAt`) + `profile-evaluated` events |

---

## Reason code mapping

| Profile field label | Reason code |
|---------------------|-------------|
| Full Name | `PROFILE_MISSING_FULL_NAME` |
| Role | `PROFILE_MISSING_ROLE` |
| Skills | `PROFILE_MISSING_SKILLS` |
| Services | `PROFILE_MISSING_SERVICES` |
| Location | `PROFILE_MISSING_LOCATION` |
| Availability | `PROFILE_MISSING_AVAILABILITY` |
| Portfolio | `PROFILE_MISSING_PORTFOLIO` |
| Experience | `PROFILE_MISSING_EXPERIENCE` |
| Certifications | `PROFILE_MISSING_CERTIFICATIONS` |
| Previous Projects | `PROFILE_MISSING_PREVIOUS_PROJECTS` |
| Company Name | `PROFILE_MISSING_COMPANY_NAME` |
| Business Category | `PROFILE_MISSING_BUSINESS_CATEGORY` |
| Project Categories | `PROFILE_MISSING_PROJECT_CATEGORIES` |
| Contact Person | `PROFILE_MISSING_CONTACT_PERSON` |
| Team Size | `PROFILE_MISSING_TEAM_SIZE` |
| Coverage Areas | `PROFILE_MISSING_COVERAGE_AREAS` |
| Financial Capacity | `PROFILE_MISSING_FINANCIAL_CAPACITY` |

**Synthetic codes:** `PROFILE_COMPLETION_LOCKED`, `PROFILE_REQUIRED_COMPLETE`, `PROFILE_RECOMMENDED_COMPLETE`, `PROFILE_COMPLETE`, `PROFILE_SCORE_SUMMARY`.

---

## Health mapping

| Readiness status | Bundle `health` |
|------------------|-----------------|
| `ready_for_matching` | `excellent` |
| `needs_review` | `warning` |
| `incomplete` | `critical` |

---

## Web integration (deferred to E7)

E1 does **not** wire the adapter into UI. Future web service:

```typescript
import { profileExplainabilityAdapter } from '@pm-twin/explainability'
import { evaluateProfileReadiness, getProfileReadinessRules } from '@/domain/profile-readiness'

const result = evaluateProfileReadiness(input)
const { required, recommended } = getProfileReadinessRules(input.profileKind)
const bundle = profileExplainabilityAdapter.buildExplanation({
  entityId,
  profileKind: input.profileKind,
  ...result,
  requiredTotal: required.length,
  recommendedTotal: recommended.length,
})
```

---

## Consequences

### Positive

- First reference implementation for E2–E6 adapters
- Contract-tested mapping from real profile readiness labels
- No web dependency — package stays portable

### Deferred

- UI rendering (E7)
- KnowledgeBridge enrichment for profile codes (E8)
- Cross-engine `RecommendationService` aggregation (E6)

---

## References

- `packages/explainability/src/adapters/profile-adapter.ts`
- `packages/explainability/src/adapters/profile-field-map.ts`
- `packages/explainability/tests/profile-adapter.test.js`
- `web/src/domain/profile-readiness/profile-readiness-rules.ts`
