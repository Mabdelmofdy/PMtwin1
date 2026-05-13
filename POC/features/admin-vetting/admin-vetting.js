/**
 * Admin User Vetting — review pending and clarification_requested accounts.
 * Refactored for an action-focused queue: chips, search, sort, sticky bulk bar,
 * compact cards with evidence summary and quick decisions.
 */

const VETTING_STATUSES = ['pending', 'clarification_requested'];

const vettingState = {
    items: [],
    statusFilter: '',
    typeFilter: '',
    search: '',
    sort: 'oldest',
    selected: new Set()
};

function vettingEscapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function vettingFormatRelativeDays(timestamp) {
    if (!timestamp) return { label: 'Unknown', days: null, tone: 'neutral' };
    const ms = Date.now() - new Date(timestamp).getTime();
    if (Number.isNaN(ms)) return { label: 'Unknown', days: null, tone: 'neutral' };
    const days = Math.max(0, Math.floor(ms / 86400000));
    const hours = Math.floor(ms / 3600000);
    let label;
    if (hours < 1) label = 'Just now';
    else if (hours < 24) label = `${hours}h waiting`;
    else if (days === 1) label = '1 day waiting';
    else label = `${days} days waiting`;
    let tone = 'ok';
    if (days >= 7) tone = 'crit';
    else if (days >= 3) tone = 'warn';
    return { label, days, tone };
}

function vettingFormatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

function getAccountTypeLabel(user) {
    if (user.profile?.type === 'company') return 'Company';
    if (
        user.role === 'consultant' ||
        user.profile?.type === 'consultant' ||
        user.profile?.individualType === 'consultant'
    ) {
        return 'Consultant';
    }
    return 'Professional';
}

function getAccountTypeKey(user) {
    return user.profile?.type === 'company' ? 'company' : 'individual';
}

function getDocumentsCount(user) {
    return (user.profile?.documents || []).length;
}

function hasCaseStudy(user) {
    const vc = user.profile?.vettingCaseStudy;
    if (vc && (vc.title || vc.url || vc.description)) return true;
    return (user.profile?.caseStudies || []).length > 0;
}

function getInitial(user) {
    const name = user.profile?.name || user.email || '?';
    return (name.trim().charAt(0) || '?').toUpperCase();
}

async function initAdminVetting() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.vetting')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS && window.pageContextHeader.PRESETS.adminVetting) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminVetting);
    }
    const headerApprove = document.getElementById('page-cta-vetting-approve');
    if (headerApprove) {
        headerApprove.addEventListener('click', e => {
            e.preventDefault();
            bulkApprove();
        });
    }

    setupVettingFilters();
    setupBulkBar();
    await loadVettingList();
}

function setupVettingFilters() {
    document.querySelectorAll('[data-status-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.getAttribute('data-status-filter') || '';
            vettingState.statusFilter = value;
            document.querySelectorAll('[data-status-filter]').forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-selected', String(isActive));
            });
            renderVettingList();
        });
    });
    const typeSelect = document.getElementById('filter-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', e => {
            vettingState.typeFilter = e.target.value || '';
            renderVettingList();
        });
    }
    const search = document.getElementById('filter-search');
    if (search) {
        let timer;
        search.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                vettingState.search = (e.target.value || '').toLowerCase().trim();
                renderVettingList();
            }, 120);
        });
    }
    const sort = document.getElementById('filter-sort');
    if (sort) {
        sort.addEventListener('change', e => {
            vettingState.sort = e.target.value || 'oldest';
            renderVettingList();
        });
    }
}

function setupBulkBar() {
    const selectAll = document.getElementById('vetting-select-all');
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const visible = getVisibleItems();
            if (selectAll.checked) {
                visible.forEach(item => vettingState.selected.add(makeKey(item)));
            } else {
                visible.forEach(item => vettingState.selected.delete(makeKey(item)));
            }
            renderVettingList();
        });
    }
    document.getElementById('vetting-approve-selected')?.addEventListener('click', bulkApprove);
    document.getElementById('vetting-reject-selected')?.addEventListener('click', bulkReject);
    document.getElementById('vetting-clarify-selected')?.addEventListener('click', bulkRequestUpdates);
}

function makeKey(user) {
    const isCompany = user.profile?.type === 'company';
    return `${isCompany ? 'company' : 'user'}:${user.id}`;
}

