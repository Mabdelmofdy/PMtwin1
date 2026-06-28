import {
  normalizeApplication,
  normalizeCompany,
  normalizeContract,
  normalizeDeal,
  normalizeNegotiation,
  normalizePostMatch,
  normalizeUser,
} from '@/domain/normalized/adapters.ts'
import type {
  NormalizedApplication,
  NormalizedCompany,
  NormalizedContract,
  NormalizedDeal,
  NormalizedMatch,
  NormalizedNegotiation,
  NormalizedUser,
} from '@/domain/normalized/types.ts'
import {
  applicationRepository,
  companyRepository,
  contractRepository,
  dealRepository,
  negotiationRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'

export type ActorReference = {
  id: string
  kind: 'user' | 'company'
  entity: NormalizedUser | NormalizedCompany
}

export type DealChain = {
  deal: NormalizedDeal | null
  negotiation: NormalizedNegotiation | null
  match: NormalizedMatch | null
  application: NormalizedApplication | null
  contract: NormalizedContract | null
  opportunityIds: string[]
}

/**
 * Resolve a polymorphic actor ID against users first, then companies.
 * Never throws — returns null when not found or id is empty.
 */
export function resolveUserReference(id: string | undefined | null): NormalizedUser | null {
  if (!id || typeof id !== 'string') return null
  try {
    const raw = userRepository.getById(id)
    if (!raw) return null
    const normalized = normalizeUser(raw)
    return normalized.id ? normalized : null
  } catch {
    return null
  }
}

/**
 * Resolve a company account by ID.
 * Never throws — returns null when not found or id is empty.
 */
export function resolveCompanyReference(
  id: string | undefined | null,
): NormalizedCompany | null {
  if (!id || typeof id !== 'string') return null
  try {
    const raw = companyRepository.getById(id)
    if (!raw) return null
    const normalized = normalizeCompany(raw)
    return normalized.id ? normalized : null
  } catch {
    return null
  }
}

/**
 * Resolve polymorphic creator/applicant ID — tries user, then company.
 * Never throws.
 */
export function resolveActorReference(
  id: string | undefined | null,
): ActorReference | null {
  if (!id || typeof id !== 'string') return null
  const user = resolveUserReference(id)
  if (user) return { id, kind: 'user', entity: user }
  const company = resolveCompanyReference(id)
  if (company) return { id, kind: 'company', entity: company }
  return null
}

/**
 * Walk the deal relationship chain from a deal ID (or partial chain from any linked id).
 * All lookups are null-safe; missing links return null without throwing.
 */
export function resolveDealChain(dealId: string | undefined | null): DealChain {
  const empty: DealChain = {
    deal: null,
    negotiation: null,
    match: null,
    application: null,
    contract: null,
    opportunityIds: [],
  }

  if (!dealId || typeof dealId !== 'string') return empty

  try {
    const rawDeal = dealRepository.getById(dealId)
    if (!rawDeal) return empty

    const deal = normalizeDeal(rawDeal)
    const opportunityIds = new Set<string>()
    if (deal.opportunityId) opportunityIds.add(deal.opportunityId)
    for (const oid of deal.opportunityIds ?? []) {
      if (oid) opportunityIds.add(oid)
    }

    let negotiation: NormalizedNegotiation | null = null
    if (deal.negotiationId) {
      const rawNeg = negotiationRepository.getById(deal.negotiationId)
      if (rawNeg) negotiation = normalizeNegotiation(rawNeg)
    }

    let match: NormalizedMatch | null = null
    const matchId = deal.matchId ?? undefined
    if (matchId) {
      const rawMatch = postMatchRepository.getById(matchId)
      if (rawMatch) match = normalizePostMatch(rawMatch)
    }

    let application: NormalizedApplication | null = null
    if (deal.applicationId) {
      const rawApp = applicationRepository.getById(deal.applicationId)
      if (rawApp) application = normalizeApplication(rawApp)
    }

    let contract: NormalizedContract | null = null
    if (deal.contractId) {
      const rawContract = contractRepository.getById(deal.contractId)
      if (rawContract) contract = normalizeContract(rawContract)
    } else {
      const contracts = contractRepository.getAll()
      const linked = contracts.find((c) => c.dealId === deal.id)
      if (linked) contract = normalizeContract(linked)
    }

    if (match?.needOpportunityId) {
      opportunityIds.add(match.needOpportunityId)
    } else if (match?.payload?.needOpportunityId) {
      opportunityIds.add(match.payload.needOpportunityId)
    }
    if (match?.offerOpportunityId) {
      opportunityIds.add(match.offerOpportunityId)
    } else if (match?.payload?.offerOpportunityId) {
      opportunityIds.add(match.payload.offerOpportunityId)
    }
    if (negotiation?.opportunityId) opportunityIds.add(negotiation.opportunityId)
    if (application?.opportunityId) opportunityIds.add(application.opportunityId)
    if (contract?.opportunityId) opportunityIds.add(contract.opportunityId)
    for (const oid of contract?.opportunityIds ?? []) {
      if (oid) opportunityIds.add(oid)
    }

    return {
      deal,
      negotiation,
      match,
      application,
      contract,
      opportunityIds: Array.from(opportunityIds),
    }
  } catch {
    return empty
  }
}
