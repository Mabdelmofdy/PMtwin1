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

// Realistic, GAP-P05-passing workflow users. Shared password Pmtwin@2026 (Base64).
// Kept in parity with data/seed-controlled-users.json so a --controlled re-seed
// (also triggered by the simulation test's beforeAll) does not revert them.
const CONTROLLED_USER_PASSWORD_HASH = 'UG10d2luQDIwMjY=';
const REALISTIC_CONTROLLED_USERS = [
    { email: 'khalid.alharbi@pmtwin.test', name: 'Khalid Al-Harbi', headline: 'Senior Architect — Sustainable Design', title: 'Senior Architect', location: 'Riyadh', bio: 'Senior architect with 9+ years leading sustainable, BIM-driven building design across Saudi Arabia, focused on LEED-certified commercial and mixed-use developments.', photo: 11, specializations: ['Architecture', 'Sustainable Design'], skills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification', 'Architectural Design'], sectors: ['Construction', 'Architecture'], certifications: ['LEED AP BD+C', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Riyadh Mixed-Use Tower', description: 'LEED Gold design lead for a 40-storey mixed-use tower.', year: 2024 }], workMode: 'On-Site', collab: ['project'], domain: 'Construction' },
    { email: 'sara.almutairi@pmtwin.test', name: 'Sara Al-Mutairi', headline: 'Architectural & BIM Consultant', title: 'BIM Consultant', location: 'Riyadh', bio: 'Multi-disciplinary architectural consultant offering BIM modelling, Revit detailing and structural coordination services to developers and contractors.', photo: 5, specializations: ['BIM Modelling', 'Architectural Design'], skills: ['BIM', 'Revit', 'Architectural Design', 'Structural Analysis', 'SAP2000'], sectors: ['Construction', 'Architecture'], certifications: ['Autodesk Revit Certified Professional', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Jeddah Waterfront Complex', description: 'Lead BIM coordinator across architecture and MEP packages.', year: 2023 }], workMode: 'Hybrid', collab: ['project', 'retainer'], domain: 'Construction' },
    { email: 'faisal.alotaibi@pmtwin.test', name: 'Faisal Al-Otaibi', headline: 'Architect — Commercial Projects', title: 'Architect', location: 'Riyadh', bio: 'Architect specializing in commercial and retail developments, leading concept-to-delivery design teams for clients across the central region.', photo: 12, specializations: ['Architecture', 'Concept Design'], skills: ['Architectural Design', 'BIM', 'Revit', 'Concept Design', 'Space Planning'], sectors: ['Construction', 'Architecture'], certifications: ['Saudi Council of Engineers'], caseStudies: [{ title: 'Riyadh Retail Plaza', description: 'Lead architect for a 25,000 sqm retail development.', year: 2022 }], workMode: 'On-Site', collab: ['project'], domain: 'Construction' },
    { email: 'noura.aldossari@pmtwin.test', name: 'Noura Al-Dossari', headline: 'Architect — Interior & Fit-Out', title: 'Architect', location: 'Jeddah', bio: 'Architect with a focus on interior architecture and fit-out, delivering hospitality and office interiors with strong sustainability credentials.', photo: 20, specializations: ['Interior Architecture', 'Fit-Out'], skills: ['Architectural Design', 'Interior Design', '3D Visualization', 'BIM', 'Sustainable Design'], sectors: ['Construction', 'Architecture'], certifications: ['LEED Green Associate', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Boutique Hotel Interiors', description: 'Interior architecture lead for a 120-key boutique hotel.', year: 2023 }], workMode: 'Hybrid', collab: ['project'], domain: 'Construction' },
    { email: 'omar.alshehri@pmtwin.test', name: 'Omar Al-Shehri', headline: 'Civil Engineer — Infrastructure', title: 'Civil Engineer', location: 'Dammam', bio: 'Civil engineer delivering roads, drainage and site infrastructure for large developments, with hands-on site supervision experience.', photo: 13, specializations: ['Civil Engineering', 'Infrastructure'], skills: ['Site Planning', 'Surveying', 'Road Design', 'Drainage Design', 'AutoCAD Civil 3D'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'PMP'], caseStudies: [{ title: 'Eastern Province Road Network', description: 'Civil lead for 18 km of urban road and drainage works.', year: 2021 }], workMode: 'On-Site', collab: ['project'], domain: 'Infrastructure' },
    { email: 'hessa.alqahtani@pmtwin.test', name: 'Hessa Al-Qahtani', headline: 'Civil Engineer — Site Works', title: 'Civil Engineer', location: 'Riyadh', bio: 'Civil engineer providing site planning, surveying and earthworks design services for commercial and residential developments.', photo: 16, specializations: ['Civil Engineering', 'Site Works'], skills: ['Site Planning', 'Surveying', 'Earthworks', 'AutoCAD Civil 3D', 'Quantity Surveying'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers'], caseStudies: [{ title: 'Residential Compound Earthworks', description: 'Site grading and drainage design for a 300-villa compound.', year: 2022 }], workMode: 'On-Site', collab: ['project'], domain: 'Infrastructure' },
    { email: 'yousef.alghamdi@pmtwin.test', name: 'Yousef Al-Ghamdi', headline: 'Construction Manager', title: 'Construction Manager', location: 'Jeddah', bio: 'Construction manager with two decades of experience delivering turnkey building projects, coordinating multi-trade teams and subcontractors.', photo: 14, specializations: ['Construction Management', 'General Contracting'], skills: ['Construction Management', 'Project Scheduling', 'Cost Control', 'Site Supervision', 'Procurement'], sectors: ['Construction', 'Infrastructure'], certifications: ['PMP', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Commercial Tower Delivery', description: 'Construction manager for a 30-floor commercial tower.', year: 2020 }], workMode: 'On-Site', collab: ['project'], domain: 'Construction' },
    { email: 'mansour.alzahrani@pmtwin.test', name: 'Mansour Al-Zahrani', headline: 'MEP Engineer', title: 'MEP Engineer', location: 'Riyadh', bio: 'MEP engineer designing mechanical, electrical and plumbing systems for commercial buildings, open to barter exchanges with architecture teams.', photo: 15, specializations: ['MEP Engineering', 'HVAC Design'], skills: ['MEP Design', 'HVAC', 'Electrical Design', 'Plumbing Design', 'Revit MEP'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'ASHRAE Member'], caseStudies: [{ title: 'Office Tower MEP', description: 'MEP design lead for a LEED-certified office tower.', year: 2023 }], workMode: 'Hybrid', collab: ['project', 'barter'], domain: 'Construction' },
    { email: 'layla.alsubaie@pmtwin.test', name: 'Layla Al-Subaie', headline: 'Architect — Barter Exchange', title: 'Architect', location: 'Riyadh', bio: 'Architect open to barter collaborations, exchanging design services with MEP and structural specialists on shared developments.', photo: 9, specializations: ['Architecture', 'Design Coordination'], skills: ['Architectural Design', 'BIM', 'Design Coordination', '3D Visualization', 'Revit'], sectors: ['Construction', 'Architecture'], certifications: ['Saudi Council of Engineers'], caseStudies: [{ title: 'Barter-Based Villa Series', description: 'Exchanged architecture services for MEP design across 6 villas.', year: 2022 }], workMode: 'Hybrid', collab: ['project', 'barter'], domain: 'Construction' },
    { email: 'abdullah.alrashid@pmtwin.test', name: 'Abdullah Al-Rashid', headline: 'Project Manager — Consortium Lead', title: 'Project Manager', location: 'Riyadh', bio: 'Senior project manager leading multi-disciplinary consortia on large infrastructure programs, specializing in design-build delivery and risk control.', photo: 17, specializations: ['Project Management', 'Program Delivery'], skills: ['Project Management', 'Program Management', 'Risk Management', 'Stakeholder Management', 'Primavera P6'], sectors: ['Construction', 'Infrastructure'], certifications: ['PMP', 'PMI-RMP', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Highway Design-Build Program', description: 'Consortium lead PM for a multi-package highway program.', year: 2024 }], workMode: 'On-Site', collab: ['consortium', 'project'], domain: 'Infrastructure' },
    { email: 'reem.alharbi@pmtwin.test', name: 'Reem Al-Harbi', headline: 'Architect — Consortium Partner', title: 'Architect', location: 'Riyadh', bio: 'Architect partnering in consortia to deliver the design package on large infrastructure and mixed-use programs.', photo: 10, specializations: ['Architecture', 'Infrastructure Design'], skills: ['Architectural Design', 'BIM', 'Infrastructure Design', 'Revit', 'Design Coordination'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'LEED Green Associate'], caseStudies: [{ title: 'Highway Interchange Architecture', description: 'Architectural package lead within a highway consortium.', year: 2024 }], workMode: 'On-Site', collab: ['consortium', 'project'], domain: 'Infrastructure' },
    { email: 'tariq.almaliki@pmtwin.test', name: 'Tariq Al-Maliki', headline: 'Civil Engineer — Consortium Partner', title: 'Civil Engineer', location: 'Riyadh', bio: 'Civil engineer delivering roadworks, structures and drainage within consortium-led infrastructure programs.', photo: 18, specializations: ['Civil Engineering', 'Roadworks'], skills: ['Road Design', 'Structural Analysis', 'Drainage Design', 'AutoCAD Civil 3D', 'Site Supervision'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'PMP'], caseStudies: [{ title: 'Highway Civil Works', description: 'Civil package lead within a highway design-build consortium.', year: 2024 }], workMode: 'On-Site', collab: ['consortium', 'project'], domain: 'Infrastructure' },
    { email: 'bandar.alanazi@pmtwin.test', name: 'Bandar Al-Anazi', headline: 'Heavy Equipment Provider', title: 'Equipment Manager', location: 'Dammam', bio: 'Provider of heavy construction equipment and plant, offering machinery and operators on rental or exchange terms for civil works.', photo: 51, specializations: ['Heavy Equipment', 'Plant Hire'], skills: ['Equipment Management', 'Plant Hire', 'Logistics', 'Fleet Maintenance', 'Operator Staffing'], sectors: ['Construction', 'Infrastructure'], certifications: ['OSHA Equipment Safety', 'Saudi Council of Engineers'], caseStudies: [{ title: 'Earthmoving Fleet Supply', description: 'Supplied graders and excavators for a major earthworks package.', year: 2023 }], workMode: 'On-Site', collab: ['barter', 'project'], domain: 'Infrastructure' },
    { email: 'maha.aljuhani@pmtwin.test', name: 'Maha Al-Juhani', headline: 'Real Estate Development Manager', title: 'Real Estate Manager', location: 'Jeddah', bio: 'Real estate development manager structuring land, feasibility and development deals, frequently exchanging services within project consortia.', photo: 23, specializations: ['Real Estate Development', 'Feasibility'], skills: ['Real Estate Development', 'Feasibility Studies', 'Market Analysis', 'Investment Appraisal', 'Land Acquisition'], sectors: ['Real Estate', 'Construction'], certifications: ['RICS Member', 'Saudi Real Estate Authority'], caseStudies: [{ title: 'Mixed-Use Land Development', description: 'Led feasibility and structuring for a mixed-use district.', year: 2023 }], workMode: 'Hybrid', collab: ['barter', 'project'], domain: 'Real Estate' },
    { email: 'rana.alfaraj@pmtwin.test', name: 'Rana Al-Faraj', headline: 'Accounting & Finance Consultant', title: 'Finance Consultant', location: 'Riyadh', bio: 'Accounting and finance consultant supporting construction firms with project accounting, cost reporting and VAT compliance, open to service exchanges.', photo: 25, specializations: ['Accounting', 'Project Finance'], skills: ['Project Accounting', 'Cost Reporting', 'VAT Compliance', 'Financial Modelling', 'Auditing'], sectors: ['Finance', 'Construction'], certifications: ['SOCPA', 'CMA'], caseStudies: [{ title: 'Contractor Cost System', description: 'Implemented project cost accounting for a mid-size contractor.', year: 2022 }], workMode: 'Remote', collab: ['barter', 'retainer'], domain: 'Finance' },
    { email: 'saad.alamri@pmtwin.test', name: 'Saad Al-Amri', headline: 'Structural Engineer', title: 'Structural Engineer', location: 'Riyadh', bio: 'Structural engineer specializing in steel and concrete structures, providing analysis and detailed design for commercial and industrial buildings.', photo: 33, specializations: ['Structural Engineering', 'Steel Design'], skills: ['Structural Analysis', 'SAP2000', 'ETABS', 'Steel Design', 'Concrete Design'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'PE Structural'], caseStudies: [{ title: 'Industrial Warehouse Structure', description: 'Structural design lead for a 12,000 sqm steel warehouse.', year: 2023 }], workMode: 'Hybrid', collab: ['project'], domain: 'Construction' },
    { email: 'huda.albalawi@pmtwin.test', name: 'Huda Al-Balawi', headline: 'Project Manager — Delivery', title: 'Project Manager', location: 'Riyadh', bio: 'Project manager focused on delivery governance, scheduling and shared-resource coordination for construction programs.', photo: 44, specializations: ['Project Management', 'Delivery Governance'], skills: ['Project Management', 'Scheduling', 'Risk Management', 'Resource Planning', 'Primavera P6'], sectors: ['Construction', 'Infrastructure'], certifications: ['PMP', 'PRINCE2 Practitioner'], caseStudies: [{ title: 'Shared-Resource Program', description: 'Coordinated shared resources across three concurrent projects.', year: 2023 }], workMode: 'On-Site', collab: ['project', 'retainer'], domain: 'Construction' },
    { email: 'ziad.alharthy@pmtwin.test', name: 'Ziad Al-Harthy', headline: 'MEP Engineer — Building Services', title: 'MEP Engineer', location: 'Jeddah', bio: 'MEP engineer providing building services design and energy modelling for commercial developments across the western region.', photo: 60, specializations: ['MEP Engineering', 'Energy Modelling'], skills: ['MEP Design', 'HVAC', 'Energy Modelling', 'Electrical Design', 'Revit MEP'], sectors: ['Construction', 'Infrastructure'], certifications: ['Saudi Council of Engineers', 'LEED AP'], caseStudies: [{ title: 'Retail Mall Building Services', description: 'MEP design lead for a regional retail mall.', year: 2022 }], workMode: 'Hybrid', collab: ['project'], domain: 'Construction' }
];

function generateControlledUsers() {
    return REALISTIC_CONTROLLED_USERS.map((p, i) => {
        const n = i + 1;
        return {
            id: seedUserId(n),
            email: p.email,
            passwordHash: CONTROLLED_USER_PASSWORD_HASH,
            role: 'professional',
            status: 'active',
            isPublic: true,
            connectionCount: 5 + n,
            profile: {
                name: p.name,
                type: 'professional',
                headline: p.headline,
                title: p.title,
                phone: `+966 55 ${String(n).padStart(3, '0')} 2000`,
                location: `${p.location}, Saudi Arabia`,
                locationCity: p.location,
                bio: p.bio,
                photoUrl: `https://i.pravatar.cc/150?img=${p.photo}`,
                specializations: p.specializations,
                skills: p.skills,
                sectors: p.sectors,
                yearsExperience: 8 + n,
                certifications: p.certifications,
                caseStudies: p.caseStudies,
                preferredWorkMode: p.workMode,
                preferredPaymentModes: ['cash', 'barter'],
                preferredCollaborationModels: p.collab,
                primaryDomain: p.domain,
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
            budgetMin: 5000000, budgetMax: 25000000
        },
        {
            id: 'seed-opp-016', intent: 'offer', creator: 12, scenario: 'G-consortium',
            title: '[G] Consortium partner — Civil Engineer',
            targetRole: 'Civil Engineer',
            skills: ['Civil Engineer', 'Site Planning', 'Drainage Design', 'Road Design'],
            budgetMin: 5000000, budgetMax: 25000000
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
        version: '2.0',
        description: 'Canonical 25-opportunity workflow users. Shared password: Pmtwin@2026 (Base64 in passwordHash). Profiles enriched to clear GAP-P05 (>=70%).'
    });

    console.log('\nControlled seed written.');
    console.log('Simulation:', OUT_DIR);
    console.log('Browser:', path.join(DATA_DIR, 'opportunities.json'));
    console.log('Companies:', companies.length);
    console.log('Users:', users.length);
    console.log('Opportunities:', opportunities.length);

    validateScenarioChecklist(opportunities);

    const { spawnSync } = require('child_process');
    const seedMatches = spawnSync(process.execPath, [path.join(__dirname, '..', 'seed-post-matches.js')], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
    });
    if (seedMatches.status !== 0) {
        console.warn('seed-post-matches.js exited with code', seedMatches.status);
    }
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
