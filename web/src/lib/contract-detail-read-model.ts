import type {
  Contract,
  Deal,
  Negotiation,
  Opportunity,
} from '@/types/domain.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import { isTerminal, toCanonical } from '@pm-twin/lifecycle'
import {
  formatCanonicalStatusLabel,
  resolveCanonicalStatus,
} from '@/lib/status-display.ts'

export type ContractDetailLink = {
  readonly label: string
  readonly path: string
}

export type ContractPartyView = {
  readonly userId: string
  readonly role: string
  readonly displayName: string
  readonly signedAt: string | null
  readonly signatureState: 'signed' | 'pending'
}

export type ContractMilestoneView = {
  readonly id?: string
  readonly title: string
  readonly dueDate?: string
  readonly status?: string
}

export type ContractDetailReadModel = {
  readonly contract: Contract
  readonly contractId: string
  readonly status: string
  readonly canonicalStatus: string
  readonly statusLabel: string
  readonly dealId: string
  readonly postMatchId: string | null
  readonly negotiationId: string | null
  readonly needOpportunityId: string | null
  readonly offerOpportunityId: string | null
  readonly parties: readonly ContractPartyView[]
  readonly scope: string | null
  readonly milestones: readonly ContractMilestoneView[]
  readonly dealTitle: string | null
  readonly dealStatus: string | null
  readonly dealCanonicalStatus: string | null
  readonly dealStatusLabel: string | null
  readonly needTitle: string | null
  readonly needOpportunityStatus: string | null
  readonly needOpportunityCanonicalStatus: string | null
  readonly needOpportunityStatusLabel: string | null
  readonly offerTitle: string | null
  readonly offerOpportunityStatus: string | null
  readonly offerOpportunityCanonicalStatus: string | null
  readonly offerOpportunityStatusLabel: string | null
  readonly links: {
    readonly deal: ContractDetailLink | null
    readonly match: ContractDetailLink | null
    readonly negotiation: ContractDetailLink | null
    readonly needOpportunity: ContractDetailLink | null
    readonly offerOpportunity: ContractDetailLink | null
  }
  readonly canSign: boolean
  readonly canComplete: boolean
  readonly canTerminate: boolean
}

export type ContractDetailReadModelDeps = {
  readonly getContract: (id: string) => Contract | undefined
  readonly getDeal: (id: string) => Deal | undefined
  readonly getNegotiation: (id: string) => Negotiation | undefined
  readonly getOpportunity: (id: string) => Opportunity | undefined
  readonly getPersonName?: (userId: string) => string | undefined
}

const MISSING_LINK_LABEL = 'Unavailable'
const MISSING_TITLE_FALLBACK = 'Linked record unavailable'
const CONTRACT_ENTITY = 'contract' as const

const SIGNABLE_CONTRACT_STATUSES = new Set(['draft', 'pending_signature'])
const TERMINABLE_CONTRACT_STATUSES = new Set([
  'draft',
  'pending_signature',
  'active',
])

/** Phase 7.4+ — activate remains disabled until wired. */
export const CONTRACT_DETAIL_MUTATION_ACTIONS = {
  activate: false,
} as const

export type ContractDetailMutationVisibility = {
  readonly canSign?: boolean
  readonly canComplete?: boolean
  readonly canTerminate?: boolean
}

export function contractDetailShowsMutationActions(
  actions: ContractDetailMutationVisibility = {},
): boolean {
  return (
    Boolean(actions.canSign) ||
    Boolean(actions.canComplete) ||
    Boolean(actions.canTerminate) ||
    CONTRACT_DETAIL_MUTATION_ACTIONS.activate
  )
}

export function canCompleteContract(
  contract: Contract | null | undefined,
): boolean {
  if (!contract?.id) return false
  if (isTerminal(CONTRACT_ENTITY, contract.status)) return false
  return toCanonical(CONTRACT_ENTITY, contract.status ?? '') === 'active'
}

export function canTerminateContract(
  contract: Contract | null | undefined,
): boolean {
  if (!contract?.id) return false
  if (isTerminal(CONTRACT_ENTITY, contract.status)) return false
  const status = toCanonical(CONTRACT_ENTITY, contract.status ?? '')
  return TERMINABLE_CONTRACT_STATUSES.has(status)
}

export function canSignContract(
  contract: Contract | null | undefined,
  currentUserId: string | null | undefined,
): boolean {
  if (!contract?.id || !currentUserId?.trim()) return false
  if (isTerminal(CONTRACT_ENTITY, contract.status)) return false

  const status = toCanonical(CONTRACT_ENTITY, contract.status ?? '')
  if (!SIGNABLE_CONTRACT_STATUSES.has(status)) return false

  const participants = normalizeParticipants(
    contract.participants,
    contract.parties,
  )
  const party = participants.find(
    (participant) => participant.userId === currentUserId,
  )
  if (!party) return false
  if (party.signedAt) return false

  return true
}

export function resolveContractPostMatchId(contract: Contract): string | null {
  return contract.matchId ?? null
}

export function resolveContractNegotiationId(
  contract: Contract,
  deal?: Deal | null,
): string | null {
  return contract.negotiationId ?? deal?.negotiationId ?? null
}

