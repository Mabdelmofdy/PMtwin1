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
    { key: 'published', label: 'Published', hint: 'Visible to others; partners can discover and apply.' },
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

const PIPELINE_MATCHES_TAB_ALL = 'all';
const PIPELINE_MATCHES_TABS = [
    { id: PIPELINE_MATCHES_TAB_ALL, label: 'All' },
    { id: 'one_way', label: 'Need/Offer' },
    { id: 'two_way', label: 'Barter' },
    { id: 'consortium', label: 'Consortium' },
    { id: 'circular', label: 'Circular' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'declined', label: 'Declined' },
    { id: 'expired', label: 'Expired' }
];
const PIPELINE_MATCH_TYPE_ORDER = ['one_way', 'two_way', 'consortium', 'circular'];

let pipelineMatchesViewModels = [];
let pipelineMatchesFilterTab = PIPELINE_MATCHES_TAB_ALL;

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
            statusLabel:
                window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function'
                    ? window.statusBadgeSystem.getStatusLabel(item.status, 'application')
                    : APP_PIPELINE_STATUS_LABELS[item.status] || item.status || '',
            applicationStatusBadgeClass:
                window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusBadgeClass === 'function'
                    ? window.statusBadgeSystem.getStatusBadgeClass(item.status, 'application')
                    : 'badge--neutral',
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
    let presetKey = 'pipelineOpportunities';
    if (tabName === 'applications') presetKey = 'pipelineApplications';
    else if (tabName === 'matches') presetKey = 'pipelineMatches';
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
            return;
        }
        if (el.closest('#pipeline-cta-matches-scroll')) {
            e.preventDefault();
            document.getElementById('pipeline-matches-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    initPipelineMatchesFilterFromStorage();
    ensurePipelineMatchesSubtabsMarkup();
    setupPipelineMatchesSubtabs();
    let tabForHeader = 'opportunities';
    const tab = params.tab;
    if (tab === 'applications' || tab === 'opportunities' || tab === 'matches') {
        const tabBtn = document.querySelector('.pipeline-board-tab[data-tab="' + tab + '"]');
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
            } else if (tabName === 'matches') {
                mountPipelinePageHeader('matches');
                void loadPipelineMatchesTabContent();
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

function initPipelineMatchesFilterFromStorage() {
    try {
        const v = sessionStorage.getItem('pipeline-matches-tab');
        if (v && PIPELINE_MATCHES_TABS.some(t => t.id === v)) pipelineMatchesFilterTab = v;
    } catch (e) { /* ignore */ }
}

function ensurePipelineMatchesSubtabsMarkup() {
    const container = document.getElementById('pipeline-matches-subtabs');
    if (!container || container.querySelector('[data-pipeline-matches-tab]')) return;
    container.innerHTML = PIPELINE_MATCHES_TABS.map((tab, index) => {
        const active = tab.id === pipelineMatchesFilterTab ? ' active' : '';
        const selected = tab.id === pipelineMatchesFilterTab ? 'true' : 'false';
        return '<button type="button" class="matches-segment' + active + '" role="tab" data-pipeline-matches-tab="' + tab.id + '" aria-selected="' + selected + '">'
            + '<span class="matches-segment__inner"><span class="matches-segment__label">' + tab.label + '</span>'
            + '<span class="matches-segment__count" id="pipeline-matches-count-' + tab.id + '" hidden></span></span></button>';
    }).join('');
}

function setupPipelineMatchesSubtabs() {
    const root = document.querySelector('[data-pipeline-matches-root="1"]');
    const container = document.getElementById('pipeline-matches-subtabs');
    if (!root || !container || root.dataset.pipelineMatchesSubtabsBound === '1') return;
    root.dataset.pipelineMatchesSubtabsBound = '1';
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-pipeline-matches-tab]');
        if (!btn) return;
        pipelineMatchesFilterTab = btn.getAttribute('data-pipeline-matches-tab') || PIPELINE_MATCHES_TAB_ALL;
        try {
            sessionStorage.setItem('pipeline-matches-tab', pipelineMatchesFilterTab);
        } catch (err) { /* ignore */ }
        container.querySelectorAll('[data-pipeline-matches-tab]').forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderPipelineMatchesList();
    });
}

