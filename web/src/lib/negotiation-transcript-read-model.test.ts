import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Negotiation } from '@/types/domain.ts'
import type {
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import { buildNegotiationTranscriptReadModel } from '@/lib/negotiation-transcript-read-model.ts'
import type { ViewerContext } from '@/lib/entity-view-visibility.ts'

const negotiation: Negotiation = {
  id: 'neg-1',
  status: 'active',
  postMatchId: 'pm-1',
  applicationId: 'app-1',
  participants: [
    { userId: 'user-need', role: 'need_owner', participantStatus: 'accepted' },
    { userId: 'user-offer', role: 'offer_provider', participantStatus: 'accepted' },
  ],
}

const messages: NegotiationMessage[] = [
  {
    id: 'msg-1',
    negotiationId: 'neg-1',
    senderId: 'user-need',
    senderRole: 'need_owner',
    body: 'Hello',
    visibility: 'participants',
    createdAt: '2026-07-01T10:00:00.000Z',
  },
]

const offers: NegotiationOffer[] = [
  {
    id: 'offer-1',
    negotiationId: 'neg-1',
    submittedBy: 'user-offer',
    version: 1,
    terms: { exchangeMode: 'cash', amount: 1000, budget: 1000, paymentSchedule: 'Milestone' },
    status: 'submitted',
    createdAt: '2026-07-01T11:00:00.000Z',
  },
]

const transcriptEvents: NegotiationTranscriptEvent[] = [
  {
    id: 'tx-1',
    negotiationId: 'neg-1',
    eventType: 'message.sent',
    actorId: 'user-need',
    actorRole: 'need_owner',
    timestamp: '2026-07-01T10:00:00.000Z',
    summary: 'Negotiation message sent',
  },
]

const participantViewer: ViewerContext = {
  userId: 'user-need',
  role: 'user',
  canAccessAdmin: false,
}

const auditorViewer: ViewerContext = {
  userId: 'user-auditor',
  role: 'admin',
  canAccessAdmin: true,
}

const deps = {
  getNegotiation: () => negotiation,
  getMessages: () => messages,
  getOffers: () => offers,
  getTranscriptEvents: () => transcriptEvents,
  getAuditEvents: () => [],
  getPostMatch: () => ({ id: 'pm-1', status: 'confirmed' } as never),
  getApplication: () => ({ id: 'app-1', status: 'accepted' } as never),
  getDealByNegotiation: () => ({ id: 'deal-1', status: 'draft', negotiationId: 'neg-1' } as never),
  getContractByDeal: () => ({ id: 'contract-1', dealId: 'deal-1', status: 'draft' } as never),
}

describe('buildNegotiationTranscriptReadModel', () => {
  it('participant can view and write', () => {
    const model = buildNegotiationTranscriptReadModel('neg-1', participantViewer, deps)
    assert.ok(model)
    assert.equal(model.canView, true)
    assert.equal(model.canWrite, true)
    assert.equal(model.isAuditor, false)
    assert.equal(model.messages.length, 1)
    assert.equal(model.offers.length, 1)
  })

  it('auditor can view transcript but cannot write', () => {
    const model = buildNegotiationTranscriptReadModel('neg-1', auditorViewer, deps)
    assert.ok(model)
    assert.equal(model.canView, true)
    assert.equal(model.canWrite, false)
    assert.equal(model.isAuditor, true)
    assert.equal(model.isReadOnly, true)
    assert.equal(model.messages.length, 1)
    assert.equal(model.transcriptEvents.length, 1)
  })

  it('auditor sees linked entities', () => {
    const model = buildNegotiationTranscriptReadModel('neg-1', auditorViewer, deps)
    assert.ok(model)
    assert.equal(model.linkedEntities.postMatch?.id, 'pm-1')
    assert.equal(model.linkedEntities.application?.id, 'app-1')
    assert.equal(model.linkedEntities.deal?.id, 'deal-1')
    assert.equal(model.linkedEntities.contract?.id, 'contract-1')
  })

  it('denies view for non-participant without admin access', () => {
    const model = buildNegotiationTranscriptReadModel('neg-1', {
      userId: 'stranger',
      canAccessAdmin: false,
    }, deps)
    assert.ok(model)
    assert.equal(model.canView, false)
    assert.equal(model.messages.length, 0)
  })
})
