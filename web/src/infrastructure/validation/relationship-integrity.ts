import {
  loadApplications,
  loadAuditLog,
  loadCommercialAgreements,
  loadContracts,
  loadNegotiations,
  loadNotifications,
} from '@/infrastructure/seed/seed-loader.ts'

export type RelationshipIssue = {
  entity: string
  field: string
  value: string
  expected: string
  severity: 'error' | 'warning'
}

export type RelationshipReport = {
  valid: boolean
  checkedAt: string
  issues: RelationshipIssue[]
  summary: {
    applicationDealRefs: number
    resolvedDealRefs: number
    notificationDealRefs: number
    auditDealRefs: number
    contractDealRefs: number
  }
}

export function validateRelationshipIntegrity(): RelationshipReport {
  const deals = loadCommercialAgreements()
  const contracts = loadContracts()
  const applications = loadApplications()
  const notifications = loadNotifications()
  const audit = loadAuditLog()
  const negotiations = loadNegotiations()

  const dealIds = new Set(deals.map((d) => d.id))
  const contractIds = new Set(contracts.map((c) => c.id))
  const negotiationIds = new Set(negotiations.map((n) => n.id))
  const issues: RelationshipIssue[] = []

  let applicationDealRefs = 0
  let resolvedDealRefs = 0

  for (const app of applications) {
    const commercialAgreementId = app.commercialAgreementId ?? app.dealId
    if (!commercialAgreementId) continue
    applicationDealRefs += 1
    if (dealIds.has(commercialAgreementId)) {
      resolvedDealRefs += 1
    } else {
      issues.push({
        entity: 'Application',
        field: 'dealId',
        value: commercialAgreementId,
        expected: 'existing CommercialAgreement.id',
        severity: 'error',
      })
    }
    if (app.negotiationId && !negotiationIds.has(app.negotiationId)) {
      issues.push({
        entity: 'Application',
        field: 'negotiationId',
        value: app.negotiationId,
        expected: 'existing Negotiation.id',
        severity: 'error',
      })
    }
  }

  let notificationDealRefs = 0
  for (const n of notifications) {
    if (n.entityType === 'deal' && n.entityId) {
      notificationDealRefs += 1
      if (!dealIds.has(n.entityId)) {
        issues.push({
          entity: 'AppNotification',
          field: 'entityId',
          value: n.entityId,
          expected: 'existing Deal.id',
          severity: 'error',
        })
      }
    }
    if (n.entityType === 'contract' && n.entityId && !contractIds.has(n.entityId)) {
      issues.push({
        entity: 'AppNotification',
        field: 'entityId',
        value: n.entityId,
        expected: 'existing Contract.id',
        severity: 'error',
      })
    }
  }

  let auditDealRefs = 0
  for (const entry of audit) {
    if (entry.entityType === 'deal' && entry.entityId) {
      auditDealRefs += 1
      if (!dealIds.has(entry.entityId)) {
        issues.push({
          entity: 'AuditEntry',
          field: 'entityId',
          value: entry.entityId,
          expected: 'existing Deal.id',
          severity: 'error',
        })
      }
    }
  }

  let contractDealRefs = 0
  for (const c of contracts) {
    contractDealRefs += 1
    const commercialAgreementId = c.commercialAgreementId ?? c.dealId
    if (!commercialAgreementId || !dealIds.has(commercialAgreementId)) {
      issues.push({
        entity: 'Contract',
        field: 'commercialAgreementId',
        value: commercialAgreementId ?? '',
        expected: 'existing CommercialAgreement.id',
        severity: 'error',
      })
    }
  }

  for (const d of deals) {
    if (d.negotiationId && !negotiationIds.has(d.negotiationId)) {
      issues.push({
        entity: 'Deal',
        field: 'negotiationId',
        value: d.negotiationId,
        expected: 'existing Negotiation.id',
        severity: 'warning',
      })
    }
    if (d.contractId && !contractIds.has(d.contractId)) {
      issues.push({
        entity: 'Deal',
        field: 'contractId',
        value: d.contractId,
        expected: 'existing Contract.id',
        severity: 'error',
      })
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    checkedAt: new Date().toISOString(),
    issues,
    summary: {
      applicationDealRefs,
      resolvedDealRefs,
      notificationDealRefs,
      auditDealRefs,
      contractDealRefs,
    },
  }
}
