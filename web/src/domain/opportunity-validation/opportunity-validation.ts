import type {
  DuplicateDraftCandidate,
  OpportunityValidationInput,
  PublishReadinessSnapshot,
  PublishValidationResult,
  RunRulesOptions,
  ValidationContext,
  ValidationIssue,
  ValidationResult,
  ValidationRuleGroup,
  ValidationScope,
} from '@pm-twin/validation'
import {
  evaluatePublishValidation,
  formatPublishValidationMessages,
  humanMessages,
  shouldBlockOperation,
  validateOpportunityBusiness,
  validateOpportunityFields,
} from '@pm-twin/validation'
import type { Opportunity } from '@/types/domain.ts'
import type { PublishReadinessResult } from '@/domain/publish-readiness/types.ts'

export type OpportunityValidationLiveState = 'valid' | 'warning' | 'error'

export function toOpportunityValidationInput(
  opportunity: Partial<Opportunity> | null | undefined,
): OpportunityValidationInput {
  if (!opportunity) return {}
  const attrs = opportunity.attributes ?? {}
  const exchangeData = opportunity.exchangeData ?? {}
  const normalized = opportunity.normalized as
    | { skills?: unknown; offeredServices?: unknown; requiredServices?: unknown }
    | undefined
  const baseScope = (opportunity.scope ?? {}) as Record<string, unknown>
  const scopeSkills = Array.isArray(baseScope.requiredSkills)
    ? (baseScope.requiredSkills as string[])
    : Array.isArray(baseScope.offeredSkills)
      ? (baseScope.offeredSkills as string[])
      : []
  const normalizedSkills = Array.isArray(normalized?.skills)
    ? (normalized.skills as string[])
    : []
  // Prefer first-class structuredSkills; otherwise keep scope, seeding from
  // normalized.skills when seed/fixture opportunities only have normalized.
  const scope: Record<string, unknown> = { ...baseScope }
  if (
    !opportunity.structuredSkills?.length &&
    scopeSkills.length === 0 &&
    normalizedSkills.length > 0
  ) {
    if (opportunity.intent === 'offer') {
      scope.offeredSkills = normalizedSkills
    } else {
      scope.requiredSkills = normalizedSkills
    }
  }

  return {
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    intent: opportunity.intent,
    status: opportunity.status,
    location: opportunity.location,
    country: opportunity.country,
    city: opportunity.city,
    workMode: opportunity.workMode,
    mainCollaborationModel: opportunity.mainCollaborationModel,
    modelType: opportunity.modelType,
    subModelType: opportunity.subModelType,
    exchangeMode: opportunity.exchangeMode,
    startDate:
      opportunity.startDate ??
      (typeof attrs.startDate === 'string' ? attrs.startDate : undefined),
    endDate: opportunity.endDate,
    duration: opportunity.duration,
    deliveryDeadline: opportunity.deliveryDeadline,
    budget: opportunity.budget,
    ownerId: opportunity.ownerPartyId,
    creatorId: opportunity.creatorId,
    structuredSkills: opportunity.structuredSkills,
    workPackages: opportunity.workPackages,
    capacity: opportunity.capacity,
    scope,
    exchangeData: exchangeData as Record<string, unknown>,
    collaborationAttributes: opportunity.collaborationAttributes,
    complianceRequirements: opportunity.complianceRequirements,
    attachments: opportunity.attachments,
    attributes: attrs as Record<string, unknown>,
  }
}

export function toPublishReadinessSnapshot(
  gate: PublishReadinessResult,
): PublishReadinessSnapshot {
  return {
    allowed: gate.allowed,
    profileReady: gate.profileReadiness.status === 'ready_for_matching',
    opportunityPublishReady: gate.canonicalOpportunityReadiness.publishReady,
    opportunityScore: gate.canonicalOpportunityReadiness.score,
    missingProfileRequired: gate.missingProfileRequired,
    missingOpportunityRequired: gate.missingOpportunityRequired,
  }
}

export function runFieldValidation(
  opportunity: Partial<Opportunity>,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  return validateOpportunityFields(
    toOpportunityValidationInput(opportunity),
    context,
    options,
  )
}

