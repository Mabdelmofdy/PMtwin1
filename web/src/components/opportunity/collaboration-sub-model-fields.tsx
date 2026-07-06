import type { SubModelFormField } from '@pm-twin/collaboration-models'
import { resolveSubModelFormFields } from '@pm-twin/collaboration-models'
import { PmFormField, PmFormGrid, PmFormGridItem } from '@/components/forms/pm-form-index'
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

export type CollaborationSubModelFieldsProps = {
  readonly subModelType: string
  readonly values: Readonly<Record<string, unknown>>
  readonly onChange: (key: string, value: unknown) => void
  readonly className?: string
}

function readFieldValue(values: Readonly<Record<string, unknown>>, key: string): string {
  const value = values[key]
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function writeFieldValue(field: SubModelFormField, raw: string): unknown {
  if (field.type === 'tags') {
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
  if (
    field.type === 'array-objects'
    || field.type === 'array-percentages'
    || field.type === 'currency-range'
    || field.type === 'date-range'
  ) {
    if (!raw.trim()) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

function renderControl(
  field: SubModelFormField,
  value: string,
  onValueChange: (next: string) => void,
) {
  if (field.type === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        maxLength={field.maxLength}
        placeholder={field.label}
      />
    )
  }

  if (field.type === 'select' || field.type === 'multi-select') {
    return (
      <Select value={value || undefined} onValueChange={onValueChange}>
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

  if (field.type === 'date') {
    return (
      <Input
        type="date"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    )
  }

  if (
    field.type === 'array-objects'
    || field.type === 'array-percentages'
    || field.type === 'currency-range'
    || field.type === 'date-range'
  ) {
    return (
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder='JSON, e.g. [{"role":"Lead","share":50}]'
        className="font-mono text-xs"
      />
    )
  }

  return (
    <Input
      type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
      value={value}
      min={field.min}
      maxLength={field.maxLength}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={field.label}
    />
  )
}

/** Registry-driven sub-model attribute fields for the opportunity wizard. */
export function CollaborationSubModelFields({
  subModelType,
  values,
  onChange,
  className,
}: CollaborationSubModelFieldsProps) {
  const fields = resolveSubModelFormFields(subModelType)

  if (fields.length === 0) {
    return (
      <p className={cn(pmTypography.caption, 'text-muted-foreground', className)}>
        No additional attributes are configured for this sub-model.
      </p>
    )
  }

  return (
    <PmFormGrid columns={2} className={className}>
      {fields.map((field) => (
        <PmFormGridItem
          key={field.key}
          span={field.type === 'textarea' ? 'full' : 1}
          gridColumns={2}
        >
          <PmFormField
            id={`collab-attr-${field.key}`}
            label={field.label}
            required={field.emphasis === 'required'}
            help={
              field.emphasis === 'recommended'
                ? 'Recommended'
                : field.description
            }
          >
            {renderControl(field, readFieldValue(values, field.key), (next) => {
              onChange(field.key, writeFieldValue(field, next))
            })}
          </PmFormField>
        </PmFormGridItem>
      ))}
    </PmFormGrid>
  )
}

export function listRenderedSubModelFieldKeys(subModelType: string): readonly string[] {
  return resolveSubModelFormFields(subModelType).map((field) => field.key)
}
