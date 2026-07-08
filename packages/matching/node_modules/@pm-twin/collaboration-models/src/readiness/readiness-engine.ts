import { getKnowledgeMetadata } from '../knowledge/api.ts'
import { OPPORTUNITY_CORE_READINESS } from '../knowledge/opportunity-core-readiness.ts'
import { buildDynamicForm, resolveConditionalFields } from '../forms/dynamic-form-engine.ts'
import { getReadinessDefinition } from '../knowledge/api.ts'
import { isCoreFieldPresent, isEmptyReadinessValue } from './field-presence.ts'
import {
  buildBlockingReasons,
  buildExplanations,
  buildNextBestActions,
  explanationsToMessages,
} from './explainability/index.ts'
import {
  resolveReadinessHealth,
  resolveReadinessLevel,
  roundReadinessScore,
} from './readiness-levels.ts'
import { READINESS_ENGINE_VERSION } from './types.ts'
import type {
  ReadinessEvaluateInput,
  ReadinessFieldContribution,
  ReadinessResult,
  ReadinessSnapshot,
} from './types.ts'

const resultCache = new Map<string, ReadinessResult>()

function stableCacheKey(input: ReadinessEvaluateInput): string {
  const sub = input.subModelKey ?? ''
  const ctx = JSON.stringify(input.contextValues ?? {})
  const state = JSON.stringify(input.formState)
  return `${sub}::${ctx}::${state}`
}

export function clearReadinessCaches(): void {
  resultCache.clear()
}

function mergedValues(
  formState: Readonly<Record<string, unknown>>,
  contextValues?: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return { ...formState, ...contextValues }
}

function buildSnapshot(subModelKey?: string): ReadinessSnapshot {
  const meta = subModelKey ? getKnowledgeMetadata(subModelKey) : undefined
  return {
    generatedAt: new Date().toISOString(),
    knowledgeVersion: meta?.knowledgeVersion ?? 1,
    formVersion: meta?.schemaVersion ?? '1.0',
    engineVersion: READINESS_ENGINE_VERSION,
  }
}

function evaluateCoreContributions(
  formState: Readonly<Record<string, unknown>>,
): readonly ReadinessFieldContribution[] {
  return OPPORTUNITY_CORE_READINESS.fields.map((field) => {
    const present = isCoreFieldPresent(field.id, formState)
    return {
      fieldId: field.id,
      label: field.label,
      category: field.category,
      present,
      requiredWeight: field.requiredWeight,
      recommendedWeight: field.recommendedWeight,
      earnedRequired: present ? field.requiredWeight : 0,
      earnedRecommended: present ? field.recommendedWeight : 0,
      scope: 'core' as const,
    }
  })
}

function evaluateSubModelContributions(
  subModelKey: string,
  values: Readonly<Record<string, unknown>>,
): readonly ReadinessFieldContribution[] {
  const readiness = getReadinessDefinition(subModelKey)
  const form = buildDynamicForm(subModelKey)
  if (!readiness || !form) return []

  const attrs = (values.collaborationAttributes ?? values) as Record<string, unknown>
  const merged = mergedValues(attrs, values)
  const visible = resolveConditionalFields(form.fields, merged).filter((f) => f.visible)

  return visible.map((field) => {
    const weight = readiness.fieldWeights.find((w) => w.fieldId === field.id)
    const isRequired = readiness.requiredFields.includes(field.id)
    const isOptional = readiness.optionalFields.includes(field.id)
    const raw = merged[field.id] ?? attrs[field.id]
    const present = !isEmptyReadinessValue(raw)
    const requiredWeight = isRequired ? (weight?.requiredWeight ?? 0) : 0
    const recommendedWeight = isOptional ? (weight?.recommendedWeight ?? 0) : 0

    return {
      fieldId: field.id,
      label: field.label,
      category: field.group,
      present,
      requiredWeight,
      recommendedWeight,
      earnedRequired: present ? requiredWeight : 0,
      earnedRecommended: present ? recommendedWeight : 0,
      scope: 'subModel' as const,
    }
  })
}

