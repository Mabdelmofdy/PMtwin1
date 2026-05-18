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
        await loadOpportunityMatches();
    } catch (err) {
        console.error('Error initializing Matches page:', err);
        showMatchesError();
    }
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
        const context = { currentUserId: user.id, dataService };
        matchesPageViewModels = await umv.buildUnifiedMatchViewModels(rawMatches, context);
        matchesPageViewModels.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        updateMatchesTabCounts(matchesPageViewModels);
        renderMatchesList();
    } catch (error) {
        console.error('Error loading Need/Offer matches:', error);
        showMatchesError();
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
                    const existing = await dataService.getActiveNegotiationForMatch(matchId);
                    if (!existing) await dataService.startNegotiationFromMatch(matchId, user.id);
                    if (window.router?.navigate) window.router.navigate('/matches/' + matchId + '#negotiation');
                } catch (err) {
                    alert((err && err.message) ? err.message : 'Could not start negotiation.');
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
            const accept = e.target.closest('[data-action="accept"]');
            const decline = e.target.closest('[data-action="decline"]');
            if ((accept || decline) && e.target.tagName !== 'A') {
                e.preventDefault();
                const matchId = (accept || decline).getAttribute('data-match-id');
                if (matchId && window.router?.navigate) window.router.navigate('/matches/' + matchId);
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
}

function renderUnifiedMatchCardHtml(vm) {
    const umv = getUmv();
    const esc = umv?.escapeHtml || escapeMatchesHtml;
    const actionsHtml = (vm.availableActions || []).map(action => {
        const cls = action.kind === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
        const disabled = action.enabled === false || vm.isExpired;
        if (action.id === 'accept' || action.id === 'decline' || action.id === 'invite_apply' || action.id === 'negotiate') {
            return `<button type="button" class="${cls}" data-action="${esc(action.id)}" data-match-id="${esc(vm.id)}"${disabled ? ' disabled' : ''}>${esc(action.label)}</button>`;
        }
        return `<a href="#" data-route="${esc(action.route)}" class="${cls}${disabled ? ' opacity-50 pointer-events-none' : ''}">${esc(action.label)}</a>`;
    }).join(' ');

    const typeLine = vm.sourceOpportunityTypeLabel
        ? `<p class="match-card-unified__type">${esc(vm.sourceOpportunityTypeLabel)}</p>`
        : '';

    return `<article class="card match-card match-card-unified" data-match-id="${esc(vm.id)}" data-match-type="${esc(vm.matchType)}">
        <header class="match-card-unified__header">
            <div>
                <h3 class="match-card-unified__title">${esc(vm.cardTitle || vm.matchTypeLabel + ' Match')}</h3>
                ${typeLine}
            </div>
            <span class="badge badge-match ${esc(vm.matchQualityClass)}">${esc(vm.matchQualityLabel)} · ${vm.matchScorePercent}%</span>
        </header>
        <div class="match-card-unified__body">
            ${vm.cardBodyHtml || ''}
            <div class="match-card-block match-card-block--why">
                <p class="match-card-kicker">Why this match?</p>
                <p class="match-card-line match-card-line--muted">${esc(vm.whySummary)}</p>
            </div>
            ${vm.replacementBadge ? `<p class="match-card-unified__ribbon"><span class="badge badge--warning">${esc(vm.replacementBadge)}</span></p>` : ''}
            <p class="match-card-unified__status"><span class="match-card-kicker">Status</span> <span class="badge badge--neutral">${esc(vm.statusLabel)}</span></p>
            <p class="match-card-unified__next"><span class="match-card-kicker">Next</span> ${esc(vm.nextBestAction)}</p>
        </div>
        <footer class="match-card-unified__footer">${actionsHtml}</footer>
    </article>`;
}

function escapeMatchesHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showMatchesError() {
    const listEl = document.getElementById('matches-list');
    if (listEl) {
        listEl.innerHTML = '<div class="empty-state">We couldn’t load your matches. Please try again.</div>';
    }
}

window.loadOpportunityMatches = loadOpportunityMatches;
window.loadMatchesPipeline = loadOpportunityMatches;
