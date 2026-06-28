import { isTerminal } from '@pm-twin/lifecycle'
import type { Contract, Deal } from '@/types/domain.ts'
import type { DealRepository } from '@/repositories/deal-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import {
  canonicalDealStatus,
  resolveDealSyncTarget,
} from '@/services/contract-deal-sync-rules.ts'
import {
  canonicalOpportunityStatus,
  resolveOpportunitySyncTarget,
} from '@/services/deal-opportunity-sync-rules.ts'
import { findLifecycleTransitionPath } from '@/services/lifecycle-transition-path.ts'

const DEAL_ENTITY = 'deal' as const
const OPPORTUNITY_ENTITY = 'opportunity' as const

export type LifecycleOrchestratorDeps = {
  readonly dealRepository: DealRepository
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

export type OpportunitySyncRole = 'need' | 'offer'

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

type LinkedOpportunityIds = {
  readonly needOpportunityId: string | null
  readonly offerOpportunityId: string | null
}

function resolveLinkedOpportunityIds(
  deal: Deal,
  postMatchRepository?: PostMatchRepository,
): LinkedOpportunityIds {
  let needOpportunityId = deal.needOpportunityId?.trim() || null
  let offerOpportunityId = deal.offerOpportunityId?.trim() || null

  if ((!needOpportunityId || !offerOpportunityId) && postMatchRepository) {
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
      }
    }
  }

  return { needOpportunityId, offerOpportunityId }
}

function syncSingleOpportunity(
  opportunityRepository: OpportunityRepository,
  role: OpportunitySyncRole,
  opportunityId: string | null,
  targetStatus: string,
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
      errors: [`Missing ${role} opportunity id on deal`],
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

      const items: OpportunitySyncItemResult[] = [
        syncSingleOpportunity(
          deps.opportunityRepository,
          'need',
          linkedIds.needOpportunityId,
          targetStatus,
        ),
        syncSingleOpportunity(
          deps.opportunityRepository,
          'offer',
          linkedIds.offerOpportunityId,
          targetStatus,
        ),
      ]

      return {
        dealId,
        targetStatus,
        items,
      }
    },
  }
}

export type LifecycleOrchestrator = ReturnType<typeof createLifecycleOrchestrator>
