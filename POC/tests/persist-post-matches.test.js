/**
 * Phase 3: multi-model persistence routing and matching run metadata.
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

global.CONFIG = {
    MATCHING: {
        POST_TO_POST_THRESHOLD: 0.5,
        MIN_THRESHOLD: 0.5,
        AUTO_NOTIFY_THRESHOLD: 0.7
    },
    POST_MATCH_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        DECLINED: 'declined',
        EXPIRED: 'expired'
    }
};
global.window = global;
global.dataService = global.dataService || { getPostMatches: () => [], getMatches: () => [] };

const matchingService = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'matching-service.js'));

describe('detectMatchingModel', () => {
    it('includes one_way for offer opportunities', () => {
        const models = matchingService.detectMatchingModel({ intent: 'offer' });
        expect(models).toContain('one_way');
    });

    it('returns multiple models for hybrid barter consortium opportunity', () => {
        const models = matchingService.detectMatchingModel({
            intent: 'hybrid',
            exchangeMode: 'barter',
            attributes: { memberRoles: ['Investor'] }
        });
        expect(models).toContain('one_way');
        expect(models).toContain('two_way');
        expect(models).toContain('consortium');
        expect(models).not.toContain('circular');
    });
});

describe('_buildPersistModelPlan / resolveModelsForPersistence', () => {
    it('runs all detected models and circular on publish path', () => {
        const opp = {
            intent: 'hybrid',
            exchangeMode: 'barter',
            attributes: { memberRoles: ['Role A'] }
        };
        const resolved = matchingService.resolveModelsForPersistence(opp, {});
        expect(resolved.models).toEqual(expect.arrayContaining(['one_way', 'two_way', 'consortium']));
        expect(resolved.runCircular).toBe(true);
    });

    it('runs only explicit model when options.model is set', () => {
        const resolved = matchingService.resolveModelsForPersistence(
            { intent: 'request' },
            { model: 'two_way' }
        );
        expect(resolved.models).toEqual(['two_way']);
        expect(resolved.runCircular).toBe(false);
    });

    it('runs circular only when model is circular', () => {
        const resolved = matchingService.resolveModelsForPersistence(
            { intent: 'request' },
            { model: 'circular' }
        );
        expect(resolved.models).toEqual([]);
        expect(resolved.runCircular).toBe(true);
    });
});

describe('persistPostMatches multi-model', () => {
    it('invokes each detected model and records matching run metadata', async () => {
        const findCalls = [];
        const createdRuns = [];
        let updatedRun = null;
        const postMatches = [];

        matchingService.dataService = {
            async getOpportunityById(id) {
                if (id === 'offer-1') {
                    return { id: 'offer-1', creatorId: 'creator-2', title: 'Offer', intent: 'offer', status: 'published' };
                }
                return {
                    id,
                    status: 'published',
                    intent: 'hybrid',
                    exchangeMode: 'barter',
                    creatorId: 'creator-1',
                    attributes: { memberRoles: ['Investor'] }
                };
            },
            async createMatchingRun(data) {
                const run = { id: 'run-test-1', createdAt: new Date().toISOString(), ...data };
                createdRuns.push(run);
                return run;
            },
            async updateMatchingRun(runId, updates) {
                updatedRun = { runId, ...updates };
                return updatedRun;
            },
            async createPostMatch(data) {
                const record = { id: 'pm-' + postMatches.length, ...data };
                postMatches.push(record);
                return record;
            },
            async getOpportunities() { return []; },
            async createNotification() { return null; }
        };

        const originalFind = matchingService.findMatchesForPost.bind(matchingService);
        matchingService.findMatchesForPost = async (oppId, opts) => {
            findCalls.push(opts.model);
            if (opts.model === 'one_way') {
                return {
                    model: 'one_way',
                    matches: [{
                        matchScore: 0.9,
                        matchedOpportunity: { id: 'offer-1', creatorId: 'creator-2' },
                        breakdown: { skills: 0.9 }
                    }]
                };
            }
            if (opts.model === 'two_way') {
                return { model: 'two_way', matches: [] };
            }
            if (opts.model === 'consortium') {
                return { model: 'consortium', matches: [] };
            }
            if (opts.model === 'circular') {
                return { model: 'circular', matches: [] };
            }
            return { model: opts.model, matches: [] };
        };

        const result = await matchingService.persistPostMatches('lead-need-1', { source: 'publish' });

        matchingService.findMatchesForPost = originalFind;

        expect(findCalls).toContain('one_way');
        expect(findCalls).toContain('two_way');
        expect(findCalls).toContain('consortium');
        expect(findCalls).toContain('circular');
        expect(result.createdCount).toBe(1);
        expect(result.created.length).toBe(1);
        expect(createdRuns[0].modelsRun).toEqual(expect.arrayContaining(['one_way', 'two_way', 'consortium', 'circular']));
        expect(createdRuns[0].source).toBe('publish');
        expect(updatedRun).toMatchObject({ createdCount: 1, resultCount: 1 });
    });

    it('skips in-run duplicate post_matches when the same strong key appears twice', async () => {
        let createCalls = 0;
        matchingService.dataService = {
            getPostMatchStrongKey(record) {
                const needId = record.payload?.needOpportunityId;
                const offerId = record.payload?.offerOpportunityId;
                return needId && offerId ? `one_way:${needId}:${offerId}` : null;
            },
            async getOpportunityById(id) {
                if (id === 'offer-2') {
                    return { id: 'offer-2', creatorId: 'creator-2', intent: 'offer', status: 'published' };
                }
                return { id, status: 'published', intent: 'request', creatorId: 'creator-1' };
            },
            async createMatchingRun() { return { id: 'run-dedupe' }; },
            async updateMatchingRun() { return null; },
            async createPostMatch(data) {
                createCalls += 1;
                return { id: 'pm-' + createCalls, ...data };
            },
            async getOpportunities() { return []; },
            async createNotification() { return null; }
        };

        matchingService.findMatchesForPost = async () => ({
            model: 'one_way',
            matches: [
                { matchScore: 0.85, matchedOpportunity: { id: 'offer-2', creatorId: 'creator-2' } },
                { matchScore: 0.82, matchedOpportunity: { id: 'offer-2', creatorId: 'creator-2' } }
            ]
        });

        const result = await matchingService.persistPostMatches('need-1', { model: 'one_way', source: 'manual_debug' });
        expect(createCalls).toBe(1);
        expect(result.createdCount).toBe(1);
        expect(result.created).toHaveLength(1);
    });

    it('does not notify when createPostMatch returns null (duplicate)', async () => {
        const notifications = [];
        matchingService.dataService = {
            async getOpportunityById(id) {
                return { id, status: 'published', intent: 'request', creatorId: 'u1' };
            },
            async createMatchingRun() { return { id: 'run-dup' }; },
            async updateMatchingRun() { return null; },
            async createPostMatch() { return null; },
            async getOpportunities() { return []; },
            async createNotification(n) { notifications.push(n); }
        };

        matchingService.findMatchesForPost = async () => ({
            model: 'one_way',
            matches: [{ matchScore: 0.8, matchedOpportunity: { id: 'o2' } }]
        });

        const result = await matchingService.persistPostMatches('need-dup', { model: 'one_way', source: 'manual_debug' });
        expect(result.created).toHaveLength(0);
        expect(result.skippedDuplicateCount).toBeGreaterThanOrEqual(0);
        expect(notifications).toHaveLength(0);
    });
});

describe('persistPreviewOpportunities bulk admin save', () => {
    it('aggregates created, skipped duplicates, and per-opportunity failures', async () => {
        const persistCalls = [];
        matchingService.persistPostMatches = async (opportunityId) => {
            persistCalls.push(opportunityId);
            if (opportunityId === 'fail-opp') {
                throw new Error('Simulated failure');
            }
            if (opportunityId === 'dup-opp') {
                return { created: [], createdCount: 0, skippedDuplicateCount: 2, resultCount: 2 };
            }
            return {
                created: [{ id: 'pm-' + opportunityId }],
                createdCount: 1,
                skippedDuplicateCount: 0,
                resultCount: 1
            };
        };

        const result = await matchingService.persistPreviewOpportunities(
            ['ok-opp', 'dup-opp', 'fail-opp', 'ok-opp'],
            { source: 'admin_command_center', actorId: 'admin-1' }
        );

        expect(persistCalls).toEqual(['ok-opp', 'dup-opp', 'fail-opp']);
        expect(result.opportunityCount).toBe(3);
        expect(result.createdCount).toBe(1);
        expect(result.skippedDuplicateCount).toBe(2);
        expect(result.failedCount).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].opportunityId).toBe('fail-opp');
    });
});
