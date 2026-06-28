import type {
  Opportunity,
  PostMatch,
  PostMatchConsortiumRole,
} from '@/types/domain.ts'

export type RelatedOpportunityRef = {
  readonly id: string
  readonly label: string
  readonly title: string
  readonly isCurrent: boolean
  readonly path: string
}

export type PostMatchRelatedOpportunitiesView = {
  readonly matchType: string
  readonly items: readonly RelatedOpportunityRef[]
}

export type ResolveRelatedOpportunityTitle = (
  opportunityId: string,
) => Opportunity | undefined

const MISSING_TITLE = 'Linked opportunity unavailable'

function resolveIntent(opportunity: Opportunity | undefined): string {
  const intent = opportunity?.intent
  if (intent === 'request' || intent === 'need') return 'need'
  if (intent === 'offer') return 'offer'
  return intent ?? 'opportunity'
}

function ref(
  id: string,
  label: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
  contextOpportunityId: string,
): RelatedOpportunityRef {
  const opportunity = getOpportunity(id)
  return {
    id,
    label,
    title: opportunity?.title?.trim() || MISSING_TITLE,
    isCurrent: id === contextOpportunityId,
    path: `/opportunities/${id}`,
  }
}

function resolveOneWayIds(match: PostMatch): {
  readonly needId: string | undefined
  readonly offerId: string | undefined
} {
  const payload = match.payload
  return {
    needId: match.needOpportunityId ?? payload?.needOpportunityId,
    offerId: match.offerOpportunityId ?? payload?.offerOpportunityId,
  }
}

function resolveOneWayRelated(
  match: PostMatch,
  contextOpportunityId: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
): readonly RelatedOpportunityRef[] {
  const { needId, offerId } = resolveOneWayIds(match)
  const context = getOpportunity(contextOpportunityId)
  const contextIntent = resolveIntent(context)

  if (contextOpportunityId === needId && offerId) {
    return [ref(offerId, 'Offer', getOpportunity, contextOpportunityId)]
  }
  if (contextOpportunityId === offerId && needId) {
    return [ref(needId, 'Need', getOpportunity, contextOpportunityId)]
  }

  const items: RelatedOpportunityRef[] = []
  if (needId) {
    items.push(
      ref(
        needId,
        contextIntent === 'need' && needId === contextOpportunityId ? 'This need' : 'Need',
        getOpportunity,
        contextOpportunityId,
      ),
    )
  }
  if (offerId) {
    items.push(
      ref(
        offerId,
        contextIntent === 'offer' && offerId === contextOpportunityId ? 'This offer' : 'Offer',
        getOpportunity,
        contextOpportunityId,
      ),
    )
  }
  return items
}

function resolveTwoWayRelated(
  match: PostMatch,
  contextOpportunityId: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
): readonly RelatedOpportunityRef[] {
  const sideA = match.payload?.sideA
  const sideB = match.payload?.sideB
  const items: RelatedOpportunityRef[] = []

  if (sideA) {
    items.push(
      ref(sideA.needId, 'Side A — need', getOpportunity, contextOpportunityId),
      ref(sideA.offerId, 'Side A — offer', getOpportunity, contextOpportunityId),
    )
  }
  if (sideB) {
    items.push(
      ref(sideB.needId, 'Side B — need', getOpportunity, contextOpportunityId),
      ref(sideB.offerId, 'Side B — offer', getOpportunity, contextOpportunityId),
    )
  }
  return items
}

function resolveConsortiumRelated(
  match: PostMatch,
  contextOpportunityId: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
): readonly RelatedOpportunityRef[] {
  const payload = match.payload
  const leadNeedId = payload?.leadNeedId
  const roles = payload?.roles ?? []
  const items: RelatedOpportunityRef[] = []

  if (leadNeedId) {
    items.push(
      ref(leadNeedId, 'Lead need', getOpportunity, contextOpportunityId),
    )
  }

  for (const role of roles) {
    items.push(
      ref(
        role.opportunityId,
        role.role?.trim() ? `${role.role} role` : 'Assigned role',
        getOpportunity,
        contextOpportunityId,
      ),
    )
  }

  return items
}

function formatLinkLabel(index: number): string {
  return `Link ${index + 1}`
}

function resolveCircularRelated(
  match: PostMatch,
  contextOpportunityId: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
): readonly RelatedOpportunityRef[] {
  const payload = match.payload
  const items: RelatedOpportunityRef[] = []
  const seen = new Set<string>()

  const cycle = payload?.cycle ?? []
  for (const opportunityId of cycle) {
    if (!opportunityId?.trim() || seen.has(opportunityId)) continue
    seen.add(opportunityId)
    items.push(
      ref(
        opportunityId,
        'Cycle member',
        getOpportunity,
        contextOpportunityId,
      ),
    )
  }

  const links = payload?.links ?? payload?.linkScores ?? []
  links.forEach((link, index) => {
    if (link.needId && !seen.has(link.needId)) {
      seen.add(link.needId)
      items.push(
        ref(
          link.needId,
          `${formatLinkLabel(index)} — need`,
          getOpportunity,
          contextOpportunityId,
        ),
      )
    }
    if (link.offerId && !seen.has(link.offerId)) {
      seen.add(link.offerId)
      items.push(
        ref(
          link.offerId,
          `${formatLinkLabel(index)} — offer`,
          getOpportunity,
          contextOpportunityId,
        ),
      )
    }
  })

  return items
}

/**
 * Topology-aware related opportunity summary for a PostMatch on an opportunity detail page.
 * Uses payload shape per ADR-MATCH-001 — does not assume top-level need/offer FKs.
 */
export function resolvePostMatchRelatedOpportunities(
  match: PostMatch,
  contextOpportunityId: string,
  getOpportunity: ResolveRelatedOpportunityTitle,
): PostMatchRelatedOpportunitiesView {
  const matchType = (match.matchType || 'one_way').toLowerCase()

  let items: readonly RelatedOpportunityRef[] = []
  if (matchType === 'one_way') {
    items = resolveOneWayRelated(match, contextOpportunityId, getOpportunity)
  } else if (matchType === 'two_way') {
    items = resolveTwoWayRelated(match, contextOpportunityId, getOpportunity)
  } else if (matchType === 'consortium') {
    items = resolveConsortiumRelated(match, contextOpportunityId, getOpportunity)
  } else if (matchType === 'circular') {
    items = resolveCircularRelated(match, contextOpportunityId, getOpportunity)
  }

  return { matchType, items }
}

export function formatConsortiumRoleLabel(role: PostMatchConsortiumRole): string {
  return role.role?.trim() ? `${role.role} role` : 'Assigned role'
}
