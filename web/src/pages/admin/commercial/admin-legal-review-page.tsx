import { useMemo } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { useAdminReactiveList } from '@/hooks/use-admin-reactive-list.ts'
import {
  adminContractSearchText,
  buildAdminContractListColumns,
} from '@/pages/admin/admin-portal-list-columns.tsx'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'

const LEGAL_STATUSES = new Set(['draft', 'pending_signature', 'pending'])

export function AdminLegalReviewPage() {
  const { productLanguage } = useProductLanguage()
  const allContracts = useAdminReactiveList(() => contractsApi.list())
  const rows = useMemo(
    () =>
      allContracts.filter((c) => LEGAL_STATUSES.has((c.status ?? '').toLowerCase())),
    [allContracts],
  )

  return (
    <AdminListPage
      title="Legal Review"
      description={`Filtered queue of ${productLanguage.plural('contract').toLowerCase()} in draft/pending statuses. Legal decision commands are not wired on this page — open a contract detail to inspect.`}
      storageKey="legal-review"
      data={rows}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/contracts/${c.id}`}
      getSearchText={adminContractSearchText}
      columns={buildAdminContractListColumns({
        contractLabel: productLanguage.label('contract'),
      })}
    />
  )
}
