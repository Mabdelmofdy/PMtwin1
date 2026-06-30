import type { ReactNode } from 'react'
import { Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PmButton } from '@/components/ui/pm-button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PmTableColumnMeta, PmTableColumnVisibility } from '@/components/data/pm-table-columns'
import { toggleColumnVisibility } from '@/components/data/pm-table-columns'

export type PmTableColumnToggleProps = {
  columns: readonly PmTableColumnMeta[]
  visibility: PmTableColumnVisibility
  onVisibilityChange: (visibility: PmTableColumnVisibility) => void
  label?: string
  className?: string
}

/** Column visibility dropdown — toggles hideable columns. */
export function PmTableColumnToggle({
  columns,
  visibility,
  onVisibilityChange,
  label = 'Columns',
  className,
}: PmTableColumnToggleProps) {
  const hideableColumns = columns.filter((c) => c.hideable !== false)

  if (hideableColumns.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          type="button"
          variant="outline"
          size="sm"
          data-slot="pm-table-column-toggle"
          className={cn('gap-2', className)}
          aria-label={label}
        >
          <Columns3 className="size-4" aria-hidden />
          <span className="hidden sm:inline">{label}</span>
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={visibility[col.id] !== false}
            onCheckedChange={() => {
              onVisibilityChange(toggleColumnVisibility(visibility, col.id, columns))
            }}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type PmTableColumnToggleSlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom column toggle slot. */
export function PmTableColumnToggleSlot({
  children,
  className,
}: PmTableColumnToggleSlotProps) {
  return (
    <div data-slot="pm-table-column-toggle-slot" className={className}>
      {children}
    </div>
  )
}
