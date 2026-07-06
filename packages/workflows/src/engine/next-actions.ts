import type {
  WorkflowAction,
  WorkflowActionKey,
  WorkflowContext,
} from '../types.ts'
import { getActionDefinition } from '../actions/action-registry.ts'
import { getWorkflowDefinition } from '../registry/index.ts'
import {
  canonicalEntityStatus,
  findParticipant,
  isEntityTerminal,
  isParticipantPending,
} from '../lifecycle-helpers.ts'
import {
  findAgreedApplicationNegotiation,
  hasActiveContractForDeal,
  hasBlockingApplicationNegotiation,
  hasBlockingPostMatchNegotiation,
  resolveWorkflowKeys,
} from './resolve-workflow.ts'
import { validateCollaborationPublishRequirements } from './collaboration-guards.ts'

const MATCH_ENTITY = 'match'
const APPLICATION_ENTITY = 'application'
const NEGOTIATION_ENTITY = 'negotiation'
const DEAL_ENTITY = 'deal'
const CONTRACT_ENTITY = 'contract'
const OPPORTUNITY_ENTITY = 'opportunity'

const DEAL_STATUSES_ALLOWING_CONTRACT = new Set(['draft', 'review', 'signing'])

type ActionEvaluator = (context: WorkflowContext) => WorkflowAction

function userCanMutate(context: WorkflowContext): boolean {
  if (context.user.canMutate === false) return false
  if (context.user.canMutate === true) return true
  return Boolean(context.user.userId)
}

function userHasPermission(
  context: WorkflowContext,
  permission?: string,
): boolean {
  if (!permission) return true
  return context.user.permissions?.includes(permission) ?? true
}

function buildAction(
  context: WorkflowContext,
  key: WorkflowActionKey,
  options: {
    visible: boolean
    enabled: boolean
    visibilityReason: string
    disabledReason?: string
    aggregateId?: string
    workflowKey?: WorkflowContext['primaryWorkflow']
    metadata?: Readonly<Record<string, unknown>>
  },
): WorkflowAction {
  const definition = getActionDefinition(key)
  const { primary } = resolveWorkflowKeys(context)

  return {
    key,
    label: definition.label,
    commandType: definition.commandType,
    visible: options.visible,
    enabled: options.enabled,
    visibilityReason: options.visibilityReason,
    disabledReason: options.disabledReason,
    requiredRole: definition.requiredRole,
    requiredPermission: definition.requiredPermission,
    workflowKey: options.workflowKey ?? primary,
    aggregateId: options.aggregateId,
    metadata: options.metadata,
  }
}

function evaluatePublishOpportunity(context: WorkflowContext): WorkflowAction {
  const opportunity = context.opportunity
  const status = canonicalEntityStatus(OPPORTUNITY_ENTITY, opportunity?.status)
  const visible = Boolean(opportunity?.id && status === 'draft')
  const publishValidation = validateCollaborationPublishRequirements(
    context.collaboration,
  )
  const enabled =
    visible
    && userCanMutate(context)
    && context.user.isOpportunityOwner
    && publishValidation.valid

  return buildAction(context, 'publish_opportunity', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Opportunity is in draft and can be published'
      : 'Publish is only available for draft opportunities',
    disabledReason: !userCanMutate(context)
      ? 'You do not have permission to publish this opportunity'
      : !context.user.isOpportunityOwner
        ? 'Only the opportunity owner can publish'
        : !publishValidation.valid
          ? publishValidation.errors.join('. ')
          : undefined,
    aggregateId: opportunity?.id,
  })
}

function evaluateAcceptMatch(context: WorkflowContext): WorkflowAction {
  const match = context.postMatch
  const userId = context.user.userId
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status)
  const participant = findParticipant(match?.participants, userId)
  const visible =
    Boolean(match?.id)
    && !isEntityTerminal(MATCH_ENTITY, match?.status)
    && Boolean(participant)
    && isParticipantPending(participant)
  const enabled = visible && userCanMutate(context) && !['confirmed', 'declined', 'expired', 'superseded'].includes(status)

  return buildAction(context, 'accept_match', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Participant can respond to this match'
      : 'Accept is only available for pending participant responses',
    aggregateId: match?.id,
    metadata: userId ? { userId } : undefined,
  })
}

function evaluateDeclineMatch(context: WorkflowContext): WorkflowAction {
  const match = context.postMatch
  const userId = context.user.userId
  const participant = findParticipant(match?.participants, userId)
  const response = participant?.participantStatus?.toLowerCase()
  const visible =
    Boolean(match?.id)
    && !isEntityTerminal(MATCH_ENTITY, match?.status)
    && Boolean(participant)
    && response !== 'declined'
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status)
  const enabled =
    visible
    && userCanMutate(context)
    && !['confirmed', 'declined', 'expired', 'superseded'].includes(status)

  return buildAction(context, 'decline_match', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Participant can decline this match'
      : 'Decline is only available for active participant responses',
    aggregateId: match?.id,
    metadata: userId ? { userId } : undefined,
  })
}

