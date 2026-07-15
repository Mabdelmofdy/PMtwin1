import type { PersonProfile, PlatformUser } from '@/types/domain.ts'
import type {
  ProfileSubject,
  ProfileSubjectKind,
} from '@/domain/profile/profile-subject-resolver.ts'
import { normalizeLegacyProfile } from '@pm-twin/profile'

type AccountRepository = {
  getById: (id: string) => PlatformUser | undefined
  update: (
    id: string,
    patch: Partial<PlatformUser>,
  ) => PlatformUser | undefined
}

export type ProfileRepositoryDeps = {
  readonly users: AccountRepository
  readonly companies: AccountRepository
}

/**
 * Persistence adapter for the current embedded account profile representation.
 * It keeps one write boundary while the canonical profile package remains storage-agnostic.
 */
export class ProfileRepository {
  private readonly users: AccountRepository
  private readonly companies: AccountRepository

  constructor(deps: ProfileRepositoryDeps) {
    this.users = deps.users
    this.companies = deps.companies
  }

  getAccount(
    sourceEntityId: string,
    profileKind: ProfileSubjectKind,
  ): PlatformUser | undefined {
    return this.repositoryFor(profileKind).getById(sourceEntityId)
  }

  getProfile(subject: ProfileSubject): PersonProfile {
    return { ...(subject.account.profile ?? {}) }
  }

  updateProfile(
    subject: ProfileSubject,
    patch: Partial<PersonProfile>,
  ): PlatformUser | undefined {
    const repository = this.repositoryFor(subject.profileKind)
    const existing = repository.getById(subject.sourceEntityId)
    if (!existing) return undefined
    const mergedProfile: PersonProfile = {
      ...existing.profile,
      ...patch,
      profileCompletionUnlocked: true,
    }
    const canonical = normalizeLegacyProfile({
      ...existing,
      id: subject.profileId,
      partyId: subject.partyId,
      type: subject.profileKind,
      profile: mergedProfile,
    }).profile
    return repository.update(subject.sourceEntityId, {
      profile: {
        ...mergedProfile,
        canonical,
      },
    })
  }

  setPublished(
    subject: ProfileSubject,
    isPublic: boolean,
  ): PlatformUser | undefined {
    return this.repositoryFor(subject.profileKind).update(
      subject.sourceEntityId,
      { isPublic },
    )
  }

  private repositoryFor(profileKind: ProfileSubjectKind): AccountRepository {
    return profileKind === 'company' ? this.companies : this.users
  }
}
