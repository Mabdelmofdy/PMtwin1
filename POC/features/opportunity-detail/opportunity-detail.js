/**
 * Opportunity Detail Component - Wizard View
 */

let currentOpportunity = null;
let currentApplication = null;
let currentWizardStep = 1;
let hasDetailedResponses = false;
let hasTaskBidding = false;
let isEditMode = false;
let applicationCanEdit = false;
let applicationCanReapply = false;
let opportunityApplicationsCanManage = true;

const EDITABLE_APPLICATION_STATUSES = ['pending', 'reviewing', 'shortlisted', 'in_negotiation'];
const REAPPLY_APPLICATION_STATUSES = ['rejected', 'withdrawn'];

function isEditableApplicationStatus(status) {
    return EDITABLE_APPLICATION_STATUSES.includes(status);
}

function resolveUserApplicationForOpportunity(applications, opportunityId, userId) {
    const userApps = applications
        .filter(app => app.opportunityId === opportunityId && app.applicantId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!userApps.length) {
        return { application: null, canEdit: false, canReapply: false };
    }

    const active = userApps.find(app => isEditableApplicationStatus(app.status));
    if (active) {
        return { application: active, canEdit: true, canReapply: false };
    }

    const latest = userApps[0];
    return {
        application: latest,
        canEdit: false,
        canReapply: REAPPLY_APPLICATION_STATUSES.includes(latest.status)
    };
}

const APPLY_INVITE_SESSION_KEY = 'pmtwin_apply_invite';

function readApplyInviteContext(opportunityId) {
    const ctx = { matchId: null, invitationId: null, isReplacement: false };
    try {
        const params = new URLSearchParams(window.location.search);
        const matchId = params.get('matchId');
        if (matchId) ctx.matchId = matchId;
    } catch (e) {
        void e;
    }
    try {
        const raw = sessionStorage.getItem(APPLY_INVITE_SESSION_KEY);
        if (raw) {
            const stored = JSON.parse(raw);
            if (!stored.opportunityId || stored.opportunityId === opportunityId) {
                if (stored.matchId) ctx.matchId = stored.matchId;
                if (stored.invitationId) ctx.invitationId = stored.invitationId;
                if (stored.isReplacement) ctx.isReplacement = true;
            }
        }
    } catch (e) {
        void e;
    }
    return ctx;
}

function storeApplyInviteContext(opportunityId, matchId, invitationId, isReplacement) {
    try {
        sessionStorage.setItem(APPLY_INVITE_SESSION_KEY, JSON.stringify({
            opportunityId,
            matchId: matchId || null,
            invitationId: invitationId || null,
            isReplacement: !!isReplacement
        }));
    } catch (e) {
        void e;
    }
}

function clearApplyInviteContext() {
    try {
        sessionStorage.removeItem(APPLY_INVITE_SESSION_KEY);
    } catch (e) {
        void e;
    }
}

function canAdminViewOpportunityApplications() {
    return typeof authService !== 'undefined'
        && typeof authService.canAccessAdmin === 'function'
        && authService.canAccessAdmin()
        && authService.hasAdminCapability
        && authService.hasAdminCapability('admin.opportunities.read');
}

function canAdminManageOpportunityApplications() {
    return canAdminViewOpportunityApplications()
        && authService.hasAdminCapability('admin.opportunities.write');
}

async function initOpportunityDetail(params) {
    const opportunityId = params.id;
    if (!opportunityId) {
        document.getElementById('content').innerHTML = '<div class="error">Opportunity ID is required</div>';
        return;
    }
    
    // Load opportunity models script if not loaded
    if (!window.OPPORTUNITY_MODELS) {
        await loadScript('src/business-logic/models/opportunity-models.js');
    }
    
    await loadOpportunity(opportunityId);
    setupOpportunityDetailRefreshListener(opportunityId);
}

// The data-refresh listeners live on `window` (which survives SPA navigations),
// so they must be bound exactly once. `#content` is replaced on every page load,
// so its dataset guard would reset and leak a new handler each navigation.
let oppDetailRefreshOpportunityId = null;
function setupOpportunityDetailRefreshListener(opportunityId) {
    oppDetailRefreshOpportunityId = opportunityId;
    if (window.__oppDetailRefreshBound) return;
    window.__oppDetailRefreshBound = true;
    const refresh = () => {
        if (oppDetailRefreshOpportunityId) void loadOpportunity(oppDetailRefreshOpportunityId);
    };
    ['pmtwin:opportunities-updated', 'pmtwin:applications-updated', 'pmtwin:deals-updated', 'pmtwin:data-changed']
        .forEach((eventName) => window.addEventListener(eventName, refresh));
}

/**
 * Attach `handler` for `event` to an element, first stripping any previously
 * attached listeners by replacing the node with a clone of itself. Guards
 * against duplicate handlers when a section re-renders within the same page
 * (e.g. a data-refresh event re-running renderComprehensiveView on the same DOM).
 * @returns {HTMLElement|null} the fresh node, or null when not found.
 */
function bindListenerFresh(elementId, event, handler) {
    const el = document.getElementById(elementId);
    if (!el || !el.parentNode) return el || null;
    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    fresh.addEventListener(event, handler);
    return fresh;
}

