import type { CommandResult } from '@pm-twin/commands'
import { isTerminal, toCanonical } from '@pm-twin/lifecycle'
import type { PostMatch } from '@/types/domain.ts'
import { postMatchRepository } from '@/repositories/index.ts'
import { postMatchCommandService } from '@/services/post-match-command-service.ts'

const MATCH_ENTITY = 'match' as const
const PARTICIPANT_RESPONDED_STATUSES = new Set(['accepted', 'declined'])

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

function participantResponseStatus(
  match: PostMatch,
  userId: string,
): string | undefined {
  return match.participants.find((participant) => participant.userId === userId)
    ?.participantStatus
}

function isParticipantPendingResponse(
  match: PostMatch,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false
  const participant = match.participants.find((p) => p.userId === userId)
  if (!participant) return false
  const status = (participant.participantStatus ?? 'pending').toLowerCase()
  return !PARTICIPANT_RESPONDED_STATUSES.has(status)
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
): boolean {
  if (!match?.id || !userId) return false
  if (isPostMatchTerminalForParticipantActions(match)) return false

  const canonical = toCanonical(MATCH_ENTITY, match.status ?? '') ?? ''
  if (!['discovered', 'accepted'].includes(canonical)) return false
  if (!isParticipantPendingResponse(match, userId)) return false

  return Boolean(match.participants.some((participant) => participant.userId === userId))
}

export function canShowDeclinePostMatch(
  match: PostMatch | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!match?.id || !userId) return false
  if (isPostMatchTerminalForParticipantActions(match)) return false

  const canonical = toCanonical(MATCH_ENTITY, match.status ?? '') ?? ''
  if (!['discovered', 'accepted'].includes(canonical)) return false

  const response = participantResponseStatus(match, userId)?.toLowerCase()
  if (response === 'declined') return false

  return Boolean(match.participants.some((participant) => participant.userId === userId))
}