function filterPipelineMatchesViewModels(viewModels) {
    const tab = pipelineMatchesFilterTab;
    return viewModels.filter(vm => {
        if (tab === 'pending' && vm.status !== 'pending') return false;
        if (tab === 'confirmed' && vm.status !== 'confirmed') return false;
        if (tab === 'declined' && vm.status !== 'declined') return false;
        if (tab === 'expired' && vm.status !== 'expired') return false;
        if (['one_way', 'two_way', 'consortium', 'circular'].includes(tab) && vm.matchType !== tab) return false;
        return true;
    });
}

function filterPipelineMatchesForTabCount(viewModels, tabId) {
    const prev = pipelineMatchesFilterTab;
    pipelineMatchesFilterTab = tabId;
    const out = filterPipelineMatchesViewModels(viewModels);
    pipelineMatchesFilterTab = prev;
    return out;
}

function updatePipelineMatchesSubtabCounts() {
    PIPELINE_MATCHES_TABS.forEach(tab => {
        const el = document.getElementById('pipeline-matches-count-' + tab.id);
        if (!el) return;
        const count = tab.id === PIPELINE_MATCHES_TAB_ALL
            ? pipelineMatchesViewModels.length
            : filterPipelineMatchesForTabCount(pipelineMatchesViewModels, tab.id).length;
        if (count > 0) {
            el.textContent = String(count);
            el.removeAttribute('hidden');
        } else {
            el.textContent = '';
            el.setAttribute('hidden', 'hidden');
        }
    });
}

function pipelineMatchStatusBadgeClass(status) {
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusBadgeClass === 'function') {
        return window.statusBadgeSystem.getStatusBadgeClass(status, 'match') || 'badge--neutral';
    }
    return 'badge--neutral';
}

function renderPipelineMatchCardHtml(vm) {
    const umv = window.unifiedMatchViewModel;
    const esc = umv && typeof umv.escapeHtml === 'function' ? umv.escapeHtml : function (str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    };
    const statusCls = pipelineMatchStatusBadgeClass(vm.status);
    const scoreHtml = '<span class="badge badge-match ' + esc(vm.matchQualityClass) + '">' + esc(vm.matchQualityLabel) + ' · ' + vm.matchScorePercent + '%</span>';
    const opps = (vm.opportunities || []).map(o =>
        '<li><a href="#" data-route="' + esc('/opportunities/' + o.id) + '">' + esc(o.title || o.id) + '</a></li>'
    ).join('');
    const participants = esc(vm.participantSummary || '—');
    const typeLine = esc(vm.matchTypeLabel);
    const statusLine = esc(vm.statusLabel);
    const title = esc(vm.cardTitle || (vm.matchTypeLabel + ' match'));
    return '<article class="pipeline-match-card" data-match-id="' + esc(vm.id) + '" data-match-type="' + esc(vm.matchType) + '">'
        + '<header class="pipeline-match-card__head"><h3 class="pipeline-match-card__title">' + title + '</h3>' + scoreHtml + '</header>'
        + '<div class="pipeline-match-card__body">'
        + '<p class="pipeline-match-card__row"><span class="pipeline-match-card__kicker">Match type</span>' + typeLine + '</p>'
        + '<p class="pipeline-match-card__row"><span class="pipeline-match-card__kicker">Status</span> <span class="badge ' + statusCls + '">' + statusLine + '</span></p>'
        + '<p class="pipeline-match-card__row"><span class="pipeline-match-card__kicker">Participants</span>' + participants + '</p>'
        + '<div class="pipeline-match-card__row"><span class="pipeline-match-card__kicker">Related opportunities</span>'
        + '<ul class="pipeline-match-card__opps">' + (opps || '<li>—</li>') + '</ul></div>'
        + '</div>'
        + '<footer class="pipeline-match-card__foot">'
        + '<a href="#" data-route="' + esc('/matches/' + vm.id) + '" class="btn btn-primary btn-sm">View Match</a>'
        + '</footer></article>';
}

function updatePipelineMatchHeaderStatsFromRaw(rawMatches) {
    const list = Array.isArray(rawMatches) ? rawMatches : [];
    const total = list.length;
    const pending = list.filter(m => (m.status || '').toLowerCase() === 'pending').length;
    const confirmed = list.filter(m => (m.status || '').toLowerCase() === 'confirmed').length;
    setPipelineStat('pipeline-stat-match-total', total);
    setPipelineStat('pipeline-stat-match-pending', pending);
    setPipelineStat('pipeline-stat-match-confirmed', confirmed);
}

