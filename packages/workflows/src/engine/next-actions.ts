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
  hasActiveContractForCommercialAgreement,
  hasBlockingApplicationNegotiation,
  hasBlockingPostMatchNegotiation,
  resolveWorkflowKeys,
} from './resolve-workflow.ts'
import { validateCollaborationPublishRequirements } from './collaboration-guards.ts'
import { isDecisionStatusApproved } from '@pm-twin/decision-engine'

const MATCH_ENTITY = 'match'
const APPLICATION_ENTITY = 'application'
const NEGOTIATION_ENTITY = 'negotiation'
const COMMERCIAL_AGREEMENT_ENTITY = 'commercial_agreement'
const CONTRACT_ENTITY = 'contract'
const OPPORTUNITY_ENTITY = 'opportunity'

const COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT = new Set(['draft', 'review', 'signing'])

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
  const hasCommercialAgreement = Boolean(
    context.linkage?.commercialAgreementForApplication?.id
    || context.linkage?.dealForApplication?.id
    || application?.commercialAgreementId
    || application?.dealId,
  )
  const enabled =
    visible
    && userCanMutate(context)
    && !blocked
    && !hasCommercialAgreement

  return buildAction(context, 'start_negotiation_from_application', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Accepted application can start hiring negotiation'
      : 'Start hiring negotiation requires an accepted application',
    disabledReason: hasCommercialAgreement
      ? 'A commercial agreement already exists for this application'
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

const AUDITOR_ROLES = new Set(['auditor', 'admin', 'moderator'])

function isNegotiationRoomWritable(context: WorkflowContext): boolean {
  const negotiation = context.negotiation
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status)
  return Boolean(
    negotiation?.id
    && (status === 'active' || status === 'countered'),
  )
}

function isAuditorViewer(context: WorkflowContext): boolean {
  const roles = context.user.roles ?? []
  return roles.some((role) => AUDITOR_ROLES.has(role))
}

function canViewNegotiationTranscript(context: WorkflowContext): boolean {
  const negotiation = context.negotiation
  if (!negotiation?.id) return false
  if (context.user.isParticipant) return true
  if (isAuditorViewer(context)) return true
  return Boolean(context.user.canMutate && context.user.userId)
}

function evaluateSendNegotiationMessage(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const writable = isNegotiationRoomWritable(context)
  const visible = Boolean(negotiation?.id && writable)
  const enabled =
    visible
    && userCanMutate(context)
    && Boolean(context.user.isParticipant)

  return buildAction(context, 'send_negotiation_message', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Negotiation room is open for discussion'
      : 'Discussion is only available for active negotiations',
    disabledReason: !context.user.isParticipant
      ? 'Only negotiation participants can send messages'
      : !userCanMutate(context)
        ? 'You do not have permission to send messages'
        : undefined,
    aggregateId: negotiation?.id,
  })
}

function evaluateSubmitNegotiationOffer(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const writable = isNegotiationRoomWritable(context)
  const visible = Boolean(negotiation?.id && writable)
  const enabled =
    visible
    && userCanMutate(context)
    && Boolean(context.user.isParticipant)

  return buildAction(context, 'submit_negotiation_offer', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Negotiation room accepts initial offers'
      : 'Offer submission requires an active negotiation',
    disabledReason: !context.user.isParticipant
      ? 'Only negotiation participants can submit offers'
      : undefined,
    aggregateId: negotiation?.id,
  })
}

function evaluateSubmitNegotiationCounterOffer(
  context: WorkflowContext,
): WorkflowAction {
  const negotiation = context.negotiation
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status)
  const visible = Boolean(
    negotiation?.id
    && (status === 'active' || status === 'countered'),
  )
  const enabled =
    visible
    && userCanMutate(context)
    && Boolean(context.user.isParticipant)

  return buildAction(context, 'submit_negotiation_counter_offer', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Counter offers can be submitted while negotiation is open'
      : 'Counter offers require an active or countered negotiation',
    disabledReason: !context.user.isParticipant
      ? 'Only negotiation participants can submit counter offers'
      : undefined,
    aggregateId: negotiation?.id,
  })
}

