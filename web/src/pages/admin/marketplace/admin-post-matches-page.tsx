import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { useAdminReactiveList } from '@/hooks/use-admin-reactive-list.ts'
import {
  adminPostMatchSearchText,
  buildAdminPostMatchListColumns,
} from '@/pages/admin/admin-portal-list-columns.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'

export function AdminPostMatchesPage() {
  const matches = useAdminReactiveList(() => matchesApi.list())
  const getOpportunity = (id: string) => opportunitiesApi.get(id)

  return (
    <AdminListPage
      title="PostMatches"
      description="Same match records as the user portal Matches page."
      storageKey="post-matches"
      data={matches}
      getRowId={(m) => m.id}
      getRowHref={(m) => `/admin/post-matches/${m.id}`}
      getSearchText={(m) => adminPostMatchSearchText(m, getOpportunity)}
      searchPlaceholder="Search matches…"
      getRowActions={() => [
        {
          id: 'matching',
          label: 'Matching',
          onSelect: () => {
            window.location.assign('/admin/matching')
          },
        },
        {
          id: 'audit',
          label: 'Audit',
          onSelect: () => {
            window.location.assign('/admin/audit')
          },
        },
      ]}
      columns={buildAdminPostMatchListColumns({ getOpportunity })}
    />
  )
}
