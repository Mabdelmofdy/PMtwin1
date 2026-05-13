/**
 * Pipeline Management Component
 */

/** Maps sidebar stage key → API `opportunity.status` when dropping a card on that stage. */
const OPP_STAGE_KEY_TO_STATUS = {
    draft: 'draft',
    published: 'published',
    in_progress: 'in_negotiation',
    closed: 'closed'
};

const OPPORTUNITY_STAGE_NAV = [
    { key: 'draft', label: 'Draft', hint: 'Work in progress—not visible to the network until you publish.' },
    { key: 'published', label: 'Published', hint: 'Visible to others; candidates can discover and apply.' },
    { key: 'in_progress', label: 'In progress', hint: 'Active collaboration: negotiation, contract, or execution.' },
    { key: 'closed', label: 'Closed', hint: 'Completed, cancelled, or otherwise finished.' }
];
const OPPORTUNITY_STAGE_KEYS = OPPORTUNITY_STAGE_NAV.map(s => s.key);

let pipelineOpportunityBuckets = null;
let pipelineSelectedOppStage = 'draft';

const APP_STAGE_KEY_TO_STATUS = {
    pending: 'pending',
    reviewing: 'reviewing',
    shortlisted: 'shortlisted',
    in_negotiation: 'in_negotiation',
    accepted: 'accepted',
    rejected: 'rejected'
};

const APPLICATION_STAGE_NAV = [
    { key: 'pending', label: 'Pending', hint: 'Submitted; awaiting the owner\'s first action.' },
    { key: 'reviewing', label: 'Reviewing', hint: 'The owner is evaluating your fit.' },
    { key: 'shortlisted', label: 'Shortlisted', hint: 'Shortlisted for next steps.' },
    { key: 'in_negotiation', label: 'In negotiation', hint: 'Terms or scope under discussion.' },
    { key: 'accepted', label: 'Accepted', hint: 'The owner accepted your application.' },
    { key: 'rejected', label: 'Rejected / withdrawn', hint: 'Rejected by the owner or withdrawn by you.' }
];
const APPLICATION_STAGE_KEYS = APPLICATION_STAGE_NAV.map(s => s.key);

let pipelineApplicationBuckets = null;
let pipelineSelectedAppStage = 'pending';

const APP_PIPELINE_STATUS_LABELS = {
    pending: 'Pending',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    in_negotiation: 'In negotiation',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn'
};

function humanizeModelType(mt) {
    if (!mt) return '';
    return String(mt)
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

function readIntentFilterFromPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return '';
    const v = panel.dataset.intentFilter;
    return v === 'request' || v === 'offer' ? v : '';
}

function setPipelineStat(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = String(value);
}

function updatePipelineOpportunityStats(draft, published, inProgress, closed) {
    const nDraft = draft.length;
    const nPub = published.length;
    const nProg = inProgress.length;
    const nClosed = closed.length;
    const total = nDraft + nPub + nProg + nClosed;
    setPipelineStat('pipeline-stat-opp-total', total);
    setPipelineStat('pipeline-stat-opp-active', nPub + nProg);
    setPipelineStat('pipeline-stat-opp-closed', nClosed);
}

function updatePipelineApplicationStats(appsWithOpps) {
    const total = appsWithOpps.length;
    const open = appsWithOpps.filter(a =>
        ['pending', 'reviewing', 'shortlisted', 'in_negotiation'].includes(a.status)
    ).length;
    const terminal = appsWithOpps.filter(a =>
        a.status === 'accepted' || a.status === 'rejected' || a.status === 'withdrawn'
    ).length;
    setPipelineStat('pipeline-stat-app-total', total);
    setPipelineStat('pipeline-stat-app-open', open);
    setPipelineStat('pipeline-stat-app-terminal', terminal);
}

function initApplicationStageFromStorage() {
    try {
        const v = sessionStorage.getItem('pipeline-app-stage');
        if (v && APPLICATION_STAGE_KEYS.includes(v)) pipelineSelectedAppStage = v;
    } catch (e) { /* ignore */ }
}

function setStoredApplicationStage(key) {
    pipelineSelectedAppStage = key;
    try {
        sessionStorage.setItem('pipeline-app-stage', key);
    } catch (e) { /* ignore */ }
}

function syncApplicationSidebarCounts(buckets) {
    APPLICATION_STAGE_KEYS.forEach(k => {
        const el = document.getElementById(`sidebar-app-count-${k}`);
        if (el) el.textContent = String((buckets[k] || []).length);
    });
}

