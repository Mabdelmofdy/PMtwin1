/**
 * PM Form validation display helpers — UI state only, no validation logic.
 */

export type PmFieldValidationState = 'idle' | 'error' | 'success'

export type PmFieldValidationInput = {
  readonly error?: string | null
  readonly success?: string | null
  readonly touched?: boolean
}

/** Resolves the visual validation state for a field. */
export function resolveFieldValidationState(
  input: PmFieldValidationInput,
): PmFieldValidationState {
  if (input.error) return 'error'
  if (input.success) return 'success'
  return 'idle'
}

/** Whether the field should show an error message. */
export function shouldShowFieldError(
  input: PmFieldValidationInput,
): boolean {
  return Boolean(input.error) && (input.touched !== false)
}

/** Whether the field should show a success message. */
export function shouldShowFieldSuccess(
  input: PmFieldValidationInput,
): boolean {
  return Boolean(input.success) && !input.error
}

/** Builds aria-describedby ids from help, hint, error, and success slots. */
export function resolveFieldDescribedByIds(parts: {
  fieldId: string
  help?: boolean
  hint?: boolean
  error?: boolean
  success?: boolean
}): string | undefined {
  const ids: string[] = []
  if (parts.help) ids.push(`${parts.fieldId}-help`)
  if (parts.hint) ids.push(`${parts.fieldId}-hint`)
  if (parts.error) ids.push(`${parts.fieldId}-error`)
  if (parts.success) ids.push(`${parts.fieldId}-success`)
  return ids.length > 0 ? ids.join(' ') : undefined
}

/** Input wrapper classes for inline validation state. */
export function resolveFieldInputStateClasses(
  state: PmFieldValidationState,
): string {
  switch (state) {
    case 'error':
      return 'border-danger aria-invalid:border-danger focus-visible:ring-danger/30'
    case 'success':
      return 'border-success focus-visible:ring-success/30'
    default:
      return ''
  }
}

/** Collects form-level error messages for summary display. */
export function collectFormErrors(
  errors: Record<string, string | null | undefined>,
): string[] {
  return Object.values(errors).filter(
    (msg): msg is string => Boolean(msg),
  )
}

/** Whether form summary should be visible. */
export function shouldShowFormSummary(
  errors: Record<string, string | null | undefined>,
): boolean {
  return collectFormErrors(errors).length > 0
}
