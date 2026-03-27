# PMTwin system flow

### What this page is

One diagram that shows the **full lifecycle**: signup, publish, matching, deal, contract, delivery, plus where **admin** fits in.

### Why it matters

Use it in decks and training when someone asks “how does everything connect?”

### What you can do here

- Trace your role (user vs admin) on the chart.
- See automatic steps after **Publish**.

### Step-by-step actions

1. Start at **Register** on the left.
2. Follow the arrows through **Publish** and **Matches**.
3. Continue through **Deal** and **Contract** to **Execution**.
4. Look at **Admin** loops for vetting and moderation.

### What happens next

Pair this with [full-user-journey.md](../full-user-journey.md) for written steps and status names.

### Tips

- “Auto” steps run in the browser app when you publish—there is no separate batch server in the POC.

---

```mermaid
flowchart TB
  register[Register account] --> vetting[Admin vetting decision]
  vetting -->|Approved| login[Login]
  vetting -->|Rejected or clarification| onboardingEnd[Onboarding on hold]
  login --> profile[Complete profile]
  profile --> createOpp[Create opportunity draft]
  createOpp --> editOpp[Edit opportunity]
  editOpp --> publishOpp[Publish opportunity]

  publishOpp -->|Auto| runMatch[Run matching]
  runMatch --> createPostMatch[Create matches]
  createPostMatch --> notifyMatch[Notify participants]
  notifyMatch --> viewMatches[View matches]

  viewMatches --> decision{Accept or decline}
  decision -->|Decline| matchDeclined[Match declined]
  decision -->|All accept| matchConfirmed[Match confirmed]

  matchConfirmed --> createDeal[Create deal]
  createDeal --> negotiateDeal[Deal negotiation]
  negotiateDeal --> signingDeal[Deal signing stage]
  signingDeal --> createContract[Create contract]
  createContract --> contractPending[Contract pending signatures]
  contractPending --> allSigned{All parties signed?}
  allSigned -->|Yes| contractActive[Contract active]
  allSigned -->|No| waitSignature[Wait for signatures]
  waitSignature --> allSigned

  contractActive --> execution[Execution and milestones]
  execution --> delivery[Delivery]
  delivery --> completion[Complete deal]
  completion --> closeOut[Close deal and opportunity]
  closeOut --> review[Post-delivery review]

  adminLoop[Admin governance] --> vetting
  adminLoop --> moderateOpp[Opportunity moderation]
  adminLoop --> adminMatching[Admin matching preview]
  adminLoop --> reports[Reports and audit]
  moderateOpp --> publishOpp
  adminMatching --> runMatch
  reports --> adminLoop
```

### Notes

- ✅ Matching tied to **publish** is implemented for persistence.
- ⚠️ Admin matching is often **preview**; it may not persist matches the same way as publish.
- ❌ Central orchestration and scheduled jobs are not in the POC.

### What happens next

Read [matching-flow.md](matching-flow.md) for a closer view of matching only, or [deal-contract-flow.md](deal-contract-flow.md) for deal ↔ contract.
