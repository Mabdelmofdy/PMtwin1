/** Canonical participant on PostMatch, Negotiation, Deal, and Contract. */
export type Participant = {
  userId: string
  role: string
  opportunityId?: string
  participantStatus?: string
  approvalStatus?: string
  respondedAt?: string | null
  signedAt?: string | null
}

/** @deprecated Alias — use Participant. Seed JSON may still use `parties`. */
export type Party = Participant

export function normalizeParticipants(
  participants?: Participant[] | null,
  parties?: Participant[] | null,
): Participant[] {
  const list = participants ?? parties ?? []
  return list.map((p) => ({ ...p }))
}
