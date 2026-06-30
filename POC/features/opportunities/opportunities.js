/**
 * Opportunities List Component
 */

let userApplications = [];
let opportunitiesSearchTimer = null;

function legacyApplicationUiVisible() {
    return !!(typeof CONFIG !== 'undefined'
        && CONFIG.PRODUCT_FLAGS
        && CONFIG.PRODUCT_FLAGS.SHOW_LEGACY_APPLICATIONS === true);
}

function hideLegacyApplicationOpportunitiesSurfaces() {
    if (legacyApplicationUiVisible()) return;
    const appliedQuick = document.getElementById('opp-quick-applied');
    if (appliedQuick) appliedQuick.style.display = 'none';
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter && categoryFilter.value === 'applied') categoryFilter.value = '';
    const appliedOption = document.querySelector('#filter-category option[value="applied"]');
    if (appliedOption) appliedOption.remove();
    const lead = document.querySelector('.opp-toolbar__lead');
    if (lead) {
        lead.textContent =
            'Published needs and offers from the network. Use the shortcuts for yours or open listings—then narrow with filters or the map.';
    }
}

function scheduleOpportunitiesSearch() {
    clearTimeout(opportunitiesSearchTimer);
    opportunitiesSearchTimer = setTimeout(() => loadOpportunities(), 320);
}

function syncOppQuickButtons() {
    const sel = document.getElementById('filter-category');
    const cat = sel ? sel.value : '';
    document.querySelectorAll('[data-opp-cat]').forEach((btn) => {
        const v = btn.getAttribute('data-opp-cat');
        const match = v === 'all' ? cat === '' : v === cat;
        btn.classList.toggle('is-active', match);
    });
}

function navigateOpportunity(route) {
    const r = window.router || (typeof router !== 'undefined' ? router : null);
    if (r && typeof r.navigate === 'function') {
        r.navigate(route);
    }
}

function escapeHtml(str) {
    if (str == null || str === '') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatOpportunityStatus(status) {
    const m = {
        draft: 'Draft',
        published: 'Published',
        in_negotiation: 'In negotiation',
        contracted: 'Contracted',
        in_execution: 'In execution',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return m[status] || status;
}

async function initOpportunities() {
    try {
        hideLegacyApplicationOpportunitiesSurfaces();
        const headerMount = document.getElementById('page-context-header-mount');
        if (headerMount && window.pageContextHeader && window.pageContextHeader.PRESETS) {
            window.pageContextHeader.mount(headerMount, window.pageContextHeader.PRESETS.opportunities);
        }
        const draftsCta = document.getElementById('page-cta-opportunities-drafts');
        if (draftsCta) {
            draftsCta.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = document.getElementById('filter-category');
                const st = document.getElementById('filter-status');
                if (cat) cat.value = 'mine';
                if (st) st.value = 'draft';
                syncOppQuickButtons();
                loadOpportunities();
                document.getElementById('opportunities-panel-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        const user = authService.getCurrentUser();
        if (user) {
            try {
                const allApplications = await dataService.getApplications();
                userApplications = allApplications.filter((app) => app.applicantId === user.id);
            } catch (appErr) {
                console.warn('Opportunities: could not load applications (legacy path); continuing without them.', appErr);
                userApplications = [];
            }
        }

        document.querySelectorAll('[data-opp-cat]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const v = btn.getAttribute('data-opp-cat');
                if (!legacyApplicationUiVisible() && v === 'applied') return;
                const sel = document.getElementById('filter-category');
                if (sel) sel.value = v === 'all' ? '' : v;
                syncOppQuickButtons();
                loadOpportunities();
            });
        });

        const clearFiltersBtn = document.getElementById('clear-filters');
        const categoryFilter = document.getElementById('filter-category');

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                document.getElementById('filter-model').value = '';
                document.getElementById('filter-status').value = '';
                document.getElementById('filter-search').value = '';
                const intentFilter = document.getElementById('filter-intent');
                if (intentFilter) intentFilter.value = '';
                if (categoryFilter) categoryFilter.value = '';
                syncOppQuickButtons();
                loadOpportunities();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                syncOppQuickButtons();
                loadOpportunities();
            });
        }

        ['filter-model', 'filter-status', 'filter-intent'].forEach((id) => {
            document.getElementById(id)?.addEventListener('change', () => loadOpportunities());
        });

        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(opportunitiesSearchTimer);
                    loadOpportunities();
                }
            });
            searchInput.addEventListener('input', () => scheduleOpportunitiesSearch());
        }

        if (authService.isPendingApproval && authService.isPendingApproval()) {
            document.querySelectorAll('a[data-route="/opportunities/create"]').forEach((link) => {
                link.removeAttribute('data-route');
                link.href = '#';
                link.setAttribute('title', 'Action disabled until your account is approved.');
                link.classList.add('opacity-75', 'cursor-not-allowed', 'pointer-events-none');
            });
        }

        await loadOpportunities();
    } catch (error) {
        console.error('Error initializing opportunities page:', error);
        const container = document.getElementById('opportunities-list');
        const summaryEl = document.getElementById('opportunities-summary');
        if (summaryEl) summaryEl.textContent = '';
        if (container) {
            container.innerHTML = renderOppEmpty({
                title: 'Could not load opportunities',
                bodyHtml: 'Something went wrong while loading this page. Please try again.',
                iconClass: 'ph-duotone ph-warning-circle',
                actionsHtml: '<button type="button" class="btn btn-secondary btn-sm" id="opp-retry-btn">Try again</button>'
            });
            document.getElementById('opp-retry-btn')?.addEventListener('click', () => initOpportunities());
        }
    }
    setupOpportunitiesRefreshListener();
}

