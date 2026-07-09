# ADR-201-E7: Explainability UI Wiring

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E7 — Web UI wiring |
| **Packages** | `@pm-twin/explainability`, `web/` |

---

## Context

Sprints E0–E6 delivered `@pm-twin/explainability` with engine adapters, `createRecommendationService()`, and `aggregateRecommendations()`. The web runtime previously stripped rich readiness fields (e.g. `toOpportunityReadinessResult()` dropped `nextBestActions`, `blockingReasons`, and breakdown metadata).

E7 is the first sprint that surfaces explainability in the active `web/` product runtime. Scoring logic, FSM workflows, command handlers, and Knowledge Registry data remain unchanged.

---

## Decision

Introduce a **web explainability wiring layer** that maps existing evaluator/read-model outputs into adapter snapshot types, then renders canonical `ExplanationBundle` fields through reusable UI components.

### Layering

```
evaluateProfileReadiness / evaluateVettingReadiness / evaluateReadiness (canonical)
        ↓
web/src/services/explainability/snapshot-builders/*
        ↓
@pm-twin/explainability adapters → ExplanationBundle
        ↓
web/src/components/explainability/* → UI surfaces
```

**Rules:**

1. Snapshot builders live in `web/src/services/explainability/` — they may import web domain evaluators and read models, but must not import from `POC/src`.
2. UI components consume `ExplanationBundle` (or its typed fields) only — no new ad-hoc recommendation string formats in new code.
3. Existing score badges (`PmReadinessScoreBadge`, `PmMatchScoreBadge`) accept an optional `bundle` prop; when present, tooltip lines are derived from the bundle.
4. `ReadinessCard` accepts an optional `bundle`; when present it renders `ExplanationPanel` (compact) instead of legacy gap lists.
5. Publish readiness failures return `publishBundles` alongside legacy `details` strings for backward-compatible alerts.

---

## Web service API

| Function | Input | Output |
|----------|-------|--------|
| `buildProfileExplanation` | userId, profileKind, evaluator result, profile | `ExplanationBundle` |
| `buildVettingExplanation` | entityId, vetting result + input | `ExplanationBundle` |
| `buildOpportunityExplanation` | opportunityId, canonical `ReadinessResult` | `ExplanationBundle` |
| `buildMatchExplanation` | `PostMatch` | `ExplanationBundle` |
| `buildAgreementExplanation` | `CommercialAgreementDetailReadModel` | `ExplanationBundle` |
| `buildContractExplanation` | `ContractDetailReadModel` | `ExplanationBundle` |
| `buildNegotiationExplanation` | `Negotiation` + transcript (basic) | `ExplanationBundle` |
| `getAggregatedRecommendations` | `ExplanationBundle[]` | deduped `Recommendation[]` |

---

## UI components

| Component | Renders |
|-----------|---------|
| `ExplanationSummary` | score, health badge, summary |
| `ExplanationBlockers` | blockers + critical reasons |
| `ExplanationRecommendations` | recommendations with impact % and href links |
| `ExplanationBreakdown` | weighted score bars |
| `ExplanationTimeline` | timeline events via `PmTimeline` |
| `ExplanationHealthBadge` | HEALTH → badge tone |
| `ExplanationPanel` | composes all sections |

All components use existing design-system primitives (`PmBadge`, `PmButton`, `PmContentCard`, `PmTimeline`) and RTL-ready layout patterns.

---

## Integration surfaces (E7)

| Priority | Surface | Wiring |
|----------|---------|--------|
| P0 | `ProfileReadinessCard` / profile page | `buildProfileExplanation` + `ExplanationPanel` in `ReadinessCard` |
| P0 | `OpportunityReadinessCard` | canonical readiness → `buildOpportunityExplanation` |
| P0 | `PublishReadinessAlert` | optional `bundles` prop for blockers/reasons |
| P1 | `PendingVettingDashboard` | profile + vetting compact panels |
| P1 | `OpportunityCard` / `PmReadinessScoreBadge` | bundle-derived tooltip lines |
| P1 | `MatchCard` / `PmMatchScoreBadge` | `buildMatchExplanation` tooltips |
| P2 | Commercial agreement detail inspector | `ExplanationPanel` |
| P2 | Contract detail inspector | `ExplanationPanel` |
| P2 | Workspace dashboard | `getAggregatedRecommendations` next-best-action strip |

### Deferred (E8+)

- Negotiation room panel explainability inspector
- KnowledgeBridge AI enrichment of bundles
- Full publish-gate replacement of legacy string `details` (bundles added alongside for now)

---

## Copy fix

`ReadinessCard` previously always showed "Opportunity Readiness" under the score ring. E7 adds `scoreKindLabel` (defaulting by `opportunityCopy`) so profile cards show **Profile Readiness**.

---

## Testing

- Unit tests: `web/src/services/explainability/snapshot-builders/snapshot-builders.test.ts` (profile, opportunity, vetting)
- Component contract test: `web/src/components/explainability/explanation-panel.test.ts`
- Existing explainability package tests remain authoritative for adapter behavior

---

## Consequences

**Positive**

- Single explainability contract from engine through UI
- Opportunity readiness uses canonical `ReadinessResult` for recommendations (not stripped legacy result)
- Score tooltips and readiness cards show impact-ranked actions with deep links

**Negative / trade-offs**

- Snapshot mappers must be kept in sync when adapter snapshot types evolve
- Dual publish alert format (legacy strings + bundles) until E8 can drop strings

---

## E8 follow-up

Implement **KnowledgeBridge** in `@pm-twin/explainability` to enrich bundles with registry-backed answers, wire AI serialization (`toAIExplanationPayload`) in web inspectors, and extend negotiation/dashboard surfaces with multi-bundle aggregation.
