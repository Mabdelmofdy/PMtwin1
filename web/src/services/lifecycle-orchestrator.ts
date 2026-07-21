import { isTerminal } from '@pm-twin/lifecycle'
import type { Contract, Deal, Negotiation, PostMatch } from '@/types/domain.ts'
import type { DealRepository } from '@/repositories/deal-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { collectPostMatchOpportunityIds } from '@/domain/normalized/post-match-strong-key.ts'
import {
  canonicalDealStatus,
  resolveDealSyncTarget,
} from '@/services/contract-deal-sync-rules.ts'
import {
  canonicalOpportunityStatus,
  resolveOpportunitySyncTarget,
  shouldSyncOpportunityFromCommercialAgreement,
} from '@/services/deal-opportunity-sync-rules.ts'
import { findLifecycleTransitionPath } from '@/services/lifecycle-transition-path.ts'

const DEAL_ENTITY = 'deal' as const
const OPPORTUNITY_ENTITY = 'opportunity' as const

export type LifecycleOrchestratorDeps = {
  readonly dealRepository?: DealRepository
  readonly opportunityRepository?: OpportunityRepository
  readonly postMatchRepository?: PostMatchRepository
}

export type LifecycleSyncResult = {
  readonly synced: boolean
  readonly skipped: boolean
  readonly dealId: string | null
  readonly previousStatus: string | null
  readonly targetStatus: string | null
  readonly appliedStatuses: readonly string[]
  readonly errors: readonly string[]
}

export type OpportunitySyncRole = 'need' | 'offer' | 'linked'

export type OpportunitySyncItemResult = {
  readonly role: OpportunitySyncRole
  readonly opportunityId: string | null
  readonly synced: boolean
  readonly skipped: boolean
  readonly previousStatus: string | null
  readonly targetStatus: string | null
  readonly appliedStatuses: readonly string[]
  readonly errors: readonly string[]
}

export type OpportunitiesSyncResult = {
  readonly dealId: string
  readonly targetStatus: string | null
  readonly items: readonly OpportunitySyncItemResult[]
}

export type OpportunityAdvanceResult = {
  readonly targetStatus: string
  readonly items: readonly OpportunitySyncItemResult[]
}

type LinkedOpportunityIds = {
  readonly needOpportunityId: string | null
  readonly offerOpportunityId: string | null
  readonly opportunityIds: readonly string[]
}

type AdvanceOptions = {
  /** When true (default for CA late sync), skip visibilityStatus published. */
  readonly respectVisibilityGate?: boolean
  /** When set, only advance from these canonical statuses (policy B early sync). */
  readonly allowedFromStatuses?: ReadonlySet<string>
}

const POLICY_B_MATCHED_FROM = new Set(['published'])
const POLICY_B_NEGOTIATING_FROM = new Set(['published', 'matched'])
const POLICY_B_CONTRACTED_FROM = new Set([
  'published',
  'matched',
  'negotiating',
])

