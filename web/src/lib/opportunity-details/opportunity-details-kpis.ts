/** Honest KPI derivation for Opportunity Details — no invented metrics. */

import type { Opportunity } from '@/types/domain.ts'
import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'
import type { CommercialStructureSummary } from '@/domain/opportunity-commercial-structure'
import {
  deriveTimelineState,
  formatDurationLabel,
  formatOptionalDate,
  type TimelineState,
} from './opportunity-details-formatters.ts'

export type LifecycleKpiLabel =
  | 'Draft'
  | 'Needs Attention'
  | 'Ready to Publish'
  | 'Published'
  | 'Matching'
  | 'Negotiating'
  | 'Contracted'
  | 'Executing'
  | 'Completed'
  | 'Archived'
  | 'Withdrawn'
  | 'Closed'

export type OpportunityDetailsKpis = {
  readonly readiness: {
    readonly score: number
    readonly healthLabel: string
    readonly blockersCount: number
    readonly recommendationsCount: number
    readonly publishEligible: boolean
  }
  readonly lifecycle: {
    readonly primaryLabel: LifecycleKpiLabel | string
    readonly nextMeaningfulState?: string
  }
  readonly matching: {
    readonly count?: number
    readonly strongCount?: number
    readonly available: boolean
  }
  readonly scope: {
    readonly workPackageCount: number
    readonly taskCount: number
    readonly deliverableCount: number
    readonly milestoneCount: number
  }
  readonly commercial: {
    readonly structureLabel?: string
    readonly componentCount: number
    readonly allocationMethod?: string
  }
  readonly timeline: {
    readonly startDate?: string
    readonly deadline?: string
    readonly duration?: string
    readonly state: TimelineState
  }
}

const STRONG_MATCH_THRESHOLD = 0.8

export function countStrongMatches(
  scores: readonly (number | undefined | null)[],
): number {
  return scores.filter((score) => typeof score === 'number' && score >= STRONG_MATCH_THRESHOLD).length
}

/** Stage-accurate lifecycle label — never collapses negotiating/contracted to “Published”. */
export function resolveLifecycleKpiLabel(input: {
  readonly status?: string
  readonly visibilityStatus?: string
  readonly healthState?: LifecycleKpiLabel | string
  readonly isDraftHealthFallback?: boolean
}): LifecycleKpiLabel | string {
  const visibility = (input.visibilityStatus ?? '').toLowerCase()
  const status = (input.status ?? 'draft').toLowerCase()
  if (visibility === 'archived') return 'Archived'
  if (visibility === 'withdrawn') return 'Withdrawn'
  if (status === 'cancelled') return 'Closed'
  if (status === 'completed' || status === 'closed') return status === 'completed' ? 'Completed' : 'Closed'
  if (status === 'executing' || status === 'in_execution') return 'Executing'
  if (status === 'contracted') return 'Contracted'
  if (status === 'negotiating' || status === 'in_negotiation') return 'Negotiating'
  if (status === 'matched') return 'Matching'
  if (status === 'published') return 'Published'
  if (status === 'draft') {
    return input.isDraftHealthFallback && input.healthState
      ? input.healthState
      : (input.healthState ?? 'Draft')
  }
  return input.healthState ?? status
}

export function buildOpportunityDetailsKpis(input: {
  readonly opportunity: Opportunity
  readonly readiness: OpportunityReadinessResult
  readonly healthState: LifecycleKpiLabel | string
  readonly workPackageCount: number
  readonly taskCount: number
  readonly deliverableCount: number
  readonly milestoneCount: number
  readonly matchCount?: number
  readonly matchScores?: readonly (number | undefined | null)[]
  readonly matchingAvailable: boolean
  readonly commercialSummary?: CommercialStructureSummary | null
  readonly allocationMethod?: string
  readonly validationErrorCount: number
  readonly publishReady: boolean
}): OpportunityDetailsKpis {
  const { opportunity, readiness } = input
  const startDate =
    opportunity.startDate
    ?? opportunity.attributes?.startDate
    ?? undefined
  const deadline =
    opportunity.deliveryDeadline
    ?? opportunity.endDate
    ?? opportunity.attributes?.tenderDeadline
    ?? undefined

  const status = (opportunity.status ?? '').toLowerCase()

  const primaryLabel = resolveLifecycleKpiLabel({
    status: opportunity.status,
    visibilityStatus: opportunity.visibilityStatus,
    healthState: input.healthState,
    isDraftHealthFallback: status === 'draft',
  })

  let nextMeaningfulState: string | undefined
  if (status === 'draft') {
    nextMeaningfulState = input.publishReady ? 'Ready to Publish' : 'Needs Attention'
  } else if (status === 'published' && (input.matchCount ?? 0) === 0) {
    nextMeaningfulState = 'Awaiting matches'
  } else if (status === 'matched') {
    nextMeaningfulState = 'Review matches'
  } else if (status === 'negotiating' || status === 'in_negotiation') {
    nextMeaningfulState = 'Continue negotiation'
  } else if (status === 'contracted') {
    nextMeaningfulState = 'Open contract'
  }

  return {
    readiness: {
      score: readiness.score,
      healthLabel: String(primaryLabel),
      blockersCount: readiness.missingRequired.length,
      recommendationsCount: readiness.missingRecommended.length,
      publishEligible: input.publishReady && readiness.missingRequired.length === 0,
    },
    lifecycle: {
      primaryLabel,
      nextMeaningfulState,
    },
    matching: {
      count: input.matchingAvailable ? (input.matchCount ?? 0) : undefined,
      strongCount: input.matchingAvailable
        ? countStrongMatches(input.matchScores ?? [])
        : undefined,
      available: input.matchingAvailable,
    },
    scope: {
      workPackageCount: input.workPackageCount,
      taskCount: input.taskCount,
      deliverableCount: input.deliverableCount,
      milestoneCount: input.milestoneCount,
    },
    commercial: {
      structureLabel: input.commercialSummary?.derivedExchangeMode,
      componentCount: input.commercialSummary?.componentLabels.length ?? 0,
      allocationMethod: input.allocationMethod,
    },
    timeline: {
      startDate: formatOptionalDate(startDate),
      deadline: formatOptionalDate(deadline),
      duration: formatDurationLabel(opportunity.duration, startDate, deadline),
      state: deriveTimelineState({
        startDate,
        deadline,
        opportunityStatus: opportunity.status,
      }),
    },
  }
}
