import { useMemo } from 'react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatOpportunityPresentation } from '@/lib/enterprise-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

/** Opportunities that may need moderation attention (draft / cancelled / unpublished). */
export function AdminModerationPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const rows = useMemo(() => {
    return opportunitiesApi.list().filter((o) => {
      const st = (o.status ?? '').toLowerCase()
      const vis = (o.visibilityStatus ?? '').toLowerCase()
      return (
        st === 'draft' ||
        st === 'cancelled' ||
        vis === 'private' ||
        vis === 'unpublished' ||
        vis === 'hidden'
      )
    })
  }, [version])

  return (
    <AdminListPage
      title="Moderation"
      description={`${productLanguage.plural('opportunity')} that may need moderation review.`}
      data={rows}
      getRowId={(o) => o.id}
      getRowHref={(o) => `/admin/opportunities/${o.id}`}
      storageKey="moderation"
      getSearchText={(o) => {
        const view = formatOpportunityPresentation(o)
        return [view.name, view.reference, o.status, o.visibilityStatus].filter(Boolean).join(' ')
      }}
      columns={[
        {
          id: 'title',
          label: 'Opportunity Name',
          cell: (o) => formatOpportunityPresentation(o).name,
        },
        {
          id: 'reference',
          label: 'Reference Number',
          cell: (o) => formatOpportunityPresentation(o).reference,
        },
        {
          id: 'status',
          label: 'Status',
          cell: (o) => <AdminStatusBadge status={o.status} entity="opportunity" />,
        },
        {
          id: 'visibility',
          label: 'Visibility',
          cell: (o) => o.visibilityStatus ?? '—',
        },
      ]}
    />
  )
}
