/**
 * Admin User Management — post-vetting accounts only (active, suspended, rejected).
 * Pending and clarification_requested appear on User Vetting only.
 */

const UMGMT_MANAGED_STATUSES = ['active', 'suspended', 'rejected'];

const adminUsersState = {
    raw: [],
    items: [],
    statusFilter: 'active',
    audienceFilter: '',
    search: '',
    sort: 'newest'
};

function umgmtEscapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function umgmtFormatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

function umgmtManagedOnly(list) {
    return list.filter(u => UMGMT_MANAGED_STATUSES.includes(u.status));
}

function umgmtStatusLabel(status) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function') {
        return window.statusBadgeSystem.getStatusLabel(status, 'user');
    }
    if (status === 'active') return 'Active';
    if (window.vettingActions && typeof window.vettingActions.formatAdminAccountStatus === 'function') {
        return window.vettingActions.formatAdminAccountStatus(status);
    }
    if (!status) return '—';
    return String(status)
        .split('_')
        .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .join(' ');
}

function umgmtStatusPillClass(status) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusBadgeClass === 'function') {
        return window.statusBadgeSystem.getStatusBadgeClass(status, 'user');
    }
    switch (status) {
        case 'active':
            return 'vetting-pill--active';
        case 'suspended':
            return 'vetting-pill--suspended';
        case 'rejected':
            return 'vetting-pill--rejected';
        default:
            return 'vetting-pill--type';
    }
}

function umgmtAccountTypeLabel(user) {
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

function umgmtIsCompany(user) {
    return user.profile?.type === 'company';
}

function umgmtIsConsultant(user) {
    if (umgmtIsCompany(user)) return false;
    return (
        user.role === 'consultant' ||
        user.profile?.type === 'consultant' ||
        user.profile?.individualType === 'consultant'
    );
}

function umgmtIsProfessional(user) {
    if (umgmtIsCompany(user)) return false;
    return !umgmtIsConsultant(user);
}

function umgmtGetInitial(user) {
    const name = user.profile?.name || user.email || '?';
    return (name.trim().charAt(0) || '?').toUpperCase();
}

function umgmtSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function umgmtCanWrite() {
    return typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.users.write');
}

function umgmtCanVet() {
    return typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.vetting');
}

async function initAdminUsers() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.users.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    const headerMount = document.getElementById('page-context-header-mount');
    if (
        headerMount &&
        window.pageContextHeader &&
        window.pageContextHeader.PRESETS &&
        window.pageContextHeader.PRESETS.adminUserManagement
    ) {
        window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.adminUserManagement);
    }

    setupUserMgmtFilters();
    await loadUsers();
    if (typeof applyAuditorReadOnlyAdmin === 'function') applyAuditorReadOnlyAdmin();
}

function syncUserMgmtStatusTabs() {
    document.querySelectorAll('[data-umgmt-status]').forEach(b => {
        const value = b.getAttribute('data-umgmt-status') || '';
        const isOn = value === adminUsersState.statusFilter;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function syncUserMgmtAudienceTabs() {
    document.querySelectorAll('[data-umgmt-audience]').forEach(b => {
        const value = b.getAttribute('data-umgmt-audience') || '';
        const isOn = value === adminUsersState.audienceFilter;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-selected', String(isOn));
    });
}

function setupUserMgmtFilters() {
    document.querySelectorAll('[data-umgmt-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminUsersState.statusFilter = btn.getAttribute('data-umgmt-status') || '';
            renderUserMgmtList();
        });
    });

    document.querySelectorAll('[data-umgmt-audience]').forEach(btn => {
        btn.addEventListener('click', () => {
            adminUsersState.audienceFilter = btn.getAttribute('data-umgmt-audience') || '';
            renderUserMgmtList();
        });
    });

    const sortEl = document.getElementById('umgmt-filter-sort');
    if (sortEl) {
        sortEl.addEventListener('change', e => {
            adminUsersState.sort = e.target.value || 'newest';
            renderUserMgmtList();
        });
    }

    const search = document.getElementById('umgmt-filter-search');
    if (search) {
        let timer;
        search.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                adminUsersState.search = (e.target.value || '').toLowerCase().trim();
                renderUserMgmtList();
            }, 120);
        });
    }
}

