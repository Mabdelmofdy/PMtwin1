/**
 * Audit all data shown on Admin Matching page (#/admin/matching).
 * Uses POC/data/*.json seed (same sources as browser after fresh seed).
 *
 * Usage: node scripts/audit-admin-matching-page.js
 */

const path = require('path');
const fs = require('fs');
const {
    setupGlobalConfig,
    patchFetchForSkillCanonical,
    loadMatchingScripts
} = require('./simulation/bootstrap-matching.js');
const { loadSkillCanonicalForNode } = require('./simulation/mock-data-service.js');

const POC_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(POC_ROOT, 'data');

function loadDomainJson(name) {
    const file = path.join(DATA_DIR, name + '.json');
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(raw.data) ? raw.data : [];
}

function loadDemoJson(name) {
    const file = path.join(DATA_DIR, name);
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(raw.data) ? raw.data : [];
}

function mergeById(existing, incoming) {
    const byId = new Map((existing || []).map(x => [x.id, x]));
    (incoming || []).forEach(r => byId.set(r.id, r));
    return Array.from(byId.values());
}

function buildSeedDataService() {
    const domains = {
        users: loadDomainJson('users'),
        companies: loadDomainJson('companies'),
        opportunities: loadDomainJson('opportunities'),
        applications: loadDomainJson('applications'),
        matches: loadDomainJson('matches'),
        notifications: loadDomainJson('notifications'),
        connections: loadDomainJson('connections'),
        messages: loadDomainJson('messages'),
        audit: loadDomainJson('audit'),
        sessions: loadDomainJson('sessions'),
        contracts: loadDomainJson('contracts'),
        reviews: loadDomainJson('reviews')
    };
    domains.users = mergeById(domains.users, loadDemoJson('demo-users.json'));
    domains.users = mergeById(domains.users, loadDemoJson('demo-pending-users.json'));
    domains.companies = mergeById(domains.companies, loadDemoJson('demo-companies.json'));
    domains.opportunities = mergeById(domains.opportunities, loadDemoJson('demo-40-opportunities.json'));
    // Legacy person-to-opportunity matches are not merged; post_matches is canonical for admin matching audit.
    const postMatches = mergeById([], loadDemoJson('demo-post-matches.json'));
    const deals = mergeById([], loadDemoJson('demo-deals.json'));
    const negotiations = loadDemoJson('demo-negotiations.json');
    const invitations = [];

    const published = domains.opportunities.filter(o => o.status === 'published');
    const needs = published.filter(o => (o.intent || 'request') === 'request');
    const offers = published.filter(o => (o.intent || '') === 'offer');

    return {
        domains,
        postMatches,
        deals,
        negotiations,
        invitations,
        published,
        needs,
        offers,
        async getOpportunities() { return [...published]; },
        async getOpportunityById(id) { return published.find(o => o.id === id) || domains.opportunities.find(o => o.id === id) || null; },
        async getUsers() { return [...domains.users]; },
        async getCompanies() { return [...domains.companies]; },
        async getPostMatches() { return [...postMatches]; },
        async getDeals() { return [...deals]; },
        async getNegotiations() { return [...negotiations]; },
        async getOpportunityInvitations() { return [...invitations]; },
        async getReplacementRequests() { return []; },
        async getMatchingRuns() { return []; },
        async getMatchingPreviewRuns() { return [] },
        async getUserOrCompanyById(id) {
            return domains.users.find(u => u.id === id)
                || domains.companies.find(c => c.id === id)
                || null;
        },
        async getInvitationMatchingAnalytics() {
            return {
                invitationsSent: invitations.length,
                applicationsFromInvitations: 0,
                invitationAcceptanceRate: '—',
                replacementInvitationsAccepted: 0,
                dealsFromInvitedApplications: 0
            };
        },
        async getNegotiationMatchingAnalytics() {
            const open = negotiations.filter(n => (n.status || '').toLowerCase() === 'open').length;
            const agreed = negotiations.filter(n => (n.status || '').toLowerCase() === 'agreed').length;
            return {
                openNegotiations: open,
                agreedNegotiations: agreed,
                cancelledNegotiations: negotiations.filter(n => (n.status || '').toLowerCase() === 'cancelled').length,
                dealsFromNegotiations: 0
            };
        },
        async getReplacementMatchingAnalytics() {
            return {
                blockedMatches: postMatches.filter(m => (m.status || '').toLowerCase() === 'blocked').length,
                pendingReview: 0,
                invitationsSent: 0,
                accepted: 0,
                completed: 0,
                conversionRate: '—'
            };
        },
        async getDealFlowMatchingAnalytics() {
            const draft = deals.filter(d => (d.status || '').toLowerCase() === 'draft').length;
            const active = deals.filter(d => ['active', 'signed', 'in_execution'].includes((d.status || '').toLowerCase())).length;
            const withContracts = deals.filter(d => d.contractId).length;
            return {
                dealsFromApplications: deals.filter(d => d.applicationId && !d.matchId).length,
                draftDeals: draft,
                activeDeals: active,
                dealsWithContracts: withContracts
            };
        }
    };
}

