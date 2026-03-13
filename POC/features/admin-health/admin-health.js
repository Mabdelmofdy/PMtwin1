/**
 * Admin System Health – counts (users, opportunities, deals, contracts, matches, audit) and service availability.
 */

async function initAdminHealth() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    await loadHealth();
}

async function loadHealth() {
    const gridEl = document.getElementById('health-stats-grid');
    const servicesEl = document.getElementById('health-services');
    if (!gridEl) return;

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
            { label: 'Users', value: (users || []).length },
            { label: 'Companies', value: (companies || []).length },
            { label: 'Opportunities', value: (opportunities || []).length },
            { label: 'Deals', value: (deals || []).length },
            { label: 'Contracts', value: (contracts || []).length },
            { label: 'Post matches', value: (postMatches || []).length },
            { label: 'Audit log entries', value: (auditLogs || []).length }
        ];

        gridEl.innerHTML = stats.map(s => '<div class="health-stat-card"><div class="health-stat-value">' + s.value + '</div><div class="health-stat-label">' + s.label + '</div></div>').join('');

        if (servicesEl) {
            const matchingAvailable = !!(window.matchingService || (typeof matchingService !== 'undefined' && matchingService));
            const dataAvailable = !!(window.dataService || (typeof dataService !== 'undefined' && dataService));
            servicesEl.innerHTML =
                '<div class="health-service-row"><span class="health-service-name">Data service</span><span class="health-service-status ' + (dataAvailable ? 'health-service-ok' : 'health-service-unavailable') + '">' + (dataAvailable ? 'Available' : '—') + '</span></div>' +
                '<div class="health-service-row"><span class="health-service-name">Matching service</span><span class="health-service-status ' + (matchingAvailable ? 'health-service-ok' : 'health-service-unavailable') + '">' + (matchingAvailable ? 'Available' : 'Not loaded') + '</span></div>';
        }
    } catch (err) {
        console.error('Admin health load error:', err);
        if (gridEl) gridEl.innerHTML = '<div class="empty-state">Error loading health metrics.</div>';
    }
}
