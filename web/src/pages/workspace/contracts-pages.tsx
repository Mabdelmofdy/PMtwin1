import { Link, useParams } from 'react-router-dom'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { SignContractButton } from '@/components/contract/sign-contract-button.tsx'
import { CompleteContractButton } from '@/components/contract/complete-contract-button.tsx'
import { TerminateContractButton } from '@/components/contract/terminate-contract-button.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  buildContractDetailReadModel,
  CONTRACT_DETAIL_MUTATION_ACTIONS,
  contractDetailLinkFallbackLabel,
  contractDetailShowsMutationActions,
  type ContractDetailLink,
} from '@/lib/contract-detail-read-model.ts'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/providers/auth-provider'
import { EmptyState, PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ContractDetailNavLink({
  link,
  fallbackLabel,
}: {
  link: ContractDetailLink | null
  fallbackLabel: string
}) {
  if (!link) {
    return (
      <span className="text-sm text-muted-foreground">
        {contractDetailLinkFallbackLabel(fallbackLabel)}
      </span>
    )
  }
  return (
    <Button variant="outline" className="cursor-pointer" asChild>
      <Link to={link.path}>{link.label}</Link>
    </Button>
  )
}

export function ContractsPage() {
  const contracts = contractsApi.list()
  if (!contracts.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contracts" description="Agreements linked to deals and opportunities." />
        <EmptyState
          title="No contracts yet"
          description="Contracts are created from deals in draft, review, or signing."
          action={
            <Button className="cursor-pointer" asChild>
              <Link to="/deals">View deals</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" description="Agreements linked to deals and opportunities." />
      <div className="grid gap-4 md:grid-cols-2">
        {contracts.map((contract) => (
          <Link key={contract.id} to={`/contracts/${contract.id}`} className="cursor-pointer">
            <Card className="hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex-row justify-between pb-2">
                <CardTitle className="text-base">Contract {contract.id}</CardTitle>
                <StatusBadge status={contract.status} entity="contract" />
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Deal {contract.dealId} · Updated {formatDate(contract.updatedAt)}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ContractDetailPage() {
  const version = useDataStoreVersion()
  const { user } = useAuth()
  const { id } = useParams()

  const model =
    id
      ? buildContractDetailReadModel(
          id,
          {
            getContract: (contractId) => contractsApi.get(contractId),
            getDeal: (dealId) => dealsApi.get(dealId),
            getNegotiation: (negotiationId) => negotiationsApi.get(negotiationId),
            getOpportunity: (opportunityId) => opportunitiesApi.get(opportunityId),
            getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
          },
          { currentUserId: user?.id },
        )
      : null

  void version

  if (!id || !model) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contract" description="Contract summary." />
        <EmptyState
          title="Contract not found"
          description="This contract may have been removed or the link is invalid."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Contract"
        title={`Contract ${model.contractId}`}
        description={`Created ${formatDate(model.contract.createdAt)} · Updated ${formatDate(model.contract.updatedAt)}`}
        actions={<StatusBadge status={model.status} entity="contract" />}
      />

      <div className="flex flex-wrap gap-2">
        <ContractDetailNavLink link={model.links.deal} fallbackLabel="Back to Deal" />
        <ContractDetailNavLink link={model.links.match} fallbackLabel="Back to Match" />
        <ContractDetailNavLink link={model.links.negotiation} fallbackLabel="Back to Negotiation" />
        <ContractDetailNavLink link={model.links.needOpportunity} fallbackLabel="Back to Need Opportunity" />
        <ContractDetailNavLink link={model.links.offerOpportunity} fallbackLabel="Back to Offer Opportunity" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Linked records</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Contract ID:</span> {model.contractId}</p>
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                <StatusBadge status={model.status} entity="contract" />
              </p>
              <p><span className="text-muted-foreground">Deal ID:</span> {model.dealId}</p>
              <p>
                <span className="text-muted-foreground">Deal:</span>{' '}
                {model.dealTitle ?? '—'}
                {model.dealStatus ? (
                  <> · <StatusBadge status={model.dealStatus} entity="deal" /></>
                ) : null}
              </p>
              <p><span className="text-muted-foreground">PostMatch ID:</span> {model.postMatchId ?? '—'}</p>
              <p><span className="text-muted-foreground">Negotiation ID:</span> {model.negotiationId ?? '—'}</p>
              <p><span className="text-muted-foreground">Need opportunity ID:</span> {model.needOpportunityId ?? '—'}</p>
              <p><span className="text-muted-foreground">Offer opportunity ID:</span> {model.offerOpportunityId ?? '—'}</p>
              <p><span className="text-muted-foreground">Need:</span> {model.needTitle ?? '—'}
                {model.needOpportunityCanonicalStatus ? (
                  <> · <StatusBadge status={model.needOpportunityStatus ?? model.needOpportunityCanonicalStatus} entity="opportunity" /></>
                ) : null}
              </p>
              <p><span className="text-muted-foreground">Offer:</span> {model.offerTitle ?? '—'}
                {model.offerOpportunityCanonicalStatus ? (
                  <> · <StatusBadge status={model.offerOpportunityStatus ?? model.offerOpportunityCanonicalStatus} entity="opportunity" /></>
                ) : null}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Parties & signatures</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {model.parties.length ? (
                model.parties.map((party) => (
                  <p key={`${party.userId}-${party.role}`}>
                    {party.displayName} · {party.role} ·{' '}
                    {party.signatureState === 'signed'
                      ? `Signed${party.signedAt ? ` ${formatDate(party.signedAt)}` : ''}`
                      : 'Pending signature'}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No parties recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Scope</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {model.scope ?? 'No scope recorded.'}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {model.milestones.length ? (
                model.milestones.map((milestone) => (
                  <p key={milestone.id ?? milestone.title}>
                    {milestone.title}
                    {milestone.dueDate ? ` · due ${formatDate(milestone.dueDate)}` : ''}
                    {milestone.status ? ` · ${milestone.status}` : ''}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No milestones recorded.</p>
              )}
            </CardContent>
          </Card>

          {contractDetailShowsMutationActions({
            canSign: model.canSign,
            canComplete: model.canComplete,
            canTerminate: model.canTerminate,
          }) ? (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {model.canSign && user?.id ? (
                  <SignContractButton
                    contractId={model.contractId}
                    userId={user.id}
                    className="w-full"
                  />
                ) : null}
                {model.canComplete ? (
                  <CompleteContractButton
                    contractId={model.contractId}
                    className="w-full"
                  />
                ) : null}
                {model.canTerminate ? (
                  <TerminateContractButton
                    contractId={model.contractId}
                    className="w-full"
                  />
                ) : null}
                {CONTRACT_DETAIL_MUTATION_ACTIONS.activate ? (
                  <Button className="cursor-pointer">Activate contract</Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
