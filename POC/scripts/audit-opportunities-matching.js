/**
 * Audit opportunities for matching-system alignment.
 *
 * Two layers:
 *  1) Field audit — required/used fields for post-to-post matching (skills, exchange,
 *     timeline, role).
 *  2) Engine audit — bootstraps the real matching engine, detects models per published
 *     opportunity, runs persistPostMatches, and verifies role safety (no one_way/two_way
 *     match pairs two different professions).
 *
 * Run from POC: node scripts/audit-opportunities-matching.js
 */

const fs = require('fs');
const path = require('path');
const { bootstrap } = require('./simulation/bootstrap-matching.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REPORT_PATH = path.join(__dirname, '..', 'docs', 'reports', 'OPPORTUNITIES_MATCHING_AUDIT.md');

const VALID_INTENTS = ['request', 'offer', 'hybrid'];

function loadJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return json.data != null ? json.data : json;
}

/** Intentional negative fixture: a legacy post deliberately without a role to prove the strict gate blocks it. */
function isLegacyRoleFixture(opp) {
    const text = `${opp.title || ''} ${opp.description || ''}`.toLowerCase();
    return text.includes('no targetrole') || text.includes('legacy need');
}

function auditOne(opp) {
    const issues = [];
    const id = opp.id || '(no id)';

    if (!VALID_INTENTS.includes(opp.intent)) {
        issues.push('missing or invalid intent (expected request/offer/hybrid)');
    }

    const scope = opp.scope || {};
    const reqSkills = scope.requiredSkills;
    const offSkills = scope.offeredSkills;
    const sectors = scope.sectors;
    const hasNeed = opp.intent === 'request' || opp.intent === 'hybrid';
    const hasOffer = opp.intent === 'offer' || opp.intent === 'hybrid';

    if (hasNeed && (!Array.isArray(reqSkills) || reqSkills.length === 0)) {
        issues.push('scope.requiredSkills missing or empty');
    }
    if (hasOffer && (!Array.isArray(offSkills) || offSkills.length === 0)) {
        issues.push('scope.offeredSkills missing or empty');
    }
    if (!Array.isArray(sectors)) {
        issues.push('scope.sectors missing or not array');
    }

    // Role / profession — strict matching reads attributes.targetRole (or professionalRole).
    // Intentional legacy fixtures are exempt: they prove the gate blocks role-less posts.
    const att = opp.attributes || {};
    const role = att.targetRole || att.professionalRole;
    if (!role && !isLegacyRoleFixture(opp)) {
        issues.push('attributes.targetRole missing (required for strict role matching)');
    }

    const exchangeData = opp.exchangeData;
    if (!exchangeData || typeof exchangeData !== 'object') {
        issues.push('exchangeData missing or empty');
    } else {
        const mode = (exchangeData.exchangeMode || opp.exchangeMode || '').toLowerCase();
        if (mode === 'cash' && exchangeData.cashAmount == null && !(exchangeData.budgetRange && (exchangeData.budgetRange.min != null || exchangeData.budgetRange.max != null))) {
            issues.push('exchangeData has no cashAmount or budgetRange for cash');
        }
        if (mode === 'barter') {
            if (exchangeData.barterOffer == null) issues.push('exchangeData.barterOffer missing');
            if (exchangeData.barterNeed == null) issues.push('exchangeData.barterNeed missing');
            if (exchangeData.barterValue == null) issues.push('exchangeData.barterValue missing');
        }
    }

    if (!opp.exchangeMode) {
        issues.push('exchangeMode missing');
    }

    const attKeys = Object.keys(att);
    if (attKeys.length === 0) {
        issues.push('attributes empty');
    }
    if (!att.startDate && !att.tenderDeadline && !att.applicationDeadline && !att.availability) {
        issues.push('attributes missing timeline (startDate/tenderDeadline/applicationDeadline/availability)');
    }
    if (!att.locationRequirement && !att.workMode) {
        issues.push('attributes missing locationRequirement or workMode');
    }

    if (opp.subModelType === 'consortium' && !(att.memberRoles && att.memberRoles.length) && !(att.partnerRoles && att.partnerRoles.length)) {
        issues.push('consortium opportunity missing attributes.memberRoles or partnerRoles');
    }

    return { id, issues };
}

