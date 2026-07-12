# Opportunity Details Experience 4.0

Route: `/opportunities/:id`

The detail page is an executive Opportunity Workspace. Presentation only — Matching Engine, Readiness Engine, command handlers, and repository contracts are unchanged.

## Structure

- Page entry: `web/src/pages/workspace/opportunity-detail-page.tsx`
- Shell: `web/src/components/opportunity/details/`
- Read model: `web/src/lib/opportunity-details/`

## Workspaces (`?workspace=`)

`overview` · `scope` · `commercial` · `marketplace` · `matching` · `documents` · `related` · `history`

## Guardrails

- No fake views/bookmarks/shares metrics
- No readiness-as-match heuristics
- Commercial amounts via `presentCommercialForAudience`
- Actions via `opportunityCommandService` / publish UI actions
