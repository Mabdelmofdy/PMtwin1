/**
 * Admin Contracts — same visual model as admin opportunities: hero, status tabs, search, card list.
 */

const CONTRACT_STATUS_GROUPS = {
    pending: ['pending'],
    active: ['active'],
    completed: ['completed'],
    terminated: ['terminated']
};

const CONTRACT_QUEUE_TITLES = {
    '': 'All contracts',
    pending: 'Pending signature',
    active: 'Active contracts',
    completed: 'Completed contracts',
    terminated: 'Terminated contracts'
};

const adminContractState = {
    items: [],
    statusGroup: '',
    sort: 'newest',
    search: ''
};

function acEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function acSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getContractStatusLabel(s) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function') {
        return window.statusBadgeSystem.getStatusLabel(s, 'contract');
    }
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getContractStatusDisplayLabel === 'function') return ui.getContractStatusDisplayLabel(s);
    return s || '—';
}

function renderAdminContractStatusBadge(status) {
    const sb = window.statusBadgeSystem;
    if (sb && typeof sb.renderStatusBadge === 'function') {
        return sb.renderStatusBadge(status, 'contract');
    }
    return `<span class="badge badge--neutral">${acEscape(getContractStatusLabel(status))}</span>`;
}

function acFormatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAdminContractsVisible() {
    const { items, statusGroup, search, sort } = adminContractState;
    let list = items.slice();

    if (statusGroup) {
        const allowed = CONTRACT_STATUS_GROUPS[statusGroup] || [];
        list = list.filter(c => allowed.includes(c.status || 'pending'));
    }
    if (search) {
        list = list.filter(c => {
            const scope = c.scope || c.id || '';
            const dealTitle = c._dealTitle || '';
            const haystack = [scope, c.id, dealTitle].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }

    const titleKey = c => (c.scope || c.id || '').toLowerCase();
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

function updateAdminContractsSummary() {
    const items = adminContractState.items;
    const total = items.length;

    const inGroup = group => {
        const allowed = CONTRACT_STATUS_GROUPS[group] || [];
        return items.filter(c => allowed.includes(c.status || 'pending')).length;
    };

    acSetText('ac-stat-total', String(total));
    acSetText('ac-stat-pending', String(inGroup('pending')));
    acSetText('ac-stat-active', String(inGroup('active')));
    acSetText('ac-stat-completed', String(inGroup('completed')));
    acSetText('ac-stat-terminated', String(inGroup('terminated')));

    acSetText('ac-chip-all', String(total));
    acSetText('ac-chip-pending', String(inGroup('pending')));
    acSetText('ac-chip-active', String(inGroup('active')));
    acSetText('ac-chip-completed', String(inGroup('completed')));
    acSetText('ac-chip-terminated', String(inGroup('terminated')));
}

function syncAdminContractsTabs() {
    document.querySelectorAll('[data-ac-status]').forEach(b => {
        const value = b.getAttribute('data-ac-status') || '';
        const isOn = value === adminContractState.statusGroup;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function renderAdminContractCard(c) {
    const id = acEscape(c.id);
    const status = c.status || 'pending';
    const parties = dataService.getContractParties(c);
    const signedN = parties.filter(p => p.signedAt).length;
    const scope = c.scope || c.id;
    const val =
        c.agreedValue != null
            ? typeof c.agreedValue === 'object'
                ? JSON.stringify(c.agreedValue)
                : String(c.agreedValue)
            : '—';
    const valShort = val.length > 80 ? val.slice(0, 80) + '…' : val;

    const auditBase = (typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_AUDIT) ? CONFIG.ROUTES.ADMIN_AUDIT : '/admin/audit';
    const contractDetailRoute = cid => (CONFIG.ROUTES.ADMIN_CONTRACT_DETAIL || '/admin/contracts/:id').replace(':id', cid);
    const dealRoute = did => (CONFIG.ROUTES.ADMIN_DEAL_DETAIL || '/admin/deals/:id').replace(':id', did);
    const auditContractRoute = cid => auditBase + '?entityType=contract&entityId=' + encodeURIComponent(cid);

    const meta = [];
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-users" aria-hidden="true"></i>
            <strong>${parties.length}</strong>&nbsp;part${parties.length === 1 ? 'y' : 'ies'}
        </span>`);
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-signature" aria-hidden="true"></i>
            Signed <strong>${signedN}</strong>/${parties.length}
        </span>`);
    if (c.dealId && c._dealTitle) {
        meta.push(`
            <span class="ao-meta-item">
                <i class="ph-duotone ph-handshake" aria-hidden="true"></i>
                ${acEscape(c._dealTitle)}
            </span>`);
    }
    meta.push(`
        <span class="ao-meta-item" title="${acEscape(val)}">
            <i class="ph-duotone ph-coins" aria-hidden="true"></i>
            ${acEscape(valShort)}
        </span>`);
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-calendar-check" aria-hidden="true"></i>
            ${acEscape(c.signedAt ? acFormatDate(c.signedAt) : 'Not fully signed')}
        </span>`);

    const actions = [];
    actions.push(`<a href="#" data-route="${contractDetailRoute(c.id)}" class="ao-action ao-action--primary">
        <i class="ph-duotone ph-arrow-right" aria-hidden="true"></i>
        View contract
    </a>`);
    if (c.dealId) {
        actions.push(`<a href="#" data-route="${dealRoute(c.dealId)}" class="ao-action">
            <i class="ph-duotone ph-handshake" aria-hidden="true"></i>
            View deal
        </a>`);
    }
    actions.push(`<a href="#" data-route="${auditContractRoute(c.id)}" class="ao-action">
        <i class="ph-duotone ph-list-checks" aria-hidden="true"></i>
        Audit
    </a>`);

    return `
    <article class="ao-card" data-contract-id="${id}">
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${acEscape(scope)}</h3>
                ${renderAdminContractStatusBadge(status)}
            </div>
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta.join('')}</div>
                <div class="ao-card-actions">${actions.join('')}</div>
            </div>
        </div>
    </article>`;
}

function renderAdminContractsList() {
    updateAdminContractsSummary();
    syncAdminContractsTabs();

    const container = document.getElementById('ac-list');
    const metaEl = document.getElementById('ac-list-meta');
    const titleEl = document.getElementById('ac-list-title');
    if (titleEl) titleEl.textContent = CONTRACT_QUEUE_TITLES[adminContractState.statusGroup] || 'All contracts';
    if (!container) return;

    const visible = getAdminContractsVisible();
    const total = adminContractState.items.length;

    if (metaEl) {
        if (total === 0) {
            metaEl.textContent = 'No contracts have been created yet.';
        } else {
            metaEl.textContent = `Showing ${visible.length} of ${total} contract${total === 1 ? '' : 's'}`;
        }
    }

    if (visible.length === 0) {
        const isEmpty = total === 0;
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon">
                    <i class="ph-duotone ${isEmpty ? 'ph-file-text' : 'ph-funnel-x'}" aria-hidden="true"></i>
                </div>
                <p class="ao-empty-title">${isEmpty ? 'No contracts yet' : 'No matches for these filters'}</p>
                <p class="ao-empty-desc">${
                    isEmpty
                        ? 'When deals generate agreements, they will appear here for review.'
                        : 'Try clearing the status filter or search.'
                }</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderAdminContractCard).join('');

    container.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route && router) router.navigate(route);
        });
    });
}

function setupAdminContractsFilters() {
    document.querySelectorAll('[data-ac-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminContractState.statusGroup = btn.getAttribute('data-ac-status') || '';
            renderAdminContractsList();
        });
    });

    document.querySelectorAll('[data-ac-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminContractState.statusGroup = btn.getAttribute('data-ac-jump') || '';
            renderAdminContractsList();
            const toolbar = document.querySelector('.ao-toolbar');
            if (toolbar && toolbar.scrollIntoView) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const sortEl = document.getElementById('ac-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminContractState.sort = e.target.value || 'newest';
            renderAdminContractsList();
        });
    }

    const searchEl = document.getElementById('ac-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminContractState.search = (e.target.value || '').toLowerCase().trim();
                renderAdminContractsList();
            }, 120);
        });
    }
}

async function loadAdminContracts() {
    const container = document.getElementById('ac-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        let contracts = await dataService.getContracts();
        contracts = contracts || [];

        const enriched = await Promise.all(
            contracts.map(async c => {
                let _dealTitle = '';
                if (c.dealId) {
                    const deal = await dataService.getDealById(c.dealId);
                    _dealTitle = deal ? deal.title || c.dealId : c.dealId;
                }
                return { ...c, _dealTitle };
            })
        );

        enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        adminContractState.items = enriched;
        renderAdminContractsList();
    } catch (err) {
        console.error('Admin contracts load error:', err);
        if (container) {
            container.innerHTML = `
                <div class="ao-empty">
                    <div class="ao-empty-icon"><i class="ph-duotone ph-warning-octagon" aria-hidden="true"></i></div>
                    <p class="ao-empty-title">Couldn’t load contracts</p>
                    <p class="ao-empty-desc">Please refresh the page or try again later.</p>
                </div>`;
        }
    }
}

async function initAdminContracts() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminContracts
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminContracts);
    }

    setupAdminContractsFilters();
    await loadAdminContracts();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}
