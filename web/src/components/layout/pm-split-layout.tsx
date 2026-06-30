import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayoutGrid } from '@/components/shared/pm-layout-tokens'
import { PmScrollablePanel } from '@/components/layout/pm-layout-panels'

export type PmSplitLayoutProps = {
  list: ReactNode
  detail: ReactNode
  className?: string
  listClassName?: string
  detailClassName?: string
  listLabel?: string
  detailLabel?: string
}

/**
 * Master-detail split: left list panel, right detail panel.
 * Used for messages, admin queues, pipeline inspectors (on migration).
 */
export function PmSplitLayout({
  list,
  detail,
  className,
  listClassName,
  detailClassName,
  listLabel = 'List panel',
  detailLabel = 'Detail panel',
}: PmSplitLayoutProps) {
  return (
    <div
      data-slot="pm-split-layout"
      className={cn(pmLayoutGrid.split, className)}
    >
      <PmScrollablePanel
        aria-label={listLabel}
        className={cn(pmLayoutGrid.splitList, listClassName)}
        maxHeight="none"
      >
        {list}
      </PmScrollablePanel>
      <div
        data-slot="pm-split-detail"
        aria-label={detailLabel}
        className={cn(pmLayoutGrid.splitDetail, detailClassName)}
      >
        {detail}
      </div>
    </div>
  )
}

export type PmSidebarLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
  className?: string
  sidebarClassName?: string
  mainClassName?: string
  /** Place sidebar on the right from lg breakpoint */
  sidebarPosition?: 'left' | 'right'
}

/** Secondary sidebar + main — filters, step nav, or contextual nav. */
export function PmSidebarLayout({
  sidebar,
  children,
  className,
  sidebarClassName,
  mainClassName,
  sidebarPosition = 'left',
}: PmSidebarLayoutProps) {
  return (
    <div
      data-slot="pm-sidebar-layout"
      className={cn(
        pmLayoutGrid.split,
        sidebarPosition === 'right' && 'lg:grid-cols-[1fr_minmax(16rem,22rem)]',
        className,
      )}
    >
      <aside
        className={cn(
          sidebarPosition === 'right' && 'lg:order-2',
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
      <main
        className={cn(
          'min-w-0',
          sidebarPosition === 'right' && 'lg:order-1',
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  )
}

export type PmWizardLayoutProps = {
  stepper?: ReactNode
  children: ReactNode
  readiness?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Wizard scaffold: stepper → form body (+ readiness rail) → footer actions.
 * Opportunity create/edit migration target.
 */
export function PmWizardLayout({
  stepper,
  children,
  readiness,
  footer,
  className,
}: PmWizardLayoutProps) {
  return (
    <div
      data-slot="pm-wizard-layout"
      className={cn(pmLayoutGrid.pageStack, className)}
    >
      {stepper ? (
        <nav data-slot="pm-wizard-stepper" aria-label="Wizard steps">
          {stepper}
        </nav>
      ) : null}
      {readiness ? (
        <div className={pmLayoutGrid.wizard}>
          <div className={pmLayoutGrid.wizardMain}>{children}</div>
          <aside className={pmLayoutGrid.wizardAside}>{readiness}</aside>
        </div>
      ) : (
        children
      )}
      {footer}
    </div>
  )
}
