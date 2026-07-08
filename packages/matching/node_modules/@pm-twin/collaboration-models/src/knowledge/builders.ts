import type { SubModelFieldDefinition } from '../types.ts'
import type {
  DashboardWidgetRecommendation,
  DynamicFieldDefinition,
  FieldConditionSet,
  FieldGroupId,
  SubModelKnowledgeMetadata,
} from './types.ts'

/** Equity-related fields shown only when exchange mode is equity. */
const EQUITY_VISIBLE_FIELD_IDS = new Set([
  'equitySplit',
  'equityStructure',
  'equityPercentage',
  'ownershipTerms',
  'vestingTerms',
  'equityComponent',
])

function inferFieldWidth(
  type: DynamicFieldDefinition['type'],
): NonNullable<DynamicFieldDefinition['ui']>['width'] {
  if (
    type === 'textarea'
    || type === 'array-objects'
    || type === 'array-percentages'
    || type === 'currency-range'
    || type === 'date-range'
    || type === 'attachment'
  ) {
    return 'full'
  }
  return 'half'
}

function mapLegacyConditional(
  attr: SubModelFieldDefinition,
): FieldConditionSet | undefined {
  if (!attr.conditional) return undefined
  const value = attr.conditional.value
  if (Array.isArray(value)) {
    return { field: attr.conditional.field, op: 'in', value }
  }
  return { field: attr.conditional.field, op: 'eq', value }
}

function equityVisibleWhen(fieldId: string): FieldConditionSet | undefined {
  if (!EQUITY_VISIBLE_FIELD_IDS.has(fieldId)) return undefined
  // Hide only when a non-equity exchange mode is explicitly selected.
  // Empty / unset exchangeMode keeps fields visible (wizard default UX).
  return {
    field: 'exchangeMode',
    op: 'notIn',
    value: ['cash', 'barter', 'profit_sharing', 'hybrid'],
  }
}

export const DEFAULT_KNOWLEDGE_METADATA: SubModelKnowledgeMetadata = {
  schemaVersion: '1.0',
  knowledgeVersion: 1,
  lastUpdated: '2026-07',
  deprecated: false,
  stability: 'stable',
}

export const CORE_DASHBOARD_WIDGETS: readonly DashboardWidgetRecommendation[] = [
  { id: 'success_rate', label: 'Success Rate', metricKey: 'success_rate' },
  { id: 'avg_duration', label: 'Average Duration', metricKey: 'avg_duration' },
  {
    id: 'avg_commercial_value',
    label: 'Average Commercial Value',
    metricKey: 'avg_commercial_value',
  },
  { id: 'top_industries', label: 'Top Industries', metricKey: 'top_industries' },
  {
    id: 'most_used_exchange_mode',
    label: 'Most Used Exchange Mode',
    metricKey: 'most_used_exchange_mode',
  },
]

const TYPE_TO_GROUP: Partial<Record<string, FieldGroupId>> = {
  currency: 'financial',
  'currency-range': 'financial',
  date: 'timeline',
  'date-range': 'timeline',
  datetime: 'timeline',
  location: 'location',
  skills: 'requirements',
  equipment: 'resources',
  resource: 'resources',
  attachment: 'requirements',
}

/** Infer a field group from legacy attribute id/type. */
export function inferFieldGroup(
  field: SubModelFieldDefinition,
): FieldGroupId {
  const key = field.key.toLowerCase()
  if (key.includes('budget') || key.includes('salary') || key.includes('equity') || key.includes('capital') || key.includes('profit') || key.includes('payment') || key.includes('price') || key.includes('financial') || key.includes('prize')) {
    return 'financial'
  }
  if (key.includes('date') || key.includes('duration') || key.includes('deadline') || key.includes('timeline') || key.includes('schedule') || key.includes('availability')) {
    return 'timeline'
  }
  if (key.includes('location') || key.includes('geography')) {
    return 'location'
  }
  if (key.includes('skill') || key.includes('experience') || key.includes('requirement') || key.includes('eligibility') || key.includes('criteria')) {
    return 'requirements'
  }
  if (key.includes('governance') || key.includes('legal') || key.includes('rule') || key.includes('compliance')) {
    return 'legal'
  }
  if (key.includes('risk')) {
    return 'risk'
  }
  if (key.includes('asset') || key.includes('resource') || key.includes('equipment') || key.includes('quantity') || key.includes('participant')) {
    return 'resources'
  }
  if (key.includes('scope') || key.includes('deliverable') || key.includes('technical') || key.includes('evaluation')) {
    return 'technical'
  }
  return TYPE_TO_GROUP[field.type] ?? 'general'
}

/** Map legacy attribute types onto dynamic knowledge field types where useful. */
export function mapLegacyFieldType(
  type: SubModelFieldDefinition['type'],
): DynamicFieldDefinition['type'] {
  if (type === 'tags') return 'skills'
  if (type === 'multi-select') return 'multiselect'
  return type
}

export function attributesToDynamicFields(
  attributes: readonly SubModelFieldDefinition[],
  requiredKeys: readonly string[],
): readonly DynamicFieldDefinition[] {
  const required = new Set(requiredKeys)
  return attributes.map((attr, index) => {
    const type = mapLegacyFieldType(attr.type)
    const displayOrder = (index + 1) * 10
    const placeholder = `Enter ${attr.label.toLowerCase()}`
    const description = attr.description ?? `${attr.label} for this collaboration model.`
    const legacyConditional = mapLegacyConditional(attr)
    const equityConditional = equityVisibleWhen(attr.key)
    const visibleWhen = legacyConditional ?? equityConditional

    return {
      id: attr.key,
      label: attr.label,
      description,
      type,
      required: required.has(attr.key) || attr.required,
      placeholder,
      helpText: attr.description,
      validation: {
        ...(required.has(attr.key) || attr.required ? { required: true } : {}),
        ...(attr.min != null ? { min: attr.min } : {}),
        ...(attr.maxLength != null ? { maxLength: attr.maxLength } : {}),
      },
      displayOrder,
      group: inferFieldGroup(attr),
      ...(attr.options ? { options: attr.options } : {}),
      ui: {
        width: inferFieldWidth(type),
        order: displayOrder,
        hint: attr.description,
        placeholder,
      },
      ...(visibleWhen ? { visibleWhen } : {}),
    }
  })
}

export function uniqueGroups(
  fields: readonly DynamicFieldDefinition[],
): readonly FieldGroupId[] {
  const seen = new Set<FieldGroupId>()
  const groups: FieldGroupId[] = []
  for (const field of fields) {
    if (!seen.has(field.group)) {
      seen.add(field.group)
      groups.push(field.group)
    }
  }
  return groups
}

export function weightEntries(
  entries: ReadonlyArray<{
    fieldId: string
    weight: number
    requiredWeight: number
    recommendedWeight: number
  }>,
) {
  return entries.map((entry) => ({
    fieldId: entry.fieldId,
    weight: entry.weight,
    requiredWeight: entry.requiredWeight,
    recommendedWeight: entry.recommendedWeight,
  }))
}
