/**
 * Related-object groups for admin workspaces.
 */

import {
  commercialAgreementRepository,
  contractRepository,
  negotiationRepository,
  opportunityRepository,
  partyMembershipRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import { formatPartyPresentation, formatUserPresentation } from '@/lib/enterprise-display.ts'
import type { AdminRelatedObject } from './types.ts'

function summarizeStatuses(statuses: readonly string[]): string | undefined {
  if (statuses.length === 0) return undefined
  const counts = new Map<string, number>()
  for (const s of statuses) {
    const key = s || 'unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([k, n]) => `${k}:${n}`)
    .join(', ')
}

export function relatedObjectsForUser(userId: string): readonly AdminRelatedObject[] {
  const memberships = partyMembershipRepository.listForUser(userId)
  const partyIds = memberships.map((m) => m.partyId)
  const opportunities = opportunityRepository
    .getAll()
    .filter((o) => o.creatorId === userId || (o.ownerPartyId && partyIds.includes(o.ownerPartyId)))
  const matches = postMatchRepository.getByUser(userId)
  const negotiations = negotiationRepository.getByParty(userId)

  return [
    {
      entityType: 'party',
      label: 'Parties',
      count: memberships.length,
      statusSummary: summarizeStatuses(memberships.map((m) => m.status)),
      permission: 'admin.parties.read',
      href: '/admin/parties',
      emptyLabel: 'No party memberships',
    },
    {
      entityType: 'opportunity',
      label: 'Opportunities',
      count: opportunities.length,
      statusSummary: summarizeStatuses(opportunities.map((o) => String(o.status))),
      permission: 'admin.opportunities.read',
      href: '/admin/opportunities',
      emptyLabel: 'No opportunities',
    },
    {
      entityType: 'post_match',
      label: 'PostMatches',
      count: matches.length,
      statusSummary: summarizeStatuses(matches.map((m) => String(m.status))),
      permission: 'admin.matching.read',
      href: '/admin/post-matches',
      emptyLabel: 'No matches',
    },
    {
      entityType: 'negotiation',
      label: 'Negotiations',
      count: negotiations.length,
      permission: 'admin.negotiations.read',
      href: '/admin/negotiations',
      emptyLabel: 'No negotiations',
    },
  ]
}

export function relatedObjectsForParty(partyId: string): readonly AdminRelatedObject[] {
  const memberships = partyMembershipRepository
    .getAll()
    .filter((m) => m.partyId === partyId)
  const opportunities = opportunityRepository
    .getAll()
    .filter((o) => o.ownerPartyId === partyId)
  const cas = commercialAgreementRepository.getAll().filter((ca) =>
    ca.participants?.some((p) => p.userId === partyId),
  )
  const contracts = contractRepository.getAll().filter((c) =>
    c.participants?.some((p) => p.userId === partyId),
  )

  return [
    {
      entityType: 'membership',
      label: 'Memberships',
      count: memberships.length,
      permission: 'admin.parties.read',
      href: '/admin/memberships',
      emptyLabel: 'No memberships',
    },
    {
      entityType: 'opportunity',
      label: 'Opportunities',
      count: opportunities.length,
      statusSummary: summarizeStatuses(opportunities.map((o) => String(o.status))),
      permission: 'admin.opportunities.read',
      href: '/admin/opportunities',
      emptyLabel: 'No opportunities',
    },
    {
      entityType: 'commercial_agreement',
      label: 'Commercial Agreements',
      count: cas.length,
      statusSummary: summarizeStatuses(cas.map((c) => String(c.status))),
      permission: 'admin.commercial_agreements.read',
      href: '/admin/commercial-agreements',
      emptyLabel: 'No commercial agreements',
    },
    {
      entityType: 'contract',
      label: 'Contracts',
      count: contracts.length,
      permission: 'admin.contracts.read',
      href: '/admin/contracts',
      emptyLabel: 'No contracts',
    },
  ]
}

export function relatedObjectsForOpportunity(
  opportunityId: string,
): readonly AdminRelatedObject[] {
  const matches = postMatchRepository.getByOpportunity(opportunityId)
  const negotiations = negotiationRepository.getByOpportunity(opportunityId)
  const cas = commercialAgreementRepository
    .getAll()
    .filter(
      (ca) =>
        ca.opportunityId === opportunityId ||
        ca.opportunityIds?.includes(opportunityId),
    )
  const opp = opportunityRepository.getById(opportunityId)
  const creator = opp?.creatorId ? userRepository.getById(opp.creatorId) : undefined
  const party = opp?.ownerPartyId
    ? partyRepository.getById(opp.ownerPartyId)
    : undefined

  return [
    {
      entityType: 'user',
      label: 'Creator',
      count: creator ? 1 : 0,
      statusSummary: creator ? formatUserPresentation(creator).fullName : undefined,
      permission: 'admin.users.read',
      href: creator ? `/admin/users/${creator.id}` : '/admin/users',
      emptyLabel: 'Missing creator',
    },
    {
      entityType: 'party',
      label: 'Owner party',
      count: party ? 1 : 0,
      statusSummary: party
        ? (() => {
            const view = formatPartyPresentation(party)
            return `${view.companyName} · ${view.companyCode}`
          })()
        : undefined,
      permission: 'admin.parties.read',
      href: party ? `/admin/parties/${party.id}` : '/admin/parties',
      emptyLabel: 'No owner party',
    },
    {
      entityType: 'post_match',
      label: 'PostMatches',
      count: matches.length,
      permission: 'admin.matching.read',
      href: '/admin/post-matches',
      emptyLabel: 'No matches',
    },
    {
      entityType: 'negotiation',
      label: 'Negotiations',
      count: negotiations.length,
      permission: 'admin.negotiations.read',
      href: '/admin/negotiations',
      emptyLabel: 'No negotiations',
    },
    {
      entityType: 'commercial_agreement',
      label: 'Commercial Agreements',
      count: cas.length,
      permission: 'admin.commercial_agreements.read',
      href: '/admin/commercial-agreements',
      emptyLabel: 'No commercial agreements',
    },
  ]
}

export function relatedObjectsForCommercialAgreement(
  commercialAgreementId: string,
): readonly AdminRelatedObject[] {
  const ca = commercialAgreementRepository.getById(commercialAgreementId)
  const contracts = contractRepository
    .getAll()
    .filter(
      (c) =>
        c.commercialAgreementId === commercialAgreementId ||
        c.dealId === commercialAgreementId,
    )
  const negotiation = ca?.negotiationId
    ? negotiationRepository.getById(ca.negotiationId)
    : undefined

  return [
    {
      entityType: 'opportunity',
      label: 'Opportunity',
      count: ca?.opportunityId ? 1 : 0,
      permission: 'admin.opportunities.read',
      href: '/admin/opportunities',
      emptyLabel: 'No opportunity link',
    },
    {
      entityType: 'negotiation',
      label: 'Negotiation',
      count: negotiation ? 1 : 0,
      statusSummary: negotiation?.status,
      permission: 'admin.negotiations.read',
      href: negotiation
        ? `/admin/negotiations/${negotiation.id}`
        : '/admin/negotiations',
      emptyLabel: 'No negotiation',
    },
    {
      entityType: 'contract',
      label: 'Contracts',
      count: contracts.length,
      statusSummary: summarizeStatuses(contracts.map((c) => String(c.status))),
      permission: 'admin.contracts.read',
      href: '/admin/contracts',
      emptyLabel: 'No contracts',
    },
  ]
}
