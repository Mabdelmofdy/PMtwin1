import { beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let matchingService;

beforeAll(() => {
    global.window = global;
    global.CONFIG = { MATCHING: { LEGACY_PERSON_OPPORTUNITY_ENABLED: false } };
    global.dataService = { getPostMatches: async () => [], getMatches: async () => [] };
    global.window.dataService = global.dataService;
    matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));
});

function mockDs() {
    const sent = [];
    return {
        sent,
        async getOpportunityById(id) {
            return { id, title: `Title-${id}` };
        },
        async createLifecycleNotification(payload) {
            sent.push(payload);
            return payload;
        }
    };
}

describe('notifyPostMatch', () => {
    it('notifies every participant with postMatchId', async () => {
        const ds = mockDs();
        matchingService.dataService = ds;

        await matchingService.notifyPostMatch({
            id: 'pm-1',
            matchType: 'two_way',
            matchScore: 0.75,
            participants: [{ userId: 'a' }, { userId: 'b' }, { userId: 'a' }],
            payload: { valueEquivalence: 'balanced' }
        });

        expect(ds.sent).toHaveLength(2);
        ds.sent.forEach(n => {
            expect(n.postMatchId).toBe('pm-1');
            expect(n.type).toBe('new_match_found');
        });
    });

    it('uses match-type-specific titles', async () => {
        const cases = [
            { matchType: 'one_way', title: 'New Need/Offer match' },
            { matchType: 'two_way', title: 'New barter match' },
            { matchType: 'consortium', title: 'New consortium match', payload: { leadNeedId: 'lead-1', roles: [{}, {}] } },
            { matchType: 'circular', title: 'New circular exchange match', payload: { cycle: [1, 2, 3] } }
        ];

        for (const c of cases) {
            const ds = mockDs();
            matchingService.dataService = ds;
            await matchingService.notifyPostMatch({
                id: 'pm-x',
                matchScore: 0.8,
                matchType: c.matchType,
                participants: [{ userId: 'u1' }],
                payload: c.payload || { needOpportunityId: 'n1', offerOpportunityId: 'o1' }
            });
            expect(ds.sent[0].title).toBe(c.title);
        }
    });

    it('uses replacement copy for isReplacement post_matches', async () => {
        const ds = mockDs();
        matchingService.dataService = ds;

        await matchingService.notifyPostMatch({
            id: 'pm-rep',
            matchType: 'consortium',
            isReplacement: true,
            matchScore: 0.7,
            participants: [{ userId: 'invitee' }],
            payload: { leadNeedId: 'lead-1', roles: [] }
        });

        expect(ds.sent[0].title).toBe('Consortium replacement invitation');
        expect(ds.sent[0].type).toBe('new_match_found');
    });
});
