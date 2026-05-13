/**
 * Dashboard Component
 */

function humanizeUnderscores(value) {
    if (value == null || value === '') return '';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function initDashboard(params) {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    const isCompanyView = params?.view === 'company';
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
                    'Post opportunities, review applicants, and connect with matched professionals for projects, BIM, and delivery.',
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
                    '</span>. Track opportunities, applications, and recommended matches.',
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

    loadYourMatches(user.id);

    const isCompany = isCompanyView || (authService.isCompanyUser && authService.isCompanyUser());
    if (isCompany) {
        loadCompanyRecommendations(user.id);
        loadApplicationsReceived(user.id);
    } else {
        loadRecommendedOpportunities(user.id);
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
        
        // Load applications
        const allApplications = await dataService.getApplications();
        const userApplications = allApplications.filter(a => a.applicantId === userId);
        document.getElementById('stat-applications').textContent = userApplications.length;
        
        // Load matches (legacy + post matches)
        const allMatches = await dataService.getMatches();
        const userMatches = allMatches.filter(m => (m.candidateId || m.userId) === userId);
        const postMatchesForUser = dataService.getPostMatchesForUser ? await dataService.getPostMatchesForUser(userId) : [];
        const pendingPostMatches = postMatchesForUser.filter(pm => (pm.status || '') !== 'declined');
        const statMatchesEl = document.getElementById('stat-matches');
        if (statMatchesEl) statMatchesEl.textContent = userMatches.length + pendingPostMatches.length;
        
        // Load notifications
        const notifications = await dataService.getNotifications(userId);
        const unreadCount = notifications.filter(n => !n.read).length;
        document.getElementById('stat-notifications').textContent = unreadCount;
        
        // Display recent opportunities
        await displayRecentOpportunities(userOpportunities.slice(0, 5));
        
        // Display recent applications
        await displayRecentApplications(userApplications.slice(0, 5));

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
            return { ...app, opportunity };
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
            ? `<span class="dash-match-pill">${valueScorePct}% match</span>`
            : '';
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
                <a href="#" data-route="/pipeline/applications" class="btn btn-primary btn-sm">Review application</a>
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

async function loadRecommendedOpportunities(userId) {
    const section = document.getElementById('recommended-opportunities-section');
    const list = document.getElementById('recommended-opportunities-list');
    const loadingEl = document.getElementById('recommended-loading');
    const emptyEl = document.getElementById('recommended-empty');
    if (!section || !list) return;

    section.style.display = 'block';
    if (loadingEl) loadingEl.style.display = 'block';

    try {
        const ms = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
        if (!ms) { section.style.display = 'none'; return; }

        const user = authService.getCurrentUser();
        const minScore = user?.profile?.matchingPreferences?.minScore;
        const matches = await ms.findOpportunitiesForCandidate(userId, minScore != null ? { minThreshold: minScore } : {});
        if (loadingEl) loadingEl.style.display = 'none';
        const top = matches.slice(0, 5);

        if (top.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        const items = await Promise.all(top.map(async (m) => {
            const opp = m.opportunity;
            const owner = await dataService.getUserOrCompanyById(opp.creatorId);
            const ownerName = owner?.profile?.name || opp.creatorId;
            const scorePercent = Math.round((m.matchScore || 0) * 100);
            const skillDetail = m.criteria?.skillMatch;
            const matchedSkills = skillDetail?.matched || [];
            const unmatchedSkills = skillDetail?.unmatched || [];

            return `<div class="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/40 transition-colors">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="text-lg font-bold text-primary">${scorePercent}%</span>
                </div>
                <div class="flex-1 min-w-0">
                    <a href="#" data-route="/opportunities/${opp.id}" class="text-base font-semibold text-gray-900 hover:text-primary no-underline block truncate">${escDash(opp.title)}</a>
                    <p class="text-sm text-gray-500 mt-0.5">by ${escDash(ownerName)}</p>
                    ${matchedSkills.length > 0 ? `<div class="flex flex-wrap gap-1 mt-2">
                        ${matchedSkills.map(s => `<span class="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">${escDash(s)}</span>`).join('')}
                        ${unmatchedSkills.map(s => `<span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">${escDash(s)}</span>`).join('')}
                    </div>` : ''}
                </div>
                <a href="#" data-route="/opportunities/${opp.id}" class="flex-shrink-0 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark no-underline">View</a>
            </div>`;
        }));

        list.innerHTML = items.join('');
    } catch (e) {
        console.error('Error loading recommended opportunities:', e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
    }
}

async function loadCompanyRecommendations(companyId) {
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
        const ms = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
        if (!ms) { section.style.display = 'none'; return; }

        const allOpps = await dataService.getOpportunities();
        const myPublished = allOpps.filter(o => o.creatorId === companyId && o.status === 'published');

        if (myPublished.length === 0) {
            showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-users-three"></i></div>
                <h3>No recommendations yet</h3>
                <p>Publish an opportunity so we can surface professionals whose skills align with your needs.</p>
                <a href="#" data-route="/opportunities/create" class="btn btn-primary">Post opportunity</a>`);
            return;
        }

        const candidateMap = new Map();
        for (const opp of myPublished.slice(0, 3)) {
            try {
                const allUsers = await dataService.getUsers();
                const active = allUsers.filter(u => u.status === 'active' && u.id !== companyId);
                for (const user of active) {
                    const score = await ms.calculateMatchScore(opp, user);
                    if (score >= (ms.minThreshold || 0.3)) {
                        const existing = candidateMap.get(user.id);
                        if (!existing || existing.score < score) {
                            candidateMap.set(user.id, {
                                user,
                                score,
                                opportunity: opp,
                                criteria: ms._lastSkillDetail
                            });
                        }
                    }
                }
            } catch (e) { /* skip */ }
        }

        const sorted = Array.from(candidateMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (sorted.length === 0) {
            showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-magnifying-glass"></i></div>
                <h3>No strong matches yet</h3>
                <p>Try broadening skills on your postings or publish another opportunity to improve suggestions.</p>
                <a href="#" data-route="/opportunities/create" class="btn btn-primary">Post opportunity</a>`);
            return;
        }

        hideEmpty();

        list.innerHTML = sorted.map(item => {
            const u = item.user;
            const prof = u.profile || {};
            const scorePercent = Math.round(item.score * 100);
            const matchedSkills = item.criteria?.matched || [];
            const visibleSkills = matchedSkills.slice(0, 3);
            const hiddenSkillCount = Math.max(0, matchedSkills.length - visibleSkills.length);
            return `<div class="company-compact-item">
                <div class="company-avatar">${escDash((prof.name || u.email || '?')[0])}</div>
                <div class="company-compact-main">
                    <div class="company-compact-topline">
                        <div class="company-compact-title">${escDash(prof.name || u.email)}</div>
                        <span class="company-score-pill">${scorePercent}%</span>
                    </div>
                    <div class="company-compact-meta">${escDash(prof.title || u.role)} &middot; ${escDash(item.opportunity.title)}</div>
                    ${visibleSkills.length > 0 ? `<div class="company-skill-row">
                        ${visibleSkills.map(s => `<span class="company-skill-chip">${escDash(s)}</span>`).join('')}
                        ${hiddenSkillCount > 0 ? `<span class="company-skill-more">+${hiddenSkillCount}</span>` : ''}
                    </div>` : ''}
                    <a href="#" data-route="/people/${escDash(u.id)}" class="dash-inline-link">View profile</a>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Error loading company recommendations:', e);
        showEmpty(`<div class="dash-empty-pro-icon" aria-hidden="true"><i class="ph-duotone ph-warning-circle"></i></div>
            <h3>Could not load recommendations</h3>
            <p>Refresh the page or try again shortly.</p>
            <a href="#" data-route="/opportunities/create" class="btn btn-primary">Post opportunity</a>`);
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
async function buildPostMatchViewModel(postMatch, currentUserId) {
    const ds = dataService;
    const scorePct = Math.round((postMatch.matchScore || 0) * 100);
    const base = {
        id: postMatch.id,
        matchType: postMatch.matchType,
        matchScore: postMatch.matchScore,
        matchScorePercent: scorePct,
        status: postMatch.status,
        tierLabel: postMatch.matchScore >= 0.85 ? 'Top match' : postMatch.matchScore >= 0.70 ? 'High match' : 'New match'
    };
    const payload = postMatch.payload || {};

    if (postMatch.matchType === 'one_way') {
        const needOpp = await ds.getOpportunityById(payload.needOpportunityId);
        const offerOpp = await ds.getOpportunityById(payload.offerOpportunityId);
        const needTitle = needOpp?.title || 'Need';
        const offerTitle = offerOpp?.title || 'Offer';
        const otherPart = (postMatch.participants || []).find(p => p.userId !== currentUserId);
        const otherUserId = otherPart?.userId || '';
        const needOpportunityId = payload.needOpportunityId || '';
        const offerOpportunityId = payload.offerOpportunityId || '';
        const { isNeedOwner } = getOneWayViewerRole(postMatch, currentUserId);
        const cardTitle = isNeedOwner ? 'Recommended Provider Found' : 'Recommended Opportunity Found';
        const section1Label = isNeedOwner ? 'Your Need' : 'Opportunity Need';
        const section2Label = isNeedOwner ? 'Provider Offer' : 'Your Offer';
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
            tertiaryActionRoute,
            messageRoute: tertiaryActionRoute,
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
        return {
            ...base,
            yourNeedTitle: myNeed?.title || 'Your need',
            yourOfferTitle: myOffer?.title || 'Your offer',
            theirNeedTitle: theirNeed?.title || 'Their need',
            theirOfferTitle: theirOffer?.title || 'Their offer',
            valueEquivalence: payload.valueEquivalence || '',
            otherUserId,
            messageRoute: '/messages/' + otherUserId,
            skills: extractMatchSkills(myNeed, myOffer, theirNeed, theirOffer),
            searchText: [myNeed?.title, myOffer?.title, theirNeed?.title, theirOffer?.title, payload.valueEquivalence].filter(Boolean).join(' ')
        };
    }

    if (postMatch.matchType === 'consortium') {
        const leadOpp = await ds.getOpportunityById(payload.leadNeedId);
        const projectTitle = leadOpp?.title || 'Project';
        const roles = (payload.roles || []).map(async (r) => {
            const user = await ds.getUserOrCompanyById(r.userId);
            return { role: r.role || 'Partner', partnerName: user?.profile?.name || r.userId };
        });
        const rolesResolved = await Promise.all(roles);
        return {
            ...base,
            projectTitle,
            roles: rolesResolved,
            messageRoute: '/matches/' + postMatch.id,
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
        return {
            ...base,
            cycleLabel,
            youGiveTitle: youGiveOpp?.title || 'Your offer',
            youReceiveTitle: youReceiveNeedOpp ? `Need: ${youReceiveNeedOpp.title}` : 'Their need',
            messageRoute: '/matches/' + postMatch.id,
            skills: extractMatchSkills(youGiveOpp, youReceiveNeedOpp),
            searchText: [cycleLabel, youGiveOpp?.title, youReceiveNeedOpp?.title].filter(Boolean).join(' ')
        };
    }

    return base;
}

async function loadYourMatches(userId) {
    const section = document.getElementById('your-matches-section');
    const list = document.getElementById('your-matches-list');
    if (!section || !list) return;

    if (!dataService.getPostMatchesForUser) {
        section.style.display = 'none';
        return;
    }

    try {
        const postMatches = await dataService.getPostMatchesForUser(userId);
        const pending = postMatches.filter(pm => (pm.status || '') !== 'declined' && (pm.status || '') !== 'expired');
        const sorted = pending.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        if (sorted.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        list.addEventListener('click', (e) => {
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

        await renderYourMatchesList(list, userId, sorted);
    } catch (e) {
        console.error('Error loading your matches:', e);
        section.style.display = 'none';
    }
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
        container.innerHTML = '<div class="matches-empty-state">No matches found. Try clearing filters or changing your search.</div>';
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
    const score = match.matchScorePercent || Math.round((match.matchScore || 0) * 100);
    const title = getMatchCardTitle(match);
    const skills = (match.skills || []).slice(0, 5);
    const body = renderMatchNeedOfferBody(match);
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
            <a href="#" data-route="/matches/${escDash(match.id)}" class="btn btn-primary btn-sm">View details</a>
            <a href="#" data-route="${escDash(match.messageRoute || ('/matches/' + match.id))}" class="btn btn-secondary btn-sm">Message</a>
        </div>
    </article>`;
}

function getMatchTypeLabel(type) {
    const labels = {
        one_way: 'Recommended',
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
    return match.cardTitle || 'Recommended match';
}

function getMatchCardDetails(match) {
    if (match.matchType === 'two_way') return `${match.yourOfferTitle || 'Your offer'} matches ${match.theirNeedTitle || 'their need'}`;
    if (match.matchType === 'consortium') return 'Potential partner group for this project need.';
    if (match.matchType === 'circular') return match.cycleLabel || 'A multi-party exchange chain is available.';
    return `${match.needTitle || 'Project need'} · ${match.offerTitle || 'Provider offer'}`;
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
            return {
                ...app,
                applicantName: applicant?.profile?.name || app.applicantId,
                opportunityTitle: opp?.title || app.opportunityId
            };
        }));

        const renderApplications = () => {
            const statusFilter = statusFilterEl?.value || 'all';
            const sortMode = sortEl?.value || 'newest';
            const statusRank = {
                pending: 1,
                reviewing: 2,
                shortlisted: 3,
                accepted: 4,
                rejected: 5,
                withdrawn: 6
            };
            const priorityRank = {
                shortlisted: 1,
                reviewing: 2,
                pending: 3,
                accepted: 4,
                rejected: 5,
                withdrawn: 6
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
                return `<div class="company-compact-item applications-item">
                    <div class="company-avatar company-avatar--soft">${escDash((app.applicantName || '?')[0])}</div>
                    <div class="company-compact-main">
                        <div class="company-compact-topline">
                            <div class="company-compact-title">${escDash(app.applicantName)}</div>
                            <span class="badge ${statusBadgeClass}">${escDash(statusText)}</span>
                        </div>
                        <div class="company-project-label">Project need</div>
                        <div class="company-compact-meta company-project-title">${escDash(app.opportunityTitle)}</div>
                        <div class="company-compact-date">${formattedDate}</div>
                    </div>
                    <a href="#" data-route="/pipeline" class="company-review-link">Review</a>
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
