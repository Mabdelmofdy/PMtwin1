import type { VettingWorkflowEntry } from '@/lib/vetting-admin-workflow.ts'
import type { VettingWorkflowBucket } from '@/lib/vetting-admin-workflow.ts'
import { PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmStatCard } from '@/components/ui/pm-stat-card'

export type AdminVettingKpiMetrics = {
  readonly pendingReview: number
  readonly changesRequested: number
  readonly resubmitted: number
  readonly overdue: number
  readonly averageReviewTimeDays: number | null
  readonly approvedToday: number
  readonly slaCompliancePercent: number | null
}

function isToday(isoDate: string | undefined): boolean {
  if (!isoDate) return false
  const date = new Date(isoDate)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  )
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return (end - start) / (1000 * 60 * 60 * 24)
}

export function computeAdminVettingKpiMetrics(
  workflow: Record<VettingWorkflowBucket, readonly VettingWorkflowEntry[]>,
): AdminVettingKpiMetrics {
  const activeEntries = [
    ...workflow.pending,
    ...workflow.changes_requested,
    ...workflow.resubmitted,
  ]
  const overdue = activeEntries.filter((entry) => entry.slaStatus === 'overdue').length
  const onTrack = activeEntries.filter((entry) => entry.slaStatus === 'on_track').length
  const slaCompliancePercent =
    activeEntries.length > 0 ? Math.round((onTrack / activeEntries.length) * 100) : null

  const reviewDurations = workflow.history
    .map((entry) => {
      const reviewedAt = entry.user.profile?.vetting?.reviewedAt
      const createdAt = entry.user.createdAt
      if (!reviewedAt || !createdAt) return null
      return daysBetween(createdAt, reviewedAt)
    })
    .filter((value): value is number => value !== null)

  const averageReviewTimeDays =
    reviewDurations.length > 0
      ? Math.round(
          (reviewDurations.reduce((sum, value) => sum + value, 0) / reviewDurations.length) * 10,
        ) / 10
      : null

  const approvedToday = workflow.history.filter(
    (entry) => entry.user.status === 'active' && isToday(entry.user.profile?.vetting?.reviewedAt),
  ).length

  return {
    pendingReview: workflow.pending.length,
    changesRequested: workflow.changes_requested.length,
    resubmitted: workflow.resubmitted.length,
    overdue,
    averageReviewTimeDays,
    approvedToday,
    slaCompliancePercent,
  }
}

export function AdminVettingKpiStrip({ metrics }: { readonly metrics: AdminVettingKpiMetrics }) {
  return (
    <PmMetricGrid columns={4} className="mb-4">
      <PmStatCard label="Pending Review" value={metrics.pendingReview} dense />
      <PmStatCard label="Changes Requested" value={metrics.changesRequested} dense />
      <PmStatCard label="Resubmitted" value={metrics.resubmitted} dense />
      <PmStatCard label="Overdue" value={metrics.overdue} dense />
      <PmStatCard
        label="Average Review Time"
        value={
          metrics.averageReviewTimeDays === null
            ? '—'
            : `${metrics.averageReviewTimeDays}d`
        }
        dense
      />
      <PmStatCard label="Approved Today" value={metrics.approvedToday} dense />
      <PmStatCard
        label="SLA Compliance"
        value={
          metrics.slaCompliancePercent === null
            ? '—'
            : `${metrics.slaCompliancePercent}%`
        }
        dense
      />
    </PmMetricGrid>
  )
}
