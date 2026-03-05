/**
 * Pipeline Management Component
 */

const OPP_COLUMN_TO_STATUS = {
    'kanban-draft': 'draft',
    'kanban-published': 'published',
    'kanban-in-progress': 'in_negotiation',
    'kanban-closed': 'closed'
};
const APP_COLUMN_TO_STATUS = {
    'kanban-app-pending': 'pending',
    'kanban-app-reviewing': 'reviewing',
    'kanban-app-shortlisted': 'shortlisted',
    'kanban-app-in-negotiation': 'in_negotiation',
    'kanban-app-accepted': 'accepted',
    'kanban-app-rejected': 'rejected'
};

async function initPipeline(params = {}) {
    setupTabs();
    setupOpportunitiesIntentFilter();
    setupApplicationsIntentFilter();
    setupDropZones();
    const tab = params.tab;
    if (tab === 'matches' || tab === 'applications' || tab === 'opportunities') {
        const tabBtn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
        if (tabBtn) tabBtn.click();
    } else {
        await loadPipelineData();
    }
}

function setupDropZones() {
    const oppColumnIds = Object.keys(OPP_COLUMN_TO_STATUS);
    const appColumnIds = Object.keys(APP_COLUMN_TO_STATUS);
    oppColumnIds.forEach(containerId => {
        const el = document.getElementById(containerId);
        if (el) addDropZone(el, 'opportunity', containerId);
    });
    appColumnIds.forEach(containerId => {
        const el = document.getElementById(containerId);
        if (el) addDropZone(el, 'application', containerId);
    });
}

function addDropZone(element, type, containerId) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        element.closest('.kanban-column')?.classList.add('kanban-column-drag-over');
    });
    element.addEventListener('dragleave', (e) => {
        if (!element.contains(e.relatedTarget)) element.closest('.kanban-column')?.classList.remove('kanban-column-drag-over');
    });
    element.addEventListener('drop', async (e) => {
        e.preventDefault();
        element.closest('.kanban-column')?.classList.remove('kanban-column-drag-over');
        if (authService.isPendingApproval && authService.isPendingApproval()) return;
        try {
            const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            const payload = JSON.parse(raw);
            if (payload.type !== type) return;
            const status = type === 'opportunity' ? OPP_COLUMN_TO_STATUS[containerId] : APP_COLUMN_TO_STATUS[containerId];
            if (!status) return;
            if (type === 'opportunity') {
                await dataService.updateOpportunity(payload.id, { status });
                await loadOpportunitiesPipeline();
            } else {
                await dataService.updateApplication(payload.id, { status });
                await loadApplicationsPipeline();
            }
        } catch (err) {
            console.error('Pipeline drop error:', err);
        }
    });
}

function setupOpportunitiesIntentFilter() {
    const filterEl = document.getElementById('filter-opportunities-intent');
    if (filterEl) {
        filterEl.addEventListener('change', () => loadOpportunitiesPipeline());
    }
}

function setupApplicationsIntentFilter() {
    const filterEl = document.getElementById('filter-applications-intent');
    if (filterEl) {
        filterEl.addEventListener('change', () => loadApplicationsPipeline());
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            const targetTab = document.getElementById(`tab-${tabName}`);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }
            
            // Reload data for active tab
            if (tabName === 'opportunities') {
                loadOpportunitiesPipeline();
            } else if (tabName === 'applications') {
                loadApplicationsPipeline();
            } else if (tabName === 'matches') {
                loadMatchesPipeline();
            }
        });
    });
}

async function loadPipelineData() {
    await loadOpportunitiesPipeline();
}

async function loadOpportunitiesPipeline() {
    const user = authService.getCurrentUser();
    if (!user) return;
    
    try {
        const allOpportunities = await dataService.getOpportunities();
        let userOpportunities = allOpportunities.filter(o => o.creatorId === user.id);
        
        // Apply intent filter (show only OFFER or only NEED)
        const intentFilter = document.getElementById('filter-opportunities-intent')?.value;
        if (intentFilter === 'request' || intentFilter === 'offer') {
            userOpportunities = userOpportunities.filter(o => (o.intent || 'request') === intentFilter);
        }
        
        const draft = userOpportunities.filter(o => o.status === 'draft');
        const published = userOpportunities.filter(o => o.status === 'published');
        const inProgress = userOpportunities.filter(o =>
            o.status === 'in_negotiation' || o.status === 'contracted' || o.status === 'in_execution'
        );
        const closed = userOpportunities.filter(o =>
            o.status === 'closed' || o.status === 'cancelled' || o.status === 'completed'
        );
        
        await renderKanbanColumn('kanban-draft', draft);
        await renderKanbanColumn('kanban-published', published);
        await renderKanbanColumn('kanban-in-progress', inProgress);
        await renderKanbanColumn('kanban-closed', closed);
        
    } catch (error) {
        console.error('Error loading opportunities pipeline:', error);
    }
}

