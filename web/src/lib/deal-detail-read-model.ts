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
import { isTerminal, toCanonical } from '@pm-twin/lifecycle'
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
export type DealDetailLink = {
  readonly label: string
  readonly path: string
}

export type DealDetailParticipant = {
  readonly userId: string
  readonly role: string
  readonly participantStatus?: string
  readonly displayName: string
}

export type DealDetailReadModel = {
  readonly deal: Deal
  readonly status: string
  readonly canonicalStatus: string
  readonly statusLabel: string
  readonly postMatchId: string | null
  readonly negotiationId: string
  readonly needOpportunityId: string | null
  readonly offerOpportunityId: string | null
  readonly participants: readonly DealDetailParticipant[]
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
  readonly contractLink: DealDetailLink | null
  readonly links: {    readonly match: DealDetailLink | null
    readonly negotiation: DealDetailLink | null
    readonly needOpportunity: DealDetailLink | null
    readonly offerOpportunity: DealDetailLink | null
  }
}

export type DealDetailReadModelDeps = {
  readonly getDeal: (id: string) => Deal | undefined
  readonly getNegotiation: (id: string) => Negotiation | undefined
  readonly getPostMatch: (id: string) => PostMatch | undefined
  readonly getOpportunity: (id: string) => Opportunity | undefined
  readonly getContractsForDeal?: (dealId: string) => readonly Contract[]
  readonly getPersonName?: (userId: string) => string | undefined
}
const MISSING_LINK_LABEL = 'Unavailable'
const MISSING_TITLE_FALLBACK = 'Linked record unavailable'

const DEAL_ENTITY = 'deal' as const
const CONTRACT_ENTITY = 'contract' as const

const DEAL_STATUSES_ALLOWING_CONTRACT = new Set(['draft', 'review', 'signing'])

export const CONTRACT_DETAIL_ROUTE_PREFIX = '/contracts'

/** @deprecated Use canCreateContractFromDeal — retained for legacy test imports. */
export const DEAL_DETAIL_SHOWS_CONTRACT_ACTION = false

export function isActiveContract(contract: Contract): boolean {
  return !isTerminal(CONTRACT_ENTITY, contract.status)
}

export function resolveExistingActiveContract(
  contractsForDeal: readonly Contract[],
): Contract | null {
  return contractsForDeal.find(isActiveContract) ?? null
}

export function canCreateContractFromDeal(
  deal: Deal | null | undefined,
  contractsForDeal: readonly Contract[] = [],
  options?: { readonly canMutate?: boolean; readonly userId?: string | null },
): boolean {
  if (!deal?.id) return false

  const context = buildWorkflowContext({
    primaryWorkflow: deal.applicationId ? 'hiring' : 'marketplace',
    user: {
      userId: options?.userId ?? null,
      canMutate: options?.canMutate ?? true,
      isParticipant: true,
    },
    deal,
    linkage: {
      contractsForDeal: contractsForDeal.map((contract) => ({
        id: contract.id,
        status: contract.status,
        dealId: contract.dealId,
      })),
    },
  })

  return isWorkflowActionAvailable(context, 'create_contract_from_deal')
}
export function resolveDealPostMatchId(deal: Deal): string | null {
  return deal.postMatchId ?? deal.matchId ?? null
}

export function resolveDealCommercialTerms(deal: Deal): CommercialTerms | null {
  return (
    commercialTermsFromLegacyTerms(deal.commercialTerms) ??
    commercialTermsFromLegacyTerms(deal.terms) ??
    commercialTermsFromValueTerms(deal.valueTerms) ??
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
  deps: DealDetailReadModelDeps,
): string {
  const name = deps.getPersonName?.(userId)
  return name?.trim() ? name : userId
}

function resolveLinkedOpportunityView(
  opportunityId: string | null | undefined,
  deps: DealDetailReadModelDeps,
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

export function buildDealDetailReadModel(
  dealId: string,
  deps: DealDetailReadModelDeps,
): DealDetailReadModel | null {
  const deal = deps.getDeal(dealId)
  if (!deal) return null

  const postMatchId = resolveDealPostMatchId(deal)
  const negotiation = deal.negotiationId
    ? deps.getNegotiation(deal.negotiationId)
    : undefined
  const commercialTerms = resolveDealCommercialTerms(deal)
  const participants = normalizeParticipants(deal.participants, deal.parties).map(
    (participant) => ({
      userId: participant.userId,
      role: participant.role,
      participantStatus: participant.participantStatus,
      displayName: resolveParticipantDisplayName(participant.userId, deps),
    }),
  )

  const needOpportunityId = deal.needOpportunityId ?? null
  const offerOpportunityId = deal.offerOpportunityId ?? null
  const needOpportunity = resolveLinkedOpportunityView(needOpportunityId, deps)
  const offerOpportunity = resolveLinkedOpportunityView(offerOpportunityId, deps)
  const contractsForDeal = deps.getContractsForDeal?.(dealId) ?? []
  const existingContract = resolveExistingActiveContract(contractsForDeal)
  const canCreateContract = canCreateContractFromDeal(deal, contractsForDeal)
  const negotiationStatus = negotiation?.status ?? null

  return {
    deal,
    status: deal.status,
    canonicalStatus: resolveCanonicalStatus(DEAL_ENTITY, deal.status),
    statusLabel: formatCanonicalStatusLabel(DEAL_ENTITY, deal.status),
    postMatchId,
    negotiationId: deal.negotiationId,
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
    links: {      match: postMatchId
        ? { label: 'Back to Match', path: `/matches/${postMatchId}` }
        : null,
      negotiation: deal.negotiationId
        ? {
            label: 'Back to Negotiation',
            path: `/negotiations/${deal.negotiationId}`,
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

export function dealDetailLinkFallbackLabel(label: string): string {
  return `${label} (${MISSING_LINK_LABEL})`
}
