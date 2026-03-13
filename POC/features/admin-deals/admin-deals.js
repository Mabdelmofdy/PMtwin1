/**
 * Admin Deals – list all deals with filters (status, deal type). Link to deal detail.
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getDealStatusLabel(s) {
    const map = { negotiating: 'Negotiating', draft: 'Draft', review: 'In Review', signing: 'Signing', active: 'Active', execution: 'Execution', delivery: 'Delivery', completed: 'Completed', closed: 'Closed' };
    return map[s] || s;
}

function getDealStatusBadgeClass(s) {
    const map = { negotiating: 'warning', draft: 'secondary', review: 'info', signing: 'primary', active: 'primary', execution: 'primary', delivery: 'info', completed: 'success', closed: 'secondary' };
    return map[s] || 'secondary';
}

function getDealTypeLabel(matchType) {
    const map = { one_way: 'One Way', two_way: 'Barter', consortium: 'Consortium', circular: 'Circular' };
    return map[matchType] || matchType || '—';
}

function getContractStatusLabel(s) {
    const map = { pending: 'Pending', active: 'Active', completed: 'Completed', terminated: 'Terminated' };
    return map[s] || s || '—';
}

async function initAdminDeals() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    await loadDeals();
    document.getElementById('apply-filters')?.addEventListener('click', () => loadDeals());
}

async function loadDeals() {
    const container = document.getElementById('admin-deals-list');
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    try {
        let deals = await dataService.getDeals();
        const statusFilter = document.getElementById('filter-status')?.value;
        const typeFilter = document.getElementById('filter-deal-type')?.value;
        if (statusFilter) deals = deals.filter(d => d.status === statusFilter);
        if (typeFilter) deals = deals.filter(d => (d.matchType || 'one_way') === typeFilter);
        deals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const contractStatusByDeal = {};
        for (const d of deals) {
            if (d.contractId) {
                const c = await dataService.getContractById(d.contractId);
                contractStatusByDeal[d.id] = c ? (c.status || '—') : '—';
            } else {
                contractStatusByDeal[d.id] = '—';
            }
        }

        if (deals.length === 0) {
            container.innerHTML = '<div class="empty-state">No deals match the filters.</div>';
            return;
        }

        const dealRoute = (id) => (CONFIG.ROUTES.ADMIN_DEAL_DETAIL || '/admin/deals/:id').replace(':id', id);
        const oppRoute = (id) => (CONFIG.ROUTES.OPPORTUNITY_DETAIL || '/opportunities/:id').replace(':id', id);

        let table = '<table class="admin-deals-table"><thead><tr><th>Deal</th><th>Status</th><th>Deal type</th><th>Participants</th><th>Linked opportunity</th><th>Contract status</th><th></th></tr></thead><tbody>';
        for (const d of deals) {
            const participants = d.participants || [];
            const partCount = participants.length;
            const oppId = d.opportunityId || (d.opportunityIds && d.opportunityIds[0]);
            const contractStatus = contractStatusByDeal[d.id];
            table += '<tr>';
            table += '<td>' + escapeHtml(d.title || d.id) + '</td>';
            table += '<td><span class="badge badge-' + getDealStatusBadgeClass(d.status) + '">' + escapeHtml(getDealStatusLabel(d.status)) + '</span></td>';
            table += '<td>' + escapeHtml(getDealTypeLabel(d.matchType)) + '</td>';
            table += '<td>' + partCount + '</td>';
            table += '<td>' + (oppId ? '<a href="#" data-route="' + oppRoute(oppId) + '">' + escapeHtml(oppId) + '</a>' : '—') + '</td>';
            table += '<td>' + (contractStatus !== '—' ? getContractStatusLabel(contractStatus) : '—') + '</td>';
            table += '<td><a href="#" data-route="' + dealRoute(d.id) + '" class="btn btn-secondary btn-sm">View</a></td>';
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
        console.error('Admin deals load error:', err);
        container.innerHTML = '<div class="empty-state">Error loading deals.</div>';
    }
}
