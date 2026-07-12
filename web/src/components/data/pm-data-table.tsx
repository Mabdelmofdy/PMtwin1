import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { pmRtlTypography } from '@/tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PmTableColumnVisibility } from '@/components/data/pm-table-columns'
import type { PmTableDensity } from '@/components/data/pm-table-density'
import {
  resolveTableCellPadding,
  resolveTableDensityClasses,
} from '@/components/data/pm-table-density'
import type { PmTableLoadingRowCount } from '@/components/data/pm-table-loading'
import { PmTableLoading } from '@/components/data/pm-table-loading'
import { PmTableEmpty } from '@/components/data/pm-table-empty'
import { PmTableError } from '@/components/data/pm-table-error'
import {
  resolveHeaderCheckboxState,
  toggleRowSelection,
  toggleSelectAll,
  type PmTableSelectionMode,
  type PmTableSelectionState,
} from '@/components/data/pm-table-selection'
import { shouldShowTableEmpty } from '@/components/data/pm-table-empty-helpers'

export type PmTableSortDirection = 'asc' | 'desc'

export type PmDataTableColumn<T> = {
  id: string
  label: string
  header?: ReactNode
  cell: (row: T) => ReactNode
  /** Plain text for CSV export — prefer over rendering cell() when JSX badges are used. */
  exportValue?: (row: T) => string
  /** Label shown in mobile card layout. Defaults to `label`. */
  mobileLabel?: string
  sortable?: boolean
  hideable?: boolean
  defaultVisible?: boolean
  className?: string
  headerClassName?: string
}

export type PmDataTableProps<T> = {
  columns: readonly PmDataTableColumn<T>[]
  data: readonly T[]
  getRowId: (row: T) => string
  density?: PmTableDensity
  className?: string
  /** Toolbar slot — typically PmTableToolbar */
  toolbar?: ReactNode
  search?: ReactNode
  filters?: ReactNode
  bulkActions?: ReactNode
  pagination?: ReactNode
  /** Per-row actions renderer */
  rowActions?: (row: T) => ReactNode
  /** Custom mobile card renderer; defaults to stacked column labels */
  renderMobileCard?: (row: T, visibleColumns: PmDataTableColumn<T>[]) => ReactNode
  // State slots
  loading?: boolean
  loadingRowCount?: PmTableLoadingRowCount
  error?: ReactNode
  empty?: ReactNode
  // Selection (controlled)
  selectionMode?: PmTableSelectionMode
  selection?: PmTableSelectionState
  onSelectionChange?: (state: PmTableSelectionState) => void
  // Column visibility (controlled)
  columnVisibility?: PmTableColumnVisibility
  // Sort UI (controlled, no data sorting)
  sortColumnId?: string | null
  sortDirection?: PmTableSortDirection
  onSortChange?: (columnId: string, direction: PmTableSortDirection) => void
  /** Caption for screen readers */
  caption?: string
  stickyHeader?: boolean
}

function TableCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange?: () => void
  label: string
}) {
  return (
    <input
      type="checkbox"
      role="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate ?? false
      }}
      onChange={onChange}
      className="size-4 cursor-pointer rounded border-border text-primary accent-primary pm-focus-ring"
    />
  )
}

function SortIcon({
  columnId,
  sortColumnId,
  sortDirection,
}: {
  columnId: string
  sortColumnId?: string | null
  sortDirection?: PmTableSortDirection
}) {
  if (sortColumnId !== columnId) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/60" aria-hidden />
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="size-3.5 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5 text-primary" aria-hidden />
  )
}

