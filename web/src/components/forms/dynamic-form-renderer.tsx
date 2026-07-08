import { useMemo } from 'react'
import type {
  DynamicFieldDefinition,
  DynamicFieldType,
  FieldGroupSection,
  FieldReadinessWeights,
  ResolvedConditionalField,
  ResolvedDynamicForm,
  ValidationError,
} from '@pm-twin/collaboration-models'
import {
  buildValidationRules,
  evaluateValidation,
  groupFields,
  resolveConditionalFields,
} from '@pm-twin/collaboration-models'
import { PmFormField } from '@/components/forms/pm-form-field'
import { PmFormGrid, PmFormGridItem } from '@/components/forms/pm-form-grid'
import { PmFormSection } from '@/components/forms/pm-form-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

export type DynamicFormRendererProps = {
  readonly form: ResolvedDynamicForm
  readonly values: Readonly<Record<string, unknown>>
  /** Merged ahead of values for conditionals (e.g. exchangeMode). */
  readonly contextValues?: Readonly<Record<string, unknown>>
  readonly onChange: (fieldId: string, value: unknown) => void
  /** When true, show evaluateValidation errors for visible fields. */
  readonly showValidation?: boolean
  /** Exposed readiness metadata — display only, no scoring. */
  readonly fieldReadiness?: Readonly<Record<string, FieldReadinessWeights>>
  readonly className?: string
  readonly denseSections?: boolean
}

