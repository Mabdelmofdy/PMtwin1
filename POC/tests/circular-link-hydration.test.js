/**
 * Circular post_match link payloads (needId + offerId per chain edge).
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

global.window = global;
global.CONFIG = {
    MATCHING: { POST_TO_POST_THRESHOLD: 0.5, DEBUG: false },
    POST_MATCH_STATUS: { PENDING: 'pending' }
};
global.dataService = { getPostMatches: () => [], getMatches: () => [] };

const matchingModels = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-models.js'));
const matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));

describe('normalizeCycleRing / buildCircularLinkScores', () => {
    const edgeDetails = {
        'u1->u2': {
            score: 0.8,
            need: { id: 'need-1', creatorId: 'u1', intent: 'request' },
            offer: { id: 'offer-2', creatorId: 'u2', intent: 'offer' }
        },
        'u2->u3': {
            score: 0.75,
            need: { id: 'need-2', creatorId: 'u2', intent: 'request' },
            offer: { id: 'offer-3', creatorId: 'u3', intent: 'offer' }
        },
        'u3->u1': {
            score: 0.7,
            need: { id: 'need-3', creatorId: 'u3', intent: 'request' },
            offer: { id: 'offer-1', creatorId: 'u1', intent: 'offer' }
        }
    };

    it('strips duplicate closing node from cycle paths', () => {
        expect(matchingModels.normalizeCycleRing(['u1', 'u2', 'u3', 'u1'])).toEqual(['u1', 'u2', 'u3']);
        expect(matchingModels.normalizeCycleRing(['u1', 'u2', 'u3'])).toEqual(['u1', 'u2', 'u3']);
    });

    it('builds fully hydrated links for each ring edge', () => {
        const ring = ['u1', 'u2', 'u3'];
        const links = matchingModels.buildCircularLinkScores(ring, edgeDetails);
        expect(links).toHaveLength(3);
        expect(links[0]).toEqual({
            fromCreatorId: 'u1',
            toCreatorId: 'u2',
            needId: 'need-1',
            offerId: 'offer-2',
            score: 0.8
        });
        expect(links[2]).toEqual({
            fromCreatorId: 'u3',
            toCreatorId: 'u1',
            needId: 'need-3',
            offerId: 'offer-1',
            score: 0.7
        });
    });

    it('returns null when an edge lacks need or offer ids', () => {
        const partial = {
            'u1->u2': { score: 0.5, need: { id: 'n1' }, offer: null }
        };
        expect(matchingModels.buildCircularLinkScores(['u1', 'u2'], partial)).toBeNull();
    });
});

describe('_normalizeCircularLinks', () => {
    it('hydrates legacy links missing needId/offerId via opportunity lookup', async () => {
        matchingService.dataService = {
            async getOpportunities() {
                return [
                    { id: 'need-1', creatorId: 'u1', intent: 'request', status: 'published' },
                    { id: 'offer-2', creatorId: 'u2', intent: 'offer', status: 'published' },
                    { id: 'need-2', creatorId: 'u2', intent: 'request', status: 'published' },
                    { id: 'offer-3', creatorId: 'u3', intent: 'offer', status: 'published' },
                    { id: 'need-3', creatorId: 'u3', intent: 'request', status: 'published' },
                    { id: 'offer-1', creatorId: 'u1', intent: 'offer', status: 'published' }
                ];
            }
        };

        const { cycle, links } = await matchingService._normalizeCircularLinks(
            ['u1', 'u2', 'u3', 'u1'],
            [
                { fromCreatorId: 'u1', toCreatorId: 'u2', score: 0.8 },
                { fromCreatorId: 'u2', toCreatorId: 'u3', needId: 'need-2', offerId: 'offer-3', score: 0.75 },
                { fromCreatorId: 'u3', toCreatorId: 'u1', needId: 'need-3', offerId: 'offer-1', score: 0.7 }
            ],
            matchingService.dataService
        );

        expect(cycle).toEqual(['u1', 'u2', 'u3']);
        expect(links).toHaveLength(3);
        expect(links[0].needId).toBe('need-1');
        expect(links[0].offerId).toBe('offer-2');
    });
});

describe('_persistCircularMatches', () => {
    it('persists payload.links with needId and offerId on every edge', async () => {
        const created = [];
        matchingService.dataService = {
            async getOpportunities() { return []; },
            async createPostMatch(data) {
                created.push(data);
                return { id: 'pm-circ', ...data };
            },
            async createNotification() { return null; },
            getPostMatchStrongKey() { return null; }
        };
        matchingService._persistSeenKeysInRun = new Set();

        await matchingService._persistCircularMatches(
            { id: 'need-1', creatorId: 'u1', status: 'published' },
            'need-1',
            [{
                matchScore: 0.78,
                cycle: ['u1', 'u2', 'u3'],
                linkScores: [
                    { fromCreatorId: 'u1', toCreatorId: 'u2', needId: 'need-1', offerId: 'offer-2', score: 0.8 },
                    { fromCreatorId: 'u2', toCreatorId: 'u3', needId: 'need-2', offerId: 'offer-3', score: 0.75 },
                    { fromCreatorId: 'u3', toCreatorId: 'u1', needId: 'need-3', offerId: 'offer-1', score: 0.7 }
                ]
            }],
            'run-c',
            0.5,
            matchingService._emptyPersistStats()
        );

        expect(created).toHaveLength(1);
        const links = created[0].payload.links;
        expect(links).toHaveLength(3);
        links.forEach(l => {
            expect(l.fromCreatorId).toBeTruthy();
            expect(l.toCreatorId).toBeTruthy();
            expect(l.needId).toBeTruthy();
            expect(l.offerId).toBeTruthy();
            expect(l.score).not.toBeNull();
        });
    });
});