function scrollOpportunityDetailSection(canViewApplications = false) {
    const section = (typeof router !== 'undefined' && router.getHashSection)
        ? router.getHashSection()
        : '';
    if (section === 'applications') {
        // Only honor the `?section=applications` deep link for viewers allowed to
        // see the list (owner/admin); never reveal it to other users.
        if (!canViewApplications) return;
        const el = document.getElementById('applications-section');
        if (el) {
            el.style.display = 'block';
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadOpportunity(id) {
    const loadingDiv = document.getElementById('loading');
    const contentDiv = document.getElementById('content');
    
    // Reset module-level state so a previous (applicant) visit cannot leak into
    // this load (e.g. owner opening an opp after viewing one they applied to).
    currentApplication = null;
    applicationCanEdit = false;
    applicationCanReapply = false;
    isEditMode = false;

    try {
        const opportunity = await dataService.getOpportunityById(id);
        
        if (!opportunity) {
            contentDiv.innerHTML = '<div class="error">Opportunity not found</div>';
            loadingDiv.style.display = 'none';
            return;
        }
        
        currentOpportunity = opportunity;
        const inviteCtx = readApplyInviteContext(id);
        if (inviteCtx.matchId) {
            storeApplyInviteContext(id, inviteCtx.matchId, inviteCtx.invitationId, inviteCtx.isReplacement);
        }
        
        const user = authService.getCurrentUser();
        const isVetted = user && user.status === 'active';
        const isPending = user && user.status === 'pending';
        const isIndividual = user && (user.role === CONFIG.ROLES.PROFESSIONAL || user.role === CONFIG.ROLES.CONSULTANT);
        const verificationStatus = user?.profile?.verificationStatus;
        const vettingSkipped = user?.profile?.vettingSkippedAtRegistration === true;
        const isUnverified = isIndividual && (verificationStatus === CONFIG.VERIFICATION_STATUS.UNVERIFIED || (vettingSkipped && !verificationStatus));
        // Teaser for rejected/suspended users
        if (user && !isVetted && !isPending) {
            renderTeaserView(opportunity, false);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            return;
        }
        // Teaser for unverified professionals/consultants: title, industry, location only; no company, scope, budget
        if (user && isUnverified) {
            renderTeaserView(opportunity, true);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            return;
        }
        
        // Load creator info
        const creator = await dataService.getUserOrCompanyById(opportunity.creatorId);
        
        const isOwner = user && opportunity.creatorId === user.id;
        const canViewApplications = isOwner || canAdminViewOpportunityApplications();
        const canManageApplications = isOwner || canAdminManageOpportunityApplications();
        const existingDeal = user ? await dataService.getDealByOpportunityId(opportunity.id) : null;
        const canApplyBase = user && !isOwner && !(authService.isPendingApproval && authService.isPendingApproval());
        
        if (user && !isOwner) {
            const allApplications = await dataService.getApplications();
            const resolved = resolveUserApplicationForOpportunity(allApplications, opportunity.id, user.id);
            currentApplication = resolved.application;
            applicationCanEdit = resolved.canEdit;
            applicationCanReapply = resolved.canReapply;
        } else {
            applicationCanEdit = false;
            applicationCanReapply = false;
        }

        const canApplyHelper = window.applicationUtils?.canUserApplyToOpportunity;
        const canApply = canApplyHelper
            ? canApplyHelper(opportunity, user, {
                application: currentApplication,
                canReapply: applicationCanReapply,
                hasDeal: !!existingDeal
            })
            : (canApplyBase && !existingDeal && (!currentApplication || applicationCanReapply));
        
        // Determine which steps are needed
        determineWizardSteps(opportunity);
        
        // Render comprehensive view
        await renderComprehensiveView(opportunity, creator, isOwner, canApply, canViewApplications, existingDeal);
        
        // Load applications for owner or admin moderators (use opportunity.id so canonical id matches application records)
        if (canViewApplications) {
            opportunityApplicationsCanManage = canManageApplications;
            await loadApplications(opportunity.id, { manage: canManageApplications });
        }
        // Load matching section if owner and opportunity is published or in negotiation
        if (isOwner && (opportunity.status === 'published' || opportunity.status === 'in_negotiation')) {
            await loadMatchingSection(opportunity.id);
        }
        
        // Setup wizard navigation
        if (canApply) {
            setupWizardNavigation();
        }
        
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        scrollOpportunityDetailSection(canViewApplications);
        
    } catch (error) {
        console.error('Error loading opportunity:', error);
        loadingDiv.style.display = 'none';
        contentDiv.innerHTML = '<div class="error">Error loading opportunity. Please try again.</div>';
    }
}

function renderTeaserView(opportunity, forUnverified) {
    const contentDiv = document.getElementById('content');
    if (!contentDiv) return;
    const shortDesc = (opportunity.description || '')
        .replace(/<[^>]+>/g, ' ')
        .trim()
        .slice(0, 300);
    const profileRoute = (window.CONFIG && window.CONFIG.ROUTES && window.CONFIG.ROUTES.PROFILE) || '/profile';
    const scope = opportunity.scope || opportunity.attributes || {};
    const industry = (scope.sectors || scope.industry || opportunity.sectors || opportunity.industry || [])[0] || (Array.isArray(scope.sectors) ? scope.sectors[0] : scope.sectors) || '—';
    const industryStr = Array.isArray(industry) ? industry[0] : (industry && typeof industry === 'object' ? industry.label || industry.id : industry);
    const loc = scope.location || scope.locationCountry || opportunity.location || opportunity.attributes?.location || scope.workMode || '—';
    const locationStr = typeof loc === 'string' ? loc : (loc && (loc.country || loc.region || loc.city) ? [loc.country, loc.region, loc.city].filter(Boolean).join(', ') : '—');
    if (forUnverified) {
        contentDiv.innerHTML = `
        <div class="card max-w-2xl mx-auto mt-6">
            <div class="card-body">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">${escapeHtml(opportunity.title || 'Opportunity')}</h1>
                <div class="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    <span><strong>Industry:</strong> ${escapeHtml(industryStr)}</span>
                    <span><strong>Location:</strong> ${escapeHtml(locationStr)}</span>
                </div>
                <p class="text-gray-600 mb-4">${escapeHtml(shortDesc)}${shortDesc.length >= 300 ? '…' : ''}</p>
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p class="font-medium text-amber-800">Complete verification to unlock full opportunity details.</p>
                    <p class="text-sm text-amber-700 mt-1">You cannot see company name, full scope, contact details, or budget until you complete verification. You can return to verification from the Profile page.</p>
                </div>
                <a href="#" data-route="${profileRoute}" class="btn btn-primary">Complete verification</a>
            </div>
        </div>
        `;
    } else {
        contentDiv.innerHTML = `
        <div class="card max-w-2xl mx-auto mt-6">
            <div class="card-body">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">${escapeHtml(opportunity.title || 'Opportunity')}</h1>
                <p class="text-gray-600 mb-4">${escapeHtml(shortDesc)}${shortDesc.length >= 300 ? '…' : ''}</p>
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p class="font-medium text-amber-800">Complete vetting to view full details and apply.</p>
                    <p class="text-sm text-amber-700 mt-1">Finish your vetting from your profile to access full opportunity details and the apply button.</p>
                </div>
                <a href="#" data-route="${profileRoute}" class="btn btn-primary">Complete your vetting</a>
            </div>
        </div>
        `;
    }
    contentDiv.style.display = 'block';
    contentDiv.querySelectorAll('a[data-route]').forEach(a => {
        a.addEventListener('click', (e) => { e.preventDefault(); if (window.router) router.navigate(a.getAttribute('data-route')); });
    });
}

function determineWizardSteps(opportunity) {
    const modelSpecificData = opportunity.attributes || opportunity.modelData;
    
    // Check if there are detailed responses needed
    const modelDef = getModelDefinition(opportunity.modelType, opportunity.subModelType);
    if (modelDef && modelDef.attributes) {
        const relevantAttrs = modelDef.attributes.filter(attr => 
            !['title', 'description', 'status', 'modelType', 'subModelType', 
              'location', 'locationCountry', 'locationRegion', 'locationCity', 
              'locationDistrict', 'exchangeMode', 'exchangeData'].includes(attr.key)
        );
        hasDetailedResponses = relevantAttrs.length > 0;
    }
    
    // Check if task bidding is needed
    hasTaskBidding = opportunity.subModelType === 'task_based' && modelSpecificData;
    
    // Update step indicators visibility: step 4 (Payment) always visible; step 5 (Bidding) only when task-based
    const step3Indicator = document.getElementById('step-indicator-3');
    const step5Indicator = document.getElementById('step-indicator-5');
    const step6NumberEl = document.getElementById('step-6-number');
    
    if (step3Indicator) step3Indicator.style.display = hasDetailedResponses ? 'flex' : 'none';
    if (step5Indicator) step5Indicator.style.display = hasTaskBidding ? 'flex' : 'none';
    // When step 5 (Bidding) is hidden, show Review as step 5 so the progress bar has no gap
    if (step6NumberEl) step6NumberEl.textContent = hasTaskBidding ? '6' : '5';
}

async function renderComprehensiveView(opportunity, creator, isOwner, canApply, canViewApplications, existingDeal = null) {
    // Reset application-related section visibility up front so a prior render or
    // permission change cannot leave a stale panel showing.
    ['applications-section', 'apply-section', 'already-applied-section'].forEach((sectionId) => {
        const el = document.getElementById(sectionId);
        if (el) el.style.display = 'none';
    });

    document.getElementById('opportunity-title').textContent = opportunity.title || 'Untitled Opportunity';
    const heroMeta = document.getElementById('opportunity-hero-meta');
    if (heroMeta) {
        const posted = new Date(opportunity.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        heroMeta.textContent = opportunity.id + ' · Posted ' + posted;
    }
    const intentEl = document.getElementById('opportunity-intent');
    if (intentEl) {
        const intent = opportunity.intent || 'request';
        intentEl.textContent = intent === 'offer' ? 'Offer' : 'Need';
        intentEl.style.display = 'inline-flex';
        intentEl.className = 'opp-detail-pill opp-detail-pill--intent';
    }
    const modelEl = document.getElementById('opportunity-model');
    const subModelEl = document.getElementById('opportunity-submodel');
    const projectTypeEl = document.getElementById('opportunity-project-type');
    const modelPathEl = document.getElementById('opportunity-model-path');
    const modelLabel = formatModelType(opportunity.modelType) || opportunity.collaborationModel || '';
    const subModelDef = getModelDefinition(opportunity.modelType, opportunity.subModelType);
    const subModelLabel = subModelDef?.name || (opportunity.subModelType ? formatLabel(opportunity.subModelType) : '');
    const pathParts = [modelLabel, subModelLabel, opportunity.projectType === 'multi' ? 'Multi-project' : '']
        .filter(Boolean);
    if (modelPathEl && pathParts.length > 0) {
        modelPathEl.textContent = pathParts.join(' · ');
        modelPathEl.style.display = 'block';
        modelPathEl.removeAttribute('aria-hidden');
    } else if (modelPathEl) {
        modelPathEl.style.display = 'none';
        modelPathEl.setAttribute('aria-hidden', 'true');
    }
    if (modelEl) modelEl.style.display = 'none';
    if (subModelEl) subModelEl.style.display = 'none';
    if (projectTypeEl) projectTypeEl.style.display = 'none';
    const sb = window.statusBadgeSystem;
    document.getElementById('opportunity-status').textContent = sb
        ? sb.getStatusLabel(opportunity.status, 'opportunity')
        : formatOpportunityStatus(opportunity.status);
    document.getElementById('opportunity-status').className = sb
        ? `opp-detail-pill opp-detail-pill--status badge ${sb.getStatusBadgeClass(opportunity.status, 'opportunity')}`
        : `opp-detail-pill opp-detail-pill--status badge ${getStatusBadgeClass(opportunity.status)}`;
    
    // Quick info bar
    document.getElementById('info-created').textContent = new Date(opportunity.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('info-creator').textContent = creator?.profile?.name || creator?.email || 'Unknown';
    
    // Location
    if (opportunity.location) {
        document.getElementById('info-location-chip').style.display = 'flex';
        document.getElementById('info-location').textContent = opportunity.location;
    }

    // Location map
    if (opportunity.latitude && opportunity.longitude && typeof mapService !== 'undefined') {
        const mapSection = document.getElementById('detail-map-section');
        if (mapSection) {
            mapSection.style.display = 'block';
            setTimeout(() => {
                mapService.initStaticMap('detail-map', opportunity.latitude, opportunity.longitude, 13);
            }, 200);
        }
    }
    
    // Exchange mode
    if (opportunity.exchangeMode) {
        document.getElementById('info-exchange-chip').style.display = 'flex';
        document.getElementById('info-exchange').textContent = formatExchangeMode(opportunity.exchangeMode);
    }

    // Match score for current user from post_matches (when not owner)
    const user = authService.getCurrentUser();
    if (!isOwner && user && dataService.getPostMatchesForUser) {
        const postMatches = await dataService.getPostMatchesForUser(user.id);
        const myMatch = postMatches.find(pm => {
            if (pm.matchType !== 'one_way') return false;
            const p = pm.payload || {};
            return p.needOpportunityId === opportunity.id || p.offerOpportunityId === opportunity.id;
        });
        if (myMatch && myMatch.matchScore != null) {
            const pct = Math.round(myMatch.matchScore * 100);
            document.getElementById('info-match-chip').style.display = 'flex';
            document.getElementById('info-match-score').textContent = `${pct}%`;
        }
    }
    
    // Description
    document.getElementById('opportunity-description').innerHTML = 
        escapeHtml(opportunity.description || 'No description available');

    renderScopeSection(opportunity);
    renderWorkPackages(opportunity);
    
    // Exchange details
    const hasExchangeData = opportunity.exchangeData && Object.keys(opportunity.exchangeData).length > 0;
    const hasValueExchange = opportunity.value_exchange && Object.keys(opportunity.value_exchange).length > 0;
    if (hasExchangeData || hasValueExchange) {
        document.getElementById('exchange-section').style.display = 'block';
        renderExchangeDetails(opportunity);
    }
    
    const actionsDiv = document.getElementById('opportunity-actions');
    if (isOwner) {
        const oppService = window.opportunityService;
        const canCancel = oppService && oppService.canCancelOpportunity(opportunity);
        const editRoute = '/opportunities/' + opportunity.id + '/edit';
        let btns =
            '<a href="#" data-route="' +
            editRoute +
            '" class="btn btn--edit" title="Edit this opportunity">' +
            '<i class="ph-duotone ph-pencil-simple" aria-hidden="true"></i><span>Edit</span></a>';
        if (canCancel) {
            btns +=
                '<button type="button" id="btn-cancel-opportunity" class="btn btn--cancel" data-opp-id="' +
                opportunity.id +
                '" title="Cancel posting"><i class="ph-duotone ph-x-circle" aria-hidden="true"></i><span>Cancel</span></button>';
        }
        btns +=
            '<button type="button" class="btn btn--delete" data-opp-delete="' +
            opportunity.id +
            '" title="Delete opportunity"><i class="ph-duotone ph-trash" aria-hidden="true"></i><span class="btn__label">Delete</span></button>';
        actionsDiv.innerHTML = btns;
        const cancelBtn = document.getElementById('btn-cancel-opportunity');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => cancelOpportunity(cancelBtn.dataset.oppId));
        }
        const delBtn = actionsDiv.querySelector('[data-opp-delete]');
        if (delBtn) {
            delBtn.addEventListener('click', () => {
                const oid = delBtn.getAttribute('data-opp-delete');
                if (oid) deleteOpportunity(oid);
            });
        }
    } else {
        actionsDiv.innerHTML = '';
    }
    
    // Model-specific details
    await renderModelDetails(opportunity);
    
    // Show apply section or already applied
    if (canApply) {
        const appliedSection = document.getElementById('already-applied-section');
        const applySection = document.getElementById('apply-section');
        const appliedHeading = appliedSection?.querySelector('h3');

        if (currentApplication && !applicationCanReapply) {
            isEditMode = applicationCanEdit;
            if (appliedSection) appliedSection.style.display = 'block';
            document.getElementById('applied-date').textContent =
                new Date(currentApplication.createdAt).toLocaleDateString();
            const statusLabel = getApplicationStatusLabel(currentApplication.status);
            const statusEl = document.getElementById('applied-status');
            statusEl.textContent = statusLabel;
            statusEl.className = `badge ${getApplicationStatusBadgeClass(currentApplication.status)}`;

            if (appliedHeading) {
                if (currentApplication.status === 'accepted') {
                    appliedHeading.textContent = 'Application accepted';
                } else {
                    appliedHeading.textContent = "You've already applied";
                }
            }

            const editBtn = bindListenerFresh('btn-edit-application', 'click', () => {
                startApplicationWizard();
            });
            if (editBtn) editBtn.style.display = applicationCanEdit ? '' : 'none';
        } else if (currentApplication && applicationCanReapply) {
            isEditMode = false;
            if (appliedSection) appliedSection.style.display = 'block';
            document.getElementById('applied-date').textContent =
                new Date(currentApplication.createdAt).toLocaleDateString();
            const statusEl = document.getElementById('applied-status');
            statusEl.textContent = getApplicationStatusLabel(currentApplication.status);
            statusEl.className = `badge ${getApplicationStatusBadgeClass(currentApplication.status)}`;
            if (appliedHeading) {
                appliedHeading.textContent = currentApplication.status === 'withdrawn'
                    ? 'Previous application withdrawn'
                    : 'Previous application rejected';
            }
            const editBtn = document.getElementById('btn-edit-application');
            if (editBtn) editBtn.style.display = 'none';
            if (applySection) applySection.style.display = 'block';
            const applyBtn = bindListenerFresh('btn-start-apply', 'click', () => {
                startApplicationWizard({ reapply: true });
            });
            if (applyBtn) {
                applyBtn.innerHTML = '<i class="ph-duotone ph-paper-plane-tilt"></i> Apply Again';
            }
        } else {
            isEditMode = false;
            if (applySection) applySection.style.display = 'block';
            bindListenerFresh('btn-start-apply', 'click', () => {
                startApplicationWizard();
            });
        }
    } else if (authService.isPendingApproval && authService.isPendingApproval() && !isOwner && (opportunity.status === 'published' || opportunity.status === 'in_negotiation')) {
        // Pending user: show apply section with disabled button and tooltip
        const applySection = document.getElementById('apply-section');
        const applyBtn = document.getElementById('btn-start-apply');
        if (applySection) applySection.style.display = 'block';
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.setAttribute('title', 'Action disabled until your account is approved.');
            applyBtn.classList.add('opacity-75', 'cursor-not-allowed');
        }
    } else if (currentApplication || existingDeal) {
        const appliedSection = document.getElementById('already-applied-section');
        const applySection = document.getElementById('apply-section');
        if (applySection) applySection.style.display = 'none';
        if (appliedSection) {
            appliedSection.style.display = 'block';
            const appliedHeading = appliedSection.querySelector('h3');
            if (appliedHeading) {
                if (existingDeal) {
                    appliedHeading.textContent = 'Deal in progress';
                } else if (currentApplication?.status === 'accepted') {
                    appliedHeading.textContent = 'Application accepted';
                } else {
                    appliedHeading.textContent = "You've already applied";
                }
            }
            const dateEl = document.getElementById('applied-date');
            if (dateEl && currentApplication?.createdAt) {
                dateEl.textContent = new Date(currentApplication.createdAt).toLocaleDateString();
            } else if (dateEl && existingDeal?.createdAt) {
                dateEl.textContent = new Date(existingDeal.createdAt).toLocaleDateString();
            }
            const statusEl = document.getElementById('applied-status');
            if (statusEl) {
                if (existingDeal) {
                    statusEl.textContent = 'Matched';
                    statusEl.className = 'badge badge--success';
                } else if (currentApplication) {
                    statusEl.textContent = getApplicationStatusLabel(currentApplication.status);
                    statusEl.className = `badge ${getApplicationStatusBadgeClass(currentApplication.status)}`;
                }
            }
            const editBtn = document.getElementById('btn-edit-application');
            if (editBtn) editBtn.style.display = 'none';
        }
    }
    
    if (canViewApplications) {
        document.getElementById('applications-section').style.display = 'block';
    }
    
    if (opportunity.status === 'contracted' || opportunity.status === 'in_execution' || opportunity.status === 'completed') {
        await loadAndRenderContract(opportunity);
    }
}

async function loadAndRenderContract(opportunity) {
    const section = document.getElementById('contract-section');
    const summaryEl = document.getElementById('contract-summary');
    const milestonesEl = document.getElementById('contract-milestones');
    const actionsEl = document.getElementById('contract-actions');
    if (!section || !summaryEl) return;
    
    const deal = await dataService.getDealByOpportunityId(opportunity.id);
    const contract = deal ? await dataService.getContractByDealId(deal.id) : await dataService.getContractByOpportunityId(opportunity.id);

    if (!deal && !contract) {
        section.style.display = 'block';
        summaryEl.innerHTML = '<p class="text-gray-500">No deal or contract record found.</p>';
        if (milestonesEl) milestonesEl.innerHTML = '';
        if (actionsEl) actionsEl.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    const parties = contract ? dataService.getContractParties(contract) : (deal.participants || []).map(p => ({ userId: p.userId, role: p.role || 'participant', signedAt: p.signedAt }));
    const partyUsers = await Promise.all(parties.map(p => dataService.getUserOrCompanyById(p.userId)));
    const partiesLabel = parties.map((p, i) => {
        const u = partyUsers[i];
        const name = u?.profile?.name || u?.email || p.userId;
        const roleLabel = typeof formatParticipantRole === 'function'
            ? formatParticipantRole(p.role, 'Participant')
            : (p.role || 'participant');
        return name + ' (' + roleLabel + ')';
    }).join(' – ');

    summaryEl.innerHTML = `
        <p><strong>Parties:</strong> ${escapeHtml(partiesLabel)}</p>
        <p><strong>Scope:</strong> ${escapeHtml((deal || contract).scope || opportunity.title)}</p>
        <p><strong>Payment:</strong> ${escapeHtml((deal || contract).paymentMode || (deal && deal.exchangeMode) || opportunity.exchangeMode || '—')}</p>
        <p><strong>Duration:</strong> ${escapeHtml((deal && deal.timeline && (deal.timeline.start || deal.timeline.end)) ? (deal.timeline.start || '') + ' to ' + (deal.timeline.end || '') : (contract && contract.duration) || '—')}</p>
        ${deal ? `<p><a href="#" data-route="/deals/${escapeHtml(deal.id)}" class="text-primary font-medium">Open Deal (execution)</a></p>` : ''}
    `;

    const milestones = (deal && deal.milestones) ? deal.milestones : [];
    const dealId = deal ? deal.id : (contract && contract.dealId) || null;
    if (milestonesEl) {
        if (dealId) {
            milestonesEl.innerHTML = milestones.length ? `
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Milestones (Deal)</h3>
        <ul id="milestones-list" class="space-y-2">
            ${milestones.map((m, i) => `
                <li class="flex items-center justify-between p-2 border rounded ${(m.status || 'pending') === 'approved' ? 'bg-green-50' : ''}" data-milestone-index="${i}" data-milestone-id="${escapeHtml(m.id)}">
                    <span>${escapeHtml(m.title)} ${m.dueDate ? '(' + escapeHtml(m.dueDate) + ')' : ''}</span>
                    <span class="badge badge-${(m.status || 'pending') === 'approved' ? 'success' : 'secondary'}">${(m.status || 'pending') === 'approved' ? 'Done' : (m.status || 'pending')}</span>
                    ${(m.status || 'pending') !== 'approved' && (deal.status === 'execution' || deal.status === 'active') ? `<button type="button" class="btn btn-sm btn-primary mark-milestone-done" data-deal-id="${escapeHtml(dealId)}" data-milestone-id="${escapeHtml(m.id)}">Mark complete</button>` : ''}
                </li>
            `).join('')}
        </ul>
        ${(deal.status === 'execution' || deal.status === 'active') ? `<a href="#" data-route="/deals/${escapeHtml(dealId)}" class="btn btn-secondary btn-sm mt-2">Manage milestones in Deal</a>` : ''}
            ` : `<p class="text-gray-500">No milestones yet. <a href="#" data-route="/deals/${escapeHtml(dealId)}">Open Deal</a> to add milestones.</p>`;
        } else {
            milestonesEl.innerHTML = '<p class="text-muted">Execution is managed by the linked Deal.</p>';
        }
    }

    if (dealId && milestonesEl) {
        milestonesEl.querySelectorAll('.mark-milestone-done').forEach(btn => {
            btn.addEventListener('click', () => markDealMilestoneComplete(btn.dataset.dealId, btn.dataset.milestoneId));
        });
    }

    const user = authService.getCurrentUser();
    const isOwner = user && opportunity.creatorId === user.id;
    let actionsHtml = '';
    if (dealId && opportunity.status === 'contracted' && deal && (deal.status === 'active' || deal.status === 'execution') && isOwner) {
        actionsHtml += `<button type="button" id="start-execution-btn" class="btn btn-primary" data-opp-id="${opportunity.id}" data-deal-id="${dealId}">Start execution</button>`;
    }
    const allDone = milestones.length > 0 && milestones.every(m => (m.status || 'pending') === 'approved');
    if (dealId && opportunity.status === 'in_execution' && allDone && isOwner) {
        actionsHtml += `<button type="button" id="confirm-completion-btn" class="btn btn-success" data-opp-id="${opportunity.id}" data-deal-id="${dealId}">Confirm completion</button>`;
    }
    if (opportunity.status === 'completed' && isOwner) {
        actionsHtml += `<button type="button" id="close-opportunity-btn" class="btn btn-secondary" data-opp-id="${opportunity.id}">Close opportunity</button>`;
    }
    if (dealId && deal && (deal.status === 'execution' || deal.status === 'active') && isOwner) {
        actionsHtml += `<button type="button" id="terminate-contract-btn" class="btn btn-danger" data-opp-id="${opportunity.id}" data-deal-id="${dealId}">Terminate deal</button>`;
    }
    if (dealId) {
        actionsHtml += `<a href="#" data-route="/deals/${escapeHtml(dealId)}" class="btn btn-primary">Manage execution</a>`;
    }
    if (actionsEl) actionsEl.innerHTML = actionsHtml;

    document.getElementById('start-execution-btn')?.addEventListener('click', async () => {
        const oppId = document.getElementById('start-execution-btn').dataset.oppId;
        const dId = document.getElementById('start-execution-btn').dataset.dealId;
        await dataService.updateOpportunity(oppId, { status: 'in_execution' });
        if (dId) await dataService.updateDeal(dId, { status: (window.CONFIG && window.CONFIG.DEAL_STATUS && window.CONFIG.DEAL_STATUS.EXECUTION) || 'execution' });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'execution_started',
                entityType: 'deal',
                entityId: dId,
                details: { opportunityId: oppId }
            });
        }
        if (dId) {
            const dealObj = await dataService.getDealById(dId);
            const otherIds = (dealObj.participants || []).filter(p => p.userId !== user.id).map(p => p.userId);
            for (const uid of otherIds) {
                await dataService.createNotification({
                    userId: uid,
                    type: 'execution_started',
                    title: 'Execution started',
                    message: `Work has started for "${opportunity.title}".`,
                    link: `/opportunities/${oppId}`
                });
            }
        }
        await loadOpportunity(oppId);
    });
    document.getElementById('confirm-completion-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('confirm-completion-btn');
        const oppId = btn.dataset.oppId;
        const dId = btn.dataset.dealId;
        await dataService.updateOpportunity(oppId, { status: 'completed' });
        if (dId) await dataService.updateDeal(dId, { status: (window.CONFIG && window.CONFIG.DEAL_STATUS && window.CONFIG.DEAL_STATUS.COMPLETED) || 'completed', completedAt: new Date().toISOString() });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'completion_confirmed',
                entityType: 'opportunity',
                entityId: oppId,
                details: { dealId: dId || '' }
            });
        }
        if (dId) {
            const dealObj = await dataService.getDealById(dId);
            const otherIds = (dealObj.participants || []).filter(p => p.userId !== user.id).map(p => p.userId);
            for (const uid of otherIds) {
                await dataService.createNotification({
                    userId: uid,
                    type: 'opportunity_completed',
                    title: 'Engagement completed',
                    message: `"${opportunity.title}" has been marked as completed.`,
                    link: `/opportunities/${oppId}`
                });
            }
        }
        await loadOpportunity(oppId);
    });
    document.getElementById('close-opportunity-btn')?.addEventListener('click', async () => {
        const oppId = document.getElementById('close-opportunity-btn').dataset.oppId;
        await dataService.updateOpportunity(oppId, { status: 'closed' });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'opportunity_closed',
                entityType: 'opportunity',
                entityId: oppId,
                details: {}
            });
        }
        await loadOpportunity(oppId);
    });
    document.getElementById('terminate-contract-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('terminate-contract-btn');
        if (!btn) return;
        const oppId = btn.dataset.oppId;
        const dId = btn.dataset.dealId;
        if (!confirm('Are you sure you want to terminate this deal? The opportunity will be marked as cancelled.')) return;
        const reason = prompt('Reason for termination (optional):') || '';
        try {
            if (dId) await dataService.updateDeal(dId, { status: (window.CONFIG && window.CONFIG.DEAL_STATUS && window.CONFIG.DEAL_STATUS.CLOSED) || 'closed', closedAt: new Date().toISOString() });
            const contract = dId ? await dataService.getContractByDealId(dId) : null;
            if (contract) await dataService.updateContract(contract.id, { status: 'terminated' });
            await dataService.updateOpportunity(oppId, { status: 'cancelled' });
            const user = authService.getCurrentUser();
            if (user) {
                await dataService.createAuditLog({
                    userId: user.id,
                    action: 'deal_terminated',
                    entityType: 'deal',
                    entityId: dId || '',
                    details: { opportunityId: oppId, reason }
                });
            }
            if (dId && user) {
                const dealObj = await dataService.getDealById(dId);
                const otherIds = (dealObj.participants || []).filter(p => p.userId !== user.id).map(p => p.userId);
                for (const uid of otherIds) {
                    await dataService.createNotification({
                        userId: uid,
                        type: 'contract_terminated',
                        title: 'Deal terminated',
                        message: `The deal has been terminated by the opportunity owner.${reason ? ' Reason: ' + reason : ''}`,
                        link: `/opportunities/${oppId}`
                    });
                }
            }
            await loadOpportunity(oppId);
        } catch (err) {
            console.error('Error terminating deal:', err);
            alert('Failed to terminate deal.');
        }
    });
}

async function markDealMilestoneComplete(dealId, milestoneId) {
    const user = authService.getCurrentUser();
    await dataService.updateDealMilestone(dealId, milestoneId, { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user && user.id });
    if (user) {
        const deal = await dataService.getDealById(dealId);
        const m = (deal.milestones || []).find(x => x.id === milestoneId);
        if (m) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'milestone_completed',
                entityType: 'deal',
                entityId: dealId,
                details: { milestoneId, milestoneTitle: m.title, opportunityId: deal.opportunityId }
            });
        }
        const otherIds = (deal.participants || []).filter(p => p.userId !== user.id).map(p => p.userId);
        const opp = currentOpportunity || (deal.opportunityId && await dataService.getOpportunityById(deal.opportunityId));
        const title = (opp && opp.title) || 'the opportunity';
        for (const uid of otherIds) {
            await dataService.createNotification({
                userId: uid,
                type: 'milestone_completed',
                title: 'Milestone completed',
                message: `Milestone was marked complete for "${title}".`,
                link: `/deals/${dealId}`
            });
        }
    }
    await loadAndRenderContract(currentOpportunity);
}

