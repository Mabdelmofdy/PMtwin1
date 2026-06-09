/**
 * Marketplace Simulator - Data Seeder
 * Generates realistic companies, users, and opportunities for matching simulation.
 * Ensures coverage of all four models: one-way, two-way barter, consortium, circular.
 *
 * Run from POC directory:
 *   node scripts/simulation/seed-simulation-data.js --controlled  (exactly 25 posts, wipes sim + browser seed)
 *   node scripts/simulation/seed-simulation-data.js --small
 *   node scripts/simulation/seed-simulation-data.js
 * Output: POC/data/simulation/companies.json, users.json, opportunities.json
 */

const fs = require('fs');
const path = require('path');

const SEED = 42;
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}
const rng = seededRandom(SEED);

const OUT_DIR = path.join(__dirname, '..', '..', 'data', 'simulation');
const NOW = new Date().toISOString();

// ─── Industries & locations ─────────────────────────────────────────────────
const INDUSTRIES = [
    'Construction', 'Engineering', 'Equipment Rental', 'Accounting', 'Real Estate', 'Financial'
];
const LOCATIONS = ['Riyadh', 'Jeddah', 'Eastern Province', 'NEOM', 'Dammam', 'Makkah', 'Tabuk', 'Remote'];
const SECTORS_BY_INDUSTRY = {
    Construction: ['Construction', 'Infrastructure', 'Real Estate'],
    Engineering: ['Infrastructure', 'Engineering', 'Construction'],
    'Equipment Rental': ['Construction', 'Industrial', 'Equipment'],
    Accounting: ['Financial', 'Accounting', 'Consulting'],
    'Real Estate': ['Real Estate', 'Construction', 'Property'],
    Financial: ['Financial', 'Investment', 'Real Estate']
};

// Skills used for matching (align with skill-canonical and scoring)
const SKILLS_POOL = [
    'Structural Engineering', 'Structural Analysis', 'Project Management', 'PMP',
    'Accounting', 'Financial Reporting', 'Tax Advisory', 'Audit',
    'Office space', 'Real Estate', 'Property Management',
    'Excavator', 'Equipment Rental', 'Heavy Equipment', 'Construction Equipment',
    'Engineering Consulting', 'Design Review', 'BIM', 'AutoCAD',
    'Investment', 'Financial Investment', 'Capital', 'Partnership'
];

const USER_TYPES = [
    { type: 'engineer', skills: ['Structural Engineering', 'Structural Analysis', 'Engineering Consulting', 'BIM', 'AutoCAD'], sectors: ['Construction', 'Engineering'] },
    { type: 'contractor', skills: ['Project Management', 'Construction', 'Infrastructure Development', 'Road Construction'], sectors: ['Construction', 'Infrastructure'] },
    { type: 'equipment_supplier', skills: ['Equipment Rental', 'Excavator', 'Heavy Equipment', 'Construction Equipment'], sectors: ['Construction', 'Industrial'] },
    { type: 'accountant', skills: ['Accounting', 'Financial Reporting', 'Tax Advisory', 'Audit'], sectors: ['Financial', 'Accounting'] },
    { type: 'investor', skills: ['Investment', 'Financial Investment', 'Capital', 'Partnership'], sectors: ['Financial', 'Investment'] },
    { type: 'project_manager', skills: ['Project Management', 'PMP', 'Planning', 'Risk Management'], sectors: ['Construction', 'Infrastructure'] }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(arr, n) {
    const out = [];
    const copy = [...arr];
    for (let i = 0; i < n && copy.length; i++) {
        out.push(...copy.splice(Math.floor(rng() * copy.length), 1));
    }
    return out;
}
function id(prefix, n) { return `${prefix}-${String(n).padStart(3, '0')}`; }

const SMALL_MODE = process.argv.includes('--small');
const CONTROLLED_MODE = process.argv.includes('--controlled');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// ─── Controlled mode: wipe + deterministic 25-post dataset ───────────────────

const CONTROLLED_ARTIFACTS = [
    'matching-report.json',
    'matching-report.txt',
    'match-graph.mmd',
    'match-graph.dot'
];

function writeJsonEnvelope(filePath, domain, data, extra = {}) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ domain, version: '1.0', ...extra, data }, null, 2));
}

