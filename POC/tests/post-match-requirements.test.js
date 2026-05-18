/**
 * Post-match lifecycle requirements (Vitest).
 * Covers dashboard/pipeline wiring, publish flow, deal gates, payload shape, and expiry-on-read.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createMemoryStorage, createTestConfig } from './helpers/matching-lifecycle-test-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const POC_ROOT = path.join(__dirname, '..');

let DataService;
let matchingService;
let matchingModels;

function readFeatureSrc(relativePath) {
    return fs.readFileSync(path.join(POC_ROOT, relativePath), 'utf8');
}

function buildConfig() {
    const base = createTestConfig();
    return {
        ...base,
        ROUTES: { MESSAGES: '/messages' },
        POST_MATCH_PARTICIPANT_STATUS: {
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            DECLINED: 'declined'
        },
        MATCHING: {
            ...base.MATCHING,
            LEGACY_PERSON_OPPORTUNITY_ENABLED: false,
            POST_TO_POST_THRESHOLD: 0.5,
            MIN_THRESHOLD: 0.7,
            AUTO_NOTIFY_THRESHOLD: 0.8
        }
    };
}

beforeAll(async () => {
    global.window = global;
    global.CONFIG = buildConfig();
    global.storageService = createMemoryStorage();
    global.window.storageService = global.storageService;
    global.dataService = {
        getPostMatches: async () => [],
        getMatches: async () => [],
        getOpportunities: async () => []
    };
    global.window.dataService = global.dataService;
    ({ DataService } = await import('../src/core/data/data-service.js'));
    matchingService = require(path.join(POC_ROOT, 'src', 'services', 'matching', 'matching-service.js'));
    matchingModels = require(path.join(POC_ROOT, 'src', 'services', 'matching', 'matching-models.js'));
});

function freshDataService() {
    const ds = new DataService();
    const storage = createMemoryStorage();
    storage.initialize({
        [CONFIG.STORAGE_KEYS.MATCHES]: [],
        [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [],
        [CONFIG.STORAGE_KEYS.USERS]: [{ id: 'owner-1', status: 'active' }],
        [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
        [CONFIG.STORAGE_KEYS.AUDIT]: [],
        [CONFIG.STORAGE_KEYS.DEALS]: [],
        [CONFIG.STORAGE_KEYS.APPLICATIONS]: [],
        [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITY_INVITATIONS]: []
    });
    ds.storage = storage;
    return ds;
}

describe('1. Dashboard does not read legacy matches', () => {
    it('dashboard.js loads matches via getPostMatchesForUser only', () => {
        const src = readFeatureSrc('features/dashboard/dashboard.js');
        expect(src).toContain('getPostMatchesForUser');
        expect(src).toContain('fetchUserPostMatches');
        expect(src).not.toMatch(/\.getMatches\s*\(/);
        expect(src).not.toMatch(/\.getMatchesForUser\s*\(/);
        expect(src).not.toMatch(/\.getMatchById\s*\(/);
        expect(src).not.toMatch(/pmtwin_matches/);
    });
});

describe('2. Pipeline displays post_matches only', () => {
    it('pipeline matches tab uses getPostMatchesForUser and unified view models', () => {
        const src = readFeatureSrc('features/pipeline/pipeline.js');
        const loader = src.slice(
            src.indexOf('async function loadPipelineMatchesTabContent'),
            src.indexOf('async function loadPipelineMatchesTabContent') + 2500
        );
        expect(loader).toContain('getPostMatchesForUser');
        expect(loader).toContain('buildUnifiedMatchViewModels');
        expect(loader).not.toMatch(/\.getMatches\s*\(/);
        expect(loader).not.toContain('pmtwin_matches');
    });
});

describe('3–5. Publish opportunity matching', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
        ds.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, [
            { id: 'opp-draft', creatorId: 'owner-1', title: 'Draft need', status: 'draft', intent: 'request' }
        ]);
    });

    it('3. publishing does not create pmtwin_matches', async () => {
        const createMatchSpy = vi.spyOn(ds, 'createMatch');
        const legacyFindSpy = vi.spyOn(matchingService, 'findMatchesForOpportunity');

        global.matchingService = {
            persistPostMatches: vi.fn().mockResolvedValue([]),
            findMatchesForOpportunity: vi.fn()
        };

        await ds.updateOpportunity('opp-draft', { status: 'published' });

        expect(createMatchSpy).not.toHaveBeenCalled();
        expect(await ds.getMatches()).toEqual([]);
        expect(legacyFindSpy).not.toHaveBeenCalled();
        createMatchSpy.mockRestore();
        legacyFindSpy.mockRestore();
    });

    it('4. publishing creates post_matches via persistPostMatches', async () => {
        global.matchingService = {
            persistPostMatches: vi.fn(async (opportunityId) => {
                await ds.createPostMatch({
                    matchType: 'one_way',
                    status: CONFIG.POST_MATCH_STATUS.PENDING,
                    matchScore: 0.88,
                    participants: [
                        { userId: 'owner-1', opportunityId, role: 'need_owner', participantStatus: 'pending' },
                        { userId: 'partner-1', opportunityId: 'offer-1', role: 'offer_provider', participantStatus: 'pending' }
                    ],
                    payload: { needOpportunityId: opportunityId, offerOpportunityId: 'offer-1' }
                });
                return [{ id: 'created-on-publish' }];
            }),
            findMatchesForOpportunity: vi.fn()
        };

        await ds.updateOpportunity('opp-draft', { status: 'published' });

        const postMatches = await ds.getPostMatches();
        expect(postMatches).toHaveLength(1);
        expect(postMatches[0].matchType).toBe('one_way');
        expect(postMatches[0].payload.needOpportunityId).toBe('opp-draft');
        expect(await ds.getMatches()).toEqual([]);
    });

    it('5. findMatchesForOpportunity is not called from publish flow', async () => {
        const legacyFindSpy = vi.spyOn(matchingService, 'findMatchesForOpportunity');
        const persistSpy = vi.fn().mockResolvedValue([]);

        global.matchingService = {
            persistPostMatches: persistSpy,
            findMatchesForOpportunity: vi.fn()
        };

        await ds.updateOpportunity('opp-draft', { status: 'published' });

        expect(persistSpy).toHaveBeenCalledWith('opp-draft', { source: 'publish' });
        expect(legacyFindSpy).not.toHaveBeenCalled();
        legacyFindSpy.mockRestore();
    });
});

describe('6–7. Deal creation requires confirmed post_match', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [
            {
                id: 'pm-pending',
                matchType: 'one_way',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                participants: [{ userId: 'u1', role: 'need_owner', participantStatus: 'pending' }],
                payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' }
            },
            {
                id: 'pm-confirmed',
                matchType: 'one_way',
                status: CONFIG.POST_MATCH_STATUS.CONFIRMED,
                participants: [{ userId: 'u1', role: 'need_owner', participantStatus: 'accepted' }],
                payload: { needOpportunityId: 'need-2', offerOpportunityId: 'offer-2' }
            }
        ]);
    });

    it('6. pending match does not allow deal creation', async () => {
        await expect(ds.assertDealCreationSource({ matchId: 'pm-pending' }))
            .rejects.toThrow(/confirmed match/i);
    });

    it('7. confirmed match allows deal creation', async () => {
        await expect(ds.assertDealCreationSource({ matchId: 'pm-confirmed' }))
            .resolves.toBeUndefined();
    });
});

describe('8. Two-way post_match sideA contains needId and offerId', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
    });

    it('rejects two_way payload when sideA is missing needId or offerId', async () => {
        const invalid = await ds.createPostMatch({
            matchType: 'two_way',
            status: CONFIG.POST_MATCH_STATUS.PENDING,
            participants: [],
            payload: {
                sideA: { userId: 'u1', needId: 'need-a', offerId: null },
                sideB: { userId: 'u2', needId: 'need-b', offerId: 'offer-b' }
            }
        });
        expect(invalid).toBeNull();
    });

    it('persists two_way with hydrated sideA.needId and sideA.offerId', async () => {
        const OPPS = [
            { id: 'need-a', creatorId: 'creator-a', intent: 'request', status: 'published' },
            { id: 'offer-a', creatorId: 'creator-a', intent: 'offer', status: 'published' },
            { id: 'need-b', creatorId: 'creator-b', intent: 'request', status: 'published' },
            { id: 'offer-b', creatorId: 'creator-b', intent: 'offer', status: 'published' }
        ];
        const created = [];
        matchingService.dataService = {
            async getOpportunities() { return OPPS; },
            async createPostMatch(data) {
                const row = await ds.createPostMatch(data);
                if (row) created.push(row);
                return row;
            },
            async createNotification() { return null; },
            getPostMatchStrongKey: () => null
        };
        matchingService._persistSeenKeysInRun = new Set();

        await matchingService._persistTwoWayMatches(
            OPPS[0],
            'need-a',
            [{ matchScore: 0.9, matchedNeed: OPPS[2], matchedOffer: OPPS[3], breakdown: { scoreAtoB: 0.9, scoreBtoA: 0.85 } }],
            'run-req-8',
            0.5,
            matchingService._emptyPersistStats()
        );

        expect(created).toHaveLength(1);
        expect(created[0].payload.sideA.needId).toBe('need-a');
        expect(created[0].payload.sideA.offerId).toBe('offer-a');
    });
});

describe('9. Circular post_match links contain needId and offerId', () => {
    it('buildCircularLinkScores requires needId and offerId on every link', () => {
        const edgeDetails = {
            'u1->u2': {
                score: 0.8,
                need: { id: 'need-1', creatorId: 'u1' },
                offer: { id: 'offer-2', creatorId: 'u2' }
            },
            'u2->u3': {
                score: 0.75,
                need: { id: 'need-2', creatorId: 'u2' },
                offer: { id: 'offer-3', creatorId: 'u3' }
            },
            'u3->u1': {
                score: 0.7,
                need: { id: 'need-3', creatorId: 'u3' },
                offer: { id: 'offer-1', creatorId: 'u1' }
            }
        };
        const links = matchingModels.buildCircularLinkScores(['u1', 'u2', 'u3'], edgeDetails);
        expect(links).toHaveLength(3);
        links.forEach(link => {
            expect(link.needId).toBeTruthy();
            expect(link.offerId).toBeTruthy();
        });
    });

    it('createPostMatch rejects circular links missing needId or offerId', async () => {
        const ds = freshDataService();
        const invalid = await ds.createPostMatch({
            matchType: 'circular',
            status: CONFIG.POST_MATCH_STATUS.PENDING,
            participants: [],
            payload: {
                cycle: ['u1', 'u2', 'u3'],
                links: [{ fromCreatorId: 'u1', toCreatorId: 'u2', needId: 'n1', offerId: null, score: 0.8 }]
            }
        });
        expect(invalid).toBeNull();

        const valid = await ds.createPostMatch({
            matchType: 'circular',
            status: CONFIG.POST_MATCH_STATUS.PENDING,
            participants: [],
            payload: {
                cycle: ['u1', 'u2', 'u3'],
                links: [{ fromCreatorId: 'u1', toCreatorId: 'u2', needId: 'n1', offerId: 'o1', score: 0.8 }]
            }
        });
        expect(valid.payload.links[0].needId).toBe('n1');
        expect(valid.payload.links[0].offerId).toBe('o1');
    });
});

describe('10. Expired pending post_match becomes expired when read', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [
            {
                id: 'pm-expired',
                matchType: 'one_way',
                status: CONFIG.POST_MATCH_STATUS.PENDING,
                participants: [{ userId: 'u1', participantStatus: 'pending' }],
                payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' },
                expiresAt: '2020-01-01T00:00:00.000Z',
                createdAt: '2019-01-01T00:00:00.000Z',
                updatedAt: '2019-01-01T00:00:00.000Z'
            }
        ]);
    });

    it('getPostMatchById transitions stale pending rows to expired', async () => {
        const row = await ds.getPostMatchById('pm-expired');
        expect(row.status).toBe(CONFIG.POST_MATCH_STATUS.EXPIRED);
    });

    it('getPostMatchesForUser expires pending rows on read', async () => {
        const rows = await ds.getPostMatchesForUser('u1');
        expect(rows).toHaveLength(1);
        expect(rows[0].status).toBe(CONFIG.POST_MATCH_STATUS.EXPIRED);
    });
});
