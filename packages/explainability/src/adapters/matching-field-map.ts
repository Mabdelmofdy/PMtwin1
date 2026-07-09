import {
  MATCH_REASON_CODES,
  type MatchReasonCode,
} from '../reason-codes/match.ts'
import type { MatchScoreLabel, MatchTopology } from './matching-types.ts'

/** Mirrors DEFAULT_WEIGHTS in matching config — breakdown display only. */
export const MATCH_ADAPTER_SCORE_WEIGHTS = {
  skillMatch: 25,
  exchangeCompatibility: 20,
  valueCompatibility: 20,
  budgetFit: 10,
  timelineFit: 10,
  locationFit: 10,
  reputation: 5,
  attributeOverlap: 0,
  serviceOverlapPct: 0,
} as const

/** Mirrors labelFromScore thresholds in matching engine. */
export const MATCH_DIMENSION_THRESHOLDS = {
  low: 0.25,
  partial: 0.25,
  good: 0.7,
} as const

export type MatchDimensionKey = keyof typeof MATCH_ADAPTER_SCORE_WEIGHTS

export const MATCH_DIMENSION_LABELS: Readonly<Record<MatchDimensionKey, string>> = {
  skillMatch: 'Skill match',
  attributeOverlap: 'Attribute overlap',
  serviceOverlapPct: 'Service overlap',
  exchangeCompatibility: 'Exchange compatibility',
  valueCompatibility: 'Value compatibility',
  budgetFit: 'Budget fit',
  timelineFit: 'Timeline fit',
  locationFit: 'Location fit',
  reputation: 'Reputation',
}

export const MATCH_DIMENSION_TO_REASON_CODE: Readonly<
  Record<MatchDimensionKey, MatchReasonCode>
> = {
  skillMatch: MATCH_REASON_CODES.SKILL_LOW,
  attributeOverlap: MATCH_REASON_CODES.SKILL_LOW,
  serviceOverlapPct: MATCH_REASON_CODES.SERVICE_OVERLAP_LOW,
  exchangeCompatibility: MATCH_REASON_CODES.EXCHANGE_LOW,
  valueCompatibility: MATCH_REASON_CODES.VALUE_LOW,
  budgetFit: MATCH_REASON_CODES.BUDGET_LOW,
  timelineFit: MATCH_REASON_CODES.TIMELINE_LOW,
  locationFit: MATCH_REASON_CODES.LOCATION_LOW,
  reputation: MATCH_REASON_CODES.REPUTATION_LOW,
}

const HARD_GATE_CODE_MAP: Readonly<Record<string, MatchReasonCode>> = {
  role_incompatible: MATCH_REASON_CODES.HARD_GATE_ROLE_INCOMPATIBLE,
  core_skill_missing: MATCH_REASON_CODES.HARD_GATE_SKILL_MISSING,
  service_overlap_low: MATCH_REASON_CODES.HARD_GATE_SERVICE_OVERLAP_LOW,
  role_missing: MATCH_REASON_CODES.CONSTRAINT_BLOCKED,
}

const TOPOLOGY_REASON_CODES: Readonly<Record<MatchTopology, MatchReasonCode>> = {
  one_way: MATCH_REASON_CODES.TOPOLOGY_ONE_WAY,
  two_way: MATCH_REASON_CODES.TOPOLOGY_TWO_WAY,
  consortium: MATCH_REASON_CODES.TOPOLOGY_CONSORTIUM,
  circular: MATCH_REASON_CODES.TOPOLOGY_CIRCULAR,
}

export function matchDimensionToReasonCode(dimension: MatchDimensionKey): MatchReasonCode {
  return MATCH_DIMENSION_TO_REASON_CODE[dimension]
}

export function matchHardGateCodeToReasonCode(code: string): MatchReasonCode {
  const normalized = code.trim().toLowerCase()
  return HARD_GATE_CODE_MAP[normalized] ?? MATCH_REASON_CODES.CONSTRAINT_BLOCKED
}

export function matchTopologyToReasonCode(topology: MatchTopology): MatchReasonCode {
  return TOPOLOGY_REASON_CODES[topology]
}

export function matchTierToReasonCode(
  tier: 'top' | 'good' | 'possible',
): MatchReasonCode {
  switch (tier) {
    case 'top':
      return MATCH_REASON_CODES.TIER_TOP
    case 'good':
      return MATCH_REASON_CODES.TIER_GOOD
    default:
      return MATCH_REASON_CODES.TIER_POSSIBLE
  }
}

export function labelFromDimensionScore(score: number): MatchScoreLabel {
  if (score >= 1) return 'Match'
  if (score >= MATCH_DIMENSION_THRESHOLDS.partial) return 'Partial'
  return 'No Match'
}

export function isLowDimensionScore(score: number): boolean {
  return score < MATCH_DIMENSION_THRESHOLDS.low
}

export function dimensionImprovementHint(dimension: MatchDimensionKey): string {
  switch (dimension) {
    case 'skillMatch':
    case 'attributeOverlap':
      return 'Align required skills and services with the counterpart post.'
    case 'serviceOverlapPct':
      return 'Increase overlap between required and offered services.'
    case 'exchangeCompatibility':
      return 'Review exchange model compatibility between posts.'
    case 'valueCompatibility':
      return 'Negotiate value terms to improve equivalence.'
    case 'budgetFit':
      return 'Adjust budget ranges to improve overlap.'
    case 'timelineFit':
      return 'Align availability and deadline windows.'
    case 'locationFit':
      return 'Clarify location or remote-work preferences.'
    case 'reputation':
      return 'Improve counterpart reputation signals or choose a higher-rated partner.'
    default:
      return 'Review this match dimension with the counterpart.'
  }
}
