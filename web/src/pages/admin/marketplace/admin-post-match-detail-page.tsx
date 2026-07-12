import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { matchesApi } from '@/api/matches.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
} from '@/components/admin/entity/admin-entity-detail-shell.tsx'
import { AdminContextNavigation } from '@/components/admin/entity/admin-context-navigation.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import type { AdminRelatedObject } from '@/domain/admin/read-models/types.ts'
import { resolvePostMatchTopologyLabel } from '@/lib/collaboration-taxonomy-display.ts'
import {
  formatNegotiationPresentation,
  formatOpportunityPresentation,
  formatPostMatchPresentation,
} from '@/lib/enterprise-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmButton, PmEmptyState, PmMatchScoreBadge, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminPostMatchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const version = useDataStoreVersion()
  const getOpportunity = (oid: string) => opportunitiesApi.get(oid)

  const match = useMemo(
    () => (id ? matchesApi.list().find((m) => m.id === id) : undefined),
    [id, version],
  )

  if (!match) {
    return (
      <PmPage header={<PmPageHeader title="PostMatch detail" />}>
        <PmEmptyState title="PostMatch not found" size="compact" />
      </PmPage>
    )
  }

  const presentation = formatPostMatchPresentation(match, getOpportunity)
  const needId = match.needOpportunityId ?? match.payload?.needOpportunityId
  const offerId = match.offerOpportunityId ?? match.payload?.offerOpportunityId
  const primaryOppId = needId ?? offerId
  const opportunity = primaryOppId ? opportunitiesApi.get(primaryOppId) : undefined
  const oppView = opportunity ? formatOpportunityPresentation(opportunity) : null
  const negotiations = negotiationsApi.list().filter((n) => n.matchId === match.id)
  const neg = negotiations[0]
  const negView = neg
    ? formatNegotiationPresentation(neg, getOpportunity)
    : null

  const related: AdminRelatedObject[] = [
    {
      entityType: 'opportunity',
      label: 'Opportunity',
      count: opportunity ? 1 : 0,
      href: primaryOppId
        ? `/admin/opportunities/${primaryOppId}`
        : '/admin/opportunities',
      permission: 'admin.opportunities.read',
      statusSummary: oppView ? `${oppView.name} · ${oppView.reference}` : undefined,
    },
    {
      entityType: 'negotiation',
      label: 'Negotiations',
      count: negotiations.length,
      href: neg ? `/admin/negotiations/${neg.id}` : '/admin/negotiations',
      permission: 'admin.negotiations.read',
      statusSummary: negView ? `${negView.title} · ${negView.reference}` : undefined,
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
    oppView && primaryOppId
      ? {
          id: 'opportunity',
          label: oppView.name,
          meta: oppView.reference,
          href: `/admin/opportunities/${primaryOppId}`,
        }
      : null,
    {
      id: 'match',
      label: presentation.title,
      meta: presentation.reference,
      current: true,
    },
    negView && neg
      ? {
          id: 'negotiation',
          label: negView.title,
          meta: negView.reference,
          href: `/admin/negotiations/${neg.id}`,
        }
      : null,
    { id: 'audit', label: 'Audit', href: '/admin/audit' },
  ].filter(Boolean) as {
    id: string
    label: string
    meta?: string
    href?: string
    current?: boolean
  }[]

  return (
    <AdminEntityDetailShell
      label="Marketplace"
      title={presentation.title}
      description={presentation.reference}
      statusBadge={<AdminStatusBadge status={String(match.status)} entity="match" />}
      statusSummary={
        <AdminStatusSummaryRow
          items={[
            {
              label: 'Status',
              value: <AdminStatusBadge status={String(match.status)} entity="match" />,
            },
            { label: 'Reference Number', value: presentation.reference },
            { label: 'Topology', value: resolvePostMatchTopologyLabel(match) },
            {
              label: 'Score',
              value:
                typeof match.matchScore === 'number' ? (
                  <PmMatchScoreBadge score={match.matchScore} />
                ) : (
                  '—'
                ),
            },
          ]}
        />
      }
      headerActions={
        <div className="flex flex-wrap gap-2">
          <PmButton variant="outline" size="sm" onClick={() => navigate('/admin/matching')}>
            Matching
          </PmButton>
          <PmButton variant="outline" size="sm" asChild>
            <Link to="/admin/audit">Audit</Link>
          </PmButton>
        </div>
      }
      overview={
        <PmFormReadonly>
          <PmFormReadonlySection title="Overview">
            <PmFormReadonlyField label="Match Title" value={presentation.title} />
            <PmFormReadonlyField label="Reference Number" value={presentation.reference} />
            <PmFormReadonlyField
              label="Created"
              value={match.createdAt ? formatDate(match.createdAt) : null}
            />
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
      related={<AdminRelatedObjects groups={related} />}
    >
      <AdminContextNavigation nodes={contextNodes} />
    </AdminEntityDetailShell>
  )
}
