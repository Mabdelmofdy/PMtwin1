# UAT Findings Log

Persistent tracker for User Acceptance Testing findings on PM-Twin. Every row must end in one of four states — no row is left open.

| Status | Meaning |
|--------|---------|
| **Fixed** | Root cause corrected in this pass, with a regression test |
| **Verified** | Fixed in an earlier pass; re-confirmed here against a passing suite |
| **Deferred** | Real, accepted, and scheduled — not blocking production readiness |
| **Classified** | Not a defect: known limitation, design decision, or manual-only scope |

Last updated **2026-08-03**, against `main` @ `b869e61` plus the UAT stabilization change set.

---

## Open findings

None. All rows below are Fixed, Verified, Deferred, or Classified.

---

## 1. Matching and match lifecycle

| ID | Severity | Status | Finding | Root cause | Resolution | Evidence |
|----|----------|--------|---------|------------|------------|----------|
| UAT-01 | High | Verified | Auto matching used the wrong owner / session identity, so a user could match against their own posts | Owner party was resolved from the session actor instead of the opportunity record at discover time | Discover resolves `userId` / `partyId` / `representativeUserIds` from the opportunity; same-owner need↔offer pairs are filtered at discover | `publish-matching.test.ts`, `matching-service.test.ts` |
| UAT-02 | High | Verified | Closing or archiving an opportunity left its open matches in the active match list | `CloseOpportunity` / `ArchiveOpportunity` only changed `visibilityStatus`; nothing reconciled the linked PostMatches | `expireActiveMatchesOnOpportunityWithdrawn` expires `discovered` and `accepted` matches and leaves `confirmed` alone | `opportunity-command-handler.test.ts` — close/archive match sync |
| UAT-03 | High | **Fixed** | Matches expired silently — neither participant was told their match had ended | The expiry domain function wrote the status change and an audit entry but was never given a notification sink; `OpportunityCommandHandler` was not even constructed with a `notificationRepository` | Added `match_expired` to the notification type union, emitted it to both participants from the shared expiry path with closed-vs-archived copy, and wired `notificationRepository` through the handler, the application gateway, and the test stack | `opportunity-command-handler.test.ts` — match expiration notifications (6 cases); `web/e2e/uat-match-expiration.spec.ts` scenarios 2 and 3 |
| UAT-04 | Medium | Verified | Closed / archived opportunities could still be picked up as matching candidates | The candidate pool filtered on lifecycle `status` only, which Close/Archive does not change | `isMatchingPoolOpportunity` requires `published` **and** non-withdrawn visibility | `uat-one-way-findings.test.ts` |
| UAT-05 | Medium | **Fixed** | No regression test proved that Accept is blocked once a match has expired — a stated Scenario 2 expectation | The existing expired fixture had no participants, so an Accept attempt failed on the participant check rather than the lifecycle gate, leaving the real rule unasserted | Added an expired fixture with real participants and a test asserting a participant's Accept is rejected and the status stays `expired` | `post-match-command-handler.test.ts` — "AcceptPostMatch after the match expired is rejected" |
| UAT-06 | Low | Classified | Duplicate `match_expired` notifications on a repeat Close | Not reproducible by design: only `discovered` / `accepted` transition, so a second Close finds nothing expirable and emits nothing | No change needed; locked in by test | `opportunity-command-handler.test.ts` — "does not duplicate notifications when close runs twice" |

## 2. Opportunity wizard and taxonomy

| ID | Severity | Status | Finding | Root cause | Resolution | Evidence |
|----|----------|--------|---------|------------|------------|----------|
| UAT-07 | High | Verified | Service Exchange and Task-Based collaboration taxonomy diverged between the wizard and the matching engine | Component allow-lists were derived per surface instead of from one registry | Allowed commercial component types resolve from `allowed-components.ts` for both sub-model and exchange-mode paths | `uat-one-way-findings.test.ts` — `allowedCommercialComponentTypesForSubModel` |
| UAT-08 | Medium | Verified | Invalid exchange-mode combinations were only rejected at publish, after five wizard steps | Validation ran at the publish gate, not at component selection | `filterCommercialComponentTypesByExchangeModes` narrows the offered set up front (hybrid maps to `custom` without inventing `barter`) | `uat-one-way-findings.test.ts`, `commercial-structure.test.ts` |
| UAT-09 | Medium | **Fixed** | `create-validation.test.ts` asserted a free-text primary location and failed after the canonical location picker shipped | Test fixture predated the product change from free text to canonical scope IDs | Fixture uses `sa/riyadh/riyadh-city` | `create-validation.test.ts` |

