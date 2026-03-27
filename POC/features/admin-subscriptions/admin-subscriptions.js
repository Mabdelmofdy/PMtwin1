/**
 * Admin Subscriptions – manage subscription plans and assignments
 */

async function initAdminSubscriptions() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.subscriptions.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    const canWrite = authService.hasAdminCapability('admin.subscriptions.write');
    await loadPlans(canWrite);
    await loadAssignments(canWrite);
    setupPlanModal();
    setupAssignModal();
    const addPlanBtn = document.getElementById('btn-add-plan');
    const assignBtn = document.getElementById('btn-assign');
    if (addPlanBtn) { addPlanBtn.style.display = canWrite ? '' : 'none'; addPlanBtn.addEventListener('click', () => openPlanModal()); }
    if (assignBtn) { assignBtn.style.display = canWrite ? '' : 'none'; assignBtn.addEventListener('click', () => openAssignModal()); }
}

async function loadPlans(canWrite = true) {
    const container = document.getElementById('plans-list');
    if (!container) return;
    try {
        const plans = await dataService.getSubscriptionPlans();
        if (plans.length === 0) {
            container.innerHTML = '<p class="text-muted">No plans yet. Add a plan to get started.</p>';
            return;
        }
        container.innerHTML = plans.map(p => `
            <div class="plan-item" data-plan-id="${p.id}">
                <div class="plan-info">
                    <strong>${escapeHtml(p.name)}</strong>
                    <span class="badge badge-secondary">${escapeHtml(p.tier || '-')}</span>
                    <span class="text-muted">Max opportunities: ${p.maxOpportunities ?? '-'}</span>
                    ${p.isActive === false ? '<span class="badge badge-danger">Inactive</span>' : ''}
                </div>
                <div class="plan-actions">
                    ${canWrite ? `<button type="button" class="btn btn-secondary btn-sm" data-edit-plan="${p.id}">Edit</button>` : ''}
                </div>
            </div>
        `).join('');
        container.querySelectorAll('[data-edit-plan]').forEach(btn => {
            btn.addEventListener('click', () => openPlanModal(btn.dataset.editPlan));
        });
    } catch (e) {
        console.error('Error loading plans:', e);
        container.innerHTML = '<p class="text-danger">Error loading plans</p>';
    }
}

async function loadAssignments(canWrite = true) {
    const container = document.getElementById('assignments-list');
    if (!container) return;
    try {
        const subs = await dataService.getSubscriptions();
        const plans = await dataService.getSubscriptionPlans();
        const planMap = {};
        plans.forEach(p => { planMap[p.id] = p; });
        if (subs.length === 0) {
            container.innerHTML = '<p class="text-muted">No assignments yet.</p>';
            return;
        }
        const withPerson = await Promise.all(subs.map(async (s) => {
            const entityId = s.userId || s.companyId;
            const person = await dataService.getUserOrCompanyById(entityId);
            const plan = planMap[s.planId];
            return {
                ...s,
                personName: person?.profile?.name || person?.email || entityId,
                planName: plan?.name || s.planId
            };
        }));
        container.innerHTML = withPerson.map(s => `
            <div class="assign-item">
                <div class="assign-info">
                    <strong>${escapeHtml(s.personName)}</strong> → ${escapeHtml(s.planName)}
                    <span class="badge badge-${s.status === 'active' ? 'success' : 'secondary'}">${s.status}</span>
                    <span class="text-muted">${s.startsAt ? new Date(s.startsAt).toLocaleDateString() : ''}</span>
                </div>
                <div class="assign-item-actions">
                    ${canWrite ? `<button type="button" class="btn btn-danger btn-sm" data-remove-sub="${s.id}">Remove</button>` : ''}
                </div>
            </div>
        `).join('');
        container.querySelectorAll('[data-remove-sub]').forEach(btn => {
            btn.addEventListener('click', async () => {
                try { authService.assertAdminCapability('admin.subscriptions.write'); } catch (err) { alert(err && err.message ? err.message : 'You do not have permission.'); return; }
                if (!confirm('Remove this assignment?')) return;
                await dataService.removeSubscription(btn.dataset.removeSub);
                await loadAssignments();
            });
        });
    } catch (e) {
        console.error('Error loading assignments:', e);
        container.innerHTML = '<p class="text-danger">Error loading assignments</p>';
    }
}

