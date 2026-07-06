import type {
  WorkflowAction,
  WorkflowActionKey,
  WorkflowContext,
  WorkflowEntityKind,
  WorkflowKey,
} from '../types.ts'
import { getActionDefinition } from '../actions/action-registry.ts'
import { canonicalEntityStatus } from '../lifecycle-helpers.ts'
import { resolveWorkflowKeys } from '../engine/resolve-workflow.ts'

export type WorkflowActionHook = {
  readonly actionKey: WorkflowActionKey
  readonly commandType: string
  readonly entityType: WorkflowEntityKind
  readonly entityId: string
  readonly workflowKey: WorkflowKey
  readonly beforeState?: string
  readonly afterState?: string
  readonly actorId?: string | null
  readonly auditAction: string
  readonly notificationType?: string
}

const LIFECYCLE_ENTITY_BY_KIND: Record<WorkflowEntityKind, string> = {
  opportunity: 'opportunity',
  application: 'application',
  post_match: 'match',
  negotiation: 'negotiation',
  deal: 'deal',
  contract: 'contract',
}

const ENTITY_KIND_BY_ACTION: Record<WorkflowActionKey, WorkflowEntityKind> = {
  publish_opportunity: 'opportunity',
  accept_match: 'post_match',
  decline_match: 'post_match',
  start_negotiation_from_post_match: 'post_match',
  start_negotiation_from_application: 'application',
  agree_negotiation: 'negotiation',
  cancel_negotiation: 'negotiation',
  create_deal_from_post_match: 'post_match',
  create_deal_from_application: 'application',
  create_deal_from_negotiation: 'negotiation',
  create_contract_from_deal: 'deal',
  sign_contract: 'contract',
  complete_contract: 'contract',
}

const AUDIT_ACTION_BY_KEY: Record<WorkflowActionKey, string> = {
  publish_opportunity: 'opportunity.published',
  accept_match: 'match.accepted',
  decline_match: 'match.declined',
  start_negotiation_from_post_match: 'negotiation.started_from_match',
  start_negotiation_from_application: 'negotiation.started_from_application',
  agree_negotiation: 'negotiation.agreed',
  cancel_negotiation: 'negotiation.cancelled',
  create_deal_from_post_match: 'deal.created_from_match',
  create_deal_from_application: 'deal.created_from_application',
  create_deal_from_negotiation: 'deal.created_from_negotiation',
  create_contract_from_deal: 'contract.created',
  sign_contract: 'contract.signed',
  complete_contract: 'contract.completed',
}

const NOTIFICATION_TYPE_BY_KEY: Partial<Record<WorkflowActionKey, string>> = {
  publish_opportunity: 'opportunity.published',
  accept_match: 'match.response',
  decline_match: 'match.response',
  start_negotiation_from_post_match: 'negotiation.started',
  start_negotiation_from_application: 'hiring.negotiation.started',
  agree_negotiation: 'negotiation.agreed',
  create_deal_from_negotiation: 'deal.created',
  create_deal_from_application: 'deal.created',
  create_contract_from_deal: 'contract.created',
  sign_contract: 'contract.signature_required',
  complete_contract: 'contract.completed',
}

function resolveEntitySnapshot(
  context: WorkflowContext,
  actionKey: WorkflowActionKey,
) {
  switch (ENTITY_KIND_BY_ACTION[actionKey]) {
    case 'opportunity':
      return context.opportunity
    case 'application':
      return context.application
    case 'post_match':
      return context.postMatch
    case 'negotiation':
      return context.negotiation
    case 'deal':
      return context.deal
    case 'contract':
      return context.contract
    default:
      return undefined
  }
}

export type BuildWorkflowActionHookInput = {
  readonly context: WorkflowContext
  readonly action: WorkflowAction
  readonly afterState?: string
  readonly actorId?: string | null
}

/** Pure metadata for audit/notification consumers — no side effects. */
export function buildWorkflowActionHook(
  input: BuildWorkflowActionHookInput,
): WorkflowActionHook {
  const { context, action, afterState, actorId } = input
  const { primary } = resolveWorkflowKeys(context)
  const entityKind = ENTITY_KIND_BY_ACTION[action.key]
  const entity = resolveEntitySnapshot(context, action.key)
  const entityId = action.aggregateId ?? entity?.id ?? ''
  const definition = getActionDefinition(action.key)
  const beforeState = entity?.status
    ? canonicalEntityStatus(LIFECYCLE_ENTITY_BY_KIND[entityKind], entity.status)
    : entity?.status

  return {
    actionKey: action.key,
    commandType: definition.commandType,
    entityType: entityKind,
    entityId,
    workflowKey: action.workflowKey ?? primary,
    beforeState,
    afterState,
    actorId: actorId ?? context.user.userId ?? null,
    auditAction: AUDIT_ACTION_BY_KEY[action.key],
    notificationType: NOTIFICATION_TYPE_BY_KEY[action.key],
  }
}

export function buildWorkflowActionHooks(
  context: WorkflowContext,
  actions: readonly WorkflowAction[],
  options?: { readonly actorId?: string | null },
): readonly WorkflowActionHook[] {
  return actions.map((action) =>
    buildWorkflowActionHook({
      context,
      action,
      actorId: options?.actorId,
    }),
  )
}