## 3. Test suite health

| ID | Severity | Status | Finding | Root cause | Resolution | Evidence |
|----|----------|--------|---------|------------|------------|----------|
| UAT-10 | High | **Fixed** | `deal-service.test.ts` could not load | Duplicate `createCommercialAgreementCommandService` import — `SyntaxError: Identifier has already been declared` | Removed the redundant import | `deal-service.test.ts` |
| UAT-11 | Medium | **Fixed** | Two analytics suites asserted an average readiness of 85 and failed at 77.5 | The profile scoring model gained recommended fields, lowering the fixture average; the expectations were never updated | Expectations corrected to 77.5 with a note on why | `matching-quality-analytics.test.ts`, `readiness-analytics.test.ts` |
| UAT-12 | Medium | **Fixed** | Commercial-agreement label governance failed after the admin pages refactor | The test scanned only `admin-pages.tsx`, but the wording had moved to sibling files | The scan walks every `.ts` / `.tsx` under `pages/admin` | `commercial-agreement-label-governance.test.ts` |
| UAT-13 | Low | **Fixed** | No browser-level coverage for the three UAT verification scenarios; authentication, logout, and same-browser user switching had no automated home at all | Auth behaviour is inherently browser-scoped, so no node:test suite could own it | Added a seed-backed Playwright spec covering login, logout, user switching, and Scenarios 1–3 | `web/e2e/uat-match-expiration.spec.ts` — 3 specs |
| UAT-31 | Medium | **Fixed** | The company-account E2E spec failed on login | The shared `signIn` helper asserted `toHaveURL(/\/dashboard/)`, but company accounts land on `/company-dashboard` — which has no `/` before `dashboard`, so the pattern never matched | Relaxed the pattern to `/dashboard/` so it accepts both landing routes | `web/e2e/professional-profile.spec.ts` — "company registration, address, hours, and VAT fields persist" |

## 4. Documentation

| ID | Severity | Status | Finding | Root cause | Resolution | Evidence |
|----|----------|--------|---------|------------|------------|----------|
| UAT-14 | Medium | **Fixed** | `uat-need-opportunity-script.md` had a corrupted Goal section — the heading was spliced with the middle of a sentence and the rest appeared four lines later | Bad edit merge | Goal section reassembled | `docs/uat/uat-need-opportunity-script.md` |
| UAT-15 | Medium | **Fixed** | The four-type sign-off matrix and the opportunity-module matrix were entirely unsigned, so nothing recorded what had actually been verified | Matrices were only ever intended for a manual tester and no automated evidence column existed | Added an automated-verification section to both, filled from the passing suite, and kept the manual grid for what automation cannot assert | `uat-matching-final-four-type-checklist.md`, `opportunity-module-uat-checklist.md` |
| UAT-16 | Medium | **Fixed** | Close/Archive match sync was documented as "intended" behaviour, and the notification tables listed no expiry event | Docs predated the implementation | `opportunity-workflow.md` documents the full expiry chain, copy, audit, and de-dup rule; `matching-workflow.md` lists `match_expired` | `docs/workflow/opportunity-workflow.md`, `docs/workflow/matching-workflow.md` |
| UAT-17 | Low | **Fixed** | `matching-system.md` listed match expiry as an open gap without qualification | The gap note predated event-driven expiry | Marked partially addressed: event-driven expiry is complete, time-based TTL remains open | `docs/modules/matching-system.md` |

## 5. Deferred — technical debt

These pre-date this UAT work and were **not introduced by this change set**. They are recorded rather than refactored, because fixing them means restructuring components and hook behaviour in files unrelated to the approved UAT scope, immediately before a production readiness sign-off.

