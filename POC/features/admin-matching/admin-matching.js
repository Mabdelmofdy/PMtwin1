/**
 * Admin Matching – display workflow and run matching on current platform data.
 * Uses window.dataService, window.matchingService, window.matchingModels (loaded at app init).
 */

const MATCHING_REFRESH_INTERVAL_MS = 60000;
let matchingRefreshIntervalId = null;
let matchingVisibilityHandler = null;

async function runAndShowReport() {
    const runLoading = document.getElementById('matching-run-loading');
    const reportBlock = document.getElementById('matching-report-block');
    const reportGrid = document.getElementById('matching-stats-grid');
    const reportDetails = document.getElementById('matching-report-details');
    const runError = document.getElementById('matching-run-error');

    if (!window.matchingService || !window.matchingModels || !window.dataService) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = 'Matching service not available. Ensure the app has loaded matching scripts.';
        }
        return;
    }
    if (runError) runError.hidden = true;
    if (reportBlock) reportBlock.hidden = true;
    if (runLoading) runLoading.hidden = false;
    try {
        const report = await runMatchingOnCurrentData();
        renderReport(reportGrid, reportDetails || null, report);
        if (reportBlock) reportBlock.hidden = false;
    } catch (e) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = e && e.message ? e.message : 'Run failed.';
        }
    } finally {
        if (runLoading) runLoading.hidden = true;
    }
}

async function initAdminMatching() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    if (matchingRefreshIntervalId != null) {
        clearInterval(matchingRefreshIntervalId);
        matchingRefreshIntervalId = null;
    }
    if (matchingVisibilityHandler) {
        document.removeEventListener('visibilitychange', matchingVisibilityHandler);
        matchingVisibilityHandler = null;
    }

    await runAndShowReport();

    matchingRefreshIntervalId = setInterval(runAndShowReport, MATCHING_REFRESH_INTERVAL_MS);
    matchingVisibilityHandler = function () {
        if (document.visibilityState === 'visible') runAndShowReport();
    };
    document.addEventListener('visibilitychange', matchingVisibilityHandler);
}

async function runMatchingOnCurrentData() {
    const dataService = window.dataService;
    const matchingService = window.matchingService;
    const matchingModels = window.matchingModels;

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
        report.oneWayNeedToOffers.push({
            opportunityId: need.id,
            title: need.title || need.id,
            creatorId: need.creatorId,
            direction: 'need_to_offers',
            matches: matches
        });
    }
    report.totalMatchesFound += report.oneWayMatches;

    const offerLimit = Math.min(20, offers.length);
    for (let i = 0; i < offerLimit; i++) {
        const offer = offers[i];
        const result = await matchingService.findMatchesForPost(offer.id);
        const matches = (result.model === 'one_way' && result.matches) ? result.matches : [];
        if (matches.length > 0) report.oneWayMatches += matches.length;
        report.oneWayOfferToNeeds.push({
            opportunityId: offer.id,
            title: offer.title || offer.id,
            creatorId: offer.creatorId,
            direction: 'offer_to_needs',
            matches: matches
        });
    }
    report.totalMatchesFound += report.oneWayMatches;

    const barterNeeds = needs.filter(o => (o.exchangeMode || '').toLowerCase() === 'barter');
    const twoWayPairKeys = new Set();
    for (const need of barterNeeds) {
        const result = await matchingService.findMatchesForPost(need.id, { model: 'two_way' });
        const matches = result.model === 'two_way' && result.matches ? result.matches : [];
        const needA = need;
        const offerA = offers.find(o => o.creatorId === need.creatorId);
        if (!offerA) continue;
        for (const m of matches) {
            const key = [need.creatorId, (m.matchedNeed && m.matchedNeed.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId)].filter(Boolean).sort().join('|');
            if (!key || twoWayPairKeys.has(key)) continue;
            twoWayPairKeys.add(key);
            report.twoWayMatches++;
            report.twoWayPairs.push({
                matchScore: m.matchScore,
                breakdown: m.breakdown || {},
                valueEquivalence: m.valueEquivalence,
                needA,
                offerA,
                matchedNeed: m.matchedNeed,
                matchedOffer: m.matchedOffer
            });
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
        report.consortiumLeads.push({
            opportunityId: need.id,
            title: need.title || need.id,
            creatorId: need.creatorId,
            roles: result.roles || [],
            matches: matches
        });
        }
    }
    report.totalMatchesFound += report.groupFormations;

    const circularResult = await matchingModels.findCircularExchanges({});
    if (circularResult.model === 'circular' && circularResult.matches && circularResult.matches.length > 0) {
        report.circularExchanges = circularResult.matches.length;
        report.totalMatchesFound += report.circularExchanges;
        report.circularCycles = circularResult.matches;
    }

    report.creatorNames = await buildCreatorNamesMap(dataService, report);
    return report;
}

