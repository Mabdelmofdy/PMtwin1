import type { ReactNode } from 'react'
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PmButton } from '@/components/ui/pm-button'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type PmTableRowAction = 'view' | 'edit' | 'delete' | 'duplicate'

export type PmTableRowActionsProps = {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  /** Actions to hide from the default set. */
  hiddenActions?: readonly PmTableRowAction[]
  /** Extra menu items after defaults. */
  children?: ReactNode
  /** Custom trigger label for accessibility. */
  label?: string
  /** Custom label for the view/open action (defaults to product vocabulary). */
  viewLabel?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

const actionConfig: Record<
  PmTableRowAction,
  { label: string; icon: typeof Eye; variant?: 'destructive' }
> = {
  view: { label: PRODUCT_LANGUAGE.OPEN, icon: Eye },
  edit: { label: 'Edit', icon: Pencil },
  duplicate: { label: 'Duplicate', icon: Copy },
  delete: { label: 'Delete', icon: Trash2, variant: 'destructive' },
}

/** Reusable row actions dropdown — visual only, no business logic. */
export function PmTableRowActions({
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  hiddenActions = [],
  children,
  label = 'Row actions',
  viewLabel,
  className,
  align = 'end',
}: PmTableRowActionsProps) {
  const handlers: Record<PmTableRowAction, (() => void) | undefined> = {
    view: onView,
    edit: onEdit,
    delete: onDelete,
    duplicate: onDuplicate,
  }

  const visibleActions = (
    ['view', 'edit', 'duplicate', 'delete'] as const
  ).filter((action) => !hiddenActions.includes(action) && handlers[action])

  const hasDefaults = visibleActions.length > 0
  if (!hasDefaults && !children) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot="pm-table-row-actions"
          className={cn('text-muted-foreground', className)}
          aria-label={label}
        >
          <MoreHorizontal className="size-4" />
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        {visibleActions.map((action, index) => {
          const { label: actionLabel, icon: Icon, variant } = actionConfig[action]
          const displayLabel =
            action === 'view' && viewLabel ? viewLabel : actionLabel
          const needsSeparator = action === 'delete' && index > 0

          return (
            <span key={action}>
              {needsSeparator ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant={variant}
                onSelect={() => handlers[action]?.()}
              >
                <Icon className="size-4" />
                {displayLabel}
              </DropdownMenuItem>
            </span>
          )
        })}
        {children ? (
          <>
            {hasDefaults ? <DropdownMenuSeparator /> : null}
            {children}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type PmTableRowActionsSlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom row actions slot (replaces default dropdown). */
export function PmTableRowActionsSlot({
  children,
  className,
}: PmTableRowActionsSlotProps) {
  return (
    <div
      data-slot="pm-table-row-actions-slot"
      className={cn('flex items-center justify-end gap-1', className)}
    >
      {children}
    </div>
  )
}
