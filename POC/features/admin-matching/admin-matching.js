/**
 * Admin Matching – display workflow and run matching on current platform data.
 * Uses window.dataService, window.matchingService, window.matchingModels (loaded at app init).
 */

const MATCHING_REFRESH_INTERVAL_MS = 60000;
let matchingRefreshIntervalId = null;
let matchingVisibilityHandler = null;
let lastPreviewReport = null;
let lastSelectableRows = [];
let lastPreviewRunId = null;

async function runAndShowReport() {
    const runLoading = document.getElementById('matching-run-loading');
    const reportBlock = document.getElementById('matching-report-block');
    const reportGrid = document.getElementById('matching-stats-grid');
    const reportDetails = document.getElementById('matching-report-details');
    const runError = document.getElementById('matching-run-error');
    const runButton = document.getElementById('matching-run-report-btn');
    const runState = document.querySelector('.matching-run-state');
    const refreshStatus = document.getElementById('matching-refresh-status');
    const lastUpdated = document.getElementById('matching-last-updated');

    if (!window.matchingService || !window.matchingModels || !window.dataService) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = 'Matching service not available. Ensure the app has loaded matching scripts.';
        }
        if (runState) {
            runState.classList.remove('is-running');
            runState.classList.add('is-error');
        }
        if (refreshStatus) refreshStatus.textContent = 'Matching service is unavailable';
        return;
    }
    if (runError) runError.hidden = true;
    if (reportBlock) reportBlock.hidden = true;
    if (runLoading) runLoading.hidden = false;
    if (runButton) {
        runButton.disabled = true;
        runButton.classList.add('is-running');
    }
    if (runState) {
        runState.classList.add('is-running');
        runState.classList.remove('is-error');
    }
    if (refreshStatus) refreshStatus.textContent = 'Analyzing current opportunities';
    try {
        const report = await runMatchingOnCurrentData();
        lastPreviewReport = report;
        await recordPreviewRun(report);
        await renderReport(reportGrid, reportDetails || null, report);
        await renderAdminAnalytics(window.dataService);
        await renderCommandCenter();
        if (runLoading) runLoading.hidden = true;
        if (reportBlock) reportBlock.hidden = false;
        const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (lastUpdated) lastUpdated.textContent = nowLabel;
        if (refreshStatus) refreshStatus.textContent = 'Live report refreshed at ' + nowLabel;
        if (runState) runState.classList.remove('is-error');
    } catch (e) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = e && e.message ? e.message : 'Run failed.';
        }
        if (runState) runState.classList.add('is-error');
        if (refreshStatus) refreshStatus.textContent = 'Run failed';
    } finally {
        if (runLoading) runLoading.hidden = true;
        if (runButton) {
            runButton.disabled = false;
            runButton.classList.remove('is-running');
        }
        if (runState) runState.classList.remove('is-running');
        applyAuditorReadOnlyUi();
        if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
    }
}

async function renderAdminAnalytics(dataService) {
    const el = document.getElementById('matching-admin-analytics');
    if (!el) return;
    const stats = await getAdminMatchingAnalytics(dataService);
    el.innerHTML = ''
        + renderMetricCard(stats.totalPostMatches, 'Saved matches', 'Persisted matches')
        + renderMetricCard(stats.confirmedPostMatches, 'Confirmed', 'Confirmed post matches')
        + renderMetricCard(stats.totalDeals, 'Deals', 'All collaboration deals')
        + renderMetricCard(stats.dealsFromMatches, 'From matches', 'Deals created from matches')
        + renderMetricCard(escapeHtml(stats.conversionRate), 'Conversion', 'Confirmed to deal rate')
        + renderMetricCard(stats.invitationsSent, 'Invitations sent', 'Invite to Apply records')
        + renderMetricCard(stats.applicationsFromInvitations, 'Invited applications', 'Applications linked to invitations')
        + renderMetricCard(escapeHtml(stats.invitationAcceptanceRate), 'Invitation rate', 'Accepted invitations vs sent')
        + renderMetricCard(stats.dealsFromInvitedApplications, 'Deals from invites', 'Deals tied to invited applications')
        + renderMetricCard(stats.openNegotiations, 'Open negotiations', 'Active term discussions')
        + renderMetricCard(stats.agreedNegotiations, 'Terms agreed', 'Negotiations ready for deal')
        + renderMetricCard(stats.blockedMatches, 'Blocked matches', 'Consortium/circular with drop-outs')
        + renderMetricCard(stats.replacementPendingReview, 'Suggestions pending', 'Awaiting owner review')
        + renderMetricCard(stats.replacementInvitationsSent, 'Replacement invites', 'Invitations sent')
        + renderMetricCard(stats.replacementAccepted, 'Replacements accepted', 'Awaiting finalize')
        + renderMetricCard(stats.replacementCompleted, 'Replacements completed', 'Participant swaps done')
        + renderMetricCard(escapeHtml(stats.replacementConversionRate), 'Replacement rate', 'Completed vs invitations')
        + renderMetricCard(stats.dealsFromApplications, 'Deals from applications', 'Accepted application path')
        + renderMetricCard(stats.draftDeals, 'Draft deals', 'Deal workspaces not yet active')
        + renderMetricCard(stats.activeDeals, 'Active deals', 'Fully signed / in execution')
        + renderMetricCard(stats.dealsWithContracts, 'Deals with contracts', 'Linked contract agreements');
}

