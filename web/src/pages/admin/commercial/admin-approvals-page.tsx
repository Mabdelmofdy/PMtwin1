import { useMemo } from 'react'
import { dealsApi } from '@/api/deals.ts'
import { formatCommercialAgreementPresentation } from '@/lib/enterprise-display.ts'
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
      description={`Filtered queue of ${productLanguage.plural('commercialAgreement').toLowerCase()} in review-related statuses. Decision actions are not wired on this page — open a detail record to inspect.`}
      storageKey="approvals"
      data={rows}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={(d) => {
        const view = formatCommercialAgreementPresentation(d)
        return [view.name, view.reference, d.status].filter(Boolean).join(' ')
      }}
      columns={[
        {
          id: 'title',
          label: 'Agreement Name',
          cell: (d) => formatCommercialAgreementPresentation(d).name,
        },
        {
          id: 'reference',
          label: 'Reference Number',
          cell: (d) => formatCommercialAgreementPresentation(d).reference,
        },
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
