import { useMemo } from 'react'
import { AdminWorkspaceShell } from '@/components/admin/workspace/admin-workspace-shell.tsx'
import { AdminKpiStrip } from '@/components/admin/workspace/admin-kpi-strip.tsx'
import { AdminActionQueue } from '@/components/admin/workspace/admin-action-queue.tsx'
import { AdminDomainNavTiles } from '@/components/admin/workspace/admin-domain-nav-tiles.tsx'
import { AdminOpsActionCard } from '@/components/admin/command-center/admin-ops-action-card.tsx'
import { AdminRecentOperations } from '@/components/admin/command-center/admin-recent-operations.tsx'
import { healthToneToBadgeTone } from '@/components/admin/severity/admin-severity.ts'
import { buildWorkspaceSummary } from '@/domain/admin/read-models/workspace-summary-adapter.ts'
import { runtimeEnvironment } from '@/config/runtime-environment.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useParams } from 'react-router-dom'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState, PmPageActions } from '@/components/ui/pm-index'

export function AdminWorkspacePage() {
  const { workspaceId = 'identity' } = useParams()
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildWorkspaceSummary(workspaceId), [workspaceId, version])

  const quickPrimary = summary.domainLinks[0]
    ? { label: `Open ${summary.domainLinks[0].label}`, href: summary.domainLinks[0].href }
    : { label: 'Command Center', href: '/admin' }

  return (
    <AdminWorkspaceShell
      title={summary.title}
      description={summary.description}
      environmentLabel={runtimeEnvironment.mode}
      riskBadge={
        <PmBadge tone={healthToneToBadgeTone(summary.riskTone)} size="sm">
          Risk: {summary.riskTone}
        </PmBadge>
      }
      kpi={<AdminKpiStrip items={summary.kpiLabels} />}
      actionQueue={
        <div className="grid gap-4 xl:grid-cols-2">
          <PmContentCard
            title="Work queue"
            description="Actions that require attention in this workspace."
          >
            {summary.actionCards.length === 0 ? (
              <PmEmptyState
                title="No workspace queues"
                description={
                  summary.workspaceId === 'system' ||
                  summary.workspaceId === 'configuration' ||
                  summary.workspaceId === 'reports'
                    ? 'Use domain navigation for system administration tools.'
                    : 'No operational items for this workspace.'
                }
                size="compact"
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {summary.actionCards.map((card) => (
                  <AdminOpsActionCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </PmContentCard>
          <AdminActionQueue
            items={summary.inboxPreview}
            title="Inbox preview"
            emptyTitle="No inbox items"
          />
        </div>
      }
      analytics={
        summary.analytics.length > 0 ? (
          <PmContentCard title="Workspace analytics" description="Live counts from repositories.">
            <AdminKpiStrip items={summary.analytics} columns={3} />
          </PmContentCard>
        ) : undefined
      }
      riskSummary={
        <PmContentCard title="Risk summary">
          <div className="flex flex-wrap items-center gap-3">
            <PmBadge tone={healthToneToBadgeTone(summary.riskTone)}>
              {summary.riskTone}
            </PmBadge>
            <span className="text-sm text-muted-foreground">
              {summary.actionCards.filter((c) => c.count > 0).length} open action queues ·{' '}
              {summary.inboxPreview.length} inbox items
            </span>
            <PmPageActions
              primary={quickPrimary}
              more={summary.domainLinks.slice(1, 5).map((link) => ({
                id: link.href,
                label: link.label,
                href: link.href,
              }))}
            />
          </div>
        </PmContentCard>
      }
      primary={<AdminDomainNavTiles tiles={summary.domainLinks} title="Domain navigation" />}
      audit={<AdminRecentOperations items={summary.recentOps} />}
    />
  )
}
