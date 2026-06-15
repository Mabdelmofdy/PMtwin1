/**
 * Need/Offer Matches page – post_matches only (canonical post-to-post matching).
 */

const MATCHES_TAB_ALL = 'all';
const MATCHES_TABS = [
    { id: MATCHES_TAB_ALL, label: 'All' },
    { id: 'one_way', label: 'Need/Offer' },
    { id: 'two_way', label: 'Barter' },
    { id: 'consortium', label: 'Consortium' },
    { id: 'circular', label: 'Circular' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'declined', label: 'Declined' },
    { id: 'expired', label: 'Expired' }
];

let matchesPageState = {
    tab: MATCHES_TAB_ALL,
    status: '',
    quality: '',
    hasDeal: ''
};

let matchesPageViewModels = [];
let matchesLoadError = null;

async function initMatches() {
    try {
        const headerMount = document.getElementById('page-context-header-mount');
        if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
            window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.matches);
        }
        document.getElementById('page-cta-matches-top')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('matches-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.getElementById('page-cta-matches-filters')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('matches-filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        ensureMatchesTabsMarkup();
        setupMatchesTabs();
        setupMatchesFilters();
        setupMatchesRefreshListener();
        await loadOpportunityMatches();
    } catch (err) {
        console.error('[matches] Error initializing Matches page:', err);
        showMatchesError('init', err);
    }
}

function setupMatchesRefreshListener() {
    const root = document.getElementById('tab-matches') || document.getElementById('matches-list')?.closest('section');
    if (!root || root.dataset.matchesRefreshBound) return;
    root.dataset.matchesRefreshBound = '1';
    const refreshMatches = () => {
        loadOpportunityMatches().catch(err => {
            console.error('[matches] Refresh after post-matches update failed:', err);
            showMatchesError('refresh', err);
        });
    };
    ['pmtwin:post-matches-updated', 'pmtwin:deals-updated', 'pmtwin:data-changed'].forEach((eventName) => {
        window.addEventListener(eventName, refreshMatches);
    });
}

function getUmv() {
    return window.unifiedMatchViewModel;
}

/** Upgrade legacy matches page markup to Phase 2 tabs without requiring a full HTML redeploy. */
function ensureMatchesTabsMarkup() {
    const container = document.getElementById('matches-subtabs');
    if (!container || container.querySelector('[data-matches-tab]')) return;
    container.classList.add('matches-segmented--scroll');
    container.innerHTML = MATCHES_TABS.map((tab, index) => {
        const active = index === 0 ? ' active' : '';
        const selected = index === 0 ? 'true' : 'false';
        return `<button type="button" class="matches-segment${active}" role="tab" data-matches-tab="${tab.id}" aria-selected="${selected}">`
            + `<span class="matches-segment__inner"><span class="matches-segment__label">${tab.label}</span>`
            + `<span class="matches-segment__count" id="matches-count-${tab.id}" hidden></span></span></button>`;
    }).join('');
    if (!document.getElementById('matches-list') && document.getElementById('matches-recommended-list')) {
        const legacy = document.getElementById('matches-recommended-list');
        legacy.id = 'matches-list';
    }
}

async function loadOpportunityMatches() {
    const listEl = document.getElementById('matches-list');
    if (!listEl) return;

    const user = authService.getCurrentUser();
    if (!user) return;

    listEl.innerHTML = '<div class="spinner" aria-label="Loading matches"></div>';

    const umv = getUmv();
    if (!umv) {
        listEl.innerHTML = '<div class="empty-state">We couldn’t load your matches. Please try again.</div>';
        return;
    }

    try {
        const rawMatches = await collectUserMatches(user);
        matchesLoadError = null;
        const context = { currentUserId: user.id, dataService };
        matchesPageViewModels = await umv.buildUnifiedMatchViewModels(rawMatches, context);
        matchesPageViewModels.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        updateMatchesTabCounts(matchesPageViewModels);
        renderMatchesList();
    } catch (error) {
        matchesLoadError = error;
        console.error('[matches] Error loading Need/Offer matches for user', user.id, error);
        showMatchesError('load', error);
    }
}

