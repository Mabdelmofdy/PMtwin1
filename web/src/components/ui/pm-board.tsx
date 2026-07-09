import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type PmBoardProps = {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

/**
 * Generic board layout (DS v2) — horizontal columns on desktop,
 * stacked on mobile. Presentational only; DnD stays with the caller.
 */
export function PmBoard({ children, className, 'aria-label': ariaLabel }: PmBoardProps) {
  return (
    <div
      data-slot="pm-board"
      role="group"
      aria-label={ariaLabel}
      className={cn('flex flex-col gap-4 lg:flex-row lg:items-start', className)}
    >
      {children}
    </div>
  )
}

export type PmBoardColumnProps = {
  title: string
  count?: number
  description?: string
  children: ReactNode
  className?: string
  headerActions?: ReactNode
}

/** Board lane/column with title, count chip, and card stack. */
export function PmBoardColumn({
  title,
  count,
  description,
  children,
  className,
  headerActions,
}: PmBoardColumnProps) {
  return (
    <section
      data-slot="pm-board-column"
      className={cn(
        'min-h-[12rem] min-w-0 flex-1 rounded-xl border border-border/60 bg-surface-muted/50 p-3',
        className,
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className={cn(pmTypography.h3, 'flex items-center gap-2')}>
            <span className="truncate">{title}</span>
            {count != null ? (
              <span
                className={cn(
                  pmTypography.caption,
                  'rounded-full bg-muted px-2 py-0.5 tabular-nums text-muted-foreground',
                )}
              >
                {count}
              </span>
            ) : null}
          </h3>
          {description ? (
            <p className={cn(pmTypography.caption, 'mt-0.5 text-muted-foreground')}>
              {description}
            </p>
          ) : null}
        </div>
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