/**
 * Persist post_matches for one opportunity using matchingService.persistPostMatches.
 * Shows message in matching-run-error area.
 */
async function recordPreviewRun(report) {
    const cc = window.AdminMatchingCommandCenter;
    if (!cc || !window.dataService || typeof window.dataService.createMatchingPreviewRun !== 'function') {
        return;
    }
    const summary = cc.buildPreviewRunSummary(report);
    const actor = authService.getCurrentUser && authService.getCurrentUser();
    try {
        const run = await window.dataService.createMatchingPreviewRun({
            ...summary,
            actorId: actor?.id || null
        });
        lastPreviewRunId = run?.id || null;
        updatePreviewMeta(run);
    } catch (e) {
        void e;
    }
}

function updatePreviewMeta(run) {
    const el = document.getElementById('matching-cc-preview-meta');
    if (!el || !run) return;
    el.hidden = false;
    const when = run.createdAt ? new Date(run.createdAt).toLocaleString() : 'just now';
    el.textContent = 'Latest preview run (' + when + '): '
        + (run.totalMatchesFound || 0) + ' matches found. Preview only — use Save matches or Save selected opportunities to persist.';
}

/** Published opportunity ids selected in the per-opportunity table (bulk save). */
function getCheckedOpportunityIds() {
    const ids = new Set();
    document.querySelectorAll('.matching-opp-select:checked').forEach(cb => {
        const id = cb.getAttribute('data-opp-id');
        if (id) ids.add(id);
    });
    return Array.from(ids);
}

async function filterPublishedOpportunityIds(opportunityIds) {
    if (!window.dataService || typeof window.dataService.getOpportunityById !== 'function') {
        return [];
    }
    const published = [];
    for (const id of opportunityIds || []) {
        const opp = await window.dataService.getOpportunityById(id);
        if (opp && (opp.status || '') === 'published') published.push(id);
    }
    return published;
}

function formatPersistSummaryMessage(result) {
    if (!result) return 'Nothing was persisted.';
    const created = result.createdCount != null ? result.createdCount : (result.created && result.created.length) || 0;
    const skipped = result.skippedDuplicateCount || 0;
    const failed = result.failedCount != null ? result.failedCount : (result.errors && result.errors.length) || 0;
    const oppCount = result.opportunityCount != null ? result.opportunityCount : null;
    let msg = 'Created ' + created + ' match' + (created === 1 ? '' : 'es');
    if (skipped > 0) msg += ', skipped ' + skipped + ' duplicate' + (skipped === 1 ? '' : 's');
    if (failed > 0) msg += ', ' + failed + ' opportunit' + (failed === 1 ? 'y' : 'ies') + ' failed';
    if (oppCount != null) {
        msg += ' across ' + oppCount + ' opportunit' + (oppCount === 1 ? 'y' : 'ies');
    }
    msg += '.';
    if (created > 0) msg += ' Participants were notified for new matches.';
    return msg;
}

function updateBulkPersistBar() {
    const bar = document.getElementById('matching-bulk-persist-bar');
    const countEl = document.getElementById('matching-bulk-selection-count');
    const canPersist = typeof authService !== 'undefined'
        && authService.hasAdminCapability
        && authService.hasAdminCapability('admin.matching.persist');
    const ids = getCheckedOpportunityIds();
    if (bar) bar.hidden = !canPersist;
    if (countEl) countEl.textContent = ids.length + ' opportunit' + (ids.length === 1 ? 'y' : 'ies') + ' selected';
    const btn = document.getElementById('matching-bulk-persist-btn');
    if (btn) btn.disabled = ids.length === 0;
}

async function persistSelectedOpportunities(opportunityIds) {
    authService.assertAdminCapability('admin.matching.persist');
    const runError = document.getElementById('matching-run-error');
    const clearError = () => { if (runError) { runError.hidden = true; runError.textContent = ''; } };
    if (!window.matchingService || typeof window.matchingService.persistPreviewOpportunities !== 'function') {
        if (runError) { runError.hidden = false; runError.textContent = 'Bulk persist is not available.'; }
        return;
    }
    const unique = await filterPublishedOpportunityIds(
        window.AdminMatchingCommandCenter
            ? window.AdminMatchingCommandCenter.collectOpportunityIdsFromIdList(opportunityIds)
            : Array.from(new Set((opportunityIds || []).filter(Boolean)))
    );
    if (!unique.length) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = 'Select at least one published opportunity to save matches.';
        }
        return;
    }
    clearError();
    const actor = authService.getCurrentUser && authService.getCurrentUser();
    const bulkBtn = document.getElementById('matching-bulk-persist-btn');
    if (bulkBtn) bulkBtn.disabled = true;
    try {
        const result = await window.matchingService.persistPreviewOpportunities(unique, {
            source: 'admin_command_center',
            actorId: actor?.id || null,
            actorRole: actor?.role || null,
            previewRunId: lastPreviewRunId
        });
        const errCount = result.failedCount != null ? result.failedCount : (result.errors && result.errors.length) || 0;
        if (runError) {
            runError.hidden = false;
            runError.style.color = errCount ? '' : 'var(--success-color, #059669)';
            runError.textContent = formatPersistSummaryMessage(result);
        }
        await renderAdminAnalytics(window.dataService);
        await renderCommandCenter();
        document.querySelectorAll('.matching-opp-select:checked').forEach(cb => { cb.checked = false; });
        const selectAll = document.getElementById('matching-select-all-opp');
        if (selectAll) selectAll.checked = false;
        updateBulkPersistBar();
    } catch (e) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = (e && e.message) ? e.message : 'Bulk persist failed.';
        }
    } finally {
        if (bulkBtn) bulkBtn.disabled = getCheckedOpportunityIds().length === 0;
    }
}