function evaluateStartNegotiationFromPostMatch(context: WorkflowContext): WorkflowAction {
  const match = context.postMatch
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status)
  const visible = Boolean(match?.id && status === 'confirmed')
  const blocked = hasBlockingPostMatchNegotiation(context)
  const enabled = visible && userCanMutate(context) && !blocked

  return buildAction(context, 'start_negotiation_from_post_match', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Confirmed match can start marketplace negotiation'
      : 'Start negotiation requires a confirmed PostMatch',
    disabledReason: blocked
      ? 'An active or agreed negotiation already exists for this match'
      : !userCanMutate(context)
        ? 'You do not have permission to start negotiation'
        : undefined,
    aggregateId: match?.id,
  })
}

function evaluateStartNegotiationFromApplication(context: WorkflowContext): WorkflowAction {
  const application = context.application
  const status = canonicalEntityStatus(APPLICATION_ENTITY, application?.status)
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false
  const visible =
    legacyEnabled
    && Boolean(application?.id && status === 'accepted')
  const blocked = hasBlockingApplicationNegotiation(context)
  const hasDeal = Boolean(context.linkage?.dealForApplication?.id || application?.dealId)
  const enabled =
    visible
    && userCanMutate(context)
    && !blocked
    && !hasDeal

  return buildAction(context, 'start_negotiation_from_application', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Accepted application can start hiring negotiation'
      : 'Start hiring negotiation requires an accepted application',
    disabledReason: hasDeal
      ? 'A deal already exists for this application'
      : blocked
        ? 'A hiring negotiation already exists for this application'
        : !userCanMutate(context)
          ? 'You do not have permission to start hiring negotiation'
          : undefined,
    aggregateId: application?.id,
    workflowKey: 'hiring',
  })
}

function evaluateAgreeNegotiation(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status)
  const visible = Boolean(
    negotiation?.id
    && (status === 'active' || status === 'countered'),
  )
  const enabled = visible && userCanMutate(context)

  return buildAction(context, 'agree_negotiation', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Negotiation is open and can be agreed'
      : 'Agree is only available for active negotiations',
    aggregateId: negotiation?.id,
  })
}

function evaluateCancelNegotiation(context: WorkflowContext): WorkflowAction {
  const agree = evaluateAgreeNegotiation(context)
  return buildAction(context, 'cancel_negotiation', {
    visible: agree.visible,
    enabled: agree.enabled,
    visibilityReason: agree.visibilityReason,
    disabledReason: agree.disabledReason,
    aggregateId: agree.aggregateId,
  })
}

function evaluateCreateDealFromNegotiation(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status)
  const existingDeal = context.linkage?.dealForNegotiation
  const visible = Boolean(negotiation?.id && status === 'agreed')
  const enabled = visible && userCanMutate(context) && !existingDeal?.id

  return buildAction(context, 'create_deal_from_negotiation', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Agreed negotiation can create a deal'
      : 'Create deal requires an agreed negotiation',
    disabledReason: existingDeal?.id
      ? 'A deal already exists for this negotiation'
      : !userCanMutate(context)
        ? 'You do not have permission to create a deal'
        : undefined,
    aggregateId: negotiation?.id,
    metadata: negotiation?.id ? { negotiationId: negotiation.id } : undefined,
  })
}

function evaluateCreateDealFromPostMatch(context: WorkflowContext): WorkflowAction {
  const base = evaluateCreateDealFromNegotiation(context)
  const match = context.postMatch
  const visible = base.visible && Boolean(match?.id && negotiationLinkedToPostMatch(context))
  return buildAction(context, 'create_deal_from_post_match', {
    visible,
    enabled: base.enabled && visible,
    visibilityReason: visible
      ? 'Agreed PostMatch negotiation can create a deal'
      : 'Create deal from PostMatch requires agreed negotiation linked to match',
    disabledReason: base.disabledReason,
    aggregateId: match?.id ?? base.aggregateId,
    metadata: {
      negotiationId: context.negotiation?.id,
      postMatchId: match?.id,
    },
  })
}

function evaluateCreateDealFromApplication(context: WorkflowContext): WorkflowAction {
  const application = context.application
  const agreed = findAgreedApplicationNegotiation(context)
  const existingDeal = context.linkage?.dealForApplication
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false
  const visible =
    legacyEnabled
    && Boolean(application?.id && agreed?.id)
  const enabled =
    visible
    && userCanMutate(context)
    && !existingDeal?.id
    && !application?.dealId

  return buildAction(context, 'create_deal_from_application', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Agreed hiring negotiation can create a deal'
      : 'Create hiring deal requires an agreed application-linked negotiation',
    disabledReason: existingDeal?.id || application?.dealId
      ? 'A deal already exists for this application'
      : !userCanMutate(context)
        ? 'You do not have permission to create a hiring deal'
        : undefined,
    aggregateId: application?.id,
    workflowKey: 'hiring',
    metadata: agreed?.id ? { negotiationId: agreed.id } : undefined,
  })
}

