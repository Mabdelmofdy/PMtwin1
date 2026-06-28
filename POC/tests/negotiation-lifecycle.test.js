import { describe, expect, it } from 'vitest';
import * as nlc from '../src/services/matching/negotiation-lifecycle.js';
import {
    buildFinalAgreedSnapshot,
    getNegotiationRequiredParticipantIds,
    allRequiredParticipantsAgreed,
    hasParticipantAgreed
} from '../src/services/matching/negotiation-lifecycle.js';

describe('negotiation-lifecycle', () => {
    it('detects active negotiations', () => {
        expect(nlc.isActiveNegotiation({ status: 'open' })).toBe(true);
        expect(nlc.isActiveNegotiation({ status: 'active' })).toBe(true);
        expect(nlc.isActiveNegotiation({ status: 'counter_offered' })).toBe(true);
        expect(nlc.canonicalNegotiationStatus('counter_offered')).toBe('countered');
        expect(nlc.isActiveNegotiation({ status: 'agreed' })).toBe(false);
        expect(nlc.isActiveNegotiation({ status: 'cancelled' })).toBe(false);
        expect(nlc.isActiveNegotiation({ status: 'expired' })).toBe(false);
    });

    it('maps legacy open to active at helper boundary', () => {
        expect(nlc.canonicalNegotiationStatus('open')).toBe('active');
        expect(nlc.canonicalNegotiationStatus('active')).toBe('active');
    });

    it('keeps terminal negotiations non-active', () => {
        expect(nlc.isTerminalNegotiation({ status: 'agreed' })).toBe(true);
        expect(nlc.isTerminalNegotiation({ status: 'cancelled' })).toBe(true);
        expect(nlc.isTerminalNegotiation({ status: 'expired' })).toBe(true);
        expect(nlc.isTerminalNegotiation({ status: 'failed' })).toBe(true);
        expect(nlc.isActiveNegotiation({ status: 'failed' })).toBe(false);
    });

    it('maps friendly status labels', () => {
        expect(nlc.getNegotiationStatusLabel('open')).toBe('Negotiation Open');
        expect(nlc.getNegotiationStatusLabel('agreed')).toBe('Terms Agreed');
        expect(nlc.getNegotiationStatusLabel('cancelled')).toBe('Negotiation Cancelled');
    });
});

describe('buildFinalAgreedSnapshot', () => {
    it('captures scope, parties, match metadata and agreedBy', () => {
        const agreedAt = '2026-05-18T10:00:00.000Z';
        const snapshot = buildFinalAgreedSnapshot({
            negotiation: {
                id: 'neg-1',
                matchId: 'm-1',
                applicationId: 'app-1',
                opportunityId: 'opp-1',
                parties: [{ userId: 'u1', role: 'owner' }, { userId: 'u2', role: 'provider' }]
            },
            match: { matchType: 'one_way', invitationId: 'inv-1' },
            terms: { scope: 'Deliver API', value: 1000, currency: 'SAR', startDate: '2026-06-01', endDate: '2026-12-01' },
            actorUserId: 'u1',
            agreedAt
        });
        expect(snapshot.scope).toBe('Deliver API');
        expect(snapshot.matchId).toBe('m-1');
        expect(snapshot.matchType).toBe('one_way');
        expect(snapshot.applicationId).toBe('app-1');
        expect(snapshot.invitationId).toBe('inv-1');
        expect(snapshot.negotiationId).toBe('neg-1');
        expect(snapshot.opportunityIds).toEqual(['opp-1']);
        expect(snapshot.participants).toHaveLength(2);
        expect(snapshot.agreedBy).toEqual([{ userId: 'u1', agreedAt }]);
        expect(snapshot.agreementMode).toBe('single_party_mvp');
        expect(snapshot.valueTerms.agreedValue).toEqual({ amount: 1000, currency: 'SAR' });
    });

    it('uses multi_party agreementMode when all required participants agreed', () => {
        const negotiation = {
            id: 'neg-2',
            parties: [{ userId: 'u1' }, { userId: 'u2' }]
        };
        expect(getNegotiationRequiredParticipantIds(negotiation)).toEqual(['u1', 'u2']);
        const agreements = [
            { userId: 'u1', agreedAt: '2026-05-18T10:00:00.000Z' },
            { userId: 'u2', agreedAt: '2026-05-18T10:05:00.000Z' }
        ];
        expect(allRequiredParticipantsAgreed(negotiation, agreements)).toBe(true);
        const snapshot = buildFinalAgreedSnapshot({
            negotiation,
            terms: { scope: 'Work' },
            actorUserId: 'u1',
            agreedAt: '2026-05-18T10:05:00.000Z',
            agreedBy: agreements,
            multiParty: true
        });
        expect(snapshot.agreementMode).toBe('multi_party');
    });
});

describe('participant agreement helpers', () => {
    it('detects prior agreement', () => {
        const neg = {
            participantAgreements: [{ userId: 'u1', agreedAt: '2026-01-01T00:00:00.000Z' }]
        };
        expect(hasParticipantAgreed(neg, 'u1')).toBe(true);
        expect(hasParticipantAgreed(neg, 'u2')).toBe(false);
    });
});
