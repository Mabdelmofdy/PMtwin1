/**
 * Coverage + role-safety check across every opportunity in data/opportunities.json.
 * Runs the real matching engine (via the simulation bootstrap) and asserts:
 *  - every published opportunity routes to at least one model;
 *  - no produced one_way/two_way match pairs two different professions;
 *  - the known negative pair (Architect need seed-opp-001 vs Civil Engineer offer
 *    seed-opp-004) is never matched.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const POC_ROOT = path.join(__dirname, '..');

function loadEnvelope(file) {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return raw.data != null ? raw.data : raw;
}

function createDataService(published) {
    const postMatches = [];
    let runCounter = 0;
    return {
        async getOpportunityById(id) { return published.find(o => o.id === id) || null; },
        async getOpportunities() { return [...published]; },
        async getPostMatches() { return [...postMatches]; },
        async createMatchingRun(meta) { runCounter += 1; return { id: `run-${runCounter}`, ...meta }; },
        getPostMatchStrongKey() { return null; },
        async createPostMatch(data) {
            const record = {
                id: `pm-${postMatches.length + 1}`,
                matchType: data.matchType || 'one_way',
                status: data.status || 'pending',
                matchScore: data.matchScore != null ? data.matchScore : 0,
                participants: data.participants || [],
                payload: data.payload || {}
            };
            postMatches.push(record);
            return record;
        }
    };
}

let opportunities;
let published;
let matchableForCoverage;
let byId;
let matchingService;
let hardConstraints;
let matches;

function roleOf(id) {
    const opp = byId[id];
    if (!opp) return '';
    const att = opp.attributes || {};
    return hardConstraints.normalizeRoleLabel(att.targetRole || att.professionalRole || opp.normalized?.role || '');
}

beforeAll(async () => {
    opportunities = loadEnvelope(path.join(POC_ROOT, 'data', 'opportunities.json'));
    published = opportunities.filter(o => (o.status || '') === 'published');
    // Lifecycle-aligned seed keeps few opps published; normalize status for coverage simulation only.
    matchableForCoverage = opportunities.map(o => ({ ...o, status: 'published' }));
    byId = Object.fromEntries(opportunities.map(o => [o.id, o]));

    const { bootstrap } = require(path.join(POC_ROOT, 'scripts', 'simulation', 'bootstrap-matching.js'));
    const svc = bootstrap({ simulationDir: false, basePath: '' });
    matchingService = svc.matchingService;
    hardConstraints = global.hardConstraints;

    const ds = createDataService(matchableForCoverage);
    global.dataService = ds;
    if (global.window) global.window.dataService = ds;
    matchingService.dataService = ds;
    matchingService.notifyPostMatch = async () => {};
    global.CONFIG.POST_MATCH_STATUS = { PENDING: 'pending', CONFIRMED: 'confirmed', DECLINED: 'declined', EXPIRED: 'expired' };

    for (const opp of matchableForCoverage) {
        await matchingService.persistPostMatches(opp.id, { source: 'test' });
    }
    matches = await ds.getPostMatches();
}, 60000);

describe('opportunity matching coverage', () => {
    it('routes every published opportunity (with a role) to at least one model', () => {
        const unrouted = published
            .filter(o => (o.attributes?.targetRole || o.attributes?.professionalRole))
            .filter(o => (matchingService.detectMatchingModel(o) || []).length === 0);
        expect(unrouted.map(o => o.id)).toEqual([]);
    });

    it('produces matches across the dataset', () => {
        expect(matches.length).toBeGreaterThan(0);
    });

    it('never pairs two different professions in one_way matches', () => {
        const violations = matches
            .filter(m => m.matchType === 'one_way')
            .filter(m => {
                const needRole = roleOf(m.payload.needOpportunityId);
                const offerRole = roleOf(m.payload.offerOpportunityId);
                return !needRole || !offerRole || needRole.toLowerCase() !== offerRole.toLowerCase();
            })
            .map(m => `${m.payload.needOpportunityId}->${m.payload.offerOpportunityId}`);
        expect(violations).toEqual([]);
    });

    it('never pairs two different professions in two_way matches', () => {
        const violations = [];
        matches.filter(m => m.matchType === 'two_way').forEach(m => {
            const a = m.payload.sideA || {};
            const b = m.payload.sideB || {};
            [[a.needId, b.offerId], [b.needId, a.offerId]].forEach(([n, o]) => {
                if (n && o && roleOf(n).toLowerCase() !== roleOf(o).toLowerCase()) {
                    violations.push(`${n}->${o}`);
                }
            });
        });
        expect(violations).toEqual([]);
    });

    it('never matches Architect need seed-opp-001 with Civil Engineer offer seed-opp-004', () => {
        const bad = matches.filter(m =>
            m.matchType === 'one_way' &&
            m.payload.needOpportunityId === 'seed-opp-001' &&
            m.payload.offerOpportunityId === 'seed-opp-004'
        );
        expect(bad).toEqual([]);
    });
});
