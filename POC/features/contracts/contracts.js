/**
 * Contracts List Component
 * Shows contracts where the current user is creator or contractor.
 * Each contract links to the related opportunity for full workflow (execution, milestones, etc.).
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getContractStatusBadgeClass(status) {
    const map = {
        pending: 'secondary',
        active: 'primary',
        completed: 'success',
        terminated: 'danger'
    };
    return map[status] || 'secondary';
}

function getContractStatusLabel(status) {
    const map = {
        pending: 'Pending',
        active: 'Active',
        completed: 'Completed',
        terminated: 'Terminated'
    };
    return map[status] || status;
}

function formatApplicationStatus(status) {
    const map = {
        pending: 'Pending',
        reviewing: 'Reviewing',
        shortlisted: 'Shortlisted',
        in_negotiation: 'In negotiation',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn'
    };
    return map[status] || status;
}

function getNegotiationLabel(opportunityStatus) {
    const map = {
        draft: 'Draft',
        published: 'Published',
        in_negotiation: 'In negotiation',
        contracted: 'Contracted',
        in_execution: 'In execution',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return map[opportunityStatus] || opportunityStatus;
}

function getMilestoneSummary(contract) {
    if (contract.status !== 'active') return null;
    const milestones = contract.milestones || [];
    if (milestones.length === 0) return null;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const total = milestones.length;
    if (completed === total) {
        return `All ${total} milestone${total === 1 ? '' : 's'} complete`;
    }
    return `Milestones: ${completed}/${total} completed`;
}

async function initContracts() {
    await loadContracts();

    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    const filterStatus = document.getElementById('filter-status');
    const filterRole = document.getElementById('filter-role');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => loadContracts());
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (filterStatus) filterStatus.value = '';
            if (filterRole) filterRole.value = '';
            loadContracts();
        });
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', () => loadContracts());
    }
    if (filterRole) {
        filterRole.addEventListener('change', () => loadContracts());
    }
}

async function loadContracts() {
    const container = document.getElementById('contracts-list');
    if (!container) return;

    const user = authService.getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-gray-500">Please sign in to view your contracts.</p>';
        return;
    }

    container.innerHTML = '<div class="spinner"></div>';

    try {
        let contracts = await dataService.getContractsByUserId(user.id);

        const statusFilter = document.getElementById('filter-status')?.value;
        const roleFilter = document.getElementById('filter-role')?.value;

        if (statusFilter) {
            contracts = contracts.filter(c => c.status === statusFilter);
        }
        if (roleFilter === 'creator') {
            contracts = contracts.filter(c => dataService.getContractParties(c).some(p => p.userId === user.id && (p.role === 'creator' || p.role === 'need_owner')));
        } else if (roleFilter === 'contractor') {
            contracts = contracts.filter(c => dataService.getContractParties(c).some(p => p.userId === user.id && (p.role === 'contractor' || p.role === 'offer_provider')));
        }

        if (contracts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 px-8 text-center">
                    <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                        <i class="ph-duotone ph-file-text" style="font-size: 2rem;"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">No contracts found</h3>
                    <p class="text-gray-500 text-sm">${statusFilter || roleFilter ? 'Try adjusting your filters.' : 'Contracts are created when an application is accepted on an opportunity.'}</p>
                </div>
            `;
            return;
        }

        const enriched = await Promise.all(
            contracts.map(async (c) => {
                const opportunity = await dataService.getOpportunityById(c.opportunityId);
                const application = c.applicationId ? await dataService.getApplicationById(c.applicationId) : null;
                const parties = dataService.getContractParties(c);
                const myParty = parties.find(p => p.userId === user.id);
                const myRole = (myParty && myParty.role) ? myParty.role : 'participant';
                const otherParties = parties.filter(p => p.userId !== user.id);
                const otherNames = await Promise.all(otherParties.map(p => dataService.getUserOrCompanyById(p.userId)));
                const otherPartyName = otherNames.length === 0 ? '—' : otherNames.length === 1 ? (otherNames[0]?.profile?.name || otherNames[0]?.email || otherParties[0].userId) : otherNames.length + ' parties';
                const opportunityTitle = (opportunity && opportunity.title) || c.scope || '—';
                const applicationStatusLabel = application ? formatApplicationStatus(application.status) : '—';
                const negotiationLabel = opportunity ? getNegotiationLabel(opportunity.status) : '—';
                return {
                    ...c,
                    opportunity,
                    application,
                    otherPartyName,
                    myRole,
                    scopeDisplay: c.scope || opportunityTitle,
                    opportunityTitle,
                    applicationStatusLabel,
                    negotiationLabel
                };
            })
        );

        enriched.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        const html = enriched
            .map(
                (c) => `
            <div class="contract-card" data-contract-id="${escapeHtml(c.id)}">
                <div class="contract-card-title">${escapeHtml(c.scopeDisplay)}</div>
                <span class="contract-card-role ${escapeHtml(c.myRole)}">${escapeHtml((c.myRole || '').charAt(0).toUpperCase() + (c.myRole || '').slice(1))}</span>
                <div class="contract-card-meta">
                    <span class="badge badge-${getContractStatusBadgeClass(c.status)}">${getContractStatusLabel(c.status)}</span>
                    <span class="ml-2 text-gray-500">with ${escapeHtml(c.otherPartyName)}</span>
                </div>
                <div class="contract-card-links mt-3 space-y-1.5 text-sm">
                    ${c.dealId ? `<div class="flex items-center gap-2"><i class="ph-duotone ph-list-checks text-gray-400"></i><a href="#" data-route="/deals/${escapeHtml(c.dealId)}" class="text-primary font-medium">View Deal (execution)</a></div>` : ''}
                    ${c.opportunityId ? `<div class="flex items-center gap-2"><i class="ph-duotone ph-briefcase text-gray-400"></i><span class="text-gray-600">Linked opportunity:</span> <a href="#" data-route="/opportunities/${escapeHtml(c.opportunityId)}" class="contract-link text-primary font-medium">${escapeHtml(c.opportunityTitle)}</a></div>` : ''}
                    <div class="flex items-center gap-2"><i class="ph-duotone ph-file-text text-gray-400"></i><span class="text-gray-600">Application:</span> <span>${escapeHtml(c.applicationStatusLabel)}</span></div>
                    <div class="flex items-center gap-2"><i class="ph-duotone ph-handshake text-gray-400"></i><span class="text-gray-600">Negotiation:</span> <span>${escapeHtml(c.negotiationLabel)}</span></div>
                </div>
                <div class="flex flex-wrap gap-2 mt-3">
                    <a href="#" data-route="/contracts/${escapeHtml(c.id)}" class="btn btn-sm btn-secondary">View contract</a>
                    ${c.dealId ? `<a href="#" data-route="/deals/${escapeHtml(c.dealId)}" class="btn btn-sm btn-primary">View deal</a>` : ''}
                    ${c.opportunityId ? `<a href="#" data-route="/opportunities/${escapeHtml(c.opportunityId)}" class="btn btn-sm btn-primary">View opportunity</a>` : ''}
                </div>
            </div>
        `
            )
            .join('');

        container.innerHTML = html;

        container.querySelectorAll('a[data-route]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                if (route && typeof router !== 'undefined') {
                    router.navigate(route);
                }
            });
        });
    } catch (error) {
        console.error('Error loading contracts:', error);
        container.innerHTML = '<p class="text-red-500">Error loading contracts. Please try again.</p>';
    }
}
