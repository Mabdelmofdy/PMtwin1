import type {
  NegotiationExplainabilitySnapshot,
  NegotiationStatus,
} from '@pm-twin/explainability'
import type { Negotiation } from '@/types/domain.ts'
import type { NegotiationTranscriptReadModel } from '@/lib/negotiation-transcript-read-model.ts'

const NEGOTIATION_STATUSES = new Set<NegotiationStatus>([
  'active',
  'countered',
  'agreed',
  'expired',
  'cancelled',
])

function normalizeNegotiationStatus(status: string): NegotiationStatus {
  const key = status.trim().toLowerCase()
  if (key === 'open') return 'active'
  if (key === 'counter_offered') return 'countered'
  return NEGOTIATION_STATUSES.has(key as NegotiationStatus)
    ? (key as NegotiationStatus)
    : 'active'
}

function resolveOfferAmount(
  terms: NegotiationTranscriptReadModel['offers'][number]['terms'],
): number | undefined {
  const value = terms.amount
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export type NegotiationSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

export function buildNegotiationExplainabilitySnapshot(
  negotiation: Negotiation,
  transcript?: NegotiationTranscriptReadModel | null,
  options?: NegotiationSnapshotOptions,
): NegotiationExplainabilitySnapshot {
  const offers = transcript?.offers ?? []
  const latestOffer = offers.at(-1)
  const counterOfferCount = offers.filter((offer) => offer.version > 1).length
  const pendingCounterOffer =
    negotiation.status === 'countered' || negotiation.status === 'counter_offered'

  return {
    entityId: negotiation.id,
    status: normalizeNegotiationStatus(negotiation.status),
    currentOffer: latestOffer
      ? {
          amount: resolveOfferAmount(latestOffer.terms),
          currency:
            typeof latestOffer.terms.currency === 'string'
              ? latestOffer.terms.currency
              : undefined,
          termsSummary: latestOffer.changeSummary,
          submittedAt: latestOffer.createdAt,
          submittedBy: latestOffer.submittedBy,
        }
      : undefined,
    acceptedOffer: transcript?.acceptedOffer
      ? {
          amount: resolveOfferAmount(transcript.acceptedOffer.terms),
          currency:
            typeof transcript.acceptedOffer.terms.currency === 'string'
              ? transcript.acceptedOffer.terms.currency
              : undefined,
          termsSummary: transcript.acceptedOffer.changeSummary,
          submittedAt: transcript.acceptedOffer.createdAt,
          submittedBy: transcript.acceptedOffer.submittedBy,
        }
      : null,
    pendingCounterOffer,
    offerCount: offers.length,
    counterOfferCount,
    timelineEvents: (transcript?.transcriptEvents ?? []).map((event) => ({
      type: event.eventType,
      title: event.summary,
      description: event.summary,
      timestamp: event.timestamp,
    })),
    evaluatedAt: options?.evaluatedAt ?? negotiation.updatedAt ?? negotiation.createdAt,
    locale: options?.locale ?? 'en-SA',
  }
}
