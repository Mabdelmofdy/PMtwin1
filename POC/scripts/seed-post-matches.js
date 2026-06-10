/**
 * Run persistPostMatches for all published opportunities and write demo-post-matches.json.
 * Keeps legacy demo-pm-* id prefixes so existing links (e.g. demo-pm-oneway-06) keep working.
 *
 * Run from POC: node scripts/seed-post-matches.js
 */

const fs = require('fs');
const path = require('path');
const { bootstrap } = require('./simulation/bootstrap-matching.js');

const POC_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(POC_ROOT, 'data');
const OUT_FILE = path.join(DATA_DIR, 'demo-post-matches.json');

const ID_PREFIX = {
    one_way: 'demo-pm-oneway',
    two_way: 'demo-pm-barter',
    consortium: 'demo-pm-consortium',
    circular: 'demo-pm-circular'
};

function loadJsonEnvelope(filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return raw.data != null ? raw.data : raw;
}

function createPersistDataService(opportunities) {
    const published = opportunities.filter(o => (o.status || '') === 'published');
    const postMatches = [];
    let runCounter = 0;

    const strongKey = (record) => {
        if (!record || !record.matchType) return null;
        const type = record.matchType;
        const payload = record.payload || {};
        if (type === 'one_way') {
            const needId = payload.needOpportunityId;
            const offerId = payload.offerOpportunityId;
            if (!needId || !offerId) return null;
            return `one_way:${needId}:${offerId}`;
        }
        if (type === 'two_way') {
            const a = payload.sideA || {};
            const b = payload.sideB || {};
            const side = (s) => `${s.userId || ''}:${s.needId || ''}:${s.offerId || ''}`;
            const keys = [side(a), side(b)].sort();
            return `two_way:${keys.join('|')}`;
        }
        if (type === 'consortium') {
            const lead = payload.leadNeedId;
            const roles = (payload.roles || []).map(r => r.opportunityId).filter(Boolean).sort().join(',');
            if (!lead) return null;
            return `consortium:${lead}:${roles}`;
        }
        if (type === 'circular') {
            const cycle = (payload.cycle || []).slice().sort().join(',');
            if (!cycle) return null;
            return `circular:${cycle}`;
        }
        return null;
    };

    const signature = (record) => {
        const parts = (record.participants || [])
            .map(p => `${p.userId || ''}:${p.role || ''}:${p.opportunityId || ''}`)
            .sort();
        return `${record.matchType || ''}|${parts.join(';')}`;
    };

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
            return { id: `seed-run-${String(runCounter).padStart(3, '0')}`, ...meta };
        },
        getPostMatchStrongKey(record) {
            return strongKey(record);
        },
        async createPostMatch(data) {
            const status = data.status || 'pending';
            const newRecord = {
                id: `tmp-${postMatches.length + 1}`,
                matchType: data.matchType || 'one_way',
                status,
                matchScore: data.matchScore != null ? data.matchScore : 0,
                runId: data.runId || null,
                participants: Array.isArray(data.participants) ? data.participants : [],
                payload: data.payload != null ? data.payload : {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: status === 'pending'
                    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
                isReplacement: !!data.isReplacement
            };
            const sk = strongKey(newRecord);
            if (sk && postMatches.some(m => !m.isReplacement && strongKey(m) === sk)) return null;
            const sig = signature(newRecord);
            if (postMatches.some(m => !m.isReplacement && signature(m) === sig)) return null;
            postMatches.push(newRecord);
            return newRecord;
        }
    };
}

function assignStableIds(matches) {
    const byType = {};
    const sorted = [...matches].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    return sorted.map((m) => {
        const type = m.matchType || 'one_way';
        byType[type] = (byType[type] || 0) + 1;
        const prefix = ID_PREFIX[type] || `demo-pm-${type}`;
        const n = byType[type];
        return { ...m, id: `${prefix}-${String(n).padStart(2, '0')}` };
    });
}

async function main() {
    const opportunities = loadJsonEnvelope(path.join(DATA_DIR, 'opportunities.json'));
    const published = opportunities.filter(o => (o.status || '') === 'published');
    if (!published.length) {
        console.error('No published opportunities in opportunities.json');
        process.exit(1);
    }

    const { matchingService } = bootstrap({ simulationDir: false, basePath: '' });
    const ds = createPersistDataService(opportunities);
    // matching-models reads global.dataService, not matchingService.dataService
    global.dataService = ds;
    matchingService.dataService = ds;
    matchingService.notifyPostMatch = async () => {};

    global.CONFIG.POST_MATCH_STATUS = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        DECLINED: 'declined',
        EXPIRED: 'expired'
    };

    let totalCreated = 0;
    for (const opp of published) {
        const result = await matchingService.persistPostMatches(opp.id, { source: 'seed' });
        totalCreated += result.createdCount || 0;
        process.stdout.write(`  ${opp.id}: ${result.createdCount || 0} created\r`);
    }
    console.log(`\nPersisted ${totalCreated} post_matches from ${published.length} opportunities`);

    const raw = await ds.getPostMatches();
    const withIds = assignStableIds(raw);

    const envelope = {
        domain: 'post_matches',
        version: '1.0',
        description: 'Generated by scripts/seed-post-matches.js from opportunities.json via persistPostMatches',
        data: withIds
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(envelope, null, 2));
    console.log('Wrote', withIds.length, 'matches to', OUT_FILE);

    const counts = {};
    withIds.forEach(m => { counts[m.matchType] = (counts[m.matchType] || 0) + 1; });
    console.log('By type:', counts);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
