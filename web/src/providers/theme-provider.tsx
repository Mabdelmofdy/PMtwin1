import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LegacyThemePreference, PmThemeDefinition, ThemeId, ThemeMode } from '@/theme/pm-theme-contract'
import {
  resolveDocumentThemeClasses,
  resolveSystemThemeMode,
  themeModeToPreference,
} from '@/theme/pm-theme-provider-bridge'
import { resolveThemeById, resolveThemeIdFromLegacyMode } from '@/theme/pm-theme-utils'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'

/** @deprecated Use LegacyThemePreference — preserved for existing callers. */
export type Theme = LegacyThemePreference

export type ThemeProviderState = {
  /** Legacy preference: light, dark, or system. */
  theme: Theme
  /** Resolved color mode on document root. */
  resolvedTheme: ThemeMode
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  /** Canonical PM theme id (enterprise-light | enterprise-dark). */
  pmThemeId: ThemeId
  /** PM theme registry metadata for resolved theme. */
  pmTheme: PmThemeDefinition
  /** Resolved color mode — alias of resolvedTheme. */
  themeMode: ThemeMode
  /** Set explicit light or dark preference (not system). */
  setThemeMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'pm-twin-theme'

const ThemeProviderContext = createContext<ThemeProviderState | null>(null)

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return resolveSystemThemeMode(
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
}

function applyThemeToDocument(resolved: ThemeMode) {
  const { rootClasses, dataThemeAttribute } = resolveDocumentThemeClasses(resolved)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  for (const cls of rootClasses) {
    root.classList.add(cls)
  }
  if (dataThemeAttribute) {
    root.setAttribute('data-pm-theme', dataThemeAttribute)
  } else {
    root.removeAttribute('data-pm-theme')
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    const stored = localStorageAdapter.get<Theme>(STORAGE_KEY)
    return stored ?? defaultTheme
  })

  const [systemResolved, setSystemResolved] = useState<ThemeMode>(getSystemTheme)

  const resolvedTheme = useMemo(
    () => (theme === 'system' ? systemResolved : theme),
    [theme, systemResolved],
  )

  const pmThemeId = useMemo(
    () => resolveThemeIdFromLegacyMode(resolvedTheme),
    [resolvedTheme],
  )

  const pmTheme = useMemo(() => resolveThemeById(pmThemeId), [pmThemeId])

  const themeMode = resolvedTheme

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorageAdapter.set(STORAGE_KEY, next)
  }, [])

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setTheme(themeModeToPreference(mode))
    },
    [setTheme],
  )

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  useEffect(() => {
    applyThemeToDocument(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = getSystemTheme()
      setSystemResolved(next)
      applyThemeToDocument(next)
    }
    setSystemResolved(getSystemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      pmThemeId,
      pmTheme,
      themeMode,
      setThemeMode,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, pmThemeId, pmTheme, themeMode, setThemeMode],
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
