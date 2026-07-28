import type { MatchingRunDiagnostic } from '@pm-twin/matching'
import type {
  MatchingRunDiagnosticCandidateSummary,
  MatchingRunDiagnosticSummary,
} from '@/domain/matching-run-audit/types.ts'

const MAX_STORED_CANDIDATES = 40

function failedCheckIds(
  checks: MatchingRunDiagnostic['candidates'][number]['checks'],
): readonly string[] {
  return checks.filter((c) => c.status === 'fail').map((c) => c.id)
}

/**
 * Compact + cap diagnostic payload for audit / localStorage persistence.
 * Prefer all matched + first rejected rows up to the cap.
 */
export function toMatchingRunDiagnosticSummary(
  diagnostic: MatchingRunDiagnostic | undefined,
): MatchingRunDiagnosticSummary | undefined {
  if (!diagnostic) return undefined

  const matched = diagnostic.candidates.filter((c) => c.result === 'matched')
  const rejected = diagnostic.candidates.filter((c) => c.result === 'rejected')
  const selected = [...matched, ...rejected].slice(0, MAX_STORED_CANDIDATES)

  const candidates: MatchingRunDiagnosticCandidateSummary[] = selected.map((c) => ({
    candidateOpportunityId: c.candidateOpportunityId,
    result: c.result,
    rejectReason: c.rejectReason,
    finalScore: c.finalScore,
    locationTier: c.locationTier,
    locationScore: c.locationScore,
    postMatchCreated: c.postMatchCreated,
    failedChecks: failedCheckIds(c.checks),
  }))

  return {
    sourceOpportunityId: diagnostic.sourceOpportunityId,
    scannedCount: diagnostic.scannedCount,
    eligibleCount: diagnostic.eligibleCount,
    rejectedCount: diagnostic.rejectedCount,
    matchedCount: diagnostic.matchedCount,
    candidates,
  }
}

/** Merge diagnostics from multiple one-way model runs in a batch. */
export function mergeMatchingRunDiagnosticSummaries(
  summaries: readonly MatchingRunDiagnosticSummary[],
): MatchingRunDiagnosticSummary | undefined {
  if (summaries.length === 0) return undefined
  if (summaries.length === 1) return summaries[0]

  const candidates = summaries.flatMap((s) => s.candidates).slice(0, MAX_STORED_CANDIDATES)
  return {
    scannedCount: summaries.reduce((sum, s) => sum + s.scannedCount, 0),
    eligibleCount: summaries.reduce((sum, s) => sum + s.eligibleCount, 0),
    rejectedCount: summaries.reduce((sum, s) => sum + s.rejectedCount, 0),
    matchedCount: summaries.reduce((sum, s) => sum + s.matchedCount, 0),
    candidates,
  }
}
