/** Pure field-presence checks for opportunity readiness (legacy alias support). */

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasPresentNumber(value: unknown): boolean {
  if (value == null || value === '') return false
  return Number.isFinite(Number(value))
}

function hasAnyString(
  opportunity: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => hasNonEmptyString(opportunity[key]))
}

function hasAnyArray(
  opportunity: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => hasNonEmptyArray(opportunity[key]))
}

function nested(
  opportunity: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  return asRecord(opportunity[key])
}

export function resolveIntent(
  opportunity: Record<string, unknown>,
): 'need' | 'offer' | 'hybrid' | undefined {
  const raw =
    opportunity.intent ??
    opportunity.type ??
    nested(opportunity, 'normalized').intent ??
    nested(opportunity, 'normalized').type
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'need' || value === 'offer' || value === 'hybrid') return value
  if (value === 'request') return 'need'
  if (value === 'provide' || value === 'supply') return 'offer'
  return undefined
}

function hasRoleNeeded(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  const scope = nested(opportunity, 'scope')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyString(opportunity, ['roleNeeded', 'requiredRole']) ||
    hasAnyString(attributes, ['roleNeeded', 'requiredRole', 'targetRole']) ||
    hasAnyString(scope, ['roleNeeded', 'requiredRole', 'targetRole']) ||
    hasAnyString(normalized, ['roleNeeded', 'requiredRole', 'role'])
  )
}

function hasRoleOffered(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  const scope = nested(opportunity, 'scope')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyString(opportunity, ['roleOffered', 'offeredRole']) ||
    hasAnyString(attributes, ['roleOffered', 'offeredRole', 'targetRole']) ||
    hasAnyString(scope, ['roleOffered', 'offeredRole', 'targetRole']) ||
    hasAnyString(normalized, ['roleOffered', 'offeredRole', 'role'])
  )
}

function hasRoleForIntent(opportunity: Record<string, unknown>): boolean {
  const intent = resolveIntent(opportunity)
  if (intent === 'need') return hasRoleNeeded(opportunity)
  if (intent === 'offer') return hasRoleOffered(opportunity)
  if (intent === 'hybrid') return hasRoleNeeded(opportunity) && hasRoleOffered(opportunity)
  return hasRoleNeeded(opportunity) || hasRoleOffered(opportunity)
}

function hasRequiredSkills(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const attributes = nested(opportunity, 'attributes')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyArray(opportunity, ['requiredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(scope, ['requiredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(attributes, ['requiredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(normalized, ['requiredSkills', 'coreSkills', 'skills', 'specializations'])
  )
}

function hasOfferedSkills(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const attributes = nested(opportunity, 'attributes')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyArray(opportunity, ['offeredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(scope, ['offeredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(attributes, ['offeredSkills', 'coreSkills', 'skills', 'specializations']) ||
    hasAnyArray(normalized, ['offeredSkills', 'coreSkills', 'skills', 'specializations'])
  )
}

function hasSkillsForIntent(opportunity: Record<string, unknown>): boolean {
  const intent = resolveIntent(opportunity)
  if (intent === 'need') return hasRequiredSkills(opportunity)
  if (intent === 'offer') return hasOfferedSkills(opportunity)
  if (intent === 'hybrid') return hasRequiredSkills(opportunity) && hasOfferedSkills(opportunity)
  return hasRequiredSkills(opportunity) || hasOfferedSkills(opportunity)
}

function hasRequiredServices(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyArray(opportunity, ['requiredServices', 'services']) ||
    hasAnyArray(scope, ['requiredServices', 'services']) ||
    hasAnyArray(normalized, ['requiredServices', 'services'])
  )
}

function hasOfferedServices(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyArray(opportunity, ['offeredServices', 'services']) ||
    hasAnyArray(scope, ['offeredServices', 'services']) ||
    hasAnyArray(normalized, ['offeredServices', 'services'])
  )
}

function hasServicesForIntent(opportunity: Record<string, unknown>): boolean {
  const intent = resolveIntent(opportunity)
  if (intent === 'need') return hasRequiredServices(opportunity)
  if (intent === 'offer') return hasOfferedServices(opportunity)
  if (intent === 'hybrid') return hasRequiredServices(opportunity) && hasOfferedServices(opportunity)
  return hasRequiredServices(opportunity) || hasOfferedServices(opportunity)
}

function hasCategoryOrProfession(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const attributes = nested(opportunity, 'attributes')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyString(opportunity, ['category', 'profession', 'sector']) ||
    hasAnyArray(opportunity, ['categories', 'sectors']) ||
    hasAnyArray(scope, ['sectors', 'categories', 'profession']) ||
    hasAnyString(attributes, ['profession', 'category', 'sector']) ||
    hasAnyArray(normalized, ['categories', 'sectors'])
  )
}

function hasLocationOrServiceArea(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyString(opportunity, ['location', 'serviceArea']) ||
    hasAnyArray(opportunity, ['serviceArea', 'serviceAreas', 'coverageAreas']) ||
    hasAnyString(attributes, ['locationRequirement', 'location', 'serviceArea']) ||
    hasAnyString(normalized, ['location', 'serviceArea']) ||
    hasAnyArray(normalized, ['serviceArea', 'serviceAreas'])
  )
}

