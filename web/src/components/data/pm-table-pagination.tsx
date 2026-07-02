import type { ComponentProps, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmButton } from '@/components/ui/pm-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type PmTablePaginationProps = {
  page?: number
  pageSize?: number
  totalItems?: number
  pageSizeOptions?: readonly number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  /** Custom summary slot — overrides default "Showing X–Y of Z". */
  summary?: ReactNode
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const

function resolvePageRange(
  page: number,
  pageSize: number,
  totalItems: number,
): { from: number; to: number } {
  if (totalItems === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  return { from, to }
}

/** Table pagination bar — visual only, no API wiring. */
export function PmTablePagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  className,
  summary,
}: PmTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const { from, to } = resolvePageRange(page, pageSize, totalItems)
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div
      data-slot="pm-table-pagination"
      className={cn(
        'flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className={cn(pmTypography.caption, 'text-muted-foreground')}>
        {summary ?? (
          totalItems === 0
            ? 'No results'
            : `Showing ${from}–${to} of ${totalItems}`
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Rows
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange?.(Number(v))}
          >
            <SelectTrigger className="h-8 w-16" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <PmButton
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canPrev}
            onClick={() => onPageChange?.(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </PmButton>
          <span
            className={cn(pmTypography.caption, 'min-w-16 text-center tabular-nums')}
          >
            {page} / {totalPages}
          </span>
          <PmButton
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={() => onPageChange?.(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </PmButton>
        </div>
      </div>
    </div>
  )
}

export type PmTablePaginationSlotProps = ComponentProps<'div'>

/** Custom pagination slot wrapper. */
export function PmTablePaginationSlot({
  className,
  children,
  ...props
}: PmTablePaginationSlotProps) {
  return (
    <div
      data-slot="pm-table-pagination-slot"
      className={cn('border-t border-border/60', className)}
      {...props}
    >
      {children}
    </div>
  )
}