function wipeSimulationData(outDir) {
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    CONTROLLED_ARTIFACTS.forEach(name => {
        const p = path.join(outDir, name);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    writeJsonEnvelope(path.join(outDir, 'companies.json'), 'companies', []);
    writeJsonEnvelope(path.join(outDir, 'users.json'), 'users', []);
    writeJsonEnvelope(path.join(outDir, 'opportunities.json'), 'opportunities', []);
    console.log('Wiped simulation data:', outDir);
}

function wipeBrowserSeedData() {
    writeJsonEnvelope(path.join(DATA_DIR, 'opportunities.json'), 'opportunities', [], { version: '1.2' });
    writeJsonEnvelope(path.join(DATA_DIR, 'demo-40-opportunities.json'), 'opportunities', [], {
        dataset: 'demo40',
        description: 'Cleared by controlled seeder — canonical dataset lives in opportunities.json'
    });
    writeJsonEnvelope(path.join(DATA_DIR, 'demo-post-matches.json'), 'post_matches', [], {
        description: 'Cleared by controlled seeder'
    });
    writeJsonEnvelope(path.join(DATA_DIR, 'demo-deals.json'), 'deals', [], {
        description: 'Cleared by controlled seeder'
    });
    writeJsonEnvelope(path.join(DATA_DIR, 'demo-contracts.json'), 'contracts', [], {
        description: 'Cleared by controlled seeder'
    });
    console.log('Wiped browser seed files in', DATA_DIR);
}

function seedUserId(n) {
    return `seed-user-${String(n).padStart(3, '0')}`;
}

function seedCoId(n) {
    return `seed-co-${String(n).padStart(3, '0')}`;
}

function loadMatchingDeps() {
    global.CONFIG = global.CONFIG || {};
    global.CONFIG.MATCHING = {
        HARD_CONSTRAINTS_ENABLED: true,
        STRICT_ROLE_REQUIRED: true,
        MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
        MIN_SKILL_SCORE_FOR_MATCH: 0.50
    };
    const postPreprocessor = require(path.join(__dirname, '..', '..', 'src', 'services', 'matching', 'post-preprocessor.js'));
    const hardConstraints = require(path.join(__dirname, '..', '..', 'src', 'services', 'matching', 'hard-constraints.js'));
    let skillCanonical = {};
    try {
        skillCanonical = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'skill-canonical.json'), 'utf8'));
    } catch (_) { /* optional */ }
    return { postPreprocessor, hardConstraints, skillCanonical };
}

function generateControlledCompanies() {
    const industries = ['Construction', 'Engineering', 'Equipment Rental', 'Accounting', 'Real Estate'];
    const locations = ['Riyadh', 'Jeddah', 'Dammam', 'NEOM', 'Eastern Province'];
    return industries.map((industry, i) => {
        const n = i + 1;
        const loc = locations[i];
        const sectors = industry === 'Construction'
            ? ['Construction', 'Infrastructure']
            : [industry, 'Consulting'];
        return {
            id: seedCoId(n),
            email: `contact@seed-co-${n}.test`,
            passwordHash: 'cGFzc3dvcmQxMjM=',
            role: 'company_owner',
            status: 'active',
            isPublic: true,
            connectionCount: 10 + n,
            profile: {
                name: `Seed Company ${n} (${industry})`,
                type: 'company',
                headline: `${industry} services`,
                companyType: 'SME',
                registrationNumber: String(2000000000 + n),
                phone: `+966 50 ${String(n).padStart(3, '0')} 1000`,
                location: `${loc}, Saudi Arabia`,
                address: `${loc}, Saudi Arabia`,
                description: `Controlled seed company for matching scenarios.`,
                sectors,
                industry: sectors,
                employeeCount: '50-200',
                yearEstablished: 2000 + n,
                certifications: ['ISO 9001'],
                financialCapacity: 5000000,
                preferredPaymentModes: ['cash', 'barter'],
                services: [`${industry} Services`],
                interests: sectors,
                rating: 0.75,
                avatar: null
            },
            createdAt: NOW,
            updatedAt: NOW
        };
    });
}

function generateControlledUsers() {
    const profiles = [
        { name: 'Scenario A Need Owner', headline: 'Architect' },
        { name: 'Scenario A/B/C Offer Owner', headline: 'Multi-offer professional' },
        { name: 'Scenario D Need Owner', headline: 'Architect' },
        { name: 'Scenario D Offer Owner', headline: 'Architect' },
        { name: 'Scenario E Need Owner', headline: 'Civil Engineer' },
        { name: 'Scenario E Offer Owner', headline: 'Civil Engineer' },
        { name: 'Scenario F Legacy Owner', headline: 'Legacy post' },
        { name: 'Barter User A', headline: 'MEP / Architect barter' },
        { name: 'Barter User B', headline: 'Architect / MEP barter' },
        { name: 'Consortium Lead', headline: 'Project Management' },
        { name: 'Consortium Partner Architect', headline: 'Architect' },
        { name: 'Consortium Partner Civil', headline: 'Civil Engineer' },
        { name: 'Circular User A', headline: 'Equipment' },
        { name: 'Circular User B', headline: 'Real Estate' },
        { name: 'Circular User C', headline: 'Accounting' },
        { name: 'Filler Structural', headline: 'Structural Engineer' },
        { name: 'Filler PM', headline: 'Project Management' },
        { name: 'Filler MEP', headline: 'MEP' }
    ];
    return profiles.map((p, i) => {
        const n = i + 1;
        return {
            id: seedUserId(n),
            email: `seed-user-${n}@controlled.test`,
            passwordHash: 'cGFzc3dvcmQxMjM=',
            role: 'professional',
            status: 'active',
            isPublic: true,
            connectionCount: 5 + n,
            profile: {
                name: p.name,
                type: 'professional',
                headline: p.headline,
                title: p.headline,
                phone: `+966 55 ${String(n).padStart(3, '0')} 2000`,
                location: 'Riyadh, Saudi Arabia',
                specializations: [p.headline],
                skills: [p.headline],
                sectors: ['Construction', 'Infrastructure'],
                yearsExperience: 8 + n,
                preferredPaymentModes: ['cash', 'barter'],
                rating: 0.8,
                avatar: null
            },
            createdAt: NOW,
            updatedAt: NOW
        };
    });
}

