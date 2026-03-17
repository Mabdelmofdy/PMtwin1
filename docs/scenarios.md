# Scenarios

Real-world style scenarios: successful matches, failed matches, barter, consortium, circular, and edge cases. Based on implemented behavior; marked when a scenario hits a gap.

---

## One-Way (Need ↔ Offer)

### 1. Successful one-way match (need finds offer)

- **Setup:** Company A publishes a **need**: “Structural engineer for shop drawing review,” intent request, skills [Structural Engineering, Shop Drawings], budget 10–15k SAR, status published.
- **System:** persistPostMatches runs; findOffersForNeed returns Professional B’s **offer** “Structural engineering and shop drawing review,” score 0.88 (skills, budget, timeline match).
- **Result:** One post_match created, type one_way, participants [A need_owner, B offer_provider]; both get notifications.
- **Outcome:** Both accept → status confirmed; they can proceed to deal.

### 2. Successful one-way match (offer finds needs)

- **Setup:** Professional C publishes an **offer**: “BIM modeling services,” intent offer, status published.
- **System:** findNeedsForOffer runs; Company D’s **need** “BIM modeling for MEP” scores 0.82.
- **Result:** post_match one_way, direction offer_to_needs; C and D notified.
- **Outcome:** Both accept; deal can be created.

### 3. No match (score below threshold)

- **Setup:** Need: “Specialized bridge design,” remote only, 50k SAR. Offer: “General civil design,” on-site, 20k SAR.
- **System:** Candidate generator may keep it; scorePair returns 0.42 (skill overlap partial, budget/location mismatch).
- **Result:** Score < POST_TO_POST_THRESHOLD (0.50); no post_match created.
- **Outcome:** No match; need and offer remain unmatched.

### 4. Match found but one party declines

- **Setup:** post_match one_way created; need_owner A and offer_provider B notified.
- **Action:** B opens match detail, clicks Decline.
- **Result:** updatePostMatchStatus(matchId, B, 'declined'); post_match status → declined; A’s participantStatus unchanged.
- **Outcome:** Match is dead; no deal.

### 5. One-way with value compatibility

- **Setup:** Need has budget 10–12k; offer has budget 9–14k. valueCompatibility.oneWayValueFit returns good fit.
- **Result:** post_match includes valueAnalysis; rankMatches sets tier “top” if matchScore >= 0.85 and valueFit strong.
- **Outcome:** High-quality recommendation; “Ready to contract” in UI.

### 6. Multiple offers for same need (top N)

- **Setup:** One need; 50 published offers pass candidate filter. Scores: 0.91, 0.88, 0.85, …, 0.52.
- **System:** findOffersForNeed returns top 20 (topN default); each above 0.50 gets a post_match.
- **Result:** Up to 20 post_matches for same need (one per offer); need_owner gets 20 notifications (or one “You have 20 new matches” if aggregated).
- **Outcome:** Need owner sees ranked list; can accept one (others stay pending or decline).

### 7. Re-publish same need (duplicate risk)

- **Setup:** Need was published yesterday; 3 post_matches created. Owner edits title only and “re-publishes” (status already published; updateOpportunity with status published again).
- **System:** persistPostMatches runs again; createPostMatch uses _postMatchSignature; same (type, participants, payload) → duplicate returns null.
- **Result:** If payload/participants identical, no new duplicates. If something changed (e.g. opportunityId in payload), new post_match possible.
- **Outcome:** Possible duplicate if signature differs; dedupe is best-effort.

### 8. Need and offer same creator (excluded)

- **Setup:** User has one need and one offer; by mistake both describe same service. findOffersForNeed loads offers; candidate generator or scoring excludes same creator.
- **Result:** In one-way, offers are from “other” creators; same-creator offer is not matched to own need.
- **Outcome:** No self-match.

---

## Two-Way (Barter)

### 9. Successful barter match

