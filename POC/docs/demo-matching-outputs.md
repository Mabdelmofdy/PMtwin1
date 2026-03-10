# Demo Matching Outputs — Expected Results by Model

This document describes the **expected system outputs** when the matching engine runs against the [demo-40-opportunities dataset](../data/demo-40-opportunities.json). Use it to validate test flows (see [full-system-workflow-design.md](../../docs/modules/full-system-workflow-design.md) Section 8).

---

## 1. One-Way Matching (Need vs Offer)

**Trigger:** `matchingService.findMatchesForPost('demo-oneway-need-01', {})`  
**Input:** Need post "Structural engineer for shop drawing review" (creator demo-u01, budget 10K SAR, skills: Structural Engineering, Structural Review).

**Expected output shape:**

```json
{
  "model": "one_way",
  "matches": [
    {
      "matchScore": 0.72,
      "breakdown": {
        "attributeOverlap": 0.85,
        "skillMatch": 0.85,
        "exchangeCompatibility": 1,
        "valueCompatibility": 0.8,
        "budgetFit": 0.9,
        "timelineFit": 0.7,
        "locationFit": 1,
        "reputation": 0.5
      },
      "labels": {
        "attributeOverlap": "Partial",
        "budgetFit": "Partial",
        "timelineFit": "Partial",
        "locationFit": "Match",
        "reputation": "Partial"
      },
      "valueAnalysis": {
        "valueFit": "strong",
        "coverageRatio": 1.0,
        "valueGap": 0
      },
      "suggestedPartners": [{ "opportunityId": "demo-oneway-offer-01", "creatorId": "demo-u06" }],
      "matchedOpportunity": {
        "id": "demo-oneway-offer-01",
        "title": "Offer: Structural engineering services",
        "creatorId": "demo-u06",
        "intent": "offer"
      },
      "compositeRank": 0.68,
      "recommendation": {
        "tier": "good",
        "reason": "Good match; review value terms",
        "actionRequired": "Review and negotiate"
      }
    }
  ]
}
```

**Match Score (percentage):** 72%  
**Recommended matches:** At least one (demo-oneway-offer-01) with overlapping skills (Structural Engineering, Structural Review) and budget 8K–12K SAR within need budget 10K.

**Validation:** `matchScore` ≥ 0.50; `breakdown.attributeOverlap` and `breakdown.budgetFit` > 0; top match has `matchedOpportunity.id === 'demo-oneway-offer-01'`.

---

## 2. Two-Way Barter Matching

**Trigger:** `matchingService.findMatchesForPost('demo-barter-na-11', { model: 'two_way' })` or `matchingModels.findBarterMatches('demo-barter-na-11')`  
**Input:** Creator demo-u11 has Need (engineering consulting) and Offer (office space). System finds another creator (demo-u12) with Need (office space) and Offer (engineering consulting).

**Expected output shape:**

```json
{
  "model": "two_way",
  "matches": [
    {
      "matchScore": 0.78,
      "breakdown": {
        "scoreAtoB": 0.82,
        "scoreBtoA": 0.74
      },
      "valueEquivalence": "~1.0 × (Offer: Engineering consulting and design review)",
      "valueAnalysis": {
        "equivalence": {
          "aCoversB": 0.95,
          "bCoversA": 0.9,
          "symmetry": 0.92,
          "equivalenceScore": 0.88
        }
      },
      "suggestedPartners": [
        { "opportunityId": "demo-barter-nb-12", "creatorId": "demo-u12" },
        { "opportunityId": "demo-barter-ob-12", "creatorId": "demo-u12" }
      ],
      "matchedNeed": { "id": "demo-barter-nb-12", "creatorId": "demo-u12", "title": "Need: Office space for 6 months" },
      "matchedOffer": { "id": "demo-barter-ob-12", "creatorId": "demo-u12", "title": "Offer: Engineering consulting and design review" }
    }
  ]
}
```

**Match Score (percentage):** 78%  
**Validation:** Both `scoreAtoB` and `scoreBtoA` ≥ 0.50; `valueAnalysis.equivalence` or `valueEquivalence` present; `matchedNeed` and `matchedOffer` from same creator (demo-u12).

---

## 3. Consortium (Group Formation)

