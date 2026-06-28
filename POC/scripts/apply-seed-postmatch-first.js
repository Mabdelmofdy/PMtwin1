/**
 * Apply PostMatch-first demo overlay (Phase A + Phase B).
 * Merges engine-generated post-matches with manual workflow supplements,
 * then writes negotiations, deals, contracts, and clears application-only rows.
 *
 * Run from POC: node scripts/apply-seed-postmatch-first.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PENDING_EXPIRY = '2026-06-24T09:00:00.000Z';
const MATCH_AT = '2026-03-01T09:00:00.000Z';
const T = {
    matchAt: MATCH_AT,
    negEnd: '2026-03-12T15:00:00.000Z',
    dealAt: '2026-03-15T09:00:00.000Z',
    contractAt: '2026-03-18T12:00:00.000Z',
    completedAt: '2026-05-20T16:00:00.000Z',
};

/** Deepest opportunity status per seed workflow stage (POC legacy aliases supported by @pm-twin/lifecycle). */
const EXPLICIT_OPPORTUNITY_STATUS = {
    'seed-opp-001': 'completed',
    'seed-opp-002': 'completed',
    'seed-opp-005': 'in_negotiation',
    'seed-opp-007': 'in_negotiation',
    'seed-opp-010': 'in_negotiation',
    'seed-opp-011': 'in_negotiation',
    'seed-opp-012': 'in_negotiation',
    'seed-opp-013': 'in_negotiation',
    'seed-opp-014': 'in_execution',
    'seed-opp-015': 'contracted',
    'seed-opp-016': 'in_negotiation',
    'seed-opp-025': 'in_negotiation',
    'seed-opp-026': 'in_negotiation',
    'seed-opp-027': 'in_negotiation',
    'seed-opp-028': 'in_negotiation',
    'seed-opp-031': 'in_negotiation',
    'seed-opp-035': 'contracted',
    'seed-opp-036': 'in_negotiation',
    'seed-opp-037': 'in_negotiation',
    'seed-opp-039': 'in_execution',
    'seed-opp-040': 'in_negotiation',
};

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

function collectOppIdsFromPostMatch(pm) {
    const ids = new Set();
    (pm.participants || []).forEach((p) => { if (p.opportunityId) ids.add(p.opportunityId); });
    const pl = pm.payload || {};
    for (const key of ['needOpportunityId', 'offerOpportunityId', 'leadNeedId']) {
        if (typeof pl[key] === 'string') ids.add(pl[key]);
    }
    (pl.links || []).forEach((l) => {
        if (l.needId) ids.add(l.needId);
        if (l.offerId) ids.add(l.offerId);
    });
    (pl.roles || []).forEach((r) => { if (r.opportunityId) ids.add(r.opportunityId); });
    return ids;
}

function confirmPostMatch(match, { dealId = null, negotiationId = null, at = T.dealAt } = {}) {
    if (!match) return;
    match.status = 'confirmed';
    match.participants = (match.participants || []).map((p) => ({
        ...p,
        participantStatus: 'accepted',
        respondedAt: T.matchAt,
    }));
    match.updatedAt = at;
    if (dealId) match.dealId = dealId;
    if (negotiationId) match.negotiationId = negotiationId;
}

function acceptPostMatch(match, negotiationId, at = T.negEnd) {
    if (!match) return;
    match.status = 'accepted';
    match.participants = (match.participants || []).map((p, index) => ({
        ...p,
        participantStatus: index === 0 ? 'accepted' : 'pending',
        respondedAt: index === 0 ? T.matchAt : null,
    }));
    match.negotiationId = negotiationId;
    match.updatedAt = at;
}