async function collectUserMatches(user) {
    if (!dataService.getPostMatchesForUser) return [];
    return dataService.getPostMatchesForUser(user.id);
}

function setupMatchesTabs() {
    const container = document.getElementById('matches-subtabs');
    if (!container) return;
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-matches-tab]');
        if (!btn) return;
        matchesPageState.tab = btn.getAttribute('data-matches-tab') || MATCHES_TAB_ALL;
        container.querySelectorAll('.matches-segment').forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderMatchesList();
    });
}

function setupMatchesFilters() {
    const statusEl = document.getElementById('matches-filter-status');
    const qualityEl = document.getElementById('matches-filter-quality');
    const dealEl = document.getElementById('matches-filter-has-deal');
    const clearBtn = document.getElementById('matches-clear-filters');

    const onChange = () => {
        matchesPageState.status = statusEl?.value || '';
        matchesPageState.quality = qualityEl?.value || '';
        matchesPageState.hasDeal = dealEl?.value || '';
        renderMatchesList();
    };
    statusEl?.addEventListener('change', onChange);
    qualityEl?.addEventListener('change', onChange);
    dealEl?.addEventListener('change', onChange);
    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        matchesPageState.status = '';
        matchesPageState.quality = '';
        matchesPageState.hasDeal = '';
        if (statusEl) statusEl.value = '';
        if (qualityEl) qualityEl.value = '';
        if (dealEl) dealEl.value = '';
        renderMatchesList();
    });

    const root = document.getElementById('tab-matches');
    if (root && !root.dataset.matchActionsBound) {
        root.dataset.matchActionsBound = '1';
        root.addEventListener('click', async (e) => {
            const negotiate = e.target.closest('[data-action="negotiate"]');
            if (negotiate) {
                e.preventDefault();
                const matchId = negotiate.getAttribute('data-match-id');
                const user = authService.getCurrentUser();
                if (!matchId || !user) return;
                negotiate.disabled = true;
                try {
                    let negId = null;
                    const match = await dataService.getPostMatchById(matchId);
                    if (match?.negotiationId) {
                        const neg = await dataService.getNegotiationById(match.negotiationId);
                        const nlc = window.negotiationLifecycle;
                        const isActive = nlc
                            ? nlc.isActiveNegotiation(neg)
                            : ['open', 'counter_offered'].includes((neg?.status || '').toLowerCase());
                        if (isActive) negId = neg.id;
                    }
                    if (!negId && typeof dataService.getActiveNegotiationForMatch === 'function') {
                        const active = await dataService.getActiveNegotiationForMatch(matchId);
                        if (active?.id) negId = active.id;
                    }
                    if (!negId) {
                        const opportunityId = match && typeof dataService._resolveNegotiationOpportunityId === 'function'
                            ? dataService._resolveNegotiationOpportunityId(match, user.id)
                            : null;
                        const started = await dataService.startNegotiationFromMatch(matchId, user.id, opportunityId ? { opportunityId } : {});
                        negId = started?.id || null;
                        if (!negId) {
                            const refreshed = await dataService.getPostMatchById(matchId);
                            negId = refreshed?.negotiationId || null;
                        }
                    }
                    if (negId && window.router?.navigate) {
                        window.router.navigate('/negotiations/' + negId);
                    } else {
                        throw new Error('Could not open negotiation workspace.');
                    }
                } catch (err) {
                    console.error('[matches] Start/continue negotiation failed:', { matchId, userId: user.id, err });
                    const msg = (err && err.message) ? err.message : 'Could not start negotiation.';
                    if (window.modalService?.error) {
                        await window.modalService.error(msg, 'Negotiation');
                    } else {
                        alert(msg);
                    }
                }
                negotiate.disabled = false;
                return;
            }
            const invite = e.target.closest('[data-action="invite_apply"]');
            if (invite) {
                e.preventDefault();
                const matchId = invite.getAttribute('data-match-id');
                const user = authService.getCurrentUser();
                if (!matchId || !user) return;
                invite.disabled = true;
                try {
                    await dataService.createOpportunityInvitationFromMatch(matchId, user.id);
                    await loadOpportunityMatches();
                } catch (err) {
                    console.error('Invite to apply error:', err);
                    alert((err && err.message) ? err.message : 'Could not send invitation.');
                }
                invite.disabled = false;
                return;
            }
            const createDealBtn = e.target.closest('[data-action="create_deal"], [data-action="create_deal_from_negotiation"]');
            if (createDealBtn) {
                e.preventDefault();
                const matchId = createDealBtn.getAttribute('data-match-id');
                const action = createDealBtn.getAttribute('data-action');
                const user = authService.getCurrentUser();
                if (!matchId || !user) return;
                createDealBtn.disabled = true;
                try {
                    let deal = null;
                    if (action === 'create_deal') {
                        const match = await dataService.getPostMatchById(matchId);
                        if (!match || (match.status || '') !== CONFIG.POST_MATCH_STATUS.CONFIRMED) {
                            throw new Error('The match must be confirmed before creating a deal.');
                        }
                        deal = await dataService.getDealByMatchId(matchId);
                        if (!deal) deal = await dataService.createDealFromMatch(match, user.id);
                    } else {
                        let negId = null;
                        const match = await dataService.getPostMatchById(matchId);
                        negId = match?.negotiationId || null;
                        if (!negId && typeof dataService.getActiveNegotiationForMatch === 'function') {
                            const neg = await dataService.getActiveNegotiationForMatch(matchId);
                            negId = neg?.id;
                        }
                        if (!negId && typeof dataService.getNegotiationsByMatchId === 'function') {
                            const list = await dataService.getNegotiationsByMatchId(matchId);
                            negId = (list || []).find(n => (n.status || '') === 'agreed')?.id || null;
                        }
                        if (!negId) throw new Error('No agreed negotiation found for this match.');
                        deal = await dataService.createDealFromNegotiation(negId, user.id);
                    }
                    if (deal && window.router?.navigate) {
                        try {
                            sessionStorage.setItem('pmtwin_deal_flash', JSON.stringify({
                                message: 'Your Deal Workspace is ready.',
                                tone: 'success'
                            }));
                        } catch (storageErr) {
                            void storageErr;
                        }
                        window.router.navigate('/deals/' + deal.id);
                    }
                } catch (err) {
                    console.error('[matches] Create deal failed:', { matchId, action, userId: user.id, err });
                    const msg = (err && err.message) ? err.message : 'Could not create deal.';
                    const title = /negotiation is still open/i.test(msg) ? 'Negotiation in progress' : 'Cannot create deal';
                    if (window.modalService?.error) {
                        await window.modalService.error(msg, title);
                    } else {
                        alert(msg);
                    }
                }
                createDealBtn.disabled = false;
                return;
            }
            const accept = e.target.closest('[data-action="accept"]');
            const decline = e.target.closest('[data-action="decline"]');
            if ((accept || decline) && e.target.tagName !== 'A') {
                e.preventDefault();
                const matchId = (accept || decline).getAttribute('data-match-id');
                const user = authService.getCurrentUser();
                if (!matchId || !user) return;
                const btn = accept || decline;
                const actions = window.postMatchListActions;
                if (!actions) {
                    if (window.router?.navigate) window.router.navigate('/matches/' + matchId);
                    return;
                }
                btn.disabled = true;
                try {
                    const result = accept
                        ? await actions.acceptPostMatchFromList(matchId, user.id, dataService)
                        : await actions.declinePostMatchFromList(matchId, user.id, dataService);
                    if (result.cancelled) return;
                    actions.notifyListResult(result);
                    if (result.navigateTo) {
                        actions.navigateIfNeeded(result);
                        return;
                    }
                    if (result.ok) await loadOpportunityMatches();
                    else if (!result.ok && result.message) actions.notifyListResult(result);
                } catch (err) {
                    console.error('Match list action error:', err);
                    actions.notifyListResult({
                        ok: false,
                        message: (err && err.message) ? err.message : 'Action failed.',
                        tone: 'danger'
                    });
                } finally {
                    btn.disabled = false;
                }
            }
        });
    }
}

