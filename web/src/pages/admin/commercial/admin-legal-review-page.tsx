import { useMemo } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import {
  formatCommercialAgreementPresentation,
  formatContractPresentation,
} from '@/lib/enterprise-display.ts'
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
      description={`Filtered queue of ${productLanguage.plural('contract').toLowerCase()} in draft/pending statuses. Legal decision commands are not wired on this page — open a contract detail to inspect.`}
      storageKey="legal-review"
      data={rows}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/contracts/${c.id}`}
      getSearchText={(c) => {
        const view = formatContractPresentation(c)
        return [view.name, view.reference, c.status, c.paymentMode].filter(Boolean).join(' ')
      }}
      columns={[
        {
          id: 'name',
          label: 'Contract Name',
          cell: (c) => formatContractPresentation(c).name,
        },
        {
          id: 'reference',
          label: 'Reference Number',
          cell: (c) => formatContractPresentation(c).reference,
        },
        {
          id: 'ca',
          label: 'Commercial Agreement',
          cell: (c) => {
            const caId = c.commercialAgreementId ?? c.dealId
            if (!caId) return '—'
            const ca = dealsApi.get(caId)
            return ca
              ? formatCommercialAgreementPresentation(ca).name
              : 'Linked agreement'
          },
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