function parseKey(key) {
    const [type, id] = key.split(':');
    return { id, isCompany: type === 'company' };
}

async function loadVettingList() {
    const container = document.getElementById('vetting-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const [users, companies] = await Promise.all([
            dataService.getUsers(),
            dataService.getCompanies()
        ]);
        vettingState.items = [...users, ...companies].filter(u => VETTING_STATUSES.includes(u.status));
        const knownKeys = new Set(vettingState.items.map(makeKey));
        Array.from(vettingState.selected).forEach(k => {
            if (!knownKeys.has(k)) vettingState.selected.delete(k);
        });
        renderVettingList();
    } catch (error) {
        console.error('Error loading vetting list:', error);
        if (container) container.innerHTML = '<div class="vetting-empty"><p class="vetting-empty-title">Couldn’t load the queue</p><p class="vetting-empty-desc">Please refresh the page or check the audit trail.</p></div>';
    }
}

function getVisibleItems() {
    const { statusFilter, typeFilter, search, sort, items } = vettingState;
    let list = items.slice();
    if (statusFilter) list = list.filter(u => u.status === statusFilter);
    if (typeFilter) list = list.filter(u => getAccountTypeKey(u) === typeFilter);
    if (search) {
        list = list.filter(u =>
            (u.email || '').toLowerCase().includes(search) ||
            (u.profile?.name || '').toLowerCase().includes(search)
        );
    }
    list.sort((a, b) => {
        const ta = new Date(a.createdAt).getTime() || 0;
        const tb = new Date(b.createdAt).getTime() || 0;
        const ua = new Date(a.updatedAt || a.createdAt).getTime() || 0;
        const ub = new Date(b.updatedAt || b.createdAt).getTime() || 0;
        if (sort === 'newest') return tb - ta;
        if (sort === 'updated_desc') return ub - ua;
        if (sort === 'updated_asc') return ua - ub;
        if (sort === 'type') {
            const la = getAccountTypeLabel(a);
            const lb = getAccountTypeLabel(b);
            if (la === lb) return ta - tb;
            return la.localeCompare(lb);
        }
        return ta - tb;
    });
    return list;
}

function updateSummary() {
    const items = vettingState.items;
    const pending = items.filter(u => u.status === 'pending').length;
    const clarif = items.filter(u => u.status === 'clarification_requested').length;
    setVettingText('vetting-stat-total', String(items.length));
    setVettingText('vetting-stat-pending', String(pending));
    setVettingText('vetting-stat-clarif', String(clarif));
    setVettingText('chip-count-all', String(items.length));
    setVettingText('chip-count-pending', String(pending));
    setVettingText('chip-count-clarif', String(clarif));

    let oldestDays = null;
    let oldestUser = null;
    items.forEach(u => {
        const t = new Date(u.createdAt).getTime();
        if (!Number.isFinite(t)) return;
        const days = Math.floor((Date.now() - t) / 86400000);
        if (oldestDays === null || days > oldestDays) {
            oldestDays = days;
            oldestUser = u;
        }
    });
    const oldestEl = document.getElementById('vetting-stat-oldest');
    const oldestHint = document.getElementById('vetting-stat-oldest-hint');
    if (items.length === 0 || oldestDays === null) {
        if (oldestEl) oldestEl.textContent = '—';
        if (oldestHint) oldestHint.textContent = 'Nothing waiting';
    } else {
        if (oldestEl) oldestEl.textContent = `${oldestDays}d`;
        if (oldestHint) oldestHint.textContent = oldestUser?.email ? `Oldest: ${oldestUser.email}` : 'Time in queue';
    }
}

