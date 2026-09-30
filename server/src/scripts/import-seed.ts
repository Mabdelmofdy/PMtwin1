import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Prisma } from '@prisma/client'
import { prisma } from '../infrastructure/prisma.js'
import { hashLegacyOrPlain } from '../infrastructure/password.js'

type Envelope<T> = { data?: T[] }
type SeedRecord = Record<string, unknown> & { id: string }

const HERE = path.dirname(fileURLToPath(import.meta.url))

function resolveSeedDir(): string {
  if (process.env.SEED_DATA_DIR) {
    return path.resolve(process.env.SEED_DATA_DIR)
  }
  return path.resolve(HERE, '../../../POC/data')
}

async function readEnvelope<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(resolveSeedDir(), fileName)
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as Envelope<T>
  return parsed.data ?? []
}

function mergeById<T extends { id: string }>(...sets: T[][]): T[] {
  const map = new Map<string, T>()
  for (const set of sets) {
    for (const item of set) map.set(item.id, item)
  }
  return Array.from(map.values())
}

function asDate(value: unknown, fallback = new Date()): Date {
  if (typeof value === 'string' || value instanceof Date) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  return fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue
}

async function importAccounts(
  kind: 'user' | 'company',
  records: SeedRecord[],
): Promise<number> {
  let count = 0
  for (const record of records) {
    const email = asString(record.email).trim().toLowerCase()
    if (!email || !record.id) continue
    const passwordHash = await hashLegacyOrPlain(asString(record.passwordHash, 'invalid'))
    const now = new Date()
    const data = {
      id: record.id,
      email,
      passwordHash,
      role: asString(record.role, kind === 'company' ? 'company_owner' : 'professional'),
      status: asString(record.status, 'active'),
      isPublic: asBoolean(record.isPublic, false),
      profile: asJson(record.profile),
      payload: asJson(record),
      createdAt: asDate(record.createdAt, now),
      updatedAt: asDate(record.updatedAt, now),
    }
    if (kind === 'user') {
      await prisma.user.upsert({ where: { id: record.id }, create: data, update: data })
    } else {
      await prisma.company.upsert({ where: { id: record.id }, create: data, update: data })
    }
    count += 1
  }
  return count
}

async function importOpportunities(records: SeedRecord[]): Promise<number> {
  let count = 0
  for (const record of records) {
    const now = new Date()
    const data = {
      id: record.id,
      title: asString(record.title, record.id),
      description: asString(record.description),
      creatorId: asString(record.creatorId),
      ownerPartyId: asString(record.ownerPartyId) || null,
      workspaceId: asString(record.workspaceId) || null,
      createdByUserId: asString(record.createdByUserId) || null,
      intent: asString(record.intent) || null,
      status: asString(record.status, 'draft'),
      modelType: asString(record.modelType) || null,
      payload: asJson(record),
      createdAt: asDate(record.createdAt, now),
      updatedAt: asDate(record.updatedAt, now),
    }
    await prisma.opportunity.upsert({ where: { id: record.id }, create: data, update: data })
    count += 1
  }
  return count
}

async function importSimple(
  records: SeedRecord[],
  upsert: (record: SeedRecord) => Promise<void>,
): Promise<number> {
  let count = 0
  for (const record of records) {
    await upsert(record)
    count += 1
  }
  return count
}

