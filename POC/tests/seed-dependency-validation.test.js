import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dataDir = path.join(__dirname, '..', 'data');

function load(name) {
    return require(path.join(dataDir, name)).data || [];
}

function collectOppIdsFromPostMatch(pm) {
    const ids = new Set();
    (pm.participants || []).forEach((p) => {
        if (p.opportunityId) ids.add(p.opportunityId);
    });
    const pl = pm.payload || {};
    for (const key of ['needOpportunityId', 'offerOpportunityId', 'leadNeedId']) {
        if (typeof pl[key] === 'string') ids.add(pl[key]);
    }
    for (const key of ['sideA', 'sideB']) {
        const v = pl[key];
        if (typeof v === 'string') ids.add(v);
        else if (v?.opportunityId) ids.add(v.opportunityId);
    }
    (pl.cycle || []).forEach((c) => c.opportunityId && ids.add(c.opportunityId));
    (pl.links || []).forEach((l) => {
        if (l.needId) ids.add(l.needId);
        if (l.offerId) ids.add(l.offerId);
    });
    (pl.roles || []).forEach((r) => r.opportunityId && ids.add(r.opportunityId));
    return [...ids];
}

const APPLICATION_ONLY_OPPORTUNITIES = [
    'seed-opp-007',
    'seed-opp-023',
    'seed-opp-024',
    'seed-opp-031',
    'seed-opp-037',
];

const REMOVED_APPLICATION_IDS = [
    'seed-app-003',
    'seed-app-004',
    'seed-app-005',
    'seed-app-006',
    'seed-app-007',
    'seed-app-008',
    'seed-app-009',
];

describe('seed dependency validation — PostMatch-first (Phase B)', () => {
    const opportunities = load('opportunities.json');
    const postMatches = load('demo-post-matches.json');
    const negotiations = load('demo-negotiations.json');
    const deals = load('demo-deals.json');
    const contracts = load('demo-contracts.json');
    const applications = load('demo-applications.json');

    const pmIds = new Set(postMatches.map((p) => p.id));
    const dealIds = new Set(deals.map((d) => d.id));
    const contractIds = new Set(contracts.map((c) => c.id));
    const appIds = new Set(applications.map((a) => a.id));

    const oppToPm = new Map();
    postMatches.forEach((pm) => {
        collectOppIdsFromPostMatch(pm).forEach((oppId) => {
            if (!oppToPm.has(oppId)) oppToPm.set(oppId, []);
            oppToPm.get(oppId).push(pm.id);
        });
    });

    it('keeps exactly 40 canonical opportunities', () => {
        expect(opportunities).toHaveLength(40);
    });

    it('has increased post-match count after Phase B migration', () => {
        expect(postMatches.length).toBeGreaterThanOrEqual(23);
    });

    it('covers all match types in demo post-matches', () => {
        const types = new Set(postMatches.map((p) => p.matchType));
        expect(types.has('one_way')).toBe(true);
        expect(types.has('two_way')).toBe(true);
        expect(types.has('consortium')).toBe(true);
        expect(types.has('circular')).toBe(true);
    });

    it('ensures every negotiation references an existing post-match', () => {
        for (const neg of negotiations) {
            expect(neg.matchId, `negotiation ${neg.id}`).toBeTruthy();
            expect(pmIds.has(neg.matchId), `negotiation ${neg.id} → ${neg.matchId}`).toBe(true);
        }
    });

    it('ensures negotiations are post-match-first (no applicationId)', () => {
        for (const neg of negotiations) {
            expect(neg.applicationId, `negotiation ${neg.id}`).toBeNull();
        }
    });

    it('ensures every deal references existing post-match and negotiation', () => {
        const negIds = new Set(negotiations.map((n) => n.id));
        for (const deal of deals) {
            expect(pmIds.has(deal.matchId), `deal ${deal.id}`).toBe(true);
            if (deal.negotiationId) {
                expect(negIds.has(deal.negotiationId), `deal ${deal.id}`).toBe(true);
            }
            if (deal.contractId) {
                expect(contractIds.has(deal.contractId), `deal ${deal.id}`).toBe(true);
            }
        }
    });

    it('ensures every contract references existing deal and post-match', () => {
        for (const contract of contracts) {
            expect(dealIds.has(contract.dealId), `contract ${contract.id}`).toBe(true);
            expect(pmIds.has(contract.matchId), `contract ${contract.id}`).toBe(true);
        }
    });

    it('has no application-only opportunities without post-matches', () => {
        for (const oppId of APPLICATION_ONLY_OPPORTUNITIES) {
            expect(oppToPm.get(oppId)?.length, oppId).toBeGreaterThan(0);
        }
    });

    it('removed legacy application-only seed rows', () => {
        for (const appId of REMOVED_APPLICATION_IDS) {
            expect(appIds.has(appId), appId).toBe(false);
        }
    });

    it('has no demo applications without a post-match link when present', () => {
        for (const app of applications) {
            expect(app.matchId, `application ${app.id}`).toBeTruthy();
            expect(pmIds.has(app.matchId), `application ${app.id}`).toBe(true);
        }
    });

    it('preserves negotiation status coverage', () => {
        const statuses = negotiations.map((n) => n.status);
        expect(statuses).toContain('active');
        expect(statuses).toContain('agreed');
        expect(statuses.some((s) => s === 'counter_offered' || s === 'countered')).toBe(true);
    });

    it('preserves deal and contract examples', () => {
        expect(dealIds.has('seed-deal-oneway-01')).toBe(true);
        expect(dealIds.has('seed-deal-consortium-01')).toBe(true);
        expect(dealIds.has('seed-deal-exchange-01')).toBe(true);
        expect(contractIds.has('seed-contract-oneway-01')).toBe(true);
        expect(contractIds.has('seed-contract-consortium-01')).toBe(true);
        expect(contractIds.has('seed-contract-exchange-01')).toBe(true);
    });
});

