/**
 * Presentation-layer view visibility — POC parity for read paths.
 * Does not enforce mutations; command gateway remains authoritative for writes.
 */

import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import { resolvePostMatchOpportunityIds } from '@/domain/normalized/post-match-opportunity-ids.ts'
import type {
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PostMatch,
} from '@/types/domain.ts'

export type ViewerContext = {
  readonly userId?: string | null
  readonly role?: string | null
  readonly status?: string | null
  readonly canAccessAdmin?: boolean
  readonly profile?: {
    readonly type?: string
    readonly individualType?: string
    readonly verificationStatus?: string
    readonly vettingSkippedAtRegistration?: boolean
  } | null
}

export type OpportunityDetailAccess =
  | 'denied'
  | 'teaser'
  | 'public'
  | 'participant'
  | 'owner'
  | 'admin'

export type OpportunityDetailVisibility = {
  readonly access: OpportunityDetailAccess
  readonly showMatchingSection: boolean
  readonly showParticipantMatchChip: boolean
  readonly showReadiness: boolean
  readonly showOwnerActions: boolean
  readonly showContractSection: boolean
  readonly showLegacyApplications: boolean
  readonly showCreatorName: boolean
  readonly showBudgetAndTimeline: boolean
  readonly showFullDescription: boolean
  readonly showMatchScoreInHero: boolean
  readonly showCollaborationWorkflow: boolean
  readonly showRecommendedActions: boolean
}

const MATCHING_SECTION_STATUSES = new Set(['published', 'in_negotiation', 'negotiating', 'matched'])
const CONTRACT_SECTION_STATUSES = new Set([
  'contracted',
  'in_execution',
  'executing',
  'completed',
  'closed',
])

const PLATFORM_ADMIN_ROLES = new Set(['admin', 'moderator'])

function isOpportunityOwner(opportunity: Opportunity, viewer: ViewerContext): boolean {
  return Boolean(viewer.userId && opportunity.creatorId === viewer.userId)
}

function isPlatformAdminRole(role: string | null | undefined): boolean {
  return Boolean(role && PLATFORM_ADMIN_ROLES.has(role))
}

export function isOpportunityTeaserEligible(viewer: ViewerContext): boolean {
  if (!viewer.userId) return false
  const status = (viewer.status ?? '').toLowerCase()
  const isVetted = status === 'active'
  const isPending = status === 'pending'
  if (!isVetted && !isPending) {
    return true
  }

  const role = (viewer.role ?? '').toLowerCase()
  const isIndividual =
    role === 'professional' ||
    role === 'consultant' ||
    viewer.profile?.type === 'professional' ||
    viewer.profile?.type === 'consultant' ||
    viewer.profile?.individualType === 'professional' ||
    viewer.profile?.individualType === 'consultant'

  if (!isIndividual) return false

  const verification = viewer.profile?.verificationStatus
  const vettingSkipped = viewer.profile?.vettingSkippedAtRegistration === true
  return (
    verification === 'unverified' ||
    verification === 'UNVERIFIED' ||
    (vettingSkipped && !verification)
  )
}

export function isParticipantOnEntity(
  entity: { participants?: readonly { userId: string }[]; parties?: readonly { userId: string }[] },
  userId: string | null | undefined,
): boolean {
  if (!userId) return false
  const participants = normalizeParticipants(
    entity.participants as Parameters<typeof normalizeParticipants>[0],
    entity.parties as Parameters<typeof normalizeParticipants>[1],
  )
  return participants.some((participant) => participant.userId === userId)
}

export function findParticipantOneWayMatchForOpportunity(
  opportunityId: string,
  postMatches: readonly PostMatch[],
  viewer: ViewerContext,
): PostMatch | undefined {
  if (!viewer.userId) return undefined
  return postMatches.find((match) => {
    if (match.matchType !== 'one_way') return false
    const isParticipant = isParticipantOnEntity(match, viewer.userId)
    if (!isParticipant) return false
    const needId = match.needOpportunityId ?? match.payload?.needOpportunityId
    const offerId = match.offerOpportunityId ?? match.payload?.offerOpportunityId
    return needId === opportunityId || offerId === opportunityId
  })
}

/**
 * Topology-agnostic variant: surfaces a participant match of ANY type
 * (one_way, two_way, consortium, circular) that references the opportunity.
 */
export function findParticipantMatchForOpportunity(
  opportunityId: string,
  postMatches: readonly PostMatch[],
  viewer: ViewerContext,
): PostMatch | undefined {
  if (!viewer.userId) return undefined
  return postMatches.find((match) => {
    if (!isParticipantOnEntity(match, viewer.userId)) return false
    return resolvePostMatchOpportunityIds(match).opportunityIds.includes(
      opportunityId,
    )
  })
}

