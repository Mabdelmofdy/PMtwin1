/**
 * Backfill canonical ownership fields on Opportunity seed JSON.
 * Run from repo root: node POC/scripts/backfill-opportunity-canonical-ownership.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  resolveLegacyOpportunityOwnership,
  SYSTEM_MIGRATION_USER_ID,
} from '../../packages/identity/dist/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

function rows(envelope) {
  return envelope.data ?? []
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, relativePath), 'utf8'))
}

function collectAccountIds() {
  const users = [
    ...rows(loadJson('users.json')),
    ...rows(loadJson('seed-controlled-users.json')),
    ...rows(loadJson('demo-users.json')),
  ]
  const companies = [
    ...rows(loadJson('companies.json')),
    ...rows(loadJson('demo-companies.json')),
  ]
  return {
    userIds: new Set(users.map((user) => user.id)),
    companyIds: new Set(companies.map((company) => company.id)),
  }
}

function backfillOpportunity(opportunity, ctx, audit) {
  const legacy = resolveLegacyOpportunityOwnership({
    creatorId: opportunity.creatorId,
    ownerPartyId: opportunity.ownerPartyId,
    companyIds: ctx.companyIds,
    userIds: ctx.userIds,
  })

  const next = { ...opportunity }
  if (legacy.workspaceId) next.workspaceId = legacy.workspaceId
  if (legacy.ownerPartyId) next.ownerPartyId = legacy.ownerPartyId

  if (legacy.createdByUserId) {
    next.createdByUserId = legacy.createdByUserId
    next.createdByActorType = 'marketplace_user'
  } else if (legacy.unresolvedActor && opportunity.creatorId) {
    next.createdByUserId = SYSTEM_MIGRATION_USER_ID
    next.createdByActorType = 'system'
    audit.push({
      opportunityId: opportunity.id,
      reason: 'migration.actor_unresolved',
      creatorId: opportunity.creatorId,
    })
  }

  return next
}

function backfillFile(fileName, ctx) {
  const filePath = path.join(DATA_DIR, fileName)
  const envelope = loadJson(fileName)
  const audit = []
  envelope.data = (envelope.data ?? []).map((opportunity) =>
    backfillOpportunity(opportunity, ctx, audit),
  )
  if (audit.length > 0) {
    const auditPath = path.join(DATA_DIR, `${fileName.replace('.json', '')}-ownership-audit.json`)
    fs.writeFileSync(
      auditPath,
      JSON.stringify({ domain: 'migration', evidence: audit }, null, 2),
      'utf8',
    )
    console.log(`Wrote ${audit.length} unresolved actor records to ${path.basename(auditPath)}`)
  }
  fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf8')
  console.log(`Updated ${fileName}: ${envelope.data.length} opportunities`)
}

const ctx = collectAccountIds()
for (const fileName of ['opportunities.json', 'demo-40-opportunities.json']) {
  const filePath = path.join(DATA_DIR, fileName)
  if (!fs.existsSync(filePath)) continue
  backfillFile(fileName, ctx)
}