function DefaultMobileCard<T>({
  row,
  columns,
  rowActions,
  selectionMode,
  selected,
  onToggleSelect,
  rowId,
}: {
  row: T
  columns: PmDataTableColumn<T>[]
  rowActions?: ReactNode
  selectionMode: PmTableSelectionMode
  selected: boolean
  onToggleSelect?: () => void
  rowId: string
}) {
  return (
    <PmSurface
      variant="default"
      className="p-5"
      data-slot="pm-table-mobile-card"
      data-row-id={rowId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          {selectionMode !== 'none' ? (
            <TableCheckbox
              checked={selected}
              onChange={onToggleSelect}
              label={`Select row ${rowId}`}
            />
          ) : null}
          {columns.map((col) => (
            <div key={col.id} className="min-w-0">
              <div className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {col.mobileLabel ?? col.label}
              </div>
              <div className={cn(pmTypography.bodySm, 'mt-0.5 break-words')}>
                {col.cell(row)}
              </div>
            </div>
          ))}
        </div>
        {rowActions ? (
          <div className="shrink-0">{rowActions}</div>
        ) : null}
      </div>
    </PmSurface>
  )
}

/**
 * Unified PM DataTable — sticky header, slots, density, selection, sort UI,
 * column visibility, and responsive card layout on mobile.
 * No API wiring or data sorting in Phase 5A.
 */
export function PmDataTable<T>({
  columns,
  data,
  getRowId,
  density = 'comfortable',
  className,
  toolbar,
  search,
  filters,
  bulkActions,
  pagination,
  rowActions,
  renderMobileCard,
  loading = false,
  loadingRowCount = 5,
  error,
  empty,
  selectionMode = 'none',
  selection,
  onSelectionChange,
  columnVisibility,
  sortColumnId,
  sortDirection = 'asc',
  onSortChange,
  caption,
  stickyHeader = true,
}: PmDataTableProps<T>) {
  const padding = resolveTableCellPadding(density)
  const densityClasses = resolveTableDensityClasses(density)

  const visibilityMap: PmTableColumnVisibility =
    columnVisibility ??
    Object.fromEntries(columns.map((c) => [c.id, c.defaultVisible !== false]))

  const visibleColumns = columns.filter(
    (col) => col.hideable === false || visibilityMap[col.id] !== false,
  )

  const selectionState: PmTableSelectionState = selection ?? {
    selectedIds: new Set(),
    mode: selectionMode,
  }

  const rowIds = data.map(getRowId)
  const showSelection = selectionMode !== 'none'
  const headerCheckbox = resolveHeaderCheckboxState(selectionState, rowIds)

  const handleHeaderSelect = (): void => {
    if (!onSelectionChange || selectionMode !== 'multiple') return
    onSelectionChange(toggleSelectAll(selectionState, rowIds))
  }

  const handleRowSelect = (rowId: string): void => {
    if (!onSelectionChange) return
    onSelectionChange(toggleRowSelection(selectionState, rowId))
  }

  const handleSortClick = (columnId: string): void => {
    if (!onSortChange) return
    const nextDirection: PmTableSortDirection =
      sortColumnId === columnId && sortDirection === 'asc' ? 'desc' : 'asc'
    onSortChange(columnId, nextDirection)
  }

  const isEmpty = shouldShowTableEmpty(data.length, { loading, error: Boolean(error) })

  return (
    <div data-slot="pm-data-table" className={cn('min-w-0 space-y-4', className)}>
      {toolbar}
      {(search || filters) && !toolbar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {search}
          {filters}
        </div>
      ) : null}
      {bulkActions && !toolbar ? bulkActions : null}

      {loading ? (
        <PmTableLoading
          columnCount={visibleColumns.length}
          rowCount={loadingRowCount}
          density={density}
          showSelectionColumn={showSelection}
          showActionsColumn={Boolean(rowActions)}
        />
      ) : error ? (
        error
      ) : isEmpty ? (
        empty ?? <PmTableEmpty variant="no-data" />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <PmSurface
            variant="default"
            className="hidden overflow-hidden rounded-3xl sm:block"
            data-responsive="table"
          >
            <div className="relative max-h-[min(70svh,48rem)] overflow-auto">
              <Table className={cn(pmRtlTypography.table, densityClasses, stickyHeader && '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-surface [&_thead]:shadow-[0_1px_0_0_var(--border)]')}>
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                <TableHeader className="bg-surface-muted/75">
                  <TableRow className="hover:bg-transparent border-border/60">
                    {showSelection ? (
                      <TableHead className={cn(padding.head, 'w-10')}>
                        {selectionMode === 'multiple' ? (
                          <TableCheckbox
                            checked={headerCheckbox === 'checked'}
                            indeterminate={headerCheckbox === 'indeterminate'}
                            onChange={handleHeaderSelect}
                            label="Select all rows"
                          />
                        ) : (
                          <span className="sr-only">Select</span>
                        )}
                      </TableHead>
                    ) : null}
                    {visibleColumns.map((col) => (
                      <TableHead
                        key={col.id}
                        className={cn(padding.head, col.headerClassName)}
                        aria-sort={
                          col.sortable && sortColumnId === col.id
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : col.sortable
                              ? 'none'
                              : undefined
                        }
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            className={cn(
                              pmTypography.tableHeader,
                              'inline-flex cursor-pointer items-center gap-1.5 pm-focus-ring rounded-sm',
                            )}
                            onClick={() => handleSortClick(col.id)}
                            aria-label={`Sort by ${col.label}${
                              sortColumnId === col.id
                                ? `, ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                                : ''
                            }`}
                          >
                            {col.header ?? col.label}
                            <SortIcon
                              columnId={col.id}
                              sortColumnId={sortColumnId}
                              sortDirection={sortDirection}
                            />
                          </button>
                        ) : (
                          <span className={pmTypography.tableHeader}>
                            {col.header ?? col.label}
                          </span>
                        )}
                      </TableHead>
                    ))}
                    {rowActions ? (
                      <TableHead className={cn(padding.head, 'w-12 text-end')}>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => {
                    const rowId = getRowId(row)
                    const selected = selectionState.selectedIds.has(rowId)
                    return (
                      <TableRow
                        key={rowId}
                        data-state={selected ? 'selected' : undefined}
                        data-row-id={rowId}
                        className="pm-table-row-hover border-border/50"
                      >
                        {showSelection ? (
                          <TableCell className={cn(padding.cell, 'w-10')}>
                            <TableCheckbox
                              checked={selected}
                              onChange={() => handleRowSelect(rowId)}
                              label={`Select row ${rowId}`}
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.id}
                            className={cn(padding.cell, col.className)}
                          >
                            {col.cell(row)}
                          </TableCell>
                        ))}
                        {rowActions ? (
                          <TableCell className={cn(padding.cell, 'text-end')}>
                            {rowActions(row)}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {pagination}
          </PmSurface>

          {/* Mobile cards */}
          <div
            className="space-y-3 sm:hidden"
            data-responsive="cards"
            role="list"
            aria-label={caption ?? 'Table rows'}
          >
            {data.map((row) => {
              const rowId = getRowId(row)
              const selected = selectionState.selectedIds.has(rowId)
              const actions = rowActions?.(row)
              return (
                <div key={rowId} role="listitem">
                  {renderMobileCard ? (
                    renderMobileCard(row, visibleColumns)
                  ) : (
                    <DefaultMobileCard
                      row={row}
                      columns={visibleColumns}
                      rowActions={actions}
                      selectionMode={selectionMode}
                      selected={selected}
                      onToggleSelect={() => handleRowSelect(rowId)}
                      rowId={rowId}
                    />
                  )}
                </div>
              )
            })}
            {pagination ? (
              <div className="overflow-hidden rounded-2xl border border-border/70">
                {pagination}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

export { PmTableError, PmTableEmpty, PmTableLoading }
