import type { ReactNode } from 'react'
import { PmPage } from '@/components/ui/pm-index'
import { AdminWorkspaceHeader } from '@/components/admin/workspace/admin-workspace-header'

export type AdminWorkspaceShellProps = {
  readonly title: string
  readonly description?: string
  readonly environmentLabel?: string
  readonly riskBadge?: ReactNode
  readonly kpi?: ReactNode
  readonly actionQueue?: ReactNode
  readonly analytics?: ReactNode
  readonly riskSummary?: ReactNode
  readonly filters?: ReactNode
  readonly primary?: ReactNode
  readonly related?: ReactNode
  readonly timeline?: ReactNode
  readonly audit?: ReactNode
  readonly notes?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
}

/**
 * Workspace composition shell:
 * Header → KPIs → Action Queue → Analytics → Risk → Main → Related → Timeline → Audit
 */
export function AdminWorkspaceShell({
  title,
  description,
  environmentLabel,
  riskBadge,
  kpi,
  actionQueue,
  analytics,
  riskSummary,
  filters,
  primary,
  related,
  timeline,
  audit,
  notes,
  children,
  className,
}: AdminWorkspaceShellProps) {
  return (
    <PmPage
      header={
        <AdminWorkspaceHeader
          title={title}
          description={description}
          environmentLabel={environmentLabel}
          riskBadge={riskBadge}
        />
      }
      className={className}
    >
      <div className="flex flex-col gap-4">
        {kpi}
        {actionQueue}
        {analytics}
        {riskSummary}
        {filters}
        {primary}
        {children}
        {related}
        {timeline}
        {audit}
        {notes}
      </div>
    </PmPage>
  )
}
