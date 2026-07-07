import type { AuditEntry, Contract, Deal, Negotiation, PostMatch } from '@/types/domain.ts'
import type {
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
import { diffCommercialTerms } from '@/domain/negotiation/validate-offer-terms.ts'
import type { ViewerContext } from '@/lib/entity-view-visibility.ts'
import {
  canMutateNegotiationDetail,
  canViewNegotiationDetail,
} from '@/lib/entity-view-visibility.ts'
import type { Application } from '@/types/domain.ts'

export type NegotiationTranscriptLinkedEntities = {
  readonly postMatch: PostMatch | null
  readonly application: Application | null
  readonly deal: Deal | null
  readonly contract: Contract | null
}

export type NegotiationCommercialTermsTimelineEntry = {
  readonly offerId: string
  readonly version: number
  readonly status: NegotiationOffer['status']
  readonly submittedBy: string
  readonly createdAt: string
  readonly changeSummary?: string
  readonly terms: CommercialTerms
  readonly diffFromPrevious: readonly string[]
}

export type NegotiationTranscriptReadModel = {
  readonly negotiationId: string
  readonly canView: boolean
  readonly canWrite: boolean
  readonly isAuditor: boolean
  readonly isReadOnly: boolean
  readonly messages: readonly NegotiationMessage[]
  readonly offers: readonly NegotiationOffer[]
  readonly transcriptEvents: readonly NegotiationTranscriptEvent[]
  readonly commercialTermsTimeline: readonly NegotiationCommercialTermsTimelineEntry[]
  readonly auditEvents: readonly AuditEntry[]
  readonly linkedEntities: NegotiationTranscriptLinkedEntities
  readonly acceptedOffer: NegotiationOffer | null
}

export type NegotiationTranscriptReadModelDeps = {
  readonly getNegotiation: (id: string) => Negotiation | undefined
  readonly getMessages: (negotiationId: string) => readonly NegotiationMessage[]
  readonly getOffers: (negotiationId: string) => readonly NegotiationOffer[]
  readonly getTranscriptEvents: (negotiationId: string) => readonly NegotiationTranscriptEvent[]
  readonly getAuditEvents?: (negotiationId: string) => readonly AuditEntry[]
  readonly getPostMatch?: (id: string) => PostMatch | undefined
  readonly getApplication?: (id: string) => Application | undefined
  readonly getDealByNegotiation?: (negotiationId: string) => Deal | undefined
  readonly getContractByDeal?: (dealId: string) => Contract | undefined
}

const AUDITOR_ROLES = new Set(['auditor', 'admin', 'moderator'])

export function buildNegotiationTranscriptReadModel(
  negotiationId: string,
  viewer: ViewerContext,
  deps: NegotiationTranscriptReadModelDeps,
): NegotiationTranscriptReadModel | null {
  const negotiation = deps.getNegotiation(negotiationId)
  if (!negotiation) return null

  const canView = canViewNegotiationDetail(negotiation, viewer)
  const canWrite = canMutateNegotiationDetail(negotiation, viewer)
  const isAuditor =
    Boolean(viewer.canAccessAdmin)
    && Boolean(viewer.role && AUDITOR_ROLES.has(viewer.role))
    && !canWrite

  if (!canView) {
    return {
      negotiationId,
      canView: false,
      canWrite: false,
      isAuditor: false,
      isReadOnly: true,
      messages: [],
      offers: [],
      transcriptEvents: [],
      commercialTermsTimeline: [],
      auditEvents: [],
      linkedEntities: {
        postMatch: null,
        application: null,
        deal: null,
        contract: null,
      },
      acceptedOffer: null,
    }
  }

  const messages = deps.getMessages(negotiationId)
  const offers = deps.getOffers(negotiationId)
  const transcriptEvents = deps.getTranscriptEvents(negotiationId)
  const auditEvents =
    deps.getAuditEvents?.(negotiationId)
    ?? []

  let previousTerms: CommercialTerms | undefined
  const commercialTermsTimeline = offers.map((offer) => {
    const diffFromPrevious = diffCommercialTerms(previousTerms, offer.terms)
    previousTerms = offer.terms
    return {
      offerId: offer.id,
      version: offer.version,
      status: offer.status,
      submittedBy: offer.submittedBy,
      createdAt: offer.createdAt,
      changeSummary: offer.changeSummary,
      terms: offer.terms,
      diffFromPrevious,
    }
  })

  const deal = deps.getDealByNegotiation?.(negotiationId) ?? null
  const contract = deal?.id ? deps.getContractByDeal?.(deal.id) ?? null : null

  return {
    negotiationId,
    canView: true,
    canWrite,
    isAuditor,
    isReadOnly: !canWrite,
    messages,
    offers,
    transcriptEvents,
    commercialTermsTimeline,
    auditEvents,
    linkedEntities: {
      postMatch: negotiation.postMatchId
        ? deps.getPostMatch?.(negotiation.postMatchId) ?? null
        : null,
      application: negotiation.applicationId
        ? deps.getApplication?.(negotiation.applicationId) ?? null
        : null,
      deal: deal ?? null,
      contract,
    },
    acceptedOffer: offers.find((offer) => offer.status === 'accepted') ?? null,
  }
}
