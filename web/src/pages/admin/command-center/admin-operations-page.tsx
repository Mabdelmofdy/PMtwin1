import { useMemo } from 'react'
import { AdminOpsActionCard } from '@/components/admin/command-center/admin-ops-action-card.tsx'
import { buildOperationsSummary } from '@/domain/admin/read-models/command-center-adapter.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmPage, PmPageHeader, PmEmptyState } from '@/components/ui/pm-index'

export function AdminOperationsPage() {
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildOperationsSummary(), [version])

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Command Center"
          title="Operations"
          description="Live operations queues from LocalStorage repositories."
        />
      }
    >
      {summary.cards.length === 0 ? (
        <PmEmptyState title="No operations queues" size="compact" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summary.cards.map((card) => (
            <AdminOpsActionCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </PmPage>
  )
}
