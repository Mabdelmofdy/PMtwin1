import type { ReactNode } from 'react'
import { PmPage } from '@/components/ui/pm-index'
import { AdminWorkspaceHeader } from '@/components/admin/workspace/admin-workspace-header'

export type AdminWorkspaceShellProps = {
  readonly title: string
  readonly description?: string
  readonly environmentLabel?: string
  readonly kpi?: ReactNode
  readonly actionQueue?: ReactNode
  readonly filters?: ReactNode
  readonly primary?: ReactNode
  readonly related?: ReactNode
  readonly timeline?: ReactNode
  readonly audit?: ReactNode
  readonly notes?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
}

export function AdminWorkspaceShell({
  title,
  description,
  environmentLabel,
  kpi,
  actionQueue,
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
        />
      }
      className={className}
    >
      <div className="flex flex-col gap-6">
        {kpi}
        {actionQueue}
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
