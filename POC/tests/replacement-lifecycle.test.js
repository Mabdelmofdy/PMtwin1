import { describe, expect, it } from 'vitest';
import * as rlc from '../src/services/matching/replacement-lifecycle.js';

describe('replacement-lifecycle', () => {
    it('detects consortium and circular as replacement-eligible', () => {
        expect(rlc.isReplacementEligibleMatchType('consortium')).toBe(true);
        expect(rlc.isReplacementEligibleMatchType('circular')).toBe(true);
        expect(rlc.isReplacementEligibleMatchType('one_way')).toBe(false);
    });

    it('builds stable slot keys', () => {
        expect(rlc.buildReplacementSlotKey('u1', 'lead', 'opp1')).toBe('u1::lead::opp1');
    });

    it('maps friendly replacement status labels', () => {
        expect(rlc.getReplacementRequestStatusLabel('pending_owner_review')).toBe('Replacement Suggested');
        expect(rlc.getReplacementRequestStatusLabel('replacement_accepted')).toBe('Replacement Accepted');
        expect(rlc.getReplacementRequestStatusLabel('completed')).toBe('Replaced');
    });

    it('checks invitation actor match', () => {
        expect(rlc.invitationAcceptsActor({ invitedUserId: 'u2' }, 'u2', null)).toBe(true);
        expect(rlc.invitationAcceptsActor({ invitedCompanyId: 'c1' }, 'u9', 'c1')).toBe(true);
        expect(rlc.invitationAcceptsActor({ invitedUserId: 'u2' }, 'u3', null)).toBe(false);
    });
});
