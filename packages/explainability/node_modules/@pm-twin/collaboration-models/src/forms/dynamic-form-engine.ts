import { getSubModel } from '../registry/index.ts'
import {
  attributesToDynamicFields,
  uniqueGroups,
} from '../knowledge/builders.ts'
import { FIELD_GROUP_LABELS } from '../knowledge/field-groups.ts'
import type {
  DynamicFieldDefinition,
  FieldCondition,
  FieldConditionSet,
  FieldGroupId,
  FieldValidation,
} from '../knowledge/types.ts'

export type FieldReadinessWeights = {
  readonly requiredWeight: number
  readonly recommendedWeight: number
}

export type ResolvedDynamicForm = {
  readonly subModelKey: string
  readonly groups: readonly FieldGroupId[]
  readonly fields: readonly DynamicFieldDefinition[]
  readonly source: 'knowledge' | 'legacy-fallback'
}

export type FieldGroupSection = {
  readonly id: FieldGroupId
  readonly label: string
  readonly description?: string
  readonly fields: readonly DynamicFieldDefinition[]
}

export type ResolvedConditionalField = DynamicFieldDefinition & {
  readonly visible: boolean
  readonly enabled: boolean
  readonly effectivelyRequired: boolean
}

export type DynamicFieldValidationRule = {
  readonly fieldId: string
  readonly label: string
  readonly validation: FieldValidation
  /** Reserved for future async validators. */
  readonly async: boolean
}

export type ValidationError = {
  readonly fieldId: string
  readonly message: string
  readonly code:
    | 'required'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'regex'
    | 'customValidatorPending'
}

export type ValidationResult = {
  readonly valid: boolean
  readonly errors: readonly ValidationError[]
}

const formCache = new Map<string, ResolvedDynamicForm>()
const readinessCache = new Map<string, Readonly<Record<string, FieldReadinessWeights>>>()

function asConditionList(set: FieldConditionSet | undefined): readonly FieldCondition[] {
  if (!set) return []
  if (Array.isArray(set)) return set
  return [set as FieldCondition]
}

function normalizeComparable(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  return String(value).toLowerCase().replace(/-/g, '_').trim()
}

function evaluateCondition(
  condition: FieldCondition,
  values: Readonly<Record<string, unknown>>,
): boolean {
  const raw = values[condition.field]
  const op = condition.op

  if (op === 'truthy') return Boolean(raw)
  if (op === 'falsy') return !raw

  const left = normalizeComparable(raw)

  if (op === 'eq') {
    return left === normalizeComparable(condition.value)
  }
  if (op === 'neq') {
    return left !== normalizeComparable(condition.value)
  }

  const list = Array.isArray(condition.value)
    ? condition.value.map((item) => normalizeComparable(item))
    : [normalizeComparable(condition.value)]

  if (op === 'in') return list.includes(left)
  if (op === 'notIn') return !list.includes(left)
  return true
}

function evaluateConditionSet(
  set: FieldConditionSet | undefined,
  values: Readonly<Record<string, unknown>>,
): boolean {
  const conditions = asConditionList(set)
  if (conditions.length === 0) return true
  return conditions.every((condition) => evaluateCondition(condition, values))
}

function sortFields(fields: readonly DynamicFieldDefinition[]): DynamicFieldDefinition[] {
  return [...fields].sort((a, b) => {
    const orderA = a.ui?.order ?? a.displayOrder
    const orderB = b.ui?.order ?? b.displayOrder
    return orderA - orderB
  })
}

function isDynamicFormIncomplete(
  subModelKey: string,
  fields: readonly DynamicFieldDefinition[],
): boolean {
  if (fields.length === 0) return true
  const sub = getSubModel(subModelKey)
  if (!sub) return true
  const ids = new Set(fields.map((field) => field.id))
  return sub.requiredFields.some((key) => !ids.has(key))
}