export function resolveContractNeedOpportunityId(
  contract: Contract,
  deal?: Deal | null,
): string | null {
  return (
    deal?.needOpportunityId ??
    contract.opportunityId ??
    contract.opportunityIds?.[0] ??
    null
  )
}

export function resolveContractOfferOpportunityId(
  contract: Contract,
  deal?: Deal | null,
): string | null {
  return deal?.offerOpportunityId ?? contract.opportunityIds?.[1] ?? null
}

export function resolveContractMilestones(
  snapshot: unknown,
): readonly ContractMilestoneView[] {
  if (!Array.isArray(snapshot)) return []
  return snapshot
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object'),
    )
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : 'Milestone',
      dueDate: typeof item.dueDate === 'string' ? item.dueDate : undefined,
      status: typeof item.status === 'string' ? item.status : undefined,
    }))
}

function resolvePartyDisplayName(
  userId: string,
  deps: ContractDetailReadModelDeps,
): string {
  const name = deps.getPersonName?.(userId)
  return name?.trim() ? name : userId
}

function resolveLinkedOpportunityView(
  recordId: string | null | undefined,
  deps: ContractDetailReadModelDeps,
): {
  readonly title: string | null
  readonly status: string | null
  readonly canonicalStatus: string | null
  readonly statusLabel: string | null
} {
  if (!recordId) {
    return {
      title: null,
      status: null,
      canonicalStatus: null,
      statusLabel: null,
    }
  }

  const opportunity = deps.getOpportunity(recordId)
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

function resolveDealTitle(deal: Deal | undefined): string | null {
  if (!deal) return MISSING_TITLE_FALLBACK
  return deal.title ?? MISSING_TITLE_FALLBACK
}

export type BuildContractDetailReadModelOptions = {
  readonly currentUserId?: string | null
}

export function buildContractDetailReadModel(
  contractId: string,
  deps: ContractDetailReadModelDeps,
  options?: BuildContractDetailReadModelOptions,
): ContractDetailReadModel | null {
  const contract = deps.getContract(contractId)
  if (!contract) return null

  const deal = contract.dealId ? deps.getDeal(contract.dealId) : undefined
  const postMatchId = resolveContractPostMatchId(contract)
  const negotiationId = resolveContractNegotiationId(contract, deal)
  const needOpportunityId = resolveContractNeedOpportunityId(contract, deal)
  const offerOpportunityId = resolveContractOfferOpportunityId(contract, deal)
  const needOpportunity = resolveLinkedOpportunityView(needOpportunityId, deps)
  const offerOpportunity = resolveLinkedOpportunityView(offerOpportunityId, deps)

  const parties = normalizeParticipants(
    contract.participants,
    contract.parties,
  ).map((party) => ({
    userId: party.userId,
    role: party.role,
    displayName: resolvePartyDisplayName(party.userId, deps),
    signedAt: party.signedAt ?? null,
    signatureState: party.signedAt ? ('signed' as const) : ('pending' as const),
  }))

  return {
    contract,
    contractId: contract.id,
    status: contract.status,
    canonicalStatus: resolveCanonicalStatus(CONTRACT_ENTITY, contract.status),
    statusLabel: formatCanonicalStatusLabel(CONTRACT_ENTITY, contract.status),
    dealId: contract.dealId,
    postMatchId,
    negotiationId,
    needOpportunityId,
    offerOpportunityId,
    parties,
    scope: contract.scope ?? null,
    milestones: resolveContractMilestones(contract.milestonesSnapshot),
    dealTitle: contract.dealId ? resolveDealTitle(deal) : null,
    dealStatus: deal?.status ?? null,
    dealCanonicalStatus: deal?.status
      ? resolveCanonicalStatus('deal', deal.status)
      : null,
    dealStatusLabel: deal?.status
      ? formatCanonicalStatusLabel('deal', deal.status)
      : null,
    needTitle: needOpportunity.title,
    needOpportunityStatus: needOpportunity.status,
    needOpportunityCanonicalStatus: needOpportunity.canonicalStatus,
    needOpportunityStatusLabel: needOpportunity.statusLabel,
    offerTitle: offerOpportunity.title,
    offerOpportunityStatus: offerOpportunity.status,
    offerOpportunityCanonicalStatus: offerOpportunity.canonicalStatus,
    offerOpportunityStatusLabel: offerOpportunity.statusLabel,
    links: {
      deal: contract.dealId
        ? { label: 'Back to Deal', path: `/deals/${contract.dealId}` }
        : null,
      match: postMatchId
        ? { label: 'Back to Match', path: `/matches/${postMatchId}` }
        : null,
      negotiation: negotiationId
        ? { label: 'Back to Negotiation', path: `/negotiations/${negotiationId}` }
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
    canSign: canSignContract(contract, options?.currentUserId),
    canComplete: canCompleteContract(contract),
    canTerminate: canTerminateContract(contract),
  }
}

export function contractDetailLinkFallbackLabel(label: string): string {
  return `${label} (${MISSING_LINK_LABEL})`
}
