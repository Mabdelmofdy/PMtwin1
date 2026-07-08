import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Map, Plus } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { truncate } from '@/lib/format'
import { OpportunityReadinessCard } from '@/components/readiness'
import { OpportunityPublishExperience } from '@/components/opportunity/opportunity-publish-experience'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { useAuth } from '@/providers/auth-provider'
import {
  publishOpportunityUiAction,
  resolveProfileKindFromUser,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { showPublishSuccessFeedback } from '@/lib/publish-opportunity-feedback.ts'
import {
  PmTableEmpty,
  PmTableFilter,
  PmTablePagination,
  PmTableSearch,
  PmTableToolbar,
  resolveListEmptyState,
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
import { PmContentCard, PmBrowsePage, PmBrowseToolbar, summarizeOpportunityListHero } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState, PmFilterChips, PmPage, PmPageHeader, PmPageHeroMetric, PmPageActions, PmSurface } from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { pmResponsive } from '@/tokens'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { matchesApi } from '@/api/matches.ts'
import { peopleApi } from '@/api/people.ts'
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import {
  buildViewerContext,
  canEditOpportunity,
} from '@/lib/entity-view-visibility.ts'
import {
  filterOpportunitiesByOwnershipFilter,
  OPPORTUNITY_OWNERSHIP_FILTER_LABELS,
  readProductNavState,
  resolveDefaultOpportunityOwnershipFilter,
  type OpportunityOwnershipFilter,
} from '@/config/product-identity'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import {
  MatchingModelsReferencePanel,
  NeedOfferMirrorPanel,
  UserJourneyStrip,
  ValueExchangeModesPanel,
} from '@/components/need-offer/need-offer-framework-panels'
import { buildOpportunitySemanticReadModel } from '@/lib/need-offer-semantic-read-model.ts'
import {
  buildOpportunityCollaborationPatch,
  deriveMatchingTopology,
  listMainCollaborationModels,
  listSubModelsForMain,
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { CollaborationSubModelFields } from '@/components/opportunity/collaboration-sub-model-fields.tsx'
import {
  formatCollaborationExchangeMode,
} from '@/lib/collaboration-taxonomy-display.ts'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'
import { buildValueExchangeDraftPayload } from '@/domain/collaboration/value-exchange-lifecycle.ts'
import {
  buildOpportunityWizardReadinessInput,
  EMPTY_OPPORTUNITY_WIZARD_DRAFT,
  evaluateOpportunityWizardReadiness,
  type OpportunityWizardDraft,
} from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import type { OpportunityCollaborationPayload } from '@pm-twin/commands'

const WIZARD_STEPS: readonly PmFormStepperStep[] = [
  { id: 'type', label: 'Type', description: 'Need or offer' },
  { id: 'scope', label: 'Scope', description: 'Title and category' },
  { id: 'exchange', label: 'Exchange', description: 'Collaboration model' },
  { id: 'submodel', label: 'Sub-model', description: 'Business attributes' },
  { id: 'skills', label: 'Skills', description: 'Capabilities' },
  { id: 'timeline', label: 'Timeline', description: 'Location and dates' },
  { id: 'review', label: 'Review', description: 'Readiness check' },
  { id: 'publish', label: 'Publish', description: 'Go live' },
]

type OpportunityDraft = {
  title: string
  intent: 'need' | 'offer' | ''
  description: string
  location: string
  mainCollaborationModel: string
  modelType: string
  subModelType: string
  exchangeMode: string
  paymentModes: string[]
  targetRole: string
  sector: string
  skills: string
  services: string
  startDate: string
  tenderDeadline: string
  collaborationAttributes: Record<string, unknown>
  preferredPartnerType: string
  attachmentsText: string
  complianceRequirementsText: string
  deliveryMilestonesText: string
}

/** New drafts start empty — readinessScore must be 0 (no pre-filled demo models/intent). */
const initialDraft: OpportunityDraft = {
  title: EMPTY_OPPORTUNITY_WIZARD_DRAFT.title ?? '',
  intent: '',
  description: EMPTY_OPPORTUNITY_WIZARD_DRAFT.description ?? '',
  location: EMPTY_OPPORTUNITY_WIZARD_DRAFT.location ?? '',
  mainCollaborationModel: EMPTY_OPPORTUNITY_WIZARD_DRAFT.mainCollaborationModel ?? '',
  modelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.modelType ?? '',
  subModelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.subModelType ?? '',
  exchangeMode: EMPTY_OPPORTUNITY_WIZARD_DRAFT.exchangeMode ?? '',
  paymentModes: [...(EMPTY_OPPORTUNITY_WIZARD_DRAFT.paymentModes ?? [])],
  targetRole: EMPTY_OPPORTUNITY_WIZARD_DRAFT.targetRole ?? '',
  sector: EMPTY_OPPORTUNITY_WIZARD_DRAFT.sector ?? '',
  skills: EMPTY_OPPORTUNITY_WIZARD_DRAFT.skills ?? '',
  services: EMPTY_OPPORTUNITY_WIZARD_DRAFT.services ?? '',
  startDate: EMPTY_OPPORTUNITY_WIZARD_DRAFT.startDate ?? '',
  tenderDeadline: EMPTY_OPPORTUNITY_WIZARD_DRAFT.tenderDeadline ?? '',
  collaborationAttributes: {},
  preferredPartnerType: '',
  attachmentsText: '',
  complianceRequirementsText: '',
  deliveryMilestonesText: '',
}

function toWizardDraft(draft: OpportunityDraft): OpportunityWizardDraft {
  return draft
}

function formatNameList(
  values: ReadonlyArray<{ name?: string } | string> | undefined,
): string {
  if (!values?.length) return ''
  return values
    .map((item) => (typeof item === 'string' ? item : item.name ?? ''))
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

function formatMilestoneList(
  values: ReadonlyArray<{ title?: string } | string> | undefined,
): string {
  if (!values?.length) return ''
  return values
    .map((item) => (typeof item === 'string' ? item : item.title ?? ''))
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseCsvParam(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildOpportunityDraftInput(draft: OpportunityDraft): Record<string, unknown> {
  const skills = splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  const sectors = draft.sector ? [draft.sector] : []
  const hasCollaborationSelection =
    Boolean(draft.mainCollaborationModel?.trim()) &&
    Boolean(draft.subModelType?.trim()) &&
    Boolean(draft.exchangeMode?.trim())

  // Never invent taxonomy defaults for an empty create draft — that inflated
  // readiness/collaboration completion before the user made choices.
  const collaborationPatch = hasCollaborationSelection
    ? buildOpportunityCollaborationPatch({
        mainCollaborationModel: draft.mainCollaborationModel,
        modelType: draft.modelType,
        subModelType: draft.subModelType,
        exchangeMode: draft.exchangeMode,
        acceptedExchangeModes: draft.paymentModes,
      })
    : {}

  const base = buildOpportunityWizardReadinessInput(toWizardDraft(draft))
  const exchangePayload = hasCollaborationSelection
    ? buildValueExchangeDraftPayload(draft)
    : {}

  return {
    ...base,
    ...collaborationPatch,
    scope: {
      ...(base.scope as Record<string, unknown>),
      sectors,
      ...(draft.intent === 'offer'
        ? { offeredSkills: skills, coreSkills: skills }
        : { requiredSkills: skills, coreSkills: skills }),
    },
    attributes: {
      ...(base.attributes as Record<string, unknown>),
      targetRole: draft.targetRole,
      startDate: draft.startDate || undefined,
      tenderDeadline: draft.tenderDeadline || undefined,
      requiredSkills: skills,
      ...(draft.intent === 'offer'
        ? { availabilityDate: draft.startDate || undefined }
        : {}),
    },
    collaborationAttributes: {
      ...draft.collaborationAttributes,
      detailedScope: draft.collaborationAttributes.detailedScope ?? draft.description,
      requiredSkills:
        draft.collaborationAttributes.requiredSkills
        ?? (skills.length > 0 ? skills : undefined),
      startDate: (draft.collaborationAttributes.startDate ?? draft.startDate) || undefined,
    },
    exchangeData: {
      ...(base.exchangeData as Record<string, unknown>),
      ...exchangePayload,
      ...(draft.exchangeMode ? { exchangeMode: draft.exchangeMode } : {}),
    },
    normalized: {
      ...(draft.intent === 'offer'
        ? { offeredServices: services }
        : { requiredServices: services }),
    },
  }
}

function buildCollaborationCommandPayload(
  draft: OpportunityDraft,
  creatorId?: string,
): OpportunityCollaborationPayload {
  const built = buildOpportunityDraftInput(draft)
  // Prefer taxonomy fields only — preferredMatchingTopology is derived by the
  // command handler / patch builder and must never come from user matchType input.
  return {
    title: draft.title,
    description: draft.description,
    intent: draft.intent === 'offer' || draft.intent === 'need' ? draft.intent : undefined,
    location: draft.location,
    creatorId,
    mainCollaborationModel: draft.mainCollaborationModel,
    modelType: draft.modelType,
    subModelType: draft.subModelType,
    exchangeMode: draft.exchangeMode,
    acceptedExchangeModes: draft.paymentModes,
    collaborationAttributes: built.collaborationAttributes as Record<string, unknown>,
    scope: built.scope as Record<string, unknown>,
    attributes: built.attributes as Record<string, unknown>,
    normalized: built.normalized as Record<string, unknown>,
    exchangeData: built.exchangeData as Record<string, unknown>,
    paymentModes: draft.paymentModes,
    preferredPartnerType: draft.preferredPartnerType || undefined,
    attachments: built.attachments as OpportunityCollaborationPayload['attachments'],
    complianceRequirements: built.complianceRequirements as string[] | undefined,
    deliveryMilestones:
      built.deliveryMilestones as OpportunityCollaborationPayload['deliveryMilestones'],
  }
}

function resolveCompletedSteps(draft: OpportunityDraft): string[] {
  const readiness = evaluateOpportunityWizardReadiness(toWizardDraft(draft))
  const completed: string[] = []
  if (draft.intent) completed.push('type')
  if (readiness.stages.find((s) => s.id === 'basicInfo')?.complete) completed.push('scope')
  if (readiness.stages.find((s) => s.id === 'mainCollaborationModel')?.complete) {
    completed.push('exchange')
  }
  if (
    readiness.stages.find((s) => s.id === 'subModel')?.complete &&
    readiness.stages.find((s) => s.id === 'subModelFields')?.complete
  ) {
    completed.push('submodel')
  }
  if (draft.skills || draft.services) completed.push('skills')
  if (readiness.stages.find((s) => s.id === 'timelineLocationSkills')?.complete) {
    completed.push('timeline')
  }
  if (readiness.stages.find((s) => s.id === 'review')?.complete) completed.push('review')
  if (readiness.publishReady) completed.push('publish')
  return completed
}

export function OpportunitiesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navState = readProductNavState(location.state)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [mainModels, setMainModels] = useState<string[]>([])
  const [subModels, setSubModels] = useState<string[]>([])
  const [exchangeModes, setExchangeModes] = useState<string[]>([])
  const [matchTypes, setMatchTypes] = useState<string[]>([])
  const [ownershipFilter, setOwnershipFilter] = useState<OpportunityOwnershipFilter>(() =>
    resolveDefaultOpportunityOwnershipFilter(navState),
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  useEffect(() => {
    setOwnershipFilter(resolveDefaultOpportunityOwnershipFilter(navState))
    setPage(1)
  }, [location.key, navState?.domain, navState?.ownershipScope])

  useEffect(() => {
    setMainModels(parseCsvParam(searchParams.get('mainModel') ?? searchParams.get('mainModels')))
    setSubModels(parseCsvParam(searchParams.get('subModels')))
    setExchangeModes(parseCsvParam(searchParams.get('exchangeModes')))
    setMatchTypes(parseCsvParam(searchParams.get('matchTypes')))
  }, [searchParams])

  const allOpportunities = opportunitiesApi.list()
  const heroSummary = summarizeOpportunityListHero(allOpportunities)
  const totalMatches = matchesApi.list().length
  const isMarketplaceBrowse =
    ownershipFilter === 'marketplace' || navState?.domain === 'marketplace'

  const opportunities = useMemo(() => {
    const viewer = buildViewerContext({
      userId: user?.id,
      role: user?.role,
      status: user?.status,
    })
    const scoped = filterOpportunitiesByOwnershipFilter(
      allOpportunities,
      viewer,
      ownershipFilter,
      (creatorId) => peopleApi.get(creatorId)?.organizationId,
      user?.organizationId,
    )
    return scoped.filter((o) => {
      if (
        ownershipFilter === 'marketplace'
        && (o.visibilityStatus ?? '').toLowerCase() !== 'published'
      ) {
        return false
      }
      const matchesSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.location?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || o.status === status
      const matchesMainModel =
        mainModels.length === 0 || (o.mainCollaborationModel != null && mainModels.includes(o.mainCollaborationModel))
      const matchesSubModel =
        subModels.length === 0 || (o.subModelType != null && subModels.includes(o.subModelType))
      const matchesExchangeMode =
        exchangeModes.length === 0 ||
        (o.exchangeMode != null && exchangeModes.includes(o.exchangeMode)) ||
        o.acceptedExchangeModes?.some((mode) => exchangeModes.includes(mode))
      const matchesTopology =
        matchTypes.length === 0 ||
        (o.preferredMatchingTopology != null &&
          matchTypes.includes(o.preferredMatchingTopology))
      return (
        matchesSearch &&
        matchesStatus &&
        matchesMainModel &&
        matchesSubModel &&
        matchesExchangeMode &&
        matchesTopology
      )
    })
  }, [
    allOpportunities,
    search,
    status,
    ownershipFilter,
    user?.id,
    user?.role,
    user?.status,
    user?.organizationId,
    mainModels,
    subModels,
    exchangeModes,
    matchTypes,
  ])

  const totalItems = opportunities.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = opportunities.slice((safePage - 1) * pageSize, safePage * pageSize)

  const scopedSourceCount = useMemo(() => {
    const viewer = buildViewerContext({
      userId: user?.id,
      role: user?.role,
      status: user?.status,
    })
    return filterOpportunitiesByOwnershipFilter(
      allOpportunities,
      viewer,
      ownershipFilter,
      (creatorId) => peopleApi.get(creatorId)?.organizationId,
      user?.organizationId,
    ).length
  }, [allOpportunities, ownershipFilter, user?.id, user?.role, user?.status, user?.organizationId])

  const listEmpty = resolveListEmptyState({
    hasSourceData: scopedSourceCount > 0,
    hasActiveFilters:
      search.length > 0 ||
      status !== 'all' ||
      mainModels.length > 0 ||
      subModels.length > 0 ||
      exchangeModes.length > 0 ||
      matchTypes.length > 0,
    firstRun: {
      title: isMarketplaceBrowse
        ? 'No opportunities available yet'
        : 'Post your first opportunity',
      description: isMarketplaceBrowse
        ? 'Published needs and offers from the marketplace will appear here.'
        : 'Describe what you need or offer — publishing runs matching and surfaces collaboration partners.',
    },
    filtered: {
      title: 'No opportunities match your filters',
      description: 'Try adjusting search or filters, or post a new opportunity.',
    },
  })

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label={isMarketplaceBrowse ? 'Marketplace' : 'My Workspace'}
          title={
            ownershipFilter === 'mine'
              ? 'My opportunities'
              : ownershipFilter === 'company'
                ? 'Company opportunities'
                : 'Browse opportunities'
          }
          description={
            isMarketplaceBrowse
              ? 'Explore available needs and offers across the construction marketplace.'
              : 'Manage opportunities you own or your company is executing.'
          }
          tone="opportunity"
          metric={
            <PmPageHeroMetric
              value={heroSummary.activeCount}
              label="Active"
            />
          }
          badges={
            <>
              <PmBadge tone="muted">{heroSummary.draftCount} drafts</PmBadge>
              <PmBadge tone="primary">{heroSummary.publishedCount} published</PmBadge>
              <PmBadge tone="info">{totalMatches} matches</PmBadge>
            </>
          }
          actions={
            <PmPageActions
              secondary={{
                label: 'Map view',
                href: '/opportunities/map',
                variant: 'outline',
                render: () => (
                  <PmButton variant="outline" asChild>
                    <Link to="/opportunities/map">
                      <Map className="size-4" aria-hidden />
                      Map view
                    </Link>
                  </PmButton>
                ),
              }}
              primary={{
                label: 'Create opportunity',
                href: '/opportunities/create',
                render: () => (
                  <PmButton asChild>
                    <Link to="/opportunities/create">
                      <Plus className="size-4" aria-hidden />
                      Create opportunity
                    </Link>
                  </PmButton>
                ),
              }}
            />
          }
        />
      }
      toolbar={
        <PmBrowseToolbar>
          <Tabs
            value={ownershipFilter}
            onValueChange={(value) => {
              setOwnershipFilter(value as OpportunityOwnershipFilter)
              setPage(1)
            }}
          >
            <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
              {(Object.keys(OPPORTUNITY_OWNERSHIP_FILTER_LABELS) as OpportunityOwnershipFilter[]).map(
                (key) => (
                  <TabsTrigger key={key} value={key} className="cursor-pointer">
                    {OPPORTUNITY_OWNERSHIP_FILTER_LABELS[key]}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </Tabs>
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder={
                  isMarketplaceBrowse
                    ? 'Search available opportunities…'
                    : 'Search my opportunities…'
                }
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
            filters={
              <PmTableFilter activeCount={status !== 'all' ? 1 : 0} label="Filters">
                <div className="space-y-3">
                  <PmFormField id="opp-filter-status" label="Status">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="opp-filter-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                      </SelectContent>
                    </Select>
                  </PmFormField>
                  <PmFormField id="opp-filter-main-models" label="Main collaboration model">
                    <Select
                      value="__placeholder__"
                      onValueChange={(value) => {
                        if (value === '__placeholder__') return
                        setMainModels((current) =>
                          current.includes(value)
                            ? current.filter((item) => item !== value)
                            : [...current, value],
                        )
                        setPage(1)
                      }}
                    >
                      <SelectTrigger id="opp-filter-main-models" className="w-full">
                        <SelectValue placeholder="Toggle model…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__placeholder__">Toggle model…</SelectItem>
                        {listMainCollaborationModels().map((model) => (
                          <SelectItem key={model.key} value={model.key}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PmFormField>
                  <PmFormField id="opp-filter-exchange-modes" label="Exchange mode">
                    <Select
                      value="__placeholder_exchange__"
                      onValueChange={(value) => {
                        if (value === '__placeholder_exchange__') return
                        setExchangeModes((current) =>
                          current.includes(value)
                            ? current.filter((item) => item !== value)
                            : [...current, value],
                        )
                        setPage(1)
                      }}
                    >
                      <SelectTrigger id="opp-filter-exchange-modes" className="w-full">
                        <SelectValue placeholder="Toggle exchange mode…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__placeholder_exchange__">Toggle exchange mode…</SelectItem>
                        {['cash', 'barter', 'profit_sharing', 'equity', 'hybrid'].map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {formatCollaborationExchangeMode(mode)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PmFormField>
                </div>
              </PmTableFilter>
            }
          >
            <PmFilterChips
              chips={
                [
                  ...(status !== 'all'
                    ? [
                        {
                          id: 'status',
                          label: 'Status',
                          value: status.charAt(0).toUpperCase() + status.slice(1),
                          onRemove: () => {
                            setStatus('all')
                            setPage(1)
                          },
                        },
                      ]
                    : []),
                  ...mainModels.map((model) => ({
                    id: `main-${model}`,
                    label: 'Main model',
                    value: resolveMainCollaborationModelLabel(model),
                    onRemove: () => {
                      setMainModels((current) => current.filter((item) => item !== model))
                      setPage(1)
                    },
                  })),
                  ...exchangeModes.map((mode) => ({
                    id: `exchange-${mode}`,
                    label: 'Exchange',
                    value: formatCollaborationExchangeMode(mode),
                    onRemove: () => {
                      setExchangeModes((current) => current.filter((item) => item !== mode))
                      setPage(1)
                    },
                  })),
                  ...matchTypes.map((type) => ({
                    id: `matchType-${type}`,
                    label: 'Match type',
                    value: formatFrameworkMatchTypeLabel(type),
                    onRemove: () => {
                      setMatchTypes((current) => current.filter((item) => item !== type))
                      setPage(1)
                    },
                  })),
                ]
              }
            />
          </PmTableToolbar>
        </PmBrowseToolbar>
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
        ) : null
      }
    >
      {paged.length === 0 ? (
        listEmpty.branch === 'first-run' ? (
          <PmEmptyState
            title={
              (listEmpty.branch === 'first-run' ? listEmpty.config.title : undefined) ??
              'Post your first opportunity'
            }
            description={
              listEmpty.branch === 'first-run' ? listEmpty.config.description : undefined
            }
            action={
              !isMarketplaceBrowse ? (
                <PmButton size="sm" asChild>
                  <Link to="/opportunities/create">Post opportunity</Link>
                </PmButton>
              ) : undefined
            }
          />
        ) : listEmpty.branch === 'filtered' ? (
          <PmTableEmpty
            variant="no-results"
            title={listEmpty.config.title}
            description={listEmpty.config.description}
            primaryAction={
              <PmButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setStatus('all')
                    setMainModels([])
                    setSubModels([])
                    setExchangeModes([])
                    setMatchTypes([])
                    setSearchParams({})
                  setPage(1)
                }}
              >
                Clear filters
              </PmButton>
            }
          />
        ) : null
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              canEdit={user?.id === o.creatorId}
              showOwnerInsights={user?.id === o.creatorId}
              viewerUserId={user?.id}
              viewerOrganizationId={user?.organizationId}
            />
          ))}
        </div>
      )}
    </PmBrowsePage>
  )
}

export function OpportunityMapPage() {
  const allOpportunities = opportunitiesApi.list()
  const items = allOpportunities.slice(0, 8)

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Marketplace"
          title="Opportunity map"
          description="Explore opportunities by location across the GCC. Map integration is in preview."
          tone="opportunity"
          metric={
            <PmPageHeroMetric value={allOpportunities.length} label="Listings" />
          }
          actions={
            <PmButton variant="outline" asChild>
              <Link to="/opportunities">List view</Link>
            </PmButton>
          }
        />
      }
    >
      <div className="grid min-h-[22rem] gap-4 lg:grid-cols-3">
        <PmContentCard
          title="Map"
          className="lg:col-span-2"
          noPadding
        >
          <PmEmptyState
            title="Map coming soon"
            description="Map integration placeholder — wire to map service when ready."
            size="compact"
            className="min-h-[22rem]"
          />
        </PmContentCard>
        <PmContentCard title="Nearby listings">
          <div className="space-y-3">
            {items.map((o) => (
              <PmSurface
                key={o.id}
                variant="default"
                shadow="card"
                interactive
                className="p-3"
              >
                <Link to={`/opportunities/${o.id}`} className="block">
                  <p className={cn(pmTypography.bodySm, 'font-medium hover:text-primary')}>{truncate(o.title, 48)}</p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{o.location}</p>
                </Link>
              </PmSurface>
            ))}
          </div>
        </PmContentCard>
      </div>
    </PmPage>
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
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | undefined>()
  const existingOpportunity = opportunityId ? opportunitiesApi.get(opportunityId) : undefined
  const resolvedOpportunityId = opportunityId ?? createdOpportunityId

  const mainModels = useMemo(() => listMainCollaborationModels(), [])
  const subModelOptions = useMemo(
    () => listSubModelsForMain(draft.mainCollaborationModel),
    [draft.mainCollaborationModel],
  )
  const derivedTopology = useMemo(
    () =>
      deriveMatchingTopology({
        mainCollaborationModel: draft.mainCollaborationModel,
        modelType: draft.modelType,
        subModelType: draft.subModelType,
        exchangeMode: draft.exchangeMode,
        acceptedExchangeModes: draft.paymentModes,
      }),
    [draft],
  )

  useEffect(() => {
    if (!existingOpportunity) return
    setDraft({
      title: existingOpportunity.title ?? '',
      intent: existingOpportunity.intent === 'offer' ? 'offer' : 'need',
      description: existingOpportunity.description ?? '',
      location: existingOpportunity.location ?? '',
      mainCollaborationModel:
        existingOpportunity.mainCollaborationModel ?? '',
      modelType: existingOpportunity.modelType ?? '',
      subModelType: existingOpportunity.subModelType ?? '',
      exchangeMode: existingOpportunity.exchangeMode ?? '',
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
      tenderDeadline: existingOpportunity.attributes?.tenderDeadline ?? '',
      paymentModes:
        existingOpportunity.acceptedExchangeModes
        ?? existingOpportunity.paymentModes
        ?? (existingOpportunity.exchangeMode ? [existingOpportunity.exchangeMode] : []),
      collaborationAttributes: existingOpportunity.collaborationAttributes ?? {},
      preferredPartnerType:
        existingOpportunity.preferredPartnerType
        ?? existingOpportunity.attributes?.preferredPartnerType
        ?? '',
      attachmentsText: formatNameList(existingOpportunity.attachments),
      complianceRequirementsText: (existingOpportunity.complianceRequirements ?? []).join(', '),
      deliveryMilestonesText: formatMilestoneList(existingOpportunity.deliveryMilestones),
    })
  }, [existingOpportunity])

  const opportunityDraft = useMemo(() => {
    const built = buildOpportunityDraftInput(draft)
    return resolvedOpportunityId
      ? { ...existingOpportunity, ...built, id: resolvedOpportunityId }
      : built
  }, [draft, existingOpportunity, resolvedOpportunityId])

  // Single source of truth: field-level readiness (same as publish gate).
  const wizardReadiness = useMemo(
    () => evaluateOpportunityWizardReadiness(toWizardDraft(draft)),
    [draft],
  )

  const wizardReadinessResult = useMemo(
    () => wizardReadiness.fieldReadiness,
    [wizardReadiness],
  )

  const semanticPreview = useMemo(
    () => buildOpportunitySemanticReadModel(opportunityDraft as import('@/types/domain.ts').Opportunity),
    [opportunityDraft],
  )

  const completedStepIds = useMemo(() => resolveCompletedSteps(draft), [draft])

  const updateDraft = <K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setPublishDetails(null)
  }

  const handleSaveDraft = () => {
    if (!user) {
      toast.error('Sign in to save opportunities.')
      return
    }

    if (!resolvedOpportunityId) {
      const payload = buildCollaborationCommandPayload(draft, user.id)
      const result = opportunityCommandService.createOpportunity(payload)
      if (!result.success) {
        toast.error(result.errors?.join('\n') ?? 'Could not create opportunity')
        return
      }
      setCreatedOpportunityId(result.aggregateId)
      toast.success('Draft opportunity created')
      return
    }

    const updateResult = opportunityCommandService.updateOpportunity(
      resolvedOpportunityId,
      buildCollaborationCommandPayload(draft, user.id),
    )
    if (!updateResult.success) {
      toast.error(updateResult.errors?.join('\n') ?? 'Could not save draft')
      return
    }
    toast.success('Draft saved')
  }

  const handlePublish = () => {
    if (!user) {
      toast.error('Sign in to publish opportunities.')
      return
    }
    if (!resolvedOpportunityId) {
      toast.error('Save the draft before publishing.')
      return
    }

    const result = publishOpportunityUiAction(resolvedOpportunityId, {
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

  if (mode === 'edit' && opportunityId) {
    if (!existingOpportunity) {
      return (
        <PmPage
          header={
            <PmPageHeader
              title="Opportunity not found"
              description="This record may have been removed."
            />
          }
        >
          <PmEmptyState
            title="Opportunity not found"
            description="This record may have been removed or the link is invalid."
            action={
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/opportunities">Back to opportunities</Link>
              </PmButton>
            }
          />
        </PmPage>
      )
    }

    const viewer = buildViewerContext({
      userId: user?.id,
      role: user?.role,
      status: user?.status,
    })
    if (!canEditOpportunity(existingOpportunity, viewer)) {
      return (
        <PmPage
          header={
            <PmPageHeader
              title="Access denied"
              description="You do not have permission to edit this opportunity."
            />
          }
        >
          <EntityAccessDenied
            description="Only the opportunity owner or platform admin can edit this record."
            backHref={`/opportunities/${opportunityId}`}
            backLabel="Back to opportunity"
          />
        </PmPage>
      )
    }
  }

  return (
    <PmPage>
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
          title="Opportunity Readiness"
          result={wizardReadinessResult}
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
        tone="opportunity"
        metric={
          <PmPageHeroMetric
            value={`${Math.round(wizardReadiness.readinessScore)}%`}
            label="Opportunity Readiness"
          />
        }
        bordered={false}
        className="mb-2"
      />

      <OpportunityPublishExperience publishDetails={publishDetails} />

      <UserJourneyStrip
        activeStepId={
          activeStepId === 'type'
            ? 'post'
            : activeStepId === 'exchange'
              ? 'model'
              : activeStepId === 'review'
                ? 'attributes'
                : activeStepId === 'publish'
                  ? 'matching'
                  : 'attributes'
        }
        compact
      />

      <PmFormWizardStep stepId="type" activeStepId={activeStepId}>
          <PmFormSection
            title="Post type"
            description="Need and Offer are first-class post types in the Need/Offer framework."
          >
            <PmFormGrid columns={2}>
              {([
                ['need', 'Need'],
                ['offer', 'Offer'],
              ] as const).map(([value, label]) => (
                <PmSurface
                  key={value}
                  variant={draft.intent === value ? 'elevated' : 'default'}
                  shadow={draft.intent === value ? 'card' : 'none'}
                  interactive
                  className={
                    draft.intent === value ? 'border-primary/40 ring-1 ring-primary/20' : undefined
                  }
                >
                  <button
                    type="button"
                    className="w-full cursor-pointer p-4 text-start"
                    onClick={() => updateDraft('intent', value)}
                  >
                    <span className="font-medium">{label}</span>
                    <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                      {value === 'need'
                        ? 'Post a need for services, skills, or project capacity.'
                        : 'Offer your services, skills, or available capacity.'}
                    </p>
                  </button>
                </PmSurface>
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
          <PmFormSection
            title="Collaboration model & exchange"
            description="Choose main collaboration model, sub-model, and value exchange mode. Matching topology is system-derived — not a user choice."
          >
            <PmFormField id="opp-main-model" label="Main collaboration model" required>
              <Select
                value={draft.mainCollaborationModel || undefined}
                onValueChange={(value) => {
                  const firstSub = listSubModelsForMain(value)[0]
                  updateDraft('mainCollaborationModel', value)
                  if (firstSub) {
                    setDraft((current) => ({
                      ...current,
                      mainCollaborationModel: value,
                      modelType: firstSub.modelType,
                      subModelType: firstSub.key,
                    }))
                  }
                  setPublishDetails(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collaboration model" />
                </SelectTrigger>
                <SelectContent>
                  {mainModels.map((model) => (
                    <SelectItem key={model.key} value={model.key}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PmFormField>

            <PmFormField id="opp-sub-model" label="Sub-model" required className="mt-4">
              <Select
                value={draft.subModelType || undefined}
                onValueChange={(value) => {
                  const sub = subModelOptions.find((entry) => entry.key === value)
                  setDraft((current) => ({
                    ...current,
                    subModelType: value,
                    modelType: sub?.modelType ?? current.modelType,
                  }))
                  setPublishDetails(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-model" />
                </SelectTrigger>
                <SelectContent>
                  {subModelOptions.map((sub) => (
                    <SelectItem key={sub.key} value={sub.key}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PmFormField>

            <div
              className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm"
              data-testid="recommended-matching-topology"
              aria-live="polite"
            >
              <p className={cn(pmTypography.label)}>Recommended Matching Topology</p>
              <p className="font-medium">
                System will match this as {formatFrameworkMatchTypeLabel(derivedTopology.topology)}
              </p>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                System-derived — based on your collaboration model and exchange mode.
              </p>
              <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                {derivedTopology.reason}
              </p>
            </div>

            <div className="mt-4">
              <ValueExchangeModesPanel
                selectedModes={draft.paymentModes}
                selectable
                onToggle={(modeKey) => {
                  const has = draft.paymentModes.includes(modeKey)
                  const nextModes = has
                    ? draft.paymentModes.filter((mode) => mode !== modeKey)
                    : [...draft.paymentModes, modeKey]
                  setDraft((current) => ({
                    ...current,
                    paymentModes: nextModes.length > 0 ? nextModes : [modeKey],
                    exchangeMode: (nextModes[0] ?? modeKey) as OpportunityDraft['exchangeMode'],
                  }))
                  setPublishDetails(null)
                }}
              />
            </div>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="submodel" activeStepId={activeStepId}>
          <PmFormSection
            title="Sub-model attributes"
            description="Registry-driven fields for the selected collaboration sub-model."
          >
            <CollaborationSubModelFields
              subModelType={draft.subModelType}
              values={draft.collaborationAttributes}
              onChange={(key, value) => {
                setDraft((current) => ({
                  ...current,
                  collaborationAttributes: {
                    ...current.collaborationAttributes,
                    [key]: value,
                  },
                }))
                setPublishDetails(null)
              }}
            />
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="skills" activeStepId={activeStepId}>
          <PmFormSection
            title="Skills & services"
            description={
              draft.intent === 'need'
                ? 'Required skills for this Need post.'
                : 'Available skills for this Offer post.'
            }
          >
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
          <PmFormSection
            title="Timeline & location"
            description={
              draft.intent === 'need'
                ? 'Deadline and location requirements for the Need.'
                : 'Availability and preferred location for the Offer.'
            }
          >
            <PmFormGrid columns={2}>
              <PmFormField id="opp-location" label={draft.intent === 'need' ? 'Location' : 'Preferred location'}>
                <Input
                  value={draft.location}
                  onChange={(e) => updateDraft('location', e.target.value)}
                  placeholder="Riyadh, Saudi Arabia"
                />
              </PmFormField>
              <PmFormField id="opp-start" label={draft.intent === 'need' ? 'Start date' : 'Availability from'}>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => updateDraft('startDate', e.target.value)}
                />
              </PmFormField>
              {draft.intent === 'need' ? (
                <PmFormField id="opp-deadline" label="Deadline">
                  <Input
                    type="date"
                    value={draft.tenderDeadline}
                    onChange={(e) => updateDraft('tenderDeadline', e.target.value)}
                  />
                </PmFormField>
              ) : null}
            </PmFormGrid>
          </PmFormSection>

          <PmFormSection
            title="Recommended details"
            description="Optional fields that raise Completion Score to 100%. Required fields alone unlock publish at 80%+."
            className="mt-4"
          >
            <PmFormGrid columns={2}>
              <PmFormField id="opp-partner-type" label="Preferred partner type">
                <Select
                  value={draft.preferredPartnerType || undefined}
                  onValueChange={(value) => updateDraft('preferredPartnerType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="general_contractor">General contractor</SelectItem>
                  </SelectContent>
                </Select>
              </PmFormField>
              <PmFormField
                id="opp-attachments"
                label="Attachments / portfolio"
                help="Comma-separated reference names"
              >
                <Input
                  value={draft.attachmentsText}
                  onChange={(e) => updateDraft('attachmentsText', e.target.value)}
                  placeholder="design-brief.pdf, portfolio.pdf"
                />
              </PmFormField>
              <PmFormField
                id="opp-compliance"
                label="Compliance requirements"
                help="Comma-separated"
              >
                <Input
                  value={draft.complianceRequirementsText}
                  onChange={(e) => updateDraft('complianceRequirementsText', e.target.value)}
                  placeholder="Saudi Building Code, PDPL"
                />
              </PmFormField>
              <PmFormField
                id="opp-milestones"
                label="Delivery milestones"
                help="Comma-separated milestone titles"
              >
                <Input
                  value={draft.deliveryMilestonesText}
                  onChange={(e) => updateDraft('deliveryMilestonesText', e.target.value)}
                  placeholder="Concept design, Delivery kickoff"
                />
              </PmFormField>
            </PmFormGrid>
          </PmFormSection>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="review" activeStepId={activeStepId}>
          <PmFormSection title="Review" description="Confirm framework-aligned details before publishing." bordered>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Title</dt><dd className="font-medium">{draft.title || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Post type</dt><dd className="font-medium">{formatOpportunityIntent(draft.intent)}</dd></div>
              <div><dt className="text-muted-foreground">Main model</dt><dd className="font-medium">{resolveMainCollaborationModelLabel(draft.mainCollaborationModel)}</dd></div>
              <div><dt className="text-muted-foreground">Sub-model</dt><dd className="font-medium">{resolveSubModelLabel(draft.subModelType)}</dd></div>
              <div>
                <dt className="text-muted-foreground">Recommended Matching Topology</dt>
                <dd className="font-medium">
                  System will match this as {formatFrameworkMatchTypeLabel(derivedTopology.topology)}
                </dd>
                <dd className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  System-derived — based on your collaboration model and exchange mode
                </dd>
              </div>
              <div><dt className="text-muted-foreground">Value exchange</dt><dd className="font-medium">{draft.paymentModes.map(formatCollaborationExchangeMode).join(', ') || '—'}</dd></div>
            </dl>
          </PmFormSection>
          <div className="mt-4 grid gap-4">
            <NeedOfferMirrorPanel semantic={semanticPreview} compact />
            <MatchingModelsReferencePanel
              selectedModel={derivedTopology.topology}
              compact
              systemDerived
            />
          </div>
        </PmFormWizardStep>

        <PmFormWizardStep stepId="publish" activeStepId={activeStepId}>
          <PmFormSection title="Publish" description="Save draft is always allowed. Publish requires readiness.">
            <p className="text-sm text-muted-foreground">
              {!resolvedOpportunityId
                ? 'Save draft to create a persisted opportunity record before publishing.'
                : 'Publish when profile and opportunity readiness are complete.'}
            </p>
          </PmFormSection>
        </PmFormWizardStep>
    </PmFormWizard>
    </PmPage>
  )
}

export function OpportunityEditPage() {
  return <OpportunityWizardPage mode="edit" />
}
