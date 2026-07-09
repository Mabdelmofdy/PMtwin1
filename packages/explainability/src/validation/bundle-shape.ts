import { ENGINE_ID } from '../types/engine.ts'
import { HEALTH } from '../types/health.ts'
import {
  EXPLANATION_SEVERITY,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from '../types/severity.ts'
import { isReasonCode } from '../reason-codes/index.ts'
import type { ExplanationBundle } from '../types/bundle.ts'

const HEALTH_VALUES = new Set<string>(Object.values(HEALTH))
const ENGINE_VALUES = new Set<string>(Object.values(ENGINE_ID))
const SEVERITY_VALUES = new Set<string>(Object.values(EXPLANATION_SEVERITY))
const PRIORITY_VALUES = new Set<string>(Object.values(RECOMMENDATION_PRIORITY))
const TIMELINE_STATUS_VALUES = new Set<string>(
  Object.values(TIMELINE_EVENT_STATUS),
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isExplanationMetadata(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.generatedAt === 'string' &&
    typeof value.engineVersion === 'string' &&
    (value.knowledgeVersion === undefined || isNumber(value.knowledgeVersion)) &&
    (value.locale === undefined || typeof value.locale === 'string') &&
    (value.source === undefined || typeof value.source === 'string') &&
    (value.tags === undefined || isStringArray(value.tags)) &&
    (value.extensions === undefined || isRecord(value.extensions))
  )
}

function isScoreBreakdownEntry(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.label === 'string' &&
    isNumber(value.weight) &&
    isNumber(value.score) &&
    isNumber(value.maxScore) &&
    Array.isArray(value.reasonCodes) &&
    value.reasonCodes.every((code) => isReasonCode(code))
  )
}

function isExplanationReason(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReasonCode(value.code) &&
    typeof value.message === 'string' &&
    typeof value.severity === 'string' &&
    SEVERITY_VALUES.has(value.severity) &&
    (value.category === undefined || typeof value.category === 'string') &&
    (value.relatedEntityId === undefined ||
      typeof value.relatedEntityId === 'string')
  )
}

function isBlockingFactor(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReasonCode(value.reasonCode) &&
    typeof value.severity === 'string' &&
    SEVERITY_VALUES.has(value.severity) &&
    (value.blockingEntity === undefined ||
      typeof value.blockingEntity === 'string') &&
    (value.resolutionHint === undefined ||
      typeof value.resolutionHint === 'string')
  )
}

function isStrengthWeaknessEntry(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReasonCode(value.code) &&
    typeof value.label === 'string' &&
    (value.impactPercent === undefined || isNumber(value.impactPercent))
  )
}

function isRecommendation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    isReasonCode(value.reasonCode) &&
    typeof value.priority === 'string' &&
    PRIORITY_VALUES.has(value.priority) &&
    isNumber(value.impactPercent) &&
    isNumber(value.estimatedScore) &&
    (value.href === undefined || typeof value.href === 'string') &&
    typeof value.category === 'string' &&
    typeof value.severity === 'string' &&
    SEVERITY_VALUES.has(value.severity) &&
    (value.metadata === undefined || isExplanationMetadata(value.metadata))
  )
}

function isTimelineEvent(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.type === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.status === 'string' &&
    TIMELINE_STATUS_VALUES.has(value.status) &&
    (value.relatedEntity === undefined ||
      typeof value.relatedEntity === 'string')
  )
}

export function isExplanationBundle(value: unknown): value is ExplanationBundle {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.engine === 'string' &&
    ENGINE_VALUES.has(value.engine) &&
    typeof value.entityId === 'string' &&
    isNumber(value.score) &&
    typeof value.health === 'string' &&
    HEALTH_VALUES.has(value.health) &&
    typeof value.summary === 'string' &&
    Array.isArray(value.scoreBreakdown) &&
    value.scoreBreakdown.every(isScoreBreakdownEntry) &&
    Array.isArray(value.reasons) &&
    value.reasons.every(isExplanationReason) &&
    Array.isArray(value.blockers) &&
    value.blockers.every(isBlockingFactor) &&
    Array.isArray(value.strengths) &&
    value.strengths.every(isStrengthWeaknessEntry) &&
    Array.isArray(value.weaknesses) &&
    value.weaknesses.every(isStrengthWeaknessEntry) &&
    Array.isArray(value.recommendations) &&
    value.recommendations.every(isRecommendation) &&
    Array.isArray(value.timeline) &&
    value.timeline.every(isTimelineEvent) &&
    isExplanationMetadata(value.metadata)
  )
}

export const EXPLANATION_BUNDLE_KEYS = [
  'engine',
  'entityId',
  'score',
  'health',
  'summary',
  'scoreBreakdown',
  'reasons',
  'blockers',
  'strengths',
  'weaknesses',
  'recommendations',
  'timeline',
  'metadata',
] as const
