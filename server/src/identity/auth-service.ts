import { prisma } from '../infrastructure/prisma.js'
import { verifyPassword } from '../infrastructure/password.js'

export type AccountType = 'auto' | 'individual' | 'company'

export type PublicAccount = {
  readonly id: string
  readonly email: string
  readonly role: string
  readonly status: string
  readonly accountType: 'user' | 'company'
  readonly profile: unknown
}

export type AuthenticatedAccount = PublicAccount & {
  readonly passwordHash: string
}

function toPublic(account: AuthenticatedAccount): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    accountType: account.accountType,
    profile: account.profile,
  }
}

async function findUserByEmail(email: string): Promise<AuthenticatedAccount | null> {
  const row = await prisma.user.findUnique({ where: { email } })
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    accountType: 'user',
    profile: row.profile,
    passwordHash: row.passwordHash,
  }
}

async function findCompanyByEmail(email: string): Promise<AuthenticatedAccount | null> {
  const row = await prisma.company.findUnique({ where: { email } })
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    accountType: 'company',
    profile: row.profile,
    passwordHash: row.passwordHash,
  }
}

export async function findAccountById(
  id: string,
  accountType: 'user' | 'company',
): Promise<PublicAccount | null> {
  if (accountType === 'company') {
    const row = await prisma.company.findUnique({ where: { id } })
    if (!row) return null
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      accountType: 'company',
      profile: row.profile,
    }
  }
  const row = await prisma.user.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    accountType: 'user',
    profile: row.profile,
  }
}

export async function authenticateAccount(
  email: string,
  password: string,
  accountType: AccountType = 'auto',
): Promise<PublicAccount> {
  const normalized = email.trim().toLowerCase()
  let account: AuthenticatedAccount | null = null

  if (accountType === 'company') {
    account = await findCompanyByEmail(normalized)
  } else if (accountType === 'individual') {
    account = await findUserByEmail(normalized)
  } else {
    account = (await findUserByEmail(normalized)) ?? (await findCompanyByEmail(normalized))
  }

  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    throw new AuthError('Invalid email or password', 401)
  }
  if (account.status === 'rejected') {
    throw new AuthError('Account registration was rejected. Please contact support.', 403)
  }
  if (account.status === 'suspended') {
    throw new AuthError('Account suspended. Please contact support.', 403)
  }

  return toPublic(account)
}

export class AuthError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}
