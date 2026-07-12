import { useMemo } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

const LEGAL_STATUSES = new Set(['draft', 'pending_signature', 'pending'])

export function AdminLegalReviewPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const rows = useMemo(
    () =>
      contractsApi
        .list()
        .filter((c) => LEGAL_STATUSES.has((c.status ?? '').toLowerCase())),
    [version],
  )

  return (
    <AdminListPage
      title="Legal Review"
      description={`${productLanguage.plural('contract')} pending legal review.`}
      data={rows}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/contracts/${c.id}`}
      getSearchText={(c) => [c.id, c.status, c.paymentMode].filter(Boolean).join(' ')}
      columns={[
        { id: 'id', label: 'ID', cell: (c) => c.id },
        {
          id: 'ca',
          label: 'Commercial Agreement',
          cell: (c) => c.commercialAgreementId ?? c.dealId ?? '—',
        },
        {
          id: 'status',
          label: 'Status',
          cell: (c) => <AdminStatusBadge status={c.status} entity="contract" />,
        },
      ]}
    />
  )
}
