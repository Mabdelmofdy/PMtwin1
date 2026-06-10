/**
 * Shared admin vetting actions (approve, reject, request updates, resubmit).
 * Depends on: CONFIG, authService, dataService, window.modalService (optional for UI helpers).
 */

(function (global) {
    const MAX_CLARIFICATION_FILE_BYTES = 5 * 1024 * 1024;

    const VETTING_UPDATE_REASON_OPTIONS = [
        { id: 'company_profile', label: 'Company profile information' },
        { id: 'contact_info', label: 'Contact information' },
        { id: 'commercial_registration', label: 'Commercial registration document' },
        { id: 'tax_vat', label: 'Tax/VAT document' },
        { id: 'portfolio_references', label: 'Portfolio or project references' },
        { id: 'services_skills', label: 'Services / skills information' },
        { id: 'other', label: 'Other' }
    ];

    function escapePlain(text) {
        if (text == null) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getReasonLabelsByIds(ids) {
        const set = new Set(ids || []);
        return VETTING_UPDATE_REASON_OPTIONS.filter(o => set.has(o.id)).map(o => o.label);
    }

    function formatAdminAccountStatus(status) {
        if (global.statusBadgeSystem && typeof global.statusBadgeSystem.getStatusLabel === 'function') {
            return global.statusBadgeSystem.getStatusLabel(status, 'vetting');
        }
        if (status === 'pending') return 'Pending Review';
        if (status === 'clarification_requested') return 'Waiting for Updates';
        if (status === 'active') return 'Active';
        if (status === 'rejected') return 'Rejected';
        if (status === 'suspended') return 'Suspended';
        return status ? String(status) : '—';
    }

    function formatApplicantAccountStatus(status) {
        if (global.statusBadgeSystem && typeof global.statusBadgeSystem.getStatusLabel === 'function') {
            return global.statusBadgeSystem.getStatusLabel(status, 'profile');
        }
        if (status === 'pending') return 'Pending Review';
        if (status === 'clarification_requested') return 'Needs Updates';
        if (status === 'active') return 'Active';
        if (status === 'rejected') return 'Rejected';
        if (status === 'suspended') return 'Suspended';
        return status ? String(status) : '—';
    }

    function isResubmittedPending(person) {
        if (!person || person.status !== 'pending') return false;
        const v = person.profile?.vetting;
        if (!v) return false;
        if (v.resubmittedAt) return true;
        if (v.lastResubmittedAt && v.updateRequestAt) {
            return new Date(v.lastResubmittedAt) >= new Date(v.updateRequestAt);
        }
        return false;
    }

    function buildUpdatesRequestMessage(reasonLabels, note) {
        const parts = [];
        if (reasonLabels && reasonLabels.length) {
            parts.push(`Please update the following: ${reasonLabels.join(', ')}.`);
        }
        if (note && String(note).trim()) {
            parts.push(`Note from reviewer: ${String(note).trim()}`);
        }
        if (!parts.length) {
            parts.push('Please update your registration and submit again for review.');
        }
        return parts.join(' ');
    }

    async function fetchActorRecord(accountId, isCompany) {
        if (isCompany) return dataService.getCompanyById(accountId);
        return dataService.getUserById(accountId);
    }

    /**
     * @returns {Promise<{ reasonIds: string[], note: string }|null>}
     */
    function openRequestUpdatesModal(options = {}) {
        const bulkCount = typeof options.bulkCount === 'number' ? options.bulkCount : 0;
        const container = document.getElementById('modal-container');
        if (!container || !window.modalService) {
            return Promise.resolve(null);
        }

        return new Promise(resolve => {
            const closeIcon = typeof IconHelper !== 'undefined' && IconHelper.render ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';

            const checks = VETTING_UPDATE_REASON_OPTIONS.map(
                o => `
                <label class="vetting-updates-reason-row">
                    <input type="checkbox" class="vetting-updates-reason-cb" value="${escapePlain(o.id)}" />
                    <span>${escapePlain(o.label)}</span>
                </label>`
            ).join('');

            const bulkHint =
                bulkCount > 1
                    ? `<p class="vetting-updates-bulk-hint text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">The same reasons and note will be sent to all selected accounts.</p>`
                    : '';

            const confirmLabel = bulkCount > 1 ? `Send to ${bulkCount} accounts` : 'Send Request';

            const modal = document.createElement('div');
            modal.className = 'modal-dialog';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Request Missing Information</h3>
                        <button type="button" class="modal-close" aria-label="Close">${closeIcon}</button>
                    </div>
                    <div class="modal-body modal-body-prompt">
                        <p class="modal-message mb-2">Select what the applicant needs to update before approval.</p>
                        ${bulkHint}
                        <div class="vetting-updates-reasons mt-3">${checks}</div>
                        <label class="block mt-3 text-sm font-medium text-gray-700">Optional note</label>
                        <textarea class="modal-prompt-input vetting-updates-note" rows="3" placeholder="Add context for the applicant…"></textarea>
                        <p class="vetting-updates-error text-sm text-red-600 mt-2" hidden>Select at least one item.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary vetting-updates-cancel">Cancel</button>
                        <button type="button" class="btn btn-primary vetting-updates-submit">${escapePlain(confirmLabel)}</button>
                    </div>
                </div>
            `;

            container.innerHTML = '';
            container.appendChild(modal);
            container.style.display = 'flex';

            const errEl = modal.querySelector('.vetting-updates-error');
            const noteEl = modal.querySelector('.vetting-updates-note');

            function finish(value) {
                container.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onKey);
                window.modalService.close();
                resolve(value);
            }

            function onKey(e) {
                if (e.key === 'Escape') finish(null);
            }

            function onOverlay(e) {
                if (e.target === container) finish(null);
            }

            const submit = () => {
                const ids = Array.from(modal.querySelectorAll('.vetting-updates-reason-cb:checked')).map(cb => cb.value);
                if (!ids.length) {
                    if (errEl) errEl.hidden = false;
                    return;
                }
                if (errEl) errEl.hidden = true;
                const note = (noteEl?.value || '').trim();
                finish({ reasonIds: ids, note });
            };

            modal.querySelector('.vetting-updates-submit')?.addEventListener('click', submit);
            modal.querySelector('.vetting-updates-cancel')?.addEventListener('click', () => finish(null));
            modal.querySelector('.modal-close')?.addEventListener('click', () => finish(null));
            container.addEventListener('click', onOverlay);

            document.addEventListener('keydown', onKey);
        });
    }

    async function notifyAdminsVettingResubmitted() {
        try {
            const allUsers = await dataService.getUsers();
            const adminRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR];
            const admins = allUsers.filter(u => adminRoles.includes(u.role));
            const vettingRoute = (CONFIG.ROUTES && CONFIG.ROUTES.ADMIN_VETTING) || '/admin/vetting';
            await Promise.all(
                admins.map(admin =>
                    dataService.createNotification({
                        userId: admin.id,
                        type: 'account_resubmitted_for_review',
                        title: 'Account resubmitted for review',
                        message: 'The applicant has updated their profile or documents and submitted again for review.',
                        link: vettingRoute
                    })
                )
            );
        } catch (e) {
            console.warn('Could not notify admins of resubmission', e);
        }
    }

    async function approveAccount(accountId, isCompany, meta = {}) {
        authService.assertNotReadOnlyAdmin();
        authService.assertAdminCapability('admin.vetting');
        const record = await fetchActorRecord(accountId, isCompany);
        const previousStatus = record?.status;

        if (isCompany) {
            const company = await dataService.getCompanyById(accountId);
            const profile = { ...(company?.profile || {}), verificationStatus: 'company_verified' };
            await dataService.updateCompany(accountId, { status: 'active', profile });
        } else {
            const user = await dataService.getUserById(accountId);
            const profile = { ...(user?.profile || {}) };
            if (user?.role === 'professional') profile.verificationStatus = 'professional_verified';
            else if (user?.role === 'consultant') profile.verificationStatus = 'consultant_verified';
            await dataService.updateUser(accountId, { status: 'active', profile });
        }

        await dataService.createNotification({
            userId: accountId,
            type: 'account_approved',
            title: 'Account Approved',
            message: 'Your account has been approved. You can now access all features.'
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_approved' : 'user_approved',
            entityType: isCompany ? 'company' : 'user',
            entityId: accountId,
            details: { previousStatus, newStatus: 'active', ...(meta.details || {}) }
        });
    }

    async function rejectAccount(accountId, isCompany, reason, meta = {}) {
        authService.assertNotReadOnlyAdmin();
        authService.assertAdminCapability('admin.vetting');
        const record = await fetchActorRecord(accountId, isCompany);
        const previousStatus = record?.status;

        if (isCompany) await dataService.updateCompany(accountId, { status: 'rejected' });
        else await dataService.updateUser(accountId, { status: 'rejected' });

        const defaultRejectMessage =
            previousStatus === 'active'
                ? 'Your account access has been revoked and the account was rejected.'
                : 'Your account registration was rejected.';
        await dataService.createNotification({
            userId: accountId,
            type: 'account_rejected',
            title: 'Account Rejected',
            message: reason ? `Your account was rejected: ${reason}` : defaultRejectMessage
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_rejected' : 'user_rejected',
            entityType: isCompany ? 'company' : 'user',
            entityId: accountId,
            details: {
                reason: reason || 'No reason provided',
                previousStatus,
                newStatus: 'rejected',
                ...(meta.details || {})
            }
        });
    }

    async function requestAccountUpdates(accountId, isCompany, reasonIds, note, meta = {}) {
        authService.assertNotReadOnlyAdmin();
        authService.assertAdminCapability('admin.vetting');
        const ids = Array.isArray(reasonIds) ? reasonIds.filter(Boolean) : [];
        if (!ids.length) {
            throw new Error('Select at least one update reason.');
        }

        const record = await fetchActorRecord(accountId, isCompany);
        const previousStatus = record?.status;
        const profile = { ...(record?.profile || {}) };
        const reasonLabels = getReasonLabelsByIds(ids);
        const now = new Date().toISOString();
        profile.vetting = {
            ...(profile.vetting || {}),
            requestedReasonIds: ids,
            requestedReasonLabels: reasonLabels,
            adminNote: (note && String(note).trim()) || '',
            updateRequestAt: now
        };

        if (isCompany) await dataService.updateCompany(accountId, { status: 'clarification_requested', profile });
        else await dataService.updateUser(accountId, { status: 'clarification_requested', profile });

        const message = buildUpdatesRequestMessage(reasonLabels, note);

        await dataService.createNotification({
            userId: accountId,
            type: 'account_clarification_requested',
            title: 'Registration needs updates',
            message
        });

        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: isCompany ? 'company_clarification_requested' : 'user_clarification_requested',
            entityType: isCompany ? 'company' : 'user',
            entityId: accountId,
            details: {
                reasons: ids,
                reasonLabels,
                note: (note && String(note).trim()) || '',
                previousStatus,
                newStatus: 'clarification_requested',
                ...(meta.details || {})
            }
        });
    }

    /**
     * Validates clarification document file sizes; returns merged document list.
     * @param {FileList|File[]} filesFromInputs - not used directly; validation is on collected docs with file refs
     * @param {{ documents: Array, profile: object }} payload
     */
    function validateClarificationDocumentsPayload(documents) {
        const list = Array.isArray(documents) ? documents : [];
        for (const d of list) {
            if (d && d.data && typeof d.data === 'string' && d.data.startsWith('data:')) {
                const approx = Math.floor((d.data.length * 3) / 4);
                if (approx > MAX_CLARIFICATION_FILE_BYTES) {
                    return {
                        ok: false,
                        error: 'This file is too large. Maximum file size is 5MB.'
                    };
                }
            }
        }
        return { ok: true, documents: list };
    }

    async function resubmitAccountForReview(accountId, isCompany, payload = {}) {
        const record = await fetchActorRecord(accountId, isCompany);
        if (!record || record.status !== 'clarification_requested') {
            throw new Error('Account is not awaiting updates.');
        }

        const mergedProfile = { ...(record.profile || {}), ...(payload.profilePatch || {}) };
        if (payload.documents != null) {
            mergedProfile.documents = payload.documents;
        }

        const check = validateClarificationDocumentsPayload(mergedProfile.documents || []);
        if (!check.ok) {
            throw new Error(check.error);
        }

        const previousStatus = record.status;
        const now = new Date().toISOString();
        mergedProfile.vetting = {
            ...(mergedProfile.vetting || {}),
            lastResubmittedAt: now
        };

        if (isCompany) await dataService.updateCompany(accountId, { status: 'pending', profile: mergedProfile });
        else await dataService.updateUser(accountId, { status: 'pending', profile: mergedProfile });

        const docSummary = (mergedProfile.documents || [])
            .map(d => d?.type || d?.label || 'doc')
            .slice(0, 20);

        await dataService.createAuditLog({
            userId: accountId,
            action: isCompany ? 'company_vetting_resubmitted' : 'user_vetting_resubmitted',
            entityType: isCompany ? 'company' : 'user',
            entityId: accountId,
            details: {
                previousStatus,
                newStatus: 'pending',
                updatedDocuments: docSummary
            }
        });

        await notifyAdminsVettingResubmitted();
    }

    async function getVettingTimelineEvents(accountId, isCompany) {
        const logs = await dataService.getAuditLogs();
        const entityType = isCompany ? 'company' : 'user';
        const actions = new Set([
            'user_registered',
            'company_registered',
            'user_clarification_requested',
            'company_clarification_requested',
            'user_vetting_resubmitted',
            'company_vetting_resubmitted',
            'user_approved',
            'company_approved',
            'user_rejected',
            'company_rejected'
        ]);
        return logs
            .filter(l => l.entityId === accountId && l.entityType === entityType && actions.has(l.action))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    const api = {
        MAX_CLARIFICATION_FILE_BYTES,
        VETTING_UPDATE_REASON_OPTIONS,
        escapePlain,
        getReasonLabelsByIds,
        formatAdminAccountStatus,
        formatApplicantAccountStatus,
        isResubmittedPending,
        buildUpdatesRequestMessage,
        openRequestUpdatesModal,
        notifyAdminsVettingResubmitted,
        approveAccount,
        rejectAccount,
        requestAccountUpdates,
        validateClarificationDocumentsPayload,
        resubmitAccountForReview,
        getVettingTimelineEvents
    };

    global.VETTING_UPDATE_REASON_OPTIONS = VETTING_UPDATE_REASON_OPTIONS;
    global.vettingActions = api;
})(typeof window !== 'undefined' ? window : globalThis);