function renderLifecycleQueueList(items, formatItem, emptyMessage) {
    if (!items || !items.length) {
        return '<p class="matching-cc-empty">' + escapeHtml(emptyMessage || 'None right now.') + '</p>';
    }
    return '<ul class="matching-cc-list">' + items.map(formatItem).join('') + '</ul>';
}

function renderCommandCenterLink(path, label) {
    return '<a href="#" class="matching-cc-link" data-route="' + escapeHtml(path) + '">' + escapeHtml(label) + '</a>';
}

function renderCommandCenterPanel(iconClass, title, items, formatItem, emptyMessage) {
    const count = items && items.length ? items.length : 0;
    const body = renderLifecycleQueueList(items, formatItem, emptyMessage);
    const emptyClass = count === 0 ? ' is-empty' : '';
    return ''
        + '<article class="matching-cc-panel' + emptyClass + '">'
        + '<header class="matching-cc-panel-head">'
        + '<span class="matching-cc-panel-icon" aria-hidden="true"><i class="ph-duotone ' + escapeHtml(iconClass) + '"></i></span>'
        + '<h3 class="matching-cc-panel-title">' + escapeHtml(title) + '</h3>'
        + '<span class="matching-cc-count" aria-label="' + count + ' items">' + count + '</span>'
        + '</header>'
        + '<div class="matching-cc-panel-body">' + body + '</div>'
        + '</article>';
}

async function renderCommandCenter() {
    const lifecycleEl = document.getElementById('matching-cc-lifecycle');
    const cc = window.AdminMatchingCommandCenter;
    if (!lifecycleEl || !cc || !window.dataService) return;

    const queues = await cc.buildLifecycleQueues(window.dataService);
    const matchRoute = (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.MATCH_DETAIL)
        ? window.CONFIG.ROUTES.MATCH_DETAIL.replace(':id', '')
        : '/matches/';

    const friendlyMatchType = (t) => (window.unifiedMatchViewModel && window.unifiedMatchViewModel.getMatchTypeLabel)
        ? window.unifiedMatchViewModel.getMatchTypeLabel(t)
        : (t || 'Match');

    lifecycleEl.innerHTML = ''
        + '<div class="matching-cc-grid">'
        + renderCommandCenterPanel('ph-envelope-simple', 'Invitations (sent)', queues.invitations, (i) => {
            const link = i.matchId
                ? renderCommandCenterLink(matchRoute + i.matchId, 'Match ' + i.matchId.slice(0, 8))
                : escapeHtml(i.opportunityId || '—');
            return '<li>' + link + ' · ' + escapeHtml(i.kind) + ' · ' + escapeHtml(i.status || '') + '</li>';
        }, 'No invitations have been sent yet.')
        + renderCommandCenterPanel('ph-chats-circle', 'Negotiations', queues.negotiations, (n) => {
            const link = n.matchId
                ? renderCommandCenterLink(matchRoute + n.matchId, 'Match ' + n.matchId.slice(0, 8))
                : 'Application';
            return '<li>' + link + ' · ' + escapeHtml(n.status || '') + '</li>';
        }, 'No negotiations yet.')
        + renderCommandCenterPanel('ph-arrows-counter-clockwise', 'Replacements', queues.replacements, (r) => {
            const link = r.matchId
                ? renderCommandCenterLink(matchRoute + r.matchId, 'Match ' + r.matchId.slice(0, 8))
                : escapeHtml(r.opportunityId || '—');
            return '<li>' + link + ' · ' + escapeHtml(r.roleToFill || '') + ' · ' + escapeHtml(r.status || '') + '</li>';
        }, 'No replacement requests found.')
        + renderCommandCenterPanel('ph-prohibit', 'Blocked matches', queues.blockedMatches, (m) => {
            const canResolve = typeof authService !== 'undefined'
                && authService.hasAdminCapability
                && (authService.hasAdminCapability('admin.matching.resolve_blocked')
                    || authService.hasAdminCapability('admin.matching.persist'));
            const resolveBtn = canResolve && !(authService.isReadOnlyAdmin && authService.isReadOnlyAdmin())
                ? ' <button type="button" class="btn btn-outline btn-sm matching-resolve-blocked" data-match-id="'
                + escapeHtml(m.id) + '" data-requires-persist>Clear blocked</button>'
                : '';
            return '<li>' + renderCommandCenterLink(matchRoute + m.id, escapeHtml(friendlyMatchType(m.matchType)))
                + ' · ' + escapeHtml(m.status || '') + resolveBtn + '</li>';
        }, 'No blocked matches right now.')
        + renderCommandCenterPanel('ph-floppy-disk', 'Persist runs', queues.matchingRuns, (r) =>
            '<li>' + escapeHtml(r.opportunityId || '—') + ' · '
            + escapeHtml((r.modelsRun && r.modelsRun.join(', ')) || r.model || '—')
            + ' · ' + escapeHtml(r.source || '') + ' · created ' + (r.createdCount != null ? r.createdCount : '—') + '</li>'
        , 'No matching persist runs yet.')
        + renderCommandCenterPanel('ph-eye', 'Preview runs', queues.previewRuns, (r) =>
            '<li>' + escapeHtml(new Date(r.createdAt).toLocaleString()) + ' · '
            + (r.totalMatchesFound || 0) + ' found · ' + (r.selectableRowCount || 0) + ' rows</li>'
        , 'Run a preview report to see history here.')
        + '</div>';

    lifecycleEl.querySelectorAll('.matching-cc-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route && typeof router !== 'undefined' && router.navigate) router.navigate(route);
        });
    });

    lifecycleEl.querySelectorAll('.matching-resolve-blocked').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            const matchId = this.getAttribute('data-match-id');
            const user = authService.getCurrentUser();
            if (!matchId || !user || !dataService.adminResolveBlockedPostMatch) return;
            if (!confirm('Clear blocked flags on this match?')) return;
            this.disabled = true;
            try {
                authService.assertAdminCapability('admin.matching.resolve_blocked');
            } catch (_) {
                try {
                    authService.assertAdminCapability('admin.matching.persist');
                } catch (err) {
                    alert((err && err.message) || 'Permission denied.');
                    this.disabled = false;
                    return;
                }
            }
            try {
                await dataService.adminResolveBlockedPostMatch(matchId, user.id);
                await renderCommandCenter();
            } catch (err) {
                alert((err && err.message) || 'Could not resolve blocked match.');
            }
            this.disabled = false;
        });
    });
}

