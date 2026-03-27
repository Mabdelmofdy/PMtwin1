/**
 * Admin Opportunities Component
 */

async function initAdminOpportunities() {
    if (!authService.canAccessAdmin() || !authService.hasAdminCapability('admin.opportunities.read')) {
        router.navigate(CONFIG.ROUTES.DASHBOARD);
        return;
    }
    
    await loadOpportunities();
    setupFilters();
    document.getElementById('admin-opp-bulk-apply')?.addEventListener('click', bulkStatusChange);
}

async function loadOpportunities() {
    const container = document.getElementById('opportunities-list');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        let opportunities = await dataService.getOpportunities();
        
        // Apply filters
        const statusFilter = document.getElementById('filter-status')?.value;
        const typeFilter = document.getElementById('filter-type')?.value;
        const modelFilter = document.getElementById('filter-model')?.value;
        const searchFilter = document.getElementById('filter-search')?.value.toLowerCase();
        
        if (statusFilter) {
            opportunities = opportunities.filter(o => o.status === statusFilter);
        }
        if (typeFilter) {
            opportunities = opportunities.filter(o => (o.intent || 'request') === typeFilter);
        }
        if (modelFilter) {
            opportunities = opportunities.filter(o => o.modelType === modelFilter);
        }
        if (searchFilter) {
            opportunities = opportunities.filter(o => 
                o.title?.toLowerCase().includes(searchFilter) ||
                o.description?.toLowerCase().includes(searchFilter)
            );
        }
        
        // Sort by created date (newest first)
        opportunities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (opportunities.length === 0) {
            container.innerHTML = '<div class="empty-state">No opportunities found</div>';
            return;
        }
        
        // Load creator info and application counts
        const oppsWithCreatorsAndCounts = await Promise.all(
            opportunities.map(async (opp) => {
                const [creator, applicationCount] = await Promise.all([
                    dataService.getUserOrCompanyById(opp.creatorId),
                    dataService.getApplicationCountByOpportunityId(opp.id)
                ]);
                return { ...opp, creator, applicationCount };
            })
        );
        
        // Load template
        const template = await templateLoader.load('admin-opportunity-card');
        
        const paymentModeLabels = window.CONFIG?.PAYMENT_MODES ? { cash: 'cash', barter: 'barter', equity: 'equity', profit_sharing: 'profit sharing', hybrid: 'hybrid' } : {};
        const getExchangeLabel = (v) => (v && paymentModeLabels[v]) ? paymentModeLabels[v] : (v || '—');
        const getOpportunityType = (intent) => { const i = intent || 'request'; return i === 'offer' ? 'Offer' : i === 'hybrid' ? 'Hybrid' : 'Need'; };
        const skills = (opp) => (opp.attributes && Array.isArray(opp.attributes.requiredSkills)) ? opp.attributes.requiredSkills : (Array.isArray(opp.requiredSkills) ? opp.requiredSkills : []);
        const milestones = (opp) => (opp.attributes && Array.isArray(opp.attributes.milestones)) ? opp.attributes.milestones : (Array.isArray(opp.milestones) ? opp.milestones : []);
        const paymentModesArr = (opp) => Array.isArray(opp.paymentModes) ? opp.paymentModes : (opp.exchangeMode ? [opp.exchangeMode] : []);

        const canWrite = typeof authService !== 'undefined' && authService.hasAdminCapability && authService.hasAdminCapability('admin.opportunities.write');
        const html = oppsWithCreatorsAndCounts.map(opp => {
            const pmArr = paymentModesArr(opp);
            const skillsArr = skills(opp);
            const msArr = milestones(opp);
            const data = {
                ...opp,
                opportunityType: getOpportunityType(opp.intent),
                intentLabel: opp.intent === 'offer' ? 'OFFER' : (opp.intent === 'hybrid' ? 'HYBRID' : 'NEED'),
                exchangeModeDisplay: getExchangeLabel(opp.exchangeMode || (pmArr[0])),
                paymentModesDisplay: pmArr.length ? pmArr.map(getExchangeLabel).join(', ') : '',
                requiredSkillsDisplay: skillsArr.length ? skillsArr.join(', ') : '',
                milestonesDisplay: msArr.length ? (msArr.length + ' milestone(s)' + (msArr[0] && msArr[0].title ? ': ' + msArr.slice(0, 2).map(m => m.title || m.name).join(', ') + (msArr.length > 2 ? '…' : '') : '')) : '',
                title: opp.title || 'Untitled',
                modelType: opp.modelType || opp.collaborationModel || 'N/A',
                status: opp.status || 'draft',
                statusBadgeClass: getStatusBadgeClass(opp.status),
                description: opp.description || 'No description',
                createdDate: new Date(opp.createdAt).toLocaleDateString(),
                creator: {
                    email: opp.creator?.email || 'Unknown'
                },
                applicationCount: opp.applicationCount,
                showClose: canWrite && (opp.status === 'published' || opp.status === 'in_negotiation'),
                showDelete: canWrite
            };
            return templateRenderer.render(template, data);
        }).join('');
        
        container.innerHTML = html;
        
        // Attach event handlers
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const oppId = btn.dataset.opportunityId;
                handleOpportunityAction(action, oppId);
            });
        });

        const bulkEl = document.getElementById('admin-opp-bulk-actions');
        if (bulkEl) bulkEl.style.display = canWrite ? 'block' : 'none';
        
    } catch (error) {
        console.error('Error loading opportunities:', error);
        container.innerHTML = '<div class="empty-state">Error loading opportunities</div>';
    }
}


