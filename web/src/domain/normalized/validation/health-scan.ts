/**
 * Optional domain health scan over seed-loaded normalized entities.
 * Read-only — does not mutate storage or block runtime.
 */

import {
  normalizeApplications,
  normalizeAuditLogs,
  normalizeCompanies,
  normalizeContracts,
  normalizeDeals,
  normalizeNegotiations,
  normalizeNotifications,
  normalizeOpportunities,
  normalizePostMatches,
  normalizeUsers,
} from '@/domain/normalized/adapters.ts'
import {
  buildDomainHealthReport,
  collectValidationErrors,
  detectRelationshipAnomalies,
} from '@/domain/normalized/validation/diagnostics.ts'
import type { DomainHealthReport } from '@/domain/normalized/validation/types.ts'
import {
  validateApplication,
  validateAuditLog,
  validateCompany,
  validateContract,
  validateDeal,
  validateMatch,
  validateNegotiation,
  validateNotification,
  validateOpportunity,
  validateUser,
} from '@/domain/normalized/validation/validators.ts'
import {
  loadApplications,
  loadAuditLog,
  loadCompanies,
  loadContracts,
  loadDeals,
  loadNegotiations,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
  loadUsers,
} from '@/infrastructure/seed/seed-loader.ts'

export function scanNormalizedDomainHealth(): DomainHealthReport {
  const users = normalizeUsers(loadUsers())
  const companies = normalizeCompanies(loadCompanies())
  const opportunities = normalizeOpportunities(loadOpportunities())
  const applications = normalizeApplications(loadApplications())
  const matches = normalizePostMatches(loadPostMatches())
  const negotiations = normalizeNegotiations(loadNegotiations())
  const deals = normalizeDeals(loadDeals())
  const contracts = normalizeContracts(loadContracts())
  const notifications = normalizeNotifications(loadNotifications())
  const auditLogs = normalizeAuditLogs(loadAuditLog())

  const inputs = [
    ...users.map((e) => ({
      entityKind: 'user' as const,
      entityId: e.id,
      result: validateUser(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...companies.map((e) => ({
      entityKind: 'company' as const,
      entityId: e.id,
      result: validateCompany(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...opportunities.map((e) => ({
      entityKind: 'opportunity' as const,
      entityId: e.id,
      result: validateOpportunity(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...applications.map((e) => ({
      entityKind: 'application' as const,
      entityId: e.id,
      result: validateApplication(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...matches.map((e) => ({
      entityKind: 'match' as const,
      entityId: e.id,
      result: validateMatch(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...negotiations.map((e) => ({
      entityKind: 'negotiation' as const,
      entityId: e.id,
      result: validateNegotiation(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...deals.map((e) => ({
      entityKind: 'deal' as const,
      entityId: e.id,
      result: validateDeal(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...contracts.map((e) => ({
      entityKind: 'contract' as const,
      entityId: e.id,
      result: validateContract(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...notifications.map((e) => ({
      entityKind: 'notification' as const,
      entityId: e.id,
      result: validateNotification(e),
      entity: e as unknown as Record<string, unknown>,
    })),
    ...auditLogs.map((e) => ({
      entityKind: 'auditLog' as const,
      entityId: e.id,
      result: validateAuditLog(e),
      entity: e as unknown as Record<string, unknown>,
    })),
  ]

  const records = collectValidationErrors(inputs)
  const relationshipAnomalies = detectRelationshipAnomalies(
    deals,
    contracts,
    applications,
  )

  return buildDomainHealthReport(records, relationshipAnomalies, 'safe')
}
