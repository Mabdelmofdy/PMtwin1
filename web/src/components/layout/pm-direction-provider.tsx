import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import {
  normalizeDocumentDirection,
  PM_DIRECTION_STORAGE_KEY,
  resolveDocumentDirectionAttributes,
  type DocumentDirection,
} from '@/components/layout/pm-direction-bridge'

export type PmDirectionContextValue = {
  direction: DocumentDirection
  setDirection: (direction: DocumentDirection) => void
  isRtl: boolean
}

const PmDirectionContext = createContext<PmDirectionContextValue | null>(null)

function readStoredDirection(): DocumentDirection {
  if (typeof window === 'undefined') return 'ltr'
  return normalizeDocumentDirection(
    localStorageAdapter.get<string>(PM_DIRECTION_STORAGE_KEY),
  )
}

function applyDirectionToDocument(direction: DocumentDirection) {
  const { dir, lang } = resolveDocumentDirectionAttributes(direction)
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lang)
}

export function PmDirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirectionState] = useState<DocumentDirection>(readStoredDirection)

  const setDirection = useCallback((next: DocumentDirection) => {
    setDirectionState(next)
    localStorageAdapter.set(PM_DIRECTION_STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    applyDirectionToDocument(direction)
  }, [direction])

  const value = useMemo(
    () => ({
      direction,
      setDirection,
      isRtl: direction === 'rtl',
    }),
    [direction, setDirection],
  )

  return (
    <PmDirectionContext.Provider value={value}>{children}</PmDirectionContext.Provider>
  )
}

export function usePmDirection(): PmDirectionContextValue {
  const context = useContext(PmDirectionContext)
  if (!context) {
    throw new Error('usePmDirection must be used within PmDirectionProvider')
  }
  return context
}