async function persistForOpportunity(opportunityId) {
    authService.assertAdminCapability('admin.matching.persist');
    const runError = document.getElementById('matching-run-error');
    const clearError = () => { if (runError) { runError.hidden = true; runError.textContent = ''; } };
    if (!window.matchingService || !window.dataService) {
        if (runError) { runError.hidden = false; runError.textContent = 'Matching service not available.'; }
        return;
    }
    const opp = await window.dataService.getOpportunityById(opportunityId);
    if (!opp || (opp.status || '') !== 'published') {
        if (runError) { runError.hidden = false; runError.textContent = 'Opportunity not found or not published. Only published opportunities can be persisted.'; }
        return;
    }
    clearError();
    try {
        const actor = authService.getCurrentUser && authService.getCurrentUser();
        const result = await window.matchingService.persistPostMatches(opportunityId, {
            source: 'admin_save',
            actorId: actor?.id || null,
            actorRole: actor?.role || null
        });
        if (runError) {
            runError.hidden = false;
            runError.style.color = '';
            runError.textContent = formatPersistSummaryMessage({
                createdCount: result?.createdCount || 0,
                skippedDuplicateCount: result?.skippedDuplicateCount || 0,
                failedCount: 0,
                opportunityCount: 1
            });
        }
        await renderAdminAnalytics(window.dataService);
    } catch (e) {
        if (runError) {
            runError.hidden = false;
            runError.textContent = (e && e.message) ? e.message : 'Persist failed.';
        }
    }
}

function applyAuditorReadOnlyUi() {
    const isAuditor = typeof authService !== 'undefined'
        && authService.isReadOnlyAdmin
        && authService.isReadOnlyAdmin();
    const runError = document.getElementById('matching-run-error');
    if (isAuditor && runError) {
        runError.hidden = false;
        runError.style.color = '';
        runError.textContent = 'This account is read-only. You can run preview reports but cannot persist matches.';
    }
    document.querySelectorAll('[data-requires-persist]').forEach(el => {
        el.disabled = true;
        el.title = 'This action is read-only for auditor accounts.';
    });
}

async function initAdminMatching() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.matching.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminMatching
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminMatching);
    }

    applyAuditorReadOnlyUi();

    const runButton = document.getElementById('matching-run-report-btn');
    if (runButton) runButton.onclick = runAndShowReport;

    const bulkBtn = document.getElementById('matching-bulk-persist-btn');
    if (bulkBtn) {
        bulkBtn.onclick = function () {
            void persistSelectedOpportunities(getCheckedOpportunityIds());
        };
    }
    const pageRoot = document.querySelector('.admin-matching-page');
    if (pageRoot) {
        pageRoot.addEventListener('change', function (e) {
            const t = e.target;
            if (!t || !t.classList) return;
            if (t.id === 'matching-select-all-opp') {
                document.querySelectorAll('.matching-opp-select').forEach(cb => { cb.checked = t.checked; });
            }
            if (t.classList.contains('matching-opp-select') || t.id === 'matching-select-all-opp') {
                updateBulkPersistBar();
            }
        });
    }
    updateBulkPersistBar();

    if (matchingRefreshIntervalId != null) {
        clearInterval(matchingRefreshIntervalId);
        matchingRefreshIntervalId = null;
    }
    if (matchingVisibilityHandler) {
        document.removeEventListener('visibilitychange', matchingVisibilityHandler);
        matchingVisibilityHandler = null;
    }

    await renderCommandCenter();
    await runAndShowReport();

    matchingRefreshIntervalId = setInterval(runAndShowReport, MATCHING_REFRESH_INTERVAL_MS);
    matchingVisibilityHandler = function () {
        if (document.visibilityState === 'visible') runAndShowReport();
    };
    document.addEventListener('visibilitychange', matchingVisibilityHandler);
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}

