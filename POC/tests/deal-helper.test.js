import { describe, expect, it } from 'vitest';
import { createDealFromMatch } from '../src/utils/deals.js';

describe('createDealFromMatch helper', () => {
    it('rejects a match before it is confirmed', () => {
        expect(() => createDealFromMatch({
            id: 'pm-1',
            status: 'pending',
            matchType: 'one_way',
            participants: [
                { userId: 'u-need', role: 'need_owner' },
                { userId: 'u-offer', role: 'offer_provider' }
            ],
            payload: {
                needOpportunityId: 'need-1',
                offerOpportunityId: 'offer-1'
            }
        })).toThrow(/confirmed/);
    });

    it('builds a deal payload from a confirmed match', () => {
        const payload = createDealFromMatch({
            id: 'pm-2',
            status: 'confirmed',
            matchType: 'one_way',
            participants: [
                { userId: 'u-need', role: 'need_owner' },
                { userId: 'u-offer', role: 'offer_provider' }
            ],
            payload: {
                needOpportunityId: 'need-2',
                offerOpportunityId: 'offer-2'
            }
        });

        expect(payload.matchId).toBe('pm-2');
        expect(payload.opportunityIds).toEqual(['need-2', 'offer-2']);
        expect(payload.participants).toHaveLength(2);
    });
});
