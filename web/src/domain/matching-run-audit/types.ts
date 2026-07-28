export type MatchingRunType = 'circular' | 'publish'

export type MatchingRunStatus =
  | 'completed'
  | 'completed_with_errors'
  | 'failed'

/** Compact per-candidate row stored on matching-run audit (capped). */
export type MatchingRunDiagnosticCandidateSummary = {
  readonly candidateOpportunityId: string
  readonly result: 'matched' | 'rejected'
  readonly rejectReason?: string
  readonly finalScore?: number
  readonly locationTier?: string
  readonly locationScore?: number
  readonly postMatchCreated?: boolean
  readonly failedChecks?: readonly string[]
}

export type MatchingRunDiagnosticSummary = {
  readonly sourceOpportunityId?: string
  readonly scannedCount: number
  readonly eligibleCount: number
  readonly rejectedCount: number
  readonly matchedCount: number
  readonly candidates: readonly MatchingRunDiagnosticCandidateSummary[]
}

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
  readonly diagnosticSummary?: MatchingRunDiagnosticSummary
}

export const MATCHING_RUN_AUDIT_ACTIONS: Readonly<Record<MatchingRunType, string>> = {
  circular: 'matching_run.circular',
  publish: 'matching_run.publish',
}