async function loadApplicationsPipeline() {
    const user = authService.getCurrentUser();
    if (!user) return;
    
    try {
        const allApplications = await dataService.getApplications();
        const userApplications = allApplications.filter(a => a.applicantId === user.id);
        
        // Load opportunity details
        let appsWithOpps = await Promise.all(
            userApplications.map(async (app) => {
                const opportunity = await dataService.getOpportunityById(app.opportunityId);
                return { ...app, opportunity };
            })
        );
        
        // Apply intent filter (proposals for offers vs requests)
        const intentFilter = document.getElementById('filter-applications-intent')?.value;
        if (intentFilter === 'request' || intentFilter === 'offer') {
            appsWithOpps = appsWithOpps.filter(a => (a.opportunity?.intent || 'request') === intentFilter);
        }
        
        await renderApplicationColumn('kanban-app-pending', appsWithOpps.filter(a => a.status === 'pending'));
        await renderApplicationColumn('kanban-app-reviewing', appsWithOpps.filter(a => a.status === 'reviewing'));
        await renderApplicationColumn('kanban-app-shortlisted', appsWithOpps.filter(a => a.status === 'shortlisted'));
        await renderApplicationColumn('kanban-app-in-negotiation', appsWithOpps.filter(a => a.status === 'in_negotiation'));
        await renderApplicationColumn('kanban-app-accepted', appsWithOpps.filter(a => a.status === 'accepted'));
        await renderApplicationColumn('kanban-app-rejected', appsWithOpps.filter(a => a.status === 'rejected' || a.status === 'withdrawn'));
        
    } catch (error) {
        console.error('Error loading applications pipeline:', error);
    }
}

async function loadMatchesPipeline() {
    const user = authService.getCurrentUser();
    if (!user) return;
    
    const container = document.getElementById('matches-list');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Use stored matches (same source as dashboard count) so the list matches the dashboard
        const allMatches = await dataService.getMatches();
        const userMatches = allMatches.filter(m => (m.candidateId || m.userId) === user.id);
        
        if (userMatches.length === 0) {
            container.innerHTML = '<div class="empty-state">No matches found. Keep your profile updated to receive matches! <a href="#" data-route="' + CONFIG.ROUTES.PROFILE + '" class="text-primary font-medium">Update your profile</a></div>';
            return;
        }
        
        // Load opportunity for each match
        const matchesWithOpps = await Promise.all(
            userMatches.map(async (m) => {
                const opportunity = await dataService.getOpportunityById(m.opportunityId);
                return {
                    opportunity: opportunity || { id: m.opportunityId, title: 'Unknown', description: 'No description', modelType: '—', status: '—' },
                    matchScore: m.matchScore != null ? m.matchScore : 0,
                    criteria: m.criteria || m.matchReasons
                };
            })
        );
        
        // Sort by match score descending
        matchesWithOpps.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        
        const template = await templateLoader.load('match-card');
        const html = matchesWithOpps.map(match => {
            const data = {
                ...match,
                opportunity: {
                    ...match.opportunity,
                    description: match.opportunity.description || 'No description'
                },
                matchScorePercent: Math.round((match.matchScore || 0) * 100)
            };
            return templateRenderer.render(template, data);
        }).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading matches:', error);
        container.innerHTML = '<div class="empty-state">Error loading matches. Please try again.</div>';
    }
}

function updateColumnHeaderCount(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const column = container.closest('.kanban-column');
    if (!column) return;
    const title = column.dataset.columnTitle || containerId.replace('kanban-', '').replace(/-/g, ' ');
    const countEl = column.querySelector('.column-count');
    if (countEl) countEl.textContent = `(${count})`;
}

