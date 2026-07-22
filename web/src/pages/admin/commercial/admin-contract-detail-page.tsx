import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
} from '@/components/admin/entity/admin-entity-detail-shell.tsx'
import { AdminContextNavigation } from '@/components/admin/entity/admin-context-navigation.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { buildCommercialTimeline } from '@/domain/admin/read-models/timeline-adapter.ts'
import type { AdminRelatedObject } from '@/domain/admin/read-models/types.ts'
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

export function AdminContractDetailPage() {
  const { id } = useParams()
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()

  const contract = useMemo(() => (id ? contractsApi.get(id) : undefined), [id, version])

  const caId = contract?.commercialAgreementId ?? contract?.dealId
  const agreement = useMemo(
    () => (caId ? dealsApi.list().find((d) => d.id === caId) : undefined),
    [caId, version],
  )
  const timeline = useMemo(
    () => (caId ? buildCommercialTimeline(caId) : []),
    [caId, version],
  )

  if (!contract) {
    return (
      <PmPage header={<PmPageHeader title={`${productLanguage.label('contract')} detail`} />}>
        <PmEmptyState title="Contract not found" size="compact" />
      </PmPage>
    )
  }

  const presentation = formatContractPresentation(contract)
  const caView = agreement
    ? formatCommercialAgreementPresentation(agreement, (oid) => opportunitiesApi.get(oid))
    : null
  const opportunity = agreement?.opportunityId
    ? opportunitiesApi.get(agreement.opportunityId)
    : undefined
  const negotiation = agreement?.negotiationId
    ? negotiationsApi.get(agreement.negotiationId)
    : undefined
  const oppView = opportunity ? formatOpportunityPresentation(opportunity) : null
  const negView = negotiation
    ? formatNegotiationPresentation(negotiation, (oid) => opportunitiesApi.get(oid))
    : null

  const related: AdminRelatedObject[] = [
    {
      entityType: 'commercial_agreement',
      label: productLanguage.label('commercialAgreement'),
      count: agreement ? 1 : 0,
      href: caId ? `/admin/commercial-agreements/${caId}` : '/admin/commercial-agreements',
      permission: 'admin.commercial_agreements.read',
      statusSummary: caView ? `${caView.name} · ${caView.reference}` : undefined,
    },
    {
      entityType: 'opportunity',
      label: productLanguage.label('opportunity'),
      count: opportunity ? 1 : 0,
      href: agreement?.opportunityId
        ? `/admin/opportunities/${agreement.opportunityId}`
        : '/admin/opportunities',
      permission: 'admin.opportunities.read',
      statusSummary: oppView ? `${oppView.name} · ${oppView.reference}` : undefined,
    },
    {
      entityType: 'audit',
      label: 'Audit',
      count: 1,
      href: '/admin/audit',
      permission: 'admin.audit.read',
    },
  ]

  const contextNodes = [
    oppView
      ? {
          id: 'opportunity',
          label: oppView.name,
          meta: oppView.reference,
          href: agreement?.opportunityId
            ? `/admin/opportunities/${agreement.opportunityId}`
            : undefined,
        }
      : null,
    negView
      ? {
          id: 'negotiation',
          label: negView.title,
          meta: negView.reference,
          href: agreement?.negotiationId
            ? `/admin/negotiations/${agreement.negotiationId}`
            : undefined,
        }
      : null,
    caView && caId
      ? {
          id: 'ca',
          label: caView.name,
          meta: caView.reference,
          href: `/admin/commercial-agreements/${caId}`,
        }
      : null,
    {
      id: 'contract',
      label: presentation.name,
      meta: presentation.reference,
      current: true,
    },
    { id: 'audit', label: 'Audit', href: '/admin/audit' },
    { id: 'timeline', label: 'Timeline', href: '#timeline' },
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
        <AdminStatusBadge status={String(contract.status ?? 'unknown')} entity="contract" />
      }
      statusSummary={
        <AdminStatusSummaryRow
          items={[
            {
              label: 'Status',
              value: (
                <AdminStatusBadge
                  status={String(contract.status ?? 'unknown')}
                  entity="contract"
                />
              ),
            },
            { label: 'Reference Number', value: presentation.reference },
            { label: 'Payment mode', value: contract.paymentMode ?? '—' },
            {
              label: 'Updated',
              value: contract.updatedAt ? formatDate(contract.updatedAt) : '—',
            },
          ]}
        />
      }
      headerActions={
        <div className="flex flex-wrap gap-2">
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/legal-review">Legal review</Link>
          </PmButton>
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/audit">Audit</Link>
          </PmButton>
        </div>
      }
      overview={
        <PmFormReadonly>
          <PmFormReadonlySection title="Overview">
            <PmFormReadonlyField label="Contract Name" value={presentation.name} />
            <PmFormReadonlyField label="Reference Number" value={presentation.reference} />
            <PmFormReadonlyField label="Payment mode" value={contract.paymentMode ?? '—'} />
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
      related={<AdminRelatedObjects groups={related} title="Related objects" />}
      timeline={<AdminUniversalTimeline events={timeline} />}
    >
      <AdminContextNavigation nodes={contextNodes} />
    </AdminEntityDetailShell>
  )
}
