import { Link, useParams } from 'react-router-dom'
import { dataStore } from '@/lib/data-store'
import { formatDate } from '@/lib/format'
import { EmptyState, PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DealsPage() {
  const deals = dataStore.getNegotiations().map((n) => ({
    id: n.id,
    title: `Deal from ${n.id}`,
    status: n.status ?? 'pending',
    updatedAt: n.updatedAt,
  }))
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
                <StatusBadge status={d.status} />
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
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <PageHeader title={`Deal ${id}`} description="Lifecycle stepper, milestones, and participants." actions={<Button className="cursor-pointer" asChild><Link to={`/deals/${id}/rate`}>Rate participants</Link></Button>} />
      <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Deal workspace — wire to deal service</CardContent></Card>
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

export function ContractsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" description="Agreements linked to deals and opportunities." />
      <EmptyState title="No contracts in seed data" description="Contracts are created when deals reach signing stage." />
    </div>
  )
}

export function ContractDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <PageHeader title={`Contract ${id}`} description="Parties, terms, milestones, and audit log." />
      <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Contract detail — wire to contracts service</CardContent></Card>
    </div>
  )
}
