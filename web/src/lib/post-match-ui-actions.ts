import type { CommandResult } from '@pm-twin/commands'
import { isTerminal } from '@pm-twin/lifecycle'
import type { PostMatch } from '@/types/domain.ts'
import { postMatchRepository } from '@/repositories/index.ts'
import { postMatchCommandService } from '@/services/post-match-command-service.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
} from '@/domain/workflows/workflow-bridge.ts'

const MATCH_ENTITY = 'match' as const

export type PostMatchUiActionResult =
  | { readonly success: true; readonly status: string }
  | { readonly success: false; readonly message: string }

export type PostMatchCommandFn = (
  postMatchId: string,
  userId: string,
) => CommandResult

export type PostMatchUiActionsDeps = {
  readonly acceptPostMatch?: PostMatchCommandFn
  readonly declinePostMatch?: PostMatchCommandFn
  readonly readMatchStatus?: (postMatchId: string) => string | undefined
  readonly canMutate?: boolean
}

function buildPostMatchParticipantContext(
  match: PostMatch,
  userId: string | null | undefined,
  deps?: PostMatchUiActionsDeps,
) {
  return buildWorkflowContext({
    primaryWorkflow: 'marketplace',
    user: {
      userId: userId ?? null,
      canMutate: deps?.canMutate ?? Boolean(userId),
      isParticipant: true,
    },
    postMatch: match,
  })
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Post-match action failed.'
}

function readStatus(
  postMatchId: string,
  deps?: PostMatchUiActionsDeps,
): string {
  const read =
    deps?.readMatchStatus ??
    ((id: string) => postMatchRepository.getById(id)?.status)
  return read(postMatchId) ?? ''
}

export function acceptPostMatchUiAction(
  postMatchId: string,
  userId: string,
  deps?: PostMatchUiActionsDeps,
): PostMatchUiActionResult {
  const accept =
    deps?.acceptPostMatch ??
    postMatchCommandService.acceptPostMatch.bind(postMatchCommandService)
  const result = accept(postMatchId, userId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }
  return { success: true, status: readStatus(postMatchId, deps) }
}

export function declinePostMatchUiAction(
  postMatchId: string,
  userId: string,
  deps?: PostMatchUiActionsDeps,
): PostMatchUiActionResult {
  const decline =
    deps?.declinePostMatch ??
    postMatchCommandService.declinePostMatch.bind(postMatchCommandService)
  const result = decline(postMatchId, userId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }
  return { success: true, status: readStatus(postMatchId, deps) }
}

/** Match statuses where accept/decline are no longer available to any participant. */
export function isPostMatchTerminalForParticipantActions(
  match: PostMatch | null | undefined,
): boolean {
  if (!match?.status) return true
  return isTerminal(MATCH_ENTITY, match.status)
}

export function canShowAcceptPostMatch(
  match: PostMatch | null | undefined,
  userId: string | null | undefined,
  deps?: PostMatchUiActionsDeps,
): boolean {
  if (!match?.id || !userId) return false
  const context = buildPostMatchParticipantContext(match, userId, deps)
  return isWorkflowActionAvailable(context, 'accept_match')
}

export function canShowDeclinePostMatch(
  match: PostMatch | null | undefined,
  userId: string | null | undefined,
  deps?: PostMatchUiActionsDeps,
): boolean {
  if (!match?.id || !userId) return false
  const context = buildPostMatchParticipantContext(match, userId, deps)
  return isWorkflowActionAvailable(context, 'decline_match')
}
