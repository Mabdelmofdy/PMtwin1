import { useMemo } from 'react'
import {
  buildDynamicForm,
  buildFieldReadiness,
  type ResolvedDynamicForm,
} from '@pm-twin/collaboration-models'
import {
  DynamicFormRenderer,
  listVisibleDynamicFieldIds,
} from '@/components/forms/dynamic-form-renderer'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type CollaborationSubModelFieldsProps = {
  readonly subModelType: string
  readonly values: Readonly<Record<string, unknown>>
  readonly onChange: (key: string, value: unknown) => void
  /** Wizard context for conditionals (e.g. exchangeMode). Not persisted as attributes. */
  readonly contextValues?: Readonly<Record<string, unknown>>
  readonly exchangeMode?: string
  readonly showValidation?: boolean
  readonly className?: string
}

/** Registry-driven sub-model fields via Knowledge Registry dynamicForm engine. */
export function CollaborationSubModelFields({
  subModelType,
  values,
  onChange,
  contextValues,
  exchangeMode,
  showValidation = false,
  className,
}: CollaborationSubModelFieldsProps) {
  const form = useMemo(
    () => buildDynamicForm(subModelType),
    [subModelType],
  )

  const readiness = useMemo(
    () => buildFieldReadiness(subModelType),
    [subModelType],
  )

  const mergedContext = useMemo(() => {
    const base: Record<string, unknown> = { ...contextValues }
    if (exchangeMode != null && exchangeMode !== '') {
      base.exchangeMode = exchangeMode
    }
    return base
  }, [contextValues, exchangeMode])

  if (!form || form.fields.length === 0) {
    return (
      <p className={cn(pmTypography.caption, 'text-muted-foreground', className)}>
        No additional attributes are configured for this sub-model.
      </p>
    )
  }

  return (
    <DynamicFormRenderer
      form={form}
      values={values}
      contextValues={mergedContext}
      onChange={onChange}
      showValidation={showValidation}
      className={className}
      fieldReadiness={readiness}
    />
  )
}

export function listRenderedSubModelFieldKeys(subModelType: string): readonly string[] {
  const form = buildDynamicForm(subModelType)
  if (!form) return []
  return listVisibleDynamicFieldIds(form)
}

export function resolveSubModelDynamicForm(
  subModelType: string,
): ResolvedDynamicForm | undefined {
  return buildDynamicForm(subModelType)
}