export function isMatchParticipant(match: PostMatch, viewer: ViewerContext): boolean {
  return isParticipantOnEntity(match, viewer.userId)
}

function opportunityCanonicalStatus(opportunity: Opportunity): string {
  return resolveCanonicalStatus('opportunity', opportunity.status)
}

export function isDraftOpportunity(opportunity: Opportunity): boolean {
  return opportunityCanonicalStatus(opportunity) === 'draft'
}

export function canEditOpportunity(
  opportunity: Opportunity,
  viewer: ViewerContext,
): boolean {
  if (!viewer.userId) return false
  if (isOpportunityOwner(opportunity, viewer)) return true
  return isPlatformAdminRole(viewer.role)
}

export function resolveOpportunityDetailVisibility(
  opportunity: Opportunity,
  viewer: ViewerContext,
  options: {
    readonly postMatches?: readonly PostMatch[]
    readonly showLegacyApplicationsFlag?: boolean
  } = {},
): OpportunityDetailVisibility {
  const owner = isOpportunityOwner(opportunity, viewer)
  const adminStaff = Boolean(viewer.canAccessAdmin)
  const participantMatch = findParticipantMatchForOpportunity(
    opportunity.id,
    options.postMatches ?? [],
    viewer,
  )
  const isParticipant = Boolean(participantMatch) && !owner
  const canonicalStatus = opportunityCanonicalStatus(opportunity)
  const showContractSection = CONTRACT_SECTION_STATUSES.has(canonicalStatus) ||
    CONTRACT_SECTION_STATUSES.has((opportunity.status ?? '').toLowerCase())

  if (!owner && !adminStaff && isDraftOpportunity(opportunity)) {
    return {
      access: 'denied',
      showMatchingSection: false,
      showParticipantMatchChip: false,
      showReadiness: false,
      showOwnerActions: false,
      showContractSection: false,
      showLegacyApplications: false,
      showCreatorName: false,
      showBudgetAndTimeline: false,
      showFullDescription: false,
      showMatchScoreInHero: false,
      showCollaborationWorkflow: false,
      showRecommendedActions: false,
    }
  }

  if (isOpportunityTeaserEligible(viewer)) {
    return {
      access: 'teaser',
      showMatchingSection: false,
      showParticipantMatchChip: false,
      showReadiness: false,
      showOwnerActions: false,
      showContractSection: false,
      showLegacyApplications: false,
      showCreatorName: false,
      showBudgetAndTimeline: false,
      showFullDescription: false,
      showMatchScoreInHero: false,
      showCollaborationWorkflow: false,
      showRecommendedActions: false,
    }
  }

  if (owner) {
    const showMatching =
      MATCHING_SECTION_STATUSES.has(canonicalStatus) ||
      MATCHING_SECTION_STATUSES.has((opportunity.status ?? '').toLowerCase())
    return {
      access: 'owner',
      showMatchingSection: showMatching,
      showParticipantMatchChip: false,
      showReadiness: true,
      showOwnerActions: true,
      showContractSection,
      showLegacyApplications: Boolean(options.showLegacyApplicationsFlag),
      showCreatorName: true,
      showBudgetAndTimeline: true,
      showFullDescription: true,
      showMatchScoreInHero: true,
      showCollaborationWorkflow: true,
      showRecommendedActions: true,
    }
  }

  if (adminStaff) {
    return {
      access: 'admin',
      showMatchingSection: false,
      showParticipantMatchChip: false,
      showReadiness: false,
      showOwnerActions: false,
      showContractSection,
      showLegacyApplications: Boolean(options.showLegacyApplicationsFlag),
      showCreatorName: true,
      showBudgetAndTimeline: true,
      showFullDescription: true,
      showMatchScoreInHero: false,
      showCollaborationWorkflow: false,
      showRecommendedActions: false,
    }
  }

  if (isParticipant) {
    return {
      access: 'participant',
      showMatchingSection: false,
      showParticipantMatchChip: true,
      showReadiness: false,
      showOwnerActions: false,
      showContractSection,
      showLegacyApplications: false,
      showCreatorName: true,
      showBudgetAndTimeline: true,
      showFullDescription: true,
      showMatchScoreInHero: false,
      showCollaborationWorkflow: false,
      showRecommendedActions: false,
    }
  }

  return {
    access: 'public',
    showMatchingSection: false,
    showParticipantMatchChip: false,
    showReadiness: false,
    showOwnerActions: false,
    showContractSection,
    showLegacyApplications: false,
    showCreatorName: true,
    showBudgetAndTimeline: true,
    showFullDescription: true,
    showMatchScoreInHero: false,
    showCollaborationWorkflow: false,
    showRecommendedActions: false,
  }
}