export async function importSeed(): Promise<Record<string, number>> {
  if (process.env.SEED_MODE !== 'local') {
    throw new Error('Seed import is local-only. Set SEED_MODE=local. Demo passwords must not load in production.')
  }

  const users = mergeById(
    await readEnvelope<SeedRecord>('users.json'),
    await readEnvelope<SeedRecord>('seed-controlled-users.json'),
    await readEnvelope<SeedRecord>('demo-employees.json'),
    await readEnvelope<SeedRecord>('demo-pending-users.json'),
  )
  const companies = mergeById(
    await readEnvelope<SeedRecord>('companies.json'),
    await readEnvelope<SeedRecord>('demo-companies.json'),
  )
  const opportunities = mergeById(
    await readEnvelope<SeedRecord>('opportunities.json'),
    await readEnvelope<SeedRecord>('demo-40-opportunities.json'),
    await readEnvelope<SeedRecord>('demo-cast-coverage-opportunities.json'),
  )
  const applications = await readEnvelope<SeedRecord>('demo-applications.json')
  const postMatches = mergeById(
    await readEnvelope<SeedRecord>('demo-post-matches.json'),
    await readEnvelope<SeedRecord>('demo-cast-coverage-matches.json'),
  )
  const negotiations = await readEnvelope<SeedRecord>('demo-negotiations.json')
  const deals = await readEnvelope<SeedRecord>('demo-deals.json')
  const contracts = await readEnvelope<SeedRecord>('demo-contracts.json')
  const notifications = await readEnvelope<SeedRecord>('demo-notifications.json')
  const audit = await readEnvelope<SeedRecord>('demo-audit.json')

  const counts = {
    users: await importAccounts('user', users),
    companies: await importAccounts('company', companies),
    opportunities: await importOpportunities(opportunities),
    applications: await importSimple(applications, async (record) => {
      const now = new Date()
      const data = {
        id: record.id,
        opportunityId: asString(record.opportunityId),
        applicantId: asString(record.applicantId),
        status: asString(record.status, 'submitted'),
        payload: asJson(record),
        createdAt: asDate(record.createdAt, now),
        updatedAt: asDate(record.updatedAt, now),
      }
      await prisma.application.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    postMatches: await importSimple(postMatches, async (record) => {
      const now = new Date()
      const data = {
        id: record.id,
        matchType: asString(record.matchType, 'one_way'),
        status: asString(record.status, 'discovered'),
        matchScore: asNumber(record.matchScore),
        payload: asJson(record),
        createdAt: asDate(record.createdAt, now),
        updatedAt: asDate(record.updatedAt, now),
      }
      await prisma.postMatch.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    negotiations: await importSimple(negotiations, async (record) => {
      const now = new Date()
      const data = {
        id: record.id,
        status: asString(record.status, 'active'),
        payload: asJson(record),
        createdAt: asDate(record.createdAt, now),
        updatedAt: asDate(record.updatedAt, now),
      }
      await prisma.negotiation.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    deals: await importSimple(deals, async (record) => {
      const now = new Date()
      const data = {
        id: record.id,
        status: asString(record.status, 'draft'),
        payload: asJson(record),
        createdAt: asDate(record.createdAt, now),
        updatedAt: asDate(record.updatedAt, now),
      }
      await prisma.deal.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    contracts: await importSimple(contracts, async (record) => {
      const now = new Date()
      const data = {
        id: record.id,
        dealId: asString(record.dealId) || null,
        status: asString(record.status, 'draft'),
        payload: asJson(record),
        createdAt: asDate(record.createdAt, now),
        updatedAt: asDate(record.updatedAt, now),
      }
      await prisma.contract.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    notifications: await importSimple(notifications, async (record) => {
      const data = {
        id: record.id,
        userId: asString(record.userId),
        type: asString(record.type, 'info'),
        title: asString(record.title, 'Notification'),
        message: asString(record.message),
        read: asBoolean(record.read, false),
        payload: asJson(record),
        createdAt: asDate(record.createdAt),
      }
      await prisma.notification.upsert({ where: { id: record.id }, create: data, update: data })
    }),
    audit: await importSimple(audit, async (record) => {
      const data = {
        id: record.id,
        userId: asString(record.userId) || null,
        action: asString(record.action, 'unknown'),
        entityType: asString(record.entityType, 'unknown'),
        entityId: asString(record.entityId) || null,
        timestamp: asDate(record.timestamp ?? record.createdAt),
        details: asJson(record.details ?? record),
      }
      await prisma.auditLog.upsert({ where: { id: record.id }, create: data, update: data })
    }),
  }

  return counts
}

function isExecutedDirectly(): boolean {
  const argv = process.argv[1]
  if (!argv) return false
  return path.normalize(fileURLToPath(import.meta.url)) === path.normalize(path.resolve(argv))
}

if (isExecutedDirectly()) {
  importSeed()
    .then((counts) => {
      console.log('Seed import complete', counts)
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
