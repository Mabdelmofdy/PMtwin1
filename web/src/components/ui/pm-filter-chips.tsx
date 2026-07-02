import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { pmIconSize } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'

export type PmFilterChip = {
  readonly id: string
  /** Filter dimension, e.g. "Status". */
  readonly label: string
  /** Active value, e.g. "Accepted". */
  readonly value: string
  readonly onRemove?: () => void
}

export type PmFilterChipsProps = {
  chips: readonly PmFilterChip[]
  onClearAll?: () => void
  className?: string
  'aria-label'?: string
}

/**
 * Active-filter chip bar (DS v2) — shows applied filters as removable chips
 * so users can see and clear filtering without reopening the popover.
 */
export function PmFilterChips({
  chips,
  onClearAll,
  className,
  'aria-label': ariaLabel = 'Active filters',
}: PmFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div
      data-slot="pm-filter-chips"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            pmTypography.caption,
            'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 py-0.5 ps-2.5 text-primary',
            chip.onRemove ? 'pe-1' : 'pe-2.5',
          )}
        >
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
          {chip.onRemove ? (
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter ${chip.label}: ${chip.value}`}
              className="flex size-4 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <X className={pmIconSize.compact} aria-hidden />
            </button>
          ) : null}
        </span>
      ))}
      {onClearAll && chips.length > 1 ? (
        <PmButton
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={onClearAll}
        >
          Clear all
        </PmButton>
      ) : null}
    </div>
  )
}
