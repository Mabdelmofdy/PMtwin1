import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmIconSize } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type PmMoreActionItem = {
  id?: string
  label: string
  icon?: LucideIcon
  href?: string
  onSelect?: () => void
  variant?: 'default' | 'destructive'
  separatorBefore?: boolean
  disabled?: boolean
}

export type PmMoreActionsProps = {
  items?: readonly PmMoreActionItem[]
  children?: ReactNode
  label?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

/** Kebab menu for secondary and destructive card/page actions. */
export function PmMoreActions({
  items = [],
  children,
  label = 'More actions',
  className,
  align = 'end',
}: PmMoreActionsProps) {
  const visibleItems = items.filter(
    (item) => item.href || item.onSelect,
  )

  if (visibleItems.length === 0 && !children) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PmButton
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot="pm-more-actions"
          className={cn('text-muted-foreground', className)}
          aria-label={label}
        >
          <MoreHorizontal className={pmIconSize.interactive} />
        </PmButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        {visibleItems.map((item, index) => {
          const Icon = item.icon
          const key = item.id ?? `${item.label}-${index}`

          return (
            <span key={key}>
              {item.separatorBefore && index > 0 ? (
                <DropdownMenuSeparator />
              ) : null}
              {item.href ? (
                <DropdownMenuItem
                  variant={item.variant}
                  disabled={item.disabled}
                  asChild
                >
                  <Link to={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant={item.variant}
                  disabled={item.disabled}
                  onSelect={() => item.onSelect?.()}
                >
                  {Icon ? <Icon className={pmIconSize.default} /> : null}
                  {item.label}
                </DropdownMenuItem>
              )}
            </span>
          )
        })}
        {children ? (
          <>
            {visibleItems.length > 0 ? <DropdownMenuSeparator /> : null}
            {children}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type PmCardActionSlot = {
  label: string
  href?: string
  onClick?: () => void
  variant?: ComponentProps<typeof PmButton>['variant']
  size?: ComponentProps<typeof PmButton>['size']
  disabled?: boolean
  loading?: boolean
  /** Custom action control (e.g. StartNegotiationButton). */
  render?: () => ReactNode
}

export type PmCardActionsProps = {
  primary: PmCardActionSlot
  secondary?: PmCardActionSlot
  more?: readonly PmMoreActionItem[]
  moreChildren?: ReactNode
  className?: string
  align?: 'start' | 'end' | 'between'
}

function renderActionSlot(
  slot: PmCardActionSlot,
  defaultVariant: ComponentProps<typeof PmButton>['variant'],
) {
  if (slot.render) {
    return slot.render()
  }

  const label = slot.loading ? `${slot.label}…` : slot.label
  const variant = slot.variant ?? defaultVariant
  const size = slot.size ?? 'sm'

  if (slot.href) {
    return (
      <PmButton size={size} variant={variant} disabled={slot.disabled || slot.loading} asChild>
        <Link to={slot.href}>{label}</Link>
      </PmButton>
    )
  }

  return (
    <PmButton
      type="button"
      size={size}
      variant={variant}
      disabled={slot.disabled || slot.loading}
      onClick={slot.onClick}
    >
      {label}
    </PmButton>
  )
}

/**
 * Card action row — one primary, optional secondary, remaining actions in More menu.
 * Enforces the PM-Twin Card Action Rule across list and detail surfaces.
 */
export function PmCardActions({
  primary,
  secondary,
  more,
  moreChildren,
  className,
  align = 'start',
}: PmCardActionsProps) {
  const hasMore =
    (more?.some((item) => item.href || item.onSelect) ?? false) || Boolean(moreChildren)

  return (
    <div
      data-slot="pm-card-actions"
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-border/50 pt-3',
        align === 'between' && 'justify-between',
        align === 'end' && 'justify-end',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {renderActionSlot(primary, 'default')}
        {secondary ? renderActionSlot(secondary, 'outline') : null}
      </div>
      {hasMore ? (
        <PmMoreActions items={more} label="More card actions">
          {moreChildren}
        </PmMoreActions>
      ) : null}
    </div>
  )
}

export type PmPageActionsProps = {
  primary?: PmCardActionSlot
  secondary?: PmCardActionSlot
  more?: readonly PmMoreActionItem[]
  moreChildren?: ReactNode
  className?: string
}

/** Page header action row — max one primary + one secondary + More menu. */
export function PmPageActions({
  primary,
  secondary,
  more,
  moreChildren,
  className,
}: PmPageActionsProps) {
  if (!primary && !secondary && !more?.length && !moreChildren) return null

  const hasMore =
    (more?.some((item) => item.href || item.onSelect) ?? false) || Boolean(moreChildren)

  return (
    <div
      data-slot="pm-page-actions"
      className={cn(
        'flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end',
        className,
      )}
    >
      {primary ? renderActionSlot({ ...primary, size: primary.size ?? 'default' }, 'default') : null}
      {secondary
        ? renderActionSlot({ ...secondary, size: secondary.size ?? 'default' }, 'outline')
        : null}
      {hasMore ? (
        <PmMoreActions items={more} label="More page actions" align="end">
          {moreChildren}
        </PmMoreActions>
      ) : null}
    </div>
  )
}