/**
 * Preview-only matching report (findMatchesForPost / findCircularExchanges).
 * Does not call persistPostMatches and does not notify participants.
 */
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

    if (window.AdminMatchingOneWayDiagnostics && typeof window.AdminMatchingOneWayDiagnostics.collectOneWayDiagnostics === 'function') {
        try {
            report.oneWayDiagnostics = await window.AdminMatchingOneWayDiagnostics.collectOneWayDiagnostics();
        } catch (diagErr) {
            report.oneWayDiagnostics = { error: diagErr && diagErr.message ? diagErr.message : 'Diagnostics failed' };
        }
    }
    if (typeof CONFIG !== 'undefined' && CONFIG.MATCHING && CONFIG.MATCHING.DEBUG && report.oneWayDiagnostics) {
        console.log('[admin-matching one-way diagnostics]', report.oneWayDiagnostics);
    }

    return report;
}

function isConfirmedLikeMatch(match) {
    const helper = window.postMatchAnalytics;
    if (helper && typeof helper.isConfirmedLikeMatch === 'function') {
        return helper.isConfirmedLikeMatch(match);
    }
    const s = (match && match.status) || '';
    return s === 'confirmed' || s === 'accepted';
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

/**
 * Compute admin analytics from data-service getters (post_matches, deals).
 * @param {object} dataService - window.dataService
 * @returns {Promise<{ totalPostMatches: number, confirmedPostMatches: number, totalDeals: number, dealsFromMatches: number, conversionRate: string }>}
 */
async function getAdminMatchingAnalytics(dataService) {
    const emptyInvite = {
        invitationsSent: 0,
        applicationsFromInvitations: 0,
        invitationAcceptanceRate: '—',
        replacementInvitationsAccepted: 0,
        dealsFromInvitedApplications: 0,
        openNegotiations: 0,
        agreedNegotiations: 0,
        cancelledNegotiations: 0,
        dealsFromNegotiations: 0,
        blockedMatches: 0,
        replacementPendingReview: 0,
        replacementInvitationsSent: 0,
        replacementAccepted: 0,
        replacementCompleted: 0,
        replacementConversionRate: '—',
        dealsFromApplications: 0,
        draftDeals: 0,
        activeDeals: 0,
        dealsWithContracts: 0
    };
    if (!dataService) {
        return { totalPostMatches: 0, confirmedPostMatches: 0, totalDeals: 0, dealsFromMatches: 0, conversionRate: '—', ...emptyInvite };
    }
    const postMatches = await dataService.getPostMatches();
    const deals = await dataService.getDeals();
    const totalPostMatches = postMatches.length;
    const confirmedPostMatches = postMatches.filter(isConfirmedLikeMatch).length;
    const totalDeals = deals.length;
    const dealsFromMatches = deals.filter(d => d.matchId).length;
    const conversionRate = confirmedPostMatches > 0
        ? (Math.round((dealsFromMatches / confirmedPostMatches) * 100) + '%')
        : '—';
    const inviteStats = typeof dataService.getInvitationMatchingAnalytics === 'function'
        ? await dataService.getInvitationMatchingAnalytics()
        : emptyInvite;
    const negStats = typeof dataService.getNegotiationMatchingAnalytics === 'function'
        ? await dataService.getNegotiationMatchingAnalytics()
        : emptyInvite;
    const replStats = typeof dataService.getReplacementMatchingAnalytics === 'function'
        ? await dataService.getReplacementMatchingAnalytics()
        : emptyInvite;
    const dealStats = typeof dataService.getDealFlowMatchingAnalytics === 'function'
        ? await dataService.getDealFlowMatchingAnalytics()
        : emptyInvite;
    return {
        totalPostMatches,
        confirmedPostMatches,
        totalDeals,
        dealsFromMatches,
        conversionRate,
        invitationsSent: inviteStats.invitationsSent,
        applicationsFromInvitations: inviteStats.applicationsFromInvitations,
        invitationAcceptanceRate: inviteStats.invitationAcceptanceRate,
        replacementInvitationsAccepted: inviteStats.replacementInvitationsAccepted,
        dealsFromInvitedApplications: inviteStats.dealsFromInvitedApplications,
        openNegotiations: negStats.openNegotiations,
        agreedNegotiations: negStats.agreedNegotiations,
        cancelledNegotiations: negStats.cancelledNegotiations,
        dealsFromNegotiations: negStats.dealsFromNegotiations,
        blockedMatches: replStats.blockedMatches,
        replacementPendingReview: replStats.pendingReview,
        replacementInvitationsSent: replStats.invitationsSent,
        replacementAccepted: replStats.accepted,
        replacementCompleted: replStats.completed,
        replacementConversionRate: replStats.conversionRate,
        dealsFromApplications: dealStats.dealsFromApplications,
        draftDeals: dealStats.draftDeals,
        activeDeals: dealStats.activeDeals,
        dealsWithContracts: dealStats.dealsWithContracts
    };
}

function getOpportunityRoute(id) {
    const routeBase = (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.OPPORTUNITY_DETAIL)
        ? window.CONFIG.ROUTES.OPPORTUNITY_DETAIL.replace(':id', '')
        : '/opportunities/';
    return routeBase && routeBase.endsWith('/') ? routeBase + id : '/opportunities/' + id;
}

function renderMetricCard(value, label, detail) {
    return ''
        + '<div class="stat-card matching-metric-card">'
        + '<div>'
        + '<div class="stat-value">' + escapeHtml(value) + '</div>'
        + '<div class="stat-label">' + escapeHtml(label) + '</div>'
        + (detail ? '<div class="stat-detail">' + escapeHtml(detail) + '</div>' : '')
        + '</div>'
        + '</div>';
}

function getScoreTone(scoreText) {
    const raw = String(scoreText || '').replace('%', '').trim();
    const score = Number.parseInt(raw, 10);
    if (Number.isNaN(score)) return 'neutral';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score > 0) return 'low';
    return 'neutral';
}

