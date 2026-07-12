import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import {
  PmDataTable,
  PmTableBulkActions,
  PmTableColumnToggle,
  PmTableEmpty,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  buildDefaultColumnVisibility,
  clearSelection,
  createSelectionState,
  countSelected,
  normalizeTableDensity,
  pmTableDensityLabels,
  pmTableDensityOptions,
  resolveListEmptyState,
  resolveVisibleColumns,
  type PmDataTableColumn,
  type PmTableColumnVisibility,
  type PmTableDensity,
  type PmTableSelectionState,
  type PmTableSortDirection,
} from '@/components/data/pm-data-index'
import { AdminSavedViews, type AdminSavedView } from '@/components/admin/workspace/admin-saved-views.tsx'
import {
  PmPageHeader,
  PmPageHeroMetric,
  PmPage,
  PmButton,
  PmEmptyState,
} from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export type AdminListRowAction<T> = {
  readonly id: string
  readonly label: string
  readonly onSelect: (row: T) => void
}

export type AdminListPageProps<T> = {
  label?: string
  title: string
  description: string
  columns: PmDataTableColumn<T>[]
  data: readonly T[]
  getRowId: (row: T) => string
  getSearchText?: (row: T) => string
  getRowHref?: (row: T) => string | undefined
  getSortValue?: (row: T, columnId: string) => string | number | null | undefined
  searchPlaceholder?: string
  showPagination?: boolean
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  toolbarExtra?: ReactNode
  headerActions?: ReactNode
  showExport?: boolean
  metricLabel?: string
  /** Enable multi-select + bulk bar */
  enableSelection?: boolean
  bulkActions?: ReactNode | ((selectedIds: readonly string[], rows: readonly T[]) => ReactNode)
  /** Extra contextual row menu actions */
  getRowActions?: (row: T) => readonly AdminListRowAction<T>[]
  savedViews?: readonly AdminSavedView[]
  storageKey?: string
  onRefresh?: () => void
  stickyHeader?: boolean
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function exportRowsAsCsv<T>(
  rows: readonly T[],
  columns: readonly PmDataTableColumn<T>[],
  filename: string,
): void {
  const headers = columns.map((c) => csvEscape(c.label))
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        if (col.exportValue) return csvEscape(col.exportValue(row))
        const raw = col.cell(row)
        if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
          return csvEscape(String(raw))
        }
        return csvEscape('')
      })
      .join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function loadSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

