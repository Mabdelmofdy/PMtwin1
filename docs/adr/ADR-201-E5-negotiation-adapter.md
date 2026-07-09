# ADR-201-E5: Negotiation Explainability Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E5 — Negotiation adapter |
| **Package** | `@pm-twin/explainability` |

---

## Context

Sprints E1–E4 delivered profile, vetting, opportunity/readiness, and matching adapters. The negotiation lifecycle (`active → countered → agreed → expired → cancelled`) and transcript read model in `web/` already surface offers, commercial term diffs, and audit events — but no canonical `ExplanationBundle` mapping exists yet.

E5 bridges negotiation state snapshots to the explainability contract **without modifying** the negotiation FSM, command handlers, or web UI (deferred to E7).

---

## Decision

Implement `negotiationExplainabilityAdapter` in `@pm-twin/explainability` accepting a minimal `NegotiationExplainabilitySnapshot` input — decoupled from `web/` transcript types and negotiation command handlers.

**Rules:**

1. Web callers map `NegotiationTranscriptReadModel` / negotiation entity state into `NegotiationExplainabilitySnapshot`; the adapter never imports from `web/`.
2. Progress `score` (0–100) and `health` are **read-only display heuristics** — the negotiation FSM remains authoritative.
3. `timelineEvents` may be pre-built from transcript events; otherwise the adapter synthesizes from status and offer timestamps.
4. Blockers surface terminal states (`expired`, `cancelled`), `changesRequested`, and large price gaps (≥ 20%).

---

## Adapter API

```typescript
type NegotiationExplainabilitySnapshot = {
  entityId: string
  status: 'active' | 'countered' | 'agreed' | 'expired' | 'cancelled'
  currentOffer?: { amount?, currency?, termsSummary?, submittedAt?, submittedBy? }
  acceptedOffer?: { ... } | null
  pendingCounterOffer?: boolean
  commercialTermsGaps?: readonly { field, label, priorValue?, proposedValue?, changeSummary? }[]
  priceGap?: { percent?, absolute?, currency? }
  responseDelayDays?: number
  changesRequested?: boolean
  reviewNotes?: string
  requestedItems?: readonly string[]
  offerCount?, counterOfferCount?
  timelineEvents?: readonly { type, title, description, timestamp, status? }[]
  evaluatedAt?, locale?
}

const negotiationExplainabilityAdapter: ExplainabilityAdapter<NegotiationExplainabilitySnapshot>
buildNegotiationExplanation(snapshot): ExplanationBundle  // engine: negotiation
```

### Method responsibilities

| Method | Output |
|--------|--------|
| `buildExplanation()` | Full `ExplanationBundle` with `engine: negotiation` |
| `buildRecommendations()` | Counter, accept, resolve changes, respond to delay — with href hints |
| `buildBreakdown()` | Price / terms / timeliness / offer progression dimensions |
| `buildTimeline()` | Pre-built or synthesized negotiation events |

---

## Negotiation output → ExplanationBundle mapping

| Snapshot field | ExplanationBundle field |
|----------------|-------------------------|
| `status` + offer progress heuristic | `score` (0–100) |
| `status` + score thresholds | `health` |
| `status`, term gaps, price gap, delay | `reasons[]` |
| `changesRequested`, `expired`, `cancelled`, large price gap | `blockers[]` |
| `agreed`, `acceptedOffer`, aligned terms | `strengths[]` |
| Term gaps, price gap, delay, pending counter | `weaknesses[]` |
| Pending counter, accept, changes, delay, price gap | `recommendations[]` |
| Four display dimensions | `scoreBreakdown[]` |
| `timelineEvents` or synthesized events | `timeline[]` |
| `offerCount`, `counterOfferCount`, `status` | `metadata.extensions` |

---

## Health mapping

| Source | Bundle `health` |
|--------|-----------------|
| `status === 'agreed'` | `excellent` |
| `active` with score ≥ 65, or `countered` with score ≥ 55 | `good` |
| `active` or `countered` (otherwise) | `warning` |
| `expired` or `cancelled` | `critical` |

---

## Progress score heuristic (display only)

| Status | Score range |
|--------|-------------|
| `agreed` | 100 |
| `active` with offers | 50–70 |
| `active` without offers | 30 |
| `countered` | 40–60 |
| `expired` | 5 |
| `cancelled` | 10 |

Penalties apply for commercial term gaps, price gap, response delay, and pending counter.

---

## Reason code mapping

### Status

| Status | Reason code |
|--------|-------------|
| `active` | `NEGOTIATION_STATUS_ACTIVE` |
| `countered` | `NEGOTIATION_STATUS_COUNTERED` |
| `agreed` | `NEGOTIATION_STATUS_AGREED` |
| `expired` | `NEGOTIATION_STATUS_EXPIRED` |
| `cancelled` | `NEGOTIATION_STATUS_CANCELLED` |

### Friction and outcomes

| Source | Reason code |
|--------|-------------|
| Score summary | `NEGOTIATION_SCORE_SUMMARY` |
| Price gap | `NEGOTIATION_PRICE_GAP` |
| Response delay (≥ 3 days) | `NEGOTIATION_RESPONSE_DELAY` |
| Commercial term gap | `NEGOTIATION_TERMS_MISMATCH` |
| Changes requested | `NEGOTIATION_CHANGES_REQUESTED` |
| Pending counter | `NEGOTIATION_COUNTER_PENDING` |
| Accepted offer | `NEGOTIATION_OFFER_ACCEPTED` |
| No offers | `NEGOTIATION_NO_OFFERS` |

### Href hints

| Action | Href pattern |
|--------|--------------|
| Offers | `/negotiation/{id}/offers` |
| Terms | `/negotiation/{id}/terms` |
| Term field | `/negotiation/{id}/terms#{field}` |
| Messages | `/negotiation/{id}/messages` |

---

## Score breakdown dimensions

| Dimension | Weight |
|-----------|--------|
| Price alignment | 30% |
| Terms alignment | 30% |
| Response timeliness | 20% |
| Offer progression | 20% |

---

## Web integration (deferred to E7)

E5 does **not** wire the adapter into `negotiation-transcript-read-model` or UI. Future web service maps transcript + negotiation entity into `NegotiationExplainabilitySnapshot` and calls `buildNegotiationExplanation()`.

---

## Consequences

### Positive

- Canonical explainability for negotiation rooms without FSM or handler changes
- Commercial term gaps and price friction surface as auditable reasons and recommendations
- Timeline supports both pre-built transcript events and synthesized fallbacks

### Deferred

- Web wiring in negotiation transcript / room UI (E7)
- Agreement + contract adapters + `RecommendationService` (E6) — see [ADR-201-E6](./ADR-201-E6-agreement-contract-recommendation-service.md)
- KnowledgeBridge enrichment for `NEGOTIATION_*` codes (E8)

---

## References

- `packages/explainability/src/adapters/negotiation-adapter.ts`
- `packages/explainability/src/adapters/negotiation-field-map.ts`
- `packages/explainability/src/adapters/negotiation-types.ts`
- `packages/explainability/tests/negotiation-adapter.test.js`
- `web/src/lib/negotiation-transcript-read-model.ts` (input shape reference only)
- `web/src/types/negotiation-discussion.ts` (offer types reference only)
- [ADR-201-E4: Matching Adapter](./ADR-201-E4-matching-adapter.md)
- [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md)