function setupPlanModal() {
    const modal = document.getElementById('plan-modal');
    const form = document.getElementById('plan-form');
    const closeBtn = document.getElementById('plan-modal-close');
    const cancelBtn = document.getElementById('plan-modal-cancel');
    [closeBtn, cancelBtn].forEach(el => {
        el?.addEventListener('click', () => { modal?.classList.add('hidden'); });
    });
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            authService.assertAdminCapability('admin.subscriptions.write');
        } catch (err) {
            alert(err && err.message ? err.message : 'You do not have permission to manage plans.');
            return;
        }
        const id = document.getElementById('plan-id').value;
        const name = document.getElementById('plan-name').value.trim();
        const tier = document.getElementById('plan-tier').value.trim() || 'basic';
        const maxOpportunities = parseInt(document.getElementById('plan-max-opportunities').value, 10) || 10;
        const isActive = document.getElementById('plan-is-active').checked;
        try {
            if (id) {
                await dataService.updatePlan(id, { name, tier, maxOpportunities, isActive });
            } else {
                await dataService.createPlan({ name, tier, maxOpportunities, isActive });
            }
            modal.classList.add('hidden');
            await loadPlans();
            await loadAssignments();
        } catch (err) {
            console.error(err);
            alert('Failed to save plan');
        }
    });
}

function openPlanModal(planId) {
    const modal = document.getElementById('plan-modal');
    const title = document.getElementById('plan-modal-title');
    document.getElementById('plan-id').value = planId || '';
    document.getElementById('plan-name').value = '';
    document.getElementById('plan-tier').value = '';
    document.getElementById('plan-max-opportunities').value = '10';
    document.getElementById('plan-is-active').checked = true;
    if (planId) {
        title.textContent = 'Edit plan';
        dataService.getPlanById(planId).then(p => {
            if (p) {
                document.getElementById('plan-id').value = p.id;
                document.getElementById('plan-name').value = p.name || '';
                document.getElementById('plan-tier').value = p.tier || '';
                document.getElementById('plan-max-opportunities').value = p.maxOpportunities ?? 10;
                document.getElementById('plan-is-active').checked = p.isActive !== false;
            }
        });
    } else {
        title.textContent = 'Add plan';
    }
    modal?.classList.remove('hidden');
}

function setupAssignModal() {
    const modal = document.getElementById('assign-modal');
    const form = document.getElementById('assign-form');
    const closeBtn = document.getElementById('assign-modal-close');
    const cancelBtn = document.getElementById('assign-modal-cancel');
    [closeBtn, cancelBtn].forEach(el => {
        el?.addEventListener('click', () => { modal?.classList.add('hidden'); });
    });
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            authService.assertAdminCapability('admin.subscriptions.write');
        } catch (err) {
            alert(err && err.message ? err.message : 'You do not have permission to assign subscriptions.');
            return;
        }
        const entityId = document.getElementById('assign-entity').value;
        const planId = document.getElementById('assign-plan').value;
        const status = document.getElementById('assign-status').value;
        const option = document.getElementById('assign-entity').selectedOptions[0];
        const isCompany = option?.dataset?.type === 'company';
        try {
            await dataService.assignSubscription(entityId, planId, isCompany, { status });
            modal.classList.add('hidden');
            await loadAssignments();
        } catch (err) {
            console.error(err);
            alert('Failed to assign plan');
        }
    });
}

async function openAssignModal() {
    const modal = document.getElementById('assign-modal');
    const entitySelect = document.getElementById('assign-entity');
    const planSelect = document.getElementById('assign-plan');
    const users = await dataService.getUsers();
    const companies = await dataService.getCompanies();
    entitySelect.innerHTML = '<option value="">Select...</option>' +
        users.filter(u => u.profile?.type !== 'company').map(u =>
            `<option value="${u.id}" data-type="user">${escapeHtml(u.profile?.name || u.email)} (User)</option>`
        ).join('') +
        companies.map(c =>
            `<option value="${c.id}" data-type="company">${escapeHtml(c.profile?.name || c.email)} (Company)</option>`
        ).join('');
    const plans = await dataService.getSubscriptionPlans();
    planSelect.innerHTML = '<option value="">Select...</option>' +
        plans.filter(p => p.isActive !== false).map(p =>
            `<option value="${p.id}">${escapeHtml(p.name)}</option>`
        ).join('');
    modal?.classList.remove('hidden');
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
