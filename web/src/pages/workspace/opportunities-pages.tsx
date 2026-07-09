import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Map, Plus } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { truncate } from '@/lib/format'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { useAuth } from '@/providers/auth-provider'
import {
  PmTableEmpty,
  PmTableFilter,
  PmTablePagination,
  PmTableSearch,
  PmTableToolbar,
  resolveListEmptyState,
} from '@/components/data/pm-data-index'
import { PmFormField } from '@/components/forms/pm-form-index'
import { PmContentCard, PmBrowsePage, PmBrowseToolbar, summarizeOpportunityListHero } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState, PmFilterChips, PmPage, PmPageHeader, PmPageHeroMetric, PmPageActions, PmSurface } from '@/components/ui/pm-index'
import { pmTypography } from '@/tokens'
import { pmResponsive } from '@/tokens'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { matchesApi } from '@/api/matches.ts'
import { peopleApi } from '@/api/people.ts'
import { buildViewerContext } from '@/lib/entity-view-visibility.ts'
import {
  filterOpportunitiesByOwnershipFilter,
  OPPORTUNITY_OWNERSHIP_FILTER_LABELS,
  readProductNavState,
  resolveDefaultOpportunityOwnershipFilter,
  type OpportunityOwnershipFilter,
} from '@/config/product-identity'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listMainCollaborationModels } from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import { resolveMainCollaborationModelLabel } from '@/domain/collaboration/opportunity-collaboration.ts'
import { OpportunityWizardPage } from '@/components/opportunity/wizard/opportunity-wizard-page.tsx'

function parseCsvParam(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function OpportunitiesPage() {
  const { user, canMutate, isPendingApproval } = useAuth()
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
                  <PmButton asChild disabled={!canMutate}>
                    <Link to={isPendingApproval ? '/dashboard' : '/opportunities/create'}>
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
              ) : (
                <PmButton size="sm" asChild>
                  <Link to="/marketplace">Explore marketplace</Link>
                </PmButton>
              )
            }
            secondaryAction={
              isMarketplaceBrowse ? (
                <PmButton size="sm" variant="outline" asChild>
                  <Link to="/dashboard">Go to dashboard</Link>
                </PmButton>
              ) : (
                <PmButton size="sm" variant="outline" asChild>
                  <Link to="/marketplace">Browse marketplace</Link>
                </PmButton>
              )
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
            secondaryAction={
              !isMarketplaceBrowse ? (
                <PmButton size="sm" asChild>
                  <Link to="/opportunities/create">Post opportunity</Link>
                </PmButton>
              ) : (
                <PmButton size="sm" variant="outline" asChild>
                  <Link to="/marketplace">Marketplace home</Link>
                </PmButton>
              )
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

export function OpportunityEditPage() {
  return <OpportunityWizardPage mode="edit" />
}
