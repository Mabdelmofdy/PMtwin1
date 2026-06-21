import type {
  DomainHealthReport,
  EntityKind,
  EntityValidationRecord,
  RelationshipAnomaly,
  SafeValidationResult,
  ValidationErrorSummary,
} from '@/domain/normalized/validation/types.ts'

const KNOWN_STATUSES: Partial<Record<EntityKind, readonly string[]>> = {
  user: ['pending', 'active', 'suspended', 'rejected', 'clarification_requested'],
  opportunity: [
    'draft',
    'published',
    'in_negotiation',
    'contracted',
    'in_execution',
    'completed',
    'closed',
    'cancelled',
  ],
  application: [
    'pending',
    'reviewing',
    'shortlisted',
    'in_negotiation',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  match: ['pending', 'accepted', 'declined', 'confirmed', 'expired'],
  negotiation: [
    'active',
    'counter_offered',
    'agreed',
    'expired',
    'cancelled',
    'failed',
    'open',
  ],
  deal: [
    'draft',
    'active',
    'execution',
    'completed',
    'cancelled',
    'negotiating',
    'signing',
    'review',
    'delivery',
    'closed',
  ],
  contract: [
    'draft',
    'pending_signature',
    'pending',
    'active',
    'completed',
    'terminated',
  ],
}

const RECOMMENDED_FIELDS: Partial<Record<EntityKind, readonly string[]>> = {
  user: ['id', 'email', 'createdAt'],
  company: ['id', 'email', 'createdAt'],
  opportunity: ['id', 'title', 'creatorId', 'createdAt'],
  application: ['id', 'opportunityId', 'applicantId', 'createdAt'],
  match: ['id', 'matchType', 'participants', 'createdAt'],
  negotiation: ['id', 'participants', 'createdAt'],
  deal: ['id', 'negotiationId', 'opportunityId', 'title', 'createdAt'],
  contract: ['id', 'dealId', 'createdAt'],
  notification: ['id', 'userId', 'title', 'createdAt'],
  auditLog: ['id', 'action', 'createdAt'],
}

export type CollectValidationInput = {
  entityKind: EntityKind
  entityId: string
  result: SafeValidationResult<unknown>
  entity?: Record<string, unknown>
}

export function detectMissingFields(
  entityKind: EntityKind,
  entity: Record<string, unknown>,
): string[] {
  const recommended = RECOMMENDED_FIELDS[entityKind] ?? []
  return recommended.filter((field) => {
    const value = entity[field]
    return value === undefined || value === null || value === ''
  })
}

const STATUS_ENTITY_KINDS: EntityKind[] = [
  'user',
  'company',
  'opportunity',
  'application',
  'match',
  'negotiation',
  'deal',
  'contract',
]

export function isStatusInconsistent(
  entityKind: EntityKind,
  status: unknown,
): boolean {
  if (!STATUS_ENTITY_KINDS.includes(entityKind)) return false
  if (status == null || status === '') return false
  const known = KNOWN_STATUSES[entityKind]
  if (!known) return false
  return !known.includes(String(status))
}

export function collectValidationErrors(
  inputs: CollectValidationInput[],
): EntityValidationRecord[] {
  return inputs.map(({ entityKind, entityId, result, entity }) => {
    const raw = entity ?? {}
    const missingFields = detectMissingFields(entityKind, raw)
    const statusValue =
      typeof raw.status === 'string' ? raw.status : undefined

    return {
      entityKind,
      entityId,
      valid: result.success,
      errors: result.success ? [] : result.errors,
      missingFields,
      statusValue,
    }
  })
}

export function groupErrorsByEntity(
  records: EntityValidationRecord[],
): Record<EntityKind, ValidationErrorSummary[]> {
  const grouped = {} as Record<EntityKind, ValidationErrorSummary[]>
  for (const record of records) {
    if (!grouped[record.entityKind]) {
      grouped[record.entityKind] = []
    }
    if (record.errors.length > 0) {
      grouped[record.entityKind].push(...record.errors)
    }
  }
  return grouped
}

export function computeDomainHealthScore(
  records: EntityValidationRecord[],
): number {
  if (records.length === 0) return 100
  const validCount = records.filter((r) => r.valid).length
  const missingPenalty = records.reduce(
    (sum, r) => sum + r.missingFields.length * 0.5,
    0,
  )
  const statusPenalty = records.filter((r) =>
    isStatusInconsistent(r.entityKind, r.statusValue),
  ).length
  const base = (validCount / records.length) * 100
  const penalty = Math.min(40, missingPenalty + statusPenalty * 2)
  return Math.max(0, Math.round((base - penalty) * 10) / 10)
}

export function buildEntityHealthStats(
  records: EntityValidationRecord[],
): DomainHealthReport['byEntity'] {
  const kinds: EntityKind[] = [
    'user',
    'company',
    'opportunity',
    'application',
    'match',
    'negotiation',
    'deal',
    'contract',
    'notification',
    'auditLog',
  ]

  const byEntity = {} as DomainHealthReport['byEntity']

  for (const kind of kinds) {
    const subset = records.filter((r) => r.entityKind === kind)
    const total = subset.length
    const valid = subset.filter((r) => r.valid).length
    const invalid = total - valid
    byEntity[kind] = {
      total,
      valid,
      invalid,
      validPercent: total > 0 ? Math.round((valid / total) * 1000) / 10 : 100,
      missingFieldsCount: subset.reduce(
        (sum, r) => sum + r.missingFields.length,
        0,
      ),
      statusInconsistencies: subset.filter((r) =>
        isStatusInconsistent(kind, r.statusValue),
      ).length,
    }
  }

  return byEntity
}

export function detectRelationshipAnomalies(
  deals: Array<{ id: string; negotiationId?: string; contractId?: string | null; applicationId?: string | null }>,
  contracts: Array<{ id: string; dealId?: string }>,
  applications: Array<{ id: string; dealId?: string; negotiationId?: string }>,
): RelationshipAnomaly[] {
  const anomalies: RelationshipAnomaly[] = []
  const contractByDeal = new Map(
    contracts.filter((c) => c.dealId).map((c) => [c.dealId!, c.id]),
  )

  for (const deal of deals) {
    if (deal.contractId && contractByDeal.get(deal.id) !== deal.contractId) {
      anomalies.push({
        entityKind: 'deal',
        entityId: deal.id,
        field: 'contractId',
        message: 'Deal contractId does not match any contract.dealId back-reference',
        severity: 'warning',
      })
    }
    if (!deal.negotiationId) {
      anomalies.push({
        entityKind: 'deal',
        entityId: deal.id,
        field: 'negotiationId',
        message: 'Deal missing negotiationId (optional but unusual in E2E seed)',
        severity: 'info',
      })
    }
  }

  for (const app of applications) {
    if (app.dealId && !deals.some((d) => d.id === app.dealId)) {
      anomalies.push({
        entityKind: 'application',
        entityId: app.id,
        field: 'dealId',
        message: 'Application references missing deal',
        severity: 'warning',
      })
    }
  }

  return anomalies
}

export function buildDomainHealthReport(
  records: EntityValidationRecord[],
  relationshipAnomalies: RelationshipAnomaly[] = [],
  mode: DomainHealthReport['mode'] = 'safe',
): DomainHealthReport {
  const grouped = groupErrorsByEntity(records)
  const byEntity = buildEntityHealthStats(records)
  const errorByEntity = {} as Record<EntityKind, number>

  for (const kind of Object.keys(byEntity) as EntityKind[]) {
    errorByEntity[kind] = grouped[kind]?.length ?? 0
  }

  return {
    checkedAt: new Date().toISOString(),
    mode,
    overallHealthScore: computeDomainHealthScore(records),
    byEntity,
    records,
    relationshipAnomalies,
    errorSummary: {
      totalErrors: records.reduce((sum, r) => sum + r.errors.length, 0),
      byEntity: errorByEntity,
    },
  }
}

/** Logs summary only when diagnostics are explicitly enabled — never spams production. */
export function logValidationSummary(
  report: DomainHealthReport,
  options: { enabled?: boolean } = {},
): void {
  const enabled =
    options.enabled ??
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.DEV === true &&
      import.meta.env?.VITE_DOMAIN_VALIDATION_LOG === 'true')

  if (!enabled) return

  console.group('[PMTwin] Domain validation summary')
  console.log(`Health score: ${report.overallHealthScore}%`)
  console.log(`Total validation errors: ${report.errorSummary.totalErrors}`)
  console.table(
    Object.entries(report.byEntity).map(([kind, stats]) => ({
      entity: kind,
      total: stats.total,
      valid: stats.valid,
      validPct: stats.validPercent,
      missingFields: stats.missingFieldsCount,
      statusIssues: stats.statusInconsistencies,
    })),
  )
  if (report.relationshipAnomalies.length > 0) {
    console.warn('Relationship anomalies:', report.relationshipAnomalies)
  }
  console.groupEnd()
}
