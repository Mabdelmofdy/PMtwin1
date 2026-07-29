import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type { AuthSession, AccountType } from '@/types/domain.ts'
import type { ImplementedPartyType } from '@pm-twin/party'
import {
  recoverActiveBusinessContext,
  resolveLegacyRoleToPlatformRoles,
} from '@pm-twin/identity'
import { peopleApi } from '@/api/people.ts'
import { partiesApi } from '@/api/parties.ts'
import { isVettingRestrictedUser } from '@/domain/rbac/vetting-mutation-guard.ts'
import { formatMembershipId } from '@/repositories/party-membership-repository.ts'
import {
  identityProjectionService,
  workspaceMembershipRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { sessionStorageAdapter } from '@/infrastructure/storage/session-storage-adapter.ts'

const SESSION_KEY = 'pmtwin_web_session'

export type { AccountType, AuthSession }

export type SessionPartyContext = {
  activeWorkspaceId?: string
  /** May be undefined when identity projection has not recovered a party yet. */
  activePartyId?: string
  activeMembershipId: string
  partyType: ImplementedPartyType | string
  platformContextActive?: boolean
}

function encodePassword(password: string) {
  return btoa(password)
}

function generateToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readSession(): AuthSession | null {
  return (
    localStorageAdapter.get<AuthSession>(SESSION_KEY) ??
    sessionStorageAdapter.get<AuthSession>(SESSION_KEY)
  )
}

function writeSession(session: AuthSession | null) {
  sessionStorageAdapter.remove(SESSION_KEY)
  localStorageAdapter.remove(SESSION_KEY)
  if (!session) return
  const target = session.rememberMe ? localStorageAdapter : sessionStorageAdapter
  target.set(SESSION_KEY, session)
}

function resolveSessionPartyContext(
  userId: string,
  preferred: Partial<SessionPartyContext> = {},
): SessionPartyContext {
  const projection = identityProjectionService.build()
  const memberships = workspaceMembershipRepository.listMembershipsByUserId(userId)
  const workspaces = workspaceRepository.getAll()
  const recovered = recoverActiveBusinessContext({
    userId,
    memberships,
    workspaces,
    parties: projection.parties,
    preferredWorkspaceId: preferred.activeWorkspaceId,
    preferredPartyId: preferred.activePartyId || undefined,
  })
  const workspace = recovered.activeWorkspaceId
    ? workspaceRepository.getById(recovered.activeWorkspaceId)
    : undefined
  const membership = recovered.activeWorkspaceId
    ? workspaceMembershipRepository.getActiveMembership(
        userId,
        recovered.activeWorkspaceId,
      )
    : undefined

  if (workspace && membership) {
    return {
      activeWorkspaceId: workspace.id,
      activePartyId: recovered.activePartyId ?? workspace.ownerPartyId,
      activeMembershipId: membership.id,
      partyType: workspace.type === 'company' ? 'company' : 'individual',
      platformContextActive: preferred.platformContextActive,
    }
  }

  const legacyParty = partiesApi.resolveActiveParty(userId)
  const legacyMembership = partiesApi.getPrimaryMembership(userId)

  // Prefer undefined over '' for party/workspace — blank strings persist onto
  // opportunities and block matching participant resolution.
  return {
    activePartyId: legacyParty?.id || undefined,
    activeMembershipId: legacyMembership
      ? formatMembershipId(legacyMembership)
      : '',
    partyType: legacyParty?.partyType ?? (
      resolveLegacyRoleToPlatformRoles(peopleApi.get(userId)?.role).length > 0
        ? 'platform'
        : 'individual'
    ),
    platformContextActive: preferred.platformContextActive,
  }
}

function buildSession(
  user: PlatformUser,
  options: { rememberMe?: boolean } & Partial<SessionPartyContext> = {},
): AuthSession {
  const resolved = resolveSessionPartyContext(user.id)

  return {
    token: generateToken(),
    userId: user.id,
    rememberMe: !!options.rememberMe,
    activeWorkspaceId: options.activeWorkspaceId ?? resolved.activeWorkspaceId,
    activePartyId: options.activePartyId ?? resolved.activePartyId,
    activeMembershipId: options.activeMembershipId ?? resolved.activeMembershipId,
    partyType: options.partyType ?? resolved.partyType,
    platformContextActive: options.platformContextActive ?? false,
  }
}

function migrateLegacySession(session: AuthSession, user: PlatformUser): AuthSession {
  const resolved = resolveSessionPartyContext(user.id, session)
  return {
    ...session,
    activeWorkspaceId: resolved.activeWorkspaceId,
    activePartyId: session.activePartyId ?? resolved.activePartyId,
    activeMembershipId: session.activeMembershipId ?? resolved.activeMembershipId,
    partyType: session.partyType ?? resolved.partyType,
    platformContextActive: session.platformContextActive ?? false,
  }
}

export const authService = {
  encodePassword,

  createSessionForUser(
    user: PlatformUser,
    options: { rememberMe?: boolean } & Partial<SessionPartyContext> = {},
  ): AuthSession {
    const session = buildSession(user, options)
    writeSession(session)
    return session
  },

  async login(
    email: string,
    password: string,
    options: { rememberMe?: boolean; accountType?: AccountType } = {},
  ): Promise<PlatformUser> {
    const normalized = email.trim().toLowerCase()
    const accountType = options.accountType ?? 'auto'
    const passwordHash = encodePassword(password)

    let user: PlatformUser | undefined
    if (accountType === 'company') {
      user = peopleApi
        .listCompanies()
        .find((c) => c.email.toLowerCase() === normalized)
    } else if (accountType === 'individual') {
      user = peopleApi
        .listUsers()
        .find((u) => u.email.toLowerCase() === normalized)
    } else {
      user =
        peopleApi.listUsers().find((u) => u.email.toLowerCase() === normalized) ??
        peopleApi.listCompanies().find((c) => c.email.toLowerCase() === normalized)
    }

    if (!user || user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password')
    }
    if (user.status === 'rejected') {
      throw new Error('Account registration was rejected. Please contact support.')
    }
    if (user.status === 'suspended') {
      throw new Error('Account suspended. Please contact support.')
    }

    this.createSessionForUser(user, { rememberMe: options.rememberMe })
    return user
  },

  logout() {
    writeSession(null)
  },

  switchWorkspace(userId: string, workspaceId: string): SessionPartyContext {
    const session = readSession()
    if (!session || session.userId !== userId) {
      throw new Error('Authenticated session required')
    }
    const membership = workspaceMembershipRepository.getActiveMembership(
      userId,
      workspaceId,
    )
    const workspace = workspaceRepository.getById(workspaceId)
    if (!membership || !workspace || workspace.status !== 'active') {
      throw new Error('Workspace access denied')
    }
    const context: SessionPartyContext = {
      activeWorkspaceId: workspace.id,
      activePartyId: workspace.ownerPartyId,
      activeMembershipId: membership.id,
      partyType: workspace.type === 'company' ? 'company' : 'individual',
      platformContextActive: false,
    }
    writeSession({ ...session, ...context })
    return context
  },

  enterPlatformContext(user: PlatformUser): AuthSession {
    const session = readSession()
    if (!session || session.userId !== user.id) {
      throw new Error('Authenticated session required')
    }
    if (!canAccessAdminForRole(user.role)) {
      throw new Error('Platform access denied')
    }
    const updated = { ...session, platformContextActive: true }
    writeSession(updated)
    return updated
  },

  exitPlatformContext(user: PlatformUser): AuthSession {
    const session = readSession()
    if (!session || session.userId !== user.id) {
      throw new Error('Authenticated session required')
    }
    const updated = { ...session, platformContextActive: false }
    writeSession(updated)
    return updated
  },

  restoreSession(): PlatformUser | null {
    const session = readSession()
    if (!session) return null
    const user = peopleApi.get(session.userId)
    if (!user) {
      writeSession(null)
      return null
    }
    if (user.status === 'rejected' || user.status === 'suspended') {
      writeSession(null)
      return null
    }

    const migrated = migrateLegacySession(session, user)
    if (migrated !== session) {
      writeSession(migrated)
    }

    return user
  },

  isCompanyUser(user: PlatformUser) {
    const session = readSession()
    const activeWorkspace = session?.activeWorkspaceId
      ? workspaceRepository.getById(session.activeWorkspaceId)
      : undefined
    if (activeWorkspace) return activeWorkspace.type === 'company'
    const activeParty = partiesApi.resolveActiveParty(user.id)
    if (activeParty?.partyType === 'company') return true
    return user.profile?.type === 'company'
  },

  canAccessAdmin(user: PlatformUser) {
    return canAccessAdminForRole(user.role)
  },

  isPendingApproval(user: PlatformUser) {
    return (
      user.status === 'pending_vetting' ||
      user.status === 'pending' ||
      user.status === 'clarification_requested'
    )
  },

  isVettingRestricted(user: PlatformUser) {
    return isVettingRestrictedUser(user)
  },

  getSession(): AuthSession | null {
    return readSession()
  },
}

export const DEMO_CREDENTIALS = [
  {
    label: 'Professional — Khalid',
    email: 'khalid.alharbi@pmtwin.test',
    password: 'Pmtwin@2026',
    accountType: 'individual' as const,
  },
  {
    label: 'Company — Al-Riyadh Construction',
    email: 'contact@alriyadh-construction.test',
    password: 'Pmtwin@2026',
    accountType: 'company' as const,
  },
]
