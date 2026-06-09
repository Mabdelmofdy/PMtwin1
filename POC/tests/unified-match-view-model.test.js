import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const umv = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'unified-match-view-model.js'));

describe('unified-match-view-model', () => {
    it('maps opportunity intent labels', () => {
        expect(umv.getOpportunityTypeLabel('request')).toBe('Need');
        expect(umv.getOpportunityTypeLabel('offer')).toBe('Offer');
        expect(umv.getOpportunityTypeLabel('hybrid')).toBe('Need & Offer');
    });

    it('maps match type labels without technical names', () => {
        expect(umv.getMatchTypeLabel('one_way')).toBe('Need/Offer');
        expect(umv.getMatchTypeLabel('two_way')).toBe('Barter');
        expect(umv.getMatchTypeLabel('consortium')).toBe('Consortium role fit');
        expect(umv.getMatchTypeLabel('circular')).toBe('Circular exchange chain');
    });

    it('derives match quality tiers from score', () => {
        expect(umv.getMatchQuality(0.9).label).toBe('Top Match');
        expect(umv.getMatchQuality(0.75).label).toBe('High Match');
        expect(umv.getMatchQuality(0.55).label).toBe('Medium Match');
        expect(umv.getMatchQuality(0.2).label).toBe('Low Match');
    });

    it('builds a unified view model for post_match records', () => {
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-1',
            matchType: 'one_way',
            status: 'pending',
            matchScore: 0.88,
            participants: [
                { userId: 'u1', role: 'need_owner', participantStatus: 'pending' },
                { userId: 'u2', role: 'offer_provider', participantStatus: 'pending' }
            ],
            payload: {
                needOpportunityId: 'need-1',
                offerOpportunityId: 'offer-1',
                breakdown: { skills: 0.9 }
            }
        }, { currentUserId: 'u1' });

        expect(vm.matchTypeLabel).toBe('Need/Offer');
        expect(vm.matchScorePercent).toBe(88);
        expect(vm.sourceType).toBe('post_match');
        expect(vm.availableActions.some(a => a.id === 'view_details')).toBe(true);
    });

    it('resolves viewer-relative opportunity ids for one_way matches', () => {
        const match = {
            matchType: 'one_way',
            participants: [
                { userId: 'need-owner', role: 'need_owner', opportunityId: 'need-1' },
                { userId: 'offer-owner', role: 'offer_provider', opportunityId: 'offer-1' }
            ],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' }
        };
        expect(umv.resolveViewerOpportunityIds(match, 'need-owner', 'one_way')).toEqual({
            viewerId: 'need-1',
            counterpartId: 'offer-1'
        });
        expect(umv.resolveViewerOpportunityIds(match, 'offer-owner', 'one_way')).toEqual({
            viewerId: 'offer-1',
            counterpartId: 'need-1'
        });
    });

    it('shows waiting for others when current user accepted but peers have not', () => {
        const match = {
            status: 'accepted',
            participants: [
                { userId: 'u1', participantStatus: 'accepted' },
                { userId: 'u2', participantStatus: 'pending' }
            ]
        };
        expect(umv.getStatusLabel('accepted', { match, currentUserId: 'u1' })).toBe('Waiting for Others');
    });
});