- **Setup:** User U1 has need N1 “Office space in Riyadh” and offer O1 “Engineering consulting.” User U2 has need N2 “Engineering consulting” and offer O2 “Office space in Riyadh.”
- **System:** findBarterMatches(U1’s opportunity id): score O1→N2 >= 0.50, O2→N1 >= 0.50; pair score 0.92; valueEquivalence “~1.1 × (Office space ↔ Engineering).”
- **Result:** One post_match two_way; participants U1 (need_owner N1, offer_provider O1), U2 (need_owner N2, offer_provider O2); both notified.
- **Outcome:** Both accept → confirmed; deal can be barter (exchangeMode barter).

### 10. Barter: one side has no offer

- **Setup:** U1 has need + offer; U2 has only a need (no published offer).
- **System:** findBarterMatches only considers “other” creators who have **both** need and offer. U2 excluded.
- **Result:** No barter match for U2.
- **Outcome:** U2 must create an offer to participate in barter.

### 11. Barter: scores asymmetric

- **Setup:** O1→N2 = 0.88, N1←O2 = 0.51. Both above threshold.
- **Result:** Pair score (0.88+0.51)/2 = 0.695; post_match created.
- **Outcome:** Match created; one direction stronger than the other.

### 12. Barter: one direction below threshold

- **Setup:** O1→N2 = 0.90, N1←O2 = 0.45.
- **System:** 0.45 < 0.50; pair not added (both directions must be >= threshold).
- **Result:** No post_match.
- **Outcome:** No barter match.

---

## Consortium

### 13. Successful consortium match

- **Setup:** Company Lead publishes need “Solar plant EPC — need equity, EPC, and O&M partners,” memberRoles [Investor, EPC Contractor, O&M Provider], status published.
- **System:** findConsortiumCandidates: for each role, best offer from different creators; 3 partners found; aggregate score 0.85.
- **Result:** One post_match consortium; participants [lead consortium_lead, P1/P2/P3 consortium_member]; payload roles [{ role: Investor, opportunityId, userId }, …].
- **Outcome:** All four accept → confirmed; deal created with roleSlots; execution as consortium.

### 14. Consortium: not enough roles

- **Setup:** Lead need has memberRoles [Role1, Role2]; only one matching offer (for Role1) found; Role2 has no candidate above threshold.
- **System:** findConsortiumCandidates still returns one “match” with one role filled; aggregate score based on filled roles only.
- **Result:** post_match with 1 consortium_member (or 2 if two roles filled). Lead may need to re-run or wait for more offers.
- **Outcome:** Partial consortium; lead can accept and later use replacement for missing role.

### 15. Consortium: same creator in two roles (avoided)

- **Setup:** Lead need has Role1, Role2. Candidate generator returns many offers; usedCreatorIds ensures one offer per creator per consortium match.
- **Result:** Each role filled by a different creator.
- **Outcome:** No double-counting one party.

### 16. Consortium replacement (dropped member)

- **Setup:** Deal is consortium, status execution; Member P2 (role “EPC Contractor”) drops. Admin or lead opens replacement flow.
- **System:** findReplacementCandidatesForRole(leadNeedId, 'EPC Contractor', { excludeUserIds: [lead, P1, P3] }) returns top 5 candidates.
- **Result:** New replacement post_match (isReplacement: true, replacementDealId); chosen candidate accepts; deal participants/roleSlots updated.
- **Outcome:** Deal continues with new EPC Contractor. (Replacement allowed only in CONSORTIUM_REPLACEMENT_ALLOWED_STAGES.)

### 17. Consortium: lead need has no memberRoles

- **Setup:** Opportunity intent request, subModelType consortium, but attributes.memberRoles = [].
- **System:** findConsortiumCandidates falls back to findOffersForNeed with role 'General'; one “consortium” match with single general partner.
- **Result:** post_match consortium with one member; roles: ['General'].
- **Outcome:** Degenerate consortium; still valid.

---

## Circular

### 18. Successful circular chain (3 parties)

- **Setup:** A need satisfied by B’s offer; B need by C’s offer; C need by A’s offer. All published.
- **System:** findCircularExchanges builds graph; finds cycle A→B→C→A; cycle score = average edge score 0.87.
- **Result:** When A (or B or C) publishes, persistPostMatches runs circular; cycle including that creator is persisted. One post_match circular; participants A, B, C (chain_participant); payload cycle, links.
- **Outcome:** All three notified; if all accept, multi-party deal possible.