function setupOpportunitiesRefreshListener() {
    const root = document.getElementById('opportunities-list')?.closest('section')
        || document.getElementById('opportunities-panel-wrap');
    if (!root || root.dataset.opportunitiesRefreshBound) return;
    root.dataset.opportunitiesRefreshBound = '1';
    const refresh = async () => {
        const user = authService.getCurrentUser();
        if (user) {
            const allApplications = await dataService.getApplications();
            userApplications = allApplications.filter((app) => app.applicantId === user.id);
        }
        await loadOpportunities();
    };
    ['pmtwin:opportunities-updated', 'pmtwin:applications-updated', 'pmtwin:deals-updated', 'pmtwin:data-changed']
        .forEach((eventName) => window.addEventListener(eventName, () => { void refresh(); }));
}

function toMatchScorePercent(score) {
    if (score == null || Number.isNaN(Number(score))) return null;
    return Math.min(100, Math.round(Number(score) * 100));
}

function collectOpportunityIdsFromPostMatch(pm) {
    const ids = [];
    const p = pm.payload || {};
    if (pm.matchType === 'one_way') {
        if (p.needOpportunityId) ids.push(p.needOpportunityId);
        if (p.offerOpportunityId) ids.push(p.offerOpportunityId);
    } else if (pm.matchType === 'two_way') {
        const sideA = p.sideA || {};
        const sideB = p.sideB || {};
        [sideA.needId, sideA.offerId, sideB.needId, sideB.offerId].forEach((id) => {
            if (id) ids.push(id);
        });
    } else if (pm.matchType === 'consortium') {
        if (p.leadNeedId) ids.push(p.leadNeedId);
        (p.roles || []).forEach((r) => {
            if (r.opportunityId) ids.push(r.opportunityId);
        });
    } else if (pm.matchType === 'circular') {
        (p.links || []).forEach((l) => {
            if (l.needId) ids.push(l.needId);
            if (l.offerId) ids.push(l.offerId);
        });
    }
    (pm.participants || []).forEach((part) => {
        if (part.opportunityId) ids.push(part.opportunityId);
    });
    return [...new Set(ids)];
}

function buildMatchScoreByOpportunityId(postMatches, userId, opportunitiesById) {
    const scores = new Map();
    const umv = window.unifiedMatchViewModel;

    for (const pm of postMatches) {
        const score = pm.matchScore != null ? Number(pm.matchScore) : null;
        if (score == null || Number.isNaN(score)) continue;

        let counterpartIds = [];
        if (umv && typeof umv.resolveViewerOpportunityIds === 'function') {
            const { counterpartId } = umv.resolveViewerOpportunityIds(pm, userId, pm.matchType);
            if (counterpartId) counterpartIds = [counterpartId];
        }

        if (!counterpartIds.length) {
            counterpartIds = collectOpportunityIdsFromPostMatch(pm).filter((oppId) => {
                const opp = opportunitiesById[oppId];
                return opp && opp.creatorId !== userId;
            });
        }

        counterpartIds.forEach((oppId) => {
            const prev = scores.get(oppId);
            if (prev == null || score > prev) scores.set(oppId, score);
        });
    }

    return scores;
}

