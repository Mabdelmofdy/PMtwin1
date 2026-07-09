# ADR-201-E9: AI Gateway, Analytics Adapters & Program Completion

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Depends on** | [ADR-201](./ADR-201-explainability-foundation.md), [ADR-201-E8](./ADR-201-E8-knowledge-bridge-enrichment.md) |
| **Package** | `@pm-twin/explainability`, `web/src/services/explainability/` |

---

## Context

Sprints E0–E8 delivered the explainability contract, eight entity adapters, `RecommendationService`, `KnowledgeBridge`, web UI wiring, and bundle enrichment. E8 deferred:

- AI gateway consuming `AIExplanationPayload`
- Dashboard + Analytics adapters (`ENGINE_ID.DASHBOARD`, `ENGINE_ID.ANALYTICS`)
- Observability for bundle generation
- Agreement `subModelKey` resolution from linked opportunities
- Bilingual/locale knowledge hints (Arabic RTL foundation)

E9 closes the explainability program (E0–E9).

---

## Decision

### 1. Dashboard adapter (`ENGINE_ID.DASHBOARD`)

- Snapshot: `DashboardExplainabilitySnapshot` — workspace KPIs, hero metric, aggregated cross-engine recommendations.
- Adapter maps activity dimensions → `DASHBOARD_*` reason codes.
- Read-only; no engine mutation.

### 2. Analytics adapter (`ENGINE_ID.ANALYTICS`)

- Snapshot: `AnalyticsExplainabilitySnapshot` — readiness totals, matching-quality funnel, risk blockers.
- Maps funnel rates and readiness coverage → `ANALYTICS_*` reason codes.
- Recommendations link to intelligence routes (`/intelligence/*`).

### 3. AI gateway

`createAIExplanationGateway()` provides:

| Method | Purpose |
|--------|---------|
| `exportPayload(bundle)` | `ExplanationBundle` → `AIExplanationPayload` |
| `importPayload(payload)` | Validates via `fromAIExplanationPayload` |
| `exportBatch(bundles)` | JSON array for RAG/agent context |
| `buildAgentContext(options)` | Structured `AgentExplainabilityContext` for future LLM integration |

No external LLM calls in E9 — serialization/consumption layer only.

Web wrapper: `web/src/services/explainability/ai-gateway-service.ts`.

### 4. Observability

`traceExplainabilityBuild(label, fn)` returns `{ result, trace }` with `ExplainabilityTrace` metadata. Web service logs `console.debug` in dev and attaches trace to `metadata.extensions.trace`.

### 5. Agreement subModelKey

`resolveAgreementSubModelKey()` in `agreement-snapshot.ts` derives knowledge key from linked need/offer opportunity or post-match fallback. Passed to `enrichBundle` in `buildAgreementExplanation`.

### 6. Locale foundation

`resolveLocalizedKnowledge(content, locale)` — English passthrough; Arabic prefers `extensions.ar` when present. `enrichExplanationBundle` sets `metadata.locale` and `extensions.localeResolved`.

### 7. Web integration

- Intelligence pages render compact `ExplanationPanel` via `buildAnalyticsExplanation`.
- Dashboard renders optional `buildDashboardExplanation` hero-metric explainability.
- `ExplanationPanel` uses AI gateway export for "Copy for AI".

---

## Program completion summary (E0–E9)

| Sprint | Deliverable | Status |
|--------|-------------|--------|
| E0 | Contract, types, reason codes, AI serialization | Complete |
| E1 | Profile adapter | Complete |
| E2 | Vetting adapter | Complete |
| E3 | Opportunity + readiness adapters | Complete |
| E4 | Matching adapter | Complete |
| E5 | Negotiation adapter | Complete |
| E6 | Agreement + contract + RecommendationService | Complete |
| E7 | Web UI wiring, snapshot builders | Complete |
| E8 | KnowledgeBridge + enrichment | Complete |
| E9 | AI gateway, dashboard/analytics adapters, observability, locale | Complete |

### Readiness posture (estimated)

| Dimension | E0 audit (~57/100) | Post-E9 estimate |
|-----------|-------------------|------------------|
| Contract & types | 90 | 95 |
| Engine adapters (10 surfaces) | 40 | 92 |
| AI consumption path | 30 | 88 |
| Knowledge enrichment | 20 | 85 |
| UI integration | 25 | 88 |
| Observability | 10 | 75 |
| i18n / Arabic RTL content | 15 | 55 (structure only) |
| **Overall** | **~57** | **~85** |

---

## Post-E9 backlog

1. Full Arabic translations in Knowledge Registry (`extensions.ar` population)
2. Server-side AI gateway endpoint (ingest `AgentExplainabilityContext`, stream to LLM)
3. External APM integration for `ExplainabilityTrace` (Datadog/OpenTelemetry)
4. `ENGINE_ID.AI` adapter for model-generated explanations (human-in-the-loop)
5. Historical analytics trend comparison (period-over-period in analytics adapter)
6. Dashboard real-time push updates for explanation bundles

---

## Consequences

### Positive

- Full explainability stack from domain engines through AI serialization
- Intelligence and dashboard surfaces share canonical `ExplanationBundle`
- Agent context object ready for RAG without coupling to LLM vendors

### Negative / deferred

- Arabic knowledge content remains structural — copy translation is post-E9
- Observability is dev-console only until APM wiring

---

## References

- `packages/explainability/src/adapters/dashboard-adapter.ts`
- `packages/explainability/src/adapters/analytics-adapter.ts`
- `packages/explainability/src/ai/gateway.ts`
- `packages/explainability/src/observability/trace.ts`
- `packages/explainability/src/services/locale.ts`
- `web/src/services/explainability/`
