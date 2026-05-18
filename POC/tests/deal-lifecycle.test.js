import { describe, expect, it } from 'vitest';
import * as dlc from '../src/services/matching/deal-lifecycle.js';
import { buildDealPayloadFromApplication } from '../src/utils/deals.js';

describe('deal-lifecycle', () => {
    it('detects deal source type', () => {
        expect(dlc.getDealSourceType({ matchId: 'm1' })).toBe('match');
        expect(dlc.getDealSourceType({ applicationId: 'a1' })).toBe('application');
        expect(dlc.getDealSourceType({ negotiationId: 'n1', applicationId: 'a1' })).toBe('negotiation');
    });

    it('maps friendly source labels', () => {
        expect(dlc.getDealSourceLabel({ matchId: 'm1' })).toBe('From Match');
        expect(dlc.getDealSourceLabel({ applicationId: 'a1' })).toBe('From Application');
    });

    it('validates creation prerequisites', () => {
        expect(dlc.canCreateDealFromMatch({ id: 'pm-1', status: 'confirmed' })).toBe(true);
        expect(dlc.canCreateDealFromMatch({ id: 'pm-2', status: 'pending' })).toBe(false);
        expect(dlc.canCreateDealFromApplication({ id: 'app-1', status: 'accepted' })).toBe(true);
        expect(dlc.canCreateDealFromNegotiation({ id: 'neg-1', status: 'agreed' })).toBe(true);
    });
});

describe('buildDealPayloadFromApplication', () => {
    it('builds payload for accepted application', () => {
        const payload = buildDealPayloadFromApplication(
            { id: 'app-1', status: 'accepted', applicantId: 'u2', matchId: 'pm-1' },
            { id: 'opp-1', creatorId: 'u1', title: 'Need X' }
        );
        expect(payload.applicationId).toBe('app-1');
        expect(payload.matchId).toBe('pm-1');
        expect(payload.participants).toHaveLength(2);
    });

    it('rejects non-accepted applications', () => {
        expect(() => buildDealPayloadFromApplication(
            { id: 'app-1', status: 'pending', applicantId: 'u2' },
            { id: 'opp-1', creatorId: 'u1' }
        )).toThrow(/accepted/);
    });
});