function renderOppEmpty(opts) {
    const iconClass = opts.iconClass || 'ph-duotone ph-briefcase';
    return (
        '<div class="opp-empty" role="status">' +
        '<span class="opp-empty__icon" aria-hidden="true"><i class="' +
        escapeHtml(iconClass) +
        '"></i></span>' +
        '<p class="opp-empty__title">' +
        escapeHtml(opts.title || '') +
        '</p>' +
        '<p class="opp-empty__text">' +
        opts.bodyHtml +
        '</p>' +
        (opts.actionsHtml ? '<div class="opp-empty__actions">' + opts.actionsHtml + '</div>' : '') +
        '</div>'
    );
}

async function loadOpportunities() {
    const container = document.getElementById('opportunities-list');
    const summaryEl = document.getElementById('opportunities-summary');
    if (!container) return;

    container.innerHTML = '<div class="spinner"></div>';
    if (summaryEl) summaryEl.textContent = 'Loading…';

    syncOppQuickButtons();

    try {
        const raw = await dataService.getOpportunities();
        const user = authService.getCurrentUser();
        const allDeals = user ? await dataService.getDeals() : [];

        const allCategorized = raw.map((opp) => {
            const isOwner = user && opp.creatorId === user.id;
            const application = userApplications.find((app) => app.opportunityId === opp.id);
            const hasApplied = !!application;
            const hasDeal = user && allDeals.some((d) =>
                d.opportunityId === opp.id || (Array.isArray(d.opportunityIds) && d.opportunityIds.includes(opp.id))
            );

            let category = 'available';
            if (isOwner) {
                category = 'mine';
            } else if (hasApplied && legacyApplicationUiVisible()) {
                category = 'applied';
            }

            return {
                ...opp,
                category,
                isOwner,
                hasApplied,
                hasDeal,
                applicationStatus: application?.status || null,
                applicationId: application?.id || null
            };
        });

        const counts = {
            mine: allCategorized.filter((o) => o.category === 'mine').length,
            applied: allCategorized.filter((o) => o.category === 'applied').length,
            available: allCategorized.filter((o) => o.category === 'available').length
        };
        updateCategoryCounts(counts);

        const total = allCategorized.length;

        const modelFilter = document.getElementById('filter-model')?.value;
        const statusFilter = document.getElementById('filter-status')?.value;
        const searchRaw = document.getElementById('filter-search')?.value || '';
        const searchFilter = searchRaw.toLowerCase().trim();
        const categoryFilterVal = document.getElementById('filter-category')?.value;
        const intentFilter = document.getElementById('filter-intent')?.value;

        let list = allCategorized;

        if (modelFilter) {
            list = list.filter((o) => o.subModelType === modelFilter);
        }
        if (statusFilter) {
            list = list.filter((o) => o.status === statusFilter);
        }
        if (intentFilter) {
            list = list.filter((o) => (o.intent || 'request') === intentFilter);
        }
        if (searchFilter) {
            list = list.filter(
                (o) =>
                    (o.title && o.title.toLowerCase().includes(searchFilter)) ||
                    (o.description && o.description.toLowerCase().includes(searchFilter))
            );
        }
        if (categoryFilterVal) {
            if (!legacyApplicationUiVisible() && categoryFilterVal === 'applied') {
                list = [];
            } else {
                list = list.filter((o) => o.category === categoryFilterVal);
            }
        }

        list.sort((a, b) => {
            const categoryOrder = { mine: 0, applied: 1, available: 2 };
            const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
            if (catDiff !== 0) return catDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const hasFilter = !!(
            modelFilter ||
            statusFilter ||
            searchFilter ||
            categoryFilterVal ||
            intentFilter
        );
        if (summaryEl) {
            if (total === 0) {
                summaryEl.textContent = '';
            } else if (hasFilter) {
                summaryEl.textContent =
                    'Showing ' + list.length + ' of ' + total + ' opportunit' + (total === 1 ? 'y' : 'ies');
            } else {
                summaryEl.textContent = total + ' opportunit' + (total === 1 ? 'y' : 'ies');
            }
        }

        if (list.length === 0) {
            const filtered = hasFilter;
            const body = filtered
                ? 'Nothing matches the current filters. Use <strong>Reset filters</strong> or pick another category.'
                : 'Create the first opportunity to invite providers and partners.';
            const actions = filtered
                ? ''
                : '<a href="#" data-route="/opportunities/create" class="btn btn-primary btn-sm">Create opportunity</a>';
            container.innerHTML = renderOppEmpty({
                title: filtered ? 'No matching opportunities' : 'No opportunities yet',
                bodyHtml: body,
                actionsHtml: actions,
                iconClass: filtered ? 'ph-duotone ph-magnifying-glass' : 'ph-duotone ph-briefcase'
            });
            return;
        }

        if (user && dataService.getPostMatchesForUser) {
            try {
                const postMatches = await dataService.getPostMatchesForUser(user.id);
                const oppsById = Object.fromEntries(list.map((o) => [o.id, o]));
                const scoreMap = buildMatchScoreByOpportunityId(postMatches, user.id, oppsById);
                list.forEach((opp) => {
                    if (opp.isOwner) {
                        opp.matchScore = null;
                        opp.matchScorePercent = null;
                        return;
                    }
                    const raw = scoreMap.get(opp.id);
                    opp.matchScore = raw ?? null;
                    opp.matchScorePercent = raw != null ? toMatchScorePercent(raw) : null;
                });
            } catch (matchErr) {
                console.warn('Opportunities: could not load match scores; listing without scores.', matchErr);
            }
        }

        const template = await templateLoader.load('opportunity-card');

        const html = list
            .map((opp) => {
                const canApplyHelper = window.applicationUtils?.canUserApplyToOpportunity;
                const legacyAppsUi = legacyApplicationUiVisible();
                const canApply = legacyAppsUi
                    ? (canApplyHelper
                        ? canApplyHelper(opp, user, {
                            application: userApplications.find((a) => a.opportunityId === opp.id),
                            hasDeal: opp.hasDeal
                        })
                        : (user && !opp.isOwner && (opp.status === 'published' || opp.status === 'in_negotiation') && !opp.hasApplied && !opp.hasDeal))
                    : false;

                const sb = window.statusBadgeSystem;
                const data = {
                    ...opp,
                    hasApplied: legacyAppsUi && opp.hasApplied,
                    intentLabel: opp.intent === 'offer' ? 'OFFER' : 'NEED',
                    intentBadgeClass:
                        typeof getIntentBadgeClass === 'function'
                            ? getIntentBadgeClass(opp.intent, opp.modelType)
                            : 'badge-intent-request-default',
                    title: opp.title || 'Untitled opportunity',
                    modelType: formatModelType(opp.modelType) || opp.collaborationModel || 'N/A',
                    modelTypeLabel: formatModelType(opp.modelType) || opp.collaborationModel || 'N/A',
                    modelTypeBadgeClass: sb ? sb.getModelTypeBadgeClass(opp.modelType, opp.subModelType) : 'badge--info',
                    subModelType: opp.subModelType || '',
                    subModelTypeLabel: opp.subModelType ? formatSubModelType(opp.subModelType) : '',
                    subModelBadgeClass: sb ? sb.getModelTypeBadgeClass(opp.modelType, opp.subModelType) : 'badge--neutral',
                    status: opp.status || 'draft',
                    statusLabel: sb ? sb.getStatusLabel(opp.status || 'draft', 'opportunity') : formatOpportunityStatus(opp.status || 'draft'),
                    statusBadgeClass: sb ? sb.getStatusBadgeClass(opp.status || 'draft', 'opportunity') : 'badge--neutral',
                    description: opp.description || 'No description available',
                    createdDate: new Date(opp.createdAt).toLocaleDateString(),
                    canApply,
                    categoryClass: getCategoryClass(opp.category),
                    categoryLabel: getCategoryLabel(opp.category),
                    categoryIcon: getCategoryIcon(opp.category),
                    showCategoryBadge: opp.category !== 'available',
                    applicationStatusLabel: legacyAppsUi && opp.hasApplied
                        ? sb
                            ? sb.getStatusLabel(opp.applicationStatus, 'application')
                            : formatApplicationStatus(opp.applicationStatus)
                        : '',
                    applicationStatusClass: legacyAppsUi && opp.hasApplied ? getApplicationStatusClass(opp.applicationStatus) : '',
                    matchScorePercent: opp.matchScorePercent
                };
                return templateRenderer.render(template, data);
            })
            .join('');

        container.innerHTML = html;

        container.querySelectorAll('.opportunity-card').forEach((card) => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.id;
                if (id && !e.target.closest('.btn')) {
                    navigateOpportunity('/opportunities/' + id);
                }
            });
        });

    } catch (error) {
        console.error('Error loading opportunities:', error);
        if (summaryEl) summaryEl.textContent = '';
        container.innerHTML = renderOppEmpty({
            title: 'Could not load opportunities',
            bodyHtml: 'Something went wrong. Check your connection and try again.',
            iconClass: 'ph-duotone ph-warning-circle',
            actionsHtml: '<button type="button" class="btn btn-secondary btn-sm" id="opp-retry-btn">Try again</button>'
        });
        document.getElementById('opp-retry-btn')?.addEventListener('click', () => loadOpportunities());
    } finally {
        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('#opportunities-summary', 'opportunities');
        }
    }
}