function evaluateAcceptNegotiationOffer(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const writable = isNegotiationRoomWritable(context)
  const visible = Boolean(negotiation?.id && writable)
  const enabled =
    visible
    && userCanMutate(context)
    && Boolean(context.user.isParticipant)

  return buildAction(context, 'accept_negotiation_offer', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Submitted offers can be accepted'
      : 'Accept offer is only available for open negotiations',
    disabledReason: !context.user.isParticipant
      ? 'Only negotiation participants can accept offers'
      : undefined,
    aggregateId: negotiation?.id,
  })
}

function evaluateRejectNegotiationOffer(context: WorkflowContext): WorkflowAction {
  const accept = evaluateAcceptNegotiationOffer(context)
  return buildAction(context, 'reject_negotiation_offer', {
    visible: accept.visible,
    enabled: accept.enabled,
    visibilityReason: accept.visibilityReason,
    disabledReason: accept.disabledReason,
    aggregateId: accept.aggregateId,
  })
}

function evaluateViewNegotiationTranscript(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const visible = canViewNegotiationTranscript(context)
  const enabled = visible

  return buildAction(context, 'view_negotiation_transcript', {
    visible: Boolean(negotiation?.id && visible),
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Negotiation transcript is available for review'
      : 'Transcript view requires participant or auditor access',
    aggregateId: negotiation?.id,
  })
}

function evaluateCreateCommercialAgreementFromNegotiation(context: WorkflowContext): WorkflowAction {
  const negotiation = context.negotiation
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status)
  const existingCommercialAgreement = context.linkage?.commercialAgreementForNegotiation
    ?? context.linkage?.dealForNegotiation
  const hasAcceptedOffer = Boolean(
    context.linkage?.negotiationAcceptedOfferId
    || (
      status === 'agreed'
      && context.negotiation?.commercialTerms
      && Object.keys(context.negotiation.commercialTerms).length > 0
    ),
  )
  const visible = Boolean(negotiation?.id && status === 'agreed')
  const enabled =
    visible
    && userCanMutate(context)
    && !existingCommercialAgreement?.id
    && hasAcceptedOffer

  return buildAction(context, 'create_commercial_agreement_from_negotiation', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Agreed negotiation can create a commercial agreement'
      : 'Create commercial agreement requires an agreed negotiation',
    disabledReason: !hasAcceptedOffer
      ? 'An accepted negotiation offer is required before creating a commercial agreement'
      : existingCommercialAgreement?.id
        ? 'A commercial agreement already exists for this negotiation'
        : !userCanMutate(context)
          ? 'You do not have permission to create a commercial agreement'
          : undefined,
    aggregateId: negotiation?.id,
    metadata: negotiation?.id ? { negotiationId: negotiation.id } : undefined,
  })
}

function evaluateCreateCommercialAgreementFromPostMatch(context: WorkflowContext): WorkflowAction {
  const base = evaluateCreateCommercialAgreementFromNegotiation(context)
  const match = context.postMatch
  const visible = base.visible && Boolean(match?.id && negotiationLinkedToPostMatch(context))
  return buildAction(context, 'create_commercial_agreement_from_post_match', {
    visible,
    enabled: base.enabled && visible,
    visibilityReason: visible
      ? 'Agreed PostMatch negotiation can create a commercial agreement'
      : 'Create commercial agreement from PostMatch requires agreed negotiation linked to match',
    disabledReason: base.disabledReason,
    aggregateId: match?.id ?? base.aggregateId,
    metadata: {
      negotiationId: context.negotiation?.id,
      postMatchId: match?.id,
    },
  })
}

function evaluateCreateCommercialAgreementFromApplication(context: WorkflowContext): WorkflowAction {
  const application = context.application
  const agreed = findAgreedApplicationNegotiation(context)
  const existingCommercialAgreement = context.linkage?.commercialAgreementForApplication
    ?? context.linkage?.dealForApplication
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false
  const visible =
    legacyEnabled
    && Boolean(application?.id && agreed?.id)
  const enabled =
    visible
    && userCanMutate(context)
    && !existingCommercialAgreement?.id
    && !application?.commercialAgreementId
    && !application?.dealId

  return buildAction(context, 'create_commercial_agreement_from_application', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Agreed hiring negotiation can create a commercial agreement'
      : 'Create hiring commercial agreement requires an agreed application-linked negotiation',
    disabledReason: existingCommercialAgreement?.id || application?.commercialAgreementId || application?.dealId
      ? 'A commercial agreement already exists for this application'
      : !userCanMutate(context)
        ? 'You do not have permission to create a hiring commercial agreement'
        : undefined,
    aggregateId: application?.id,
    workflowKey: 'hiring',
    metadata: agreed?.id ? { negotiationId: agreed.id } : undefined,
  })
}