function filterViewModels(viewModels) {
    const tab = matchesPageState.tab;
    return viewModels.filter(vm => {
        if (tab === 'pending' && vm.status !== 'pending') return false;
        if (tab === 'confirmed' && vm.status !== 'confirmed') return false;
        if (tab === 'declined' && vm.status !== 'declined') return false;
        if (tab === 'expired' && vm.status !== 'expired') return false;
        if (['one_way', 'two_way', 'consortium', 'circular'].includes(tab) && vm.matchType !== tab) return false;

        if (matchesPageState.status && vm.status !== matchesPageState.status) return false;
        if (matchesPageState.quality && vm.matchQuality !== matchesPageState.quality) return false;
        if (matchesPageState.hasDeal === 'yes' && !vm.hasDeal) return false;
        if (matchesPageState.hasDeal === 'no' && vm.hasDeal) return false;
        return true;
    });
}

function updateMatchesTabCounts(viewModels) {
    MATCHES_TABS.forEach(tab => {
        const el = document.getElementById('matches-count-' + tab.id);
        if (!el) return;
        const count = tab.id === MATCHES_TAB_ALL
            ? viewModels.length
            : filterViewModelsForTab(viewModels, tab.id).length;
        if (count > 0) {
            el.textContent = String(count);
            el.removeAttribute('hidden');
        } else {
            el.textContent = '';
            el.setAttribute('hidden', 'hidden');
        }
    });
}