function buildControlledPost(spec, deps) {
    const location = spec.location || 'Riyadh, Saudi Arabia';
    const sectors = spec.sectors || ['Construction', 'Architecture'];
    const budgetMin = spec.budgetMin != null ? spec.budgetMin : 100000;
    const budgetMax = spec.budgetMax != null ? spec.budgetMax : 300000;
    const isRequest = spec.intent === 'request';

    const scope = {
        sectors,
        certifications: [],
        coreSkills: spec.coreSkills || []
    };
    if (isRequest) {
        scope.requiredSkills = spec.skills || [];
        scope.offeredSkills = [];
    } else {
        scope.offeredSkills = spec.skills || [];
        scope.requiredSkills = [];
    }

    const attributes = {
        startDate: '2026-03-01',
        tenderDeadline: '2026-06-01',
        locationRequirement: spec.locationRequirement || 'On-Site',
        ...(spec.attributes || {})
    };
    if (!spec.legacyNoRole && spec.targetRole) {
        attributes.targetRole = spec.targetRole;
    }
    if (spec.coreSkills && spec.coreSkills.length) {
        attributes.coreSkills = spec.coreSkills;
    }
    if (!isRequest) {
        attributes.availability = { start: '2026-02-01', end: '2026-12-31' };
    }

    const exchangeMode = spec.exchangeMode || 'cash';
    const post = {
        id: spec.id,
        title: spec.title,
        description: spec.description || spec.title,
        creatorId: seedUserId(spec.creator),
        intent: spec.intent,
        status: 'published',
        modelType: spec.modelType || 'project_based',
        subModelType: spec.subModelType || 'project',
        location,
        locationCountry: 'sa',
        locationRegion: 'riyadh',
        exchangeMode,
        paymentModes: spec.paymentModes || [exchangeMode === 'barter' ? 'barter' : 'cash'],
        scope,
        exchangeData: {
            exchangeMode,
            currency: 'SAR',
            budgetRange: { min: budgetMin, max: budgetMax, currency: 'SAR' },
            ...(spec.intent === 'offer' ? { cashAmount: (budgetMin + budgetMax) / 2 } : {}),
            ...(spec.barter || {})
        },
        attributes,
        createdAt: NOW,
        updatedAt: NOW
    };

    post.normalized = deps.postPreprocessor.extractAndNormalize(post, deps.skillCanonical);
    if (spec.legacyNoRole) {
        post.normalized.role = '';
    }
    return post;
}

