/**
 * Admin Disputes — dedicated dispute queue with analytics and CSV export (Phase 4).
 */

const ADS_QUEUE_TITLES = {
    '': 'All disputes',
    active: 'Active disputes',
    needs_review: 'Disputes needing review',
    sla_breached: 'SLA breached',
    under_review: 'Under admin review',
    mediation: 'In mediation',
    resolved: 'Resolved disputes',
    terminal: 'Closed disputes'
};

const adminDisputeState = {
    rows: [],
    queue: '',
    search: '',
    sort: 'activity'
};

function adsEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function adsSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getDisputeStatusLabel(status) {
    if (window.disputeLifecycle?.getDisputeStatusLabel) {
        return window.disputeLifecycle.getDisputeStatusLabel(status);
    }
    return status || '—';
}

function getDisputeCategoryLabel(category) {
    if (window.disputeLifecycle?.getDisputeCategoryLabel) {
        return window.disputeLifecycle.getDisputeCategoryLabel(category);
    }
    return category || '—';
}

function getResolutionLabel(outcome) {
    if (window.disputeLifecycle?.getResolutionOutcomeLabel) {
        return window.disputeLifecycle.getResolutionOutcomeLabel(outcome);
    }
    return outcome || '—';
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
    if (flags.needsReview) parts.push('<span class="an-flag an-flag--warning">Needs review</span>');
    if (flags.inMediation) parts.push('<span class="an-flag an-flag--purple">Mediation</span>');
    if (flags.slaBreached) parts.push('<span class="an-flag an-flag--danger">SLA breach</span>');
    if (flags.active && !flags.needsReview && !flags.inMediation) {
        parts.push('<span class="an-flag an-flag--danger">Active</span>');
    }
    if (row.resolutionOutcome) {
        parts.push('<span class="an-flag an-flag--success">' + adsEscape(getResolutionLabel(row.resolutionOutcome)) + '</span>');
    }
    return parts.join('');
}

function matchesQueue(row, queue) {
    const status = (row.status || '').toLowerCase();
    const flags = row.flags || {};
    if (!queue) return true;
    if (queue === 'active') return flags.active;
    if (queue === 'needs_review') return flags.needsReview;
    if (queue === 'sla_breached') return flags.slaBreached;
    if (queue === 'under_review') return status === 'under_review';
    if (queue === 'mediation') return flags.inMediation;
    if (queue === 'resolved') return status === 'resolved';
    if (queue === 'terminal') return flags.terminal;
    return true;
}

function getVisibleRows() {
    let list = adminDisputeState.rows.slice();
    const q = adminDisputeState.queue;
    const search = adminDisputeState.search;

    if (q) list = list.filter(r => matchesQueue(r, q));
    if (search) {
        list = list.filter(r => {
            const hay = [
                r.id, r.negotiationId, r.opportunityId, r.opportunityTitle,
                r.raisedByName, r.category, r.description
            ].join(' ').toLowerCase();
            return hay.includes(search);
        });
    }

    list.sort((a, b) => {
        if (adminDisputeState.sort === 'raised') {
            return new Date(b.raisedAt || 0) - new Date(a.raisedAt || 0);
        }
        if (adminDisputeState.sort === 'oldest') {
            return new Date(a.raisedAt || 0) - new Date(b.raisedAt || 0);
        }
        const la = new Date(a.lastActivityAt || a.updatedAt || 0).getTime();
        const lb = new Date(b.lastActivityAt || b.updatedAt || 0).getTime();
        return lb - la;
    });

    return list;
}

