import { toCanonicalIntent } from '@/domain/intent.ts'
import type { OpportunityFieldRule } from '@/domain/opportunity-readiness/types.ts'

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

function resolveIntent(opportunity: Record<string, unknown>): ReturnType<typeof toCanonicalIntent> {
  const raw =
    opportunity.intent ??
    opportunity.type ??
    nested(opportunity, 'normalized').intent ??
    nested(opportunity, 'normalized').type
  return toCanonicalIntent(typeof raw === 'string' ? raw : undefined)
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
    hasAnyString(opportunity, ['modelType', 'collaborationType', 'collaborationModel', 'exchangeMode', 'subModelType']) ||
    hasAnyArray(opportunity, ['paymentModes']) ||
    hasAnyString(normalized, ['modelType', 'collaborationType', 'collaborationModel', 'exchangeMode', 'subModelType'])
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

function hasBudgetOrValueTerms(opportunity: Record<string, unknown>): boolean {
  const exchangeData = nested(opportunity, 'exchangeData')
  const commercialTerms = nested(opportunity, 'commercialTerms')
  const normalized = nested(opportunity, 'normalized')

  if (hasPresentNumber(opportunity.budget) || hasPresentNumber(opportunity.agreedValue)) return true
  if (hasNonEmptyArray(exchangeData.budgetRange) || asRecord(exchangeData.budgetRange).min != null) return true
  if (hasPresentNumber(exchangeData.cashAmount) || hasPresentNumber(exchangeData.value)) return true
  if (Object.keys(commercialTerms).length > 0) return true
  if (asRecord(normalized.budget).min != null || hasPresentNumber(normalized.budget)) return true
  return hasAnyString(opportunity, ['valueTerms', 'paymentSchedule'])
}

function hasPreferredPartnerType(opportunity: Record<string, unknown>): boolean {
  const attributes = nested(opportunity, 'attributes')
  return hasAnyString(opportunity, ['preferredPartnerType', 'partnerType', 'targetPartnerType']) ||
    hasAnyString(attributes, ['preferredPartnerType', 'partnerType', 'targetPartnerType'])
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

const REQUIRED_RULES: readonly OpportunityFieldRule[] = [
  {
    label: 'Title',
    isPresent: (opportunity) => hasAnyString(opportunity, ['title', 'name']),
  },
  {
    label: 'Intent',
    isPresent: (opportunity) => resolveIntent(opportunity) != null,
  },
  {
    label: 'Category / Profession',
    isPresent: hasCategoryOrProfession,
  },
  {
    label: 'Role Needed or Role Offered',
    isPresent: hasRoleForIntent,
  },
  {
    label: 'Skills Required or Offered',
    isPresent: hasSkillsForIntent,
  },
  {
    label: 'Services Required or Offered',
    isPresent: hasServicesForIntent,
  },
  {
    label: 'Location or Service Area',
    isPresent: hasLocationOrServiceArea,
  },
  {
    label: 'Timeline / Availability',
    isPresent: hasTimelineOrAvailability,
  },
  {
    label: 'Collaboration Model',
    isPresent: hasCollaborationModel,
  },
  {
    label: 'Description / Scope',
    isPresent: hasDescriptionOrScope,
  },
]

const RECOMMENDED_RULES: readonly OpportunityFieldRule[] = [
  {
    label: 'Budget / Value Terms',
    isPresent: hasBudgetOrValueTerms,
  },
  {
    label: 'Preferred Partner Type',
    isPresent: hasPreferredPartnerType,
  },
  {
    label: 'Attachments / Portfolio References',
    isPresent: hasAttachments,
  },
  {
    label: 'Compliance Requirements',
    isPresent: hasComplianceRequirements,
  },
  {
    label: 'Delivery Milestones',
    isPresent: hasDeliveryMilestones,
  },
]

export const OPPORTUNITY_READINESS_SCORE_WEIGHTS = {
  required: 75,
  recommended: 25,
} as const

export const OPPORTUNITY_READINESS_STATUS_THRESHOLDS = {
  incompleteMax: 60,
  readyMin: 80,
} as const

export function getOpportunityReadinessRules(): {
  readonly required: readonly OpportunityFieldRule[]
  readonly recommended: readonly OpportunityFieldRule[]
} {
  return {
    required: REQUIRED_RULES,
    recommended: RECOMMENDED_RULES,
  }
}
