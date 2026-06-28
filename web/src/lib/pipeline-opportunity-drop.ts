import type { CommandResult } from '@pm-twin/commands'
import { OPP_STAGE_TO_STATUS } from '@/lib/applications.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import {
  publishOpportunityUiAction,
  type PublishOrchestrationDeps,
} from '@/lib/publish-opportunity-ui-actions.ts'
import {
  resolvePublishReadinessContextForOpportunity,
  type PublishReadinessUiContext,
} from '@/lib/resolve-publish-readiness-context.ts'
import {
  createOpportunityCommandService,
  opportunityCommandService,
} from '@/services/opportunity-command-service.ts'
import type { Opportunity } from '@/types/domain.ts'

export const CONTRACT_LIFECYCLE_MANAGED_OPPORTUNITY_STATUSES = [
  'executing',
  'completed',
  'cancelled',
] as const

export const CONTRACT_LIFECYCLE_DRAG_MESSAGE =
  'This opportunity status is managed by the contract lifecycle.'

export type PipelinePublishMatchingSummary = {
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrors: readonly string[]
}

export type PipelineOpportunityDropResult =
  | { readonly success: true; readonly matching?: PipelinePublishMatchingSummary }
  | { readonly success: false; readonly message: string }

export type TransitionOpportunityStatusFn = (
  opportunityId: string,
  targetStatus: string,
) => CommandResult

export type PipelineOpportunityDropDeps = PublishOrchestrationDeps & {
  readonly readOpportunity?: (id: string) => Opportunity | undefined
  readonly resolvePublishReadinessContext?: (
    opportunity: Opportunity,
  ) => PublishReadinessUiContext
  readonly transitionOpportunityStatus?: TransitionOpportunityStatusFn
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('\n')
  }
  return 'Opportunity status could not be updated.'
}

export function isContractLifecycleManagedOpportunityStatus(
  status: string | undefined | null,
): boolean {
  const canonical = resolveCanonicalStatus('opportunity', status)
  return (
    CONTRACT_LIFECYCLE_MANAGED_OPPORTUNITY_STATUSES as readonly string[]
  ).includes(canonical)
}

export function pipelineOpportunityDrop(
  opportunityId: string,
  stageKey: string,
  deps?: PipelineOpportunityDropDeps,
): PipelineOpportunityDropResult {
  const status = OPP_STAGE_TO_STATUS[stageKey]
  if (!status) {
    return { success: false, message: 'Invalid pipeline stage.' }
  }

  const readOpportunity =
    deps?.readOpportunity ?? ((id: string) => opportunitiesApi.get(id))
  const opportunity = readOpportunity(opportunityId)
  if (
    opportunity &&
    isContractLifecycleManagedOpportunityStatus(opportunity.status)
  ) {
    return { success: false, message: CONTRACT_LIFECYCLE_DRAG_MESSAGE }
  }

  if (status === 'published') {
    if (!opportunity) {
      return { success: false, message: 'Opportunity not found.' }
    }

    const resolvePublishContext =
      deps?.resolvePublishReadinessContext
      ?? resolvePublishReadinessContextForOpportunity

    const publishResult = publishOpportunityUiAction(
      opportunityId,
      resolvePublishContext(opportunity),
      {
        transitionOpportunityStatus: deps?.transitionOpportunityStatus,
        runPublishMatching: deps?.runPublishMatching,
      },
    )

    if (!publishResult.success) {
      return { success: false, message: publishResult.message }
    }

    return {
      success: true,
      matching: {
        discoveredMatchesCount: publishResult.discoveredMatchesCount,
        skippedDuplicatesCount: publishResult.skippedDuplicatesCount,
        matchingErrors: publishResult.matchingErrors,
      },
    }
  }

  const transitionOpportunityStatus =
    deps?.transitionOpportunityStatus ??
    opportunityCommandService.transitionOpportunityStatus.bind(
      opportunityCommandService,
    )
  const result = transitionOpportunityStatus(opportunityId, status)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }
  return { success: true }
}

export { createOpportunityCommandService }
