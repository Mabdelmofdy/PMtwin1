/**
 * Generate a clean, realistic end-to-end workflow strictly for the 25 seed
 * opportunities (seed-opp-*) and their 18 owners (seed-user-*).
 *
 * Re-runnable orchestrator:
 *   1. Reset all 25 opportunities to "published".
 *   2. Regenerate demo-post-matches.json via the real engine (seed-post-matches.js).
 *   3. Apply a deterministic lifecycle: confirm select matches, create
 *      applications / negotiations / deals / contracts / reviews, set final
 *      opportunity and match statuses, and generate notifications + connections.
 *
 * Run from POC:  node scripts/seed-e2e-workflow.js   (or:  npm run seed:e2e)
 *
 * Stage distribution (4 realistic stages):
 *   - Stage A  Published + pending matches: circular ring (017-022), legacy 009, offers 006/008/025, and other published posts.
 *   - Stage B  Active applications/proposals: seed-opp-007, 023, 024 (statuses pending / reviewing / shortlisted).
 *   - Stage C  Active negotiation: barter two-way (010/011 <-> 012/013) and one-way seed-opp-005 -> in_negotiation.
 *   - Stage D  Closed -> active/completed deals + contracts: one-way 001 <-> 002 (completed) and consortium 014/015/016 (active).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const POC_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(POC_ROOT, 'data');

function readEnvelope(file) {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

function writeEnvelope(file, envelope) {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(envelope, null, 2) + '\n');
}

// --- Deterministic timeline ----------------------------------------------------
const T = {
    matchAt: '2026-03-01T09:00:00.000Z',
    appAt: '2026-03-05T10:00:00.000Z',
    negStart: '2026-03-08T11:00:00.000Z',
    negEnd: '2026-03-12T15:00:00.000Z',
    dealAt: '2026-03-15T09:00:00.000Z',
    contractAt: '2026-03-18T12:00:00.000Z',
    completedAt: '2026-05-20T16:00:00.000Z',
    reviewAt: '2026-05-22T09:00:00.000Z'
};
const pendingExpiry = '2026-06-24T09:00:00.000Z';

// --- Step 1: reset opportunity statuses to published ---------------------------
function resetOpportunityStatuses() {
    const env = readEnvelope('opportunities.json');
    env.data.forEach((o) => { o.status = 'published'; });
    writeEnvelope('opportunities.json', env);
    console.log('Reset', env.data.length, 'opportunities to published');
}

// --- Step 2: regenerate matches via the real engine ----------------------------
function regenerateMatches() {
    execSync('node scripts/seed-post-matches.js', { cwd: POC_ROOT, stdio: 'inherit' });
}

// --- Step 3: apply the lifecycle ----------------------------------------------
function applyLifecycle() {
    // Final opportunity statuses (everything else stays published)
    const oppStatus = {
        'seed-opp-001': 'completed',      // Stage D: closed/completed one-way deal
        'seed-opp-005': 'in_negotiation', // Stage C: one-way negotiation
        'seed-opp-010': 'in_negotiation', // Stage C: barter negotiation (side A)
        'seed-opp-012': 'in_negotiation', // Stage C: barter negotiation (side B)
        'seed-opp-014': 'in_execution',   // Stage D: consortium lead, contract active
        'seed-opp-015': 'contracted'      // Stage D: consortium partner (architect)
    };
    const oppEnv = readEnvelope('opportunities.json');
    oppEnv.data.forEach((o) => {
        if (oppStatus[o.id]) {
            o.status = oppStatus[o.id];
            o.updatedAt = oppStatus[o.id] === 'completed' ? T.completedAt : T.dealAt;
        }
    });
    writeEnvelope('opportunities.json', oppEnv);

    // Locate the matches we will advance (by content, robust to id reshuffling)
    const pmEnv = readEnvelope('demo-post-matches.json');
    const matches = pmEnv.data;
    const oneway0102 = matches.find(
        (m) => m.matchType === 'one_way'
            && m.payload && m.payload.needOpportunityId === 'seed-opp-001'
            && m.payload.offerOpportunityId === 'seed-opp-002'
    );
    const need005 = matches.find(
        (m) => m.matchType === 'one_way' && m.payload && m.payload.needOpportunityId === 'seed-opp-005'
    );
    const barter = matches.find((m) => m.matchType === 'two_way');
    const consortium = matches.find((m) => m.matchType === 'consortium');

    const confirm = (match, { dealId = null, negotiationId = null, at = T.dealAt }) => {
        if (!match) return;
        match.status = 'confirmed';
        match.participants = (match.participants || []).map((p) => ({
            ...p, participantStatus: 'accepted', respondedAt: T.matchAt
        }));
        match.updatedAt = at;
        if (dealId) match.dealId = dealId;
        if (negotiationId) match.negotiationId = negotiationId;
    };
    confirm(oneway0102, { dealId: 'seed-deal-oneway-01', negotiationId: 'seed-neg-01', at: T.completedAt });
    confirm(need005, { negotiationId: 'seed-neg-03', at: T.negEnd });
    confirm(barter, { negotiationId: 'seed-neg-02', at: T.negEnd });
    confirm(consortium, { dealId: 'seed-deal-consortium-01', negotiationId: 'seed-neg-04', at: T.contractAt });
    writeEnvelope('demo-post-matches.json', pmEnv);

    const onewayId = oneway0102 ? oneway0102.id : null;
    const need005Id = need005 ? need005.id : null;
    const barterId = barter ? barter.id : null;
    const consortiumId = consortium ? consortium.id : null;

    // --- Applications ----------------------------------------------------------
    const applications = [
        // Stage D: accepted application feeding the completed one-way deal
        {
            id: 'seed-app-001', opportunityId: 'seed-opp-001', applicantId: 'seed-user-002',
            status: 'accepted', matchId: onewayId, matchType: 'one_way',
            negotiationId: 'seed-neg-01', dealId: 'seed-deal-oneway-01',
            proposal: 'Full architectural package with BIM, 3D visualization, sustainable design and LEED support.',
            application_value: { amount: 250000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-03-01', estimatedDurationDays: 120,
            createdAt: T.appAt, updatedAt: T.dealAt
        },
        // Stage C: application under negotiation on the BIM architect need
        {
            id: 'seed-app-002', opportunityId: 'seed-opp-005', applicantId: 'seed-user-002',
            status: 'in_negotiation', matchId: need005Id, matchType: 'one_way', negotiationId: 'seed-neg-03',
            proposal: 'BIM + Revit delivery covering the required core skills for the architect need.',
            application_value: { amount: 150000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-03-01', estimatedDurationDays: 90,
            createdAt: T.appAt, updatedAt: T.negStart
        },
        // Stage B: mixed-status applications on published needs
        {
            id: 'seed-app-003', opportunityId: 'seed-opp-007', applicantId: 'seed-user-006',
            status: 'reviewing', matchType: 'one_way',
            proposal: 'Site planning and surveying for the civil engineering package.',
            application_value: { amount: 350000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-03-01', estimatedDurationDays: 150,
            createdAt: T.appAt, updatedAt: T.appAt
        },
        {
            id: 'seed-app-004', opportunityId: 'seed-opp-007', applicantId: 'seed-user-012',
            status: 'pending', matchType: 'one_way',
            proposal: 'Full civil scope: site planning, drainage and road design.',
            application_value: { amount: 420000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-04-01', estimatedDurationDays: 160,
            createdAt: T.appAt, updatedAt: T.appAt
        },
        {
            id: 'seed-app-005', opportunityId: 'seed-opp-023', applicantId: 'seed-user-002',
            status: 'shortlisted', matchType: 'one_way',
            proposal: 'Structural analysis and SAP2000 modelling for the steel structure scope.',
            application_value: { amount: 380000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-03-20', estimatedDurationDays: 130,
            createdAt: T.appAt, updatedAt: T.appAt
        },
        {
            id: 'seed-app-006', opportunityId: 'seed-opp-024', applicantId: 'seed-user-010',
            status: 'pending', matchType: 'one_way',
            proposal: 'PMP-led project management with risk controls for the shared-resources need.',
            application_value: { amount: 220000, currency: 'SAR' },
            responses: {}, availabilityDate: '2026-03-15', estimatedDurationDays: 180,
            createdAt: T.appAt, updatedAt: T.appAt
        }
    ];
    writeEnvelope('demo-applications.json', {
        domain: 'applications', version: '2.0',
        description: 'E2E workflow applications tied to the 25 seed opportunities (scripts/seed-e2e-workflow.js).',
        data: applications
    });

    // --- Negotiations ----------------------------------------------------------
    const negotiations = [
        // Stage D: agreed (one-way, feeds completed deal)
        {
            id: 'seed-neg-01', opportunityId: 'seed-opp-001', matchId: onewayId, applicationId: 'seed-app-001',
            parties: [
                { userId: 'seed-user-001', role: 'need_owner' },
                { userId: 'seed-user-002', role: 'offer_provider' }
            ],
            status: 'agreed',
            initialTerms: { value: 275000, currency: 'SAR', duration: '4 months', paymentSchedule: '40% on start, 60% on completion' },
            rounds: [
                { by: 'seed-user-002', at: T.negStart, proposal: { value: 275000 }, message: 'Proposing 275K SAR for the full architect package.' },
                { by: 'seed-user-001', at: T.negEnd, proposal: { value: 250000, paymentSchedule: '30/40/30 milestone-based' }, message: 'Counter at 250K SAR with milestone payments.' },
                { by: 'seed-user-002', at: T.dealAt, proposal: { value: 250000 }, message: 'Agreed at 250K SAR. Proceeding to deal.' }
            ],
            agreedTerms: { value: 250000, currency: 'SAR', duration: '4 months', paymentSchedule: '30% on start, 40% at midpoint, 30% on completion' },
            createdAt: T.negStart, updatedAt: T.dealAt
        },
        // Stage C: barter negotiation in progress
        {
            id: 'seed-neg-02', opportunityId: 'seed-opp-010', matchId: barterId, applicationId: null,
            parties: [
                { userId: 'seed-user-008', role: 'need_owner' },
                { userId: 'seed-user-009', role: 'offer_provider' }
            ],
            status: 'counter_offered',
            initialTerms: { value: 100000, currency: 'SAR', exchangeMode: 'barter', duration: '3 months' },
            rounds: [
                { by: 'seed-user-008', at: T.negStart, proposal: { value: 100000, exchangeMode: 'barter' }, message: 'Barter: my BIM/architecture for your MEP, ~100K SAR equivalent.' },
                { by: 'seed-user-009', at: T.negEnd, proposal: { value: 110000, exchangeMode: 'barter' }, message: 'Counter: scope is closer to 110K SAR equivalent.' }
            ],
            agreedTerms: null,
            expiresAt: pendingExpiry,
            createdAt: T.negStart, updatedAt: T.negEnd
        },
        // Stage C: one-way negotiation in progress on the BIM architect need
        {
            id: 'seed-neg-03', opportunityId: 'seed-opp-005', matchId: need005Id, applicationId: 'seed-app-002',
            parties: [
                { userId: 'seed-user-003', role: 'need_owner' },
                { userId: 'seed-user-002', role: 'offer_provider' }
            ],
            status: 'open',
            initialTerms: { value: 150000, currency: 'SAR', duration: '3 months' },
            rounds: [
                { by: 'seed-user-002', at: T.negStart, proposal: { value: 150000 }, message: 'Proposing 150K SAR for the BIM + Revit scope.' }
            ],
            agreedTerms: null,
            expiresAt: pendingExpiry,
            createdAt: T.negStart, updatedAt: T.negStart
        },
        // Stage D: agreed (consortium, feeds active deal)
        {
            id: 'seed-neg-04', opportunityId: 'seed-opp-014', matchId: consortiumId, applicationId: null,
            parties: [
                { userId: 'seed-user-010', role: 'consortium_lead' },
                { userId: 'seed-user-011', role: 'consortium_member' }
            ],
            status: 'agreed',
            initialTerms: { value: 15000000, currency: 'SAR', duration: '18 months', paymentSchedule: 'Milestone-based' },
            rounds: [
                { by: 'seed-user-010', at: T.negStart, proposal: { value: 15000000 }, message: 'Consortium terms for the highway package; defined role split.' },
                { by: 'seed-user-011', at: T.negEnd, proposal: { value: 15000000 }, message: 'Architect scope accepted. Proceeding to deal.' }
            ],
            agreedTerms: { value: 15000000, currency: 'SAR', duration: '18 months', paymentSchedule: 'Milestone-based across design and works' },
            createdAt: T.negStart, updatedAt: T.negEnd
        }
    ];
    writeEnvelope('demo-negotiations.json', {
        domain: 'negotiations', version: '2.0',
        description: 'E2E workflow negotiations tied to the 25 seed opportunities (scripts/seed-e2e-workflow.js).',
        data: negotiations
    });

    // --- Deals -----------------------------------------------------------------
    const deals = [
        // Stage D: completed one-way deal (architect need fulfilled)
        {
            id: 'seed-deal-oneway-01', matchId: onewayId, applicationId: 'seed-app-001', negotiationId: 'seed-neg-01',
            opportunityId: 'seed-opp-001', opportunityIds: ['seed-opp-001', 'seed-opp-002'],
            matchType: 'one_way', status: 'completed', title: 'Architect package — sustainable tower design',
            participants: [
                { userId: 'seed-user-001', role: 'need_owner', approvalStatus: 'approved', signedAt: T.contractAt },
                { userId: 'seed-user-002', role: 'offer_provider', approvalStatus: 'approved', signedAt: T.contractAt }
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
            createdAt: T.dealAt, updatedAt: T.completedAt, completedAt: T.completedAt, closedAt: null
        },
        // Stage D: active consortium deal in execution
        {
            id: 'seed-deal-consortium-01', matchId: consortiumId, applicationId: null, negotiationId: 'seed-neg-04',
            opportunityId: 'seed-opp-014', opportunityIds: ['seed-opp-014', 'seed-opp-015'],
            matchType: 'consortium', status: 'execution', title: 'Highway package consortium',
            participants: [
                { userId: 'seed-user-010', role: 'consortium_lead', approvalStatus: 'approved', signedAt: T.contractAt },
                { userId: 'seed-user-011', role: 'consortium_member', approvalStatus: 'approved', signedAt: T.contractAt }
            ],
            payload: { leadNeedId: 'seed-opp-014', roles: [
                { role: 'Architect', opportunityId: 'seed-opp-015', userId: 'seed-user-011' }
            ] },
            roleSlots: null,
            scope: 'Highway design-and-build package delivered by a led consortium (PM lead, architect, civil).',
            timeline: { start: '2026-03-20', end: '2027-09-20' },
            exchangeMode: 'cash',
            valueTerms: { agreedValue: 15000000, paymentSchedule: 'Milestone-based across design and works' },
            deliverables: 'Design package, civil works, program management.',
            milestones: [
                { id: 'seed-ms-cons-01', title: 'Mobilization', description: 'Consortium mobilized and kickoff complete.', dueDate: '2026-04-10', status: 'approved', deliverables: 'Mobilization report', submittedAt: '2026-04-08T09:00:00.000Z', approvedAt: '2026-04-10T09:00:00.000Z', approvedBy: 'seed-user-010' },
                { id: 'seed-ms-cons-02', title: 'Detailed design', description: 'Detailed design package delivered.', dueDate: '2026-08-10', status: 'in_progress', deliverables: 'Design set', submittedAt: null, approvedAt: null, approvedBy: null }
            ],
            contractId: 'seed-contract-consortium-01',
            createdAt: T.dealAt, updatedAt: T.contractAt, completedAt: null, closedAt: null
        }
    ];
    writeEnvelope('demo-deals.json', {
        domain: 'deals', version: '2.0',
        description: 'E2E workflow deals tied to the 25 seed opportunities (scripts/seed-e2e-workflow.js).',
        data: deals
    });

    // --- Contracts -------------------------------------------------------------
    const contracts = [
        // Stage D: completed one-way contract
        {
            id: 'seed-contract-oneway-01', dealId: 'seed-deal-oneway-01',
            opportunityId: 'seed-opp-001', opportunityIds: ['seed-opp-001', 'seed-opp-002'],
            matchId: onewayId, applicationId: 'seed-app-001', negotiationId: 'seed-neg-01', invitationId: null,
            parties: [
                { userId: 'seed-user-001', role: 'need_owner', signedAt: T.contractAt },
                { userId: 'seed-user-002', role: 'offer_provider', signedAt: T.contractAt }
            ],
            scope: 'Full architectural design package: BIM, 3D visualization, sustainable design, LEED support.',
            paymentMode: 'cash', agreedValue: 250000, duration: '4 months',
            paymentSchedule: '30% on start, 40% at midpoint, 30% on completion',
            equityVesting: null, profitShare: null, milestonesSnapshot: null,
            status: 'completed', signedAt: T.contractAt,
            createdAt: T.contractAt, updatedAt: T.completedAt
        },
        // Stage D: active consortium contract
        {
            id: 'seed-contract-consortium-01', dealId: 'seed-deal-consortium-01',
            opportunityId: 'seed-opp-014', opportunityIds: ['seed-opp-014', 'seed-opp-015'],
            matchId: consortiumId, applicationId: null, negotiationId: 'seed-neg-04', invitationId: null,
            parties: [
                { userId: 'seed-user-010', role: 'consortium_lead', signedAt: T.contractAt },
                { userId: 'seed-user-011', role: 'consortium_member', signedAt: T.contractAt }
            ],
            scope: 'Highway design-and-build package delivered by a led consortium.',
            paymentMode: 'cash', agreedValue: 15000000, duration: '18 months',
            paymentSchedule: 'Milestone-based across design and works',
            equityVesting: null, profitShare: null, milestonesSnapshot: null,
            status: 'active', signedAt: T.contractAt,
            createdAt: T.contractAt, updatedAt: T.contractAt
        }
    ];
    writeEnvelope('demo-contracts.json', {
        domain: 'contracts', version: '2.0',
        description: 'E2E workflow contracts tied to the 25 seed opportunities (scripts/seed-e2e-workflow.js).',
        data: contracts
    });

    // --- Reviews (tied to the completed one-way contract) ----------------------
    const reviews = [
        {
            id: 'seed-review-01', contractId: 'seed-contract-oneway-01', dealId: 'seed-deal-oneway-01',
            opportunityId: 'seed-opp-001', reviewerId: 'seed-user-001', revieweeId: 'seed-user-002',
            rating: 5, comment: 'Outstanding architectural delivery — on time, high quality BIM and LEED support.',
            createdAt: T.reviewAt, updatedAt: T.reviewAt
        },
        {
            id: 'seed-review-02', contractId: 'seed-contract-oneway-01', dealId: 'seed-deal-oneway-01',
            opportunityId: 'seed-opp-001', reviewerId: 'seed-user-002', revieweeId: 'seed-user-001',
            rating: 5, comment: 'Clear brief and prompt approvals throughout. A pleasure to work with.',
            createdAt: T.reviewAt, updatedAt: T.reviewAt
        }
    ];
    writeEnvelope('demo-reviews.json', {
        domain: 'reviews', version: '2.0',
        description: 'E2E workflow reviews tied to the completed seed contract (scripts/seed-e2e-workflow.js).',
        data: reviews
    });

    // --- Notifications ---------------------------------------------------------
    let nId = 0;
    const notif = (userId, type, title, message, link, entityType, entityId, read) => ({
        id: `seed-notif-${String(++nId).padStart(2, '0')}`,
        userId, type, title, message, link, read: !!read,
        entityType, entityId, createdAt: T.dealAt
    });
    const notifications = [
        notif('seed-user-001', 'new_match_found', 'New match found', 'Your architect need matched an offer.', `/matches/${onewayId}`, 'post_match', onewayId, true),
        notif('seed-user-002', 'application_status_changed', 'Application accepted', 'Your application was accepted for the architect need.', '/opportunities/seed-opp-001', 'application', 'seed-app-001', false),
        notif('seed-user-002', 'deal_created_from_application', 'Deal created', 'A deal was created from your accepted application.', '/deals/seed-deal-oneway-01', 'deal', 'seed-deal-oneway-01', false),
        notif('seed-user-001', 'contract_fully_signed', 'Contract signed', 'Your architect contract is fully signed.', '/contracts/seed-contract-oneway-01', 'contract', 'seed-contract-oneway-01', true),
        notif('seed-user-002', 'contract_fully_signed', 'Contract signed', 'Your architect contract is fully signed.', '/contracts/seed-contract-oneway-01', 'contract', 'seed-contract-oneway-01', true),
        notif('seed-user-002', 'review_received', 'New review', 'You received a 5-star review.', '/contracts/seed-contract-oneway-01', 'review', 'seed-review-01', false),
        notif('seed-user-001', 'review_received', 'New review', 'You received a 5-star review.', '/contracts/seed-contract-oneway-01', 'review', 'seed-review-02', false),
        notif('seed-user-008', 'negotiation_started', 'Negotiation started', 'Your barter match entered negotiation.', '/opportunities/seed-opp-010', 'negotiation', 'seed-neg-02', false),
        notif('seed-user-009', 'negotiation_started', 'Counter-offer received', 'A counter-offer was made on the barter terms.', '/opportunities/seed-opp-010', 'negotiation', 'seed-neg-02', false),
        notif('seed-user-003', 'negotiation_started', 'Negotiation started', 'A provider opened negotiation on your BIM architect need.', '/opportunities/seed-opp-005', 'negotiation', 'seed-neg-03', false),
        notif('seed-user-005', 'application_updated', 'New application', 'A civil engineer applied to your need.', '/opportunities/seed-opp-007', 'application', 'seed-app-003', false),
        notif('seed-user-016', 'application_updated', 'New application', 'A provider applied to your structural need.', '/opportunities/seed-opp-023', 'application', 'seed-app-005', false),
        notif('seed-user-017', 'application_updated', 'New application', 'A PM consultant applied to your need.', '/opportunities/seed-opp-024', 'application', 'seed-app-006', false),
        notif('seed-user-010', 'match_confirmed', 'Consortium confirmed', 'Your consortium match is confirmed.', `/matches/${consortiumId}`, 'post_match', consortiumId, true),
        notif('seed-user-010', 'deal_created_from_match', 'Deal created', 'A consortium deal was created.', '/deals/seed-deal-consortium-01', 'deal', 'seed-deal-consortium-01', false),
        notif('seed-user-011', 'deal_activated', 'Deal in execution', 'The consortium deal entered execution.', '/deals/seed-deal-consortium-01', 'deal', 'seed-deal-consortium-01', false),
        notif('seed-user-011', 'contract_fully_signed', 'Contract signed', 'The consortium contract is fully signed.', '/contracts/seed-contract-consortium-01', 'contract', 'seed-contract-consortium-01', false),
        notif('seed-user-013', 'new_match_found', 'New circular match', 'A circular exchange match was found.', '/matches', 'post_match', null, false)
    ];
    writeEnvelope('demo-notifications.json', {
        domain: 'notifications', version: '2.0',
        description: 'E2E workflow notifications tied to the 25 seed opportunities (scripts/seed-e2e-workflow.js).',
        data: notifications
    });

    // --- Connections (accepted, among collaborating seed users) ----------------
    const connPairs = [
        ['seed-user-001', 'seed-user-002'], ['seed-user-001', 'seed-user-003'],
        ['seed-user-003', 'seed-user-002'], ['seed-user-005', 'seed-user-006'],
        ['seed-user-005', 'seed-user-012'], ['seed-user-008', 'seed-user-009'],
        ['seed-user-010', 'seed-user-011'], ['seed-user-010', 'seed-user-012'],
        ['seed-user-011', 'seed-user-012'], ['seed-user-013', 'seed-user-014'],
        ['seed-user-014', 'seed-user-015'], ['seed-user-013', 'seed-user-015'],
        ['seed-user-016', 'seed-user-002'], ['seed-user-017', 'seed-user-010']
    ];
    const connections = connPairs.map(([from, to]) => ({
        id: `seed-conn-${from.slice(-3)}-${to.slice(-3)}`,
        fromUserId: from, toUserId: to, status: 'accepted',
        createdAt: '2026-02-20T08:00:00.000Z', updatedAt: '2026-02-20T08:00:00.000Z'
    }));
    writeEnvelope('demo-connections.json', {
        domain: 'connections', version: '2.0',
        description: 'E2E workflow connections among the 18 seed users (scripts/seed-e2e-workflow.js).',
        data: connections
    });

    console.log('Lifecycle generated:');
    console.log('  applications :', applications.length);
    console.log('  negotiations :', negotiations.length);
    console.log('  deals        :', deals.length, '(1 completed one-way, 1 active consortium)');
    console.log('  contracts    :', contracts.length, '(1 completed, 1 active)');
    console.log('  reviews      :', reviews.length);
    console.log('  notifications:', notifications.length);
    console.log('  connections  :', connections.length);
    console.log('  confirmed matches:', [onewayId, need005Id, barterId, consortiumId].filter(Boolean).join(', '));
}

function main() {
    console.log('=== E2E workflow seed (25 opportunities) ===');
    resetOpportunityStatuses();
    regenerateMatches();
    applyLifecycle();
    console.log('Done. Bump CURRENT_SEED_VERSION and reload the app (or run window.resetAppData()).');
}

main();
