/**
 * Barter / two-way post_match side hydration (need + offer pair per creator).
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

global.window = global;
global.CONFIG = {
    MATCHING: { POST_TO_POST_THRESHOLD: 0.5 },
    POST_MATCH_STATUS: { PENDING: 'pending' }
};
global.dataService = { getPostMatches: () => [], getMatches: () => [] };

const matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));

const OPPS = [
    { id: 'need-a', creatorId: 'creator-a', intent: 'request', status: 'published' },
    { id: 'offer-a', creatorId: 'creator-a', intent: 'offer', status: 'published' },
    { id: 'need-b', creatorId: 'creator-b', intent: 'request', status: 'published' },
    { id: 'offer-b', creatorId: 'creator-b', intent: 'offer', status: 'published' },
    { id: 'draft-offer-a', creatorId: 'creator-a', intent: 'offer', status: 'draft' }
];

describe('_hydrateBarterSide', () => {
    it('fills offerId when the published anchor is a need', () => {
        const side = matchingService._hydrateBarterSide(
            'creator-a',
            OPPS[0],
            OPPS
        );
        expect(side).toEqual({
            userId: 'creator-a',
            needId: 'need-a',
            offerId: 'offer-a'
        });
    });

    it('fills needId when the published anchor is an offer', () => {
        const side = matchingService._hydrateBarterSide(
            'creator-a',
            OPPS[1],
            OPPS
        );
        expect(side).toEqual({
            userId: 'creator-a',
            needId: 'need-a',
            offerId: 'offer-a'
        });
    });

    it('uses matcher pair hints for the counterparty side', () => {
        const side = matchingService._hydrateBarterSide(
            'creator-b',
            OPPS[2],
            OPPS,
            { matchedNeed: OPPS[2], matchedOffer: OPPS[3] }
        );
        expect(side.needId).toBe('need-b');
        expect(side.offerId).toBe('offer-b');
    });

    it('ignores non-published posts when pairing', () => {
        const onlyNeed = [
            { id: 'need-only', creatorId: 'u1', intent: 'request', status: 'published' }
        ];
        const side = matchingService._hydrateBarterSide('u1', onlyNeed[0], onlyNeed);
        expect(side.needId).toBe('need-only');
        expect(side.offerId).toBeNull();
    });
});

describe('_persistTwoWayMatches hydration', () => {
    it('persists fully hydrated sideA and sideB payloads', async () => {
        const created = [];
        matchingService.dataService = {
            async getOpportunities() { return OPPS; },
            async createPostMatch(data) {
                created.push(data);
                return { id: 'pm-' + created.length, ...data };
            },
            async createNotification() { return null; },
            getPostMatchStrongKey() { return null; }
        };
        matchingService._persistSeenKeysInRun = new Set();

        const opportunity = OPPS[0];
        await matchingService._persistTwoWayMatches(
            opportunity,
            'need-a',
            [{
                matchScore: 0.9,
                matchedNeed: OPPS[2],
                matchedOffer: OPPS[3],
                breakdown: { scoreAtoB: 0.9, scoreBtoA: 0.85 }
            }],
            'run-1',
            0.5,
            matchingService._emptyPersistStats()
        );

        expect(created).toHaveLength(1);
        expect(created[0].payload.sideA).toEqual({
            userId: 'creator-a',
            needId: 'need-a',
            offerId: 'offer-a'
        });
        expect(created[0].payload.sideB).toEqual({
            userId: 'creator-b',
            needId: 'need-b',
            offerId: 'offer-b'
        });
    });

    it('skips persist when the publisher has no published offer to pair', async () => {
        const created = [];
        matchingService.dataService = {
            async getOpportunities() {
                return [
                    { id: 'need-only', creatorId: 'creator-a', intent: 'request', status: 'published' },
                    OPPS[2],
                    OPPS[3]
                ];
            },
            async createPostMatch(data) {
                created.push(data);
                return { id: 'pm-x', ...data };
            },
            async createNotification() { return null; },
            getPostMatchStrongKey() { return null; }
        };
        matchingService._persistSeenKeysInRun = new Set();

        await matchingService._persistTwoWayMatches(
            { id: 'need-only', creatorId: 'creator-a', intent: 'request', status: 'published' },
            'need-only',
            [{ matchScore: 0.9, matchedNeed: OPPS[2], matchedOffer: OPPS[3] }],
            'run-1',
            0.5,
            matchingService._emptyPersistStats()
        );

        expect(created).toHaveLength(0);
    });
});
