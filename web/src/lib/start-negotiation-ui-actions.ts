import type { CommandResult } from '@pm-twin/commands'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { negotiationCommandService } from '@/services/negotiation-command-service.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
} from '@/domain/workflows/workflow-bridge.ts'

export type StartNegotiationUiActionResult =
  | { readonly success: true; readonly negotiationId: string }
  | { readonly success: false; readonly message: string }

export type StartNegotiationUiActionsDeps = {
  readonly startNegotiationFromPostMatch?: (postMatchId: string) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly getNegotiationsForPostMatch?: (
    postMatchId: string,
  ) => readonly Negotiation[]
  readonly userId?: string | null
  readonly canMutate?: boolean
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Negotiation could not be started.'
}

function resolveNegotiationsForPostMatch(
  postMatchId: string,
  deps?: StartNegotiationUiActionsDeps,
): readonly Negotiation[] {
  const read =
    deps?.getNegotiationsForPostMatch
    ?? ((id: string) => negotiationsApi.getByPostMatchId(id))
  return read(postMatchId)
}

function buildPostMatchWorkflowContext(
  match: PostMatch,
  deps?: StartNegotiationUiActionsDeps,
) {
  return buildWorkflowContext({
    primaryWorkflow: 'marketplace',
    user: {
      userId: deps?.userId ?? null,
      canMutate: deps?.canMutate ?? true,
      isParticipant: true,
    },
    postMatch: match,
    linkage: {
      negotiationsForPostMatch: resolveNegotiationsForPostMatch(match.id, deps).map(
        (negotiation) => ({
          id: negotiation.id,
          status: negotiation.status,
          postMatchId: negotiation.postMatchId ?? negotiation.matchId,
        }),
      ),
    },
  })
}

export function canShowStartNegotiationFromPostMatch(
  match: PostMatch | null | undefined,
  deps?: StartNegotiationUiActionsDeps,
): boolean {
  if (!match?.id) return false
  const context = buildPostMatchWorkflowContext(match, deps)
  return isWorkflowActionAvailable(context, 'start_negotiation_from_post_match')
}

export function startNegotiationFromPostMatchUiAction(
  postMatchId: string,
  deps?: StartNegotiationUiActionsDeps,
): StartNegotiationUiActionResult {
  const start =
    deps?.startNegotiationFromPostMatch
    ?? negotiationCommandService.startNegotiationFromPostMatch.bind(
      negotiationCommandService,
    )

  const { result, negotiation } = start(postMatchId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const negotiationId = negotiation?.id ?? result.aggregateId
  if (!negotiationId) {
    return {
      success: false,
      message: 'Negotiation could not be started. No negotiation record returned.',
    }
  }

  return { success: true, negotiationId }
}
