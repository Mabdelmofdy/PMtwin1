import type { HardConstraintResult } from '../types/match-result.ts'
import type { ScorePairResult } from '../types/match-result.ts'

export type MatchingDiagnosticCheckId =
  | 'published'
  | 'different_party'
  | 'target_role'
  | 'skills'
  | 'collaboration_model'
  | 'exchange_mode'
  | 'sector'
  | 'budget'
  | 'timeline'
  | 'location'
  | 'threshold'

export type MatchingDiagnosticCheckStatus = 'pass' | 'fail' | 'n/a'

export type MatchingDiagnosticCheck = {
  readonly id: MatchingDiagnosticCheckId
  readonly status: MatchingDiagnosticCheckStatus
  readonly detail?: string
}

export type MatchingCandidateDiagnostic = {
  readonly candidateOpportunityId: string
  readonly result: 'matched' | 'rejected'
  readonly checks: readonly MatchingDiagnosticCheck[]
  readonly locationTier?: string
  readonly locationScore?: number
  readonly finalScore?: number
  readonly rejectReason?: string
  readonly postMatchCreated?: boolean
}

export type MatchingRunDiagnostic = {
  readonly sourceOpportunityId: string
  readonly scannedCount: number
  readonly eligibleCount: number
  readonly rejectedCount: number
  readonly matchedCount: number
  readonly candidates: readonly MatchingCandidateDiagnostic[]
}

export const MATCHING_REJECT_REASONS = {
  NOT_PUBLISHED: 'NOT_PUBLISHED',
  SAME_PARTY: 'SAME_PARTY',
  TARGET_ROLE_REQUIRED: 'TARGET_ROLE_REQUIRED',
  ROLE_INCOMPATIBLE: 'ROLE_INCOMPATIBLE',
  SKILL_MISSING: 'SKILL_MISSING',
  SERVICE_OVERLAP_LOW: 'SERVICE_OVERLAP_LOW',
  BUDGET_INCOMPATIBLE: 'BUDGET_INCOMPATIBLE',
  TIMELINE_INCOMPATIBLE: 'TIMELINE_INCOMPATIBLE',
  CATEGORY_INCOMPATIBLE: 'CATEGORY_INCOMPATIBLE',
  SKILL_FLOOR: 'SKILL_FLOOR',
  BELOW_MATCH_THRESHOLD: 'BELOW_MATCH_THRESHOLD',
  SOURCE_INTENT_INVALID: 'SOURCE_INTENT_INVALID',
  ROLE_UNFILLED: 'ROLE_UNFILLED',
} as const

export type MatchingRejectReason =
  (typeof MATCHING_REJECT_REASONS)[keyof typeof MATCHING_REJECT_REASONS]

function check(
  id: MatchingDiagnosticCheckId,
  status: MatchingDiagnosticCheckStatus,
  detail?: string,
): MatchingDiagnosticCheck {
  return detail ? { id, status, detail } : { id, status }
}

export function rejectReasonFromHardGate(
  gate: HardConstraintResult,
): MatchingRejectReason {
  if (gate.reason === 'role_missing') return MATCHING_REJECT_REASONS.TARGET_ROLE_REQUIRED
  if (gate.reason === 'role_incompatible') return MATCHING_REJECT_REASONS.ROLE_INCOMPATIBLE
  if (gate.reason === 'core_skill_missing') return MATCHING_REJECT_REASONS.SKILL_MISSING
  if (gate.reason === 'service_overlap_low') {
    return MATCHING_REJECT_REASONS.SERVICE_OVERLAP_LOW
  }
  return MATCHING_REJECT_REASONS.TARGET_ROLE_REQUIRED
}

export function buildMatchedDiagnostic(input: {
  readonly candidateOpportunityId: string
  readonly scored: ScorePairResult
  readonly locationDetail?: string
}): MatchingCandidateDiagnostic {
  const locationScore = input.scored.breakdown.locationFit
  const locationTier = input.scored.breakdown.locationTier
  const locationDetail =
    input.locationDetail
    ?? input.scored.breakdown.locationDetail
    ?? undefined

  return {
    candidateOpportunityId: input.candidateOpportunityId,
    result: 'matched',
    checks: [
      check('published', 'pass'),
      check('different_party', 'pass'),
      check('target_role', 'pass'),
      check('skills', 'pass'),
      check('collaboration_model', 'pass'),
      check('exchange_mode', 'pass'),
      check('sector', 'pass'),
      check('budget', 'pass'),
      check('timeline', 'pass'),
      check(
        'location',
        'pass',
        locationDetail
          ? `${locationDetail} Score ${locationScore}`
          : `Score ${locationScore}`,
      ),
      check('threshold', 'pass', `Final score ${input.scored.score}`),
    ],
    locationTier,
    locationScore,
    finalScore: input.scored.score,
    postMatchCreated: true,
  }
}

