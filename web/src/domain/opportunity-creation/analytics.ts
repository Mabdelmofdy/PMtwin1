import type { Opportunity } from '@/types/domain.ts'

/** Presentation-only opportunity analytics (no analytics engine). */

export type OpportunityAnalyticsSnapshot = {
  averageDraftRevisions: number
  averageCompletionTimeHours: number | null
  mostAbandonedWizardStep: string | null
  averageReadinessBeforePublish: number | null
  timeToPublishHours: number | null
  mostMissingRequiredField: string | null
  /** Time between first draft creation and Publish, Archive, or Delete Draft. */
  averageDraftLifetimeHours: number | null
}

function hoursBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null
  const a = Date.parse(start)
  const b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return Math.round(((b - a) / 36e5) * 10) / 10
}

export function computeOpportunityAnalytics(
  opportunities: readonly Opportunity[],
  options?: {
    readonly deletedDraftLifetimesHours?: readonly number[]
    readonly abandonedStepCounts?: Readonly<Record<string, number>>
    readonly missingFieldCounts?: Readonly<Record<string, number>>
    readonly readinessBeforePublish?: readonly number[]
  },
): OpportunityAnalyticsSnapshot {
  const drafts = opportunities.filter(
    (o) => (o.status ?? '').toLowerCase() === 'draft',
  )
  const published = opportunities.filter(
    (o) => (o.status ?? '').toLowerCase() === 'published',
  )

  const revisionSamples = opportunities
    .map((o) => {
      const attrs = o.collaborationAttributes as
        | { draftRevisionCount?: number }
        | undefined
      return attrs?.draftRevisionCount
    })
    .filter((n): n is number => typeof n === 'number')

  const averageDraftRevisions =
    revisionSamples.length > 0
      ? Math.round(
          (revisionSamples.reduce((a, b) => a + b, 0) / revisionSamples.length) *
            10,
        ) / 10
      : drafts.length

  const publishDurations = published
    .map((o) => hoursBetween(o.createdAt, o.updatedAt))
    .filter((n): n is number => n != null)

  const timeToPublishHours =
    publishDurations.length > 0
      ? Math.round(
          (publishDurations.reduce((a, b) => a + b, 0) /
            publishDurations.length) *
            10,
        ) / 10
      : null

  const archived = opportunities.filter(
    (o) => (o.visibilityStatus ?? '').toLowerCase() === 'archived',
  )
  const lifetimeSamples = [
    ...publishDurations,
    ...archived
      .map((o) => hoursBetween(o.createdAt, o.updatedAt))
      .filter((n): n is number => n != null),
    ...(options?.deletedDraftLifetimesHours ?? []),
  ]
  const averageDraftLifetimeHours =
    lifetimeSamples.length > 0
      ? Math.round(
          (lifetimeSamples.reduce((a, b) => a + b, 0) / lifetimeSamples.length) *
            10,
        ) / 10
      : null

  const abandoned = options?.abandonedStepCounts ?? {}
  const mostAbandonedWizardStep =
    Object.entries(abandoned).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const missing = options?.missingFieldCounts ?? {}
  const mostMissingRequiredField =
    Object.entries(missing).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const readinessSamples = options?.readinessBeforePublish ?? []
  const averageReadinessBeforePublish =
    readinessSamples.length > 0
      ? Math.round(
          readinessSamples.reduce((a, b) => a + b, 0) / readinessSamples.length,
        )
      : null

  return {
    averageDraftRevisions,
    averageCompletionTimeHours: timeToPublishHours,
    mostAbandonedWizardStep,
    averageReadinessBeforePublish,
    timeToPublishHours,
    mostMissingRequiredField,
    averageDraftLifetimeHours,
  }
}