function renderDisputeCard(row) {
    const negRoute = '/admin/negotiations/' + row.negotiationId;
    const metaParts = [
        '<span><i class="ph-duotone ph-user" aria-hidden="true"></i> ' + adsEscape(row.raisedByName) + '</span>',
        '<span><i class="ph-duotone ph-tag" aria-hidden="true"></i> ' + adsEscape(getDisputeCategoryLabel(row.category)) + '</span>',
        '<span><i class="ph-duotone ph-chats" aria-hidden="true"></i> ' + row.threadCount + ' messages</span>',
        '<span><i class="ph-duotone ph-clock" aria-hidden="true"></i> ' + adsEscape(formatRelative(row.lastActivityAt)) + '</span>'
    ];
    if (row.ageHours != null && row.flags?.active) {
        metaParts.push('<span><i class="ph-duotone ph-hourglass" aria-hidden="true"></i> ' + row.ageHours + 'h open</span>');
    }
    const meta = metaParts.map(s => '<span class="ao-card-meta-item">' + s + '</span>').join('');

    const desc = row.description
        ? '<p class="ao-card-desc">' + adsEscape(row.description.slice(0, 140)) + (row.description.length > 140 ? '…' : '') + '</p>'
        : '';

    return `
    <article class="ao-card" data-dispute-id="${adsEscape(row.id)}">
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${adsEscape(row.opportunityTitle)}</h3>
                <span class="badge badge--info">${adsEscape(getDisputeStatusLabel(row.status))}</span>
                ${renderFlags(row)}
            </div>
            ${desc}
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta}</div>
                <div class="ao-card-actions">
                    <a href="#" data-route="${adsEscape(negRoute)}" class="ao-action">
                        <i class="ph-duotone ph-scales" aria-hidden="true"></i> Negotiation
                    </a>
                    <a href="#" data-route="${adsEscape('/admin/audit?entityType=dispute&entityId=' + row.id)}" class="ao-action">
                        <i class="ph-duotone ph-list-checks" aria-hidden="true"></i> Audit
                    </a>
                </div>
            </div>
        </div>
    </article>`;
}

function updateSummary(analytics) {
    const a = analytics || {};
    adsSetText('ads-stat-total', String(a.total || 0));
    adsSetText('ads-stat-active', String(a.active || 0));
    adsSetText('ads-stat-needs-review', String(a.needsReview || a.raised || 0));
    adsSetText('ads-stat-mediation', String(a.mediation || 0));
    adsSetText('ads-stat-resolved', String(a.resolved || 0));
    adsSetText('ads-stat-sla', String(a.slaBreached || 0));

    adsSetText('ads-chip-all', String(a.total || 0));
    adsSetText('ads-chip-active', String(a.active || 0));
    adsSetText('ads-chip-needs-review', String(a.needsReview || a.raised || 0));
    adsSetText('ads-chip-sla', String(a.slaBreached || 0));
    adsSetText('ads-chip-under-review', String(a.underReview || 0));
    adsSetText('ads-chip-mediation', String(a.mediation || 0));
    adsSetText('ads-chip-resolved', String(a.resolved || 0));
    adsSetText('ads-chip-terminal', String((a.resolved || 0) + (a.escalated || 0) + (a.withdrawn || 0)));

    adsSetText('ads-metric-days', a.avgDaysToResolve != null ? String(a.avgDaysToResolve) : '—');
    adsSetText('ads-metric-rate', a.resolutionRate || '—');
    adsSetText('ads-metric-escalated', String(a.escalated || 0));
}

function syncTabs() {
    document.querySelectorAll('[data-ads-queue]').forEach(btn => {
        const value = btn.getAttribute('data-ads-queue') || '';
        const on = value === adminDisputeState.queue;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
    });
}

function renderList() {
    syncTabs();
    const container = document.getElementById('ads-list');
    const metaEl = document.getElementById('ads-list-meta');
    const titleEl = document.getElementById('ads-list-title');
    if (titleEl) titleEl.textContent = ADS_QUEUE_TITLES[adminDisputeState.queue] || 'All disputes';
    if (!container) return;

    const visible = getVisibleRows();
    const total = adminDisputeState.rows.length;

    if (metaEl) {
        metaEl.textContent = total === 0
            ? 'No disputes on the platform yet.'
            : `Showing ${visible.length} of ${total} dispute${total === 1 ? '' : 's'}`;
    }

    if (!visible.length) {
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon"><i class="ph-duotone ph-warning-circle" aria-hidden="true"></i></div>
                <p class="ao-empty-title">${total === 0 ? 'No disputes yet' : 'No matches for this queue'}</p>
                <p class="ao-empty-desc">${total === 0 ? 'Disputes appear when parties raise disagreements during negotiations.' : 'Try another queue or clear your search.'}</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderDisputeCard).join('');
    container.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            if (route && router) router.navigate(route);
        });
    });
}

