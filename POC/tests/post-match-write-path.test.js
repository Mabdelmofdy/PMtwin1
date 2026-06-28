/**
 * ADR-002 PostMatch write-path alignment (Phase 3).
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, createTestConfig } from './helpers/matching-lifecycle-test-config.js';
import { isTerminal } from '../vendor/@pm-twin/lifecycle/index.js';
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
            EXPIRED: 'expired'
        },
        POST_MATCH_PARTICIPANT_STATUS: {
            PENDING: 'pending',
            ACCEPTED: 'accepted',
            DECLINED: 'declined'
        },
        MATCHING: {
            ...base.MATCHING,
            DEFAULT_MATCH_EXPIRY_DAYS: 14,
            LEGACY_PERSON_OPPORTUNITY_ENABLED: false,
            POST_TO_POST_THRESHOLD: 0.5,
            MIN_THRESHOLD: 0.5
        }
    };
}

function twoParticipantMatch(overrides = {}) {
    return {
        matchType: 'one_way',
        participants: [
            { userId: 'u-need', role: 'need_owner', participantStatus: 'pending' },
            { userId: 'u-offer', role: 'offer_provider', participantStatus: 'pending' }
        ],
        payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1' },
        ...overrides
    };
}

function freshDataService() {
    const ds = new DataService();
    const storage = createMemoryStorage();
    storage.initialize({
        [CONFIG.STORAGE_KEYS.POST_MATCHES]: [],
        [CONFIG.STORAGE_KEYS.NOTIFICATIONS]: [],
        [CONFIG.STORAGE_KEYS.AUDIT]: [],
        [CONFIG.STORAGE_KEYS.MATCHES]: [],
        [CONFIG.STORAGE_KEYS.OPPORTUNITIES]: [],
        [CONFIG.STORAGE_KEYS.USERS]: [],
        [CONFIG.STORAGE_KEYS.DEALS]: [],
        [CONFIG.STORAGE_KEYS.NEGOTIATIONS]: [],
        [CONFIG.STORAGE_KEYS.APPLICATIONS]: []
    });
    ds.storage = storage;
    return ds;
}

beforeAll(async () => {
    global.window = global;
    global.CONFIG = buildConfig();
    global.storageService = createMemoryStorage();
    global.dataService = {
        getPostMatches: async () => [],
        getMatches: async () => []
    };
    ({ DataService } = await import('../src/core/data/data-service.js'));
});

describe('PostMatch ADR-002 write path', () => {
    let ds;

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
    });

    it('createPostMatch writes discovered by default', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch());
        expect(created).toBeTruthy();
        expect(created.status).toBe(CONFIG.POST_MATCH_STATUS.DISCOVERED);
        expect(created.expiresAt).toBeTruthy();
    });

    it('pending stored value reads as discovered', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-legacy',
            ...twoParticipantMatch(),
            status: 'pending',
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-01T00:00:00.000Z',
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
        }]);

        const row = await ds.getPostMatchById('pm-legacy');
        expect(row.status).toBe('discovered');
        expect(ds.storage.get(CONFIG.STORAGE_KEYS.POST_MATCHES)[0].status).toBe('pending');
    });

    it('first accept moves discovered → accepted', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch());
        const updated = await ds.updatePostMatchStatus(
            created.id,
            'u-need',
            CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED
        );
        expect(updated.status).toBe(CONFIG.POST_MATCH_STATUS.ACCEPTED);
        expect(updated.participants.find(p => p.userId === 'u-need').participantStatus).toBe('accepted');
        expect(updated.participants.find(p => p.userId === 'u-offer').participantStatus).toBe('pending');
    });

    it('second accept moves accepted → confirmed', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch());
        await ds.updatePostMatchStatus(created.id, 'u-need', CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED);
        const confirmed = await ds.updatePostMatchStatus(
            created.id,
            'u-offer',
            CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED
        );
        expect(confirmed.status).toBe(CONFIG.POST_MATCH_STATUS.CONFIRMED);
    });

    it('decline moves discovered → declined', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch());
        const declined = await ds.updatePostMatchStatus(
            created.id,
            'u-need',
            CONFIG.POST_MATCH_PARTICIPANT_STATUS.DECLINED
        );
        expect(declined.status).toBe(CONFIG.POST_MATCH_STATUS.DECLINED);
    });

    it('decline moves accepted → declined', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch());
        await ds.updatePostMatchStatus(created.id, 'u-need', CONFIG.POST_MATCH_PARTICIPANT_STATUS.ACCEPTED);
        const declined = await ds.updatePostMatchStatus(
            created.id,
            'u-offer',
            CONFIG.POST_MATCH_PARTICIPANT_STATUS.DECLINED
        );
        expect(declined.status).toBe(CONFIG.POST_MATCH_STATUS.DECLINED);
    });

    it('expiry moves discovered → expired', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-exp-discovered',
            ...twoParticipantMatch(),
            status: CONFIG.POST_MATCH_STATUS.DISCOVERED,
            expiresAt: '2019-01-01T00:00:00.000Z',
            createdAt: '2019-01-01T00:00:00.000Z',
            updatedAt: '2019-01-01T00:00:00.000Z'
        }]);
        const row = await ds.getPostMatchById('pm-exp-discovered');
        expect(row.status).toBe(CONFIG.POST_MATCH_STATUS.EXPIRED);
    });

    it('expiry moves accepted → expired', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-exp-accepted',
            ...twoParticipantMatch(),
            status: CONFIG.POST_MATCH_STATUS.ACCEPTED,
            participants: [
                { userId: 'u-need', role: 'need_owner', participantStatus: 'accepted' },
                { userId: 'u-offer', role: 'offer_provider', participantStatus: 'pending' }
            ],
            expiresAt: '2019-01-01T00:00:00.000Z',
            createdAt: '2019-01-01T00:00:00.000Z',
            updatedAt: '2019-01-01T00:00:00.000Z'
        }]);
        const row = await ds.getPostMatchById('pm-exp-accepted');
        expect(row.status).toBe(CONFIG.POST_MATCH_STATUS.EXPIRED);
    });

    it('legacy pending stored row expires on read', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-exp-legacy',
            ...twoParticipantMatch(),
            status: 'pending',
            expiresAt: '2019-01-01T00:00:00.000Z',
            createdAt: '2019-01-01T00:00:00.000Z',
            updatedAt: '2019-01-01T00:00:00.000Z'
        }]);
        const row = await ds.getPostMatchById('pm-exp-legacy');
        expect(row.status).toBe(CONFIG.POST_MATCH_STATUS.EXPIRED);
    });

    it('confirmed is terminal', async () => {
        expect(isTerminal('match', 'confirmed')).toBe(true);
        const created = await ds.createPostMatch(twoParticipantMatch({
            status: CONFIG.POST_MATCH_STATUS.CONFIRMED,
            participants: [
                { userId: 'u-need', role: 'need_owner', participantStatus: 'accepted' },
                { userId: 'u-offer', role: 'offer_provider', participantStatus: 'accepted' }
            ]
        }));
        const blocked = await ds.updatePostMatchStatus(
            created.id,
            'u-need',
            CONFIG.POST_MATCH_PARTICIPANT_STATUS.DECLINED
        );
        expect(blocked.status).toBe(CONFIG.POST_MATCH_STATUS.CONFIRMED);
    });
});

describe('PostMatch ADR-002 discover creation (Phase 4C)', () => {
    let ds;
    let matchingService;
    let auditSpy;
    let notificationSpy;

    beforeAll(() => {
        matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));
    });

    beforeEach(() => {
        global.CONFIG = buildConfig();
        ds = freshDataService();
        auditSpy = vi.spyOn(ds, 'createAuditLog').mockResolvedValue(null);
        notificationSpy = vi.fn().mockResolvedValue(null);
        matchingService.dataService = ds;
        matchingService.notifyPostMatch = notificationSpy;
    });

    function seedExisting(overrides) {
        ds.storage.set(CONFIG.STORAGE_KEYS.POST_MATCHES, [{
            id: 'pm-existing',
            matchType: 'one_way',
            matchScore: 0.8,
            participants: [
                { userId: 'u-need', role: 'need_owner', participantStatus: 'pending' },
                { userId: 'u-offer', role: 'offer_provider', participantStatus: 'pending' }
            ],
            payload: { needOpportunityId: 'need-1', offerOpportunityId: 'offer-1', breakdown: { skillMatch: 0.8 } },
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-01T00:00:00.000Z',
            ...overrides
        }]);
    }

    it('createPostMatch writes ADR-002 shape with payload fallback', async () => {
        const created = await ds.createPostMatch({
            ...twoParticipantMatch(),
            matchScore: 0.91,
            matchCriteria: { skillMatch: 0.9, timelineFit: 0.85 }
        });
        expect(created.status).toBe(CONFIG.POST_MATCH_STATUS.DISCOVERED);
        expect(created.needOpportunityId).toBe('need-1');
        expect(created.offerOpportunityId).toBe('offer-1');
        expect(created.matchCriteria).toEqual({ skillMatch: 0.9, timelineFit: 0.85 });
        expect(created.payload.needOpportunityId).toBe('need-1');
        expect(created.payload.offerOpportunityId).toBe('offer-1');
        expect(created.payload.breakdown).toEqual({ skillMatch: 0.9, timelineFit: 0.85 });
        expect(auditSpy).toHaveBeenCalled();
    });

    it('maps legacy pending input to discovered on write', async () => {
        const created = await ds.createPostMatch(twoParticipantMatch({
            status: CONFIG.POST_MATCH_STATUS.PENDING
        }));
        expect(created.status).toBe(CONFIG.POST_MATCH_STATUS.DISCOVERED);
    });

    it('blocks duplicate discovered matches for the same need/offer pair', async () => {
        seedExisting({ status: CONFIG.POST_MATCH_STATUS.DISCOVERED });
        const duplicate = await ds.createPostMatch(twoParticipantMatch());
        expect(duplicate).toBeNull();
    });

    it('blocks duplicate accepted matches for the same need/offer pair', async () => {
        seedExisting({ status: CONFIG.POST_MATCH_STATUS.ACCEPTED });
        const duplicate = await ds.createPostMatch(twoParticipantMatch());
        expect(duplicate).toBeNull();
    });

    it('allows rediscovery after declined', async () => {
        seedExisting({ status: CONFIG.POST_MATCH_STATUS.DECLINED });
        const created = await ds.createPostMatch(twoParticipantMatch());
        expect(created).toBeTruthy();
        expect(created.status).toBe(CONFIG.POST_MATCH_STATUS.DISCOVERED);
    });

    it('allows rediscovery after expired', async () => {
        seedExisting({ status: CONFIG.POST_MATCH_STATUS.EXPIRED });
        const created = await ds.createPostMatch(twoParticipantMatch());
        expect(created).toBeTruthy();
    });

    it('allows rediscovery after superseded', async () => {
        seedExisting({ status: 'superseded', replacementPostMatchId: 'pm-newer' });
        const created = await ds.createPostMatch(twoParticipantMatch());
        expect(created).toBeTruthy();
    });

    it('blocks duplicate using payload-only legacy FK rows', async () => {
        seedExisting({
            status: CONFIG.POST_MATCH_STATUS.DISCOVERED,
            needOpportunityId: undefined,
            offerOpportunityId: undefined
        });
        const duplicate = await ds.createPostMatch(twoParticipantMatch());
        expect(duplicate).toBeNull();
    });

    it('matching-service persist creates discovered ADR-002 records and notifies', async () => {
        ds.storage.set(CONFIG.STORAGE_KEYS.OPPORTUNITIES, [
            { id: 'need-1', creatorId: 'u-need', intent: 'request', status: 'published', title: 'Need' },
            { id: 'offer-1', creatorId: 'u-offer', intent: 'offer', status: 'published', title: 'Offer' }
        ]);
        vi.spyOn(ds, 'createMatchingRun').mockResolvedValue({ id: 'run-1' });
        vi.spyOn(ds, 'updateMatchingRun').mockResolvedValue(null);
        vi.spyOn(ds, 'createNotification').mockResolvedValue(null);

        matchingService.findMatchesForPost = async () => ({
            model: 'one_way',
            direction: 'need_to_offers',
            matches: [{
                matchScore: 0.93,
                matchedOpportunity: { id: 'offer-1', creatorId: 'u-offer' },
                breakdown: { skillMatch: 0.93 }
            }]
        });

        const result = await matchingService.persistPostMatches('need-1', {
            model: 'one_way',
            source: 'manual_debug'
        });

        expect(result.createdCount).toBe(1);
        const created = (await ds.getPostMatches())[0];
        expect(created.status).toBe(CONFIG.POST_MATCH_STATUS.DISCOVERED);
        expect(created.needOpportunityId).toBe('need-1');
        expect(created.offerOpportunityId).toBe('offer-1');
        expect(created.matchCriteria).toEqual({ skillMatch: 0.93 });
        expect(created.payload.breakdown).toEqual({ skillMatch: 0.93 });
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(auditSpy).toHaveBeenCalled();
    });
});
