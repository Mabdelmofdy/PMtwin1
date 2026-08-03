import { toCanonical } from '@pm-twin/lifecycle'
import type { PostMatch } from '@/types/domain.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import {
  emitParticipantNotifications,
  resolveNotificationRecipientIds,
  type NotificationSink,
} from '@/commands/handlers/lifecycle-notifications.ts'

const MATCH_ENTITY = 'match' as const

const MATCH_EXPIRED_NOTIFICATION_TYPE = 'match_expired' as const

const EXPIRY_MESSAGE_BY_VISIBILITY = {
  closed: 'The opportunity has been closed. Your match has expired.',
  archived: 'The opportunity has been archived. Your match has expired.',
} as const

export type ExpireMatchesOnWithdrawnInput = {
  readonly opportunityId: string
  readonly clientRequestId: string
  readonly visibilityStatus: 'closed' | 'archived'
  readonly reason?: string
  readonly postMatchRepository: PostMatchRepository
  readonly auditRepository?: AuditRepository | null
  /** When set, both participants of each expired match receive a match_expired notification. */
  readonly notificationRepository?: NotificationSink | null
}

export type ExpireMatchesOnWithdrawnResult = {
  readonly expiredMatchIds: readonly string[]
  readonly skippedMatchIds: readonly string[]
  readonly notifiedUserIds: readonly string[]
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
  const notifiedUserIds: string[] = []
  const message = EXPIRY_MESSAGE_BY_VISIBILITY[input.visibilityStatus]

  const matches = input.postMatchRepository.getByOpportunity(input.opportunityId)
  for (const match of matches) {
    if (!isExpirableMatchStatus(match.status)) {
      skippedMatchIds.push(match.id)
      continue
    }

    const fromStatus = match.status
    input.postMatchRepository.update(match.id, { status: 'expired' })
    expiredMatchIds.push(match.id)

    const participants = match.participants ?? []
    const recipientIds = input.notificationRepository
      ? dedupe(
          participants.flatMap((participant) =>
            resolveNotificationRecipientIds(participant),
          ),
        )
      : []
    emitParticipantNotifications(input.notificationRepository, {
      participants,
      type: MATCH_EXPIRED_NOTIFICATION_TYPE,
      title: 'Match expired',
      message,
      link: `/matches/${match.id}`,
      entityType: 'post_match',
      entityId: match.id,
    })
    notifiedUserIds.push(...recipientIds)

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
          notifiedUserIds: recipientIds,
        },
      })
    }
  }

  return { expiredMatchIds, skippedMatchIds, notifiedUserIds: dedupe(notifiedUserIds) }
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)]
}

export function isExpirablePostMatch(match: Pick<PostMatch, 'status'>): boolean {
  return isExpirableMatchStatus(match.status)
}
