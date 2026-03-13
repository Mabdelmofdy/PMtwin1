/**
 * Admin Contracts – list all contracts with status and parties count. Link to contract detail.
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getContractStatusLabel(s) {
    const map = { pending: 'Pending', active: 'Active', completed: 'Completed', terminated: 'Terminated' };
    return map[s] || s || '—';
}

function getContractStatusBadgeClass(s) {
    const map = { pending: 'secondary', active: 'primary', completed: 'success', terminated: 'danger' };
    return map[s] || 'secondary';
}

async function initAdminContracts() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    await loadContracts();
    document.getElementById('apply-filters')?.addEventListener('click', () => loadContracts());
}

async function loadContracts() {
    const container = document.getElementById('admin-contracts-list');
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    try {
        let contracts = await dataService.getContracts();
        const statusFilter = document.getElementById('filter-status')?.value;
        if (statusFilter) contracts = contracts.filter(c => c.status === statusFilter);
        contracts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (contracts.length === 0) {
            container.innerHTML = '<div class="empty-state">No contracts match the filters.</div>';
            return;
        }

        const contractDetailRoute = (id) => (CONFIG.ROUTES.CONTRACT_DETAIL || '/contracts/:id').replace(':id', id);
        let table = '<table class="admin-contracts-table"><thead><tr><th>Scope</th><th>Status</th><th>Parties</th><th></th></tr></thead><tbody>';
        for (const c of contracts) {
            const parties = dataService.getContractParties(c);
            const scope = c.scope || c.id;
            table += '<tr>';
            table += '<td>' + escapeHtml(scope) + '</td>';
            table += '<td><span class="badge badge-' + getContractStatusBadgeClass(c.status) + '">' + escapeHtml(getContractStatusLabel(c.status)) + '</span></td>';
            table += '<td>' + parties.length + '</td>';
            table += '<td><a href="#" data-route="' + contractDetailRoute(c.id) + '" class="btn btn-secondary btn-sm">View</a></td>';
            table += '</tr>';
        }
        table += '</tbody></table>';
        container.innerHTML = table;

        container.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const route = this.getAttribute('data-route');
                if (route && router) router.navigate(route);
            });
        });
    } catch (err) {
        console.error('Admin contracts load error:', err);
        container.innerHTML = '<div class="empty-state">Error loading contracts.</div>';
    }
}
