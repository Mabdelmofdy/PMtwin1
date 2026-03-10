/**
 * Admin User Vetting Component
 * Review pending and clarification_requested users/companies; approve, reject, or request clarification.
 */

async function initAdminVetting() {
    if (!authService.isAdmin()) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }

    await loadVettingList();
    setupFilters();
    const bulkEl = document.getElementById('vetting-bulk-actions');
    if (bulkEl) {
        bulkEl.querySelector('#vetting-approve-selected')?.addEventListener('click', bulkApprove);
        bulkEl.querySelector('#vetting-reject-selected')?.addEventListener('click', bulkReject);
    }
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const statusSelect = document.getElementById('filter-status');
    const searchInput = document.getElementById('filter-search');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => loadVettingList());
    }
    if (statusSelect) {
        statusSelect.addEventListener('change', () => loadVettingList());
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadVettingList(); });
    }
}

async function loadVettingList() {
    const container = document.getElementById('vetting-list');
    if (!container) return;

    container.innerHTML = '<div class="spinner"></div>';

    try {
        const users = await dataService.getUsers();
        const companies = await dataService.getCompanies();
        let list = [...users, ...companies].filter(
            u => u.status === 'pending' || u.status === 'clarification_requested'
        );

        const statusFilter = document.getElementById('filter-status')?.value;
        const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase();

        if (statusFilter) {
            list = list.filter(u => u.status === statusFilter);
        }
        if (searchFilter) {
            list = list.filter(u =>
                u.email?.toLowerCase().includes(searchFilter) ||
                u.profile?.name?.toLowerCase().includes(searchFilter)
            );
        }

        if (list.length === 0) {
            container.innerHTML = '<div class="empty-state">No users or companies awaiting review</div>';
            return;
        }

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = list.map(user => {
            const isCompany = user.profile?.type === 'company';
            const accountTypeLabel = isCompany ? 'Company' : (user.role === 'consultant' || user.profile?.type === 'consultant' || user.profile?.individualType === 'consultant' ? 'Consultant' : 'Professional');
            const statusLabel = user.status === 'clarification_requested' ? 'Clarification Requested' : 'Pending';
            const statusClass = user.status === 'clarification_requested' ? 'warning' : 'warning';
            const docCount = (user.profile?.documents || []).length;
            const hasCaseStudy = !!(user.profile?.vettingCaseStudy && (user.profile.vettingCaseStudy.title || user.profile.vettingCaseStudy.url || user.profile.vettingCaseStudy.description)) || (user.profile?.caseStudies || []).length > 0;
            const docSummary = isCompany ? `Documents: ${docCount}` : `Documents: ${docCount} · Case study: ${hasCaseStudy ? 'Yes' : 'No'}`;
            return `
            <div class="vetting-card flex gap-2" data-id="${user.id}" data-company="${isCompany}">
                <label class="vetting-checkbox-label flex-shrink-0 mt-1">
                    <input type="checkbox" class="vetting-select" data-id="${user.id}" data-company="${isCompany}" />
                </label>
                <div class="flex-1 min-w-0">
                <div class="vetting-card-header">
                    <div>
                        <h3 class="vetting-email">${user.email}</h3>
                        <span class="badge badge-${statusClass}">${statusLabel}</span>
                        <span class="badge badge-secondary">${accountTypeLabel}</span>
                    </div>
                </div>
                <div class="vetting-card-body">
                    <p><strong>Account type:</strong> ${accountTypeLabel}</p>
                    <p><strong>${docSummary}</strong></p>
                    <p><strong>Registered:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                    ${user.profile?.name ? `<p><strong>Name:</strong> ${user.profile.name}</p>` : ''}
                </div>
                <div class="vetting-card-footer">
                    <button type="button" class="btn btn-success btn-sm" data-action="approve" data-id="${user.id}" data-company="${isCompany}">Approve</button>
                    <button type="button" class="btn btn-danger btn-sm" data-action="reject" data-id="${user.id}" data-company="${isCompany}">Reject</button>
                    <button type="button" class="btn btn-warning btn-sm" data-action="clarify" data-id="${user.id}" data-company="${isCompany}">Request clarification</button>
                    <a href="#" data-route="/admin/users/${user.id}" class="btn btn-secondary btn-sm">View detail</a>
                </div>
                </div>
            </div>
            `;
        }).join('');

        const bulkEl = document.getElementById('vetting-bulk-actions');
        if (bulkEl) bulkEl.style.display = 'block';

        container.querySelectorAll('[data-action]').forEach(btn => {
            if (btn.tagName === 'A') return;
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const isCompany = btn.dataset.company === 'true';
                if (action === 'approve') approveUser(id, isCompany);
                else if (action === 'reject') rejectUser(id, isCompany);
                else if (action === 'clarify') requestClarification(id, isCompany);
            });
        });
    } catch (error) {
        console.error('Error loading vetting list:', error);
        container.innerHTML = '<div class="empty-state">Error loading list</div>';
    }
}

