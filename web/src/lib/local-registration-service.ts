import type { ImplementedPartyType } from '@pm-twin/party'
import { authService } from '@/lib/auth-service.ts'
import type { RegistrationRequest } from '@/lib/registration-service.ts'
import {
  buildCompanyIdSet,
  projectAccountToParty,
} from '@/domain/party/party-projection.ts'
import {
  companyRepository,
  formatMembershipId,
  partyMembershipRepository,
  partyRepository,
  userRepository,
} from '@/repositories/index.ts'
import type { CompanyRepository } from '@/repositories/company-repository.ts'
import type { PartyMembershipRepository } from '@/repositories/party-membership-repository.ts'
import type { PartyRepository } from '@/repositories/party-repository.ts'
import type { UserRepository } from '@/repositories/user-repository.ts'

export type LocalRegistrationResult = {
  userId: string
  partyId: string
  membershipId: string
  partyType: ImplementedPartyType
}

export type LocalRegistrationDeps = {
  userRepository: UserRepository
  companyRepository: CompanyRepository
  partyRepository: PartyRepository
  partyMembershipRepository: PartyMembershipRepository
}

const defaultDeps: LocalRegistrationDeps = {
  userRepository,
  companyRepository,
  partyRepository,
  partyMembershipRepository,
}

function createLocalUserId(): string {
  return `local-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createLocalCompanyId(): string {
  return `local-co-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildProfileLocation(profile: RegistrationRequest['profile']): string | undefined {
  const parts = [profile.city, profile.region, profile.country].filter((part) => part?.trim())
  return parts.length > 0 ? parts.join(', ') : undefined
}

export function registerLocalAccount(
  request: RegistrationRequest,
  deps: LocalRegistrationDeps = defaultDeps,
): LocalRegistrationResult {
  const passwordHash = authService.encodePassword(request.password)
  const location = buildProfileLocation(request.profile)

  if (request.accountType === 'individual') {
    const userId = createLocalUserId()
    const user = deps.userRepository.create({
      id: userId,
      email: request.email,
      passwordHash,
      role: 'user',
      status: 'active',
      profile: {
        name: request.profile.displayName,
        location,
        headline: request.profile.specialty ?? request.profile.expertise,
        skills: request.profile.skills,
      },
    })

    const party = projectAccountToParty(user, buildCompanyIdSet([]))
    deps.partyRepository.create(party)
    deps.partyMembershipRepository.setPrimaryMembership(userId, userId, 'owner')

    return {
      userId,
      partyId: userId,
      membershipId: formatMembershipId({ userId, partyId: userId }),
      partyType: 'individual',
    }
  }

  const userId = createLocalUserId()
  const companyId = createLocalCompanyId()
  const contactName = request.profile.contactPerson?.trim() || request.profile.displayName

  deps.userRepository.create({
    id: userId,
    email: request.email,
    passwordHash,
    role: 'company_owner',
    status: 'active',
    profile: {
      name: contactName,
      location,
    },
  })

  const company = deps.companyRepository.create({
    id: companyId,
    email: `${companyId}@internal.pmtwin`,
    role: 'company_owner',
    status: 'active',
    profile: {
      name: request.profile.displayName,
      type: 'company',
      location,
      description: request.profile.companyDescription,
    },
  })

  const party = projectAccountToParty(company, buildCompanyIdSet([companyId]))
  deps.partyRepository.create(party)
  deps.partyMembershipRepository.suppressSynthesizedMembership(userId, userId)
  deps.partyMembershipRepository.setPrimaryMembership(userId, companyId, 'owner')

  return {
    userId,
    partyId: companyId,
    membershipId: formatMembershipId({ userId, partyId: companyId }),
    partyType: 'company',
  }
}