function getStatusBadgeClass(status) {
    const statusMap = {
        'draft': 'secondary',
        'published': 'success',
        'in_negotiation': 'warning',
        'contracted': 'primary',
        'in_execution': 'primary',
        'completed': 'success',
        'closed': 'danger',
        'cancelled': 'danger'
    };
    return statusMap[status] || 'secondary';
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const searchInput = document.getElementById('filter-search');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            loadOpportunities();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadOpportunities();
            }
        });
    }
}

async function handleOpportunityAction(action, opportunityId) {
    switch (action) {
        case 'close':
            await closeOpportunity(opportunityId);
            break;
        case 'delete':
            await deleteOpportunity(opportunityId);
            break;
    }
}

async function closeOpportunity(opportunityId) {
    authService.assertAdminCapability('admin.opportunities.write');
    if (!confirm('Close this opportunity?')) return;
    
    try {
        await dataService.updateOpportunity(opportunityId, { status: 'closed' });
        
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: 'opportunity_closed',
            entityType: 'opportunity',
            entityId: opportunityId,
            details: {}
        });
        
        alert('Opportunity closed');
        await loadOpportunities();
        
    } catch (error) {
        console.error('Error closing opportunity:', error);
        alert('Failed to close opportunity');
    }
}

async function deleteOpportunity(opportunityId) {
    authService.assertAdminCapability('admin.opportunities.write');
    if (!confirm('Delete this opportunity? This action cannot be undone.')) return;
    
    try {
        await dataService.deleteOpportunity(opportunityId);
        
        const admin = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: admin.id,
            action: 'opportunity_deleted',
            entityType: 'opportunity',
            entityId: opportunityId,
            details: {}
        });
        
        alert('Opportunity deleted');
        await loadOpportunities();
        
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        alert('Failed to delete opportunity');
    }
}

function getSelectedOpportunityIds() {
    const checkboxes = document.querySelectorAll('.admin-opp-select:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.opportunityId).filter(Boolean);
}

async function bulkStatusChange() {
    authService.assertAdminCapability('admin.opportunities.write');
    const ids = getSelectedOpportunityIds();
    const status = document.getElementById('admin-opp-bulk-status')?.value;
    if (!ids.length) {
        alert('Select one or more opportunities first.');
        return;
    }
    if (!status || (status !== 'closed' && status !== 'cancelled')) {
        alert('Please select a status (Closed or Cancelled).');
        return;
    }
    if (!confirm(`Set ${ids.length} opportunity(ies) to "${status}"?`)) return;
    const admin = authService.getCurrentUser();
    try {
        for (const id of ids) {
            await dataService.updateOpportunity(id, { status });
            await dataService.createAuditLog({
                userId: admin.id,
                action: status === 'closed' ? 'opportunity_closed' : 'opportunity_cancelled',
                entityType: 'opportunity',
                entityId: id,
                details: { bulk: true }
            });
        }
        alert(`Updated ${ids.length} opportunity(ies).`);
        await loadOpportunities();
    } catch (e) {
        console.error('Bulk status change failed:', e);
        alert('Failed to update some opportunities.');
    }
}
