import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Map as MapIcon, Plus } from 'lucide-react'
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
import { PmMultiSelect } from '@/components/ui/pm-multi-select'
import {
  coverageAreaSelectOptions,
  formatLocation,
  opportunityMatchesLocationQuery,
  opportunityMatchesLocationScopes,
  resolveScopeLabel,
} from '@/domain/locations'
import {
  PmContentCard,
  PmBrowsePage,
  PmBrowseToolbar,
  summarizeOpportunityListHero,
} from '@/components/layout/pm-layout-index'
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
import {
  buildViewerContext,
  isDraftOpportunity,
  isWithdrawnOpportunityVisibility,
} from '@/lib/entity-view-visibility.ts'
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
import { OpportunityMapView } from '@/components/opportunity/opportunity-map-view.tsx'
import { resolvePublishedOpportunityMapPoints } from '@/services/geospatial/location-coordinates.ts'
import { peopleApi } from '@/api/people.ts'

function parseCsvParam(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function OpportunitiesPage() {
  const { user, canMutate, isPendingApproval, activeWorkspace, activeParty } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navState = readProductNavState(location.state)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [mainModels, setMainModels] = useState<string[]>([])
  const [subModels, setSubModels] = useState<string[]>([])
  const [exchangeModes, setExchangeModes] = useState<string[]>([])
  const [matchTypes, setMatchTypes] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
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
    setLocations(parseCsvParam(searchParams.get('locations')))
  }, [searchParams])

  const allOpportunities = opportunitiesApi.list()
  const isMarketplaceBrowse =
    ownershipFilter === 'marketplace' || navState?.domain === 'marketplace'

  const viewer = useMemo(
    () =>
      buildViewerContext({
        userId: user?.id,
        role: user?.role,
        status: user?.status,
        activeWorkspaceId: activeWorkspace?.id,
        activePartyId: activeParty?.id,
      }),
    [user?.id, user?.role, user?.status, activeWorkspace?.id, activeParty?.id],
  )

  const ownershipScoped = useMemo(
    () =>
      filterOpportunitiesByOwnershipFilter(
        allOpportunities,
        viewer,
        ownershipFilter,
        (creatorId) => peopleApi.get(creatorId)?.organizationId,
        user?.organizationId,
      ),
    [allOpportunities, ownershipFilter, viewer, user?.organizationId],
  )

  // Portfolio hero: active workspace posts only (archived/closed are withdrawn).
  const heroSummary = useMemo(() => {
    const heroSource =
      ownershipFilter === 'marketplace'
        ? ownershipScoped
        : ownershipScoped.filter((o) => !isWithdrawnOpportunityVisibility(o))
    return summarizeOpportunityListHero(heroSource)
  }, [ownershipScoped, ownershipFilter])

  const opportunities = useMemo(() => {
    return ownershipScoped.filter((o) => {
      if (
        ownershipFilter === 'marketplace'
        && (o.visibilityStatus ?? '').toLowerCase() !== 'published'
      ) {
        return false
      }
      // Defense in depth: drafts never appear in marketplace browse results.
      if (ownershipFilter === 'marketplace' && isDraftOpportunity(o)) {
        return false
      }
      const withdrawn = isWithdrawnOpportunityVisibility(o)
      const visibility = (o.visibilityStatus ?? '').toLowerCase()
      let matchesStatus: boolean
      if (status === 'archived') {
        matchesStatus = visibility === 'archived'
      } else if (status === 'closed') {
        matchesStatus = visibility === 'closed'
      } else if (status === 'all') {
        // My / company work scope defaults to active posts only.
        matchesStatus =
          ownershipFilter === 'marketplace' ? true : !withdrawn
      } else {
        // Lifecycle chip (published/draft/negotiating): exclude withdrawn posts.
        matchesStatus = !withdrawn && o.status === status
      }
      const matchesSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        opportunityMatchesLocationQuery(o, search)
      const matchesLocations = opportunityMatchesLocationScopes(o, locations)
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
        matchesLocations &&
        matchesStatus &&
        matchesMainModel &&
        matchesSubModel &&
        matchesExchangeMode &&
        matchesTopology
      )
    })
  }, [
    ownershipScoped,
    search,
    status,
    ownershipFilter,
    mainModels,
    subModels,
    exchangeModes,
    matchTypes,
    locations,
  ])

  const totalItems = opportunities.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = opportunities.slice((safePage - 1) * pageSize, safePage * pageSize)

  const scopedSourceCount = ownershipScoped.length

  const listEmpty = resolveListEmptyState({
    hasSourceData: scopedSourceCount > 0,
    hasActiveFilters:
      search.length > 0 ||
      status !== 'all' ||
      mainModels.length > 0 ||
      subModels.length > 0 ||
      exchangeModes.length > 0 ||
      matchTypes.length > 0 ||
      locations.length > 0,
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
              value={heroSummary.totalCount}
              label="Total"
            />
          }
          badges={
            <>
              {ownershipFilter === 'mine' ? (
                <PmBadge tone="muted">{heroSummary.draftCount} draft</PmBadge>
              ) : null}
              <PmBadge tone="primary">{heroSummary.publishedCount} published</PmBadge>
              <PmBadge tone="info">{heroSummary.inProgressCount} in progress</PmBadge>
              <PmBadge tone="success">{heroSummary.completedCount} completed</PmBadge>
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
                      <MapIcon className="size-4" aria-hidden />
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
                        <SelectItem value="all">Active (default)</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
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
                  <PmFormField id="opp-filter-locations" label="Locations">
                    <PmMultiSelect
                      id="opp-filter-locations"
                      value={locations}
                      onChange={(next) => {
                        setLocations(next)
                        setPage(1)
                      }}
                      options={coverageAreaSelectOptions()}
                      maxSelected={15}
                      placeholder="Filter by location…"
                      searchPlaceholder="Search areas…"
                    />
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
                  ...locations.map((scopeId) => ({
                    id: `location-${scopeId}`,
                    label: 'Location',
                    value: resolveScopeLabel(scopeId),
                    onRemove: () => {
                      setLocations((current) =>
                        current.filter((item) => item !== scopeId),
                      )
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
                    setLocations([])
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
  const [searchParams, setSearchParams] = useSearchParams()
  const publishedOpportunities = opportunitiesApi.listMarketplace()
  const mapPoints = useMemo(
    () => resolvePublishedOpportunityMapPoints(publishedOpportunities),
    [publishedOpportunities],
  )
  const mapPointIds = useMemo(
    () => new Set(mapPoints.map((point) => point.opportunity.id)),
    [mapPoints],
  )
  const querySelectedId = searchParams.get('id')
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (querySelectedId && mapPointIds.has(querySelectedId)) return querySelectedId
    return mapPoints[0]?.opportunity.id ?? null
  })
  const sidebarItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (!querySelectedId || !mapPointIds.has(querySelectedId)) return
    setSelectedId(querySelectedId)
  }, [querySelectedId, mapPointIds])

  const handleSelect = useCallback((opportunityId: string) => {
    if (!mapPointIds.has(opportunityId)) return
    setSelectedId(opportunityId)
    setSearchParams({ id: opportunityId }, { replace: true })
    sidebarItemRefs.current.get(opportunityId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [mapPointIds, setSearchParams])

  const sidebarItems = useMemo(
    () =>
      mapPoints.length > 0
        ? mapPoints.map((point) => point.opportunity)
        : publishedOpportunities.slice(0, 12),
    [mapPoints, publishedOpportunities],
  )

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Marketplace"
          title="Opportunity map"
          description="Explore published marketplace opportunities by location across Saudi Arabia."
          tone="opportunity"
          metric={
            <PmPageHeroMetric value={mapPoints.length} label="Mapped listings" />
          }
          actions={
            <PmButton variant="outline" asChild>
              <Link to="/opportunities">Return to Marketplace</Link>
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
          {mapPoints.length > 0 ? (
            <OpportunityMapView
              points={mapPoints}
              selectedId={selectedId}
              onSelect={handleSelect}
              className="min-h-[22rem] w-full rounded-b-xl"
            />
          ) : (
            <PmEmptyState
              title="No mappable listings yet"
              description="Published opportunities need a location before they can appear on the map."
              size="compact"
              className="min-h-[22rem]"
              action={
                <PmButton size="sm" variant="outline" asChild>
                  <Link to="/opportunities">Browse Marketplace</Link>
                </PmButton>
              }
            />
          )}
        </PmContentCard>
        <PmContentCard
          title="Nearby listings"
          description={`${mapPoints.length} published ${mapPoints.length === 1 ? 'listing' : 'listings'} with map coordinates`}
        >
          <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
            {sidebarItems.map((opportunity) => {
              const isSelected = opportunity.id === selectedId
              const isOnMap = mapPointIds.has(opportunity.id)

              return (
                <div
                  key={opportunity.id}
                  ref={(node) => {
                    if (node) sidebarItemRefs.current.set(opportunity.id, node)
                    else sidebarItemRefs.current.delete(opportunity.id)
                  }}
                >
                  <PmSurface
                    variant="default"
                    shadow="card"
                    interactive={isOnMap}
                    role={isOnMap ? 'button' : undefined}
                    tabIndex={isOnMap ? 0 : undefined}
                    aria-pressed={isOnMap ? isSelected : undefined}
                    className={cn(
                      'p-3',
                      isSelected && 'ring-2 ring-primary/40',
                      isOnMap && 'cursor-pointer',
                    )}
                    onClick={isOnMap ? () => handleSelect(opportunity.id) : undefined}
                    onKeyDown={
                      isOnMap
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleSelect(opportunity.id)
                            }
                          }
                        : undefined
                    }
                  >
                    <p className={cn(pmTypography.bodySm, 'font-medium')}>
                      {truncate(opportunity.title, 48)}
                    </p>
                    <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                      {formatLocation(opportunity.location) ||
                        'Location unavailable'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {isOnMap ? (
                        <span className={cn(pmTypography.caption, 'text-primary')}>
                          {isSelected ? 'Shown on map' : 'Show on map'}
                        </span>
                      ) : null}
                      <Link
                        to={`/opportunities/${opportunity.id}`}
                        className={cn(pmTypography.caption, 'text-muted-foreground hover:text-primary')}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View details
                      </Link>
                    </div>
                  </PmSurface>
                </div>
              )
            })}
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
  const { id } = useParams()
  return <OpportunityWizardPage key={id} mode="edit" />
}
