# QA Smoke — Matching Lifecycle (Manual)

Run against a local POC server (`cd POC && npm start`). Use demo accounts from seed data.

## Prerequisites

- [ ] Storage seeded (fresh load or demo reseed)
- [ ] Logged in as opportunity owner (need side)
- [ ] At least one published opportunity with post-match results

## Invitation flow

1. [ ] Open **Matches** (`/matches`) — page loads without console errors
2. [ ] Open a match detail — invitation actions visible where permitted
3. [ ] **Invite to apply** — invitation created; invitee sees notification
4. [ ] Verify invitation shows **Invitation Sent** (or replacement equivalent)
5. [ ] As invitee, apply or decline — status updates accordingly
6. [ ] (Optional) Wait past `expiresAt` or set short TTL in dev — reload app; invitation becomes **expired**

## Negotiation → deal

1. [ ] From match or application, **Start negotiation**
2. [ ] Submit a proposal / counter-offer — status remains open
3. [ ] **Agree** as first participant — if two parties, status stays open until second agrees
4. [ ] **Agree** as second participant (if applicable) — status **Terms Agreed**
5. [ ] As opportunity owner, **Create deal** from negotiation
6. [ ] Open deal detail and contract page — loads without errors

## Admin / replacement (spot check)

1. [ ] Admin matching command center loads
2. [ ] Replacement queue shows correct status labels (no false “expired” on active items)

## Sign-off

| Tester | Date | Build / commit | Pass |
|--------|------|----------------|------|
|        |      |                |      |
