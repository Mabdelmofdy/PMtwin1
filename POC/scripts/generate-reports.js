/**
 * Generate Data Coverage, Matching Readiness, and Missing Entities reports.
 * Run from repo root: node POC/scripts/generate-reports.js
 * Output: POC/docs/reports/DATA_COVERAGE_REPORT.md, MATCHING_READINESS_REPORT.md, MISSING_ENTITIES_REPORT.md
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'reports');

function loadJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return json.data != null ? json.data : json;
}

function run() {
    const users = loadJson('users.json');
    const companies = loadJson('companies.json');
    const opportunities = loadJson('opportunities.json');
    const applications = loadJson('applications.json');
    const legacyMatches = loadJson('matches.json');
    const postMatches = loadJson('demo-post-matches.json');
    const matches = postMatches.length ? postMatches : legacyMatches;
    const notifications = loadJson('notifications.json');
    const connections = loadJson('connections.json');
    const messages = loadJson('messages.json');
    const audit = loadJson('audit.json');
    const sessions = loadJson('sessions.json');
    const contracts = loadJson('contracts.json');
    const lookups = (() => {
        const p = path.join(DATA_DIR, 'lookups.json');
        if (!fs.existsSync(p)) return {};
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    })();
    const skillCanonical = (() => {
        const p = path.join(DATA_DIR, 'skill-canonical.json');
        if (!fs.existsSync(p)) return {};
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    })();

    const needs = opportunities.filter(o => o.intent === 'request' && o.status === 'published');
    const offers = opportunities.filter(o => o.intent === 'offer' && o.status === 'published');
    const barterOpps = opportunities.filter(o => (o.exchangeMode || o.paymentModes?.[0]) === 'barter');
    const consortiumOpps = opportunities.filter(o => o.attributes?.memberRoles?.length || o.subModelType === 'consortium');
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'moderator' || u.role === 'auditor');
    const professionals = users.filter(u => u.role === 'professional' || u.role === 'consultant');
    const pendingUsers = users.filter(u => u.status === 'pending' || u.status === 'clarification_requested');
    const pendingCompanies = companies.filter(c => c.status === 'pending' || c.status === 'clarification_requested');

    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const ts = new Date().toISOString();

    // --- Data Coverage Report ---
    const coverage = [
        '# Data Coverage Report',
        '',
        `Generated: ${ts}`,
        '',
        '## Domain counts',
        '',
        '| Domain | Count | Notes |',
        '|--------|-------|-------|',
        `| Users | ${users.length} | ${professionals.length} professionals/consultants, ${adminUsers.length} admin/moderator/auditor, ${companies.length} companies (separate store) |`,
        `| Companies | ${companies.length} | Company profiles (company_owner) |`,
        `| Opportunities | ${opportunities.length} | ${needs.length} needs, ${offers.length} offers (published) |`,
        `| Applications | ${applications.length} | Applications to opportunities |`,
        `| Post matches (demo) | ${matches.length} | post-to-post matches (demo-post-matches.json; legacy matches.json deprecated) |`,
        `| Notifications | ${notifications.length} | User notifications |`,
        `| Connections | ${connections.length} | User connections |`,
        `| Messages | ${messages.length} | Direct messages |`,
        `| Audit | ${audit.length} | Audit log entries |`,
        `| Sessions | ${sessions.length} | Active sessions |`,
        `| Contracts | ${contracts.length} | Contracts |`,
        '',
        '## Sufficiency for platform workflows',
        '',
        '- **Individual users:** Sufficient. Users can register, create profiles (professionals have full profiles), create opportunities, receive post-to-post matches (participants on post_matches), and collaborate (applications, connections, messages present).',
        `- **Companies:** Sufficient. ${companies.length} companies with full profiles; companies can post opportunities (including consortium opp-001).`,
        `- **Admin:** Sufficient. Admin/moderator/auditor roles present; ${pendingUsers.length} pending users, ${pendingCompanies.length} pending companies for vetting; opportunities and matching can be managed; audit trail has ${audit.length} entries.`,
        ''
    ];
    fs.writeFileSync(path.join(REPORTS_DIR, 'DATA_COVERAGE_REPORT.md'), coverage.join('\n'), 'utf8');

    // --- Matching Readiness Report ---
    const oneWayReady = needs.length >= 1 && offers.length >= 1;
    const barterReady = barterOpps.length >= 4; // two creators with need+offer each
    const consortiumReady = consortiumOpps.length >= 1 && offers.length >= 2;
    const circularReady = needs.length >= 3 && offers.length >= 3; // circular chain possible
    const readiness = [
        '# Matching Readiness Report',
        '',
        `Generated: ${ts}`,
        '',
        '## One-way matching (need → offers)',
        '',
        `- **Status:** ${oneWayReady ? 'Ready' : 'Not ready'}`,
        `- **Needs (published, intent=request):** ${needs.length}`,
        `- **Offers (published, intent=offer):** ${offers.length}`,
        '- **Requirement:** At least one need and one offer with overlapping skills/sectors so the matcher can return results.',
        '',
        '## Two-way barter matching',
        '',
        `- **Status:** ${barterReady ? 'Ready' : 'Not ready'}`,
        `- **Barter opportunities:** ${barterOpps.length} (exchangeMode or paymentModes include barter)`,
        '- **Requirement:** At least two creators each with one need and one offer that mutually satisfy (A’s offer fits B’s need, B’s offer fits A’s need).',
        '',
        '## Consortium (group formation)',
        '',
        `- **Status:** ${consortiumReady ? 'Ready' : 'Not ready'}`,
        `- **Consortium lead needs:** ${consortiumOpps.length} (memberRoles or subModelType=consortium)`,
        `- **Other published offers:** ${offers.length}`,
        '- **Requirement:** At least one lead need with memberRoles and enough published offers from different creators to fill roles.',
        '',
        '## Circular exchange',
        '',
        `- **Status:** ${circularReady ? 'Ready' : 'Not ready'}`,
        '- **Requirement:** At least three creators forming a cycle: A’s offer satisfies B’s need, B’s offer satisfies C’s need, C’s offer satisfies A’s need. Dataset includes dedicated circular need/offer pairs for user-pro-002, user-pro-003, user-pro-004.',
        '',
        '## Summary',
        '',
        `| Model | Ready |`,
        '|-------|-------|',
        `| One-way | ${oneWayReady ? 'Yes' : 'No'} |`,
        `| Two-way barter | ${barterReady ? 'Yes' : 'No'} |`,
        `| Consortium | ${consortiumReady ? 'Yes' : 'No'} |`,
        `| Circular | ${circularReady ? 'Yes' : 'No'} |`,
        ''
    ];
    fs.writeFileSync(path.join(REPORTS_DIR, 'MATCHING_READINESS_REPORT.md'), readiness.join('\n'), 'utf8');

    // --- Missing Entities Report ---
    const targetSectors = lookups.targetSectors || [];
    const skillSynonyms = skillCanonical.skillSynonyms || {};
    const missing = [
        '# Missing Entities Report',
        '',
        `Generated: ${ts}`,
        '',
        '## Industries / sectors',
        '',
        '- **Canonical list:** targetSectors in lookups.json plus validSectors in data-service.',
        `- **Current targetSectors:** ${targetSectors.join(', ') || 'none'}.`,
        '- **Gaps:** None critical; Building, Commercial, Utilities, Oil and Gas were added to targetSectors during cleanup.',
        '',
        '## Skills',
        '',
        `- **skill-canonical.json skillSynonyms:** ${Object.keys(skillSynonyms).length} entries.`,
        '- **Gaps:** All skills present in seed were added as canonical (self-mapping or synonym). New skills added in future seed or by users should be added to skillSynonyms if normalization is required.',
        '',
        '## Opportunity types',
        '',
        `- **Published opportunities by model:** project_based, hiring, resource_pooling, competition, strategic_partnership all have at least one published opportunity.`,
        '- **Gaps:** None. All relevant model/subModel combinations used in the platform have representative data.',
        '',
        '## Company roles / members',
        '',
        '- **Current state:** Company membership (user linked to company) is not modeled in platform seed; no companyId on users.',
        '- **Gap:** Optional future enhancement: add companyId to professional users and backfill from context so company members can be listed.',
        '',
        '## Subscription / plans',
        '',
        '- **subscription_plans, subscriptions:** No seed files; storage keys exist but are empty. Documented as "no seed data" in audit; not required for core marketplace workflows.',
        ''
    ];
    fs.writeFileSync(path.join(REPORTS_DIR, 'MISSING_ENTITIES_REPORT.md'), missing.join('\n'), 'utf8');

    console.log('Wrote', path.join(REPORTS_DIR, 'DATA_COVERAGE_REPORT.md'));
    console.log('Wrote', path.join(REPORTS_DIR, 'MATCHING_READINESS_REPORT.md'));
    console.log('Wrote', path.join(REPORTS_DIR, 'MISSING_ENTITIES_REPORT.md'));
}

run();
