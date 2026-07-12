import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import {
  negotiationMessageRepository,
  negotiationOfferRepository,
  negotiationTranscriptRepository,
} from '@/repositories/index.ts'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { buildCommercialTimeline } from '@/domain/admin/read-models/timeline-adapter.ts'
import type { AdminRelatedObject } from '@/domain/admin/read-models/types.ts'
import type { NegotiationOffer } from '@/types/negotiation-discussion.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  formatEnterpriseReference,
  formatNegotiationPresentation,
  formatOpportunityPresentation,
  formatUserPresentation,
  presentationYear,
  stableHash32,
} from '@/lib/enterprise-display.ts'
import { formatDate } from '@/lib/format'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { useAuth } from '@/providers/auth-provider.tsx'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmDataTable, PmTableEmpty } from '@/components/data/pm-data-index'

function formatOfferReference(offer: NegotiationOffer): string {
  const year = presentationYear(offer.createdAt, offer.id)
  const seq = String(Math.abs(stableHash32(`offer:${offer.id}`)) % 100000).padStart(5, '0')
  return `OFF-${year}-${seq}`
}

export function AdminNegotiationDetailPage() {
  const { id } = useParams()
  const { productLanguage } = useProductLanguage()
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const canReadTranscript = hasAdminCapability(user?.role, 'admin.negotiations.transcript')

  const negotiation = useMemo(
    () => (id ? negotiationsApi.get(id) : undefined),
    [id, version],
  )

  const messages = useMemo(() => {
    if (!id || !canReadTranscript) return []
    return negotiationMessageRepository.getByNegotiationId(id)
  }, [id, version, canReadTranscript])

  const offers = useMemo((): readonly NegotiationOffer[] => {
    if (!id) return []
    return negotiationOfferRepository.getByNegotiationId(id)
  }, [id, version])

  const transcriptEvents = useMemo(() => {
    if (!id || !canReadTranscript) return []
    return negotiationTranscriptRepository.getByNegotiationId(id)
  }, [id, version, canReadTranscript])

  const relatedCas = useMemo(() => {
    if (!id) return []
    return dealsApi.list().filter((d) => d.negotiationId === id)
  }, [id, version])

  const timeline = useMemo(() => {
    if (!relatedCas[0]?.id) return []
    return buildCommercialTimeline(relatedCas[0].id)
  }, [relatedCas, version])

  const presentation = negotiation
    ? formatNegotiationPresentation(negotiation, (oid) => opportunitiesApi.get(oid))
    : null

  const opportunityLabel = negotiation?.opportunityId
    ? (() => {
        const opp = opportunitiesApi.get(negotiation.opportunityId)
        return opp
          ? formatOpportunityPresentation(opp)
          : {
              name: productLanguage.label('opportunity'),
              reference: formatEnterpriseReference(
                'opportunity',
                negotiation.opportunityId,
              ),
            }
      })()
    : null

  const matchLabel = negotiation?.matchId
    ? formatEnterpriseReference('post_match', negotiation.matchId, negotiation.createdAt)
    : null

  const related: AdminRelatedObject[] = [
    {
      entityType: 'opportunity',
      label: productLanguage.label('opportunity'),
      count: negotiation?.opportunityId ? 1 : 0,
      href: negotiation?.opportunityId
        ? `/admin/opportunities/${negotiation.opportunityId}`
        : '/admin/opportunities',
      permission: 'admin.opportunities.read',
      statusSummary: opportunityLabel
        ? `${opportunityLabel.name} · ${opportunityLabel.reference}`
        : '—',
    },
    {
      entityType: 'commercial_agreement',
      label: productLanguage.plural('commercialAgreement'),
      count: relatedCas.length,
      href: relatedCas[0]
        ? `/admin/commercial-agreements/${relatedCas[0].id}`
        : '/admin/commercial-agreements',
      permission: 'admin.commercial_agreements.read',
    },
    {
      entityType: 'audit',
      label: 'Audit',
      count: 1,
      href: '/admin/audit',
      permission: 'admin.audit.read',
    },
  ]

  if (!negotiation || !presentation) {
    return (
      <PmPage header={<PmPageHeader title={`${productLanguage.label('negotiation')} detail`} />}>
        <PmEmptyState title="Negotiation not found" />
      </PmPage>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Commercial"
          title={presentation.title}
          description={presentation.reference}
          badges={<AdminStatusBadge status={negotiation.status ?? 'pending'} entity="negotiation" />}
          actions={
            <PmButton variant="outline" size="sm" asChild>
              <Link to={`/negotiations/${negotiation.id}`}>Open workspace view</Link>
            </PmButton>
          }
        />
      }
    >
      <div className="space-y-6">
        <PmContentCard title="Summary">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">
                {productLanguage.label('negotiation')} Title
              </dt>
              <dd>{presentation.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reference Number</dt>
              <dd>{presentation.reference}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{negotiation.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{formatDate(negotiation.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {productLanguage.label('opportunity')}
              </dt>
              <dd>
                {opportunityLabel
                  ? `${opportunityLabel.name} · ${opportunityLabel.reference}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Post Match</dt>
              <dd>{matchLabel ?? '—'}</dd>
            </div>
          </dl>
        </PmContentCard>

        <PmContentCard title="Offers">
          {offers.length === 0 ? (
            <PmTableEmpty title="No offers" />
          ) : (
            <PmDataTable
              data={[...offers]}
              getRowId={(o) => o.id}
              columns={[
                {
                  id: 'reference',
                  label: 'Reference',
                  cell: (o) => formatOfferReference(o),
                },
                { id: 'status', label: 'Status', cell: (o) => o.status ?? '—' },
                {
                  id: 'created',
                  label: 'Created',
                  cell: (o) => formatDate(o.createdAt),
                },
              ]}
            />
          )}
        </PmContentCard>

        <PmContentCard title="Transcript">
          {!canReadTranscript ? (
            <p className="text-sm text-muted-foreground">
              Transcript access requires <PmBadge tone="muted">admin.negotiations.transcript</PmBadge>.
            </p>
          ) : messages.length === 0 && transcriptEvents.length === 0 ? (
            <PmEmptyState
              title="No transcript events"
              description="No messages or transcript records for this negotiation."
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const sender = peopleApi.get(m.senderId)
                const senderLabel = sender
                  ? formatUserPresentation(sender).fullName
                  : 'Participant'
                return (
                  <div key={m.id} className="rounded-md border border-border/60 p-3 text-sm">
                    <div className="mb-1 flex flex-wrap gap-2 text-muted-foreground">
                      <span>{senderLabel}</span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                    <p>{m.body}</p>
                  </div>
                )
              })}
              {transcriptEvents.map((e) => (
                <div
                  key={e.id}
                  className="rounded-md border border-dashed border-border/60 p-3 text-sm text-muted-foreground"
                >
                  {e.eventType} · {formatDate(e.timestamp)}
                  {e.summary ? <p className="mt-1 text-foreground">{e.summary}</p> : null}
                </div>
              ))}
            </div>
          )}
        </PmContentCard>

        <AdminRelatedObjects groups={related} />
        <AdminUniversalTimeline events={timeline} />
      </div>
    </PmPage>
  )
}
