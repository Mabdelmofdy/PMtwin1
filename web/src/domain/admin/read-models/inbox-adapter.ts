/**
 * Build AdminInboxItem[] from live queues — vetting, suspended users,
 * inactive negotiations, CA review, matching-run errors.
 */

import { adminApi } from '@/api/admin.ts'
import {
  isMatchingRunAuditEntry,
  parseMatchingRunAuditDetails,
} from '@/services/matching/matching-run-audit.ts'
import {
  auditRepository,
  commercialAgreementRepository,
  negotiationRepository,
  opportunityRepository,
  userRepository,
} from '@/repositories/index.ts'
import {
  formatCommercialAgreementPresentation,
  formatNegotiationPresentation,
  formatUserPresentation,
} from '@/lib/enterprise-display.ts'
import type { AdminInboxItem, AdminSeverity, AdminSlaState } from './types.ts'

const DAY_MS = 24 * 60 * 60 * 1000

function ageMsFrom(iso?: string): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 0
  return Math.max(0, Date.now() - t)
}

function slaFromAge(ageMs: number): AdminSlaState {
  if (ageMs <= 0) return 'none'
  if (ageMs > 7 * DAY_MS) return 'overdue'
  if (ageMs > 3 * DAY_MS) return 'warning'
  return 'ok'
}

function priorityFromAge(ageMs: number): AdminInboxItem['priority'] {
  if (ageMs > 7 * DAY_MS) return 'urgent'
  if (ageMs > 3 * DAY_MS) return 'high'
  return 'normal'
}

function severityFromAge(ageMs: number): AdminSeverity {
  if (ageMs > 7 * DAY_MS) return 'high'
  if (ageMs > 3 * DAY_MS) return 'medium'
  return 'low'
}

export type BuildInboxOptions = {
  readonly assigneeId?: string | null
  readonly includeCompleted?: boolean
}

