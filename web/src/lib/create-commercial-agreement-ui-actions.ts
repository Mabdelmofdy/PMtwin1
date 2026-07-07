import type { CommandResult } from '@pm-twin/commands'
import type { Deal, Negotiation } from '@/types/domain.ts'
import { commercialAgreementRepository, negotiationOfferRepository } from '@/repositories/index.ts'
import { commercialAgreementCommandService } from '@/services/commercial-agreement-command-service.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
  toWorkflowEntitySnapshot,
} from '@/domain/workflows/workflow-bridge.ts'

export type CreateCommercialAgreementUiActionResult =
  | { readonly success: true; readonly commercialAgreementId: string; readonly commercialAgreement: Deal }
  | { readonly success: false; readonly message: string }

export type CreateCommercialAgreementUiActionsDeps = {
  readonly createCommercialAgreementFromNegotiation?: (negotiationId: string) => {
    readonly result: CommandResult
    readonly commercialAgreement: Deal | null
  }
  readonly findCommercialAgreementByNegotiationId?: (negotiationId: string) => Deal | undefined
  readonly postMatch?: { id: string; matchType?: string } | null
  readonly userId?: string | null
  readonly canMutate?: boolean
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Commercial agreement could not be created.'
}

function buildNegotiationCommercialAgreementContext(
  negotiation: Negotiation,
  deps?: CreateCommercialAgreementUiActionsDeps,
) {
  const findCommercialAgreement =
    deps?.findCommercialAgreementByNegotiationId
    ?? ((id: string) => commercialAgreementRepository.findByNegotiationId(id))

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
          matchType: deps.postMatch.matchType ?? 'one_way',
          status: 'confirmed',
          matchScore: 0,
          participants: [],
        }
      : negotiation.postMatchId
        ? {
            id: negotiation.postMatchId,
            matchType: 'one_way',
            status: 'confirmed',
            matchScore: 0,
            participants: [],
          }
        : undefined,
    negotiation,
    application: negotiation.applicationId
      ? {
          id: negotiation.applicationId,
          status: 'accepted',
          opportunityId: negotiation.opportunityId ?? '',
          applicantId: '',
        }
      : undefined,
    linkage: {
      commercialAgreementForNegotiation: (() => {
        const commercialAgreement = findCommercialAgreement(negotiation.id)
        return commercialAgreement
          ? toWorkflowEntitySnapshot(commercialAgreement) ?? null
          : null
      })(),
      negotiationAcceptedOfferId:
        negotiationOfferRepository
          .getByNegotiationId(negotiation.id)
          .find((offer) => offer.status === 'accepted')?.id
        ?? (
          negotiation.commercialTerms
          && Object.keys(negotiation.commercialTerms).length > 0
          && negotiation.status === 'agreed'
            ? 'legacy-agreed-terms'
            : null
        ),
      legacyApplicationsEnabled: Boolean(negotiation.applicationId),
      negotiationsForApplication: negotiation.applicationId
        ? [
            toWorkflowEntitySnapshot({
              id: negotiation.id,
              status: negotiation.status,
              applicationId: negotiation.applicationId,
            }) ?? {
              id: negotiation.id,
              status: negotiation.status,
            },
          ]
        : undefined,
    },
  })
}

export function canShowCreateCommercialAgreementFromNegotiation(
  negotiation: Negotiation | null | undefined,
  deps?: CreateCommercialAgreementUiActionsDeps,
): boolean {
  if (!negotiation?.id) return false
  const context = buildNegotiationCommercialAgreementContext(negotiation, deps)
  if (negotiation.applicationId) {
    return isWorkflowActionAvailable(context, 'create_commercial_agreement_from_application')
  }
  return isWorkflowActionAvailable(context, 'create_commercial_agreement_from_negotiation')
}

export function isPostMatchNegotiation(
  negotiation: Negotiation | null | undefined,
): boolean {
  return Boolean(negotiation?.postMatchId)
}

export function createCommercialAgreementFromNegotiationUiAction(
  negotiationId: string,
  deps?: CreateCommercialAgreementUiActionsDeps,
): CreateCommercialAgreementUiActionResult {
  const create =
    deps?.createCommercialAgreementFromNegotiation
    ?? commercialAgreementCommandService.createCommercialAgreementFromNegotiation.bind(
      commercialAgreementCommandService,
    )

  const { result, commercialAgreement } = create(negotiationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  if (!commercialAgreement?.id) {
    return {
      success: false,
      message: 'Commercial agreement could not be created. Negotiation may not exist.',
    }
  }

  return {
    success: true,
    commercialAgreementId: commercialAgreement.id,
    commercialAgreement,
  }
}