/** POC match detail: participant-only (no admin bypass on user route). */
export function canViewMatchDetail(match: PostMatch, viewer: ViewerContext): boolean {
  return isMatchParticipant(match, viewer)
}

/** POC negotiation detail: party-only (no admin bypass on user route). */
export function canViewNegotiationDetail(
  negotiation: Negotiation,
  viewer: ViewerContext,
): boolean {
  if (viewer.canAccessAdmin) return true
  return isParticipantOnEntity(negotiation, viewer.userId)
}

/** POC deal detail: participant or admin portal access. */
export function canViewDealDetail(deal: Deal, viewer: ViewerContext): boolean {
  if (viewer.canAccessAdmin) return true
  return isParticipantOnEntity(deal, viewer.userId)
}

/** POC contract detail: party or admin portal access. */
export function canViewContractDetail(contract: Contract, viewer: ViewerContext): boolean {
  if (viewer.canAccessAdmin) return true
  return isParticipantOnEntity(contract, viewer.userId)
}

export function canMutateDealDetail(deal: Deal, viewer: ViewerContext): boolean {
  return isParticipantOnEntity(deal, viewer.userId)
}

export function canMutateContractDetail(contract: Contract, viewer: ViewerContext): boolean {
  return isParticipantOnEntity(contract, viewer.userId)
}

export function canMutateNegotiationDetail(
  negotiation: Negotiation,
  viewer: ViewerContext,
): boolean {
  return isParticipantOnEntity(negotiation, viewer.userId)
}

function matchTouchesOpportunity(match: PostMatch, opportunityId: string): boolean {
  const needId = match.needOpportunityId ?? match.payload?.needOpportunityId
  const offerId = match.offerOpportunityId ?? match.payload?.offerOpportunityId
  return (
    match.participants?.some((participant) => participant.opportunityId === opportunityId) === true ||
    needId === opportunityId ||
    offerId === opportunityId
  )
}

export function filterPostMatchesForViewer(
  matches: readonly PostMatch[],
  viewer: ViewerContext,
  options: {
    readonly ownedOpportunityIds?: ReadonlySet<string>
  } = {},
): PostMatch[] {
  if (viewer.canAccessAdmin) return [...matches]
  if (!viewer.userId) return []
  return matches.filter((match) => {
    if (isMatchParticipant(match, viewer)) return true
    if (options.ownedOpportunityIds) {
      const needId = match.needOpportunityId ?? match.payload?.needOpportunityId
      const offerId = match.offerOpportunityId ?? match.payload?.offerOpportunityId
      if (needId && options.ownedOpportunityIds.has(needId)) return true
      if (offerId && options.ownedOpportunityIds.has(offerId)) return true
    }
    return false
  })
}

export function filterDealsForViewer(deals: readonly Deal[], viewer: ViewerContext): Deal[] {
  if (viewer.canAccessAdmin) return [...deals]
  if (!viewer.userId) return []
  return deals.filter((deal) => isParticipantOnEntity(deal, viewer.userId))
}

export function filterContractsForViewer(
  contracts: readonly Contract[],
  viewer: ViewerContext,
): Contract[] {
  if (viewer.canAccessAdmin) return [...contracts]
  if (!viewer.userId) return []
  return contracts.filter((contract) => isParticipantOnEntity(contract, viewer.userId))
}

export function filterOpportunitiesForListScope(
  opportunities: readonly Opportunity[],
  viewer: ViewerContext,
  scope: 'all' | 'mine',
): Opportunity[] {
  return opportunities.filter((opportunity) => {
    if (scope === 'mine') {
      return Boolean(viewer.userId && opportunity.creatorId === viewer.userId)
    }
    if (isDraftOpportunity(opportunity) && opportunity.creatorId !== viewer.userId) {
      return false
    }
    return true
  })
}

export function viewerTouchesOpportunityMatch(
  opportunityId: string,
  postMatches: readonly PostMatch[],
  viewer: ViewerContext,
): boolean {
  return postMatches.some(
    (match) => matchTouchesOpportunity(match, opportunityId) && isMatchParticipant(match, viewer),
  )
}

export function buildViewerContext(input: {
  readonly userId?: string | null
  readonly role?: string | null
  readonly status?: string | null
  readonly canAccessAdmin?: boolean
  readonly profile?: ViewerContext['profile']
}): ViewerContext {
  return {
    userId: input.userId ?? undefined,
    role: input.role ?? undefined,
    status: input.status ?? undefined,
    canAccessAdmin: input.canAccessAdmin ?? false,
    profile: input.profile ?? undefined,
  }
}