async function loadUsers() {
    const container = document.getElementById('umgmt-list');
    if (container) container.innerHTML = '<div class="spinner"></div>';

    try {
        const [users, companies] = await Promise.all([dataService.getUsers(), dataService.getCompanies()]);
        adminUsersState.raw = [...users, ...companies];
        adminUsersState.items = umgmtManagedOnly(adminUsersState.raw);
        renderUserMgmtList();
        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('.umgmt-helper', 'users');
            void window.seedStorageIndicator.syncPageHint('.umgmt-stats-grid', 'companies');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        if (container) {
            container.innerHTML =
                '<div class="vetting-empty"><p class="vetting-empty-title">Couldn’t load accounts</p><p class="vetting-empty-desc">Please refresh the page or try again later.</p></div>';
        }
    }
}

function getUserMgmtVisible() {
    const { items, statusFilter, audienceFilter, search, sort } = adminUsersState;
    let list = items.slice();

    if (statusFilter) {
        list = list.filter(u => u.status === statusFilter);
    }
    if (audienceFilter === 'companies') {
        list = list.filter(umgmtIsCompany);
    } else if (audienceFilter === 'professionals') {
        list = list.filter(umgmtIsProfessional);
    } else if (audienceFilter === 'consultants') {
        list = list.filter(umgmtIsConsultant);
    }

    if (search) {
        list = list.filter(
            u =>
                (u.email || '').toLowerCase().includes(search) ||
                (u.profile?.name || '').toLowerCase().includes(search)
        );
    }

    const nameKey = u => (u.profile?.name || u.email || '').toLowerCase();
    list.sort((a, b) => {
        if (sort === 'name') {
            const na = nameKey(a);
            const nb = nameKey(b);
            if (na === nb) return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
            return na.localeCompare(nb);
        }
        if (sort === 'type') {
            const ta = umgmtAccountTypeLabel(a);
            const tb = umgmtAccountTypeLabel(b);
            if (ta === tb) return nameKey(a).localeCompare(nameKey(b));
            return ta.localeCompare(tb);
        }
        const ca = new Date(a.createdAt).getTime() || 0;
        const cb = new Date(b.createdAt).getTime() || 0;
        if (sort === 'oldest') return ca - cb;
        return cb - ca;
    });

    return list;
}

function updateUserMgmtSummary() {
    const items = adminUsersState.items;
    const total = items.length;
    const active = items.filter(u => u.status === 'active').length;
    const suspended = items.filter(u => u.status === 'suspended').length;
    const rejected = items.filter(u => u.status === 'rejected').length;
    const companies = items.filter(umgmtIsCompany).length;

    umgmtSetText('umgmt-stat-total', String(total));
    umgmtSetText('umgmt-stat-active', String(active));
    umgmtSetText('umgmt-stat-suspended', String(suspended));
    umgmtSetText('umgmt-stat-rejected', String(rejected));
    umgmtSetText('umgmt-stat-companies', String(companies));

    const count = s => items.filter(u => u.status === s).length;
    umgmtSetText('umgmt-chip-all', String(total));
    umgmtSetText('umgmt-chip-active', String(count('active')));
    umgmtSetText('umgmt-chip-suspended', String(count('suspended')));
    umgmtSetText('umgmt-chip-rejected', String(count('rejected')));

    const profN = items.filter(umgmtIsProfessional).length;
    const consN = items.filter(umgmtIsConsultant).length;
    umgmtSetText('umgmt-chip-aud-all', String(total));
    umgmtSetText('umgmt-chip-aud-companies', String(companies));
    umgmtSetText('umgmt-chip-aud-professionals', String(profN));
    umgmtSetText('umgmt-chip-aud-consultants', String(consN));
}

const UMGMT_QUEUE_TITLES = {
    '': 'All managed accounts',
    active: 'Active accounts',
    suspended: 'Suspended accounts',
    rejected: 'Rejected accounts'
};

