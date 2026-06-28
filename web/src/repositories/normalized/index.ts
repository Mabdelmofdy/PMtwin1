/**
 * Safe repository wrappers — delegate to legacy repositories, return normalized models only.
 * Persistence format and storage keys are unchanged.
 */

import {
  normalizeApplication,
  normalizeApplications,
  normalizeDeal,
  normalizeDeals,
  normalizeOpportunity,
  normalizeOpportunities,
  normalizeUser,
  normalizeUsers,
} from '@/domain/normalized/adapters.ts'
import type {
  NormalizedApplication,
  NormalizedDeal,
  NormalizedOpportunity,
  NormalizedUser,
} from '@/domain/normalized/types.ts'
import { assertNoLifecycleStatusInPatch } from '@/lib/lifecycle-status-guard.ts'
import {
  applicationRepository,
  dealRepository,
  opportunityRepository,
  userRepository,
} from '@/repositories/index.ts'

export const userRepositoryNormalized = {
  getAll(): NormalizedUser[] {
    return normalizeUsers(userRepository.getAll())
  },

  getById(id: string): NormalizedUser | undefined {
    const raw = userRepository.getById(id)
    if (!raw) return undefined
    const normalized = normalizeUser(raw)
    return normalized.id ? normalized : undefined
  },
}

export const opportunityRepositoryNormalized = {
  getAll(): NormalizedOpportunity[] {
    return normalizeOpportunities(opportunityRepository.getAll())
  },

  getById(id: string): NormalizedOpportunity | undefined {
    const raw = opportunityRepository.getById(id)
    if (!raw) return undefined
    const normalized = normalizeOpportunity(raw)
    return normalized.id ? normalized : undefined
  },

  /** Pass-through update — persists legacy shape via underlying repository. */
  update(id: string, patch: Parameters<typeof opportunityRepository.update>[1]): void {
    assertNoLifecycleStatusInPatch(patch)
    opportunityRepository.update(id, patch)
  },
}

export const applicationRepositoryNormalized = {
  getAll(): NormalizedApplication[] {
    return normalizeApplications(applicationRepository.getAll())
  },

  getById(id: string): NormalizedApplication | undefined {
    const raw = applicationRepository.getById(id)
    if (!raw) return undefined
    const normalized = normalizeApplication(raw)
    return normalized.id ? normalized : undefined
  },

  getByOpportunity(opportunityId: string): NormalizedApplication[] {
    return normalizeApplications(
      applicationRepository.getByOpportunity(opportunityId),
    )
  },

  getByApplicant(applicantId: string): NormalizedApplication[] {
    return normalizeApplications(
      applicationRepository.getByApplicant(applicantId),
    )
  },

  /** Pass-through mutations — storage remains legacy format. */
  update(
    id: string,
    patch: Parameters<typeof applicationRepository.update>[1],
  ): void {
    assertNoLifecycleStatusInPatch(patch)
    applicationRepository.update(id, patch)
  },

  create(
    data: Parameters<typeof applicationRepository.create>[0],
  ): NormalizedApplication {
    return normalizeApplication(applicationRepository.create(data))
  },
}

export const dealRepositoryNormalized = {
  getAll(): NormalizedDeal[] {
    return normalizeDeals(dealRepository.getAll())
  },

  getById(id: string): NormalizedDeal | undefined {
    const raw = dealRepository.getById(id)
    if (!raw) return undefined
    const normalized = normalizeDeal(raw)
    return normalized.id ? normalized : undefined
  },

  /** Pass-through mutations — storage remains legacy format. */
  update(id: string, patch: Parameters<typeof dealRepository.update>[1]): void {
    assertNoLifecycleStatusInPatch(patch)
    dealRepository.update(id, patch)
  },

  create(data: Parameters<typeof dealRepository.create>[0]): NormalizedDeal {
    return normalizeDeal(dealRepository.create(data))
  },
}

export {
  userRepositoryNormalized as normalizedUserRepository,
  opportunityRepositoryNormalized as normalizedOpportunityRepository,
  applicationRepositoryNormalized as normalizedApplicationRepository,
  dealRepositoryNormalized as normalizedDealRepository,
}
