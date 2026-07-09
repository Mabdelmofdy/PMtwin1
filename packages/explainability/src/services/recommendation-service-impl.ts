import { agreementExplainabilityAdapter } from '../adapters/agreement-adapter.ts'
import type { AgreementExplainabilitySnapshot } from '../adapters/agreement-types.ts'
import { contractExplainabilityAdapter } from '../adapters/contract-adapter.ts'
import type { ContractExplainabilitySnapshot } from '../adapters/contract-types.ts'
import { matchingExplainabilityAdapter } from '../adapters/matching-adapter.ts'
import type { MatchExplainabilitySnapshot } from '../adapters/matching-types.ts'
import { negotiationExplainabilityAdapter } from '../adapters/negotiation-adapter.ts'
import type { NegotiationExplainabilitySnapshot } from '../adapters/negotiation-types.ts'
import {
  opportunityExplainabilityAdapter,
  readinessExplainabilityAdapter,
} from '../adapters/opportunity-adapter.ts'
import type { OpportunityReadinessSnapshot } from '../adapters/opportunity-types.ts'
import { profileExplainabilityAdapter } from '../adapters/profile-adapter.ts'
import type { ProfileReadinessSnapshot } from '../adapters/profile-types.ts'
import { vettingExplainabilityAdapter } from '../adapters/vetting-adapter.ts'
import type { VettingReadinessSnapshot } from '../adapters/vetting-types.ts'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { RecommendationPriority } from '../types/severity.ts'
import { RECOMMENDATION_PRIORITY } from '../types/severity.ts'
import type {
  RecommendationService,
  RecommendationServiceInput,
} from './recommendation-service.ts'

export const DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT = 10 as const

const PRIORITY_ORDER: Readonly<Record<RecommendationPriority, number>> = {
  [RECOMMENDATION_PRIORITY.CRITICAL]: 0,
  [RECOMMENDATION_PRIORITY.HIGH]: 1,
  [RECOMMENDATION_PRIORITY.MEDIUM]: 2,
  [RECOMMENDATION_PRIORITY.LOW]: 3,
}

function mergeSnapshot<T extends { entityId: string }>(
  entityId: string,
  input: RecommendationServiceInput,
): T {
  return { ...input, entityId } as T
}

export type AggregateRecommendationsOptions = {
  readonly limit?: number
}

/**
 * De-duplicates recommendations across engine bundles by reasonCode + label,
 * sorts by priority (critical → low) then impactPercent descending, and caps results.
 */
export function aggregateRecommendations(
  bundles: readonly ExplanationBundle[],
  options?: AggregateRecommendationsOptions,
): readonly Recommendation[] {
  const limit = options?.limit ?? DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT
  const deduped = new Map<string, Recommendation>()

  for (const bundle of bundles) {
    for (const recommendation of bundle.recommendations) {
      const key = `${recommendation.reasonCode}::${recommendation.label}`
      const existing = deduped.get(key)
      if (
        !existing
        || recommendation.impactPercent > existing.impactPercent
        || PRIORITY_ORDER[recommendation.priority]
          < PRIORITY_ORDER[existing.priority]
      ) {
        deduped.set(key, recommendation)
      }
    }
  }

  return [...deduped.values()]
    .sort((left, right) => {
      const priorityDiff =
        PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]
      if (priorityDiff !== 0) return priorityDiff
      return right.impactPercent - left.impactPercent
    })
    .slice(0, limit)
}

export function createRecommendationService(): RecommendationService {
  return {
    forProfile(entityId, input) {
      const snapshot = mergeSnapshot<ProfileReadinessSnapshot>(entityId, input)
      return profileExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forVetting(entityId, input) {
      const snapshot = mergeSnapshot<VettingReadinessSnapshot>(entityId, input)
      return vettingExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forOpportunity(entityId, input) {
      const snapshot = mergeSnapshot<OpportunityReadinessSnapshot>(entityId, input)
      const engine = typeof input.engine === 'string' ? input.engine : undefined
      if (engine === 'readiness') {
        return readinessExplainabilityAdapter.buildRecommendations(snapshot)
      }
      return opportunityExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forMatching(entityId, input) {
      const snapshot = mergeSnapshot<MatchExplainabilitySnapshot>(entityId, input)
      return matchingExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forNegotiation(entityId, input) {
      const snapshot = mergeSnapshot<NegotiationExplainabilitySnapshot>(
        entityId,
        input,
      )
      return negotiationExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forAgreement(entityId, input) {
      const snapshot = mergeSnapshot<AgreementExplainabilitySnapshot>(
        entityId,
        input,
      )
      return agreementExplainabilityAdapter.buildRecommendations(snapshot)
    },

    forContract(entityId, input) {
      const snapshot = mergeSnapshot<ContractExplainabilitySnapshot>(
        entityId,
        input,
      )
      return contractExplainabilityAdapter.buildRecommendations(snapshot)
    },
  }
}
