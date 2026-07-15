import {
  companyRepository,
  userRepository,
} from '@/repositories/index.ts'
import type { PlatformUser } from '@/types/domain.ts'
import { buildPublicProfileProjection } from '@/domain/profile/profile-public-read-model.ts'

export function isMarketplaceProfileVisible(person: PlatformUser): boolean {
  const status = person.status.toLowerCase()
  return (
    person.isPublic !== false &&
    status !== 'pending' &&
    status !== 'pending_vetting' &&
    status !== 'clarification_requested' &&
    status !== 'rejected' &&
    status !== 'suspended' &&
    status !== 'archived'
  )
}

export const peopleApi = {
  listUsers: () => userRepository.getAll(),
  listCompanies: () => companyRepository.getAll(),
  listAll: () => [...userRepository.getAll(), ...companyRepository.getAll()],
  get: (id: string) =>
    userRepository.getById(id) ?? companyRepository.getById(id),
  listMarketplaceVisible: () =>
    [...userRepository.getAll(), ...companyRepository.getAll()].filter(
      isMarketplaceProfileVisible,
    ),
  getMarketplaceVisible: (id: string) => {
    const person =
      userRepository.getById(id) ?? companyRepository.getById(id)
    return person && isMarketplaceProfileVisible(person) ? person : undefined
  },
  listPublicProfiles: () => {
    const companies = companyRepository.getAll()
    const companyIds = new Set(companies.map((company) => company.id))
    return [...userRepository.getAll(), ...companies]
      .filter(isMarketplaceProfileVisible)
      .map((account) => buildPublicProfileProjection(account, companyIds))
  },
  getPublicProfile: (id: string) => {
    const account =
      userRepository.getById(id) ?? companyRepository.getById(id)
    if (!account || !isMarketplaceProfileVisible(account)) return undefined
    const companyIds = new Set(
      companyRepository.getAll().map((company) => company.id),
    )
    return buildPublicProfileProjection(account, companyIds)
  },
}
