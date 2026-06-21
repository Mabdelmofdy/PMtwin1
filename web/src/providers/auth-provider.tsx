import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlatformUser } from '@/types/domain.ts'
import { authService, type AccountType } from '@/lib/auth-service'

type AuthContextValue = {
  user: PlatformUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isCompanyUser: boolean
  canAccessAdmin: boolean
  isPendingApproval: boolean
  login: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean; accountType?: AccountType },
  ) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restored = authService.restoreSession()
    setUser(restored)
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { rememberMe?: boolean; accountType?: AccountType },
    ) => {
      const loggedIn = await authService.login(email, password, options)
      setUser(loggedIn)
    },
    [],
  )

  const signOut = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isCompanyUser: user ? authService.isCompanyUser(user) : false,
      canAccessAdmin: user ? authService.canAccessAdmin(user) : false,
      isPendingApproval: user ? authService.isPendingApproval(user) : false,
      login,
      signOut,
    }),
    [user, isLoading, login, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
