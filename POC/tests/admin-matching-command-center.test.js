/**
 * Phase 8: Admin Matching Command Center helpers.
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

global.CONFIG = {
    INVITATION_STATUS: { SENT: 'sent', ACCEPTED: 'accepted' },
    INVITATION_KIND: { REPLACEMENT: 'replacement' },
    REPLACEMENT_REQUEST_STATUS: {
        PENDING_OWNER_REVIEW: 'pending_owner_review',
        REPLACEMENT_ACCEPTED: 'replacement_accepted'
    },
    MATCHING: {
        ADMIN_MATCHING_MAX_CIRCULAR_ROWS: 100,
        NEGOTIATION: { STATUS: { OPEN: 'open', AGREED: 'agreed' } }
    }
};

const cc = require(path.join(__dirname, '..', 'src', 'services', 'matching', 'admin-matching-command-center.js'));

describe('buildPreviewRunSummary', () => {
    it('summarizes report counts and selectable rows', () => {
        const report = {
            totalPostsAnalyzed: 10,
            totalMatchesFound: 3,
            oneWayMatches: 1,
            twoWayMatches: 1,
            groupFormations: 0,
            circularExchanges: 1,
            oneWayNeedToOffers: [{
                opportunityId: 'opp-1',
                creatorId: 'u1',
                matches: [{ matchScore: 0.8, matchedOpportunity: { id: 'opp-2', creatorId: 'u2' } }]
            }],
            twoWayPairs: [],
            consortiumLeads: [],
            circularCycles: []
        };
        const summary = cc.buildPreviewRunSummary(report);
        expect(summary.totalPostsAnalyzed).toBe(10);
        expect(summary.selectableRowCount).toBe(1);
    });
});

describe('collectOpportunityIdsFromSelections', () => {
    it('unions opportunity ids from selected row keys', () => {
        const report = {
            creatorNames: {},
            oneWayNeedToOffers: [{
                opportunityId: 'opp-a',
                creatorId: 'u1',
                matches: [{ matchScore: 0.7, matchedOpportunity: { id: 'opp-b', creatorId: 'u2' } }]
            }],
            oneWayOfferToNeeds: [],
            twoWayPairs: [],
            consortiumLeads: [],
            circularCycles: []
        };
        const rows = cc.buildSelectableMatchRows(report);
        const ids = cc.collectOpportunityIdsFromSelections(rows, [rows[0].rowKey]);
        expect(ids).toContain('opp-a');
        expect(ids).toContain('opp-b');
    });
});

describe('circular display cap', () => {
    it('keeps full total in meta while capping displayed cycles', () => {
        const cycles = Array.from({ length: 150 }, (_, i) => ({
            matchScore: 1 - i * 0.001,
            cycle: ['u' + i],
            opportunityIds: ['opp-' + i]
        }));
        const report = { circularExchanges: 150, circularCycles: cycles };
        const meta = cc.getCircularDisplayMeta(report);
        expect(meta.total).toBe(150);
        expect(meta.displayed).toBe(100);
        expect(meta.hidden).toBe(50);
        expect(meta.note).toContain('100');
        expect(meta.note).toContain('150');
    });

    it('buildSelectableMatchRows caps circular rows', () => {
        const cycles = Array.from({ length: 120 }, (_, i) => ({
            matchScore: 0.9 - i * 0.001,
            cycle: ['u' + i],
            opportunityIds: ['opp-' + i]
        }));
        const report = {
            creatorNames: {},
            oneWayNeedToOffers: [],
            oneWayOfferToNeeds: [],
            twoWayPairs: [],
            consortiumLeads: [],
            circularCycles: cycles
        };
        const rows = cc.buildSelectableMatchRows(report);
        const circularRows = rows.filter(r => r.matchType === 'Circular');
        expect(circularRows.length).toBe(100);
    });
});

describe('buildLifecycleQueues', () => {
    it('returns invitation and negotiation queues from data service', async () => {
        const dataService = {
            getOpportunityInvitations: async () => [
                { id: 'inv-1', status: 'sent', matchId: 'm1', opportunityId: 'opp-1', invitationKind: 'apply', createdAt: '2026-01-01' }
            ],
            getNegotiations: async () => [
                { id: 'neg-1', status: 'open', matchId: 'm1', updatedAt: '2026-01-02' }
            ],
            getReplacementRequests: async () => [],
            getPostMatches: async () => [],
            getMatchingRuns: async () => [
                { id: 'run-1', opportunityId: 'opp-1', modelsRun: ['one_way'], source: 'publish', createdCount: 2, createdAt: '2026-01-01' }
            ],
            getMatchingPreviewRuns: async () => [
                { id: 'prev-1', totalMatchesFound: 5, selectableRowCount: 5, createdAt: '2026-01-03' }
            ]
        };
        const queues = await cc.buildLifecycleQueues(dataService);
        expect(queues.invitations).toHaveLength(1);
        expect(queues.negotiations).toHaveLength(1);
        expect(queues.matchingRuns).toHaveLength(1);
        expect(queues.previewRuns).toHaveLength(1);
    });

    it('includes replacement_accepted requests in replacement queue', async () => {
        const dataService = {
            getOpportunityInvitations: async () => [],
            getNegotiations: async () => [],
            getReplacementRequests: async () => [
                {
                    id: 'repl-1',
                    status: 'replacement_accepted',
                    matchId: 'm1',
                    opportunityId: 'opp-1',
                    roleToFill: 'lead',
                    updatedAt: '2026-02-01'
                },
                {
                    id: 'repl-2',
                    status: 'pending_owner_review',
                    matchId: 'm1',
                    opportunityId: 'opp-1',
                    updatedAt: '2026-01-01'
                }
            ],
            getPostMatches: async () => [],
            getMatchingRuns: async () => [],
            getMatchingPreviewRuns: async () => []
        };
        const queues = await cc.buildLifecycleQueues(dataService);
        expect(queues.replacements).toHaveLength(2);
        expect(queues.replacements.some(r => r.status === 'replacement_accepted')).toBe(true);
    });
});