function selectApplicationStage(key) {
    if (!APPLICATION_STAGE_KEYS.includes(key)) return;
    setStoredApplicationStage(key);
    const panel = document.getElementById('tab-applications');
    if (panel) {
        panel.querySelectorAll('.pipeline-status-nav__btn[data-app-stage]').forEach(btn => {
            const active = btn.getAttribute('data-app-stage') === key;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }
    const meta = APPLICATION_STAGE_NAV.find(s => s.key === key);
    const titleEl = document.getElementById('pipeline-app-stage-title');
    const hintEl = document.getElementById('pipeline-app-stage-hint');
    if (titleEl && meta) titleEl.textContent = meta.label;
    if (hintEl && meta) hintEl.textContent = meta.hint;
    void paintApplicationCardsForStage(key);
}

async function paintApplicationCardsForStage(key) {
    const container = document.getElementById('kanban-app-active');
    if (!container) return;
    const items = (pipelineApplicationBuckets && pipelineApplicationBuckets[key]) || [];
    await renderApplicationCardsInto(container, items);
}

function setupApplicationStageNav() {
    const panel = document.getElementById('tab-applications');
    if (!panel || panel.dataset.appStageNavBound === '1') return;
    panel.dataset.appStageNavBound = '1';
    panel.querySelectorAll('.pipeline-status-nav__btn[data-app-stage]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-app-stage');
            if (key) selectApplicationStage(key);
        });
    });
}

function setupApplicationSidebarDropZones() {
    const panel = document.getElementById('tab-applications');
    if (!panel || panel.dataset.sidebarDropBound === '1') return;
    panel.dataset.sidebarDropBound = '1';
    panel.querySelectorAll('.pipeline-status-nav__btn[data-app-stage]').forEach(btn => {
        const key = btn.getAttribute('data-app-stage');
        const status = APP_STAGE_KEY_TO_STATUS[key];
        if (!status) return;
        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            btn.classList.add('pipeline-status-nav__btn--drop');
        });
        btn.addEventListener('dragleave', (e) => {
            if (!btn.contains(e.relatedTarget)) btn.classList.remove('pipeline-status-nav__btn--drop');
        });
        btn.addEventListener('drop', async (e) => {
            e.preventDefault();
            btn.classList.remove('pipeline-status-nav__btn--drop');
            if (authService.isPendingApproval && authService.isPendingApproval()) return;
            try {
                const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                const payload = JSON.parse(raw);
                if (payload.type !== 'application') return;
                await dataService.updateApplication(payload.id, { status });
                await loadApplicationsPipeline();
                selectApplicationStage(key);
            } catch (err) {
                console.error('Application sidebar drop error:', err);
            }
        });
    });
}

async function renderApplicationCardsInto(container, items) {
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="pipeline-app-empty"><div class="pipeline-app-empty__icon" aria-hidden="true"><i class="ph-duotone ph-paper-plane-tilt"></i></div><p class="pipeline-app-empty__text">No applications in this stage.</p></div>';
        return;
    }

    const template = await templateLoader.load('application-kanban-item');

    const html = items.map(item => {
        const intent = item.opportunity?.intent || 'request';
        const intentLabel = intent === 'offer' ? 'OFFER' : 'NEED';
        const intentBadgeClass = typeof getIntentBadgeClass === 'function'
            ? getIntentBadgeClass(intent, item.opportunity?.modelType)
            : (intent === 'offer' ? 'badge-info' : 'badge-primary');
        const showWithdraw = ['pending', 'reviewing', 'shortlisted'].includes(item.status);
        const opp = item.opportunity || {};
        const titleFull = opp.title || 'Unknown Opportunity';
        const loc = (opp.location || opp.locationCity || opp.locationRegion || '').trim();
        const mtLabel = humanizeModelType(opp.modelType);
        const data = {
            ...item,
            opportunity: {
                title: titleFull
            },
            titleFull,
            statusLabel: APP_PIPELINE_STATUS_LABELS[item.status] || item.status || '',
            opportunityLocation: loc,
            opportunityModelLabel: mtLabel,
            showLocation: Boolean(loc),
            showModel: Boolean(mtLabel),
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

function initOpportunityStageFromStorage() {
    try {
        const v = sessionStorage.getItem('pipeline-opp-stage');
        if (v && OPPORTUNITY_STAGE_KEYS.includes(v)) pipelineSelectedOppStage = v;
    } catch (e) { /* ignore */ }
}

function setStoredOpportunityStage(key) {
    pipelineSelectedOppStage = key;
    try {
        sessionStorage.setItem('pipeline-opp-stage', key);
    } catch (e) { /* ignore */ }
}

function syncOpportunitySidebarCounts(buckets) {
    OPPORTUNITY_STAGE_KEYS.forEach(k => {
        const el = document.getElementById(`sidebar-opp-count-${k}`);
        if (el) el.textContent = String((buckets[k] || []).length);
    });
}

function selectOpportunityStage(key) {
    if (!OPPORTUNITY_STAGE_KEYS.includes(key)) return;
    setStoredOpportunityStage(key);
    const panel = document.getElementById('tab-opportunities');
    if (panel) {
        panel.querySelectorAll('.pipeline-status-nav__btn[data-opp-stage]').forEach(btn => {
            const active = btn.getAttribute('data-opp-stage') === key;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }
    const meta = OPPORTUNITY_STAGE_NAV.find(s => s.key === key);
    const titleEl = document.getElementById('pipeline-opp-stage-title');
    const hintEl = document.getElementById('pipeline-opp-stage-hint');
    if (titleEl && meta) titleEl.textContent = meta.label;
    if (hintEl && meta) hintEl.textContent = meta.hint;
    void paintOpportunityCardsForStage(key);
}

async function paintOpportunityCardsForStage(key) {
    const container = document.getElementById('kanban-opp-active');
    if (!container) return;
    const items = (pipelineOpportunityBuckets && pipelineOpportunityBuckets[key]) || [];
    await renderOpportunityCardsInto(container, items, key);
}

function setupOpportunityStageNav() {
    const panel = document.getElementById('tab-opportunities');
    if (!panel || panel.dataset.oppStageNavBound === '1') return;
    panel.dataset.oppStageNavBound = '1';
    panel.querySelectorAll('.pipeline-status-nav__btn[data-opp-stage]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-opp-stage');
            if (key) selectOpportunityStage(key);
        });
    });
}

function setupOpportunitySidebarDropZones() {
    const panel = document.getElementById('tab-opportunities');
    if (!panel || panel.dataset.oppSidebarDropBound === '1') return;
    panel.dataset.oppSidebarDropBound = '1';
    panel.querySelectorAll('.pipeline-status-nav__btn[data-opp-stage]').forEach(btn => {
        const key = btn.getAttribute('data-opp-stage');
        const status = OPP_STAGE_KEY_TO_STATUS[key];
        if (!status) return;
        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            btn.classList.add('pipeline-status-nav__btn--drop');
        });
        btn.addEventListener('dragleave', (e) => {
            if (!btn.contains(e.relatedTarget)) btn.classList.remove('pipeline-status-nav__btn--drop');
        });
        btn.addEventListener('drop', async (e) => {
            e.preventDefault();
            btn.classList.remove('pipeline-status-nav__btn--drop');
            if (authService.isPendingApproval && authService.isPendingApproval()) return;
            try {
                const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                const payload = JSON.parse(raw);
                if (payload.type !== 'opportunity') return;
                await dataService.updateOpportunity(payload.id, { status });
                await loadOpportunitiesPipeline();
                selectOpportunityStage(key);
            } catch (err) {
                console.error('Opportunity sidebar drop error:', err);
            }
        });
    });
}

