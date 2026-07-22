import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import {
  matchingService,
  type BatchPublishMatchingResult,
} from '@/services/matching-service.ts'

export type RunPublishMatchingUiActionResult =
  | ({ readonly success: true } & BatchPublishMatchingResult)
  | {
      readonly success: false
      readonly code: 'ACCESS_DENIED'
      readonly message: string
    }

/**
 * Admin batch: run publish/auto matching across all published opportunities.
 * Discovers one_way Need↔Offer pairs (unlike circular-only admin runs).
 */
export function runPublishMatchingUiAction(
  actor: {
    readonly userId?: string
    readonly userRole?: string | null
  },
  deps?: {
    readonly runPublishMatching?: (actor: {
      readonly userId?: string
      readonly userRole?: string | null
    }) => BatchPublishMatchingResult
  },
): RunPublishMatchingUiActionResult {
  const role = actor.userRole ?? null
  if (
    !canAccessAdminForRole(role) ||
    !hasAdminCapability(role, 'admin.matching.execute')
  ) {
    return {
      success: false,
      code: 'ACCESS_DENIED',
      message: 'Admin matching permission required to run matching.',
    }
  }

  const runPublishMatching =
    deps?.runPublishMatching
    ?? ((currentActor) =>
      matchingService.runPublishMatchingForPublishedOpportunities({
        actorId: currentActor.userId,
        actorRole: currentActor.userRole,
      }))

  const result = runPublishMatching(actor)
  return { success: true, ...result }
}
