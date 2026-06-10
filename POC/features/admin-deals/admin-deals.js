/**
 * Admin Deals — same visual model as admin opportunities: hero, status tabs, search, card list.
 */

const DEAL_STATUS_GROUPS = {
    early: ['draft', 'review', 'negotiating'],
    signing: ['signing'],
    live: ['active', 'execution', 'delivery'],
    closed: ['completed', 'closed', 'cancelled']
};

const DEAL_QUEUE_TITLES = {
    '': 'All deals',
    early: 'Early-stage deals',
    signing: 'Deals in signing',
    live: 'Live deals',
    closed: 'Closed deals'
};

const adminDealState = {
    items: [],
    statusGroup: '',
    dealType: '',
    sort: 'newest',
    search: ''
};

function adEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function adSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getDealStatusLabel(s) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function') {
        return window.statusBadgeSystem.getStatusLabel(s, 'deal');
    }
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getDealStatusDisplayLabel === 'function') return ui.getDealStatusDisplayLabel(s);
    return s || '—';
}

function getContractStatusLabel(s) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function') {
        return window.statusBadgeSystem.getStatusLabel(s, 'contract');
    }
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getContractStatusDisplayLabel === 'function') return ui.getContractStatusDisplayLabel(s);
    return s || '—';
}

function renderAdminDealStatusBadge(status) {
    const sb = window.statusBadgeSystem;
    if (sb && typeof sb.renderStatusBadge === 'function') {
        return sb.renderStatusBadge(status, 'deal');
    }
    return `<span class="badge badge--neutral">${adEscape(getDealStatusLabel(status))}</span>`;
}

function getDealTypeLabel(matchType) {
    const map = { one_way: 'One Way', two_way: 'Barter', consortium: 'Consortium', circular: 'Circular' };
    return map[matchType] || matchType || '—';
}

function adFormatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAdminDealsVisible() {
    const { items, statusGroup, dealType, search, sort } = adminDealState;
    let list = items.slice();

    if (statusGroup) {
        const allowed = DEAL_STATUS_GROUPS[statusGroup] || [];
        list = list.filter(d => allowed.includes(d.status || 'draft'));
    }
    if (dealType) {
        list = list.filter(d => (d.matchType || 'one_way') === dealType);
    }
    if (search) {
        list = list.filter(d => {
            const oppId = d.opportunityId || (d.opportunityIds && d.opportunityIds[0]);
            const haystack = [d.title, d.id, oppId].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }

    const titleKey = d => (d.title || '').toLowerCase();
    list.sort((a, b) => {
        if (sort === 'title') {
            return titleKey(a).localeCompare(titleKey(b));
        }
        const da = new Date(a.createdAt).getTime() || 0;
        const db = new Date(b.createdAt).getTime() || 0;
        return sort === 'oldest' ? da - db : db - da;
    });

    return list;
}

function updateAdminDealsSummary() {
    const items = adminDealState.items;
    const total = items.length;

    const inGroup = group => {
        const allowed = DEAL_STATUS_GROUPS[group] || [];
        return items.filter(d => allowed.includes(d.status || 'draft')).length;
    };

    adSetText('ad-stat-total', String(total));
    adSetText('ad-stat-early', String(inGroup('early')));
    adSetText('ad-stat-signing', String(inGroup('signing')));
    adSetText('ad-stat-live', String(inGroup('live')));
    adSetText('ad-stat-closed', String(inGroup('closed')));

    adSetText('ad-chip-all', String(total));
    adSetText('ad-chip-early', String(inGroup('early')));
    adSetText('ad-chip-signing', String(inGroup('signing')));
    adSetText('ad-chip-live', String(inGroup('live')));
    adSetText('ad-chip-closed', String(inGroup('closed')));
}

function syncAdminDealsTabs() {
    document.querySelectorAll('[data-ad-status]').forEach(b => {
        const value = b.getAttribute('data-ad-status') || '';
        const isOn = value === adminDealState.statusGroup;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function renderAdminDealCard(d) {
    const id = adEscape(d.id);
    const status = d.status || 'draft';
    const oppId = d.opportunityId || (d.opportunityIds && d.opportunityIds[0]);
    const participants = d.participants || [];
    const partCount = participants.length;
    const contractStatus = d._contractStatus;
    const cid = d._contractId;

    const auditBase = (typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_AUDIT) ? CONFIG.ROUTES.ADMIN_AUDIT : '/admin/audit';
    const dealRoute = di => (CONFIG.ROUTES.ADMIN_DEAL_DETAIL || '/admin/deals/:id').replace(':id', di);
    const auditDealRoute = di => auditBase + '?entityType=deal&entityId=' + encodeURIComponent(di);
    const oppRoute = oid => (CONFIG.ROUTES.OPPORTUNITY_DETAIL || '/opportunities/:id').replace(':id', oid);
    const contractDetailRoute = coid => (CONFIG.ROUTES.ADMIN_CONTRACT_DETAIL || '/admin/contracts/:id').replace(':id', coid);

    const meta = [];
    meta.push(`<span class="ao-meta-chip">${adEscape(getDealTypeLabel(d.matchType))}</span>`);
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-users" aria-hidden="true"></i>
            <strong>${partCount}</strong>&nbsp;participant${partCount === 1 ? '' : 's'}
        </span>`);
    if (oppId) {
        meta.push(`
            <span class="ao-meta-item">
                <i class="ph-duotone ph-briefcase" aria-hidden="true"></i>
                Opp.&nbsp;<strong>${adEscape(oppId)}</strong>
            </span>`);
    }
    if (contractStatus && contractStatus !== '—') {
        meta.push(`
            <span class="ao-meta-item">
                <i class="ph-duotone ph-file-text" aria-hidden="true"></i>
                ${adEscape(getContractStatusLabel(contractStatus))}
            </span>`);
    }
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-clock" aria-hidden="true"></i>
            ${adEscape(adFormatDate(d.createdAt))}
        </span>`);

    const actions = [];
    actions.push(`<a href="#" data-route="${dealRoute(d.id)}" class="ao-action ao-action--primary">
        <i class="ph-duotone ph-arrow-right" aria-hidden="true"></i>
        View deal
    </a>`);
    if (cid) {
        actions.push(`<a href="#" data-route="${contractDetailRoute(cid)}" class="ao-action">
            <i class="ph-duotone ph-file-text" aria-hidden="true"></i>
            Contract
        </a>`);
    }
    if (oppId) {
        actions.push(`<a href="#" data-route="${oppRoute(oppId)}" class="ao-action">
            <i class="ph-duotone ph-briefcase" aria-hidden="true"></i>
            Opportunity
        </a>`);
    }
    actions.push(`<a href="#" data-route="${auditDealRoute(d.id)}" class="ao-action">
        <i class="ph-duotone ph-list-checks" aria-hidden="true"></i>
        Audit
    </a>`);

    const desc = d.notes || d.description || '';

    return `
    <article class="ao-card" data-deal-id="${id}">
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${adEscape(d.title || d.id)}</h3>
                ${renderAdminDealStatusBadge(status)}
            </div>
            ${desc ? `<p class="ao-card-desc">${adEscape(desc)}</p>` : ''}
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta.join('')}</div>
                <div class="ao-card-actions">${actions.join('')}</div>
            </div>
        </div>
    </article>`;
}

function renderAdminDealsList() {
    updateAdminDealsSummary();
    syncAdminDealsTabs();

    const container = document.getElementById('ad-list');
    const metaEl = document.getElementById('ad-list-meta');
    const titleEl = document.getElementById('ad-list-title');
    if (titleEl) titleEl.textContent = DEAL_QUEUE_TITLES[adminDealState.statusGroup] || 'All deals';
    if (!container) return;

    const visible = getAdminDealsVisible();
    const total = adminDealState.items.length;

    if (metaEl) {
        if (total === 0) {
            metaEl.textContent = 'No deals have been created yet.';
        } else {
            metaEl.textContent = `Showing ${visible.length} of ${total} deal${total === 1 ? '' : 's'}`;
        }
    }

    if (visible.length === 0) {
        const isEmpty = total === 0;
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon">
                    <i class="ph-duotone ${isEmpty ? 'ph-handshake' : 'ph-funnel-x'}" aria-hidden="true"></i>
                </div>
                <p class="ao-empty-title">${isEmpty ? 'No deals yet' : 'No matches for these filters'}</p>
                <p class="ao-empty-desc">${
                    isEmpty
                        ? 'When collaborations progress to a deal, they will show up here for monitoring.'
                        : 'Try clearing the stage filter, deal type, or search.'
                }</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderAdminDealCard).join('');

    container.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route && router) router.navigate(route);
        });
    });
}

