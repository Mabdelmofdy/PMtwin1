import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type { ProfileReadinessProfile } from '@/domain/profile-readiness/types.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import type {
  BuildMatchingQualityAnalyticsInput,
  MatchingQualityResult,
} from '@/domain/matching-quality/types.ts'

const MATCH_ENTITY = 'match' as const

/** Negative terminal outcomes excluded from the match funnel denominator. */
const MATCH_EXCLUDED_FROM_TOTAL = new Set(['declined', 'expired', 'superseded'])

const EMPTY_RESULT: MatchingQualityResult = {
  averageProfileReadiness: 0,
  averageOpportunityReadiness: 0,
  averageMatchScore: 0,
  totalMatches: 0,
  acceptedMatches: 0,
  acceptanceRate: 0,
  negotiationsStarted: 0,
  negotiationRate: 0,
  dealsCreated: 0,
  dealConversionRate: 0,
}

function roundAverage(value: number): number {
  return Math.round(value * 100) / 100
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return roundAverage(total / values.length)
}

function ratePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return roundAverage((numerator / denominator) * 100)
}

/**
 * Match score source priority: `matchScore` (primary ADR-002 field), then `score`,
 * then `compatibilityScore`. Stored values in 0–1 are normalized to 0–100.
 */
export function resolveStoredMatchScore(match: object): number | null {
  const record = match as {
    matchScore?: number
    score?: number
    compatibilityScore?: number
  }

  const candidates = [
    record.matchScore,
    record.score,
    record.compatibilityScore,
  ]

  for (const candidate of candidates) {
    if (typeof candidate !== 'number' || Number.isNaN(candidate)) continue
    if (candidate > 0 && candidate <= 1) return roundAverage(candidate * 100)
    return roundAverage(candidate)
  }

  return null
}

export function isMatchIncludedInTotal(status: string | undefined): boolean {
  const canonical = resolveCanonicalStatus(MATCH_ENTITY, status)
  if (!canonical) return false
  return !MATCH_EXCLUDED_FROM_TOTAL.has(canonical)
}

export function isAcceptedMatchStatus(status: string | undefined): boolean {
  const canonical = resolveCanonicalStatus(MATCH_ENTITY, status)
  return canonical === 'accepted' || canonical === 'confirmed'
}

function resolveNegotiationPostMatchId(negotiation: object): string | undefined {
  const record = negotiation as { postMatchId?: string; matchId?: string }
  return record.postMatchId ?? record.matchId
}

function resolveDealNegotiationId(deal: object): string | undefined {
  const record = deal as { negotiationId?: string | null }
  return record.negotiationId ?? undefined
}

function summarizeProfileReadiness(
  profiles: BuildMatchingQualityAnalyticsInput['profiles'],
): number {
  const scores = profiles.map((entry) =>
    evaluateProfileReadiness({
      profileKind: entry.profileKind,
      profile: (entry.profile ?? undefined) as ProfileReadinessProfile | undefined,
    }).score,
  )
  return average(scores)
}

function summarizeOpportunityReadiness(
  opportunities: BuildMatchingQualityAnalyticsInput['opportunities'],
): number {
  const scores = opportunities.map((opportunity) =>
    evaluateOpportunityReadiness(
      opportunity as OpportunityReadinessOpportunity,
    ).score,
  )
  return average(scores)
}

function summarizeMatchMetrics(matches: BuildMatchingQualityAnalyticsInput['matches']) {
  let totalMatches = 0
  let acceptedMatches = 0
  const scores: number[] = []

  for (const match of matches) {
    const status = (match as { status?: string }).status
    if (isMatchIncludedInTotal(status)) {
      totalMatches += 1
    }
    if (isAcceptedMatchStatus(status)) {
      acceptedMatches += 1
    }

    const score = resolveStoredMatchScore(match)
    if (score !== null) {
      scores.push(score)
    }
  }

  return {
    totalMatches,
    acceptedMatches,
    acceptanceRate: ratePercent(acceptedMatches, totalMatches),
    averageMatchScore: average(scores),
  }
}

function summarizeNegotiationMetrics(
  negotiations: BuildMatchingQualityAnalyticsInput['negotiations'],
  acceptedMatches: number,
) {
  const negotiationsStarted = negotiations.filter((negotiation) =>
    Boolean(resolveNegotiationPostMatchId(negotiation)),
  ).length

  return {
    negotiationsStarted,
    negotiationRate: ratePercent(negotiationsStarted, acceptedMatches),
  }
}

function summarizeDealMetrics(
  deals: BuildMatchingQualityAnalyticsInput['deals'],
  negotiationsStarted: number,
) {
  const dealsCreated = deals.filter((deal) =>
    Boolean(resolveDealNegotiationId(deal)),
  ).length

  return {
    dealsCreated,
    dealConversionRate: ratePercent(dealsCreated, negotiationsStarted),
  }
}

export function buildMatchingQualityAnalytics(
  input: BuildMatchingQualityAnalyticsInput,
): MatchingQualityResult {
  const profiles = input.profiles ?? []
  const opportunities = input.opportunities ?? []
  const matches = input.matches ?? []
  const negotiations = input.negotiations ?? []
  const deals = input.deals ?? []

  if (
    profiles.length === 0 &&
    opportunities.length === 0 &&
    matches.length === 0 &&
    negotiations.length === 0 &&
    deals.length === 0
  ) {
    return EMPTY_RESULT
  }

  const matchMetrics = summarizeMatchMetrics(matches)
  const negotiationMetrics = summarizeNegotiationMetrics(
    negotiations,
    matchMetrics.acceptedMatches,
  )
  const dealMetrics = summarizeDealMetrics(
    deals,
    negotiationMetrics.negotiationsStarted,
  )

  return {
    averageProfileReadiness: summarizeProfileReadiness(profiles),
    averageOpportunityReadiness: summarizeOpportunityReadiness(opportunities),
    averageMatchScore: matchMetrics.averageMatchScore,
    totalMatches: matchMetrics.totalMatches,
    acceptedMatches: matchMetrics.acceptedMatches,
    acceptanceRate: matchMetrics.acceptanceRate,
    negotiationsStarted: negotiationMetrics.negotiationsStarted,
    negotiationRate: negotiationMetrics.negotiationRate,
    dealsCreated: dealMetrics.dealsCreated,
    dealConversionRate: dealMetrics.dealConversionRate,
  }
}
