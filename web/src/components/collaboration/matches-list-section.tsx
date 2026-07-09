import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatDate } from '@/lib/format'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import { MatchCard, MatchTypeChip } from '@/components/collaboration/match-card'
import {
  PmDataTable,
  PmTableEmpty,
  PmTableFilter,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  resolveListEmptyState,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmButton,
  PmEmptyState,
  PmFilterChips,
  PmMatchScoreBadge,
  PmWorkflowBadge,
  type PmFilterChip,
} from '@/components/ui/pm-index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pmTypography } from '@/tokens'
import { MATCHING_MODELS, MATCHING_MODEL_KEYS } from '@/config/need-offer-framework.ts'
import { formatFrameworkMatchTypeSubtitle } from '@/config/need-offer-framework.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import { cn } from '@/lib/utils'
import type { PostMatch } from '@/types/domain.ts'
import { collectPostMatchOpportunityIds } from '@/domain/normalized/post-match-strong-key.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'

export type MatchesListFilters = ReturnType<typeof useMatchesListFilters>

export type MatchesListSectionProps = {
  matches: readonly PostMatch[]
  showToolbar?: boolean
  showPagination?: boolean
  compact?: boolean
  /** Browse page card grid; pipeline embed keeps table layout. */
  layout?: 'table' | 'cards'
  /** Truncate long titles in card layout (presentation only). */
  shortenTitles?: boolean
  /** When provided, filter/pagination state is controlled externally (browse page). */
  filters?: MatchesListFilters
}

export function useMatchesListFilters(
  matches: readonly PostMatch[],
  options?: { compact?: boolean },
) {
  const compact = options?.compact ?? false
  const [search, setSearchState] = useState('')
  const [status, setStatusState] = useState('all')
  const [matchType, setMatchTypeState] = useState('all')
  const [mainModel, setMainModelState] = useState('all')
  const [exchangeMode, setExchangeModeState] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(compact ? 8 : 12)

  const setSearch = (value: string) => {
    setSearchState(value)
    setPage(1)
  }
  const setStatus = (value: string) => {
    setStatusState(value)
    setPage(1)
  }
  const setMatchType = (value: string) => {
    setMatchTypeState(value)
    setPage(1)
  }
  const setMainModel = (value: string) => {
    setMainModelState(value)
    setPage(1)
  }
  const setExchangeMode = (value: string) => {
    setExchangeModeState(value)
    setPage(1)
  }
  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(1)
  }

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const pairing = formatMatchDisplayTitle(m, (id) => opportunitiesApi.get(id)).toLowerCase()
      const matchesSearch = !search || pairing.includes(search.toLowerCase())
      const matchesStatus = status === 'all' || m.status === status
      const matchesType =
        matchType === 'all' || (m.matchType || 'one_way').toLowerCase() === matchType
      const relatedOpportunities = collectPostMatchOpportunityIds(m)
        .map((id) => opportunitiesApi.get(id))
        .filter(Boolean)
      const matchesMainModel =
        mainModel === 'all' ||
        relatedOpportunities.some((opp) => opp?.mainCollaborationModel === mainModel)
      const matchesExchangeMode =
        exchangeMode === 'all' ||
        relatedOpportunities.some(
          (opp) =>
            opp?.exchangeMode === exchangeMode ||
            opp?.acceptedExchangeModes?.includes(exchangeMode),
        )
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesMainModel &&
        matchesExchangeMode
      )
    })
  }, [matches, search, status, matchType, mainModel, exchangeMode])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasActiveFilters =
    search.length > 0 ||
    status !== 'all' ||
    matchType !== 'all' ||
    mainModel !== 'all' ||
    exchangeMode !== 'all'
  const listEmpty = resolveListEmptyState({
    hasSourceData: matches.length > 0,
    hasActiveFilters,
    firstRun: {
      title: 'No matches yet',
      description:
        'Matches appear when opportunities are published and the matching engine runs.',
    },
    filtered: {
      title: 'No matches found',
      description: 'Try adjusting search or filters.',
    },
  })

  const activeFilterChips: PmFilterChip[] = [
    ...(status !== 'all'
      ? [
          {
            id: 'status',
            label: 'Status',
            value: status.charAt(0).toUpperCase() + status.slice(1),
            onRemove: () => setStatus('all'),
          },
        ]
      : []),
    ...(matchType !== 'all'
      ? [
          {
            id: 'matchType',
            label: 'Match type',
            value:
              MATCHING_MODELS[matchType as keyof typeof MATCHING_MODELS]?.label ?? matchType,
            onRemove: () => setMatchType('all'),
          },
        ]
      : []),
    ...(mainModel !== 'all'
      ? [
          {
            id: 'mainModel',
            label: 'Main model',
            value: mainModel.replace(/_/g, ' '),
            onRemove: () => setMainModel('all'),
          },
        ]
      : []),
    ...(exchangeMode !== 'all'
      ? [
          {
            id: 'exchangeMode',
            label: 'Exchange',
            value: formatCollaborationExchangeMode(exchangeMode),
            onRemove: () => setExchangeMode('all'),
          },
        ]
      : []),
  ]

  const clearAllFilters = () => {
    setSearchState('')
    setStatusState('all')
    setMatchTypeState('all')
    setMainModelState('all')
    setExchangeModeState('all')
    setPage(1)
  }

  return {
    search,
    setSearch,
    status,
    setStatus,
    matchType,
    setMatchType,
    mainModel,
    setMainModel,
    exchangeMode,
    setExchangeMode,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paged,
    totalItems,
    safePage,
    pageCount,
    hasActiveFilters,
    listEmpty,
    activeFilterChips,
    clearAllFilters,
    compact,
  }
}