export function buildRejectedDiagnostic(input: {
  readonly candidateOpportunityId: string
  readonly rejectReason: string
  readonly checks: readonly MatchingDiagnosticCheck[]
  readonly finalScore?: number
  readonly locationTier?: string
  readonly locationScore?: number
}): MatchingCandidateDiagnostic {
  return {
    candidateOpportunityId: input.candidateOpportunityId,
    result: 'rejected',
    checks: input.checks,
    rejectReason: input.rejectReason,
    finalScore: input.finalScore,
    locationTier: input.locationTier,
    locationScore: input.locationScore,
    postMatchCreated: false,
  }
}

/**
 * Shared gate+score diagnostic for two-way / consortium / circular
 * (models that do not use one-way's budget/timeline/category pre-filters).
 */
export function diagnoseGateAndScore(input: {
  readonly candidateOpportunityId: string
  readonly gate: HardConstraintResult
  readonly scored?: ScorePairResult
  readonly threshold: number
}): MatchingCandidateDiagnostic {
  if (!input.gate.ok) {
    const rejectReason = rejectReasonFromHardGate(input.gate)
    const roleFail =
      input.gate.reason === 'role_missing' || input.gate.reason === 'role_incompatible'
    const skillFail =
      input.gate.reason === 'core_skill_missing'
      || input.gate.reason === 'service_overlap_low'
    return buildRejectedDiagnostic({
      candidateOpportunityId: input.candidateOpportunityId,
      rejectReason,
      checks: [
        check('published', 'pass'),
        check('different_party', 'pass'),
        check(
          'target_role',
          roleFail ? 'fail' : 'pass',
          input.gate.reason === 'role_missing'
            ? 'Target role missing'
            : input.gate.reason === 'role_incompatible'
              ? 'Roles incompatible'
              : undefined,
        ),
        check('skills', skillFail ? 'fail' : 'pass', input.gate.reason),
        check('location', 'n/a'),
        check('threshold', 'n/a'),
      ],
    })
  }

  const scored = input.scored
  if (!scored) {
    return buildRejectedDiagnostic({
      candidateOpportunityId: input.candidateOpportunityId,
      rejectReason: MATCHING_REJECT_REASONS.BELOW_MATCH_THRESHOLD,
      checks: [
        check('published', 'pass'),
        check('different_party', 'pass'),
        check('target_role', 'pass'),
        check('skills', 'pass'),
        check('threshold', 'fail', 'No score produced'),
      ],
    })
  }

  if (scored.breakdown.rejected === 'skill_floor') {
    return buildRejectedDiagnostic({
      candidateOpportunityId: input.candidateOpportunityId,
      rejectReason: MATCHING_REJECT_REASONS.SKILL_FLOOR,
      checks: [
        check('published', 'pass'),
        check('different_party', 'pass'),
        check('target_role', 'pass'),
        check('skills', 'fail', 'Skill overlap below floor'),
        check('location', 'pass', scored.breakdown.locationDetail),
        check('threshold', 'fail', `Score ${scored.score}`),
      ],
      finalScore: scored.score,
      locationTier: scored.breakdown.locationTier,
      locationScore: scored.breakdown.locationFit,
    })
  }

  if (scored.score < input.threshold) {
    return buildRejectedDiagnostic({
      candidateOpportunityId: input.candidateOpportunityId,
      rejectReason: MATCHING_REJECT_REASONS.BELOW_MATCH_THRESHOLD,
      checks: [
        check('published', 'pass'),
        check('different_party', 'pass'),
        check('target_role', 'pass'),
        check('skills', 'pass'),
        check(
          'location',
          'pass',
          scored.breakdown.locationDetail
            ? `${scored.breakdown.locationDetail} Score ${scored.breakdown.locationFit}`
            : undefined,
        ),
        check(
          'threshold',
          'fail',
          `Final score ${scored.score} below threshold ${input.threshold}`,
        ),
      ],
      finalScore: scored.score,
      locationTier: scored.breakdown.locationTier,
      locationScore: scored.breakdown.locationFit,
    })
  }

  return buildMatchedDiagnostic({
    candidateOpportunityId: input.candidateOpportunityId,
    scored,
  })
}

export function summarizeDiagnostics(
  sourceOpportunityId: string,
  candidates: readonly MatchingCandidateDiagnostic[],
): MatchingRunDiagnostic {
  const matched = candidates.filter((c) => c.result === 'matched')
  const rejected = candidates.filter((c) => c.result === 'rejected')
  const eligible = candidates.filter((c) =>
    c.checks.every((checkItem) =>
      checkItem.id === 'threshold'
        ? true
        : checkItem.status !== 'fail',
    )
    || c.result === 'matched'
    || c.rejectReason === MATCHING_REJECT_REASONS.BELOW_MATCH_THRESHOLD
    || c.rejectReason === MATCHING_REJECT_REASONS.SKILL_FLOOR,
  )
  return {
    sourceOpportunityId,
    scannedCount: candidates.length,
    eligibleCount: eligible.length,
    rejectedCount: rejected.length,
    matchedCount: matched.length,
    candidates,
  }
}

export { check as diagnosticCheck }
