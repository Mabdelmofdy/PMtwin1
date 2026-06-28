import { Link, useParams } from 'react-router-dom'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { CreateContractButton } from '@/components/deal/create-contract-button'
import { DealStageActions } from '@/components/deal/deal-stage-actions.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  buildDealDetailReadModel,
  dealDetailLinkFallbackLabel,
  type DealDetailLink,
} from '@/lib/deal-detail-read-model.ts'
import { formatDate } from '@/lib/format'
import { EmptyState, PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function DealDetailNavLink({
  link,
  fallbackLabel,
}: {
  link: DealDetailLink | null
  fallbackLabel: string
}) {
  if (!link) {
    return (
      <span className="text-sm text-muted-foreground">
        {dealDetailLinkFallbackLabel(fallbackLabel)}
      </span>
    )
  }
  return (
    <Button variant="outline" className="cursor-pointer" asChild>
      <Link to={link.path}>{link.label}</Link>
    </Button>
  )
}

export function DealsPage() {
  const deals = dealsApi.list()
  if (!deals.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deals" description="Collaboration deals from accepted matches and applications." />
        <EmptyState title="No deals yet" description="Deals appear when negotiations conclude successfully." action={<Button className="cursor-pointer" asChild><Link to="/matches">View matches</Link></Button>} />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Deals" description="Track collaboration deals through lifecycle stages." />
      <div className="grid gap-4 md:grid-cols-2">
        {deals.map((d) => (
          <Link key={d.id} to={`/deals/${d.id}`} className="cursor-pointer">
            <Card className="hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex-row justify-between pb-2">
                <CardTitle className="text-base">{d.title}</CardTitle>
                <StatusBadge status={d.status} entity="deal" />
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Updated {formatDate(d.updatedAt)}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function DealDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()

  const model =
    id
      ? buildDealDetailReadModel(id, {
          getDeal: (dealId) => dealsApi.get(dealId),
          getNegotiation: (negotiationId) => negotiationsApi.get(negotiationId),
          getPostMatch: (postMatchId) => matchesApi.get(postMatchId),
          getOpportunity: (opportunityId) => opportunitiesApi.get(opportunityId),
          getContractsForDeal: (dealId) => contractsApi.getByDealId(dealId),
          getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
        })      : null

  void version

  if (!id || !model) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deal" description="Collaboration deal summary." />
        <EmptyState title="Deal not found" description="This deal may have been removed or the link is invalid." />
      </div>
    )
  }

  return (
    <div className="space-y-6" key={`deal-detail-${version}`}>
      <PageHeader
        label="Deal"
        title={model.deal.title}
        description={`Created ${formatDate(model.deal.createdAt)} · Updated ${formatDate(model.deal.updatedAt)}`}
        actions={
          <>
            <DealStageActions deal={model.deal} />
            <StatusBadge status={model.status} entity="deal" />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <DealDetailNavLink link={model.links.match} fallbackLabel="Back to Match" />
        <DealDetailNavLink link={model.links.negotiation} fallbackLabel="Back to Negotiation" />
        <DealDetailNavLink link={model.links.needOpportunity} fallbackLabel="Back to Need Opportunity" />
        <DealDetailNavLink link={model.links.offerOpportunity} fallbackLabel="Back to Offer Opportunity" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Linked records</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Status:</span> <StatusBadge status={model.status} entity="deal" /></p>
              <p><span className="text-muted-foreground">PostMatch ID:</span> {model.postMatchId ?? '—'}</p>
              <p><span className="text-muted-foreground">Negotiation ID:</span> {model.negotiationId}</p>
              <p><span className="text-muted-foreground">Need opportunity ID:</span> {model.needOpportunityId ?? '—'}</p>
              <p><span className="text-muted-foreground">Offer opportunity ID:</span> {model.offerOpportunityId ?? '—'}</p>
              <p>
                <span className="text-muted-foreground">Need:</span>{' '}
                {model.needTitle ?? '—'}
                {model.needOpportunityCanonicalStatus ? (
                  <> · <StatusBadge status={model.needOpportunityStatus ?? model.needOpportunityCanonicalStatus} entity="opportunity" /></>
                ) : null}
              </p>
              <p>
                <span className="text-muted-foreground">Offer:</span>{' '}
                {model.offerTitle ?? '—'}
                {model.offerOpportunityCanonicalStatus ? (
                  <> · <StatusBadge status={model.offerOpportunityStatus ?? model.offerOpportunityCanonicalStatus} entity="opportunity" /></>
                ) : null}
              </p>
              <p>
                <span className="text-muted-foreground">Negotiation status:</span>{' '}
                {model.negotiationStatus ? (
                  <StatusBadge status={model.negotiationStatus} entity="negotiation" />
                ) : (
                  '—'
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {model.participants.length ? (
                model.participants.map((participant) => (
                  <p key={`${participant.userId}-${participant.role}`}>
                    {participant.displayName} · {participant.role}
                    {participant.participantStatus ? ` (${participant.participantStatus})` : ''}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No participants recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
            <CardContent>
              <DealStageActions
                deal={model.deal}
                className="flex flex-col gap-2 [&>button]:w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Commercial terms</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {model.commercialTermsLines.length ? (
                model.commercialTermsLines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p className="text-muted-foreground">No commercial terms recorded yet.</p>
              )}
            </CardContent>
          </Card>

          {model.existingContract ? (
            <Card>
              <CardHeader><CardTitle>Contract</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <StatusBadge status={model.existingContract.status} entity="contract" />
                {model.contractLink ? (
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <Link to={model.contractLink.path}>{model.contractLink.label}</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : model.canCreateContract ? (
            <Card>
              <CardHeader><CardTitle>Contract</CardTitle></CardHeader>
              <CardContent>
                <CreateContractButton dealId={model.deal.id} className="w-full" />
              </CardContent>
            </Card>
          ) : null}        </div>
      </div>
    </div>
  )
}

export function DealRatePage() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <PageHeader title="Rate participants" description={`Post-deal review for deal ${id}`} />
      <Card>
        <CardHeader><CardTitle>Rating criteria</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Communication · Quality · Timeliness · Collaboration</p>
          <Button className="cursor-pointer">Submit review</Button>
        </CardContent>
      </Card>
    </div>
  )
}