function addMilestone(contractId) {
    const contentHTML = `
        <form id="milestone-form" class="space-y-3">
            <div>
                <label for="milestone-title" class="block text-sm font-medium text-gray-700 mb-1">Milestone title <span class="text-red-500">*</span></label>
                <input type="text" id="milestone-title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. Design phase documentation" required />
            </div>
            <div>
                <label for="milestone-due" class="block text-sm font-medium text-gray-700 mb-1">Due date (optional)</label>
                <input type="date" id="milestone-due" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" id="milestone-form-add" class="btn btn-primary">Add milestone</button>
                <button type="button" id="milestone-form-cancel" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;
    if (typeof modalService === 'undefined') {
        const title = prompt('Milestone title:');
        if (!title) return;
        const dueDate = prompt('Due date (YYYY-MM-DD, optional):') || '';
        submitMilestoneForm(contractId, title, dueDate);
        return;
    }
    modalService.showCustom(contentHTML, 'Add milestone', { confirmText: 'Close' }).then(() => {});
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;
    const addBtn = modalEl.querySelector('#milestone-form-add');
    const cancelBtn = modalEl.querySelector('#milestone-form-cancel');
    const titleInput = modalEl.querySelector('#milestone-title');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const title = titleInput?.value?.trim();
            if (!title) {
                if (titleInput) titleInput.focus();
                return;
            }
            const dueInput = modalEl.querySelector('#milestone-due');
            const dueDate = dueInput?.value?.trim() || '';
            modalService.close();
            await submitMilestoneForm(contractId, title, dueDate);
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modalService.close());
    }
}

async function submitMilestoneForm(contractId, title, dueDate) {
    try {
        const contract = await dataService.getContractById(contractId);
        const milestones = [...(contract.milestones || [])];
        milestones.push({ id: 'm' + Date.now(), title, dueDate: dueDate || '', status: 'pending' });
        await dataService.updateContract(contractId, { milestones });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'milestone_added',
                entityType: 'contract',
                entityId: contractId,
                details: { title, dueDate: dueDate || '', opportunityId: currentOpportunity?.id }
            });
        }
        await loadAndRenderContract(currentOpportunity);
    } catch (error) {
        console.error('Error adding milestone:', error);
        alert('Failed to add milestone. Please try again.');
    }
}

/**
 * Normalize exchange display: primary mode and accepted payment methods.
 * Legacy: when paymentModes is missing, treat as single mode = primary.
 * @param {Object} opportunity
 * @returns {{ primaryMode: string|null, acceptedPaymentModes: string[] }}
 */
function getExchangeDisplayState(opportunity) {
    const exchangeData = opportunity.exchangeData || opportunity;
    const primaryMode = opportunity.exchangeMode ?? exchangeData.exchangeMode ?? null;
    const raw = opportunity.paymentModes;
    const acceptedPaymentModes = Array.isArray(raw) && raw.length > 0
        ? raw
        : (primaryMode ? [primaryMode] : []);
    // Canonical order for display: cash, equity, profit_sharing, barter, hybrid
    const order = ['cash', 'equity', 'profit_sharing', 'barter', 'hybrid'];
    const sorted = [...acceptedPaymentModes].filter(m => order.includes(m));
    const rest = acceptedPaymentModes.filter(m => !order.includes(m));
    return { primaryMode, acceptedPaymentModes: [...sorted, ...rest] };
}

const EXCHANGE_FIELD_LABELS = {
    cashMilestones: 'Payment Milestones',
    equityPercentage: 'Equity Percentage',
    equityVesting: 'Vesting Schedule',
    equityContribution: 'Equity Contribution',
    companyValuation: 'Company Valuation',
    profitSplit: 'Profit Split',
    profitBasis: 'Profit Basis',
    profitDuration: 'Profit Duration',
    profitDistribution: 'Profit Distribution',
    profitSharePercentage: 'Profit Share Percentage',
    expectedProfit: 'Expected Profit',
    barterOffer: 'Barter Offer',
    barterNeed: 'Barter Need',
    barterValue: 'Barter Value',
    hybridCash: 'Hybrid Cash (%)',
    hybridEquity: 'Hybrid Equity (%)',
    hybridBarter: 'Hybrid Barter (%)',
    hybridCashDetails: 'Hybrid Cash Details',
    hybridEquityDetails: 'Hybrid Equity Details',
    hybridBarterDetails: 'Hybrid Barter Details',
    exchangeTermsSummary: 'Terms Summary'
};

const EXCHANGE_SKIP_KEYS = new Set([
    'exchangeMode', 'budgetRange', 'currency', 'cashAmount', 'cashPaymentTerms',
    'exchangeTermsSummary', 'valueItems', 'alternateExchangeDetails'
]);

const SCOPE_FIELD_KEYS = [
    'requiredSkills', 'offeredSkills', 'coreSkills', 'sectors', 'interests', 'certifications', 'targetRole'
];

const SCOPE_FIELD_LABELS = {
    requiredSkills: 'Required Skills',
    offeredSkills: 'Offered Skills',
    coreSkills: 'Core Skills',
    sectors: 'Sectors',
    interests: 'Interests',
    certifications: 'Certifications',
    targetRole: 'Professional Discipline'
};

const DISPLAY_SYSTEM_KEYS = new Set([
    'title', 'description', 'status', 'modelType', 'subModelType',
    'location', 'locationCountry', 'locationRegion', 'locationCity', 'locationDistrict',
    'exchangeMode', 'exchangeData', 'paymentModes'
]);

function mergeArrayField(a, b) {
    const arrA = Array.isArray(a) ? a : [];
    const arrB = Array.isArray(b) ? b : [];
    const seen = new Set();
    const result = [];
    [...arrA, ...arrB].forEach(v => {
        if (v == null || v === '') return;
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(v);
        }
    });
    return result;
}

function getScopeDisplayFields(opportunity) {
    const scope = opportunity.scope || {};
    const attrs = opportunity.attributes || {};
    const result = {};
    SCOPE_FIELD_KEYS.forEach(key => {
        const scopeVal = scope[key];
        const attrVal = attrs[key];
        if (key === 'targetRole') {
            const val = scopeVal || attrVal;
            if (val != null && val !== '') result[key] = val;
        } else {
            const merged = mergeArrayField(scopeVal, attrVal);
            if (merged.length) result[key] = merged;
        }
    });
    return result;
}

function getOpportunityDisplayFields(opportunity) {
    const scope = opportunity.scope || {};
    const attrs = opportunity.attributes || {};
    const model = opportunity.modelData || {};
    const merged = { ...model, ...attrs, ...scope };
    const result = {};
    Object.keys(merged).forEach(key => {
        if (DISPLAY_SYSTEM_KEYS.has(key)) return;
        if (SCOPE_FIELD_KEYS.includes(key)) return;
        const val = merged[key];
        if (val === null || val === undefined || val === '') return;
        if (Array.isArray(val) && val.length === 0) return;
        result[key] = val;
    });
    return result;
}

const ARRAY_CHIP_KEYS = new Set([
    'requiredSkills', 'offeredSkills', 'coreSkills', 'sectors', 'interests', 'certifications'
]);

const ROLE_CARD_KEYS = new Set([
    'memberRoles', 'partnerRoles', 'minimumRequirements', 'partnerRequirements', 'equitySplit'
]);

const TIMELINE_KEYS = new Set([
    'startDate', 'applicationDeadline', 'tenderDeadline', 'endDate'
]);

const TAG_VARIANT_BY_KEY = {
    requiredSkills: 'skill',
    offeredSkills: 'skill',
    coreSkills: 'core',
    sectors: 'sector',
    interests: 'interest',
    certifications: 'cert',
    targetRole: 'role'
};

function renderTagChips(values, variant) {
    const items = Array.isArray(values) ? values : [values];
    return items.filter(Boolean).map(v => {
        const text = typeof v === 'object' ? (v.label || v.name || v.role || JSON.stringify(v)) : String(v);
        return `<span class="opp-tag opp-tag--${variant}">${escapeHtml(text)}</span>`;
    }).join('');
}

function renderRoleCards(items) {
    if (!Array.isArray(items) || items.length === 0) return '';
    return `<div class="opp-role-cards">${items.map(item => {
        if (typeof item !== 'object' || item === null) {
            return `<div class="opp-role-card"><div class="opp-role-card__title">${escapeHtml(String(item))}</div></div>`;
        }
        const title = item.role || item.partner || item.label || item.requirement || item.criteria || 'Role';
        const scope = item.scope || item.contribution || item.value || item.description || '';
        return `
            <div class="opp-role-card">
                <div class="opp-role-card__title">${escapeHtml(title)}</div>
                ${scope ? `<div class="opp-role-card__scope">${escapeHtml(scope)}</div>` : ''}
            </div>
        `;
    }).join('')}</div>`;
}

function renderDetailFieldContent(key, value) {
    if (value === null || value === undefined || value === '') return '<span class="text-muted">—</span>';

    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try { value = JSON.parse(value); } catch (e) { /* keep string */ }
    }

    if (ROLE_CARD_KEYS.has(key) && Array.isArray(value)) {
        return renderRoleCards(value);
    }

    if (ARRAY_CHIP_KEYS.has(key) && Array.isArray(value)) {
        const variant = TAG_VARIANT_BY_KEY[key] || 'skill';
        return renderTagChips(value, variant);
    }

    if (key === 'targetRole') {
        return renderTagChips([value], 'role');
    }

    return escapeHtml(formatModelDetailValue(value, key));
}

function renderDetailItemHtml(label, value, key, options = {}) {
    const { wide = false, timeline = false } = options;
    const classes = ['detail-item'];
    if (wide) classes.push('detail-item--wide');
    if (timeline) classes.push('detail-item--timeline');
    const content = renderDetailFieldContent(key, value);
    if (!content || content === '<span class="text-muted">—</span>') return '';
    return `
        <div class="${classes.join(' ')}">
            <div class="detail-label">${escapeHtml(label)}</div>
            <div class="detail-value">${content}</div>
        </div>
    `;
}

function renderExchangeDetailItem(label, value, fullWidth) {
    if (value === null || value === undefined || value === '') return '';
    const displayValue = formatModelDetailValue(value);
    if (displayValue === 'N/A') return '';
    return renderDetailItemHtml(label, value, null, { wide: fullWidth });
}

function formatValueItems(items) {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items.map(item => {
        const parts = [item.category, item.description].filter(Boolean);
        const val = item.estimatedValue != null ? ` (${Number(item.estimatedValue).toLocaleString()} SAR)` : '';
        return escapeHtml((parts.join(': ') || 'Item') + val);
    }).join('<br>');
}

function formatAlternateExchangeDetails(alternates) {
    if (!Array.isArray(alternates) || alternates.length === 0) return '';
    return alternates.map(alt => {
        const mode = alt.mode ? formatExchangeMode(alt.mode) : 'Alternate';
        const details = alt.details ? `: ${alt.details}` : '';
        return escapeHtml(mode + details);
    }).join('<br>');
}

function renderExchangeDetails(opportunity) {
    const container = document.getElementById('exchange-details');
    const exchangeData = opportunity.exchangeData || {};
    const valueExchange = opportunity.value_exchange || {};
    const { primaryMode, acceptedPaymentModes } = getExchangeDisplayState(opportunity);
    const showAcceptedPaymentMethodsRow = acceptedPaymentModes.length > 1;
    let html = '';

    if (exchangeData.budgetRange || primaryMode) {
        const budget = exchangeData.budgetRange;
        const currency = budget?.currency || exchangeData.currency || 'SAR';
        html += '<div class="opp-exchange-featured">';
        if (primaryMode) {
            html += `<span class="opp-exchange-mode-pill"><i class="ph-duotone ph-currency-circle-dollar" aria-hidden="true"></i>${formatExchangeMode(primaryMode)}</span>`;
        }
        if (budget) {
            html += `
                <div>
                    <div class="opp-exchange-featured__label">Budget Range</div>
                    <div class="opp-exchange-featured__value">${budget.min?.toLocaleString() || 0} – ${budget.max?.toLocaleString() || 0} ${currency}</div>
                </div>
            `;
        }
        html += '</div>';
    }

    html += '<div class="detail-grid">';

    if (showAcceptedPaymentMethodsRow) {
        const modeLabels = acceptedPaymentModes.map(m => formatExchangeMode(m));
        html += renderDetailItemHtml('Accepted Payment Methods', modeLabels.join(', '), null, { wide: true });
    }

    if (exchangeData.currency && !exchangeData.budgetRange) {
        html += renderDetailItemHtml('Currency', exchangeData.currency, null);
    }

    if (exchangeData.cashAmount) {
        html += renderDetailItemHtml('Amount', `${exchangeData.cashAmount.toLocaleString()} ${exchangeData.currency || 'SAR'}`, null);
    }

    if (exchangeData.cashPaymentTerms) {
        html += renderDetailItemHtml('Payment Terms', exchangeData.cashPaymentTerms, null);
    }

    Object.keys(EXCHANGE_FIELD_LABELS).forEach(key => {
        if (EXCHANGE_SKIP_KEYS.has(key)) return;
        html += renderExchangeDetailItem(EXCHANGE_FIELD_LABELS[key], exchangeData[key]);
    });

    if (exchangeData.valueItems && exchangeData.valueItems.length > 0) {
        html += `
            <div class="detail-item detail-item--wide">
                <div class="detail-label">Value Items</div>
                <div class="detail-value">${formatValueItems(exchangeData.valueItems)}</div>
            </div>
        `;
    }

    if (exchangeData.alternateExchangeDetails && exchangeData.alternateExchangeDetails.length > 0) {
        html += `
            <div class="detail-item detail-item--wide">
                <div class="detail-label">Alternate Exchange Options</div>
                <div class="detail-value">${formatAlternateExchangeDetails(exchangeData.alternateExchangeDetails)}</div>
            </div>
        `;
    }

    if (exchangeData.exchangeTermsSummary) {
        html += renderDetailItemHtml('Terms Summary', exchangeData.exchangeTermsSummary, null, { wide: true });
    }

    if (valueExchange.estimated_value != null) {
        const currency = valueExchange.currency || exchangeData.currency || 'SAR';
        html += renderDetailItemHtml('Estimated Value', `${Number(valueExchange.estimated_value).toLocaleString()} ${currency}`, null);
    }

    if (valueExchange.value_offered) {
        html += renderExchangeDetailItem('Value Offered', valueExchange.value_offered);
    }
    if (valueExchange.value_expected) {
        const expected = Array.isArray(valueExchange.value_expected)
            ? valueExchange.value_expected.join(', ')
            : valueExchange.value_expected;
        html += renderExchangeDetailItem('Value Expected', expected);
    }
    if (valueExchange.accepted_modes && valueExchange.accepted_modes.length > 0) {
        const modes = valueExchange.accepted_modes.map(m => formatExchangeMode(m)).join(', ');
        html += renderExchangeDetailItem('Accepted Modes', modes);
    }
    if (valueExchange.flexibility) {
        const flex = valueExchange.flexibility;
        const flexParts = [];
        if (flex.negotiable) flexParts.push('Negotiable');
        if (flex.min_acceptable != null) flexParts.push(`Min: ${flex.min_acceptable}`);
        if (flex.max_offer != null) flexParts.push(`Max: ${flex.max_offer}`);
        if (flexParts.length) {
            html += renderExchangeDetailItem('Flexibility', flexParts.join(' · '));
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

function renderScopeSection(opportunity) {
    const section = document.getElementById('scope-section');
    const container = document.getElementById('scope-details');
    if (!section || !container) return;

    const scopeFields = getScopeDisplayFields(opportunity);
    const keys = Object.keys(scopeFields).filter(key => {
        const val = scopeFields[key];
        if (val === null || val === undefined || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
    });
    if (keys.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = keys.map(key => {
        const label = SCOPE_FIELD_LABELS[key] || formatLabel(key);
        const content = renderDetailFieldContent(key, scopeFields[key]);
        return `
            <div class="opp-scope-row">
                <div class="opp-scope-row__label">${escapeHtml(label)}</div>
                <div class="opp-scope-row__value">${content}</div>
            </div>
        `;
    }).join('');
}

function renderWorkPackages(opportunity) {
    const section = document.getElementById('work-packages-section');
    const container = document.getElementById('work-packages-list');
    if (!section || !container) return;

    const packages = Array.isArray(opportunity.projectTasks)
        ? opportunity.projectTasks.filter(p => p && p.title)
        : [];
    if (packages.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = `
        <div class="opp-work-packages">
            ${packages.map((p, i) => `
                <div class="opp-work-package-card">
                    <div class="opp-work-package-card__index" aria-hidden="true">${i + 1}</div>
                    <div class="opp-work-package-card__body">
                        <div class="opp-work-package-card__title">${escapeHtml(p.title)}</div>
                        ${p.duration ? `<div class="opp-work-package-card__meta">${escapeHtml(String(p.duration))} days estimated</div>` : ''}
                        ${p.notes ? `<div class="opp-work-package-card__notes">${escapeHtml(p.notes)}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Matching-system attributes shown first in Opportunity Details (labels for display)
const MATCHING_DETAIL_LABELS = {
    startDate: 'Start Date',
    applicationDeadline: 'Application Deadline',
    tenderDeadline: 'Tender Deadline',
    endDate: 'End Date',
    locationRequirement: 'Location',
    workMode: 'Work Mode',
    availability: 'Availability'
};

async function renderModelDetails(opportunity) {
    const container = document.getElementById('model-details');
    const modelSpecificData = getOpportunityDisplayFields(opportunity);

    if (!modelSpecificData || Object.keys(modelSpecificData).length === 0) {
        container.innerHTML = '<p class="text-muted">No additional details available.</p>';
        return;
    }

    const modelDef = getModelDefinition(opportunity.modelType, opportunity.subModelType);
    const attributeMap = {};
    if (modelDef && modelDef.attributes) {
        modelDef.attributes.forEach(attr => {
            attributeMap[attr.key] = attr.label;
        });
    }
    Object.assign(attributeMap, MATCHING_DETAIL_LABELS);

    const detailKeys = Object.keys(modelSpecificData);

    const priorityKeys = ['startDate', 'applicationDeadline', 'tenderDeadline', 'endDate', 'locationRequirement', 'workMode', 'availability'];
    const sortedKeys = [...detailKeys].sort((a, b) => {
        const ai = priorityKeys.indexOf(a);
        const bi = priorityKeys.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
    });

    const detailsHTML = sortedKeys.map(key => {
        const value = modelSpecificData[key];
        const label = attributeMap[key] || formatLabel(key);
        const isTimeline = TIMELINE_KEYS.has(key);
        const isWide = ROLE_CARD_KEYS.has(key);
        return renderDetailItemHtml(label, value, key, { timeline: isTimeline, wide: isWide });
    }).filter(Boolean).join('');

    container.innerHTML = detailsHTML || '<p class="text-muted">No additional details available.</p>';
}

function formatModelDetailValue(value, key) {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    // If value is a string that looks like JSON array (e.g. stored as string), parse it
    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try {
            value = JSON.parse(value);
        } catch (e) { /* leave as string */ }
    }
    
    if (Array.isArray(value)) {
        if (value.length === 0) return 'None';
        if (typeof value[0] === 'object' && value[0] !== null) {
            return value.map(item => {
                if (item.label != null && item.value != null) return `${item.label}: ${item.value}`;
                if (item.role && item.scope) return `${item.role}: ${item.scope}`;
                if (item.requirement) return item.requirement;
                if (item.criteria) return item.criteria;
                if (item.partner && item.contribution) return `${item.partner}: ${item.contribution}`;
                if (item.cost && item.amount) return `${item.cost}: ${item.amount.toLocaleString()} SAR`;
                return JSON.stringify(item);
            }).join('; ');
        }
        return value.join(', ');
    }
    
    if (typeof value === 'object' && value !== null) {
        if (value.min !== undefined && value.max !== undefined) {
            return `${value.min.toLocaleString()} - ${value.max.toLocaleString()} ${value.currency || ''}`;
        }
        if (value.start && value.end) {
            return `${new Date(value.start).toLocaleDateString()} to ${new Date(value.end).toLocaleDateString()}`;
        }
        return JSON.stringify(value);
    }
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number' && value >= 1000) return value.toLocaleString();
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return new Date(value).toLocaleDateString();
    }
    
    return String(value);
}

async function startApplicationWizard(options = {}) {
    const reapply = !!options.reapply || applicationCanReapply;
    if (reapply) {
        isEditMode = false;
    } else if (currentApplication && !applicationCanEdit) {
        alert('This application can no longer be edited.');
        return;
    }

    currentWizardStep = 1;
    
    document.getElementById('wizard-steps').style.display = 'flex';
    document.getElementById('wizard-nav').style.display = 'flex';
    
    const formApplication = isEditMode && currentApplication ? currentApplication : null;
    generateDetailedResponses(currentOpportunity, formApplication);
    generateTaskBidding(currentOpportunity, formApplication);
    
    if (isEditMode && currentApplication) {
        await populateApplicationForm(currentApplication);
    }
    
    goToWizardStep(2);
}

function setupWizardNavigation() {
    // Bind fresh each time so re-rendering the detail view (e.g. after a
    // data-refresh event) cannot stack duplicate wizard handlers.
    bindListenerFresh('btn-prev', 'click', () => {
        goToWizardStep(getPreviousStep());
    });

    bindListenerFresh('btn-next', 'click', () => {
        if (validateCurrentStep()) {
            goToWizardStep(getNextStep());
        }
    });

    bindListenerFresh('btn-cancel', 'click', () => {
        if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
            goToWizardStep(1);
            document.getElementById('wizard-steps').style.display = 'none';
            document.getElementById('wizard-nav').style.display = 'none';
        }
    });

    bindListenerFresh('btn-submit', 'click', submitApplication);

    bindListenerFresh('btn-demo-fill', 'click', fillDemoData);
}

