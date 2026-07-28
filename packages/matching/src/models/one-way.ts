import {
  budgetCompatible,
  categoryOverlap,
  timelineOverlap,
} from '../candidates/candidate-generator.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import {
  buildMatchedDiagnostic,
  buildRejectedDiagnostic,
  diagnosticCheck,
  MATCHING_REJECT_REASONS,
  rejectReasonFromHardGate,
  summarizeDiagnostics,
  type MatchingCandidateDiagnostic,
  type MatchingRunDiagnostic,
} from '../diagnostics/matching-diagnostics.ts'
import { oneWayValueFit } from '../value/value-compatibility.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { OneWayMatchResult, ModelRunnerOptions, ScoredMatch } from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import {
  resolveMaxCandidates,
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'

function emptyDiagnostic(sourceId: string): MatchingRunDiagnostic {
  return {
    sourceOpportunityId: sourceId,
    scannedCount: 0,
    eligibleCount: 0,
    rejectedCount: 0,
    matchedCount: 0,
    candidates: [],
  }
}

function evaluateOfferCandidate(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
  config: MatchingConfig,
  canonical: CanonicalData,
  threshold: number,
): { readonly match: ScoredMatch | null; readonly diagnostic: MatchingCandidateDiagnostic } {
  const candidateId = String(offerPost.id ?? '')
  const needNorm = resolveNormalized(needPost, canonical, config)
  const offerNorm = resolveNormalized(offerPost, canonical, config)

  if (offerPost.status !== 'published') {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.NOT_PUBLISHED,
        checks: [
          diagnosticCheck('published', 'fail', 'Candidate is not published'),
          diagnosticCheck('different_party', 'n/a'),
          diagnosticCheck('target_role', 'n/a'),
          diagnosticCheck('skills', 'n/a'),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  if (
    needPost.creatorId
    && offerPost.creatorId
    && needPost.creatorId === offerPost.creatorId
  ) {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.SAME_PARTY,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'fail', 'Same creator'),
          diagnosticCheck('target_role', 'n/a'),
          diagnosticCheck('skills', 'n/a'),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  if (!budgetCompatible(needNorm, offerNorm)) {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.BUDGET_INCOMPATIBLE,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('budget', 'fail', 'Budget ranges do not overlap'),
          diagnosticCheck('target_role', 'n/a'),
          diagnosticCheck('skills', 'n/a'),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  if (!timelineOverlap(needNorm, offerNorm)) {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.TIMELINE_INCOMPATIBLE,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('budget', 'pass'),
          diagnosticCheck('timeline', 'fail', 'Timelines do not overlap'),
          diagnosticCheck('target_role', 'n/a'),
          diagnosticCheck('skills', 'n/a'),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  if (!categoryOverlap(needNorm, offerNorm)) {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.CATEGORY_INCOMPATIBLE,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('budget', 'pass'),
          diagnosticCheck('timeline', 'pass'),
          diagnosticCheck('sector', 'fail', 'No shared collaboration / sector category'),
          diagnosticCheck('collaboration_model', 'fail'),
          diagnosticCheck('target_role', 'n/a'),
          diagnosticCheck('skills', 'n/a'),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  const gate = passesPair(needPost, offerPost, config, { needNorm, offerNorm })
  if (!gate.ok) {
    const rejectReason = rejectReasonFromHardGate(gate)
    const roleFail = gate.reason === 'role_missing' || gate.reason === 'role_incompatible'
    const skillFail =
      gate.reason === 'core_skill_missing' || gate.reason === 'service_overlap_low'
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('budget', 'pass'),
          diagnosticCheck('timeline', 'pass'),
          diagnosticCheck('sector', 'pass'),
          diagnosticCheck('collaboration_model', 'pass'),
          diagnosticCheck(
            'target_role',
            roleFail ? 'fail' : 'pass',
            gate.reason === 'role_missing'
              ? 'Target role missing'
              : gate.reason === 'role_incompatible'
                ? 'Roles incompatible'
                : undefined,
          ),
          diagnosticCheck(
            'skills',
            skillFail ? 'fail' : 'pass',
            gate.reason,
          ),
          diagnosticCheck('location', 'n/a'),
          diagnosticCheck('threshold', 'n/a'),
        ],
      }),
    }
  }

  const scored = scorePair(needPost, offerPost, config, needNorm, offerNorm)
  if (scored.breakdown.rejected === 'skill_floor') {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.SKILL_FLOOR,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('target_role', 'pass'),
          diagnosticCheck('skills', 'fail', 'Skill overlap below floor'),
          diagnosticCheck('location', 'pass', scored.breakdown.locationDetail),
          diagnosticCheck('threshold', 'fail', `Score ${scored.score}`),
        ],
        finalScore: scored.score,
        locationTier: scored.breakdown.locationTier,
        locationScore: scored.breakdown.locationFit,
      }),
    }
  }

  if (scored.score < threshold) {
    return {
      match: null,
      diagnostic: buildRejectedDiagnostic({
        candidateOpportunityId: candidateId,
        rejectReason: MATCHING_REJECT_REASONS.BELOW_MATCH_THRESHOLD,
        checks: [
          diagnosticCheck('published', 'pass'),
          diagnosticCheck('different_party', 'pass'),
          diagnosticCheck('target_role', 'pass'),
          diagnosticCheck('skills', 'pass'),
          diagnosticCheck('collaboration_model', 'pass'),
          diagnosticCheck('exchange_mode', 'pass'),
          diagnosticCheck('sector', 'pass'),
          diagnosticCheck('budget', 'pass'),
          diagnosticCheck('timeline', 'pass'),
          diagnosticCheck(
            'location',
            'pass',
            scored.breakdown.locationDetail
              ? `${scored.breakdown.locationDetail} Score ${scored.breakdown.locationFit}`
              : undefined,
          ),
          diagnosticCheck(
            'threshold',
            'fail',
            `Final score ${scored.score} below threshold ${threshold}`,
          ),
        ],
        finalScore: scored.score,
        locationTier: scored.breakdown.locationTier,
        locationScore: scored.breakdown.locationFit,
      }),
    }
  }

  const valueAnalysis: Readonly<Record<string, unknown>> = {
    ...oneWayValueFit(needPost, offerPost),
  }
  const match: ScoredMatch = {
    matchScore: scored.score,
    breakdown: scored.breakdown,
    labels: scored.labels,
    valueAnalysis,
    suggestedPartners: [{
      opportunityId: offerPost.id,
      creatorId: offerPost.creatorId,
    }],
    needOpportunityId: needPost.id,
    offerOpportunityId: offerPost.id,
  }

  return {
    match,
    diagnostic: buildMatchedDiagnostic({
      candidateOpportunityId: candidateId,
      scored,
    }),
  }
}

