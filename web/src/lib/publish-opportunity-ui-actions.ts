import type { CommandResult } from '@pm-twin/commands'
import type { ExplanationBundle } from '@pm-twin/explainability'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'
import {
  buildWorkflowContext,
  findWorkflowAction,
} from '@/domain/workflows/workflow-bridge.ts'
import {
  evaluatePublishReadiness,
  formatPublishReadinessDetailLines,
  PUBLISH_READINESS_BLOCKED_CODE,
  PUBLISH_READINESS_BLOCKED_MESSAGE,
} from '@/domain/publish-readiness/index.ts'
import { buildPublishReadinessBundles } from '@/services/explainability/index.ts'
import {
  composePublishValidation,
  formatPublishValidationMessages,
} from '@/domain/opportunity-validation/index.ts'
import { buildPublishValidationExplanationLines } from '@/services/explainability/publish-validation-explain.ts'
import type { ProfileKind, ProfileReadinessResult } from '@/domain/profile-readiness/types.ts'
import {
  matchingService,
  type PublishMatchingResult,
} from '@/services/matching-service.ts'
import {
  createOpportunityCommandService,
  opportunityCommandService,
} from '@/services/opportunity-command-service.ts'

export const PUBLISH_VALIDATION_BLOCKED_CODE = 'PUBLISH_VALIDATION_BLOCKED' as const

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
      readonly code:
        | typeof PUBLISH_READINESS_BLOCKED_CODE
        | typeof PUBLISH_VALIDATION_BLOCKED_CODE
        | 'COMMAND_FAILED'
      readonly message: string
      readonly details?: readonly string[]
      readonly publishBundles?: readonly ExplanationBundle[]
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
    readonly profileId?: string
    readonly vettingApproved?: boolean
  },
  deps?: PublishOrchestrationDeps,
): PublishOpportunityUiActionResult {
  // Produce readiness snapshot once; publish validation consumes it (no recalculation).
  const gate = evaluatePublishReadiness({
    profile: context.profile,
    profileKind: context.profileKind,
    opportunity: context.opportunity,
  })

  const opportunity = (context.opportunity ?? {}) as Partial<Opportunity>
  const publishValidation = composePublishValidation({
    opportunity,
    publishReadiness: gate,
    vettingApproved: context.vettingApproved ?? true,
  })

  if (publishValidation.status === 'blocked') {
    // Preserve readiness detail format when readiness itself failed (regression UX).
    // Append validation-only human messages when readiness passed but other gates failed.
    const details = gate.allowed
      ? [
          ...formatPublishValidationMessages(publishValidation),
          ...buildPublishValidationExplanationLines(publishValidation),
        ]
      : [
          ...formatPublishReadinessDetailLines(gate),
          ...formatPublishValidationMessages(publishValidation).filter(
            (line) => line !== PUBLISH_READINESS_BLOCKED_MESSAGE,
          ),
        ]
    return {
      success: false,
      code: gate.allowed
        ? PUBLISH_VALIDATION_BLOCKED_CODE
        : PUBLISH_READINESS_BLOCKED_CODE,
      message: gate.allowed
        ? (details[0] ?? PUBLISH_READINESS_BLOCKED_MESSAGE)
        : PUBLISH_READINESS_BLOCKED_MESSAGE,
      details,
      publishBundles: buildPublishReadinessBundles(gate, {
        profileId: context.profileId ?? 'current-user',
        opportunityId,
        profileKind: context.profileKind,
      }),
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

export function canShowPublishOpportunity(
  opportunity: Opportunity | null | undefined,
  options?: {
    readonly userId?: string | null
    readonly canMutate?: boolean
    readonly isOpportunityOwner?: boolean
  },
): boolean {
  if (!opportunity?.id) return false
  const context = buildWorkflowContext({
    opportunity,
    user: {
      userId: options?.userId ?? null,
      canMutate: options?.canMutate,
      isOpportunityOwner: options?.isOpportunityOwner ?? false,
    },
  })
  return Boolean(findWorkflowAction(context, 'publish_opportunity'))
}
