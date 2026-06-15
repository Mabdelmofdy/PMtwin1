import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Plus } from 'lucide-react'
import { dataStore } from '@/lib/data-store'
import { formatDate, truncate } from '@/lib/format'
import { PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function OpportunitiesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const opportunities = useMemo(() => {
    return dataStore.getOpportunities().filter((o) => {
      const matchesSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.location?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || o.status === status
      return matchesSearch && matchesStatus
    })
  }, [search, status])

  return (
    <div className="space-y-6">
      <PageHeader
        label="Marketplace"
        title="Opportunities"
        description="Browse published needs and offers across the built environment."
        actions={
          <>
            <Button variant="outline" className="cursor-pointer" asChild>
              <Link to="/opportunities/map">Map view</Link>
            </Button>
            <Button className="cursor-pointer" asChild>
              <Link to="/opportunities/create">
                <Plus className="size-4" aria-hidden />
                Post opportunity
              </Link>
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search title, location, skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full cursor-pointer sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All statuses</SelectItem>
            <SelectItem value="published" className="cursor-pointer">Published</SelectItem>
            <SelectItem value="draft" className="cursor-pointer">Draft</SelectItem>
            <SelectItem value="in_negotiation" className="cursor-pointer">In negotiation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {opportunities.slice(0, 24).map((opp) => (
          <Link
            key={opp.id}
            to={`/opportunities/${opp.id}`}
            className="group cursor-pointer"
          >
            <Card className="h-full border-border/60 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-base leading-snug">
                    {opp.title}
                  </CardTitle>
                  <StatusBadge status={opp.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-2">{truncate(opp.description || '', 100)}</p>
                <p className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {opp.location || '—'}
                </p>
                <p className="text-xs">Updated {formatDate(opp.updatedAt)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function OpportunityMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Geo browse"
        title="Opportunity map"
        description="Explore opportunities by location across the GCC."
      />
      <div className="grid min-h-[24rem] gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-8 lg:col-span-2">
          <p className="text-center text-sm text-muted-foreground">Map integration placeholder — wire to map service</p>
        </div>
        <div className="space-y-2 overflow-y-auto rounded-xl border border-border/60 p-4">
          {dataStore.getOpportunities().slice(0, 8).map((o) => (
            <Link key={o.id} to={`/opportunities/${o.id}`} className="block cursor-pointer rounded-lg p-2 text-sm transition-colors hover:bg-muted/50">
              <p className="font-medium">{truncate(o.title, 48)}</p>
              <p className="text-xs text-muted-foreground">{o.location}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const wizardSteps = ['Type', 'Scope', 'Exchange', 'Skills', 'Timeline', 'Review', 'Publish']

export function OpportunityCreatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Create"
        title="Post an opportunity"
        description="7-step wizard — type, scope, exchange mode, skills, timeline, review, publish."
      />
      <div className="flex gap-1 overflow-x-auto pb-2">
        {wizardSteps.map((s, i) => (
          <span key={s} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Step 1 — Collaboration type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {['Need (request)', 'Offer (provide)'].map((t) => (
            <button key={t} type="button" className="cursor-pointer rounded-xl border border-border/60 p-4 text-left hover:border-primary/40">
              {t}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function OpportunityDetailPage() {
  const { id } = useParams()
  const opp = id ? dataStore.getOpportunityById(id) : undefined
  if (!opp) {
    return <p className="text-muted-foreground">Opportunity not found.</p>
  }
  const skills = opp.scope?.coreSkills ?? opp.attributes?.coreSkills ?? []
  return (
    <div className="space-y-6">
      <PageHeader
        label="Opportunity"
        title={opp.title}
        description={opp.location}
        actions={
          <>
            <StatusBadge status={opp.status} />
            <Button variant="outline" className="cursor-pointer" asChild>
              <Link to={`/opportunities/${opp.id}/edit`}>Edit</Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{opp.description}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Core skills</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.map((s: string) => (
                <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs">{s}</span>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Exchange</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Mode:</span> {opp.exchangeMode}</p>
            <p><span className="text-muted-foreground">Model:</span> {opp.modelType}</p>
            <p><span className="text-muted-foreground">Intent:</span> {opp.intent}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function OpportunityEditPage() {
  return <OpportunityCreatePage />
}
