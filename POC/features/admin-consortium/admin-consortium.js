/**
 * Admin Consortium — same shell as admin opportunities: hero, stage tabs, search, card list.
 * Lists consortium deals only; cards surface lead, members, dropped, and replacements.
 */

const CONSORTIUM_DEAL_STATUS_GROUPS = {
    early: ['draft', 'review', 'negotiating'],
    signing: ['signing'],
    live: ['active', 'execution', 'delivery'],
    closed: ['completed', 'closed', 'cancelled']
};

const CONSORTIUM_QUEUE_TITLES = {
    '': 'All consortium deals',
    early: 'Early-stage consortium deals',
    signing: 'Consortium deals in signing',
    live: 'Live consortium deals',
    closed: 'Closed consortium deals'
};

const adminConsortiumState = {
    items: [],
    userMap: {},
    statusGroup: '',
    sort: 'newest',
    search: ''
};

function aconEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function aconSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getParticipantRole(deal, p) {
    if (deal.roleSlots && deal.roleSlots[p.userId]) return deal.roleSlots[p.userId];
    const roles = (deal.payload && deal.payload.roles) || [];
    const r = roles.find(x => x.userId === p.userId);
    return (r && r.role) || (p.role === 'consortium_lead' ? 'Lead' : 'Member');
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
        execution: 'Execution',
        delivery: 'Delivery',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return map[s] || s;
}

function aconFormatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function consortiumDealCardStatusClass(status) {
    const s = status || 'draft';
    if (['negotiating'].includes(s)) return 'ao-card-status--negotiation';
    if (['draft', 'review'].includes(s)) return 'ao-card-status--draft';
    if (['signing'].includes(s)) return 'ao-card-status--progress';
    if (['active', 'execution', 'delivery'].includes(s)) return 'ao-card-status--progress';
    if (['completed'].includes(s)) return 'ao-card-status--completed';
    if (['closed', 'cancelled'].includes(s)) return 'ao-card-status--closed';
    return 'ao-card-status--draft';
}

function analyzeConsortiumDeal(d, userMap) {
    const participants = d.participants || [];
    const lead = participants.find(
        p =>
            (p.role || '') === 'consortium_lead' ||
            String(getParticipantRole(d, p) || '')
                .toLowerCase()
                .includes('lead')
    );
    const replacementUserIds = new Set(participants.filter(p => p.replacedByUserId).map(p => p.replacedByUserId));
    const replacements = participants.filter(p => replacementUserIds.has(p.userId));
    const dropped = participants.filter(p => (p.status || 'active') === 'dropped');
    const members = participants.filter(p => p !== lead);
    const activeMembers = members.filter(p => (p.status || 'active') !== 'dropped');

    const nameOf = uid => userMap[uid] || uid;
    const leadName = lead ? nameOf(lead.userId) : '—';
    const memberNames = activeMembers.map(p => nameOf(p.userId));

    let desc = `Lead: ${leadName}.`;
    if (memberNames.length) {
        const shown = memberNames.slice(0, 5);
        const more = memberNames.length > 5 ? ` +${memberNames.length - 5} more` : '';
        desc += ` Active members (${memberNames.length}): ${shown.join(', ')}${more}.`;
    } else {
        desc += ' No active members listed.';
    }
    if (dropped.length) {
        desc += ` Dropped (${dropped.length}): ${dropped
            .map(p => nameOf(p.userId))
            .slice(0, 4)
            .join(', ')}${dropped.length > 4 ? '…' : ''}.`;
    }
    if (replacements.length) {
        desc += ` Replacements (${replacements.length}): ${replacements
            .map(p => nameOf(p.userId))
            .join(', ')}.`;
    }

    return {
        lead,
        leadName,
        activeMembers,
        dropped,
        replacements,
        desc
    };
}

