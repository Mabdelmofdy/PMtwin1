# Matching flow (simulation reference)

### What this page is

Technical **routing order** and dependencies for `findMatchesForPost`—for simulation and parity checks.

### Why it matters

Keeps test harnesses aligned with `matching-service.js`.

### What happens next

Compare with [matching-engine.md](../../../docs/matching-engine.md) and unit tests.

---

This document describes the current matching system so the simulation environment stays aligned with production behavior.

## Entry point and routing

- **Entry:** `matchingService.findMatchesForPost(opportunityId, options)` in `POC/src/services/matching/matching-service.js` (lines 16–44).
- **Routing order:**
  1. `options.model === 'circular'` → `findCircularExchanges(options)`
  2. `options.model === 'consortium'` or `subModelType === 'consortium'` → `findConsortiumCandidates(leadNeedId, options)`
  3. `options.model === 'two_way'` or `exchangeMode === 'barter'` (with intent request or offer) → `findBarterMatches(opportunityId, options)`
  4. `intent === 'request'` → `findOffersForNeed(needPostId, options)` (one-way)
  5. Otherwise → `{ model: 'one_way', matches: [] }`

## Data Dependencies

- **Data service:** `dataService.getOpportunityById(id)`, `dataService.getOpportunities()`.
- **Opportunities must have:** `intent` (`'request'` = Need, `'offer'` = Offer), `status === 'published'`, `scope` (e.g. `requiredSkills`, `offeredSkills`), `exchangeData`, `attributes` (timeline, `memberRoles` for consortium, etc.).
- **Preprocessor / scoring:** Optional `skill-canonical.json` loaded via `fetch` in browser; in Node the simulation bootstrap must stub or preload it.

## Match Score (Post-to-Post)

- **Implementation:** `POC/src/services/matching/post-to-post-scoring.js` — `scorePair(needPost, offerPost, needNorm, offerNorm, needProfile?, offerProfile?)`.
- **Weights** (from `POC/src/core/config/config.js`): Attribute Overlap 40%, Budget Fit 30%, Timeline 15%, Location 10%, Reputation 5%.
- **Threshold:** `CONFIG.MATCHING.POST_TO_POST_THRESHOLD` (default 0.50). Pairs below this are filtered out.
- **Candidate generation:** `POC/src/services/matching/candidate-generator.js` filters by budget, location, timeline, category before scoring.

## Four Models

| Model | Function | Trigger / Data requirement |
|-------|----------|-----------------------------|
| **One-way** | `findOffersForNeed(needPostId)` | Need post (`intent === 'request'`). Returns top Offer posts above threshold. |
| **Two-way barter** | `findBarterMatches(opportunityId)` | Creator of the post must have **both** a Need and an Offer. Finds other creators where Offer_A satisfies Need_B and Offer_B satisfies Need_A. |
| **Consortium** | `findConsortiumCandidates(leadNeedId)` | Lead Need has `attributes.memberRoles` or `partnerRoles`. One best Offer per role (distinct creators). Returns aggregate match with `suggestedPartners`. |
| **Circular** | `findCircularExchanges(options)` | Directed graph: edge creator I → J if some Offer from J satisfies some Need from I. Returns cycles of length ≥ `minCycleLength` (default 3), max depth 6. |

## Data Structures (for Seeder)

### Opportunity

- `id`, `title`, `description`, `creatorId`, `intent` (`'request'` | `'offer'`), `status`, `exchangeMode`, `scope` (`requiredSkills` / `offeredSkills`, `sectors`), `exchangeData` (`budgetRange`, `cashAmount`, or for barter: `barterOffer`, `barterNeed`, `barterValue`), `attributes` (`memberRoles` for consortium, `startDate`, `tenderDeadline`, `applicationDeadline`, `availability`, `locationRequirement`, etc.), `location*`, `modelType`, `subModelType`.

### User

- `id`, `profile` with `type: 'professional'`, `skills`, `specializations`, `sectors`, `location`, `rating` (or completion data for reputation). Optional company reference.

### Company

- Same shape as user with `profile.type: 'company'`, `industry` / `sectors`, `employeeCount`, etc.

### Value equivalence

- `estimateValueSar(opportunity)` and `valueEquivalenceText(oppA, oppB)` in `matching-models.js`; used in two-way barter results. No changes required for simulation.

## Seeded Entities and Model Coverage

When using the simulation seeder (`POC/scripts/simulation/seed-simulation-data.js`):

- **One-way:** Most Need posts and many Offer posts share overlapping skills/categories and compatible budget/location/timeline so that `findOffersForNeed` returns matches.
- **Two-way:** A set of "barter creators" each have one Need and one Offer; pairs are defined so that A_offer satisfies B_need and B_offer satisfies A_need (e.g. Office space ↔ Engineering services).
- **Consortium:** At least one Need has `attributes.memberRoles` (e.g. "Financial partner", "Construction expertise", "Equipment fleet"); separate Offer posts from different creators match each role.
- **Circular:** At least one 3-cycle: Creator A (Need: X, Offer: Y), B (Need: Y, Offer: Z), C (Need: Z, Offer: X) so the directed graph has cycle A→B→C→A.
