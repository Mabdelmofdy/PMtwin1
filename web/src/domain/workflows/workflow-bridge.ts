import type {
  Application,
  CommercialAgreement,
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PostMatch,
} from '@/types/domain.ts'
import type {
  WorkflowContext,
  WorkflowEntitySnapshot,
  WorkflowKey,
  WorkflowLinkageContext,
  WorkflowUserContext,
} from '@pm-twin/workflows'
import { productFlags } from '@/config/product-flags.ts'

export function toWorkflowEntitySnapshot(
  entity: {
    id: string
    status?: string
    creatorId?: string
    applicantId?: string
    opportunityId?: string
    postMatchId?: string | null
    matchId?: string | null
    applicationId?: string | null
    negotiationId?: string | null
    dealId?: string | null
    matchType?: string
    participants?: PostMatch['participants']
    commercialTerms?: Deal['commercialTerms']
  } | null | undefined,
): WorkflowEntitySnapshot | undefined {
  if (!entity?.id) return undefined
  return {
    id: entity.id,
    status: entity.status,
    creatorId: entity.creatorId,
    applicantId: entity.applicantId,
    opportunityId: entity.opportunityId,
    postMatchId: entity.postMatchId ?? undefined,
    matchId: entity.matchId ?? undefined,
    applicationId: entity.applicationId ?? undefined,
    negotiationId: entity.negotiationId ?? undefined,
    dealId: entity.dealId ?? undefined,
    matchType: entity.matchType,
    participants: entity.participants?.map((participant) => ({
      userId: participant.userId,
      role: participant.role,
      opportunityId: participant.opportunityId,
      participantStatus: participant.participantStatus,
    })),
    commercialTerms: entity.commercialTerms as Record<string, unknown> | undefined,
  }
}

export function buildCollaborationWorkflowContext(
  opportunity?: Pick<
    Opportunity,
    | 'mainCollaborationModel'
    | 'modelType'
    | 'subModelType'
    | 'exchangeMode'
    | 'preferredMatchingTopology'
    | 'collaborationAttributes'
    | 'exchangeData'
    | 'acceptedExchangeModes'
    | 'paymentModes'
  > | null,
) {
  if (!opportunity) return undefined
  return {
    mainCollaborationModel: opportunity.mainCollaborationModel,
    modelType: opportunity.modelType,
    subModelType: opportunity.subModelType,
    exchangeMode: opportunity.exchangeMode,
    preferredMatchingTopology: opportunity.preferredMatchingTopology,
    collaborationAttributes: opportunity.collaborationAttributes,
    exchangeData: opportunity.exchangeData,
    acceptedExchangeModes:
      opportunity.acceptedExchangeModes ?? opportunity.paymentModes,
  }
}

export type BuildWorkflowContextInput = {
  readonly primaryWorkflow?: WorkflowKey
  readonly user?: WorkflowUserContext
  readonly opportunity?: Opportunity | null
  readonly application?: Application | null
  readonly postMatch?: PostMatch | Pick<PostMatch, 'id' | 'status' | 'matchType' | 'participants'> | null
  readonly negotiation?: Negotiation | null
  readonly commercialAgreement?: CommercialAgreement | null
  readonly deal?: Deal | null
  readonly contract?: Contract | null
  readonly linkage?: WorkflowLinkageContext
}

export function buildWorkflowContext(
  input: BuildWorkflowContextInput,
): WorkflowContext {
  const opportunity = input.opportunity ?? undefined
  const postMatch = input.postMatch ?? undefined
  const commercialAgreement = input.commercialAgreement ?? input.deal ?? undefined
  const decisionStatus =
    (commercialAgreement?.payload as { decisionStatus?: string } | undefined)?.decisionStatus
    ?? 'approved'

  return {
    primaryWorkflow:
      input.primaryWorkflow
      ?? (input.application?.id ? 'hiring' : 'marketplace'),
    collaborationWorkflow: undefined,
    user: input.user ?? { userId: null },
    opportunity: toWorkflowEntitySnapshot(opportunity),
    application: toWorkflowEntitySnapshot(input.application ?? undefined),
    postMatch: toWorkflowEntitySnapshot(postMatch),
    negotiation: toWorkflowEntitySnapshot(input.negotiation ?? undefined),
    commercialAgreement: toWorkflowEntitySnapshot(commercialAgreement),
    deal: toWorkflowEntitySnapshot(commercialAgreement),
    contract: toWorkflowEntitySnapshot(input.contract ?? undefined),
    collaboration: {
      ...buildCollaborationWorkflowContext(opportunity),
      matchType: postMatch?.matchType,
    },
    linkage: {
      legacyApplicationsEnabled: productFlags.showLegacyApplications,
      contractDecisionRequired: true,
      contractDecisionStatus: decisionStatus as WorkflowLinkageContext['contractDecisionStatus'],
      ...input.linkage,
    },
  }
}

export {
  findWorkflowAction,
  getWorkflowNextActions,
  isWorkflowActionAvailable,
  validateWorkflowTransition,
  buildWorkflowActionHook,
  buildWorkflowActionHooks,
  type WorkflowAction,
  type WorkflowActionKey,
  type WorkflowActionHook,
} from '@pm-twin/workflows'
