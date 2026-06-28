import type { MatchingConfig, MatchingWeights } from '../types/matching-config.ts'

export const DEFAULT_WEIGHTS: MatchingWeights = {
  SKILL_MATCH: 0.25,
  EXCHANGE_COMPATIBILITY: 0.20,
  VALUE_COMPATIBILITY: 0.20,
  BUDGET_FIT: 0.10,
  TIMELINE: 0.10,
  LOCATION: 0.10,
  REPUTATION: 0.05,
  ATTRIBUTE_OVERLAP: 0.25,
  BUDGET_FIT_LEGACY: 0.10,
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  CANDIDATE_MAX: 200,
  POST_TO_POST_THRESHOLD: 0.50,
  HARD_CONSTRAINTS_ENABLED: true,
  STRICT_ROLE_REQUIRED: true,
  STRICT_ROLE_EXACT_MATCH: true,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
  MIN_SKILL_SCORE_FOR_MATCH: 0.50,
  WEIGHTS: DEFAULT_WEIGHTS,
}

export function resolveWeights(config: MatchingConfig): MatchingWeights {
  return config.WEIGHTS_DESIGN ?? config.WEIGHTS ?? DEFAULT_WEIGHTS
}

export function withMatchingDefaults(config?: Partial<MatchingConfig>): MatchingConfig {
  return {
    ...DEFAULT_MATCHING_CONFIG,
    ...config,
    WEIGHTS: {
      ...DEFAULT_WEIGHTS,
      ...config?.WEIGHTS,
    },
  }
}