function renderPipelineMatchesList() {
    const listEl = document.getElementById('pipeline-matches-list');
    const summaryEl = document.getElementById('pipeline-matches-summary');
    if (!listEl) return;

    const filtered = filterPipelineMatchesViewModels(pipelineMatchesViewModels);
    if (summaryEl) {
        summaryEl.textContent = filtered.length === pipelineMatchesViewModels.length
            ? filtered.length + ' match' + (filtered.length === 1 ? '' : 'es')
            : 'Showing ' + filtered.length + ' of ' + pipelineMatchesViewModels.length;
    }

    if (pipelineMatchesViewModels.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No matches yet. Publish a Need or Offer to start matching.</div>';
        return;
    }
    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No matches for this filter.</div>';
        return;
    }

    if (pipelineMatchesFilterTab === PIPELINE_MATCHES_TAB_ALL) {
        const byType = {};
        filtered.forEach(vm => {
            const t = vm.matchType || 'one_way';
            if (!byType[t]) byType[t] = [];
            byType[t].push(vm);
        });
        const parts = [];
        PIPELINE_MATCH_TYPE_ORDER.forEach(mt => {
            const group = (byType[mt] || []).slice().sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
            if (!group.length) return;
            const label = window.unifiedMatchViewModel && typeof window.unifiedMatchViewModel.getMatchTypeLabel === 'function'
                ? window.unifiedMatchViewModel.getMatchTypeLabel(mt)
                : mt;
            parts.push('<section class="matches-section" data-pipeline-match-type="' + mt + '"><h3 class="matches-section-title">' + label + '</h3><div class="match-cards-grid">'
                + group.map(renderPipelineMatchCardHtml).join('')
                + '</div></section>');
        });
        Object.keys(byType).forEach(mt => {
            if (PIPELINE_MATCH_TYPE_ORDER.includes(mt)) return;
            const group = (byType[mt] || []).slice().sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
            if (!group.length) return;
            const escMt = window.unifiedMatchViewModel && typeof window.unifiedMatchViewModel.escapeHtml === 'function'
                ? window.unifiedMatchViewModel.escapeHtml(mt)
                : String(mt).replace(/</g, '&lt;');
            parts.push('<section class="matches-section" data-pipeline-match-type="' + escMt + '"><h3 class="matches-section-title">' + escMt + '</h3><div class="match-cards-grid">'
                + group.map(renderPipelineMatchCardHtml).join('')
                + '</div></section>');
        });
        listEl.innerHTML = parts.join('') || '<div class="empty-state">No matches for this filter.</div>';
        return;
    }

    listEl.innerHTML = '<div class="match-cards-grid">' + filtered.map(renderPipelineMatchCardHtml).join('') + '</div>';
}

/**
 * Pipeline Matches tab — post_matches only (getPostMatchesForUser). No legacy / pmtwin_matches.
 */
async function loadPipelineMatchesTabContent() {
    const listEl = document.getElementById('pipeline-matches-list');
    const user = authService.getCurrentUser();
    if (!listEl || !user) return;

    const umv = window.unifiedMatchViewModel;
    if (!umv || typeof umv.buildUnifiedMatchViewModels !== 'function' || typeof dataService.getPostMatchesForUser !== 'function') {
        listEl.innerHTML = '<div class="empty-state">We couldn’t load matches. Please try again.</div>';
        return;
    }

    listEl.innerHTML = '<div class="spinner" aria-label="Loading matches"></div>';
    try {
        const rawMatches = await dataService.getPostMatchesForUser(user.id);
        updatePipelineMatchHeaderStatsFromRaw(rawMatches);
        const context = { currentUserId: user.id, dataService };
        pipelineMatchesViewModels = await umv.buildUnifiedMatchViewModels(rawMatches, context);
        pipelineMatchesViewModels.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        updatePipelineMatchesSubtabCounts();
        renderPipelineMatchesList();
    } catch (error) {
        console.error('Error loading pipeline matches:', error);
        listEl.innerHTML = '<div class="empty-state">Error loading matches. Please try again.</div>';
    }
}
