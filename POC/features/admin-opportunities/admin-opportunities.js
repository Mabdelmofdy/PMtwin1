/**
 * Admin Opportunities — modern, low-noise listing for platform moderation.
 *
 * Visual model:
 *  - Hero strip with one "Total" headline + small status pills (clickable jumps).
 *  - Single toolbar with segmented status tabs + search + intent/model/sort selects.
 *  - Slim cards: title + status chip · description · small meta chips · row of action buttons.
 *  - Bulk bar only appears when items are selected.
 */

const AO_STATUS_GROUPS = {
    draft: ['draft'],
    live: ['published', 'in_negotiation'],
    progress: ['contracted', 'in_execution'],
    closed: ['completed', 'closed', 'cancelled']
};

const AO_MODEL_LABELS = {
    project_based: 'Project-based',
    strategic_partnership: 'Strategic partnership',
    resource_pooling: 'Resource pooling',
    hiring: 'Hiring',
    competition: 'Competition'
};

const AO_PAYMENT_LABELS = {
    cash: 'Cash',
    barter: 'Barter',
    equity: 'Equity',
    profit_sharing: 'Profit sharing',
    hybrid: 'Hybrid'
};

const AO_QUEUE_TITLES = {
    '': 'All opportunities',
    live: 'Live opportunities',
    progress: 'In-progress opportunities',
    draft: 'Draft opportunities',
    closed: 'Closed opportunities'
};

const adminOppState = {
    items: [],
    statusGroup: '',
    intent: '',
    model: '',
    sort: 'newest',
    search: '',
    selected: new Set()
};

function aoEscape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function aoFormatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function aoSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function aoCanWrite() {
    return typeof authService !== 'undefined'
        && authService.hasAdminCapability
        && authService.hasAdminCapability('admin.opportunities.write');
}

function aoSkills(opp) {
    if (opp.attributes && Array.isArray(opp.attributes.requiredSkills)) return opp.attributes.requiredSkills;
    if (Array.isArray(opp.requiredSkills)) return opp.requiredSkills;
    return [];
}

function aoMilestones(opp) {
    if (opp.attributes && Array.isArray(opp.attributes.milestones)) return opp.attributes.milestones;
    if (Array.isArray(opp.milestones)) return opp.milestones;
    return [];
}

function aoPaymentModes(opp) {
    if (Array.isArray(opp.paymentModes) && opp.paymentModes.length) return opp.paymentModes;
    if (opp.exchangeMode) return [opp.exchangeMode];
    return [];
}

function aoIntentLabel(intent) {
    if (intent === 'offer') return 'Offer';
    if (intent === 'hybrid') return 'Hybrid';
    return 'Need';
}

function aoIntentChipClass(intent) {
    if (intent === 'offer') return 'ao-meta-chip--offer';
    if (intent === 'hybrid') return 'ao-meta-chip--hybrid';
    return 'ao-meta-chip--need';
}

function renderAdminOppStatusBadge(status) {
    const sb = window.statusBadgeSystem;
    if (sb && typeof sb.renderStatusBadge === 'function') {
        return sb.renderStatusBadge(status, 'opportunity');
    }
    return `<span class="badge badge--neutral">${aoEscape(status || 'draft')}</span>`;
}

function aoModelLabel(model) {
    if (!model) return '—';
    return AO_MODEL_LABELS[model] || String(model).replace(/_/g, ' ');
}

function aoPaymentLabel(value) {
    return AO_PAYMENT_LABELS[value] || value || '';
}

async function initAdminOpportunities() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.opportunities.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount
        && window.pageContextHeader
        && window.pageContextHeader.PRESETS
        && window.pageContextHeader.PRESETS.adminOpportunities
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminOpportunities);
    }

    setupAoFilters();
    setupAoBulk();
    await loadAdminOpportunities();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}

