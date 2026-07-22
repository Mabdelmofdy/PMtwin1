/**
 * Opportunity creation readiness — wizard draft → field-level Opportunity Readiness.
 *
 * Single source of truth: `evaluateOpportunityReadiness` (same as publish gate).
 * Wizard stages are a completion checklist only — they do NOT invent a separate score.
 *
 * This is NOT matchScore. Match scores belong only on PostMatch / Match records.
 */

import {
  getSubModel,
  validateSubModelAttributes,
  VALUE_EXCHANGE_FIELD_GROUPS,
  type ExchangeMode,
} from '@pm-twin/collaboration-models'
import {
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@pm-twin/collaboration-models'
import {
  evaluateOpportunityReadiness,
  evaluateOpportunityReadinessCanonical,
} from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type {
  OpportunityReadinessResult,
  OpportunityReadinessStatus,
  ReadinessResult,
} from '@/domain/opportunity-readiness/types.ts'

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
  /** Recommended readiness fields (raise Completion Score to 100%). */
  readonly preferredPartnerType?: string
  readonly attachmentsText?: string
  readonly complianceRequirementsText?: string
  readonly deliveryMilestonesText?: string
  /**
   * Creation 3.0 structured milestones — counted for Delivery Milestones readiness
   * when deliveryMilestonesText is empty.
   */
  readonly milestones?: ReadonlyArray<{ readonly title?: string }>
  /**
   * Creation 3.0 commercial structure — counted for Budget / Value Terms readiness.
   */
  readonly commercialStructure?: {
    readonly components?: ReadonlyArray<{
      readonly type?: string
      readonly enabled?: boolean
      readonly budgetType?: string
      readonly fixedAmount?: number
      readonly minimumAmount?: number
      readonly maximumAmount?: number
      readonly notes?: string
      readonly paymentTerms?: string
      readonly paymentSchedule?: readonly unknown[]
    }>
  }
}

export type OpportunityWizardReadinessStage = {
  readonly id: OpportunityWizardReadinessStageId
  readonly label: string
  readonly weight: number
  readonly complete: boolean
  /** Informational progress only — score comes from field-level readiness. */
  readonly earned: number
}

export type OpportunityWizardReadinessResult = {
  /** Same value as publish-gate opportunity readiness score. */
  readonly readinessScore: number
  readonly completionScore: number
  readonly score: number
  readonly status: OpportunityReadinessStatus
  readonly publishReady: boolean
  readonly publishThreshold: number
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly presentRequired: readonly string[]
  readonly presentRecommended: readonly string[]
  readonly fieldReadiness: OpportunityReadinessResult
  readonly canonicalReadiness: ReadinessResult
  readonly stages: readonly OpportunityWizardReadinessStage[]
  readonly completedStageIds: readonly OpportunityWizardReadinessStageId[]
}

