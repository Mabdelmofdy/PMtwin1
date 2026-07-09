import type { OpportunityCoreReadinessDefinition } from '../readiness/types.ts'

const REQUIRED_WEIGHT_EACH = 8
const RECOMMENDED_WEIGHT_EACH = 4

const CORE_FIELDS = [
  { id: 'title', label: 'Title', category: 'general' as const, priority: 'required' as const },
  { id: 'intent', label: 'Intent', category: 'general' as const, priority: 'required' as const },
  { id: 'categoryProfession', label: 'Category / Profession', category: 'general' as const, priority: 'required' as const },
  { id: 'roleIntent', label: 'Role Needed or Role Offered', category: 'requirements' as const, priority: 'required' as const },
  { id: 'skillsIntent', label: 'Skills Required or Offered', category: 'requirements' as const, priority: 'required' as const },
  { id: 'servicesIntent', label: 'Services Required or Offered', category: 'requirements' as const, priority: 'required' as const },
  { id: 'location', label: 'Location or Service Area', category: 'location' as const, priority: 'required' as const },
  { id: 'timeline', label: 'Timeline / Availability', category: 'timeline' as const, priority: 'required' as const },
  { id: 'collaborationModel', label: 'Collaboration Model', category: 'commercial' as const, priority: 'required' as const },
  { id: 'descriptionScope', label: 'Description / Scope', category: 'technical' as const, priority: 'required' as const },
  { id: 'budgetValueTerms', label: 'Budget / Value Terms', category: 'financial' as const, priority: 'recommended' as const },
  { id: 'preferredPartnerType', label: 'Preferred Partner Type', category: 'requirements' as const, priority: 'recommended' as const },
  { id: 'attachments', label: 'Attachments / Portfolio References', category: 'requirements' as const, priority: 'recommended' as const },
  { id: 'compliance', label: 'Compliance Requirements', category: 'legal' as const, priority: 'recommended' as const },
  { id: 'deliveryMilestones', label: 'Delivery Milestones', category: 'timeline' as const, priority: 'recommended' as const },
] as const

export const OPPORTUNITY_CORE_READINESS: OpportunityCoreReadinessDefinition = {
  requiredFields: CORE_FIELDS.filter((f) => f.priority === 'required').map((f) => f.id),
  optionalFields: CORE_FIELDS.filter((f) => f.priority === 'recommended').map((f) => f.id),
  minimumPublishFields: CORE_FIELDS.filter((f) => f.priority === 'required').map((f) => f.id),
  fields: CORE_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    category: field.category,
    priority: field.priority,
    weight: field.priority === 'required' ? REQUIRED_WEIGHT_EACH : RECOMMENDED_WEIGHT_EACH,
    requiredWeight: field.priority === 'required' ? REQUIRED_WEIGHT_EACH : 0,
    recommendedWeight: field.priority === 'recommended' ? RECOMMENDED_WEIGHT_EACH : 0,
  })),
}

export const OPPORTUNITY_READINESS_STATUS_THRESHOLDS = {
  incompleteMax: 60,
  readyMin: 80,
} as const

export const OPPORTUNITY_READINESS_SCORE_WEIGHTS = {
  required: 80,
  recommended: 20,
} as const
