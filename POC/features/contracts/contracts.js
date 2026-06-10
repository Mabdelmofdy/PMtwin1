/**
 * Contracts List Component
 * Shows contracts where the current user is creator or contractor.
 * Each contract links to the related opportunity and deal for the full workflow.
 */

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatContractDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

function getContractStatusBadgeClass(status) {
    return window.statusBadgeSystem ? window.statusBadgeSystem.getStatusBadgeClass(status, 'contract') : 'badge--neutral';
}

function getContractStatusLabel(status) {
    const ui = window.DealContractFlowUi;
    if (ui && typeof ui.getContractStatusDisplayLabel === 'function') return ui.getContractStatusDisplayLabel(status);
    const map = {
        pending: 'Pending Signature',
        active: 'Active Contract',
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

/** Human label + pill variant for the current user's party role */
function getRolePillInfo(myRole) {
    const r = (myRole || '').toLowerCase();
    const label = typeof formatParticipantRole === 'function'
        ? formatParticipantRole(myRole, 'Participant')
        : (myRole || 'participant');
    if (r === 'need_owner' || r === 'creator') {
        return { label, pillClass: 'contracts-role-pill--need' };
    }
    if (r === 'offer_provider' || r === 'contractor') {
        return { label, pillClass: 'contracts-role-pill--offer' };
    }
    return {
        label,
        pillClass: 'contracts-role-pill--neutral'
    };
}

function getMilestoneSummary(contract) {
    const milestones = contract.milestones || [];
    if (milestones.length > 0 && contract.status === 'active') {
        const completed = milestones.filter((m) => m.status === 'completed' || m.status === 'approved').length;
        const total = milestones.length;
        if (completed === total) {
            return 'All ' + total + ' milestone' + (total === 1 ? '' : 's') + ' complete';
        }
        return 'Milestones: ' + completed + '/' + total + ' complete';
    }
    const snap = contract.milestonesSnapshot || [];
    if (snap.length > 0) {
        return snap.length + ' milestone' + (snap.length === 1 ? '' : 's') + ' in agreement';
    }
    return null;
}

function renderContractsEmpty(opts) {
    const iconClass = opts.iconClass || 'ph-duotone ph-file-text';
    return (
        '<div class="contracts-empty" role="status">' +
        '<span class="contracts-empty__icon" aria-hidden="true"><i class="' +
        escapeHtml(iconClass) +
        '"></i></span>' +
        '<p class="contracts-empty__title">' +
        escapeHtml(opts.title || '') +
        '</p>' +
        '<p class="contracts-empty__text">' +
        opts.bodyHtml +
        '</p>' +
        (opts.actionsHtml ? '<div class="contracts-empty__actions">' + opts.actionsHtml + '</div>' : '') +
        '</div>'
    );
}

async function initContracts() {
    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.contracts);
    }
    document.getElementById('page-cta-contracts-upload')?.addEventListener('click', (e) => {
        e.preventDefault();
        const r = CONFIG.ROUTES.COLLABORATION_WIZARD || '/collaboration-wizard';
        const nav = window.router || (typeof router !== 'undefined' ? router : null);
        if (nav && typeof nav.navigate === 'function') {
            nav.navigate(r);
        } else {
            window.location.assign(((typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH.replace(/\/*$/, '') : '') + r);
        }
    });

    const clearBtn = document.getElementById('clear-filters');
    const filterStatus = document.getElementById('filter-status');
    const filterRole = document.getElementById('filter-role');

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

    await loadContracts();
}

async function loadContracts() {
    const container = document.getElementById('contracts-list');
    const summaryEl = document.getElementById('contracts-summary');
    if (!container) return;

    const user = authService.getCurrentUser();
    if (!user) {
        if (summaryEl) summaryEl.textContent = '';
        container.innerHTML = renderContractsEmpty({
            title: 'Sign in required',
            bodyHtml: 'Log in to see contracts where you are a party.',
            iconClass: 'ph-duotone ph-lock-key'
        });
        return;
    }

    container.innerHTML = '<div class="spinner"></div>';
    if (summaryEl) summaryEl.textContent = 'Loading…';

    const oppRoute =
        typeof CONFIG !== 'undefined' && CONFIG.ROUTES ? CONFIG.ROUTES.OPPORTUNITIES || '/opportunities' : '/opportunities';

    try {
        const allContracts = await dataService.getContractsByUserId(user.id);
        let contracts = Array.isArray(allContracts) ? [...allContracts] : [];

        const statusFilter = document.getElementById('filter-status')?.value || '';
        const roleFilter = document.getElementById('filter-role')?.value || '';

        const totalUnfiltered = contracts.length;

        if (statusFilter) {
            contracts = contracts.filter((c) => c.status === statusFilter);
        }
        if (roleFilter === 'creator') {
            contracts = contracts.filter((c) =>
                dataService.getContractParties(c).some(
                    (p) => p.userId === user.id && (p.role === 'creator' || p.role === 'need_owner')
                )
            );
        } else if (roleFilter === 'contractor') {
            contracts = contracts.filter((c) =>
                dataService.getContractParties(c).some(
                    (p) => p.userId === user.id && (p.role === 'contractor' || p.role === 'offer_provider')
                )
            );
        }

        if (summaryEl) {
            if (totalUnfiltered === 0) {
                summaryEl.textContent = '';
            } else if (!statusFilter && !roleFilter) {
                summaryEl.textContent = contracts.length + ' contract' + (contracts.length === 1 ? '' : 's');
            } else {
                summaryEl.textContent =
                    'Showing ' + contracts.length + ' of ' + totalUnfiltered + ' contract' + (totalUnfiltered === 1 ? '' : 's');
            }
        }

        if (contracts.length === 0) {
            const filtered = !!(statusFilter || roleFilter);
            const actions =
                !filtered && totalUnfiltered === 0
                    ? '<a href="#" data-route="' +
                      escapeHtml(oppRoute) +
                      '" class="btn btn-primary btn-sm">Browse opportunities</a>'
                    : '';
            container.innerHTML = renderContractsEmpty({
                title: filtered ? 'No matches for filters' : 'No contracts yet',
                bodyHtml: filtered
                    ? 'Use the <strong>Reset filters</strong> button above, or pick another status or role.'
                    : 'Contracts usually appear after an application is accepted. Explore opportunities to get started.',
                actionsHtml: actions
            });
            return;
        }

        const enriched = await Promise.all(
            contracts.map(async (c) => {
                const opportunity = await dataService.getOpportunityById(c.opportunityId);
                const application = c.applicationId ? await dataService.getApplicationById(c.applicationId) : null;
                const parties = dataService.getContractParties(c);
                const myParty = parties.find((p) => p.userId === user.id);
                const myRole = myParty && myParty.role ? myParty.role : 'participant';
                const otherParties = parties.filter((p) => p.userId !== user.id);
                const otherNames = await Promise.all(otherParties.map((p) => dataService.getUserOrCompanyById(p.userId)));
                const otherPartyName =
                    otherNames.length === 0
                        ? '—'
                        : otherNames.length === 1
                          ? otherNames[0]?.profile?.name || otherNames[0]?.email || otherParties[0].userId
                          : otherNames.length + ' parties';
                const opportunityTitle = (opportunity && opportunity.title) || c.scope || '—';
                const applicationStatusLabel = application ? formatApplicationStatus(application.status) : '—';
                const negotiationLabel = opportunity ? getNegotiationLabel(opportunity.status) : '—';
                const rolePill = getRolePillInfo(myRole);
                const milestoneLine = getMilestoneSummary(c);
                const updated = formatContractDate(c.updatedAt);
                const dealRecord = c.dealId ? await dataService.getDealById(c.dealId) : null;
                const signedCount = parties.filter((p) => p.signedAt).length;
                const partyCount = parties.length;
                return {
                    ...c,
                    opportunity,
                    application,
                    otherPartyName,
                    myRole,
                    rolePill,
                    scopeDisplay: c.scope || opportunityTitle,
                    opportunityTitle,
                    applicationStatusLabel,
                    negotiationLabel,
                    milestoneLine,
                    updated,
                    dealRecord,
                    signedCount,
                    partyCount
                };
            })
        );

        enriched.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        const html = enriched
            .map((c) => {
                const oppLink = c.opportunityId
                    ? '<a href="#" data-route="/opportunities/' +
                      escapeHtml(c.opportunityId) +
                      '">' +
                      escapeHtml(c.opportunityTitle) +
                      '</a>'
                    : escapeHtml(c.opportunityTitle);
                const milestoneBlock = c.milestoneLine
                    ? '<p class="contract-card__hint">' + escapeHtml(c.milestoneLine) + '</p>'
                    : '';
                const updatedBlock = c.updated
                    ? '<p class="contract-card__updated">Updated ' + escapeHtml(c.updated) + '</p>'
                    : '';

                const dealLine = c.dealId
                    ? '<li><i class="ph-duotone ph-handshake" aria-hidden="true"></i> Linked deal: <a href="#" data-route="/deals/' +
                      escapeHtml(c.dealId) +
                      '">' +
                      escapeHtml((c.dealRecord && c.dealRecord.title) || c.dealId) +
                      '</a></li>'
                    : '';
                const uiAv = window.DealContractFlowUi;
                let valueHuman = '';
                if (c.agreedValue != null) {
                    valueHuman =
                        uiAv && typeof uiAv.formatAgreedValueSummary === 'function'
                            ? uiAv.formatAgreedValueSummary(c.agreedValue)
                            : typeof c.agreedValue === 'object'
                              ? JSON.stringify(c.agreedValue)
                              : String(c.agreedValue);
                }
                const valueLine =
                    valueHuman !== ''
                        ? '<li><i class="ph-duotone ph-currency-circle-dollar" aria-hidden="true"></i> Value: <span>' +
                          escapeHtml(valueHuman) +
                          '</span></li>'
                        : '';

                return (
                    '<article class="contract-card" role="listitem" data-contract-id="' +
                    escapeHtml(c.id) +
                    '">' +
                    '<div class="contract-card__badges">' +
                    '<span class="badge ' +
                    getContractStatusBadgeClass(c.status) +
                    '">' +
                    escapeHtml(getContractStatusLabel(c.status)) +
                    '</span>' +
                    '<span class="contracts-role-pill ' +
                    escapeHtml(c.rolePill.pillClass) +
                    '">' +
                    escapeHtml(c.rolePill.label) +
                    '</span>' +
                    '</div>' +
                    '<h3 class="contract-card__title">' +
                    escapeHtml(c.scopeDisplay) +
                    '</h3>' +
                    '<p class="contract-card__party">Parties signed: <strong>' +
                    c.signedCount +
                    '/' +
                    c.partyCount +
                    '</strong> · With <strong>' +
                    escapeHtml(String(c.otherPartyName)) +
                    '</strong></p>' +
                    milestoneBlock +
                    updatedBlock +
                    '<ul class="contract-card__details">' +
                    dealLine +
                    valueLine +
                    '<li><i class="ph-duotone ph-briefcase" aria-hidden="true"></i> Opportunity: ' +
                    oppLink +
                    '</li>' +
                    '<li><i class="ph-duotone ph-file-text" aria-hidden="true"></i> Application: <span>' +
                    escapeHtml(c.applicationStatusLabel) +
                    '</span></li>' +
                    '<li><i class="ph-duotone ph-handshake" aria-hidden="true"></i> Opportunity status: <span>' +
                    escapeHtml(c.negotiationLabel) +
                    '</span></li>' +
                    '</ul>' +
                    '<div class="contract-card__actions">' +
                    '<a href="#" data-route="/contracts/' +
                    escapeHtml(c.id) +
                    '" class="btn btn-primary btn-sm">View contract</a>' +
                    (c.dealId
                        ? '<a href="#" data-route="/deals/' +
                          escapeHtml(c.dealId) +
                          '" class="btn btn-secondary btn-sm">View deal</a>'
                        : '') +
                    '</div>' +
                    '</article>'
                );
            })
            .join('');

        container.innerHTML = html;

        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('#contracts-summary', 'contracts');
        }
    } catch (error) {
        console.error('Error loading contracts:', error);
        if (summaryEl) summaryEl.textContent = '';
        container.innerHTML = renderContractsEmpty({
            title: 'Could not load contracts',
            bodyHtml: 'Something went wrong. Check your connection and try again.',
            iconClass: 'ph-duotone ph-warning-circle',
            actionsHtml: '<button type="button" class="btn btn-secondary btn-sm" id="contracts-retry-btn">Try again</button>'
        });
        document.getElementById('contracts-retry-btn')?.addEventListener('click', () => {
            loadContracts();
        });
    }
}