async function renderKanbanColumn(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    updateColumnHeaderCount(containerId, items.length);

    if (items.length === 0) {
        const createLink = containerId === 'kanban-draft'
            ? `<p class="text-muted" style="text-align: center; padding: var(--spacing-md);">No items</p><p style="text-align: center;"><a href="#" data-route="${CONFIG.ROUTES.OPPORTUNITY_CREATE}" class="btn btn-primary btn-sm">Create opportunity</a></p>`
            : '<p class="text-muted" style="text-align: center; padding: var(--spacing-lg);">No items</p>';
        container.innerHTML = createLink;
        return;
    }
    
    // Load template
    const template = await templateLoader.load('kanban-item');
    
    // Render items
    const html = items.map(item => {
        const intent = item.intent || 'request';
        const intentLabel = intent === 'offer' ? 'OFFER' : 'NEED';
        const intentBadgeClass = typeof getIntentBadgeClass === 'function'
            ? getIntentBadgeClass(intent, item.modelType)
            : (intent === 'offer' ? 'badge-info' : 'badge-primary');
        const showPublish = item.status === 'draft';
        const showClose = ['published', 'in_negotiation', 'contracted', 'in_execution'].includes(item.status);
        const data = {
            ...item,
            title: item.title || 'Untitled',
            modelType: item.modelType || 'N/A',
            createdDate: new Date(item.createdAt).toLocaleDateString(),
            intentLabel,
            intentBadgeClass,
            showPublish,
            showClose
        };
        return templateRenderer.render(template, data);
    }).join('');
    
    container.innerHTML = html;
    
    const isPendingDrag = authService.isPendingApproval && authService.isPendingApproval();
    container.querySelectorAll('.kanban-item').forEach(item => {
        item.setAttribute('draggable', isPendingDrag ? 'false' : 'true');
        if (!isPendingDrag) {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ id: item.dataset.id, type: 'opportunity' }));
                e.dataTransfer.effectAllowed = 'move';
            });
        }
        item.addEventListener('click', (e) => {
            if (e.target.closest('.kanban-item-action')) return;
            const id = item.dataset.id;
            router.navigate(`/opportunities/${id}`);
        });
    });
    const isPending = authService.isPendingApproval && authService.isPendingApproval();
    const actionTooltip = 'Action disabled until your account is approved.';
    container.querySelectorAll('.kanban-btn-publish').forEach(btn => {
        if (isPending) {
            btn.disabled = true;
            btn.setAttribute('title', actionTooltip);
            btn.classList.add('opacity-75', 'cursor-not-allowed');
        }
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isPending) return;
            const id = btn.dataset.id;
            const oppService = window.opportunityService || (typeof opportunityService !== 'undefined' ? opportunityService : null);
            if (oppService && typeof oppService.updateOpportunityStatus === 'function') {
                await oppService.updateOpportunityStatus(id, 'published');
            } else {
                await dataService.updateOpportunity(id, { status: 'published' });
            }
            await loadOpportunitiesPipeline();
        });
    });
    container.querySelectorAll('.kanban-btn-close').forEach(btn => {
        if (isPending) {
            btn.disabled = true;
            btn.setAttribute('title', actionTooltip);
            btn.classList.add('opacity-75', 'cursor-not-allowed');
        }
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isPending) return;
            const id = btn.dataset.id;
            await dataService.updateOpportunity(id, { status: 'closed' });
            await loadOpportunitiesPipeline();
        });
    });
}

async function renderApplicationColumn(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    updateColumnHeaderCount(containerId, items.length);

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center; padding: var(--spacing-lg);">No items</p>';
        return;
    }
    
    // Load template
    const template = await templateLoader.load('application-kanban-item');
    
    // Render items
    const html = items.map(item => {
        const intent = item.opportunity?.intent || 'request';
        const intentLabel = intent === 'offer' ? 'OFFER' : 'NEED';
        const intentBadgeClass = typeof getIntentBadgeClass === 'function'
            ? getIntentBadgeClass(intent, item.opportunity?.modelType)
            : (intent === 'offer' ? 'badge-info' : 'badge-primary');
        const showWithdraw = ['pending', 'reviewing', 'shortlisted'].includes(item.status);
        const data = {
            ...item,
            opportunity: {
                title: item.opportunity?.title || 'Unknown Opportunity'
            },
            createdDate: new Date(item.createdAt).toLocaleDateString(),
            intentLabel,
            intentBadgeClass,
            showWithdraw
        };
        return templateRenderer.render(template, data);
    }).join('');
    
    container.innerHTML = html;
    
    const isPendingApp = authService.isPendingApproval && authService.isPendingApproval();
    container.querySelectorAll('.kanban-item').forEach(item => {
        item.setAttribute('draggable', isPendingApp ? 'false' : 'true');
        if (!isPendingApp) {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ id: item.dataset.id, type: 'application' }));
                e.dataTransfer.effectAllowed = 'move';
            });
        }
        item.addEventListener('click', (e) => {
            if (e.target.closest('.kanban-item-action')) return;
            const id = item.dataset.id;
            const application = items.find(a => a.id === id);
            if (application && application.opportunity) {
                router.navigate(`/opportunities/${application.opportunity.id}`);
            }
        });
    });
    container.querySelectorAll('.kanban-btn-withdraw').forEach(btn => {
        if (isPendingApp) {
            btn.disabled = true;
            btn.setAttribute('title', 'Action disabled until your account is approved.');
            btn.classList.add('opacity-75', 'cursor-not-allowed');
        }
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isPendingApp) return;
            const id = btn.dataset.id;
            await dataService.updateApplication(id, { status: 'withdrawn' });
            await loadApplicationsPipeline();
        });
    });
}
