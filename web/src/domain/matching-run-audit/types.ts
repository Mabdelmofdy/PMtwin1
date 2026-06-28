export type MatchingRunType = 'circular'

export type MatchingRunStatus =
  | 'completed'
  | 'completed_with_errors'
  | 'failed'

export type MatchingRunAuditDetails = {
  readonly runId: string
  readonly runType: MatchingRunType
  readonly actorId?: string
  readonly actorRole?: string
  readonly startedAt: string
  readonly completedAt: string
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrorsCount: number
  readonly matchingErrors: readonly string[]
  readonly status: MatchingRunStatus
  readonly failureReason?: string
}

export const MATCHING_RUN_AUDIT_ACTIONS: Readonly<Record<MatchingRunType, string>> = {
  circular: 'matching_run.circular',
}