/** Mirrors admin-matching.js runMatchingOnCurrentData (published scope, 20-item caps). */
async function runMatchingOnCurrentData(dataService, matchingService, matchingModels) {
    const opportunities = await dataService.getOpportunities();
    const published = opportunities.filter(o => o.status === 'published');
    const needs = published.filter(o => (o.intent || 'request') === 'request');
    const offers = published.filter(o => (o.intent || '') === 'offer');

    const report = {
        totalPostsAnalyzed: published.length,
        totalNeeds: needs.length,
        totalOffers: offers.length,
        oneWayMatches: 0,
        twoWayMatches: 0,
        groupFormations: 0,
        circularExchanges: 0,
        totalMatchesFound: 0,
        oneWayNeedToOffers: [],
        oneWayOfferToNeeds: [],
        twoWayPairs: [],
        consortiumLeads: [],
        circularCycles: []
    };

    const oneWayLimit = Math.min(20, needs.length);
    for (let i = 0; i < oneWayLimit; i++) {
        const need = needs[i];
        const result = await matchingService.findMatchesForPost(need.id);
        const matches = result.model === 'one_way' && result.matches ? result.matches : [];
        if (matches.length > 0) report.oneWayMatches += matches.length;
        report.oneWayNeedToOffers.push({ opportunityId: need.id, title: need.title, matchCount: matches.length });
    }
    const offerLimit = Math.min(20, offers.length);
    for (let i = 0; i < offerLimit; i++) {
        const offer = offers[i];
        const result = await matchingService.findMatchesForPost(offer.id);
        const matches = (result.model === 'one_way' && result.matches) ? result.matches : [];
        if (matches.length > 0) report.oneWayMatches += matches.length;
        report.oneWayOfferToNeeds.push({ opportunityId: offer.id, title: offer.title, matchCount: matches.length });
    }
    report.totalMatchesFound += report.oneWayMatches;

    const barterNeeds = needs.filter(o => (o.exchangeMode || '').toLowerCase() === 'barter');
    const twoWayPairKeys = new Set();
    for (const need of barterNeeds) {
        const result = await matchingService.findMatchesForPost(need.id, { model: 'two_way' });
        const matches = result.model === 'two_way' && result.matches ? result.matches : [];
        const offerA = offers.find(o => o.creatorId === need.creatorId);
        if (!offerA) continue;
        for (const m of matches) {
            const key = [need.creatorId, (m.matchedNeed && m.matchedNeed.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId)].filter(Boolean).sort().join('|');
            if (!key || twoWayPairKeys.has(key)) continue;
            twoWayPairKeys.add(key);
            report.twoWayMatches++;
            report.twoWayPairs.push({ needId: need.id, matchScore: m.matchScore });
        }
    }
    report.totalMatchesFound += report.twoWayMatches;

    const consortiumNeeds = needs.filter(n => {
        const roles = n.attributes?.memberRoles || n.attributes?.partnerRoles || [];
        return Array.isArray(roles) && roles.length > 0;
    });
    for (const need of consortiumNeeds) {
        const result = await matchingService.findMatchesForPost(need.id, { model: 'consortium' });
        const matches = result.model === 'consortium' && result.matches ? result.matches : [];
        if (matches.length > 0) {
            report.groupFormations += matches.length;
            report.consortiumLeads.push({ opportunityId: need.id, title: need.title, matchCount: matches.length });
        }
    }
    report.totalMatchesFound += report.groupFormations;

    const circularResult = await matchingModels.findCircularExchanges({});
    if (circularResult.model === 'circular' && circularResult.matches && circularResult.matches.length > 0) {
        report.circularExchanges = circularResult.matches.length;
        report.totalMatchesFound += report.circularExchanges;
        report.circularCycles = circularResult.matches;
    }
    return report;
}

