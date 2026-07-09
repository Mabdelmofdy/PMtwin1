import { getComplianceMetadata, getEducationalContent, getKnowledgeMetadata, getLifecycleMetadata, getRiskProfile } from '@pm-twin/collaboration-models'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { ExplanationReason } from '../types/reason.ts'
import { EXPLANATION_SEVERITY } from '../types/severity.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { createKnowledgeBridge } from './knowledge-bridge-impl.ts'
import type { KnowledgeAnswer, KnowledgeBridge } from './knowledge-bridge.ts'
import {
  normalizeExplainabilityLocale,
  resolveLocalizedKnowledge,
} from './locale.ts'

export type KnowledgeExtension = {
  readonly subModelKey?: string
  readonly whatIsIt?: string
  readonly whyUseIt?: string
  readonly advantages?: readonly string[]
  readonly risks?: readonly string[]
  readonly compliance?: {
    readonly requiresLegalReview: boolean
    readonly requiresFinancialReview: boolean
    readonly requiresKyc: boolean
    readonly requiresBoardApproval: boolean
  }
  readonly lifecycle?: {
    readonly typicalStages: readonly string[]
    readonly terminalStages: readonly string[]
    readonly recommendedNextStage?: string
  }
  readonly reasonHints?: readonly KnowledgeAnswer[]
}

export type EnrichmentOptions = {
  readonly subModelKey?: string
  readonly locale?: string
  readonly knowledgeBridge?: KnowledgeBridge
}

function uniqueReasonCodes(bundle: ExplanationBundle): readonly string[] {
  const codes = new Set<string>()

  for (const reason of bundle.reasons) {
    codes.add(reason.code)
  }

  for (const blocker of bundle.blockers) {
    codes.add(blocker.reasonCode)
  }

  for (const recommendation of bundle.recommendations) {
    codes.add(recommendation.reasonCode)
  }

  return [...codes]
}

function buildKnowledgeExtension(
  bundle: ExplanationBundle,
  bridge: KnowledgeBridge,
  subModelKey?: string,
  locale?: string,
): KnowledgeExtension | undefined {
  if (!subModelKey) return undefined

  const requestContext = { subModelKey, locale }
  const education = getEducationalContent(subModelKey)
  const complianceMeta = getComplianceMetadata(subModelKey)
  const riskProfile = getRiskProfile(subModelKey)
  const lifecycleMeta = getLifecycleMetadata(subModelKey)

  const reasonHints: KnowledgeAnswer[] = []
  const seen = new Set<string>()

  for (const code of uniqueReasonCodes(bundle)) {
    const answer = bridge.resolveKnowledgeAnswer({
      reasonCode: code as ReasonCode,
      entityId: bundle.entityId,
      locale,
      context: requestContext,
    })

    if (!answer) continue

    const key = `${answer.reasonCode}:${answer.title}:${answer.body}`
    if (seen.has(key)) continue
    seen.add(key)
    reasonHints.push(answer)
  }

  const complianceFlags = complianceMeta
    ? {
        requiresLegalReview: complianceMeta.requiresLegalReview,
        requiresFinancialReview: complianceMeta.requiresFinancialReview,
        requiresKyc: complianceMeta.requiresKyc,
        requiresBoardApproval: complianceMeta.requiresBoardApproval,
      }
    : undefined

  return {
    subModelKey,
    whatIsIt: education?.whatIsIt,
    whyUseIt: education?.whyUseIt,
    advantages: education?.advantages,
    risks: [
      ...(education?.risks ?? []),
      ...(riskProfile?.riskFactors ?? []),
      ...(riskProfile?.mitigationHints ?? []),
    ],
    compliance: complianceFlags,
    lifecycle: lifecycleMeta
      ? {
          typicalStages: lifecycleMeta.typicalStages,
          terminalStages: lifecycleMeta.terminalStages,
          recommendedNextStage: lifecycleMeta.recommendedNextStage,
        }
      : undefined,
    reasonHints: reasonHints.length > 0 ? reasonHints : undefined,
  }
}

function supplementaryReasons(
  bundle: ExplanationBundle,
  knowledge: KnowledgeExtension | undefined,
): readonly ExplanationReason[] {
  if (!knowledge?.reasonHints?.length) {
    return bundle.reasons
  }

  const existingBodies = new Set(bundle.reasons.map((reason) => reason.message))
  const additions: ExplanationReason[] = []

  for (const hint of knowledge.reasonHints.slice(0, 3)) {
    if (existingBodies.has(hint.body)) continue

    additions.push({
      code: hint.reasonCode,
      message: `${hint.title}: ${hint.body}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'knowledge',
    })
  }

  if (additions.length === 0) {
    return bundle.reasons
  }

  return [...bundle.reasons, ...additions]
}

export function enrichExplanationBundle(
  bundle: ExplanationBundle,
  options?: EnrichmentOptions,
): ExplanationBundle {
  const bridge = options?.knowledgeBridge ?? createKnowledgeBridge()
  const subModelKey = options?.subModelKey
  const locale = normalizeExplainabilityLocale(
    options?.locale ?? bundle.metadata.locale,
  )

  const knowledge = buildKnowledgeExtension(bundle, bridge, subModelKey, locale)
  const knowledgeMetadata = subModelKey ? getKnowledgeMetadata(subModelKey) : undefined

  if (!knowledge) {
    return {
      ...bundle,
      metadata: {
        ...bundle.metadata,
        locale,
      },
    }
  }

  const localizedKnowledge = resolveLocalizedKnowledge(knowledge, locale)

  return {
    ...bundle,
    reasons: supplementaryReasons(bundle, localizedKnowledge),
    metadata: {
      ...bundle.metadata,
      locale,
      knowledgeVersion: knowledgeMetadata?.knowledgeVersion ?? bundle.metadata.knowledgeVersion,
      extensions: {
        ...bundle.metadata.extensions,
        knowledge: localizedKnowledge,
        localeResolved: locale,
      },
    },
  }
}