/** Enterprise admin grid scaffold — search, filters, columns, views, sort, density, selection, export. */
export function AdminListPage<T>({
  label,
  title,
  description,
  columns,
  data,
  getRowId,
  getSearchText,
  getRowHref,
  getSortValue,
  searchPlaceholder = 'Search…',
  showPagination = true,
  pageSize: defaultPageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display in this queue.',
  toolbarExtra,
  headerActions,
  showExport = true,
  metricLabel = 'In queue',
  enableSelection = true,
  bulkActions,
  getRowActions,
  savedViews,
  storageKey,
  onRefresh,
  stickyHeader = true,
}: AdminListPageProps<T>) {
  const navigate = useNavigate()
  const prefsKey = storageKey ? `pmtwin.admin.grid.${storageKey}` : undefined

  const columnMeta = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        label: c.label,
        hideable: c.hideable !== false,
        defaultVisible: c.defaultVisible !== false,
      })),
    [columns],
  )

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [density, setDensity] = useState<PmTableDensity>(() =>
    prefsKey
      ? normalizeTableDensity(loadSessionJson(prefsKey, { density: 'compact' }).density, 'compact')
      : 'compact',
  )
  const [columnVisibility, setColumnVisibility] = useState<PmTableColumnVisibility>(() => {
    const defaults = buildDefaultColumnVisibility(columnMeta)
    if (!prefsKey) return defaults
    return loadSessionJson(prefsKey, { visibility: defaults }).visibility ?? defaults
  })
  const [sortColumnId, setSortColumnId] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<PmTableSortDirection>('asc')
  const [selection, setSelection] = useState<PmTableSelectionState>(() =>
    createSelectionState('multiple'),
  )
  const [activeViewId, setActiveViewId] = useState(
    savedViews?.[0]?.id ?? 'all',
  )
  const [refreshNonce, setRefreshNonce] = useState(0)

  const persistPrefs = useCallback(
    (next: { density?: PmTableDensity; visibility?: PmTableColumnVisibility }) => {
      if (!prefsKey) return
      const current = loadSessionJson(prefsKey, {
        density: 'compact' as PmTableDensity,
        visibility: columnVisibility,
      })
      saveSessionJson(prefsKey, { ...current, ...next })
    },
    [prefsKey, columnVisibility],
  )

  const filtered = useMemo(() => {
    void refreshNonce
    let rows = [...data]
    if (search.trim() && getSearchText) {
      const q = search.toLowerCase()
      rows = rows.filter((row) => getSearchText(row).toLowerCase().includes(q))
    }
    if (sortColumnId) {
      rows.sort((a, b) => {
        const av =
          getSortValue?.(a, sortColumnId) ??
          String((a as Record<string, unknown>)[sortColumnId] ?? '')
        const bv =
          getSortValue?.(b, sortColumnId) ??
          String((b as Record<string, unknown>)[sortColumnId] ?? '')
        const cmp = av === bv ? 0 : av == null ? -1 : bv == null ? 1 : av < bv ? -1 : 1
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, getSearchText, sortColumnId, sortDirection, getSortValue, refreshNonce])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = showPagination
    ? filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filtered

  const hasActiveSearch = Boolean(search.trim())
  const listEmpty = resolveListEmptyState({
    hasSourceData: data.length > 0,
    hasActiveFilters: hasActiveSearch,
    firstRun: {
      title: emptyTitle,
      description: emptyDescription,
    },
    filtered: {
      title: 'No results match your search',
      description: 'Try a different search term.',
    },
  })

  const visibleColumnDefs = useMemo(
    () =>
      resolveVisibleColumns(
        columns.map((c) => ({ ...c, hideable: c.hideable !== false })),
        columnVisibility,
      ),
    [columns, columnVisibility],
  )

  const tableColumns = useMemo(() => {
    const base = visibleColumnDefs.map((col) => ({
      ...col,
      sortable: col.sortable !== false,
    }))
    if (!getRowHref) return base
    const [first, ...rest] = base
    if (!first) return base
    return [
      {
        ...first,
        cell: (row: T) => {
          const href = getRowHref(row)
          const content = first.cell(row)
          return href ? (
            <Link to={href} className="font-medium hover:text-primary">
              {content}
            </Link>
          ) : (
            content
          )
        },
      },
      ...rest,
    ] satisfies PmDataTableColumn<T>[]
  }, [visibleColumnDefs, getRowHref])

  const selectedCount = countSelected(selection)
  const selectedRows = useMemo(() => {
    return filtered.filter((row) => selection.selectedIds.has(getRowId(row)))
  }, [filtered, selection, getRowId])

  /** Only show saved views when the page provides real views — hide stub All/Dense. */
  const viewsToShow = savedViews && savedViews.length > 0 ? savedViews : null

  function handleViewSelect(id: string): void {
    setActiveViewId(id)
    const view = viewsToShow?.find((v) => v.id === id)
    if (view?.density) {
      setDensity(normalizeTableDensity(view.density, 'compact'))
      persistPrefs({ density: normalizeTableDensity(view.density, 'compact') })
    }
  }

  function handleRefresh(): void {
    setRefreshNonce((n) => n + 1)
    onRefresh?.()
  }

  const resolvedBulk =
    typeof bulkActions === 'function'
      ? bulkActions(
          selectedRows.map((r) => getRowId(r)),
          selectedRows,
        )
      : bulkActions

  return (
    <PmPage
      header={
        <PmPageHeader
          label={label}
          title={title}
          description={description}
          metric={<PmPageHeroMetric value={data.length} label={metricLabel} />}
          actions={headerActions}
        />
      }
    >
      <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {viewsToShow ? (
          <AdminSavedViews
            views={viewsToShow}
            activeId={activeViewId}
            onSelect={handleViewSelect}
          />
        ) : null}
      </div>

      <PmDataTable
        density={density}
        stickyHeader={stickyHeader}
        columns={tableColumns}
        data={paged}
        getRowId={getRowId}
        caption={title}
        selectionMode={enableSelection ? 'multiple' : 'none'}
        selection={enableSelection ? selection : undefined}
        onSelectionChange={enableSelection ? setSelection : undefined}
        columnVisibility={columnVisibility}
        sortColumnId={sortColumnId}
        sortDirection={sortDirection}
        onSortChange={(columnId, direction) => {
          setSortColumnId(columnId)
          setSortDirection(direction)
          setPage(1)
        }}
        toolbar={
          <PmToolbarSurface className="sticky top-12 z-[9]">
            <PmTableToolbar
              search={
                getSearchText ? (
                  <PmTableSearch
                    placeholder={searchPlaceholder}
                    value={search}
                    onValueChange={(v) => {
                      setSearch(v)
                      setPage(1)
                    }}
                  />
                ) : undefined
              }
              filters={toolbarExtra}
              showExport={showExport}
              onExport={() =>
                exportRowsAsCsv(
                  filtered,
                  visibleColumnDefs,
                  `${title.toLowerCase().replace(/\s+/g, '-')}.csv`,
                )
              }
              columnToggle={
                <PmTableColumnToggle
                  columns={columnMeta}
                  visibility={columnVisibility}
                  onVisibilityChange={(visibility) => {
                    setColumnVisibility(visibility)
                    persistPrefs({ visibility })
                  }}
                />
              }
              selectedCount={enableSelection ? selectedCount : 0}
              onClearSelection={
                enableSelection
                  ? () => setSelection(clearSelection(selection))
                  : undefined
              }
              bulkActions={
                enableSelection && selectedCount > 0 ? (
                  resolvedBulk ?? (
                    <PmButton
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportRowsAsCsv(
                          selectedRows,
                          visibleColumnDefs,
                          `${title.toLowerCase().replace(/\s+/g, '-')}-selected.csv`,
                        )
                      }
                    >
                      Export selected
                    </PmButton>
                  )
                ) : undefined
              }
              trailing={
                <>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    Density
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      value={density}
                      onChange={(e) => {
                        const next = normalizeTableDensity(e.target.value, 'compact')
                        setDensity(next)
                        persistPrefs({ density: next })
                      }}
                      aria-label="Table density"
                    >
                      {pmTableDensityOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {pmTableDensityLabels[opt]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <PmButton
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleRefresh}
                    aria-label="Refresh"
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                    Refresh
                  </PmButton>
                </>
              }
            />
          </PmToolbarSurface>
        }
        bulkActions={
          enableSelection && selectedCount > 0 ? (
            <PmTableBulkActions
              selectedCount={selectedCount}
              onClearSelection={() => setSelection(clearSelection(selection))}
            >
              {resolvedBulk ?? (
                <span className="text-sm text-muted-foreground">
                  Bulk export available in toolbar
                </span>
              )}
            </PmTableBulkActions>
          ) : undefined
        }
        rowActions={(row) => {
          const href = getRowHref?.(row)
          const extras = getRowActions?.(row) ?? []
          if (!href && extras.length === 0) return null
          return (
            <PmTableRowActions
              onView={href ? () => navigate(href) : undefined}
              hiddenActions={['edit', 'delete', 'duplicate']}
            >
              {extras.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onSelect={() => action.onSelect(row)}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </PmTableRowActions>
          )
        }}
        empty={
          listEmpty.branch === 'filtered' ? (
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
                    setPage(1)
                  }}
                >
                  Clear search
                </PmButton>
              }
            />
          ) : listEmpty.branch === 'first-run' ? (
            <PmEmptyState
              title={listEmpty.config.title ?? emptyTitle}
              description={listEmpty.config.description ?? emptyDescription}
              size="compact"
            />
          ) : (
            <PmTableEmpty
              variant="no-data"
              title={emptyTitle}
              description={emptyDescription}
            />
          )
        }
        pagination={
          showPagination && totalItems > 0 ? (
            <PmTablePagination
              page={safePage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          ) : undefined
        }
      />
    </PmPage>
  )
}
