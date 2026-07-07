import type { CommercialTerms } from '@/types/commercial-terms.ts'
import {
  commercialTermsFromLegacyTerms,
  commercialTermsFromValueTerms,
} from '@/types/commercial-terms.ts'
import type {
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PostMatch,
} from '@/types/domain.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import { isTerminal } from '@pm-twin/lifecycle'
import { formatCommercialTermsDisplayLines } from '@/domain/collaboration/value-exchange-lifecycle.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import {
  formatCanonicalStatusLabel,
  resolveCanonicalStatus,
} from '@/lib/status-display.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
} from '@/domain/workflows/workflow-bridge.ts'

export type CommercialAgreementDetailLink = {
  readonly label: string
  readonly path: string
}

export type CommercialAgreementDetailParticipant = {
  readonly userId: string
  readonly role: string
  readonly participantStatus?: string
  readonly displayName: string
}

export type CommercialAgreementDetailReadModel = {
  readonly commercialAgreement: Deal
  readonly status: string
  readonly canonicalStatus: string
  readonly statusLabel: string
  readonly postMatchId: string | null
  readonly negotiationId: string
  readonly needOpportunityId: string | null
  readonly offerOpportunityId: string | null
  readonly participants: readonly CommercialAgreementDetailParticipant[]
  readonly commercialTerms: CommercialTerms | null
  readonly commercialTermsLines: readonly string[]
  readonly needTitle: string | null
  readonly needOpportunityStatus: string | null
  readonly needOpportunityCanonicalStatus: string | null
  readonly needOpportunityStatusLabel: string | null
  readonly offerTitle: string | null
  readonly offerOpportunityStatus: string | null
  readonly offerOpportunityCanonicalStatus: string | null
  readonly offerOpportunityStatusLabel: string | null
  readonly negotiationStatus: string | null
  readonly negotiationCanonicalStatus: string | null
  readonly negotiationStatusLabel: string | null
  readonly existingContract: Contract | null
  readonly canCreateContract: boolean
  readonly contractLink: CommercialAgreementDetailLink | null
  readonly links: {
    readonly match: CommercialAgreementDetailLink | null
    readonly negotiation: CommercialAgreementDetailLink | null
    readonly needOpportunity: CommercialAgreementDetailLink | null
    readonly offerOpportunity: CommercialAgreementDetailLink | null
  }
}

export type CommercialAgreementDetailReadModelDeps = {
  readonly getCommercialAgreement: (id: string) => Deal | undefined
  readonly getNegotiation: (id: string) => Negotiation | undefined
  readonly getPostMatch: (id: string) => PostMatch | undefined
  readonly getOpportunity: (id: string) => Opportunity | undefined
  readonly getContractsForCommercialAgreement?: (commercialAgreementId: string) => readonly Contract[]
  readonly getPersonName?: (userId: string) => string | undefined
}

const MISSING_LINK_LABEL = 'Unavailable'
const MISSING_TITLE_FALLBACK = 'Linked record unavailable'

const COMMERCIAL_AGREEMENT_STATUS_ENTITY = 'deal' as const
const CONTRACT_ENTITY = 'contract' as const

export const CONTRACT_DETAIL_ROUTE_PREFIX = '/contracts'

export function isActiveContract(contract: Contract): boolean {
  return !isTerminal(CONTRACT_ENTITY, contract.status)
}

export function resolveExistingActiveContract(
  contractsForCommercialAgreement: readonly Contract[],
): Contract | null {
  return contractsForCommercialAgreement.find(isActiveContract) ?? null
}

export function canCreateContractFromCommercialAgreement(
  commercialAgreement: Deal | null | undefined,
  contractsForCommercialAgreement: readonly Contract[] = [],
  options?: { readonly canMutate?: boolean; readonly userId?: string | null },
): boolean {
  if (!commercialAgreement?.id) return false

  const context = buildWorkflowContext({
    primaryWorkflow: commercialAgreement.applicationId ? 'hiring' : 'marketplace',
    user: {
      userId: options?.userId ?? null,
      canMutate: options?.canMutate ?? true,
      isParticipant: true,
    },
    deal: commercialAgreement,
    linkage: {
      contractsForCommercialAgreement: contractsForCommercialAgreement.map((contract) => ({
        id: contract.id,
        status: contract.status,
        dealId: contract.dealId,
      })),
    },
  })

  return isWorkflowActionAvailable(context, 'create_contract_from_commercial_agreement')
}

export function resolveCommercialAgreementPostMatchId(commercialAgreement: Deal): string | null {
  return commercialAgreement.postMatchId ?? commercialAgreement.matchId ?? null
}

export function resolveCommercialAgreementCommercialTerms(
  commercialAgreement: Deal,
): CommercialTerms | null {
  return (
    commercialTermsFromLegacyTerms(commercialAgreement.commercialTerms) ??
    commercialTermsFromLegacyTerms(commercialAgreement.terms) ??
    commercialTermsFromValueTerms(commercialAgreement.valueTerms) ??
    null
  )
}

export function formatCommercialTermsLines(
  terms: CommercialTerms | null,
): readonly string[] {
  const lines = formatCommercialTermsDisplayLines(terms)
  if (lines.length > 0) return lines
  if (!terms) return []
  if (terms.exchangeMode) {
    return [`Exchange: ${formatCollaborationExchangeMode(terms.exchangeMode)}`]
  }
  return []
}

