import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayoutGrid } from '@/components/shared/pm-layout-tokens'
import { PmStickyHeader } from '@/components/layout/pm-layout-chrome'

export type PmDetailLayoutProps = {
  main: ReactNode
  inspector?: ReactNode
  timeline?: ReactNode
  actions?: ReactNode
  className?: string
  mainClassName?: string
  inspectorClassName?: string
}

/**
 * Entity detail scaffold: main column, right inspector, optional timeline and actions.
 * Replaces duplicated 2+1 grids in deal/contract/match pages (on migration).
 */
export function PmDetailLayout({
  main,
  inspector,
  timeline,
  actions,
  className,
  mainClassName,
  inspectorClassName,
}: PmDetailLayoutProps) {
  return (
    <div data-slot="pm-detail-layout" className={cn('min-w-0 space-y-6', className)}>
      <div className={pmLayoutGrid.detail}>
        <div className={cn(pmLayoutGrid.detailMain, mainClassName)}>
          {main}
          {timeline ? (
            <section data-slot="pm-detail-timeline" className="space-y-4">
              {timeline}
            </section>
          ) : null}
        </div>
        {inspector ? (
          <aside
            data-slot="pm-detail-inspector-rail"
            className={cn(pmLayoutGrid.detailInspector, inspectorClassName)}
          >
            {inspector}
          </aside>
        ) : null}
      </div>
      {actions ? (
        <footer data-slot="pm-detail-actions" className="flex flex-wrap gap-2">
          {actions}
        </footer>
      ) : null}
    </div>
  )
}

export type PmInspectorLayoutProps = {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  stickyHeader?: boolean
}

/** Right-rail inspector panel with optional sticky header and footer actions. */
export function PmInspectorLayout({
  header,
  children,
  footer,
  className,
  stickyHeader = true,
}: PmInspectorLayoutProps) {
  return (
    <div
      data-slot="pm-inspector-layout"
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface pm-shadow-card',
        className,
      )}
    >
      {header ? (
        stickyHeader ? (
          <PmStickyHeader className="rounded-t-2xl lg:px-4 lg:pt-4">
            {header}
          </PmStickyHeader>
        ) : (
          <div className="px-4 pt-4">{header}</div>
        )
      ) : null}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">{children}</div>
      {footer ? (
        <div className="border-t border-border/60 px-4 py-3">{footer}</div>
      ) : null}
    </div>
  )
}
