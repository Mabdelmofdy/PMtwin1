/**
 * Dashboard Component
 */

function humanizeUnderscores(value) {
    if (value == null || value === '') return '';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toMatchScorePercent(score) {
    return Math.min(100, Math.round((Number(score) || 0) * 100));
}

function legacyApplicationUiVisible() {
    return !!(typeof CONFIG !== 'undefined'
        && CONFIG.PRODUCT_FLAGS
        && CONFIG.PRODUCT_FLAGS.SHOW_LEGACY_APPLICATIONS === true);
}

function hideLegacyApplicationDashboardSurfaces() {
    if (legacyApplicationUiVisible()) return;
    document.querySelectorAll('.dash-stat-card[data-route="/pipeline/applications"]').forEach((el) => {
        el.style.display = 'none';
    });
    const recentAppSection = document.getElementById('recent-applications')?.closest('section');
    if (recentAppSection) recentAppSection.style.display = 'none';
    const appsReceived = document.getElementById('applications-received-section');
    if (appsReceived) appsReceived.style.display = 'none';
}

function setupDashboardRefreshListener(user, isCompanyView) {
    if (window.__pmtwinDashboardRefreshBound) return;
    window.__pmtwinDashboardRefreshBound = true;
    const refresh = async () => {
        if (!document.querySelector('.dashboard-page')) return;
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        const isCompany = isCompanyView || (authService.isCompanyUser && authService.isCompanyUser());
        try {
            await loadDashboardData(currentUser.id);
            await loadPostMatchDashboard(currentUser.id, isCompany);
            if (isCompany && legacyApplicationUiVisible()) loadApplicationsReceived(currentUser.id);
        } catch (err) {
            console.error('Dashboard refresh failed:', err);
        }
    };
    ['pmtwin:notifications-updated', 'pmtwin:messages-updated', 'pmtwin:post-matches-updated', 'pmtwin:deals-updated', 'pmtwin:data-changed',
        'pmtwin:opportunities-updated', 'pmtwin:applications-updated']
        .forEach((eventName) => window.addEventListener(eventName, () => { void refresh(); }));
}

async function initDashboard(params) {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    const isCompanyView = params?.view === 'company';
    setupDashboardRefreshListener(user, isCompanyView);
    hideLegacyApplicationDashboardSurfaces();
    const dashboardPage = document.querySelector('.dashboard-page');
    if (dashboardPage) {
        dashboardPage.classList.toggle('dashboard-page--company', isCompanyView);
        dashboardPage.classList.toggle('dashboard-page--individual', !isCompanyView);
    }
    const headerMount = document.getElementById('page-context-header-mount');
    if (headerMount && typeof window.pageContextHeader !== 'undefined') {
        const name = user.profile?.name || user.email;
        if (isCompanyView) {
            window.pageContextHeader.mount(headerMount, {
                label: 'Company Workspace',
                title: 'Company Dashboard',
                description:
                    'Post opportunities, review Post-matches, and connect with matched professionals for projects, BIM, and delivery.',
                primaryAction: {
                    label: 'Post Opportunity',
                    route: CONFIG.ROUTES.OPPORTUNITY_CREATE,
                    class: 'btn btn-primary dashboard-primary-action'
                },
                secondaryAction: {
                    label: 'Browse Talent',
                    route: CONFIG.ROUTES.PEOPLE,
                    class: 'btn btn-secondary dashboard-secondary-action'
                }
            });
        } else {
            window.pageContextHeader.mount(headerMount, {
                label: 'Workspace',
                title: 'Dashboard',
                descriptionHtml:
                    'Welcome back, <span class="page-context-header__accent">' +
                    escDash(name) +
                    '</span>. Track opportunities, Post-matches, and pipeline progress.',
                primaryAction: {
                    label: 'Create opportunity',
                    route: CONFIG.ROUTES.OPPORTUNITY_CREATE,
                    class: 'btn btn-primary dashboard-primary-action'
                },
                secondaryAction: {
                    label: 'Browse opportunities',
                    route: CONFIG.ROUTES.OPPORTUNITIES,
                    class: 'btn btn-secondary dashboard-secondary-action'
                }
            });
        }
    }
    const statOppCard = document.querySelector('.dash-stats .dash-stat-card');
    if (statOppCard) {
        statOppCard.setAttribute('data-route', isCompanyView ? CONFIG.ROUTES.OPPORTUNITIES : '/pipeline');
    }
    const oppLabel = document.getElementById('stat-opportunities-label');
    if (oppLabel) oppLabel.textContent = isCompanyView ? 'Posted opportunities' : 'My opportunities';
    const appLabel = document.getElementById('stat-applications-label');
    if (appLabel) appLabel.textContent = isCompanyView ? 'Applications sent' : 'Applications';
    const createActions = document.querySelectorAll('.dashboard-primary-action, .dashboard-actions a[data-route="/opportunities/create"]');
    createActions.forEach(action => {
        action.textContent = isCompanyView ? 'Post opportunity' : 'Create opportunity';
    });
    const browseActions = document.querySelectorAll('.dashboard-secondary-action, .dashboard-actions a[data-route="/opportunities"]');
    browseActions.forEach(action => {
        action.textContent = isCompanyView ? 'Browse talent' : 'Browse opportunities';
        if (isCompanyView) action.setAttribute('data-route', '/people');
        else action.setAttribute('data-route', '/opportunities');
    });

    await loadDashboardData(user.id);

    // Profile completeness (show when < 100%)
    const completenessEl = document.getElementById('dashboard-profile-completeness');
    const completenessBar = document.getElementById('dashboard-completeness-bar');
    const completenessPercent = document.getElementById('dashboard-completeness-percent');
    if (typeof profileCompletion !== 'undefined' && completenessEl && completenessBar && completenessPercent) {
        const result = profileCompletion.getProfileCompletion(user);
        completenessBar.style.width = result.percent + '%';
        completenessPercent.textContent = result.percent + '%';
        const ariaBar = document.getElementById('dashboard-completeness-bar-aria');
        if (ariaBar) ariaBar.setAttribute('aria-valuenow', String(result.percent));
        completenessEl.style.display = result.percent < 100 ? 'flex' : 'none';
    }

    // Show verification reminder for unverified professionals/consultants
    const unverifiedReminder = document.getElementById('dashboard-unverified-reminder');
    if (unverifiedReminder) {
        const isIndividual = user.role === CONFIG.ROLES.PROFESSIONAL || user.role === CONFIG.ROLES.CONSULTANT;
        const verificationStatus = user.profile?.verificationStatus;
        const vettingSkipped = user.profile?.vettingSkippedAtRegistration === true;
        const showReminder = isIndividual && (verificationStatus === CONFIG.VERIFICATION_STATUS.UNVERIFIED || (vettingSkipped && !verificationStatus));
        unverifiedReminder.style.display = showReminder ? 'block' : 'none';
    }

    const recSection = document.getElementById('recommended-opportunities-section');
    if (recSection) recSection.style.display = 'none';

    const isCompany = isCompanyView || (authService.isCompanyUser && authService.isCompanyUser());
    await loadPostMatchDashboard(user.id, isCompany);
    if (isCompany && legacyApplicationUiVisible()) {
        loadApplicationsReceived(user.id);
    }

    // Read-only demo: disable Create Opportunity for pending users
    if (authService.isPendingApproval && authService.isPendingApproval()) {
        document.querySelectorAll('a[data-route="/opportunities/create"]').forEach(link => {
            link.removeAttribute('data-route');
            link.href = '#';
            link.setAttribute('title', 'Action disabled until your account is approved.');
            link.classList.add('opacity-75', 'cursor-not-allowed', 'pointer-events-none');
        });
    }
}

async function loadDashboardData(userId) {
    try {
        // Load opportunities
        const allOpportunities = await dataService.getOpportunities();
        const userOpportunities = allOpportunities.filter(o => o.creatorId === userId);
        document.getElementById('stat-opportunities').textContent = userOpportunities.length;
        
        // Load applications (legacy UI only)
        if (legacyApplicationUiVisible()) {
            const allApplications = await dataService.getApplications();
            const userApplications = allApplications.filter(a => a.applicantId === userId);
            const statApplicationsEl = document.getElementById('stat-applications');
            if (statApplicationsEl) statApplicationsEl.textContent = userApplications.length;
            await displayRecentApplications(userApplications.slice(0, 5));
        }
        
        // Load matches (post_matches only)
        const postMatchesForUser = await fetchUserPostMatches(userId);
        const buckets = categorizeUserPostMatches(postMatchesForUser, userId);
        const statMatchesEl = document.getElementById('stat-matches');
        if (statMatchesEl) statMatchesEl.textContent = buckets.all.length;
        const statHint = document.querySelector('.dash-stat-card[data-route="/matches"] .dash-stat-hint');
        if (statHint) {
            const actionN = buckets.actionRequired.length;
            statHint.textContent = actionN > 0
                ? `${actionN} need${actionN === 1 ? '' : 's'} your response`
                : 'Need/Offer fits';
        }
        
        // Load notifications
        const notifications = await dataService.getNotifications(userId);
        const unreadCount = notifications.filter(n => !n.read).length;
        document.getElementById('stat-notifications').textContent = unreadCount;
        
        // Display recent opportunities
        await displayRecentOpportunities(userOpportunities.slice(0, 5));
        
        // Sample opportunities to explore (when user has no applications, or always show if any)
        const sampleOpps = allOpportunities.filter(o => o.isSample === true && o.status === 'published');
        const sampleSection = document.getElementById('sample-opportunities-dashboard');
        const sampleList = document.getElementById('sample-opportunities-dashboard-list');
        if (sampleSection && sampleList && sampleOpps.length > 0) {
            sampleSection.style.display = 'block';
            sampleList.innerHTML = sampleOpps.map(opp => `
                <a href="#" data-route="/opportunities/${opp.id}" class="dash-sample-chip">${escDash((opp.title || 'Opportunity').substring(0, 48))}${(opp.title || '').length > 48 ? '…' : ''}</a>
            `).join('');
        } else if (sampleSection) {
            sampleSection.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function displayRecentOpportunities(opportunities) {
    const container = document.getElementById('recent-opportunities');
    if (!container) return;
    
    if (opportunities.length === 0) {
        container.innerHTML = `
            <div class="dash-empty-inline">
                <div class="dash-empty-icon" aria-hidden="true"></div>
                <h3 class="dash-empty-title">No opportunities yet</h3>
                <p class="dash-empty-text">Create a posting to attract partners for BIM, design, or field work.</p>
                <a href="#" data-route="/opportunities/create" class="btn btn-primary btn-sm">Post opportunity</a>
            </div>
        `;
        return;
    }
    
    // Load template
    const template = await templateLoader.load('opportunity-card');
    
    // Render each opportunity
    const html = opportunities.map(opp => {
        const sb = window.statusBadgeSystem;
        const data = {
            ...opp,
            intentLabel: opp.intent === 'offer' ? 'Offer' : 'Need',
            intentBadgeClass: typeof getIntentBadgeClass === 'function' ? getIntentBadgeClass(opp.intent, opp.modelType) : 'badge-intent-request-default',
            statusBadgeClass: sb ? sb.getStatusBadgeClass(opp.status, 'opportunity') : 'badge--neutral',
            createdDate: formatDashboardDate(opp.createdAt),
            modelTypeBadgeClass: sb ? sb.getModelTypeBadgeClass(opp.modelType, opp.subModelType) : 'badge--info',
            subModelBadgeClass: sb ? sb.getModelTypeBadgeClass(opp.modelType, opp.subModelType) : 'badge--neutral',
            modelTypeLabel: humanizeUnderscores(opp.modelType),
            statusLabel: sb ? sb.getStatusLabel(opp.status, 'opportunity') : humanizeUnderscores(opp.status),
            subModelTypeLabel: opp.subModelType ? humanizeUnderscores(opp.subModelType) : '',
            description: opp.description || 'No description',
            isOwner: true,
            canApply: false
        };
        return templateRenderer.render(template, data);
    }).join('');
    
    container.innerHTML = html;
}

async function displayRecentApplications(applications) {
    const container = document.getElementById('recent-applications');
    if (!container) return;

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="dash-empty-inline">
                <div class="dash-empty-icon dash-empty-icon--users" aria-hidden="true"></div>
                <h3 class="dash-empty-title">No applications yet</h3>
                <p class="dash-empty-text">When you apply to roles, they will appear here with status and fit scores.</p>
                <a href="#" data-route="/opportunities" class="btn btn-primary btn-sm">Browse opportunities</a>
            </div>
        `;
        return;
    }

    const appsWithOpps = await Promise.all(
        applications.map(async (app) => {
            const opportunity = await dataService.getOpportunityById(app.opportunityId);
            let negotiation = null;
            if (app.negotiationId && typeof dataService.getNegotiationById === 'function') {
                negotiation = await dataService.getNegotiationById(app.negotiationId);
            }
            return { ...app, opportunity, negotiation };
        })
    );

    const html = appsWithOpps.map((app) => {
        const av = app.application_value;
        const valueScorePct = av?.value_score != null ? Math.round(av.value_score * 100) : null;
        const status = normalizeApplicationStatus(app.status);
        const sb = window.statusBadgeSystem;
        const statusBadgeClass = sb ? sb.getStatusBadgeClass(status, 'application') : 'badge--neutral';
        const statusText = sb ? sb.getStatusLabel(status, 'application') : formatApplicationStatus(status);
        const dateStr = formatDashboardDate(app.createdAt);
        const oppTitle = app.opportunity?.title || 'Opportunity';
        const matchHtml = valueScorePct != null
            ? `<span class="dash-match-pill">${valueScorePct}% compatibility</span>`
            : '';
        const cta = getApplicationDashboardAction(app);
        return `<article class="dash-recent-app">
            <div class="dash-recent-app-main">
                <h3 class="dash-recent-app-title">${escDash(oppTitle)}</h3>
                <div class="dash-recent-app-pills">
                    <span class="badge ${statusBadgeClass}">${escDash(statusText)}</span>
                    ${matchHtml}
                </div>
                <div class="dash-recent-app-meta">${escDash(dateStr)}</div>
            </div>
            <div class="dash-recent-app-actions">
                <a href="#" data-route="${escDash(cta.route)}" class="btn btn-primary btn-sm">${escDash(cta.label)}</a>
            </div>
        </article>`;
    }).join('');

    container.innerHTML = html;
}

function escDash(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}


const DASHBOARD_MATCH_EMPTY =
    'No matches yet. Publish a Need or Offer to start matching.';

async function fetchUserPostMatches(userId) {
    if (!dataService.getPostMatchesForUser) return [];
    return dataService.getPostMatchesForUser(userId);
}

function normalizePostMatchStatus(pm) {
    const raw = String(pm?.status || 'discovered').toLowerCase();
    const umv = window.unifiedMatchViewModel;
    if (umv && typeof umv.normalizeAggregateMatchStatus === 'function') {
        return umv.normalizeAggregateMatchStatus(raw);
    }
    if (raw === (CONFIG.POST_MATCH_STATUS?.PENDING || 'pending')) {
        return CONFIG.POST_MATCH_STATUS?.DISCOVERED || 'discovered';
    }
    return raw;
}

function getPostMatchStatusDisplayLabel(pm) {
    const key = normalizePostMatchStatus(pm);
    if (window.statusBadgeSystem && typeof window.statusBadgeSystem.getStatusLabel === 'function') {
        return window.statusBadgeSystem.getStatusLabel(key, 'match');
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function isPostMatchInactive(pm) {
    const st = normalizePostMatchStatus(pm);
    return st === 'declined' || st === 'expired';
}

function isPostMatchExpired(pm) {
    if (isPostMatchInactive(pm)) return true;
    if (dataService && typeof dataService.isExpired === 'function' && dataService.isExpired(pm)) {
        return true;
    }
    return false;
}

function allParticipantsAccepted(pm) {
    const parts = pm.participants || [];
    return parts.length > 0 && parts.every(p => (p.participantStatus || 'pending') === 'accepted');
}

function userNeedsMatchAction(pm, userId) {
    if (isPostMatchExpired(pm)) return false;
    const st = normalizePostMatchStatus(pm);
    const discovered = CONFIG.POST_MATCH_STATUS?.DISCOVERED || 'discovered';
    const pending = CONFIG.POST_MATCH_STATUS?.PENDING || 'pending';
    const accepted = CONFIG.POST_MATCH_STATUS?.ACCEPTED || 'accepted';
    if (st !== discovered && st !== pending && st !== accepted) return false;
    const me = (pm.participants || []).find(p => p.userId === userId);
    return !!me && (me.participantStatus || 'pending') === 'pending';
}

function isConfirmedPostMatch(pm) {
    const st = normalizePostMatchStatus(pm);
    const confirmed = CONFIG.POST_MATCH_STATUS?.CONFIRMED || 'confirmed';
    const accepted = CONFIG.POST_MATCH_STATUS?.ACCEPTED || 'accepted';
    return st === confirmed || (st === accepted && allParticipantsAccepted(pm));
}

function isReadyForDealPostMatch(pm) {
    if (pm.dealId) return false;
    if (isPostMatchExpired(pm)) return false;
    const st = normalizePostMatchStatus(pm);
    const confirmed = CONFIG.POST_MATCH_STATUS?.CONFIRMED || 'confirmed';
    if (st === confirmed) return true;
    const accepted = CONFIG.POST_MATCH_STATUS?.ACCEPTED || 'accepted';
    return st === accepted && allParticipantsAccepted(pm);
}

function categorizeUserPostMatches(postMatches, userId) {
    const all = postMatches.filter(pm => !isPostMatchInactive(pm));
    const actionRequired = all.filter(pm => userNeedsMatchAction(pm, userId));
    const confirmed = all.filter(pm => isConfirmedPostMatch(pm));
    const readyForDeal = all.filter(pm => isReadyForDealPostMatch(pm));
    const topByScore = [...all].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const recent = [...all].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    return { all, actionRequired, confirmed, readyForDeal, topByScore, recent };
}

async function getPostMatchDashboardLabel(pm, userId) {
    const vm = await buildPostMatchViewModel(pm, userId);
    return getMatchCardTitle(vm) || getMatchTypeLabel(pm.matchType);
}

async function renderDashboardMatchBucketRow(pm, userId) {
    const label = await getPostMatchDashboardLabel(pm, userId);
    const score = toMatchScorePercent(pm.matchScore);
    const typeLabel = getMatchTypeLabel(pm.matchType);
    const statusLabel = getPostMatchStatusDisplayLabel(pm);
    return `<a href="#" data-route="/matches/${escDash(pm.id)}" class="dashboard-match-bucket-chip">
        <div class="dashboard-match-bucket-chip__main">
            <div class="dashboard-match-bucket-chip__label">${escDash(label)}</div>
            <div class="dashboard-match-bucket-chip__meta">${escDash(typeLabel)} · ${escDash(statusLabel)}</div>
        </div>
        <span class="dashboard-match-bucket-chip__score">${score}%</span>
    </a>`;
}

async function renderDashboardBuckets(buckets, userId) {
    const container = document.getElementById('dashboard-match-buckets');
    if (!container) return;
    if (!buckets.all.length) {
        container.hidden = true;
        container.innerHTML = '';
        return;
    }
    const sections = [
        { key: 'actionRequired', title: 'Discovered — action required', items: buckets.actionRequired.slice(0, 3) },
        { key: 'readyForDeal', title: 'Ready to start a deal', items: buckets.readyForDeal.slice(0, 3) },
        { key: 'confirmed', title: 'Confirmed matches', items: buckets.confirmed.slice(0, 3) },
        { key: 'topByScore', title: 'Top matches', items: buckets.topByScore.slice(0, 3) }
    ];
    const parts = [];
    for (const sec of sections) {
        if (!sec.items.length) continue;
        const rows = await Promise.all(sec.items.map(pm => renderDashboardMatchBucketRow(pm, userId)));
        parts.push(`<div class="dashboard-match-bucket" data-bucket="${sec.key}">
            <h3 class="dashboard-match-bucket__title">${escDash(sec.title)}</h3>
            <div class="dashboard-match-bucket__list">${rows.join('')}</div>
        </div>`);
    }
    container.innerHTML = parts.join('');
    container.hidden = parts.length === 0;
}

async function loadPostMatchDashboard(userId, isCompany) {
    const section = document.getElementById('your-matches-section');
    const list = document.getElementById('your-matches-list');
    const emptyEl = document.getElementById('dashboard-matches-empty');
    const summaryEl = document.getElementById('matches-results-summary');
    if (!section || !list) return;

    if (!dataService.getPostMatchesForUser) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    try {
        const postMatches = await fetchUserPostMatches(userId);
        const buckets = categorizeUserPostMatches(postMatches, userId);

        if (isCompany) {
            await loadCompanyPostMatchRecommendations(userId, buckets);
        } else {
            const companyRec = document.getElementById('company-recommendations-section');
            if (companyRec) companyRec.style.display = 'none';
        }

        const hasMatches = buckets.all.length > 0;
        const filterSidebar = document.querySelector('#your-matches-section .matches-filter-sidebar');
        const filterBackdrop = document.querySelector('#your-matches-section .matches-filter-backdrop');
        const filterToggle = document.getElementById('matches-filter-toggle');
        if (filterSidebar) filterSidebar.style.display = hasMatches ? '' : 'none';
        if (filterBackdrop) filterBackdrop.style.display = 'none';
        if (filterToggle) filterToggle.style.display = hasMatches ? '' : 'none';
        if (emptyEl) emptyEl.hidden = hasMatches;
        if (summaryEl) {
            summaryEl.textContent = hasMatches
                ? `Recent post matches · ${buckets.recent.length} total`
                : '';
            summaryEl.hidden = !hasMatches;
        }

        await renderDashboardBuckets(buckets, userId);

        if (!hasMatches) {
            list.innerHTML = '';
            return;
        }

        if (!list.dataset.matchActionsBound) {
            list.dataset.matchActionsBound = '1';
            list.addEventListener('click', async (e) => {
                const accept = e.target.closest('.btn-accept-match');
                const decline = e.target.closest('.btn-decline-match');
                if ((accept || decline) && e.target.tagName !== 'A') {
                    e.preventDefault();
                    const matchId = (accept || decline).getAttribute('data-match-id');
                    const actions = window.postMatchListActions;
                    if (!matchId || !actions) return;
                    const btn = accept || decline;
                    btn.disabled = true;
                    try {
                        const result = accept
                            ? await actions.acceptPostMatchFromList(matchId, userId, dataService)
                            : await actions.declinePostMatchFromList(matchId, userId, dataService);
                        if (result.cancelled) return;
                        actions.notifyListResult(result);
                        if (result.navigateTo) {
                            actions.navigateIfNeeded(result);
                            return;
                        }
                        if (result.ok) await loadPostMatchDashboard(userId, isCompany);
                        else if (!result.ok && result.message) actions.notifyListResult(result);
                    } catch (err) {
                        console.error('Dashboard match action error:', err);
                    } finally {
                        btn.disabled = false;
                    }
                }
            });
        }

        const forList = buckets.recent.length ? buckets.recent : buckets.topByScore;
        await renderYourMatchesList(list, userId, forList.slice(0, 12));

        if (window.seedStorageIndicator) {
            void window.seedStorageIndicator.syncPageHint('#matches-results-summary', 'post_matches');
        }
    } catch (e) {
        console.error('Error loading post-match dashboard:', e);
        if (emptyEl) emptyEl.hidden = false;
    }
}

async function loadCompanyPostMatchRecommendations(companyId, buckets) {
    const section = document.getElementById('company-recommendations-section');
    const list = document.getElementById('company-recommendations-list');
    const emptyEl = document.getElementById('company-recommendations-empty');
    if (!section || !list) return;

    const showEmpty = (html) => {
        list.innerHTML = '';
        if (emptyEl) {
            emptyEl.innerHTML = html;
            emptyEl.style.display = 'block';
        }
    };
    const hideEmpty = () => {
        if (emptyEl) {
            emptyEl.innerHTML = '';
            emptyEl.style.display = 'none';
        }
    };

    section.style.display = 'block';

    try {
        const oneWayAsNeedOwner = buckets.topByScore.filter(pm => {
            if (pm.matchType !== 'one_way') return false;
            const me = (pm.participants || []).find(p => p.userId === companyId);
            return me?.role === 'need_owner';
        });

        if (oneWayAsNeedOwner.length === 0) {
            showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-users-three"></i></div>
                <h3>No post matches yet</h3>
                <p>${escDash(DASHBOARD_MATCH_EMPTY)}</p>
                <a href="#" data-route="/opportunities/create" class="btn btn-primary">Publish Need or Offer</a>`);
            return;
        }

        const rows = [];
        for (const pm of oneWayAsNeedOwner.slice(0, 5)) {
            const provider = (pm.participants || []).find(p => p.role === 'offer_provider');
            const providerId = provider?.userId;
            if (!providerId) continue;
            const user = await dataService.getUserById(providerId)
                || await dataService.getCompanyById(providerId);
            if (!user) continue;
            const payload = pm.payload || {};
            const needOpp = payload.needOpportunityId
                ? await dataService.getOpportunityById(payload.needOpportunityId)
                : null;
            const prof = user.profile || {};
            const scorePercent = toMatchScorePercent(pm.matchScore);
            rows.push(`<div class="company-compact-item">
                <div class="company-avatar">${escDash((prof.name || user.email || '?')[0])}</div>
                <div class="company-compact-main">
                    <div class="company-compact-topline">
                        <div class="company-compact-title">${escDash(prof.name || user.email)}</div>
                        <span class="company-score-pill">${scorePercent}%</span>
                    </div>
                    <div class="company-compact-meta">${escDash(prof.title || user.role || '')} &middot; ${escDash(needOpp?.title || 'Your need')}</div>
                    <a href="#" data-route="/matches/${escDash(pm.id)}" class="dash-inline-link">View match</a>
                </div>
            </div>`);
        }

        if (!rows.length) {
            showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-magnifying-glass"></i></div>
                <h3>No provider matches yet</h3>
                <p>${escDash(DASHBOARD_MATCH_EMPTY)}</p>
                <a href="#" data-route="/opportunities/create" class="btn btn-primary">Publish Need or Offer</a>`);
            return;
        }

        hideEmpty();
        list.innerHTML = rows.join('');
    } catch (e) {
        console.error('Error loading company post-match recommendations:', e);
        showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-warning-circle"></i></div>
            <h3>Could not load matches</h3>
            <p>Refresh the page or try again shortly.</p>`);
    }
}

/**
 * Get viewer role for a one_way post-match (from participants).
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

/**
 * Build view model for a post-match card (resolves opportunity titles and names).
 * For one_way, includes role-based title, section labels, and actions per viewer.
 */
function firstOtherParticipantUserId(postMatch, currentUserId) {
    const other = (postMatch.participants || []).find(p => p.userId && p.userId !== currentUserId);
    return other?.userId || '';
}

function buildMatchMessageRoute(otherUserId) {
    return otherUserId ? '/messages/' + otherUserId : null;
}

function resolveDashboardMessageRoute(match) {
    const route = match.messageRoute;
    if (route && String(route).startsWith('/messages/') && route.length > '/messages/'.length) {
        return route;
    }
    return match.otherUserId ? '/messages/' + match.otherUserId : null;
}

async function buildPostMatchViewModel(postMatch, currentUserId) {
    const ds = dataService;
    const scorePct = toMatchScorePercent(postMatch.matchScore);
    const base = {
        id: postMatch.id,
        matchType: postMatch.matchType,
        matchScore: postMatch.matchScore,
        matchScorePercent: scorePct,
        status: postMatch.status,
        tierLabel: postMatch.matchScore >= 0.85 ? 'Top match' : postMatch.matchScore >= 0.70 ? 'High match' : 'New match',
        canRespond: userNeedsMatchAction(postMatch, currentUserId)
    };
    const payload = postMatch.payload || {};

    if (postMatch.matchType === 'one_way') {
        const needOpp = await ds.getOpportunityById(payload.needOpportunityId);
        const offerOpp = await ds.getOpportunityById(payload.offerOpportunityId);
        const needTitle = needOpp?.title || 'Need';
        const offerTitle = offerOpp?.title || 'Offer';
        const otherUserId = firstOtherParticipantUserId(postMatch, currentUserId);
        const needOpportunityId = payload.needOpportunityId || '';
        const offerOpportunityId = payload.offerOpportunityId || '';
        const { isNeedOwner } = getOneWayViewerRole(postMatch, currentUserId);
        const cardTitle = isNeedOwner ? 'Need/Offer Match Found' : 'Need/Offer Match Found';
        const section1Label = isNeedOwner ? 'Your Need' : 'Opportunity Need';
        const section2Label = isNeedOwner ? 'Provider Offer' : 'Your Offer';
        let primaryActionLabel, primaryActionRoute, secondaryActionLabel, secondaryActionRoute, tertiaryActionLabel, tertiaryActionRoute;
        if (isNeedOwner) {
            primaryActionLabel = 'View Provider';
            primaryActionRoute = '/opportunities/' + offerOpportunityId;
            if (legacyApplicationUiVisible()) {
                secondaryActionLabel = 'Invite to Apply';
                secondaryActionRoute = '/opportunities/' + offerOpportunityId;
            } else {
                secondaryActionLabel = 'View Offer';
                secondaryActionRoute = '/opportunities/' + offerOpportunityId;
            }
            tertiaryActionLabel = 'Message Provider';
            tertiaryActionRoute = '/messages/' + otherUserId;
        } else {
            primaryActionLabel = 'View Opportunity';
            primaryActionRoute = '/opportunities/' + needOpportunityId;
            if (legacyApplicationUiVisible()) {
                secondaryActionLabel = 'Apply to Opportunity';
                secondaryActionRoute = '/opportunities/' + needOpportunityId;
            } else {
                secondaryActionLabel = 'View Need';
                secondaryActionRoute = '/opportunities/' + needOpportunityId;
            }
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
            tertiaryActionRoute,
            messageRoute: buildMatchMessageRoute(otherUserId),
            skills: extractMatchSkills(needOpp, offerOpp),
            searchText: [cardTitle, needTitle, offerTitle].join(' ')
        };
    }

    if (postMatch.matchType === 'two_way') {
        const sideA = payload.sideA || {};
        const sideB = payload.sideB || {};
        const isA = sideA.userId === currentUserId;
        const myNeedId = isA ? sideA.needId : sideB.needId;
        const myOfferId = isA ? sideA.offerId : sideB.offerId;
        const theirNeedId = isA ? sideB.needId : sideA.needId;
        const theirOfferId = isA ? sideB.offerId : sideA.offerId;
        const myNeed = myNeedId ? await ds.getOpportunityById(myNeedId) : null;
        const myOffer = myOfferId ? await ds.getOpportunityById(myOfferId) : null;
        const theirNeed = theirNeedId ? await ds.getOpportunityById(theirNeedId) : null;
        const theirOffer = theirOfferId ? await ds.getOpportunityById(theirOfferId) : null;
        const otherUserId = isA ? (sideB.userId || '') : (sideA.userId || '');
        const twoWayOtherId = otherUserId || firstOtherParticipantUserId(postMatch, currentUserId);
        return {
            ...base,
            yourNeedTitle: myNeed?.title || 'Your need',
            yourOfferTitle: myOffer?.title || 'Your offer',
            theirNeedTitle: theirNeed?.title || 'Their need',
            theirOfferTitle: theirOffer?.title || 'Their offer',
            valueEquivalence: payload.valueEquivalence || '',
            otherUserId: twoWayOtherId,
            messageRoute: buildMatchMessageRoute(twoWayOtherId),
            skills: extractMatchSkills(myNeed, myOffer, theirNeed, theirOffer),
            searchText: [myNeed?.title, myOffer?.title, theirNeed?.title, theirOffer?.title, payload.valueEquivalence].filter(Boolean).join(' ')
        };
    }

    if (postMatch.matchType === 'consortium') {
        const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
        const projectTitle = leadOpp?.title || 'Opportunity';
        const roles = (payload.roles || []).map(async (r) => {
            const user = await ds.getUserOrCompanyById(r.userId);
            return { role: r.role || 'Partner', partnerName: user?.profile?.name || r.userId };
        });
        const rolesResolved = await Promise.all(roles);
        const otherUserId = firstOtherParticipantUserId(postMatch, currentUserId);
        return {
            ...base,
            projectTitle,
            roles: rolesResolved,
            otherUserId,
            messageRoute: buildMatchMessageRoute(otherUserId),
            skills: extractMatchSkills(leadOpp),
            searchText: [projectTitle, ...rolesResolved.map(r => r.partnerName), ...rolesResolved.map(r => r.role)].join(' ')
        };
    }

    if (postMatch.matchType === 'circular') {
        const cycle = payload.cycle || [];
        const links = payload.links || [];
        const myIdx = cycle.indexOf(currentUserId);
        const youGiveLink = links.find(l => (l.fromCreatorId || l.from) === currentUserId);
        const youReceiveLink = links.find(l => (l.toCreatorId || l.to) === currentUserId);
        const youGiveOpp = youGiveLink?.offerId ? await ds.getOpportunityById(youGiveLink.offerId) : null;
        const youReceiveNeedOpp = youReceiveLink?.needId ? await ds.getOpportunityById(youReceiveLink.needId) : null;
        const names = await Promise.all(cycle.map(uid => ds.getUserOrCompanyById(uid).then(u => u?.profile?.name || uid)));
        const cycleLabel = cycle.map((uid, i) => (uid === currentUserId ? 'You' : (names[i] || uid))).join(' → ') + ' → You';
        const otherUserId = firstOtherParticipantUserId(postMatch, currentUserId);
        return {
            ...base,
            cycleLabel,
            youGiveTitle: youGiveOpp?.title || 'Your offer',
            youReceiveTitle: youReceiveNeedOpp ? `Need: ${youReceiveNeedOpp.title}` : 'Their need',
            otherUserId,
            messageRoute: buildMatchMessageRoute(otherUserId),
            skills: extractMatchSkills(youGiveOpp, youReceiveNeedOpp),
            searchText: [cycleLabel, youGiveOpp?.title, youReceiveNeedOpp?.title].filter(Boolean).join(' ')
        };
    }

    return base;
}

async function renderYourMatchesList(container, userId, postMatches) {
    const viewModels = [];
    for (const pm of postMatches) {
        viewModels.push(await buildPostMatchViewModel(pm, userId));
    }

    const state = {
        type: 'all',
        quality: '',
        skill: '',
        search: ''
    };

    setupMatchFilterPanel(viewModels, state, () => renderFilteredMatches(container, viewModels, state));
    renderFilteredMatches(container, viewModels, state);
}

function setupMatchFilterPanel(matches, state, onChange) {
    const sidebar = document.getElementById('matches-filter-sidebar');
    const backdrop = document.getElementById('matches-filter-backdrop');
    const openBtn = document.getElementById('matches-filter-toggle');
    const closeBtn = document.getElementById('matches-filter-close');
    const searchInput = document.getElementById('matches-search-input');
    const typeFilters = document.getElementById('matches-type-filters');
    const qualityFilters = document.getElementById('matches-quality-filters');
    const skillFilters = document.getElementById('matches-skill-filters');
    const clearBtn = document.getElementById('matches-clear-filters');

    const counts = matches.reduce((acc, match) => {
        acc.all += 1;
        acc[match.matchType] = (acc[match.matchType] || 0) + 1;
        return acc;
    }, { all: 0 });
    document.querySelectorAll('#matches-type-filters [data-count]').forEach(el => {
        const key = el.getAttribute('data-count');
        el.textContent = counts[key] || 0;
    });

    const skills = [...new Set(matches.flatMap(match => match.skills || []))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    if (skillFilters) {
        skillFilters.innerHTML = skills.length
            ? skills.map(skill => `<button type="button" class="matches-skill-choice" data-skill="${escDash(skill)}"><span class="matches-skill-circle"></span><span class="matches-skill-name">${escDash(skill)}</span></button>`).join('')
            : '<span class="matches-filter-empty">No skills available</span>';
    }

    const setMobileOpen = (isOpen) => {
        document.body.classList.toggle('matches-filter-open', isOpen);
        if (sidebar) sidebar.classList.toggle('is-open', isOpen);
        if (backdrop) backdrop.classList.toggle('is-open', isOpen);
    };

    openBtn?.addEventListener('click', () => setMobileOpen(true));
    closeBtn?.addEventListener('click', () => setMobileOpen(false));
    backdrop?.addEventListener('click', () => setMobileOpen(false));

    searchInput?.addEventListener('input', () => {
        state.search = searchInput.value.trim().toLowerCase();
        onChange();
    });

    typeFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-match-type]');
        if (!button) return;
        state.type = button.getAttribute('data-match-type') || 'all';
        typeFilters.querySelectorAll('.matches-filter-option').forEach(btn => btn.classList.toggle('active', btn === button));
        onChange();
    });

    qualityFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-quality]');
        if (!button) return;
        const quality = button.getAttribute('data-quality') || '';
        state.quality = state.quality === quality ? '' : quality;
        qualityFilters.querySelectorAll('.matches-filter-option').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-quality') === state.quality));
        onChange();
    });

    skillFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-skill]');
        if (!button) return;
        const skill = button.getAttribute('data-skill') || '';
        state.skill = state.skill === skill ? '' : skill;
        skillFilters.querySelectorAll('.matches-skill-choice').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-skill') === state.skill));
        onChange();
    });

    clearBtn?.addEventListener('click', () => {
        state.type = 'all';
        state.quality = '';
        state.skill = '';
        state.search = '';
        if (searchInput) searchInput.value = '';
        typeFilters?.querySelectorAll('.matches-filter-option').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-match-type') === 'all'));
        qualityFilters?.querySelectorAll('.matches-filter-option').forEach(btn => btn.classList.remove('active'));
        skillFilters?.querySelectorAll('.matches-skill-choice').forEach(btn => btn.classList.remove('active'));
        onChange();
    });
}

