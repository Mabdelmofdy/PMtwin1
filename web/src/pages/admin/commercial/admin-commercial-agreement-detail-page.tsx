import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { dealsApi } from '@/api/deals.ts'
import { contractsApi } from '@/api/contracts.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
} from '@/components/admin/entity/admin-entity-detail-shell.tsx'
import { AdminContextNavigation } from '@/components/admin/entity/admin-context-navigation.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { relatedObjectsForCommercialAgreement } from '@/domain/admin/read-models/related-objects-adapter.ts'
import { buildCommercialTimeline } from '@/domain/admin/read-models/timeline-adapter.ts'
import {
  formatCommercialAgreementPresentation,
  formatContractPresentation,
  formatNegotiationPresentation,
  formatOpportunityPresentation,
} from '@/lib/enterprise-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmButton, PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminCommercialAgreementDetailPage() {
  const { id } = useParams()
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()

  const agreement = useMemo(() => (id ? dealsApi.get(id) : undefined), [id, version])
  const related = useMemo(
    () => (id ? relatedObjectsForCommercialAgreement(id) : []),
    [id, version],
  )
  const timeline = useMemo(() => (id ? buildCommercialTimeline(id) : []), [id, version])

  const contracts = useMemo(() => {
    if (!id) return []
    return contractsApi.list().filter(
      (c) => c.commercialAgreementId === id || c.dealId === id,
    )
  }, [id, version])

  if (!agreement) {
    return (
      <PmPage
        header={
          <PmPageHeader title={`${productLanguage.label('commercialAgreement')} detail`} />
        }
      >
        <PmEmptyState title="Commercial agreement not found" size="compact" />
      </PmPage>
    )
  }

  const presentation = formatCommercialAgreementPresentation(agreement)
  const opportunity = agreement.opportunityId
    ? opportunitiesApi.get(agreement.opportunityId)
    : undefined
  const negotiation = agreement.negotiationId
    ? negotiationsApi.get(agreement.negotiationId)
    : undefined
  const oppView = opportunity ? formatOpportunityPresentation(opportunity) : null
  const negView = negotiation
    ? formatNegotiationPresentation(negotiation, (oid) => opportunitiesApi.get(oid))
    : null
  const contractView = contracts[0] ? formatContractPresentation(contracts[0]) : null

  const contextNodes = [
    oppView
      ? {
          id: 'opportunity',
          label: oppView.name,
          meta: oppView.reference,
          href: agreement.opportunityId
            ? `/admin/opportunities/${agreement.opportunityId}`
            : '/admin/opportunities',
        }
      : null,
    negView
      ? {
          id: 'negotiation',
          label: negView.title,
          meta: negView.reference,
          href: agreement.negotiationId
            ? `/admin/negotiations/${agreement.negotiationId}`
            : '/admin/negotiations',
        }
      : null,
    {
      id: 'ca',
      label: presentation.name,
      meta: presentation.reference,
      current: true,
    },
    contractView && contracts[0]
      ? {
          id: 'contract',
          label: contractView.name,
          meta: contractView.reference,
          href: `/admin/contracts/${contracts[0].id}`,
        }
      : {
          id: 'contract',
          label: productLanguage.plural('contract'),
          meta: 'No linked contract',
          href: '/admin/contracts',
        },
    {
      id: 'audit',
      label: 'Audit',
      href: '/admin/audit',
    },
  ].filter(Boolean) as {
    id: string
    label: string
    meta?: string
    href?: string
    current?: boolean
  }[]

  return (
    <AdminEntityDetailShell
      label="Commercial"
      title={presentation.name}
      description={presentation.reference}
      statusBadge={
        <AdminStatusBadge status={String(agreement.status ?? 'unknown')} entity="deal" />
      }
      statusSummary={
        <AdminStatusSummaryRow
          items={[
            {
              label: 'Status',
              value: (
                <AdminStatusBadge status={String(agreement.status ?? 'unknown')} entity="deal" />
              ),
            },
            { label: 'Reference Number', value: presentation.reference },
            {
              label: 'Updated',
              value: agreement.updatedAt ? formatDate(agreement.updatedAt) : '—',
            },
          ]}
        />
      }
      headerActions={
        <div className="flex flex-wrap gap-2">
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/approvals">Approvals</Link>
          </PmButton>
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/awards">Awards</Link>
          </PmButton>
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/audit">Audit</Link>
          </PmButton>
        </div>
      }
      overview={
        <PmFormReadonly>
          <PmFormReadonlySection title="Overview">
            <PmFormReadonlyField label="Agreement Name" value={presentation.name} />
            <PmFormReadonlyField label="Reference Number" value={presentation.reference} />
            <PmFormReadonlyField
              label="Created"
              value={agreement.createdAt ? formatDate(agreement.createdAt) : null}
            />
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
      related={<AdminRelatedObjects groups={related} title="Related objects" />}
      timeline={<AdminUniversalTimeline events={timeline} />}
      audit={
        <PmFormReadonly>
          <PmFormReadonlySection title="Audit">
            <PmFormReadonlyField label="Open audit">
              <Link to="/admin/audit" className="text-primary underline-offset-4 hover:underline">
                Platform audit log
              </Link>
            </PmFormReadonlyField>
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
    >
      <AdminContextNavigation nodes={contextNodes} />
    </AdminEntityDetailShell>
  )
}
