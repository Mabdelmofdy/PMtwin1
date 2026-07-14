import type { Opportunity } from '@/types/domain.ts'
import {
  resolveOpportunityOwnershipScope,
  type OpportunityOwnershipScope,
} from '@/components/opportunity/opportunity-display'
import {
  filterOpportunitiesForListScope,
  isDraftOpportunity,
  type ViewerContext,
} from '@/lib/entity-view-visibility.ts'

export type ProductDomain = 'marketplace' | 'workspace'

/** Primary opportunity list segmentation — presentation only. */
export type OpportunityOwnershipFilter = OpportunityOwnershipScope

export type MatchPresentationView = 'mine' | 'marketplace' | 'recommended'

export type ProductNavState = {
  readonly domain?: ProductDomain
  readonly ownershipScope?: OpportunityOwnershipFilter
  readonly peopleScope?: 'all' | 'people' | 'companies'
  readonly matchView?: MatchPresentationView
}

export function readProductNavState(state: unknown): ProductNavState | undefined {
  if (!state || typeof state !== 'object') return undefined
  return state as ProductNavState
}

export function resolveDefaultOpportunityOwnershipFilter(
  navState: ProductNavState | undefined,
): OpportunityOwnershipFilter {
  if (navState?.ownershipScope) return navState.ownershipScope
  if (navState?.domain === 'workspace') return 'mine'
  return 'marketplace'
}

export function resolveDefaultMatchView(
  navState: ProductNavState | undefined,
): MatchPresentationView {
  if (navState?.matchView) return navState.matchView
  if (navState?.domain === 'workspace') return 'mine'
  return 'mine'
}

/** Client-side ownership filter — uses existing ownership resolution only. */
export function filterOpportunitiesByOwnershipFilter(
  opportunities: readonly Opportunity[],
  viewer: ViewerContext,
  filter: OpportunityOwnershipFilter,
  resolveCreatorOrganizationId: (creatorId: string) => string | undefined,
  viewerOrganizationId?: string | null,
): Opportunity[] {
  const listScope = filter === 'mine' ? 'mine' : 'all'
  const scoped = filterOpportunitiesForListScope(opportunities, viewer, listScope)

  return scoped.filter((opportunity) => {
    // Defense in depth: marketplace and company tabs never surface private drafts.
    if (filter !== 'mine' && isDraftOpportunity(opportunity)) {
      return false
    }
    const ownership = resolveOpportunityOwnershipScope({
      opportunity,
      viewerUserId: viewer.userId,
      viewerWorkspaceId: viewer.activeWorkspaceId,
      viewerPartyId: viewer.activePartyId,
      viewerOrganizationId,
      creatorOrganizationId: opportunity.creatorId
        ? resolveCreatorOrganizationId(opportunity.creatorId)
        : undefined,
    })
    return ownership === filter
  })
}

export const OPPORTUNITY_OWNERSHIP_FILTER_LABELS: Record<OpportunityOwnershipFilter, string> = {
  marketplace: 'All Marketplace',
  mine: 'My Opportunities',
  company: 'Company Opportunities',
}

export const MATCH_VIEW_LABELS: Record<MatchPresentationView, string> = {
  mine: 'My Matches',
  marketplace: 'Marketplace Matches',
  recommended: 'Recommended Matches',
}

/** Marketplace browse is viewer-scoped today — show tab as preview only. */
export const MATCH_MARKETPLACE_VIEW_AVAILABLE = false