function setVettingText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderVettingList() {
    updateSummary();

    const container = document.getElementById('vetting-list');
    const meta = document.getElementById('vetting-queue-meta');
    if (!container) return;

    const visible = getVisibleItems();
    if (meta) {
        if (vettingState.items.length === 0) {
            meta.textContent = 'No accounts to review.';
        } else if (visible.length === vettingState.items.length) {
            meta.textContent = `${visible.length} account${visible.length === 1 ? '' : 's'} in queue`;
        } else {
            meta.textContent = `Showing ${visible.length} of ${vettingState.items.length}`;
        }
    }

    if (visible.length === 0) {
        const isEmptyQueue = vettingState.items.length === 0;
        container.innerHTML = `
            <div class="vetting-empty">
                <p class="vetting-empty-title">${isEmptyQueue ? 'Queue is clear' : 'No matches for these filters'}</p>
                <p class="vetting-empty-desc">${
                    isEmptyQueue
                        ? 'All registrations have been reviewed. New pending or clarification requests will appear here automatically.'
                        : 'Try clearing search or status filters to broaden the queue.'
                }</p>
            </div>
        `;
        renderBulkBar(visible);
        return;
    }

    container.innerHTML = visible.map(renderVettingCard).join('');

    container.querySelectorAll('.vetting-card-checkbox').forEach(input => {
        input.addEventListener('change', () => {
            const key = input.getAttribute('data-key');
            if (input.checked) vettingState.selected.add(key);
            else vettingState.selected.delete(key);
            const card = input.closest('.vetting-card');
            if (card) card.classList.toggle('is-selected', input.checked);
            renderBulkBar(getVisibleItems());
        });
    });

    container.querySelectorAll('[data-action]').forEach(btn => {
        if (btn.tagName === 'A') return;
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const isCompany = btn.dataset.company === 'true';
            if (action === 'approve') approveUser(id, isCompany);
            else if (action === 'reject') rejectUser(id, isCompany);
            else if (action === 'clarify') requestAccountUpdatesFromQueue(id, isCompany);
        });
    });

    renderBulkBar(visible);
}

function renderVettingCard(user) {
    const isCompany = user.profile?.type === 'company';
    const key = makeKey(user);
    const selected = vettingState.selected.has(key);
    const accountTypeLabel = getAccountTypeLabel(user);
    const va = window.vettingActions;
    const isClarif = user.status === 'clarification_requested';
    const isPending = user.status === 'pending';
    const resubmitted = va && typeof va.isResubmittedPending === 'function' ? va.isResubmittedPending(user) : false;

    const statusPills = [];
    const sb = window.statusBadgeSystem;
    if (sb && typeof sb.renderStatusBadge === 'function') {
        if (isClarif) {
            statusPills.push(sb.renderStatusBadge('clarification_requested', 'vetting'));
        } else if (isPending) {
            statusPills.push(sb.renderStatusBadge('pending', 'vetting'));
            if (resubmitted) {
                statusPills.push(sb.renderBadge('Resubmitted', 'purple'));
            }
        } else {
            statusPills.push(sb.renderStatusBadge(user.status, 'vetting'));
        }
    } else if (isClarif) {
        statusPills.push(`<span class="vetting-pill vetting-pill--waiting">Waiting for Updates</span>`);
    } else if (isPending) {
        statusPills.push(`<span class="vetting-pill vetting-pill--pending">Pending Review</span>`);
        if (resubmitted) {
            statusPills.push(`<span class="vetting-pill vetting-pill--resubmitted">Resubmitted</span>`);
        }
    } else {
        statusPills.push(`<span class="vetting-pill vetting-pill--neutral">${vettingEscapeHtml(va ? va.formatAdminAccountStatus(user.status) : user.status)}</span>`);
    }

    const docCount = getDocumentsCount(user);
    const caseStudyOk = hasCaseStudy(user);
    const age = vettingFormatRelativeDays(user.createdAt);
    const ageClass =
        age.tone === 'crit' ? 'is-crit' : age.tone === 'warn' ? 'is-warn' : '';
    const displayName = user.profile?.name || user.email || 'Unnamed account';
    const email = user.email || '';
    const safeName = vettingEscapeHtml(displayName);
    const safeEmail = vettingEscapeHtml(email);

    const reasons = user.profile?.vetting?.requestedReasonLabels;
    const reasonsLine =
        Array.isArray(reasons) && reasons.length
            ? `<div class="vetting-card-reasons"><span class="vetting-card-reasons-label">Requested updates:</span> ${vettingEscapeHtml(reasons.join(', '))}</div>`
            : '';

    const evidenceItems = [];
    evidenceItems.push(
        `<span class="vetting-card-meta-item${docCount === 0 ? ' is-missing' : ''}">
            <i class="ph-duotone ph-file-text" aria-hidden="true"></i>
            ${docCount} document${docCount === 1 ? '' : 's'}
        </span>`
    );
    if (!isCompany) {
        evidenceItems.push(
            `<span class="vetting-card-meta-item${caseStudyOk ? '' : ' is-missing'}">
                <i class="ph-duotone ph-${caseStudyOk ? 'check-circle' : 'warning-circle'}" aria-hidden="true"></i>
                Case study: ${caseStudyOk ? 'Yes' : 'No'}
            </span>`
        );
    }
    evidenceItems.push(
        `<span class="vetting-card-meta-item">
            <i class="ph-duotone ph-calendar-blank" aria-hidden="true"></i>
            Registered ${vettingEscapeHtml(vettingFormatDate(user.createdAt))}
        </span>`
    );
    if (user.updatedAt) {
        evidenceItems.push(
            `<span class="vetting-card-meta-item">
                <i class="ph-duotone ph-clock-counter-clockwise" aria-hidden="true"></i>
                Updated ${vettingEscapeHtml(vettingFormatDate(user.updatedAt))}
            </span>`
        );
    }

    return `
    <article class="vetting-card${selected ? ' is-selected' : ''}" data-key="${vettingEscapeHtml(key)}">
        <label class="vetting-card-select" aria-label="Select ${safeName}">
            <input type="checkbox" class="vetting-card-checkbox" data-key="${vettingEscapeHtml(key)}" ${selected ? 'checked' : ''} />
        </label>
        <div>
            <div class="vetting-card-head">
                <span class="vetting-avatar" aria-hidden="true">${vettingEscapeHtml(getInitial(user))}</span>
                <div class="vetting-card-titles">
                    <span class="vetting-card-name">${safeName}</span>
                    ${displayName !== email && email ? `<span class="vetting-card-email">${safeEmail}</span>` : ''}
                </div>
                <span class="vetting-card-badges">
                    ${statusPills.join('')}
                    <span class="vetting-pill vetting-pill--type">${vettingEscapeHtml(accountTypeLabel)}</span>
                    <span class="vetting-pill vetting-pill--age ${ageClass}">${vettingEscapeHtml(age.label)}</span>
                </span>
            </div>
            ${reasonsLine}
            <div class="vetting-card-meta">${evidenceItems.join('')}</div>
            <div class="vetting-card-actions">
                <button type="button" class="btn btn-success" data-action="approve" data-id="${vettingEscapeHtml(user.id)}" data-company="${isCompany}">
                    <i class="ph-duotone ph-check-circle" aria-hidden="true"></i>
                    Approve
                </button>
                <button type="button" class="btn btn-warning" data-action="clarify" data-id="${vettingEscapeHtml(user.id)}" data-company="${isCompany}">
                    <i class="ph-duotone ph-info" aria-hidden="true"></i>
                    Request Updates
                </button>
                <button type="button" class="btn btn-danger" data-action="reject" data-id="${vettingEscapeHtml(user.id)}" data-company="${isCompany}">
                    <i class="ph-duotone ph-x-circle" aria-hidden="true"></i>
                    Reject
                </button>
                <a href="#" data-route="/admin/people/${vettingEscapeHtml(user.id)}" class="vetting-card-detail-link">View Details →</a>
            </div>
        </div>
    </article>
    `;
}

