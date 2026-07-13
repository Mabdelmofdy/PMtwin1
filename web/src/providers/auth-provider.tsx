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
import type { AuthSession } from '@/types/domain.ts'
import {
  buildWorkflowActorContext,
  resolveLegacyRoleToPlatformRoles,
  type BusinessWorkspace,
  type MarketplaceParty,
  type PlatformRole,
  type WorkspaceMembership,
} from '@pm-twin/identity'
import { authService, type AccountType } from '@/lib/auth-service'
import { peopleApi } from '@/api/people.ts'
import {
  registerAccount,
  type RegistrationInput,
  type RegistrationResult,
  type RegistrationSuccess,
} from '@/lib/registration-service.ts'
import { setCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { canMutateAsVettedUser } from '@/domain/rbac/vetting-mutation-guard.ts'
import { partiesApi } from '@/api/parties.ts'
import {
  identityProjectionService,
  workspaceMembershipRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import { invalidateWorkspaceCache } from '@/domain/identity/workspace-cache.ts'

export type RegistrationCompletion = {
  partyType: RegistrationSuccess['partyType']
  isCompany: boolean
}

type AuthContextValue = {
  user: PlatformUser | null
  activeWorkspace: BusinessWorkspace | null
  activeParty: MarketplaceParty | null
  memberships: readonly WorkspaceMembership[]
  platformRoles: readonly PlatformRole[]
  platformContextActive: boolean
  isAuthenticated: boolean
  isLoading: boolean
  isCompanyUser: boolean
  canAccessAdmin: boolean
  isPendingApproval: boolean
  isVettingRestricted: boolean
  canMutate: boolean
  login: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean; accountType?: AccountType },
  ) => Promise<void>
  registerAndSignIn: (input: RegistrationInput) => Promise<RegistrationResult>
  switchWorkspace: (workspaceId: string) => void
  enterPlatformContext: () => void
  exitPlatformContext: () => void
  /** Reload user from store without recreating session (e.g. after vetting approval). */
  refreshUser: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restored = authService.restoreSession()
    setUser(restored)
    setSession(authService.getSession())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      const platformRoles = resolveLegacyRoleToPlatformRoles(user.role)
      const membership = session?.activeWorkspaceId
        ? workspaceMembershipRepository.getActiveMembership(
            user.id,
            session.activeWorkspaceId,
          )
        : undefined
      const platformContextActive = session?.platformContextActive === true
      const workflowActor = buildWorkflowActorContext({
        actorUserId: user.id,
        actorType: platformContextActive
          ? 'platform_operator'
          : 'marketplace_user',
        workspaceId: platformContextActive
          ? undefined
          : session?.activeWorkspaceId,
        partyId: platformContextActive ? undefined : session?.activePartyId,
        workspaceRole: platformContextActive ? undefined : membership?.role,
        platformRoles,
      })
      setCommandPermissionActor({
        userId: user.id,
        userRole: user.role,
        activeWorkspaceId: workflowActor.workspaceId,
        activePartyId: workflowActor.partyId,
        workspaceRole: workflowActor.workspaceRole,
        platformRoles: workflowActor.platformRoles,
        capabilities: workflowActor.capabilities,
        actorType: workflowActor.actorType,
      })
    } else {
      setCommandPermissionActor(null)
    }
  }, [user, session])

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { rememberMe?: boolean; accountType?: AccountType },
    ) => {
      const loggedIn = await authService.login(email, password, options)
      setUser(loggedIn)
      setSession(authService.getSession())
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
      activeWorkspaceId: result.workspaceId,
      activePartyId: result.partyId,
      activeMembershipId: result.membershipId,
      partyType: result.partyType,
    })
    setUser(registeredUser)
    setSession(authService.getSession())
    return result
  }, [])

  const switchWorkspace = useCallback((workspaceId: string) => {
    if (!user) throw new Error('Authenticated session required')
    authService.switchWorkspace(user.id, workspaceId)
    invalidateWorkspaceCache()
    setSession(authService.getSession())
  }, [user])

  const enterPlatformContext = useCallback(() => {
    if (!user) throw new Error('Authenticated session required')
    authService.enterPlatformContext(user)
    invalidateWorkspaceCache()
    setSession(authService.getSession())
  }, [user])

  const exitPlatformContext = useCallback(() => {
    if (!user) throw new Error('Authenticated session required')
    authService.exitPlatformContext(user)
    invalidateWorkspaceCache()
    setSession(authService.getSession())
  }, [user])

  const refreshUser = useCallback(() => {
    if (!user) return
    const latest = peopleApi.get(user.id)
    if (latest) {
      setUser(latest)
      setSession(authService.getSession())
    }
  }, [user])

  const signOut = useCallback(() => {
    authService.logout()
    setUser(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const memberships = user
      ? workspaceMembershipRepository.listMembershipsByUserId(user.id)
      : []
    const activeWorkspace = session?.activeWorkspaceId
      ? workspaceRepository.getById(session.activeWorkspaceId) ?? null
      : null
    const projection = identityProjectionService.build()
    const activeParty = session?.activePartyId
      ? projection.parties.find((party) => party.id === session.activePartyId) ?? null
      : null
    const legacyActiveParty = user ? partiesApi.resolveActiveParty(user.id) : null
    const platformRoles = user
      ? resolveLegacyRoleToPlatformRoles(user.role)
      : []
    return {
      user,
      activeWorkspace,
      activeParty,
      memberships,
      platformRoles,
      platformContextActive: session?.platformContextActive === true,
      isAuthenticated: !!user,
      isLoading,
      isCompanyUser: user ? authService.isCompanyUser(user) : false,
      canAccessAdmin: user ? authService.canAccessAdmin(user) : false,
      isPendingApproval: user ? authService.isPendingApproval(user) : false,
      isVettingRestricted: user ? authService.isVettingRestricted(user) : false,
      canMutate: user ? canMutateAsVettedUser(user, legacyActiveParty) : false,
      login,
      registerAndSignIn,
      switchWorkspace,
      enterPlatformContext,
      exitPlatformContext,
      refreshUser,
      signOut,
    }
  }, [
    user,
    session,
    isLoading,
    login,
    registerAndSignIn,
    switchWorkspace,
    enterPlatformContext,
    exitPlatformContext,
    refreshUser,
    signOut,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
