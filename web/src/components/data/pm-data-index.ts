/**
 * PM DataTable system — barrel export.
 * Phase 5A: infrastructure only; no page migrations.
 */

// Core table
export {
  PmDataTable,
  type PmDataTableColumn,
  type PmDataTableProps,
  type PmTableSortDirection,
} from '@/components/data/pm-data-table'

// Toolbar & controls
export {
  PmTableToolbar,
  PmTableToolbarSlot,
  type PmTableToolbarProps,
} from '@/components/data/pm-table-toolbar'
export {
  PmTableSearch,
  PmTableSearchSlot,
  type PmTableSearchProps,
} from '@/components/data/pm-table-search'
export {
  PmTableFilter,
  PmTableFilterSlot,
  type PmTableFilterProps,
} from '@/components/data/pm-table-filter'
export {
  PmTableColumnToggle,
  PmTableColumnToggleSlot,
  type PmTableColumnToggleProps,
} from '@/components/data/pm-table-column-toggle'
export {
  PmTablePagination,
  PmTablePaginationSlot,
  type PmTablePaginationProps,
} from '@/components/data/pm-table-pagination'
export {
  PmTableBulkActions,
  PmTableBulkActionsSlot,
  type PmTableBulkActionsProps,
} from '@/components/data/pm-table-bulk-actions'
export {
  PmTableRowActions,
  PmTableRowActionsSlot,
  type PmTableRowActionsProps,
  type PmTableRowAction,
} from '@/components/data/pm-table-row-actions'

// States
export {
  PmTableEmpty,
  PmTableEmptySlot,
  PmTableEmptySecondaryAction,
  type PmTableEmptyProps,
} from '@/components/data/pm-table-empty'
export {
  PmTableLoading,
  PmTableLoadingSlot,
  type PmTableLoadingProps,
  type PmTableLoadingRowCount,
} from '@/components/data/pm-table-loading'
export {
  PmTableError,
  PmTableErrorSlot,
  type PmTableErrorProps,
} from '@/components/data/pm-table-error'

// Helpers
export {
  type PmTableDensity,
  pmTableDensityOptions,
  pmTableDensityLabels,
  resolveTableDensityClasses,
  resolveTableCellPadding,
  resolveTableSkeletonRowHeight,
  normalizeTableDensity,
} from '@/components/data/pm-table-density'
export {
  type PmTableSelectionMode,
  type PmTableSelectionState,
  type PmTableCheckboxState,
  createSelectionState,
  isRowSelected,
  resolveHeaderCheckboxState,
  toggleRowSelection,
  toggleSelectAll,
  clearSelection,
  countSelected,
  hasSelection,
} from '@/components/data/pm-table-selection'
export {
  type PmTableColumnVisibility,
  type PmTableColumnMeta,
  buildDefaultColumnVisibility,
  resolveVisibleColumns,
  toggleColumnVisibility,
  countVisibleColumns,
  hasVisibleDataColumns,
} from '@/components/data/pm-table-columns'
export {
  type PmTableEmptyVariant,
  type PmTableEmptyConfig,
  type ListEmptyStateBranch,
  type ListEmptyStateInput,
  type ResolvedListEmptyState,
  resolveTableEmptyState,
  resolveListEmptyState,
  shouldShowTableEmpty,
} from '@/components/data/pm-table-empty-helpers'