function getNextStep() {
    let next = currentWizardStep + 1;
    
    // Skip step 3 if no detailed responses
    if (next === 3 && !hasDetailedResponses) next = 4;
    
    // Skip step 5 if no task bidding
    if (next === 5 && !hasTaskBidding) next = 6;
    
    return next;
}

function getPreviousStep() {
    let prev = currentWizardStep - 1;
    
    // Skip step 5 if no task bidding
    if (prev === 5 && !hasTaskBidding) prev = 4;
    
    // Skip step 3 if no detailed responses
    if (prev === 3 && !hasDetailedResponses) prev = 2;
    
    // Don't go below step 1
    if (prev < 1) prev = 1;
    
    return prev;
}

function goToWizardStep(step) {
    // Hide all steps (1..6)
    for (let i = 1; i <= 6; i++) {
        const stepContent = document.getElementById(`step-${i}`);
        if (stepContent) stepContent.style.display = 'none';
        
        const stepIndicator = document.querySelector(`.wizard-step[data-step="${i}"]`);
        if (stepIndicator) {
            stepIndicator.classList.remove('active');
            if (i < step) stepIndicator.classList.add('completed');
            else stepIndicator.classList.remove('completed');
        }
    }
    
    // Show current step
    const currentStepContent = document.getElementById(`step-${step}`);
    if (currentStepContent) currentStepContent.style.display = 'block';
    
    const currentStepIndicator = document.querySelector(`.wizard-step[data-step="${step}"]`);
    if (currentStepIndicator) currentStepIndicator.classList.add('active');
    
    currentWizardStep = step;
    
    // Populate step 4 (Payment / Your Offer) when entering
    if (step === 4 && currentOpportunity) {
        const mode = currentOpportunity.exchangeMode || currentOpportunity.exchangeData?.exchangeMode;
        const labelEl = document.getElementById('payment-opportunity-mode-label');
        if (labelEl) labelEl.textContent = mode ? formatExchangeMode(mode) : 'Not specified';
        const currencySelect = document.getElementById('application-requested-currency');
        if (currencySelect) {
            const oppCurrency = (currentOpportunity.value_exchange && currentOpportunity.value_exchange.currency)
                || (currentOpportunity.exchangeData && currentOpportunity.exchangeData.currency) || 'SAR';
            currencySelect.value = oppCurrency;
        }
        if (isEditMode && currentApplication && currentApplication.responses) {
            const prefEl = document.getElementById('application-payment-preference');
            const commentsEl = document.getElementById('application-payment-comments');
            if (prefEl && currentApplication.responses.paymentPreference) prefEl.value = currentApplication.responses.paymentPreference;
            if (commentsEl && currentApplication.responses.paymentComments != null) commentsEl.value = currentApplication.responses.paymentComments;
        }
        if (currentApplication && currentApplication.application_value) {
            const av = currentApplication.application_value;
            const appUtils = window.opportunityApplicationsUtils;
            const n = appUtils ? appUtils.normalizeApplicationValue(av) : null;
            const offeredEl = document.getElementById('application-offered-value');
            const requestedEl = document.getElementById('application-requested-value');
            const currencyEl = document.getElementById('application-requested-currency');
            const offeredRaw = n ? n.offeredValue : av.offered_value;
            const requestedRaw = n
                ? (n.requestedNumber != null ? n.requestedNumber : n.requestedValue)
                : av.requested_value;
            const currencyRaw = n ? n.currency : av.currency;
            if (offeredEl) offeredEl.value = typeof offeredRaw === 'string' ? offeredRaw : (offeredRaw && offeredRaw.description) || '';
            if (requestedEl && requestedRaw != null) requestedEl.value = requestedRaw;
            if (currencyEl && currencyRaw) currencyEl.value = currencyRaw;
        }
    }
    
    // Update navigation buttons
    updateWizardNav();
    
    // If on review step, populate review
    if (step === 6) {
        populateReview();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateWizardNav() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancel = document.getElementById('btn-cancel');
    const wizardNav = document.getElementById('wizard-nav');
    const wizardSteps = document.getElementById('wizard-steps');
    
    // Step 1 = overview (no nav)
    if (currentWizardStep === 1) {
        wizardNav.style.display = 'none';
        wizardSteps.style.display = 'none';
        return;
    }
    
    wizardNav.style.display = 'flex';
    wizardSteps.style.display = 'flex';
    
    // Previous button
    btnPrev.style.display = currentWizardStep > 2 ? 'inline-flex' : 'none';
    
    // Next/Submit buttons
    const isLastStep = currentWizardStep === 6;
    btnNext.style.display = isLastStep ? 'none' : 'inline-flex';
    btnSubmit.style.display = isLastStep ? 'inline-flex' : 'none';
    
    // Update submit button text
    if (isEditMode) {
        btnSubmit.innerHTML = '<i class="ph-duotone ph-pencil"></i> Update Application';
    }
}

function validateCurrentStep() {
    switch (currentWizardStep) {
        case 2: // Proposal
            const proposal = document.getElementById('application-proposal').value.trim();
            if (!proposal) {
                alert('Please provide a proposal');
                document.getElementById('application-proposal').focus();
                return false;
            }
            break;
            
        case 3: // Detailed responses
            // Optional validation for required fields
            break;
            
        case 4: // Payment / Your Offer
            const paymentPref = document.getElementById('application-payment-preference');
            if (paymentPref && !paymentPref.value) {
                alert('Please select your payment preference');
                paymentPref.focus();
                return false;
            }
            const offeredValueEl = document.getElementById('application-offered-value');
            if (offeredValueEl && !offeredValueEl.value.trim()) {
                alert('Please describe what you are offering');
                offeredValueEl.focus();
                return false;
            }
            break;
            
        case 5: // Task bidding
            const bidAmount = document.getElementById('task-bid-amount');
            const bidComments = document.getElementById('task-bid-comments');
            if (bidAmount && !bidAmount.value) {
                alert('Please provide a bid amount');
                bidAmount.focus();
                return false;
            }
            if (bidComments && !bidComments.value.trim()) {
                alert('Please provide comments about your approach');
                bidComments.focus();
                return false;
            }
            break;
    }
    
    return true;
}

function populateReview() {
    // Proposal
    const proposal = document.getElementById('application-proposal').value.trim();
    document.getElementById('review-proposal').textContent = proposal || 'No proposal provided';
    
    // Detailed responses
    const responsesSection = document.getElementById('review-responses-section');
    const responsesContainer = document.getElementById('review-responses');
    
    if (hasDetailedResponses) {
        const responses = collectDetailedResponses();
        if (Object.keys(responses).length > 0) {
            responsesSection.style.display = 'block';
            let html = '';
            for (const [key, value] of Object.entries(responses)) {
                const label = formatLabel(key.replace('response_', ''));
                html += `<div style="margin-bottom: 1rem;"><strong>${label}:</strong><br>${escapeHtml(value)}</div>`;
            }
            responsesContainer.innerHTML = html;
        } else {
            responsesSection.style.display = 'none';
        }
    } else {
        responsesSection.style.display = 'none';
    }
    
    // Payment preference
    const paymentPrefEl = document.getElementById('application-payment-preference');
    const paymentCommentsEl = document.getElementById('application-payment-comments');
    const reviewPaymentEl = document.getElementById('review-payment');
    if (reviewPaymentEl) {
        const pref = paymentPrefEl ? paymentPrefEl.value : '';
        const prefLabel = pref === 'accept' ? 'Accept as stated' : pref === 'discuss' ? 'Prefer to discuss' : '—';
        const comments = paymentCommentsEl ? paymentCommentsEl.value.trim() : '';
        const offeredVal = (document.getElementById('application-offered-value')?.value || '').trim();
        const requestedVal = (document.getElementById('application-requested-value')?.value || '').trim();
        const requestedCur = document.getElementById('application-requested-currency')?.value || 'SAR';
        reviewPaymentEl.innerHTML = `
            <div style="margin-bottom: 0.5rem;"><strong>Preference:</strong> ${escapeHtml(prefLabel)}</div>
            ${offeredVal ? `<div style="margin-bottom: 0.5rem;"><strong>Your offer:</strong> ${escapeHtml(offeredVal)}</div>` : ''}
            ${requestedVal ? `<div style="margin-bottom: 0.5rem;"><strong>Requested value:</strong> ${escapeHtml(requestedVal)} ${escapeHtml(requestedCur)}</div>` : ''}
            ${comments ? `<div><strong>Comments:</strong><br>${escapeHtml(comments)}</div>` : ''}
        `;
    }
    
    // Task bidding
    const bidSection = document.getElementById('review-bid-section');
    const bidContainer = document.getElementById('review-bid');
    
    if (hasTaskBidding) {
        const bids = collectTaskBids();
        if (bids.taskBidAmount) {
            bidSection.style.display = 'block';
            bidContainer.innerHTML = `
                <div style="margin-bottom: 0.5rem;"><strong>Bid Amount:</strong> ${parseFloat(bids.taskBidAmount).toLocaleString()} SAR</div>
                ${bids.taskBidDuration ? `<div style="margin-bottom: 0.5rem;"><strong>Duration:</strong> ${bids.taskBidDuration} days</div>` : ''}
                ${bids.taskBidComments ? `<div><strong>Approach:</strong><br>${escapeHtml(bids.taskBidComments)}</div>` : ''}
            `;
        } else {
            bidSection.style.display = 'none';
        }
    } else {
        bidSection.style.display = 'none';
    }
}

async function submitApplication() {
    const user = authService.getCurrentUser();
    if (!user) {
        alert('You must be logged in to apply');
        return;
    }
    
    const proposal = document.getElementById('application-proposal').value.trim();
    const deliverablesRaw = (document.getElementById('application-deliverables')?.value || '').trim();
    const deliverablesList = deliverablesRaw ? deliverablesRaw.split(/\n/).map(s => s.trim()).filter(Boolean) : [];
    const availabilityDateVal = (document.getElementById('application-availability-date')?.value || '').trim() || null;
    const detailedResponses = collectDetailedResponses();
    const taskBids = collectTaskBids();
    const estimatedDurationVal = document.getElementById('application-estimated-duration')?.value;
    const estimatedDurationDays = estimatedDurationVal ? parseInt(estimatedDurationVal, 10) : (taskBids?.taskBidDuration != null ? taskBids.taskBidDuration : null);
    const paymentPreference = document.getElementById('application-payment-preference')?.value || '';
    const paymentComments = (document.getElementById('application-payment-comments')?.value || '').trim();
    const paymentResponses = { paymentPreference, paymentComments };

    const oppMode = currentOpportunity.exchangeMode || currentOpportunity.exchangeData?.exchangeMode || (currentOpportunity.value_exchange && currentOpportunity.value_exchange.mode);
    const offeredValue = (document.getElementById('application-offered-value')?.value || '').trim();
    const requestedValueRaw = (document.getElementById('application-requested-value')?.value || '').trim();
    const requestedCurrency = document.getElementById('application-requested-currency')?.value || 'SAR';
    const requestedValueNum = requestedValueRaw ? parseFloat(String(requestedValueRaw).replace(/,/g, '')) : null;
    const application_value = {
        offered_value: offeredValue,
        requested_value: requestedValueNum != null && !isNaN(requestedValueNum) ? requestedValueNum : requestedValueRaw || null,
        exchange_mode: oppMode,
        currency: requestedCurrency
    };
    if (window.valueCompatibility && currentOpportunity) {
        const compat = window.valueCompatibility.computeValueCompatibility(currentOpportunity, application_value);
        application_value.value_score = compat.value_score;
        application_value.value_breakdown = compat.value_breakdown;
        application_value.value_gap = compat.value_gap;
        application_value.lowValueMatch = compat.lowValueMatch;
    }

    const durationDays = estimatedDurationDays != null && !isNaN(estimatedDurationDays) ? estimatedDurationDays : taskBids?.taskBidDuration;
    const oppEnd = currentOpportunity?.attributes?.endDate || currentOpportunity?.exchangeData?.endDate;

    if (typeof window.validateApplication === 'function') {
        const check = window.validateApplication({
            proposal,
            estimatedDurationDays: durationDays,
            offeredValue: offeredValue ? parseFloat(String(offeredValue).replace(/,/g, '')) : null,
            bidAmount: taskBids?.taskBidAmount,
            availabilityDate: availabilityDateVal
        });
        if (!check.isValid) {
            alert(check.errors[0] || 'Please correct invalid application fields.');
            return;
        }
    }

    let deadlineCompatibility = null;
    if (availabilityDateVal && durationDays && oppEnd) {
        const start = new Date(availabilityDateVal);
        const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const oppEndDate = new Date(oppEnd);
        deadlineCompatibility = end <= oppEndDate ? 'full' : (start <= oppEndDate ? 'partial' : 'no');
    }
    
    try {
        if (isEditMode && currentApplication) {
            if (!applicationCanEdit) {
                alert('This application can no longer be edited.');
                return;
            }
            const updateData = {
                proposal,
                responses: {
                    ...currentApplication.responses,
                    ...detailedResponses,
                    ...taskBids,
                    ...paymentResponses
                },
                application_value,
                availabilityDate: availabilityDateVal,
                estimatedDurationDays: durationDays || undefined,
                deadlineCompatibility: deadlineCompatibility || undefined
            };
            
            await dataService.updateApplication(currentApplication.id, updateData);
            await dataService.replaceApplicationDeliverables(currentApplication.id, deliverablesList);
            await dataService.computeAndSaveRequirementsMatch(currentApplication.id);
            
            await dataService.createNotification({
                userId: currentOpportunity.creatorId,
                type: 'application_updated',
                title: 'Application Updated',
                message: `${user.email || 'An applicant'} updated their application for "${currentOpportunity.title}"`,
                link: `/opportunities/${currentOpportunity.id}`
            });
            
            alert('Application updated successfully!');
        } else {
            const applicationData = {
                opportunityId: currentOpportunity.id,
                applicantId: user.id,
                proposal,
                responses: {
                    ...detailedResponses,
                    ...taskBids,
                    ...paymentResponses
                },
                application_value,
                availabilityDate: availabilityDateVal || undefined,
                estimatedDurationDays: durationDays || undefined,
                deadlineCompatibility: deadlineCompatibility || undefined
            };
            
            const applyContext = readApplyInviteContext(currentOpportunity.id);
            const newApp = await dataService.createApplication(applicationData, {
                matchId: applyContext.matchId,
                actorId: user.id,
                isReplacementApplication: !!applyContext.isReplacement
            });
            clearApplyInviteContext();
            if (deliverablesList.length > 0 && newApp && newApp.id) {
                await dataService.replaceApplicationDeliverables(newApp.id, deliverablesList);
            }
            if (newApp && newApp.id && dataService.getPostMatchesForUser) {
                const postMatches = await dataService.getPostMatchesForUser(user.id);
                const match = postMatches.find(pm => {
                    const p = pm.payload || {};
                    return pm.matchType === 'one_way' && p.needOpportunityId === currentOpportunity.id;
                });
                if (match) {
                    const updates = { matchType: match.matchType || 'one_way' };
                    if (match.matchScore != null) updates.matchScore = match.matchScore;
                    const reasons = match.matchReasons || [];
                    if (reasons.length) {
                        updates.matchBreakdown = {
                            skillMatch: reasons.find(r => r.factor === 'skills') || null,
                            budgetFit: reasons.find(r => r.factor === 'budget') || null,
                            timelineFit: reasons.find(r => r.factor === 'timeline') || null,
                            locationFit: reasons.find(r => r.factor === 'location') || null,
                            reputation: reasons.find(r => r.factor === 'reputation') || null
                        };
                    }
                    await dataService.updateApplication(newApp.id, updates);
                }
                await dataService.computeAndSaveRequirementsMatch(newApp.id);
            }
            
            // First proposal: move opportunity to In Negotiation
            const allApps = await dataService.getApplications();
            const appsForOpp = allApps.filter(a => a.opportunityId === currentOpportunity.id);
            if (appsForOpp.length === 1 && currentOpportunity.status === 'published') {
                await dataService.updateOpportunity(currentOpportunity.id, { status: 'in_negotiation' });
            }
            
            await dataService.createNotification({
                userId: currentOpportunity.creatorId,
                type: 'application_received',
                title: 'New Application',
                message: `You received a new application for "${currentOpportunity.title}"`,
                link: `/opportunities/${currentOpportunity.id}?section=applications`
            });

            await dataService.createNotification({
                userId: user.id,
                type: 'application_submitted',
                title: 'Application Submitted',
                message: `Your application for "${currentOpportunity.title}" has been submitted successfully.`,
                link: `/opportunities/${currentOpportunity.id}`
            });
            
            alert('Application submitted successfully!');
        }

        await loadOpportunity(currentOpportunity.id);
        
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Failed to submit application. Please try again.');
    }
}

/**
 * Demo Fill - Automatically fills the application form with realistic sample data
 */
function fillDemoData() {
    const opportunity = currentOpportunity;
    if (!opportunity) return;
    
    // Generate demo data based on opportunity type
    const demoData = generateDemoApplicationData(opportunity);
    
    // Fill proposal (Step 2)
    const proposalField = document.getElementById('application-proposal');
    if (proposalField) {
        proposalField.value = demoData.proposal;
        proposalField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const deliverablesField = document.getElementById('application-deliverables');
    if (deliverablesField && demoData.deliverables) {
        deliverablesField.value = Array.isArray(demoData.deliverables) ? demoData.deliverables.join('\n') : demoData.deliverables;
    }
    
    // Fill detailed responses (Step 3)
    if (demoData.responses) {
        Object.entries(demoData.responses).forEach(([key, value]) => {
            const field = document.getElementById(`response-${key}`);
            if (field) {
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
    
    // Fill payment mode (Step 4)
    const paymentPrefEl = document.getElementById('application-payment-preference');
    const paymentCommentsEl = document.getElementById('application-payment-comments');
    if (paymentPrefEl) {
        paymentPrefEl.value = demoData.paymentPreference || 'accept';
        paymentPrefEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (paymentCommentsEl && demoData.paymentComments != null) {
        paymentCommentsEl.value = demoData.paymentComments;
        paymentCommentsEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const availabilityEl = document.getElementById('application-availability-date');
    const durationEl = document.getElementById('application-estimated-duration');
    if (availabilityEl && demoData.availabilityDate) availabilityEl.value = demoData.availabilityDate;
    if (durationEl && demoData.estimatedDurationDays != null) durationEl.value = demoData.estimatedDurationDays;
    
    // Fill task bidding (Step 5)
    if (demoData.bid) {
        const bidAmount = document.getElementById('task-bid-amount');
        const bidDuration = document.getElementById('task-bid-duration');
        const bidComments = document.getElementById('task-bid-comments');
        
        if (bidAmount && demoData.bid.amount) {
            bidAmount.value = demoData.bid.amount;
            bidAmount.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (bidDuration && demoData.bid.duration) {
            bidDuration.value = demoData.bid.duration;
            bidDuration.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (bidComments && demoData.bid.comments) {
            bidComments.value = demoData.bid.comments;
            bidComments.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Visual feedback
    showDemoFillFeedback();
}

function generateDemoApplicationData(opportunity) {
    const modelType = opportunity.modelType;
    const subModelType = opportunity.subModelType;
    const title = opportunity.title || 'this opportunity';
    const modelSpecificData = opportunity.attributes || opportunity.modelData || {};
    
    // Demo proposals based on model type
    const proposals = {
        'project_based': {
            'task_based': `I am excited to submit my application for ${title}. With over 8 years of experience in project delivery and a proven track record of completing similar tasks on time and within budget, I am confident I can deliver exceptional results.

My approach combines agile methodologies with rigorous quality assurance to ensure deliverables meet the highest standards. I have successfully completed 15+ similar projects in the past year, consistently receiving 5-star ratings from clients.

Key strengths I bring:
• Deep expertise in the required domain
• Strong communication and reporting practices
• Flexible availability to accommodate project needs
• Access to specialized tools and resources

I am ready to begin immediately upon selection and committed to exceeding expectations.`,
            
            'milestone_based': `I am submitting my application for ${title} with great enthusiasm. My background in milestone-driven project delivery makes me an ideal candidate for this opportunity.

Over the past 5 years, I have successfully managed and delivered 20+ milestone-based projects across various industries. My structured approach ensures clear deliverables, transparent progress tracking, and timely completion of each phase.

What sets me apart:
• Meticulous planning and milestone definition
• Proactive risk management and mitigation
• Regular progress updates and stakeholder communication
• Commitment to quality at every stage

I look forward to discussing how I can contribute to the success of this project.`,
            
            'retainer': `I am pleased to express my interest in ${title}. As an experienced professional offering retainer-based services, I understand the value of consistent, reliable support for ongoing needs.

My retainer clients typically report 40% improvement in operational efficiency due to my proactive approach and deep understanding of their business needs. I pride myself on being available, responsive, and always prepared to tackle challenges as they arise.

Benefits of working with me:
• Dedicated availability during agreed hours
• Quick response times for urgent matters
• Comprehensive monthly reporting
• Continuous improvement recommendations

I am committed to becoming a trusted extension of your team.`
        },
        
        'strategic_partnership': {
            'joint_venture': `We are excited to propose a strategic partnership for ${title}. Our organization brings complementary capabilities that would create significant synergies with your initiative.

Our partnership value proposition:
• Combined market reach of 50,000+ potential customers
• Shared R&D capabilities reducing costs by 30%
• Joint brand recognition in key markets
• Aligned values and long-term growth objectives

We have successfully established 5 joint ventures in the past 3 years, all of which have exceeded initial projections. Our collaborative approach ensures transparent governance and equitable value distribution.

We look forward to exploring this partnership opportunity.`,
            
            'consortium': `We propose joining the consortium for ${title} as a contributing member with specialized expertise in our domain.

Our consortium contribution includes:
• Technical expertise in critical areas
• Established relationships with key stakeholders
• Financial commitment matching requirements
• Dedicated team for consortium activities

Our track record in consortium participation includes 3 successful large-scale initiatives, demonstrating our ability to collaborate effectively while delivering our commitments.`,
            
            'strategic_alliance': `We are interested in forming a strategic alliance around ${title}. Our organization shares compatible goals and can offer mutual benefits through collaboration.

Alliance benefits we offer:
• Access to our distribution network
• Shared technology and best practices
• Joint marketing opportunities
• Knowledge exchange programs

We believe this alliance can create lasting value for both parties while maintaining operational independence.`
        },
        
        'resource_pooling': {
            'equipment_sharing': `I am interested in the equipment sharing arrangement for ${title}. Our facility has complementary equipment that could benefit from shared utilization.

Our contribution:
• Modern equipment maintained to highest standards
• Flexible scheduling to maximize utilization
• Technical support during equipment use
• Fair cost-sharing arrangements

We have participated in 3 similar equipment sharing arrangements with excellent outcomes for all parties.`,
            
            'facility_sharing': `We would like to participate in the facility sharing opportunity for ${title}. Our facilities offer excellent infrastructure that can accommodate shared use.

Facility highlights:
• Prime location with easy access
• State-of-the-art amenities
• Flexible scheduling options
• Professional management and maintenance

We are experienced in managing shared facility arrangements and committed to ensuring smooth operations for all parties.`,
            
            'talent_pooling': `We are excited about the talent pooling opportunity for ${title}. Our team includes skilled professionals who could contribute significantly to shared projects.

Our talent contribution:
• 5 senior specialists available for pooled projects
• Diverse skill sets covering required domains
• Proven collaboration in multi-team environments
• Commitment to knowledge sharing

We believe talent pooling creates opportunities for professional growth while delivering better outcomes.`
        },
        
        'hiring': {
            'full_time': `I am applying for the full-time position related to ${title}. With my background and experience, I am confident I can make significant contributions to your organization.

Qualifications:
• 7+ years of relevant experience
• Advanced degree in the field
• Track record of exceeding performance targets
• Strong references from previous employers

I am seeking a long-term opportunity where I can grow professionally while contributing to organizational success.`,
            
            'part_time': `I am interested in the part-time opportunity for ${title}. My current situation allows me to dedicate focused time to this role while maintaining high quality output.

What I offer:
• Flexible availability matching your needs
• Consistent and reliable performance
• Quick ramp-up due to relevant experience
• Commitment to meeting all deadlines

Part-time arrangements have worked well for me in the past, and I am confident this would be mutually beneficial.`,
            
            'contract': `I am submitting my application for the contract position related to ${title}. As an experienced contractor, I understand the importance of delivering results within defined parameters.

Contract experience:
• 10+ successful contract engagements
• Clean track record of on-time delivery
• Flexibility to adjust scope as needed
• Clear communication throughout engagement

I am ready to begin immediately and committed to delivering exceptional value during the contract period.`
        },
        
        'competition': {
            'innovation_challenge': `We are thrilled to enter this innovation challenge for ${title}. Our team has developed a novel approach that we believe addresses the challenge requirements in a unique way.

Our innovation:
• Patent-pending technology solution
• Validated with pilot customers
• Scalable and cost-effective
• Addresses core problem effectively

We are excited to showcase our work and compete for the opportunity to bring this innovation to market.`,
            
            'hackathon': `Our team is eager to participate in the hackathon for ${title}. We bring diverse skills and a passion for rapid prototyping and creative problem-solving.

Team composition:
• Full-stack developer (5 years experience)
• UX designer (7 years experience)
• Data scientist (4 years experience)
• Product manager (6 years experience)

We have won 3 hackathons in the past year and are ready to bring our best ideas to this challenge.`,
            
            'pitch_competition': `We are excited to participate in the pitch competition for ${title}. Our venture has gained significant traction and we are ready to showcase our progress.

Venture highlights:
• $50,000 in revenue in first 6 months
• 1,000+ active users
• Growing 20% month-over-month
• Clear path to profitability

We look forward to presenting our vision and demonstrating why we deserve to win this competition.`
        }
    };
    
    // Get the proposal based on model type and subtype
    let proposal = proposals[modelType]?.[subModelType] || 
        `I am excited to apply for ${title}. With my background and experience, I am confident I can contribute significantly to this opportunity.

My qualifications include:
• Relevant experience in the domain
• Strong track record of successful delivery
• Excellent communication and collaboration skills
• Commitment to quality and timeliness

I look forward to discussing how I can add value to this initiative.`;
    
    // Generate detailed responses based on the opportunity's requirements
    const responses = {};
    const modelDef = getModelDefinition(modelType, subModelType);
    
    if (modelDef && modelDef.attributes) {
        const responseTemplates = getDemoResponseTemplates();
        
        modelDef.attributes.forEach(attr => {
            if (!['title', 'description', 'status', 'modelType', 'subModelType', 
                  'location', 'locationCountry', 'locationRegion', 'locationCity', 
                  'locationDistrict', 'exchangeMode', 'exchangeData'].includes(attr.key)) {
                
                // Get demo response based on attribute key
                const template = responseTemplates[attr.key] || responseTemplates['default'];
                responses[attr.key] = template(modelSpecificData[attr.key], attr.label);
            }
        });
    }
    
    // Generate bid data for task-based opportunities
    let bid = null;
    if (subModelType === 'task_based') {
        // Budget range is now in exchangeData, fall back to modelSpecificData for backwards compatibility
        const budgetRange = opportunity.exchangeData?.budgetRange || modelSpecificData?.budgetRange;
        const budgetMin = budgetRange?.min || 5000;
        const budgetMax = budgetRange?.max || 50000;
        
        // Calculate a competitive bid (slightly below midpoint)
        const bidAmount = Math.round((budgetMin + budgetMax) / 2 * 0.9);
        
        bid = {
            amount: bidAmount,
            duration: Math.floor(Math.random() * 20) + 10, // 10-30 days
            comments: `Based on my analysis of the task requirements, I propose a comprehensive approach that ensures quality delivery within the specified parameters.

My methodology:
1. Initial Assessment (Days 1-2): Thorough review of requirements and clarification of any questions
2. Planning Phase (Days 3-5): Detailed work breakdown and timeline confirmation
3. Execution Phase (Days 6-${Math.floor((Math.random() * 20) + 10) - 5}): Systematic delivery with regular progress updates
4. Quality Assurance (Final 3 days): Testing, review, and refinement
5. Delivery: Final handoff with documentation and support

Risk mitigation:
• Buffer time built into schedule for unexpected challenges
• Daily progress tracking to identify issues early
• Clear communication channels for rapid decision-making

I am confident this approach will deliver results that exceed expectations.`
        };
    }
    
    return {
        proposal,
        responses,
        bid,
        paymentPreference: 'accept',
        paymentComments: 'The payment terms are acceptable. Open to discussing milestones if needed.',
        deliverables: ['Scope document', 'Progress reports', 'Final deliverable as agreed'],
        availabilityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        estimatedDurationDays: 14
    };
}

function getDemoResponseTemplates() {
    return {
        // Project-related
        'projectTitle': (value, label) => `I have carefully reviewed the ${value || 'project'} and am prepared to contribute effectively to its success.`,
        'projectObjective': (value, label) => `The objective aligns perfectly with my expertise. I would approach this by first understanding the success criteria, then developing a structured plan to achieve each goal systematically.`,
        'projectScope': (value, label) => `I have extensive experience with similar scope requirements. My approach would be to break this down into manageable phases, ensuring clear deliverables at each stage while maintaining focus on the overall objectives.`,
        'detailedScope': (value, label) => `The detailed scope is clear and achievable. I would implement this through a combination of proven methodologies and innovative approaches, ensuring all requirements are met within the defined parameters.`,
        
        // Requirements
        'requirements': (value, label) => `I meet or exceed all listed requirements. My experience directly aligns with these needs, and I can provide specific examples of how I have successfully fulfilled similar requirements in past engagements.`,
        'skillsRequired': (value, label) => `I possess all the required skills at an advanced level. Additionally, I bring complementary capabilities that would add value beyond the basic requirements.`,
        'qualifications': (value, label) => `My qualifications include relevant certifications, extensive hands-on experience, and a track record of successful delivery in similar contexts.`,
        
        // Timeline
        'timeline': (value, label) => `The proposed timeline is realistic for my approach. I would establish clear milestones and maintain regular progress updates to ensure we stay on track.`,
        'estimatedDuration': (value, label) => `Based on my experience, this duration is appropriate. I would implement efficient workflows to maximize productivity while maintaining quality.`,
        'startDate': (value, label) => `I am available to begin as specified. I would use any lead time to prepare thoroughly and hit the ground running.`,
        
        // Budget/Compensation
        'budgetRange': (value, label) => `The budget range is appropriate for the scope of work. My proposal offers excellent value while ensuring high-quality deliverables.`,
        'compensation': (value, label) => `The compensation structure works well for my situation. I am committed to delivering value that exceeds expectations.`,
        
        // Team/Resources
        'teamSize': (value, label) => `I can work effectively within this team structure. I bring strong collaboration skills and experience working in diverse team environments.`,
        'memberRoles': (value, label) => `The role definitions are clear. I understand my responsibilities and how they contribute to the overall success of the initiative.`,
        'resourceRequirements': (value, label) => `I have access to or can acquire all necessary resources. My infrastructure is set up to support efficient delivery.`,
        
        // Deliverables
        'deliverables': (value, label) => `I understand the deliverable expectations and have produced similar outputs in past engagements. I focus on quality, clarity, and actionability in all deliverables.`,
        'milestones': (value, label) => `The milestone structure provides clear checkpoints. I would ensure each milestone is met with high-quality, complete work.`,
        'successCriteria': (value, label) => `The success criteria are well-defined. I would track progress against these metrics and ensure all criteria are met or exceeded.`,
        
        // Terms
        'termsConditions': (value, label) => `I have reviewed the terms and find them acceptable. I am committed to operating within these guidelines throughout the engagement.`,
        'paymentTerms': (value, label) => `The payment terms are fair and workable. I have no concerns with this structure.`,
        
        // Default response
        'default': (value, label) => `Regarding ${label}: I have reviewed this requirement carefully and confirm my ability to meet or exceed expectations. My experience and capabilities align well with what is needed, and I am committed to delivering quality results.`
    };
}

function showDemoFillFeedback() {
    const btnDemoFill = document.getElementById('btn-demo-fill');
    if (!btnDemoFill) return;
    
    const originalText = btnDemoFill.innerHTML;
    btnDemoFill.innerHTML = '<i class="ph-duotone ph-check"></i> Filled!';
    btnDemoFill.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
        btnDemoFill.innerHTML = originalText;
        btnDemoFill.style.background = '';
    }, 2000);
}

function generateDetailedResponses(opportunity, existingApplication = null) {
    const container = document.getElementById('detailed-responses-container');
    if (!container) return;
    
    const modelSpecificData = opportunity.attributes || opportunity.modelData;
    if (!modelSpecificData) return;
    
    const modelDef = getModelDefinition(opportunity.modelType, opportunity.subModelType);
    if (!modelDef || !modelDef.attributes) return;
    
    const relevantAttributes = modelDef.attributes.filter(attr => 
        !['title', 'description', 'status', 'modelType', 'subModelType', 
          'location', 'locationCountry', 'locationRegion', 'locationCity', 
          'locationDistrict', 'exchangeMode', 'exchangeData'].includes(attr.key)
    );
    
    if (relevantAttributes.length === 0) return;
    
    container.innerHTML = relevantAttributes.map(attr => {
        const value = modelSpecificData[attr.key];
        const displayValue = formatModelDetailValue(value, attr.key);
        const existingValue = existingApplication?.responses?.[`response_${attr.key}`] || '';
        
        return `
            <div class="requirement-response-item">
                <label for="response-${attr.key}">
                    ${escapeHtml(attr.label)}
                    ${attr.required ? '<span class="text-red-600">*</span>' : ''}
                </label>
                <div class="requirement-value">
                    <strong>Requirement:</strong> ${escapeHtml(displayValue)}
                </div>
                <textarea 
                    id="response-${attr.key}" 
                    name="response_${attr.key}" 
                    class="form-textarea" 
                    rows="3"
                    placeholder="Provide your response to this requirement..."
                >${escapeHtml(existingValue)}</textarea>
            </div>
        `;
    }).join('');
}

function generateTaskBidding(opportunity, existingApplication = null) {
    const container = document.getElementById('task-bidding-container');
    if (!container) return;
    
    const modelSpecificData = opportunity.attributes || opportunity.modelData;
    if (opportunity.subModelType !== 'task_based' || !modelSpecificData) return;
    
    const taskTitle = modelSpecificData.taskTitle || 'Main Task';
    const taskScope = modelSpecificData.detailedScope || '';
    const packages = Array.isArray(opportunity.projectTasks) ? opportunity.projectTasks.filter(p => p && p.title) : [];
    const packagesHtml = packages.length
        ? `<div class="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div class="text-sm font-semibold text-slate-800 mb-2">Work packages (same opportunity)</div>
            <ul class="list-disc pl-5 space-y-2 text-sm text-slate-700">
                ${packages.map(p => `<li><strong>${escapeHtml(p.title)}</strong>${p.duration ? ` · ${escapeHtml(p.duration)} days` : ''}${p.notes ? `<div class="text-slate-600 mt-0.5">${escapeHtml(p.notes)}</div>` : ''}</li>`).join('')}
            </ul>
           </div>`
        : '';
    // Budget range is now in exchangeData, fall back to modelSpecificData for backwards compatibility
    const budgetRange = opportunity.exchangeData?.budgetRange || modelSpecificData.budgetRange;
    const budgetMin = budgetRange?.min || 0;
    const budgetMax = budgetRange?.max || 0;
    
    const existingBidAmount = existingApplication?.responses?.taskBidAmount || '';
    const existingBidDuration = existingApplication?.responses?.taskBidDuration || '';
    const existingBidComments = existingApplication?.responses?.taskBidComments || '';
    
    container.innerHTML = `
        ${packagesHtml}
        <div class="task-bid-item">
            <div class="task-header">
                <div class="task-title">${escapeHtml(taskTitle)}</div>
            </div>
            <div class="task-scope">${escapeHtml(taskScope || 'No detailed scope provided')}</div>
            ${budgetRange ? `<div class="text-sm text-gray-600 mb-3"><strong>Budget Range:</strong> ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} SAR</div>` : ''}
            <div class="bid-input-group">
                <div class="form-group">
                    <label for="task-bid-amount" class="form-label">Your Bid Amount (SAR) <span class="text-red-600">*</span></label>
                    <input 
                        type="number" 
                        id="task-bid-amount" 
                        name="taskBidAmount" 
                        class="form-input" 
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter your bid amount"
                        value="${existingBidAmount}"
                    >
                </div>
                <div class="form-group">
                    <label for="task-bid-duration" class="form-label">Proposed Duration (days)</label>
                    <input 
                        type="number" 
                        id="task-bid-duration" 
                        name="taskBidDuration" 
                        class="form-input" 
                        min="1"
                        placeholder="Enter duration"
                        value="${existingBidDuration}"
                    >
                </div>
            </div>
            <div class="form-group">
                <label for="task-bid-comments" class="form-label">Your Approach <span class="text-red-600">*</span></label>
                <textarea 
                    id="task-bid-comments" 
                    name="taskBidComments" 
                    class="form-textarea" 
                    rows="5"
                    required
                    placeholder="Describe your approach, methodology, timeline, and relevant experience..."
                >${escapeHtml(existingBidComments)}</textarea>
            </div>
        </div>
    `;
}

async function populateApplicationForm(application) {
    if (!application) return;
    
    const proposalField = document.getElementById('application-proposal');
    if (proposalField && application.proposal) {
        proposalField.value = application.proposal;
    }
    const deliverablesEl = document.getElementById('application-deliverables');
    if (deliverablesEl && application.id) {
        const deliverables = await dataService.getApplicationDeliverables(application.id);
        deliverablesEl.value = deliverables.map(d => d.title).filter(Boolean).join('\n');
    }
    const availabilityEl = document.getElementById('application-availability-date');
    const durationEl = document.getElementById('application-estimated-duration');
    if (availabilityEl && application.availabilityDate) availabilityEl.value = application.availabilityDate;
    if (durationEl && (application.estimatedDurationDays != null || (application.responses && application.responses.taskBidDuration != null))) {
        durationEl.value = application.estimatedDurationDays != null ? application.estimatedDurationDays : application.responses.taskBidDuration;
    }
    const responses = application.responses || {};
    const prefEl = document.getElementById('application-payment-preference');
    const commentsEl = document.getElementById('application-payment-comments');
    if (prefEl && responses.paymentPreference) prefEl.value = responses.paymentPreference;
    if (commentsEl && responses.paymentComments != null) commentsEl.value = responses.paymentComments;
}

function collectDetailedResponses() {
    const responses = {};
    const responseFields = document.querySelectorAll('[id^="response-"]');
    
    responseFields.forEach(field => {
        const key = field.id.replace('response-', '');
        const value = field.value.trim();
        if (value) {
            responses[`response_${key}`] = value;
        }
    });
    
    return responses;
}

function collectTaskBids() {
    const bids = {};
    
    const bidAmount = document.getElementById('task-bid-amount')?.value;
    const bidDuration = document.getElementById('task-bid-duration')?.value;
    const bidComments = document.getElementById('task-bid-comments')?.value.trim();
    
    if (bidAmount) bids.taskBidAmount = parseFloat(bidAmount);
    if (bidDuration) bids.taskBidDuration = parseInt(bidDuration);
    if (bidComments) bids.taskBidComments = bidComments;
    
    return bids;
}

function buildApplicationNegotiationHtml(app) {
    const isInNeg = window.applicationUtils && typeof window.applicationUtils.isApplicationInNegotiation === 'function'
        ? window.applicationUtils.isApplicationInNegotiation(app, app.negotiation)
        : (app.status === 'in_negotiation' || !!app.negotiationId);
    const negId = app.negotiationId || (app.negotiation && app.negotiation.id);
    const negStatus = ((app.negotiation && app.negotiation.status) || 'open').toLowerCase();
    const isAgreed = negStatus === 'agreed';
    if (!isInNeg && !(negId && isAgreed)) return '';

    const nlc = window.negotiationLifecycle;
    const statusLabel = nlc && typeof nlc.getNegotiationStatusLabel === 'function'
        ? nlc.getNegotiationStatusLabel(negStatus)
        : (isAgreed ? 'Terms agreed' : 'In negotiation');
    const linkHtml = negId
        ? `<a href="#" data-route="/negotiations/${escapeHtml(negId)}" class="btn btn-outline btn-sm mt-2">Open negotiation</a>`
        : '';
    const createDealHtml = isAgreed && !app.dealId && negId
        ? `<button type="button" class="btn btn-primary btn-sm mt-2 btn-create-deal-from-negotiation" data-negotiation-id="${escapeHtml(negId)}">Create deal</button>`
        : '';

    return `<div class="application-negotiation-subsection mt-2 p-2 border border-gray-200 rounded bg-gray-50">
        <p class="text-xs font-semibold text-gray-700 mb-1">Negotiation</p>
        <span class="badge badge-info">${escapeHtml(statusLabel)}</span>
        ${linkHtml}
        ${createDealHtml}
    </div>`;
}

async function loadApplications(opportunityId, options = {}) {
    const applicationsList = document.getElementById('applications-list');
    const applicationsCount = document.getElementById('applications-count');
    const canManage = options.manage != null ? options.manage : opportunityApplicationsCanManage;

    if (!applicationsList || !applicationsCount) return;

    const appUtils = window.opportunityApplicationsUtils;

    try {
        const allApplications = await dataService.getApplications();
        const filtered = appUtils
            ? appUtils.filterApplicationsForOpportunity(allApplications, opportunityId)
            : allApplications.filter(a => a.opportunityId === opportunityId);
        const opportunityApplications = appUtils
            ? appUtils.sortApplicationsByValueScore(filtered)
            : [...filtered].sort((a, b) => {
                const scoreA = a.application_value?.value_score != null ? a.application_value.value_score : -1;
                const scoreB = b.application_value?.value_score != null ? b.application_value.value_score : -1;
                return scoreB - scoreA;
            });
        
        applicationsCount.textContent = opportunityApplications.length;
        
        if (opportunityApplications.length === 0) {
            applicationsList.innerHTML = '<p class="text-muted">No applications yet.</p>';
            return;
        }
        
        // Load applicant info and linked negotiations
        const applicationsWithUsers = await Promise.all(
            opportunityApplications.map(async (app) => {
                const applicant = await dataService.getUserOrCompanyById(app.applicantId);
                let negotiation = null;
                if (app.negotiationId && typeof dataService.getNegotiationById === 'function') {
                    negotiation = await dataService.getNegotiationById(app.negotiationId);
                } else if (typeof dataService.getNegotiationsByApplicationId === 'function') {
                    const byApp = await dataService.getNegotiationsByApplicationId(app.id);
                    negotiation = (byApp || []).sort((a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
                    )[0] || null;
                }
                return { ...app, applicant, negotiation };
            })
        );
        
        // Render applications (Accept/Reject/Start negotiation when status is pending, reviewing, shortlisted, or in_negotiation)
        const canActOnApplication = (app) => {
            if (!canManage) return false;
            const actionable = ['pending', 'reviewing', 'shortlisted', 'in_negotiation'].includes(app.status);
            const opportunityClosed = currentOpportunity && ['contracted', 'in_execution', 'completed', 'closed', 'cancelled'].includes(currentOpportunity.status);
            return actionable && !opportunityClosed;
        };
        const canStartNegotiation = (app) => {
            if (!canManage) return false;
            return ['pending', 'reviewing', 'shortlisted'].includes(app.status) && currentOpportunity && !['contracted', 'in_execution', 'completed', 'closed', 'cancelled'].includes(currentOpportunity.status);
        };
        const transitionableStatuses = ['pending', 'reviewing', 'shortlisted', 'in_negotiation'];
        applicationsList.innerHTML = applicationsWithUsers.map(app => {
            const showActions = canActOnApplication(app);
            const showStartNegotiation = canStartNegotiation(app);
            let actionsHtml = '<div class="application-actions">';
            actionsHtml += `<button type="button" class="btn btn-primary btn-sm btn-view-application" data-application-id="${escapeHtml(app.id)}">View</button>`;
            if (showActions) {
                const statusOptions = transitionableStatuses.map(s => {
                    const selected = app.status === s ? ' selected' : '';
                    return `<option value="${escapeHtml(s)}"${selected}>${escapeHtml(getApplicationStatusLabel(s))}</option>`;
                }).join('');
                actionsHtml += `<select class="application-status-select form-input form-input-sm" data-application-id="${escapeHtml(app.id)}" data-applicant-id="${escapeHtml(app.applicantId || '')}" title="Change status">${statusOptions}</select>`;
            }
            if (showStartNegotiation) {
                actionsHtml += `<button type="button" class="btn btn-secondary btn-sm btn-start-negotiation" data-application-id="${escapeHtml(app.id)}" data-applicant-id="${escapeHtml(app.applicantId || '')}" title="Open a negotiation to discuss and refine proposal terms before creating a deal">Discuss terms</button>`;
            }
            if (showActions) {
                actionsHtml += `<button type="button" class="btn btn-success btn-sm btn-accept-application" data-application-id="${escapeHtml(app.id)}" title="Accept the application and create a deal workspace directly (use when terms are already clear)">Accept &amp; create deal</button>`;
                actionsHtml += `<button type="button" class="btn btn-danger btn-sm btn-reject-application" data-application-id="${escapeHtml(app.id)}">Reject</button>`;
            }
            actionsHtml += '</div>';
            const negotiationLine = buildApplicationNegotiationHtml(app);
            const vs = app.applicant?.profile?.verificationStatus;
            const verificationBadge = vs === 'professional_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Professional</span>' : vs === 'consultant_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Consultant</span>' : vs === 'company_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Company</span>' : '';
            const av = app.application_value;
            const avNorm = appUtils ? appUtils.normalizeApplicationValue(av) : null;
            const valueScorePct = avNorm ? avNorm.valueScorePct : (av?.value_score != null ? Math.round(av.value_score * 100) : null);
            const valueScoreHtml = valueScorePct != null ? `<span class="badge badge-info ml-1" title="Value compatibility">Value: ${valueScorePct}%</span>` : '';
            const valueAmount = avNorm
                ? appUtils.formatApplicationValueAmount(av)
                : (av?.requestedValue != null ? `${Number(av.requestedValue).toLocaleString()} ${(av.requestedCurrency || 'SAR')}` : (av?.offeredValue != null ? `${Number(av.offeredValue).toLocaleString()} ${(av.requestedCurrency || av.currency || 'SAR')}` : null));
            const valueAmountHtml = valueAmount ? `<span class="text-sm text-gray-600 ml-1">${escapeHtml(valueAmount)}</span>` : '';
            const matchTypeLabel = app.matchType && window.unifiedMatchViewModel
                ? window.unifiedMatchViewModel.getMatchTypeLabel(app.matchType)
                : '';
            const matchTypeHtml = matchTypeLabel ? `<span class="badge badge-secondary ml-1" title="Match type">${escapeHtml(matchTypeLabel)}</span>` : '';
            const invitedBadge = app.invitationId ? '<span class="badge badge-info ml-1">Invited Applicant</span>' : '';
            const fromMatchBadge = app.matchId ? '<span class="badge badge-secondary ml-1">From Match</span>' : '';
            const replacementBadge = (app.replacementRequestId || app.invitationKind === 'replacement')
                ? '<span class="badge badge-warning ml-1">Replacement invite</span>' : '';
            const lowValueBadge = (avNorm ? avNorm.lowValueMatch : av?.lowValueMatch) ? '<span class="badge badge-warning ml-1" title="Applicant requested value is more than 30% below opportunity expected value">Low Value Match</span>' : '';
            const breakdown = av?.value_breakdown;
            const budgetPct = breakdown && (breakdown.budgetFit != null || breakdown.budget != null) ? Math.round((breakdown.budgetFit != null ? breakdown.budgetFit : breakdown.budget) * 100) : null;
            const modePct = breakdown && (breakdown.exchangeModeFit != null || breakdown.mode != null) ? Math.round((breakdown.exchangeModeFit != null ? breakdown.exchangeModeFit : breakdown.mode) * 100) : null;
            const scopePct = breakdown && (breakdown.scopeFit != null || breakdown.scope != null) ? Math.round((breakdown.scopeFit != null ? breakdown.scopeFit : breakdown.scope) * 100) : null;
            const breakdownTip = [budgetPct, modePct, scopePct].some(x => x != null) ? `Budget ${budgetPct != null ? budgetPct : '—'}% | Mode ${modePct != null ? modePct : '—'}% | Scope ${scopePct != null ? scopePct : '—'}%` : '';
            return `
            <div class="application-card" data-application-id="${escapeHtml(app.id)}">
                <div class="application-header">
                    <strong>${escapeHtml(app.applicant?.profile?.name || app.applicant?.email || 'Unknown')}</strong>${verificationBadge}
                    ${valueScoreHtml}
                    ${valueAmountHtml}
                    ${matchTypeHtml}
                    ${invitedBadge}
                    ${fromMatchBadge}
                    ${replacementBadge}
                    ${lowValueBadge}
                    <span class="badge ${getApplicationStatusBadgeClass(app.status)}">${escapeHtml(getApplicationStatusLabel(app.status))}</span>
                </div>
                <p class="application-proposal">${escapeHtml((app.coverLetter || app.proposal) || 'No proposal')}</p>
                ${valueScorePct != null && breakdownTip ? `<p class="text-xs text-gray-500 mt-1" title="${escapeHtml(breakdownTip)}">${escapeHtml(breakdownTip)}</p>` : ''}
                <div class="application-meta">
                    Applied: ${new Date(app.createdAt).toLocaleDateString()}
                </div>
                ${negotiationLine}
                ${actionsHtml}
            </div>
        `;
        }).join('');

        // State dropdown: change application status; if set to In negotiation, open chat with applicant
        applicationsList.querySelectorAll('.application-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                e.stopPropagation();
                const applicationId = select.dataset.applicationId;
                const applicantId = select.dataset.applicantId;
                const newStatus = select.value;
                if (!applicationId || !newStatus) return;
                try {
                    if (newStatus === 'in_negotiation') {
                        const user = authService.getCurrentUser();
                        if (user && typeof dataService.startNegotiationFromApplication === 'function') {
                            await dataService.startNegotiationFromApplication(applicationId, user.id);
                        } else {
                            await dataService.updateApplication(applicationId, { status: newStatus });
                        }
                    } else {
                        await dataService.updateApplication(applicationId, { status: newStatus });
                    }
                    await loadApplications(opportunityId, { manage: canManage });
                    if (newStatus === 'in_negotiation' && applicantId) {
                        await ensureConnectionAndOpenChat(applicantId);
                    }
                } catch (err) {
                    console.error('Error updating application status:', err);
                    alert('Failed to update application.');
                }
            });
        });

        // Start negotiation button: set status to in_negotiation, reload, then open Messages with applicant
        applicationsList.querySelectorAll('.btn-start-negotiation').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const applicationId = btn.dataset.applicationId;
                const applicantId = btn.dataset.applicantId;
                if (!applicationId) return;
                try {
                    await dataService.updateApplication(applicationId, { status: 'in_negotiation' });
                    const user = authService.getCurrentUser();
                    if (user && typeof dataService.startNegotiationFromApplication === 'function') {
                        await dataService.startNegotiationFromApplication(applicationId, user.id);
                    }
                    await loadApplications(opportunityId, { manage: canManage });
                    if (applicantId) {
                        await ensureConnectionAndOpenChat(applicantId);
                    }
                } catch (err) {
                    console.error('Error updating application status:', err);
                    alert('Failed to update application.');
                }
            });
        });
        applicationsList.querySelectorAll('.btn-accept-application').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateApplicationStatus(btn.dataset.applicationId, 'accepted');
            });
        });
        applicationsList.querySelectorAll('.btn-reject-application').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateApplicationStatus(btn.dataset.applicationId, 'rejected');
            });
        });
        applicationsList.querySelectorAll('.btn-create-deal-from-negotiation').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const negId = btn.dataset.negotiationId;
                const user = authService.getCurrentUser();
                if (!negId || !user) return;
                const ok = await confirmApplicationAction(
                    'Create a deal workspace from the agreed negotiation terms?',
                    { confirmText: 'Create deal', title: 'Create deal' }
                );
                if (!ok) return;
                btn.disabled = true;
                try {
                    const deal = await dataService.createDealFromNegotiation(negId, user.id);
                    if (deal && window.router?.navigate) {
                        window.router.navigate('/deals/' + deal.id);
                    } else {
                        await loadApplications(opportunityId, { manage: canManage });
                    }
                } catch (err) {
                    console.error('Error creating deal from negotiation:', err);
                    const msg = (err && err.message) ? err.message : 'Could not create deal.';
                    if (window.modalService?.error) {
                        await window.modalService.error(msg, 'Cannot create deal');
                    } else {
                        alert(msg);
                    }
                }
                btn.disabled = false;
            });
        });

        // View application click: show detail modal (button or card click)
        applicationsList.querySelectorAll('.btn-view-application').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const applicationId = btn.dataset.applicationId;
                if (applicationId) showApplicationDetailModal(applicationId);
            });
        });
        applicationsList.querySelectorAll('.application-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('select')) return;
                const applicationId = card.dataset.applicationId;
                if (applicationId) showApplicationDetailModal(applicationId);
            });
        });

        // Show opportunity phase in Applications section header when in negotiation
        const phaseEl = document.getElementById('applications-phase');
        if (phaseEl && currentOpportunity) {
            if (currentOpportunity.status === 'in_negotiation') {
                phaseEl.textContent = 'Phase: In negotiation';
                phaseEl.style.display = 'block';
            } else {
                phaseEl.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        applicationsList.innerHTML = '<p class="text-muted">Error loading applications.</p>';
    }
}

