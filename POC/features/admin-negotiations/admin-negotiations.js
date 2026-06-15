/**
 * Admin Negotiations — command center list with attention queues.
 */

const AN_QUEUE_TITLES = {
    '': 'All negotiations',
    active: 'Active negotiations',
    stalled: 'Stalled negotiations',
    expiring: 'Expiring soon',
    disputed: 'Active disputes',
    agreed: 'Terms agreed',
    agreed_no_deal: 'Agreed — no deal yet',
    terminal: 'Ended negotiations'
};

const adminNegState = {
    rows: [],
    queue: '',
    search: '',
    sort: 'activity'
};

function anEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function anSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getStatusLabel(status) {
    if (window.negotiationLifecycle && typeof window.negotiationLifecycle.getNegotiationStatusLabel === 'function') {
        return window.negotiationLifecycle.getNegotiationStatusLabel(status);
    }
    return status || '—';
}

function formatRelative(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7) return days + 'd ago';
    return d.toLocaleDateString();
}

function renderFlags(row) {
    const flags = row.flags || {};
    const parts = [];
    if (flags.stalled) parts.push('<span class="an-flag an-flag--warning">Stalled</span>');
    if (flags.expiringSoon) parts.push('<span class="an-flag an-flag--danger">Expiring</span>');
    if (flags.hasDispute) parts.push('<span class="an-flag an-flag--danger">Dispute</span>');
    if (flags.agreedNoDeal) parts.push('<span class="an-flag an-flag--success">No deal</span>');
    return parts.join('');
}

function matchesQueue(row, queue) {
    const status = (row.status || '').toLowerCase();
    const flags = row.flags || {};
    if (!queue) return true;
    if (queue === 'active') return ['open', 'counter_offered'].includes(status);
    if (queue === 'stalled') return flags.stalled;
    if (queue === 'expiring') return flags.expiringSoon;
    if (queue === 'disputed') return flags.hasDispute;
    if (queue === 'agreed') return status === 'agreed';
    if (queue === 'agreed_no_deal') return flags.agreedNoDeal;
    if (queue === 'terminal') return ['expired', 'cancelled', 'failed'].includes(status);
    return true;
}

function getVisibleRows() {
    let list = adminNegState.rows.slice();
    const q = adminNegState.queue;
    const search = adminNegState.search;

    if (q) list = list.filter(r => matchesQueue(r, q));
    if (search) {
        list = list.filter(r => {
            const hay = [
                r.id, r.opportunityTitle, r.partySummary, r.opportunityId, r.matchId
            ].join(' ').toLowerCase();
            return hay.includes(search);
        });
    }

    list.sort((a, b) => {
        if (adminNegState.sort === 'expiring') {
            const ea = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
            const eb = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
            return ea - eb;
        }
        if (adminNegState.sort === 'oldest') {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        const la = new Date(a.lastActivityAt || a.updatedAt || 0).getTime();
        const lb = new Date(b.lastActivityAt || b.updatedAt || 0).getTime();
        return lb - la;
    });

    return list;
}

function renderNegotiationCard(row) {
    const detailRoute = '/admin/negotiations/' + row.id;
    const valueLine = row.valueDisplay != null ? anEscape(String(row.valueDisplay)) : '—';
    const meta = [
        '<span><i class="ph-duotone ph-users-three" aria-hidden="true"></i> ' + anEscape(row.partySummary) + '</span>',
        '<span><i class="ph-duotone ph-arrows-left-right" aria-hidden="true"></i> ' + anEscape(row.exchangeMode) + '</span>',
        '<span><i class="ph-duotone ph-hash" aria-hidden="true"></i> ' + row.roundsCount + ' rounds</span>',
        '<span><i class="ph-duotone ph-clock" aria-hidden="true"></i> ' + anEscape(formatRelative(row.lastActivityAt)) + '</span>'
    ].map(s => '<span class="ao-card-meta-item">' + s + '</span>').join('');

    return `
    <article class="ao-card" data-negotiation-id="${anEscape(row.id)}">
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${anEscape(row.opportunityTitle)}</h3>
                <span class="badge badge--info">${anEscape(getStatusLabel(row.status))}</span>
                ${renderFlags(row)}
            </div>
            <p class="ao-card-desc">Value: <strong>${valueLine}</strong></p>
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta}</div>
                <div class="ao-card-actions">
                    <a href="#" data-route="${anEscape(detailRoute)}" class="ao-action">
                        <i class="ph-duotone ph-eye" aria-hidden="true"></i> Monitor
                    </a>
                    <a href="#" data-route="${anEscape('/negotiations/' + row.id)}" class="ao-action">
                        <i class="ph-duotone ph-scales" aria-hidden="true"></i> Workspace
                    </a>
                </div>
            </div>
        </div>
    </article>`;
}

function updateSummary(analytics) {
    const a = analytics || {};
    anSetText('an-stat-total', String(a.total || 0));
    anSetText('an-stat-active', String(a.active || 0));
    anSetText('an-stat-stalled', String(a.stalled || 0));
    anSetText('an-stat-expiring', String(a.expiringSoon || 0));
    anSetText('an-stat-agreed-nodeal', String(a.agreedNoDeal || 0));
    anSetText('an-stat-disputes', String(a.activeDisputes || 0));

    anSetText('an-chip-all', String(a.total || 0));
    anSetText('an-chip-active', String(a.active || 0));
    anSetText('an-chip-stalled', String(a.stalled || 0));
    anSetText('an-chip-expiring', String(a.expiringSoon || 0));
    anSetText('an-chip-disputed', String(a.activeDisputes || 0));
    anSetText('an-chip-agreed', String(a.agreed || 0));
    anSetText('an-chip-agreed-nodeal', String(a.agreedNoDeal || 0));
    anSetText('an-chip-terminal', String((a.expired || 0) + (a.cancelled || 0)));

    anSetText('an-metric-rounds', a.avgRoundsToAgree != null ? String(a.avgRoundsToAgree) : '—');
    anSetText('an-metric-days', a.avgDaysToAgree != null ? String(a.avgDaysToAgree) : '—');
    anSetText('an-metric-conversion', a.conversionRate || '—');
}

function syncTabs() {
    document.querySelectorAll('[data-an-queue]').forEach(btn => {
        const value = btn.getAttribute('data-an-queue') || '';
        const on = value === adminNegState.queue;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
    });
}

function renderList() {
    syncTabs();
    const container = document.getElementById('an-list');
    const metaEl = document.getElementById('an-list-meta');
    const titleEl = document.getElementById('an-list-title');
    if (titleEl) titleEl.textContent = AN_QUEUE_TITLES[adminNegState.queue] || 'All negotiations';
    if (!container) return;

    const visible = getVisibleRows();
    const total = adminNegState.rows.length;

    if (metaEl) {
        metaEl.textContent = total === 0
            ? 'No negotiations on the platform yet.'
            : `Showing ${visible.length} of ${total} negotiation${total === 1 ? '' : 's'}`;
    }

    if (!visible.length) {
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon"><i class="ph-duotone ph-scales" aria-hidden="true"></i></div>
                <p class="ao-empty-title">${total === 0 ? 'No negotiations yet' : 'No matches for this queue'}</p>
                <p class="ao-empty-desc">${total === 0 ? 'Negotiations appear when parties discuss terms after a match or application.' : 'Try another queue or clear your search.'}</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderNegotiationCard).join('');
    container.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            if (route && router) router.navigate(route);
        });
    });
}