export type MatchesBrowseToolbarProps = Pick<
  MatchesListFilters,
  | 'search'
  | 'setSearch'
  | 'status'
  | 'setStatus'
  | 'matchType'
  | 'setMatchType'
  | 'mainModel'
  | 'setMainModel'
  | 'exchangeMode'
  | 'setExchangeMode'
  | 'activeFilterChips'
  | 'clearAllFilters'
>

/** Search, filter panel, and chips for matches browse — composed inside `PmBrowseToolbar`. */
export function MatchesBrowseToolbar({
  search,
  setSearch,
  status,
  setStatus,
  matchType,
  setMatchType,
  mainModel,
  setMainModel,
  exchangeMode,
  setExchangeMode,
  activeFilterChips,
  clearAllFilters,
}: MatchesBrowseToolbarProps) {
  return (
    <PmTableToolbar
      search={
        <PmTableSearch
          placeholder="Search need, offer, or partner…"
          value={search}
          onValueChange={setSearch}
        />
      }
      filters={
        <PmTableFilter
          activeCount={(status !== 'all' ? 1 : 0) + (matchType !== 'all' ? 1 : 0)}
          label="Filters"
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className={pmTypography.label}>Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="discovered">Discovered</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className={pmTypography.label}>Match type</label>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  {MATCHING_MODEL_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {MATCHING_MODELS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className={pmTypography.label}>Main model</label>
              <Select value={mainModel} onValueChange={setMainModel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All main models</SelectItem>
                  {['cash_subcontracting', 'service_exchange', 'joint_venture', 'resource_sharing', 'hiring'].map((model) => (
                    <SelectItem key={model} value={model}>
                      {model.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className={pmTypography.label}>Exchange mode</label>
              <Select value={exchangeMode} onValueChange={setExchangeMode}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All exchange modes</SelectItem>
                  {['cash', 'barter', 'profit_sharing', 'equity', 'hybrid'].map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {formatCollaborationExchangeMode(mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PmTableFilter>
      }
    >
      <PmFilterChips
        chips={activeFilterChips}
        onClearAll={() => {
          clearAllFilters()
        }}
      />
    </PmTableToolbar>
  )
}

/** Shared matches list — table (pipeline) or card grid (browse). */
export function MatchesListSection({
  matches,
  showToolbar = true,
  showPagination = true,
  compact = false,
  layout = 'table',
  shortenTitles = false,
  filters: externalFilters,
}: MatchesListSectionProps) {
  if (externalFilters) {
    if (layout === 'cards') {
      return (
        <MatchesListCardGrid
          showToolbar={showToolbar}
          showPagination={showPagination}
          filters={externalFilters}
          shortenTitles={shortenTitles}
        />
      )
    }

    return (
      <MatchesListTable
        matches={matches}
        showToolbar={showToolbar}
        showPagination={showPagination}
        filters={externalFilters}
      />
    )
  }

  return (
    <MatchesListSectionWithFilters
      matches={matches}
      showToolbar={showToolbar}
      showPagination={showPagination}
      compact={compact}
      layout={layout}
      shortenTitles={shortenTitles}
    />
  )
}

function MatchesListSectionWithFilters({
  matches,
  showToolbar,
  showPagination,
  compact,
  layout,
  shortenTitles,
}: Omit<MatchesListSectionProps, 'filters'>) {
  const filters = useMatchesListFilters(matches, { compact })
  if (layout === 'cards') {
    return (
      <MatchesListCardGrid
        showToolbar={showToolbar}
        showPagination={showPagination}
        filters={filters}
        shortenTitles={shortenTitles}
      />
    )
  }

  return (
    <MatchesListTable
      matches={matches}
      showToolbar={showToolbar}
      showPagination={showPagination}
      filters={filters}
    />
  )
}

function MatchesListEmpty({
  listEmpty,
  clearAllFilters,
}: {
  listEmpty: MatchesListFilters['listEmpty']
  clearAllFilters: () => void
}) {
  if (listEmpty.branch === 'first-run') {
    return (
      <PmEmptyState
        title={listEmpty.config.title ?? 'No matches yet'}
        description={listEmpty.config.description}
        action={
          <PmButton size="sm" asChild>
            <Link to="/opportunities">{PRODUCT_LANGUAGE.OPEN_OPPORTUNITIES}</Link>
          </PmButton>
        }
      />
    )
  }

  if (listEmpty.branch === 'filtered') {
    return (
      <PmTableEmpty
        variant="no-results"
        title={listEmpty.config.title}
        description={listEmpty.config.description}
        primaryAction={
          <PmButton size="sm" variant="outline" onClick={clearAllFilters}>
            Clear filters
          </PmButton>
        }
      />
    )
  }

  return (
    <PmTableEmpty
      variant="no-results"
      title="No matches found"
      description="Matches appear when opportunities are published and the matching engine runs."
    />
  )
}

function MatchesListCardGrid({
  showToolbar = true,
  showPagination = true,
  filters,
  shortenTitles = false,
}: {
  showToolbar?: boolean
  showPagination?: boolean
  filters: MatchesListFilters
  shortenTitles?: boolean
}) {
  const {
    search,
    setSearch,
    status,
    setStatus,
    matchType,
    setMatchType,
    mainModel,
    setMainModel,
    exchangeMode,
    setExchangeMode,
    paged,
    totalItems,
    safePage,
    pageSize,
    setPage,
    setPageSize,
    listEmpty,
    activeFilterChips,
    clearAllFilters,
    compact: isCompact,
  } = filters

  return (
    <div data-slot="matches-list-cards" className="min-w-0 space-y-4">
      {showToolbar ? (
        <MatchesBrowseToolbar
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          matchType={matchType}
          setMatchType={setMatchType}
          mainModel={mainModel}
          setMainModel={setMainModel}
          exchangeMode={exchangeMode}
          setExchangeMode={setExchangeMode}
          activeFilterChips={activeFilterChips}
          clearAllFilters={clearAllFilters}
        />
      ) : null}
      {paged.length === 0 ? (
        <MatchesListEmpty listEmpty={listEmpty} clearAllFilters={clearAllFilters} />
      ) : (
        <>
          <div className="space-y-3 sm:hidden" role="list" aria-label="Matches">
            {paged.map((match) => (
              <div key={match.id} role="listitem">
                <MatchCard match={match} shortenTitles={shortenTitles} />
              </div>
            ))}
          </div>
          <div
            className="hidden gap-4 sm:grid md:grid-cols-2 xl:grid-cols-3"
            role="list"
            aria-label="Matches"
          >
            {paged.map((match) => (
              <div key={match.id} role="listitem" className="min-w-0">
                <MatchCard match={match} shortenTitles={shortenTitles} />
              </div>
            ))}
          </div>
        </>
      )}
      {showPagination && totalItems > 0 ? (
        <PmTablePagination
          page={safePage}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={isCompact ? [8, 16] : [12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  )
}

function MatchesListTable({
  matches: _matches,
  showToolbar = true,
  showPagination = true,
  filters,
}: {
  matches: readonly PostMatch[]
  showToolbar?: boolean
  showPagination?: boolean
  filters: MatchesListFilters
}) {
  const navigate = useNavigate()
  const {
    search,
    setSearch,
    status,
    setStatus,
    matchType,
    setMatchType,
    mainModel,
    setMainModel,
    exchangeMode,
    setExchangeMode,
    paged,
    totalItems,
    safePage,
    pageSize,
    setPage,
    setPageSize,
    listEmpty,
    activeFilterChips,
    clearAllFilters,
    compact: isCompact,
  } = filters

  const columns: PmDataTableColumn<PostMatch>[] = [
    {
      id: 'pairing',
      label: 'Match',
      cell: (m) => (
        <Link to={`/matches/${m.id}`} className="font-medium hover:text-primary">
          {formatMatchDisplayTitle(m, (id) => opportunitiesApi.get(id))}
        </Link>
      ),
    },
    {
      id: 'score',
      label: 'Score',
      cell: (m) => (
        <PmMatchScoreBadge
          score={m.matchScore}
          variant="list"
          breakdown={m.payload?.breakdown ?? m.matchCriteria}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (m) => <PmWorkflowBadge status={m.status} entity="match" />,
    },
    {
      id: 'typeBadge',
      label: 'Type',
      hideable: true,
      defaultVisible: true,
      cell: (m) => (
        <div className="flex flex-col items-start gap-0.5">
          <MatchTypeChip matchType={m.matchType} />
          <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {formatFrameworkMatchTypeSubtitle(m.matchType)}
          </span>
        </div>
      ),
    },
    {
      id: 'created',
      label: 'Created',
      cell: (m) => formatDate(m.createdAt),
    },
  ]

  return (
    <PmDataTable
      density={isCompact ? 'compact' : 'comfortable'}
      columns={columns}
      data={paged}
      getRowId={(m) => m.id}
      caption="Matches"
      toolbar={
        showToolbar ? (
          <MatchesBrowseToolbar
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            matchType={matchType}
            setMatchType={setMatchType}
            mainModel={mainModel}
            setMainModel={setMainModel}
            exchangeMode={exchangeMode}
            setExchangeMode={setExchangeMode}
            activeFilterChips={activeFilterChips}
            clearAllFilters={clearAllFilters}
          />
        ) : undefined
      }
      rowActions={(m) => (
        <PmTableRowActions
          onView={() => navigate(`/matches/${m.id}`)}
          hiddenActions={['edit', 'delete', 'duplicate']}
        />
      )}
      empty={<MatchesListEmpty listEmpty={listEmpty} clearAllFilters={clearAllFilters} />}
      pagination={
        showPagination && totalItems > 0 ? (
          <PmTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={totalItems}
            pageSizeOptions={isCompact ? [8, 16] : [12, 24, 48]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : undefined
      }
      renderMobileCard={(m) => <MatchCard match={m} />}
    />
  )
}