export function runBusinessValidation(
  opportunity: Partial<Opportunity>,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  return validateOpportunityBusiness(
    toOpportunityValidationInput(opportunity),
    context,
    options,
  )
}

export function runDraftValidation(
  opportunity: Partial<Opportunity>,
  context: ValidationContext & {
    readonly existingDrafts?: readonly DuplicateDraftCandidate[]
  } = {},
): { readonly result: ValidationResult; readonly blocked: boolean; readonly messages: readonly string[] } {
  const input = toOpportunityValidationInput(opportunity)
  const field = validateOpportunityFields(input, { ...context, operationScope: 'draft' }, {
    scopes: ['draft'],
  })
  const business = validateOpportunityBusiness(
    input,
    { ...context, operationScope: 'draft' },
    { scopes: ['draft'] },
  )
  const result: ValidationResult = {
    valid: field.valid && business.valid,
    issues: [...field.issues, ...business.issues],
  }
  const blocked = shouldBlockOperation(result.issues, 'draft')
  return {
    result,
    blocked,
    messages: humanMessages(result.issues.filter((i) => shouldBlockOperation([i], 'draft'))),
  }
}

export function runUpdateValidation(
  opportunity: Partial<Opportunity>,
  context: ValidationContext = {},
): { readonly result: ValidationResult; readonly blocked: boolean; readonly messages: readonly string[] } {
  const input = toOpportunityValidationInput(opportunity)
  const field = validateOpportunityFields(input, { ...context, operationScope: 'update' }, {
    scopes: ['update'],
  })
  const business = validateOpportunityBusiness(
    input,
    { ...context, operationScope: 'update', isExistingDraft: context.isExistingDraft ?? true },
    { scopes: ['update'] },
  )
  const result: ValidationResult = {
    valid: field.valid && business.valid,
    issues: [...field.issues, ...business.issues],
  }
  const blocked = shouldBlockOperation(result.issues, 'update')
  return {
    result,
    blocked,
    messages: humanMessages(result.issues.filter((i) => shouldBlockOperation([i], 'update'))),
  }
}

export function composePublishValidation(input: {
  readonly opportunity: Partial<Opportunity>
  readonly publishReadiness: PublishReadinessResult
  readonly vettingApproved: boolean
  readonly taxonomyValid?: boolean
  readonly taxonomyErrors?: readonly string[]
}): PublishValidationResult {
  const context: ValidationContext = {
    operationScope: 'publish',
    isExistingDraft: true,
    taxonomyValid: input.taxonomyValid,
    taxonomyErrors: input.taxonomyErrors,
  }
  const fieldResult = runFieldValidation(input.opportunity, context, {
    scopes: ['publish'],
  })
  const businessResult = runBusinessValidation(input.opportunity, context, {
    scopes: ['publish'],
  })
  return evaluatePublishValidation({
    fieldResult,
    businessResult,
    publishReadiness: toPublishReadinessSnapshot(input.publishReadiness),
    vettingStatus: { approved: input.vettingApproved },
  })
}

export function liveStateForField(
  issues: readonly ValidationIssue[],
  fieldPath: string,
): OpportunityValidationLiveState {
  const relevant = issues.filter((i) =>
    i.fieldPaths.some((p) => p === fieldPath || p.startsWith(`${fieldPath}.`) || fieldPath.startsWith(p)),
  )
  if (relevant.some((i) => i.severity === 'error' || i.severity === 'blocker')) {
    return 'error'
  }
  if (relevant.some((i) => i.severity === 'warning')) return 'warning'
  return 'valid'
}

export function messagesForField(
  issues: readonly ValidationIssue[],
  fieldPath: string,
): readonly string[] {
  return humanMessages(
    issues.filter((i) =>
      i.fieldPaths.some(
        (p) => p === fieldPath || p.startsWith(`${fieldPath}.`) || fieldPath.startsWith(p),
      ),
    ),
  )
}

export function validateGroups(
  opportunity: Partial<Opportunity>,
  groups: readonly ValidationRuleGroup[],
  scope: ValidationScope = 'draft',
  context: ValidationContext = {},
): ValidationResult {
  return runBusinessValidation(
    opportunity,
    { ...context, operationScope: scope },
    { groups, scopes: [scope] },
  )
}

export { formatPublishValidationMessages, shouldBlockOperation, humanMessages }