function readFieldValue(values: Readonly<Record<string, unknown>>, key: string): string {
  const value = values[key]
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isJsonLikeType(type: DynamicFieldType): boolean {
  return (
    type === 'array-objects'
    || type === 'array-percentages'
    || type === 'currency-range'
    || type === 'date-range'
  )
}

function isTagsLikeType(type: DynamicFieldType): boolean {
  return (
    type === 'tags'
    || type === 'skills'
    || type === 'multiselect'
    || type === 'multi-select'
  )
}

function writeFieldValue(field: DynamicFieldDefinition, raw: string): unknown {
  if (isTagsLikeType(field.type)) {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (field.type === 'number' || field.type === 'currency') {
    const num = Number(raw)
    return Number.isNaN(num) ? undefined : num
  }
  if (field.type === 'boolean') {
    return raw === 'true'
  }
  if (isJsonLikeType(field.type)) {
    if (!raw.trim()) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

function resolveSpan(
  field: DynamicFieldDefinition,
): 1 | 2 | 3 | 'full' {
  const width = field.ui?.width
  if (width === 'full') return 'full'
  if (width === 'third') return 1
  if (
    field.type === 'textarea'
    || isJsonLikeType(field.type)
    || field.type === 'attachment'
  ) {
    return 'full'
  }
  return 1
}

function placeholderFor(field: DynamicFieldDefinition): string {
  return field.ui?.placeholder ?? field.placeholder ?? field.label
}

function renderControl(
  field: ResolvedConditionalField,
  value: string,
  onValueChange: (next: string) => void,
) {
  const disabled = !field.enabled
  const placeholder = placeholderFor(field)

  if (field.type === 'boolean') {
    return (
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        maxLength={field.validation?.maxLength}
        placeholder={placeholder}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return (
      <Input
        type={field.type === 'datetime' ? 'datetime-local' : 'date'}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
      />
    )
  }

  if (isJsonLikeType(field.type)) {
    return (
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder='JSON, e.g. [{"role":"Lead","share":50}]'
        className="font-mono text-xs"
        disabled={disabled}
      />
    )
  }

  if (isTagsLikeType(field.type)) {
    return (
      <Input
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder || 'Comma-separated values'}
        disabled={disabled}
      />
    )
  }

  const inputType =
    field.type === 'number' || field.type === 'currency'
      ? 'number'
      : 'text'

  return (
    <Input
      type={inputType}
      value={value}
      min={field.validation?.min}
      max={field.validation?.max}
      maxLength={field.validation?.maxLength}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

function errorsByFieldId(
  errors: readonly ValidationError[],
): Readonly<Record<string, string>> {
  const map: Record<string, string> = {}
  for (const error of errors) {
    if (!map[error.fieldId]) map[error.fieldId] = error.message
  }
  return map
}

function toDefinition(field: ResolvedConditionalField): DynamicFieldDefinition {
  const {
    visible: _visible,
    enabled: _enabled,
    effectivelyRequired: _effectivelyRequired,
    ...definition
  } = field
  return definition
}

/** Metadata-driven form renderer — no hardcoded field lists. */
export function DynamicFormRenderer({
  form,
  values,
  contextValues,
  onChange,
  showValidation = false,
  fieldReadiness,
  className,
  denseSections = true,
}: DynamicFormRendererProps) {
  const mergedValues = useMemo(
    () => ({ ...values, ...contextValues }),
    [values, contextValues],
  )

  const resolvedFields = useMemo(
    () => resolveConditionalFields(form.fields, mergedValues),
    [form.fields, mergedValues],
  )

  const visibleFields = useMemo(
    () => resolvedFields.filter((field) => field.visible),
    [resolvedFields],
  )

  const sections = useMemo((): readonly FieldGroupSection[] => {
    return groupFields(
      visibleFields.map(toDefinition),
      form.groups,
    )
  }, [visibleFields, form.groups])

  const validationRules = useMemo(
    () => buildValidationRules(visibleFields.map(toDefinition)),
    [visibleFields],
  )

  const validationErrors = useMemo(() => {
    if (!showValidation) return {} as Readonly<Record<string, string>>
    const rules = validationRules.map((rule) => {
      const override = visibleFields.find((field) => field.id === rule.fieldId)
      if (!override) return rule
      return {
        ...rule,
        validation: {
          ...rule.validation,
          required: override.effectivelyRequired,
        },
      }
    })
    return errorsByFieldId(evaluateValidation(rules, values).errors)
  }, [showValidation, validationRules, visibleFields, values])

  if (visibleFields.length === 0) {
    return (
      <p className={cn(pmTypography.caption, 'text-muted-foreground', className)}>
        No additional attributes are configured for this sub-model.
      </p>
    )
  }

  const resolvedById = new Map(visibleFields.map((field) => [field.id, field]))

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-slot="dynamic-form-renderer"
      data-form-source={form.source}
    >
      {sections.map((section) => (
        <PmFormSection
          key={section.id}
          title={section.label}
          description={section.description}
          bordered={false}
          dense={denseSections}
        >
          <PmFormGrid columns={2}>
            {section.fields.map((field) => {
              const resolved = resolvedById.get(field.id)
              if (!resolved) return null
              const span = resolveSpan(field)
              const weights = fieldReadiness?.[field.id]
              const help =
                field.ui?.hint
                ?? field.helpText
                ?? (!resolved.effectivelyRequired
                  ? weights
                    ? `Recommended (weight ${weights.recommendedWeight})`
                    : 'Recommended'
                  : field.description)

              return (
                <PmFormGridItem
                  key={field.id}
                  span={span}
                  gridColumns={2}
                >
                  <PmFormField
                    id={`dyn-field-${field.id}`}
                    label={field.label}
                    required={resolved.effectivelyRequired}
                    help={help}
                    hint={field.ui?.hint}
                    error={validationErrors[field.id] ?? null}
                  >
                    {renderControl(
                      resolved,
                      readFieldValue(values, field.id),
                      (next) => {
                        onChange(field.id, writeFieldValue(field, next))
                      },
                    )}
                  </PmFormField>
                </PmFormGridItem>
              )
            })}
          </PmFormGrid>
        </PmFormSection>
      ))}
    </div>
  )
}

/** Visible field ids for a resolved form under given values/context (tests). */
export function listVisibleDynamicFieldIds(
  form: ResolvedDynamicForm,
  values: Readonly<Record<string, unknown>> = {},
  contextValues: Readonly<Record<string, unknown>> = {},
): readonly string[] {
  const merged = { ...values, ...contextValues }
  return resolveConditionalFields(form.fields, merged)
    .filter((field) => field.visible)
    .map((field) => field.id)
}
