import type { ComponentProps, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'

export type PmTableBulkActionsProps = ComponentProps<'div'> & {
  selectedCount: number
  onClearSelection?: () => void
  children?: ReactNode
}

/** Bulk action bar shown when rows are selected. */
export function PmTableBulkActions({
  selectedCount,
  onClearSelection,
  children,
  className,
  ...props
}: PmTableBulkActionsProps) {
  if (selectedCount <= 0) return null

  return (
    <div
      data-slot="pm-table-bulk-actions"
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary-muted px-3 py-2',
        className,
      )}
      {...props}
    >
      <span className={cn(pmTypography.label, 'text-primary')}>
        {selectedCount} selected
      </span>

      <div className="flex flex-wrap items-center gap-2">{children}</div>

      {onClearSelection ? (
        <PmButton
          type="button"
          variant="ghost"
          size="sm"
          className="ms-auto gap-1.5 text-muted-foreground"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="size-3.5" />
          Clear
        </PmButton>
      ) : null}
    </div>
  )
}

export type PmTableBulkActionsSlotProps = {
  children?: ReactNode
  className?: string
}

/** Slot for custom bulk actions in toolbar. */
export function PmTableBulkActionsSlot({
  children,
  className,
}: PmTableBulkActionsSlotProps) {
  return (
    <div data-slot="pm-table-bulk-actions-slot" className={className}>
      {children}
    </div>
  )
}