function renderScoreBadge(scoreText) {
    const text = scoreText == null || scoreText === '' ? '-' : String(scoreText);
    return '<span class="matching-score-badge is-' + getScoreTone(text) + '">' + escapeHtml(text) + '</span>';
}

function renderStatusBadge(status) {
    const text = status || 'Suggested';
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return '<span class="matching-status-badge matching-status-' + escapeHtml(key || 'neutral') + '">' + escapeHtml(text) + '</span>';
}

function renderMatchKindBadge(matchType, filterKey) {
    const key = filterKey || 'neutral';
    return '<span class="matching-kind-badge matching-kind-' + escapeHtml(key) + '">' + escapeHtml(matchType) + '</span>';
}

function renderOneWayDiagnostics(report) {
    const panel = document.getElementById('matching-one-way-diagnostics');
    const body = document.getElementById('matching-one-way-diagnostics-body');
    if (!panel || !body) return;
    const diag = report && report.oneWayDiagnostics;
    const showAdmin = typeof authService !== 'undefined' && authService.canAccessAdmin && authService.canAccessAdmin();
    if (!showAdmin || !diag) {
        panel.hidden = true;
        return;
    }
    panel.hidden = false;
    if (diag.error) {
        body.innerHTML = '<p class="matching-details">' + escapeHtml(diag.error) + '</p>';
        return;
    }
    const reasons = diag.rejectionReasons || {};
    const reasonLines = Object.keys(reasons).length
        ? Object.keys(reasons).map(k => escapeHtml(k) + ': ' + reasons[k]).join('<br>')
        : '—';
    const below = (diag.topBelowThreshold || []).map(p => {
        const ids = p.direction === 'offer_to_needs'
            ? ('offer ' + (p.offerId || '') + ' → need ' + (p.needId || ''))
            : ('need ' + (p.needId || '') + ' → offer ' + (p.offerId || ''));
        return '<li>score ' + escapeHtml(String(p.score)) + ' · ' + escapeHtml(ids)
            + (p.weak && p.weak.length ? ' · ' + escapeHtml(p.weak.join(', ')) : '') + '</li>';
    }).join('');
    body.innerHTML = ''
        + '<dl class="matching-diagnostics-dl">'
        + '<dt>Published needs / offers</dt><dd>' + escapeHtml(diag.publishedNeedCount) + ' / ' + escapeHtml(diag.publishedOfferCount) + '</dd>'
        + '<dt>Inspected (capped)</dt><dd>' + escapeHtml(diag.needsInspected) + ' needs, ' + escapeHtml(diag.offersInspected) + ' offers</dd>'
        + '<dt>Post pairs scanned</dt><dd>' + escapeHtml(diag.candidatePairsFromGenerator) + '</dd>'
        + '<dt>Scored pairs</dt><dd>' + escapeHtml(diag.scoredPairs) + '</dd>'
        + '<dt>Above threshold (' + escapeHtml(diag.threshold) + ')</dt><dd>' + escapeHtml(diag.pairsAboveThreshold) + '</dd>'
        + '<dt>Below threshold</dt><dd>' + escapeHtml(diag.pairsBelowThreshold) + '</dd>'
        + '</dl>'
        + '<p class="matching-diagnostics-subtitle">Common below-threshold signals</p>'
        + '<div class="matching-diagnostics-reasons">' + reasonLines + '</div>'
        + '<p class="matching-diagnostics-subtitle">Top below-threshold pairs</p>'
        + '<ul class="matching-diagnostics-list">' + (below || '<li>None scored in inspected set</li>') + '</ul>';
}