**Trigger:** `matchingService.findMatchesForPost('demo-group-lead-01', { model: 'consortium' })` or `matchingModels.findConsortiumCandidates('demo-group-lead-01')`  
**Input:** Lead Need "Highway project — financial, construction, equipment partners" (creator demo-u21) with `attributes.memberRoles`: Financial partner, Construction partner, Equipment provider.

**Expected output shape:**

```json
{
  "model": "consortium",
  "roles": ["Financial partner", "Construction partner", "Equipment provider"],
  "matches": [
    {
      "matchScore": 0.68,
      "breakdown": {
        "Financial partner": 0.72,
        "Construction partner": 0.70,
        "Equipment provider": 0.62
      },
      "valueAnalysis": {
        "consortiumBalance": {
          "balanceScore": 0.85,
          "viable": true
        }
      },
      "suggestedPartners": [
        { "opportunityId": "demo-group-offer-01", "creatorId": "demo-u23", "role": "Financial partner" },
        { "opportunityId": "demo-group-offer-02", "creatorId": "demo-u24", "role": "Construction partner" },
        { "opportunityId": "demo-group-offer-03", "creatorId": "demo-u25", "role": "Equipment provider" }
      ]
    }
  ]
}
```

**Match Score (percentage):** 68% (aggregate over roles)  
**Consortium groups:** One suggested group with three distinct partners (demo-u23, demo-u24, demo-u25), one per role.  
**Validation:** `roles.length` === 3; each role has one entry in `suggestedPartners`; all `creatorId` values distinct; optional `valueAnalysis.consortiumBalance`.

---

## 4. Circular Exchange

**Trigger:** `matchingModels.findCircularExchanges({})` or `matchingService.findMatchesForPost(anyId, { model: 'circular' })`  
**Input:** All published Need/Offer posts. Dataset includes a cycle: **demo-u31 → demo-u32 → demo-u33 → demo-u31** (u31 needs excavator ← u32 offers; u32 needs accounting ← u33 offers; u33 needs office ← u31 offers).

**Expected output shape:**

```json
{
  "model": "circular",
  "matches": [
    {
      "matchScore": 0.76,
      "cycle": ["demo-u31", "demo-u32", "demo-u33"],
      "linkScores": [
        { "fromCreatorId": "demo-u31", "toCreatorId": "demo-u32", "score": 0.82 },
        { "fromCreatorId": "demo-u32", "toCreatorId": "demo-u33", "score": 0.74 },
        { "fromCreatorId": "demo-u33", "toCreatorId": "demo-u31", "score": 0.72 }
      ],
      "suggestedPartners": [
        { "opportunityId": "demo-circ-o32", "creatorId": "demo-u32" },
        { "opportunityId": "demo-circ-o33", "creatorId": "demo-u33" },
        { "opportunityId": "demo-circ-o31", "creatorId": "demo-u31" }
      ],
      "valueAnalysis": {
        "chainBalance": {
          "uniformity": 0.75,
          "chainBalanceScore": 0.7,
          "viable": true
        }
      }
    }
  ]
}
```

**Match Score (percentage):** 76% (average of link scores)  
**Circular chains:** At least one cycle of length 3: demo-u31 → demo-u32 → demo-u33 → demo-u31.  
**Validation:** `cycle.length` ≥ 3; first and last element of `cycle` equal (chain closes); `linkScores` present; optional `valueAnalysis.chainBalance`.

---

## How to Produce These Outputs

1. **Load the demo dataset** into the POC (e.g. merge `POC/data/demo-40-opportunities.json` into the opportunities store and ensure `POC/data/demo-users.json` users are available for creator resolution if needed).
2. **Run the matching service** in the browser console or via a small script that calls `matchingService.findMatchesForPost(id, options)` and `matchingModels.findCircularExchanges(options)`.
3. **Capture the returned JSON** and compare to the shapes above; scores will vary slightly with config (weights, threshold) and preprocessor/skill canonical data.
4. **Validate** using the criteria in Section 8 of [full-system-workflow-design.md](../../docs/modules/full-system-workflow-design.md).

These example outputs are **design-time expectations**; actual numeric scores may differ when run against the live engine depending on canonical skills and config.