function evaluateCreateContractFromCommercialAgreement(context: WorkflowContext): WorkflowAction {
  const commercialAgreement = context.commercialAgreement ?? context.deal
  const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreement?.status)
  const visible = Boolean(
    commercialAgreement?.id
    && COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT.has(status)
    && (commercialAgreement.negotiationId || commercialAgreement.postMatchId || commercialAgreement.applicationId),
  )
  const hasContract = hasActiveContractForCommercialAgreement(context)
  const decisionRequired = context.linkage?.contractDecisionRequired !== false
  const decisionApproved = isDecisionStatusApproved(
    context.linkage?.contractDecisionStatus,
  )
  const enabled = visible && userCanMutate(context) && !hasContract && (!decisionRequired || decisionApproved)

  return buildAction(context, 'create_contract_from_commercial_agreement', {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible
      ? 'Commercial agreement is ready for contract creation'
      : 'Create contract requires a draft, review, or signing commercial agreement',
    disabledReason: hasContract
      ? 'An active contract already exists for this commercial agreement'
      : decisionRequired && !decisionApproved
        ? 'Decision review must be approved before creating a contract'
      : !userCanMutate(context)
        ? 'You do not have permission to create a contract'
        : undefined,
    aggregateId: commercialAgreement?.id,
    metadata: commercialAgreement?.id ? { commercialAgreementId: commercialAgreement.id } : undefined,
  })
}

function evaluateRouteContractDecision(context: WorkflowContext): WorkflowAction {
  const commercialAgreement = context.commercialAgreement ?? context.deal
  const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreement?.status)
  const visible = Boolean(
    commercialAgreement?.id
    && COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT.has(status),
  )
  const hasContract = hasActiveContractForCommercialAgreement(context)
  const decisionApproved = isDecisionStatusApproved(context.linkage?.contractDecisionStatus)
  const enabled = visible && userCanMutate(context) && !hasContract && !decisionApproved

  return buildAction(context, 'route_contract_decision', {
    visible,
    enabled,
    visibilityReason: visible
      ? 'Commercial agreement can be routed to decision engine review'
      : 'Decision routing requires a draft, review, or signing commercial agreement',
    disabledReason: hasContract
      ? 'Contract already exists for this commercial agreement'
      : decisionApproved
        ? 'Decision review already approved'
        : !userCanMutate(context)
          ? 'You do not have permission to route contract decisions'
          : undefined,
    aggregateId: commercialAgreement?.id,
    metadata: commercialAgreement?.id ? { commercialAgreementId: commercialAgreement.id } : undefined,
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
  send_negotiation_message: evaluateSendNegotiationMessage,
  submit_negotiation_offer: evaluateSubmitNegotiationOffer,
  submit_negotiation_counter_offer: evaluateSubmitNegotiationCounterOffer,
  accept_negotiation_offer: evaluateAcceptNegotiationOffer,
  reject_negotiation_offer: evaluateRejectNegotiationOffer,
  view_negotiation_transcript: evaluateViewNegotiationTranscript,
  create_commercial_agreement_from_post_match: evaluateCreateCommercialAgreementFromPostMatch,
  create_commercial_agreement_from_application: evaluateCreateCommercialAgreementFromApplication,
  create_commercial_agreement_from_negotiation: evaluateCreateCommercialAgreementFromNegotiation,
  route_contract_decision: evaluateRouteContractDecision,
  create_contract_from_commercial_agreement: evaluateCreateContractFromCommercialAgreement,
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
    ['start_negotiation_from_application', 'create_commercial_agreement_from_application'].includes(key)
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