function generateControlledOpportunities() {
    const deps = loadMatchingDeps();
    const architectSkills = ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'];
    const civilServices = ['Site Planning', 'Drainage Design', 'Road Design', 'Surveying'];

    const specs = [
        // Scenario A — strict Architect match
        {
            id: 'seed-opp-001', intent: 'request', creator: 1, scenario: 'A',
            title: '[A] Architect need — full coreSkills match',
            targetRole: 'Architect', skills: architectSkills, coreSkills: architectSkills,
            budgetMin: 150000, budgetMax: 400000
        },
        {
            id: 'seed-opp-002', intent: 'offer', creator: 2, scenario: 'A',
            title: '[A] Architect offer — strict match pair',
            targetRole: 'Architect', skills: architectSkills,
            budgetMin: 150000, budgetMax: 400000
        },
        // Scenario B — compatible Interior Designer
        {
            id: 'seed-opp-003', intent: 'offer', creator: 2, scenario: 'B',
            title: '[B] Interior Designer offer — matrix compatibility',
            targetRole: 'Interior Designer',
            skills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification', 'Space Planning', 'FF&E'],
            budgetMin: 120000, budgetMax: 350000
        },
        // Scenario C — role reject (Civil Engineer vs Architect need)
        {
            id: 'seed-opp-004', intent: 'offer', creator: 2, scenario: 'C',
            title: '[C] Civil Engineer offer — role incompatible with Architect need',
            targetRole: 'Civil Engineer',
            skills: ['BIM', '3D Visualization', 'Structural Analysis', 'SAP2000'],
            budgetMin: 150000, budgetMax: 400000,
            location: 'Riyadh, Saudi Arabia'
        },
        // Scenario D — core skill missing
        {
            id: 'seed-opp-005', intent: 'request', creator: 3, scenario: 'D',
            title: '[D] Architect need — BIM core skill required',
            targetRole: 'Architect', skills: ['BIM', 'Revit'], coreSkills: ['BIM'],
            budgetMin: 80000, budgetMax: 200000
        },
        {
            id: 'seed-opp-006', intent: 'offer', creator: 4, scenario: 'D',
            title: '[D] Architect offer — missing BIM core skill',
            targetRole: 'Architect', skills: ['Revit'],
            budgetMin: 80000, budgetMax: 200000
        },
        // Scenario E — low service overlap
        {
            id: 'seed-opp-007', intent: 'request', creator: 5, scenario: 'E',
            title: '[E] Civil Engineer need — four required services',
            targetRole: 'Civil Engineer', skills: civilServices,
            budgetMin: 200000, budgetMax: 500000
        },
        {
            id: 'seed-opp-008', intent: 'offer', creator: 6, scenario: 'E',
            title: '[E] Civil Engineer offer — 25% service overlap',
            targetRole: 'Civil Engineer', skills: ['Site Planning'],
            budgetMin: 200000, budgetMax: 500000
        },
        // Scenario F — missing targetRole (legacy)
        {
            id: 'seed-opp-009', intent: 'request', creator: 7, scenario: 'F',
            title: '[F] Legacy need — no targetRole',
            legacyNoRole: true,
            skills: ['General Consulting', 'Advisory'],
            budgetMin: 50000, budgetMax: 150000
        },
        // Scenario G — barter (two_way)
        {
            id: 'seed-opp-010', intent: 'request', creator: 8, scenario: 'G-barter',
            title: '[G] Barter need A — MEP services',
            targetRole: 'MEP', skills: ['HVAC Design', 'MEP Coordination'],
            exchangeMode: 'barter', paymentModes: ['barter'], budgetMin: 0, budgetMax: 500000,
            barter: { barterNeed: 'HVAC Design', barterOffer: 'BIM', barterValue: '100000' }
        },
        {
            id: 'seed-opp-011', intent: 'offer', creator: 8, scenario: 'G-barter',
            title: '[G] Barter offer A — Architect services',
            targetRole: 'Architect', skills: ['BIM', 'Space Planning'],
            exchangeMode: 'barter', paymentModes: ['barter'], budgetMin: 0, budgetMax: 500000,
            barter: { barterNeed: 'HVAC Design', barterOffer: 'BIM', barterValue: '100000' }
        },
        {
            id: 'seed-opp-012', intent: 'request', creator: 9, scenario: 'G-barter',
            title: '[G] Barter need B — Architect services',
            targetRole: 'Architect', skills: ['BIM', 'Space Planning'],
            exchangeMode: 'barter', paymentModes: ['barter'], budgetMin: 0, budgetMax: 500000,
            barter: { barterNeed: 'BIM', barterOffer: 'HVAC Design', barterValue: '100000' }
        },
        {
            id: 'seed-opp-013', intent: 'offer', creator: 9, scenario: 'G-barter',
            title: '[G] Barter offer B — MEP services',
            targetRole: 'MEP', skills: ['HVAC Design', 'MEP Coordination'],
            exchangeMode: 'barter', paymentModes: ['barter'], budgetMin: 0, budgetMax: 500000,
            barter: { barterNeed: 'BIM', barterOffer: 'HVAC Design', barterValue: '100000' }
        },
        // Scenario G — consortium
        {
            id: 'seed-opp-014', intent: 'request', creator: 10, scenario: 'G-consortium',
            title: '[G] Consortium lead — highway package',
            targetRole: 'Project Management',
            skills: ['Project Management', 'Highway Design', 'Consortium Leadership'],
            subModelType: 'consortium',
            budgetMin: 10000000, budgetMax: 50000000,
            attributes: {
                memberRoles: [
                    { role: 'Architect', scope: 'Design and BIM' },
                    { role: 'Civil Engineer', scope: 'Civil works and drainage' }
                ]
            }
        },
        {
            id: 'seed-opp-015', intent: 'offer', creator: 11, scenario: 'G-consortium',
            title: '[G] Consortium partner — Architect',
            targetRole: 'Architect',
            skills: ['Architect', 'BIM', '3D Visualization', 'Design Development'],
            budgetMin: 2000000, budgetMax: 8000000
        },
        {
            id: 'seed-opp-016', intent: 'offer', creator: 12, scenario: 'G-consortium',
            title: '[G] Consortium partner — Civil Engineer',
            targetRole: 'Civil Engineer',
            skills: ['Civil Engineer', 'Site Planning', 'Drainage Design', 'Road Design'],
            budgetMin: 3000000, budgetMax: 12000000
        },
        // Scenario G — circular (3-party ring)
        {
            id: 'seed-opp-017', intent: 'request', creator: 13, scenario: 'G-circular',
            title: '[G] Circular A needs Excavator',
            targetRole: 'Excavator', skills: ['Excavator', 'Equipment Rental'],
            budgetMin: 50000, budgetMax: 200000
        },
        {
            id: 'seed-opp-018', intent: 'offer', creator: 13, scenario: 'G-circular',
            title: '[G] Circular A offers Office space',
            targetRole: 'Office space', skills: ['Office space', 'Real Estate'],
            budgetMin: 50000, budgetMax: 200000
        },
        {
            id: 'seed-opp-019', intent: 'request', creator: 14, scenario: 'G-circular',
            title: '[G] Circular B needs Office space',
            targetRole: 'Office space', skills: ['Office space', 'Real Estate'],
            budgetMin: 50000, budgetMax: 200000
        },
        {
            id: 'seed-opp-020', intent: 'offer', creator: 14, scenario: 'G-circular',
            title: '[G] Circular B offers Accounting',
            targetRole: 'Accounting', skills: ['Accounting', 'Financial Reporting'],
            budgetMin: 50000, budgetMax: 200000
        },
        {
            id: 'seed-opp-021', intent: 'request', creator: 15, scenario: 'G-circular',
            title: '[G] Circular C needs Accounting',
            targetRole: 'Accounting', skills: ['Accounting', 'Financial Reporting'],
            budgetMin: 50000, budgetMax: 200000
        },
        {
            id: 'seed-opp-022', intent: 'offer', creator: 15, scenario: 'G-circular',
            title: '[G] Circular C offers Excavator',
            targetRole: 'Excavator', skills: ['Excavator', 'Equipment Rental'],
            budgetMin: 50000, budgetMax: 200000
        },
        // Fillers — collaboration modelType spread
        {
            id: 'seed-opp-023', intent: 'request', creator: 16, scenario: 'filler',
            title: 'Filler need — Structural Engineer',
            targetRole: 'Structural Engineer',
            skills: ['Structural Analysis', 'SAP2000', 'Steel Design'],
            modelType: 'strategic_partnership', subModelType: 'joint_venture',
            budgetMin: 250000, budgetMax: 600000
        },
        {
            id: 'seed-opp-024', intent: 'request', creator: 17, scenario: 'filler',
            title: 'Filler need — Project Management',
            targetRole: 'Project Management',
            skills: ['Project Management', 'PMP', 'Risk Management'],
            modelType: 'resource_pooling', subModelType: 'shared_resources',
            budgetMin: 100000, budgetMax: 300000
        },
        {
            id: 'seed-opp-025', intent: 'offer', creator: 18, scenario: 'filler',
            title: 'Filler offer — MEP',
            targetRole: 'MEP',
            skills: ['HVAC Design', 'MEP Coordination', 'Fire Protection'],
            modelType: 'hiring', subModelType: 'professional_hiring',
            budgetMin: 80000, budgetMax: 250000
        }
    ];

    return specs.map(spec => buildControlledPost(spec, deps));
}