async function loadMatchingSection(opportunityId) {
    const section = document.getElementById('matching-section');
    const professionalsList = document.getElementById('matching-professionals-list');
    const companiesList = document.getElementById('matching-companies-list');
    const runBlock = document.getElementById('matching-run-block');
    const runBtn = document.getElementById('btn-run-matching');
    const runStatus = document.getElementById('matching-run-status');
    if (!section || !professionalsList || !companiesList) return;

    section.style.display = 'block';

    const opportunity = currentOpportunity || await dataService.getOpportunityById(opportunityId);

    const postMatches = dataService.getPostMatchesByOpportunityId
        ? await dataService.getPostMatchesByOpportunityId(opportunityId)
        : [];
    const oneWayMatches = postMatches.filter(pm => pm.matchType === 'one_way');

    const professionalsWithProfiles = [];
    const companiesWithProfiles = [];
    for (const pm of oneWayMatches) {
        const provider = (pm.participants || []).find(p => p.role === 'offer_provider');
        const providerId = provider?.userId;
        if (!providerId) continue;
        const candidate = await dataService.getUserOrCompanyById(providerId);
        if (!candidate) continue;
        const isCompany = candidate.role === CONFIG.ROLES.COMPANY
            || !!(await dataService.getCompanyById(providerId));
        if (isCompany) {
            companiesWithProfiles.push({ match: pm, candidate });
        } else {
            professionalsWithProfiles.push({ match: pm, candidate });
        }
    }

    const scorePct = (m) => Math.round((m.matchScore != null ? m.matchScore : 0) * 100);
    const criteriaSnippet = (m) => {
        const c = m.matchReasons || m.criteria || [];
        return c.length ? (c[0].details || c[0].factor || '') : '';
    };

    if (professionalsWithProfiles.length === 0) {
        professionalsList.innerHTML = '<p class="text-gray-500 text-sm">No Need/Offer matches yet for this opportunity.</p>';
    } else {
        professionalsList.innerHTML = professionalsWithProfiles.map(({ match, candidate }) => {
            const name = candidate?.profile?.name || candidate?.email || (match.candidateId || match.userId);
            const headline = candidate?.profile?.headline || candidate?.profile?.title || '';
            const snippet = criteriaSnippet(match);
            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-white">
                    <div class="flex justify-between items-start">
                        <div>
                            <strong class="text-gray-900">${escapeHtml(name)}</strong>
                            ${headline ? `<p class="text-sm text-gray-600 mt-0.5">${escapeHtml(headline)}</p>` : ''}
                            ${snippet ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(snippet)}</p>` : ''}
                            <p class="text-xs mt-2"><a href="#" data-route="/matches/${escapeHtml(match.id)}" class="text-primary font-medium">View match</a></p>
                        </div>
                        <span class="badge badge-primary whitespace-nowrap">${scorePct(match)}% compatibility</span>
                    </div>
                </div>`;
        }).join('');
    }

    if (companiesWithProfiles.length === 0) {
        companiesList.innerHTML = '<p class="text-gray-500 text-sm">No Need/Offer company matches yet.</p>';
    } else {
        companiesList.innerHTML = companiesWithProfiles.map(({ match, candidate }) => {
            const name = candidate?.profile?.name || candidate?.email || (match.candidateId || match.userId);
            const headline = candidate?.profile?.headline || candidate?.profile?.description || '';
            const snippet = criteriaSnippet(match);
            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-white">
                    <div class="flex justify-between items-start">
                        <div>
                            <strong class="text-gray-900">${escapeHtml(name)}</strong>
                            ${headline ? `<p class="text-sm text-gray-600 mt-0.5">${escapeHtml(headline.substring(0, 80))}${headline.length > 80 ? '…' : ''}</p>` : ''}
                            ${snippet ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(snippet)}</p>` : ''}
                            <p class="text-xs mt-2"><a href="#" data-route="/matches/${escapeHtml(match.id)}" class="text-primary font-medium">View match</a></p>
                        </div>
                        <span class="badge badge-secondary whitespace-nowrap">${scorePct(match)}% compatibility</span>
                    </div>
                </div>`;
        }).join('');
    }

    if (runBlock && runBtn) {
        runBlock.style.display = 'block';
        runStatus.textContent = '';
        runBtn.onclick = async () => {
            if (!window.matchingService) {
                runStatus.textContent = 'Matching service not available.';
                return;
            }
            runBtn.disabled = true;
            runStatus.textContent = 'Running…';
            try {
                if (typeof window.matchingService.persistPostMatches !== 'function') {
                    throw new Error('Post-match persistence is not available.');
                }
                await window.matchingService.persistPostMatches(opportunityId, { source: 'manual' });
                runStatus.textContent = 'Done. Refreshing…';
                await loadMatchingSection(opportunityId);
                runStatus.textContent = 'Updated.';
            } catch (e) {
                runStatus.textContent = 'Error: ' + (e && e.message ? e.message : 'Run failed.');
            } finally {
                runBtn.disabled = false;
            }
        };
    }
}

