/**
 * Deals List – Deal Workspace for the current user
 */

let dealsLifecycleFilter = 'all';

const DEAL_PROGRESS_STATUSES = ['negotiating', 'draft', 'review', 'signing', 'active', 'execution', 'delivery'];

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getDealStatusLabel(s) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getDealStatusDisplayLabel === 'function') return ui.getDealStatusDisplayLabel(s);
    const map = {
        negotiating: 'Negotiating',
        draft: 'Draft',
        review: 'In Review',
        signing: 'Waiting for Signatures',
        active: 'Active Deal',
        execution: 'In Execution',
        delivery: 'In Delivery',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return map[s] || s;
}

function getDealStatusBadgeClass(s) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(s, 'deal') : 'badge--neutral';
}

function getContractStatusLabel(s) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getContractStatusDisplayLabel === 'function') return ui.getContractStatusDisplayLabel(s);
    const map = { pending: 'Pending Signature', active: 'Active Contract', completed: 'Completed', terminated: 'Terminated' };
    return map[s] || s || '—';
}

function getContractStatusBadgeClass(s) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(s, 'contract') : 'badge--neutral';
}

function getMatchTypeLabel(matchType) {
    if (window.unifiedMatchViewModel && typeof window.unifiedMatchViewModel.getMatchTypeLabel === 'function') {
        return window.unifiedMatchViewModel.getMatchTypeLabel(matchType);
    }
    const map = {
        one_way: 'Need/Offer',
        two_way: 'Barter',
        consortium: 'Consortium',
        circular: 'Circular'
    };
    return map[matchType] || 'Match';
}

function getMatchTypeIconClass(matchType) {
    const map = {
        one_way: 'ph-duotone ph-arrow-right',
        two_way: 'ph-duotone ph-arrows-left-right',
        consortium: 'ph-duotone ph-users-three',
        circular: 'ph-duotone ph-arrows-clockwise'
    };
    return map[matchType] || 'ph-duotone ph-handshake';
}

function formatDealDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

function formatValueLine(deal) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.formatValueSummary === 'function') {
        const v = ui.formatValueSummary(deal);
        return v && v !== '—' ? v : '—';
    }
    return '—';
}

function participantEntityLabel(ent) {
    if (!ent) return '';
    if (ent.profile && ent.profile.name) return String(ent.profile.name);
    if (ent.companyName) return String(ent.companyName);
    if (ent.email) return String(ent.email).split('@')[0];
    return '';
}

async function formatParticipantsLine(deal) {
    const parts = (deal.participants || []).filter((p) => (p.status || 'active') !== 'dropped');
    if (!parts.length) return '—';
    const ds = typeof dataService !== 'undefined' ? dataService : window.dataService;
    const slice = parts.slice(0, 4);
    if (!ds || typeof ds.getUserOrCompanyById !== 'function') {
        return slice.map((p) => p.userId).join(', ') + (parts.length > 4 ? '…' : '');
    }
    const labels = await Promise.all(
        slice.map(async (p) => {
            if (!p || !p.userId) return '';
            try {
                const ent = await ds.getUserOrCompanyById(p.userId);
                const label = participantEntityLabel(ent);
                return label || p.userId;
            } catch {
                return p.userId;
            }
        })
    );
    const line = labels.filter(Boolean).join(', ');
    return (line || '—') + (parts.length > 4 ? '…' : '');
}

function renderDealsEmpty(opts) {
    const title = escapeHtml(opts.title || '');
    const body = opts.bodyHtml;
    const actions = opts.actionsHtml || '';
    return (
        '<div class="deals-empty" role="status">' +
        '<p class="deals-empty__title">' +
        title +
        '</p>' +
        '<p class="deals-empty__text">' +
        body +
        '</p>' +
        (actions ? '<div class="deals-empty__actions">' + actions + '</div>' : '') +
        '</div>'
    );
}

function readLifecycleFilterFromUi() {
    const sel = document.getElementById('deals-lifecycle-filter');
    if (sel && sel.value) return sel.value;
    return dealsLifecycleFilter;
}

function applyDealsFilter(list, filter) {
    if (!filter || filter === 'all') return list;
    if (filter === 'in_progress') return list.filter((d) => DEAL_PROGRESS_STATUSES.includes(d.status));
    return list.filter((d) => (d.status || '') === filter);
}