const OPP_STATUS_RANK = {
    published: 0,
    matched: 1,
    in_negotiation: 2,
    negotiating: 2,
    contracted: 3,
    in_execution: 4,
    executing: 4,
    completed: 5,
    closed: 5,
};

describe('seed lifecycle alignment — Phase C', () => {
    const opportunities = load('opportunities.json');
    const postMatches = load('demo-post-matches.json');
    const negotiations = load('demo-negotiations.json');
    const deals = load('demo-deals.json');
    const contracts = load('demo-contracts.json');
    const applications = load('demo-applications.json');

    const pmById = Object.fromEntries(postMatches.map((p) => [p.id, p]));
    const negById = Object.fromEntries(negotiations.map((n) => [n.id, n]));

    it('does not leave all opportunities published', () => {
        const publishedOnly = opportunities.every((o) => (o.status || 'published') === 'published');
        expect(publishedOnly).toBe(false);
    });

    it('ensures agreed negotiations have confirmed post-matches', () => {
        for (const neg of negotiations.filter((n) => n.status === 'agreed')) {
            const pm = pmById[neg.matchId];
            expect(pm?.status, `neg ${neg.id}`).toBe('confirmed');
        }
    });

    it('ensures active negotiations have accepted or confirmed post-matches', () => {
        const active = new Set(['active', 'counter_offered', 'countered', 'open']);
        for (const neg of negotiations.filter((n) => active.has(n.status))) {
            const pm = pmById[neg.matchId];
            expect(['accepted', 'confirmed'], `neg ${neg.id}`).toContain(pm?.status);
        }
    });

    it('ensures every deal has agreed negotiation and confirmed post-match', () => {
        for (const deal of deals) {
            expect(pmById[deal.matchId]?.status, deal.id).toBe('confirmed');
            if (deal.negotiationId) {
                expect(negById[deal.negotiationId]?.status, deal.id).toBe('agreed');
            }
        }
    });

    it('ensures every contract links to an existing deal with consistent status', () => {
        const dealById = Object.fromEntries(deals.map((d) => [d.id, d]));
        for (const contract of contracts) {
            const deal = dealById[contract.dealId];
            expect(deal, contract.id).toBeTruthy();
            if (contract.status === 'completed') {
                expect(deal.status).toBe('completed');
            }
            if (contract.status === 'active') {
                expect(['execution', 'executing', 'active']).toContain(deal.status);
            }
        }
    });

    it('reflects deepest lifecycle stage on key workflow opportunities', () => {
        const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]));
        expect(byId['seed-opp-001']?.status).toBe('completed');
        expect(byId['seed-opp-005']?.status).toBe('in_negotiation');
        expect(byId['seed-opp-014']?.status).toBe('in_execution');
        expect(byId['seed-opp-015']?.status).toBe('contracted');
        expect(byId['seed-opp-023']?.status).toBe('matched');
    });

    it('has no applicationId on negotiations, deals, or contracts', () => {
        for (const neg of negotiations) expect(neg.applicationId).toBeNull();
        for (const deal of deals) expect(deal.applicationId).toBeNull();
        for (const contract of contracts) expect(contract.applicationId).toBeNull();
        expect(applications).toHaveLength(0);
    });

    it('preserves mixed post-match statuses (pending, accepted, confirmed)', () => {
        const statuses = new Set(postMatches.map((p) => p.status));
        expect(statuses.has('pending')).toBe(true);
        expect(statuses.has('accepted')).toBe(true);
        expect(statuses.has('confirmed')).toBe(true);
    });

    it('keeps opportunity status rank consistent with linked entities', () => {
        const linkedPmOpp = new Set();
        postMatches.forEach((pm) => collectOppIdsFromPostMatch(pm).forEach((id) => linkedPmOpp.add(id)));
        for (const opp of opportunities) {
            const rank = OPP_STATUS_RANK[opp.status] ?? 0;
            if (!linkedPmOpp.has(opp.id)) {
                expect(rank, opp.id).toBe(OPP_STATUS_RANK.published);
            }
        }
    });
});
