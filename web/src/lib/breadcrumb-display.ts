/**
 * Breadcrumb segment labels — resolve entity IDs to business titles.
 */

import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { routeLabels } from '@/config/navigation'
import {
  formatContractDisplayTitle,
  formatDealDisplayTitleWithOpportunities,
  formatNegotiationDisplayTitle,
  formatOpportunityDisplayTitle,
} from '@/lib/entity-display-titles.ts'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import { resolvePersonDisplayName } from '@/components/user/user-display'

const ENTITY_PARENT_SEGMENTS = new Set([
  'opportunities',
  'matches',
  'negotiations',
  'deals',
  'commercial-agreements',
  'contracts',
  'people',
  'users',
  'messages',
])

function looksLikeEntityId(segment: string): boolean {
  return segment.length > 8 || segment.includes('-')
}

export function resolveBreadcrumbSegmentLabel(
  segment: string,
  parentSegment?: string,
): string {
  if (routeLabels[segment]) {
    return routeLabels[segment]
  }

  if (!parentSegment || !ENTITY_PARENT_SEGMENTS.has(parentSegment)) {
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (!looksLikeEntityId(segment)) {
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const getOpportunity = (id: string) => opportunitiesApi.get(id)

  switch (parentSegment) {
    case 'opportunities':
      return formatOpportunityDisplayTitle(getOpportunity(segment))
    case 'matches': {
      const match = matchesApi.get(segment)
      return match ? formatMatchDisplayTitle(match, getOpportunity) : 'Match'
    }
    case 'negotiations': {
      const negotiation = negotiationsApi.get(segment)
      return negotiation
        ? formatNegotiationDisplayTitle(negotiation, getOpportunity)
        : 'Negotiation'
    }
    case 'deals':
    case 'commercial-agreements':
      return formatDealDisplayTitleWithOpportunities(dealsApi.get(segment), getOpportunity)
    case 'contracts': {
      const contract = contractsApi.get(segment)
      if (!contract) return 'Contract'
      const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
      return formatContractDisplayTitle({
        dealTitle: deal?.title,
        needTitle: deal?.needOpportunityId
          ? getOpportunity(deal.needOpportunityId)?.title
          : null,
        offerTitle: deal?.offerOpportunityId
          ? getOpportunity(deal.offerOpportunityId)?.title
          : null,
      })
    }
    case 'people':
    case 'users': {
      const person = peopleApi.get(segment)
      return person ? resolvePersonDisplayName(person) : 'Profile'
    }
    case 'messages':
      return 'Conversation'
    default:
      return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

export function buildBreadcrumbLabels(pathname: string): Array<{
  label: string
  href: string
  isCurrent: boolean
}> {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/dashboard', isCurrent: true }]
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const parentSegment = index > 0 ? segments[index - 1] : undefined
    return {
      label: resolveBreadcrumbSegmentLabel(segment, parentSegment),
      href,
      isCurrent: index === segments.length - 1,
    }
  })
}
