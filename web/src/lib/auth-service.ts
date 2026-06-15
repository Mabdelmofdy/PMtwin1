import type { PlatformUser } from '@/lib/data-store'
import { dataStore } from '@/lib/data-store'

const SESSION_KEY = 'pmtwin_web_session'

export type AccountType = 'auto' | 'individual' | 'company'

export type AuthSession = {
  token: string
  userId: string
  rememberMe: boolean
}

function encodePassword(password: string) {
  return btoa(password)
}

function generateToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readSession(): AuthSession | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  if (!session) return
  const target = session.rememberMe ? localStorage : sessionStorage
  target.setItem(SESSION_KEY, JSON.stringify(session))
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
      user = dataStore
        .getCompanies()
        .find((c) => c.email.toLowerCase() === normalized)
    } else if (accountType === 'individual') {
      user = dataStore
        .getUsers()
        .find((u) => u.email.toLowerCase() === normalized)
    } else {
      user =
        dataStore.getUsers().find((u) => u.email.toLowerCase() === normalized) ??
        dataStore.getCompanies().find((c) => c.email.toLowerCase() === normalized)
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
    const user = dataStore.getPersonById(session.userId)
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
