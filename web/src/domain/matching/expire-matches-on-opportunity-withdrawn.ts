import { toCanonical } from '@pm-twin/lifecycle'
import type { PostMatch } from '@/types/domain.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'

const MATCH_ENTITY = 'match' as const

export type ExpireMatchesOnWithdrawnInput = {
  readonly opportunityId: string
  readonly clientRequestId: string
  readonly visibilityStatus: 'closed' | 'archived'
  readonly reason?: string
  readonly postMatchRepository: PostMatchRepository
  readonly auditRepository?: AuditRepository | null
}

export type ExpireMatchesOnWithdrawnResult = {
  readonly expiredMatchIds: readonly string[]
  readonly skippedMatchIds: readonly string[]
}

function canonicalMatchStatus(status: string | undefined): string {
  return toCanonical(MATCH_ENTITY, status ?? '') ?? ''
}

function isExpirableMatchStatus(status: string | undefined): boolean {
  const canonical = canonicalMatchStatus(status)
  return canonical === 'discovered' || canonical === 'accepted'
}

/**
 * Soft-deactivate open PostMatches when an opportunity is closed or archived.
 * Confirmed (and other terminal) matches are left unchanged so in-flight
 * negotiation/deal pipelines are not interrupted.
 */
export function expireActiveMatchesOnOpportunityWithdrawn(
  input: ExpireMatchesOnWithdrawnInput,
): ExpireMatchesOnWithdrawnResult {
  const expiredMatchIds: string[] = []
  const skippedMatchIds: string[] = []

  const matches = input.postMatchRepository.getByOpportunity(input.opportunityId)
  for (const match of matches) {
    if (!isExpirableMatchStatus(match.status)) {
      skippedMatchIds.push(match.id)
      continue
    }

    const fromStatus = match.status
    input.postMatchRepository.update(match.id, { status: 'expired' })
    expiredMatchIds.push(match.id)

    if (typeof input.auditRepository?.append === 'function') {
      input.auditRepository.append({
        action: 'post_match.status_changed',
        entityType: 'post_match',
        entityId: match.id,
        requestId: input.clientRequestId,
        details: {
          fromStatus,
          toStatus: 'expired',
          reason: input.reason ?? `opportunity_${input.visibilityStatus}`,
          opportunityId: input.opportunityId,
          visibilityStatus: input.visibilityStatus,
        },
      })
    }
  }

  return { expiredMatchIds, skippedMatchIds }
}

export function isExpirablePostMatch(match: Pick<PostMatch, 'status'>): boolean {
  return isExpirableMatchStatus(match.status)
}
