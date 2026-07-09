# ADR-201-E4: Matching Explainability Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E4 — Matching adapter |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprints E1–E3 delivered profile, vetting, and opportunity/readiness adapters. The matching engine in `@pm-twin/matching` already produces rich outputs — `ScoreBreakdown`, `ScoreLabels`, `MatchRecommendation`, hard-constraint failures, and topology-aware model runs — but no canonical `ExplanationBundle` mapping exists yet.

E4 bridges ranked match results to the explainability contract **without modifying** matching scoring, web UI, or matching-service (deferred to E7).

---

## Decision

Implement `matchingExplainabilityAdapter` in `@pm-twin/explainability` accepting a minimal `MatchExplainabilitySnapshot` input — decoupled from `@pm-twin/matching` and `web/` types.

**Rules:**

1. Web callers map ranked match outputs into `MatchExplainabilitySnapshot`; the adapter never imports from `matching` or `web/`.
2. Default weights (`SKILL_MATCH` 25%, `EXCHANGE_COMPATIBILITY` 20%, etc.) are duplicated in the adapter **for breakdown display only** — `post-to-post-scoring.ts` remains authoritative for `matchScore`.
3. `matchScore` accepts 0–1 or 0–100; the adapter normalizes to 0–100 on the bundle.
4. Hard-gate and `skill_floor` rejection map to `blockers[]` with canonical `MATCH_*` codes.

---

## Adapter API

```typescript
type MatchExplainabilitySnapshot = {
  entityId: string
  matchScore: number
  topology?: 'one_way' | 'two_way' | 'consortium' | 'circular'
  topologyReason?: string
  breakdown: {
    skillMatch: number
    exchangeCompatibility: number
    valueCompatibility: number
    budgetFit: number
    timelineFit: number
    locationFit: number
    reputation: number
    serviceOverlapPct?: number
    attributeOverlap?: number
    rejected?: string
  }
  labels?: Partial<ScoreLabels>
  recommendation?: { tier: 'top' | 'good' | 'possible'; reason: string; actionRequired?: boolean }
  hardGateFailure?: { code: string; message: string }
  counterpartEntityId?: string
  evaluatedAt?: string
  locale?: string
}

const matchingExplainabilityAdapter: ExplainabilityAdapter<MatchExplainabilitySnapshot>
buildMatchingExplanation(snapshot): ExplanationBundle  // engine: matching
```

### Method responsibilities

| Method | Output |
|--------|--------|
| `buildExplanation()` | Full `ExplanationBundle` with `engine: matching` |
| `buildRecommendations()` | Tier action + low-dimension improvement hints |
| `buildBreakdown()` | Per-dimension `ScoreBreakdownEntry[]` with weight hints |
| `buildTimeline()` | `match-discovered` + `match-evaluated` events |

---

## Match output → ExplanationBundle mapping

| Match output field | ExplanationBundle field |
|--------------------|-------------------------|
| `matchScore` (0–1 or 0–100) | `score` (0–100) |
| `recommendation.tier` or score thresholds | `health` |
| `recommendation.reason` + dimension labels | `reasons[]` |
| `hardGateFailure` / `breakdown.rejected` | `blockers[]` |
| Dimensions labeled `Match` | `strengths[]` |
| Dimensions labeled `Partial` / `No Match` | `weaknesses[]` |
| `recommendation.actionRequired` + low scores | `recommendations[]` |
| `breakdown` + default weights | `scoreBreakdown[]` |
| `evaluatedAt` | `timeline[]` |
| `topology`, `counterpartEntityId` | `metadata.extensions` |

---

## Health mapping

| Source | Bundle `health` |
|--------|-----------------|
| `recommendation.tier === 'top'` or score ≥ 85 | `excellent` |
| `recommendation.tier === 'good'` or score ≥ 70 | `good` |
| `recommendation.tier === 'possible'` or score ≥ 50 | `warning` |
| score < 50 | `critical` |

---

## Reason code mapping

### Score dimensions

| Dimension | Low-score reason code | Weight hint |
|-----------|----------------------|-------------|
| `skillMatch` | `MATCH_SKILL_LOW` | 25% |
| `attributeOverlap` | `MATCH_SKILL_LOW` | 0% (display) |
| `serviceOverlapPct` | `MATCH_SERVICE_OVERLAP_LOW` | 0% (display) |
| `exchangeCompatibility` | `MATCH_EXCHANGE_LOW` | 20% |
| `valueCompatibility` | `MATCH_VALUE_LOW` | 20% |
| `budgetFit` | `MATCH_BUDGET_LOW` | 10% |
| `timelineFit` | `MATCH_TIMELINE_LOW` | 10% |
| `locationFit` | `MATCH_LOCATION_LOW` | 10% |
| `reputation` | `MATCH_REPUTATION_LOW` | 5% |

### Hard gates and rejection

| Source code | Reason code |
|-------------|-------------|
| `role_incompatible` | `MATCH_HARD_GATE_ROLE_INCOMPATIBLE` |
| `core_skill_missing` | `MATCH_HARD_GATE_SKILL_MISSING` |
| `service_overlap_low` | `MATCH_HARD_GATE_SERVICE_OVERLAP_LOW` |
| `breakdown.rejected === 'skill_floor'` | `MATCH_SKILL_LOW` |

### Tier and topology

| Source | Reason code |
|--------|-------------|
| `tier: top` | `MATCH_TIER_TOP` |
| `tier: good` | `MATCH_TIER_GOOD` |
| `tier: possible` | `MATCH_TIER_POSSIBLE` |
| Score summary | `MATCH_SCORE_SUMMARY` |
| `topology: one_way` | `MATCH_TOPOLOGY_ONE_WAY` |
| `topology: two_way` | `MATCH_TOPOLOGY_TWO_WAY` |
| `topology: consortium` | `MATCH_TOPOLOGY_CONSORTIUM` |
| `topology: circular` | `MATCH_TOPOLOGY_CIRCULAR` |

---

## Web integration (deferred to E7)

E4 does **not** wire the adapter into `matching-service` or UI. Future web service maps `RankedMatch` + hard-constraint context into `MatchExplainabilitySnapshot` and calls `buildMatchingExplanation()`.

---

## Consequences

### Positive

- Canonical explainability for match discovery and ranking without engine changes
- Topology and counterpart metadata preserved for AI and UI surfaces
- Hard-gate failures and skill-floor rejections surface as auditable blockers

### Deferred

- Web wiring in `matching-service` (E7)
- Negotiation adapter (E5)
- KnowledgeBridge enrichment for `MATCH_*` codes (E8)

---

## References

- `packages/explainability/src/adapters/matching-adapter.ts`
- `packages/explainability/src/adapters/matching-field-map.ts`
- `packages/explainability/src/adapters/matching-types.ts`
- `packages/explainability/tests/matching-adapter.test.js`
- `packages/matching/src/scoring/post-to-post-scoring.ts`
- `packages/matching/src/routing/rank-matches.ts`
- [ADR-201-E3: Opportunity + Readiness Adapter](./ADR-201-E3-opportunity-readiness-adapter.md)
