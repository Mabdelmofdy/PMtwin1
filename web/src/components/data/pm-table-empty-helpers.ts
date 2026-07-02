/**
 * PM DataTable empty-state helpers — builds props for PmTableEmpty.
 */

import type { ReactNode } from 'react'

export type PmTableEmptyVariant = 'no-data' | 'no-results' | 'error-recovery'

export type PmTableEmptyConfig = {
  readonly variant?: PmTableEmptyVariant
  readonly title?: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly primaryAction?: ReactNode
  readonly secondaryAction?: ReactNode
}

const defaultCopy: Record<
  PmTableEmptyVariant,
  { title: string; description: string }
> = {
  'no-data': {
    title: 'No records yet',
    description: 'Get started by creating your first record.',
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  'error-recovery': {
    title: 'Unable to load data',
    description: 'Something went wrong while loading this list.',
  },
}

/** Merges variant defaults with caller overrides. */
export function resolveTableEmptyState(
  config: PmTableEmptyConfig = {},
): Required<
  Pick<PmTableEmptyConfig, 'title' | 'description'>
> &
  PmTableEmptyConfig {
  const variant = config.variant ?? 'no-data'
  const defaults = defaultCopy[variant]

  return {
    variant,
    title: config.title ?? defaults.title,
    description: config.description ?? defaults.description,
    icon: config.icon,
    primaryAction: config.primaryAction,
    secondaryAction: config.secondaryAction,
  }
}

/** Whether the table should show the empty state instead of rows. */
export function shouldShowTableEmpty(
  rowCount: number,
  options: { loading?: boolean; error?: boolean } = {},
): boolean {
  if (options.loading || options.error) return false
  return rowCount === 0
}

export type ListEmptyStateBranch = 'none' | 'first-run' | 'filtered' | 'error'

export type ListEmptyStateInput = {
  readonly hasSourceData: boolean
  readonly hasActiveFilters?: boolean
  readonly hasError?: boolean
  readonly firstRun?: PmTableEmptyConfig
  readonly filtered?: PmTableEmptyConfig
  readonly error?: PmTableEmptyConfig
}

export type ResolvedListEmptyState =
  | { readonly branch: 'none' }
  | {
      readonly branch: Exclude<ListEmptyStateBranch, 'none'>
      readonly config: ReturnType<typeof resolveTableEmptyState>
    }

/**
 * Resolves list empty-state branch: first-run, filtered, or error.
 * Use with PmEmptyState (first-run) or PmTableEmpty (filtered / error).
 */
export function resolveListEmptyState(
  input: ListEmptyStateInput,
): ResolvedListEmptyState {
  if (input.hasError) {
    return {
      branch: 'error',
      config: resolveTableEmptyState({
        variant: 'error-recovery',
        ...input.error,
      }),
    }
  }

  if (input.hasActiveFilters) {
    return {
      branch: 'filtered',
      config: resolveTableEmptyState({
        variant: 'no-results',
        ...input.filtered,
      }),
    }
  }

  if (!input.hasSourceData) {
    return {
      branch: 'first-run',
      config: resolveTableEmptyState({
        variant: 'no-data',
        ...input.firstRun,
      }),
    }
  }

  return { branch: 'none' }
}