export function buildAdminInbox(
  options: BuildInboxOptions = {},
): readonly AdminInboxItem[] {
  const nowIso = new Date().toISOString()
  const items: AdminInboxItem[] = []

  for (const entry of adminApi.getPendingUsers()) {
    const created = entry.user.updatedAt ?? entry.user.createdAt ?? nowIso
    const age = ageMsFrom(created)
    const userView = formatUserPresentation(entry.user)
    items.push({
      id: `vetting-${entry.user.id}`,
      itemType: 'vetting_pending',
      entityType: 'vetting',
      entityId: entry.user.id,
      title: `Vetting: ${userView.fullName}`,
      summary: entry.partyLabel
        ? `${entry.partyLabel} awaiting review`
        : `User ${userView.employeeNumber} awaiting vetting review`,
      priority: priorityFromAge(age),
      severity: severityFromAge(age),
      sla: slaFromAge(age),
      ageMs: age,
      assigneeId: null,
      requiredPermission: 'admin.vetting.manage',
      availableActions: ['vetting.approve', 'vetting.reject'],
      sourceWorkspace: 'compliance',
      createdAt: created,
      updatedAt: created,
      destinationHref: '/admin/vetting',
      auditHref: '/admin/audit',
    })
  }

  for (const user of userRepository.getAll()) {
    if ((user.status ?? '').toLowerCase() !== 'suspended') continue
    const created = user.updatedAt ?? user.createdAt ?? nowIso
    const age = ageMsFrom(created)
    const userView = formatUserPresentation(user)
    items.push({
      id: `suspended-${user.id}`,
      itemType: 'user_suspended',
      entityType: 'user',
      entityId: user.id,
      title: `Suspended: ${userView.fullName}`,
      summary: `${userView.employeeNumber} — review for unsuspend or lock`,
      priority: 'high',
      severity: 'high',
      sla: slaFromAge(age),
      ageMs: age,
      assigneeId: null,
      requiredPermission: 'admin.users.manage',
      availableActions: ['user.unsuspend', 'user.lock'],
      sourceWorkspace: 'identity',
      createdAt: created,
      updatedAt: created,
      destinationHref: `/admin/users/${user.id}`,
      auditHref: '/admin/audit',
    })
  }

  for (const n of negotiationRepository.getAll()) {
    const s = (n.status ?? '').toLowerCase()
    if (!(s === 'active' || s === 'countered' || s === 'open')) continue
    const age = ageMsFrom(n.updatedAt)
    if (age <= 14 * DAY_MS) continue
    const view = formatNegotiationPresentation(n, (oid) =>
      opportunityRepository.getById(oid),
    )
    items.push({
      id: `negotiation-stale-${n.id}`,
      itemType: 'negotiation_inactive',
      entityType: 'negotiation',
      entityId: n.id,
      title: `Inactive: ${view.title}`,
      summary: `${view.reference} — no updates for ${Math.floor(age / DAY_MS)} days`,
      priority: priorityFromAge(age),
      severity: severityFromAge(age),
      sla: slaFromAge(age),
      ageMs: age,
      assigneeId: null,
      requiredPermission: 'admin.negotiations.read',
      availableActions: [],
      sourceWorkspace: 'commercial',
      createdAt: n.createdAt ?? n.updatedAt ?? nowIso,
      updatedAt: n.updatedAt ?? nowIso,
      destinationHref: `/admin/negotiations/${n.id}`,
    })
  }

  for (const ca of commercialAgreementRepository.getAll()) {
    const s = (ca.status ?? '').toLowerCase()
    if (!(s === 'draft' || s === 'negotiating' || s === 'review' || s === 'signing')) continue
    const created = ca.updatedAt ?? ca.createdAt ?? nowIso
    const age = ageMsFrom(created)
    const view = formatCommercialAgreementPresentation(ca, (id) =>
      opportunityRepository.getById(id),
    )
    items.push({
      id: `ca-review-${ca.id}`,
      itemType: 'commercial_agreement_review',
      entityType: 'commercial_agreement',
      entityId: ca.id,
      title: view.name,
      summary: `${view.reference} · status ${ca.status} — awaiting commercial review`,
      priority: priorityFromAge(age),
      severity: severityFromAge(age),
      sla: slaFromAge(age),
      ageMs: age,
      assigneeId: null,
      requiredPermission: 'admin.commercial_agreements.approve',
      availableActions: ['commercial_agreement.approve', 'commercial_agreement.award'],
      sourceWorkspace: 'commercial',
      createdAt: ca.createdAt ?? created,
      updatedAt: created,
      destinationHref: `/admin/commercial-agreements/${ca.id}`,
      auditHref: '/admin/audit',
    })
  }

  for (const entry of auditRepository.getAll()) {
    if (!isMatchingRunAuditEntry(entry)) continue
    const details = parseMatchingRunAuditDetails(entry)
    if (!details) continue
    const hasErrors =
      details.status === 'failed' ||
      details.status === 'completed_with_errors' ||
      (details.matchingErrors?.length ?? 0) > 0
    if (!hasErrors) continue
    const created = entry.timestamp ?? details.completedAt ?? nowIso
    const age = ageMsFrom(created)
    items.push({
      id: `matching-error-${details.runId}`,
      itemType: 'matching_run_error',
      entityType: 'match',
      entityId: details.runId,
      title: `Matching run ${details.status}`,
      summary:
        details.failureReason ??
        `${details.matchingErrorsCount ?? details.matchingErrors?.length ?? 0} matching error(s)`,
      priority: 'high',
      severity: 'high',
      sla: slaFromAge(age),
      ageMs: age,
      assigneeId: details.actorId ?? null,
      requiredPermission: 'admin.matching.read',
      availableActions: [],
      sourceWorkspace: 'marketplace',
      createdAt: created,
      updatedAt: created,
      destinationHref: '/admin/matching',
      auditHref: '/admin/audit',
    })
  }

  items.sort((a, b) => b.ageMs - a.ageMs)

  if (options.assigneeId) {
    return items.filter(
      (item) =>
        item.assigneeId === options.assigneeId ||
        item.assigneeId == null ||
        item.assigneeId === '',
    )
  }

  return items
}

export function filterInboxByView(
  items: readonly AdminInboxItem[],
  viewId: string,
): readonly AdminInboxItem[] {
  switch (viewId) {
    case 'urgent':
      return items.filter((i) => i.priority === 'urgent' || i.severity === 'critical' || i.severity === 'high')
    case 'vetting':
      return items.filter((i) => i.itemType === 'vetting_pending')
    case 'commercial':
      return items.filter(
        (i) =>
          i.sourceWorkspace === 'commercial' ||
          i.entityType === 'commercial_agreement' ||
          i.entityType === 'negotiation',
      )
    case 'matching':
      return items.filter((i) => i.itemType === 'matching_run_error')
    case 'identity':
      return items.filter((i) => i.sourceWorkspace === 'identity' || i.entityType === 'user')
    case 'all':
    default:
      return items
  }
}

export const INBOX_VIEW_TABS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'vetting', label: 'Vetting' },
  { id: 'identity', label: 'Identity' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'matching', label: 'Matching' },
] as const
