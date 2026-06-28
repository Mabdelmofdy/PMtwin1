import type { AuditEntry } from '@/types/domain.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import {
  MATCHING_RUN_AUDIT_ACTIONS,
  type MatchingRunAuditDetails,
  type MatchingRunStatus,
  type MatchingRunType,
} from '@/domain/matching-run-audit/types.ts'

export type RecordMatchingRunAuditInput = {
  readonly runId: string
  readonly runType: MatchingRunType
  readonly actorId?: string
  readonly actorRole?: string | null
  readonly startedAt: string
  readonly completedAt: string
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrors: readonly string[]
  readonly status: MatchingRunStatus
  readonly failureReason?: string
}

export function resolveMatchingRunStatus(
  matchingErrors: readonly string[],
  options?: { readonly failed?: boolean },
): MatchingRunStatus {
  if (options?.failed) return 'failed'
  if (matchingErrors.length > 0) return 'completed_with_errors'
  return 'completed'
}

export function buildMatchingRunAuditDetails(
  input: RecordMatchingRunAuditInput,
): MatchingRunAuditDetails {
  return {
    runId: input.runId,
    runType: input.runType,
    actorId: input.actorId,
    actorRole: input.actorRole ?? undefined,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    discoveredMatchesCount: input.discoveredMatchesCount,
    skippedDuplicatesCount: input.skippedDuplicatesCount,
    matchingErrorsCount: input.matchingErrors.length,
    matchingErrors: [...input.matchingErrors],
    status: input.status,
    failureReason: input.failureReason,
  }
}

export function appendMatchingRunAudit(
  auditRepository: AuditRepository,
  details: MatchingRunAuditDetails,
): AuditEntry {
  return auditRepository.append({
    action: MATCHING_RUN_AUDIT_ACTIONS[details.runType],
    userId: details.actorId,
    actorType: 'admin',
    entityType: 'match',
    entityId: details.runId,
    requestId: details.runId,
    details: { ...details },
  })
}

export function isMatchingRunAuditEntry(entry: AuditEntry): boolean {
  return Object.values(MATCHING_RUN_AUDIT_ACTIONS).includes(entry.action)
}

export function parseMatchingRunAuditDetails(
  entry: AuditEntry,
): MatchingRunAuditDetails | null {
  if (!isMatchingRunAuditEntry(entry) || !entry.details) return null
  const details = entry.details as Partial<MatchingRunAuditDetails>
  if (
    typeof details.runId !== 'string'
    || typeof details.runType !== 'string'
    || typeof details.startedAt !== 'string'
    || typeof details.completedAt !== 'string'
    || typeof details.status !== 'string'
  ) {
    return null
  }
  return {
    runId: details.runId,
    runType: details.runType as MatchingRunType,
    actorId: typeof details.actorId === 'string' ? details.actorId : undefined,
    actorRole: typeof details.actorRole === 'string' ? details.actorRole : undefined,
    startedAt: details.startedAt,
    completedAt: details.completedAt,
    discoveredMatchesCount: Number(details.discoveredMatchesCount ?? 0),
    skippedDuplicatesCount: Number(details.skippedDuplicatesCount ?? 0),
    matchingErrorsCount: Number(details.matchingErrorsCount ?? 0),
    matchingErrors: Array.isArray(details.matchingErrors)
      ? details.matchingErrors.map(String)
      : [],
    status: details.status as MatchingRunStatus,
    failureReason:
      typeof details.failureReason === 'string' ? details.failureReason : undefined,
  }
}

export function recordMatchingRunAudit(
  auditRepository: AuditRepository,
  input: RecordMatchingRunAuditInput,
): AuditEntry {
  const details = buildMatchingRunAuditDetails(input)
  return appendMatchingRunAudit(auditRepository, details)
}
