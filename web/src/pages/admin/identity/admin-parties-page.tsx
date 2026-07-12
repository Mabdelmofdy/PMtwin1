import { partiesApi } from '@/api/parties.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatPartyPresentation } from '@/lib/enterprise-display.ts'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminPartiesPage() {
  useDataStoreVersion()
  const parties = partiesApi.listParties()

  return (
    <AdminListPage
      title="Parties"
      description="Legal and operating parties on the platform."
      storageKey="parties"
      data={parties}
      getRowId={(p) => p.id}
      getRowHref={(p) => `/admin/parties/${p.id}`}
      getSearchText={(p) => {
        const view = formatPartyPresentation(p)
        return [view.companyName, view.companyCode, p.partyType, p.status].join(' ')
      }}
      searchPlaceholder="Search parties…"
      columns={[
        {
          id: 'name',
          label: 'Company Name',
          cell: (p) => formatPartyPresentation(p).companyName,
        },
        {
          id: 'code',
          label: 'Company Code',
          cell: (p) => formatPartyPresentation(p).companyCode,
        },
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
