/**
 * Platform Analytics – admin command center (DataService aggregates, Chart.js, Leaflet)
 */

let lastOffersPerOpportunity = [];
let lastOffersBySite = [];
/** @type {Record<string, import('chart.js').Chart>} */
const chartInstances = {};
/** @type {import('leaflet').Map | null} */
let paMap = null;
/** @type {import('leaflet').LayerGroup | null} */
let paMapLayer = null;

let auditCategory = 'all';
/** Last computed analytics snapshot (for export) */
let lastSnapshot = null;

const CHART_COLORS = [
    '#0d9488', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

const DEAL_STATUS_LABELS = {
    draft: 'Draft',
    review: 'In Review',
    negotiating: 'In Review',
    signing: 'Waiting for Signatures',
    active: 'Active',
    execution: 'In Execution',
    delivery: 'In Delivery',
    completed: 'Completed',
    closed: 'Closed',
    cancelled: 'Cancelled'
};

const HUB_COORDS = {
    Riyadh: [24.7136, 46.6753],
    Jeddah: [21.4858, 39.1925],
    Dammam: [26.4207, 50.0888],
    'Eastern Province': [26.2794, 50.2080],
    'GCC (other)': [25.2048, 55.2708],
    'Other (KSA)': [23.8859, 45.0792],
    Other: [23.8859, 45.0792]
};

function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

function createDoughnutChart(canvasId, labels, data) {
    const el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    destroyChart(canvasId);
    const ctx = el.getContext('2d');
    const colors = CHART_COLORS.slice(0, Math.max(labels.length, data.length));
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => String(l).replace(/_/g, ' ')),
            datasets: [{ data, backgroundColor: colors, borderWidth: 1 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function createBarChart(canvasId, labels, data, title) {
    const el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    destroyChart(canvasId);
    const ctx = el.getContext('2d');
    const colors = CHART_COLORS.slice(0, Math.max(labels.length, data.length));
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => String(l).replace(/_/g, ' ')),
            datasets: [{ label: title || 'Count', data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function createLineChart(canvasId, labels, datasets) {
    const el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    destroyChart(canvasId);
    const ctx = el.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function parseTs(x) {
    if (x == null) return null;
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

function getFilterRange() {
    const preset = document.getElementById('pa-filter-date')?.value || '7d';
    const now = new Date();
    let start;
    let end = endOfDay(now);

    if (preset === 'custom') {
        const s = document.getElementById('pa-filter-start')?.value;
        const e = document.getElementById('pa-filter-end')?.value;
        start = s ? startOfDay(new Date(s + 'T00:00:00')) : startOfDay(new Date(now.getTime() - 7 * 864e5));
        end = e ? endOfDay(new Date(e + 'T00:00:00')) : endOfDay(now);
    } else if (preset === 'today') {
        start = startOfDay(now);
    } else if (preset === '7d') {
        start = startOfDay(new Date(now.getTime() - 7 * 864e5));
    } else if (preset === '30d') {
        start = startOfDay(new Date(now.getTime() - 30 * 864e5));
    } else if (preset === '90d') {
        start = startOfDay(new Date(now.getTime() - 90 * 864e5));
    } else {
        start = new Date(0);
    }

    const span = Math.max(1, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - span);
    return { start, end, prevStart, prevEnd, span };
}

function inRange(ts, start, end) {
    const d = parseTs(ts);
    if (!d) return false;
    return d >= start && d <= end;
}

function getAllNotifications() {
    const ds = typeof dataService !== 'undefined' ? dataService : window.dataService;
    if (!ds || !ds.storage || !CONFIG?.STORAGE_KEYS?.NOTIFICATIONS) return [];
    return ds.storage.get(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || [];
}

function locText(opp) {
    return `${opp?.location || ''} ${opp?.locationRegion || ''} ${opp?.locationCountry || ''}`.toLowerCase();
}

function passesRegionFilter(opp, region) {
    if (!opp || region === 'all') return true;
    const t = locText(opp);
    const country = (opp.locationCountry || '').toLowerCase();
    if (region === 'sa') {
        return country === 'sa' || t.includes('saudi');
    }
    if (region === 'gcc') {
        return /saudi|uae|emirates|dubai|abudhabi|kuwait|bahrain|qatar|oman|gcc|ksa/.test(t) || ['sa', 'ae', 'kw', 'bh', 'qa', 'om'].includes(country);
    }
    if (region === 'riyadh') return t.includes('riyadh') || (opp.locationRegion || '').toLowerCase() === 'riyadh';
    if (region === 'jeddah') return t.includes('jeddah') || (opp.locationRegion || '').toLowerCase() === 'makkah';
    if (region === 'dammam') return t.includes('dammam');
    if (region === 'eastern') {
        return /eastern|khobar|dhahran|dammam|jubail|qatif/.test(t) || (opp.locationRegion || '').toLowerCase() === 'eastern';
    }
    return true;
}

function passesCategoryFilter(opp, category) {
    if (!opp || category === 'all') return true;
    const skills = (opp.scope && opp.scope.requiredSkills) || [];
    const sectors = (opp.scope && opp.scope.sectors) || [];
    const ind = opp.industry || '';
    const pool = [...skills, ...sectors, ind].map(x => String(x).toLowerCase());
    return pool.some(p => p.includes(category.toLowerCase()) || category.toLowerCase().includes(p));
}

function passesOppStatusFilter(opp, status) {
    if (!opp || status === 'all') return true;
    return (opp.status || 'draft') === status;
}

function getCreatorIdsForUserType(users, companies, userType) {
    const uids = new Set();
    const cids = new Set();
    companies.forEach(c => cids.add(c.id));
    users.forEach(u => {
        if (userType === 'all') uids.add(u.id);
        else if (userType === 'professionals' && u.role === 'professional') uids.add(u.id);
        else if (userType === 'consultants' && u.role === 'consultant') uids.add(u.id);
    });
    if (userType === 'all') {
        companies.forEach(c => uids.add(c.id));
        return uids;
    }
    if (userType === 'companies') return cids;
    return uids;
}

function countAccounts(users, companies, userType) {
    if (userType === 'companies') return companies.length;
    if (userType === 'professionals') return users.filter(u => u.role === 'professional').length;
    if (userType === 'consultants') return users.filter(u => u.role === 'consultant').length;
    return users.length + companies.length;
}

function filterOpportunities(opportunities, users, companies, range, region, userType, category, oppStatus) {
    const creators = getCreatorIdsForUserType(users, companies, userType);
    return opportunities.filter(o => {
        if (!passesRegionFilter(o, region)) return false;
        if (!passesCategoryFilter(o, category)) return false;
        if (!passesOppStatusFilter(o, oppStatus)) return false;
        if (userType !== 'all') {
            const cid = o.creatorId;
            if (userType === 'companies' && !creators.has(cid)) return false;
            if ((userType === 'professionals' || userType === 'consultants') && !creators.has(cid)) return false;
        }
        return inRange(o.createdAt, range.start, range.end);
    });
}

function filterOpportunitiesLoose(opportunities, users, companies, region, userType, category, oppStatus) {
    const creators = getCreatorIdsForUserType(users, companies, userType);
    return opportunities.filter(o => {
        if (!passesRegionFilter(o, region)) return false;
        if (!passesCategoryFilter(o, category)) return false;
        if (!passesOppStatusFilter(o, oppStatus)) return false;
        if (userType !== 'all') {
            const cid = o.creatorId;
            if (userType === 'companies' && !creators.has(cid)) return false;
            if ((userType === 'professionals' || userType === 'consultants') && !creators.has(cid)) return false;
        }
        return true;
    });
}

function filterByOppSet(list, getOppId, oppIds, range, dateField = 'createdAt') {
    const set = new Set(oppIds);
    return list.filter(x => {
        const oid = getOppId(x);
        if (!set.has(oid)) return false;
        return inRange(x[dateField], range.start, range.end);
    });
}

function hubForOpportunity(opp) {
    const t = locText(opp);
    if (t.includes('riyadh')) return 'Riyadh';
    if (t.includes('jeddah')) return 'Jeddah';
    if (t.includes('dammam')) return 'Dammam';
    if (/eastern|khobar|dhahran|jubail|qatif/.test(t)) return 'Eastern Province';
    if (/dubai|abudhabi|uae|emirates|kuwait|bahrain|qatar|oman/.test(t)) return 'GCC (other)';
    if (t.includes('saudi') || (opp.locationCountry || '').toLowerCase() === 'sa') return 'Other (KSA)';
    return 'Other';
}

function countBy(arr, keyFn) {
    const m = {};
    arr.forEach(x => {
        const k = keyFn(x);
        m[k] = (m[k] || 0) + 1;
    });
    return m;
}

function trendHtml(cur, prev) {
    if (prev === 0 && cur === 0) return '<span class="pa-kpi-trend flat">— vs prior period</span>';
    if (prev === 0) return `<span class="pa-kpi-trend up">+100% vs prior</span>`;
    const pct = Math.round(((cur - prev) / prev) * 100);
    const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
    const sign = pct > 0 ? '+' : '';
    return `<span class="pa-kpi-trend ${cls}">${sign}${pct}% vs prior period</span>`;
}

function cashAmount(obj) {
    if (!obj) return 0;
    const v = obj.agreedValue || obj.valueTerms?.agreedValue;
    if (!v) return 0;
    if (typeof v.cash === 'number') return v.cash;
    return 0;
}

function pendingSignatureContract(c) {
    if ((c.status || '') === 'pending') return true;
    const parties = c.parties || [];
    return parties.some(p => !p.signedAt);
}

function dealStatusDisplay(status) {
    return DEAL_STATUS_LABELS[status] || status || 'Unknown';
}

function setupModuleTabs() {
    const tabs = document.querySelectorAll('.pa-tab');
    const panels = document.querySelectorAll('.pa-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const module = tab.getAttribute('data-module');
            tabs.forEach(t => {
                t.classList.remove('pa-tab-active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('pa-tab-active');
            tab.setAttribute('aria-selected', 'true');
            panels.forEach(panel => {
                const isActive = panel.getAttribute('data-module') === module;
                panel.classList.toggle('pa-panel-visible', isActive);
                panel.hidden = !isActive;
            });
            requestAnimationFrame(() => {
                Object.keys(chartInstances).forEach(id => {
                    const canvas = document.getElementById(id);
                    if (canvas && canvas.closest('.pa-panel-visible')) {
                        chartInstances[id].resize();
                    }
                });
                if (paMap && typeof paMap.invalidateSize === 'function') {
                    paMap.invalidateSize();
                }
            });
        });
    });
}

function setupExportMenu() {
    const trigger = document.getElementById('pa-export-trigger');
    const menu = document.getElementById('pa-export-menu');
    if (!trigger || !menu) return;
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !menu.hidden;
        menu.hidden = open;
        trigger.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', () => {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
    });
    menu.addEventListener('click', e => e.stopPropagation());
}

function downloadCSV(filename, rows, headers) {
    const escape = (v) => {
        const s = String(v == null ? '' : v);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };
    const line = (row) => headers.map(h => escape(row[h])).join(',');
    const csv = [headers.join(','), ...rows.map(row => line(row))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function exportOffersBySiteCSV() {
    const headers = ['Site', 'Offers Count'];
    const rows = lastOffersBySite.map(({ site, count }) => ({ Site: site, 'Offers Count': count }));
    downloadCSV('offers-by-site.csv', rows, headers);
}

function exportOffersPerOpportunityCSV() {
    const headers = ['Opportunity ID', 'Title', 'Offers Count'];
    const rows = lastOffersPerOpportunity.map(({ id, title, count }) => ({ 'Opportunity ID': id, Title: title, 'Offers Count': count }));
    downloadCSV('offers-per-opportunity.csv', rows, headers);
}

function exportSummaryCSV() {
    if (!lastSnapshot) return;
    const s = lastSnapshot;
    const rows = [
        { Metric: 'Total users', Value: s.kpi.usersTotal },
        { Metric: 'Active companies', Value: s.kpi.activeCompanies },
        { Metric: 'Opportunities', Value: s.kpi.opportunities },
        { Metric: 'Applications', Value: s.kpi.applications },
        { Metric: 'Matches', Value: s.kpi.matches },
        { Metric: 'Deals', Value: s.kpi.deals },
        { Metric: 'Contracts', Value: s.kpi.contracts },
        { Metric: 'Pending signatures', Value: s.kpi.pendingSignatures },
        { Metric: 'Active collaborations', Value: s.kpi.activeCollabs },
        { Metric: 'Platform health', Value: s.kpi.health }
    ];
    downloadCSV('platform-analytics-summary.csv', rows, ['Metric', 'Value']);
}

function exportExcelTSV() {
    if (!lastSnapshot) return;
    const s = lastSnapshot;
    const headers = ['Metric', 'Value'];
    const lines = [headers.join('\t'), ...Object.entries(s.kpi).map(([k, v]) => `${k}\t${v}`)];
    const blob = new Blob([lines.join('\r\n')], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'platform-analytics-summary.xls';
    a.click();
    URL.revokeObjectURL(a.href);
}

function exportPDFPrint() {
    window.print();
}

function renderKpiCards(snap) {
    const grid = document.getElementById('pa-kpi-grid');
    if (!grid) return;
    const k = snap.kpi;
    const t = snap.kpiTrend;
    const cards = [
        { key: 'users', label: 'Total users', value: k.usersTotal, trend: t.users, hint: 'Accounts matching user-type filter. Trend = new registrations vs prior window.', icon: 'ph-users', route: CONFIG?.ROUTES?.ADMIN_PEOPLE },
        { key: 'companies', label: 'Active companies', value: k.activeCompanies, trend: t.activeCompanies, hint: 'Companies with active status. Trend = new company accounts vs prior window.', icon: 'ph-buildings', route: CONFIG?.ROUTES?.ADMIN_PEOPLE },
        { key: 'opps', label: 'Opportunities', value: k.opportunities, trend: t.opportunities, hint: 'New posts matching filters.', icon: 'ph-briefcase', route: CONFIG?.ROUTES?.ADMIN_OPPORTUNITIES },
        { key: 'apps', label: 'Applications', value: k.applications, trend: t.applications, hint: 'Offers submitted on filtered opportunities.', icon: 'ph-paper-plane-tilt', route: CONFIG?.ROUTES?.ADMIN_APPLICATIONS },
        { key: 'matches', label: 'Matches', value: k.matches, trend: t.matches, hint: 'Person ↔ opportunity matches generated.', icon: 'ph-git-merge', route: CONFIG?.ROUTES?.ADMIN_MATCHING },
        { key: 'deals', label: 'Deals', value: k.deals, trend: t.deals, hint: 'Deal workspaces in period.', icon: 'ph-handshake', route: CONFIG?.ROUTES?.ADMIN_DEALS },
        { key: 'contracts', label: 'Contracts', value: k.contracts, trend: t.contracts, hint: 'Legal contracts tied to filtered pipeline.', icon: 'ph-file-text', route: CONFIG?.ROUTES?.ADMIN_CONTRACTS },
        { key: 'sig', label: 'Pending signatures', value: k.pendingSignatures, trend: t.pendingSignatures, hint: 'Contracts awaiting one or more signatures.', icon: 'ph-signature', route: CONFIG?.ROUTES?.ADMIN_CONTRACTS },
        { key: 'collab', label: 'Active collaborations', value: k.activeCollabs, trend: t.activeCollabs, hint: 'Deals in active execution or delivery.', icon: 'ph-users-three', route: CONFIG?.ROUTES?.ADMIN_DEALS },
        { key: 'health', label: 'Platform health', value: k.health + '/100', trend: null, hint: 'Composite: signatures backlog, match→deal conversion, suspensions.', icon: 'ph-heartbeat', route: CONFIG?.ROUTES?.ADMIN_HEALTH }
    ];

    grid.innerHTML = cards.map(c => {
        const tr = c.trend != null ? trendHtml(c.trend.cur, c.trend.prev) : '<span class="pa-kpi-trend flat">Index (not % change)</span>';
        const click = c.route ? `data-route="${escapeHtml(c.route)}"` : '';
        const cls = c.route ? 'pa-kpi-card pa-kpi-clickable' : 'pa-kpi-card';
        return `
            <button type="button" class="${cls}" ${click} title="Open related admin area">
                <div class="pa-kpi-top">
                    <div>
                        <p class="pa-kpi-label">${escapeHtml(c.label)}</p>
                        <p class="pa-kpi-value">${escapeHtml(String(c.value))}</p>
                        ${tr}
                        <p class="pa-kpi-hint">${escapeHtml(c.hint)}</p>
                    </div>
                    <div class="pa-kpi-icon"><i class="ph-duotone ${c.icon}" aria-hidden="true"></i></div>
                </div>
            </button>`;
    }).join('');

    grid.querySelectorAll('[data-route]').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = btn.getAttribute('data-route');
            if (r && typeof router !== 'undefined') router.navigate(r);
        });
    });
}

function renderFunnel(elId, steps) {
    const el = document.getElementById(elId);
    if (!el) return;
    const max = Math.max(1, ...steps.map(s => s.n));
    el.innerHTML = steps.map(s => {
        const pct = Math.round((s.n / max) * 100);
        return `
            <div class="pa-funnel-step">
                <span class="pa-funnel-label">${escapeHtml(s.label)}</span>
                <div class="pa-funnel-bar-wrap"><div class="pa-funnel-bar" style="width:${pct}%"></div></div>
                <span class="pa-funnel-meta">${s.n} <span style="color:#94a3b8;font-weight:500">(${s.sub || ''})</span></span>
            </div>`;
    }).join('');
}

function renderInsightCards(snap) {
    const insights = [];
    const topHub = Object.entries(snap.hubs).sort((a, b) => b[1].total - a[1].total)[0];
    if (topHub) {
        insights.push(`<strong>${escapeHtml(topHub[0])}</strong> is the busiest hub with <strong>${topHub[1].total}</strong> combined signals in this view.`);
    }
    const conv = snap.kpi.matches > 0 ? Math.round((snap.kpi.deals / snap.kpi.matches) * 100) : 0;
    insights.push(`Match → deal conversion in this slice: <strong>${conv}%</strong> (deals / matches).`);
    if (snap.kpi.pendingSignatures > 0) {
        insights.push(`<strong>${snap.kpi.pendingSignatures}</strong> contract(s) need signatures — review the contracts queue.`);
    }
    const topSkill = Object.entries(snap.oppSkillCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSkill) {
        insights.push(`Top demand skill: <strong>${escapeHtml(topSkill[0])}</strong> (${topSkill[1]} opportunities).`);
    }
    while (insights.length < 3) insights.push('Adjust filters to compare regions, skills, or vetting states.');
    ['pa-insights-1', 'pa-insights-2', 'pa-insights-3'].forEach((id, i) => {
        const node = document.getElementById(id);
        if (node) node.innerHTML = `<p class="pa-card-hint" style="margin:0">${insights[i]}</p>`;
    });
}

function renderActivitySummary(snap) {
    const el = document.getElementById('pa-activity-summary');
    if (!el) return;
    const items = [
        ['New users', snap.activity.users],
        ['New companies', snap.activity.companies],
        ['New opportunities', snap.activity.opportunities],
        ['New applications', snap.activity.applications],
        ['New deals', snap.activity.deals],
        ['Sessions started', snap.activity.sessions || 0],
        ['Audit events', snap.activity.audit]
    ];
    el.innerHTML = items.map(([l, n]) => `<span class="pa-activity-pill">${escapeHtml(l)}: <strong>${n}</strong></span>`).join('');
}

function toggleEmpty(canvasId, emptyId, isEmpty) {
    const c = document.getElementById(canvasId);
    const e = document.getElementById(emptyId);
    if (c && c.parentElement) c.parentElement.style.visibility = isEmpty ? 'hidden' : 'visible';
    if (c) c.style.height = isEmpty ? '0' : '';
    if (e) {
        e.hidden = !isEmpty;
        if (isEmpty) {
            e.innerHTML = 'No data available for this period. Try changing the date range or filters.';
        }
    }
}

function weekBuckets(start, end) {
    const labels = [];
    const cur = new Date(start);
    cur.setDate(cur.getDate() - cur.getDay());
    while (cur <= end) {
        labels.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 7);
    }
    if (!labels.length) labels.push(start.toISOString().slice(0, 10));
    return labels;
}

function bucketWeek(ts, labels) {
    const d = parseTs(ts);
    if (!d) return null;
    for (let i = labels.length - 1; i >= 0; i--) {
        if (d >= new Date(labels[i])) return labels[i];
    }
    return labels[0];
}

function updateMap(snap) {
    const mapEl = document.getElementById('pa-map');
    const fb = document.getElementById('pa-map-fallback');
    if (!mapEl || typeof L === 'undefined') {
        if (fb) fb.hidden = false;
        return;
    }
    const hubs = ['Riyadh', 'Jeddah', 'Dammam', 'Eastern Province', 'GCC (other)', 'Other (KSA)', 'Other'];
    const totalSig = hubs.reduce((acc, h) => acc + (snap.hubs[h]?.total || 0), 0);
    if (totalSig === 0) {
        if (fb) fb.hidden = false;
        if (paMap) {
            try {
                paMap.remove();
            } catch (e) {
                void e;
            }
            paMap = null;
            paMapLayer = null;
        }
        mapEl.innerHTML = '';
        return;
    }
    if (fb) fb.hidden = true;

    if (!paMap) {
        mapEl.innerHTML = '';
        paMap = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView([24.8, 45.2], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(paMap);
        paMapLayer = L.layerGroup().addTo(paMap);
    }
    paMapLayer.clearLayers();
    const maxR = Math.max(...hubs.map(h => snap.hubs[h]?.total || 0), 1);
    hubs.forEach(h => {
        const coords = HUB_COORDS[h];
        if (!coords) return;
        const n = snap.hubs[h]?.total || 0;
        if (n === 0) return;
        const r = 8 + (n / maxR) * 28;
        const circle = L.circleMarker(coords, {
            radius: r,
            color: '#0d9488',
            fillColor: '#2dd4bf',
            fillOpacity: 0.55,
            weight: 2
        });
        circle.bindPopup(`<strong>${escapeHtml(h)}</strong><br/>Opportunities: ${snap.hubs[h].opps}<br/>Applications: ${snap.hubs[h].apps}<br/>Matches: ${snap.hubs[h].matches}<br/>Deals: ${snap.hubs[h].deals}`);
        circle.addTo(paMapLayer);
    });
    requestAnimationFrame(() => paMap && paMap.invalidateSize());
}

function renderLocationsTable(snap, prevSnap) {
    const tbody = document.querySelector('#pa-locations-table tbody');
    const empty = document.getElementById('pa-empty-locations');
    if (!tbody) return;
    const hubs = ['Riyadh', 'Jeddah', 'Dammam', 'Eastern Province', 'GCC (other)', 'Other (KSA)', 'Other'];
    const rows = hubs
        .map(name => {
            const cur = snap.hubs[name] || { opps: 0, apps: 0, matches: 0, deals: 0, total: 0 };
            const prev = prevSnap?.hubs[name] || { total: 0 };
            let growth = 0;
            if (prev.total === 0 && cur.total > 0) growth = 100;
            else if (prev.total > 0) growth = Math.round(((cur.total - prev.total) / prev.total) * 100);
            return { name, ...cur, growth };
        })
        .filter(r => r.total > 0)
        .sort((a, b) => b.total - a.total);

    if (!rows.length) {
        tbody.innerHTML = '';
        if (empty) {
            empty.hidden = false;
            empty.textContent = 'No data available for this period. Try changing the date range or filters.';
        }
        return;
    }
    if (empty) empty.hidden = true;
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${r.opps}</td>
            <td>${r.apps}</td>
            <td>${r.matches}</td>
            <td>${r.deals}</td>
            <td>${r.growth > 0 ? '+' : ''}${r.growth}%</td>
        </tr>`).join('');
}

function auditCategoryMatch(cat, action, entityType) {
    const a = (action || '').toLowerCase();
    const e = (entityType || '').toLowerCase();
    if (cat === 'all') return true;
    if (cat === 'vetting') return /user_|profile|vet|clarif|approv|reject|suspend/.test(a) && !/deal|contract/.test(a);
    if (cat === 'deals') return e === 'deal' || a.includes('deal');
    if (cat === 'contracts') return e === 'contract' || a.includes('contract');
    if (cat === 'users') return e === 'user' || a.includes('user');
    if (cat === 'errors') return /error|fail|denied/.test(a);
    if (cat === 'system') return e === 'system' || a.includes('system') || e === 'notification';
    return true;
}

async function buildSnapshot(range, prevRange, region, userType, category, oppStatus) {
    const users = await dataService.getUsers();
    const companies = await dataService.getCompanies();
    const opportunities = await dataService.getOpportunities();
    const applications = await dataService.getApplications();
    const matches = await dataService.getMatches();
    const postMatches = await dataService.getPostMatches();
    const deals = await dataService.getDeals();
    const contracts = await dataService.getContracts();
    const auditLogs = await dataService.getAuditLogs({ startDate: range.start.toISOString(), endDate: range.end.toISOString() });
    const notifications = getAllNotifications().filter(n => inRange(n.createdAt, range.start, range.end));
    const sessions = (await dataService.getSessions()).filter(s => inRange(s.createdAt, range.start, range.end));

    const oppsF = filterOpportunities(opportunities, users, companies, range, region, userType, category, oppStatus);
    const oppIds = new Set(oppsF.map(o => o.id));
    const oppsLoose = filterOpportunitiesLoose(opportunities, users, companies, region, userType, category, oppStatus);

    const appsF = filterByOppSet(applications, a => a.opportunityId, oppIds, range);
    const matchesF = filterByOppSet(matches, m => m.opportunityId, oppIds, range);
    const dealsF = deals.filter(d => {
        const oid = d.opportunityId || (d.opportunityIds && d.opportunityIds[0]);
        if (!oppIds.has(oid)) return false;
        return inRange(d.createdAt, range.start, range.end);
    });
    const dealIds = new Set(dealsF.map(d => d.id));
    const contractsF = contracts.filter(c => {
        if (c.dealId && dealIds.has(c.dealId)) return inRange(c.createdAt, range.start, range.end);
        if (c.opportunityId && oppIds.has(c.opportunityId)) return inRange(c.createdAt, range.start, range.end);
        return false;
    });

    const prevOpps = filterOpportunities(opportunities, users, companies, prevRange, region, userType, category, oppStatus);
    const prevOppIds = new Set(prevOpps.map(o => o.id));
    const prevApps = filterByOppSet(applications, a => a.opportunityId, prevOppIds, prevRange);
    const prevMatches = filterByOppSet(matches, m => m.opportunityId, prevOppIds, prevRange);
    const prevDeals = deals.filter(d => {
        const oid = d.opportunityId || (d.opportunityIds && d.opportunityIds[0]);
        if (!prevOppIds.has(oid)) return false;
        return inRange(d.createdAt, prevRange.start, prevRange.end);
    });

    const userIdsInPeriod = new Set(users.filter(u => inRange(u.createdAt, range.start, range.end)).map(u => u.id));
    const companyIdsInPeriod = new Set(companies.filter(c => inRange(c.createdAt, range.start, range.end)).map(c => c.id));

    const looseOppIds = new Set(oppsLoose.map(o => o.id));
    const pendingSignatures = contracts.filter(c => {
        if (!pendingSignatureContract(c)) return false;
        const oid = c.opportunityId;
        return oid && looseOppIds.has(oid);
    }).length;

    const activeCollabs = dealsF.filter(d => ['active', 'execution', 'delivery'].includes(d.status || '')).length;

    const newRegsInRange = users.filter(u => inRange(u.createdAt, range.start, range.end)).length +
        companies.filter(c => inRange(c.createdAt, range.start, range.end)).length;
    const newRegsPrev = users.filter(u => inRange(u.createdAt, prevRange.start, prevRange.end)).length +
        companies.filter(c => inRange(c.createdAt, prevRange.start, prevRange.end)).length;
    const newCompaniesRange = companies.filter(c => inRange(c.createdAt, range.start, range.end)).length;
    const newCompaniesPrev = companies.filter(c => inRange(c.createdAt, prevRange.start, prevRange.end)).length;

    const kpi = {
        usersTotal: countAccounts(users, companies, userType),
        users: newRegsInRange,
        activeCompanies: companies.filter(c => (c.status || '') === 'active').length,
        opportunities: oppsF.length,
        applications: appsF.length,
        matches: matchesF.length,
        deals: dealsF.length,
        contracts: contractsF.length,
        pendingSignatures,
        activeCollabs,
        health: 0
    };

    const matchToDeal = kpi.matches > 0 ? kpi.deals / kpi.matches : 1;
    const susp = users.filter(u => (u.status || '') === 'suspended').length;
    const suspRatio = users.length ? susp / users.length : 0;
    let health = 100;
    health -= Math.min(35, kpi.pendingSignatures * 6);
    health -= Math.min(35, (1 - Math.min(1, matchToDeal * 4)) * 35);
    health -= Math.min(25, suspRatio * 80);
    kpi.health = Math.max(0, Math.min(100, Math.round(health)));

    const prevPendingSig = contracts.filter(c =>
        pendingSignatureContract(c) &&
        c.opportunityId &&
        looseOppIds.has(c.opportunityId) &&
        inRange(c.createdAt, prevRange.start, prevRange.end)
    ).length;

    const kpiTrend = {
        users: { cur: newRegsInRange, prev: newRegsPrev },
        activeCompanies: { cur: newCompaniesRange, prev: newCompaniesPrev },
        opportunities: { cur: kpi.opportunities, prev: prevOpps.length },
        applications: { cur: kpi.applications, prev: prevApps.length },
        matches: { cur: kpi.matches, prev: prevMatches.length },
        deals: { cur: kpi.deals, prev: prevDeals.length },
        contracts: { cur: kpi.contracts, prev: contracts.filter(c => {
            const oid = c.opportunityId;
            if (!prevOppIds.has(oid)) return false;
            return inRange(c.createdAt, prevRange.start, prevRange.end);
        }).length },
        pendingSignatures: { cur: pendingSignatures, prev: prevPendingSig },
        activeCollabs: { cur: activeCollabs, prev: prevDeals.filter(d => ['active', 'execution', 'delivery'].includes(d.status || '')).length }
    };

    const hubs = {};
    const ensureHub = (name) => {
        if (!hubs[name]) hubs[name] = { opps: 0, apps: 0, matches: 0, deals: 0, total: 0 };
        return hubs[name];
    };
    oppsLoose.forEach(o => {
        const h = hubForOpportunity(o);
        if (!inRange(o.createdAt, range.start, range.end)) return;
        const x = ensureHub(h);
        x.opps++;
        x.total++;
    });
    appsF.forEach(a => {
        const opp = opportunities.find(o => o.id === a.opportunityId);
        const h = hubForOpportunity(opp || {});
        const x = ensureHub(h);
        x.apps++;
        x.total++;
    });
    matchesF.forEach(m => {
        const opp = opportunities.find(o => o.id === m.opportunityId);
        const h = hubForOpportunity(opp || {});
        const x = ensureHub(h);
        x.matches++;
        x.total++;
    });
    dealsF.forEach(d => {
        const opp = opportunities.find(o => o.id === (d.opportunityId || (d.opportunityIds && d.opportunityIds[0])));
        const h = hubForOpportunity(opp || {});
        const x = ensureHub(h);
        x.deals++;
        x.total++;
    });

    const oppSkillCounts = {};
    oppsLoose.forEach(o => {
        (o.scope?.requiredSkills || []).forEach(sk => {
            const k = sk || 'General';
            oppSkillCounts[k] = (oppSkillCounts[k] || 0) + 1;
        });
    });

    const published = oppsLoose.filter(o => (o.status || '') === 'published').length;
    const draft = oppsLoose.filter(o => (o.status || '') === 'draft').length;
    const contracted = oppsLoose.filter(o => (o.status || '') === 'contracted').length;
    const closedCancelled = oppsLoose.filter(o => ['closed', 'cancelled'].includes(o.status || '')).length;

    const funnelMarket = [
        { label: 'Published opportunities', n: published, sub: 'live marketplace' },
        { label: 'Applications', n: appsF.length, sub: 'offers' },
        { label: 'Deals opened', n: dealsF.length, sub: 'workspaces' },
        { label: 'Contracted opps', n: contracted, sub: 'status' }
    ];

    const notified = matchesF.filter(m => m.notified).length;
    const PM = CONFIG?.POST_MATCH_STATUS || { ACCEPTED: 'accepted', CONFIRMED: 'confirmed' };
    const engagedPost = postMatches.filter(pm => {
        const st = (pm.status || '').toLowerCase();
        return [PM.ACCEPTED, PM.CONFIRMED].includes(st) && inRange(pm.updatedAt || pm.createdAt, range.start, range.end);
    }).length;
    const funnelMatch = [
        { label: 'Matches', n: matchesF.length, sub: 'scored' },
        { label: 'Viewed (notified)', n: notified, sub: 'surfaced' },
        { label: 'Contacted (proxy)', n: engagedPost, sub: 'post-match engaged' },
        { label: 'Applications', n: appsF.length, sub: 'same slice' },
        { label: 'Deals', n: dealsF.length, sub: 'outcomes' }
    ];

    const activity = {
        users: userIdsInPeriod.size,
        companies: companyIdsInPeriod.size,
        opportunities: oppsF.length,
        applications: appsF.length,
        deals: dealsF.length,
        sessions: sessions.length,
        audit: auditLogs.filter(l => auditCategoryMatch(auditCategory, l.action, l.entityType)).length
    };

    const oppById = {};
    opportunities.forEach(o => { oppById[o.id] = o; });

    return {
        range,
        prevRange,
        region,
        userType,
        category,
        oppStatus,
        users,
        companies,
        opportunities,
        applications,
        matches,
        postMatches,
        deals,
        contracts,
        auditLogs,
        notifications,
        sessions,
        oppsF,
        oppIds,
        oppsLoose,
        appsF,
        matchesF,
        dealsF,
        contractsF,
        kpi,
        kpiTrend,
        hubs,
        oppSkillCounts,
        funnelMarket,
        funnelMatch,
        activity,
        published,
        draft,
        contracted,
        closedCancelled,
        oppById
    };
}

function renderChartsForSnapshot(snap, prevSnap) {
    const allPeople = [...snap.users, ...snap.companies];
    const byStatus = countBy(allPeople, p => p.status || 'active');
    const userStatusOrder = ['pending', 'clarification_requested', 'active', 'suspended', 'rejected'];
    const usLabels = userStatusOrder.filter(s => byStatus[s]);
    const usData = usLabels.map(s => byStatus[s]);
    if (usLabels.length) {
        createDoughnutChart('chart-pa-users-status', usLabels, usData);
        toggleEmpty('chart-pa-users-status', 'pa-empty-users-status', false);
    } else toggleEmpty('chart-pa-users-status', 'pa-empty-users-status', true);

    const oppSt = countBy(snap.oppsLoose, o => o.status || 'draft');
    const oppOrder = ['draft', 'published', 'in_negotiation', 'contracted', 'in_execution', 'completed', 'closed', 'cancelled'];
    const osLabels = oppOrder.filter(s => oppSt[s]);
    const osData = osLabels.map(s => oppSt[s]);
    if (osLabels.length) {
        createDoughnutChart('chart-pa-opps-status', osLabels, osData);
        toggleEmpty('chart-pa-opps-status', 'pa-empty-opps-status', false);
    } else toggleEmpty('chart-pa-opps-status', 'pa-empty-opps-status', true);

    const labels = weekBuckets(snap.range.start, snap.range.end);
    const regByWeek = {};
    const oppByWeek = {};
    labels.forEach(l => { regByWeek[l] = 0; oppByWeek[l] = 0; });
    snap.users.forEach(u => {
        const b = bucketWeek(u.createdAt, labels);
        if (b) regByWeek[b] = (regByWeek[b] || 0) + 1;
    });
    snap.companies.forEach(c => {
        const b = bucketWeek(c.createdAt, labels);
        if (b) regByWeek[b] = (regByWeek[b] || 0) + 1;
    });
    snap.oppsF.forEach(o => {
        const b = bucketWeek(o.createdAt, labels);
        if (b) oppByWeek[b] = (oppByWeek[b] || 0) + 1;
    });
    const regSeries = labels.map(l => regByWeek[l] || 0);
    const oppSeries = labels.map(l => oppByWeek[l] || 0);
    if (regSeries.some(x => x) || oppSeries.some(x => x)) {
        createLineChart('chart-pa-growth', labels, [
            { label: 'New registrations', data: regSeries, borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.1)', tension: 0.25, fill: true },
            { label: 'New opportunities', data: oppSeries, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', tension: 0.25, fill: true }
        ]);
        toggleEmpty('chart-pa-growth', 'pa-empty-growth', false);
    } else toggleEmpty('chart-pa-growth', 'pa-empty-growth', true);

    renderFunnel('pa-funnel-marketplace', snap.funnelMarket);
    renderInsightCards(snap);
    renderActivitySummary(snap);

    createDoughnutChart('chart-pa-opp-status-detail', osLabels.length ? osLabels : ['none'], osLabels.length ? osData : [1]);
    toggleEmpty('chart-pa-opp-status-detail', 'pa-empty-opp-status-detail', !osLabels.length);

    const byModel = countBy(snap.oppsLoose, o => o.collaborationModel || o.modelType || 'unknown');
    const mLabels = Object.keys(byModel).sort((a, b) => byModel[b] - byModel[a]).slice(0, 12);
    const mData = mLabels.map(k => byModel[k]);
    if (mLabels.length) {
        createBarChart('chart-pa-opp-model', mLabels, mData, 'Opportunities');
        toggleEmpty('chart-pa-opp-model', 'pa-empty-opp-model', false);
    } else toggleEmpty('chart-pa-opp-model', 'pa-empty-opp-model', true);

    const skillEntries = Object.entries(snap.oppSkillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (skillEntries.length) {
        createBarChart('chart-pa-opp-skill', skillEntries.map(x => x[0]), skillEntries.map(x => x[1]), 'Count');
        toggleEmpty('chart-pa-opp-skill', 'pa-empty-opp-skill', false);
    } else toggleEmpty('chart-pa-opp-skill', 'pa-empty-opp-skill', true);

    const locCounts = countBy(snap.oppsLoose, o => (o.location || 'Unknown').split(',')[0].trim() || 'Unknown');
    const locTop = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (locTop.length) {
        createBarChart('chart-pa-opp-location', locTop.map(x => x[0]), locTop.map(x => x[1]), 'Opportunities');
        toggleEmpty('chart-pa-opp-location', 'pa-empty-opp-location', false);
    } else toggleEmpty('chart-pa-opp-location', 'pa-empty-opp-location', true);

    const avgPublishToApp = [];
    snap.appsF.forEach(a => {
        const o = snap.oppById[a.opportunityId];
        if (!o) return;
        const da = parseTs(a.createdAt);
        const dob = parseTs(o.createdAt);
        if (da && dob) avgPublishToApp.push((da - dob) / 864e5);
    });
    const avgAppToDeal = [];
    snap.dealsF.forEach(d => {
        if (!d.applicationId) return;
        const app = snap.applications.find(x => x.id === d.applicationId);
        if (!app) return;
        const dd = parseTs(d.createdAt);
        const ad = parseTs(app.createdAt);
        if (dd && ad) avgAppToDeal.push((dd - ad) / 864e5);
    });
    const oppMetrics = document.getElementById('pa-opp-metrics');
    const avgPubDays = avgPublishToApp.length
        ? (avgPublishToApp.reduce((a, b) => a + b, 0) / avgPublishToApp.length).toFixed(1)
        : '—';
    if (oppMetrics) {
        oppMetrics.innerHTML = `
            <div class="pa-metric-tile"><div class="v">${snap.published}</div><div class="l">Published</div></div>
            <div class="pa-metric-tile"><div class="v">${snap.draft}</div><div class="l">Draft</div></div>
            <div class="pa-metric-tile"><div class="v">${snap.contracted}</div><div class="l">Contracted</div></div>
            <div class="pa-metric-tile"><div class="v">${snap.closedCancelled}</div><div class="l">Closed / cancelled</div></div>
            <div class="pa-metric-tile"><div class="v">${avgPubDays}${avgPubDays === '—' ? '' : 'd'}</div><div class="l">Avg. publish → application*</div></div>
            <div class="pa-metric-tile"><div class="v">${avgAppToDeal.length ? (avgAppToDeal.reduce((a, b) => a + b, 0) / avgAppToDeal.length).toFixed(1) : '—'}</div><div class="l">Avg. application → deal*</div></div>`;
    }

    Promise.all(snap.oppsF.map(async o => ({
        id: o.id,
        title: o.title || o.id,
        status: o.status,
        count: await dataService.getApplicationCountByOpportunityId(o.id),
        days: (() => {
            const appsOnOpp = snap.applications.filter(a => a.opportunityId === o.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            if (!appsOnOpp.length || !o.createdAt) return null;
            return (new Date(appsOnOpp[0].createdAt) - new Date(o.createdAt)) / 864e5;
        })()
    }))).then(offersPerOpp => {
        offersPerOpp.sort((a, b) => b.count - a.count);
        lastOffersPerOpportunity = offersPerOpp;
        const tb = document.querySelector('#pa-top-opps-table tbody');
        const empty = document.getElementById('pa-empty-top-opps');
        if (!offersPerOpp.length) {
            if (tb) tb.innerHTML = '';
            if (empty) { empty.hidden = false; empty.textContent = 'No opportunities in this slice.'; }
            return;
        }
        if (empty) empty.hidden = true;
        if (tb) {
            tb.innerHTML = offersPerOpp.slice(0, 15).map(o => `
                <tr>
                    <td>${escapeHtml(o.title)}</td>
                    <td>${escapeHtml(o.status || '')}</td>
                    <td>${o.count}</td>
                    <td>${o.days != null ? o.days.toFixed(1) + 'd' : '—'}</td>
                </tr>`).join('');
        }
    });

    const appOrder = ['pending', 'reviewing', 'shortlisted', 'in_negotiation', 'accepted', 'rejected', 'withdrawn'];
    const appBySt = countBy(snap.appsF, a => a.status || 'pending');
    const al = appOrder.filter(s => appBySt[s]);
    const ad = al.map(s => appBySt[s]);
    if (al.length) {
        createDoughnutChart('chart-pa-app-status', al, ad);
        toggleEmpty('chart-pa-app-status', 'pa-empty-app-status', false);
    } else toggleEmpty('chart-pa-app-status', 'pa-empty-app-status', true);

    const accepted = snap.appsF.filter(a => (a.status || '') === 'accepted').length;
    const rejected = snap.appsF.filter(a => (a.status || '') === 'rejected').length;
    const decided = accepted + rejected;
    const acceptRate = decided ? Math.round((accepted / decided) * 100) : 0;
    const rejectRate = decided ? Math.round((rejected / decided) * 100) : 0;
    const reviewTimes = [];
    snap.appsF.forEach(a => {
        if (!a.updatedAt || !a.createdAt) return;
        if (['rejected', 'accepted', 'shortlisted'].includes(a.status || '')) {
            reviewTimes.push((new Date(a.updatedAt) - new Date(a.createdAt)) / 864e5);
        }
    });
    const avgReview = reviewTimes.length ? (reviewTimes.reduce((x, y) => x + y, 0) / reviewTimes.length).toFixed(1) : '—';
    const appsPerOpp = snap.oppsF.length ? (snap.appsF.length / snap.oppsF.length).toFixed(2) : '0';

    const appM = document.getElementById('pa-app-metrics');
    if (appM) {
        appM.innerHTML = `
            <div class="pa-metric-tile"><div class="v">${acceptRate}%</div><div class="l">Acceptance rate*</div></div>
            <div class="pa-metric-tile"><div class="v">${rejectRate}%</div><div class="l">Rejection rate*</div></div>
            <div class="pa-metric-tile"><div class="v">${avgReview}</div><div class="l">Avg. review time (days)*</div></div>
            <div class="pa-metric-tile"><div class="v">${appsPerOpp}</div><div class="l">Applications / opportunity</div></div>`;
    }

    const applicantCounts = {};
    snap.appsF.forEach(a => {
        applicantCounts[a.applicantId] = applicantCounts[a.applicantId] || { n: 0, acc: 0 };
        applicantCounts[a.applicantId].n++;
        if ((a.status || '') === 'accepted') applicantCounts[a.applicantId].acc++;
    });
    const topApplicants = Object.entries(applicantCounts).sort((a, b) => b[1].n - a[1].n).slice(0, 10);
    const tbA = document.querySelector('#pa-top-applicants-table tbody');
    if (tbA) {
        tbA.innerHTML = topApplicants.map(([id, v]) => {
            const p = snap.users.find(u => u.id === id) || snap.companies.find(c => c.id === id);
            const name = p?.profile?.name || p?.email || id;
            return `<tr><td>${escapeHtml(name)}</td><td>${v.n}</td><td>${v.acc}</td></tr>`;
        }).join('') || '<tr><td colspan="3">No applicants</td></tr>';
    }
    document.getElementById('pa-empty-top-applicants').hidden = topApplicants.length > 0;

    const tbO = document.querySelector('#pa-top-opps-apps-table tbody');
    if (tbO) {
        const byOpp = {};
        snap.appsF.forEach(a => { byOpp[a.opportunityId] = (byOpp[a.opportunityId] || 0) + 1; });
        const topO = Object.entries(byOpp).sort((a, b) => b[1] - a[1]).slice(0, 10);
        tbO.innerHTML = topO.map(([oid, n]) => {
            const o = snap.oppById[oid];
            return `<tr><td>${escapeHtml(o?.title || oid)}</td><td>${n}</td></tr>`;
        }).join('');
        document.getElementById('pa-empty-top-opps-apps').hidden = topO.length > 0;
    }

    const bands = { 'Top (≥90%)': 0, 'High (75–90%)': 0, 'Medium (50–75%)': 0, 'Low (<50%)': 0 };
    snap.matchesF.forEach(m => {
        const s = Number(m.matchScore);
        const pct = s > 1 ? s : s * 100;
        if (pct >= 90) bands['Top (≥90%)']++;
        else if (pct >= 75) bands['High (75–90%)']++;
        else if (pct >= 50) bands['Medium (50–75%)']++;
        else bands['Low (<50%)']++;
    });
    const bLabels = Object.keys(bands).filter(k => bands[k] > 0);
    const bData = bLabels.map(k => bands[k]);
    if (bLabels.length) {
        createDoughnutChart('chart-pa-match-quality', bLabels, bData);
        toggleEmpty('chart-pa-match-quality', 'pa-empty-match-quality', false);
    } else toggleEmpty('chart-pa-match-quality', 'pa-empty-match-quality', true);

    const typeMap = { one_way: 'Recommended', two_way: 'Barter', consortium: 'Consortium', circular: 'Circular' };
    const pmByType = countBy(snap.postMatches.filter(pm => inRange(pm.createdAt, snap.range.start, snap.range.end)), pm => typeMap[pm.matchType] || pm.matchType || 'Other');
    const tmLabels = Object.keys(pmByType);
    const tmData = tmLabels.map(k => pmByType[k]);
    if (tmLabels.length) {
        createBarChart('chart-pa-match-types', tmLabels, tmData, 'Post-matches');
        toggleEmpty('chart-pa-match-types', 'pa-empty-match-types', false);
    } else toggleEmpty('chart-pa-match-types', 'pa-empty-match-types', true);

    renderFunnel('pa-funnel-matches', snap.funnelMatch);

    const matchSkillCounts = {};
    snap.matchesF.forEach(m => {
        const opp = snap.oppById[m.opportunityId];
        (opp?.scope?.requiredSkills || []).forEach(sk => {
            matchSkillCounts[sk] = (matchSkillCounts[sk] || 0) + 1;
        });
    });
    const msTop = Object.entries(matchSkillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (msTop.length) {
        createBarChart('chart-pa-match-skills', msTop.map(x => x[0]), msTop.map(x => x[1]), 'Matches');
        toggleEmpty('chart-pa-match-skills', 'pa-empty-match-skills', false);
    } else toggleEmpty('chart-pa-match-skills', 'pa-empty-match-skills', true);

    const lowCats = Object.entries(snap.oppSkillCounts)
        .map(([skill, n]) => ({ skill, n, m: matchSkillCounts[skill] || 0 }))
        .filter(x => x.n > 0 && x.m / x.n < 0.3)
        .sort((a, b) => (a.m / a.n) - (b.m / b.n))
        .slice(0, 8);
    const lowEl = document.getElementById('pa-low-match-cats');
    const lowEmpty = document.getElementById('pa-empty-low-match');
    if (lowEl) {
        if (!lowCats.length) {
            lowEl.innerHTML = '';
            if (lowEmpty) { lowEmpty.hidden = false; lowEmpty.textContent = 'No under-performing categories detected in this slice.'; }
        } else {
            if (lowEmpty) lowEmpty.hidden = true;
            lowEl.innerHTML = '<ul style="margin:0;padding-left:1.1rem;line-height:1.6">' + lowCats.map(x =>
                `<li><strong>${escapeHtml(x.skill)}</strong> — ${x.m} matches / ${x.n} opps (ratio ${(x.m / Math.max(1, x.n)).toFixed(2)})</li>`).join('') + '</ul>';
        }
    }

    const avgMatchScore = snap.matchesF.length
        ? (snap.matchesF.reduce((acc, m) => acc + (Number(m.matchScore) > 1 ? Number(m.matchScore) : Number(m.matchScore) * 100), 0) / snap.matchesF.length).toFixed(1)
        : '—';
    const matchAvgEl = document.getElementById('pa-match-avg');
    if (matchAvgEl) matchAvgEl.textContent = `Average match score (0–100 scale): ${avgMatchScore}`;

    const dealCounts = countBy(snap.dealsF, d => d.status || 'unknown');
    const dealLabels = Object.keys(dealCounts).map(s => dealStatusDisplay(s));
    const dealData = Object.keys(dealCounts).map(s => dealCounts[s]);
    if (dealLabels.length) {
        createBarChart('chart-pa-deals-status', dealLabels, dealData, 'Deals');
        toggleEmpty('chart-pa-deals-status', 'pa-empty-deals-status', false);
    } else toggleEmpty('chart-pa-deals-status', 'pa-empty-deals-status', true);

    const cCounts = countBy(snap.contractsF, c => c.status || 'unknown');
    const cLabels = Object.keys(cCounts);
    const cData = cLabels.map(k => cCounts[k]);
    if (cLabels.length) {
        createDoughnutChart('chart-pa-contracts-status', cLabels, cData);
        toggleEmpty('chart-pa-contracts-status', 'pa-empty-contracts-status', false);
    } else toggleEmpty('chart-pa-contracts-status', 'pa-empty-contracts-status', true);

    let totalDealValue = 0;
    let activeDealValue = 0;
    let pendingContractValue = 0;
    let completedCollabValue = 0;
    snap.dealsF.forEach(d => {
        const v = cashAmount(d);
        totalDealValue += v;
        if (['active', 'execution', 'delivery'].includes(d.status || '')) activeDealValue += v;
        if (['completed', 'closed'].includes(d.status || '')) completedCollabValue += v;
    });
    snap.contractsF.forEach(c => {
        if ((c.status || '') === 'pending' || pendingSignatureContract(c)) pendingContractValue += cashAmount(c);
    });

    const signingTimes = [];
    snap.contractsF.forEach(c => {
        if (!c.signedAt || !c.createdAt) return;
        signingTimes.push((new Date(c.signedAt) - new Date(c.createdAt)) / 864e5);
    });
    const avgSigning = signingTimes.length ? (signingTimes.reduce((a, b) => a + b, 0) / signingTimes.length).toFixed(1) : '—';

    let delayedExec = 0;
    snap.dealsF.forEach(d => {
        if ((d.status || '') !== 'execution') return;
        (d.milestones || []).forEach(m => {
            if (m.dueDate && m.status !== 'approved' && new Date(m.dueDate) < new Date()) delayedExec++;
        });
    });

    const dvm = document.getElementById('pa-deal-value-metrics');
    if (dvm) {
        dvm.innerHTML = `
            <div class="pa-metric-tile"><div class="v">${totalDealValue.toLocaleString()} SAR</div><div class="l">Total deal value*</div></div>
            <div class="pa-metric-tile"><div class="v">${activeDealValue.toLocaleString()} SAR</div><div class="l">Active pipeline value*</div></div>
            <div class="pa-metric-tile"><div class="v">${pendingContractValue.toLocaleString()} SAR</div><div class="l">Pending contract value*</div></div>
            <div class="pa-metric-tile"><div class="v">${avgSigning}d</div><div class="l">Avg. signing time*</div></div>
            <div class="pa-metric-tile"><div class="v">${snap.kpi.pendingSignatures}</div><div class="l">Contracts awaiting signature</div></div>
            <div class="pa-metric-tile"><div class="v">${delayedExec}</div><div class="l">Overdue milestones (execution)</div></div>
            <div class="pa-metric-tile"><div class="v">${completedCollabValue.toLocaleString()} SAR</div><div class="l">Completed / closed deal value*</div></div>`;
    }

    const usersOnly = snap.users;
    const byType = countBy(usersOnly, u => {
        if (u.role === 'professional') return 'Professionals';
        if (u.role === 'consultant') return 'Consultants';
        if (u.role === 'admin') return 'Admins';
        return u.role || 'Other';
    });
    byType.Companies = snap.companies.length;
    const utLabels = Object.keys(byType).sort((a, b) => byType[b] - byType[a]);
    const utData = utLabels.map(k => byType[k]);
    if (utLabels.length) {
        createDoughnutChart('chart-pa-users-type', utLabels, utData);
        toggleEmpty('chart-pa-users-type', 'pa-empty-users-type', false);
    } else toggleEmpty('chart-pa-users-type', 'pa-empty-users-type', true);

    if (usLabels.length) {
        createDoughnutChart('chart-pa-users-status-detail', usLabels, usData);
        toggleEmpty('chart-pa-users-status-detail', 'pa-empty-users-status-detail', false);
    } else toggleEmpty('chart-pa-users-status-detail', 'pa-empty-users-status-detail', true);

    const reg = snap.users.length + snap.companies.length;
    const pending = allPeople.filter(p => (p.status || '') === 'pending').length;
    const active = allPeople.filter(p => (p.status || '') === 'active').length;
    const vf = document.getElementById('pa-verification-funnel');
    if (vf) {
        const steps = [
            { l: 'Registered', v: reg },
            { l: 'Pending review', v: pending },
            { l: 'Active', v: active }
        ];
        const max = Math.max(1, reg);
        vf.innerHTML = steps.map(s => `
            <div class="pa-vf-row">
                <div class="pa-vf-label"><span>${escapeHtml(s.l)}</span><span>${s.v}</span></div>
                <div class="pa-vf-bar"><div class="pa-vf-fill" style="width:${Math.min(100, Math.round((s.v / max) * 100))}%"></div></div>
            </div>`).join('');
    }

    const riskWeeks = weekBuckets(snap.range.start, snap.range.end);
    const suspSeries = riskWeeks.map(() => 0);
    const rejSeries = riskWeeks.map(() => 0);
    snap.users.forEach(u => {
        if ((u.status || '') !== 'suspended' && (u.status || '') !== 'rejected') return;
        const b = bucketWeek(u.updatedAt || u.createdAt, riskWeeks);
        if (!b) return;
        const idx = riskWeeks.indexOf(b);
        if (idx < 0) return;
        if ((u.status || '') === 'suspended') suspSeries[idx]++;
        else rejSeries[idx]++;
    });
    if (suspSeries.some(x => x) || rejSeries.some(x => x)) {
        createLineChart('chart-pa-users-risk', riskWeeks, [
            { label: 'Suspended (updates)', data: suspSeries, borderColor: '#f59e0b', tension: 0.2, fill: false },
            { label: 'Rejected', data: rejSeries, borderColor: '#ef4444', tension: 0.2, fill: false }
        ]);
        toggleEmpty('chart-pa-users-risk', 'pa-empty-users-risk', false);
    } else toggleEmpty('chart-pa-users-risk', 'pa-empty-users-risk', true);

    const activeUsersByWeek = riskWeeks.map(() => 0);
    snap.users.forEach(u => {
        if ((u.status || '') !== 'active') return;
        const b = bucketWeek(u.updatedAt || u.createdAt, riskWeeks);
        if (!b) return;
        const idx = riskWeeks.indexOf(b);
        if (idx >= 0) activeUsersByWeek[idx]++;
    });
    createLineChart('chart-pa-users-time', riskWeeks, [
        { label: 'Active user touches (proxy)', data: activeUsersByWeek, borderColor: '#0d9488', tension: 0.2, fill: true, backgroundColor: 'rgba(13,148,136,0.08)' }
    ]);
    toggleEmpty('chart-pa-users-time', 'pa-empty-users-time', false);

    const compActivity = {};
    snap.companies.forEach(c => {
        compActivity[c.id] = { name: c.profile?.name || c.email, opps: 0, deals: 0 };
    });
    snap.opportunities.forEach(o => {
        if (snap.companies.find(c => c.id === o.creatorId) && compActivity[o.creatorId]) compActivity[o.creatorId].opps++;
    });
    snap.deals.forEach(d => {
        (d.participants || []).forEach(p => {
            if (p.userId && compActivity[p.userId]) compActivity[p.userId].deals++;
        });
    });
    const topC = Object.values(compActivity).sort((a, b) => (b.opps + b.deals) - (a.opps + a.deals)).slice(0, 8);
    const tbC = document.querySelector('#pa-top-companies-table tbody');
    if (tbC) {
        tbC.innerHTML = topC.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${c.opps}</td><td>${c.deals}</td></tr>`).join('');
        const ec = document.getElementById('pa-empty-top-companies');
        if (ec) ec.hidden = topC.some(x => x.opps + x.deals > 0);
    }

    const pros = {};
    snap.users.filter(u => u.role === 'professional').forEach(u => {
        pros[u.id] = { name: u.profile?.name || u.email, apps: 0, deals: 0 };
    });
    snap.appsF.forEach(a => {
        if (pros[a.applicantId]) pros[a.applicantId].apps++;
    });
    snap.dealsF.forEach(d => {
        (d.participants || []).forEach(p => {
            if (pros[p.userId]) pros[p.userId].deals++;
        });
    });
    const topP = Object.values(pros).sort((a, b) => (b.apps + b.deals) - (a.apps + a.deals)).slice(0, 8);
    const tbP = document.querySelector('#pa-top-pros-table tbody');
    if (tbP) {
        tbP.innerHTML = topP.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${p.apps}</td><td>${p.deals}</td></tr>`).join('');
        document.getElementById('pa-empty-top-pros').hidden = topP.some(x => x.apps + x.deals);
    }

    const auditFiltered = snap.auditLogs.filter(l => auditCategoryMatch(auditCategory, l.action, l.entityType));
    const auditByAction = countBy(auditFiltered, l => l.action || 'unknown');
    const aTop = Object.entries(auditByAction).sort((a, b) => b[1] - a[1]).slice(0, 12);
    if (aTop.length) {
        createBarChart('chart-pa-audit-actions', aTop.map(x => x[0]), aTop.map(x => x[1]), 'Audit');
        toggleEmpty('chart-pa-audit-actions', 'pa-empty-audit-chart', false);
    } else toggleEmpty('chart-pa-audit-actions', 'pa-empty-audit-chart', true);

    const notifByType = countBy(snap.notifications, n => n.type || 'other');
    const ntLabels = Object.keys(notifByType).slice(0, 10);
    const ntData = ntLabels.map(k => notifByType[k]);
    if (ntLabels.length) {
        createDoughnutChart('chart-pa-notif-types', ntLabels, ntData);
        toggleEmpty('chart-pa-notif-types', 'pa-empty-notif', false);
    } else toggleEmpty('chart-pa-notif-types', 'pa-empty-notif', true);

    const tbAudit = document.querySelector('#pa-audit-recent-table tbody');
    if (tbAudit) {
        tbAudit.innerHTML = auditFiltered.slice(0, 40).map(l => `
            <tr>
                <td>${escapeHtml((l.timestamp || '').replace('T', ' ').slice(0, 19))}</td>
                <td>${escapeHtml(l.action || '')}</td>
                <td>${escapeHtml(l.entityType || '')} ${escapeHtml(l.entityId || '')}</td>
                <td>${escapeHtml(l.userId || '')}</td>
            </tr>`).join('');
        document.getElementById('pa-empty-audit-list').hidden = auditFiltered.length > 0;
    }

    const bySite = {};
    snap.appsF.forEach(app => {
        const opp = snap.oppById[app.opportunityId];
        const site = opp ? (opp.location || opp.locationRegion || opp.locationCity || 'Unknown').trim() || 'Unknown' : 'Unknown';
        bySite[site] = (bySite[site] || 0) + 1;
    });
    lastOffersBySite = Object.entries(bySite).map(([site, count]) => ({ site, count })).sort((a, b) => b.count - a.count);

    updateMap(snap);
    renderLocationsTable(snap, prevSnap);
}

function populateCategories(opportunities) {
    const sel = document.getElementById('pa-filter-category');
    if (!sel) return;
    const skills = new Set();
    opportunities.forEach(o => {
        (o.scope?.requiredSkills || []).forEach(s => skills.add(s));
        (o.scope?.sectors || []).forEach(s => skills.add(s));
        if (o.industry) skills.add(o.industry);
    });
    const cur = sel.value;
    sel.innerHTML = '<option value="all">All categories</option>' + [...skills].sort().map(s =>
        `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    sel.value = [...skills].includes(cur) ? cur : 'all';
}

async function loadReports() {
    try {
        Object.keys(chartInstances).forEach(id => destroyChart(id));
        const range = getFilterRange();
        const region = document.getElementById('pa-filter-region')?.value || 'all';
        const userType = document.getElementById('pa-filter-user-type')?.value || 'all';
        const category = document.getElementById('pa-filter-category')?.value || 'all';
        const oppStatus = document.getElementById('pa-filter-status')?.value || 'all';

        const opportunities = await dataService.getOpportunities();
        populateCategories(opportunities);

        const spanMs = range.end.getTime() - range.start.getTime();
        const prevPrevEnd = new Date(range.prevStart.getTime() - 1);
        const prevPrevStart = new Date(prevPrevEnd.getTime() - spanMs);
        const snap = await buildSnapshot(range, { start: range.prevStart, end: range.prevEnd }, region, userType, category, oppStatus);
        const prevSnap = await buildSnapshot(
            { start: range.prevStart, end: range.prevEnd },
            { start: prevPrevStart, end: prevPrevEnd },
            region,
            userType,
            category,
            oppStatus
        );
        lastSnapshot = snap;

        renderKpiCards(snap);
        renderChartsForSnapshot(snap, prevSnap);
    } catch (err) {
        console.error('Error loading platform analytics:', err);
    }
}

function setupFilters() {
    const dateSel = document.getElementById('pa-filter-date');
    const customWrap = document.getElementById('pa-filter-custom-wrap');
    dateSel?.addEventListener('change', () => {
        if (customWrap) customWrap.hidden = dateSel.value !== 'custom';
    });
    document.getElementById('pa-apply-filters')?.addEventListener('click', () => loadReports());
    ['pa-filter-date', 'pa-filter-region', 'pa-filter-user-type', 'pa-filter-category', 'pa-filter-status', 'pa-filter-start', 'pa-filter-end'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => loadReports());
    });
}

function setupAuditChips() {
    document.querySelectorAll('[data-audit-cat]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-audit-cat]').forEach(c => c.classList.remove('pa-chip-active'));
            chip.classList.add('pa-chip-active');
            auditCategory = chip.getAttribute('data-audit-cat') || 'all';
            loadReports();
        });
    });
}

function setupScheduleModal() {
    const modal = document.getElementById('pa-schedule-modal');
    document.getElementById('pa-schedule-btn')?.addEventListener('click', () => {
        if (modal) {
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
        }
    });
    modal?.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        });
    });
}

async function initAdminReports() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    setupModuleTabs();
    setupExportMenu();
    setupFilters();
    setupAuditChips();
    setupScheduleModal();

    document.getElementById('pa-export-csv')?.addEventListener('click', exportSummaryCSV);
    document.getElementById('pa-export-excel')?.addEventListener('click', exportExcelTSV);
    document.getElementById('pa-export-pdf')?.addEventListener('click', exportPDFPrint);
    document.getElementById('export-offers-by-site-csv')?.addEventListener('click', exportOffersBySiteCSV);
    document.getElementById('export-offers-per-opp-csv')?.addEventListener('click', exportOffersPerOpportunityCSV);

    await loadReports();
}

window.initAdminReports = initAdminReports;
