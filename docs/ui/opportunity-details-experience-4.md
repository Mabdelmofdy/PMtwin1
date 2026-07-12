# Opportunity Details Experience 4.0

Route: `/opportunities/:id`

The detail page is an executive Opportunity Workspace and the **canonical read experience** for the Opportunity module (Enterprise Reference Specification).

Presentation only — Matching Engine, Readiness Engine, command handlers, and repository contracts are unchanged.

## Structure

- Page entry: `web/src/pages/workspace/opportunity-detail-page.tsx`
- Shell: `web/src/components/opportunity/details/`
- Read model: `web/src/lib/opportunity-details/`

## Enterprise UI Contract

Executive Header → KPI Strip → Interactive Journey → Workspace Navigation → Overview → Domain Workspaces → Related → History → Command Center

## Workspaces (`?workspace=`)

`overview` · `scope` · `commercial` (incl. Payment) · `marketplace` · `matching` · `documents` · `related` · `history`

## Field coverage

See:

- [`docs/domain/opportunity-field-catalog.md`](../domain/opportunity-field-catalog.md)
- [`docs/domain/opportunity-coverage-matrices.md`](../domain/opportunity-coverage-matrices.md)

## Journey

- Mounted via `PmWorkflowJourney` + `buildOpportunityWorkflowSteps`
- Current stage highlighted; completed/current clickable when related entity exists and viewer is authorized
- Future stages disabled (no fake progress)
- Contract step gets `href` when a related contract id exists
- Dead chrome not mounted: `OpportunityVersionTimeline`, `CollaborationFlowStrip`

## Health / Readiness (presentation)

- **Opportunity Health** card in Command Center: Healthy · Warnings · Blocking Issues from readiness blockers/recommendations + lifecycle health helper
- Hidden when viewer cannot see readiness, or when archived/withdrawn (insufficient presentation signal)
- Readiness list remains flat — domain readiness result has no Basic/Commercial/Scope category metadata; do not invent categories
- Do not remount estimated-match / heuristic health panels from legacy `OpportunityHealthIndicator`

## Payment

Commercial workspace includes Payment (cash schedule, advance, retention, VAT, guarantees) via audience-gated commercial presentation — never invent amounts for public/teaser.

## Guardrails

- No fake views/bookmarks/shares metrics
- No readiness-as-match heuristics
- Commercial amounts via `presentCommercialForAudience`
- Actions via `opportunityCommandService` / publish UI actions
- Map geospatial unavailable until configured
- Journey: completed/current clickable when authorized; future disabled
