import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { Label } from '@/components/ui/label'
import {
  resolveFieldDescribedByIds,
  resolveFieldValidationState,
  shouldShowFieldError,
  shouldShowFieldSuccess,
} from '@/components/forms/pm-form-validation'
import { PmFormError } from '@/components/forms/pm-form-error'
import { PmFormHelp } from '@/components/forms/pm-form-help'

export type PmFormFieldProps = {
  id: string
  label?: string
  description?: string
  required?: boolean
  optional?: boolean
  error?: string | null
  success?: string | null
  help?: string
  hint?: string
  children: ReactNode
  className?: string
  labelClassName?: string
  hideLabel?: boolean
}

type ControlProps = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  className?: string
}

/** Accessible field wrapper — label, markers, help, error, success, children slot. */
export function PmFormField({
  id,
  label,
  description,
  required = false,
  optional = false,
  error,
  success,
  help,
  hint,
  children,
  className,
  labelClassName,
  hideLabel = false,
}: PmFormFieldProps) {
  const validationState = resolveFieldValidationState({ error, success })
  const showError = shouldShowFieldError({ error, touched: true })
  const showSuccess = shouldShowFieldSuccess({ error, success })

  const describedBy = resolveFieldDescribedByIds({
    fieldId: id,
    help: Boolean(help),
    hint: Boolean(hint),
    error: showError,
    success: showSuccess,
  })

  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement<ControlProps>(child)) return child

    const existingDescribedBy = child.props['aria-describedby']
    const mergedDescribedBy =
      [description ? `${id}-description` : null, existingDescribedBy, describedBy]
        .filter(Boolean)
        .join(' ') || undefined

    return cloneElement(child as ReactElement<ControlProps>, {
      id: child.props.id ?? id,
      'aria-describedby': mergedDescribedBy,
      'aria-invalid': showError ? true : child.props['aria-invalid'],
      'aria-required': required ? true : child.props['aria-required'],
      className: cn(
        child.props.className,
        showError && 'border-danger aria-invalid:border-danger',
        showSuccess && !showError && 'border-success',
      ),
    })
  })

  return (
    <div
      data-slot="pm-form-field"
      data-validation={validationState}
      className={cn('flex flex-col gap-1.5', className)}
    >
      {label && !hideLabel ? (
        <div className="flex items-baseline gap-2">
          <Label htmlFor={id} className={cn(pmTypography.label, labelClassName)}>
            {label}
            {required ? (
              <span className="text-danger" aria-hidden>
                {' '}
                *
              </span>
            ) : null}
            {required ? <span className="sr-only"> (required)</span> : null}
          </Label>
          {optional && !required ? (
            <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Optional
            </span>
          ) : null}
        </div>
      ) : null}

      {description ? (
        <p
          id={`${id}-description`}
          className={cn(pmTypography.caption, 'text-muted-foreground')}
        >
          {description}
        </p>
      ) : null}

      <div data-field-control>{enhancedChildren}</div>

      {hint ? (
        <p id={`${id}-hint`} className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {hint}
        </p>
      ) : null}

      {help ? <PmFormHelp id={`${id}-help`}>{help}</PmFormHelp> : null}

      {showError && error ? (
        <PmFormError id={`${id}-error`}>{error}</PmFormError>
      ) : null}

      {showSuccess && success ? (
        <p
          id={`${id}-success`}
          className={cn(pmTypography.caption, 'text-success')}
          role="status"
        >
          {success}
        </p>
      ) : null}
    </div>
  )
}
