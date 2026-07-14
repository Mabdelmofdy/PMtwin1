import { useMemo } from 'react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import type { PmDataTableColumn } from '@/components/data/pm-data-index'
import { useAdminReactiveList } from '@/hooks/use-admin-reactive-list.ts'
import {
  adminOpportunitySearchText,
  buildAdminOpportunityListColumns,
} from '@/pages/admin/admin-portal-list-columns.tsx'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import type { Opportunity } from '@/types/domain.ts'

/** Opportunities that may need moderation attention (draft / cancelled / unpublished). */
export function AdminModerationPage() {
  const { productLanguage } = useProductLanguage()
  const allOpportunities = useAdminReactiveList(() => opportunitiesApi.list())
  const rows = useMemo(() => {
    return allOpportunities.filter((o) => {
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
  }, [allOpportunities])

  const columns: PmDataTableColumn<Opportunity>[] = [
    ...buildAdminOpportunityListColumns({
      opportunityLabel: productLanguage.label('opportunity'),
    }),
    {
      id: 'visibility',
      label: 'Visibility',
      cell: (o) => o.visibilityStatus ?? '—',
      exportValue: (o) => String(o.visibilityStatus ?? ''),
    },
  ]

  return (
    <AdminListPage
      title="Moderation"
      description={`${productLanguage.plural('opportunity')} that may need moderation review.`}
      data={rows}
      getRowId={(o) => o.id}
      getRowHref={(o) => `/admin/opportunities/${o.id}`}
      storageKey="moderation"
      getSearchText={adminOpportunitySearchText}
      columns={columns}
    />
  )
}