function escapeHtml(s) {
    if (s == null || s === '') return '';
    const t = String(s);
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getCreatorDisplayName(entity) {
    if (!entity) return '';
    return entity.profile?.name || entity.name || entity.email || entity.id || '';
}

async function buildCreatorNamesMap(dataService, report) {
    const ids = new Set();
    for (const item of report.oneWayNeedToOffers || []) {
        if (item.creatorId) ids.add(item.creatorId);
        for (const m of item.matches || []) {
            const cid = (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
            if (cid) ids.add(cid);
        }
    }
    for (const item of report.oneWayOfferToNeeds || []) {
        if (item.creatorId) ids.add(item.creatorId);
        for (const m of item.matches || []) {
            const cid = (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
            if (cid) ids.add(cid);
        }
    }
    for (const p of report.twoWayPairs || []) {
        if (p.needA && p.needA.creatorId) ids.add(p.needA.creatorId);
        if (p.offerA && p.offerA.creatorId) ids.add(p.offerA.creatorId);
        if (p.matchedNeed && p.matchedNeed.creatorId) ids.add(p.matchedNeed.creatorId);
        if (p.matchedOffer && p.matchedOffer.creatorId) ids.add(p.matchedOffer.creatorId);
    }
    for (const lead of report.consortiumLeads || []) {
        if (lead.creatorId) ids.add(lead.creatorId);
        const match = (lead.matches && lead.matches[0]) ? lead.matches[0] : null;
        for (const sp of (match && match.suggestedPartners) || []) {
            if (sp.creatorId) ids.add(sp.creatorId);
        }
    }
    for (const c of report.circularCycles || []) {
        for (const id of c.cycle || []) ids.add(id);
    }
    const creatorNames = {};
    for (const id of ids) {
        const entity = await dataService.getUserOrCompanyById(id);
        creatorNames[id] = getCreatorDisplayName(entity) || id;
    }
    return creatorNames;
}

function getOpportunityRoute(id) {
    const routeBase = (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.OPPORTUNITY_DETAIL)
        ? window.CONFIG.ROUTES.OPPORTUNITY_DETAIL.replace(':id', '')
        : '/opportunities/';
    return routeBase && routeBase.endsWith('/') ? routeBase + id : '/opportunities/' + id;
}

/**
 * Build per-opportunity performance rows for the admin table.
 * Each row: opportunityId, title, matchCount, bestScorePct, avgScorePct, status, sectionId (for View matches scroll).
 */
function buildPerOpportunityRows(report) {
    const rows = [];
    const add = (opportunityId, title, matches, sectionId) => {
        const count = matches ? matches.length : 0;
        let bestScorePct = null;
        let avgScorePct = null;
        if (count > 0) {
            const scores = matches.map(m => (m.matchScore != null ? m.matchScore : null)).filter(s => s != null);
            if (scores.length > 0) {
                bestScorePct = Math.round(Math.max(...scores) * 100);
                avgScorePct = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100);
            }
        }
        rows.push({
            opportunityId,
            title: title || opportunityId,
            matchCount: count,
            bestScorePct: bestScorePct != null ? bestScorePct + '%' : '—',
            avgScorePct: avgScorePct != null ? avgScorePct + '%' : '—',
            status: 'Published',
            sectionId
        });
    };
    (report.oneWayNeedToOffers || []).forEach(item => {
        add(item.opportunityId, item.title, item.matches || [], 'matching-one-way-need-to-offers');
    });
    (report.oneWayOfferToNeeds || []).forEach(item => {
        add(item.opportunityId, item.title, item.matches || [], 'matching-one-way-offer-to-needs');
    });
    (report.consortiumLeads || []).forEach(lead => {
        const matches = lead.matches || [];
        add(lead.opportunityId, lead.title, matches, 'matching-consortium');
    });
    const twoWayByNeed = new Map();
    (report.twoWayPairs || []).forEach(p => {
        const need = p.needA;
        if (!need || !need.id) return;
        const score = (p.breakdown && (p.breakdown.scoreAtoB != null || p.breakdown.scoreBtoA != null))
            ? ((p.breakdown.scoreAtoB ?? 0) + (p.breakdown.scoreBtoA ?? 0)) / 2
            : null;
        if (!twoWayByNeed.has(need.id)) {
            twoWayByNeed.set(need.id, { title: need.title || need.id, scores: [] });
        }
        const entry = twoWayByNeed.get(need.id);
        if (score != null) entry.scores.push(score);
    });
    twoWayByNeed.forEach((entry, opportunityId) => {
        const count = entry.scores.length;
        const bestScorePct = count > 0 ? Math.round(Math.max(...entry.scores) * 100) + '%' : '—';
        const avgScorePct = count > 0 ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / count * 100) + '%' : '—';
        rows.push({
            opportunityId,
            title: entry.title || opportunityId,
            matchCount: count,
            bestScorePct,
            avgScorePct,
            status: 'Published',
            sectionId: 'matching-two-way'
        });
    });
    return rows;
}

function buildMatchesSummaryRows(report) {
    const creatorNames = report.creatorNames || {};
    const getName = (id) => creatorNames[id] || id || '';
    const rows = [];
    (report.oneWayNeedToOffers || []).forEach(item => {
        (item.matches || []).forEach(m => {
            const partId = (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
            const participants = [getName(item.creatorId), getName(partId)].filter(Boolean).join(', ') || '—';
            const oppRefs = [item.opportunityId, (m.matchedOpportunity && m.matchedOpportunity.id) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].opportunityId)].filter(Boolean).join(' ↔ ') || '—';
            const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '—';
            rows.push({ matchType: 'One Way', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
        });
    });
    (report.oneWayOfferToNeeds || []).forEach(item => {
        (item.matches || []).forEach(m => {
            const partId = (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
            const participants = [getName(item.creatorId), getName(partId)].filter(Boolean).join(', ') || '—';
            const oppRefs = [item.opportunityId, (m.matchedOpportunity && m.matchedOpportunity.id) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].opportunityId)].filter(Boolean).join(' ↔ ') || '—';
            const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '—';
            rows.push({ matchType: 'One Way', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
        });
    });
    (report.twoWayPairs || []).forEach(p => {
        const nameA = getName(p.needA && p.needA.creatorId);
        const nameB = getName(p.matchedNeed && p.matchedNeed.creatorId);
        const participants = [nameA, nameB].filter(Boolean).join(', ') || '—';
        const oppRefs = [(p.needA && p.needA.id), (p.matchedNeed && p.matchedNeed.id)].filter(Boolean).join(' ↔ ') || '—';
        const score = (p.breakdown && (p.breakdown.scoreAtoB != null || p.breakdown.scoreBtoA != null)) ? (Math.round((p.breakdown.scoreAtoB + p.breakdown.scoreBtoA) / 2 * 100) + '%') : '—';
        rows.push({ matchType: 'Barter', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
    });
    (report.consortiumLeads || []).forEach(lead => {
        const match = (lead.matches && lead.matches[0]) ? lead.matches[0] : null;
        const partners = (match && match.suggestedPartners) ? match.suggestedPartners : [];
        const participantNames = [getName(lead.creatorId)].concat(partners.map(sp => getName(sp.creatorId))).filter(Boolean);
        const participants = participantNames.length ? participantNames.join(', ') : '—';
        const oppRefs = lead.opportunityId + (partners.length ? ' (+' + partners.length + ' roles)' : '');
        const score = (match && match.matchScore != null) ? Math.round(match.matchScore * 100) + '%' : '—';
        rows.push({ matchType: 'Consortium', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
    });
    (report.circularCycles || []).forEach(c => {
        const cycleIds = c.cycle || [];
        const participants = cycleIds.map(id => getName(id)).join(' → ') + (cycleIds.length ? ' → ' + getName(cycleIds[0]) : '');
        const oppRefs = (c.opportunityIds && c.opportunityIds.length) ? c.opportunityIds.join(' → ') : (cycleIds.join(' → ') || '—');
        const score = (c.matchScore != null) ? Math.round(c.matchScore * 100) + '%' : '—';
        rows.push({ matchType: 'Circular', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
    });
    return rows;
}

function renderReport(gridEl, detailsEl, report) {
    if (!gridEl) return;
    gridEl.innerHTML = ''
        + '<div class="stat-card"><div class="stat-value">' + report.totalMatchesFound + '</div><div class="stat-label">Total matches</div></div>'
        + '<div class="stat-card"><div class="stat-value">' + report.oneWayMatches + '</div><div class="stat-label">One-way</div></div>'
        + '<div class="stat-card"><div class="stat-value">' + report.twoWayMatches + '</div><div class="stat-label">Two-way</div></div>'
        + '<div class="stat-card"><div class="stat-value">' + report.groupFormations + '</div><div class="stat-label">Consortium</div></div>'
        + '<div class="stat-card"><div class="stat-value">' + report.circularExchanges + '</div><div class="stat-label">Circular</div></div>';

    const perOppEl = document.getElementById('matching-per-opportunity-table');
    if (perOppEl) {
        const perOppRows = buildPerOpportunityRows(report);
        if (perOppRows.length === 0) {
            perOppEl.innerHTML = '<p class="matching-details">No opportunities analyzed in this run.</p>';
        } else {
            let table = '<table class="matching-summary-table matching-per-opp-table"><thead><tr><th>Opportunity title</th><th>Number of matches</th><th>Best match score</th><th>Average match score</th><th>Action</th></tr></thead><tbody>';
            perOppRows.forEach(r => {
                const viewHref = r.sectionId === 'matching-two-way' ? '#matching-two-way' : '#matching-opp-' + escapeHtml(r.opportunityId);
                const viewMatchesLink = '<a href="' + viewHref + '" class="matching-view-matches-link" data-section="' + escapeHtml(r.sectionId) + '" data-opp-id="' + escapeHtml(r.opportunityId) + '">View matches</a>';
                table += '<tr><td>' + escapeHtml(r.title) + '</td><td>' + r.matchCount + '</td><td>' + escapeHtml(String(r.bestScorePct)) + '</td><td>' + escapeHtml(String(r.avgScorePct)) + '</td><td>' + viewMatchesLink + '</td></tr>';
            });
            table += '</tbody></table>';
            perOppEl.innerHTML = table;
        }
    }

    const summaryTabsEl = document.getElementById('matching-summary-tabs');
    const summaryEl = document.getElementById('matching-summary-table');
    const MATCH_TYPE_FILTER_KEYS = { 'One Way': 'one-way', 'Barter': 'two-way', 'Consortium': 'consortium', 'Circular': 'circular' };
    if (summaryEl) {
        const rows = buildMatchesSummaryRows(report);
        if (rows.length === 0) {
            if (summaryTabsEl) summaryTabsEl.innerHTML = '';
            summaryEl.innerHTML = '<p class="matching-details">No matches in this run.</p>';
        } else {
            const counts = { 'one-way': 0, 'two-way': 0, 'consortium': 0, 'circular': 0 };
            rows.forEach(r => {
                const key = MATCH_TYPE_FILTER_KEYS[r.matchType];
                if (key) counts[key]++;
            });
            if (summaryTabsEl) {
                const tabs = [
                    { id: 'all', label: 'All', count: rows.length },
                    { id: 'one-way', label: 'One-way', count: counts['one-way'] },
                    { id: 'two-way', label: 'Two-way', count: counts['two-way'] },
                    { id: 'consortium', label: 'Consortium', count: counts['consortium'] },
                    { id: 'circular', label: 'Circular', count: counts['circular'] }
                ];
                summaryTabsEl.innerHTML = tabs.map((t, i) =>
                    '<button type="button" class="matching-match-type-tab' + (i === 0 ? ' is-active' : '') + '" role="tab" data-filter="' + escapeHtml(t.id) + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + escapeHtml(t.label) + ' <span class="tab-count">(' + t.count + ')</span></button>'
                ).join('');
            }
            let table = '<table class="matching-summary-table"><thead><tr><th>Match type</th><th>Participants</th><th>Opportunity references</th><th>Match score</th><th>Status</th></tr></thead><tbody>';
            rows.forEach(r => {
                const filterKey = MATCH_TYPE_FILTER_KEYS[r.matchType] || '';
                table += '<tr data-match-type="' + escapeHtml(filterKey) + '"><td>' + escapeHtml(r.matchType) + '</td><td>' + escapeHtml(r.participants) + '</td><td>' + escapeHtml(r.opportunityRefs) + '</td><td>' + escapeHtml(r.matchScore) + '</td><td>' + escapeHtml(r.status) + '</td></tr>';
            });
            table += '</tbody></table>';
            summaryEl.innerHTML = table;
            if (summaryTabsEl) {
                const detailSections = document.querySelectorAll('.matching-detail-section[data-match-type]');
                const applyFilter = (filter) => {
                    const tbody = summaryEl.querySelector('tbody');
                    if (tbody) {
                        tbody.querySelectorAll('tr[data-match-type]').forEach(tr => {
                            const rowType = tr.getAttribute('data-match-type');
                            const show = filter === 'all' || rowType === filter;
                            tr.classList.toggle('is-hidden', !show);
                        });
                    }
                    detailSections.forEach(section => {
                        const sectionType = section.getAttribute('data-match-type');
                        const showSection = filter === 'all' || sectionType === filter;
                        section.hidden = !showSection;
                    });
                };
                applyFilter('all');
                summaryTabsEl.querySelectorAll('.matching-match-type-tab').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const filter = this.getAttribute('data-filter');
                        summaryTabsEl.querySelectorAll('.matching-match-type-tab').forEach(b => b.classList.remove('is-active'));
                        this.classList.add('is-active');
                        this.setAttribute('aria-selected', 'true');
                        summaryTabsEl.querySelectorAll('.matching-match-type-tab').forEach(b => { if (b !== this) b.setAttribute('aria-selected', 'false'); });
                        applyFilter(filter);
                    });
                });
            }
        }
    }

    const creatorNames = report.creatorNames || {};
    const getMatchCreatorId = (m) => (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
    const getMatchCreatorName = (m) => escapeHtml(creatorNames[getMatchCreatorId(m)] || getMatchCreatorId(m) || '');

    const needToOffersEl = document.getElementById('matching-one-way-need-to-offers');
    if (needToOffersEl) {
        const items = report.oneWayNeedToOffers || [];
        if (items.length === 0) {
            needToOffersEl.innerHTML = '<p class="matching-details">No need posts analyzed.</p>';
        } else {
            let html = '';
            for (const item of items) {
                const route = getOpportunityRoute(item.opportunityId);
                const title = escapeHtml(item.title || item.opportunityId);
                const oppCreatorName = escapeHtml(creatorNames[item.creatorId] || item.creatorId || '');
                html += '<div class="matching-opp-card" id="matching-opp-' + escapeHtml(item.opportunityId) + '"><div class="matching-opp-card-title"><a href="#" class="matching-opp-link" data-route="' + escapeHtml(route) + '">' + title + '</a>' + (oppCreatorName ? ' <span class="matching-creator-name">(' + oppCreatorName + ')</span>' : '') + '</div>';
                if (item.matches && item.matches.length > 0) {
                    html += '<ul class="matching-match-list">';
                    for (const m of item.matches) {
                        const matchTitle = (m.matchedOpportunity && m.matchedOpportunity.title) ? escapeHtml(m.matchedOpportunity.title) : (m.suggestedPartners && m.suggestedPartners[0] ? escapeHtml(m.suggestedPartners[0].opportunityId) : '');
                        const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '-';
                        const creatorName = getMatchCreatorName(m);
                        const labels = m.labels || m.breakdown;
                        const breakdownParts = labels ? [labels.skillMatch || labels.attributeOverlap, labels.exchangeCompatibility, labels.valueCompatibility, labels.budgetFit, labels.timelineFit, labels.locationFit, labels.reputation].filter(Boolean) : [];
                        const breakdown = breakdownParts.length ? ' (' + breakdownParts.join(', ') + ')' : '';
                        const tier = (m.recommendation && m.recommendation.tier) ? m.recommendation.tier : '';
                        const tierBadge = tier ? '<span class="matching-tier matching-tier-' + tier + '">' + escapeHtml(tier) + '</span>' : '';
                        const valueFit = (m.valueAnalysis && m.valueAnalysis.valueFit) ? ' Value: ' + m.valueAnalysis.valueFit : '';
                        const coverage = (m.valueAnalysis && m.valueAnalysis.coverageRatio != null) ? ' Coverage: ' + (m.valueAnalysis.coverageRatio * 100).toFixed(0) + '%' : '';
                        html += '<li class="matching-match-row">' + tierBadge + ' <span class="matching-match-score">' + score + '</span> ' + (creatorName ? creatorName + ': ' : '') + matchTitle + breakdown + valueFit + coverage + '</li>';
                    }
                    html += '</ul>';
                } else {
                    html += '<p class="matching-details">No matching offers.</p>';
                }
                html += '</div>';
            }
            needToOffersEl.innerHTML = html;
        }
    }

    const offerToNeedsEl = document.getElementById('matching-one-way-offer-to-needs');
    if (offerToNeedsEl) {
        const items = report.oneWayOfferToNeeds || [];
        if (items.length === 0) {
            offerToNeedsEl.innerHTML = '<p class="matching-details">No offer posts analyzed.</p>';
        } else {
            let html = '';
            for (const item of items) {
                const route = getOpportunityRoute(item.opportunityId);
                const title = escapeHtml(item.title || item.opportunityId);
                const oppCreatorName = escapeHtml(creatorNames[item.creatorId] || item.creatorId || '');
                html += '<div class="matching-opp-card" id="matching-opp-' + escapeHtml(item.opportunityId) + '"><div class="matching-opp-card-title"><a href="#" class="matching-opp-link" data-route="' + escapeHtml(route) + '">' + title + '</a>' + (oppCreatorName ? ' <span class="matching-creator-name">(' + oppCreatorName + ')</span>' : '') + '</div>';
                if (item.matches && item.matches.length > 0) {
                    html += '<ul class="matching-match-list">';
                    for (const m of item.matches) {
                        const matchTitle = (m.matchedOpportunity && m.matchedOpportunity.title) ? escapeHtml(m.matchedOpportunity.title) : (m.suggestedPartners && m.suggestedPartners[0] ? escapeHtml(m.suggestedPartners[0].opportunityId) : '');
                        const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '-';
                        const creatorName = getMatchCreatorName(m);
                        const labels = m.labels || m.breakdown;
                        const breakdownParts = labels ? [labels.skillMatch || labels.attributeOverlap, labels.exchangeCompatibility, labels.valueCompatibility, labels.budgetFit, labels.timelineFit, labels.locationFit, labels.reputation].filter(Boolean) : [];
                        const breakdown = breakdownParts.length ? ' (' + breakdownParts.join(', ') + ')' : '';
                        const tier = (m.recommendation && m.recommendation.tier) ? m.recommendation.tier : '';
                        const tierBadge = tier ? '<span class="matching-tier matching-tier-' + tier + '">' + escapeHtml(tier) + '</span>' : '';
                        const valueFit = (m.valueAnalysis && m.valueAnalysis.valueFit) ? ' Value: ' + m.valueAnalysis.valueFit : '';
                        html += '<li class="matching-match-row">' + tierBadge + ' <span class="matching-match-score">' + score + '</span> ' + (creatorName ? creatorName + ': ' : '') + matchTitle + breakdown + valueFit + '</li>';
                    }
                    html += '</ul>';
                } else {
                    html += '<p class="matching-details">No matching needs.</p>';
                }
                html += '</div>';
            }
            offerToNeedsEl.innerHTML = html;
        }
    }

    const twoWayEl = document.getElementById('matching-two-way');
    if (twoWayEl) {
        const pairs = report.twoWayPairs || [];
        if (pairs.length === 0) {
            twoWayEl.innerHTML = '<p class="matching-details">No two-way pairs found.</p>';
        } else {
            let html = '';
            for (const p of pairs) {
                const nameA = escapeHtml(creatorNames[p.needA && p.needA.creatorId] || (p.needA && p.needA.creatorId) || '');
                const nameB = escapeHtml(creatorNames[p.matchedNeed && p.matchedNeed.creatorId] || (p.matchedNeed && p.matchedNeed.creatorId) || '');
                const needATitle = (p.needA && (p.needA.title || p.needA.id)) ? escapeHtml(p.needA.title || p.needA.id) : '-';
                const offerATitle = (p.offerA && (p.offerA.title || p.offerA.id)) ? escapeHtml(p.offerA.title || p.offerA.id) : '-';
                const needBTitle = (p.matchedNeed && (p.matchedNeed.title || p.matchedNeed.id)) ? escapeHtml(p.matchedNeed.title || p.matchedNeed.id) : '-';
                const offerBTitle = (p.matchedOffer && (p.matchedOffer.title || p.matchedOffer.id)) ? escapeHtml(p.matchedOffer.title || p.matchedOffer.id) : '-';
                const scoreAtoB = (p.breakdown && p.breakdown.scoreAtoB != null) ? Math.round(p.breakdown.scoreAtoB * 100) + '%' : '-';
                const scoreBtoA = (p.breakdown && p.breakdown.scoreBtoA != null) ? Math.round(p.breakdown.scoreBtoA * 100) + '%' : '-';
                const valueEq = p.valueEquivalence ? escapeHtml(p.valueEquivalence) : '';
                const equiv = (p.valueAnalysis && p.valueAnalysis.equivalence) ? p.valueAnalysis.equivalence : null;
                const equivScore = equiv && equiv.equivalenceScore != null ? (equiv.equivalenceScore * 100).toFixed(0) + '%' : '';
                const suggestion = equiv && equiv.suggestion ? escapeHtml(equiv.suggestion) : '';
                html += '<div class="matching-two-way-pair">'
                    + '<div class="matching-two-way-participants">Participant A ' + (nameA ? '(' + nameA + '): ' : '') + 'Need ' + needATitle + ' / Offer ' + offerATitle + ' &harr; Participant B ' + (nameB ? '(' + nameB + '): ' : '') + 'Need ' + needBTitle + ' / Offer ' + offerBTitle + '</div>'
                    + '<div class="matching-two-way-scores">Score A&rarr;B: ' + scoreAtoB + ', Score B&rarr;A: ' + scoreBtoA + (valueEq ? '; Value: ' + valueEq : '') + (equivScore ? '; Equivalence: ' + equivScore : '') + (suggestion ? '; ' + suggestion : '') + '</div></div>';
            }
            twoWayEl.innerHTML = html;
        }
    }

    const consortiumEl = document.getElementById('matching-consortium');
    if (consortiumEl) {
        const leads = report.consortiumLeads || [];
        if (leads.length === 0) {
            consortiumEl.innerHTML = '<p class="matching-details">No consortium formations.</p>';
        } else {
            let html = '';
            for (const lead of leads) {
                const route = getOpportunityRoute(lead.opportunityId);
                const title = escapeHtml(lead.title || lead.opportunityId);
                const leadCreatorName = escapeHtml(creatorNames[lead.creatorId] || lead.creatorId || '');
                html += '<div class="matching-opp-card" id="matching-opp-' + escapeHtml(lead.opportunityId) + '"><div class="matching-consortium-lead"><a href="#" class="matching-opp-link" data-route="' + escapeHtml(route) + '">' + title + '</a>' + (leadCreatorName ? ' <span class="matching-creator-name">(' + leadCreatorName + ')</span>' : '') + '</div><div class="matching-consortium-roles">';
                const match = (lead.matches && lead.matches[0]) ? lead.matches[0] : null;
                const partners = (match && match.suggestedPartners) ? match.suggestedPartners : [];
                const balance = (match && match.valueAnalysis && match.valueAnalysis.consortiumBalance) ? match.valueAnalysis.consortiumBalance : null;
                for (const rolePartner of partners) {
                    const role = rolePartner.role || 'Partner';
                    const oppId = rolePartner.opportunityId || '';
                    const partnerName = escapeHtml(creatorNames[rolePartner.creatorId] || rolePartner.creatorId || '');
                    html += '<div class="matching-consortium-role">' + escapeHtml(role) + ': ' + (partnerName ? partnerName + ' (' + escapeHtml(oppId) + ')' : escapeHtml(oppId)) + '</div>';
                }
                if (balance) {
                    const balanceScore = (balance.balanceScore != null) ? (balance.balanceScore * 100).toFixed(0) + '%' : '';
                    const viable = balance.viable ? 'Viable' : 'Review balance';
                    html += '<div class="matching-consortium-balance">Value balance: ' + balanceScore + ' ' + viable + (balance.budgetSurplus != null ? '; Budget surplus: ' + Math.round(balance.budgetSurplus) + ' SAR' : '') + '</div>';
                }
                html += '</div></div>';
            }
            consortiumEl.innerHTML = html;
        }
    }

    const circularEl = document.getElementById('matching-circular');
    if (circularEl) {
        const cycles = report.circularCycles || [];
        if (cycles.length === 0) {
            circularEl.innerHTML = '<p class="matching-details">No circular exchanges found.</p>';
        } else {
            let html = '';
            for (const c of cycles) {
                const cycleIds = c.cycle || [];
                const cycleNames = cycleIds.map(id => escapeHtml(creatorNames[id] || id));
                const participantChain = cycleNames.length > 0 ? cycleNames.join(' &rarr; ') + ' &rarr; ' + cycleNames[0] : (cycleIds.join(' &rarr; ') + ' &rarr; ' + (cycleIds[0] || ''));
                const oppIds = c.opportunityIds || (c.links && c.links.map(l => l.opportunityId).filter(Boolean)) || [];
                const oppRefsDisplay = Array.isArray(oppIds) && oppIds.length > 0
                    ? oppIds.map(oid => escapeHtml(oid)).join(' &rarr; ') + (oppIds.length > 1 ? ' &rarr; ' + escapeHtml(oppIds[0]) : '')
                    : (c.linkScores && c.linkScores.some(l => l.opportunityId) ? c.linkScores.map(l => escapeHtml(l.opportunityId || '')).join(' &rarr; ') : '');
                const linkScores = c.linkScores || [];
                const linkStr = linkScores.length > 0 ? linkScores.map(l => {
                    const fromName = escapeHtml(creatorNames[l.fromCreatorId] || l.fromCreatorId || '');
                    const toName = escapeHtml(creatorNames[l.toCreatorId] || l.toCreatorId || '');
                    return fromName + '&rarr;' + toName + ': ' + (l.score != null ? (l.score * 100).toFixed(0) + '%' : '-');
                }).join(', ') : '';
                const overall = (c.matchScore != null) ? Math.round(c.matchScore * 100) + '%' : '';
                const chainBal = (c.valueAnalysis && c.valueAnalysis.chainBalance) ? c.valueAnalysis.chainBalance : null;
                const chainScore = chainBal && chainBal.chainBalanceScore != null ? (chainBal.chainBalanceScore * 100).toFixed(0) + '%' : '';
                const chainViable = chainBal && chainBal.viable != null ? (chainBal.viable ? '; Viable' : '; Review balance') : '';
                html += '<div class="matching-circular-cycle">';
                html += '<div class="matching-circular-label">Participant chain:</div>';
                html += '<div class="matching-circular-sequence">' + participantChain + '</div>';
                if (oppRefsDisplay) {
                    html += '<div class="matching-circular-label">Opportunity references:</div>';
                    html += '<div class="matching-circular-opprefs">' + oppRefsDisplay + '</div>';
                }
                html += (linkStr ? '<div class="matching-circular-links">Link scores: ' + linkStr + (overall ? '; overall ' + overall : '') + (chainScore ? '; chain balance ' + chainScore + chainViable : '') + '</div>' : '');
                html += '</div>';
            }
            circularEl.innerHTML = html;
        }
    }

    const container = document.getElementById('main-content') || document.body;
    container.querySelectorAll('.matching-opp-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route && typeof router !== 'undefined' && router.navigate) router.navigate(route);
        });
    });
    const sectionIdToFilter = { 'matching-one-way-need-to-offers': 'one-way', 'matching-one-way-offer-to-needs': 'one-way', 'matching-two-way': 'two-way', 'matching-consortium': 'consortium', 'matching-circular': 'circular' };
    container.querySelectorAll('.matching-view-matches-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            const filter = sectionId ? (sectionIdToFilter[sectionId] || 'all') : 'all';
            const summaryTabs = document.getElementById('matching-summary-tabs');
            if (summaryTabs && filter !== 'all') {
                const tabBtn = summaryTabs.querySelector('.matching-match-type-tab[data-filter="' + filter + '"]');
                if (tabBtn) {
                    summaryTabs.querySelectorAll('.matching-match-type-tab').forEach(b => b.classList.remove('is-active'));
                    tabBtn.classList.add('is-active');
                    tabBtn.setAttribute('aria-selected', 'true');
                    summaryTabs.querySelectorAll('.matching-match-type-tab').forEach(b => { if (b !== tabBtn) b.setAttribute('aria-selected', 'false'); });
                    const detailSections = document.querySelectorAll('.matching-detail-section[data-match-type]');
                    const tbody = document.querySelector('#matching-summary-table tbody');
                    if (tbody) {
                        tbody.querySelectorAll('tr[data-match-type]').forEach(tr => {
                            const rowType = tr.getAttribute('data-match-type');
                            tr.classList.toggle('is-hidden', rowType !== filter);
                        });
                    }
                    detailSections.forEach(section => {
                        section.hidden = section.getAttribute('data-match-type') !== filter;
                    });
                }
            }
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.getElementById(href.slice(1));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}