function renderUserMgmtCard(user) {
    const isCompany = umgmtIsCompany(user);
    const displayName = user.profile?.name || user.email || 'Unnamed account';
    const email = user.email || '';
    const safeName = umgmtEscapeHtml(displayName);
    const safeEmail = umgmtEscapeHtml(email);
    const status = user.status || '';
    const statusPill = umgmtStatusPillClass(status);
    const statusText = umgmtEscapeHtml(umgmtStatusLabel(status));
    const typeLabel = umgmtEscapeHtml(umgmtAccountTypeLabel(user));
    const roleLabel = umgmtEscapeHtml(user.role || '—');
    const joined = umgmtEscapeHtml(umgmtFormatDate(user.createdAt));
    const write = umgmtCanWrite();
    const vet = umgmtCanVet();

    const actions = [];

    if (status === 'active' && write) {
        actions.push(
            `<button type="button" class="btn btn-warning" data-action="suspend" data-user-id="${umgmtEscapeHtml(user.id)}" data-company="${isCompany}">
                <i class="ph-duotone ph-pause-circle" aria-hidden="true"></i>
                Suspend
            </button>`
        );
        if (vet) {
            actions.push(`
            <details class="umgmt-more">
                <summary class="btn btn-secondary btn-sm umgmt-more-summary">More actions</summary>
                <div class="umgmt-more-panel">
                    <button type="button" class="umgmt-more-item" data-action="reject_close" data-user-id="${umgmtEscapeHtml(user.id)}" data-company="${isCompany}">
                        Reject / Close account…
                    </button>
                </div>
            </details>`);
        }
    } else if (status === 'suspended' && write) {
        actions.push(
            `<button type="button" class="btn btn-success" data-action="reactivate" data-user-id="${umgmtEscapeHtml(user.id)}" data-company="${isCompany}">
                <i class="ph-duotone ph-arrow-counter-clockwise" aria-hidden="true"></i>
                Reactivate
            </button>`
        );
    } else if (status === 'rejected' && vet) {
        actions.push(
            `<button type="button" class="btn btn-secondary" data-action="reopen_for_review" data-user-id="${umgmtEscapeHtml(user.id)}" data-company="${isCompany}">
                <i class="ph-duotone ph-arrow-u-up-left" aria-hidden="true"></i>
                Reopen for review
            </button>`
        );
    }

    return `
    <article class="vetting-card" data-user-id="${umgmtEscapeHtml(user.id)}">
        <div>
            <div class="vetting-card-head">
                <span class="vetting-avatar" aria-hidden="true">${umgmtEscapeHtml(umgmtGetInitial(user))}</span>
                <div class="vetting-card-titles">
                    <span class="vetting-card-name">${safeName}</span>
                    ${displayName !== email && email ? `<span class="vetting-card-email">${safeEmail}</span>` : ''}
                </div>
                <span class="vetting-card-badges">
                    <span class="badge ${statusPill}">${statusText}</span>
                    <span class="vetting-pill vetting-pill--type">${typeLabel}</span>
                </span>
            </div>
            <div class="vetting-card-meta">
                <span class="vetting-card-meta-item">
                    <i class="ph-duotone ph-identification-badge" aria-hidden="true"></i>
                    Role: ${roleLabel}
                </span>
                <span class="vetting-card-meta-item">
                    <i class="ph-duotone ph-calendar-blank" aria-hidden="true"></i>
                    Joined ${joined}
                </span>
            </div>
            <div class="vetting-card-actions">
                ${actions.join('')}
                <a href="#" data-route="/admin/people/${umgmtEscapeHtml(user.id)}" class="vetting-card-detail-link">View Details →</a>
            </div>
        </div>
    </article>
    `;
}

function renderUserMgmtList() {
    updateUserMgmtSummary();
    syncUserMgmtStatusTabs();
    syncUserMgmtAudienceTabs();

    const queueTitle = document.getElementById('umgmt-queue-title');
    if (queueTitle) {
        queueTitle.textContent = UMGMT_QUEUE_TITLES[adminUsersState.statusFilter] || 'Managed accounts';
    }

    const container = document.getElementById('umgmt-list');
    const meta = document.getElementById('umgmt-queue-meta');
    if (!container) return;

    const visible = getUserMgmtVisible();
    const totalManaged = adminUsersState.items.length;

    if (meta) {
        if (totalManaged === 0) {
            meta.textContent = 'No post-vetting accounts yet.';
        } else {
            meta.textContent = `Showing ${visible.length} of ${totalManaged} managed account${totalManaged === 1 ? '' : 's'}`;
        }
    }

    if (visible.length === 0) {
        const isEmpty = totalManaged === 0;
        container.innerHTML = `
            <div class="vetting-empty">
                <p class="vetting-empty-title">${isEmpty ? 'No managed accounts' : 'No matches for these filters'}</p>
                <p class="vetting-empty-desc">${
                    isEmpty
                        ? 'Approved, suspended, and rejected accounts appear here. Accounts still in vetting are listed under User Vetting.'
                        : 'Try clearing status, audience, or search filters.'
                }</p>
            </div>
        `;
        return;
    }

    container.innerHTML = visible.map(renderUserMgmtCard).join('');

    container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const action = btn.dataset.action;
            if (action === 'toggle-more') return;
            const userId = btn.dataset.userId;
            const isCompany = btn.dataset.company === 'true';
            handleUserAction(action, userId, isCompany);
        });
    });

    container.querySelectorAll('.umgmt-more').forEach(det => {
        det.addEventListener('toggle', () => {
            if (!det.open) return;
            container.querySelectorAll('.umgmt-more').forEach(other => {
                if (other !== det) other.removeAttribute('open');
            });
        });
    });
}