/** Strong dedupe key mirroring persistence so audit counts match the canonical seed. */
function strongKey(record) {
    if (!record || !record.matchType) return null;
    const payload = record.payload || {};
    if (record.matchType === 'one_way') {
        if (!payload.needOpportunityId || !payload.offerOpportunityId) return null;
        return `one_way:${payload.needOpportunityId}:${payload.offerOpportunityId}`;
    }
    if (record.matchType === 'two_way') {
        const side = (s = {}) => `${s.userId || ''}:${s.needId || ''}:${s.offerId || ''}`;
        return `two_way:${[side(payload.sideA), side(payload.sideB)].sort().join('|')}`;
    }
    if (record.matchType === 'consortium') {
        if (!payload.leadNeedId) return null;
        const roles = (payload.roles || []).map(r => r.opportunityId).filter(Boolean).sort().join(',');
        return `consortium:${payload.leadNeedId}:${roles}`;
    }
    if (record.matchType === 'circular') {
        const cycle = (payload.cycle || []).slice().sort().join(',');
        return cycle ? `circular:${cycle}` : null;
    }
    return null;
}

/** Minimal in-memory data service so persistPostMatches can run over opportunities.json. */
function createPersistDataService(published) {
    const postMatches = [];
    let runCounter = 0;
    return {
        async getOpportunityById(id) {
            return published.find(o => o.id === id) || null;
        },
        async getOpportunities() {
            return [...published];
        },
        async getPostMatches() {
            return [...postMatches];
        },
        async createMatchingRun(meta) {
            runCounter += 1;
            return { id: `audit-run-${runCounter}`, ...meta };
        },
        getPostMatchStrongKey(record) {
            return strongKey(record);
        },
        async createPostMatch(data) {
            const record = {
                id: `audit-pm-${postMatches.length + 1}`,
                matchType: data.matchType || 'one_way',
                status: data.status || 'pending',
                matchScore: data.matchScore != null ? data.matchScore : 0,
                participants: Array.isArray(data.participants) ? data.participants : [],
                payload: data.payload != null ? data.payload : {}
            };
            const sk = strongKey(record);
            if (sk && postMatches.some(m => strongKey(m) === sk)) return null;
            postMatches.push(record);
            return record;
        }
    };
}

function roleOf(opp, hardConstraints) {
    if (!opp) return '';
    const att = opp.attributes || {};
    const raw = att.targetRole || att.professionalRole || opp.normalized?.role || '';
    return hardConstraints.normalizeRoleLabel(raw);
}