function setupAdminDealsFilters() {
    document.querySelectorAll('[data-ad-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminDealState.statusGroup = btn.getAttribute('data-ad-status') || '';
            renderAdminDealsList();
        });
    });

    document.querySelectorAll('[data-ad-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminDealState.statusGroup = btn.getAttribute('data-ad-jump') || '';
            renderAdminDealsList();
            const toolbar = document.querySelector('.ao-toolbar');
            if (toolbar && toolbar.scrollIntoView) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const typeEl = document.getElementById('ad-filter-type');
    if (typeEl) {
        typeEl.addEventListener('change', e => {
            adminDealState.dealType = e.target.value || '';
            renderAdminDealsList();
        });
    }

    const sortEl = document.getElementById('ad-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminDealState.sort = e.target.value || 'newest';
            renderAdminDealsList();
        });
    }

    const searchEl = document.getElementById('ad-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminDealState.search = (e.target.value || '').toLowerCase().trim();
                renderAdminDealsList();
            }, 120);
        });
    }
}

async function loadAdminDeals() {
    const container = document.getElementById('ad-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        let deals = await dataService.getDeals();
        deals = deals || [];

        const enriched = await Promise.all(
            deals.map(async d => {
                let _contractStatus = '—';
                let _contractId = null;
                if (d.contractId) {
                    _contractId = d.contractId;
                    const c = await dataService.getContractById(d.contractId);
                    _contractStatus = c ? c.status || '—' : '—';
                }
                return { ...d, _contractStatus, _contractId };
            })
        );

        enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        adminDealState.items = enriched;
        renderAdminDealsList();
    } catch (err) {
        console.error('Admin deals load error:', err);
        if (container) {
            container.innerHTML = `
                <div class="ao-empty">
                    <div class="ao-empty-icon"><i class="ph-duotone ph-warning-octagon" aria-hidden="true"></i></div>
                    <p class="ao-empty-title">Couldn’t load deals</p>
                    <p class="ao-empty-desc">Please refresh the page or try again later.</p>
                </div>`;
        }
    }
}

async function initAdminDeals() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminDeals
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminDeals);
    }

    setupAdminDealsFilters();
    await loadAdminDeals();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}