| ID | Severity | Status | Finding | Remediation plan |
|----|----------|--------|---------|------------------|
| UAT-18 | Medium | Deferred | 47 × `react-refresh/only-export-components` | Each file exports both a component and a non-component value. Move constants, hooks, and helpers into sibling modules (`*-helpers.ts`, `*-constants.ts`) one directory at a time. Mechanical but wide; do it as its own PR series with no behaviour change. |
| UAT-19 | Medium | Deferred | 18 × `react-hooks/set-state-in-effect` | Each is a `setState` inside an effect that could loop or cause an extra render pass. Audit case by case: derive during render, lift to an event handler, or key the component. Runtime behaviour changes, so each needs its own test. |
| UAT-20 | High | Deferred | 4 × `react-hooks/rules-of-hooks` | Hooks called conditionally or outside a component. These are the highest-risk items in this group and should be fixed first — a conditional hook can desynchronise hook order across renders. Fix before the next feature lands in those files. |
| UAT-21 | Low | Deferred | 3 × `react-hooks/refs`, 1 × `static-components`, 1 × `preserve-manual-memoization`, 1 × `use-memo` | Correctness and memoization hints from the React Compiler rules. Fix opportunistically when next editing each file. |

Total remaining: **75 errors / 76 warnings**, down from 108 / 76. The 33 mechanically safe errors (unused variables, useless escapes, `prefer-const`, useless assignment) were fixed in this pass; deliberate underscore-prefixed omissions are now recognised by the ESLint config rather than removed, because dropping a destructure-omit binding would put the key back into the rest spread and change runtime behaviour.

## 6. Classified — known limitations

| ID | Status | Finding | Rationale |
|----|--------|---------|-----------|
| UAT-22 | Classified | Time-based match TTL is lazy and mostly unset (`expiresAt: null`, no scheduled sweep) | Needs a backend job runner, which does not exist in the current localStorage-backed runtime. Event-driven expiry (Close/Archive) is complete and covers the UAT scenarios. Tracked at `matching-system.md`. |
| UAT-23 | Classified | `findMatchesForPost()` uses route precedence rather than the full `detectMatchingModel()` list | Pre-existing engine design note. A post qualifying for several models persists only the first route plus circular. Behaviour is deterministic and documented; changing it is a matching-engine change, out of UAT scope. |
| UAT-24 | Classified | Admin preview run and persistence are separate; no bulk save of selected preview rows | Admin convenience gap, not a correctness defect. |
| UAT-25 | Classified | `matching_runs` history records only opportunity, model, and timestamp | Analytics enrichment, no user-facing impact. |
| UAT-26 | Classified | Scoring profile split between product spec (40/30/15/10/5) and live config (25/20/20/10/10/10/5) | Requires a product decision on the canonical profile before code changes. |
| UAT-27 | Classified | Matching depends on normalized opportunity fields; missing values reduce or block matching | Mitigated by the publish readiness gate and Target Role publish requirement. |
| UAT-28 | Classified | No production backend or job runner; localStorage cannot enforce uniqueness, scheduled expiry, or cross-device results | Architectural, and the single largest gap between this build and a multi-tenant SaaS deployment. See the production readiness assessment. |
| UAT-29 | Classified | KI-1 — `app-header.tsx` uses `shadow-[0_1px_0_0_hsl(var(--border)/0.4)]`, failing `validate:design:strict` | Already owned as R9 with a dedicated hotfix PR (`upx(phase-a-hotfix)`), explicitly scoped out of other PRs. |
| UAT-30 | Classified | RTL has no automated coverage in `web/src` | Arabic RTL support is a KSA compliance requirement and remains a mandatory manual pass. Recorded on the opportunity-module checklist. |

---

## Related

- [uat-final-completion-report.md](./uat-final-completion-report.md)
- [uat-matching-final-four-type-checklist.md](./uat-matching-final-four-type-checklist.md)
- [opportunity-workflow.md](../workflow/opportunity-workflow.md) · [matching-workflow.md](../workflow/matching-workflow.md)
- [matching-system.md](../modules/matching-system.md)