function setupAoFilters() {
    document.querySelectorAll('[data-ao-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminOppState.statusGroup = btn.getAttribute('data-ao-status') || '';
            renderAdminOppList();
        });
    });

    document.querySelectorAll('[data-ao-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminOppState.statusGroup = btn.getAttribute('data-ao-jump') || '';
            renderAdminOppList();
            const toolbar = document.querySelector('.ao-toolbar');
            if (toolbar && toolbar.scrollIntoView) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const intentEl = document.getElementById('ao-filter-intent');
    if (intentEl) intentEl.addEventListener('change', e => {
        adminOppState.intent = e.target.value || '';
        renderAdminOppList();
    });

    const modelEl = document.getElementById('ao-filter-model');
    if (modelEl) modelEl.addEventListener('change', e => {
        adminOppState.model = e.target.value || '';
        renderAdminOppList();
    });

    const sortEl = document.getElementById('ao-filter-sort');
    if (sortEl) sortEl.addEventListener('change', e => {
        adminOppState.sort = e.target.value || 'newest';
        renderAdminOppList();
    });

    const searchEl = document.getElementById('ao-filter-search');
    if (searchEl) {
        let timer;
        searchEl.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminOppState.search = (e.target.value || '').toLowerCase().trim();
                renderAdminOppList();
            }, 120);
        });
    }
}

function setupAoBulk() {
    const applyBtn = document.getElementById('ao-bulk-apply');
    if (applyBtn) applyBtn.addEventListener('click', bulkStatusChange);

    const clearBtn = document.getElementById('ao-bulk-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        adminOppState.selected.clear();
        renderAdminOppList();
    });

    const selectAll = document.getElementById('ao-select-all');
    if (selectAll) selectAll.addEventListener('change', e => {
        const visible = getAdminOppVisible();
        if (e.target.checked) {
            visible.forEach(o => adminOppState.selected.add(o.id));
        } else {
            visible.forEach(o => adminOppState.selected.delete(o.id));
        }
        renderAdminOppList();
    });
}

async function loadAdminOpportunities() {
    const container = document.getElementById('ao-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const opps = await dataService.getOpportunities();
        const enriched = await Promise.all((opps || []).map(async (opp) => {
            const [creator, applicationCount] = await Promise.all([
                dataService.getUserOrCompanyById(opp.creatorId).catch(() => null),
                dataService.getApplicationCountByOpportunityId(opp.id).catch(() => 0)
            ]);
            return { ...opp, creator, applicationCount: applicationCount || 0 };
        }));

        adminOppState.items = enriched;
        adminOppState.selected = new Set(
            Array.from(adminOppState.selected).filter(id => enriched.some(o => o.id === id))
        );
        renderAdminOppList();
        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('.ao-hero', 'opportunities');
        }
    } catch (error) {
        console.error('Error loading opportunities:', error);
        if (container) {
            container.innerHTML = `
                <div class="ao-empty">
                    <div class="ao-empty-icon"><i class="ph-duotone ph-warning-octagon" aria-hidden="true"></i></div>
                    <p class="ao-empty-title">Couldn’t load opportunities</p>
                    <p class="ao-empty-desc">Please refresh the page or try again later.</p>
                </div>`;
        }
    }
}

