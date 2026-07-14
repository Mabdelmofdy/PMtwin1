import { useMemo } from 'react'
import { dealsApi } from '@/api/deals.ts'
import { useAdminReactiveList } from '@/hooks/use-admin-reactive-list.ts'
import {
  adminDealSearchText,
  buildAdminDealListColumns,
} from '@/pages/admin/admin-portal-list-columns.tsx'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'

const REVIEW_STATUSES = new Set(['draft', 'negotiating', 'review', 'signing'])

export function AdminApprovalsPage() {
  const { productLanguage } = useProductLanguage()
  const allDeals = useAdminReactiveList(() => dealsApi.list())
  const rows = useMemo(
    () =>
      allDeals.filter((ca) => REVIEW_STATUSES.has((ca.status ?? '').toLowerCase())),
    [allDeals],
  )

  return (
    <AdminListPage
      title="Approvals"
      description={`Filtered queue of ${productLanguage.plural('commercialAgreement').toLowerCase()} in review-related statuses. Decision actions are not wired on this page — open a detail record to inspect.`}
      storageKey="approvals"
      data={rows}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={adminDealSearchText}
      columns={buildAdminDealListColumns()}
    />
  )
}