function uniqueIds(ids: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    const trimmed = id?.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

function resolveLinkedOpportunityIds(
  deal: Deal,
  postMatchRepository?: PostMatchRepository,
): LinkedOpportunityIds {
  let needOpportunityId = deal.needOpportunityId?.trim() || null
  let offerOpportunityId = deal.offerOpportunityId?.trim() || null
  const fromDeal = uniqueIds([
    ...(deal.opportunityIds ?? []),
    deal.opportunityId,
    needOpportunityId,
    offerOpportunityId,
  ])

  let fromPostMatch: string[] = []
  if (postMatchRepository) {
    const postMatchId = deal.postMatchId ?? deal.matchId ?? undefined
    if (postMatchId) {
      const postMatch = postMatchRepository.getById(postMatchId)
      if (postMatch) {
        needOpportunityId =
          needOpportunityId ??
          postMatch.needOpportunityId?.trim() ??
          postMatch.payload?.needOpportunityId?.trim() ??
          null
        offerOpportunityId =
          offerOpportunityId ??
          postMatch.offerOpportunityId?.trim() ??
          postMatch.payload?.offerOpportunityId?.trim() ??
          null
        fromPostMatch = collectPostMatchOpportunityIds(postMatch)
      }
    }
  }

  return {
    needOpportunityId,
    offerOpportunityId,
    opportunityIds: uniqueIds([
      ...fromDeal,
      ...fromPostMatch,
      needOpportunityId,
      offerOpportunityId,
    ]),
  }
}

function resolvePostMatchLinkedIds(postMatch: PostMatch): string[] {
  return uniqueIds([
    ...collectPostMatchOpportunityIds(postMatch),
    ...(postMatch.participants ?? []).map((p) => p.opportunityId),
  ])
}

function resolveNegotiationLinkedIds(
  negotiation: Negotiation,
  postMatchRepository?: PostMatchRepository,
): string[] {
  const fromNegotiation = uniqueIds([
    ...(negotiation.opportunityIds ?? []),
    negotiation.opportunityId,
    negotiation.needOpportunityId,
    negotiation.offerOpportunityId,
  ])

  if (fromNegotiation.length >= 2 || !postMatchRepository) {
    return fromNegotiation
  }

  const postMatchId = negotiation.postMatchId ?? negotiation.matchId
  if (!postMatchId) return fromNegotiation
  const postMatch = postMatchRepository.getById(postMatchId)
  if (!postMatch) return fromNegotiation
  return uniqueIds([...fromNegotiation, ...resolvePostMatchLinkedIds(postMatch)])
}

function syncSingleOpportunity(
  opportunityRepository: OpportunityRepository,
  role: OpportunitySyncRole,
  opportunityId: string | null,
  targetStatus: string,
  options: AdvanceOptions = {},
): OpportunitySyncItemResult {
  if (!opportunityId) {
    return {
      role,
      opportunityId: null,
      synced: false,
      skipped: false,
      previousStatus: null,
      targetStatus,
      appliedStatuses: [],
      errors: [`Missing ${role} opportunity id`],
    }
  }

  const opportunity = opportunityRepository.getById(opportunityId)
  if (!opportunity) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: false,
      previousStatus: null,
      targetStatus,
      appliedStatuses: [],
      errors: [`Opportunity "${opportunityId}" not found for ${role} sync`],
    }
  }

  const previousCanonical = canonicalOpportunityStatus(opportunity.status)
  const respectVisibilityGate = options.respectVisibilityGate !== false
  if (
    respectVisibilityGate &&
    !shouldSyncOpportunityFromCommercialAgreement({
      visibilityStatus: opportunity.visibilityStatus,
    })
  ) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: true,
      previousStatus: opportunity.status ?? null,
      targetStatus,
      appliedStatuses: [],
      errors: [],
    }
  }
  if (previousCanonical === targetStatus) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: true,
      previousStatus: opportunity.status ?? null,
      targetStatus,
      appliedStatuses: [],
      errors: [],
    }
  }

  if (
    options.allowedFromStatuses &&
    !options.allowedFromStatuses.has(previousCanonical)
  ) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: false,
      previousStatus: opportunity.status ?? null,
      targetStatus,
      appliedStatuses: [],
      errors: [
        `Opportunity "${opportunityId}" status "${previousCanonical || opportunity.status}" cannot advance to "${targetStatus}"`,
      ],
    }
  }

  if (
    isTerminal(OPPORTUNITY_ENTITY, opportunity.status) &&
    previousCanonical !== targetStatus
  ) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: true,
      previousStatus: opportunity.status ?? null,
      targetStatus,
      appliedStatuses: [],
      errors: [],
    }
  }

  const path = findLifecycleTransitionPath(
    OPPORTUNITY_ENTITY,
    opportunity.status ?? '',
    targetStatus,
  )
  if (!path) {
    return {
      role,
      opportunityId,
      synced: false,
      skipped: false,
      previousStatus: opportunity.status ?? null,
      targetStatus,
      appliedStatuses: [],
      errors: [
        `No allowed Opportunity transition path from "${previousCanonical || opportunity.status}" to "${targetStatus}"`,
      ],
    }
  }

  for (const status of path) {
    opportunityRepository.update(opportunityId, { status })
  }

  return {
    role,
    opportunityId,
    synced: true,
    skipped: false,
    previousStatus: opportunity.status ?? null,
    targetStatus,
    appliedStatuses: path,
    errors: [],
  }
}

function advanceOpportunityIds(
  opportunityRepository: OpportunityRepository | undefined,
  opportunityIds: readonly string[],
  targetStatus: string,
  options: AdvanceOptions,
): OpportunityAdvanceResult {
  if (!opportunityRepository) {
    return { targetStatus, items: [] }
  }

  const items = opportunityIds.map((opportunityId) =>
    syncSingleOpportunity(
      opportunityRepository,
      'linked',
      opportunityId,
      targetStatus,
      options,
    ),
  )

  return { targetStatus, items }
}

function safeAdvance(
  run: () => OpportunityAdvanceResult,
): OpportunityAdvanceResult {
  try {
    return run()
  } catch {
    return { targetStatus: '', items: [] }
  }
}