function getAdminOppVisible() {
    const { items, statusGroup, intent, model, search, sort } = adminOppState;
    let list = items.slice();

    if (statusGroup) {
        const allowed = AO_STATUS_GROUPS[statusGroup] || [];
        list = list.filter(o => allowed.includes(o.status || 'draft'));
    }
    if (intent) {
        list = list.filter(o => (o.intent || 'request') === intent);
    }
    if (model) {
        list = list.filter(o => (o.modelType || o.collaborationModel) === model);
    }
    if (search) {
        list = list.filter(o => {
            const haystack = [
                o.title,
                o.description,
                o.creator?.email,
                o.creator?.profile?.name
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }

    const titleKey = o => (o.title || '').toLowerCase();
    list.sort((a, b) => {
        if (sort === 'title') {
            return titleKey(a).localeCompare(titleKey(b));
        }
        if (sort === 'applications') {
            const diff = (b.applicationCount || 0) - (a.applicationCount || 0);
            if (diff !== 0) return diff;
            return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
        }
        const da = new Date(a.createdAt).getTime() || 0;
        const db = new Date(b.createdAt).getTime() || 0;
        return sort === 'oldest' ? da - db : db - da;
    });

    return list;
}

function updateAdminOppSummary() {
    const items = adminOppState.items;
    const total = items.length;

    const inGroup = group => {
        const allowed = AO_STATUS_GROUPS[group] || [];
        return items.filter(o => allowed.includes(o.status || 'draft')).length;
    };

    const live = inGroup('live');
    const progress = inGroup('progress');
    const drafts = inGroup('draft');
    const closed = inGroup('closed');

    aoSetText('ao-stat-total', String(total));
    aoSetText('ao-stat-live', String(live));
    aoSetText('ao-stat-progress', String(progress));
    aoSetText('ao-stat-drafts', String(drafts));
    aoSetText('ao-stat-closed', String(closed));

    aoSetText('ao-chip-all', String(total));
    aoSetText('ao-chip-live', String(live));
    aoSetText('ao-chip-progress', String(progress));
    aoSetText('ao-chip-draft', String(drafts));
    aoSetText('ao-chip-closed', String(closed));
}

function syncAdminOppTabs() {
    document.querySelectorAll('[data-ao-status]').forEach(b => {
        const value = b.getAttribute('data-ao-status') || '';
        const isOn = value === adminOppState.statusGroup;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function renderAdminOppCard(opp) {
    const id = aoEscape(opp.id);
    const intent = opp.intent || 'request';
    const status = opp.status || 'draft';
    const skills = aoSkills(opp);
    const milestones = aoMilestones(opp);
    const payments = aoPaymentModes(opp);
    const isSelected = adminOppState.selected.has(opp.id);
    const canWrite = aoCanWrite();
    const creatorName = opp.creator?.profile?.name || opp.creator?.email || 'Unknown creator';

    const meta = [];
    meta.push(`<span class="ao-meta-chip ${aoIntentChipClass(intent)}">${aoEscape(aoIntentLabel(intent))}</span>`);
    meta.push(`<span class="ao-meta-chip">${aoEscape(aoModelLabel(opp.modelType || opp.collaborationModel))}</span>`);
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-user-circle" aria-hidden="true"></i>
            ${aoEscape(creatorName)}
        </span>`);
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-paper-plane-tilt" aria-hidden="true"></i>
            <strong>${opp.applicationCount || 0}</strong>&nbsp;application${opp.applicationCount === 1 ? '' : 's'}
        </span>`);
    if (payments.length) {
        meta.push(`
            <span class="ao-meta-item" title="${aoEscape(payments.map(aoPaymentLabel).join(', '))}">
                <i class="ph-duotone ph-coins" aria-hidden="true"></i>
                ${aoEscape(payments.map(aoPaymentLabel).join(' · '))}
            </span>`);
    }
    if (milestones.length) {
        meta.push(`
            <span class="ao-meta-item">
                <i class="ph-duotone ph-flag" aria-hidden="true"></i>
                <strong>${milestones.length}</strong>&nbsp;milestone${milestones.length === 1 ? '' : 's'}
            </span>`);
    }
    if (skills.length) {
        meta.push(`
            <span class="ao-meta-item" title="${aoEscape(skills.join(', '))}">
                <i class="ph-duotone ph-sparkle" aria-hidden="true"></i>
                <strong>${skills.length}</strong>&nbsp;skill${skills.length === 1 ? '' : 's'}
            </span>`);
    }
    meta.push(`
        <span class="ao-meta-item">
            <i class="ph-duotone ph-clock" aria-hidden="true"></i>
            ${aoEscape(aoFormatDate(opp.createdAt))}
        </span>`);

    const canShowClose = canWrite && (status === 'published' || status === 'in_negotiation' || status === 'draft');
    const actions = [];
    actions.push(`<a href="#" data-route="/opportunities/${id}" class="ao-action ao-action--primary">
        <i class="ph-duotone ph-arrow-right" aria-hidden="true"></i>
        Open
    </a>`);
    actions.push(`<a href="#" data-route="/opportunities/${id}/edit" class="ao-action">
        <i class="ph-duotone ph-pencil-simple" aria-hidden="true"></i>
        Edit
    </a>`);
    if (canShowClose) {
        actions.push(`<button type="button" class="ao-action ao-action--warning" data-action="close" data-id="${id}">
            <i class="ph-duotone ph-lock-simple" aria-hidden="true"></i>
            Close
        </button>`);
    }
    if (canWrite) {
        actions.push(`<button type="button" class="ao-action ao-action--danger" data-action="delete" data-id="${id}" aria-label="Delete">
            <i class="ph-duotone ph-trash" aria-hidden="true"></i>
        </button>`);
    }

    return `
    <article class="ao-card${isSelected ? ' is-selected' : ''}" data-opp-id="${id}">
        <div class="ao-card-check">
            <input type="checkbox" class="ao-row-select" data-id="${id}" aria-label="Select opportunity" ${isSelected ? 'checked' : ''} />
        </div>
        <div class="ao-card-body">
            <div class="ao-card-top">
                <h3 class="ao-card-title">${aoEscape(opp.title || 'Untitled opportunity')}</h3>
                ${renderAdminOppStatusBadge(status)}
            </div>
            ${opp.description ? `<p class="ao-card-desc">${aoEscape(opp.description)}</p>` : ''}
            <div class="ao-card-foot">
                <div class="ao-card-meta">${meta.join('')}</div>
                <div class="ao-card-actions">${actions.join('')}</div>
            </div>
        </div>
    </article>`;
}

function renderAdminOppList() {
    updateAdminOppSummary();
    syncAdminOppTabs();

    const container = document.getElementById('ao-list');
    const metaEl = document.getElementById('ao-list-meta');
    const titleEl = document.getElementById('ao-list-title');
    if (titleEl) titleEl.textContent = AO_QUEUE_TITLES[adminOppState.statusGroup] || 'Opportunities';
    if (!container) return;

    const visible = getAdminOppVisible();
    const total = adminOppState.items.length;

    if (metaEl) {
        if (total === 0) {
            metaEl.textContent = 'No opportunities have been created yet.';
        } else {
            metaEl.textContent = `Showing ${visible.length} of ${total} opportunit${total === 1 ? 'y' : 'ies'}`;
        }
    }

    const bulkBar = document.getElementById('ao-bulk-bar');
    const canWrite = aoCanWrite();
    if (bulkBar) {
        const show = canWrite && adminOppState.selected.size > 0;
        bulkBar.hidden = !show;
        aoSetText('ao-bulk-count', String(adminOppState.selected.size));
    }

    const selectAll = document.getElementById('ao-select-all');
    if (selectAll) {
        const allChecked = visible.length > 0 && visible.every(o => adminOppState.selected.has(o.id));
        selectAll.checked = allChecked;
        selectAll.indeterminate = !allChecked && visible.some(o => adminOppState.selected.has(o.id));
        selectAll.disabled = !canWrite || visible.length === 0;
    }

    if (visible.length === 0) {
        const isEmpty = total === 0;
        container.innerHTML = `
            <div class="ao-empty">
                <div class="ao-empty-icon">
                    <i class="ph-duotone ${isEmpty ? 'ph-briefcase' : 'ph-funnel-x'}" aria-hidden="true"></i>
                </div>
                <p class="ao-empty-title">${isEmpty ? 'No opportunities yet' : 'No matches for these filters'}</p>
                <p class="ao-empty-desc">${
                    isEmpty
                        ? 'When users publish opportunities, they will appear here for moderation.'
                        : 'Try clearing the status, type, model, or search filters.'
                }</p>
            </div>`;
        return;
    }

    container.innerHTML = visible.map(renderAdminOppCard).join('');

    container.querySelectorAll('.ao-row-select').forEach(cb => {
        cb.addEventListener('change', e => {
            const id = e.currentTarget.getAttribute('data-id');
            if (!id) return;
            if (e.currentTarget.checked) {
                adminOppState.selected.add(id);
            } else {
                adminOppState.selected.delete(id);
            }
            renderAdminOppList();
        });
    });

    container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (!id) return;
            handleOpportunityAction(action, id);
        });
    });
}

async function handleOpportunityAction(action, opportunityId) {
    switch (action) {
        case 'close':
            await closeOpportunity(opportunityId);
            break;
        case 'delete':
            await deleteOpportunity(opportunityId);
            break;
        default:
            break;
    }
}

async function aoConfirm(message, title, options = {}) {
    if (window.modalService?.confirm) {
        return window.modalService.confirm(message, title, options);
    }
    return Promise.resolve(confirm(message));
}

async function aoNotify(kind, message, title) {
    const svc = window.modalService;
    if (svc && typeof svc[kind] === 'function') {
        return svc[kind](message, title);
    }
    alert(message);
    return Promise.resolve();
}

async function closeOpportunity(opportunityId) {
    try {
        authService.assertAdminCapability('admin.opportunities.write');
    } catch (err) {
        await aoNotify('error', err?.message || 'You do not have permission to close opportunities.', 'Permission denied');
        return;
    }

    const ok = await aoConfirm(
        'Closing this opportunity hides it from the marketplace. The creator can still see it under their drafts. Continue?',
        'Close opportunity',
        { confirmText: 'Close opportunity', cancelText: 'Cancel', type: 'warning' }
    );
    if (!ok) return;

    try {
        await dataService.updateOpportunity(opportunityId, { status: 'closed' });
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: 'opportunity_closed',
            entityType: 'opportunity',
            entityId: opportunityId,
            details: { from: 'admin-opportunities' }
        });
        await aoNotify('success', 'Opportunity closed.', 'Done');
        await loadAdminOpportunities();
    } catch (error) {
        console.error('Error closing opportunity:', error);
        await aoNotify('error', error?.message || 'Failed to close opportunity.', 'Action failed');
    }
}