export const EMPTY_OPPORTUNITY_WIZARD_DRAFT: OpportunityWizardDraft = {
  title: '',
  /** Empty until Type step — keeps new-draft readinessScore at 0. */
  intent: '',
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
  preferredPartnerType: '',
  attachmentsText: '',
  complianceRequirementsText: '',
  deliveryMilestonesText: '',
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

function toAttachmentRecords(text: string | undefined): { name: string }[] {
  return splitCsv(text).map((name) => ({ name }))
}

function toMilestoneRecords(text: string | undefined): { title: string }[] {
  return splitCsv(text).map((title) => ({ title }))
}

function resolveWizardMilestoneRecords(
  draft: OpportunityWizardDraft,
): { title: string }[] {
  const fromText = toMilestoneRecords(draft.deliveryMilestonesText)
  if (fromText.length > 0) return fromText
  const structured = draft.milestones ?? []
  return structured
    .map((item) => (typeof item?.title === 'string' ? item.title.trim() : ''))
    .filter(Boolean)
    .map((title) => ({ title }))
}

/** Map Creation 3.0 cash commercial structure into exchangeData for readiness. */
function applyCommercialStructureToExchangeData(
  exchangeData: Record<string, unknown>,
  draft: OpportunityWizardDraft,
): Record<string, unknown> | undefined {
  const components = draft.commercialStructure?.components ?? []
  const cash = components.find(
    (component) => component.type === 'cash' && component.enabled !== false,
  )
  if (!cash) return undefined

  const amount =
    cash.fixedAmount
    ?? cash.maximumAmount
    ?? cash.minimumAmount
  if (amount != null && Number.isFinite(amount)) {
    exchangeData.cashAmount = amount
  }
  if (cash.minimumAmount != null || cash.maximumAmount != null) {
    exchangeData.budgetRange = {
      ...(cash.minimumAmount != null ? { min: cash.minimumAmount } : {}),
      ...(cash.maximumAmount != null ? { max: cash.maximumAmount } : {}),
    }
  }
  if (hasText(cash.paymentTerms)) {
    exchangeData.cashPaymentTerms = cash.paymentTerms
  }
  if (Array.isArray(cash.paymentSchedule) && cash.paymentSchedule.length > 0) {
    exchangeData.paymentSchedule = cash.paymentSchedule
  }

  // Range/notes-only cash still counts as Budget / Value Terms (recommended).
  return {
    paymentTerms: hasText(cash.paymentTerms)
      ? cash.paymentTerms
      : 'cash',
    ...(amount != null ? { budget: String(amount) } : {}),
    ...(hasText(cash.notes) ? { notes: cash.notes!.trim() } : {}),
    ...(cash.budgetType ? { budgetType: cash.budgetType } : {}),
  }
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

/**
 * Build a readiness evaluator bag from a wizard draft without inventing
 * collaboration taxonomy defaults. Unselected model fields stay empty so
 * new drafts score 0. Includes recommended fields so 100% is reachable.
 */
export function buildOpportunityWizardReadinessInput(
  draft: OpportunityWizardDraft,
): Record<string, unknown> {
  const skills = splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  const sectors = hasText(draft.sector) ? [draft.sector!.trim()] : []
  const rawIntent = (draft.intent ?? '').trim().toLowerCase()
  const intent =
    rawIntent === 'offer' || rawIntent === 'hybrid' || rawIntent === 'need'
      ? rawIntent
      : undefined
  const attrs = draft.collaborationAttributes ?? {}
  const attachments = toAttachmentRecords(draft.attachmentsText)
  const compliance = splitCsv(draft.complianceRequirementsText)
  const milestones = resolveWizardMilestoneRecords(draft)

  const exchangeData: Record<string, unknown> = {
    ...(hasText(draft.exchangeMode) ? { exchangeMode: draft.exchangeMode } : {}),
    ...(draft.paymentModes && draft.paymentModes.length > 0
      ? { accepted_modes: [...draft.paymentModes] }
      : {}),
  }

  // Mirror value-exchange attrs into exchangeData so Budget / Value Terms scores.
  if (attrs.budgetRange) exchangeData.budgetRange = attrs.budgetRange
  if (attrs.budget) exchangeData.budgetRange = attrs.budget
  if (attrs.cashAmount != null) exchangeData.cashAmount = attrs.cashAmount
  if (attrs.paymentSchedule) exchangeData.paymentSchedule = attrs.paymentSchedule
  if (attrs.cashPaymentTerms) exchangeData.cashPaymentTerms = attrs.cashPaymentTerms
  if (attrs.value != null) exchangeData.value = attrs.value
  if (attrs.barterOffer) exchangeData.barterOffer = attrs.barterOffer
  if (attrs.offeredService) exchangeData.barterOffer = attrs.offeredService
  if (attrs.equivalenceEstimate) exchangeData.equivalenceEstimate = attrs.equivalenceEstimate
  if (attrs.profitSplit) exchangeData.profitSplit = attrs.profitSplit
  if (attrs.equityPercentage) exchangeData.equityPercentage = attrs.equityPercentage
  const commercialTermsFromStructure =
    applyCommercialStructureToExchangeData(exchangeData, draft)

  const input: Record<string, unknown> = {
    title: draft.title ?? '',
    description: draft.description ?? '',
    location: draft.location ?? '',
    scope: {
      sectors,
      ...(intent === 'offer'
        ? { offeredSkills: skills, coreSkills: skills }
        : intent === 'hybrid'
          ? { requiredSkills: skills, offeredSkills: skills, coreSkills: skills }
          : { requiredSkills: skills, coreSkills: skills }),
      ...(compliance.length > 0 ? { complianceRequirements: compliance } : {}),
    },
    attributes: {
      targetRole: draft.targetRole ?? '',
      startDate: hasText(draft.startDate) ? draft.startDate : undefined,
      tenderDeadline: hasText(draft.tenderDeadline) ? draft.tenderDeadline : undefined,
      ...(hasText(draft.preferredPartnerType)
        ? { preferredPartnerType: draft.preferredPartnerType!.trim() }
        : {}),
      ...(milestones.length > 0 ? { deliveryMilestones: milestones } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
    },
    collaborationAttributes: { ...attrs },
    exchangeData,
    ...(commercialTermsFromStructure
      ? { commercialTerms: commercialTermsFromStructure }
      : {}),
    normalized: {
      role: hasText(draft.targetRole) ? draft.targetRole!.trim() : undefined,
      ...(intent === 'offer'
        ? {
            offeredServices: skills.length > 0 ? skills : services,
            skills: skills.length > 0 ? skills : services,
          }
        : intent === 'hybrid'
          ? {
              requiredServices: skills.length > 0 ? skills : services,
              offeredServices: skills.length > 0 ? skills : services,
              skills: skills.length > 0 ? skills : services,
            }
          : {
              requiredServices: skills.length > 0 ? skills : services,
              skills: skills.length > 0 ? skills : services,
            }),
    },
  }

  if (intent) {
    input.intent = intent
  }

  if (hasText(draft.preferredPartnerType)) {
    input.preferredPartnerType = draft.preferredPartnerType!.trim()
  }
  if (attachments.length > 0) {
    input.attachments = attachments
  }
  if (compliance.length > 0) {
    input.complianceRequirements = compliance
  }
  if (milestones.length > 0) {
    input.deliveryMilestones = milestones
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

/**
 * Evaluate wizard Opportunity Readiness using the same field-level rules as
 * the publish gate. Stages remain a checklist for stepper UX only.
 */
export function evaluateOpportunityWizardReadiness(
  draft?: OpportunityWizardDraft | null,
): OpportunityWizardReadinessResult {
  const record: OpportunityWizardDraft = draft ?? EMPTY_OPPORTUNITY_WIZARD_DRAFT
  const publishThreshold = OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin
  const readinessInput = buildOpportunityWizardReadinessInput(record)
  const canonicalReadiness = evaluateOpportunityReadinessCanonical(readinessInput)
  const fieldReadiness = evaluateOpportunityReadiness(readinessInput)

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

  const completedStageIds = stages
    .filter((stage) => stage.complete)
    .map((stage) => stage.id)

  const score = fieldReadiness.score
  const publishReady = canonicalReadiness.publishReady

  return {
    readinessScore: score,
    completionScore: score,
    score,
    status: fieldReadiness.status,
    publishReady,
    publishThreshold,
    missingRequired: fieldReadiness.missingRequired,
    missingRecommended: fieldReadiness.missingRecommended,
    presentRequired: fieldReadiness.presentRequired,
    presentRecommended: fieldReadiness.presentRecommended,
    fieldReadiness,
    canonicalReadiness,
    stages,
    completedStageIds,
  }
}

/** True when field-level readiness meets the publish gate (required complete + score ≥ 80). */
export function isOpportunityWizardPublishReady(
  draft?: OpportunityWizardDraft | null,
): boolean {
  return evaluateOpportunityWizardReadiness(draft).publishReady
}
