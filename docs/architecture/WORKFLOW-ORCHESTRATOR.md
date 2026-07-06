# Workflow Orchestrator

Authority: `packages/workflows` (`@pm-twin/workflows`)

## Purpose

The workflow orchestrator is PM-Twin’s **business process layer**. It sits **above** command handlers and **below** UI surfaces. It answers:

- Which workflow transitions are allowed right now
- Which actions are visible or disabled (and why)
- Which commands would execute a chosen action
- Which collaboration/taxonomy rules block publish or deal creation
- What audit/notification metadata should accompany an action

It does **not** mutate state, run matching, or send notifications.

## Ownership boundaries

| Layer | Owns | Does not own |
|-------|------|----------------|
| **`@pm-twin/lifecycle`** | Canonical entity states, terminal checks, FSM transition tables | Business workflows, UI visibility |
| **`@pm-twin/collaboration-models`** | Collaboration taxonomy, sub-model forms, value-exchange field rules | Workflow sequencing |
| **`@pm-twin/workflows`** | Workflow registry, next actions, transition validation, hook metadata | Command execution, persistence |
| **Command handlers** (`web/src/commands/handlers`) | Executing commands, enforcing lifecycle transitions on write | UI visibility, cross-entity business sequencing |
| **UI / `*-ui-actions.ts`** | Rendering, toasts, calling command services after orchestrator approval | Duplicating workflow gate conditions |

## Architecture

```
UI component / page
  → *-ui-actions.ts (thin adapter)
  → workflow-bridge.buildWorkflowContext()
  → @pm-twin/workflows.getWorkflowNextActions / findWorkflowAction / validateWorkflowTransition
  → command service (unchanged)
  → command handler (unchanged)
```

### Web bridge

`web/src/domain/workflows/workflow-bridge.ts` maps domain entities (`Opportunity`, `PostMatch`, etc.) into `WorkflowContext` and re-exports orchestrator APIs.

Always build context through `buildWorkflowContext()` — do not construct raw `WorkflowContext` objects in UI unless testing.

## Public APIs

| API | Use |
|-----|-----|
| `getWorkflowNextActions(context)` | List visible actions for a context |
| `findWorkflowAction(context, key)` | Single action with label, command type, disabled reason |
| `isWorkflowActionAvailable(context, key)` | `true` only when action is visible **and** enabled |
| `validateWorkflowTransition(context, key)` | Pre-flight validation before executing a command |
| `buildWorkflowActionHook({ context, action, ... })` | Audit/notification metadata (no side effects) |

## Workflows

### Marketplace

`Opportunity (draft) → Publish → Matching → PostMatch → Negotiation → Deal → Contract → Completion`

Key actions: `publish_opportunity`, `accept_match`, `decline_match`, `start_negotiation_from_post_match`, `agree_negotiation`, `create_deal_from_negotiation`, `create_contract_from_deal`, `sign_contract`, `complete_contract`

### Hiring

`Application (accepted) → Negotiation → Deal → Contract`

Key actions: `start_negotiation_from_application`, `agree_negotiation`, `create_deal_from_application`, contract actions

Collaboration overlays (`cash_subcontracting`, `service_exchange`, `joint_venture`, `resource_sharing`, `hiring_engagement`) add publish-time taxonomy and exchange validation — they do not replace marketplace/hiring sequencing.

## UI integration pattern

### Correct

```typescript
import { buildWorkflowContext, isWorkflowActionAvailable } from '@/domain/workflows/workflow-bridge.ts'

const context = buildWorkflowContext({ postMatch: match, user: { userId, canMutate: true } })
const canStart = isWorkflowActionAvailable(context, 'start_negotiation_from_post_match')
```

Or delegate to a lib adapter:

```typescript
import { canShowStartNegotiationFromPostMatch } from '@/lib/start-negotiation-ui-actions.ts'
```

### Anti-patterns

Do **not** gate workflow actions in components/pages with raw status checks:

```typescript
// ❌ Do not do this in components or pages
if (negotiation.status === 'agreed') { ... }
if (application.status === 'accepted') { ... }
if (deal.status === 'draft') { ... }
```

Display copy that mentions status labels is fine; **enabling buttons** must go through the orchestrator.

Governance tests: `web/src/domain/workflows/workflow-ui-governance.test.ts`

## Audit / notification hooks

`WorkflowActionHook` is pure metadata:

```typescript
type WorkflowActionHook = {
  actionKey: WorkflowActionKey
  commandType: string
  entityType: WorkflowEntityKind
  entityId: string
  workflowKey: WorkflowKey
  beforeState?: string
  afterState?: string
  actorId?: string | null
  auditAction: string
  notificationType?: string
}
```

Command services or UI actions should call `buildWorkflowActionHook()` **before or after** a successful command and pass the result to audit/notification subsystems. The orchestrator never emits events itself.

## `activate_contract` decision

**Removed from the orchestrator action registry.** The lifecycle path is `draft → pending_signature → active` when parties sign via `SignContract`; the command handler auto-activates once all signatures are collected. `ActivateContract` remains available in the command gateway for tests and programmatic use, but there is no separate UI/orchestrator action.

## Examples

### Marketplace — start negotiation from confirmed match

```typescript
const context = buildWorkflowContext({
  postMatch: confirmedMatch,
  user: { userId: 'user-a', canMutate: true, isParticipant: true },
  linkage: { negotiationsForPostMatch: [] },
})
const action = findWorkflowAction(context, 'start_negotiation_from_post_match')
if (action?.enabled) {
  await negotiationCommandService.startNegotiationFromPostMatch(match.id)
}
```

### Hiring — create deal after agreed negotiation

```typescript
const context = buildWorkflowContext({
  primaryWorkflow: 'hiring',
  application: acceptedApplication,
  linkage: {
    legacyApplicationsEnabled: true,
    negotiationsForApplication: [{ id: 'neg-1', status: 'agreed', applicationId: 'app-1' }],
  },
  user: { userId: 'owner', canMutate: true },
})
assert.equal(isWorkflowActionAvailable(context, 'create_deal_from_application'), true)
```

## Testing

| Location | Coverage |
|----------|----------|
| `packages/workflows/tests/workflows.test.js` | Registry, transitions, collaboration guards, hooks |
| `web/src/domain/workflows/workflow-bridge.test.ts` | Bridge delegation, full paths |
| `web/src/domain/workflows/workflow-ui-governance.test.ts` | No duplicated gates in UI surfaces |
| `web/src/domain/workflows/workflows-package-imports.test.ts` | Package export stability |

## Remaining gaps

- Notification delivery is not wired — only metadata is produced
- `ActivateContract` is not an orchestrator action (signing auto-activates); command remains for tests/programmatic use
- Negotiation counter/propose transitions remain lifecycle FSM helpers (`negotiation-ui-actions.ts`)
- `showLegacyApplications` product flag still gates hiring workflow visibility in production
