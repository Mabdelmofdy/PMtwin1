import type { ComponentProps, ReactNode } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'
import { PmTableBulkActions } from '@/components/data/pm-table-bulk-actions'

export type PmTableToolbarProps = ComponentProps<'div'> & {
  title?: string
  description?: string
  search?: ReactNode
  filters?: ReactNode
  columnToggle?: ReactNode
  bulkActions?: ReactNode
  createAction?: ReactNode
  /** Placeholder export button — no implementation. */
  showExport?: boolean
  onExport?: () => void
  selectedCount?: number
  onClearSelection?: () => void
  trailing?: ReactNode
  leading?: ReactNode
  dense?: boolean
}

/** DataTable toolbar — title, search, filters, export placeholder, bulk actions, create. */
export function PmTableToolbar({
  title,
  description,
  search,
  filters,
  columnToggle,
  bulkActions,
  createAction,
  showExport = false,
  onExport,
  selectedCount = 0,
  onClearSelection,
  trailing,
  leading,
  dense = false,
  className,
  children,
  ...props
}: PmTableToolbarProps) {
  const hasHeader = title || description
  const showBulkBar = selectedCount > 0 && (bulkActions || onClearSelection)

  return (
    <div
      data-slot="pm-table-toolbar"
      className={cn('space-y-3', className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            {title ? (
              <h2 className={dense ? pmTypography.h3 : pmTypography.h2}>{title}</h2>
            ) : null}
            {description ? (
              <p className={cn(pmTypography.caption, 'max-w-2xl text-muted-foreground')}>
                {description}
              </p>
            ) : null}
          </div>
          {createAction ? (
            <div className="flex shrink-0 flex-wrap gap-2">{createAction}</div>
          ) : null}
        </div>
      ) : null}

      {showBulkBar ? (
        <PmTableBulkActions
          selectedCount={selectedCount}
          onClearSelection={onClearSelection}
        >
          {bulkActions}
        </PmTableBulkActions>
      ) : null}

      <div
        role="toolbar"
        aria-label="Table controls"
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {leading}
          {search}
          {filters}
          {children}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showExport ? (
            <PmButton
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onExport}
              aria-label="Export data"
            >
              <Download className="size-4" aria-hidden />
              <span className="hidden sm:inline">Export</span>
            </PmButton>
          ) : null}
          {columnToggle}
          {trailing}
        </div>
      </div>
    </div>
  )
}

export type PmTableToolbarSlotProps = {
  children?: ReactNode
  className?: string
}

/** Minimal toolbar slot without title row. */
export function PmTableToolbarSlot({ children, className }: PmTableToolbarSlotProps) {
  return (
    <div
      data-slot="pm-table-toolbar-slot"
      role="toolbar"
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  )
}
