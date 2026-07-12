import type { ReactNode } from 'react'
import { PmToolbarSurface } from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type AdminFilterBarProps = {
  readonly children?: ReactNode
  readonly searchValue?: string
  readonly onSearchChange?: (value: string) => void
  readonly searchPlaceholder?: string
  readonly className?: string
}

export function AdminFilterBar({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  className,
}: AdminFilterBarProps) {
  const showSearch = searchValue !== undefined || onSearchChange !== undefined
  if (!showSearch && !children) return null

  return (
    <PmToolbarSurface className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {showSearch ? (
        <Input
          type="search"
          value={searchValue ?? ''}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
          aria-label={searchPlaceholder}
        />
      ) : null}
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </PmToolbarSurface>
  )
}