function resolveParticipantDisplayName(
  userId: string,
  deps: CommercialAgreementDetailReadModelDeps,
): string {
  const name = deps.getPersonName?.(userId)
  return name?.trim() ? name : userId
}

function resolveLinkedOpportunityView(
  opportunityId: string | null | undefined,
  deps: CommercialAgreementDetailReadModelDeps,
): {
  readonly title: string | null
  readonly status: string | null
  readonly canonicalStatus: string | null
  readonly statusLabel: string | null
} {
  if (!opportunityId) {
    return {
      title: null,
      status: null,
      canonicalStatus: null,
      statusLabel: null,
    }
  }

  const opportunity = deps.getOpportunity(opportunityId)
  if (!opportunity) {
    return {
      title: MISSING_TITLE_FALLBACK,
      status: null,
      canonicalStatus: null,
      statusLabel: null,
    }
  }

  const status = opportunity.status ?? null
  const canonicalStatus = status
    ? resolveCanonicalStatus('opportunity', status)
    : null

  return {
    title: opportunity.title ?? MISSING_TITLE_FALLBACK,
    status,
    canonicalStatus,
    statusLabel: status
      ? formatCanonicalStatusLabel('opportunity', status)
      : null,
  }
}

export function buildCommercialAgreementDetailReadModel(
  commercialAgreementId: string,
  deps: CommercialAgreementDetailReadModelDeps,
): CommercialAgreementDetailReadModel | null {
  const commercialAgreement = deps.getCommercialAgreement(commercialAgreementId)
  if (!commercialAgreement) return null

  const postMatchId = resolveCommercialAgreementPostMatchId(commercialAgreement)
  const negotiation = commercialAgreement.negotiationId
    ? deps.getNegotiation(commercialAgreement.negotiationId)
    : undefined
  const commercialTerms = resolveCommercialAgreementCommercialTerms(commercialAgreement)
  const participants = normalizeParticipants(
    commercialAgreement.participants,
    commercialAgreement.parties,
  ).map((participant) => ({
    userId: participant.userId,
    role: participant.role,
    participantStatus: participant.participantStatus,
    displayName: resolveParticipantDisplayName(participant.userId, deps),
  }))

  const needOpportunityId = commercialAgreement.needOpportunityId ?? null
  const offerOpportunityId = commercialAgreement.offerOpportunityId ?? null
  const needOpportunity = resolveLinkedOpportunityView(needOpportunityId, deps)
  const offerOpportunity = resolveLinkedOpportunityView(offerOpportunityId, deps)
  const contractsForCommercialAgreement =
    deps.getContractsForCommercialAgreement?.(commercialAgreementId) ?? []
  const existingContract = resolveExistingActiveContract(contractsForCommercialAgreement)
  const canCreateContract = canCreateContractFromCommercialAgreement(
    commercialAgreement,
    contractsForCommercialAgreement,
  )
  const negotiationStatus = negotiation?.status ?? null

  return {
    commercialAgreement,
    status: commercialAgreement.status,
    canonicalStatus: resolveCanonicalStatus(COMMERCIAL_AGREEMENT_STATUS_ENTITY, commercialAgreement.status),
    statusLabel: formatCanonicalStatusLabel(COMMERCIAL_AGREEMENT_STATUS_ENTITY, commercialAgreement.status),
    postMatchId,
    negotiationId: commercialAgreement.negotiationId,
    needOpportunityId,
    offerOpportunityId,
    participants,
    commercialTerms,
    commercialTermsLines: formatCommercialTermsLines(commercialTerms),
    needTitle: needOpportunity.title,
    needOpportunityStatus: needOpportunity.status,
    needOpportunityCanonicalStatus: needOpportunity.canonicalStatus,
    needOpportunityStatusLabel: needOpportunity.statusLabel,
    offerTitle: offerOpportunity.title,
    offerOpportunityStatus: offerOpportunity.status,
    offerOpportunityCanonicalStatus: offerOpportunity.canonicalStatus,
    offerOpportunityStatusLabel: offerOpportunity.statusLabel,
    negotiationStatus,
    negotiationCanonicalStatus: negotiationStatus
      ? resolveCanonicalStatus('negotiation', negotiationStatus)
      : null,
    negotiationStatusLabel: negotiationStatus
      ? formatCanonicalStatusLabel('negotiation', negotiationStatus)
      : null,
    existingContract,
    canCreateContract,
    contractLink: existingContract
      ? {
          label: 'Open contract',
          path: `${CONTRACT_DETAIL_ROUTE_PREFIX}/${existingContract.id}`,
        }
      : null,
    links: {
      match: postMatchId
        ? { label: 'Back to Match', path: `/matches/${postMatchId}` }
        : null,
      negotiation: commercialAgreement.negotiationId
        ? {
            label: 'Back to Negotiation',
            path: `/negotiations/${commercialAgreement.negotiationId}`,
          }
        : null,
      needOpportunity: needOpportunityId
        ? {
            label: 'Back to Need Opportunity',
            path: `/opportunities/${needOpportunityId}`,
          }
        : null,
      offerOpportunity: offerOpportunityId
        ? {
            label: 'Back to Offer Opportunity',
            path: `/opportunities/${offerOpportunityId}`,
          }
        : null,
    },
  }
}

export function commercialAgreementDetailLinkFallbackLabel(label: string): string {
  return `${label} (${MISSING_LINK_LABEL})`
}