function alignPostMatchStatuses(matches, negotiations, deals) {
    const negById = Object.fromEntries(negotiations.map((n) => [n.id, n]));
    const dealByMatchId = new Map(deals.map((d) => [d.matchId, d]));

    const oneway0102 = findOneWay(matches, 'seed-opp-001', 'seed-opp-002');
    const need005 = findOneWay(matches, 'seed-opp-005', 'seed-opp-011') || findOneWay(matches, 'seed-opp-005', 'seed-opp-002');
    const barter = findTwoWayWithOpp(matches, 'seed-opp-010');
    const consortium = findConsortiumLead(matches, 'seed-opp-014');
    const barterTask = findOneWay(matches, 'seed-opp-026', 'seed-opp-027');
    const equityJv = findOneWay(matches, 'seed-opp-028', 'seed-opp-040');
    const consortiumWind = matches.find((m) => m.id === 'demo-pm-consortium-wind') || findConsortiumLead(matches, 'seed-opp-039');

    confirmPostMatch(oneway0102, { dealId: 'seed-deal-oneway-01', negotiationId: 'seed-neg-01', at: T.completedAt });
    confirmPostMatch(need005, { negotiationId: 'seed-neg-03', at: T.negEnd });
    confirmPostMatch(barter, { negotiationId: 'seed-neg-02', at: T.negEnd });
    confirmPostMatch(consortium, { dealId: 'seed-deal-consortium-01', negotiationId: 'seed-neg-04', at: T.contractAt });
    confirmPostMatch(barterTask, { negotiationId: 'seed-neg-05', at: T.negEnd });
    confirmPostMatch(equityJv, { negotiationId: 'seed-neg-06', at: T.negEnd });
    confirmPostMatch(consortiumWind, { dealId: 'seed-deal-exchange-01', negotiationId: 'seed-neg-07', at: T.contractAt });

    acceptPostMatch(matches.find((m) => m.id === 'demo-pm-oneway-15'), 'seed-neg-08');
    acceptPostMatch(matches.find((m) => m.id === 'demo-pm-oneway-18'), 'seed-neg-09');
    acceptPostMatch(matches.find((m) => m.id === 'demo-pm-oneway-19'), 'seed-neg-10');

    for (const match of matches) {
        if (['confirmed', 'accepted', 'declined', 'expired'].includes(match.status)) continue;
        const neg = match.negotiationId ? negById[match.negotiationId] : negotiations.find((n) => n.matchId === match.id);
        const deal = match.dealId ? deals.find((d) => d.id === match.dealId) : dealByMatchId.get(match.id);
        if (deal || (neg && neg.status === 'agreed')) {
            confirmPostMatch(match, {
                dealId: deal?.id || match.dealId,
                negotiationId: neg?.id || match.negotiationId,
                at: deal?.status === 'completed' ? T.completedAt : T.contractAt,
            });
        }
    }
}

function alignOpportunityStatuses(opportunities, matches) {
    const linkedOppIds = new Set();
    matches.forEach((pm) => collectOppIdsFromPostMatch(pm).forEach((id) => linkedOppIds.add(id)));

    return opportunities.map((opp) => {
        let status = EXPLICIT_OPPORTUNITY_STATUS[opp.id];
        if (!status) {
            status = linkedOppIds.has(opp.id) ? 'matched' : 'published';
        }
        const updatedAt = status === 'completed'
            ? T.completedAt
            : (['in_execution', 'contracted'].includes(status) ? T.contractAt : opp.updatedAt);
        return { ...opp, status, updatedAt };
    });
}

function assertLifecycleIntegrity(matches, negotiations, deals, contracts, opportunities) {
    const pmById = Object.fromEntries(matches.map((m) => [m.id, m]));
    const negById = Object.fromEntries(negotiations.map((n) => [n.id, n]));
    const errors = [];

    const activeNegStatuses = new Set(['active', 'counter_offered', 'countered', 'open']);
    const agreedNegStatuses = new Set(['agreed']);

    for (const neg of negotiations) {
        const pm = pmById[neg.matchId];
        if (!pm) {
            errors.push(`negotiation ${neg.id} missing post-match`);
            continue;
        }
        if (agreedNegStatuses.has(neg.status) && pm.status !== 'confirmed') {
            errors.push(`negotiation ${neg.id} agreed but post-match ${pm.id} is ${pm.status}`);
        }
        if (activeNegStatuses.has(neg.status) && !['accepted', 'confirmed'].includes(pm.status)) {
            errors.push(`negotiation ${neg.id} active but post-match ${pm.id} is ${pm.status}`);
        }
    }

    for (const deal of deals) {
        const pm = pmById[deal.matchId];
        if (!pm || pm.status !== 'confirmed') {
            errors.push(`deal ${deal.id} requires confirmed post-match`);
        }
        if (deal.negotiationId) {
            const neg = negById[deal.negotiationId];
            if (!neg || !agreedNegStatuses.has(neg.status)) {
                errors.push(`deal ${deal.id} requires agreed negotiation`);
            }
        }
        if (deal.contractId) {
            const contract = contracts.find((c) => c.id === deal.contractId);
            if (!contract) errors.push(`deal ${deal.id} missing contract ${deal.contractId}`);
        }
    }

    for (const contract of contracts) {
        const deal = deals.find((d) => d.id === contract.dealId);
        if (!deal) errors.push(`contract ${contract.id} missing deal`);
        if (contract.status === 'completed' && deal?.status !== 'completed') {
            errors.push(`contract ${contract.id} completed but deal is ${deal?.status}`);
        }
        if (contract.status === 'active' && !['execution', 'executing', 'active'].includes(deal?.status || '')) {
            errors.push(`contract ${contract.id} active but deal is ${deal?.status}`);
        }
    }

    for (const opp of opportunities) {
        const rank = OPP_STATUS_RANK[opp.status] ?? 0;
        if (EXPLICIT_OPPORTUNITY_STATUS[opp.id] && opp.status !== EXPLICIT_OPPORTUNITY_STATUS[opp.id]) {
            errors.push(`opportunity ${opp.id} expected ${EXPLICIT_OPPORTUNITY_STATUS[opp.id]} got ${opp.status}`);
        }
        const linked = matches.some((pm) => collectOppIdsFromPostMatch(pm).has(opp.id));
        if (!linked && rank > OPP_STATUS_RANK.published) {
            errors.push(`opportunity ${opp.id} status ${opp.status} without post-match link`);
        }
    }

    if (errors.length) {
        throw new Error(`Lifecycle alignment failed:\n${errors.join('\n')}`);
    }
}