function getAdminConsortiumVisible() {
    const { items, statusGroup, search, sort } = adminConsortiumState;
    let list = items.slice();

    if (statusGroup) {
        const allowed = CONSORTIUM_DEAL_STATUS_GROUPS[statusGroup] || [];
        list = list.filter(d => allowed.includes(d.status || 'draft'));
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

function updateAdminConsortiumSummary() {
    const items = adminConsortiumState.items;
    const total = items.length;

    const inGroup = group => {
        const allowed = CONSORTIUM_DEAL_STATUS_GROUPS[group] || [];
        return items.filter(d => allowed.includes(d.status || 'draft')).length;
    };

    aconSetText('acon-stat-total', String(total));
    aconSetText('acon-stat-early', String(inGroup('early')));
    aconSetText('acon-stat-signing', String(inGroup('signing')));
    aconSetText('acon-stat-live', String(inGroup('live')));
    aconSetText('acon-stat-closed', String(inGroup('closed')));

    aconSetText('acon-chip-all', String(total));
    aconSetText('acon-chip-early', String(inGroup('early')));
    aconSetText('acon-chip-signing', String(inGroup('signing')));
    aconSetText('acon-chip-live', String(inGroup('live')));
    aconSetText('acon-chip-closed', String(inGroup('closed')));
}

function syncAdminConsortiumTabs() {
    document.querySelectorAll('[data-acon-status]').forEach(b => {
        const value = b.getAttribute('data-acon-status') || '';
        const isOn = value === adminConsortiumState.statusGroup;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function renderConsortiumDealCard(d) {
    const userMap = adminConsortiumState.userMap;
    const id = aconEscape(d.id);
    const status = d.status || 'draft';
    const analysis = analyzeConsortiumDeal(d, userMap);
    const { activeMembers, dropped, replacements } = analysis;

    const auditBase =
        typeof CONFIG !== 'undefined' && CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_AUDIT ? CONFIG.ROUTES.ADMIN_AUDIT : '/admin/audit';
    const dealRoute = di => (CONFIG.ROUTES.ADMIN_DEAL_DETAIL || '/admin/deals/:id').replace(':id', di);
    const auditDealRoute = di => auditBase + '?entityType=deal&entityId=' + encodeURIComponent(di);

    const meta = [];
    meta.push('<span class="ao-meta-chip ao-meta-chip--consortium">Consortium</span>');
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-users" aria-hidden="true"></i>
            <strong>${activeMembers.length}</strong>&nbsp;active member${activeMembers.length === 1 ? '' : 's'}
        </span>`);
    if (dropped.length) {
        meta.push(`<span class="ao-meta-chip ao-meta-chip--warn">${dropped.length} dropped</span>`);
    }
    if (replacements.length) {
        meta.push(`<span class="ao-meta-chip ao-meta-chip--ok">${replacements.length} replacement${replacements.length === 1 ? '' : 's'}</span>`);
    }
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-clock" aria-hidden="true"></i>
            ${aconEscape(aconFormatDate(d.createdAt))}
        </span>`);

    const actions = [];
    actions.push(`<a href="#" data-route="${dealRoute(d.id)}" class="ao-action ao-action--primary">
        <i class="ph-duotone ph-arrow-right" aria-hidden="true"></i>
        View deal
    </a>`);
    actions.push(`<a href="#" data-route="${auditDealRoute(d.id)}" class="ao-action">
        <i class="ph-duotone ph-list-checks" aria-hidden="true"></i>
        Audit
    </a>`);

    return `
    <article class="ao-card" data-deal-id="${id}">
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${aconEscape(d.title || d.id)}</h3>
                <span class="ao-card-status ${consortiumDealCardStatusClass(status)}">
                    <span class="ao-card-status-dot"></span>
                    ${aconEscape(getDealStatusLabel(status))}
                </span>
            </div>
            <p class="ao-card-desc">${aconEscape(analysis.desc)}</p>
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta.join('')}</div>
                <div class="ao-card-actions">${actions.join('')}</div>
            </div>
        </div>
    </article>`;
}

function renderAdminConsortiumList() {
    updateAdminConsortiumSummary();
    syncAdminConsortiumTabs();

    const container = document.getElementById('acon-list');
    const metaEl = document.getElementById('acon-list-meta');
    const titleEl = document.getElementById('acon-list-title');
    if (titleEl) titleEl.textContent = CONSORTIUM_QUEUE_TITLES[adminConsortiumState.statusGroup] || 'All consortium deals';
    if (!container) return;

    const visible = getAdminConsortiumVisible();
    const total = adminConsortiumState.items.length;

    if (metaEl) {
        if (total === 0) {
            metaEl.textContent = 'No consortium deals on the platform yet.';
        } else {
            metaEl.textContent = `Showing ${visible.length} of ${total} consortium deal${total === 1 ? '' : 's'}`;
        }
    }

    if (visible.length === 0) {
        const isEmpty = total === 0;
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon">
                    <i class="ph-duotone ${isEmpty ? 'ph-handshake' : 'ph-funnel-x'}" aria-hidden="true"></i>
                </div>
                <p class="ao-empty-title">${isEmpty ? 'No consortium deals' : 'No matches for these filters'}</p>
                <p class="ao-empty-desc">${
                    isEmpty
                        ? 'When multi-party consortium deals are created, they will appear here with lead, members, and roster changes.'
                        : 'Try clearing the stage filter or search.'
                }</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderConsortiumDealCard).join('');

    container.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route && router) router.navigate(route);
        });
    });
}

function setupAdminConsortiumFilters() {
    document.querySelectorAll('[data-acon-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminConsortiumState.statusGroup = btn.getAttribute('data-acon-status') || '';
            renderAdminConsortiumList();
        });
    });

    document.querySelectorAll('[data-acon-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminConsortiumState.statusGroup = btn.getAttribute('data-acon-jump') || '';
            renderAdminConsortiumList();
            const toolbar = document.querySelector('.ao-toolbar');
            if (toolbar && toolbar.scrollIntoView) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const sortEl = document.getElementById('acon-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminConsortiumState.sort = e.target.value || 'newest';
            renderAdminConsortiumList();
        });
    }

    const searchEl = document.getElementById('acon-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminConsortiumState.search = (e.target.value || '').toLowerCase().trim();
                renderAdminConsortiumList();
            }, 120);
        });
    }
}

async function loadAdminConsortiumDeals() {
    const container = document.getElementById('acon-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const allDeals = await dataService.getDeals();
        const deals = (allDeals || []).filter(d => (d.matchType || '') === 'consortium');
        deals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const userIds = new Set();
        deals.forEach(d => (d.participants || []).forEach(p => userIds.add(p.userId)));

        const userMap = {};
        for (const uid of userIds) {
            const u = await dataService.getUserOrCompanyById(uid);
            userMap[uid] = u?.profile?.name || u?.email || uid;
        }

        adminConsortiumState.items = deals;
        adminConsortiumState.userMap = userMap;
        renderAdminConsortiumList();
    } catch (err) {
        console.error('Admin consortium load error:', err);
        if (container) {
            container.innerHTML = `
                <div class="ao-empty">
                    <div class="ao-empty-icon"><i class="ph-duotone ph-warning-octagon" aria-hidden="true"></i></div>
                    <p class="ao-empty-title">Couldn’t load consortium deals</p>
                    <p class="ao-empty-desc">Please refresh the page or try again later.</p>
                </div>`;
        }
    }
}

async function initAdminConsortium() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminConsortium
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminConsortium);
    }

    setupAdminConsortiumFilters();
    await loadAdminConsortiumDeals();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}
