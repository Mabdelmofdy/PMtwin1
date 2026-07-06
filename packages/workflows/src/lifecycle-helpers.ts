import { allowedTransitions, isTerminal, toCanonical } from '@pm-twin/lifecycle'

export function canonicalEntityStatus(
  entity: string,
  status: string | undefined,
): string {
  return toCanonical(entity, status ?? '') ?? (status ?? '').toLowerCase()
}

export function isEntityTerminal(
  entity: string,
  status: string | undefined,
): boolean {
  if (!status) return false
  return isTerminal(entity, status)
}

export function canEntityTransition(
  entity: string,
  currentStatus: string | undefined,
  targetStatus: string,
): boolean {
  if (!currentStatus) return false
  const allowed = allowedTransitions(entity, currentStatus)
  const target = toCanonical(entity, targetStatus)
  if (!target) return false
  return allowed.includes(target)
}

export function isParticipantPending(
  participant: { participantStatus?: string } | undefined,
): boolean {
  const status = (participant?.participantStatus ?? 'pending').toLowerCase()
  return status !== 'accepted' && status !== 'declined'
}

export function findParticipant(
  participants: readonly { userId: string; participantStatus?: string }[] | undefined,
  userId: string | null | undefined,
) {
  if (!userId || !participants) return undefined
  return participants.find((participant) => participant.userId === userId)
}