async function handleUserAction(action, userId, isCompany) {
    switch (action) {
        case 'reject_close':
            await rejectUserFromManagement(userId, isCompany);
            break;
        case 'suspend':
            await suspendUser(userId, isCompany);
            break;
        case 'reactivate':
            await reactivateUser(userId, isCompany);
            break;
        case 'reopen_for_review':
            await reopenForReview(userId, isCompany);
            break;
        default:
            break;
    }
}

async function rejectUserFromManagement(userId, isCompany = false) {
    if (!window.vettingActions) {
        await (window.modalService?.error?.('Vetting module not loaded. Refresh the page.') ?? Promise.resolve());
        return;
    }
    try {
        authService.assertAdminCapability('admin.vetting');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
        return;
    }
    const ok = await (window.modalService?.confirm?.(
        `This will reject the ${isCompany ? 'company' : 'user'} and revoke access. They will be notified. Continue?`,
        'Reject / Close account',
        { confirmText: 'Continue', cancelText: 'Cancel', type: 'warning' }
    ) ?? Promise.resolve(false));
    if (!ok) return;

    const reason = await (window.modalService?.prompt?.(
        'Optional message to include with the rejection notification.',
        {
            title: 'Rejection details',
            confirmText: 'Reject account',
            cancelText: 'Cancel',
            placeholder: 'Reason (optional)…',
            type: 'error',
            required: false,
            multiline: true
        }
    ) ?? Promise.resolve(null));
    if (reason === null) return;

    try {
        await window.vettingActions.rejectAccount(userId, isCompany, (reason || '').trim(), { details: { from: 'admin-users-management' } });
        await (window.modalService?.success?.(`${isCompany ? 'Company' : 'User'} rejected.`, 'Done') ?? Promise.resolve());
        await loadUsers();
    } catch (error) {
        console.error('Error rejecting:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to reject.') ?? Promise.resolve());
    }
}

async function suspendUser(userId, isCompany = false) {
    try {
        authService.assertAdminCapability('admin.users.write');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission to suspend accounts.') ?? Promise.resolve());
        return;
    }

    const ok = await (window.modalService?.confirm?.(
        `Suspend this ${isCompany ? 'company' : 'user'}? They will lose access until reactivated.`,
        'Confirm suspension',
        { confirmText: 'Continue', cancelText: 'Cancel', type: 'warning' }
    ) ?? Promise.resolve(false));
    if (!ok) return;

    const form = await (window.modalService?.openSuspendAccountDialog?.(isCompany ? 'company' : 'user') ?? Promise.resolve(null));
    if (!form) return;

    const admin = authService.getCurrentUser();
    const record = isCompany ? await dataService.getCompanyById(userId) : await dataService.getUserById(userId);
    if (!record) {
        await (window.modalService?.error?.('Account not found.') ?? Promise.resolve());
        return;
    }

    const profile = { ...(record.profile || {}) };
    const prevSusp = profile.adminSuspension;
    const history = Array.isArray(profile.adminSuspensionHistory) ? profile.adminSuspensionHistory.slice() : [];
    if (prevSusp) {
        history.push({ ...prevSusp, supersededAt: new Date().toISOString() });
    }
    profile.adminSuspension = {
        reasonKey: form.reasonKey,
        reasonLabel: form.reasonLabel,
        note: form.note || '',
        suspendedAt: new Date().toISOString(),
        suspendedBy: admin.id
    };
    profile.adminSuspensionHistory = history.slice(-20);

    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'suspended', profile });
        } else {
            await dataService.updateUser(userId, { status: 'suspended', profile });
        }

        await dataService.createNotification({
            userId,
            type: 'account_suspended',
            title: 'Account suspended',
            message: 'Your account has been suspended. Please contact support for more information.'
        });

        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_suspended' : 'user_suspended',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: {
                reasonKey: form.reasonKey,
                reasonLabel: form.reasonLabel,
                note: form.note || '',
                suspendedAt: profile.adminSuspension.suspendedAt
            }
        });

        await (window.modalService?.success?.('Account suspended.', 'Done') ?? Promise.resolve());
        await loadUsers();
    } catch (error) {
        console.error('Error suspending:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to suspend.') ?? Promise.resolve());
    }
}

