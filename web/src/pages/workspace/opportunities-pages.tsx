import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Map, Plus } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatDate, truncate } from '@/lib/format'
import { OpportunityReadinessCard } from '@/components/readiness'
import { OpportunityPublishExperience } from '@/components/opportunity/opportunity-publish-experience'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { useAuth } from '@/providers/auth-provider'
import {
  publishOpportunityUiAction,
  resolveProfileKindFromUser,
  saveOpportunityDraftFields,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { showPublishSuccessFeedback } from '@/lib/publish-opportunity-feedback.ts'
import {
  PmDataTable,
  PmTableEmpty,
  PmTableFilter,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmFormActions,
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
  PmFormSection,
  PmFormWizard,
  PmFormWizardStep,
  type PmFormStepperStep,
} from '@/components/forms/pm-form-index'
import { PmContentCard, PmPageLayout } from '@/components/layout/pm-layout-index'
import { PmButton, PmPageHeader } from '@/components/ui/pm-index'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'

const WIZARD_STEPS: readonly PmFormStepperStep[] = [
  { id: 'type', label: 'Type', description: 'Need or offer' },
  { id: 'scope', label: 'Scope', description: 'Title and category' },
  { id: 'exchange', label: 'Exchange', description: 'Collaboration model' },
  { id: 'skills', label: 'Skills', description: 'Capabilities' },
  { id: 'timeline', label: 'Timeline', description: 'Location and dates' },
  { id: 'review', label: 'Review', description: 'Readiness check' },
  { id: 'publish', label: 'Publish', description: 'Go live' },
]

type OpportunityDraft = {
  title: string
  intent: 'need' | 'offer'
  description: string
  location: string
  modelType: string
  targetRole: string
  sector: string
  skills: string
  services: string
  startDate: string
}

const initialDraft: OpportunityDraft = {
  title: '',
  intent: 'need',
  description: '',
  location: '',
  modelType: 'project_based',
  targetRole: '',
  sector: '',
  skills: '',
  services: '',
  startDate: '',
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildOpportunityDraftInput(draft: OpportunityDraft): Record<string, unknown> {
  const skills = splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  const sectors = draft.sector ? [draft.sector] : []

  return {
    title: draft.title,
    intent: draft.intent,
    description: draft.description,
    location: draft.location,
    modelType: draft.modelType,
    scope: {
      sectors,
      ...(draft.intent === 'need'
        ? { requiredSkills: skills }
        : { offeredSkills: skills }),
    },
    attributes: {
      targetRole: draft.targetRole,
      startDate: draft.startDate || undefined,
    },
    normalized: {
      ...(draft.intent === 'need'
        ? { requiredServices: services }
        : { offeredServices: services }),
    },
  }
}

function resolveCompletedSteps(draft: OpportunityDraft): string[] {
  const completed: string[] = []
  if (draft.intent) completed.push('type')
  if (draft.title && draft.description) completed.push('scope')
  if (draft.modelType) completed.push('exchange')
  if (draft.skills || draft.services) completed.push('skills')
  if (draft.location) completed.push('timeline')
  if (draft.title) completed.push('review')
  return completed
}

export function OpportunitiesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const navigate = useNavigate()

  const opportunities = useMemo(() => {
    return opportunitiesApi.list().filter((o) => {
      const matchesSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.location?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || o.status === status
      const matchesScope = scope === 'all' || o.creatorId === user?.id
      return matchesSearch && matchesStatus && matchesScope
    })
  }, [search, status, scope, user?.id])

  const totalItems = opportunities.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = opportunities.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: PmDataTableColumn<(typeof opportunities)[number]>[] = [
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      cell: (o) => (
        <Link to={`/opportunities/${o.id}`} className="font-medium hover:text-primary">
          {o.title}
        </Link>
      ),
    },
    {
      id: 'intent',
      label: 'Intent',
      cell: (o) => formatOpportunityIntent(o.intent),
    },
    {
      id: 'category',
      label: 'Category',
      cell: (o) => o.scope?.sectors?.[0] ?? '—',
    },
    {
      id: 'location',
      label: 'Location',
      cell: (o) => o.location ?? '—',
    },
    {
      id: 'status',
      label: 'Status',
      cell: (o) => <OpportunityStatusBadge status={o.status} />,
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (o) => formatDate(o.updatedAt),
    },
  ]

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Marketplace"
          title="Opportunities"
          description="Browse published needs and offers across the built environment."
          actions={
            <>
              <PmButton variant="outline" asChild>
                <Link to="/opportunities/map">
                  <Map className="size-4" aria-hidden />
                  Map view
                </Link>
              </PmButton>
              <PmButton asChild>
                <Link to="/opportunities/create">
                  <Plus className="size-4" aria-hidden />
                  Post opportunity
                </Link>
              </PmButton>
            </>
          }
        />
      }
    >
      <PmDataTable
        density="compact"
        columns={columns}
        data={paged}
        getRowId={(o) => o.id}
        caption="Opportunities"
        toolbar={
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder="Search title, location…"
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
            filters={
              <PmTableFilter activeCount={status !== 'all' || scope !== 'all' ? 1 : 0} label="Filters">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Scope</label>
                    <Select value={scope} onValueChange={(v) => setScope(v as 'all' | 'mine')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All opportunities</SelectItem>
                        <SelectItem value="mine">My opportunities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_negotiation">In negotiation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PmTableFilter>
            }
          />
        }
        rowActions={(o) => (
          <PmTableRowActions
            onView={() => navigate(`/opportunities/${o.id}`)}
            onEdit={() => navigate(`/opportunities/${o.id}/edit`)}
            hiddenActions={['delete', 'duplicate']}
          />
        )}
        empty={
          <PmTableEmpty
            variant="no-results"
            title="No opportunities found"
            description="Try adjusting search or filters, or post a new opportunity."
            primaryAction={
              <PmButton size="sm" asChild>
                <Link to="/opportunities/create">Post opportunity</Link>
              </PmButton>
            }
          />
        }
        pagination={
          totalItems > 0 ? (
            <PmTablePagination
              page={safePage}
              pageSize={pageSize}
              totalItems={totalItems}
              pageSizeOptions={[12, 24, 48]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          ) : undefined
        }
        renderMobileCard={(o) => <OpportunityCard opportunity={o} />}
      />
    </PmPageLayout>
  )
}

