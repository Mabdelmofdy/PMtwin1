import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import {
  matchingService,
  type PublishMatchingResult,
} from '@/services/matching-service.ts'

export type RerunMatchingUiActionResult =
  | {
      readonly success: true
      readonly opportunityId: string
      readonly discoveredMatchesCount: number
      readonly skippedDuplicatesCount: number
      readonly matchingErrors: readonly string[]
      readonly circularDiscoveredMatchesCount: number
      readonly circularSkippedDuplicatesCount: number
      readonly circularMatchingErrors: readonly string[]
    }
  | {
      readonly success: false
      readonly code: 'ACCESS_DENIED' | 'INVALID_OPPORTUNITY'
      readonly message: string
    }

export type RerunMatchingUiActionDeps = {
  readonly runPublishMatching?: (opportunityId: string) => PublishMatchingResult
  readonly runCircularMatching?: (opportunityId: string) => PublishMatchingResult
}

/**
 * Admin per-opportunity re-run: publish matching (auto models) + circular pass.
 * Parity with publish orchestration — no new command type required.
 */
export function runRerunMatchingUiAction(
  opportunityId: string,
  actor: {
    readonly userId?: string
    readonly userRole?: string | null
  },
  deps?: RerunMatchingUiActionDeps,
): RerunMatchingUiActionResult {
  const role = actor.userRole ?? null
  if (
    !canAccessAdminForRole(role) ||
    !hasAdminCapability(role, 'admin.matching.execute')
  ) {
    return {
      success: false,
      code: 'ACCESS_DENIED',
      message: 'Admin matching permission required to re-run matching.',
    }
  }

  const id = opportunityId.trim()
  if (!id) {
    return {
      success: false,
      code: 'INVALID_OPPORTUNITY',
      message: 'Opportunity id is required to re-run matching.',
    }
  }

  const runPublishMatching =
    deps?.runPublishMatching
    ?? matchingService.runPublishMatchingForOpportunity.bind(matchingService)
  const runCircularMatching =
    deps?.runCircularMatching
    ?? matchingService.runCircularMatchingForOpportunity.bind(matchingService)

  const publish = runPublishMatching(id)
  let circular: PublishMatchingResult
  try {
    circular = runCircularMatching(id)
  } catch (error) {
    circular = {
      discoveredMatchesCount: 0,
      skippedDuplicatesCount: 0,
      matchingErrors: [
        error instanceof Error ? error.message : 'Circular matching failed',
      ],
      postMatchIds: [],
    }
  }

  return {
    success: true,
    opportunityId: id,
    discoveredMatchesCount: publish.discoveredMatchesCount,
    skippedDuplicatesCount: publish.skippedDuplicatesCount,
    matchingErrors: publish.matchingErrors,
    circularDiscoveredMatchesCount: circular.discoveredMatchesCount,
    circularSkippedDuplicatesCount: circular.skippedDuplicatesCount,
    circularMatchingErrors: circular.matchingErrors,
  }
}