function findPostById(opportunities, id) {
    return opportunities.find(o => o.id === id);
}

function validateScenarioChecklist(opportunities) {
    const deps = loadMatchingDeps();
    const needA = findPostById(opportunities, 'seed-opp-001');
    const offerA = findPostById(opportunities, 'seed-opp-002');
    const offerB = findPostById(opportunities, 'seed-opp-003');
    const offerC = findPostById(opportunities, 'seed-opp-004');
    const needD = findPostById(opportunities, 'seed-opp-005');
    const offerD = findPostById(opportunities, 'seed-opp-006');
    const needE = findPostById(opportunities, 'seed-opp-007');
    const offerE = findPostById(opportunities, 'seed-opp-008');
    const needF = findPostById(opportunities, 'seed-opp-009');

    const checks = [
        { label: 'A strict match', result: deps.hardConstraints.passesPair(needA, offerA) },
        { label: 'B compatibility', result: deps.hardConstraints.passesPair(needA, offerB) },
        { label: 'C role reject', result: deps.hardConstraints.passesPair(needA, offerC), expectFail: true },
        { label: 'D core skill reject', result: deps.hardConstraints.passesPair(needD, offerD), expectFail: true },
        { label: 'E overlap reject', result: deps.hardConstraints.passesPair(needE, offerE), expectFail: true },
        { label: 'F missing role', result: deps.hardConstraints.passesPair(needF, offerA), expectFail: true, expectReason: 'role_missing' }
    ];

    console.log('\nScenario checklist:');
    checks.forEach(({ label, result, expectFail, expectReason }) => {
        const pass = expectFail
            ? (!result.ok && (!expectReason || result.reason === expectReason))
            : result.ok;
        const detail = result.ok ? 'pass' : (result.reason || 'fail');
        console.log(`  ${pass ? '✓' : '✗'} ${label}: ${detail}`);
    });

    const needs = opportunities.filter(o => o.intent === 'request').length;
    const offers = opportunities.filter(o => o.intent === 'offer').length;
    console.log(`\nIntent balance: ${needs} requests, ${offers} offers`);
    if (needs !== 12 || offers !== 13) {
        console.warn('WARNING: expected 12 requests and 13 offers');
    }
}

function mainControlled() {
    wipeSimulationData(OUT_DIR);
    wipeBrowserSeedData();

    const companies = generateControlledCompanies();
    const users = generateControlledUsers();
    const opportunities = generateControlledOpportunities();

    writeJsonEnvelope(path.join(OUT_DIR, 'companies.json'), 'companies', companies);
    writeJsonEnvelope(path.join(OUT_DIR, 'users.json'), 'users', users);
    writeJsonEnvelope(path.join(OUT_DIR, 'opportunities.json'), 'opportunities', opportunities);

    writeJsonEnvelope(path.join(DATA_DIR, 'opportunities.json'), 'opportunities', opportunities, { version: '1.2' });
    writeJsonEnvelope(path.join(DATA_DIR, 'seed-controlled-users.json'), 'users', users, {
        description: 'Controlled seed users for 25-post matching scenarios (password: password123)'
    });

    console.log('\nControlled seed written.');
    console.log('Simulation:', OUT_DIR);
    console.log('Browser:', path.join(DATA_DIR, 'opportunities.json'));
    console.log('Companies:', companies.length);
    console.log('Users:', users.length);
    console.log('Opportunities:', opportunities.length);

    validateScenarioChecklist(opportunities);
}