### 19. Circular: 4-party cycle

- **Setup:** A→B→C→D→A. minCycleLength 3; cycle length 4 found.
- **Result:** post_match circular with 4 participants; linkScores for each edge.
- **Outcome:** Four-party circular exchange.

### 20. Circular: cycle not including publisher

- **Setup:** Cycles A→B→C→A and D→E→F→D exist. User A publishes.
- **System:** persistPostMatches runs findCircularExchanges; filters to cycles where cycle.includes(A).
- **Result:** Only A→B→C→A persisted; D→E→F→D not stored (D did not publish in this run).
- **Outcome:** When D publishes, D’s cycle will be persisted.

### 21. Circular: no cycle

- **Setup:** Needs and offers form a DAG (no cycle). E.g. A→B, B→C, C→D, no D→A.
- **System:** findCircularExchanges returns empty matches.
- **Result:** No circular post_match.
- **Outcome:** Only one-way or barter matches possible.

---

## Deals & Contracts

### 22. Deal created from confirmed one-way match

- **Setup:** post_match one_way confirmed. User clicks “Start deal” on match detail.
- **Action:** createDeal({ participants from match, opportunityIds [needId, offerId], matchType: 'one_way', status: 'negotiating', title, scope, valueTerms }).
- **Result:** New deal; redirect to deal detail.
- **Outcome:** Negotiation and milestones follow. (If “Start deal” not wired, this is a gap.)

### 23. Deal from accepted application

- **Setup:** Application accepted for opportunity O; creator and applicant agree to proceed.
- **Action:** createDeal({ applicationId, opportunityId: O.id, participants [creator, applicant], status: 'draft' }).
- **Result:** Deal linked to application; no post_match.
- **Outcome:** Same deal lifecycle (milestones, contract, etc.).

### 24. Contract created at signing

- **Setup:** Deal status → signing. User triggers “Create contract.”
- **Action:** createContract({ dealId, parties from deal, scope, paymentMode, agreedValue, milestonesSnapshot: deal.milestones }); updateDeal(dealId, { contractId }).
- **Result:** Contract pending; deal has contractId.
- **Outcome:** Parties sign; when all signed, contract → active, deal → active.

### 25. Milestone submit and approve

- **Setup:** Deal in execution; Contractor submits milestone M1 (deliverables, link).
- **Action:** updateDealMilestone(dealId, M1.id, { status: 'submitted', submittedAt }).
- **Result:** Creator sees “Pending approval”; approves via updateDealMilestone(dealId, M1.id, { status: 'approved', approvedAt, approvedBy }).
- **Outcome:** Milestone closed; next milestone can start.

### 26. Deal completed then closed

- **Setup:** All milestones approved; delivery done.
- **Action:** updateDeal(dealId, { status: 'completed' }); later updateDeal(dealId, { status: 'closed', closedAt }).
- **Result:** Deal and contract (if any) in terminal state.
- **Outcome:** Deal rate / review can be left.

---

## Admin & System

### 27. Admin approves pending user

- **Setup:** New user registered; status pending. Admin opens vetting or user list.
- **Action:** updateUser(id, { status: 'active' }); createNotification(userId, type: 'account_approved', …).
- **Result:** User can use full platform; notification in list.
- **Outcome:** Normal onboarding.

### 28. Admin runs matching (no persist)

- **Setup:** Admin opens Admin → Matching; selects published opportunity O; clicks “Run matching.”
- **Action:** findMatchesForPost(O.id, {}) returns { model, matches } in memory; UI displays results.
- **Result:** No createPostMatch called; no new notifications.
- **Outcome:** Admin sees what would match; actual matches only when O was (or is) published. (Persist button would close gap.)

### 29. Publish triggers matching and notify

- **Setup:** Opportunity O (need) saved as draft; user clicks Publish.
- **Action:** updateOpportunity(O.id, { status: 'published' }); inside update, persistPostMatches(O.id) runs; 2 offers found; 2 post_matches created; notifyPostMatch x2.
- **Result:** 2 notifications to 2 offer providers; need owner sees 2 matches.
- **Outcome:** Full flow as designed.

### 30. Seed version change clears data

