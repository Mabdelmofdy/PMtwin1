import type { PlatformUser } from '@/types/domain.ts'
import { userRepository } from '@/repositories/index.ts'

export function updateUserProfile(
  userId: string,
  profilePatch: NonNullable<PlatformUser['profile']>,
): PlatformUser | undefined {
  const existing = userRepository.getById(userId)
  if (!existing) return undefined

  return userRepository.update(userId, {
    profile: {
      ...existing.profile,
      ...profilePatch,
      profileCompletionUnlocked: true,
    },
  })
}

