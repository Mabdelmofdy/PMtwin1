/**
 * One-shot relationship integrity check (run from web/: node scripts/validate-relationships.mjs)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../../POC/data')

function loadJson(name) {
  const raw = JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
  return raw.data ?? raw
}

const deals = loadJson('demo-deals.json')
const contracts = loadJson('demo-contracts.json')
const applications = loadJson('demo-applications.json')
const notifications = loadJson('demo-notifications.json')
const audit = loadJson('demo-audit.json')
const negotiations = loadJson('demo-negotiations.json')
const postMatches = loadJson('demo-post-matches.json')

const dealIds = new Set(deals.map((d) => d.id))
const contractIds = new Set(contracts.map((c) => c.id))
const negotiationIds = new Set(negotiations.map((n) => n.id))
const matchIds = new Set(postMatches.map((m) => m.id))
const issues = []

let applicationDealRefs = 0
let resolvedDealRefs = 0

for (const app of applications) {
  if (!app.dealId) continue
  applicationDealRefs += 1
  if (dealIds.has(app.dealId)) resolvedDealRefs += 1
  else
    issues.push({
      entity: 'Application',
      field: 'dealId',
      value: app.dealId,
      severity: 'error',
    })
  if (app.negotiationId && !negotiationIds.has(app.negotiationId))
    issues.push({
      entity: 'Application',
      field: 'negotiationId',
      value: app.negotiationId,
      severity: 'error',
    })
  if (app.matchId && !matchIds.has(app.matchId))
    issues.push({
      entity: 'Application',
      field: 'matchId',
      value: app.matchId,
      severity: 'warning',
    })
}

let notificationDealRefs = 0
for (const n of notifications) {
  if (n.entityType === 'deal' && n.entityId) {
    notificationDealRefs += 1
    if (!dealIds.has(n.entityId))
      issues.push({
        entity: 'AppNotification',
        field: 'entityId',
        value: n.entityId,
        severity: 'error',
      })
  }
  if (n.entityType === 'contract' && n.entityId && !contractIds.has(n.entityId))
    issues.push({
      entity: 'AppNotification',
      field: 'entityId',
      value: n.entityId,
      severity: 'error',
    })
  if (n.entityType === 'match' && n.entityId && !matchIds.has(n.entityId))
    issues.push({
      entity: 'AppNotification',
      field: 'entityId',
      value: n.entityId,
      severity: 'warning',
    })
}

let auditDealRefs = 0
for (const entry of audit) {
  if (entry.entityType === 'deal' && entry.entityId) {
    auditDealRefs += 1
    if (!dealIds.has(entry.entityId))
      issues.push({
        entity: 'AuditEntry',
        field: 'entityId',
        value: entry.entityId,
        severity: 'error',
      })
  }
}

let contractDealRefs = 0
for (const c of contracts) {
  contractDealRefs += 1
  if (!dealIds.has(c.dealId))
    issues.push({
      entity: 'Contract',
      field: 'dealId',
      value: c.dealId,
      severity: 'error',
    })
  if (c.matchId && !matchIds.has(c.matchId))
    issues.push({
      entity: 'Contract',
      field: 'matchId',
      value: c.matchId,
      severity: 'warning',
    })
}

for (const d of deals) {
  if (d.negotiationId && !negotiationIds.has(d.negotiationId))
    issues.push({
      entity: 'Deal',
      field: 'negotiationId',
      value: d.negotiationId,
      severity: 'warning',
    })
  if (d.contractId && !contractIds.has(d.contractId))
    issues.push({
      entity: 'Deal',
      field: 'contractId',
      value: d.contractId,
      severity: 'error',
    })
  if (d.matchId && !matchIds.has(d.matchId))
    issues.push({
      entity: 'Deal',
      field: 'matchId',
      value: d.matchId,
      severity: 'warning',
    })
}

for (const n of negotiations) {
  if (n.matchId && !matchIds.has(n.matchId))
    issues.push({
      entity: 'Negotiation',
      field: 'matchId',
      value: n.matchId,
      severity: 'warning',
    })
}

const errors = issues.filter((i) => i.severity === 'error')
const warnings = issues.filter((i) => i.severity === 'warning')

const report = {
  valid: errors.length === 0,
  checkedAt: new Date().toISOString(),
  summary: {
    applicationDealRefs,
    resolvedDealRefs,
    notificationDealRefs,
    auditDealRefs,
    contractDealRefs,
    totalDeals: deals.length,
    totalContracts: contracts.length,
    errorCount: errors.length,
    warningCount: warnings.length,
  },
  errors,
  warnings,
}

console.log(JSON.stringify(report, null, 2))
process.exit(errors.length > 0 ? 1 : 0)
