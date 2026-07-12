import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { AdminWorkspaceShell } from '@/components/admin/workspace/admin-workspace-shell.tsx'
import { AdminKpiStrip } from '@/components/admin/workspace/admin-kpi-strip.tsx'
import { AdminInboxList } from '@/components/admin/inbox/admin-inbox-list.tsx'
import { buildWorkspaceSummary } from '@/domain/admin/read-models/workspace-summary-adapter.ts'
import { runtimeEnvironment } from '@/config/runtime-environment.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState } from '@/components/ui/pm-index'

export function AdminWorkspacePage() {
  const { workspaceId = 'identity' } = useParams()
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildWorkspaceSummary(workspaceId), [workspaceId, version])

  return (
    <AdminWorkspaceShell
      title={summary.title}
      description={summary.description}
      environmentLabel={runtimeEnvironment.mode}
      kpi={<AdminKpiStrip items={summary.kpiLabels} />}
      actionQueue={<AdminInboxList items={summary.inboxPreview} title="Workspace inbox preview" />}
      primary={
        <PmContentCard title="Domain links">
          {summary.domainLinks.length === 0 ? (
            <PmEmptyState title="No links" size="compact" />
          ) : (
            <ul className="space-y-2">
              {summary.domainLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PmContentCard>
      }
    />
  )
}