// ─── Companies (30–50, or 8 in small mode) ────────────────────────────────────
function generateCompanies() {
    const count = SMALL_MODE ? 8 : (30 + Math.floor(rng() * 21));
    const companies = [];
    for (let i = 1; i <= count; i++) {
        const industry = pick(INDUSTRIES);
        const sectors = SECTORS_BY_INDUSTRY[industry] || [industry];
        const loc = pick(LOCATIONS);
        companies.push({
            id: id('sim-company', i),
            email: `contact@sim-company-${i}.test`,
            passwordHash: 'cGFzc3dvcmQxMjM=',
            role: 'company_owner',
            status: 'active',
            isPublic: true,
            connectionCount: Math.floor(rng() * 200),
            profile: {
                name: `Sim Company ${i} (${industry})`,
                type: 'company',
                headline: `${industry} services`,
                companyType: rng() > 0.5 ? 'Large Enterprise' : 'SME',
                registrationNumber: String(1000000000 + i),
                phone: `+966 50 ${String(i).padStart(3, '0')} 0000`,
                location: `${loc}, Saudi Arabia`,
                address: `${loc}, Saudi Arabia`,
                description: `Simulation ${industry} company.`,
                sectors,
                industry: sectors,
                employeeCount: rng() > 0.6 ? '50-200' : (rng() > 0.5 ? '200-1000' : '10-50'),
                yearEstablished: 1980 + Math.floor(rng() * 40),
                certifications: ['ISO 9001'],
                financialCapacity: 1000000 + Math.floor(rng() * 50000000),
                preferredPaymentModes: ['cash', 'barter'],
                services: [`${industry} Services`],
                interests: sectors,
                rating: 0.3 + rng() * 0.6,
                avatar: null
            },
            createdAt: NOW,
            updatedAt: NOW
        });
    }
    return companies;
}

// ─── Users (150–200, or 27 in small mode so circular users 25–27 exist) ────────
function generateUsers(companyIds) {
    const count = SMALL_MODE ? 27 : (150 + Math.floor(rng() * 51));
    const users = [];
    for (let i = 1; i <= count; i++) {
        const ut = pick(USER_TYPES);
        const loc = pick(LOCATIONS);
        const skills = pickN(ut.skills, 2 + Math.floor(rng() * 3));
        const companyId = rng() > 0.7 ? pick(companyIds) : undefined;
        users.push({
            id: id('sim-user', i),
            email: `user${i}@sim.test`,
            passwordHash: 'cGFzc3dvcmQxMjM=',
            role: 'professional',
            status: 'active',
            isPublic: true,
            connectionCount: Math.floor(rng() * 300),
            profile: {
                name: `Sim User ${i}`,
                type: 'professional',
                headline: ut.type,
                title: ut.type,
                phone: `+966 55 ${String(i).padStart(3, '0')} 0000`,
                location: `${loc}, Saudi Arabia`,
                specializations: pickN(ut.skills, 2),
                skills,
                sectors: ut.sectors,
                yearsExperience: 2 + Math.floor(rng() * 20),
                preferredPaymentModes: ['cash', 'barter'],
                rating: 0.3 + rng() * 0.6,
                avatar: null
            },
            createdAt: NOW,
            updatedAt: NOW
        });
    }
    return users;
}