export function OpportunityMapPage() {
  const items = opportunitiesApi.list().slice(0, 8)

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Geo browse"
          title="Opportunity map"
          description="Explore opportunities by location across the GCC."
        />
      }
    >
      <div className="grid min-h-[24rem] gap-4 lg:grid-cols-3">
        <PmContentCard
          title="Map"
          className="lg:col-span-2"
          noPadding
        >
          <div className="flex min-h-[20rem] items-center justify-center bg-surface-muted p-8">
            <p className="text-center text-sm text-muted-foreground">
              Map integration placeholder — wire to map service
            </p>
          </div>
        </PmContentCard>
        <PmContentCard title="Nearby listings">
          <div className="space-y-2">
            {items.map((o) => (
              <Link
                key={o.id}
                to={`/opportunities/${o.id}`}
                className="block rounded-lg p-2 text-sm transition-colors hover:bg-surface-muted"
              >
                <p className="font-medium">{truncate(o.title, 48)}</p>
                <p className="text-xs text-muted-foreground">{o.location}</p>
              </Link>
            ))}
          </div>
        </PmContentCard>
      </div>
    </PmPageLayout>
  )
}

export function OpportunityCreatePage() {
  return <OpportunityWizardPage mode="create" />
}

function OpportunityWizardPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const opportunityId = mode === 'edit' ? id : undefined
  const { user } = useAuth()
  const [draft, setDraft] = useState<OpportunityDraft>(initialDraft)
  const [activeStepId, setActiveStepId] = useState('type')
  const [publishDetails, setPublishDetails] = useState<readonly string[] | null>(null)
  const existingOpportunity = opportunityId ? opportunitiesApi.get(opportunityId) : undefined

  useEffect(() => {
    if (!existingOpportunity) return
    setDraft({
      title: existingOpportunity.title ?? '',
      intent: existingOpportunity.intent === 'offer' ? 'offer' : 'need',
      description: existingOpportunity.description ?? '',
      location: existingOpportunity.location ?? '',
      modelType: existingOpportunity.modelType ?? 'project_based',
      targetRole:
        (existingOpportunity as { attributes?: { targetRole?: string } }).attributes?.targetRole ?? '',
      sector: existingOpportunity.scope?.sectors?.[0] ?? '',
      skills: (
        existingOpportunity.scope?.coreSkills ??
        existingOpportunity.attributes?.coreSkills ??
        []
      ).join(', '),
      services: '',
      startDate: existingOpportunity.attributes?.startDate ?? '',
    })
  }, [existingOpportunity])

  const opportunityDraft = useMemo(() => {
    const built = buildOpportunityDraftInput(draft)
    return opportunityId ? { ...existingOpportunity, ...built, id: opportunityId } : built
  }, [draft, existingOpportunity, opportunityId])

  const completedStepIds = useMemo(() => resolveCompletedSteps(draft), [draft])

  const updateDraft = <K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setPublishDetails(null)
  }

  const handleSaveDraft = () => {
    if (!opportunityId) {
      sessionStorage.setItem('pmtwin.opportunity-draft', JSON.stringify(draft))
      toast.success('Draft saved locally. Open an existing draft opportunity to persist changes.')
      return
    }

    saveOpportunityDraftFields(opportunityId, opportunityDraft as Partial<import('@/types/domain.ts').Opportunity>)
    toast.success('Draft saved')
  }

  const handlePublish = () => {
    if (!user) {
      toast.error('Sign in to publish opportunities.')
      return
    }
    if (!opportunityId) {
      toast.error('Publishing requires an existing draft opportunity record.')
      return
    }

    const result = publishOpportunityUiAction(opportunityId, {
      profile: user.profile,
      profileKind: resolveProfileKindFromUser(user),
      opportunity: opportunityDraft,
    })

    if (!result.success) {
      setPublishDetails(result.details ?? [result.message])
      toast.error(result.message)
      return
    }

    setPublishDetails(null)
    showPublishSuccessFeedback(result)
  }

  return (
    <PmFormWizard
      stepper={{
        steps: WIZARD_STEPS,
        activeStepId,
        completedStepIds,
        onStepClick: setActiveStepId,
      }}
      rail={
        <OpportunityReadinessCard
          opportunity={opportunityDraft}
          opportunityId={opportunityId}
          suppressCta
        />
      }
      footer={
        <PmFormActions
          onCancel={() => window.history.back()}
          onSaveDraft={handleSaveDraft}
          onSubmit={activeStepId === 'publish' ? handlePublish : () => {
            const idx = WIZARD_STEPS.findIndex((s) => s.id === activeStepId)
            if (idx < WIZARD_STEPS.length - 1) {
              setActiveStepId(WIZARD_STEPS[idx + 1]!.id)
            }
          }}
          submitLabel={activeStepId === 'publish' ? 'Publish for matching' : 'Continue'}
          saveDraftLabel="Save draft"
        />
      }
    >
      <PmPageHeader
        label="Create"
        title={mode === 'edit' ? 'Edit opportunity' : 'Post an opportunity'}
        description="7-step wizard — type, scope, exchange mode, skills, timeline, review, publish."
        bordered={false}
        className="mb-2"
      />

      <OpportunityPublishExperience publishDetails={publishDetails} />

      <PmFormWizardStep stepId="type" activeStepId={activeStepId}>
          <PmFormSection title="Collaboration type" description="Choose need or offer.">
            <PmFormGrid columns={2}>
              {([
                ['need', 'Need (request)'],
                ['offer', 'Offer (provide)'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`cursor-pointer rounded-xl border p-4 text-left transition-colors hover:border-primary/40 ${draft.intent === value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/60'}`}
                  onClick={() => updateDraft('intent', value)}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="scope" activeStepId={activeStepId}>
          <PmFormSection title="Scope" description="Title, description, and category.">
            <PmFormGrid columns={2}>
              <PmFormGridItem span="full" gridColumns={2}>
                <PmFormField id="opp-title" label="Title" required>
                  <Input
                    value={draft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    placeholder="Opportunity title"
                  />
                </PmFormField>
              </PmFormGridItem>
              <PmFormGridItem span="full" gridColumns={2}>
                <PmFormField id="opp-description" label="Description" required>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                    placeholder="Describe scope and expectations"
                  />
                </PmFormField>
              </PmFormGridItem>
              <PmFormField id="opp-sector" label="Category / sector">
                <Input
                  value={draft.sector}
                  onChange={(e) => updateDraft('sector', e.target.value)}
                  placeholder="Construction"
                />
              </PmFormField>
              <PmFormField id="opp-role" label="Target role">
                <Input
                  value={draft.targetRole}
                  onChange={(e) => updateDraft('targetRole', e.target.value)}
                  placeholder="Architect"
                />
              </PmFormField>
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="exchange" activeStepId={activeStepId}>
          <PmFormSection title="Exchange mode" description="How collaboration is structured.">
            <PmFormField id="opp-model" label="Model type" required>
              <Select value={draft.modelType} onValueChange={(v) => updateDraft('modelType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_based">Project based</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                  <SelectItem value="consortium">Consortium</SelectItem>
                </SelectContent>
              </Select>
            </PmFormField>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="skills" activeStepId={activeStepId}>
          <PmFormSection title="Skills & services" description="Capabilities required or offered.">
            <PmFormGrid columns={2}>
              <PmFormField id="opp-skills" label="Skills" help="Comma-separated">
                <Input
                  value={draft.skills}
                  onChange={(e) => updateDraft('skills', e.target.value)}
                  placeholder="BIM, Sustainable Design"
                />
              </PmFormField>
              <PmFormField id="opp-services" label="Services" help="Comma-separated">
                <Input
                  value={draft.services}
                  onChange={(e) => updateDraft('services', e.target.value)}
                  placeholder="Design Review"
                />
              </PmFormField>
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="timeline" activeStepId={activeStepId}>
          <PmFormSection title="Timeline & location" description="Where and when work happens.">
            <PmFormGrid columns={2}>
              <PmFormField id="opp-location" label="Location">
                <Input
                  value={draft.location}
                  onChange={(e) => updateDraft('location', e.target.value)}
                  placeholder="Riyadh, Saudi Arabia"
                />
              </PmFormField>
              <PmFormField id="opp-start" label="Start date">
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => updateDraft('startDate', e.target.value)}
                />
              </PmFormField>
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="review" activeStepId={activeStepId}>
          <PmFormSection title="Review" description="Confirm details before publishing." bordered>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Title</dt><dd className="font-medium">{draft.title || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Intent</dt><dd className="font-medium">{formatOpportunityIntent(draft.intent)}</dd></div>
              <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{draft.location || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Model</dt><dd className="font-medium">{draft.modelType}</dd></div>
            </dl>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="publish" activeStepId={activeStepId}>
          <PmFormSection title="Publish" description="Save draft is always allowed. Publish requires readiness.">
            <p className="text-sm text-muted-foreground">
              {!opportunityId
                ? 'Create flow stores draft fields locally until you edit an existing draft opportunity.'
                : 'Publish when profile and opportunity readiness are complete.'}
            </p>
          </PmFormSection>
        </PmFormWizardStep>
    </PmFormWizard>
  )
}

export function OpportunityEditPage() {
  return <OpportunityWizardPage mode="edit" />
}
