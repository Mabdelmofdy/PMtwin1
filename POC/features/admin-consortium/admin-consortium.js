/**
 * Admin Consortium – list consortium deals with lead, members, roles, dropped and replacement participants.
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getDealStatusLabel(s) {
    const map = { negotiating: 'Negotiating', draft: 'Draft', review: 'Review', signing: 'Signing', active: 'Active', execution: 'Execution', delivery: 'Delivery', completed: 'Completed', closed: 'Closed' };
    return map[s] || s;
}

function getParticipantRole(deal, p) {
    if (deal.roleSlots && deal.roleSlots[p.userId]) return deal.roleSlots[p.userId];
    const roles = (deal.payload && deal.payload.roles) || [];
    const r = roles.find(x => x.userId === p.userId);
    return (r && r.role) || (p.role === 'consortium_lead' ? 'Lead' : 'Member');
}

async function initAdminConsortium() {
    if (!authService.canAccessAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    await loadConsortiumDeals();
}

async function loadConsortiumDeals() {
    const container = document.getElementById('admin-consortium-list');
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const allDeals = await dataService.getDeals();
        const deals = allDeals.filter(d => (d.matchType || '') === 'consortium');
        deals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (deals.length === 0) {
            container.innerHTML = '<div class="empty-state">No consortium deals.</div>';
            return;
        }

        const dealRoute = (id) => (CONFIG.ROUTES.ADMIN_DEAL_DETAIL || '/admin/deals/:id').replace(':id', id);
        const userIds = new Set();
        deals.forEach(d => (d.participants || []).forEach(p => userIds.add(p.userId)));
        const userMap = {};
        for (const id of userIds) {
            const u = await dataService.getUserOrCompanyById(id);
            userMap[id] = u?.profile?.name || u?.email || id;
        }

        let html = '';
        for (const d of deals) {
            const participants = d.participants || [];
            const lead = participants.find(p => (p.role || '') === 'consortium_lead' || getParticipantRole(d, p).toLowerCase().includes('lead'));
            const members = participants.filter(p => p !== lead);
            const dropped = participants.filter(p => (p.status || 'active') === 'dropped');
            const replacementUserIds = new Set((d.participants || []).filter(p => p.replacedByUserId).map(p => p.replacedByUserId));
            const replacements = participants.filter(p => replacementUserIds.has(p.userId));
            const leadName = lead ? (userMap[lead.userId] || lead.userId) : '—';
            const statusLabel = getDealStatusLabel(d.status);

            html += '<div class="admin-consortium-card">';
            html += '<h3><a href="#" data-route="' + dealRoute(d.id) + '">' + escapeHtml(d.title || d.id) + '</a></h3>';
            html += '<div class="consortium-meta"><span class="badge badge-secondary">' + escapeHtml(statusLabel) + '</span></div>';
            html += '<p><strong>Consortium lead:</strong> ' + escapeHtml(leadName) + '</p>';
            html += '<p><strong>Members & roles:</strong></p><ul>';
            for (const p of members) {
                if ((p.status || 'active') === 'dropped') continue;
                const role = getParticipantRole(d, p);
                const name = userMap[p.userId] || p.userId;
                html += '<li class="role-row">' + escapeHtml(name) + ' <span class="badge badge-secondary">' + escapeHtml(role) + '</span></li>';
            }
            html += '</ul>';
            if (dropped.length > 0) {
                html += '<p><strong>Dropped participants:</strong></p><ul>';
                for (const p of dropped) {
                    const name = userMap[p.userId] || p.userId;
                    html += '<li class="role-row"><span class="badge badge-dropped">Dropped</span> ' + escapeHtml(name) + (p.replacedByUserId ? ' (replaced by ' + escapeHtml(userMap[p.replacedByUserId] || p.replacedByUserId) + ')' : '') + '</li>';
                }
                html += '</ul>';
            }
            if (replacements.length > 0) {
                html += '<p><strong>Replacement participants:</strong></p><ul>';
                for (const p of replacements) {
                    const name = userMap[p.userId] || p.userId;
                    html += '<li class="role-row"><span class="badge badge-replacement">Replacement</span> ' + escapeHtml(name) + '</li>';
                }
                html += '</ul>';
            }
            html += '<p><a href="#" data-route="' + dealRoute(d.id) + '" class="btn btn-secondary btn-sm">View deal</a></p>';
            html += '</div>';
        }
        container.innerHTML = html;

        container.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const route = this.getAttribute('data-route');
                if (route && router) router.navigate(route);
            });
        });
    } catch (err) {
        console.error('Admin consortium load error:', err);
        container.innerHTML = '<div class="empty-state">Error loading consortium deals.</div>';
    }
}
