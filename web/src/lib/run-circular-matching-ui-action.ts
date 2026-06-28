import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import {
  matchingService,
  type CircularMatchingResult,
} from '@/services/matching-service.ts'

export type RunCircularMatchingUiActionResult =
  | ({ readonly success: true } & CircularMatchingResult)
  | {
      readonly success: false
      readonly code: 'ACCESS_DENIED'
      readonly message: string
    }

export function runCircularMatchingUiAction(
  actor: {
    readonly userId?: string
    readonly userRole?: string | null
  },
  deps?: {
    readonly runCircularMatching?: (actor: {
      readonly userId?: string
      readonly userRole?: string | null
    }) => CircularMatchingResult
  },
): RunCircularMatchingUiActionResult {
  if (!canAccessAdminForRole(actor.userRole)) {
    return {
      success: false,
      code: 'ACCESS_DENIED',
      message: 'Admin permission required to run circular matching.',
    }
  }

  const runCircularMatching =
    deps?.runCircularMatching
    ?? ((currentActor) =>
      matchingService.runCircularMatchingForPublishedOpportunities({
        actorId: currentActor.userId,
        actorRole: currentActor.userRole,
      }))

  const result = runCircularMatching(actor)
  return { success: true, ...result }
}
