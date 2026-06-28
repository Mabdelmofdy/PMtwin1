/**
 * Phase 5 — StartNegotiationFromPostMatch POC alignment.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStorage, createTestConfig } from './helpers/matching-lifecycle-test-config.js';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let DataService;

function buildConfig() {
    const base = createTestConfig();
    return {
        ...base,
        POST_MATCH_STATUS: {
            DISCOVERED: 'discovered',
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            DECLINED: 'declined',
            CONFIRMED: 'confirmed',
            EXPIRED: 'expired',
            SUPERSEDED: 'superseded'
        },
        MATCHING: {
            ...base.MATCHING,
            LEGACY_PERSON_OPPORTUNITY_ENABLED: false
        }
    };
}

function confirmedPostMatch(overrides = {}) {
    return {
        id: 'pm-confirmed',
        matchType: 'one_way',
        status: CONFIG.POST_MATCH_STATUS.CONFIRMED,
        matchScore: 0.9,
        participants: [
            {
                userId: 'u-need',
                role: 'need_owner',
                opportunityId: 'need-1',
                participantStatus: 'accepted'
            },
            {
                userId: 'u-offer',
                role: 'offer_provider',
                opportunityId: 'offer-1',
                participantStatus: 'accepted'
            }
        ],
        payload: {
            needOpportunityId: 'need-1',
            offerOpportunityId: 'offer-1'
        },
        ...overrides
    };
}

function freshDataService(postMatches = []) {
    const ds = new DataService();
    const storage = createMemoryStorage();
    storage.initialize({
        [CONFIG.STORAGE_KEYS.POST_MATCHES]: postMatches,
        [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
        [CONFIG.STORAGE_KEYS.DEALS]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [
            { id: 'need-1', title: 'Need', status: 'published', creatorId: 'u-need' },
            { id: 'offer-1', title: 'Offer', status: 'published', creatorId: 'u-offer' }
        ],
        [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
        [CONFIG.STORAGE_KEYS.AUDIT]: []
    });
    ds.storage = storage;
    return ds;
}

beforeAll(async () => {
    global.window = global;
    global.CONFIG = buildConfig();
    global.storageService = createMemoryStorage();
    ({ DataService } = await import('../src/core/data/data-service.js'));
});

describe('startNegotiationFromMatch (PostMatch Phase 5)', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService([confirmedPostMatch()]);
    });

    it('confirmed PostMatch can start negotiation with active status and links', async () => {
        const negotiation = await ds.startNegotiationFromMatch('pm-confirmed', 'u-need');

        expect(negotiation).toBeTruthy();
        expect(negotiation.status).toBe('active');
        expect(negotiation.postMatchId).toBe('pm-confirmed');
        expect(negotiation.matchId).toBe('pm-confirmed');
        expect(negotiation.needOpportunityId).toBe('need-1');
        expect(negotiation.offerOpportunityId).toBe('offer-1');
        expect(negotiation.parties).toHaveLength(2);

        const postMatch = (await ds.getPostMatches()).find(m => m.id === 'pm-confirmed');
        expect(postMatch.negotiationId).toBe(negotiation.id);

        const deals = await ds.getDeals();
        expect(deals).toHaveLength(0);
    });

    it('discovered PostMatch cannot start negotiation', async () => {
        ds = freshDataService([confirmedPostMatch({
            id: 'pm-discovered',
            status: CONFIG.POST_MATCH_STATUS.DISCOVERED
        })]);

        await expect(
            ds.startNegotiationFromMatch('pm-discovered', 'u-need')
        ).rejects.toThrow(/confirmed PostMatch/i);
    });

    it('accepted PostMatch cannot start negotiation', async () => {
        ds = freshDataService([confirmedPostMatch({
            id: 'pm-accepted',
            status: CONFIG.POST_MATCH_STATUS.ACCEPTED
        })]);

        await expect(
            ds.startNegotiationFromMatch('pm-accepted', 'u-need')
        ).rejects.toThrow(/confirmed PostMatch/i);
    });

    it('declined PostMatch cannot start negotiation', async () => {
        ds = freshDataService([confirmedPostMatch({
            id: 'pm-declined',
            status: CONFIG.POST_MATCH_STATUS.DECLINED
        })]);

        await expect(
            ds.startNegotiationFromMatch('pm-declined', 'u-need')
        ).rejects.toThrow(/confirmed PostMatch/i);
    });

    it('duplicate active negotiation returns existing without creating deal', async () => {
        const first = await ds.startNegotiationFromMatch('pm-confirmed', 'u-need');
        const second = await ds.startNegotiationFromMatch('pm-confirmed', 'u-offer');

        expect(second.id).toBe(first.id);
        const negotiations = await ds.getNegotiations();
        expect(negotiations).toHaveLength(1);
        expect(await ds.getDeals()).toHaveLength(0);
    });
});