function hasTimelineOrAvailability(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  const normalized = nested(opportunity, 'normalized')
  const timeline = nested(opportunity, 'timeline')
  const normalizedTimeline = nested(normalized, 'timeline')
  const availability = attributes.availability ?? opportunity.availability ?? normalized.availability

  if (hasNonEmptyString(opportunity.duration)) return true
  if (hasAnyString(attributes, ['startDate', 'endDate', 'tenderDeadline', 'applicationDeadline', 'duration'])) {
    return true
  }
  if (hasNonEmptyString(timeline.start) || hasNonEmptyString(timeline.end)) return true
  if (hasNonEmptyString(normalizedTimeline.start) || hasNonEmptyString(normalizedTimeline.end)) return true
  if (hasNonEmptyString(normalized.deadline)) return true
  if (hasNonEmptyString(availability)) return true
  if (availability !== null && typeof availability === 'object' && !Array.isArray(availability)) {
    const record = availability as Record<string, unknown>
    return hasNonEmptyString(record.start) || hasNonEmptyString(record.end)
  }
  return false
}

function hasCollaborationModel(opportunity: Record<string, unknown>): boolean {
  const normalized = nested(opportunity, 'normalized')
  return (
    hasAnyString(opportunity, ['modelType', 'collaborationType', 'collaborationModel', 'mainCollaborationModel', 'exchangeMode', 'subModelType']) ||
    hasAnyArray(opportunity, ['paymentModes']) ||
    hasAnyString(normalized, ['modelType', 'collaborationType', 'collaborationModel', 'mainCollaborationModel', 'exchangeMode', 'subModelType'])
  )
}

function hasDescriptionOrScope(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  if (hasAnyString(opportunity, ['description', 'details'])) return true
  if (hasNonEmptyString(scope.description) || hasNonEmptyString(scope.details)) return true
  if (
    hasAnyArray(scope, [
      'sectors',
      'coreSkills',
      'requiredSkills',
      'offeredSkills',
      'categories',
      'profession',
    ])
  ) {
    return true
  }
  return hasAnyString(scope, ['summary', 'profession', 'category', 'sector'])
}

function hasBudgetOrValueTerms(opportunity: Record<string, unknown>): boolean {
  const exchangeData = nested(opportunity, 'exchangeData')
  const commercialTerms = nested(opportunity, 'commercialTerms')
  const normalized = nested(opportunity, 'normalized')
  const attrs = nested(opportunity, 'collaborationAttributes')

  if (hasPresentNumber(opportunity.budget) || hasPresentNumber(opportunity.agreedValue)) return true
  if (hasNonEmptyArray(exchangeData.budgetRange) || asRecord(exchangeData.budgetRange).min != null) return true
  if (hasPresentNumber(exchangeData.cashAmount) || hasPresentNumber(exchangeData.value)) return true
  if (Object.keys(commercialTerms).length > 0) return true
  if (asRecord(normalized.budget).min != null || hasPresentNumber(normalized.budget)) return true
  if (asRecord(attrs.budget).min != null || hasPresentNumber(attrs.budget)) return true
  if (asRecord(attrs.budgetRange).min != null) return true
  if (hasPresentNumber(attrs.cashAmount)) return true
  return hasAnyString(opportunity, ['valueTerms', 'paymentSchedule'])
}

function hasPreferredPartnerType(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  return (
    hasAnyString(opportunity, ['preferredPartnerType', 'partnerType', 'targetPartnerType']) ||
    hasAnyString(attributes, ['preferredPartnerType', 'partnerType', 'targetPartnerType'])
  )
}

function hasAttachments(opportunity: Record<string, unknown>): boolean {
  return (
    hasAnyArray(opportunity, ['attachments', 'portfolioReferences', 'documents', 'files', 'references']) ||
    hasAnyArray(nested(opportunity, 'attributes'), ['attachments', 'documents'])
  )
}

function hasComplianceRequirements(opportunity: Record<string, unknown>): boolean {
  const scope = nested(opportunity, 'scope')
  const attributes = nested(opportunity, 'attributes')
  return (
    hasAnyArray(opportunity, ['complianceRequirements', 'certifications', 'regulatoryRequirements']) ||
    hasAnyArray(scope, ['certifications', 'complianceRequirements', 'regulatoryRequirements']) ||
    hasAnyArray(attributes, ['complianceRequirements', 'certifications', 'regulatoryRequirements'])
  )
}

function hasDeliveryMilestones(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  return (
    hasAnyArray(opportunity, ['deliveryMilestones', 'milestones']) ||
    hasAnyArray(attributes, ['deliveryMilestones', 'milestones'])
  )
}

const CORE_PRESENCE: Readonly<Record<string, (opportunity: Record<string, unknown>) => boolean>> = {
  title: (o) => hasAnyString(o, ['title', 'name']),
  intent: (o) => resolveIntent(o) != null,
  categoryProfession: hasCategoryOrProfession,
  roleIntent: hasRoleForIntent,
  skillsIntent: hasSkillsForIntent,
  servicesIntent: hasServicesForIntent,
  location: hasLocationOrServiceArea,
  timeline: hasTimelineOrAvailability,
  collaborationModel: hasCollaborationModel,
  descriptionScope: hasDescriptionOrScope,
  budgetValueTerms: hasBudgetOrValueTerms,
  preferredPartnerType: hasPreferredPartnerType,
  attachments: hasAttachments,
  compliance: hasComplianceRequirements,
  deliveryMilestones: hasDeliveryMilestones,
}

export function isCoreFieldPresent(
  fieldId: string,
  formState: Readonly<Record<string, unknown>>,
): boolean {
  const checker = CORE_PRESENCE[fieldId]
  return checker ? checker(formState as Record<string, unknown>) : false
}

export function isEmptyReadinessValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

export function fieldIdToReasonCode(fieldId: string): `READINESS_MISSING_${string}` {
  const snake = fieldId
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase()
    .replace(/^_/, '')
  return `READINESS_MISSING_${snake}`
}