function updateCategoryCounts(counts) {
    const mineCount = document.getElementById('count-mine');
    const appliedCount = document.getElementById('count-applied');
    const availableCount = document.getElementById('count-available');

    if (mineCount) mineCount.textContent = counts.mine;
    if (appliedCount) appliedCount.textContent = legacyApplicationUiVisible() ? counts.applied : '0';
    if (availableCount) availableCount.textContent = counts.available;
}

function getCategoryClass(category) {
    const classMap = {
        mine: 'category-mine',
        applied: 'category-applied',
        available: 'category-available'
    };
    return classMap[category] || '';
}

function getCategoryLabel(category) {
    const labelMap = {
        mine: 'My opportunity',
        applied: 'Applied',
        available: ''
    };
    return labelMap[category] || '';
}

function getCategoryIcon(category) {
    const iconMap = {
        mine: 'ph-duotone ph-user-circle',
        applied: 'ph-duotone ph-paper-plane-tilt',
        available: ''
    };
    return iconMap[category] || '';
}

function formatModelType(modelType) {
    const types = {
        project_based: 'Project-based',
        strategic_partnership: 'Strategic partnership',
        resource_pooling: 'Resource pooling',
        hiring: 'Hiring',
        competition: 'Competition'
    };
    return types[modelType] || modelType;
}