async function enrichDisputes(disputes, negotiations) {
    const cc = window.AdminDisputeCommandCenter;
    const negById = new Map((negotiations || []).map(n => [n.id, n]));

    return Promise.all((disputes || []).map(async (d) => {
        const negotiation = negById.get(d.negotiationId);
        let opportunityTitle = d.opportunityId || '—';
        if (d.opportunityId && dataService.getOpportunityById) {
            const opp = await dataService.getOpportunityById(d.opportunityId);
            if (opp?.title) opportunityTitle = opp.title;
        }
        let raisedByName = d.raisedBy || '—';
        if (d.raisedBy && dataService.getUserOrCompanyById) {
            const u = await dataService.getUserOrCompanyById(d.raisedBy);
            raisedByName = u?.profile?.name || u?.profile?.companyName || d.raisedBy;
        }
        const ctx = {
            opportunityTitle,
            raisedByName,
            negotiationStatus: negotiation?.status || null,
            slaHours: (window.CONFIG?.MATCHING?.DISPUTE?.SLA_HOURS) || 48
        };
        return cc && typeof cc.enrichDisputeRow === 'function'
            ? cc.enrichDisputeRow(d, ctx)
            : { id: d.id, ...ctx, status: d.status };
    }));
}

function exportDisputesCsv() {
    const rows = getVisibleRows();
    if (!rows.length) {
        alert('No disputes to export for the current filter.');
        return;
    }
    const headers = ['id', 'negotiationId', 'opportunityTitle', 'category', 'status', 'raisedBy', 'raisedAt', 'lastActivityAt', 'threadCount', 'resolutionOutcome', 'description'];
    const csvRows = [headers.join(',')];
    rows.forEach(r => {
        const cells = headers.map(h => {
            const val = r[h] != null ? String(r[h]) : '';
            return '"' + val.replace(/"/g, '""') + '"';
        });
        csvRows.push(cells.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'disputes-export-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function readQueueFromHash() {
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    if (qIdx < 0) return '';
    try {
        const params = new URLSearchParams(hash.slice(qIdx + 1));
        return (params.get('queue') || '').trim();
    } catch (e) {
        return '';
    }
}

function setupFilters() {
    document.querySelectorAll('[data-ads-queue]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminDisputeState.queue = btn.getAttribute('data-ads-queue') || '';
            renderList();
        });
    });
    document.querySelectorAll('[data-ads-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminDisputeState.queue = btn.getAttribute('data-ads-jump') || '';
            renderList();
        });
    });
    const searchEl = document.getElementById('ads-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminDisputeState.search = (e.target.value || '').toLowerCase().trim();
                renderList();
            }, 120);
        });
    }
    const sortEl = document.getElementById('ads-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminDisputeState.sort = e.target.value || 'activity';
            renderList();
        });
    }
    const exportBtn = document.getElementById('ads-export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDisputesCsv);
    }
}

async function loadAdminDisputes() {
    const container = document.getElementById('ads-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const cc = window.AdminDisputeCommandCenter;
        const [disputes, negotiations] = await Promise.all([
            dataService.getDisputes(),
            dataService.getNegotiations()
        ]);
        const analytics = cc && typeof cc.buildAdminDisputeAnalytics === 'function'
            ? cc.buildAdminDisputeAnalytics(disputes)
            : await dataService.getAdminDisputeAnalytics();
        adminDisputeState.rows = await enrichDisputes(disputes, negotiations);
        updateSummary(analytics);
        renderList();
        if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
    } catch (err) {
        console.error('Admin disputes load error:', err);
        if (container) {
            container.innerHTML = '<div class="ao-empty"><p class="ao-empty-title">Could not load disputes</p></div>';
        }
    }
}

async function initAdminDisputes() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.matching.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader?.PRESETS?.adminDisputes) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminDisputes);
    }

    const hashQueue = readQueueFromHash();
    if (hashQueue && ADS_QUEUE_TITLES[hashQueue] !== undefined) {
        adminDisputeState.queue = hashQueue;
    }

    setupFilters();
    await loadAdminDisputes();
}

window.initAdminDisputes = initAdminDisputes;
