/** Canonical participant on PostMatch, Negotiation, Deal, and Contract. */
export type Participant = {
  /** Legacy user-centric id — dual-read with partyId during identity migration. */
  userId: string
  role: string
  /** Canonical marketplace party for this participation row. */
  partyId?: string
  /** Canonical business workspace for this participation row. */
  workspaceId?: string
  representativeUserIds?: string[]
  /** Human who last acted for this party (accept/decline/sign). */
  actorUserId?: string
  actedAt?: string
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
