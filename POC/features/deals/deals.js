/**
 * Deals List – post-match deals for the current user
 */

let dealsShowActiveOnly = false;

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

async function loadDealsList() {
    const container = document.getElementById('deals-list');
    if (!container) return;

    const user = authService.getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-gray-500">Please log in to see your deals.</p>';
        return;
    }

    container.innerHTML = '<div class="spinner"></div>';

    try {
        let deals = await dataService.getDealsByUserId(user.id);
        if (dealsShowActiveOnly) {
            const activeLike = ['negotiating', 'draft', 'review', 'signing', 'active', 'execution', 'delivery'];
            deals = (deals || []).filter((d) => activeLike.includes(d.status));
        }
        if (!deals || deals.length === 0) {
            container.innerHTML =
                '<p class="text-gray-500">' +
                (dealsShowActiveOnly
                    ? 'No active deals in progress right now.'
                    : 'No deals yet. Accept a match from Pipeline to start a deal.') +
                '</p>';
            return;
        }

        container.innerHTML = deals
            .map((deal) => {
                const statusLabel = getDealStatusLabel(deal.status);
                const statusClass = getDealStatusBadgeClass(deal.status);
                const typeLabel = getMatchTypeLabel(deal.matchType);
                const route = CONFIG.ROUTES.DEALS + '/' + deal.id;
                return (
                    '<div class="deal-card">' +
                    '<h2 class="deal-card-title">' +
                    escapeHtml(deal.title || 'Deal') +
                    '</h2>' +
                    '<div class="deal-card-meta">' +
                    '<span class="badge badge-' +
                    statusClass +
                    '">' +
                    escapeHtml(statusLabel) +
                    '</span> ' +
                    '<span class="text-gray-500">' +
                    escapeHtml(typeLabel) +
                    '</span>' +
                    '</div>' +
                    '<div class="deal-card-actions">' +
                    '<a href="#" data-route="' +
                    route +
                    '" class="btn btn-primary btn-sm">Open deal</a>' +
                    '</div></div>'
                );
            })
            .join('');
        if (dealsShowActiveOnly) {
            document.getElementById('deals-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (e) {
        console.error('Deals load error:', e);
        container.innerHTML = '<p class="text-red-600">Failed to load deals.</p>';
    }
}

async function initDeals() {
    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.deals);
    }
    document.getElementById('page-cta-deals-active')?.addEventListener('click', async (e) => {
        e.preventDefault();
        dealsShowActiveOnly = true;
        await loadDealsList();
        dealsShowActiveOnly = false;
    });

    await loadDealsList();
}
