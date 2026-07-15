import type { PlatformUser } from '@/types/domain.ts'
import { companyRepository, userRepository } from '@/repositories/index.ts'

type ProfileRepository = {
  getById: (id: string) => PlatformUser | undefined
  update: (id: string, patch: Partial<PlatformUser>) => PlatformUser | undefined
}

export type ProfileUpdateRepositories = {
  readonly users: ProfileRepository
  readonly companies: ProfileRepository
}

const defaultRepositories: ProfileUpdateRepositories = {
  users: userRepository,
  companies: companyRepository,
}

export function updateUserProfile(
  userId: string,
  profilePatch: NonNullable<PlatformUser['profile']>,
  repositories: ProfileUpdateRepositories = defaultRepositories,
): PlatformUser | undefined {
  const repository = repositories.users.getById(userId)
    ? repositories.users
    : repositories.companies
  const existing = repository.getById(userId)
  if (!existing) return undefined

  return repository.update(userId, {
    profile: {
      ...existing.profile,
      ...profilePatch,
      profileCompletionUnlocked: true,
    },
  })
}

