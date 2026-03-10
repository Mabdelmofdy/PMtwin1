/**
 * Deals List – post-match deals for the current user
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

function getMatchTypeLabel(matchType) {
    const map = { one_way: 'One Way', two_way: 'Two Way', consortium: 'Consortium', circular: 'Circular' };
    return map[matchType] || matchType;
}

async function initDeals() {
    const container = document.getElementById('deals-list');
    if (!container) return;

    const user = authService.getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-gray-500">Please log in to see your deals.</p>';
        return;
    }

    try {
        const deals = await dataService.getDealsByUserId(user.id);
        if (!deals || deals.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No deals yet. Accept a match from Pipeline to start a deal.</p>';
            return;
        }

        container.innerHTML = deals.map(deal => {
            const statusLabel = getDealStatusLabel(deal.status);
            const statusClass = getDealStatusBadgeClass(deal.status);
            const typeLabel = getMatchTypeLabel(deal.matchType);
            const route = CONFIG.ROUTES.DEALS + '/' + deal.id;
            return '<div class="deal-card">' +
                '<h2 class="deal-card-title">' + escapeHtml(deal.title || 'Deal') + '</h2>' +
                '<div class="deal-card-meta">' +
                '<span class="badge badge-' + statusClass + '">' + escapeHtml(statusLabel) + '</span> ' +
                '<span class="text-gray-500">' + escapeHtml(typeLabel) + '</span>' +
                '</div>' +
                '<div class="deal-card-actions">' +
                '<a href="#" data-route="' + route + '" class="btn btn-primary btn-sm">Open deal</a>' +
                '</div></div>';
        }).join('');
    } catch (e) {
        console.error('Deals load error:', e);
        container.innerHTML = '<p class="text-red-600">Failed to load deals.</p>';
    }
}
