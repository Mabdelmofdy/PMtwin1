/**
 * Align all opportunities to matching system: backfill intent, scope, exchangeData, attributes.
 * Creates a backup before writing. Run from repo root: node POC/scripts/align-opportunities-to-matching.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

const DEFAULT_START = '2026-02-01';

function loadJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filename, obj) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(obj, null, 2), 'utf8');
}

function addMonths(isoDateStr, months) {
    const d = new Date(isoDateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
}

function addDays(isoDateStr, days) {
    const d = new Date(isoDateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function deriveLocationRequirement(opp) {
    const att = opp.attributes || {};
    if (att.locationRequirement) return att.locationRequirement;
    if (att.workMode) return att.workMode;
    const loc = (opp.location || '').toLowerCase();
    if (/remote/i.test(loc)) return 'Remote';
    if (/hybrid/i.test(loc)) return 'Hybrid';
    const region = (opp.locationRegion || '').toLowerCase();
    if (region) return 'On-Site';
    return 'KSA';
}

function alignOne(opp) {
    const out = { ...opp };
    const scope = out.scope || {};
    const att = out.attributes || {};
    const ed = out.exchangeData || {};

    // --- intent ---
    if (out.intent !== 'request' && out.intent !== 'offer') {
        const hasReq = Array.isArray(scope.requiredSkills) && scope.requiredSkills.length > 0;
        const hasOff = Array.isArray(scope.offeredSkills) && scope.offeredSkills.length > 0;
        out.intent = hasReq && !hasOff ? 'request' : 'offer';
    }

    // --- exchangeMode / paymentModes ---
    const mode = (ed.exchangeMode || out.exchangeMode || 'cash').toLowerCase();
    if (!out.exchangeMode) out.exchangeMode = mode;
    if (!Array.isArray(out.paymentModes) || out.paymentModes.length === 0) {
        out.paymentModes = mode === 'barter' ? ['barter'] : ['cash'];
    }

    // --- scope ---
    if (!Array.isArray(scope.sectors)) scope.sectors = [];
    if (out.intent === 'request') {
        if (!Array.isArray(scope.requiredSkills)) scope.requiredSkills = [];
    }
    if (out.intent === 'offer') {
        if (!Array.isArray(scope.offeredSkills)) scope.offeredSkills = [];
        // If offer has no offeredSkills but has requiredSkills (form quirk), use them for matching
        if (scope.offeredSkills.length === 0 && Array.isArray(scope.requiredSkills) && scope.requiredSkills.length > 0) {
            scope.offeredSkills = [...scope.requiredSkills];
        }
    }
    if (!Array.isArray(scope.certifications)) scope.certifications = [];
    out.scope = scope;

    // --- exchangeData ---
    if (!out.exchangeData || typeof out.exchangeData !== 'object') {
        out.exchangeData = { exchangeMode: mode, currency: 'SAR', exchangeTermsSummary: '' };
    }
    const exchangeData = out.exchangeData;
    if (!exchangeData.currency) exchangeData.currency = 'SAR';
    if (exchangeData.exchangeMode == null) exchangeData.exchangeMode = out.exchangeMode || 'cash';

    const edMode = (exchangeData.exchangeMode || 'cash').toLowerCase();
    if (edMode === 'cash') {
        if (exchangeData.cashAmount != null && (!exchangeData.budgetRange || (exchangeData.budgetRange.min == null && exchangeData.budgetRange.max == null))) {
            const n = Number(exchangeData.cashAmount);
            if (!isNaN(n)) {
                exchangeData.budgetRange = { min: n, max: n, currency: exchangeData.currency || 'SAR' };
            }
        }
    }
    if (edMode === 'barter') {
        if (exchangeData.barterOffer == null) exchangeData.barterOffer = '';
        if (exchangeData.barterNeed == null) exchangeData.barterNeed = '';
        if (exchangeData.barterValue == null) exchangeData.barterValue = '0';
    }

    // --- attributes: timeline and location for preprocessor ---
    const attOut = { ...att };
    const hasTimeline = attOut.startDate || attOut.tenderDeadline || attOut.applicationDeadline ||
        (attOut.availability && (attOut.availability.start || attOut.availability.end));
    if (!hasTimeline) {
        const start = attOut.startDate || out.createdAt?.slice(0, 10) || DEFAULT_START;
        attOut.startDate = start;
        if (!attOut.tenderDeadline && !attOut.applicationDeadline) {
            attOut.applicationDeadline = addMonths(start, 6);
        }
    }
    if (attOut.locationRequirement == null && attOut.workMode == null) {
        attOut.locationRequirement = deriveLocationRequirement(out);
    }
    // Set endDate from start + duration when not already set
    if (!attOut.endDate && attOut.startDate) {
        const durationMonths = attOut.projectDuration != null ? Number(attOut.projectDuration) : (attOut.contractDuration != null ? Number(attOut.contractDuration) : null);
        const durationDays = attOut.duration != null ? Number(attOut.duration) : null;
        if (durationMonths != null && !isNaN(durationMonths)) {
            attOut.endDate = addMonths(attOut.startDate, durationMonths);
        } else if (durationDays != null && !isNaN(durationDays)) {
            attOut.endDate = addDays(attOut.startDate, durationDays);
        }
    }
    out.attributes = attOut;

    // --- subModelType (keep existing; default only if missing) ---
    if (!out.subModelType && out.modelType) {
        const firstSub = out.modelType === 'project_based' ? 'task_based' : Object.keys({ project_based: 1, strategic_partnership: 1, resource_pooling: 1, hiring: 1, competition: 1 })[0];
        out.subModelType = firstSub;
    }

    return out;
}

function run() {
    const opportunitiesPath = path.join(DATA_DIR, 'opportunities.json');
    const file = loadJson('opportunities.json');
    const data = file.data || [];

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const backupPath = path.join(BACKUP_DIR, `opportunities.json.bak-${Date.now()}`);
    fs.copyFileSync(opportunitiesPath, backupPath);
    console.log('Backup written to', backupPath);

    const aligned = data.map(alignOne);
    file.data = aligned;
    if (!file.version) file.version = '1.2';
    saveJson('opportunities.json', file);
    console.log('Aligned', aligned.length, 'opportunities. Saved to', path.join(DATA_DIR, 'opportunities.json'));
}

run();