// ─── Opportunities (200–400) with model coverage ─────────────────────────────
function generateOpportunities(companyIds, users) {
    const opportunities = [];
    let oppIndex = 1;

    const locNorm = (loc) => (loc || 'Riyadh').split(',')[0].trim();
    const need = (creatorId, title, requiredSkills, budgetMin, budgetMax, options = {}) => {
        const id_ = id('sim-opp', oppIndex++);
        const location = options.location || 'Riyadh, Saudi Arabia';
        const sectors = options.sectors || ['Construction', 'Infrastructure'];
        const targetRole = options.targetRole || requiredSkills[0] || '';
        const coreSkills = options.coreSkills || [];
        const normalized = {
            skills: requiredSkills,
            requiredServices: requiredSkills,
            offeredServices: [],
            role: targetRole,
            coreSkills,
            categories: sectors,
            budget: { min: budgetMin, max: budgetMax, currency: 'SAR' },
            timeline: { start: '2026-03-01', end: '2026-06-01' },
            deadline: '2026-06-01',
            location: locNorm(location),
            reputation: 0.5,
            intent: 'request',
            modelType: options.modelType || 'project_based',
            subModelType: options.subModelType || 'project'
        };
        opportunities.push({
            id: id_,
            title,
            description: options.description || title,
            creatorId,
            intent: 'request',
            status: 'published',
            modelType: options.modelType || 'project_based',
            subModelType: options.subModelType || 'project',
            location,
            locationCountry: 'sa',
            locationRegion: (options.location || 'riyadh').toLowerCase().replace(/\s/g, '-'),
            exchangeMode: options.exchangeMode || 'cash',
            paymentModes: options.paymentModes || ['cash'],
            scope: { requiredSkills, sectors, certifications: [] },
            exchangeData: {
                exchangeMode: options.exchangeMode || 'cash',
                currency: 'SAR',
                budgetRange: { min: budgetMin, max: budgetMax, currency: 'SAR' }
            },
            attributes: {
                startDate: '2026-03-01',
                tenderDeadline: '2026-06-01',
                locationRequirement: options.locationRequirement || 'On-Site',
                targetRole,
                ...(coreSkills.length ? { coreSkills } : {}),
                ...options.attributes
            },
            normalized,
            createdAt: NOW,
            updatedAt: NOW
        });
        return id_;
    };

    const offer = (creatorId, title, offeredSkills, budgetMin, budgetMax, options = {}) => {
        const id_ = id('sim-opp', oppIndex++);
        const location = options.location || 'Riyadh, Saudi Arabia';
        const sectors = options.sectors || ['Construction', 'Infrastructure'];
        const targetRole = options.targetRole || offeredSkills[0] || '';
        const normalized = {
            skills: offeredSkills,
            requiredServices: [],
            offeredServices: offeredSkills,
            role: targetRole,
            coreSkills: options.coreSkills || [],
            categories: sectors,
            budget: { min: budgetMin, max: budgetMax, currency: 'SAR' },
            timeline: { start: '2026-02-01', end: '2026-12-31' },
            availability: { start: '2026-02-01', end: '2026-12-31' },
            location: locNorm(location),
            reputation: 0.5,
            intent: 'offer',
            modelType: options.modelType || 'project_based',
            subModelType: options.subModelType || 'project'
        };
        opportunities.push({
            id: id_,
            title,
            description: options.description || title,
            creatorId,
            intent: 'offer',
            status: 'published',
            modelType: options.modelType || 'project_based',
            subModelType: options.subModelType || 'project',
            location,
            locationCountry: 'sa',
            locationRegion: (options.location || 'riyadh').toLowerCase().replace(/\s/g, '-'),
            exchangeMode: options.exchangeMode || 'cash',
            paymentModes: options.paymentModes || ['cash'],
            scope: { offeredSkills, requiredSkills: [], sectors, certifications: [] },
            exchangeData: {
                exchangeMode: options.exchangeMode || 'cash',
                currency: 'SAR',
                budgetRange: { min: budgetMin, max: budgetMax, currency: 'SAR' },
                cashAmount: (budgetMin + budgetMax) / 2,
                ...(options.barter && { barterOffer: options.barter.barterOffer, barterNeed: options.barter.barterNeed, barterValue: options.barter.barterValue })
            },
            attributes: {
                availability: { start: '2026-02-01', end: '2026-12-31' },
                locationRequirement: options.locationRequirement || 'On-Site',
                targetRole,
                ...options.attributes
            },
            normalized,
            createdAt: NOW,
            updatedAt: NOW
        });
        return id_;
    };

    // Reserve special IDs: barter users (first 20 users), consortium lead = user 21, role partners 22,23,24, circular A=25 B=26 C=27
    const barterUserStart = 1;
    const barterUserCount = 12;
    const consortiumLeadUser = 21;
    const consortiumPartners = [22, 23, 24];
    const circularUsers = [25, 26, 27];

    const creatorIds = users.map(u => u.id);

    // 1) One-way: many needs and offers with overlapping skills (use companies + remaining users)
    const oneWayCreators = SMALL_MODE ? [...companyIds, ...creatorIds.slice(14, 20)] : [...companyIds.slice(0, 15), ...creatorIds.filter((_, idx) => idx >= 30 && idx < 120)];
    const oneWaySkills = ['Structural Engineering', 'Project Management', 'Accounting', 'Equipment Rental', 'Engineering Consulting', 'Financial Investment'];
    const oneWayCount = SMALL_MODE ? 8 : 80;
    for (let i = 0; i < oneWayCount; i++) {
        const creator = pick(oneWayCreators);
        const skillSet = pickN(oneWaySkills, 2);
        const role = skillSet[0];
        if (rng() > 0.5) {
            need(creator, `Need: ${skillSet.join(', ')}`, skillSet, 50000 + rng() * 200000, 300000 + rng() * 500000, { targetRole: role });
        } else {
            offer(creator, `Offer: ${skillSet.join(', ')}`, skillSet, 50000 + rng() * 150000, 400000 + rng() * 300000, { targetRole: role });
        }
    }

    if (SMALL_MODE) {
        const strictSkills = ['Structural Engineering', 'Structural Analysis'];
        const needCreator = oneWayCreators[0];
        const offerCreator = oneWayCreators[1] || oneWayCreators[0];
        need(needCreator, 'Strict one-way need: Structural Engineering', strictSkills, 80000, 200000, { targetRole: 'Structural Engineering' });
        offer(offerCreator, 'Strict one-way offer: Structural Engineering', strictSkills, 80000, 200000, { targetRole: 'Structural Engineering' });
    }

    // 2) Barter pairs: users with both need and offer; pair A_offer satisfies B_need, B_offer satisfies A_need
    const barterPairs = [
        { a: 1, b: 2, aNeed: ['Office space'], aOffer: ['Engineering Consulting'], bNeed: ['Engineering Consulting'], bOffer: ['Office space'] },
        { a: 3, b: 4, aNeed: ['Accounting'], aOffer: ['Equipment Rental'], bNeed: ['Equipment Rental'], bOffer: ['Accounting'] },
        { a: 5, b: 6, aNeed: ['Excavator'], aOffer: ['Structural Engineering'], bNeed: ['Structural Engineering'], bOffer: ['Excavator'] },
        { a: 7, b: 8, aNeed: ['Financial Investment'], aOffer: ['Real Estate'], bNeed: ['Real Estate'], bOffer: ['Financial Investment'] },
        { a: 9, b: 10, aNeed: ['Project Management'], aOffer: ['Accounting'], bNeed: ['Accounting'], bOffer: ['Project Management'] },
        { a: 11, b: 12, aNeed: ['Office space'], aOffer: ['Accounting'], bNeed: ['Accounting'], bOffer: ['Office space'] }
    ];
    const barterPairsToUse = SMALL_MODE ? barterPairs.slice(0, 2) : barterPairs;
    for (const pair of barterPairsToUse) {
        const idA = id('sim-user', pair.a);
        const idB = id('sim-user', pair.b);
        need(idA, `Barter Need A: ${pair.aNeed[0]}`, pair.aNeed, 0, 500000, { exchangeMode: 'barter', paymentModes: ['barter'], targetRole: pair.aNeed[0], attributes: {} });
        offer(idA, `Barter Offer A: ${pair.aOffer[0]}`, pair.aOffer, 0, 500000, { exchangeMode: 'barter', paymentModes: ['barter'], targetRole: pair.aOffer[0], barter: { barterOffer: pair.aOffer[0], barterNeed: pair.aNeed[0], barterValue: '100000' } });
        need(idB, `Barter Need B: ${pair.bNeed[0]}`, pair.bNeed, 0, 500000, { exchangeMode: 'barter', paymentModes: ['barter'], targetRole: pair.bNeed[0], attributes: {} });
        offer(idB, `Barter Offer B: ${pair.bOffer[0]}`, pair.bOffer, 0, 500000, { exchangeMode: 'barter', paymentModes: ['barter'], targetRole: pair.bOffer[0], barter: { barterOffer: pair.bOffer[0], barterNeed: pair.bNeed[0], barterValue: '100000' } });
    }

    // 3) Consortium: one lead need with memberRoles; three offers from different creators matching each role
    const leadCreator = id('sim-user', consortiumLeadUser);
    need(leadCreator, 'Highway Project - Consortium Partners', ['Financial partner', 'Construction expertise', 'Equipment fleet'], 10000000, 50000000, {
        subModelType: 'consortium',
        attributes: {
            memberRoles: [
                { role: 'Financial partner', scope: 'Investment and financing' },
                { role: 'Construction expertise', scope: 'Civil works' },
                { role: 'Equipment fleet', scope: 'Heavy equipment' }
            ]
        }
    });
    offer(id('sim-user', consortiumPartners[0]), 'Financial partner offer', ['Financial partner', 'Investment', 'Financial Investment', 'Capital'], 5000000, 20000000, { sectors: ['Financial'], targetRole: 'Financial partner' });
    offer(id('sim-user', consortiumPartners[1]), 'Construction expertise offer', ['Construction expertise', 'Road Construction', 'Infrastructure Development', 'Project Management'], 2000000, 15000000, { sectors: ['Construction', 'Infrastructure'], targetRole: 'Construction expertise' });
    offer(id('sim-user', consortiumPartners[2]), 'Equipment fleet offer', ['Equipment fleet', 'Excavator', 'Heavy Equipment', 'Equipment Rental'], 1000000, 8000000, { sectors: ['Construction', 'Industrial'], targetRole: 'Equipment fleet' });

    // 4) Circular: A need Excavator / offer Office space; B need Office space / offer Accounting; C need Accounting / offer Excavator
    const ca = id('sim-user', circularUsers[0]);
    const cb = id('sim-user', circularUsers[1]);
    const cc = id('sim-user', circularUsers[2]);
    need(ca, 'Circular A needs Excavator', ['Excavator', 'Equipment Rental'], 50000, 200000, { targetRole: 'Excavator' });
    offer(ca, 'Circular A offers Office space', ['Office space', 'Real Estate'], 50000, 200000, { targetRole: 'Office space' });
    need(cb, 'Circular B needs Office space', ['Office space', 'Real Estate'], 50000, 200000, { targetRole: 'Office space' });
    offer(cb, 'Circular B offers Accounting', ['Accounting', 'Financial Reporting'], 50000, 200000, { targetRole: 'Accounting' });
    need(cc, 'Circular C needs Accounting', ['Accounting', 'Financial Reporting'], 50000, 200000, { targetRole: 'Accounting' });
    offer(cc, 'Circular C offers Excavator', ['Excavator', 'Equipment Rental'], 50000, 200000, { targetRole: 'Excavator' });

    // More generic need/offer to reach 200–400 (skip in small mode)
    const extraCreators = [...companyIds, ...creatorIds];
    const extraCount = SMALL_MODE ? 0 : 120;
    for (let i = 0; i < extraCount; i++) {
        const creator = pick(extraCreators);
        const skillSet = pickN(SKILLS_POOL, 2);
        if (rng() > 0.5) {
            need(creator, `Need: ${skillSet.join(', ')}`, skillSet, 10000 + rng() * 100000, 200000 + rng() * 300000);
        } else {
            offer(creator, `Offer: ${skillSet.join(', ')}`, skillSet, 10000 + rng() * 100000, 200000 + rng() * 400000);
        }
    }

    return opportunities;
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
    if (CONTROLLED_MODE) {
        mainControlled();
        return;
    }

    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    const companies = generateCompanies();
    const companyIds = companies.map(c => c.id);
    const users = generateUsers(companyIds);
    const userIds = users.map(u => u.id);
    const opportunities = generateOpportunities(companyIds, users);

    fs.writeFileSync(path.join(OUT_DIR, 'companies.json'), JSON.stringify({ domain: 'companies', version: '1.0', data: companies }, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'users.json'), JSON.stringify({ domain: 'users', version: '1.0', data: users }, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'opportunities.json'), JSON.stringify({ domain: 'opportunities', version: '1.0', data: opportunities }, null, 2));

    console.log('Simulation data written to', OUT_DIR);
    console.log('Companies:', companies.length);
    console.log('Users:', users.length);
    console.log('Opportunities:', opportunities.length);
}

main();