function renderBulkBar(visible) {
    const bar = document.getElementById('vetting-bulk-actions');
    const count = document.getElementById('vetting-bulk-count');
    const selectAll = document.getElementById('vetting-select-all');
    if (!bar) return;

    const visibleKeys = new Set(visible.map(makeKey));
    const visibleSelected = Array.from(vettingState.selected).filter(k => visibleKeys.has(k));

    bar.hidden = vettingState.selected.size === 0;
    if (count) count.textContent = String(visibleSelected.length || vettingState.selected.size);

    if (selectAll) {
        const allChecked = visible.length > 0 && visibleSelected.length === visible.length;
        selectAll.checked = allChecked;
        selectAll.indeterminate = !allChecked && visibleSelected.length > 0;
    }
}

async function approveUser(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const ok = await (window.modalService?.confirm?.(
        `Approve this ${isCompany ? 'company' : 'user'}? They will be notified and gain full access.`,
        'Approve account',
        { confirmText: 'Approve', cancelText: 'Cancel', type: 'success' }
    ) ?? Promise.resolve(true));
    if (!ok) return;

    try {
        await window.vettingActions.approveAccount(userId, isCompany, { details: {} });
        vettingState.selected.delete(`${isCompany ? 'company' : 'user'}:${userId}`);
        await loadVettingList();
    } catch (error) {
        console.error('Error approving:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to approve. Please try again.') ?? Promise.resolve());
    }
}

