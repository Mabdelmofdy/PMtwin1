import type { ExplanationBundle, Recommendation } from '@pm-twin/explainability'
import {
  aggregateRecommendations,
  buildAgreementExplanation as buildAgreementExplanationBundle,
  buildContractExplanation as buildContractExplanationBundle,
  buildMatchingExplanation as buildMatchingExplanationBundle,
  buildNegotiationExplanation as buildNegotiationExplanationBundle,
  buildOpportunityExplanation as buildOpportunityExplanationBundle,
  buildProfileExplanation as buildProfileExplanationBundle,
  buildVettingExplanation as buildVettingExplanationBundle,
  createRecommendationService,
} from '@pm-twin/explainability'
import type { ReadinessResult } from '@pm-twin/collaboration-models'
import { evaluateOpportunityReadinessCanonical } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type {
  ProfileKind,
  ProfileReadinessProfile,
  ProfileReadinessResult,
} from '@/domain/profile-readiness/types.ts'
import type { PublishReadinessResult } from '@/domain/publish-readiness/types.ts'
import type {
  VettingReadinessInput,
  VettingReadinessResult,
} from '@/domain/vetting-readiness/types.ts'
import type { CommercialAgreementDetailReadModel } from '@/lib/commercial-agreement-detail-read-model.ts'
import type { ContractDetailReadModel } from '@/lib/contract-detail-read-model.ts'
import type { NegotiationTranscriptReadModel } from '@/lib/negotiation-transcript-read-model.ts'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import {
  buildAgreementExplainabilitySnapshot,
  buildContractExplainabilitySnapshot,
  buildMatchExplainabilitySnapshot,
  buildNegotiationExplainabilitySnapshot,
  buildOpportunityReadinessSnapshot,
  buildProfileReadinessSnapshot,
  buildVettingReadinessSnapshot,
} from '@/services/explainability/snapshot-builders/index.ts'

export type ExplainabilityLocaleOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

const recommendationService = createRecommendationService()

export function buildProfileExplanation(
  userId: string,
  profileKind: ProfileKind,
  result: ProfileReadinessResult,
  profile?: ProfileReadinessProfile | null,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildProfileReadinessSnapshot(
    userId,
    profileKind,
    result,
    profile,
    options,
  )
  return buildProfileExplanationBundle(snapshot)
}

export function buildProfileExplanationFromEvaluation(
  userId: string,
  profileKind: ProfileKind,
  profile?: ProfileReadinessProfile | null,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const result = evaluateProfileReadiness({ profileKind, profile })
  return buildProfileExplanation(userId, profileKind, result, profile, options)
}

export function buildVettingExplanation(
  entityId: string,
  result: VettingReadinessResult,
  input: VettingReadinessInput,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildVettingReadinessSnapshot(entityId, result, input, options)
  return buildVettingExplanationBundle(snapshot)
}

export function buildOpportunityExplanation(
  opportunityId: string,
  canonical: ReadinessResult,
  options?: ExplainabilityLocaleOptions & { readonly subModelKey?: string },
): ExplanationBundle {
  const snapshot = buildOpportunityReadinessSnapshot(opportunityId, canonical, options)
  return buildOpportunityExplanationBundle(snapshot)
}

export function buildOpportunityExplanationFromForm(
  opportunityId: string,
  opportunity?: OpportunityReadinessOpportunity | null,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const canonical = evaluateOpportunityReadinessCanonical(opportunity)
  const subModelKey =
    typeof opportunity?.subModelType === 'string' ? opportunity.subModelType : undefined
  return buildOpportunityExplanation(opportunityId, canonical, {
    ...options,
    subModelKey,
  })
}

export function buildMatchExplanation(match: PostMatch, options?: ExplainabilityLocaleOptions): ExplanationBundle {
  const snapshot = buildMatchExplainabilitySnapshot(match, options)
  return buildMatchingExplanationBundle(snapshot)
}

export function buildAgreementExplanation(
  model: CommercialAgreementDetailReadModel,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildAgreementExplainabilitySnapshot(model, options)
  return buildAgreementExplanationBundle(snapshot)
}

export function buildContractExplanation(
  model: ContractDetailReadModel,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildContractExplainabilitySnapshot(model, options)
  return buildContractExplanationBundle(snapshot)
}

export function buildNegotiationExplanation(
  negotiation: Negotiation,
  transcript?: NegotiationTranscriptReadModel | null,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildNegotiationExplainabilitySnapshot(negotiation, transcript, options)
  return buildNegotiationExplanationBundle(snapshot)
}

export function buildPublishReadinessBundles(
  gate: PublishReadinessResult,
  entityIds: {
    readonly profileId: string
    readonly opportunityId: string
    readonly profileKind: ProfileKind
  },
  options?: ExplainabilityLocaleOptions,
): readonly ExplanationBundle[] {
  return [
    buildProfileExplanation(
      entityIds.profileId,
      entityIds.profileKind,
      gate.profileReadiness,
      undefined,
      options,
    ),
    buildOpportunityExplanation(
      entityIds.opportunityId,
      gate.canonicalOpportunityReadiness,
      options,
    ),
  ]
}

export function getAggregatedRecommendations(
  bundles: readonly ExplanationBundle[],
  limit?: number,
): readonly Recommendation[] {
  return aggregateRecommendations(bundles, limit != null ? { limit } : undefined)
}

export function bundleToReadinessTooltipLines(bundle: ExplanationBundle): readonly string[] {
  const lines: string[] = [`${Math.round(bundle.score)}% readiness`, bundle.summary]

  for (const reason of bundle.reasons.slice(0, 2)) {
    lines.push(reason.message)
  }

  for (const recommendation of bundle.recommendations.slice(0, 3)) {
    lines.push(`${recommendation.label} (+${recommendation.impactPercent}%)`)
  }

  return lines
}

export function bundleToMatchTooltipLines(bundle: ExplanationBundle): readonly string[] {
  const lines: string[] = [`${Math.round(bundle.score)}% match`, bundle.summary]

  for (const entry of bundle.scoreBreakdown.slice(0, 5)) {
    lines.push(`${entry.label}: ${Math.round(entry.score)}%`)
  }

  return lines
}

export { recommendationService }
