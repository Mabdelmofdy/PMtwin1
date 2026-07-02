import type { CommandResult } from '@pm-twin/commands'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'
import {
  evaluatePublishReadiness,
  formatPublishReadinessDetailLines,
  PUBLISH_READINESS_BLOCKED_CODE,
  PUBLISH_READINESS_BLOCKED_MESSAGE,
} from '@/domain/publish-readiness/index.ts'
import type { ProfileKind, ProfileReadinessResult } from '@/domain/profile-readiness/types.ts'
import {
  matchingService,
  type PublishMatchingResult,
} from '@/services/matching-service.ts'
import {
  createOpportunityCommandService,
  opportunityCommandService,
} from '@/services/opportunity-command-service.ts'

export type PublishOpportunityUiActionResult =
  | {
      readonly success: true
      readonly published: true
      readonly discoveredMatchesCount: number
      readonly skippedDuplicatesCount: number
      readonly matchingErrors: readonly string[]
    }
  | {
      readonly success: false
      readonly code: typeof PUBLISH_READINESS_BLOCKED_CODE | 'COMMAND_FAILED'
      readonly message: string
      readonly details?: readonly string[]
      readonly profileReadiness?: ProfileReadinessResult
      readonly opportunityReadiness?: OpportunityReadinessResult
    }

export type PublishOrchestrationDeps = {
  readonly transitionOpportunityStatus?: (
    opportunityId: string,
    targetStatus: string,
  ) => CommandResult
  readonly runPublishMatching?: (
    opportunityId: string,
  ) => PublishMatchingResult
  readonly runCircularMatching?: (
    opportunityId: string,
  ) => PublishMatchingResult
}

const EMPTY_MATCHING_RESULT: PublishMatchingResult = {
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('\n')
  }
  return PUBLISH_READINESS_BLOCKED_MESSAGE
}

/** Transition to published and run matching after readiness gate has passed. */
export function executePublishOpportunityOrchestration(
  opportunityId: string,
  deps?: PublishOrchestrationDeps,
): PublishOpportunityUiActionResult {
  const transitionOpportunityStatus =
    deps?.transitionOpportunityStatus ??
    opportunityCommandService.transitionOpportunityStatus.bind(
      opportunityCommandService,
    )

  const result = transitionOpportunityStatus(opportunityId, 'published')
  if (!result.success) {
    return {
      success: false,
      code: 'COMMAND_FAILED',
      message: formatCommandErrors(result),
      details: result.errors,
    }
  }

  const runPublishMatching =
    deps?.runPublishMatching
    ?? matchingService.runPublishMatchingForOpportunity.bind(matchingService)
  const runCircularMatching =
    deps?.runCircularMatching
    ?? matchingService.runCircularMatchingForOpportunity.bind(matchingService)

  const matching = runPublishMatching(opportunityId)

  // Circular matching runs as an additional creator-anchored pass on publish
  // (POC parity). It is best-effort and must never fail the publish action.
  let circular: PublishMatchingResult
  try {
    circular = runCircularMatching(opportunityId)
  } catch (error) {
    circular = {
      ...EMPTY_MATCHING_RESULT,
      matchingErrors: [
        error instanceof Error ? error.message : 'Circular matching failed',
      ],
    }
  }

  return {
    success: true,
    published: true,
    discoveredMatchesCount:
      matching.discoveredMatchesCount + circular.discoveredMatchesCount,
    skippedDuplicatesCount:
      matching.skippedDuplicatesCount + circular.skippedDuplicatesCount,
    matchingErrors: [...matching.matchingErrors, ...circular.matchingErrors],
  }
}

export function publishOpportunityUiAction(
  opportunityId: string,
  context: {
    readonly profile?: object | null
    readonly profileKind: ProfileKind
    readonly opportunity?: object | null
  },
  deps?: PublishOrchestrationDeps,
): PublishOpportunityUiActionResult {
  const gate = evaluatePublishReadiness({
    profile: context.profile,
    profileKind: context.profileKind,
    opportunity: context.opportunity,
  })

  if (!gate.allowed) {
    return {
      success: false,
      code: PUBLISH_READINESS_BLOCKED_CODE,
      message: PUBLISH_READINESS_BLOCKED_MESSAGE,
      details: formatPublishReadinessDetailLines(gate),
      profileReadiness: gate.profileReadiness,
      opportunityReadiness: gate.opportunityReadiness,
    }
  }

  return executePublishOpportunityOrchestration(opportunityId, deps)
}

export function saveOpportunityDraftFields(
  opportunityId: string,
  patch: Partial<Opportunity>,
  deps?: {
    readonly updateOpportunity?: (
      id: string,
      patch: Partial<Opportunity>,
    ) => void
  },
): void {
  const updateOpportunity = deps?.updateOpportunity ?? opportunitiesApi.update.bind(opportunitiesApi)
  const draftFields = { ...patch }
  delete (draftFields as { status?: string }).status
  updateOpportunity(opportunityId, draftFields)
}

export function resolveProfileKindFromUser(user: PlatformUser): ProfileKind {
  return user.profile?.type === 'company' ? 'company' : 'individual'
}

export { createOpportunityCommandService }
