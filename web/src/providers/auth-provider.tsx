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
import { peopleApi } from '@/api/people.ts'
import {
  registerAccount,
  type RegistrationInput,
  type RegistrationResult,
  type RegistrationSuccess,
} from '@/lib/registration-service.ts'
import { setCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

export type RegistrationCompletion = {
  partyType: RegistrationSuccess['partyType']
  isCompany: boolean
}

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
  registerAndSignIn: (input: RegistrationInput) => Promise<RegistrationResult>
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

  useEffect(() => {
    if (user) {
      setCommandPermissionActor({ userId: user.id, userRole: user.role })
    } else {
      setCommandPermissionActor(null)
    }
  }, [user])

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

  const registerAndSignIn = useCallback(async (input: RegistrationInput) => {
    const result = await registerAccount(input)
    if (!result.ok) {
      return result
    }

    const registeredUser = peopleApi.get(result.userId)
    if (!registeredUser) {
      return {
        ok: false as const,
        code: 'REQUEST_FAILED' as const,
        message: 'Registration completed but the account could not be loaded.',
      }
    }

    authService.createSessionForUser(registeredUser, {
      activePartyId: result.partyId,
      activeMembershipId: result.membershipId,
      partyType: result.partyType,
    })
    setUser(registeredUser)
    return result
  }, [])

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
      registerAndSignIn,
      signOut,
    }),
    [user, isLoading, login, registerAndSignIn, signOut],
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