function rolesEqual(a, b) {
    return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** Scan produced one_way/two_way matches for profession mismatches. */
function scanRoleSafety(matches, byId, hardConstraints) {
    const violations = [];
    for (const m of matches) {
        const p = m.payload || {};
        if (m.matchType === 'one_way') {
            const needRole = roleOf(byId[p.needOpportunityId], hardConstraints);
            const offerRole = roleOf(byId[p.offerOpportunityId], hardConstraints);
            if (!rolesEqual(needRole, offerRole)) {
                violations.push(`${m.id} one_way: need ${p.needOpportunityId} (${needRole || '∅'}) vs offer ${p.offerOpportunityId} (${offerRole || '∅'})`);
            }
        } else if (m.matchType === 'two_way') {
            const a = p.sideA || {};
            const b = p.sideB || {};
            const pairs = [
                [a.needId, b.offerId],
                [b.needId, a.offerId]
            ];
            for (const [needId, offerId] of pairs) {
                const needRole = roleOf(byId[needId], hardConstraints);
                const offerRole = roleOf(byId[offerId], hardConstraints);
                if (needId && offerId && !rolesEqual(needRole, offerRole)) {
                    violations.push(`${m.id} two_way: need ${needId} (${needRole || '∅'}) vs offer ${offerId} (${offerRole || '∅'})`);
                }
            }
        }
    }
    return violations;
}

async function run() {
    const opportunities = loadJson('opportunities.json');
    const published = opportunities.filter(o => (o.status || '') === 'published');
    const byId = Object.fromEntries(opportunities.map(o => [o.id, o]));

    // --- Layer 1: field audit ---
    const results = opportunities.map(auditOne);
    const withIssues = results.filter(r => r.issues.length > 0);
    const withoutIssues = results.filter(r => r.issues.length === 0);

    // --- Layer 2: engine audit ---
    const { matchingService } = bootstrap({ simulationDir: false, basePath: '' });
    const ds = createPersistDataService(published);
    global.dataService = ds;
    if (global.window) global.window.dataService = ds;
    matchingService.dataService = ds;
    matchingService.notifyPostMatch = async () => {};
    global.CONFIG.POST_MATCH_STATUS = { PENDING: 'pending', CONFIRMED: 'confirmed', DECLINED: 'declined', EXPIRED: 'expired' };
    const hardConstraints = global.hardConstraints;

    const routing = [];
    for (const opp of published) {
        const models = matchingService.detectMatchingModel(opp) || [];
        routing.push({ id: opp.id, intent: opp.intent, role: roleOf(opp, hardConstraints) || '∅', models: models.length ? models.join(', ') : '(none)' });
    }

    for (const opp of published) {
        try {
            await matchingService.persistPostMatches(opp.id, { source: 'audit' });
        } catch (err) {
            console.warn('persist failed for', opp.id, err.message);
        }
    }
    const matches = await ds.getPostMatches();
    const byType = {};
    matches.forEach(m => { byType[m.matchType] = (byType[m.matchType] || 0) + 1; });

    const roleViolations = scanRoleSafety(matches, byId, hardConstraints);

    // --- Write report ---
    const lines = [
        '# Opportunities matching alignment audit',
        '',
        `Generated: ${new Date().toISOString()}`,
        `Total opportunities: ${opportunities.length} (published: ${published.length})`,
        `Field issues: ${withIssues.length} | OK: ${withoutIssues.length}`,
        `Matches produced: ${matches.length} (${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'})`,
        `Role-safety violations: ${roleViolations.length}`,
        ''
    ];

    if (withIssues.length > 0) {
        lines.push('## Field issues', '');
        withIssues.forEach(({ id, issues }) => lines.push(`- **${id}**: ${issues.join('; ')}`));
        lines.push('');
    }

    lines.push('## Model routing (published)', '');
    lines.push('| Opportunity | Intent | Role | Detected models |');
    lines.push('|-------------|--------|------|-----------------|');
    routing.forEach(r => lines.push(`| ${r.id} | ${r.intent} | ${r.role} | ${r.models} |`));
    lines.push('');

    lines.push('## Role safety (one_way / two_way)', '');
    if (roleViolations.length === 0) {
        lines.push('No profession mismatches. Every one_way and two_way match pairs identical roles.');
    } else {
        roleViolations.forEach(v => lines.push(`- ${v}`));
    }
    lines.push('');

    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

    console.log('Audit complete.');
    console.log('  Field issues:', withIssues.length);
    console.log('  Matches produced:', matches.length, byType);
    console.log('  Role-safety violations:', roleViolations.length);
    if (withIssues.length > 0) {
        withIssues.slice(0, 10).forEach(({ id, issues }) => console.log(`    ${id}: ${issues.join('; ')}`));
    }
    if (roleViolations.length > 0) {
        roleViolations.slice(0, 10).forEach(v => console.log('    VIOLATION', v));
        process.exitCode = 1;
    }
    console.log('Report written to:', REPORT_PATH);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