async function approveUser(userId, isCompany = false) {
    if (!confirm(`Approve this ${isCompany ? 'company' : 'user'}?`)) return;

    try {
        if (isCompany) {
            const company = await dataService.getCompanyById(userId);
            const profile = { ...(company?.profile || {}), verificationStatus: 'company_verified' };
            await dataService.updateCompany(userId, { status: 'active', profile });
        } else {
            const user = await dataService.getUserById(userId);
            const profile = { ...(user?.profile || {}) };
            if (user?.role === 'professional') profile.verificationStatus = 'professional_verified';
            else if (user?.role === 'consultant') profile.verificationStatus = 'consultant_verified';
            await dataService.updateUser(userId, { status: 'active', profile });
        }

        await dataService.createNotification({
            userId,
            type: 'account_approved',
            title: 'Account Approved',
            message: 'Your account has been approved. You can now access all features.'
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_approved' : 'user_approved',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: {}
        });

        await loadVettingList();
    } catch (error) {
        console.error('Error approving:', error);
        alert('Failed to approve. Please try again.');
    }
}

async function rejectUser(userId, isCompany = false) {
    if (!confirm(`Reject this ${isCompany ? 'company' : 'user'}? They will be notified.`)) return;

    const reason = prompt('Rejection reason (optional):');

    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'rejected' });
        } else {
            await dataService.updateUser(userId, { status: 'rejected' });
        }

        await dataService.createNotification({
            userId,
            type: 'account_rejected',
            title: 'Account Rejected',
            message: reason ? `Your account was rejected: ${reason}` : 'Your account registration was rejected.'
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_rejected' : 'user_rejected',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: { reason: reason || 'No reason provided' }
        });

        await loadVettingList();
    } catch (error) {
        console.error('Error rejecting:', error);
        alert('Failed to reject. Please try again.');
    }
}

function getSelectedVettingItems() {
    const checkboxes = document.querySelectorAll('.vetting-select:checked');
    return Array.from(checkboxes).map(cb => ({ id: cb.dataset.id, isCompany: cb.dataset.company === 'true' }));
}

async function bulkApprove() {
    const selected = getSelectedVettingItems();
    if (selected.length === 0) {
        alert('Select one or more items first.');
        return;
    }
    if (!confirm(`Approve ${selected.length} selected item(s)?`)) return;
    for (const { id, isCompany } of selected) {
        await approveUser(id, isCompany);
    }
}

async function bulkReject() {
    const selected = getSelectedVettingItems();
    if (selected.length === 0) {
        alert('Select one or more items first.');
        return;
    }
    const reason = prompt('Rejection reason (optional, applies to all):');
    if (reason === null) return;
    for (const { id, isCompany } of selected) {
        await rejectUserWithReason(id, isCompany, reason);
    }
    await loadVettingList();
}

async function rejectUserWithReason(userId, isCompany, reason) {
    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'rejected' });
        } else {
            await dataService.updateUser(userId, { status: 'rejected' });
        }
        await dataService.createNotification({
            userId,
            type: 'account_rejected',
            title: 'Account Rejected',
            message: reason ? `Your account was rejected: ${reason}` : 'Your account registration was rejected.'
        });
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_rejected' : 'user_rejected',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: { reason: reason || 'No reason provided' }
        });
    } catch (e) {
        console.error('Error rejecting:', e);
    }
}

async function requestClarification(userId, isCompany = false) {
    const reason = prompt('Reason or missing items (optional):');
    if (reason === null) return;

    try {
        if (isCompany) {
            await dataService.updateCompany(userId, { status: 'clarification_requested' });
        } else {
            await dataService.updateUser(userId, { status: 'clarification_requested' });
        }

        await dataService.createNotification({
            userId,
            type: 'account_clarification_requested',
            title: 'Registration needs clarification',
            message: reason ? `Your registration needs clarification: ${reason}. Please update your profile or documents and submit for review again.` : 'Your registration needs clarification. Please update your profile or documents and submit for review again from your profile page.'
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_clarification_requested' : 'user_clarification_requested',
            entityType: isCompany ? 'company' : 'user',
            entityId: userId,
            details: { reason: reason || '' }
        });

        await loadVettingList();
    } catch (error) {
        console.error('Error requesting clarification:', error);
        alert('Failed to request clarification.');
    }
}
