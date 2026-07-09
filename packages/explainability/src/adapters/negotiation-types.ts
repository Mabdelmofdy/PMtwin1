export type NegotiationStatus =
  | 'active'
  | 'countered'
  | 'agreed'
  | 'expired'
  | 'cancelled'

export type NegotiationOfferSnapshot = {
  readonly amount?: number
  readonly currency?: string
  readonly termsSummary?: string
  readonly submittedAt?: string
  readonly submittedBy?: string
}

export type CommercialTermsGap = {
  readonly field: string
  readonly label: string
  readonly priorValue?: string
  readonly proposedValue?: string
  readonly changeSummary?: string
}

export type NegotiationTimelineEventSnapshot = {
  readonly type: string
  readonly title: string
  readonly description: string
  readonly timestamp: string
  readonly status?: string
}

/**
 * Minimal snapshot of negotiation state — decoupled from web transcript read model.
 * Web callers map `NegotiationTranscriptReadModel` into this shape (E7).
 */
export type NegotiationExplainabilitySnapshot = {
  readonly entityId: string
  readonly status: NegotiationStatus
  readonly currentOffer?: NegotiationOfferSnapshot
  readonly acceptedOffer?: NegotiationOfferSnapshot | null
  readonly pendingCounterOffer?: boolean
  readonly commercialTermsGaps?: readonly CommercialTermsGap[]
  readonly priceGap?: {
    readonly percent?: number
    readonly absolute?: number
    readonly currency?: string
  }
  readonly responseDelayDays?: number
  readonly changesRequested?: boolean
  readonly reviewNotes?: string
  readonly requestedItems?: readonly string[]
  readonly offerCount?: number
  readonly counterOfferCount?: number
  readonly timelineEvents?: readonly NegotiationTimelineEventSnapshot[]
  readonly evaluatedAt?: string
  readonly locale?: string
}