export function findOffersForNeedPure(
  needPost: OpportunityPost,
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): OneWayMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const sourceId = String(needPost.id ?? '')
  if ((needPost.intent ?? 'request') !== 'request') {
    return {
      model: 'one_way',
      matches: [],
      diagnostic: emptyDiagnostic(sourceId),
    }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const maxCandidates = resolveMaxCandidates(resolvedConfig, options.maxCandidates)
  const diagnostics: MatchingCandidateDiagnostic[] = []
  const matches: ScoredMatch[] = []

  // Prefer published offers first for diagnostic scan order
  const ordered = [...offerPosts].sort((a, b) => {
    const aPub = a.status === 'published' ? 0 : 1
    const bPub = b.status === 'published' ? 0 : 1
    return aPub - bPub
  })

  for (const offer of ordered) {
    if (offer.id && offer.id === needPost.id) continue
    const { match, diagnostic } = evaluateOfferCandidate(
      needPost,
      offer,
      resolvedConfig,
      canonical,
      threshold,
    )
    diagnostics.push(diagnostic)
    if (match) {
      matches.push(match)
    }
  }

  // Cap matched results after full diagnostic scan
  matches.sort((a, b) => b.matchScore - a.matchScore)
  const capped = matches.slice(0, maxCandidates)
  const topN = options.topN ?? 20
  return {
    model: 'one_way',
    matches: capped.slice(0, topN),
    diagnostic: summarizeDiagnostics(sourceId, diagnostics),
  }
}

export function findNeedsForOfferPure(
  offerPost: OpportunityPost,
  needPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): OneWayMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const sourceId = String(offerPost.id ?? '')
  if ((offerPost.intent ?? '') !== 'offer' || offerPost.status !== 'published') {
    return {
      model: 'one_way',
      direction: 'offer_to_needs',
      matches: [],
      diagnostic: emptyDiagnostic(sourceId),
    }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const maxCandidates = resolveMaxCandidates(resolvedConfig, options.maxCandidates)
  const diagnostics: MatchingCandidateDiagnostic[] = []
  const matches: ScoredMatch[] = []

  for (const need of needPosts) {
    if (need.id && need.id === offerPost.id) continue
    if (need.status !== 'published') {
      diagnostics.push(
        buildRejectedDiagnostic({
          candidateOpportunityId: String(need.id ?? ''),
          rejectReason: MATCHING_REJECT_REASONS.NOT_PUBLISHED,
          checks: [
            diagnosticCheck('published', 'fail', 'Need is not published'),
            diagnosticCheck('different_party', 'n/a'),
            diagnosticCheck('target_role', 'n/a'),
            diagnosticCheck('skills', 'n/a'),
            diagnosticCheck('location', 'n/a'),
            diagnosticCheck('threshold', 'n/a'),
          ],
        }),
      )
      continue
    }
    const { match, diagnostic } = evaluateOfferCandidate(
      need,
      offerPost,
      resolvedConfig,
      canonical,
      threshold,
    )
    const redirected: MatchingCandidateDiagnostic = {
      ...diagnostic,
      candidateOpportunityId: String(need.id ?? diagnostic.candidateOpportunityId),
    }
    diagnostics.push(redirected)
    if (match) {
      matches.push(match)
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore)
  const capped = matches.slice(0, maxCandidates)
  const topN = options.topN ?? 20
  return {
    model: 'one_way',
    direction: 'offer_to_needs',
    matches: capped.slice(0, topN),
    diagnostic: summarizeDiagnostics(sourceId, diagnostics),
  }
}
