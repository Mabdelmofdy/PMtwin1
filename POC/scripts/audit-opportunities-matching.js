/**
 * Audit opportunities for matching-system alignment.
 * Reports missing or empty fields required/used by post-to-post and person-to-opportunity matching.
 * Run from repo root: node POC/scripts/audit-opportunities-matching.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return json.data != null ? json.data : json;
}

function auditOne(opp) {
    const issues = [];
    const id = opp.id || '(no id)';

    if (opp.intent !== 'request' && opp.intent !== 'offer') {
        issues.push('missing or invalid intent');
    }

    const scope = opp.scope || {};
    const reqSkills = scope.requiredSkills;
    const offSkills = scope.offeredSkills;
    const sectors = scope.sectors;
    const isRequest = opp.intent === 'request';
    const isOffer = opp.intent === 'offer';

    if (isRequest && (!Array.isArray(reqSkills) || reqSkills.length === 0)) {
        issues.push('scope.requiredSkills missing or empty');
    }
    if (isOffer && (!Array.isArray(offSkills) || offSkills.length === 0)) {
        issues.push('scope.offeredSkills missing or empty');
    }
    if (!Array.isArray(sectors)) {
        issues.push('scope.sectors missing or not array');
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

    const att = opp.attributes || {};
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

function run() {
    const opportunities = loadJson('opportunities.json');
    const results = opportunities.map(auditOne);
    const withIssues = results.filter(r => r.issues.length > 0);
    const withoutIssues = results.filter(r => r.issues.length === 0);

    const lines = [
        '# Opportunities matching alignment audit',
        '',
        `Generated: ${new Date().toISOString()}`,
        `Total opportunities: ${opportunities.length}`,
        `With issues: ${withIssues.length}`,
        `OK: ${withoutIssues.length}`,
        ''
    ];

    if (withIssues.length > 0) {
        lines.push('## Opportunities with missing or invalid fields');
        lines.push('');
        withIssues.forEach(({ id, issues }) => {
            lines.push(`- **${id}**: ${issues.join('; ')}`);
        });
        lines.push('');
    }

    if (withoutIssues.length > 0 && withIssues.length > 0) {
        lines.push('## OK (no issues)');
        lines.push('');
        lines.push(withoutIssues.map(r => r.id).join(', '));
        lines.push('');
    }

    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'OPPORTUNITIES_MATCHING_AUDIT.md');
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

    console.log('Audit complete. Opportunities with issues:', withIssues.length);
    console.log('Report written to:', reportPath);
    if (withIssues.length > 0) {
        withIssues.slice(0, 10).forEach(({ id, issues }) => console.log(`  ${id}: ${issues.join('; ')}`));
        if (withIssues.length > 10) console.log('  ...');
    }
}

run();
