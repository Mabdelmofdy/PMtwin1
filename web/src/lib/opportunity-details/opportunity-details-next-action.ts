/**
 * Deterministic next-best-action for Opportunity Details.
 * Not AI — derived from lifecycle, readiness, and related-object state.
 */

import type { OpportunityMatchCard } from '@/lib/opportunity-matches-read-model.ts'
import type { OpportunityDetailsCapabilities } from './opportunity-details-actions.ts'

export type NextActionDescriptor = {
  readonly id: string
  readonly title: string
  readonly context: string
  readonly primaryLabel: string
  readonly href?: string
  readonly actionId?:
    | 'publish'
    | 'edit'
    | 'open_matching'
    | 'open_negotiation'
    | 'open_agreement'
    | 'open_contract'
    | 'open_marketplace'
    | 'close'
}

export function resolveOpportunityDetailsNextAction(input: {
  readonly capabilities: OpportunityDetailsCapabilities
  readonly opportunityId: string
  readonly isDraft: boolean
  readonly blockersCount: number
  readonly matchCount: number
  readonly topCard?: OpportunityMatchCard
  readonly showRecommendedActions: boolean
  readonly contractId?: string | null
  readonly opportunityStatus?: string
}): NextActionDescriptor | null {
  if (!input.showRecommendedActions) return null

  const { capabilities, topCard } = input
  const status = (input.opportunityStatus ?? '').toLowerCase()

  if (capabilities.canPublish) {
    return {
      id: 'publish',
      title: 'Publish opportunity',
      context: 'This draft meets publish requirements and can enter the marketplace.',
      primaryLabel: 'Publish',
      actionId: 'publish',
    }
  }

  if (input.isDraft && input.blockersCount > 0 && capabilities.canEdit) {
    return {
      id: 'complete-required',
      title: 'Complete required opportunity fields',
      context: `${input.blockersCount} required item${input.blockersCount === 1 ? '' : 's'} remaining before publish.`,
      primaryLabel: 'Edit opportunity',
      href: `/opportunities/${input.opportunityId}/edit`,
      actionId: 'edit',
    }
  }

  if (input.contractId) {
    return {
      id: 'open-contract',
      title: 'Open awarded contract',
      context: 'A contract is linked to this opportunity.',
      primaryLabel: 'Open contract',
      href: `/contracts/${input.contractId}`,
      actionId: 'open_contract',
    }
  }

  if (topCard) {
    const actions = topCard.actions
    if (actions.showViewNegotiation && actions.negotiationId) {
      return {
        id: 'continue-negotiation',
        title: 'Continue active negotiation',
        context: 'Terms are in progress — review or counter.',
        primaryLabel: 'Open negotiation',
        href: `/negotiations/${actions.negotiationId}`,
        actionId: 'open_negotiation',
      }
    }
    if (actions.showCreateDeal || actions.showViewDeal) {
      return {
        id: 'review-agreement',
        title: actions.showCreateDeal
          ? 'Create commercial agreement'
          : 'Review commercial agreement',
        context: 'Finalize commercial terms from the accepted negotiation.',
        primaryLabel: actions.dealId ? 'Open agreement' : 'Open match',
        href: actions.dealId
          ? `/commercial-agreements/${actions.dealId}`
          : topCard.detailPath,
        actionId: 'open_agreement',
      }
    }
    if (input.matchCount > 0 && capabilities.canOpenMatching) {
      return {
        id: 'review-matches',
        title: `Review ${input.matchCount} match${input.matchCount === 1 ? '' : 'es'}`,
        context: 'Compare compatibility and choose the next collaboration step.',
        primaryLabel: 'Open top match',
        href: topCard.detailPath,
        actionId: 'open_matching',
      }
    }
  }

  if (!input.isDraft && input.matchCount === 0 && capabilities.canOpenMatching) {
    return {
      id: 'await-matches',
      title: 'Awaiting matches',
      context: 'Matching runs after publish. Check back for discovered partners.',
      primaryLabel: 'Open matching',
      href: `/opportunities/${input.opportunityId}?workspace=matching`,
      actionId: 'open_matching',
    }
  }

  if (
    ['completed', 'closed'].includes(status) === false
    && capabilities.canClose
  ) {
    // Prefer edit over close when still actively collaborating
    if (['published', 'matched'].includes(status) && capabilities.canEdit) {
      return {
        id: 'edit',
        title: 'Review opportunity details',
        context: 'Update scope, commercial structure, or marketplace presentation.',
        primaryLabel: 'Edit',
        href: `/opportunities/${input.opportunityId}/edit`,
        actionId: 'edit',
      }
    }
  }

  if (capabilities.canEdit) {
    return {
      id: 'edit',
      title: 'Review opportunity details',
      context: 'Update scope, commercial structure, or marketplace presentation.',
      primaryLabel: 'Edit',
      href: `/opportunities/${input.opportunityId}/edit`,
      actionId: 'edit',
    }
  }

  return null
}
