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

export type FindParticipantOptions = {
  readonly activePartyId?: string | null
}

export function findParticipant(
  participants:
    | readonly {
        userId: string
        participantStatus?: string
        partyId?: string
        representativeUserIds?: readonly string[]
      }[]
    | undefined,
  userId: string | null | undefined,
  options?: FindParticipantOptions,
) {
  if (!userId || !participants) return undefined
  return participants.find((participant) => {
    if (participant.userId === userId) return true
    if (participant.representativeUserIds?.includes(userId)) return true
    if (
      options?.activePartyId &&
      participant.partyId &&
      participant.partyId === options.activePartyId
    ) {
      return true
    }
    return false
  })
}
