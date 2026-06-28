/**
 * Phase 6 — CreateDealFromPostMatch POC alignment.
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
            ACCEPTED: 'accepted',
            DECLINED: 'declined',
            CONFIRMED: 'confirmed',
            EXPIRED: 'expired',
            SUPERSEDED: 'superseded'
        },
        MATCHING: {
            ...base.MATCHING,
            NEGOTIATION: {
                ...base.MATCHING.NEGOTIATION,
                STATUS: {
                    OPEN: 'open',
                    COUNTER_OFFERED: 'counter_offered',
                    AGREED: 'agreed',
                    FAILED: 'failed',
                    EXPIRED: 'expired',
                    CANCELLED: 'cancelled'
                }
            },
            LEGACY_PERSON_OPPORTUNITY_ENABLED: false
        },
        DEAL_STATUS: {
            ...base.DEAL_STATUS,
            DRAFT: 'draft',
            NEGOTIATING: 'negotiating'
        }
    };
}

function confirmedPostMatch(overrides = {}) {
    return {
        id: 'pm-confirmed',
        matchType: 'one_way',
        status: CONFIG.POST_MATCH_STATUS.CONFIRMED,
        matchScore: 0.9,
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
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

function agreedNegotiation(postMatchId, overrides = {}) {
    return {
        id: 'neg-agreed',
        postMatchId,
        matchId: postMatchId,
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
        opportunityId: 'need-1',
        status: CONFIG.MATCHING.NEGOTIATION.STATUS.AGREED,
        parties: [
            { userId: 'u-need', role: 'need_owner' },
            { userId: 'u-offer', role: 'offer_provider' }
        ],
        agreedTerms: { value: 1000, currency: 'SAR' },
        ...overrides
    };
}

function freshDataService(postMatches = [], negotiations = []) {
    const ds = new DataService();
    const storage = createMemoryStorage();
    storage.initialize({
        [CONFIG.STORAGE_KEYS.POST_MATCHES]: postMatches,
        [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: negotiations,
        [CONFIG.STORAGE_KEYS.DEALS]: [],
        [CONFIG.STORAGE_KEYS.CONTRACTS]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [
            { id: 'need-1', title: 'Need', status: 'published', creatorId: 'u-need' },
            { id: 'offer-1', title: 'Offer', status: 'published', creatorId: 'u-offer' }
        ],
        [CONFIG.STORAGE_KEYS.APPLICATIONS]: [],
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

describe('createDealFromNegotiation (PostMatch Phase 6)', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService(
            [confirmedPostMatch()],
            [agreedNegotiation('pm-confirmed')]
        );
    });

    it('agreed negotiation linked to confirmed PostMatch creates draft deal with links', async () => {
        const deal = await ds.createDealFromNegotiation('neg-agreed', 'u-need');

        expect(deal).toBeTruthy();
        expect(deal.status).toBe(CONFIG.DEAL_STATUS.DRAFT);
        expect(deal.postMatchId).toBe('pm-confirmed');
        expect(deal.matchId).toBe('pm-confirmed');
        expect(deal.negotiationId).toBe('neg-agreed');
        expect(deal.needOpportunityId).toBe('need-1');
        expect(deal.offerOpportunityId).toBe('offer-1');

        const postMatch = (await ds.getPostMatches()).find(m => m.id === 'pm-confirmed');
        expect(postMatch.dealId).toBe(deal.id);

        expect(await ds.getContracts()).toHaveLength(0);
    });

    it('active negotiation cannot create deal', async () => {
        ds = freshDataService(
            [confirmedPostMatch()],
            [agreedNegotiation('pm-confirmed', {
                id: 'neg-active',
                status: CONFIG.MATCHING.NEGOTIATION.STATUS.OPEN
            })]
        );

        await expect(
            ds.createDealFromNegotiation('neg-active', 'u-need')
        ).rejects.toThrow(/Agree to terms/i);
    });

    it('non-confirmed PostMatch cannot create deal', async () => {
        ds = freshDataService(
            [confirmedPostMatch({ id: 'pm-accepted', status: CONFIG.POST_MATCH_STATUS.ACCEPTED })],
            [agreedNegotiation('pm-accepted')]
        );

        await expect(
            ds.createDealFromNegotiation('neg-agreed', 'u-need')
        ).rejects.toThrow(/confirmed PostMatch/i);
    });

    it('duplicate deal returns existing', async () => {
        const first = await ds.createDealFromNegotiation('neg-agreed', 'u-need');
        const second = await ds.createDealFromNegotiation('neg-agreed', 'u-offer');

        expect(second.id).toBe(first.id);
        expect(await ds.getDeals()).toHaveLength(1);
    });
});

describe('createDealFromMatch (PostMatch link fields)', () => {
    it('writes postMatchId and opportunity links on direct match deal', async () => {
        global.CONFIG = buildConfig();
        const ds = freshDataService([confirmedPostMatch()]);

        const deal = await ds.createDealFromMatch(
            (await ds.getPostMatches())[0],
            'u-need'
        );

        expect(deal.postMatchId).toBe('pm-confirmed');
        expect(deal.needOpportunityId).toBe('need-1');
        expect(deal.offerOpportunityId).toBe('offer-1');
        expect(deal.status).toBe(CONFIG.DEAL_STATUS.DRAFT);
    });
});