function renderMatchingSummary(report) {
    const el = document.getElementById('matching-report-summary');
    if (!el) return;
    const activeModels = [
        report.oneWayMatches,
        report.twoWayMatches,
        report.groupFormations,
        report.circularExchanges
    ].filter(count => Number(count || 0) > 0).length;
    el.innerHTML = ''
        + '<div class="matching-summary-chip"><strong>' + escapeHtml(report.totalPostsAnalyzed) + '</strong><span>Published posts</span></div>'
        + '<div class="matching-summary-chip"><strong>' + escapeHtml(report.totalNeeds) + '</strong><span>Needs</span></div>'
        + '<div class="matching-summary-chip"><strong>' + escapeHtml(report.totalOffers) + '</strong><span>Offers</span></div>'
        + '<div class="matching-summary-chip"><strong>' + activeModels + '/4</strong><span>Active models</span></div>';
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
            rows.push({ matchType: 'Need/Offer', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
        });
    });
    (report.oneWayOfferToNeeds || []).forEach(item => {
        (item.matches || []).forEach(m => {
            const partId = (m.matchedOpportunity && m.matchedOpportunity.creatorId) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].creatorId);
            const participants = [getName(item.creatorId), getName(partId)].filter(Boolean).join(', ') || '—';
            const oppRefs = [item.opportunityId, (m.matchedOpportunity && m.matchedOpportunity.id) || (m.suggestedPartners && m.suggestedPartners[0] && m.suggestedPartners[0].opportunityId)].filter(Boolean).join(' ↔ ') || '—';
            const score = (m.matchScore != null) ? Math.round(m.matchScore * 100) + '%' : '—';
            rows.push({ matchType: 'Need/Offer', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
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
    const circularCap = (window.AdminMatchingCommandCenter && window.AdminMatchingCommandCenter.capCircularCyclesForDisplay)
        ? window.AdminMatchingCommandCenter.capCircularCyclesForDisplay(report.circularCycles || [])
        : { cycles: (report.circularCycles || []).slice(0, 100) };
    circularCap.cycles.forEach(c => {
        const cycleIds = c.cycle || [];
        const participants = cycleIds.map(id => getName(id)).join(' → ') + (cycleIds.length ? ' → ' + getName(cycleIds[0]) : '');
        const oppRefs = (c.opportunityIds && c.opportunityIds.length) ? c.opportunityIds.join(' → ') : (cycleIds.join(' → ') || '—');
        const score = (c.matchScore != null) ? Math.round(c.matchScore * 100) + '%' : '—';
        rows.push({ matchType: 'Circular', participants, opportunityRefs: oppRefs, matchScore: score, status: 'Suggested' });
    });
    return rows;
}

function renderReport(gridEl, detailsEl, report) {
    return renderReportAsync(gridEl, detailsEl, report);
}

async function renderReportAsync(gridEl, detailsEl, report) {
    if (!gridEl) return;
    renderMatchingSummary(report);
    gridEl.innerHTML = ''
        + renderMetricCard(report.totalMatchesFound, 'Total found', 'All suggested matches')
        + renderMetricCard(report.oneWayMatches, 'Need-offer', 'Direct matches')
        + renderMetricCard(report.twoWayMatches, 'Barter', 'Barter exchange')
        + renderMetricCard(report.groupFormations, 'Group', 'Multi-partner groups')
        + renderMetricCard(report.circularExchanges, 'Cycle', 'Circular exchanges');

    const perOppEl = document.getElementById('matching-per-opportunity-table');
    if (perOppEl) {
        const perOppRows = buildPerOpportunityRows(report);
        if (perOppRows.length === 0) {
            perOppEl.innerHTML = '<p class="matching-details">No opportunities analyzed in this run.</p>';
        } else {
            const canPersist = typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.matching.persist');
            let table = '<table class="matching-summary-table matching-per-opp-table"><thead><tr>';
            if (canPersist) {
                table += '<th class="matching-select-col"><input type="checkbox" id="matching-select-all-opp" aria-label="Select all opportunities" /></th>';
            }
            table += '<th>Opportunity title</th><th>Matches</th><th>Best score</th><th>Average score</th><th>Action</th></tr></thead><tbody>';
            perOppRows.forEach(r => {
                const viewHref = r.sectionId === 'matching-two-way' ? '#matching-two-way' : '#matching-opp-' + escapeHtml(r.opportunityId);
                const viewMatchesLink = '<a href="' + viewHref + '" class="matching-view-matches-link" data-section="' + escapeHtml(r.sectionId) + '" data-opp-id="' + escapeHtml(r.opportunityId) + '">View</a>';
                const persistBtn = canPersist
                    ? ('<button type="button" class="matching-persist-btn" data-opp-id="' + escapeHtml(r.opportunityId) + '" data-requires-persist title="Persist post_matches and notify participants">Save matches</button>')
                    : '';
                const selectCell = canPersist
                    ? ('<td class="matching-select-col"><input type="checkbox" class="matching-opp-select" data-opp-id="' + escapeHtml(r.opportunityId) + '" aria-label="Select opportunity" /></td>')
                    : '';
                table += '<tr>' + selectCell + '<td>' + escapeHtml(r.title) + '</td><td>' + r.matchCount + '</td><td>' + renderScoreBadge(r.bestScorePct) + '</td><td>' + renderScoreBadge(r.avgScorePct) + '</td><td><div class="matching-action-cell">' + viewMatchesLink + persistBtn + '</div></td></tr>';
            });
            table += '</tbody></table>';
            perOppEl.innerHTML = table;
            updateBulkPersistBar();
        }
    }

    const summaryTabsEl = document.getElementById('matching-summary-tabs');
    const summaryEl = document.getElementById('matching-summary-table');
    const MATCH_TYPE_FILTER_KEYS = { 'Need/Offer': 'one-way', 'Barter': 'two-way', 'Consortium': 'consortium', 'Circular': 'circular' };
    if (summaryEl) {
        const rows = (window.AdminMatchingCommandCenter && window.AdminMatchingCommandCenter.buildSelectableMatchRows)
            ? window.AdminMatchingCommandCenter.buildSelectableMatchRows(report)
            : buildMatchesSummaryRows(report);
        lastSelectableRows = rows;

        const cc = window.AdminMatchingCommandCenter;
        const umv = window.unifiedMatchViewModel;
        const ds = window.dataService;
        let matchViewModels = [];
        if (cc && umv && typeof cc.buildPreviewPostMatchStubsFromReport === 'function'
            && typeof umv.buildUnifiedMatchViewModels === 'function') {
            const stubs = cc.buildPreviewPostMatchStubsFromReport(report);
            const adminUser = typeof authService !== 'undefined' && authService.getCurrentUser
                ? authService.getCurrentUser()
                : null;
            matchViewModels = await umv.buildUnifiedMatchViewModels(stubs, {
                dataService: ds,
                currentUserId: adminUser?.id || null,
                adminMode: true
            });
            matchViewModels.forEach((vm, idx) => {
                const stub = stubs[idx];
                if (stub && stub.filterKey) vm.filterKey = stub.filterKey;
            });
            matchViewModels.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }

        if (rows.length === 0) {
            if (summaryTabsEl) summaryTabsEl.innerHTML = '';
            summaryEl.innerHTML = '<p class="matching-details">No matches in this run.</p>';
        } else {
            const counts = { 'one-way': 0, 'two-way': 0, 'consortium': 0, 'circular': 0 };
            matchViewModels.forEach(vm => {
                const key = vm.filterKey || MATCH_TYPE_FILTER_KEYS[vm.matchTypeLabel] || vm.internalMatchType;
                if (key && counts[key] != null) counts[key]++;
            });
            if (!matchViewModels.length) {
                rows.forEach(r => {
                    const key = r.filterKey || MATCH_TYPE_FILTER_KEYS[r.matchType];
                    if (key) counts[key]++;
                });
            }
            const circularMeta = (window.AdminMatchingCommandCenter && window.AdminMatchingCommandCenter.getCircularDisplayMeta)
                ? window.AdminMatchingCommandCenter.getCircularDisplayMeta(report)
                : { total: report.circularExchanges || 0, hidden: 0, note: null };
            const circularTabCount = circularMeta.total > counts['circular']
                ? (counts['circular'] + ' of ' + circularMeta.total)
                : String(counts['circular']);
            const totalCount = matchViewModels.length || rows.length;
            if (summaryTabsEl) {
                const tabs = [
                    { id: 'all', label: 'All', count: totalCount },
                    { id: 'one-way', label: 'Need/Offer', count: counts['one-way'] },
                    { id: 'two-way', label: 'Barter', count: counts['two-way'] },
                    { id: 'consortium', label: 'Group', count: counts['consortium'] },
                    { id: 'circular', label: 'Cycle', count: circularTabCount }
                ];
                summaryTabsEl.innerHTML = tabs.map((t, i) =>
                    '<button type="button" class="matching-match-type-tab' + (i === 0 ? ' is-active' : '') + '" role="tab" data-filter="' + escapeHtml(t.id) + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + escapeHtml(t.label) + ' <span class="tab-count">(' + t.count + ')</span></button>'
                ).join('');
            }
            const visibleVms = matchViewModels.slice(0, 200);
            const noteParts = [];
            if (totalCount > visibleVms.length) {
                noteParts.push('Showing the first ' + visibleVms.length + ' matches. Use the filters above to focus the list.');
            }
            if (circularMeta.hidden > 0 && circularMeta.note) {
                noteParts.push(circularMeta.note);
            }
            const note = noteParts.length
                ? '<p class="matching-table-note">' + escapeHtml(noteParts.join(' ')) + '</p>'
                : '';
            const cardsHtml = (umv && typeof umv.renderUnifiedMatchCardHtml === 'function')
                ? visibleVms.map(vm => umv.renderUnifiedMatchCardHtml(vm)).join('')
                : '';
            summaryEl.innerHTML = note + '<div class="match-cards-grid admin-match-cards-grid">' + cardsHtml + '</div>';
            if (summaryTabsEl) {
                const detailSections = document.querySelectorAll('.matching-detail-section[data-match-type]');
                const applyFilter = (filter) => {
                    summaryEl.querySelectorAll('.match-card-unified').forEach(card => {
                        const rowType = card.getAttribute('data-match-type');
                        const show = filter === 'all' || rowType === filter;
                        card.classList.toggle('is-hidden', !show);
                    });
                    detailSections.forEach(section => {
                        const sectionType = section.getAttribute('data-match-type');
                        const showSection = filter !== 'all' && sectionType === filter;
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
                    const role = typeof formatParticipantRole === 'function'
                        ? formatParticipantRole(rolePartner.role, 'Partner')
                        : (rolePartner.role || 'Partner');
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

    renderOneWayDiagnostics(report);

    const circularEl = document.getElementById('matching-circular');
    if (circularEl) {
        const allCycles = report.circularCycles || [];
        const circularCap = (window.AdminMatchingCommandCenter && window.AdminMatchingCommandCenter.capCircularCyclesForDisplay)
            ? window.AdminMatchingCommandCenter.capCircularCyclesForDisplay(allCycles)
            : { cycles: allCycles.slice(0, 100), hidden: Math.max(0, allCycles.length - 100), displayed: Math.min(allCycles.length, 100), total: allCycles.length };
        const circularMeta = (window.AdminMatchingCommandCenter && window.AdminMatchingCommandCenter.getCircularDisplayMeta)
            ? window.AdminMatchingCommandCenter.getCircularDisplayMeta(report)
            : null;
        if (allCycles.length === 0) {
            circularEl.innerHTML = '<p class="matching-details">No circular exchanges found.</p>';
        } else {
            let html = '';
            if (circularMeta && circularMeta.note) {
                html += '<p class="matching-table-note">' + escapeHtml(circularMeta.note) + '</p>';
            }
            for (const c of circularCap.cycles) {
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
    container.querySelectorAll('.matching-persist-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const oppId = this.getAttribute('data-opp-id');
            if (oppId) persistForOpportunity(oppId);
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
