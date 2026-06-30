import type { ComponentProps, ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export type PmTableSearchProps = Omit<ComponentProps<'input'>, 'type'> & {
  onValueChange?: (value: string) => void
  containerClassName?: string
}

/** Table toolbar search input with icon — visual only, no API wiring. */
export function PmTableSearch({
  className,
  containerClassName,
  placeholder = 'Search…',
  onValueChange,
  onChange,
  ...props
}: PmTableSearchProps) {
  return (
    <div
      data-slot="pm-table-search"
      className={cn('relative w-full min-w-0 sm:max-w-xs', containerClassName)}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        placeholder={placeholder}
        className={cn('h-9 pl-9', className)}
        onChange={(e) => {
          onChange?.(e)
          onValueChange?.(e.target.value)
        }}
        {...props}
      />
    </div>
  )
}

export type PmTableSearchSlotProps = {
  children?: ReactNode
  className?: string
}

/** Wrapper slot for custom search UI in the toolbar. */
export function PmTableSearchSlot({ children, className }: PmTableSearchSlotProps) {
  return (
    <div data-slot="pm-table-search-slot" className={cn('min-w-0 flex-1', className)}>
      {children}
    </div>
  )
}
