import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PmFilterChip } from '@/components/ui/pm-filter-chips'

export type ExecutiveListFilters = {
  search: string
  status: string
  mode: string
  setSearch: (value: string) => void
  setStatus: (value: string) => void
  setMode: (value: string) => void
  chips: PmFilterChip[]
  clearAll: () => void
}

type Labels = {
  statusLabel?: (value: string) => string
  modeLabel?: (value: string) => string
}

export function useExecutiveListFilters(
  keyPrefix: string,
  labels: Labels = {},
): ExecutiveListFilters {
  const [params, setParams] = useSearchParams()
  const searchKey = `${keyPrefix}Search`
  const statusKey = `${keyPrefix}Status`
  const modeKey = `${keyPrefix}Mode`
  const search = params.get(searchKey) ?? ''
  const status = params.get(statusKey) ?? 'all'
  const mode = params.get(modeKey) ?? 'all'

  const update = (key: string, value: string, defaultValue = '') => {
    const next = new URLSearchParams(params)
    if (!value || value === defaultValue) next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  const chips = useMemo<PmFilterChip[]>(() => {
    const items: PmFilterChip[] = []
    if (search) {
      items.push({
        id: `${keyPrefix}-search`,
        label: 'Search',
        value: search,
        onRemove: () => update(searchKey, ''),
      })
    }
    if (status !== 'all') {
      items.push({
        id: `${keyPrefix}-status`,
        label: 'Status',
        value: labels.statusLabel?.(status) ?? status,
        onRemove: () => update(statusKey, 'all', 'all'),
      })
    }
    if (mode !== 'all') {
      items.push({
        id: `${keyPrefix}-mode`,
        label: 'Mode',
        value: labels.modeLabel?.(mode) ?? mode,
        onRemove: () => update(modeKey, 'all', 'all'),
      })
    }
    return items
  }, [keyPrefix, labels, mode, search, status]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    search,
    status,
    mode,
    setSearch: (value) => update(searchKey, value),
    setStatus: (value) => update(statusKey, value, 'all'),
    setMode: (value) => update(modeKey, value, 'all'),
    chips,
    clearAll: () => {
      const next = new URLSearchParams(params)
      next.delete(searchKey)
      next.delete(statusKey)
      next.delete(modeKey)
      setParams(next)
    },
  }
}
