/**
 * PM Form read-only display helpers — value formatting and empty fallbacks.
 */

export type PmReadonlyValueInput = {
  readonly value: unknown
  readonly emptyFallback?: string
  readonly formatter?: (value: unknown) => string
}

const DEFAULT_EMPTY = '—'

/** Resolves display text for a read-only field value. */
export function resolveReadonlyValue(input: PmReadonlyValueInput): string {
  const { value, emptyFallback = DEFAULT_EMPTY, formatter } = input

  if (value === null || value === undefined || value === '') {
    return emptyFallback
  }

  if (formatter) {
    return formatter(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? emptyFallback : value.join(', ')
  }

  return String(value)
}

/** Whether a read-only value is considered empty. */
export function isReadonlyValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/** Groups read-only fields by section id. */
export function groupReadonlyFields<T extends { sectionId: string }>(
  fields: readonly T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const field of fields) {
    if (!groups[field.sectionId]) {
      groups[field.sectionId] = []
    }
    groups[field.sectionId].push(field)
  }
  return groups
}
