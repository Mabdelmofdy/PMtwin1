import { useMemo } from 'react'
import { AdminOpsActionCard } from '@/components/admin/command-center/admin-ops-action-card.tsx'
import { buildRiskSummary } from '@/domain/admin/read-models/command-center-adapter.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmPage, PmPageHeader, PmStatCard } from '@/components/ui/pm-index'

export function AdminRiskPage() {
  const version = useDataStoreVersion()
  const risk = useMemo(() => buildRiskSummary(), [version])

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Command Center"
          title="Risk & Compliance"
          description="Risk indicators derived from repository state — no fabricated scores."
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard label="Suspended users" value={risk.suspendedUsers} dense />
        <PmStatCard label="Rejected vetting" value={risk.rejectedDocuments} dense />
        <PmStatCard label="Orphan hints" value={risk.orphanHints} dense />
      </PmMetricGrid>
      <PmContentCard title="Risk queues" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {risk.items.map((card) => (
            <AdminOpsActionCard key={card.id} card={card} />
          ))}
        </div>
      </PmContentCard>
    </PmPage>
  )
}
