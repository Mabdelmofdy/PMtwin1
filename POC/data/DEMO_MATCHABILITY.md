# Demo 40 opportunities — matchability (need–offer pairs)

### What this page is

Seed-data note: which **demo** needs and offers should pair well for testing matching.

### What happens next

Update when you change `demo-*` opportunity JSON.

---

This document lists example **need–offer** pairs that the matching engine should score highly. Skills and sectors use canonical values so that needs and offers align.

## One-Way Cash

| Need (request) | Offer (offer) | Matching skills / sector |
|----------------|--------------|---------------------------|
| demo-oneway-need-01: Structural engineer for shop drawing review | demo-oneway-offer-01: Structural engineering services | Structural Engineering, Structural Review; Construction |
| demo-oneway-need-02: Project management for 6-month construction project | demo-oneway-offer-02: Project management and PMO | Project Management, PMP; Construction |
| demo-oneway-need-03: MEP design for commercial building | demo-oneway-offer-03: MEP design and BIM | MEP Design, HVAC Design, Electrical Systems; Energy |
| demo-oneway-need-04: Quantity surveyor for tender preparation | demo-oneway-offer-04: Quantity surveying and BOQ | Cost Estimation, Bill of Quantities, Tendering; Construction |
| demo-oneway-need-05: Heavy equipment for earthworks | demo-oneway-offer-05: Heavy equipment rental | Heavy Equipment, Equipment Supply; Construction |

## Group Formation (Consortium)

| Need (consortium lead) | Offers (partners) | Role / skills |
|------------------------|-------------------|----------------|
| demo-group-lead-01: Highway project — financial, construction, equipment partners | demo-group-offer-01 (financial), demo-group-offer-02 (civil/construction), demo-group-offer-03 (heavy equipment) | Financial partner; Construction partner; Equipment provider |
| demo-group-lead-02: Mixed-use development — design, MEP, PM | demo-group-offer-04 (architectural/BIM), demo-group-offer-05 (MEP), demo-group-offer-06 (PM) | Design lead; MEP contractor; Project manager |

## Barter (Two-Way)

| Need | Offer (same or other user) | Exchange |
|------|----------------------------|----------|
| demo-barter-na-11: Engineering consulting | demo-barter-oa-11: Office space in Riyadh | Barter: consulting ↔ space |
| demo-barter-nb-12: Office space for 6 months | demo-barter-ob-12: Engineering consulting and design review | Barter: space ↔ consulting |
| demo-barter-nd-14: Construction materials | demo-barter-od-14: Accounting and financial reporting | Barter: materials ↔ accounting |
| demo-barter-ne-15: Legal consulting for contract review | demo-barter-oe-15: Architectural design services | Barter: legal ↔ design |

## Circular Exchange

Chains (e.g. A→B→C→A) can be formed from circular needs/offers (demo-circ-n31/o31, demo-circ-n32/o32, demo-circ-n33/o33, demo-circ-n34/o34, demo-circ-n35/o35) where skills and sectors align (e.g. Office Space, Heavy Equipment, Accounting, Design Review).

---

All opportunities use normalized `scope.requiredSkills` / `scope.offeredSkills` and `scope.sectors` so that the matching engine can produce realistic matches without creating matches, deals, or contracts in the dataset.
