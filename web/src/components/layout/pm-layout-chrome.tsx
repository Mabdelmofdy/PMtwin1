import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmInteraction, pmLayout, pmTypography, pmResponsive } from '@/tokens'
import { pmSticky } from '@/components/shared/pm-layout-tokens'

export type PmStickyHeaderProps = ComponentProps<'div'> & {
  offset?: 'toolbar' | 'default'
  bordered?: boolean
  children?: ReactNode
}

/** Sticky sub-header below the app chrome (filters, inspector title, etc.). */
export function PmStickyHeader({
  offset = 'default',
  bordered = true,
  className,
  children,
  ...props
}: PmStickyHeaderProps) {
  return (
    <div
      data-slot="pm-sticky-header"
      data-offset={offset}
      className={cn(
        offset === 'toolbar' ? pmSticky.filters : pmSticky.inspectorHeader,
        bordered && offset === 'default' && 'lg:border-b lg:border-border/40 lg:pb-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type PmSectionHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  dense?: boolean
}

/** In-page section title row — lighter than PmSection wrapper. */
export function PmSectionHeader({
  title,
  description,
  actions,
  className,
  dense = false,
}: PmSectionHeaderProps) {
  return (
    <div
      data-slot="pm-section-header"
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
        dense ? 'gap-1.5' : pmLayout.formGap,
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <h2 className={dense ? pmTypography.h3 : pmTypography.h2}>{title}</h2>
        {description ? (
          <p className={cn(pmTypography.caption, 'max-w-2xl')}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export type PmToolbarProps = ComponentProps<'div'> & {
  leading?: ReactNode
  trailing?: ReactNode
  sticky?: boolean
  children?: ReactNode
}

/** Page toolbar — search, filters, view toggles. Stripe-style horizontal rhythm. */
export function PmToolbar({
  leading,
  trailing,
  sticky = true,
  className,
  children,
  ...props
}: PmToolbarProps) {
  return (
    <div
      data-slot="pm-toolbar"
      role="toolbar"
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        sticky && cn('pm-toolbar-surface sticky top-14 z-10 rounded-xl px-3 py-3', pmResponsive.toolbarBleed),
        className,
      )}
      {...props}
    >
      <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-2', pmInteraction.toolbarAction)}>
        {leading}
        {children}
      </div>
      {trailing ? (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-2', pmInteraction.toolbarAction)}>{trailing}</div>
      ) : null}
    </div>
  )
}

export type PmActionBarProps = ComponentProps<'div'> & {
  leading?: ReactNode
  trailing?: ReactNode
  sticky?: boolean
  children?: ReactNode
}

/** Footer action bar for wizards and detail mutation flows. */
export function PmActionBar({
  leading,
  trailing,
  sticky = true,
  className,
  children,
  ...props
}: PmActionBarProps) {
  return (
    <div
      data-slot="pm-action-bar"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between',
        sticky && cn(pmSticky.actionFooter, 'border-border/70 pm-shadow-card'),
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">{leading ?? children}</div>
      {trailing ? (
        <div className="flex flex-wrap items-center justify-end gap-2 sm:ms-auto">{trailing}</div>
      ) : null}
    </div>
  )
}
