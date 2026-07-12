import type { PlatformUser } from '@/types/domain.ts'
import type { VettingSlaStatus } from '@/types/vetting.ts'
import { getVettingSlaFromSettings } from '@/domain/admin/settings/effective-settings.ts'

/** Default compile-time SLA (tests + fallback). Runtime prefers Admin Settings. */
export const VETTING_SLA_CONFIG = {
  atRiskDays: 3,
  overdueDays: 7,
} as const

function resolveSlaConfig(): { readonly atRiskDays: number; readonly overdueDays: number } {
  try {
    return getVettingSlaFromSettings()
  } catch {
    return VETTING_SLA_CONFIG
  }
}
function daysSince(isoDate: string | undefined): number | null {
  if (!isoDate) return null
  const ms = Date.now() - new Date(isoDate).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 0
  return ms / (1000 * 60 * 60 * 24)
}

export function resolveVettingReviewAnchor(user: PlatformUser): string | undefined {
  return (
    user.profile?.vetting?.lastResubmittedAt ??
    user.profile?.vetting?.reviewedAt ??
    user.createdAt
  )
}

export function resolveVettingSlaStatus(user: PlatformUser): VettingSlaStatus {
  if (user.status === 'active' || user.status === 'rejected') {
    return 'on_track'
  }

  const sla = resolveSlaConfig()
  const anchor = resolveVettingReviewAnchor(user)
  const elapsed = daysSince(anchor)
  if (elapsed === null) return 'on_track'
  if (elapsed >= sla.overdueDays) return 'overdue'
  if (elapsed >= sla.atRiskDays) return 'at_risk'
  return 'on_track'
}

export function shouldEmitOverdueNotification(user: PlatformUser): boolean {
  return resolveVettingSlaStatus(user) === 'overdue'
}

export type VettingSlaDisplay = {
  readonly relativeLabel: string
  readonly targetLabel: string
}

function formatDayCount(days: number): string {
  const rounded = Math.max(1, Math.round(days))
  return `${rounded} ${rounded === 1 ? 'day' : 'days'}`
}

/** Display-only SLA labels — does not change resolveVettingSlaStatus. */
export function formatVettingSlaDisplay(
  user: PlatformUser,
  status: VettingSlaStatus,
): VettingSlaDisplay {
  const targetDays = resolveSlaConfig().overdueDays
  const anchor = resolveVettingReviewAnchor(user)
  const elapsed = daysSince(anchor) ?? 0

  if (status === 'overdue') {
    const overdueDays = Math.max(1, Math.floor(elapsed - targetDays))
    return {
      relativeLabel: `${formatDayCount(overdueDays)} overdue`,
      targetLabel: `Target SLA: ${targetDays} days`,
    }
  }

  const remaining = Math.ceil(targetDays - elapsed)
  if (remaining <= 0) {
    return {
      relativeLabel: `${formatDayCount(Math.floor(elapsed - targetDays))} overdue`,
      targetLabel: `Target SLA: ${targetDays} days`,
    }
  }

  return {
    relativeLabel: `Due in ${formatDayCount(remaining)}`,
    targetLabel: `SLA: ${targetDays} days`,
  }
}