function filterViewModelsForTab(viewModels, tab) {
    const prev = matchesPageState.tab;
    matchesPageState.tab = tab;
    const out = filterViewModels(viewModels);
    matchesPageState.tab = prev;
    return out;
}

function renderMatchesList() {
    const listEl = document.getElementById('matches-list');
    const summaryEl = document.getElementById('matches-results-summary');
    if (!listEl) return;

    const filtered = filterViewModels(matchesPageViewModels);
    if (summaryEl) {
        summaryEl.textContent = filtered.length === matchesPageViewModels.length
            ? `${filtered.length} exchange match${filtered.length === 1 ? '' : 'es'}`
            : `Showing ${filtered.length} of ${matchesPageViewModels.length}`;
    }

    if (matchesPageViewModels.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No matches yet. Publish a Need or Offer to start matching.</div>';
        return;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No matches found for these filters.</div>';
        return;
    }

    listEl.innerHTML = '<div class="match-cards-grid">' + filtered.map(renderUnifiedMatchCardHtml).join('') + '</div>';

    if (window.seedStorageIndicator) {
        void window.seedStorageIndicator.syncPageHint('#matches-results-summary', 'post_matches');
    }
}

function renderUnifiedMatchCardHtml(vm) {
    const umv = getUmv();
    if (umv && typeof umv.renderUnifiedMatchCardHtml === 'function') {
        return umv.renderUnifiedMatchCardHtml(vm);
    }
    return '';
}

function escapeMatchesHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showMatchesError(phase = 'load', error = null) {
    const listEl = document.getElementById('matches-list');
    if (listEl) {
        const detail = error?.message ? ` (${error.message})` : '';
        listEl.innerHTML = '<div class="empty-state" role="alert">We couldn’t load your matches. Please refresh or try again.'
            + (phase === 'load' ? '' : ' (' + escapeMatchesHtml(phase) + ')')
            + escapeMatchesHtml(detail) + '</div>';
    }
}

window.loadOpportunityMatches = loadOpportunityMatches;
window.loadMatchesPipeline = loadOpportunityMatches;
