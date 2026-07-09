# ADR-201-E8: KnowledgeBridge + Explainability Enrichment

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Version** | 1.0 |
| **Date** | 9 July 2026 |
| **Parent** | [ADR-201: Explainability Foundation](./ADR-201-explainability-foundation.md) |
| **Sprint** | E8 — KnowledgeBridge enrichment |
| **Packages** | `@pm-twin/explainability`, `@pm-twin/collaboration-models`, `web/` |

---

## Context

Sprints E0–E7 established the `ExplanationBundle` contract, engine adapters, web snapshot builders, and UI components. E0 defined the `KnowledgeBridge` interface only. E7 deferred registry-backed enrichment, negotiation room explainability, multi-bundle dashboard aggregation, and AI payload surfacing.

The Knowledge Registry (`@pm-twin/collaboration-models`) already exposes read APIs (`getEducationalContent`, `getRiskProfile`, `getComplianceMetadata`, `getLifecycleMetadata`, etc.). E8 connects those APIs to explainability without modifying catalog data, scoring engines, FSM, or command handlers.

---

## Decision

### 1. KnowledgeBridge implementation

`packages/explainability/src/services/knowledge-bridge-impl.ts` implements the E0 interface via `createKnowledgeBridge()`:

| Method | Registry source |
|--------|-----------------|
| `resolveEducationalContent` | `getEducationalContent(subModelKey)` |
| `resolveComplianceHints` | `getComplianceMetadata(subModelKey)` |
| `resolveRiskHints` | `getRiskProfile(subModelKey)` + educational risks |
| `resolveLifecycleHints` | `getLifecycleMetadata(subModelKey)` |
| `resolveKnowledgeAnswer` | ReasonCode + `context.subModelKey` → field guidance, compliance, risk, lifecycle, or educational fallback |

`subModelKey` is passed through `KnowledgeBridgeRequest.context` — adapters remain unchanged.

### 2. Non-destructive enrichment

`enrichExplanationBundle(bundle, { subModelKey?, locale?, knowledgeBridge? })` in `packages/explainability/src/services/enrichment.ts`:

- Preserves adapter `summary`, `score`, `health`, and existing `reasons`
- Writes registry content to `metadata.extensions.knowledge` (`KnowledgeExtension`)
- Sets `metadata.knowledgeVersion` from `getKnowledgeMetadata(subModelKey)`
- Optionally appends up to three supplementary `KNOWLEDGE_*` info reasons (non-duplicative)

### 3. Package dependency

`@pm-twin/explainability` adds `@pm-twin/collaboration-models` as its first runtime dependency (registry read API only).

### 4. Web wiring

`web/src/services/explainability/explainability-service.ts`:

- `enrichBundle()` wrapper for components
- `buildOpportunityExplanation`, `buildAgreementExplanation`, and `buildNegotiationExplanation` call enrichment when `subModelKey` is provided

**Surfaces:**

| Surface | Behavior |
|---------|----------|
| Negotiation room overview | Compact `ExplanationPanel` + `showAiPayload` |
| Workspace dashboard | Aggregates profile + draft opportunity bundles |
| Pending vetting dashboard | Aggregates profile + vetting bundles |
| `ExplanationPanel` | Renders `metadata.extensions.knowledge`; optional Copy for AI footer |

### 5. Reason codes

New `KNOWLEDGE_*` prefix for enrichment-only supplementary reasons:

- `KNOWLEDGE_EDUCATIONAL_HINT`
- `KNOWLEDGE_RISK_HINT`
- `KNOWLEDGE_COMPLIANCE_HINT`
- `KNOWLEDGE_LIFECYCLE_HINT`
- `KNOWLEDGE_FIELD_GUIDANCE`

---

## Constraints (unchanged)

- No edits to `packages/collaboration-models/src/knowledge/catalog.ts`
- No scoring / FSM / command handler changes
- KnowledgeBridge reads registry via public API only

---

## Consequences

### Positive

- UI and AI consumers receive registry-backed context without adapter duplication
- Reason codes remain stable keys for knowledge resolution
- Multi-bundle dashboard recommendations unify profile, vetting, and opportunity gaps

### Negative / deferred

- Agreement enrichment requires explicit `subModelKey` from calling context (not always on read model)
- Arabic bilingual content in knowledge hints follows registry locale strategy (UI RTL in E7; bilingual copy in registry is a future sprint)

---

## E9 next

- AI gateway ingestion of `AIExplanationPayload`
- Dashboard and analytics engine adapters (`ENGINE_ID.DASHBOARD`, `ENGINE_ID.ANALYTICS`)
- Observability hooks for explainability bundle generation

---

## References

- `packages/explainability/src/services/knowledge-bridge-impl.ts`
- `packages/explainability/src/services/enrichment.ts`
- `web/src/services/explainability/explainability-service.ts`
- [ADR-201-E7](./ADR-201-E7-explainability-ui-wiring.md)
