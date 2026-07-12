import { useMemo } from 'react'
import { dealsApi } from '@/api/deals.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

const REVIEW_STATUSES = new Set(['draft', 'negotiating', 'review', 'signing'])

export function AdminApprovalsPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const rows = useMemo(
    () =>
      dealsApi.list().filter((ca) => REVIEW_STATUSES.has((ca.status ?? '').toLowerCase())),
    [version],
  )

  return (
    <AdminListPage
      title="Approvals"
      description={`${productLanguage.plural('commercialAgreement')} awaiting commercial review.`}
      data={rows}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={(d) => [d.id, d.title, d.status].filter(Boolean).join(' ')}
      columns={[
        { id: 'title', label: 'Title', cell: (d) => d.title || d.id },
        {
          id: 'status',
          label: 'Status',
          cell: (d) => (
            <AdminStatusBadge status={d.status ?? 'pending'} entity="deal" />
          ),
        },
      ]}
    />
  )
}