/** Build dynamic fields from legacy attributes when knowledge.dynamicForm is incomplete. */
export function resolveLegacyFallback(subModelKey: string): ResolvedDynamicForm | undefined {
  const sub = getSubModel(subModelKey)
  if (!sub) return undefined

  const fields = sortFields(
    attributesToDynamicFields(sub.attributes, sub.requiredFields),
  )
  return {
    subModelKey,
    groups: uniqueGroups(fields),
    fields,
    source: 'legacy-fallback',
  }
}

/** Canonical form builder — prefers knowledge.dynamicForm with automatic legacy fallback. */
export function buildDynamicForm(subModelKey: string): ResolvedDynamicForm | undefined {
  const cached = formCache.get(subModelKey)
  if (cached) return cached

  const sub = getSubModel(subModelKey)
  if (!sub) return undefined

  const knowledgeFields = sortFields(sub.knowledge.dynamicForm.fields)
  let resolved: ResolvedDynamicForm

  if (isDynamicFormIncomplete(subModelKey, knowledgeFields)) {
    const fallback = resolveLegacyFallback(subModelKey)
    if (!fallback) return undefined
    resolved = fallback
  } else {
    const groupOrder = sub.knowledge.dynamicForm.groups
    resolved = {
      subModelKey,
      groups: groupOrder.length > 0 ? groupOrder : uniqueGroups(knowledgeFields),
      fields: knowledgeFields,
      source: 'knowledge',
    }
  }

  formCache.set(subModelKey, resolved)
  return resolved
}

/** Clear static form caches (tests). */
export function clearDynamicFormCaches(): void {
  formCache.clear()
  readinessCache.clear()
}

/** Group fields into labeled sections using metadata group order. */
export function groupFields(
  fields: readonly DynamicFieldDefinition[],
  groupOrder?: readonly FieldGroupId[],
): readonly FieldGroupSection[] {
  const order = groupOrder && groupOrder.length > 0
    ? groupOrder
    : uniqueGroups(fields)

  const byGroup = new Map<FieldGroupId, DynamicFieldDefinition[]>()
  for (const field of fields) {
    const bucket = byGroup.get(field.group) ?? []
    bucket.push(field)
    byGroup.set(field.group, bucket)
  }

  const sections: FieldGroupSection[] = []
  const seen = new Set<FieldGroupId>()

  for (const groupId of order) {
    const groupFieldsList = byGroup.get(groupId)
    if (!groupFieldsList || groupFieldsList.length === 0) continue
    seen.add(groupId)
    const sectionDescription = groupFieldsList.find(
      (field) => field.ui?.sectionDescription,
    )?.ui?.sectionDescription
    sections.push({
      id: groupId,
      label: FIELD_GROUP_LABELS[groupId],
      ...(sectionDescription ? { description: sectionDescription } : {}),
      fields: sortFields(groupFieldsList),
    })
  }

  for (const [groupId, groupFieldsList] of byGroup) {
    if (seen.has(groupId) || groupFieldsList.length === 0) continue
    sections.push({
      id: groupId,
      label: FIELD_GROUP_LABELS[groupId],
      fields: sortFields(groupFieldsList),
    })
  }

  return sections
}

/** Apply visibleWhen / enabledWhen / requiredWhen against merged form values. */
export function resolveConditionalFields(
  fields: readonly DynamicFieldDefinition[],
  values: Readonly<Record<string, unknown>>,
): readonly ResolvedConditionalField[] {
  return fields.map((field) => {
    const visible = evaluateConditionSet(field.visibleWhen, values)
    const enabled = evaluateConditionSet(field.enabledWhen, values)
    const conditionallyRequired = evaluateConditionSet(field.requiredWhen, values)
    const effectivelyRequired =
      visible
      && (
        field.required
        || field.validation?.required === true
        || (field.requiredWhen != null && conditionallyRequired)
      )

    return {
      ...field,
      visible,
      enabled,
      effectivelyRequired,
    }
  })
}