async function rejectUser(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const reason = await (window.modalService?.prompt?.(
        `Reject this ${isCompany ? 'company' : 'user'}? Add an optional reason — they will be notified.`,
        {
            title: 'Reject account',
            confirmText: 'Reject account',
            cancelText: 'Cancel',
            placeholder: 'Reason for rejection (optional)…',
            type: 'error'
        }
    ) ?? Promise.resolve(null));
    if (reason === null) return;

    try {
        await window.vettingActions.rejectAccount(userId, isCompany, (reason || '').trim(), { details: {} });
        vettingState.selected.delete(`${isCompany ? 'company' : 'user'}:${userId}`);
        await loadVettingList();
    } catch (error) {
        console.error('Error rejecting:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to reject. Please try again.') ?? Promise.resolve());
    }
}

async function requestAccountUpdatesFromQueue(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const data = await window.vettingActions.openRequestUpdatesModal({ bulkCount: 0 });
    if (!data) return;

    try {
        await window.vettingActions.requestAccountUpdates(userId, isCompany, data.reasonIds, data.note, { details: {} });
        vettingState.selected.delete(`${isCompany ? 'company' : 'user'}:${userId}`);
        await loadVettingList();
    } catch (error) {
        console.error('Error requesting updates:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to send update request.') ?? Promise.resolve());
    }
}

function getSelectedVettingItems() {
    return Array.from(vettingState.selected).map(parseKey);
}

async function bulkApprove() {
    authService.assertAdminCapability('admin.vetting');
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const selected = getSelectedVettingItems();
    if (selected.length === 0) {
        await (window.modalService?.info?.('Select one or more items first.') ?? Promise.resolve());
        return;
    }
    const ok = await (window.modalService?.confirm?.(
        `Approve ${selected.length} selected account${selected.length === 1 ? '' : 's'}? They will all be notified.`,
        'Approve in bulk',
        { confirmText: `Approve ${selected.length}`, cancelText: 'Cancel', type: 'success' }
    ) ?? Promise.resolve(true));
    if (!ok) return;
    for (const { id, isCompany } of selected) {
        try {
            await window.vettingActions.approveAccount(id, isCompany, { details: { bulk: true } });
        } catch (e) {
            console.error('Error approving in bulk:', e);
        }
    }
    vettingState.selected.clear();
    await loadVettingList();
}

async function bulkReject() {
    authService.assertAdminCapability('admin.vetting');
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const selected = getSelectedVettingItems();
    if (selected.length === 0) {
        await (window.modalService?.info?.('Select one or more items first.') ?? Promise.resolve());
        return;
    }
    const reason = await (window.modalService?.prompt?.(
        `Reject ${selected.length} selected account${selected.length === 1 ? '' : 's'}? Add an optional reason that will be sent to all of them.`,
        {
            title: 'Reject in bulk',
            confirmText: `Reject ${selected.length}`,
            cancelText: 'Cancel',
            placeholder: 'Reason for rejection (optional)…',
            type: 'error'
        }
    ) ?? Promise.resolve(null));
    if (reason === null) return;
    for (const { id, isCompany } of selected) {
        try {
            await window.vettingActions.rejectAccount(id, isCompany, (reason || '').trim(), { details: { bulk: true } });
        } catch (e) {
            console.error('Error rejecting in bulk:', e);
        }
    }
    vettingState.selected.clear();
    await loadVettingList();
}

async function bulkRequestUpdates() {
    authService.assertAdminCapability('admin.vetting');
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    const selected = getSelectedVettingItems();
    if (selected.length === 0) {
        await (window.modalService?.info?.('Select one or more items first.') ?? Promise.resolve());
        return;
    }
    const data = await window.vettingActions.openRequestUpdatesModal({ bulkCount: selected.length });
    if (!data) return;
    for (const { id, isCompany } of selected) {
        try {
            await window.vettingActions.requestAccountUpdates(id, isCompany, data.reasonIds, data.note, { details: { bulk: true } });
        } catch (e) {
            console.error('Error requesting updates in bulk:', e);
        }
    }
    vettingState.selected.clear();
    await loadVettingList();
}

window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.requestAccountUpdatesFromQueue = requestAccountUpdatesFromQueue;
/** @deprecated use requestAccountUpdatesFromQueue */
window.requestClarification = requestAccountUpdatesFromQueue;
