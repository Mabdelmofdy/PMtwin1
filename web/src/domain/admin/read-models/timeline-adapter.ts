/**
 * Timeline builders for user / opportunity / commercial agreement workspaces.
 */

import {
  auditRepository,
  commercialAgreementRepository,
  opportunityRepository,
  userRepository,
} from '@/repositories/index.ts'
import type { AdminTimelineEvent } from './types.ts'

function sortEvents(events: AdminTimelineEvent[]): AdminTimelineEvent[] {
  return [...events].sort((a, b) => {
    const ta = Date.parse(a.timestamp) || 0
    const tb = Date.parse(b.timestamp) || 0
    if (tb !== ta) return tb - ta
    return b.sequence - a.sequence
  })
}

function auditEventsFor(
  entityType: string,
  entityId: string,
  startSeq: number,
): AdminTimelineEvent[] {
  const entries = auditRepository.getAll().filter(
    (e) => e.entityType === entityType && e.entityId === entityId,
  )
  return entries.map((e, i) => ({
    id: `audit-${e.id}`,
    kind: 'audit' as const,
    timestamp: e.timestamp ?? new Date(0).toISOString(),
    sequence: startSeq + i,
    title: e.action,
    description: e.details ? JSON.stringify(e.details).slice(0, 160) : undefined,
    entityType: e.entityType,
    entityId: e.entityId,
    actorId: e.userId,
    href: '/admin/audit',
  }))
}

export function buildUserTimeline(userId: string): readonly AdminTimelineEvent[] {
  const user = userRepository.getById(userId)
  const events: AdminTimelineEvent[] = []
  let seq = 0

  if (user?.createdAt) {
    events.push({
      id: `user-created-${userId}`,
      kind: 'domain',
      timestamp: user.createdAt,
      sequence: seq++,
      title: 'User registered',
      entityType: 'user',
      entityId: userId,
      href: `/admin/users/${userId}`,
    })
  }

  if (user?.updatedAt && user.updatedAt !== user.createdAt) {
    events.push({
      id: `user-updated-${userId}`,
      kind: 'status_change',
      timestamp: user.updatedAt,
      sequence: seq++,
      title: `Status: ${user.status}`,
      description: `Role ${user.role}`,
      entityType: 'user',
      entityId: userId,
    })
  }

  const vetting = user?.profile?.vetting
  if (vetting?.reviewedAt || vetting?.lastResubmittedAt) {
    events.push({
      id: `user-vetting-${userId}`,
      kind: 'admin_intervention',
      timestamp:
        vetting.reviewedAt ??
        vetting.lastResubmittedAt ??
        user?.updatedAt ??
        new Date(0).toISOString(),
      sequence: seq++,
      title: `Vetting ${vetting.reviewProgress ?? user?.status ?? 'updated'}`,
      description: vetting.reviewNotes ?? vetting.reason,
      entityType: 'user',
      entityId: userId,
      actorId: vetting.reviewedBy ?? vetting.reviewerId,
    })
  }

  events.push(...auditEventsFor('user', userId, seq))
  return sortEvents(events)
}

export function buildOpportunityTimeline(
  opportunityId: string,
): readonly AdminTimelineEvent[] {
  const opp = opportunityRepository.getById(opportunityId)
  const events: AdminTimelineEvent[] = []
  let seq = 0

  if (opp?.createdAt) {
    events.push({
      id: `opp-created-${opportunityId}`,
      kind: 'domain',
      timestamp: opp.createdAt,
      sequence: seq++,
      title: 'Opportunity created',
      description: opp.title,
      entityType: 'opportunity',
      entityId: opportunityId,
    })
  }

  if (opp?.updatedAt) {
    events.push({
      id: `opp-status-${opportunityId}`,
      kind: 'status_change',
      timestamp: opp.updatedAt,
      sequence: seq++,
      title: `Status: ${opp.status}`,
      description: opp.visibilityStatus
        ? `Visibility ${opp.visibilityStatus}`
        : undefined,
      entityType: 'opportunity',
      entityId: opportunityId,
    })
  }

  events.push(...auditEventsFor('opportunity', opportunityId, seq))
  return sortEvents(events)
}

export function buildCommercialTimeline(
  commercialAgreementId: string,
): readonly AdminTimelineEvent[] {
  const ca = commercialAgreementRepository.getById(commercialAgreementId)
  const events: AdminTimelineEvent[] = []
  let seq = 0

  if (ca?.createdAt) {
    events.push({
      id: `ca-created-${commercialAgreementId}`,
      kind: 'domain',
      timestamp: ca.createdAt,
      sequence: seq++,
      title: 'Commercial Agreement created',
      description: ca.title,
      entityType: 'commercial_agreement',
      entityId: commercialAgreementId,
      href: `/admin/commercial-agreements/${commercialAgreementId}`,
    })
  }

  if (ca?.updatedAt) {
    events.push({
      id: `ca-status-${commercialAgreementId}`,
      kind: 'status_change',
      timestamp: ca.updatedAt,
      sequence: seq++,
      title: `Status: ${ca.status}`,
      description: ca.awardStatus ? `Award ${ca.awardStatus}` : undefined,
      entityType: 'commercial_agreement',
      entityId: commercialAgreementId,
    })
  }

  if (ca?.completedAt) {
    events.push({
      id: `ca-completed-${commercialAgreementId}`,
      kind: 'domain',
      timestamp: ca.completedAt,
      sequence: seq++,
      title: 'Commercial Agreement completed',
      entityType: 'commercial_agreement',
      entityId: commercialAgreementId,
    })
  }

  events.push(
    ...auditEventsFor('commercial_agreement', commercialAgreementId, seq),
    ...auditEventsFor('deal', commercialAgreementId, seq + 100),
  )
  return sortEvents(events)
}
