/**
 * PM Form layout helpers — grid columns and responsive class maps.
 */

export type PmFormGridColumns = 1 | 2 | 3

export const pmFormGridOptions: readonly PmFormGridColumns[] = [1, 2, 3] as const

/** Tailwind grid classes for form field layouts. */
export function resolveFormGridClasses(
  columns: PmFormGridColumns = 1,
): string {
  switch (columns) {
    case 3:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
    case 2:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2'
    default:
      return 'grid grid-cols-1 gap-4'
  }
}

/** Span class for a field within a multi-column grid. */
export function resolveFormFieldSpan(
  span: 1 | 2 | 3 | 'full',
  gridColumns: PmFormGridColumns = 1,
): string {
  if (span === 'full' || span >= gridColumns) {
    return 'col-span-full'
  }
  if (span === 2 && gridColumns >= 2) {
    return 'sm:col-span-2'
  }
  if (span === 3 && gridColumns === 3) {
    return 'lg:col-span-3'
  }
  return ''
}

/** Vertical stack rhythm for form sections. */
export function resolveFormStackClasses(dense = false): string {
  return dense ? 'flex flex-col gap-4' : 'flex flex-col gap-6'
}

/** Wizard body + right rail grid (matches pmLayoutGrid.wizard). */
export function resolveFormWizardLayoutClasses(): string {
  return 'grid gap-6 lg:grid-cols-[1fr_minmax(16rem,20rem)]'
}
