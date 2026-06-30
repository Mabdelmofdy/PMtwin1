import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PmDataTable,
  PmTableEmpty,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmPageLayout } from '@/components/layout/pm-layout-index'
import { PmPageHeader } from '@/components/ui/pm-index'

export type AdminListPageProps<T> = {
  label?: string
  title: string
  description: string
  columns: PmDataTableColumn<T>[]
  data: readonly T[]
  getRowId: (row: T) => string
  getSearchText?: (row: T) => string
  getRowHref?: (row: T) => string | undefined
  searchPlaceholder?: string
  showPagination?: boolean
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  toolbarExtra?: ReactNode
  headerActions?: ReactNode
  showExport?: boolean
}

/** Admin list scaffold — PmPageLayout + PmDataTable with UI-only search. */
export function AdminListPage<T>({
  label,
  title,
  description,
  columns,
  data,
  getRowId,
  getSearchText,
  getRowHref,
  searchPlaceholder = 'Search…',
  showPagination = true,
  pageSize: defaultPageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display in this queue.',
  toolbarExtra,
  headerActions,
  showExport = false,
}: AdminListPageProps<T>) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const filtered = useMemo(() => {
    if (!search.trim() || !getSearchText) return [...data]
    const q = search.toLowerCase()
    return data.filter((row) => getSearchText(row).toLowerCase().includes(q))
  }, [data, search, getSearchText])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = showPagination
    ? filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filtered

  const tableColumns = useMemo(() => {
    if (!getRowHref) return columns
    const [first, ...rest] = columns
    if (!first) return columns
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
  }, [columns, getRowHref])

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label={label}
          title={title}
          description={description}
          actions={headerActions}
        />
      }
    >
      <PmDataTable
        density="compact"
        columns={tableColumns}
        data={paged}
        getRowId={getRowId}
        caption={title}
        toolbar={
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
            showExport={showExport}
          >
            {toolbarExtra}
          </PmTableToolbar>
        }
        rowActions={(row) => {
          const href = getRowHref?.(row)
          if (!href) return null
          return (
            <PmTableRowActions
              onView={() => navigate(href)}
              hiddenActions={['edit', 'delete', 'duplicate']}
            />
          )
        }}
        empty={
          <PmTableEmpty
            variant="no-data"
            title={emptyTitle}
            description={emptyDescription}
          />
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
    </PmPageLayout>
  )
}