async function enrichNegotiations(negotiations, deals, disputes) {
    const cc = window.AdminNegotiationCommandCenter;
    const nt = window.negotiationTerms;
    const dl = window.disputeLifecycle;
    const dealByNeg = new Map((deals || []).filter(d => d.negotiationId).map(d => [d.negotiationId, d]));
    const activeDisputeNegIds = new Set(
        (disputes || []).filter(d =>
            dl?.isActiveDispute ? dl.isActiveDispute(d)
                : ['raised', 'under_review', 'mediation'].includes((d.status || '').toLowerCase())
        ).map(d => d.negotiationId)
    );

    return Promise.all((negotiations || []).map(async (n) => {
        let opportunityTitle = n.opportunityId || '—';
        if (n.opportunityId && dataService.getOpportunityById) {
            const opp = await dataService.getOpportunityById(n.opportunityId);
            if (opp?.title) opportunityTitle = opp.title;
        }
        const partyNames = await Promise.all((n.parties || []).map(async (p) => {
            const u = await dataService.getUserOrCompanyById(p.userId);
            return u?.profile?.name || u?.profile?.companyName || p.userId;
        }));
        const terms = nt && typeof nt.getEffectiveTerms === 'function'
            ? nt.getEffectiveTerms(n)
            : {};
        const exchangeMode = nt && typeof nt.detectExchangeMode === 'function'
            ? nt.detectExchangeMode(terms, null)
            : 'cash';
        const deal = dealByNeg.get(n.id);
        const ctx = {
            opportunityTitle,
            partySummary: partyNames.slice(0, 2).join(' · ') || '—',
            exchangeMode: nt && typeof nt.formatTermDisplay === 'function'
                ? nt.formatTermDisplay('exchangeMode', exchangeMode)
                : exchangeMode,
            dealId: deal?.id || null,
            agreedNoDeal: cc && typeof cc.isAgreedNoDeal === 'function'
                ? cc.isAgreedNoDeal(n, deals)
                : false,
            hasActiveDispute: activeDisputeNegIds.has(n.id)
        };
        return cc && typeof cc.enrichNegotiationRow === 'function'
            ? cc.enrichNegotiationRow(n, ctx)
            : { id: n.id, status: n.status, opportunityTitle, ...ctx };
    }));
}

function setupFilters() {
    document.querySelectorAll('[data-an-queue]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminNegState.queue = btn.getAttribute('data-an-queue') || '';
            renderList();
        });
    });
    document.querySelectorAll('[data-an-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            const jump = btn.getAttribute('data-an-jump') || '';
            if (jump === 'disputed' && router && CONFIG.ROUTES.ADMIN_DISPUTES) {
                router.navigate(CONFIG.ROUTES.ADMIN_DISPUTES + '?queue=active');
                return;
            }
            adminNegState.queue = jump;
            renderList();
        });
    });
    const searchEl = document.getElementById('an-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminNegState.search = (e.target.value || '').toLowerCase().trim();
                renderList();
            }, 120);
        });
    }
    const sortEl = document.getElementById('an-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminNegState.sort = e.target.value || 'activity';
            renderList();
        });
    }
}

async function loadAdminNegotiations() {
    const container = document.getElementById('an-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const [negotiations, deals, analytics, disputes] = await Promise.all([
            dataService.getNegotiations(),
            dataService.getDeals(),
            dataService.getAdminNegotiationAnalytics(),
            dataService.getDisputes()
        ]);
        adminNegState.rows = await enrichNegotiations(negotiations, deals, disputes);
        updateSummary(analytics);
        renderList();
        if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
    } catch (err) {
        console.error('Admin negotiations load error:', err);
        if (container) {
            container.innerHTML = '<div class="ao-empty"><p class="ao-empty-title">Could not load negotiations</p></div>';
        }
    }
}

async function initAdminNegotiations() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.matching.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader?.PRESETS?.adminNegotiations) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminNegotiations);
    }

    setupFilters();
    await loadAdminNegotiations();
}

window.initAdminNegotiations = initAdminNegotiations;
