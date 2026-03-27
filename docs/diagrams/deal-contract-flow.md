# PMTwin deal and contract flow

### What this page is

Diagrams for **deal stages**, **contract stages**, how they link, and the **milestone** loop during execution.

### Why it matters

Legal and delivery teams use this to see where signing sits relative to running work.

### What you can do here

- Compare deal states vs contract states.
- Walk the linkage from **confirmed match** to **closed deal**.

### Step-by-step actions

1. Read **Deal lifecycle** (states).
2. Read **Contract lifecycle** (states).
3. Follow **Deal → contract → execution** linkage.
4. Skim **Milestone sub-flow** for day-to-day delivery.

### What happens next

Open [workflow/deal-workflow.md](../workflow/deal-workflow.md) and [workflow/contract-workflow.md](../workflow/contract-workflow.md) for narrative detail.

### Tips

Signing happens in the **deal signing** stage; the contract stays **pending** until signatures are complete.

---

## Deal lifecycle

```mermaid
stateDiagram-v2
  [*] --> negotiating
  negotiating --> draft
  draft --> review
  review --> signing
  signing --> active
  active --> execution
  execution --> delivery
  delivery --> completed
  completed --> closed
```

---

## Contract lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> active
  active --> completed
  active --> terminated
```

---

## Deal to contract to execution

```mermaid
flowchart LR
  confirmedMatch[Confirmed match] --> createDeal[Create deal]
  createDeal --> negotiation[Negotiation]
  negotiation --> signing[Deal signing]
  signing --> createContract[Create contract]
  createContract --> contractPending[Contract pending]
  contractPending --> allSigned{All parties signed?}
  allSigned -->|Yes| contractActive[Contract active]
  allSigned -->|No| waitSign[Wait for signatures]
  waitSign --> allSigned
  contractActive --> dealExecution[Deal execution]
  dealExecution --> delivery[Delivery]
  delivery --> dealCompleted[Deal completed]
  dealCompleted --> dealClosed[Deal closed]
```

---

## Milestone sub-flow

```mermaid
flowchart TB
  addMilestone[Add milestone] --> milestonePending[Milestone pending]
  milestonePending --> inProgress[In progress]
  inProgress --> submitted[Submitted]
  submitted --> reviewDecision{Approve or reject}
  reviewDecision -->|Approve| approved[Approved]
  reviewDecision -->|Reject| rejected[Rejected]
  rejected --> inProgress
  approved --> nextMilestone{More milestones?}
  nextMilestone -->|Yes| milestonePending
  nextMilestone -->|No| deliveryDone[Delivery complete]
```

---

## Implementation notes

- ✅ Deal and contract records and statuses exist in the product.
- ⚠️ “All signed → contract active” can depend on which screen path you use—verify in UI.
- ❌ Full digital signature provider and server-side legal workflow are **not** in the POC.

### What happens next

Track operational gaps in [implementation-status.md](../implementation-status.md).
