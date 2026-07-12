import { partiesApi } from '@/api/parties.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminPartiesPage() {
  useDataStoreVersion()
  const parties = partiesApi.listParties()

  return (
    <AdminListPage
      title="Parties"
      description="Legal and operating parties on the platform."
      data={parties}
      getRowId={(p) => p.id}
      getRowHref={(p) => `/admin/parties/${p.id}`}
      getSearchText={(p) => [p.displayName, p.partyType, p.status, p.id].join(' ')}
      searchPlaceholder="Search parties…"
      columns={[
        { id: 'name', label: 'Name', cell: (p) => p.displayName },
        { id: 'type', label: 'Type', cell: (p) => p.partyType },
        {
          id: 'status',
          label: 'Status',
          cell: (p) => <AdminStatusBadge status={p.status} />,
        },
      ]}
    />
  )
}