async function reactivateUser(userId, isCompany = false) {
    try {
        authService.assertAdminCapability('admin.users.write');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission to reactivate accounts.') ?? Promise.resolve());
        return;
    }

    const ok = await (window.modalService?.confirm?.(
        `Reactivate this ${isCompany ? 'company' : 'user'}? They will regain access as an active account.`,
        'Reactivate account',
        { confirmText: 'Reactivate', cancelText: 'Cancel', type: 'success' }
    ) ?? Promise.resolve(false));
    if (!ok) return;

    const admin = authService.getCurrentUser();
    const record = isCompany ? await dataService.getCompanyById(userId) : await dataService.getUserById(userId);
    if (!record) {
        await (window.modalService?.error?.('Account not found.') ?? Promise.resolve());
        return;
    }

    const profile = { ...(record.profile || {}) };
    const last = profile.adminSuspension;
    const history = Array.isArray(profile.adminSuspensionHistory) ? profile.adminSuspensionHistory.slice() : [];
    if (last) {
        history.push({
            ...last,
            reactivatedAt: new Date().toISOString(),
            reactivatedBy: admin.id
        });
    }
    profile.adminSuspension = null;
    profile.adminSuspensionHistory = history.slice(-20);

    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'active', profile });
        } else {
            await dataService.updateUser(userId, { status: 'active', profile });
        }

        await dataService.createNotification({
            userId,
            type: 'account_reactivated',
            title: 'Account reactivated',
            message: 'Your account access has been restored.'
        });

        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_reactivated' : 'user_reactivated',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: { newStatus: 'active' }
        });

        await (window.modalService?.success?.('Account reactivated.', 'Done') ?? Promise.resolve());
        await loadUsers();
    } catch (error) {
        console.error('Error reactivating:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to reactivate.') ?? Promise.resolve());
    }
}

async function reopenForReview(userId, isCompany = false) {
    try {
        authService.assertAdminCapability('admin.vetting');
    } catch (err) {
        await (window.modalService?.error?.(err?.message || 'You do not have permission.') ?? Promise.resolve());
        return;
    }

    const ok = await (window.modalService?.confirm?.(
        `Send this ${isCompany ? 'company' : 'user'} back to the vetting queue as pending?`,
        'Reopen for review',
        { confirmText: 'Reopen', cancelText: 'Cancel', type: 'warning' }
    ) ?? Promise.resolve(false));
    if (!ok) return;

    const record = isCompany ? await dataService.getCompanyById(userId) : await dataService.getUserById(userId);
    if (!record) {
        await (window.modalService?.error?.('Account not found.') ?? Promise.resolve());
        return;
    }

    const profile = { ...(record.profile || {}) };
    const vt = { ...(profile.vetting || {}) };
    vt.reopenedForReviewAt = new Date().toISOString();
    profile.vetting = vt;

    const admin = authService.getCurrentUser();

    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'pending', profile });
        } else {
            await dataService.updateUser(userId, { status: 'pending', profile });
        }

        await dataService.createNotification({
            userId,
            type: 'account_reopened_for_review',
            title: 'Account reopened for review',
            message: 'Your account has been placed back in the review queue. You will receive another message when there is an update.'
        });

        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_reopened_for_review' : 'user_reopened_for_review',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: { previousStatus: 'rejected', newStatus: 'pending' }
        });

        await (window.modalService?.success?.('Account moved to User Vetting as pending.', 'Done') ?? Promise.resolve());
        await loadUsers();
    } catch (error) {
        console.error('Error reopening:', error);
        await (window.modalService?.error?.(error?.message || 'Failed to reopen.') ?? Promise.resolve());
    }
}
