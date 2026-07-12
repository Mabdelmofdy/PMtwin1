import type { EnvironmentExportPayload } from '@/infrastructure/environment/environment-export-service.ts'
import {
  loadApplications,
  loadCommercialAgreements,
  loadCompanies,
  loadContracts,
  loadNegotiations,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
  loadUsers,
} from '@/infrastructure/seed/seed-loader.ts'
import type { Overrides } from '@/types/storage.ts'

type ImportableEntity = { readonly id: string }

type SplitImportedEntitiesResult<T extends ImportableEntity> = {
  patches: Record<string, T>
  newItems: T[]
  deletedIds: string[]
}

function splitImportedEntities<T extends ImportableEntity>(
  imported: T[],
  seed: T[],
): SplitImportedEntitiesResult<T> {
  const seedIds = new Set(seed.map((item) => item.id))
  const importedIds = new Set(imported.map((item) => item.id))
  const patches: Record<string, T> = {}
  const newItems: T[] = []

  for (const item of imported) {
    if (seedIds.has(item.id)) {
      patches[item.id] = item
    } else {
      newItems.push(item)
    }
  }

  const deletedIds = seed
    .filter((item) => !importedIds.has(item.id))
    .map((item) => item.id)

  return { patches, newItems, deletedIds }
}

export function buildEnvironmentSnapshotOverrides(
  payload: EnvironmentExportPayload,
): Overrides {
  const users = splitImportedEntities(payload.users, loadUsers())
  const companies = splitImportedEntities(payload.companies, loadCompanies())
  const opportunities = splitImportedEntities(payload.opportunities, loadOpportunities())
  const postMatches = splitImportedEntities(payload.postMatches, loadPostMatches())
  const negotiations = splitImportedEntities(payload.negotiations, loadNegotiations())
  const commercialAgreements = splitImportedEntities(
    payload.commercialAgreements,
    loadCommercialAgreements(),
  )
  const contracts = splitImportedEntities(payload.contracts, loadContracts())
  const applications = splitImportedEntities(payload.applications, loadApplications())
  const notifications = splitImportedEntities(payload.notifications, loadNotifications())

  return {
    users: users.patches,
    newUsers: users.newItems,
    deletedUsers: users.deletedIds,
    companies: companies.patches,
    newCompanies: companies.newItems,
    deletedCompanies: companies.deletedIds,
    opportunities: opportunities.patches,
    newOpportunities: opportunities.newItems,
    deletedOpportunities: opportunities.deletedIds,
    postMatches: postMatches.patches,
    newPostMatches: postMatches.newItems,
    deletedPostMatches: postMatches.deletedIds,
    negotiations: negotiations.patches,
    newNegotiations: negotiations.newItems,
    deletedNegotiations: negotiations.deletedIds,
    commercialAgreements: commercialAgreements.patches,
    newCommercialAgreements: commercialAgreements.newItems,
    deletedCommercialAgreements: commercialAgreements.deletedIds,
    contracts: contracts.patches,
    newContracts: contracts.newItems,
    deletedContracts: contracts.deletedIds,
    applications: applications.patches,
    newApplications: applications.newItems,
    deletedApplications: applications.deletedIds,
    notifications: notifications.patches,
    newNotifications: notifications.newItems,
    deletedNotifications: notifications.deletedIds,
    auditSnapshot: payload.audit,
    newAuditEntries: [],
    ...(payload.adminSettings ? { adminSettings: payload.adminSettings } : {}),
    ...(payload.productLanguageSettings
      ? { productLanguageSettings: payload.productLanguageSettings }
      : {}),
  }
}
