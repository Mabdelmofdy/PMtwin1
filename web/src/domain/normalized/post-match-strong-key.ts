import type {
  PostMatch,
  PostMatchBarterSide,
  PostMatchCircularLink,
  PostMatchConsortiumRole,
  PostMatchConsortiumPayload,
  PostMatchCircularPayload,
  PostMatchPayload,
  PostMatchTwoWayPayload,
} from '@/types/domain.ts'

/** Input shape for strong-key computation (command probe or stored PostMatch). */
export type PostMatchStrongKeyInput = {
  readonly matchType: string
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
  readonly payload?: PostMatchPayload
  readonly participants?: readonly { readonly userId: string }[]
}

function barterSideKey(side: PostMatchBarterSide | undefined): string {
  if (!side) return ':'
  return `${side.needId || ''}:${side.offerId || ''}`
}

/**
 * Strong dedupe key for PostMatch create / discover checks.
 * Ported from POC data-service._postMatchStrongKey (ADR-MATCH-001).
 */
export function computePostMatchStrongKey(
  record: PostMatchStrongKeyInput | null | undefined,
): string | null {
  if (!record?.matchType) return null
  const type = record.matchType.toLowerCase()
  const payload = record.payload

  if (type === 'one_way') {
    const needId =
      record.needOpportunityId ??
      (payload && 'needOpportunityId' in payload
        ? payload.needOpportunityId
        : undefined)
    const offerId =
      record.offerOpportunityId ??
      (payload && 'offerOpportunityId' in payload
        ? payload.offerOpportunityId
        : undefined)
    if (!needId || !offerId) return null
    return `one_way:${needId}:${offerId}`
  }

  if (type === 'two_way') {
    const twoWay = payload as PostMatchTwoWayPayload | undefined
    const a = twoWay?.sideA
    const b = twoWay?.sideB
    const keyA = barterSideKey(a)
    const keyB = barterSideKey(b)
    const ordered = [keyA, keyB].sort()
    return `two_way:${ordered[0]}|${ordered[1]}`
  }

  if (type === 'consortium') {
    const consortium = payload as PostMatchConsortiumPayload | undefined
    const leadNeedId = consortium?.leadNeedId
    const roles = consortium?.roles ?? []
    if (!leadNeedId || roles.length === 0) return null
    const assignments = [...roles]
      .map(
        (r: PostMatchConsortiumRole) =>
          `${r.role || ''}:${r.userId || ''}:${r.opportunityId || ''}`,
      )
      .sort()
    return `consortium:${leadNeedId}:${assignments.join('|')}`
  }

  if (type === 'circular') {
    const circular = payload as PostMatchCircularPayload | undefined
    const cycle = circular?.cycle ?? []
    if (!cycle.length) return null
    const participants = [...new Set(cycle.filter(Boolean))].sort()
    const links = circular?.links ?? circular?.linkScores ?? []
    const linkKeys = [...links]
      .map((l: PostMatchCircularLink) => {
        const from = l.fromCreatorId || ''
        const to = l.toCreatorId || ''
        return `${from}:${to}:${l.offerId || ''}:${l.needId || ''}`
      })
      .sort()
    return `circular:${participants.join(',')}:${linkKeys.join('|')}`
  }

  return null
}

export function computePostMatchStrongKeyFromMatch(
  match: PostMatch,
): string | null {
  return computePostMatchStrongKey({
    matchType: match.matchType,
    needOpportunityId: match.needOpportunityId,
    offerOpportunityId: match.offerOpportunityId,
    payload: match.payload,
    participants: match.participants,
  })
}

/** Collect all opportunity IDs referenced by a PostMatch (any topology). */
export function collectPostMatchOpportunityIds(match: PostMatch): string[] {
  const ids = new Set<string>()
  const add = (id: string | undefined) => {
    if (id?.trim()) ids.add(id)
  }

  add(match.needOpportunityId)
  add(match.offerOpportunityId)

  const payload = match.payload
  if (!payload) return [...ids]

  if ('needOpportunityId' in payload) add(payload.needOpportunityId)
  if ('offerOpportunityId' in payload) add(payload.offerOpportunityId)
  if ('leadNeedId' in payload) add(payload.leadNeedId)

  if ('sideA' in payload && payload.sideA) {
    add(payload.sideA.needId)
    add(payload.sideA.offerId)
  }
  if ('sideB' in payload && payload.sideB) {
    add(payload.sideB.needId)
    add(payload.sideB.offerId)
  }

  if ('roles' in payload && Array.isArray(payload.roles)) {
    for (const role of payload.roles) add(role.opportunityId)
  }

  const links =
    ('links' in payload && payload.links) ||
    ('linkScores' in payload && payload.linkScores) ||
    []
  for (const link of links) {
    add(link.needId)
    add(link.offerId)
  }

  return [...ids]
}
