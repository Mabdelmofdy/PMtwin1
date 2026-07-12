import { matchesApi } from '@/api/matches.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { resolvePostMatchTopologyLabel } from '@/lib/collaboration-taxonomy-display.ts'
import { formatPostMatchPresentation } from '@/lib/enterprise-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmMatchScoreBadge } from '@/components/ui/pm-index'

export function AdminPostMatchesPage() {
  useDataStoreVersion()
  const matches = matchesApi.list()
  const getOpportunity = (id: string) => opportunitiesApi.get(id)

  return (
    <AdminListPage
      title="PostMatches"
      description="Matching outcomes stored in LocalStorage."
      storageKey="post-matches"
      data={matches}
      getRowId={(m) => m.id}
      getRowHref={() => '/admin/matching'}
      getSearchText={(m) => {
        const view = formatPostMatchPresentation(m, getOpportunity)
        return [view.title, view.reference, m.status, m.matchType].filter(Boolean).join(' ')
      }}
      searchPlaceholder="Search PostMatches…"
      columns={[
        {
          id: 'title',
          label: 'Match Title',
          cell: (m) => formatPostMatchPresentation(m, getOpportunity).title,
        },
        {
          id: 'reference',
          label: 'Reference Number',
          cell: (m) => formatPostMatchPresentation(m, getOpportunity).reference,
        },
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