function computeScores(contributions: readonly ReadinessFieldContribution[]): {
  score: number
  requiredScore: number
  recommendedScore: number
  completedRequiredWeight: number
  completedRecommendedWeight: number
} {
  const coreOnly = contributions.filter((c) => c.scope === 'core')
  let earnedRequired = 0
  let earnedRecommended = 0
  let totalRequired = 0
  let totalRecommended = 0

  for (const field of coreOnly) {
    totalRequired += field.requiredWeight
    totalRecommended += field.recommendedWeight
    earnedRequired += field.earnedRequired
    earnedRecommended += field.earnedRecommended
  }

  const requiredRatio = totalRequired === 0 ? 1 : earnedRequired / totalRequired
  const recommendedRatio = totalRecommended === 0 ? 1 : earnedRecommended / totalRecommended
  const score = roundReadinessScore(requiredRatio * 80 + recommendedRatio * 20)

  return {
    score,
    requiredScore: roundReadinessScore(requiredRatio * 100),
    recommendedScore: roundReadinessScore(recommendedRatio * 100),
    completedRequiredWeight: earnedRequired,
    completedRecommendedWeight: earnedRecommended,
  }
}

function partitionLists(contributions: readonly ReadinessFieldContribution[]) {
  const missingRequiredFields: string[] = []
  const missingRecommendedFields: string[] = []
  const completedRequiredFields: string[] = []
  const completedRecommendedFields: string[] = []
  const completedFields: string[] = []

  for (const field of contributions) {
    if (field.present) {
      completedFields.push(field.label)
      if (field.requiredWeight > 0) completedRequiredFields.push(field.label)
      if (field.recommendedWeight > 0) completedRecommendedFields.push(field.label)
    } else {
      if (field.requiredWeight > 0) missingRequiredFields.push(field.label)
      if (field.recommendedWeight > 0) missingRecommendedFields.push(field.label)
    }
  }

  return {
    missingRequiredFields,
    missingRecommendedFields,
    completedRequiredFields,
    completedRecommendedFields,
    completedFields,
  }
}

function isPublishReady(
  contributions: readonly ReadinessFieldContribution[],
  score: number,
): boolean {
  const coreRequired = contributions.filter(
    (c) => c.scope === 'core' && c.requiredWeight > 0,
  )
  const allCoreRequired = coreRequired.every((c) => c.present)
  return allCoreRequired && score >= 80
}

/** Canonical readiness evaluator — Knowledge Registry + Dynamic Forms. */
export function evaluateReadiness(input: ReadinessEvaluateInput): ReadinessResult {
  const cacheKey = stableCacheKey(input)
  const cached = resultCache.get(cacheKey)
  if (cached) return cached

  const subModelKey =
    input.subModelKey ??
    (typeof input.formState.subModelType === 'string'
      ? input.formState.subModelType
      : undefined)

  const coreContributions = evaluateCoreContributions(input.formState)
  const subModelContributions = subModelKey
    ? evaluateSubModelContributions(subModelKey, input.formState)
    : []

  const contributions = [...coreContributions, ...subModelContributions]
  const scores = computeScores(contributions)
  const lists = partitionLists(coreContributions)
  const publishReady = isPublishReady(contributions, scores.score)
  const readinessLevel = resolveReadinessLevel(
    scores.score,
    publishReady,
    lists.missingRecommendedFields.length,
  )
  const health = resolveReadinessHealth(
    scores.score,
    publishReady,
    lists.missingRequiredFields.length,
    lists.missingRecommendedFields.length,
  )
  const blockingReasons = buildBlockingReasons(coreContributions)
  const explanations = buildExplanations(coreContributions, scores.score)
  const nextBestActions = buildNextBestActions(
    coreContributions,
    publishReady,
  )

  const result: ReadinessResult = {
    ...scores,
    ...lists,
    fieldContributions: contributions,
    explanations,
    nextBestActions,
    blockingReasons,
    publishReady,
    readinessLevel,
    health,
    snapshot: buildSnapshot(subModelKey),
    explanation: explanationsToMessages(explanations),
  }

  resultCache.set(cacheKey, result)
  return result
}
