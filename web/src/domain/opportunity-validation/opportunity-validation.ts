import type {
  DuplicateDraftCandidate,
  OpportunityValidationInput,
  PublishReadinessSnapshot,
  PublishValidationResult,
  RunRulesOptions,
  StructuredSkillInput,
  ValidationContext,
  ValidationIssue,
  ValidationResult,
  ValidationRuleGroup,
  ValidationScope,
  WorkPackageInput,
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
import {
  normalizeWorkPackages,
  opportunityCoreFields,
  resolveWorkPackagesEffective,
  skillNames,
} from '@/domain/opportunity-creation'

export type OpportunityValidationLiveState = 'valid' | 'warning' | 'error'

function mapStructuredSkills(
  source: unknown,
  intentRole: 'required' | 'provided',
): StructuredSkillInput[] | undefined {
  if (!Array.isArray(source)) return undefined
  const mapped = source
    .map((skill): StructuredSkillInput | null => {
      if (typeof skill === 'string') {
        const name = skill.trim()
        return name ? { name, role: intentRole } : null
      }
      if (!skill || typeof skill !== 'object') return null
      const record = skill as Record<string, unknown>
      const name =
        typeof record.name === 'string'
          ? record.name.trim()
          : typeof record.skillId === 'string'
            ? record.skillId.trim()
            : ''
      if (!name) return null
      const role =
        record.role === 'provided' || record.role === 'required'
          ? record.role
          : intentRole
      const years =
        typeof record.years === 'number'
          ? record.years
          : typeof record.yearsRequired === 'number'
            ? record.yearsRequired
            : undefined
      return {
        name,
        role,
        skillId:
          typeof record.skillId === 'string' ? record.skillId : undefined,
        level: typeof record.level === 'string' ? record.level : undefined,
        years,
      }
    })
    .filter((skill): skill is StructuredSkillInput => skill != null)
  return mapped.length > 0 ? mapped : undefined
}

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
    ? (baseScope.requiredSkills as unknown[])
    : Array.isArray(baseScope.offeredSkills)
      ? (baseScope.offeredSkills as unknown[])
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

  const collabAttrs = opportunity.collaborationAttributes as
    | {
        structuredSkills?: unknown
        availabilityEndDate?: unknown
        workPackages?: unknown
        experienceLevel?: unknown
      }
    | undefined
  const intentRole =
    opportunity.intent === 'offer'
      ? ('provided' as const)
      : ('required' as const)
  const structuredSkills =
    mapStructuredSkills(opportunity.structuredSkills, intentRole) ??
    mapStructuredSkills(collabAttrs?.structuredSkills, intentRole)
  const tenderDeadline =
    typeof attrs.tenderDeadline === 'string' ? attrs.tenderDeadline : undefined
  const availabilityEndDate =
    typeof collabAttrs?.availabilityEndDate === 'string'
      ? collabAttrs.availabilityEndDate
      : undefined

  const startDate =
    opportunity.startDate ??
    (typeof attrs.startDate === 'string' ? attrs.startDate : undefined)

  const sparseSource =
    (Array.isArray(collabAttrs?.workPackages) &&
    (collabAttrs.workPackages as unknown[]).length > 0
      ? collabAttrs.workPackages
      : undefined) ??
    opportunity.workPackages

  let workPackages: WorkPackageInput[] | undefined

  if (Array.isArray(sparseSource) && sparseSource.length > 0) {
    const structuredForCore =
      structuredSkills?.map((s) => ({
        name: s.name ?? s.skillId ?? '',
        level: (s.level as 'basic' | 'intermediate' | 'expert') ?? 'basic',
        yearsRequired: s.years,
        certificationRequired: false,
        mandatory: true,
      })) ?? []
    const effective = resolveWorkPackagesEffective(
      normalizeWorkPackages(sparseSource),
      opportunityCoreFields({
        location: opportunity.location,
        startDate,
        tenderDeadline,
        structuredSkills: structuredForCore,
        experienceLevel:
          typeof collabAttrs?.experienceLevel === 'string'
            ? collabAttrs.experienceLevel
            : undefined,
      }),
    )
    workPackages = effective.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      skills: skillNames(pkg.requiredSkills),
      requiredSkills: pkg.requiredSkills.map((s) => ({
        name: s.name,
        role: intentRole,
        level: s.level,
        years: s.yearsRequired,
      })),
      deadline: pkg.deadline,
    }))
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
    startDate,
    endDate: opportunity.endDate,
    duration: opportunity.duration,
    deliveryDeadline: opportunity.deliveryDeadline ?? tenderDeadline,
    tenderDeadline,
    availabilityEndDate,
    budget: opportunity.budget,
    ownerId: opportunity.ownerPartyId,
    creatorId: opportunity.creatorId,
    structuredSkills,
    workPackages,
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
