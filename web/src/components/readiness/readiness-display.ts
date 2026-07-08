import type {
  OpportunityReadinessResult,
  OpportunityReadinessStatus,
} from '@/domain/opportunity-readiness/types.ts'
import type {
  ProfileReadinessResult,
  ProfileReadinessStatus,
} from '@/domain/profile-readiness/types.ts'

export type ReadinessStatus =
  | ProfileReadinessStatus
  | OpportunityReadinessStatus

export type ReadinessResult = ProfileReadinessResult | OpportunityReadinessResult

export const READINESS_READY_MESSAGE = 'Ready for matching' as const

const STATUS_LABELS: Record<ReadinessStatus, string> = {
  incomplete: 'Incomplete',
  needs_review: 'Needs Review',
  ready_for_matching: 'Ready for Matching',
}

export function formatReadinessStatusLabel(status: ReadinessStatus): string {
  return STATUS_LABELS[status]
}

/** Opportunity create/edit wording — avoids "Matching" so it is not confused with Match Score. */
export function formatOpportunityReadinessStatusLabel(
  status: OpportunityReadinessStatus,
): string {
  if (status === 'ready_for_matching') return 'Ready to publish'
  return formatReadinessStatusLabel(status)
}

export function formatReadinessScore(score: number): string {
  return `${Math.round(score)}%`
}

export function getReadinessStatusTone(
  status: ReadinessStatus,
): 'incomplete' | 'needs_review' | 'ready' {
  if (status === 'ready_for_matching') return 'ready'
  if (status === 'needs_review') return 'needs_review'
  return 'incomplete'
}

/** Semantic text utility for readiness visuals (DDS-006 token-driven). */
export function getReadinessToneTextClass(
  tone: ReturnType<typeof getReadinessStatusTone>,
): string {
  const map = {
    incomplete: 'text-warning',
    needs_review: 'text-info',
    ready: 'text-success',
  } as const
  return map[tone]
}

export function hasReadinessGaps(result: ReadinessResult): boolean {
  return result.missingRequired.length > 0 || result.missingRecommended.length > 0
}

export function getReadinessSummaryMessage(result: ReadinessResult): string {
  if (!hasReadinessGaps(result) && result.status === 'ready_for_matching') {
    return READINESS_READY_MESSAGE
  }
  return formatReadinessStatusLabel(result.status)
}

export type ReadinessCardViewModel = {
  readonly title: string
  readonly scoreLabel: string
  readonly statusLabel: string
  readonly summaryMessage: string
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly showReadyMessage: boolean
}

export function buildReadinessCardViewModel(
  title: string,
  result: ReadinessResult,
  options?: { readonly opportunityCopy?: boolean },
): ReadinessCardViewModel {
  const showReadyMessage =
    result.status === 'ready_for_matching' &&
    (options?.opportunityCopy
      ? result.missingRequired.length === 0
      : !hasReadinessGaps(result))

  const statusLabel = options?.opportunityCopy
    ? formatOpportunityReadinessStatusLabel(result.status as OpportunityReadinessStatus)
    : formatReadinessStatusLabel(result.status)

  return {
    title,
    scoreLabel: formatReadinessScore(result.score),
    statusLabel,
    summaryMessage: options?.opportunityCopy
      ? statusLabel
      : getReadinessSummaryMessage(result),
    missingRequired: result.missingRequired,
    missingRecommended: result.missingRecommended,
    showReadyMessage,
  }
}
