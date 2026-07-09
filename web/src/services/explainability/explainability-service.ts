import type { ExplanationBundle, Recommendation } from '@pm-twin/explainability'
import {
  aggregateRecommendations,
  buildAgreementExplanation as buildAgreementExplanationBundle,
  buildAnalyticsExplanation as buildAnalyticsExplanationBundle,
  buildContractExplanation as buildContractExplanationBundle,
  buildDashboardExplanation as buildDashboardExplanationBundle,
  buildMatchingExplanation as buildMatchingExplanationBundle,
  buildNegotiationExplanation as buildNegotiationExplanationBundle,
  buildOpportunityExplanation as buildOpportunityExplanationBundle,
  buildProfileExplanation as buildProfileExplanationBundle,
  buildVettingExplanation as buildVettingExplanationBundle,
  createKnowledgeBridge,
  createRecommendationService,
  enrichExplanationBundle,
  normalizeExplainabilityLocale,
  traceExplainabilityBuild,
  type ExplainabilityTrace,
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
  buildAnalyticsExplainabilitySnapshot,
  buildContractExplainabilitySnapshot,
  buildDashboardExplainabilitySnapshot,
  buildMatchExplainabilitySnapshot,
  buildNegotiationExplainabilitySnapshot,
  buildOpportunityReadinessSnapshot,
  buildProfileReadinessSnapshot,
  buildVettingReadinessSnapshot,
  resolveAgreementSubModelKey,
} from '@/services/explainability/snapshot-builders/index.ts'
import type {
  AnalyticsSnapshotInput,
  DashboardSnapshotInput,
} from '@/services/explainability/snapshot-builders/index.ts'

export type ExplainabilityLocaleOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
  readonly subModelKey?: string
}

export type ExplainabilityBuildResult = {
  readonly bundle: ExplanationBundle
  readonly trace: ExplainabilityTrace
}

const recommendationService = createRecommendationService()
const knowledgeBridge = createKnowledgeBridge()

const isDevEnvironment =
  typeof import.meta !== 'undefined' &&
  Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)

function resolveLocale(options?: ExplainabilityLocaleOptions): string {
  return normalizeExplainabilityLocale(options?.locale)
}

function logExplainabilityTrace(trace: ExplainabilityTrace): void {
  if (!isDevEnvironment) return
  console.debug('[explainability]', trace)
}

function attachTraceToBundle(
  bundle: ExplanationBundle,
  trace: ExplainabilityTrace,
): ExplanationBundle {
  return {
    ...bundle,
    metadata: {
      ...bundle.metadata,
      extensions: {
        ...bundle.metadata.extensions,
        trace,
      },
    },
  }
}

function traceBuild(
  label: string,
  build: () => ExplanationBundle,
): ExplainabilityBuildResult {
  const { result, trace } = traceExplainabilityBuild(label, build)
  logExplainabilityTrace(trace)
  return {
    bundle: attachTraceToBundle(result, trace),
    trace,
  }
}

export function enrichBundle(
  bundle: ExplanationBundle,
  options?: Pick<ExplainabilityLocaleOptions, 'subModelKey' | 'locale'>,
): ExplanationBundle {
  return enrichExplanationBundle(bundle, {
    subModelKey: options?.subModelKey,
    locale: resolveLocale(options),
    knowledgeBridge,
  })
}

function maybeEnrich(
  bundle: ExplanationBundle,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  if (!options?.subModelKey) return bundle
  return enrichBundle(bundle, options)
}

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
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildOpportunityReadinessSnapshot(opportunityId, canonical, options)
  return maybeEnrich(buildOpportunityExplanationBundle(snapshot), options)
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
  const subModelKey =
    options?.subModelKey ?? resolveAgreementSubModelKey(model, options)
  const snapshot = buildAgreementExplainabilitySnapshot(model, {
    ...options,
    subModelKey,
  })
  const enrichedOptions = { ...options, locale: resolveLocale(options), subModelKey }
  return traceBuild('agreement', () =>
    maybeEnrich(buildAgreementExplanationBundle(snapshot), enrichedOptions),
  ).bundle
}

export function buildDashboardExplanation(
  input: DashboardSnapshotInput,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildDashboardExplainabilitySnapshot(input, {
    locale: resolveLocale(options),
    evaluatedAt: options?.evaluatedAt,
  })
  return traceBuild('dashboard', () => buildDashboardExplanationBundle(snapshot)).bundle
}

export function buildAnalyticsExplanation(
  input: AnalyticsSnapshotInput,
  options?: ExplainabilityLocaleOptions,
): ExplanationBundle {
  const snapshot = buildAnalyticsExplainabilitySnapshot(input, {
    locale: resolveLocale(options),
    evaluatedAt: options?.evaluatedAt,
  })
  return traceBuild('analytics', () => buildAnalyticsExplanationBundle(snapshot)).bundle
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
  return maybeEnrich(buildNegotiationExplanationBundle(snapshot), options)
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