function formatSubModelType(subModelType) {
    const types = {
        task_based: 'Task-based',
        milestone_based: 'Milestone-based',
        retainer: 'Retainer',
        joint_venture: 'Joint venture',
        consortium: 'Consortium',
        strategic_alliance: 'Strategic alliance',
        equipment_sharing: 'Equipment sharing',
        facility_sharing: 'Facility sharing',
        talent_pooling: 'Talent pooling',
        full_time: 'Full-time',
        part_time: 'Part-time',
        contract: 'Contract',
        innovation_challenge: 'Innovation challenge',
        hackathon: 'Hackathon',
        pitch_competition: 'Pitch competition',
        professional_hiring: 'Professional hiring',
        consultant_hiring: 'Consultant hiring',
        competition_rfp: 'Competition / RFP',
        bulk_purchasing: 'Bulk purchasing',
        resource_sharing: 'Resource sharing',
        strategic_jv: 'Strategic JV',
        project_jv: 'Project JV',
        spv: 'SPV',
        mentorship: 'Mentorship'
    };
    return types[subModelType] || subModelType;
}

function formatApplicationStatus(status) {
    const statusMap = {
        pending: 'Pending review',
        reviewing: 'Under review',
        shortlisted: 'Shortlisted',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn'
    };
    return statusMap[status] || status;
}

function getApplicationStatusClass(status) {
    const classMap = {
        pending: 'status-pending',
        reviewing: 'status-reviewing',
        shortlisted: 'status-shortlisted',
        accepted: 'status-accepted',
        rejected: 'status-rejected',
        withdrawn: 'status-withdrawn'
    };
    return classMap[status] || '';
}
