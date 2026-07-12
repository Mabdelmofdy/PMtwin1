import { matchesApi } from '@/api/matches.ts'
import { resolvePostMatchTopologyLabel } from '@/lib/collaboration-taxonomy-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmMatchScoreBadge } from '@/components/ui/pm-index'

export function AdminPostMatchesPage() {
  useDataStoreVersion()
  const matches = matchesApi.list()

  return (
    <AdminListPage
      title="PostMatches"
      description="Matching outcomes stored in LocalStorage."
      data={matches}
      getRowId={(m) => m.id}
      getRowHref={() => '/admin/matching'}
      getSearchText={(m) =>
        [m.id, m.status, m.matchType, m.needOpportunityId, m.offerOpportunityId]
          .filter(Boolean)
          .join(' ')
      }
      searchPlaceholder="Search PostMatches…"
      columns={[
        { id: 'id', label: 'ID', cell: (m) => m.id },
        {
          id: 'topology',
          label: 'Topology',
          cell: (m) => resolvePostMatchTopologyLabel(m),
        },
        {
          id: 'score',
          label: 'Score',
          cell: (m) =>
            typeof m.matchScore === 'number' ? (
              <PmMatchScoreBadge score={m.matchScore} />
            ) : (
              '—'
            ),
        },
        {
          id: 'status',
          label: 'Status',
          cell: (m) => <AdminStatusBadge status={String(m.status)} entity="match" />,
        },
      ]}
    />
  )
}
