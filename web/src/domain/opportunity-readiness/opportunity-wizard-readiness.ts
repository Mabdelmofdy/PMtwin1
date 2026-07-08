/**
 * Opportunity creation readiness — progressive stage scoring for the create/edit wizard.
 *
 * This is NOT matchScore. Match scores belong only on PostMatch / Match records
 * after matching runs. Wizard UI must show Opportunity Readiness / Completion Score only.
 */

import {
  getSubModel,
  validateSubModelAttributes,
  VALUE_EXCHANGE_FIELD_GROUPS,
  type ExchangeMode,
} from '@pm-twin/collaboration-models'
import {
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'
import type { OpportunityReadinessStatus } from '@/domain/opportunity-readiness/types.ts'

export const OPPORTUNITY_WIZARD_READINESS_STAGE_WEIGHTS = {
  basicInfo: 15,
  mainCollaborationModel: 10,
  subModel: 10,
  subModelFields: 15,
  valueExchange: 10,
  timelineLocationSkills: 15,
  review: 25,
} as const

export type OpportunityWizardReadinessStageId =
  | keyof typeof OPPORTUNITY_WIZARD_READINESS_STAGE_WEIGHTS

export type OpportunityWizardDraft = {
  readonly title?: string
  readonly intent?: string
  readonly description?: string
  readonly location?: string
  readonly mainCollaborationModel?: string
  readonly modelType?: string
  readonly subModelType?: string
  readonly exchangeMode?: string
  readonly paymentModes?: readonly string[]
  readonly targetRole?: string
  readonly sector?: string
  readonly skills?: string
  readonly services?: string
  readonly startDate?: string
  readonly tenderDeadline?: string
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
}

export type OpportunityWizardReadinessStage = {
  readonly id: OpportunityWizardReadinessStageId
  readonly label: string
  readonly weight: number
  readonly complete: boolean
  readonly earned: number
}

export type OpportunityWizardReadinessResult = {
  /** Alias for UI / API consumers — never a match score. */
  readonly readinessScore: number
  readonly completionScore: number
  readonly score: number
  readonly status: OpportunityReadinessStatus
  readonly publishReady: boolean
  readonly publishThreshold: number
  readonly stages: readonly OpportunityWizardReadinessStage[]
  readonly completedStageIds: readonly OpportunityWizardReadinessStageId[]
}

export const EMPTY_OPPORTUNITY_WIZARD_DRAFT: OpportunityWizardDraft = {
  title: '',
  intent: 'need',
  description: '',
  location: '',
  mainCollaborationModel: '',
  modelType: '',
  subModelType: '',
  exchangeMode: '',
  paymentModes: [],
  targetRole: '',
  sector: '',
  skills: '',
  services: '',
  startDate: '',
  tenderDeadline: '',
  collaborationAttributes: {},
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function splitCsv(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasPresentValue(value: unknown): boolean {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return hasText(value)
}

function normalizeMode(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/-/g, '_')
}

function isBasicInfoComplete(draft: OpportunityWizardDraft): boolean {
  return (
    hasText(draft.title) &&
    hasText(draft.description) &&
    hasText(draft.intent) &&
    hasText(draft.sector) &&
    hasText(draft.targetRole)
  )
}

function isMainModelComplete(draft: OpportunityWizardDraft): boolean {
  return hasText(draft.mainCollaborationModel) && hasText(draft.modelType)
}

function isSubModelComplete(draft: OpportunityWizardDraft): boolean {
  if (!hasText(draft.subModelType)) return false
  const sub = getSubModel(draft.subModelType!)
  if (!sub) return false
  if (hasText(draft.mainCollaborationModel) && sub.mainCollaborationModel !== draft.mainCollaborationModel) {
    return false
  }
  return true
}

function isSubModelFieldsComplete(draft: OpportunityWizardDraft): boolean {
  if (!isSubModelComplete(draft)) return false
  const result = validateSubModelAttributes(
    draft.subModelType!,
    draft.collaborationAttributes ?? {},
  )
  return result.valid
}

function resolveExchangeMode(draft: OpportunityWizardDraft): ExchangeMode | null {
  const mode = normalizeMode(draft.exchangeMode)
  if (mode in VALUE_EXCHANGE_FIELD_GROUPS) return mode as ExchangeMode
  return null
}

function isValueExchangeComplete(draft: OpportunityWizardDraft): boolean {
  const mode = resolveExchangeMode(draft)
  if (!mode) return false
  if ((draft.paymentModes?.length ?? 0) === 0 && !hasText(draft.exchangeMode)) return false

  const attrs = draft.collaborationAttributes ?? {}
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode]

  return group.requiredFields.every((key) => {
    if (hasPresentValue(attrs[key])) return true
    // Common aliases used by sub-model / exchange draft builders
    if (key === 'budget') {
      return (
        hasPresentValue(attrs.budget) ||
        hasPresentValue(attrs.budgetRange) ||
        hasPresentValue(attrs.cashAmount)
      )
    }
    if (key === 'paymentSchedule') {
      return hasPresentValue(attrs.paymentSchedule) || hasPresentValue(attrs.cashPaymentTerms)
    }
    if (key === 'offeredService') {
      return hasPresentValue(attrs.offeredService) || hasPresentValue(attrs.barterOffer)
    }
    if (key === 'requestedService') {
      return hasPresentValue(attrs.requestedService) || hasPresentValue(attrs.barterPreferences)
    }
    if (key === 'profitSplit') {
      return hasPresentValue(attrs.profitSplit) || hasPresentValue(attrs.profitDistribution)
    }
    if (key === 'equityPercentage') {
      return hasPresentValue(attrs.equityPercentage) || hasPresentValue(attrs.equitySplit)
    }
    if (key === 'ownershipTerms') {
      return hasPresentValue(attrs.ownershipTerms) || hasPresentValue(attrs.vestingTerms)
    }
    return false
  })
}

function isTimelineLocationSkillsComplete(draft: OpportunityWizardDraft): boolean {
  const skills = splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  return (
    hasText(draft.location) &&
    (hasText(draft.startDate) || hasText(draft.tenderDeadline)) &&
    (skills.length > 0 || services.length > 0)
  )
}

function isReviewComplete(draft: OpportunityWizardDraft): boolean {
  return (
    isBasicInfoComplete(draft) &&
    isMainModelComplete(draft) &&
    isSubModelComplete(draft) &&
    isSubModelFieldsComplete(draft) &&
    isValueExchangeComplete(draft) &&
    isTimelineLocationSkillsComplete(draft)
  )
}

const STAGE_DEFINITIONS: readonly {
  readonly id: OpportunityWizardReadinessStageId
  readonly label: string
  readonly isComplete: (draft: OpportunityWizardDraft) => boolean
}[] = [
  { id: 'basicInfo', label: 'Basic Info', isComplete: isBasicInfoComplete },
  {
    id: 'mainCollaborationModel',
    label: 'Main Collaboration Model',
    isComplete: isMainModelComplete,
  },
  { id: 'subModel', label: 'Sub Model', isComplete: isSubModelComplete },
  {
    id: 'subModelFields',
    label: 'Required Sub-Model Fields',
    isComplete: isSubModelFieldsComplete,
  },
  {
    id: 'valueExchange',
    label: 'Value Exchange Mode',
    isComplete: isValueExchangeComplete,
  },
  {
    id: 'timelineLocationSkills',
    label: 'Timeline / Location / Skills',
    isComplete: isTimelineLocationSkillsComplete,
  },
  { id: 'review', label: 'Review', isComplete: isReviewComplete },
]

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveStatus(
  score: number,
  publishReady: boolean,
): OpportunityReadinessStatus {
  if (publishReady) return 'ready_for_matching'
  if (score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.incompleteMax) return 'incomplete'
  return 'needs_review'
}

/**
 * Evaluate creation/edit Opportunity Readiness (Completion Score).
 * Empty / unsaved drafts start at readinessScore = 0.
 */
export function evaluateOpportunityWizardReadiness(
  draft?: OpportunityWizardDraft | null,
): OpportunityWizardReadinessResult {
  const record: OpportunityWizardDraft = draft ?? EMPTY_OPPORTUNITY_WIZARD_DRAFT
  const publishThreshold = OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin

  const stages: OpportunityWizardReadinessStage[] = STAGE_DEFINITIONS.map((def) => {
    const weight = OPPORTUNITY_WIZARD_READINESS_STAGE_WEIGHTS[def.id]
    const complete = def.isComplete(record)
    return {
      id: def.id,
      label: def.label,
      weight,
      complete,
      earned: complete ? weight : 0,
    }
  })

  const score = roundScore(stages.reduce((sum, stage) => sum + stage.earned, 0))
  const publishReady = score >= publishThreshold
  const completedStageIds = stages
    .filter((stage) => stage.complete)
    .map((stage) => stage.id)

  return {
    readinessScore: score,
    completionScore: score,
    score,
    status: resolveStatus(score, publishReady),
    publishReady,
    publishThreshold,
    stages,
    completedStageIds,
  }
}

/** True when wizard readiness meets the publish gate threshold (default ≥ 80). */
export function isOpportunityWizardPublishReady(
  draft?: OpportunityWizardDraft | null,
): boolean {
  return evaluateOpportunityWizardReadiness(draft).publishReady
}

/**
 * Build a readiness evaluator bag from a wizard draft without inventing
 * collaboration taxonomy defaults. Unselected model fields stay empty so
 * new drafts score 0.
 */
export function buildOpportunityWizardReadinessInput(
  draft: OpportunityWizardDraft,
): Record<string, unknown> {
  const skills = splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  const sectors = hasText(draft.sector) ? [draft.sector!.trim()] : []
  const intent = draft.intent === 'offer' ? 'offer' : draft.intent === 'hybrid' ? 'hybrid' : 'need'

  const input: Record<string, unknown> = {
    title: draft.title ?? '',
    intent,
    description: draft.description ?? '',
    location: draft.location ?? '',
    scope: {
      sectors,
      ...(intent === 'offer'
        ? { offeredSkills: skills, coreSkills: skills }
        : { requiredSkills: skills, coreSkills: skills }),
    },
    attributes: {
      targetRole: draft.targetRole ?? '',
      startDate: hasText(draft.startDate) ? draft.startDate : undefined,
      tenderDeadline: hasText(draft.tenderDeadline) ? draft.tenderDeadline : undefined,
    },
    collaborationAttributes: { ...(draft.collaborationAttributes ?? {}) },
    exchangeData: {
      ...(hasText(draft.exchangeMode) ? { exchangeMode: draft.exchangeMode } : {}),
      ...(draft.paymentModes && draft.paymentModes.length > 0
        ? { accepted_modes: [...draft.paymentModes] }
        : {}),
    },
    normalized:
      intent === 'offer'
        ? { offeredServices: services }
        : { requiredServices: services },
  }

  if (hasText(draft.mainCollaborationModel)) {
    input.mainCollaborationModel = draft.mainCollaborationModel
  }
  if (hasText(draft.modelType)) {
    input.modelType = draft.modelType
  }
  if (hasText(draft.subModelType)) {
    input.subModelType = draft.subModelType
  }
  if (hasText(draft.exchangeMode)) {
    input.exchangeMode = draft.exchangeMode
  }
  if (draft.paymentModes && draft.paymentModes.length > 0) {
    input.paymentModes = [...draft.paymentModes]
    input.acceptedExchangeModes = [...draft.paymentModes]
  }

  return input
}
