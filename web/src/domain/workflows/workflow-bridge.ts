import type {
  Application,
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
    postMatchId?: string
    matchId?: string
    applicationId?: string
    negotiationId?: string
    dealId?: string
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
    postMatchId: entity.postMatchId,
    matchId: entity.matchId,
    applicationId: entity.applicationId,
    negotiationId: entity.negotiationId,
    dealId: entity.dealId,
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
  readonly postMatch?: PostMatch | null
  readonly negotiation?: Negotiation | null
  readonly deal?: Deal | null
  readonly contract?: Contract | null
  readonly linkage?: WorkflowLinkageContext
}

export function buildWorkflowContext(
  input: BuildWorkflowContextInput,
): WorkflowContext {
  const opportunity = input.opportunity ?? undefined
  const postMatch = input.postMatch ?? undefined

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
    deal: toWorkflowEntitySnapshot(input.deal ?? undefined),
    contract: toWorkflowEntitySnapshot(input.contract ?? undefined),
    collaboration: {
      ...buildCollaborationWorkflowContext(opportunity),
      matchType: postMatch?.matchType,
    },
    linkage: {
      legacyApplicationsEnabled: productFlags.showLegacyApplications,
      ...input.linkage,
    },
  }
}

export {
  findWorkflowAction,
  getWorkflowNextActions,
  isWorkflowActionAvailable,
  validateWorkflowTransition,
  type WorkflowAction,
  type WorkflowActionKey,
} from '@pm-twin/workflows'