/** Build validation rules from field metadata only (no React). */
export function buildValidationRules(
  fields: readonly DynamicFieldDefinition[],
): readonly DynamicFieldValidationRule[] {
  return fields.map((field) => ({
    fieldId: field.id,
    label: field.label,
    validation: {
      required: field.required || field.validation?.required === true,
      min: field.validation?.min,
      max: field.validation?.max,
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      regex: field.validation?.regex ?? field.validation?.pattern,
      pattern: field.validation?.pattern,
      customValidatorKey: field.validation?.customValidatorKey,
      message: field.validation?.message,
    },
    async: false,
  }))
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function valueAsNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value)
    return Number.isFinite(num) ? num : undefined
  }
  return undefined
}

function valueAsString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/** Sync validation evaluation for UI error display. */
export function evaluateValidation(
  rules: readonly DynamicFieldValidationRule[],
  values: Readonly<Record<string, unknown>>,
  options?: {
    readonly onlyFieldIds?: ReadonlySet<string> | readonly string[]
  },
): ValidationResult {
  const allow = options?.onlyFieldIds
    ? new Set(options.onlyFieldIds)
    : null
  const errors: ValidationError[] = []

  for (const rule of rules) {
    if (allow && !allow.has(rule.fieldId)) continue
    const value = values[rule.fieldId]
    const { validation, label } = rule
    const fallbackMessage = validation.message

    if (validation.required && isEmptyValue(value)) {
      errors.push({
        fieldId: rule.fieldId,
        message: fallbackMessage ?? `${label} is required`,
        code: 'required',
      })
      continue
    }

    if (isEmptyValue(value)) continue

    const num = valueAsNumber(value)
    if (validation.min != null && num != null && num < validation.min) {
      errors.push({
        fieldId: rule.fieldId,
        message: fallbackMessage ?? `${label} must be at least ${validation.min}`,
        code: 'min',
      })
    }
    if (validation.max != null && num != null && num > validation.max) {
      errors.push({
        fieldId: rule.fieldId,
        message: fallbackMessage ?? `${label} must be at most ${validation.max}`,
        code: 'max',
      })
    }

    const str = valueAsString(value)
    if (validation.minLength != null && str.length < validation.minLength) {
      errors.push({
        fieldId: rule.fieldId,
        message:
          fallbackMessage
          ?? `${label} must be at least ${validation.minLength} characters`,
        code: 'minLength',
      })
    }
    if (validation.maxLength != null && str.length > validation.maxLength) {
      errors.push({
        fieldId: rule.fieldId,
        message:
          fallbackMessage
          ?? `${label} must be at most ${validation.maxLength} characters`,
        code: 'maxLength',
      })
    }

    const patternSource = validation.regex ?? validation.pattern
    if (patternSource) {
      try {
        const re = new RegExp(patternSource)
        if (!re.test(str)) {
          errors.push({
            fieldId: rule.fieldId,
            message: fallbackMessage ?? `${label} format is invalid`,
            code: 'regex',
          })
        }
      } catch {
        // Invalid authored regex — skip rather than crash the form.
      }
    }

    if (validation.customValidatorKey) {
      errors.push({
        fieldId: rule.fieldId,
        message:
          fallbackMessage
          ?? `${label} awaits validator "${validation.customValidatorKey}"`,
        code: 'customValidatorPending',
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

/** Expose readiness weights per field — no scoring. */
export function buildFieldReadiness(
  subModelKey: string,
): Readonly<Record<string, FieldReadinessWeights>> | undefined {
  const cached = readinessCache.get(subModelKey)
  if (cached) return cached

  const sub = getSubModel(subModelKey)
  if (!sub) return undefined

  const map: Record<string, FieldReadinessWeights> = {}
  for (const entry of sub.knowledge.readiness.fieldWeights) {
    map[entry.fieldId] = {
      requiredWeight: entry.requiredWeight,
      recommendedWeight: entry.recommendedWeight,
    }
  }
  readinessCache.set(subModelKey, map)
  return map
}
