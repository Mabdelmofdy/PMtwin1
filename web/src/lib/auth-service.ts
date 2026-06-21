import type { PlatformUser } from '@/types/domain.ts'
import type { AuthSession, AccountType } from '@/types/domain.ts'
import { peopleApi } from '@/api/people.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { sessionStorageAdapter } from '@/infrastructure/storage/session-storage-adapter.ts'

const SESSION_KEY = 'pmtwin_web_session'

export type { AccountType, AuthSession }

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

export const authService = {
  encodePassword,

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

    const session: AuthSession = {
      token: generateToken(),
      userId: user.id,
      rememberMe: !!options.rememberMe,
    }
    writeSession(session)
    return user
  },

  logout() {
    writeSession(null)
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
    return user
  },

  isCompanyUser(user: PlatformUser) {
    return user.profile?.type === 'company'
  },

  canAccessAdmin(user: PlatformUser) {
    return ['admin', 'moderator', 'auditor'].includes(user.role)
  },

  isPendingApproval(user: PlatformUser) {
    return user.status === 'pending'
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
