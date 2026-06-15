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

    it('caps displayed match score percent at 100', () => {
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-over',
            matchType: 'one_way',
            status: 'pending',
            matchScore: 1.275,
            participants: [],
            payload: {}
        });
        expect(vm.matchScorePercent).toBe(100);
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

    it('resolveMatchMessageRoute prefers a valid messages path', () => {
        expect(umv.resolveMatchMessageRoute(
            [{ userId: 'u1' }, { userId: 'u2' }],
            'u1',
            '/messages/u2'
        )).toBe('/messages/u2');
    });

    it('resolveMatchMessageRoute finds the first other participant', () => {
        expect(umv.resolveMatchMessageRoute(
            [{ userId: 'lead' }, { userId: 'member' }],
            'lead'
        )).toBe('/messages/member');
    });

    it('includes Message in available actions when messageRoute is set', () => {
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-consortium',
            matchType: 'consortium',
            status: 'confirmed',
            matchScore: 0.88,
            participants: [
                { userId: 'lead', role: 'consortium_lead', participantStatus: 'accepted' },
                { userId: 'member', role: 'consortium_member', participantStatus: 'accepted' }
            ],
            payload: { leadNeedId: 'need-1' }
        }, { currentUserId: 'lead' });
        vm.messageRoute = '/messages/member';
        const actions = umv.getAvailableActions(vm);
        expect(actions.some(a => a.id === 'message' && a.route === '/messages/member')).toBe(true);
    });

    it('routes open negotiation action to match detail negotiation section', () => {
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-neg',
            matchType: 'one_way',
            status: 'pending',
            matchScore: 0.8,
            participants: [
                { userId: 'u1', role: 'need_owner', participantStatus: 'accepted' },
                { userId: 'u2', role: 'offer_provider', participantStatus: 'accepted' }
            ],
            payload: {}
        }, { currentUserId: 'u1' });
        vm.hasActiveNegotiation = true;
        vm.hasAgreedNegotiation = false;
        vm.negotiationId = 'neg-open-1';
        vm.negotiationCancelled = false;
        vm.isExpired = false;
        const actions = umv.getAvailableActions(vm);
        const negotiate = actions.find(a => a.id === 'negotiate');
        expect(negotiate?.label).toBe('Continue in Value Negotiation');
        expect(negotiate?.route).toBe('/matches/pm-neg?section=negotiation');
    });

    it('includes Create Deal for agreed negotiation without deal', () => {
        const vm = umv.buildUnifiedMatchViewModel({
            id: 'pm-agreed',
            matchType: 'one_way',
            status: 'pending',
            matchScore: 0.8,
            participants: [
                { userId: 'u1', role: 'need_owner', participantStatus: 'accepted' },
                { userId: 'u2', role: 'offer_provider', participantStatus: 'accepted' }
            ],
            payload: {}
        }, { currentUserId: 'u2' });
        vm.hasActiveNegotiation = false;
        vm.hasAgreedNegotiation = true;
        vm.negotiationId = 'neg-agreed-1';
        vm.negotiationCancelled = false;
        vm.isExpired = false;
        vm.dealId = null;
        const actions = umv.getAvailableActions(vm);
        expect(actions.some(a =>
            a.id === 'create_deal_from_negotiation'
            && a.label === 'Create Deal'
            && a.route === '/matches/pm-agreed?section=negotiation'
        )).toBe(true);
    });
});
