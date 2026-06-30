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
    <div
      data-slot="pm-table-loading"
      className={cn('overflow-hidden rounded-xl border border-border/60', pmLoading.section, className)}
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
