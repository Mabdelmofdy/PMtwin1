/**
 * Admin System Health – counts (users, opportunities, deals, contracts, matches, audit) and service availability.
 * Layout aligned with Admin Matching Center (hero, control panel, metric cards, table).
 */

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderHealthMetricCard(value, label, detail) {
    return ''
        + '<div class="stat-card health-metric-card">'
        + '<div>'
        + '<div class="stat-value">' + escapeHtml(value) + '</div>'
        + '<div class="stat-label">' + escapeHtml(label) + '</div>'
        + (detail ? '<div class="stat-detail">' + escapeHtml(detail) + '</div>' : '')
        + '</div>'
        + '</div>';
}

function renderServiceRow(name, ok, okLabel, notes) {
    const pillClass = ok ? 'is-ok' : 'is-warn';
    const statusText = ok ? okLabel : okLabel;
    return ''
        + '<tr>'
        + '<td>' + escapeHtml(name) + '</td>'
        + '<td><span class="health-status-pill ' + pillClass + '">' + escapeHtml(statusText) + '</span></td>'
        + '<td>' + escapeHtml(notes) + '</td>'
        + '</tr>';
}

async function initAdminHealth() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const btn = document.getElementById('health-refresh-btn');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => loadHealth({ manual: true }));
    }

    await loadHealth({ manual: false });
}

/**
 * @param {{ manual?: boolean }} [opts]
 */
async function loadHealth(opts) {
    const manual = !!(opts && opts.manual);
    const gridEl = document.getElementById('health-stats-grid');
    const servicesEl = document.getElementById('health-services');
    const loadingEl = document.getElementById('health-run-loading');
    const errorEl = document.getElementById('health-run-error');
    const refreshStatus = document.getElementById('health-refresh-status');
    const lastRefreshed = document.getElementById('health-last-refreshed');
    const runState = document.getElementById('health-run-state');
    const btn = document.getElementById('health-refresh-btn');

    if (!gridEl) return;

    if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
    }
    if (loadingEl) loadingEl.hidden = false;
    if (btn) btn.disabled = true;
    if (runState) {
        runState.classList.add('is-running');
        runState.classList.remove('is-error');
    }
    if (refreshStatus) refreshStatus.textContent = manual ? 'Refreshing metrics…' : 'Loading metrics…';

    try {
        const [users, companies, opportunities, deals, contracts, postMatches, auditLogs] = await Promise.all([
            dataService.getUsers ? dataService.getUsers() : Promise.resolve([]),
            dataService.getCompanies ? dataService.getCompanies() : Promise.resolve([]),
            dataService.getOpportunities ? dataService.getOpportunities() : Promise.resolve([]),
            dataService.getDeals ? dataService.getDeals() : Promise.resolve([]),
            dataService.getContracts ? dataService.getContracts() : Promise.resolve([]),
            dataService.getPostMatches ? dataService.getPostMatches() : Promise.resolve([]),
            dataService.getAuditLogs ? dataService.getAuditLogs({}) : Promise.resolve([])
        ]);

        const stats = [
            { label: 'Users', value: (users || []).length, detail: 'Accounts in local store' },
            { label: 'Companies', value: (companies || []).length, detail: 'Organization profiles' },
            { label: 'Opportunities', value: (opportunities || []).length, detail: 'All opportunity records' },
            { label: 'Deals', value: (deals || []).length, detail: 'Collaboration deals' },
            { label: 'Contracts', value: (contracts || []).length, detail: 'Contract records' },
            { label: 'Post matches', value: (postMatches || []).length, detail: 'Persisted match rows' },
            { label: 'Audit log entries', value: (auditLogs || []).length, detail: 'Admin activity history' }
        ];

        gridEl.innerHTML = stats.map(s => renderHealthMetricCard(s.value, s.label, s.detail)).join('');

        if (servicesEl) {
            const matchingAvailable = !!(window.matchingService || (typeof matchingService !== 'undefined' && matchingService));
            const dataAvailable = !!(window.dataService || (typeof dataService !== 'undefined' && dataService));
            servicesEl.innerHTML =
                renderServiceRow('Data service', dataAvailable, dataAvailable ? 'Available' : 'Unavailable', dataAvailable ? 'Initialized for this session' : 'Script or binding missing') +
                renderServiceRow('Matching service', matchingAvailable, matchingAvailable ? 'Available' : 'Not loaded', matchingAvailable ? 'Pipeline ready for opportunities' : 'Load matching scripts or check console');
        }

        const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (lastRefreshed) lastRefreshed.textContent = nowLabel;
        if (refreshStatus) refreshStatus.textContent = 'Snapshot updated at ' + nowLabel;
        if (runState) runState.classList.remove('is-error');
    } catch (err) {
        console.error('Admin health load error:', err);
        if (gridEl) gridEl.innerHTML = '';
        if (servicesEl) servicesEl.innerHTML = '';
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = (err && err.message) ? err.message : 'Error loading health metrics.';
        }
        if (runState) runState.classList.add('is-error');
        if (refreshStatus) refreshStatus.textContent = 'Load failed';
    } finally {
        if (loadingEl) loadingEl.hidden = true;
        if (btn) btn.disabled = false;
        if (runState) runState.classList.remove('is-running');
    }
}