function bootstrapMatchingOnly() {
    global.window = global;
    setupGlobalConfig({});
    patchFetchForSkillCanonical(loadSkillCanonicalForNode());
    loadMatchingScripts();
    return {
        matchingService: global.matchingService,
        matchingModels: global.matchingModels
    };
}

async function main() {
    const dataService = buildSeedDataService();
    global.dataService = dataService;
    const { matchingService, matchingModels } = bootstrapMatchingOnly();

    const ccPath = path.join(POC_ROOT, 'src', 'services', 'matching', 'admin-matching-command-center.js');
    const cc = require(ccPath);
    const { isConfirmedLikeMatch } = require(path.join(POC_ROOT, 'src', 'utils', 'post-match-analytics.js'));
    require(path.join(POC_ROOT, 'src', 'services', 'matching', 'admin-matching-one-way-diagnostics.js'));
    const diagApi = global.AdminMatchingOneWayDiagnostics;

    console.log('=== Admin Matching Page Data Audit ===\n');
    console.log('Source: POC/data/*.json + demo merges (fresh seed equivalent)\n');
    console.log('NOTE: Your browser at :5500 uses localStorage; counts may differ if you changed data in-app.\n');

    console.log('--- Seed inventory ---');
    const d = dataService.domains;
    console.log(`Users: ${d.users.length} | Companies: ${d.companies.length}`);
    console.log(`Opportunities (all): ${d.opportunities.length} | Published: ${dataService.published.length}`);
    console.log(`  Needs (request): ${dataService.needs.length} | Offers: ${dataService.offers.length}`);
    console.log(`Applications: ${d.applications.length} | Legacy matches: ${d.matches.length}`);
    console.log(`Post matches (demo): ${dataService.postMatches.length} | Deals (demo): ${dataService.deals.length}`);
    console.log(`Negotiations (demo): ${dataService.negotiations.length} | Contracts: ${d.contracts.length}\n`);

    console.log('--- Live report (Found now) — same logic as page ---');
    const report = await runMatchingOnCurrentData(dataService, matchingService, matchingModels);
    console.log(`Published posts analyzed: ${report.totalPostsAnalyzed}`);
    console.log(`Needs: ${report.totalNeeds} | Offers: ${report.totalOffers}`);
    console.log(`One-way matches (capped 20 needs + 20 offers): ${report.oneWayMatches}`);
    console.log(`Barter pairs: ${report.twoWayMatches}`);
    console.log(`Consortium formations: ${report.groupFormations}`);
    console.log(`Circular exchanges: ${report.circularExchanges}`);
    console.log(`Total matches found: ${report.totalMatchesFound}`);

    const preview = cc.buildPreviewRunSummary(report);
    const rows = cc.buildSelectableMatchRows(report);
    const circularMeta = cc.getCircularDisplayMeta(report);
    console.log(`Selectable match rows (circular capped in list): ${preview.selectableRowCount}`);
    if (circularMeta.hidden > 0) {
        console.log(`Circular display: ${circularMeta.displayed} shown, ${circularMeta.total} total (${circularMeta.note})`);
    }
    console.log('');

    const needsWithMatches = report.oneWayNeedToOffers.filter(x => x.matchCount > 0);
    const offersWithMatches = report.oneWayOfferToNeeds.filter(x => x.matchCount > 0);
    console.log('Per-opportunity (needs with matches):');
    needsWithMatches.slice(0, 10).forEach(x => console.log(`  ${x.opportunityId} | ${x.title || '—'} | ${x.matchCount} matches`));
    if (needsWithMatches.length > 10) console.log(`  ... +${needsWithMatches.length - 10} more`);
    console.log('Per-opportunity (offers with matches):');
    offersWithMatches.slice(0, 10).forEach(x => console.log(`  ${x.opportunityId} | ${x.title || '—'} | ${x.matchCount} matches`));

    console.log('\n--- Saved outcomes (analytics cards) ---');
    const postMatches = await dataService.getPostMatches();
    const deals = await dataService.getDeals();
    const confirmed = postMatches.filter(isConfirmedLikeMatch).length;
    const acceptedOnly = postMatches.filter(m => (m.status || '') === 'accepted').length;
    const dealsFromMatches = deals.filter(d => d.matchId).length;
    const conv = confirmed > 0 ? Math.round((dealsFromMatches / confirmed) * 100) + '%' : '—';
    const invite = await dataService.getInvitationMatchingAnalytics();
    const neg = await dataService.getNegotiationMatchingAnalytics();
    const repl = await dataService.getReplacementMatchingAnalytics();
    const dealFlow = await dataService.getDealFlowMatchingAnalytics();

    const metrics = [
        ['Saved matches', postMatches.length],
        ['Confirmed / Accepted', confirmed + (acceptedOnly ? ' (incl. ' + acceptedOnly + ' legacy accepted)' : '')],
        ['Deals', deals.length],
        ['From matches', dealsFromMatches],
        ['Conversion', conv],
        ['Invitations sent', invite.invitationsSent],
        ['Open negotiations', neg.openNegotiations],
        ['Terms agreed', neg.agreedNegotiations],
        ['Blocked matches', repl.blockedMatches],
        ['Draft deals', dealFlow.draftDeals],
        ['Active deals', dealFlow.activeDeals],
        ['Deals with contracts', dealFlow.dealsWithContracts]
    ];
    metrics.forEach(([label, val]) => console.log(`  ${label}: ${val}`));

    console.log('\n--- Command center queues ---');
    const queues = await cc.buildLifecycleQueues(dataService);
    console.log(`Invitations (sent): ${queues.invitations.length}`);
    console.log(`Negotiations: ${queues.negotiations.length}`);
    console.log(`Replacements: ${queues.replacements.length}`);
    console.log(`Blocked matches: ${queues.blockedMatches.length}`);
    console.log(`Persist runs: ${queues.matchingRuns.length}`);
    console.log(`Preview runs: ${queues.previewRuns.length}`);

    if (diagApi && typeof diagApi.collectOneWayDiagnostics === 'function') {
        console.log('\n--- One-way diagnostics (inspected cap) ---');
        const ow = await diagApi.collectOneWayDiagnostics();
        console.log(`  Needs/offers inspected: ${ow.needsInspected} / ${ow.offersInspected} (published ${ow.publishedNeedCount} / ${ow.publishedOfferCount})`);
        console.log(`  Generator candidates: ${ow.candidatePairsFromGenerator} | Scored: ${ow.scoredPairs}`);
        console.log(`  Above threshold (${ow.threshold}): ${ow.pairsAboveThreshold} | Below: ${ow.pairsBelowThreshold}`);
        if (Object.keys(ow.rejectionReasons || {}).length) {
            console.log('  Rejection signals:', ow.rejectionReasons);
        }
        if ((ow.topBelowThreshold || []).length) {
            console.log('  Top below-threshold:');
            ow.topBelowThreshold.forEach(p => {
                console.log(`    score ${p.score} ${p.direction} need=${p.needId || '—'} offer=${p.offerId || '—'} [${(p.weak || []).join(', ')}]`);
            });
        }
    }

    console.log('\n--- Match list sample (first 5 rows) ---');
    rows.slice(0, 5).forEach(r => {
        console.log(`  ${r.matchType} | ${r.participants} | score ${r.matchScore} | ${r.opportunityRefs}`);
    });
    if (rows.length > 5) console.log(`  ... +${rows.length - 5} more rows`);

    console.log('\nDone. Re-seed browser with window.resetAppData() if localStorage differs from this audit.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