function readEnvelope(file) {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return { data: [] };
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeEnvelope(file, envelope) {
    fs.writeFileSync(path.join(DATA_DIR, file), `${JSON.stringify(envelope, null, 2)}\n`);
}

function findOneWay(matches, needId, offerId) {
    return matches.find(
        (m) => m.matchType === 'one_way'
            && m.payload?.needOpportunityId === needId
            && m.payload?.offerOpportunityId === offerId
    );
}

function findConsortiumLead(matches, leadNeedId) {
    return matches.find(
        (m) => m.matchType === 'consortium'
            && (m.payload?.leadNeedId === leadNeedId || m.payload?.needOpportunityId === leadNeedId)
    );
}

function findTwoWayWithOpp(matches, opportunityId) {
    return matches.find((m) => {
        if (m.matchType !== 'two_way') return false;
        const pl = m.payload || {};
        const sideA = pl.sideA || {};
        const sideB = pl.sideB || {};
        return [sideA.needId, sideA.offerId, sideB.needId, sideB.offerId].includes(opportunityId);
    });
}

const MANUAL_POST_MATCHES = [
    {
        id: 'demo-pm-consortium-wind',
        matchType: 'consortium',
        status: 'pending',
        matchScore: 1.1,
        runId: 'seed-run-039',
        participants: [
            { userId: 'seed-co-corp-005', opportunityId: 'seed-opp-039', role: 'consortium_lead', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-013', opportunityId: 'seed-opp-035', role: 'consortium_member', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            leadNeedId: 'seed-opp-039',
            needOpportunityId: 'seed-opp-039',
            roles: [{ role: 'EPC contractor', opportunityId: 'seed-opp-035', userId: 'seed-user-013' }]
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-14',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.625,
        runId: 'seed-run-007',
        participants: [
            { userId: 'seed-co-corp-001', opportunityId: 'seed-opp-007', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-006', opportunityId: 'seed-opp-008', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-007',
            offerOpportunityId: 'seed-opp-008',
            breakdown: { skillMatch: 0.25, attributeOverlap: 0.25, serviceOverlapPct: 0.25, exchangeCompatibility: 1, valueCompatibility: 0.5, budgetFit: 0.75, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-15',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.88,
        runId: 'seed-run-007',
        participants: [
            { userId: 'seed-co-corp-001', opportunityId: 'seed-opp-007', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-012', opportunityId: 'seed-opp-016', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-007',
            offerOpportunityId: 'seed-opp-016',
            breakdown: { skillMatch: 0.75, attributeOverlap: 0.75, serviceOverlapPct: 0.75, exchangeCompatibility: 1, valueCompatibility: 0.5, budgetFit: 0.8, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-16',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.72,
        runId: 'seed-run-023',
        participants: [
            { userId: 'seed-co-corp-001', opportunityId: 'seed-opp-023', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-002', opportunityId: 'seed-opp-004', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-023',
            offerOpportunityId: 'seed-opp-004',
            breakdown: { skillMatch: 0.67, attributeOverlap: 0.67, serviceOverlapPct: 0.67, exchangeCompatibility: 1, valueCompatibility: 0.5, budgetFit: 0.7, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-17',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.78,
        runId: 'seed-run-024',
        participants: [
            { userId: 'seed-co-corp-002', opportunityId: 'seed-opp-024', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-017', opportunityId: 'seed-opp-033', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-024',
            offerOpportunityId: 'seed-opp-033',
            breakdown: { skillMatch: 0.75, attributeOverlap: 0.75, serviceOverlapPct: 0.75, exchangeCompatibility: 0.5, valueCompatibility: 0.5, budgetFit: 0.8, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-18',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.85,
        runId: 'seed-run-031',
        participants: [
            { userId: 'seed-user-006', opportunityId: 'seed-opp-031', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-co-corp-003', opportunityId: 'seed-opp-025', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-031',
            offerOpportunityId: 'seed-opp-025',
            breakdown: { skillMatch: 0.67, attributeOverlap: 0.67, serviceOverlapPct: 0.67, exchangeCompatibility: 0.5, valueCompatibility: 0.5, budgetFit: 1, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    },
    {
        id: 'demo-pm-oneway-19',
        matchType: 'one_way',
        status: 'pending',
        matchScore: 0.68,
        runId: 'seed-run-037',
        participants: [
            { userId: 'seed-co-corp-004', opportunityId: 'seed-opp-037', role: 'need_owner', participantStatus: 'pending', respondedAt: null },
            { userId: 'seed-user-014', opportunityId: 'seed-opp-036', role: 'offer_provider', participantStatus: 'pending', respondedAt: null }
        ],
        payload: {
            needOpportunityId: 'seed-opp-037',
            offerOpportunityId: 'seed-opp-036',
            breakdown: { skillMatch: 0.25, attributeOverlap: 0.25, serviceOverlapPct: 0.25, exchangeCompatibility: 1, valueCompatibility: 0.5, budgetFit: 0.5, timelineFit: 1, locationFit: 1, reputation: 0.5 },
            valueAnalysis: null
        },
        createdAt: MATCH_AT,
        updatedAt: MATCH_AT,
        expiresAt: PENDING_EXPIRY,
        isReplacement: false
    }
];

function mergeManualPostMatches(matches) {
    const byId = new Map(matches.map((m) => [m.id, m]));
    for (const manual of MANUAL_POST_MATCHES) {
        if (!byId.has(manual.id)) {
            byId.set(manual.id, manual);
        }
    }
    return Array.from(byId.values());
}

function buildNegotiations(matches) {
    const oneway0102 = findOneWay(matches, 'seed-opp-001', 'seed-opp-002');
    const need005 = findOneWay(matches, 'seed-opp-005', 'seed-opp-011') || findOneWay(matches, 'seed-opp-005', 'seed-opp-002');
    const barter = findTwoWayWithOpp(matches, 'seed-opp-010');
    const consortium = findConsortiumLead(matches, 'seed-opp-014');
    const barterTask = findOneWay(matches, 'seed-opp-026', 'seed-opp-027');
    const equityJv = findOneWay(matches, 'seed-opp-028', 'seed-opp-040');
    const consortiumWind = matches.find((m) => m.id === 'demo-pm-consortium-wind') || findConsortiumLead(matches, 'seed-opp-039');

    return [
        {
            id: 'seed-neg-01', opportunityId: 'seed-opp-001', matchId: oneway0102?.id, applicationId: null,
            parties: [{ userId: 'seed-user-001', role: 'need_owner' }, { userId: 'seed-user-002', role: 'offer_provider' }],
            status: 'agreed',
            initialTerms: { value: 275000, currency: 'SAR', duration: '4 months', paymentSchedule: '40% on start, 60% on completion' },
            rounds: [
                { by: 'seed-user-002', at: '2026-03-08T11:00:00.000Z', proposal: { value: 275000 }, message: 'Proposing 275K SAR for the full architect package.' },
                { by: 'seed-user-001', at: '2026-03-12T15:00:00.000Z', proposal: { value: 250000, paymentSchedule: '30/40/30 milestone-based' }, message: 'Counter at 250K SAR with milestone payments.' },
                { by: 'seed-user-002', at: '2026-03-15T09:00:00.000Z', proposal: { value: 250000 }, message: 'Agreed at 250K SAR. Proceeding to deal.' }
            ],
            agreedTerms: { value: 250000, currency: 'SAR', duration: '4 months', paymentSchedule: '30% on start, 40% at midpoint, 30% on completion' },
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-15T09:00:00.000Z'
        },
        {
            id: 'seed-neg-02', opportunityId: 'seed-opp-010', matchId: barter?.id, applicationId: null,
            parties: [{ userId: 'seed-user-008', role: 'need_owner' }, { userId: 'seed-user-009', role: 'offer_provider' }],
            status: 'counter_offered',
            initialTerms: { value: 100000, currency: 'SAR', exchangeMode: 'barter', duration: '3 months' },
            rounds: [
                { by: 'seed-user-008', at: '2026-03-08T11:00:00.000Z', proposal: { value: 100000, exchangeMode: 'barter' }, message: 'Barter: my BIM/architecture for your MEP, ~100K SAR equivalent.' },
                { by: 'seed-user-009', at: '2026-03-12T15:00:00.000Z', proposal: { value: 110000, exchangeMode: 'barter' }, message: 'Counter: scope is closer to 110K SAR equivalent.' }
            ],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'seed-neg-03', opportunityId: 'seed-opp-005', matchId: need005?.id, applicationId: null,
            parties: [{ userId: 'seed-co-corp-002', role: 'need_owner' }, { userId: 'seed-user-002', role: 'offer_provider' }],
            status: 'active',
            initialTerms: { value: 150000, currency: 'SAR', duration: '3 months' },
            rounds: [{ by: 'seed-user-002', at: '2026-03-08T11:00:00.000Z', proposal: { value: 150000 }, message: 'Proposing 150K SAR for the BIM + Revit scope.' }],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-08T11:00:00.000Z'
        },
        {
            id: 'seed-neg-04', opportunityId: 'seed-opp-014', matchId: consortium?.id, applicationId: null,
            parties: [{ userId: 'seed-co-corp-005', role: 'consortium_lead' }, { userId: 'seed-user-011', role: 'consortium_member' }],
            status: 'agreed',
            initialTerms: { value: 15000000, currency: 'SAR', duration: '18 months', paymentSchedule: 'Milestone-based' },
            rounds: [
                { by: 'seed-co-corp-005', at: '2026-03-08T11:00:00.000Z', proposal: { value: 15000000 }, message: 'Consortium terms for the highway package; defined role split.' },
                { by: 'seed-user-011', at: '2026-03-12T15:00:00.000Z', proposal: { value: 15000000 }, message: 'Architect scope accepted. Proceeding to deal.' }
            ],
            agreedTerms: { value: 15000000, currency: 'SAR', duration: '18 months', paymentSchedule: 'Milestone-based across design and works' },
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'seed-neg-05', opportunityId: 'seed-opp-026', matchId: barterTask?.id, applicationId: null,
            parties: [{ userId: 'seed-user-001', role: 'need_owner' }, { userId: 'seed-user-002', role: 'offer_provider' }],
            status: 'counter_offered',
            initialTerms: { value: 85000, currency: 'SAR', exchangeMode: 'barter', duration: '6 weeks' },
            rounds: [
                { by: 'seed-user-001', at: '2026-03-08T11:00:00.000Z', proposal: { value: 85000, exchangeMode: 'barter' }, message: 'Barter: CAD production for PM support, ~85K SAR equivalent.' },
                { by: 'seed-user-002', at: '2026-03-12T15:00:00.000Z', proposal: { value: 90000, exchangeMode: 'barter' }, message: 'Counter: scope includes QA pass, ~90K SAR equivalent.' }
            ],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'seed-neg-06', opportunityId: 'seed-opp-028', matchId: equityJv?.id, applicationId: null,
            parties: [{ userId: 'seed-co-corp-004', role: 'need_owner' }, { userId: 'seed-user-009', role: 'offer_provider' }],
            status: 'active',
            initialTerms: { equityPercentage: 45, exchangeMode: 'equity', duration: '36 months' },
            rounds: [{ by: 'seed-user-009', at: '2026-03-08T11:00:00.000Z', proposal: { equityPercentage: 35 }, message: 'Offering 35% equity for EPC and construction management contribution.' }],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-08T11:00:00.000Z'
        },
        {
            id: 'seed-neg-07', opportunityId: 'seed-opp-039', matchId: consortiumWind?.id, applicationId: null,
            parties: [{ userId: 'seed-co-corp-005', role: 'consortium_lead' }, { userId: 'seed-user-013', role: 'consortium_member' }],
            status: 'agreed',
            initialTerms: { profitSplit: '65-35', exchangeMode: 'profit_sharing', duration: '24 months' },
            rounds: [
                { by: 'seed-co-corp-005', at: '2026-03-08T11:00:00.000Z', proposal: { profitSplit: '65-35' }, message: 'Wind farm consortium: 65-35 profit share after O&M costs.' },
                { by: 'seed-user-013', at: '2026-03-12T15:00:00.000Z', proposal: { profitSplit: '65-35' }, message: 'Equipment and O&M scope accepted. Proceeding to deal.' }
            ],
            agreedTerms: { profitSplit: '65-35', exchangeMode: 'profit_sharing', duration: '24 months', profitDistribution: 'Annual distribution after O&M costs' },
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'seed-neg-08', opportunityId: 'seed-opp-007', matchId: 'demo-pm-oneway-15', applicationId: null,
            parties: [{ userId: 'seed-co-corp-001', role: 'need_owner' }, { userId: 'seed-user-012', role: 'offer_provider' }],
            status: 'active',
            initialTerms: { value: 420000, currency: 'SAR', duration: '5 months' },
            rounds: [{ by: 'seed-user-012', at: '2026-03-08T11:00:00.000Z', proposal: { value: 420000 }, message: 'Full civil scope: site planning, drainage and road design.' }],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-08T11:00:00.000Z'
        },
        {
            id: 'seed-neg-09', opportunityId: 'seed-opp-031', matchId: 'demo-pm-oneway-18', applicationId: null,
            parties: [{ userId: 'seed-user-006', role: 'need_owner' }, { userId: 'seed-co-corp-003', role: 'offer_provider' }],
            status: 'active',
            initialTerms: { profitSplit: '70-30', exchangeMode: 'profit_sharing', duration: '12 months' },
            rounds: [{ by: 'seed-co-corp-003', at: '2026-03-08T11:00:00.000Z', proposal: { profitSplit: '70-30' }, message: 'MEP supply partnership with profit-sharing on joint commercial projects.' }],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-08T11:00:00.000Z'
        },
        {
            id: 'seed-neg-10', opportunityId: 'seed-opp-037', matchId: 'demo-pm-oneway-19', applicationId: null,
            parties: [{ userId: 'seed-co-corp-004', role: 'need_owner' }, { userId: 'seed-user-014', role: 'offer_provider' }],
            status: 'counter_offered',
            initialTerms: { exchangeMode: 'barter', barterValue: 45000, currency: 'SAR', duration: '6 weeks' },
            rounds: [
                { by: 'seed-co-corp-004', at: '2026-03-08T11:00:00.000Z', proposal: { barterValue: 45000, exchangeMode: 'barter' }, message: 'Legal contract review in exchange for technical consulting hours.' },
                { by: 'seed-user-014', at: '2026-03-12T15:00:00.000Z', proposal: { barterValue: 50000, exchangeMode: 'barter' }, message: 'Counter: formwork logistics scope adds ~5K SAR equivalent.' }
            ],
            agreedTerms: null, expiresAt: PENDING_EXPIRY,
            createdAt: '2026-03-08T11:00:00.000Z', updatedAt: '2026-03-12T15:00:00.000Z'
        }
    ];
}

function buildDeals(matches, negotiations) {
    const negById = Object.fromEntries(negotiations.map((n) => [n.id, n]));
    const oneway0102 = findOneWay(matches, 'seed-opp-001', 'seed-opp-002');
    const consortium = findConsortiumLead(matches, 'seed-opp-014');
    const consortiumWind = matches.find((m) => m.id === 'demo-pm-consortium-wind');

    return [
        {
            id: 'seed-deal-oneway-01', matchId: oneway0102?.id, applicationId: null, negotiationId: 'seed-neg-01',
            opportunityId: 'seed-opp-001', opportunityIds: ['seed-opp-001', 'seed-opp-002'],
            matchType: 'one_way', status: 'completed', title: 'Architect package — sustainable tower design',
            participants: [
                { userId: 'seed-user-001', role: 'need_owner', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-002', role: 'offer_provider', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            payload: null, roleSlots: null,
            scope: 'Full architectural design package: BIM, 3D visualization, sustainable design, LEED support.',
            timeline: { start: '2026-03-20', end: '2026-05-20' },
            exchangeMode: 'cash',
            valueTerms: { agreedValue: 250000, paymentSchedule: '30% on start, 40% at midpoint, 30% on completion' },
            deliverables: 'Concept, schematic and detailed design with BIM model.',
            milestones: [
                { id: 'seed-ms-ow-01', title: 'Concept design', description: 'Concept design approved.', dueDate: '2026-04-05', status: 'approved', deliverables: 'Concept set', submittedAt: '2026-04-03T09:00:00.000Z', approvedAt: '2026-04-05T09:00:00.000Z', approvedBy: 'seed-user-001' },
                { id: 'seed-ms-ow-02', title: 'Detailed design', description: 'Detailed design delivered and approved.', dueDate: '2026-05-18', status: 'approved', deliverables: 'Detailed set + BIM', submittedAt: '2026-05-16T09:00:00.000Z', approvedAt: '2026-05-18T09:00:00.000Z', approvedBy: 'seed-user-001' }
            ],
            contractId: 'seed-contract-oneway-01',
            createdAt: '2026-03-15T09:00:00.000Z', updatedAt: '2026-05-20T16:00:00.000Z', completedAt: '2026-05-20T16:00:00.000Z', closedAt: null
        },
        {
            id: 'seed-deal-consortium-01', matchId: consortium?.id, applicationId: null, negotiationId: 'seed-neg-04',
            opportunityId: 'seed-opp-014', opportunityIds: ['seed-opp-014', 'seed-opp-015'],
            matchType: 'consortium', status: 'execution', title: 'Highway package consortium',
            participants: [
                { userId: 'seed-co-corp-005', role: 'consortium_lead', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-011', role: 'consortium_member', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            payload: { leadNeedId: 'seed-opp-014', roles: [{ role: 'Architect', opportunityId: 'seed-opp-015', userId: 'seed-user-011' }] },
            roleSlots: null,
            scope: 'Highway design-and-build package delivered by a led consortium (PM lead, architect, civil).',
            timeline: { start: '2026-03-20', end: '2027-09-20' },
            exchangeMode: 'cash',
            valueTerms: { agreedValue: 15000000, paymentSchedule: 'Milestone-based across design and works' },
            deliverables: 'Design package, civil works, program management.',
            milestones: [
                { id: 'seed-ms-cons-01', title: 'Mobilization', description: 'Consortium mobilized and kickoff complete.', dueDate: '2026-04-10', status: 'approved', deliverables: 'Mobilization report', submittedAt: '2026-04-08T09:00:00.000Z', approvedAt: '2026-04-10T09:00:00.000Z', approvedBy: 'seed-co-corp-005' },
                { id: 'seed-ms-cons-02', title: 'Detailed design', description: 'Detailed design package delivered.', dueDate: '2026-08-10', status: 'in_progress', deliverables: 'Design set', submittedAt: null, approvedAt: null, approvedBy: null }
            ],
            contractId: 'seed-contract-consortium-01',
            createdAt: '2026-03-15T09:00:00.000Z', updatedAt: '2026-03-18T12:00:00.000Z', completedAt: null, closedAt: null
        },
        {
            id: 'seed-deal-exchange-01', matchId: consortiumWind?.id, applicationId: null, negotiationId: 'seed-neg-07',
            opportunityId: 'seed-opp-039', opportunityIds: ['seed-opp-039', 'seed-opp-035'],
            matchType: 'consortium', status: 'execution', title: 'Wind farm consortium — profit-sharing',
            participants: [
                { userId: 'seed-co-corp-005', role: 'consortium_lead', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-013', role: 'consortium_member', approvalStatus: 'approved', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            payload: { leadNeedId: 'seed-opp-039', roles: [{ role: 'EPC contractor', opportunityId: 'seed-opp-035', userId: 'seed-user-013' }] },
            roleSlots: null,
            scope: 'Wind farm package delivered by a profit-sharing consortium (lead PM, equipment/O&M partner).',
            timeline: { start: '2026-04-01', end: '2028-03-31' },
            exchangeMode: 'profit_sharing',
            valueTerms: { profitSplit: '65-35', profitDistribution: 'Annual distribution after O&M costs' },
            deliverables: 'Wind farm EPC coordination, equipment provision, and O&M framework.',
            milestones: [
                { id: 'seed-ms-wind-01', title: 'Consortium formation', description: 'Partners aligned on profit-sharing terms.', dueDate: '2026-04-15', status: 'approved', deliverables: 'Consortium agreement', submittedAt: '2026-04-12T09:00:00.000Z', approvedAt: '2026-04-15T09:00:00.000Z', approvedBy: 'seed-co-corp-005' },
                { id: 'seed-ms-wind-02', title: 'Feasibility complete', description: 'Feasibility and permitting package delivered.', dueDate: '2026-09-30', status: 'in_progress', deliverables: 'Feasibility report', submittedAt: null, approvedAt: null, approvedBy: null }
            ],
            contractId: 'seed-contract-exchange-01',
            createdAt: '2026-03-15T09:00:00.000Z', updatedAt: '2026-03-18T12:00:00.000Z', completedAt: null, closedAt: null
        }
    ];
}

function buildContracts(matches, deals) {
    const dealById = Object.fromEntries(deals.map((d) => [d.id, d]));
    return [
        {
            id: 'seed-contract-oneway-01', dealId: 'seed-deal-oneway-01',
            opportunityId: 'seed-opp-001', opportunityIds: ['seed-opp-001', 'seed-opp-002'],
            matchId: dealById['seed-deal-oneway-01'].matchId, applicationId: null, negotiationId: 'seed-neg-01', invitationId: null,
            parties: [
                { userId: 'seed-user-001', role: 'need_owner', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-002', role: 'offer_provider', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            scope: 'Full architectural design package: BIM, 3D visualization, sustainable design, LEED support.',
            paymentMode: 'cash', agreedValue: 250000, duration: '4 months',
            paymentSchedule: '30% on start, 40% at midpoint, 30% on completion',
            equityVesting: null, profitShare: null, milestonesSnapshot: null,
            status: 'completed', signedAt: '2026-03-18T12:00:00.000Z',
            createdAt: '2026-03-18T12:00:00.000Z', updatedAt: '2026-05-20T16:00:00.000Z'
        },
        {
            id: 'seed-contract-consortium-01', dealId: 'seed-deal-consortium-01',
            opportunityId: 'seed-opp-014', opportunityIds: ['seed-opp-014', 'seed-opp-015'],
            matchId: dealById['seed-deal-consortium-01'].matchId, applicationId: null, negotiationId: 'seed-neg-04', invitationId: null,
            parties: [
                { userId: 'seed-co-corp-005', role: 'consortium_lead', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-011', role: 'consortium_member', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            scope: 'Highway design-and-build package delivered by a led consortium.',
            paymentMode: 'cash', agreedValue: 15000000, duration: '18 months',
            paymentSchedule: 'Milestone-based across design and works',
            equityVesting: null, profitShare: null, milestonesSnapshot: null,
            status: 'active', signedAt: '2026-03-18T12:00:00.000Z',
            createdAt: '2026-03-18T12:00:00.000Z', updatedAt: '2026-03-18T12:00:00.000Z'
        },
        {
            id: 'seed-contract-exchange-01', dealId: 'seed-deal-exchange-01',
            opportunityId: 'seed-opp-039', opportunityIds: ['seed-opp-039', 'seed-opp-035'],
            matchId: dealById['seed-deal-exchange-01'].matchId, applicationId: null, negotiationId: 'seed-neg-07', invitationId: null,
            parties: [
                { userId: 'seed-co-corp-005', role: 'consortium_lead', signedAt: '2026-03-18T12:00:00.000Z' },
                { userId: 'seed-user-013', role: 'consortium_member', signedAt: '2026-03-18T12:00:00.000Z' }
            ],
            scope: 'Wind farm package delivered by a profit-sharing consortium.',
            paymentMode: 'profit_sharing', agreedValue: null, duration: '24 months',
            paymentSchedule: null, equityVesting: null, profitShare: '65-35', milestonesSnapshot: null,
            status: 'active', signedAt: '2026-03-18T12:00:00.000Z',
            createdAt: '2026-03-18T12:00:00.000Z', updatedAt: '2026-03-18T12:00:00.000Z'
        }
    ];
}

function assertIntegrity(matches, negotiations, deals, contracts) {
    const pmIds = new Set(matches.map((m) => m.id));
    const dealIds = new Set(deals.map((d) => d.id));
    const errors = [];
    for (const neg of negotiations) {
        if (!neg.matchId || !pmIds.has(neg.matchId)) errors.push(`negotiation ${neg.id} missing post-match ${neg.matchId}`);
        if (neg.applicationId != null) errors.push(`negotiation ${neg.id} still has applicationId`);
    }
    for (const deal of deals) {
        if (!deal.matchId || !pmIds.has(deal.matchId)) errors.push(`deal ${deal.id} missing post-match`);
        if (deal.applicationId != null) errors.push(`deal ${deal.id} still has applicationId`);
    }
    for (const contract of contracts) {
        if (!dealIds.has(contract.dealId)) errors.push(`contract ${contract.id} missing deal`);
        if (!pmIds.has(contract.matchId)) errors.push(`contract ${contract.id} missing post-match`);
    }
    if (errors.length) {
        throw new Error(`Seed integrity failed:\n${errors.join('\n')}`);
    }
}

function main() {
    const pmEnv = readEnvelope('demo-post-matches.json');
    const matches = mergeManualPostMatches(pmEnv.data || []);
    const negotiations = buildNegotiations(matches);
    const deals = buildDeals(matches, negotiations);
    const contracts = buildContracts(matches, deals);

    alignPostMatchStatuses(matches, negotiations, deals);

    const oppEnv = readEnvelope('opportunities.json');
    const opportunities = alignOpportunityStatuses(oppEnv.data || [], matches);

    assertIntegrity(matches, negotiations, deals, contracts);
    assertLifecycleIntegrity(matches, negotiations, deals, contracts, opportunities);

    writeEnvelope('demo-post-matches.json', {
        domain: 'post_matches',
        version: '1.2',
        description: 'Engine matches + PostMatch-first overlay with lifecycle alignment (apply-seed-postmatch-first.js)',
        data: matches
    });
    writeEnvelope('demo-negotiations.json', {
        domain: 'negotiations',
        version: '3.1',
        description: 'PostMatch-first negotiations with lifecycle alignment (apply-seed-postmatch-first.js)',
        data: negotiations
    });
    writeEnvelope('demo-deals.json', {
        domain: 'deals',
        version: '2.1',
        description: 'PostMatch-first deals with lifecycle alignment (apply-seed-postmatch-first.js)',
        data: deals
    });
    writeEnvelope('demo-contracts.json', {
        domain: 'contracts',
        version: '2.1',
        description: 'PostMatch-first contracts with lifecycle alignment (apply-seed-postmatch-first.js)',
        data: contracts
    });
    writeEnvelope('demo-applications.json', {
        domain: 'applications',
        version: '3.0',
        description: 'PostMatch-first seed — application rows cleared (canonical flow: PostMatch → Negotiation → Deal → Contract).',
        data: []
    });
    writeEnvelope('opportunities.json', {
        ...oppEnv,
        domain: 'opportunities',
        version: oppEnv.version || '1.2',
        data: opportunities
    });

    const statusCounts = opportunities.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    console.log('PostMatch-first overlay applied (Phase A–C).');
    console.log('  post-matches:', matches.length);
    console.log('  negotiations:', negotiations.length);
    console.log('  deals:', deals.length);
    console.log('  contracts:', contracts.length);
    console.log('  applications: 0');
    console.log('  opportunity statuses:', statusCounts);
}

main();
