import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { dealsApi } from '@/api/deals.ts'
import { commercialAgreementCommandService } from '@/services/commercial-agreement-command-service.ts'
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import { getEffectiveSettingsSections } from '@/domain/admin/settings/effective-settings.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import type { CommercialAgreement } from '@/types/domain.ts'

type AwardGroup = {
  readonly opportunityId: string
  readonly agreements: readonly CommercialAgreement[]
}

export function AdminAwardsPage() {
  const { productLanguage } = useProductLanguage()
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [, bump] = useState(0)
  const canAward = !denyUnlessAuthorized(user?.role, 'admin.commercial_agreements.award')

  const groups = useMemo((): readonly AwardGroup[] => {
    const byOpp = new Map<string, CommercialAgreement[]>()
    for (const ca of dealsApi.list()) {
      const oppId = ca.opportunityId || 'unknown'
      const list = byOpp.get(oppId) ?? []
      list.push(ca)
      byOpp.set(oppId, list)
    }
    return [...byOpp.entries()]
      .filter(([, agreements]) => agreements.length > 1)
      .map(([opportunityId, agreements]) => ({ opportunityId, agreements }))
  }, [version, bump])

  const flatRows = useMemo(
    () =>
      groups.flatMap((g) =>
        g.agreements.map((ca) => ({
          ...ca,
          _groupSize: g.agreements.length,
        })),
      ),
    [groups],
  )

  function handleAward(caId: string): void {
    const denied = denyUnlessAuthorized(user?.role, 'admin.commercial_agreements.award')
    if (denied) {
      toast.error(denied)
      return
    }
    const requireReason = getEffectiveSettingsSections().commercial.requireAwardConfirmReason
    const reason = window.prompt(
      requireReason
        ? 'Award Commercial Agreement — reason required'
        : 'Award Commercial Agreement — confirm reason (optional)',
    )
    if (reason === null) return
    if (requireReason && !reason.trim()) {
      toast.error('Reason is required by commercial settings')
      return
    }
    const result = commercialAgreementCommandService.awardCommercialAgreement(
      caId,
      user?.id,
      true,
    )
    if (!result.result.success) {
      toast.error(result.result.errors?.join('; ') ?? 'Award failed')
      return
    }
    toast.success('Commercial Agreement awarded')
    bump((n) => n + 1)
  }

  return (
    <AdminListPage
      title="Award Management"
      description={`Opportunities with multiple ${productLanguage.plural('commercialAgreement').toLowerCase()} — award via existing command service.`}
      data={flatRows}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={(d) => [d.id, d.title, d.status, d.opportunityId].filter(Boolean).join(' ')}
      emptyTitle="No multi-CA opportunities"
      emptyDescription="Award candidates appear when an opportunity has more than one Commercial Agreement."
      headerActions={canAward ? undefined : <PmBadge tone="warning">Read-only</PmBadge>}
      columns={[
        { id: 'title', label: 'Title', cell: (d) => d.title || d.id },
        { id: 'opportunity', label: 'Opportunity', cell: (d) => d.opportunityId },
        {
          id: 'group',
          label: 'CAs on opportunity',
          cell: (d) => String(d._groupSize),
        },
        {
          id: 'status',
          label: 'Status',
          cell: (d) => (
            <AdminStatusBadge status={d.status ?? 'pending'} entity="deal" />
          ),
        },
        {
          id: 'award',
          label: 'Award',
          cell: (d) =>
            canAward ? (
              <PmButton
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAward(d.id)
                }}
                disabled={(d.awardStatus ?? '').toLowerCase() === 'awarded'}
              >
                Award
              </PmButton>
            ) : (
              '—'
            ),
        },
      ]}
    />
  )
}