async function showApplicationDetailModal(applicationId) {
    try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            alert('Sign in to view applications.');
            return;
        }
        const isOwner = currentOpportunity && currentOpportunity.creatorId === currentUser.id;
        const isStaff = typeof authService.canAccessAdmin === 'function' && authService.canAccessAdmin();
        if (!isOwner && !isStaff) {
            alert('Only the opportunity owner or staff can view full application details.');
            return;
        }
        const detailOpts = {};
        if (isOwner) detailOpts.ownerId = currentUser.id;
        if (!isOwner && isStaff) detailOpts.allowStaff = true;

        const detail = await dataService.getApplicationDetail(applicationId, detailOpts);
        if (!detail || !detail.application) {
            alert('Application could not be loaded.');
            return;
        }
        const { application, applicant, opportunity, requirementsMatch, paymentTerms, deliverables, files, matchScore, matchBreakdown, matchType } = detail;
        const applicantName = applicant?.profile?.name || applicant?.email || application.applicantId;
        const proposalText = application.coverLetter || application.proposal || 'No proposal or cover letter provided.';

        const contentHTML = buildApplicationDetailContent({
            application,
            applicant,
            opportunity,
            requirementsMatch: requirementsMatch || [],
            paymentTerms: paymentTerms || [],
            deliverables: deliverables || [],
            files: files || [],
            matchScore,
            matchBreakdown,
            matchType,
            applicantName,
            proposalText
        });

        if (typeof modalService !== 'undefined') {
            const modalTitle = applicantName ? `Application · ${escapeHtml(String(applicantName))}` : 'Application details';
            modalService.showCustom(contentHTML, modalTitle, {
                confirmText: 'Close',
                modalClass: 'modal-dialog--application-detail',
                onMount: (modal) => {
                    const body = modal.querySelector('.modal-body-custom');
                    if (body) {
                        const viewRoot = body.querySelector('.application-details-view');
                        setupApplicationDetailTabs(viewRoot);
                        setupApplicationDetailActions(body, applicationId, application.applicantId, application.status);
                    }
                }
            }).then(() => {});
        } else {
            alert('Application: ' + applicantName + '\nStatus: ' + application.status + '\n\n' + proposalText);
        }
    } catch (error) {
        console.error('Error showing application detail:', error);
        alert('Failed to load application details.');
    }
}

function getApplicantInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const t = name.trim();
    if (!t) return '?';
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
}

function buildApplicationDetailContent(data) {
    const {
        application,
        applicant,
        opportunity,
        requirementsMatch,
        paymentTerms,
        deliverables,
        files,
        matchScore,
        matchBreakdown,
        applicantName,
        proposalText
    } = data;
    const profile = applicant?.profile || {};
    const userTypeLabel = applicant?.role === 'company_owner' || applicant?.profile?.type === 'company' ? 'Company' : (applicant?.role === 'consultant' ? 'Consultant' : 'Professional');
    const reputationStr = profile.reputationScore != null ? String(profile.reputationScore) : 'N/A';
    const portfolioHtml = profile.portfolioUrl
        ? `<a href="${escapeHtml(profile.portfolioUrl)}" target="_blank" rel="noopener" class="app-detail-inline-link">${escapeHtml(profile.portfolioUrl)}</a>`
        : '—';

    const matchTypeLabel = data.matchType && window.unifiedMatchViewModel
        ? window.unifiedMatchViewModel.getMatchTypeLabel(data.matchType)
        : '';
    const matchScorePct = matchScore != null ? Math.round(matchScore * 100) : null;
    const breakdown = matchBreakdown || {};
    const skillPct = breakdown.skillMatch != null ? Math.round(Number(breakdown.skillMatch) * 100) : null;
    const budgetPct = breakdown.budgetFit != null ? Math.round(Number(breakdown.budgetFit) * 100) : null;
    const timelinePct = breakdown.timelineFit != null ? Math.round(Number(breakdown.timelineFit) * 100) : null;
    const locationPct = breakdown.locationFit != null ? Math.round(Number(breakdown.locationFit) * 100) : null;
    const reputationPct = breakdown.reputation != null ? Math.round(Number(breakdown.reputation) * 100) : null;

    const av = application.application_value || {};
    const avNorm = window.opportunityApplicationsUtils
        ? window.opportunityApplicationsUtils.normalizeApplicationValue(av)
        : null;
    const valueScorePct = avNorm ? avNorm.valueScorePct : (av.value_score != null ? Math.round(av.value_score * 100) : null);
    const requestedVal = avNorm
        ? (avNorm.requestedNumber != null ? avNorm.requestedNumber : avNorm.requestedValue)
        : (av.requestedValue != null ? av.requestedValue : av.requested_value);
    const requestedStr =
        requestedVal != null
            ? `${typeof requestedVal === 'number' ? requestedVal.toLocaleString() : String(requestedVal)} ${escapeHtml((avNorm ? avNorm.currency : (av.requestedCurrency || av.currency)) || 'SAR')}`
            : null;
    const offeredVal = avNorm ? avNorm.offeredValue : (av.offeredValue != null ? av.offeredValue : av.offered_value);
    const offeredStr =
        offeredVal != null && String(offeredVal).trim() !== ''
            ? typeof offeredVal === 'number'
                ? offeredVal.toLocaleString()
                : String(offeredVal)
            : null;
    const budgetRange = opportunity?.exchangeData?.budgetRange;
    const budgetRangeStr =
        budgetRange && (budgetRange.min != null || budgetRange.max != null)
            ? `${budgetRange.min != null ? Number(budgetRange.min).toLocaleString() : '—'}–${budgetRange.max != null ? Number(budgetRange.max).toLocaleString() : '—'} ${escapeHtml(budgetRange.currency || 'SAR')}`
            : '—';
    const exchangeModeLabel = (opportunity?.exchangeMode || av.exchange_mode || av.exchangeMode || 'cash')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const reqMatchIcon = (m) => (m === 'match' ? '✔' : m === 'partial' ? '◐' : '✗');
    const reqMatchLabel = (m) => (m === 'match' ? 'Match' : m === 'partial' ? 'Partial match' : 'Missing');
    const requirementsHtml =
        requirementsMatch.length > 0
            ? '<ul class="app-detail-req-list">' +
              requirementsMatch
                  .map(
                      (r) => `
            <li class="app-detail-req-item app-detail-req-item--${r.applicantMatch === 'match' ? 'match' : r.applicantMatch === 'partial' ? 'partial' : 'miss'}">
                <div class="app-detail-req-item__head">
                    <span class="app-detail-req-item__label">${escapeHtml(r.requiredValue)}</span>
                    <span class="badge badge-${r.applicantMatch === 'match' ? 'success' : r.applicantMatch === 'partial' ? 'warning' : 'danger'}">${reqMatchIcon(r.applicantMatch)} ${reqMatchLabel(r.applicantMatch)}</span>
                </div>
                ${r.applicantResponse ? `<p class="app-detail-req-item__note">${escapeHtml(r.applicantResponse)}</p>` : ''}
            </li>`
                  )
                  .join('') +
              '</ul>'
            : '<p class="app-detail-empty">No requirements match rows stored for this application.</p>';

    const paymentPrefLabel = (pref) =>
        pref === 'accept' ? 'Accept as stated' : pref === 'discuss' ? 'Prefer to discuss' : pref === 'custom' ? 'Custom terms' : pref ? escapeHtml(String(pref)) : '';

    let paymentTermsHtml = '';
    if (paymentTerms.length > 0) {
        paymentTermsHtml = paymentTerms
            .map((pt) => {
                if (pt.type === 'milestone' && pt.details && Array.isArray(pt.details.milestones)) {
                    return pt.details.milestones
                        .map((m, i) => `<div class="text-sm">Milestone ${i + 1} — ${escapeHtml(m.title || '')}</div>`)
                        .join('');
                }
                if (pt.type === 'equity' && pt.details && pt.details.equityPercent != null)
                    return `<div class="text-sm">Equity: ${pt.details.equityPercent}%</div>`;
                if (pt.type === 'profit_share' && pt.details && pt.details.profitSharePercent != null)
                    return `<div class="text-sm">Profit share: ${pt.details.profitSharePercent}%</div>`;
                return `<div class="text-sm">${escapeHtml(pt.type)}</div>`;
            })
            .join('');
    } else {
        const resp = application.responses || {};
        const prefRaw = resp.paymentPreference || av.paymentPreference;
        const comments = resp.paymentComments || av.paymentComments;
        const parts = [];
        if (prefRaw) parts.push(`<p class="text-sm mb-1"><strong>Preference:</strong> ${paymentPrefLabel(prefRaw)}</p>`);
        if (comments) parts.push(`<p class="text-sm mb-1"><strong>Comments:</strong><br/><span class="whitespace-pre-wrap">${escapeHtml(String(comments))}</span></p>`);
        paymentTermsHtml =
            parts.length > 0 ? parts.join('') : '<p class="app-detail-empty">No structured payment terms record. Values may appear under Value &amp; offer below.</p>';
    }

    const availabilityDate = application.availabilityDate ? new Date(application.availabilityDate).toLocaleDateString() : '—';
    const durationStr =
        application.estimatedDurationDays != null
            ? `${application.estimatedDurationDays} days`
            : application.responses?.taskBidDuration != null
              ? `${application.responses.taskBidDuration} days`
              : '—';
    const deadlineLabel =
        application.deadlineCompatibility === 'full'
            ? 'Full'
            : application.deadlineCompatibility === 'partial'
              ? 'Partial'
              : application.deadlineCompatibility === 'no'
                ? 'No'
                : '—';

    const deliverablesHtml =
        deliverables.length > 0
            ? '<ul class="app-detail-bullet-list app-detail-bullet-list--spaced">' +
              deliverables.map((d) => `<li>${escapeHtml(d.title)}${d.description ? ' — ' + escapeHtml(d.description) : ''}</li>`).join('') +
              '</ul>'
            : '<p class="app-detail-empty">No deliverables list was saved with this application.</p>';

    const resp = application.responses || {};
    const skipKeys = new Set(['paymentPreference', 'paymentComments', 'taskBidAmount', 'taskBidDuration', 'taskBidComments']);
    const submittedRows = [];
    Object.keys(resp).forEach((key) => {
        if (skipKeys.has(key)) return;
        const val = resp[key];
        if (val == null || val === '') return;
        if (key.startsWith('response_')) {
            const label = formatLabel(key.replace(/^response_/, ''));
            submittedRows.push({ label, value: String(val) });
        }
    });
    const submittedResponsesHtml =
        submittedRows.length > 0
            ? '<dl class="app-detail-qna-list">' +
              submittedRows
                  .map(
                      (row) => `
                <div class="app-detail-qna-item">
                    <dt class="app-detail-qna-item__q">${escapeHtml(row.label)}</dt>
                    <dd class="app-detail-qna-item__a app-detail-pre">${escapeHtml(row.value)}</dd>
                </div>`
                  )
                  .join('') +
              '</dl>'
            : '<p class="app-detail-empty">No extra requirement answers were stored on this application.</p>';

    let taskBidHtml = '';
    if (resp.taskBidAmount != null || resp.taskBidDuration != null || (resp.taskBidComments && String(resp.taskBidComments).trim())) {
        taskBidHtml = `
            <div class="app-detail-callout app-detail-callout--muted">
                ${resp.taskBidAmount != null ? `<p><strong>Bid amount:</strong> ${escapeHtml(String(resp.taskBidAmount))} SAR</p>` : ''}
                ${resp.taskBidDuration != null ? `<p><strong>Duration:</strong> ${escapeHtml(String(resp.taskBidDuration))} days</p>` : ''}
                ${resp.taskBidComments ? `<p class="app-detail-pre"><strong>Approach / comments:</strong><br/>${escapeHtml(String(resp.taskBidComments))}</p>` : ''}
            </div>`;
    } else {
        taskBidHtml = '<p class="app-detail-empty">No task bid was submitted.</p>';
    }

    const fileTypeLabel = (t) => ({ portfolio: 'Portfolio', certificate: 'Certificates', case_study: 'Case studies', report: 'Reports', other: 'Other' })[t] || t;
    const filesHtml = files.length > 0
        ? '<ul class="app-detail-file-list">' + files.map(f => `
            <li class="app-detail-file-row">
                <span class="badge badge-secondary">${escapeHtml(fileTypeLabel(f.fileType))}</span>
                <a href="${escapeHtml(f.fileUrl || '#')}" target="_blank" rel="noopener" class="app-detail-file-link">${escapeHtml(f.fileName || '')}</a>
            </li>
        `).join('') + '</ul>'
        : '<p class="app-detail-empty">No attachments.</p>';

    const collabModels = profile.preferredCollaborationModels || [];
    const collabHtml = collabModels.length > 0
        ? '<ul class="app-detail-bullet-list">' + collabModels.map(c => `<li>${escapeHtml(String(c).replace(/_/g, ' '))}</li>`).join('') + '</ul>'
        : '<p class="app-detail-empty">Not specified.</p>';

    const skillsList = [].concat(profile.skills || [], profile.specializations || []).filter(Boolean);
    const skillsStr = skillsList.length > 0 ? skillsList.map(s => escapeHtml(String(s))).join(', ') : '—';
    const sectorsList = Array.isArray(profile.sectors) ? profile.sectors : (profile.industry ? (Array.isArray(profile.industry) ? profile.industry : [profile.industry]) : []);
    const sectorsStr = sectorsList.length > 0 ? sectorsList.map(s => escapeHtml(String(s))).join(', ') : '—';

    const appliedDateLabel = new Date(application.createdAt).toLocaleDateString();
    const initials = getApplicantInitials(String(applicantName || ''));
    const oppTitleEsc = opportunity?.title ? escapeHtml(opportunity.title) : '';
    const scoreRingBlock =
        matchScorePct != null
            ? `<div class="app-detail-hero__score"><div class="app-detail-score-ring" style="--app-match-p:${matchScorePct}"><span>${matchScorePct}%</span></div><span class="app-detail-score-caption">AI match</span></div>`
            : '';

    const aiMatchSectionBody =
        (matchTypeLabel ? `<p class="app-detail-ai-type"><strong>Type</strong> ${escapeHtml(matchTypeLabel)}</p>` : '') +
        '<ul class="app-detail-ai-bars">' +
        (skillPct != null ? `<li><span class="app-detail-ai-bars__label">Skills</span><span class="app-detail-ai-bars__track"><i style="width:${skillPct}%"></i></span><span class="app-detail-ai-bars__pct">${skillPct}%</span></li>` : '') +
        (budgetPct != null ? `<li><span class="app-detail-ai-bars__label">Budget</span><span class="app-detail-ai-bars__track"><i style="width:${budgetPct}%"></i></span><span class="app-detail-ai-bars__pct">${budgetPct}%</span></li>` : '') +
        (timelinePct != null ? `<li><span class="app-detail-ai-bars__label">Timeline</span><span class="app-detail-ai-bars__track"><i style="width:${timelinePct}%"></i></span><span class="app-detail-ai-bars__pct">${timelinePct}%</span></li>` : '') +
        (locationPct != null ? `<li><span class="app-detail-ai-bars__label">Location</span><span class="app-detail-ai-bars__track"><i style="width:${locationPct}%"></i></span><span class="app-detail-ai-bars__pct">${locationPct}%</span></li>` : '') +
        (reputationPct != null ? `<li><span class="app-detail-ai-bars__label">Reputation</span><span class="app-detail-ai-bars__track"><i style="width:${reputationPct}%"></i></span><span class="app-detail-ai-bars__pct">${reputationPct}%</span></li>` : '') +
        '</ul>' +
        (!matchTypeLabel && matchScorePct == null && skillPct == null && budgetPct == null && timelinePct == null && locationPct == null && reputationPct == null
            ? '<p class="app-detail-empty">No AI breakdown available for this application.</p>'
            : '');

    return `
        <div class="application-details-view" data-application-id="${escapeHtml(application.id)}" data-applicant-id="${escapeHtml(application.applicantId || '')}" data-application-status="${escapeHtml(application.status)}">
            <header class="app-detail-hero">
                <div class="app-detail-hero__avatar" aria-hidden="true">${escapeHtml(initials)}</div>
                <div class="app-detail-hero__text">
                    <p class="app-detail-hero__eyebrow">Application review</p>
                    <h2 class="app-detail-hero__name">${escapeHtml(applicantName)}</h2>
                    ${oppTitleEsc ? `<p class="app-detail-hero__opp">${oppTitleEsc}</p>` : ''}
                    <div class="app-detail-hero__meta">
                        <span class="app-detail-pill">${escapeHtml(userTypeLabel)}</span>
                        <span class="app-detail-pill app-detail-pill--muted">Applied ${escapeHtml(appliedDateLabel)}</span>
                        <span class="badge ${getApplicationStatusBadgeClass(application.status)}">${escapeHtml(getApplicationStatusLabel(application.status))}</span>
                    </div>
                </div>
                ${scoreRingBlock}
            </header>
            <div class="application-details-body">
                <nav class="app-detail-tabs" role="tablist" aria-label="Application sections">
                    <button type="button" class="app-detail-tabs__btn is-active" role="tab" aria-selected="true" data-tab="overview" id="app-tab-overview" aria-controls="app-detail-panel-overview">Overview</button>
                    <button type="button" class="app-detail-tabs__btn" role="tab" aria-selected="false" data-tab="qa" id="app-tab-qa" aria-controls="app-detail-panel-qa">Q&amp;A &amp; bid</button>
                    <button type="button" class="app-detail-tabs__btn" role="tab" aria-selected="false" data-tab="fit" id="app-tab-fit" aria-controls="app-detail-panel-fit">Requirements &amp; fit</button>
                    <button type="button" class="app-detail-tabs__btn" role="tab" aria-selected="false" data-tab="terms" id="app-tab-terms" aria-controls="app-detail-panel-terms">Terms &amp; files</button>
                </nav>
                <div class="app-detail-tab-panels">
                    <div class="app-detail-tab-panel is-active" role="tabpanel" id="app-detail-panel-overview" aria-labelledby="app-tab-overview" data-tab-panel="overview">
                        <div class="app-detail-overview-grid">
                            <section class="app-detail-card" id="section-proposal">
                                <h3 class="app-detail-card__title">Proposal</h3>
                                <div class="app-detail-card__body app-detail-proposal-scroll-wrap">
                                    <div class="app-detail-proposal-scroll">
                                        <div class="app-detail-proposal">${escapeHtml(proposalText)}</div>
                                    </div>
                                </div>
                            </section>
                            <section class="app-detail-card app-detail-card--compact" id="section-applicant-summary">
                                <h3 class="app-detail-card__title">Profile snapshot</h3>
                                <div class="app-detail-card__body">
                                    <dl class="app-detail-kv-grid">
                                        <dt>User type</dt><dd>${escapeHtml(userTypeLabel)}</dd>
                                        <dt>Experience</dt><dd>${profile.yearsExperience != null ? escapeHtml(profile.yearsExperience + ' years') : '—'}</dd>
                                        <dt>Industry</dt><dd>${escapeHtml(profile.primaryDomain || '—')}</dd>
                                        <dt>Skills</dt><dd class="app-detail-kv-grid__wide">${skillsStr}</dd>
                                        <dt>Sectors</dt><dd class="app-detail-kv-grid__wide">${sectorsStr}</dd>
                                        <dt>Location</dt><dd>${escapeHtml(profile.location || '—')}</dd>
                                        <dt>Portfolio</dt><dd class="app-detail-kv-grid__wide">${portfolioHtml}</dd>
                                        <dt>Reputation</dt><dd>${escapeHtml(reputationStr)}</dd>
                                    </dl>
                                </div>
                            </section>
                        </div>
                    </div>
                    <div class="app-detail-tab-panel" role="tabpanel" id="app-detail-panel-qa" aria-labelledby="app-tab-qa" data-tab-panel="qa" hidden>
                        <div class="app-detail-tab-panel-stack">
                            <section class="app-detail-card" id="section-requirement-answers">
                                <h3 class="app-detail-card__title">Requirement answers</h3>
                                <div class="app-detail-card__body">${submittedResponsesHtml}</div>
                            </section>
                            <section class="app-detail-card" id="section-task-bid-detail">
                                <h3 class="app-detail-card__title">Task bid</h3>
                                <div class="app-detail-card__body">${taskBidHtml}</div>
                            </section>
                        </div>
                    </div>
                    <div class="app-detail-tab-panel" role="tabpanel" id="app-detail-panel-fit" aria-labelledby="app-tab-fit" data-tab-panel="fit" hidden>
                        <div class="app-detail-tab-panel-stack app-detail-fit-grid">
                            <section class="app-detail-card" id="section-requirements-match">
                                <h3 class="app-detail-card__title">Requirements match</h3>
                                <div class="app-detail-card__body app-detail-req-scroll">${requirementsHtml}</div>
                                <div class="app-detail-add-requirement" data-requires-write style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap;padding:0 1rem 1rem;">
                                    <input type="text" class="form-input" id="app-req-label-input" placeholder="Requirement label (e.g. BIM Level 2)" style="flex:1;min-width:12rem;">
                                    <button type="button" class="btn btn-secondary btn-sm" data-action="add-requirement" data-application-id="${escapeHtml(application.id)}">Add requirement</button>
                                </div>
                            </section>
                            <section class="app-detail-card app-detail-card--accent" id="section-ai-match">
                                <h3 class="app-detail-card__title">AI match breakdown</h3>
                                <div class="app-detail-card__body">${aiMatchSectionBody}</div>
                            </section>
                        </div>
                    </div>
                    <div class="app-detail-tab-panel" role="tabpanel" id="app-detail-panel-terms" aria-labelledby="app-tab-terms" data-tab-panel="terms" hidden>
                        <div class="app-detail-terms-grid">
                            <section class="app-detail-card app-detail-terms-span" id="section-value-bidding">
                                <h3 class="app-detail-card__title">Value &amp; offer</h3>
                                <div class="app-detail-card__body">
                                    <div class="app-detail-callout app-detail-callout--muted app-detail-callout--tight">
                                        <p><strong>Exchange</strong> ${escapeHtml(exchangeModeLabel)}</p>
                                        ${offeredStr ? `<p><strong>They offer</strong> ${escapeHtml(offeredStr)}</p>` : ''}
                                        ${requestedStr ? `<p><strong>Requested</strong> ${requestedStr}</p>` : ''}
                                        <p><strong>Budget range</strong> ${budgetRangeStr}</p>
                                        ${valueScorePct != null ? `<p><strong>Value fit</strong> ${valueScorePct}%</p>` : ''}
                                    </div>
                                </div>
                            </section>
                            <section class="app-detail-card" id="section-payment-terms">
                                <h3 class="app-detail-card__title">Payment terms</h3>
                                <div class="app-detail-card__body app-detail-compact">${paymentTermsHtml}</div>
                            </section>
                            <section class="app-detail-card" id="section-timeline">
                                <h3 class="app-detail-card__title">Timeline</h3>
                                <div class="app-detail-card__body">
                                    <dl class="app-detail-kv-grid app-detail-kv-grid--tight">
                                        <dt>Availability</dt><dd>${escapeHtml(availabilityDate)}</dd>
                                        <dt>Duration</dt><dd>${escapeHtml(durationStr)}</dd>
                                        <dt>Deadline fit</dt><dd>${escapeHtml(deadlineLabel)}</dd>
                                    </dl>
                                </div>
                            </section>
                            <section class="app-detail-card" id="section-deliverables">
                                <h3 class="app-detail-card__title">Deliverables</h3>
                                <div class="app-detail-card__body app-detail-terms-scroll">${deliverablesHtml}</div>
                            </section>
                            <section class="app-detail-card" id="section-attachments">
                                <h3 class="app-detail-card__title">Attachments</h3>
                                <div class="app-detail-card__body">${filesHtml}</div>
                            </section>
                            <section class="app-detail-card app-detail-terms-span" id="section-collaboration-preferences">
                                <h3 class="app-detail-card__title">Collaboration</h3>
                                <div class="app-detail-card__body">${collabHtml}</div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <footer class="application-details-footer">
                <div class="application-details-footer__actions">
                    <div class="application-details-footer__group">
                        <button type="button" class="btn btn-primary btn-sm" data-action="shortlist" data-application-id="${escapeHtml(application.id)}" data-applicant-id="${escapeHtml(application.applicantId || '')}">Shortlist</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-action="invite-negotiation" data-application-id="${escapeHtml(application.id)}" data-applicant-id="${escapeHtml(application.applicantId || '')}">Invite to negotiate</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-action="send-message" data-applicant-id="${escapeHtml(application.applicantId || '')}">Message</button>
                        <button type="button" class="btn btn-outline btn-sm" data-action="view-profile" data-applicant-id="${escapeHtml(application.applicantId || '')}">View profile</button>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm application-details-footer__reject" data-action="reject" data-application-id="${escapeHtml(application.id)}" data-applicant-id="${escapeHtml(application.applicantId || '')}">Reject</button>
                </div>
            </footer>
        </div>
    `;
}

