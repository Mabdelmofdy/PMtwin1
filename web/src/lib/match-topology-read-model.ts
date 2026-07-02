import {
  formatFrameworkMatchTypeLabel,
  formatFrameworkMatchTypeSubtitle,
  resolveMatchingModelKey,
  type MatchingModelKey,
} from '@/config/need-offer-framework.ts'
import { formatOpportunityDisplayTitle } from '@/lib/entity-display-titles.ts'
import type { Opportunity, PostMatch } from '@/types/domain.ts'

export type MatchTopologyNodeKind = 'need' | 'offer' | 'participant' | 'role'

export type MatchTopologyNode = {
  readonly id: string
  readonly label: string
  readonly kind: MatchTopologyNodeKind
  readonly href?: string
  readonly subtitle?: string
}

export type MatchTopologyEdge = {
  readonly fromId: string
  readonly toId: string
  readonly label?: string
  readonly bidirectional?: boolean
}

export type MatchTopologyReadModel = {
  readonly topology: MatchingModelKey
  readonly frameworkLabel: string
  readonly frameworkSubtitle: string
  readonly nodes: readonly MatchTopologyNode[]
  readonly edges: readonly MatchTopologyEdge[]
}

export type OpportunityLookup = (opportunityId: string) => Opportunity | undefined

function oppTitle(id: string | undefined, lookup: OpportunityLookup): string {
  if (!id) return 'Untitled'
  return formatOpportunityDisplayTitle(lookup(id))
}

function buildOneWayTopology(
  match: PostMatch,
  lookup: OpportunityLookup,
): MatchTopologyReadModel {
  const needId = match.needOpportunityId ?? match.payload?.needOpportunityId
  const offerId = match.offerOpportunityId ?? match.payload?.offerOpportunityId

  const nodes: MatchTopologyNode[] = [
    {
      id: 'need',
      label: oppTitle(needId, lookup),
      kind: 'need',
      href: needId ? `/opportunities/${needId}` : undefined,
      subtitle: 'Need',
    },
    {
      id: 'offer',
      label: oppTitle(offerId, lookup),
      kind: 'offer',
      href: offerId ? `/opportunities/${offerId}` : undefined,
      subtitle: 'Offer',
    },
  ]

  return {
    topology: 'one_way',
    frameworkLabel: formatFrameworkMatchTypeLabel('one_way'),
    frameworkSubtitle: formatFrameworkMatchTypeSubtitle('one_way'),
    nodes,
    edges: [{ fromId: 'need', toId: 'offer', label: 'matches' }],
  }
}

function buildTwoWayTopology(
  match: PostMatch,
  lookup: OpportunityLookup,
): MatchTopologyReadModel {
  const sideA = match.payload?.sideA
  const sideB = match.payload?.sideB

  const nodes: MatchTopologyNode[] = [
    {
      id: 'a-need',
      label: oppTitle(sideA?.needId, lookup),
      kind: 'need',
      href: sideA?.needId ? `/opportunities/${sideA.needId}` : undefined,
      subtitle: 'A Need',
    },
    {
      id: 'b-offer',
      label: oppTitle(sideB?.offerId, lookup),
      kind: 'offer',
      href: sideB?.offerId ? `/opportunities/${sideB.offerId}` : undefined,
      subtitle: 'B Offer',
    },
    {
      id: 'b-need',
      label: oppTitle(sideB?.needId, lookup),
      kind: 'need',
      href: sideB?.needId ? `/opportunities/${sideB.needId}` : undefined,
      subtitle: 'B Need',
    },
    {
      id: 'a-offer',
      label: oppTitle(sideA?.offerId, lookup),
      kind: 'offer',
      href: sideA?.offerId ? `/opportunities/${sideA.offerId}` : undefined,
      subtitle: 'A Offer',
    },
  ]

  return {
    topology: 'two_way',
    frameworkLabel: formatFrameworkMatchTypeLabel('two_way'),
    frameworkSubtitle: formatFrameworkMatchTypeSubtitle('two_way'),
    nodes,
    edges: [
      { fromId: 'a-need', toId: 'b-offer', label: 'A Need ↔ B Offer', bidirectional: true },
      { fromId: 'b-need', toId: 'a-offer', label: 'B Need ↔ A Offer', bidirectional: true },
    ],
  }
}

function buildConsortiumTopology(
  match: PostMatch,
  lookup: OpportunityLookup,
): MatchTopologyReadModel {
  const leadId = match.payload?.leadNeedId
  const roles = match.payload?.roles ?? []

  const nodes: MatchTopologyNode[] = [
    {
      id: 'lead-need',
      label: oppTitle(leadId, lookup),
      kind: 'need',
      href: leadId ? `/opportunities/${leadId}` : undefined,
      subtitle: 'Lead Need',
    },
    ...roles.map((role, index) => ({
      id: `role-${index}`,
      label: oppTitle(role.opportunityId, lookup),
      kind: 'offer' as const,
      href: `/opportunities/${role.opportunityId}`,
      subtitle: role.role || `Partner ${index + 1}`,
    })),
  ]

  const edges: MatchTopologyEdge[] = roles.map((role, index) => ({
    fromId: 'lead-need',
    toId: `role-${index}`,
    label: role.role || 'Partner Offer',
  }))

  return {
    topology: 'consortium',
    frameworkLabel: formatFrameworkMatchTypeLabel('consortium'),
    frameworkSubtitle: formatFrameworkMatchTypeSubtitle('consortium'),
    nodes,
    edges,
  }
}

function buildCircularTopology(
  match: PostMatch,
  lookup: OpportunityLookup,
  getPersonName?: (userId: string) => string | undefined,
): MatchTopologyReadModel {
  const cycle = match.payload?.cycle ?? []
  const links = match.payload?.links ?? []

  const nodes: MatchTopologyNode[] = cycle.map((userId, index) => {
    const link = links.find((entry) => entry.fromCreatorId === userId)
    const offerId = link?.offerId
    const name = getPersonName?.(userId)?.trim()
    return {
      id: `party-${index}`,
      label: name || userId,
      kind: 'participant',
      subtitle: offerId ? oppTitle(offerId, lookup) : `Party ${index + 1}`,
      href: offerId ? `/opportunities/${offerId}` : undefined,
    }
  })

  const edges: MatchTopologyEdge[] = cycle.map((userId, index) => {
    const nextIndex = (index + 1) % cycle.length
    return {
      fromId: `party-${index}`,
      toId: `party-${nextIndex}`,
      label: links.find((entry) => entry.fromCreatorId === userId)?.offerId
        ? 'offers to'
        : 'exchange',
    }
  })

  return {
    topology: 'circular',
    frameworkLabel: formatFrameworkMatchTypeLabel('circular'),
    frameworkSubtitle: formatFrameworkMatchTypeSubtitle('circular'),
    nodes,
    edges,
  }
}

export function buildMatchTopologyReadModel(
  match: PostMatch,
  lookup: OpportunityLookup,
  getPersonName?: (userId: string) => string | undefined,
): MatchTopologyReadModel {
  const topology = resolveMatchingModelKey(match.matchType)

  switch (topology) {
    case 'two_way':
      return buildTwoWayTopology(match, lookup)
    case 'consortium':
      return buildConsortiumTopology(match, lookup)
    case 'circular':
      return buildCircularTopology(match, lookup, getPersonName)
    default:
      return buildOneWayTopology(match, lookup)
  }
}
