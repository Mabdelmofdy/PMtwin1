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
): ReadinessCardViewModel {
  const showReadyMessage =
    result.status === 'ready_for_matching' && !hasReadinessGaps(result)

  return {
    title,
    scoreLabel: formatReadinessScore(result.score),
    statusLabel: formatReadinessStatusLabel(result.status),
    summaryMessage: getReadinessSummaryMessage(result),
    missingRequired: result.missingRequired,
    missingRecommended: result.missingRecommended,
    showReadyMessage,
  }
}
