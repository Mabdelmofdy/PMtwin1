import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  pmLayoutGrid,
  resolveMetricColumns,
} from '@/components/shared/pm-layout-tokens'

export type PmMetricGridProps = {
  children: ReactNode
  columns?: 3 | 4
  className?: string
}

/** Responsive KPI grid for dashboards and admin command centers. */
export function PmMetricGrid({
  children,
  columns = 4,
  className,
}: PmMetricGridProps) {
  const gridKey = resolveMetricColumns(columns)
  return (
    <div
      data-slot="pm-metric-grid"
      data-columns={columns}
      className={cn(pmLayoutGrid[gridKey], className)}
    >
      {children}
    </div>
  )
}

export type PmDashboardLayoutProps = {
  header?: ReactNode
  metrics?: ReactNode
  charts?: ReactNode
  children?: ReactNode
  quickActions?: ReactNode
  recentActivity?: ReactNode
  className?: string
}

/**
 * Dashboard scaffold:
 * Header → KPIs → Charts → Main grid (lists) + Quick actions / Recent activity
 */
export function PmDashboardLayout({
  header,
  metrics,
  charts,
  children,
  quickActions,
  recentActivity,
  className,
}: PmDashboardLayoutProps) {
  const hasAside = Boolean(quickActions || recentActivity)

  return (
    <div
      data-slot="pm-dashboard-layout"
      className={cn(pmLayoutGrid.pageStack, className)}
    >
      {header}
      {metrics ? (
        <section data-slot="pm-dashboard-metrics">{metrics}</section>
      ) : null}
      {charts ? (
        <section data-slot="pm-dashboard-charts">{charts}</section>
      ) : null}
      {hasAside ? (
        <div className={pmLayoutGrid.dashboardBody}>
          <div className={pmLayoutGrid.dashboardMain}>
            {children}
          </div>
          <aside className={pmLayoutGrid.dashboardAside}>
            {quickActions ? (
              <section data-slot="pm-dashboard-quick-actions" className="space-y-4">
                {quickActions}
              </section>
            ) : null}
            {recentActivity ? (
              <section data-slot="pm-dashboard-activity" className="space-y-4">
                {recentActivity}
              </section>
            ) : null}
          </aside>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