- **Setup:** CURRENT_SEED_VERSION in data-service bumped (e.g. 1.21.0 → 1.22.0). User reloads app.
- **Action:** initializeFromJSON sees storedVersion !== CURRENT_SEED_VERSION; clearAllData(); load from JSON; mergeDemoData(); migrations; set storedVersion.
- **Result:** All localStorage cleared; fresh seed + demo.
- **Outcome:** User loses any data entered since last version; expected in POC.

---

## Failures & Edge Cases

### 31. Login with wrong password

- **Action:** login(email, wrongPassword); password check fails.
- **Result:** No session; error shown.
- **Outcome:** User retries or uses forgot password (which does not send real email — gap).

### 32. Apply to own opportunity

- **Setup:** User A creates and publishes opportunity O. A clicks Apply on O.
- **Action:** createApplication({ opportunityId: O.id, applicantId: A.id, … }). No guard in POC.
- **Result:** Application created; creator could “accept” own application (weird but possible).
- **Outcome:** Business rule “cannot apply to own” may need to be enforced in UI or data layer.

### 33. Accept match already declined

- **Setup:** post_match status already declined (one party declined).
- **Action:** updatePostMatchStatus(matchId, userId, 'accepted'). Backend updates participant; status may stay declined because anyDeclined.
- **Result:** Match remains declined.
- **Outcome:** No resurrection of declined match.

### 34. Create deal without confirmed match

- **Setup:** User tries to create deal from match detail for a pending (not confirmed) match.
- **Action:** If UI allows, createDeal runs with same participants; deal created. No strict enforcement that deal requires confirmed match.
- **Outcome:** Possible; business rule “deal only from confirmed match” may be UI-only.

### 35. Delete opportunity with matches and deals

- **Setup:** Opportunity O has 2 post_matches and 1 deal referencing O.
- **Action:** deleteOpportunity(O.id); only O removed from storage.
- **Result:** post_matches and deal still reference O.id; getOpportunityById(O.id) returns null; UI may show “Opportunity not found” on detail.
- **Outcome:** Orphaned references; no cascade delete (gap).

### 36. Two companies same email

- **Setup:** Company1 and User (or Company2) share email “same@test.com”. Login(same@test.com, pwd).
- **Action:** getUserOrCompanyByEmail returns first match (users vs companies order in code).
- **Result:** One of them logs in; the other cannot with same email.
- **Outcome:** Ambiguity; production should enforce unique email across entities or separate by type.

### 37. Expired post_match still shown

- **Setup:** post_match has expiresAt in the past; no job has set status to expired.
- **Action:** getPostMatchesForUser returns it; status still “pending.”
- **Result:** User sees expired match as pending.
- **Outcome:** Gap: expiry not enforced.

### 38. Consortium deal: replacement over MAX_REPLACEMENT_ATTEMPTS

- **Setup:** Deal already had 5 replacement attempts (MAX_REPLACEMENT_ATTEMPTS = 5).
- **Action:** findReplacementCandidatesForRole still works; UI or business logic should block “Replace” button or createPostMatch for replacement.
- **Result:** If not blocked, 6th replacement could be created (implementation-dependent).
- **Outcome:** Config intent is to cap; enforcement may be partial.

### 39. Hybrid opportunity (request + offer)

- **Setup:** Opportunity intent hybrid; accept barter.
- **System:** findMatchesForPost runs findOffersForNeed and findBarterMatches; combined and ranked.
- **Result:** User gets both one-way and two-way style matches in one list (byModel.one_way, byModel.two_way).
- **Outcome:** Broader discovery.

### 40. No published offers (empty candidate set)

- **Setup:** Need published; zero offers with intent 'offer' and status published (or all filtered out by candidate generator).
- **System:** findOffersForNeed returns { model: 'one_way', matches: [] }; persistPostMatches creates no post_match.
- **Result:** Need owner gets no matches; no notifications.
- **Outcome:** Expected; need more offers in the system.

---

## Related Documentation

- [Matching Workflow](workflow/matching-workflow.md)
- [Deal Workflow](workflow/deal-workflow.md)
- [Gaps and Missing](gaps-and-missing.md)
- [Implementation Status](implementation-status.md)
