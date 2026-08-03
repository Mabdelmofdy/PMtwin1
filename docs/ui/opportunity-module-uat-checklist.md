# Opportunity Module — Enterprise UAT Checklist (O7)

Validate after O6 certification. Presentation only — no engine changes.

## Matrix

| Area | Owner | Participant | Public | Admin | Auditor | Desktop | Tablet | Mobile | LTR | RTL |
|------|-------|-------------|--------|-------|---------|---------|--------|--------|-----|-----|
| Visibility / workspace access | | | | | | | | | | |
| Commercial redaction | | | | | | | | | | |
| Interactive Journey | | | | | | | | | | |
| Matching + deep links | | | | | | | | | | |
| Commercial + Payment | | | | | | | | | | |
| Related Objects | | | | | | | | | | |
| Documents | | | | | | | | | | |
| History | | | | | | | | | | |
| Command Center | | | | | | | | | | |
| Review ↔ Details parity | | | | | | | | | | |
| Marketplace card lifecycle | | | | | | | | | | |
| Map unavailable copy | | | | | | | | | | |
| Health (real data only) | | | | | | | | | | |
| Readiness categories | N/A — flat list (no category metadata in readiness result) | | | | | | | | | |

Mark Pass / Fail / N/A. Fix presentation defects before Architecture Exit Criteria sign-off.

## Automated backing (2026-08-03)

This is a **presentation** matrix — role × viewport × direction cannot be filled from the node:test suite, so the grid above stays a manual runtime sign-off. What automation does assert for each area, from the 1454-test / 377-suite pass:

| Area | Automated coverage | Still manual |
|------|--------------------|--------------|
| Visibility / workspace access | `entity-view-visibility.test.ts`, `people.visibility.test.ts` | Per-role rendering, viewport, RTL |
| Commercial redaction | `entity-view-visibility.test.ts` | Public viewer never sees amounts (spot check 5) |
| Interactive Journey | `pm-workflow-journey.test.ts`, `pm-workflow-journey-steps.test.ts` | Stage click affordance (spot check 3) |
| Matching + deep links | `publish-matching.test.ts`, `post-match-related-opportunities.test.ts` | Deep-link navigation in browser |
| Related Objects | `post-match-related-opportunities.test.ts` | Layout across viewports |
| History | `matching-run-audit.test.ts` | Timeline rendering |
| Command Center | `command-center-adapter.test.ts` | Layout across viewports |
| Marketplace card lifecycle | `marketplace-home-page.test.ts`, `uat-one-way-findings.test.ts` (closed/archived leave the pool) | Badge accuracy (spot check 2) |
| Readiness categories | `opportunity-readiness.test.ts`, `readiness-presentation.test.ts` | N/A — flat list, no category metadata |
| Close / Archive confirmation | `opportunity-command-handler.test.ts`, `web/e2e/uat-match-expiration.spec.ts` | Archive copy differs from Close (spot check 4) |
| Commercial + Payment, Documents, Map copy, Health | None specific to this matrix | Full manual pass |

RTL has no automated suite in `web/src`; it remains entirely manual.


## Spot checks

1. Save Draft → open Details → every filled Creation field appears (or Intentionally Hidden).
2. Publish → marketplace card shows Published / stage-accurate badge (not fake “Open” for contracted).
3. Completed journey stages clickable; future stages not linked.
4. Close Opportunity confirmation works for owner; Archive copy differs.
5. Public viewer never sees payment amounts.
6. Map page shows unavailable environment copy + Return to Marketplace.
