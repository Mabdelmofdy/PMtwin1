import type { ComponentProps, ReactNode } from 'react'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PmButton } from '@/components/ui/pm-button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type PmTableFilterProps = {
  children?: ReactNode
  activeCount?: number
  label?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Filter button with optional active-count badge — content slot for filter panels. */
export function PmTableFilter({
  children,
  activeCount = 0,
  label = 'Filter',
  className,
  open,
  onOpenChange,
}: PmTableFilterProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <PmButton
          type="button"
          variant="outline"
          size="sm"
          data-slot="pm-table-filter"
          className={cn('gap-2', className)}
          aria-label={label}
        >
          <Filter className="size-4" aria-hidden />
          {label}
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {activeCount}
            </span>
          ) : null}
        </PmButton>
      </PopoverTrigger>
      {children ? (
        <PopoverContent align="start" className="w-72 p-4">
          {children}
        </PopoverContent>
      ) : null}
    </Popover>
  )
}

export type PmTableFilterSlotProps = ComponentProps<'div'>

/** Inline filter row slot (alternative to popover). */
export function PmTableFilterSlot({
  className,
  children,
  ...props
}: PmTableFilterSlotProps) {
  return (
    <div
      data-slot="pm-table-filter-slot"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