/**
 * Section tabs for application review modal — less vertical scroll than a single long column.
 */
function setupApplicationDetailTabs(viewRoot) {
    if (!viewRoot) return;
    const nav = viewRoot.querySelector('.app-detail-tabs');
    const tabs = nav ? nav.querySelectorAll('[role="tab"]') : [];
    const panels = viewRoot.querySelectorAll('.app-detail-tab-panel');
    if (!nav || !tabs.length || !panels.length) return;

    function activate(tabId) {
        tabs.forEach((btn) => {
            const on = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
            btn.setAttribute('tabindex', on ? '0' : '-1');
        });
        panels.forEach((panel) => {
            const on = panel.getAttribute('data-tab-panel') === tabId;
            panel.hidden = !on;
            panel.classList.toggle('is-active', on);
        });
        const panelsHost = viewRoot.querySelector('.app-detail-tab-panels');
        if (panelsHost) panelsHost.scrollTop = 0;
    }

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('[role="tab"]');
        if (!btn || !nav.contains(btn)) return;
        e.preventDefault();
        const id = btn.getAttribute('data-tab');
        if (id) activate(id);
    });

    nav.addEventListener('keydown', (e) => {
        const ids = Array.from(tabs).map((b) => b.getAttribute('data-tab')).filter(Boolean);
        const activeEl = document.activeElement;
        const idx = ids.findIndex((id) => activeEl && activeEl.getAttribute && activeEl.getAttribute('data-tab') === id);
        if (idx < 0) return;
        let next = idx;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            next = (idx + 1) % ids.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            next = (idx - 1 + ids.length) % ids.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            next = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            next = ids.length - 1;
        } else {
            return;
        }
        const targetTab = ids[next];
        const btn = Array.from(tabs).find((b) => b.getAttribute('data-tab') === targetTab);
        if (btn) {
            activate(targetTab);
            btn.focus();
        }
    });

    const initial = Array.from(tabs).find((b) => b.classList.contains('is-active'))?.getAttribute('data-tab') || 'overview';
    activate(initial);
}

function setupApplicationDetailActions(container, applicationId, applicantId, currentStatus) {
    const actionable = ['pending', 'reviewing', 'shortlisted', 'in_negotiation'].includes(currentStatus);
    const addRequirementBlock = container.querySelector('.app-detail-add-requirement');
    if (addRequirementBlock) {
        addRequirementBlock.style.display = actionable ? '' : 'none';
    }
    const footer = container.querySelector('.application-details-footer');
    if (footer) {
        footer.style.display = actionable ? '' : 'none';
    }
    container.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        const appId = btn.dataset.applicationId;
        const appApplicantId = btn.dataset.applicantId;
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (action === 'shortlist' && actionable && appId) {
                try {
                    await dataService.updateApplication(appId, { status: 'shortlisted' });
                    await dataService.createNotification({
                        userId: appApplicantId,
                        type: 'application_status_changed',
                        title: 'Shortlisted',
                        message: 'Your application has been shortlisted.',
                        link: currentOpportunity ? `/opportunities/${currentOpportunity.id}` : undefined
                    });
                    if (currentOpportunity) await loadApplications(currentOpportunity.id);
                    if (typeof modalService !== 'undefined') modalService.close();
                } catch (err) {
                    console.error(err);
                    alert('Failed to update status.');
                }
            } else if (action === 'invite-negotiation' && actionable && appId) {
                try {
                    await dataService.updateApplication(appId, { status: 'in_negotiation' });
                    const user = authService.getCurrentUser();
                    if (user && typeof dataService.startNegotiationFromApplication === 'function') {
                        await dataService.startNegotiationFromApplication(appId, user.id);
                    }
                    if (currentOpportunity) await loadApplications(currentOpportunity.id);
                    if (appApplicantId) await ensureConnectionAndOpenChat(appApplicantId);
                    if (typeof modalService !== 'undefined') modalService.close();
                } catch (err) {
                    console.error(err);
                    alert('Failed to update status.');
                }
            } else if (action === 'send-message' && appApplicantId) {
                try {
                    await ensureConnectionAndOpenChat(appApplicantId);
                    if (typeof modalService !== 'undefined') modalService.close();
                } catch (err) {
                    console.error(err);
                    alert('Could not open chat.');
                }
            } else if (action === 'view-profile' && appApplicantId) {
                if (typeof modalService !== 'undefined') modalService.close();
                if (typeof router !== 'undefined' && router.navigate) router.navigate('/people/' + appApplicantId);
            } else if (action === 'reject' && actionable && appId) {
                const ok = await confirmApplicationAction(
                    'Reject this application? The applicant will be notified.',
                    { title: 'Reject application', confirmText: 'Reject', cancelText: 'Cancel', type: 'warning' }
                );
                if (!ok) return;
                try {
                    await dataService.updateApplication(appId, { status: 'rejected' });
                    await dataService.createNotification({
                        userId: appApplicantId,
                        type: 'application_status_changed',
                        title: 'Application Rejected',
                        message: 'Your application has been rejected.',
                        link: currentOpportunity ? `/opportunities/${currentOpportunity.id}` : undefined
                    });
                    if (currentOpportunity) await loadApplications(currentOpportunity.id);
                    if (typeof modalService !== 'undefined') modalService.close();
                } catch (err) {
                    console.error(err);
                    alert('Failed to reject application.');
                }
            } else if (action === 'add-requirement' && appId) {
                const input = container.querySelector('#app-req-label-input');
                const label = (input && input.value || '').trim();
                if (!label) {
                    alert('Enter a requirement label.');
                    return;
                }
                try {
                    const existing = await dataService.getApplicationRequirements(appId);
                    await dataService.replaceApplicationRequirements(appId, existing.concat([{
                        requirementKey: 'custom_' + Date.now(),
                        requirementLabel: label,
                        requiredValue: label,
                        applicantMatch: 'pending',
                        applicantResponse: null
                    }]));
                    if (input) input.value = '';
                    if (typeof modalService !== 'undefined') modalService.close();
                    await showApplicationDetailModal(appId);
                } catch (err) {
                    console.error(err);
                    alert('Could not add requirement.');
                }
            }
        });
    });
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ')
        .trim();
}

function formatModelType(modelType) {
    const types = {
        'project_based': 'Project-Based',
        'strategic_partnership': 'Strategic Partnership',
        'resource_pooling': 'Resource Pooling',
        'hiring': 'Hiring',
        'competition': 'Competition'
    };
    return types[modelType] || modelType;
}

function formatExchangeMode(mode) {
    const modes = {
        'cash': 'Cash Payment',
        'equity': 'Equity',
        'profit_sharing': 'Profit Sharing',
        'barter': 'Barter Exchange',
        'hybrid': 'Hybrid'
    };
    return modes[mode] || mode;
}

function formatOpportunityStatus(status) {
    return window.statusBadgeSystem
        ? window.statusBadgeSystem.getStatusLabel(status, 'opportunity')
        : String(status || '');
}

function getStatusBadgeClass(status) {
    return window.statusBadgeSystem
        ? window.statusBadgeSystem.getStatusBadgeClass(status, 'opportunity')
        : 'badge--neutral';
}

function getApplicationStatusBadgeClass(status) {
    return window.statusBadgeSystem
        ? window.statusBadgeSystem.getStatusBadgeClass(status, 'application')
        : 'badge--neutral';
}

function getApplicationStatusLabel(status) {
    return window.statusBadgeSystem
        ? window.statusBadgeSystem.getStatusLabel(status, 'application')
        : String(status || '');
}

function getModelDefinition(modelType, subModelType) {
    if (!window.OPPORTUNITY_MODELS) return null;
    const model = window.OPPORTUNITY_MODELS[modelType];
    if (!model || !model.subModels) return null;
    return model.subModels[subModelType] || null;
}

/** Ensure owner and applicant have an accepted connection, then navigate to Messages with the applicant. */
async function ensureConnectionAndOpenChat(applicantId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !applicantId) return;
    try {
        await dataService.ensureConnectionAccepted(currentUser.id, applicantId);
        if (typeof router !== 'undefined' && router.navigate) {
            router.navigate('/messages/' + applicantId);
        }
    } catch (err) {
        console.error('Error ensuring connection or opening chat:', err);
        alert('Could not open chat. Please try again.');
    }
}

async function showOpportunityError(message, title = 'Unable to continue') {
    if (window.modalService && typeof window.modalService.error === 'function') {
        await window.modalService.error(message, title);
    } else {
        alert(message);
    }
}

async function confirmApplicationAction(message, options = {}) {
    const {
        title = 'Confirmation',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'info'
    } = options;
    if (window.modalService && typeof window.modalService.confirm === 'function') {
        return window.modalService.confirm(message, title, { confirmText, cancelText, type });
    }
    return window.confirm(message);
}

async function updateApplicationStatus(applicationId, status) {
    const confirmMsg =
        status === 'accepted'
            ? 'Accept this application and create a draft Deal Workspace for this collaboration?'
            : `Are you sure you want to ${status} this application?`;
    const ok = await confirmApplicationAction(confirmMsg, {
        title: status === 'accepted' ? 'Accept application' : 'Update application',
        confirmText: status === 'accepted' ? 'Accept & create deal' : 'Confirm',
        cancelText: 'Cancel',
        type: status === 'accepted' ? 'info' : 'warning'
    });
    if (!ok) return;
    
    try {
        await dataService.updateApplication(applicationId, { status });
        const application = await dataService.getApplicationById(applicationId);
        
        if (status === 'accepted') {
            const user = authService.getCurrentUser();
            const newDeal = await dataService.createDealFromApplication(applicationId, user?.id);
            await dataService.updateOpportunity(currentOpportunity.id, { status: 'contracted' });
            try {
                sessionStorage.setItem(
                    'pmtwin_deal_flash',
                    JSON.stringify({
                        message: 'A draft deal has been created for this collaboration.',
                        tone: 'success'
                    })
                );
            } catch (e) {
                void e;
            }
            if (window.router && newDeal.id) {
                window.router.navigate('/deals/' + newDeal.id);
            }
        }
        
        await dataService.createNotification({
            userId: application.applicantId,
            type: 'application_status_changed',
            title: 'Application Status Updated',
            message: `Your application for "${currentOpportunity.title}" has been ${status}`,
            link: `/opportunities/${currentOpportunity.id}`
        });
        
        await loadApplications(currentOpportunity.id);
    } catch (error) {
        console.error('Error updating application status:', error);
        const msg = (error && error.message) ? error.message : 'Failed to update application status.';
        const title = /negotiation is still open/i.test(msg) ? 'Negotiation in progress' : 'Cannot create deal';
        await showOpportunityError(msg, title);
    }
}

async function cancelOpportunity(id) {
    if (!confirm('Are you sure you want to cancel this opportunity? It will be marked as cancelled and no longer active.')) return;
    try {
        const oppService = window.opportunityService;
        if (!oppService) throw new Error('Opportunity service not available');
        await oppService.updateOpportunityStatus(id, 'cancelled');
        alert('Opportunity cancelled.');
        await loadOpportunity(id);
    } catch (error) {
        console.error('Error cancelling opportunity:', error);
        alert(error.message || 'Failed to cancel opportunity.');
    }
}

async function deleteOpportunity(id) {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
        await dataService.deleteOpportunity(id);
        
        const user = authService.getCurrentUser();
        await dataService.createAuditLog({
            userId: user.id,
            action: 'opportunity_deleted',
            entityType: 'opportunity',
            entityId: id
        });
        
        alert('Opportunity deleted successfully');
        router.navigate('/opportunities');
        
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        alert('Failed to delete opportunity.');
    }
}

window.updateApplicationStatus = updateApplicationStatus;
window.deleteOpportunity = deleteOpportunity;
window.cancelOpportunity = cancelOpportunity;
