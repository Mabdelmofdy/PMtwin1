/**
 * Dashboard Component
 */

async function initDashboard(params) {
    const user = authService.getCurrentUser();
    if (!user) {
        router.navigate(CONFIG.ROUTES.LOGIN);
        return;
    }

    const isCompanyView = params?.view === 'company';
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.profile?.name || user.email;
    }
    const pageTitle = document.querySelector('#main-content .page-title');
    if (pageTitle && isCompanyView) {
        pageTitle.textContent = 'Company dashboard';
    }

    await loadDashboardData(user.id);

    // Profile completeness (show when < 100%)
    const completenessEl = document.getElementById('dashboard-profile-completeness');
    const completenessBar = document.getElementById('dashboard-completeness-bar');
    const completenessPercent = document.getElementById('dashboard-completeness-percent');
    if (typeof profileCompletion !== 'undefined' && completenessEl && completenessBar && completenessPercent) {
        const result = profileCompletion.getProfileCompletion(user);
        completenessBar.style.width = result.percent + '%';
        completenessPercent.textContent = result.percent + '%';
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

    const isCompany = authService.isCompanyUser && authService.isCompanyUser();
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
                <a href="#" data-route="/opportunities/${opp.id}" class="inline-flex items-center px-4 py-2 rounded-md border border-amber-400 text-amber-900 bg-white hover:bg-amber-100 transition-colors no-underline text-sm">${(opp.title || 'Opportunity').substring(0, 45)}${(opp.title || '').length > 45 ? '…' : ''}</a>
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
        const opportunityIcon = IconHelper ? IconHelper.render('briefcase', { size: 40, weight: 'duotone', color: 'currentColor' }) : '';
        const plusIcon = IconHelper ? IconHelper.render('plus', { size: 20, weight: 'duotone', color: 'currentColor', className: 'mr-2' }) : '';
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 px-8 text-center min-h-[300px]">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary/90 to-primary-light flex items-center justify-center mb-6 text-white opacity-90">
                    ${opportunityIcon}
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">No opportunities yet</h3>
                <p class="text-base text-gray-600 max-w-md mb-8 leading-relaxed">Start building your network by creating your first opportunity. Share projects, find partners, and grow together.</p>
                <a href="#" data-route="/opportunities/create" class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg no-underline">
                    ${plusIcon}
                    Create Your First Opportunity
                </a>
            </div>
        `;
        return;
    }
    
    // Load template
    const template = await templateLoader.load('opportunity-card');
    
    // Render each opportunity
    const html = opportunities.map(opp => {
        const data = {
            ...opp,
            intentLabel: opp.intent === 'offer' ? 'OFFER' : 'NEED',
            intentBadgeClass: typeof getIntentBadgeClass === 'function' ? getIntentBadgeClass(opp.intent, opp.modelType) : 'badge-intent-request-default',
            statusBadgeClass: getStatusBadgeClass(opp.status),
            createdDate: new Date(opp.createdAt).toLocaleDateString(),
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
        const usersIcon = IconHelper ? IconHelper.render('users', { size: 40, weight: 'duotone', color: 'currentColor' }) : '';
        const searchIcon = IconHelper ? IconHelper.render('search', { size: 20, weight: 'duotone', color: 'currentColor', className: 'mr-2' }) : '';
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 px-8 text-center min-h-[300px]">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary/90 to-primary-light flex items-center justify-center mb-6 text-white opacity-90">
                    ${usersIcon}
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">No applications yet</h3>
                <p class="text-base text-gray-600 max-w-md mb-8 leading-relaxed">When you apply to opportunities, they'll appear here. Start exploring available opportunities to get started.</p>
                <a href="#" data-route="/opportunities" class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg no-underline">
                    ${searchIcon}
                    Browse Opportunities
                </a>
            </div>
        `;
        return;
    }
    
    // Load opportunity details for each application
    const appsWithOpps = await Promise.all(
        applications.map(async (app) => {
            const opportunity = await dataService.getOpportunityById(app.opportunityId);
            return { ...app, opportunity };
        })
    );
    
    // Load template
    const template = await templateLoader.load('application-card');
    
    // Render each application
    const html = appsWithOpps.map(app => {
        const av = app.application_value;
        const valueScorePct = av?.value_score != null ? Math.round(av.value_score * 100) : null;
        const data = {
            ...app,
            statusBadgeClass: getStatusBadgeClass(app.status),
            createdDate: new Date(app.createdAt).toLocaleDateString(),
            valueScorePct: valueScorePct != null ? valueScorePct : '',
            valueScoreLabel: valueScorePct != null ? `Value match: ${valueScorePct}%` : ''
        };
        return templateRenderer.render(template, data);
    }).join('');
    
    container.innerHTML = html;
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
        'cancelled': 'danger',
        'pending': 'warning',
        'reviewing': 'primary',
        'shortlisted': 'primary',
        'accepted': 'success',
        'rejected': 'danger',
        'withdrawn': 'secondary'
    };
    return statusMap[status] || 'secondary';
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

    section.style.display = 'block';

    try {
        const ms = window.matchingService || (typeof matchingService !== 'undefined' ? matchingService : null);
        if (!ms) { section.style.display = 'none'; return; }

        const allOpps = await dataService.getOpportunities();
        const myPublished = allOpps.filter(o => o.creatorId === companyId && o.status === 'published');

        if (myPublished.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
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
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        list.innerHTML = sorted.map(item => {
            const u = item.user;
            const prof = u.profile || {};
            const scorePercent = Math.round(item.score * 100);
            const matchedSkills = item.criteria?.matched || [];
            return `<div class="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">${escDash((prof.name || '?')[0])}</div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-900 truncate">${escDash(prof.name || u.email)}</div>
                    <div class="text-sm text-gray-500">${escDash(prof.title || u.role)} &middot; ${scorePercent}% match</div>
                    ${matchedSkills.length > 0 ? `<div class="flex flex-wrap gap-1 mt-1">
                        ${matchedSkills.slice(0, 5).map(s => `<span class="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">${escDash(s)}</span>`).join('')}
                    </div>` : ''}
                    <div class="text-xs text-gray-400 mt-1">For: ${escDash(item.opportunity.title)}</div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Error loading company recommendations:', e);
        if (emptyEl) emptyEl.style.display = 'block';
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
        tierLabel: postMatch.matchScore >= 0.85 ? 'Top match' : postMatch.matchScore >= 0.70 ? 'Good match' : 'Possible match'
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
            tertiaryActionRoute
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
            otherUserId
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
            roles: rolesResolved
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
            youReceiveTitle: youReceiveNeedOpp ? `Need: ${youReceiveNeedOpp.title}` : 'Their need'
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
        let category = 'all';
        const tabEls = document.querySelectorAll('#match-category-tabs .match-tab');
        tabEls.forEach(btn => {
            btn.addEventListener('click', function () {
                tabEls.forEach(b => { b.classList.remove('active', 'bg-primary', 'text-white'); b.classList.add('bg-gray-100', 'text-gray-700'); });
                this.classList.add('active', 'bg-primary', 'text-white');
                this.classList.remove('bg-gray-100', 'text-gray-700');
                category = this.getAttribute('data-category') || 'all';
                renderYourMatchesList(list, userId, sorted, category);
            });
        });
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

        await renderYourMatchesList(list, userId, sorted, category);
    } catch (e) {
        console.error('Error loading your matches:', e);
        section.style.display = 'none';
    }
}

async function renderYourMatchesList(container, userId, postMatches, category) {
    const filtered = category === 'all' ? postMatches : postMatches.filter(pm => pm.matchType === category);
    const top = filtered.slice(0, 5);

    const templateNames = {
        one_way: 'match-card-one-way',
        two_way: 'match-card-two-way',
        consortium: 'match-card-consortium',
        circular: 'match-card-circular'
    };

    const htmlParts = [];
    for (const pm of top) {
        const viewModel = await buildPostMatchViewModel(pm, userId);
        const name = templateNames[pm.matchType] || 'match-card';
        const template = await templateLoader.load(name);
        htmlParts.push(templateRenderer.render(template, viewModel));
    }
    container.innerHTML = htmlParts.join('');
}

async function loadApplicationsReceived(userId) {
    const section = document.getElementById('applications-received-section');
    const list = document.getElementById('applications-received-list');
    const emptyEl = document.getElementById('applications-received-empty');
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
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (received.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        const items = await Promise.all(received.map(async (app) => {
            const applicant = await dataService.getUserOrCompanyById(app.applicantId);
            const opp = allOpps.find(o => o.id === app.opportunityId);
            const applicantName = applicant?.profile?.name || app.applicantId;
            return `<div class="flex items-start gap-4 p-3 border border-gray-200 rounded-lg">
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900">${escDash(applicantName)}</div>
                    <div class="text-sm text-gray-500">Applied to: ${escDash(opp?.title || app.opportunityId)}</div>
                    <div class="text-xs text-gray-400 mt-1">${new Date(app.createdAt).toLocaleDateString()} &middot;
                        <span class="inline-block px-1.5 py-0.5 rounded text-xs font-medium ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : app.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">${app.status}</span>
                    </div>
                </div>
                <a href="#" data-route="/pipeline" class="text-sm text-primary hover:underline no-underline">Review</a>
            </div>`;
        }));

        list.innerHTML = items.join('');
    } catch (e) {
        console.error('Error loading applications received:', e);
        if (emptyEl) emptyEl.style.display = 'block';
    }
}