async function renderOpportunityCardsInto(container, items, stageKey) {
    if (!container) return;

    if (items.length === 0) {
        const createRoute = typeof CONFIG !== 'undefined' && CONFIG.ROUTES ? CONFIG.ROUTES.OPPORTUNITY_CREATE : '/opportunities/create';
        if (stageKey === 'draft') {
            container.innerHTML = `<div class="pipeline-app-empty"><div class="pipeline-app-empty__icon" aria-hidden="true"><i class="ph-duotone ph-note-pencil"></i></div><p class="pipeline-app-empty__text">No drafts yet. Start from a draft to keep work private until you publish.</p><a href="#" data-route="${createRoute}" class="btn btn-primary btn-sm">Create opportunity</a></div>`;
        } else {
            container.innerHTML = '<div class="pipeline-app-empty"><div class="pipeline-app-empty__icon" aria-hidden="true"><i class="ph-duotone ph-stack"></i></div><p class="pipeline-app-empty__text">No opportunities in this stage.</p></div>';
        }
        return;
    }

    const template = await templateLoader.load('kanban-item');

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
            modelTypeLabel: humanizeModelType(item.modelType) || 'N/A',
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

function setupIntentSegment(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel || panel.dataset.intentSegmentBound === '1') return;
    panel.dataset.intentSegmentBound = '1';
    if (panel.dataset.intentFilter === undefined) panel.dataset.intentFilter = '';

    panel.querySelectorAll('button[data-intent-segment]').forEach(btn => {
        btn.addEventListener('click', () => {
            const seg = btn.getAttribute('data-intent-segment');
            const val = seg === 'all' ? '' : seg;
            panel.dataset.intentFilter = val;
            panel.querySelectorAll('button[data-intent-segment]').forEach(b => {
                const active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            if (panelId === 'tab-opportunities') void loadOpportunitiesPipeline();
            else if (panelId === 'tab-applications') void loadApplicationsPipeline();
        });
    });
}

function mountPipelinePageHeader(tabName) {
    const mount = document.getElementById('page-context-header-mount');
    if (!mount || !window.pageContextHeader || !window.pageContextHeader.PRESETS) return;
    const presetKey = tabName === 'applications' ? 'pipelineApplications' : 'pipelineOpportunities';
    window.pageContextHeader.mount(mount, window.pageContextHeader.PRESETS[presetKey]);
}

function setupPipelinePageHeaderActions() {
    const root = document.querySelector('.pipeline-page');
    if (!root || root.dataset.pipelineHeaderActionsBound === '1') return;
    root.dataset.pipelineHeaderActionsBound = '1';

    root.addEventListener('click', (e) => {
        const el = e.target instanceof Element ? e.target : e.target.parentElement;
        if (!el || typeof el.closest !== 'function') return;
        if (el.closest('#pipeline-cta-view-drafts')) {
            e.preventDefault();
            document.querySelector('.pipeline-board-tab[data-tab="opportunities"]')?.click();
            requestAnimationFrame(() => {
                document.querySelector('#tab-opportunities [data-opp-stage="draft"]')?.click();
                document.getElementById('pipeline-opp-main-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }
        if (el.closest('#pipeline-cta-review-apps')) {
            e.preventDefault();
            document.querySelector('.pipeline-board-tab[data-tab="applications"]')?.click();
            requestAnimationFrame(() => {
                document.querySelector('#tab-applications [data-app-stage="pending"]')?.click();
                document.getElementById('pipeline-app-main-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }
        if (el.closest('#pipeline-cta-export-apps')) {
            e.preventDefault();
            void exportPipelineApplicationsCsv();
        }
    });
}

async function exportPipelineApplicationsCsv() {
    const user = authService.getCurrentUser();
    if (!user) return;
    try {
        const allApplications = await dataService.getApplications();
        const mine = allApplications.filter((a) => a.applicantId === user.id);
        const header = ['OpportunityId', 'OpportunityTitle', 'Status', 'AppliedAt'];
        const lines = [header.join(',')];
        for (const a of mine) {
            let title = '';
            try {
                const opp = await dataService.getOpportunityById(a.opportunityId);
                title = (opp && opp.title) || '';
            } catch (err) {
                console.warn('Export row opp lookup', err);
            }
            const row = [
                String(a.opportunityId || '').replace(/"/g, '""'),
                '"' + String(title).replace(/"/g, '""') + '"',
                String(a.status || '').replace(/"/g, '""'),
                String(a.appliedAt || a.createdAt || '').replace(/"/g, '""')
            ];
            lines.push(row.join(','));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'applications-export.csv';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export applications failed:', err);
    }
}

async function initPipeline(params = {}) {
    setupPipelinePageHeaderActions();
    setupTabs();
    setupIntentSegment('tab-opportunities');
    setupIntentSegment('tab-applications');
    initApplicationStageFromStorage();
    initOpportunityStageFromStorage();
    setupApplicationStageNav();
    setupApplicationSidebarDropZones();
    setupOpportunityStageNav();
    setupOpportunitySidebarDropZones();
    let tabForHeader = 'opportunities';
    const tab = params.tab;
    if (tab === 'applications' || tab === 'opportunities') {
        const tabBtn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
        if (tabBtn) tabBtn.click();
        tabForHeader = tab;
    } else {
        await loadPipelineData();
        const activeBtn = document.querySelector('.pipeline-board-tab.active.tab-btn');
        if (activeBtn && activeBtn.dataset.tab) tabForHeader = activeBtn.dataset.tab;
    }
    mountPipelinePageHeader(tabForHeader);
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update buttons
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
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
                mountPipelinePageHeader('opportunities');
                loadOpportunitiesPipeline();
            } else if (tabName === 'applications') {
                mountPipelinePageHeader('applications');
                loadApplicationsPipeline();
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
        
        const intentFilter = readIntentFilterFromPanel('tab-opportunities');
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

        updatePipelineOpportunityStats(draft, published, inProgress, closed);

        const buckets = {
            draft,
            published,
            in_progress: inProgress,
            closed
        };
        pipelineOpportunityBuckets = buckets;
        syncOpportunitySidebarCounts(buckets);

        if (!OPPORTUNITY_STAGE_KEYS.includes(pipelineSelectedOppStage)) {
            pipelineSelectedOppStage = 'draft';
        }
        selectOpportunityStage(pipelineSelectedOppStage);
        
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

        let appsWithOpps = await Promise.all(
            userApplications.map(async (app) => {
                const opportunity = await dataService.getOpportunityById(app.opportunityId);
                return { ...app, opportunity };
            })
        );

        const intentFilter = readIntentFilterFromPanel('tab-applications');
        if (intentFilter === 'request' || intentFilter === 'offer') {
            appsWithOpps = appsWithOpps.filter(a => (a.opportunity?.intent || 'request') === intentFilter);
        }

        updatePipelineApplicationStats(appsWithOpps);

        const buckets = {
            pending: appsWithOpps.filter(a => a.status === 'pending'),
            reviewing: appsWithOpps.filter(a => a.status === 'reviewing'),
            shortlisted: appsWithOpps.filter(a => a.status === 'shortlisted'),
            in_negotiation: appsWithOpps.filter(a => a.status === 'in_negotiation'),
            accepted: appsWithOpps.filter(a => a.status === 'accepted'),
            rejected: appsWithOpps.filter(a => a.status === 'rejected' || a.status === 'withdrawn')
        };
        pipelineApplicationBuckets = buckets;
        syncApplicationSidebarCounts(buckets);

        if (!APPLICATION_STAGE_KEYS.includes(pipelineSelectedAppStage)) {
            pipelineSelectedAppStage = 'pending';
        }
        selectApplicationStage(pipelineSelectedAppStage);
    } catch (error) {
        console.error('Error loading applications pipeline:', error);
    }
}

/**
 * Get viewer role for a one_way post-match (from participants).
 * @returns {{ isNeedOwner: boolean, isOfferOwner: boolean }}
 */
function getOneWayViewerRole(postMatch, currentUserId) {
    const participants = postMatch.participants || [];
    const needOwner = participants.find(p => p.role === 'need_owner');
    const offerProvider = participants.find(p => p.role === 'offer_provider');
    const needOwnerId = needOwner?.userId || null;
    const offerOwnerId = offerProvider?.userId || null;
    return {
        isNeedOwner: needOwnerId === currentUserId,
        isOfferOwner: offerOwnerId === currentUserId
    };
}

async function buildPostMatchViewModelPipeline(postMatch, currentUserId) {
    const ds = dataService;
    const scorePct = Math.round((postMatch.matchScore || 0) * 100);
    const matchBadgeClass = scorePct >= 90 ? 'badge-match-high' : scorePct >= 70 ? 'badge-match-medium' : 'badge-match-low';
    const base = {
        id: postMatch.id,
        matchType: postMatch.matchType,
        matchScore: postMatch.matchScore,
        matchScorePercent: scorePct,
        matchBadgeClass,
        status: postMatch.status,
        tierLabel: postMatch.matchScore >= 0.85 ? 'Top match' : postMatch.matchScore >= 0.70 ? 'Good match' : 'Possible match'
    };
    const payload = postMatch.payload || {};
    if (postMatch.matchType === 'one_way') {
        const needOpp = await ds.getOpportunityById(payload.needOpportunityId);
        const offerOpp = await ds.getOpportunityById(payload.offerOpportunityId);
        const otherPart = (postMatch.participants || []).find(p => p.userId !== currentUserId);
        const { isNeedOwner } = getOneWayViewerRole(postMatch, currentUserId);
        const cardTitle = isNeedOwner ? 'Recommended Provider Found' : 'Recommended Opportunity Found';
        const section1Label = isNeedOwner ? 'Your Need' : 'Opportunity Need';
        const section2Label = isNeedOwner ? 'Provider Offer' : 'Your Offer';
        const needTitle = needOpp?.title || 'Need';
        const offerTitle = offerOpp?.title || 'Offer';
        const otherUserId = otherPart?.userId || '';
        const needOpportunityId = payload.needOpportunityId || '';
        const offerOpportunityId = payload.offerOpportunityId || '';
        let primaryActionLabel, primaryActionRoute, secondaryActionLabel, secondaryActionRoute, tertiaryActionLabel, tertiaryActionRoute;
        if (isNeedOwner) {
            primaryActionLabel = 'View Provider';
            primaryActionRoute = '/opportunities/' + offerOpportunityId;
            secondaryActionLabel = 'Invite to Apply';
            secondaryActionRoute = '/opportunities/' + offerOpportunityId;
            tertiaryActionLabel = 'Message Provider';
            tertiaryActionRoute = '/messages/' + otherUserId;
        } else {
            primaryActionLabel = 'View Opportunity';
            primaryActionRoute = '/opportunities/' + needOpportunityId;
            secondaryActionLabel = 'Apply to Opportunity';
            secondaryActionRoute = '/opportunities/' + needOpportunityId;
            tertiaryActionLabel = 'Message Owner';
            tertiaryActionRoute = '/messages/' + otherUserId;
        }
        return {
            ...base,
            needTitle,
            offerTitle,
            needOpportunityId,
            offerOpportunityId,
            otherUserId,
            cardTitle,
            section1Label,
            section2Label,
            primaryActionLabel,
            primaryActionRoute,
            secondaryActionLabel,
            secondaryActionRoute,
            tertiaryActionLabel,
            tertiaryActionRoute
        };
    }
    if (postMatch.matchType === 'two_way') {
        const sideA = payload.sideA || {}, sideB = payload.sideB || {};
        const isA = sideA.userId === currentUserId;
        const myNeedId = isA ? sideA.needId : sideB.needId, myOfferId = isA ? sideA.offerId : sideB.offerId, theirNeedId = isA ? sideB.needId : sideA.needId, theirOfferId = isA ? sideB.offerId : sideA.offerId;
        const myNeed = myNeedId ? await ds.getOpportunityById(myNeedId) : null, myOffer = myOfferId ? await ds.getOpportunityById(myOfferId) : null, theirNeed = theirNeedId ? await ds.getOpportunityById(theirNeedId) : null, theirOffer = theirOfferId ? await ds.getOpportunityById(theirOfferId) : null;
        return { ...base, yourNeedTitle: myNeed?.title || 'Your need', yourOfferTitle: myOffer?.title || 'Your offer', theirNeedTitle: theirNeed?.title || 'Their need', theirOfferTitle: theirOffer?.title || 'Their offer', valueEquivalence: payload.valueEquivalence || '', otherUserId: isA ? (sideB.userId || '') : (sideA.userId || '') };
    }
    if (postMatch.matchType === 'consortium') {
        const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
        const rawTitle = leadOpp?.title || 'Project';
        const projectTitle = rawTitle.replace(/^Need:\s*/i, '').trim() || rawTitle;
        const roles = await Promise.all((payload.roles || []).map(async (r) => { const u = await ds.getUserOrCompanyById(r.userId); return { role: r.role || 'Partner', partnerName: u?.profile?.name || r.userId }; }));
        return { ...base, projectTitle, roles };
    }
    if (postMatch.matchType === 'circular') {
        const cycle = payload.cycle || [], links = payload.links || [];
        const youGiveLink = links.find(l => (l.fromCreatorId || l.from) === currentUserId), youReceiveLink = links.find(l => (l.toCreatorId || l.to) === currentUserId);
        const youGiveOpp = youGiveLink?.offerId ? await ds.getOpportunityById(youGiveLink.offerId) : null;
        const youReceiveNeedOpp = youReceiveLink?.needId ? await ds.getOpportunityById(youReceiveLink.needId) : null;
        const names = await Promise.all(cycle.map(uid => ds.getUserOrCompanyById(uid).then(u => u?.profile?.name || uid)));
        const cycleLabel = cycle.map((uid, i) => (uid === currentUserId ? 'You' : (names[i] || uid))).join(' → ') + ' → You';
        return { ...base, cycleLabel, youGiveTitle: youGiveOpp?.title || 'Your offer', youReceiveTitle: youReceiveNeedOpp ? 'Need: ' + youReceiveNeedOpp.title : 'Their need' };
    }
    return base;
}

const POST_MATCH_TEMPLATES = { one_way: 'match-card-one-way', two_way: 'match-card-two-way', consortium: 'match-card-consortium', circular: 'match-card-circular' };
const MATCH_TYPE_LABELS = { one_way: 'Recommended Matches', two_way: 'Barter Matches', consortium: 'Consortium Invitations', circular: 'Circular Exchange Opportunities' };

function setupMatchesSubTabs() {
    const tabMatches = document.getElementById('tab-matches');
    const btnRecommended = document.getElementById('matches-subtab-recommended');
    const btnOpportunity = document.getElementById('matches-subtab-opportunity');
    const btnConsortium = document.getElementById('matches-subtab-consortium');
    const panelRecommended = document.getElementById('matches-recommended');
    const panelOpportunity = document.getElementById('matches-opportunity');
    const panelConsortium = document.getElementById('matches-consortium');
    if (!tabMatches || !btnRecommended || !btnOpportunity || !panelRecommended || !panelOpportunity) return;
    function setActive(btn, panel) {
        [btnRecommended, btnOpportunity, btnConsortium].forEach(b => b && b.classList.remove('active'));
        [panelRecommended, panelOpportunity, panelConsortium].forEach(p => p && p.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (panel) panel.classList.add('active');
        [btnRecommended, btnOpportunity, btnConsortium].forEach(b => { if (b) b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
    }
    btnRecommended.addEventListener('click', () => setActive(btnRecommended, panelRecommended));
    btnOpportunity.addEventListener('click', () => setActive(btnOpportunity, panelOpportunity));
    if (btnConsortium) btnConsortium.addEventListener('click', () => setActive(btnConsortium, panelConsortium));
}

async function loadMatchesPipeline() {
    const user = authService.getCurrentUser();
    if (!user) return;

    const recommendedContainer = document.getElementById('matches-recommended-list');
    const opportunityContainer = document.getElementById('matches-opportunity-list');
    const consortiumContainer = document.getElementById('matches-consortium-list');
    if (!recommendedContainer || !opportunityContainer) return;

    recommendedContainer.innerHTML = '<div class="spinner"></div>';
    opportunityContainer.innerHTML = '<div class="spinner"></div>';
    if (consortiumContainer) consortiumContainer.innerHTML = '<div class="spinner"></div>';
    setupMatchesSubTabs();

    try {
        const legacyMatches = await dataService.getMatches();
        const candidateMatches = legacyMatches.filter(m => (m.candidateId || m.userId) === user.id);
        const allOpportunities = await dataService.getOpportunities();
        const needOwnerOppIds = new Set((allOpportunities.filter(o => o.creatorId === user.id)).map(o => o.id));
        const needOwnerMatches = legacyMatches.filter(m => needOwnerOppIds.has(m.opportunityId));
        const userLegacyMatches = [...candidateMatches, ...needOwnerMatches.filter(m => !candidateMatches.some(c => c.id === m.id))];
        const postMatches = dataService.getPostMatchesForUser ? await dataService.getPostMatchesForUser(user.id) : [];
        const pendingPostMatches = postMatches.filter(pm => (pm.status || '') !== 'declined' && (pm.status || '') !== 'expired');

        const hasLegacy = userLegacyMatches.length > 0;
        const hasPost = pendingPostMatches.length > 0;

        const emptyStateProfile = 'No matches found. Keep your profile updated to receive matches! <a href="#" data-route="' + CONFIG.ROUTES.PROFILE + '" class="text-primary font-medium">Update your profile</a>';
        const emptyStateRecommended = 'No recommended matches. <a href="#" data-route="' + CONFIG.ROUTES.PROFILE + '" class="text-primary font-medium">Update your profile</a> or explore opportunities to get matches.';
        const emptyStateOpportunity = 'No opportunity matches.';

        if (!hasLegacy && !hasPost) {
            recommendedContainer.innerHTML = '<div class="empty-state">' + emptyStateProfile + '</div>';
            opportunityContainer.innerHTML = '<div class="empty-state">' + emptyStateProfile + '</div>';
            if (consortiumContainer) consortiumContainer.innerHTML = '<div class="empty-state">' + emptyStateProfile + '</div>';
            document.getElementById('matches-recommended')?.classList.add('active');
            document.getElementById('matches-opportunity')?.classList.remove('active');
            document.getElementById('matches-consortium')?.classList.remove('active');
            document.getElementById('matches-subtab-recommended')?.classList.add('active');
            document.getElementById('matches-subtab-opportunity')?.classList.remove('active');
            document.getElementById('matches-subtab-consortium')?.classList.remove('active');
            return;
        }

        if (hasPost) {
            const byType = {};
            pendingPostMatches.forEach(pm => {
                const t = pm.matchType || 'one_way';
                if (!byType[t]) byType[t] = [];
                byType[t].push(pm);
            });
            const recommendedParts = [];
            ['one_way', 'two_way', 'circular'].forEach(matchType => {
                const list = (byType[matchType] || []).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                if (list.length === 0) return;
                const label = MATCH_TYPE_LABELS[matchType];
                recommendedParts.push('<div class="matches-section"><h3 class="matches-section-title">' + label + '</h3><div class="match-cards-grid post-match-cards-' + matchType + '"></div></div>');
            });
            recommendedContainer.innerHTML = recommendedParts.length ? recommendedParts.join('') : '<div class="empty-state">' + emptyStateRecommended + '</div>';
            for (const matchType of ['one_way', 'two_way', 'circular']) {
                const list = (byType[matchType] || []).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                if (list.length === 0) continue;
                const subContainer = recommendedContainer.querySelector('.post-match-cards-' + matchType);
                if (!subContainer) continue;
                const templateName = POST_MATCH_TEMPLATES[matchType];
                const template = await templateLoader.load(templateName);
                const htmlParts = [];
                for (const pm of list) {
                    const viewModel = await buildPostMatchViewModelPipeline(pm, user.id);
                    htmlParts.push(templateRenderer.render(template, viewModel));
                }
                subContainer.innerHTML = htmlParts.join('');
            }
            if (consortiumContainer) {
                const consortiumList = (byType.consortium || []).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                if (consortiumList.length > 0) {
                    consortiumContainer.innerHTML = '<div class="matches-section"><div class="match-cards-grid post-match-cards-consortium"></div></div>';
                    const consortiumSub = consortiumContainer.querySelector('.post-match-cards-consortium');
                    if (consortiumSub) {
                        const template = await templateLoader.load('match-card-consortium');
                        const htmlParts = [];
                        for (const pm of consortiumList) {
                            const viewModel = await buildPostMatchViewModelPipeline(pm, user.id);
                            htmlParts.push(templateRenderer.render(template, viewModel));
                        }
                        consortiumSub.innerHTML = htmlParts.join('');
                    }
                } else {
                    consortiumContainer.innerHTML = '<div class="empty-state">No consortium invitations.</div>';
                }
            }
        } else {
            recommendedContainer.innerHTML = '<div class="empty-state">' + emptyStateRecommended + '</div>';
        }

        if (hasLegacy) {
            opportunityContainer.innerHTML = '<div class="matches-section"><h3 class="matches-section-title">Opportunity Matches</h3><div class="match-cards-grid legacy-match-cards"></div></div>';
            const legacyContainer = opportunityContainer.querySelector('.legacy-match-cards');
            if (legacyContainer) {
                const matchesWithOpps = await Promise.all(
                    userLegacyMatches.map(async (m) => {
                        const opportunity = await dataService.getOpportunityById(m.opportunityId);
                        const opp = opportunity || { id: m.opportunityId, title: 'Unknown', description: 'No description', modelType: '—', status: '—', creatorId: null };
                        const isNeedOwner = opp.creatorId === user.id;
                        const providerId = m.candidateId || m.userId;
                        let providerName = '';
                        if (isNeedOwner && providerId) {
                            const provider = await dataService.getUserOrCompanyById(providerId);
                            providerName = provider?.profile?.name || provider?.profile?.companyName || providerId;
                        }
                        const needOwnerId = opp.creatorId || '';
                        const cardTitle = isNeedOwner ? 'Recommended Provider Found' : 'Recommended Opportunity Found';
                        const section1Label = isNeedOwner ? 'Your Need' : 'Opportunity Need';
                        const section2Label = isNeedOwner ? 'Provider Offer' : 'Your Offer';
                        const section1Content = opp.title + (opp.description ? ': ' + opp.description : '');
                        const section2Content = isNeedOwner ? providerName || 'Provider' : 'Your application / offer';
                        const industryLabel = (Array.isArray(opp.sectors) && opp.sectors[0]) ? opp.sectors[0] : (opp.industry || (opp.sectors && !Array.isArray(opp.sectors) ? opp.sectors : null));
                        let primaryActionLabel, primaryActionRoute, secondaryActionLabel, secondaryActionRoute, tertiaryActionLabel, tertiaryActionRoute;
                        if (isNeedOwner) {
                            primaryActionLabel = 'View Provider';
                            primaryActionRoute = '/people/' + providerId;
                            secondaryActionLabel = 'Invite to Apply';
                            secondaryActionRoute = '/opportunities/' + opp.id;
                            tertiaryActionLabel = 'Message Provider';
                            tertiaryActionRoute = '/messages/' + providerId;
                        } else {
                            primaryActionLabel = 'View Opportunity';
                            primaryActionRoute = '/opportunities/' + opp.id;
                            secondaryActionLabel = 'Apply to Opportunity';
                            secondaryActionRoute = '/opportunities/' + opp.id;
                            tertiaryActionLabel = 'Message Owner';
                            tertiaryActionRoute = '/messages/' + needOwnerId;
                        }
                        return {
                            id: m.id,
                            opportunity: { ...opp, description: opp.description || 'No description' },
                            matchScore: m.matchScore != null ? m.matchScore : 0,
                            criteria: m.criteria || m.matchReasons,
                            cardTitle,
                            section1Label,
                            section2Label,
                            section1Content,
                            section2Content,
                            industryLabel: industryLabel || null,
                            primaryActionLabel,
                            primaryActionRoute,
                            secondaryActionLabel,
                            secondaryActionRoute,
                            tertiaryActionLabel,
                            tertiaryActionRoute
                        };
                    })
                );
                matchesWithOpps.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                const template = await templateLoader.load('match-card');
                legacyContainer.innerHTML = matchesWithOpps.map(match => {
                    const matchScorePercent = Math.round((match.matchScore || 0) * 100);
                    const matchBadgeClass = matchScorePercent >= 90 ? 'badge-match-high' : matchScorePercent >= 70 ? 'badge-match-medium' : 'badge-match-low';
                    const data = {
                        ...match,
                        opportunity: { ...match.opportunity, description: match.opportunity.description || 'No description' },
                        matchScorePercent,
                        matchBadgeClass
                    };
                    return templateRenderer.render(template, data);
                }).join('');
            }
        } else {
            opportunityContainer.innerHTML = '<div class="empty-state">' + emptyStateOpportunity + '</div>';
        }

        if (!document.getElementById('tab-matches')?.dataset.matchActionsBound) {
            document.getElementById('tab-matches').dataset.matchActionsBound = '1';
            document.getElementById('tab-matches').addEventListener('click', (e) => {
                const accept = e.target.closest('.btn-accept-match');
                const decline = e.target.closest('.btn-decline-match');
                if ((accept || decline) && e.target.tagName !== 'A') {
                    e.preventDefault();
                    const matchId = (accept || decline).getAttribute('data-match-id');
                    if (matchId && window.router && typeof window.router.navigate === 'function') {
                        window.router.navigate('/matches/' + matchId);
                    }
                }
            });
        }

        const panelRecommendedEl = document.getElementById('matches-recommended');
        const panelOpportunityEl = document.getElementById('matches-opportunity');
        const panelConsortiumEl = document.getElementById('matches-consortium');
        const btnRec = document.getElementById('matches-subtab-recommended');
        const btnOpp = document.getElementById('matches-subtab-opportunity');
        const btnCons = document.getElementById('matches-subtab-consortium');
        [panelRecommendedEl, panelOpportunityEl, panelConsortiumEl].forEach(p => p && p.classList.remove('active'));
        [btnRec, btnOpp, btnCons].forEach(b => b && b.classList.remove('active'));
        if (hasPost) {
            panelRecommendedEl?.classList.add('active');
            btnRec?.classList.add('active');
        } else if (hasLegacy) {
            panelOpportunityEl?.classList.add('active');
            btnOpp?.classList.add('active');
        } else if (consortiumContainer && consortiumContainer.querySelector('.match-cards-grid')) {
            panelConsortiumEl?.classList.add('active');
            btnCons?.classList.add('active');
        } else {
            panelRecommendedEl?.classList.add('active');
            btnRec?.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        recommendedContainer.innerHTML = '<div class="empty-state">Error loading matches. Please try again.</div>';
        opportunityContainer.innerHTML = '<div class="empty-state">Error loading matches. Please try again.</div>';
        if (consortiumContainer) consortiumContainer.innerHTML = '<div class="empty-state">Error loading matches. Please try again.</div>';
    }
}
