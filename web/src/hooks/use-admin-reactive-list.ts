import { useMemo } from 'react'
import { useDataStoreVersion } from '@/hooks/use-data-store'

/** Re-fetch list data when seed overrides or commands update the data store. */
export function useAdminReactiveList<T>(loader: () => readonly T[]): readonly T[] {
  const version = useDataStoreVersion()
  return useMemo(loader, [version])
}