function renderFilteredMatches(container, matches, state) {
    const summary = document.getElementById('matches-results-summary');
    const filtered = matches.filter(match => {
        const quality = getMatchQuality(match);
        const searchText = [
            match.cardTitle,
            match.searchText,
            match.matchType,
            match.tierLabel,
            ...(match.skills || [])
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesType = state.type === 'all' || match.matchType === state.type;
        const matchesQuality = !state.quality || quality.key === state.quality;
        const matchesSkill = !state.skill || (match.skills || []).includes(state.skill);
        const matchesSearch = !state.search || searchText.includes(state.search);
        return matchesType && matchesQuality && matchesSkill && matchesSearch;
    }).slice(0, 8);

    if (summary) {
        summary.textContent = `Showing ${filtered.length} of ${matches.length} matches`;
    }

    if (filtered.length === 0) {
        container.innerHTML = matches.length === 0
            ? `<div class="matches-empty-state">${escDash(DASHBOARD_MATCH_EMPTY)}</div>`
            : '<div class="matches-empty-state">No matches match your filters. Try clearing filters or changing your search.</div>';
        return;
    }

    container.innerHTML = filtered.map(renderDashboardMatchCard).join('');
}

function renderMatchNeedOfferBody(match) {
    if (match.matchType === 'one_way' && (match.needTitle || match.offerTitle)) {
        return `<div class="dashboard-match-pair">
            <div class="dashboard-match-row"><span class="dashboard-match-row-label">Need</span><span class="dashboard-match-row-value">${escDash(match.needTitle || '—')}</span></div>
            <div class="dashboard-match-row"><span class="dashboard-match-row-label">Offer</span><span class="dashboard-match-row-value">${escDash(match.offerTitle || '—')}</span></div>
        </div>`;
    }
    if (match.matchType === 'two_way') {
        return `<div class="dashboard-match-pair">
            <div class="dashboard-match-row"><span class="dashboard-match-row-label">Need</span><span class="dashboard-match-row-value">${escDash(match.theirNeedTitle || '—')}</span></div>
            <div class="dashboard-match-row"><span class="dashboard-match-row-label">Offer</span><span class="dashboard-match-row-value">${escDash(match.yourOfferTitle || '—')}</span></div>
        </div>`;
    }
    return `<p class="dashboard-match-description">${escDash(getMatchCardDetails(match))}</p>`;
}

function renderDashboardMatchCard(match) {
    const typeLabel = getMatchTypeLabel(match.matchType);
    const quality = getMatchQuality(match);
    const score = match.matchScorePercent != null ? match.matchScorePercent : toMatchScorePercent(match.matchScore);
    const title = getMatchCardTitle(match);
    const skills = (match.skills || []).slice(0, 5);
    const body = renderMatchNeedOfferBody(match);
    const messageRoute = resolveDashboardMessageRoute(match);
    const messageBtn = messageRoute
        ? `<a href="#" data-route="${escDash(messageRoute)}" class="btn btn-secondary btn-sm">Message</a>`
        : '';
    return `<article class="dashboard-match-card">
        <div class="dashboard-match-main">
            <div class="dashboard-match-topline">
                <span class="dashboard-match-type">${escDash(typeLabel)}</span>
                <span class="dashboard-match-badge ${quality.className}">${escDash(quality.label)} · ${score}%</span>
            </div>
            <h3 class="dashboard-match-title">${escDash(title)}</h3>
            ${body}
            ${skills.length ? `<div class="dashboard-match-skills">${skills.map(skill => `<span>${escDash(skill)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="dashboard-match-actions">
            ${match.canRespond ? `<button type="button" class="btn btn-primary btn-sm btn-accept-match" data-match-id="${escDash(match.id)}">Accept</button>
            <button type="button" class="btn btn-outline btn-sm btn-decline-match" data-match-id="${escDash(match.id)}">Decline</button>` : ''}
            <a href="#" data-route="/matches/${escDash(match.id)}" class="btn btn-${match.canRespond ? 'outline' : 'primary'} btn-sm">View details</a>
            ${messageBtn}
        </div>
    </article>`;
}

function getMatchTypeLabel(type) {
    const labels = {
        one_way: 'Need/Offer',
        two_way: 'Barter',
        consortium: 'Consortium',
        circular: 'Circular'
    };
    return labels[type] || 'Match';
}

function getMatchQuality(match) {
    const score = match.matchScore || 0;
    if (score >= 0.9) return { key: 'top', label: 'Top Match', className: 'is-top' };
    if (score >= 0.78) return { key: 'high', label: 'High Match', className: 'is-high' };
    return { key: 'new', label: 'New Match', className: 'is-new' };
}

function getMatchCardTitle(match) {
    if (match.matchType === 'two_way') return 'Barter exchange opportunity';
    if (match.matchType === 'consortium') return match.projectTitle || 'Consortium opportunity';
    if (match.matchType === 'circular') return 'Circular exchange opportunity';
    return match.cardTitle || 'Need/Offer match';
}

function getMatchCardDetails(match) {
    if (match.matchType === 'two_way') return `${match.yourOfferTitle || 'Your offer'} matches ${match.theirNeedTitle || 'their need'}`;
    if (match.matchType === 'consortium') return 'Potential partner group for this project need.';
    if (match.matchType === 'circular') return match.cycleLabel || 'A multi-party exchange chain is available.';
    return `${match.needTitle || 'Need'} · ${match.offerTitle || 'Offer'}`;
}

function extractMatchSkills(...opportunities) {
    const values = [];
    opportunities.filter(Boolean).forEach(opp => {
        const scope = opp.scope || {};
        const attrs = opp.attributes || {};
        [
            opp.skills,
            opp.requiredSkills,
            opp.offeredSkills,
            scope.requiredSkills,
            scope.offeredSkills,
            attrs.requiredSkills,
            attrs.offeredSkills
        ].forEach(item => {
            if (Array.isArray(item)) values.push(...item);
            else if (item) values.push(item);
        });
    });
    return [...new Set(values.map(skill => String(skill).trim()).filter(Boolean))];
}

async function loadApplicationsReceived(userId) {
    const section = document.getElementById('applications-received-section');
    const list = document.getElementById('applications-received-list');
    const emptyEl = document.getElementById('applications-received-empty');
    const sortEl = document.getElementById('applications-sort');
    const statusFilterEl = document.getElementById('applications-status-filter');
    if (!section || !list) return;

    section.style.display = 'block';

    try {
        const allOpps = await dataService.getOpportunities();
        const myOppIds = new Set(allOpps.filter(o => o.creatorId === userId).map(o => o.id));
        if (myOppIds.size === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        const allApps = await dataService.getApplications();
        const received = allApps
            .filter(a => myOppIds.has(a.opportunityId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (received.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        const enriched = await Promise.all(received.map(async (app) => {
            const applicant = await dataService.getUserOrCompanyById(app.applicantId);
            const opp = allOpps.find(o => o.id === app.opportunityId);
            let negotiation = null;
            if (app.negotiationId && typeof dataService.getNegotiationById === 'function') {
                negotiation = await dataService.getNegotiationById(app.negotiationId);
            }
            return {
                ...app,
                applicantName: applicant?.profile?.name || app.applicantId,
                opportunityTitle: opp?.title || app.opportunityId,
                negotiation
            };
        }));

        const renderApplications = () => {
            const statusFilter = statusFilterEl?.value || 'all';
            const sortMode = sortEl?.value || 'newest';
            const statusRank = {
                pending: 1,
                reviewing: 2,
                shortlisted: 3,
                in_negotiation: 4,
                accepted: 5,
                rejected: 6,
                withdrawn: 7
            };
            const priorityRank = {
                in_negotiation: 1,
                shortlisted: 2,
                reviewing: 3,
                pending: 4,
                accepted: 5,
                rejected: 6,
                withdrawn: 7
            };
            let visible = enriched.filter(app => statusFilter === 'all' || normalizeApplicationStatus(app.status) === statusFilter);
            visible = visible.sort((a, b) => {
                const statusA = normalizeApplicationStatus(a.status);
                const statusB = normalizeApplicationStatus(b.status);
                if (sortMode === 'priority') {
                    return (priorityRank[statusA] || 99) - (priorityRank[statusB] || 99);
                }
                if (sortMode === 'status') {
                    return (statusRank[statusA] || 99) - (statusRank[statusB] || 99);
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            }).slice(0, 5);

            if (emptyEl) {
                emptyEl.textContent = statusFilter === 'all' ? 'No applications received yet.' : 'No applications match this status.';
                emptyEl.style.display = visible.length === 0 ? 'block' : 'none';
            }

            list.innerHTML = visible.map(app => {
                const status = normalizeApplicationStatus(app.status);
                const sb = window.statusBadgeSystem;
                const statusBadgeClass = sb ? sb.getStatusBadgeClass(status, 'application') : 'badge--neutral';
                const statusText = sb ? sb.getStatusLabel(status, 'application') : formatApplicationStatus(status);
                const formattedDate = formatDashboardDate(app.createdAt);
                const cta = getApplicationDashboardAction(app);
                return `<div class="company-compact-item applications-item">
                    <div class="company-avatar company-avatar--soft">${escDash((app.applicantName || '?')[0])}</div>
                    <div class="company-compact-main">
                        <div class="company-compact-topline">
                            <div class="company-compact-title">${escDash(app.applicantName)}</div>
                            <span class="badge ${statusBadgeClass}">${escDash(statusText)}</span>
                        </div>
                        <div class="company-project-label">Source opportunity</div>
                        <div class="company-compact-meta company-project-title">${escDash(app.opportunityTitle)}</div>
                        <div class="company-compact-date">${formattedDate}</div>
                    </div>
                    <a href="#" data-route="${escDash(cta.route)}" class="company-review-link">${escDash(cta.label)}</a>
                </div>`;
            }).join('');
        };

        if (sortEl) sortEl.addEventListener('change', renderApplications);
        if (statusFilterEl) statusFilterEl.addEventListener('change', renderApplications);
        renderApplications();
    } catch (e) {
        console.error('Error loading applications received:', e);
        if (emptyEl) emptyEl.style.display = 'block';
    }
}

function normalizeApplicationStatus(status) {
    return String(status || 'pending').toLowerCase();
}

function getApplicationDashboardAction(app) {
    const negStatus = (app.negotiation?.status || '').toLowerCase();
    const negId = app.negotiationId || app.negotiation?.id;
    if (negId) {
        return {
            route: `/negotiations/${negId}`,
            label: negStatus === 'agreed' && !app.dealId ? 'Create deal' : 'Open negotiation'
        };
    }
    const status = normalizeApplicationStatus(app.status);
    if (status === 'in_negotiation') {
        return { route: '/pipeline/applications?stage=in_negotiation', label: 'Open negotiation' };
    }
    return { route: '/pipeline/applications', label: 'Review application' };
}

function getApplicantApplicationReviewRoute(app) {
    const cta = getApplicationDashboardAction(app);
    return cta.route;
}

function getOwnerApplicationReviewRoute(app) {
    const negId = app.negotiationId || app.negotiation?.id;
    if (negId) {
        return `/negotiations/${negId}`;
    }
    if (app.opportunityId) {
        return `/opportunities/${app.opportunityId}`;
    }
    return '/pipeline';
}

function formatApplicationStatus(status) {
    return String(status || 'pending')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, ch => ch.toUpperCase());
}

function formatDashboardDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}