async function loadDealsList() {
    const container = document.getElementById('deals-list');
    const summaryEl = document.getElementById('deals-summary');
    if (!container) return;

    const user = authService.getCurrentUser();
    if (!user) {
        if (summaryEl) summaryEl.textContent = '';
        container.innerHTML = renderDealsEmpty({
            title: 'Sign in required',
            bodyHtml: 'Log in to see deals where you are a participant.',
            actionsHtml: ''
        });
        return;
    }

    container.innerHTML = '<div class="spinner"></div>';
    if (summaryEl) summaryEl.textContent = 'Loading…';

    const matchesRoute = typeof CONFIG !== 'undefined' && CONFIG.ROUTES ? CONFIG.ROUTES.MATCHES : '/matches';
    dealsLifecycleFilter = readLifecycleFilterFromUi();

    try {
        const allDeals = await dataService.getDealsByUserId(user.id);
        const list = Array.isArray(allDeals) ? [...allDeals] : [];
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        const deals = applyDealsFilter(list, dealsLifecycleFilter);

        if (summaryEl) {
            if (list.length === 0) {
                summaryEl.textContent = '';
            } else if (dealsLifecycleFilter === 'all') {
                summaryEl.textContent = list.length + ' deal' + (list.length === 1 ? '' : 's');
            } else {
                summaryEl.textContent =
                    'Showing ' + deals.length + ' of ' + list.length + ' deal' + (list.length === 1 ? '' : 's');
            }
        }

        if (list.length === 0) {
            container.innerHTML = renderDealsEmpty({
                title: 'No deals yet',
                bodyHtml:
                    'When you move forward from a match or an accepted application, your Deal Workspace will show up here.',
                actionsHtml:
                    '<a href="#" data-route="' +
                    escapeHtml(matchesRoute) +
                    '" class="btn btn-primary btn-sm">Go to matches</a>'
            });
            return;
        }

        if (deals.length === 0) {
            container.innerHTML = renderDealsEmpty({
                title: 'No deals for this filter',
                bodyHtml: 'Try <strong>All deals</strong> or another lifecycle stage.',
                actionsHtml: ''
            });
            return;
        }

        const dealsBase = typeof CONFIG !== 'undefined' && CONFIG.ROUTES ? CONFIG.ROUTES.DEALS : '/deals';

        const enriched = await Promise.all(
            deals.map(async (deal) => {
                const contract = deal.contractId ? await dataService.getContractById(deal.contractId) : null;
                const hint =
                    window.DealContractFlowUi && typeof window.DealContractFlowUi.getDealNextActionHint === 'function'
                        ? window.DealContractFlowUi.getDealNextActionHint(deal, contract, user.id)
                        : '';
                const parties = dataService.getContractParties ? dataService.getContractParties(contract || { parties: [] }) : [];
                const signedN = contract ? parties.filter((p) => p.signedAt).length : 0;
                const totalN = contract ? parties.length : 0;
                const participantsLine = escapeHtml(await formatParticipantsLine(deal));
                return { deal, contract, hint, signedN, totalN, participantsLine };
            })
        );

        container.innerHTML = enriched
            .map(({ deal, contract, hint, signedN, totalN, participantsLine }) => {
                const statusLabel = getDealStatusLabel(deal.status);
                const statusClass = getDealStatusBadgeClass(deal.status);
                const typeLabel = getMatchTypeLabel(deal.matchType);
                const typeIcon = getMatchTypeIconClass(deal.matchType);
                const route = dealsBase + '/' + deal.id;
                const updated = formatDealDate(deal.updatedAt);
                const updatedHtml = updated ? '<p class="deal-card__updated">Updated ' + escapeHtml(updated) + '</p>' : '';
                const contractLine = contract
                    ? '<span class="badge ' +
                      getContractStatusBadgeClass(contract.status) +
                      '">' +
                      escapeHtml(getContractStatusLabel(contract.status)) +
                      '</span>' +
                      (contract.status === 'pending' && totalN ? ' · Signed ' + signedN + '/' + totalN : '')
                    : '<span class="text-muted">No contract</span>';
                const nextHtml = hint
                    ? '<p class="deal-card__next"><strong>Next:</strong> ' + escapeHtml(hint) + '</p>'
                    : '<p class="deal-card__next text-muted">—</p>';
                const valueLine = escapeHtml(formatValueLine(deal));

                return (
                    '<article class="deal-card" role="listitem">' +
                    '<div class="deal-card__top">' +
                    '<div class="deal-card__title-row">' +
                    '<h3 class="deal-card__title">' +
                    escapeHtml(deal.title || 'Deal') +
                    '</h3>' +
                    '<span class="badge ' +
                    statusClass +
                    '">' +
                    escapeHtml(statusLabel) +
                    '</span>' +
                    '</div>' +
                    '<p class="deal-card__type">' +
                    '<i class="' +
                    escapeHtml(typeIcon) +
                    '" aria-hidden="true"></i> ' +
                    escapeHtml(typeLabel) +
                    '</p>' +
                    '</div>' +
                    '<div class="deal-card__body">' +
                    '<p class="deal-card__meta"><strong>Participants</strong> · ' +
                    participantsLine +
                    '</p>' +
                    '<p class="deal-card__meta"><strong>Value</strong> · ' +
                    valueLine +
                    '</p>' +
                    '<p class="deal-card__meta"><strong>Contract</strong> · ' +
                    contractLine +
                    '</p>' +
                    nextHtml +
                    updatedHtml +
                    '</div>' +
                    '<div class="deal-card__actions">' +
                    '<a href="#" data-route="' +
                    escapeHtml(route) +
                    '" class="btn btn-primary btn-sm">View Deal</a>' +
                    (deal.contractId
                        ? '<a href="#" data-route="/contracts/' +
                          escapeHtml(deal.contractId) +
                          '" class="btn btn-outline btn-sm">View Contract</a>'
                        : '') +
                    '</div>' +
                    '</article>'
                );
            })
            .join('');
    } catch (e) {
        console.error('Deals load error:', e);
        if (summaryEl) summaryEl.textContent = '';
        container.innerHTML = renderDealsEmpty({
            title: 'Could not load deals',
            bodyHtml: 'Something went wrong. Check your connection and try again.',
            actionsHtml:
                '<button type="button" class="btn btn-secondary btn-sm" id="deals-retry-btn">Try again</button>'
        });
        document.getElementById('deals-retry-btn')?.addEventListener('click', () => {
            loadDealsList();
        });
    }
}

async function initDeals() {
    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.deals);
    }

    const sel = document.getElementById('deals-lifecycle-filter');
    if (sel) {
        sel.value = dealsLifecycleFilter;
        sel.addEventListener('change', () => {
            dealsLifecycleFilter = sel.value;
            loadDealsList();
        });
    }

    document.getElementById('page-cta-deals-active')?.addEventListener('click', (e) => {
        e.preventDefault();
        dealsLifecycleFilter = 'in_progress';
        if (sel) sel.value = 'in_progress';
        loadDealsList().then(() => {
            document.getElementById('deals-panel-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    await loadDealsList();
}
