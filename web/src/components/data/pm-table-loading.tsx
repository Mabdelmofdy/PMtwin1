import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLoading } from '@/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PmTableDensity } from '@/components/data/pm-table-density'
import {
  resolveTableCellPadding,
  resolveTableDensityClasses,
  resolveTableSkeletonRowHeight,
} from '@/components/data/pm-table-density'

export type PmTableLoadingRowCount = 5 | 10 | 20

export type PmTableLoadingProps = {
  columnCount?: number
  rowCount?: PmTableLoadingRowCount
  density?: PmTableDensity
  showSelectionColumn?: boolean
  showActionsColumn?: boolean
  className?: string
}

/** Skeleton loading state for tables — 5, 10, or 20 row variants. */
export function PmTableLoading({
  columnCount = 4,
  rowCount = 5,
  density = 'comfortable',
  showSelectionColumn = false,
  showActionsColumn = false,
  className,
}: PmTableLoadingProps) {
  const padding = resolveTableCellPadding(density)
  const rowHeight = resolveTableSkeletonRowHeight(density)
  const totalColumns =
    columnCount + (showSelectionColumn ? 1 : 0) + (showActionsColumn ? 1 : 0)

  return (
    <>
      <div
        data-slot="pm-table-loading"
        className={cn(
          'hidden overflow-hidden rounded-xl border border-border/60 sm:block',
          pmLoading.section,
          className,
        )}
        aria-busy="true"
        aria-label="Loading table data"
      >
        <Table className={resolveTableDensityClasses(density)}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showSelectionColumn ? (
              <TableHead className={cn(padding.head, 'w-10')}>
                <Skeleton className="size-4 rounded" />
              </TableHead>
            ) : null}
            {Array.from({ length: columnCount }, (_, i) => (
              <TableHead key={i} className={padding.head}>
                <Skeleton className="h-4 w-24 max-w-full rounded" />
              </TableHead>
            ))}
            {showActionsColumn ? (
              <TableHead className={cn(padding.head, 'w-12')}>
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-transparent">
              {Array.from({ length: totalColumns }, (_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={colIndex === 0 && showSelectionColumn ? 'w-10' : padding.cell}
                >
                  <Skeleton
                    className={cn(
                      rowHeight,
                      'w-full max-w-[12rem] rounded',
                      colIndex === totalColumns - 1 && showActionsColumn && 'max-w-8',
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      <div
        className={cn('space-y-3 sm:hidden', className)}
        role="status"
        aria-busy="true"
        aria-label="Loading list data"
      >
        {Array.from({ length: Math.min(rowCount, 5) }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/60 p-4"
          >
            <Skeleton className="mb-3 h-4 w-2/5 rounded" />
            <Skeleton className="mb-2 h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

export type PmTableLoadingSlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom loading slot. */
export function PmTableLoadingSlot({ children, className }: PmTableLoadingSlotProps) {
  return (
    <div data-slot="pm-table-loading-slot" className={className}>
      {children}
    </div>
  )
}