async function deleteOpportunity(opportunityId) {
    try {
        authService.assertAdminCapability('admin.opportunities.write');
    } catch (err) {
        await aoNotify('error', err?.message || 'You do not have permission to delete opportunities.', 'Permission denied');
        return;
    }

    const ok = await aoConfirm(
        'Deleting an opportunity removes it permanently and cannot be undone. Continue?',
        'Delete opportunity',
        { confirmText: 'Delete permanently', cancelText: 'Cancel', type: 'error' }
    );
    if (!ok) return;

    try {
        await dataService.deleteOpportunity(opportunityId);
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: 'opportunity_deleted',
            entityType: 'opportunity',
            entityId: opportunityId,
            details: { from: 'admin-opportunities' }
        });
        adminOppState.selected.delete(opportunityId);
        await aoNotify('success', 'Opportunity deleted.', 'Done');
        await loadAdminOpportunities();
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        await aoNotify('error', error?.message || 'Failed to delete opportunity.', 'Action failed');
    }
}

async function bulkStatusChange() {
    try {
        authService.assertAdminCapability('admin.opportunities.write');
    } catch (err) {
        await aoNotify('error', err?.message || 'You do not have permission for bulk actions.', 'Permission denied');
        return;
    }

    const ids = Array.from(adminOppState.selected);
    const status = document.getElementById('ao-bulk-status')?.value;

    if (!ids.length) {
        await aoNotify('warning', 'Select one or more opportunities first.', 'Nothing selected');
        return;
    }
    if (status !== 'closed' && status !== 'cancelled') {
        await aoNotify('warning', 'Choose a target status (Closed or Cancelled) to continue.', 'Pick a status');
        return;
    }

    const label = status === 'closed' ? 'Closed' : 'Cancelled';
    const ok = await aoConfirm(
        `Set ${ids.length} opportunit${ids.length === 1 ? 'y' : 'ies'} to "${label}"?`,
        'Bulk status change',
        { confirmText: 'Apply', cancelText: 'Cancel', type: 'warning' }
    );
    if (!ok) return;

    const admin = authService.getCurrentUser();
    let success = 0;
    const failed = [];
    for (const id of ids) {
        try {
            await dataService.updateOpportunity(id, { status });
            await dataService.createAuditLog({
                userId: admin.id,
                action: status === 'closed' ? 'opportunity_closed' : 'opportunity_cancelled',
                entityType: 'opportunity',
                entityId: id,
                details: { bulk: true, from: 'admin-opportunities' }
            });
            success += 1;
        } catch (e) {
            console.error('Bulk update failed for', id, e);
            failed.push(id);
        }
    }

    adminOppState.selected.clear();
    if (failed.length === 0) {
        await aoNotify('success', `Updated ${success} opportunit${success === 1 ? 'y' : 'ies'}.`, 'Bulk update complete');
    } else {
        await aoNotify('warning', `Updated ${success}. ${failed.length} failed — please retry.`, 'Partial update');
    }
    await loadAdminOpportunities();
}
