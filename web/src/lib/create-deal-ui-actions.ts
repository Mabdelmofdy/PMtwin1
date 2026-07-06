import type { CommandResult } from '@pm-twin/commands'
import type { Deal, Negotiation } from '@/types/domain.ts'
import { dealRepository } from '@/repositories/index.ts'
import { dealCommandService } from '@/services/deal-command-service.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
} from '@/domain/workflows/workflow-bridge.ts'

export type CreateDealUiActionResult =
  | { readonly success: true; readonly dealId: string; readonly deal: Deal }
  | { readonly success: false; readonly message: string }

export type CreateDealUiActionsDeps = {
  readonly createDealFromNegotiation?: (negotiationId: string) => {
    readonly result: CommandResult
    readonly deal: Deal | null
  }
  readonly findDealByNegotiationId?: (negotiationId: string) => Deal | undefined
  readonly postMatch?: { id: string; matchType?: string } | null
  readonly userId?: string | null
  readonly canMutate?: boolean
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Deal could not be created.'
}

function buildNegotiationDealContext(
  negotiation: Negotiation,
  deps?: CreateDealUiActionsDeps,
) {
  const findDeal =
    deps?.findDealByNegotiationId
    ?? ((id: string) => dealRepository.findByNegotiationId(id))

  return buildWorkflowContext({
    primaryWorkflow: negotiation.applicationId ? 'hiring' : 'marketplace',
    user: {
      userId: deps?.userId ?? null,
      canMutate: deps?.canMutate ?? true,
      isParticipant: true,
    },
    postMatch: deps?.postMatch
      ? {
          id: deps.postMatch.id,
          matchType: deps.postMatch.matchType,
        }
      : negotiation.postMatchId
        ? { id: negotiation.postMatchId, matchType: undefined }
        : undefined,
    negotiation,
    application: negotiation.applicationId
      ? { id: negotiation.applicationId, status: 'accepted', opportunityId: negotiation.opportunityId ?? '', applicantId: '' }
      : undefined,
    linkage: {
      dealForNegotiation: findDeal(negotiation.id) ?? null,
      legacyApplicationsEnabled: Boolean(negotiation.applicationId),
      negotiationsForApplication: negotiation.applicationId
        ? [{
            id: negotiation.id,
            status: negotiation.status,
            applicationId: negotiation.applicationId,
          }]
        : undefined,
    },
  })
}

export function canShowCreateDealFromNegotiation(
  negotiation: Negotiation | null | undefined,
  deps?: CreateDealUiActionsDeps,
): boolean {
  if (!negotiation?.id) return false
  const context = buildNegotiationDealContext(negotiation, deps)
  if (negotiation.applicationId) {
    return isWorkflowActionAvailable(context, 'create_deal_from_application')
  }
  return isWorkflowActionAvailable(context, 'create_deal_from_negotiation')
}

export function isPostMatchNegotiation(
  negotiation: Negotiation | null | undefined,
): boolean {
  return Boolean(negotiation?.postMatchId)
}

export function createDealFromNegotiationUiAction(
  negotiationId: string,
  deps?: CreateDealUiActionsDeps,
): CreateDealUiActionResult {
  const create =
    deps?.createDealFromNegotiation
    ?? dealCommandService.createDealFromNegotiation.bind(dealCommandService)

  const { result, deal } = create(negotiationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  if (!deal?.id) {
    return {
      success: false,
      message: 'Deal could not be created. Negotiation may not exist.',
    }
  }

  return { success: true, dealId: deal.id, deal }
}