export function createLifecycleOrchestrator(deps: LifecycleOrchestratorDeps) {
  return {
    syncDealFromContract(contract: Contract): LifecycleSyncResult {
      const dealId = contract.dealId?.trim()
      if (!dealId) {
        return {
          synced: false,
          skipped: true,
          dealId: null,
          previousStatus: null,
          targetStatus: null,
          appliedStatuses: [],
          errors: [],
        }
      }

      if (!deps.dealRepository) {
        return {
          synced: false,
          skipped: true,
          dealId,
          previousStatus: null,
          targetStatus: null,
          appliedStatuses: [],
          errors: [],
        }
      }

      const targetStatus = resolveDealSyncTarget(contract.status)
      if (!targetStatus) {
        return {
          synced: false,
          skipped: true,
          dealId,
          previousStatus: null,
          targetStatus: null,
          appliedStatuses: [],
          errors: [],
        }
      }

      const deal = deps.dealRepository.getById(dealId)
      if (!deal) {
        return {
          synced: false,
          skipped: false,
          dealId,
          previousStatus: null,
          targetStatus,
          appliedStatuses: [],
          errors: [`Deal "${dealId}" not found for contract sync`],
        }
      }

      const previousCanonical = canonicalDealStatus(deal.status)
      if (previousCanonical === targetStatus) {
        return {
          synced: false,
          skipped: true,
          dealId,
          previousStatus: deal.status ?? null,
          targetStatus,
          appliedStatuses: [],
          errors: [],
        }
      }

      const path = findLifecycleTransitionPath(
        DEAL_ENTITY,
        deal.status ?? '',
        targetStatus,
      )
      if (!path) {
        return {
          synced: false,
          skipped: false,
          dealId,
          previousStatus: deal.status ?? null,
          targetStatus,
          appliedStatuses: [],
          errors: [
            `No allowed Deal transition path from "${previousCanonical || deal.status}" to "${targetStatus}"`,
          ],
        }
      }

      for (const status of path) {
        deps.dealRepository.update(dealId, { status })
      }

      return {
        synced: true,
        skipped: false,
        dealId,
        previousStatus: deal.status ?? null,
        targetStatus,
        appliedStatuses: path,
        errors: [],
      }
    },

    syncOpportunitiesFromDeal(deal: Deal): OpportunitiesSyncResult {
      const dealId = deal.id?.trim()
      if (!dealId) {
        return {
          dealId: '',
          targetStatus: null,
          items: [],
        }
      }

      const targetStatus = resolveOpportunitySyncTarget(deal.status)
      if (!targetStatus) {
        return {
          dealId,
          targetStatus: null,
          items: [],
        }
      }

      if (!deps.opportunityRepository) {
        return {
          dealId,
          targetStatus,
          items: [],
        }
      }

      const linkedIds = resolveLinkedOpportunityIds(
        deal,
        deps.postMatchRepository,
      )

      const needId = linkedIds.needOpportunityId
      const offerId = linkedIds.offerOpportunityId
      const remaining = linkedIds.opportunityIds.filter(
        (id) => id !== needId && id !== offerId,
      )

      const items: OpportunitySyncItemResult[] = [
        syncSingleOpportunity(
          deps.opportunityRepository,
          'need',
          needId,
          targetStatus,
        ),
        syncSingleOpportunity(
          deps.opportunityRepository,
          'offer',
          offerId,
          targetStatus,
        ),
        ...remaining.map((opportunityId) =>
          syncSingleOpportunity(
            deps.opportunityRepository!,
            'linked',
            opportunityId,
            targetStatus,
          ),
        ),
      ]

      return {
        dealId,
        targetStatus,
        items,
      }
    },

    /** Policy B: PostMatch confirmed → linked opportunities `matched`. */
    syncOpportunitiesFromConfirmedPostMatch(
      postMatch: PostMatch,
    ): OpportunityAdvanceResult {
      return safeAdvance(() =>
        advanceOpportunityIds(
          deps.opportunityRepository,
          resolvePostMatchLinkedIds(postMatch),
          'matched',
          {
            respectVisibilityGate: false,
            allowedFromStatuses: POLICY_B_MATCHED_FROM,
          },
        ),
      )
    },

    /** Policy B: Negotiation started → linked opportunities `negotiating`. */
    syncOpportunitiesFromNegotiationStarted(
      negotiation: Negotiation,
    ): OpportunityAdvanceResult {
      return safeAdvance(() =>
        advanceOpportunityIds(
          deps.opportunityRepository,
          resolveNegotiationLinkedIds(negotiation, deps.postMatchRepository),
          'negotiating',
          {
            respectVisibilityGate: false,
            allowedFromStatuses: POLICY_B_NEGOTIATING_FROM,
          },
        ),
      )
    },

    /** Policy B: Deal/CA created → linked opportunities `contracted`. */
    syncOpportunitiesFromDealCreated(deal: Deal): OpportunityAdvanceResult {
      return safeAdvance(() => {
        const linked = resolveLinkedOpportunityIds(
          deal,
          deps.postMatchRepository,
        )
        return advanceOpportunityIds(
          deps.opportunityRepository,
          linked.opportunityIds,
          'contracted',
          {
            respectVisibilityGate: false,
            allowedFromStatuses: POLICY_B_CONTRACTED_FROM,
          },
        )
      })
    },
  }
}

export type LifecycleOrchestrator = ReturnType<typeof createLifecycleOrchestrator>