function evaluateCreateContractFromDeal(context: WorkflowContext): WorkflowAction {
  const deal = context.deal
  const status = canonicalEntityStatus(DEAL_ENTITY, deal?.status)
  const visible = Boolean(
    deal?.id
    && DEAL_STATUSES_ALLOWING_CONTRACT.has(status)
    && (deal.negotiationId || deal.postMatchId || deal.applicationId),
  )
  const hasContract = hasActiveContractForDeal(context)
  const enabled = visible && userCanMutate(context) && !hasContract

  return buildAction(context, 'create_contract_from_deal', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Deal is ready for contract creation'
      : 'Create contract requires a draft, review, or signing deal',
    disabledReason: hasContract
      ? 'An active contract already exists for this deal'
      : !userCanMutate(context)
        ? 'You do not have permission to create a contract'
        : undefined,
    aggregateId: deal?.id,
    metadata: deal?.id ? { dealId: deal.id } : undefined,
  })
}

function evaluateSignContract(context: WorkflowContext): WorkflowAction {
  const contract = context.contract
  const status = canonicalEntityStatus(CONTRACT_ENTITY, contract?.status)
  const visible = Boolean(
    contract?.id && ['draft', 'pending_signature'].includes(status),
  )
  const enabled = visible && userCanMutate(context) && userHasPermission(context, 'contract:sign')

  return buildAction(context, 'sign_contract', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Contract is awaiting signatures'
      : 'Sign contract is only available for draft or signing contracts',
    aggregateId: contract?.id,
    metadata: context.user.userId ? { userId: context.user.userId } : undefined,
  })
}

function evaluateCompleteContract(context: WorkflowContext): WorkflowAction {
  const contract = context.contract
  const status = canonicalEntityStatus(CONTRACT_ENTITY, contract?.status)
  const visible = Boolean(contract?.id && status === 'active')
  const enabled = visible && userCanMutate(context)

  return buildAction(context, 'complete_contract', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Active contract can be completed'
      : 'Complete contract requires an active contract',
    aggregateId: contract?.id,
  })
}

function negotiationLinkedToPostMatch(context: WorkflowContext): boolean {
  const negotiation = context.negotiation
  const postMatchId = context.postMatch?.id
  if (!negotiation || !postMatchId) return false
  return (
    negotiation.postMatchId === postMatchId
    || negotiation.matchId === postMatchId
  )
}

const ACTION_EVALUATORS: Record<WorkflowActionKey, ActionEvaluator> = {
  publish_opportunity: evaluatePublishOpportunity,
  accept_match: evaluateAcceptMatch,
  decline_match: evaluateDeclineMatch,
  start_negotiation_from_post_match: evaluateStartNegotiationFromPostMatch,
  start_negotiation_from_application: evaluateStartNegotiationFromApplication,
  agree_negotiation: evaluateAgreeNegotiation,
  cancel_negotiation: evaluateCancelNegotiation,
  create_deal_from_post_match: evaluateCreateDealFromPostMatch,
  create_deal_from_application: evaluateCreateDealFromApplication,
  create_deal_from_negotiation: evaluateCreateDealFromNegotiation,
  create_contract_from_deal: evaluateCreateContractFromDeal,
  sign_contract: evaluateSignContract,
  complete_contract: evaluateCompleteContract,
}

function isActionAllowedForWorkflow(
  context: WorkflowContext,
  key: WorkflowActionKey,
): boolean {
  const { primary, collaboration } = resolveWorkflowKeys(context)
  const primaryDef = getWorkflowDefinition(primary)
  const collaborationDef = collaboration
    ? getWorkflowDefinition(collaboration)
    : undefined

  const commandType = getActionDefinition(key).commandType
  if (primaryDef.allowedCommands.includes(commandType)) return true
  if (collaborationDef?.allowedCommands.includes(commandType)) return true

  if (key === 'publish_opportunity' && primary === 'marketplace') return true
  if (
  ['accept_match', 'decline_match', 'start_negotiation_from_post_match'].includes(key)
    && context.postMatch?.id
  ) {
    return true
  }
  if (
    ['start_negotiation_from_application', 'create_deal_from_application'].includes(key)
    && context.application?.id
  ) {
    return true
  }

  return ACTION_EVALUATORS[key] !== undefined
}

export function getWorkflowNextActions(
  context: WorkflowContext,
): readonly WorkflowAction[] {
  return (Object.keys(ACTION_EVALUATORS) as WorkflowActionKey[])
    .filter((key) => isActionAllowedForWorkflow(context, key))
    .map((key) => ACTION_EVALUATORS[key](context))
    .filter((action) => action.visible)
}

export function findWorkflowAction(
  context: WorkflowContext,
  key: WorkflowActionKey,
): WorkflowAction | undefined {
  if (!isActionAllowedForWorkflow(context, key)) return undefined
  const action = ACTION_EVALUATORS[key](context)
  return action.visible ? action : undefined
}

export function isWorkflowActionAvailable(
  context: WorkflowContext,
  key: WorkflowActionKey,
): boolean {
  const action = findWorkflowAction(context, key)
  return Boolean(action?.enabled)
}
