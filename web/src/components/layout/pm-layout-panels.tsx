import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmMotion } from '@/components/shared/pm-design-tokens'
import { PmCard, type PmCardProps } from '@/components/ui/pm-card'
import { ScrollArea } from '@/components/ui/scroll-area'

export type PmContentCardProps = PmCardProps & {
  title?: string
  description?: string
  actions?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  noPadding?: boolean
}

/** Section card with optional titled header — detail page content blocks. */
export function PmContentCard({
  title,
  description,
  actions,
  header,
  footer,
  children,
  noPadding = false,
  className,
  variant = 'card',
  ...cardProps
}: PmContentCardProps) {
  const showHeader = header || title || description || actions

  return (
    <PmCard
      data-slot="pm-content-card"
      variant={variant}
      padding={noPadding ? 'none' : 'default'}
      composed={false}
      className={cn(pmMotion.base, className)}
      {...cardProps}
    >
      {showHeader ? (
        <div
          className={cn(
            'flex flex-col gap-2 border-b border-border/40 pb-4',
            !noPadding && 'px-0',
          )}
        >
          {header ?? (
            <>
              {title ? (
                <h3 className="pm-text-h3">{title}</h3>
              ) : null}
              {description ? (
                <p className="pm-text-caption">{description}</p>
              ) : null}
            </>
          )}
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn(showHeader && 'pt-4')}>{children}</div>
      {footer ? (
        <div className="mt-4 border-t border-border/40 pt-4">{footer}</div>
      ) : null}
    </PmCard>
  )
}

export type PmScrollablePanelProps = {
  maxHeight?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** Use native overflow instead of ScrollArea (better for simple lists) */
  native?: boolean
  'aria-label'?: string
}

/** Bounded scroll region for side panels, notification lists, split panes. */
export function PmScrollablePanel({
  maxHeight = 'min(24rem, 60vh)',
  native = false,
  className,
  children,
  style,
  'aria-label': ariaLabel,
}: PmScrollablePanelProps) {
  const heightStyle = maxHeight === 'none' ? undefined : { maxHeight, ...style }

  if (native) {
    return (
      <div
        data-slot="pm-scrollable-panel"
        aria-label={ariaLabel}
        className={cn('overflow-y-auto overscroll-contain', className)}
        style={heightStyle}
      >
        {children}
      </div>
    )
  }

  return (
    <ScrollArea
      data-slot="pm-scrollable-panel"
      aria-label={ariaLabel}
      className={cn(className)}
      style={heightStyle}
    >
      {children}
    </ScrollArea>
  )
}
