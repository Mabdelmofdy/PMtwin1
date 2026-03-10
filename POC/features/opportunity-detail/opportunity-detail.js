/**
 * Opportunity Detail Component - Wizard View
 */

let currentOpportunity = null;
let currentApplication = null;
let currentWizardStep = 1;
let hasDetailedResponses = false;
let hasTaskBidding = false;
let isEditMode = false;

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
    
    try {
        const opportunity = await dataService.getOpportunityById(id);
        
        if (!opportunity) {
            contentDiv.innerHTML = '<div class="error">Opportunity not found</div>';
            loadingDiv.style.display = 'none';
            return;
        }
        
        currentOpportunity = opportunity;
        
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
        const canApply = user && !isOwner && (opportunity.status === 'published' || opportunity.status === 'in_negotiation') && !(authService.isPendingApproval && authService.isPendingApproval());
        
        // Check if user has already applied
        if (canApply) {
            const allApplications = await dataService.getApplications();
            currentApplication = allApplications.find(
                app => app.opportunityId === id && app.applicantId === user.id
            );
        }
        
        // Determine which steps are needed
        determineWizardSteps(opportunity);
        
        // Render comprehensive view
        await renderComprehensiveView(opportunity, creator, isOwner, canApply);
        
        // Load applications if owner
        if (isOwner) {
            await loadApplications(id);
        }
        // Load matching section if owner and opportunity is published or in negotiation
        if (isOwner && (opportunity.status === 'published' || opportunity.status === 'in_negotiation')) {
            await loadMatchingSection(id);
        }
        
        // Setup wizard navigation
        if (canApply) {
            setupWizardNavigation();
        }
        
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
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

async function renderComprehensiveView(opportunity, creator, isOwner, canApply) {
    document.getElementById('opportunity-title').textContent = opportunity.title || 'Untitled Opportunity';
    const intentEl = document.getElementById('opportunity-intent');
    if (intentEl) {
        const intent = opportunity.intent || 'request';
        intentEl.textContent = intent === 'offer' ? 'OFFER' : 'NEED';
        intentEl.style.display = 'inline-block';
        intentEl.className = 'badge ' + (typeof getIntentBadgeClass === 'function' ? getIntentBadgeClass(intent, opportunity.modelType) : (intent === 'offer' ? 'badge-info' : 'badge-primary'));
    }
    document.getElementById('opportunity-model').textContent = formatModelType(opportunity.modelType) || (opportunity.collaborationModel || 'N/A');
    document.getElementById('opportunity-status').textContent = formatOpportunityStatus(opportunity.status);
    document.getElementById('opportunity-status').className = `badge badge-${getStatusBadgeClass(opportunity.status)}`;
    
    // Quick info bar
    document.getElementById('info-created').textContent = new Date(opportunity.createdAt).toLocaleDateString();
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

    // Match score for current user (when not owner)
    const user = authService.getCurrentUser();
    if (!isOwner && user) {
        const allMatches = await dataService.getMatches();
        const myMatch = allMatches.find(
            m => m.opportunityId === opportunity.id &&
                 (m.candidateId || m.userId) === user.id
        );
        if (myMatch) {
            const pct = Math.round(myMatch.matchScore * 100);
            document.getElementById('info-match-chip').style.display = 'flex';
            document.getElementById('info-match-score').textContent = `${pct}%`;
        }
    }
    
    // Description
    document.getElementById('opportunity-description').innerHTML = 
        escapeHtml(opportunity.description || 'No description available');
    
    // Exchange details
    if (opportunity.exchangeData && Object.keys(opportunity.exchangeData).length > 0) {
        document.getElementById('exchange-section').style.display = 'block';
        renderExchangeDetails(opportunity);
    }
    
    const actionsDiv = document.getElementById('opportunity-actions');
    if (isOwner) {
        const oppService = window.opportunityService;
        const canCancel = oppService && oppService.canCancelOpportunity(opportunity);
        const canEdit = opportunity.status === 'draft';
        let btns = '';
        if (canEdit) {
            btns += `<a href="#" data-route="/opportunities/${opportunity.id}/edit" class="btn btn-secondary"><i class="ph-duotone ph-pencil"></i> Edit</a>`;
        }
        if (canCancel) {
            btns += `<button type="button" id="btn-cancel-opportunity" class="btn btn-danger" data-opp-id="${opportunity.id}"><i class="ph-duotone ph-x-circle"></i> Cancel</button>`;
        }
        btns += `<button onclick="deleteOpportunity('${opportunity.id}')" class="btn btn-danger"><i class="ph-duotone ph-trash"></i> Delete</button>`;
        actionsDiv.innerHTML = btns;
        const cancelBtn = document.getElementById('btn-cancel-opportunity');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => cancelOpportunity(cancelBtn.dataset.oppId));
        }
    } else {
        actionsDiv.innerHTML = '';
    }
    
    // Model-specific details
    await renderModelDetails(opportunity);
    
    // Show apply section or already applied
    if (canApply) {
        if (currentApplication) {
            isEditMode = true;
            document.getElementById('already-applied-section').style.display = 'block';
            document.getElementById('applied-date').textContent = 
                new Date(currentApplication.createdAt).toLocaleDateString();
            document.getElementById('applied-status').textContent = currentApplication.status;
            document.getElementById('applied-status').className = 
                `badge badge-${getApplicationStatusBadgeClass(currentApplication.status)}`;
            
            // Setup edit button
            document.getElementById('btn-edit-application').addEventListener('click', () => {
                startApplicationWizard();
            });
        } else {
            document.getElementById('apply-section').style.display = 'block';
            
            // Setup apply button
            document.getElementById('btn-start-apply').addEventListener('click', () => {
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
    }
    
    if (isOwner) {
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
    
    const contract = await dataService.getContractByOpportunityId(opportunity.id);
    if (!contract) {
        section.style.display = 'block';
        summaryEl.innerHTML = '<p class="text-gray-500">No contract record found.</p>';
        return;
    }
    
    section.style.display = 'block';
    const creator = await dataService.getUserOrCompanyById(contract.creatorId);
    const contractor = await dataService.getUserOrCompanyById(contract.contractorId);
    const creatorName = creator?.profile?.name || creator?.email || contract.creatorId;
    const contractorName = contractor?.profile?.name || contractor?.email || contract.contractorId;
    
    summaryEl.innerHTML = `
        <p><strong>Parties:</strong> ${escapeHtml(creatorName)} (creator) &ndash; ${escapeHtml(contractorName)} (contractor)</p>
        <p><strong>Scope:</strong> ${escapeHtml(contract.scope || opportunity.title)}</p>
        <p><strong>Payment:</strong> ${escapeHtml(contract.paymentMode || opportunity.exchangeMode || '—')}</p>
        <p><strong>Duration:</strong> ${escapeHtml(contract.duration || '—')}</p>
    `;
    
    const milestones = contract.milestones || [];
    milestonesEl.innerHTML = milestones.length ? `
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Milestones</h3>
        <ul id="milestones-list" class="space-y-2">
            ${milestones.map((m, i) => `
                <li class="flex items-center justify-between p-2 border rounded ${m.status === 'completed' ? 'bg-green-50' : ''}" data-milestone-index="${i}">
                    <span>${escapeHtml(m.title)} ${m.dueDate ? '(' + m.dueDate + ')' : ''}</span>
                    <span class="badge badge-${m.status === 'completed' ? 'success' : 'secondary'}">${m.status === 'completed' ? 'Done' : 'Pending'}</span>
                    ${m.status !== 'completed' && opportunity.status === 'in_execution' ? `<button type="button" class="btn btn-sm btn-primary mark-milestone-done" data-contract-id="${contract.id}" data-index="${i}">Mark complete</button>` : ''}
                </li>
            `).join('')}
        </ul>
        ${opportunity.status === 'in_execution' ? `<button type="button" id="add-milestone-btn" class="btn btn-secondary btn-sm mt-2" data-contract-id="${contract.id}">Add milestone</button>` : ''}
    ` : (opportunity.status === 'in_execution' ? `<p class="text-gray-500">No milestones yet.</p><button type="button" id="add-milestone-btn" class="btn btn-secondary btn-sm" data-contract-id="${contract.id}">Add milestone</button>` : '<p class="text-gray-500">No milestones.</p>');
    
    milestonesEl.querySelectorAll('.mark-milestone-done').forEach(btn => {
        btn.addEventListener('click', () => markMilestoneComplete(btn.dataset.contractId, parseInt(btn.dataset.index, 10)));
    });
    const addBtn = document.getElementById('add-milestone-btn');
    if (addBtn) addBtn.addEventListener('click', () => addMilestone(addBtn.dataset.contractId));
    
    const user = authService.getCurrentUser();
    const isOwner = user && opportunity.creatorId === user.id;
    let actionsHtml = '';
    if (opportunity.status === 'contracted' && isOwner) {
        actionsHtml += `<button type="button" id="start-execution-btn" class="btn btn-primary" data-opp-id="${opportunity.id}" data-contract-id="${contract.id}">Start execution</button>`;
    }
    const allDone = milestones.length > 0 && milestones.every(m => m.status === 'completed');
    if (opportunity.status === 'in_execution' && allDone && isOwner) {
        actionsHtml += `<button type="button" id="confirm-completion-btn" class="btn btn-success" data-opp-id="${opportunity.id}" data-contract-id="${contract.id}">Confirm completion</button>`;
    }
    if (opportunity.status === 'completed' && isOwner) {
        actionsHtml += `<button type="button" id="close-opportunity-btn" class="btn btn-secondary" data-opp-id="${opportunity.id}">Close opportunity</button>`;
    }
    if (opportunity.status === 'in_execution' && isOwner) {
        actionsHtml += `<button type="button" id="terminate-contract-btn" class="btn btn-danger" data-opp-id="${opportunity.id}" data-contract-id="${contract.id}">Terminate contract</button>`;
    }
    actionsEl.innerHTML = actionsHtml;
    
    document.getElementById('start-execution-btn')?.addEventListener('click', async () => {
        const oppId = document.getElementById('start-execution-btn').dataset.oppId;
        const cId = document.getElementById('start-execution-btn').dataset.contractId;
        await dataService.updateOpportunity(oppId, { status: 'in_execution' });
        await dataService.updateContract(cId, { status: 'active' });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'execution_started',
                entityType: 'contract',
                entityId: cId,
                details: { opportunityId: oppId }
            });
        }
        const contract = await dataService.getContractById(cId);
        if (contract && contract.contractorId) {
            const opp = await dataService.getOpportunityById(oppId);
            const title = opp?.title || 'the opportunity';
            await dataService.createNotification({
                userId: contract.contractorId,
                type: 'execution_started',
                title: 'Execution started',
                message: `Work has started for "${title}".`,
                link: `/opportunities/${oppId}`
            });
        }
        await loadOpportunity(oppId);
    });
    document.getElementById('confirm-completion-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('confirm-completion-btn');
        const oppId = btn.dataset.oppId;
        const contractId = btn.dataset.contractId;
        await dataService.updateOpportunity(oppId, { status: 'completed' });
        if (contractId) await dataService.updateContract(contractId, { status: 'completed' });
        const user = authService.getCurrentUser();
        if (user) {
            await dataService.createAuditLog({
                userId: user.id,
                action: 'completion_confirmed',
                entityType: 'opportunity',
                entityId: oppId,
                details: { contractId: contractId || '' }
            });
        }
        const contract = contractId ? await dataService.getContractById(contractId) : null;
        if (contract && contract.contractorId) {
            const opp = await dataService.getOpportunityById(oppId);
            const title = opp?.title || 'the opportunity';
            await dataService.createNotification({
                userId: contract.contractorId,
                type: 'opportunity_completed',
                title: 'Engagement completed',
                message: `"${title}" has been marked as completed by the opportunity owner.`,
                link: `/opportunities/${oppId}`
            });
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
        const cId = btn.dataset.contractId;
        if (!confirm('Are you sure you want to terminate this contract? The opportunity will be marked as cancelled.')) return;
        const reason = prompt('Reason for termination (optional):') || '';
        try {
            await dataService.updateContract(cId, { status: 'terminated' });
            await dataService.updateOpportunity(oppId, { status: 'cancelled' });
            const user = authService.getCurrentUser();
            if (user) {
                await dataService.createAuditLog({
                    userId: user.id,
                    action: 'contract_terminated',
                    entityType: 'contract',
                    entityId: cId,
                    details: { opportunityId: oppId, reason }
                });
            }
            const contract = await dataService.getContractById(cId);
            if (contract && contract.contractorId) {
                const opp = await dataService.getOpportunityById(oppId);
                const title = opp?.title || 'the opportunity';
                await dataService.createNotification({
                    userId: contract.contractorId,
                    type: 'contract_terminated',
                    title: 'Contract terminated',
                    message: `The contract for "${title}" has been terminated by the opportunity owner.${reason ? ' Reason: ' + reason : ''}`,
                    link: `/opportunities/${oppId}`
                });
            }
            await loadOpportunity(oppId);
        } catch (err) {
            console.error('Error terminating contract:', err);
            alert('Failed to terminate contract.');
        }
    });
}

async function markMilestoneComplete(contractId, index) {
    const contract = await dataService.getContractById(contractId);
    if (!contract || !contract.milestones || !contract.milestones[index]) return;
    const milestone = contract.milestones[index];
    const milestones = [...contract.milestones];
    milestones[index] = { ...milestone, status: 'completed', completedAt: new Date().toISOString() };
    await dataService.updateContract(contractId, { milestones });
    const user = authService.getCurrentUser();
    if (user) {
        await dataService.createAuditLog({
            userId: user.id,
            action: 'milestone_completed',
            entityType: 'contract',
            entityId: contractId,
            details: { milestoneIndex: index, milestoneTitle: milestone.title, opportunityId: currentOpportunity?.id }
        });
    }
    if (contract.contractorId) {
        const opp = currentOpportunity || await dataService.getOpportunityById(contract.opportunityId);
        const title = opp?.title || 'the opportunity';
        await dataService.createNotification({
            userId: contract.contractorId,
            type: 'milestone_completed',
            title: 'Milestone completed',
            message: `Milestone "${milestone.title}" was marked complete for "${title}".`,
            link: `/opportunities/${contract.opportunityId}`
        });
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

function renderExchangeDetails(opportunity) {
    const container = document.getElementById('exchange-details');
    const exchangeData = opportunity.exchangeData || opportunity;
    let html = '<div class="detail-grid">';

    // Payment methods (when multiple accepted)
    const paymentModes = opportunity.paymentModes || (exchangeData.exchangeMode ? [exchangeData.exchangeMode] : []);
    if (Array.isArray(paymentModes) && paymentModes.length > 0) {
        const modeLabels = paymentModes.map(m => formatExchangeMode(m));
        html += `
            <div class="detail-item">
                <div class="detail-label">Payment methods</div>
                <div class="detail-value">${escapeHtml(modeLabels.join(', '))}</div>
            </div>
        `;
    }
    
    // Budget Range (now part of exchange data)
    if (exchangeData.budgetRange) {
        const budget = exchangeData.budgetRange;
        const currency = budget.currency || exchangeData.currency || 'SAR';
        html += `
            <div class="detail-item budget-highlight">
                <div class="detail-label">Budget Range</div>
                <div class="detail-value budget-value">
                    ${budget.min?.toLocaleString() || 0} - ${budget.max?.toLocaleString() || 0} ${currency}
                </div>
            </div>
        `;
    }
    
    if (exchangeData.exchangeMode) {
        html += `
            <div class="detail-item">
                <div class="detail-label">Exchange Mode</div>
                <div class="detail-value">${formatExchangeMode(exchangeData.exchangeMode)}</div>
            </div>
        `;
    }
    
    if (exchangeData.currency) {
        html += `
            <div class="detail-item">
                <div class="detail-label">Currency</div>
                <div class="detail-value">${exchangeData.currency}</div>
            </div>
        `;
    }
    
    if (exchangeData.cashAmount) {
        html += `
            <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">${exchangeData.cashAmount.toLocaleString()} ${exchangeData.currency || 'SAR'}</div>
            </div>
        `;
    }
    
    if (exchangeData.cashPaymentTerms) {
        html += `
            <div class="detail-item">
                <div class="detail-label">Payment Terms</div>
                <div class="detail-value">${exchangeData.cashPaymentTerms}</div>
            </div>
        `;
    }
    
    if (exchangeData.exchangeTermsSummary) {
        html += `
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Terms Summary</div>
                <div class="detail-value">${escapeHtml(exchangeData.exchangeTermsSummary)}</div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
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
    const modelSpecificData = opportunity.attributes || opportunity.modelData;
    
    if (!modelSpecificData || Object.keys(modelSpecificData).length === 0) {
        container.innerHTML = '<p class="text-muted">No additional details available.</p>';
        return;
    }
    
    // Get model definition for labels
    const modelDef = getModelDefinition(opportunity.modelType, opportunity.subModelType);
    const attributeMap = {};
    if (modelDef && modelDef.attributes) {
        modelDef.attributes.forEach(attr => {
            attributeMap[attr.key] = attr.label;
        });
    }
    Object.assign(attributeMap, MATCHING_DETAIL_LABELS);

    // System / non-detail keys to exclude from display
    const systemKeys = ['title', 'description', 'status', 'modelType', 'subModelType',
        'location', 'locationCountry', 'locationRegion', 'locationCity',
        'locationDistrict', 'exchangeMode', 'exchangeData'];
    const detailKeys = Object.keys(modelSpecificData).filter(key => !systemKeys.includes(key));

    if (detailKeys.length === 0) {
        container.innerHTML = '<p class="text-muted">No additional details available.</p>';
        return;
    }

    // Sort so matching-related fields (timeline, location) appear first
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
        const displayValue = formatModelDetailValue(value, key);
        const label = attributeMap[key] || formatLabel(key);
        return `
            <div class="detail-item">
                <div class="detail-label">${escapeHtml(label)}</div>
                <div class="detail-value">${escapeHtml(displayValue)}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = detailsHTML;
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

function startApplicationWizard() {
    currentWizardStep = 1;
    
    // Show wizard steps and navigation
    document.getElementById('wizard-steps').style.display = 'flex';
    document.getElementById('wizard-nav').style.display = 'flex';
    
    // Generate form fields
    generateDetailedResponses(currentOpportunity, currentApplication);
    generateTaskBidding(currentOpportunity, currentApplication);
    
    // Populate if editing
    if (isEditMode && currentApplication) {
        populateApplicationForm(currentApplication);
    }
    
    // Go to step 2 (proposal)
    goToWizardStep(2);
}

function setupWizardNavigation() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSubmit = document.getElementById('btn-submit');
    const btnDemoFill = document.getElementById('btn-demo-fill');
    
    btnPrev.addEventListener('click', () => {
        goToWizardStep(getPreviousStep());
    });
    
    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            goToWizardStep(getNextStep());
        }
    });
    
    btnCancel.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
            goToWizardStep(1);
            document.getElementById('wizard-steps').style.display = 'none';
            document.getElementById('wizard-nav').style.display = 'none';
        }
    });
    
    btnSubmit.addEventListener('click', submitApplication);
    
    // Demo Fill button
    if (btnDemoFill) {
        btnDemoFill.addEventListener('click', fillDemoData);
    }
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
            const offeredEl = document.getElementById('application-offered-value');
            const requestedEl = document.getElementById('application-requested-value');
            const currencyEl = document.getElementById('application-requested-currency');
            if (offeredEl) offeredEl.value = typeof av.offered_value === 'string' ? av.offered_value : (av.offered_value && av.offered_value.description) || '';
            if (requestedEl && av.requested_value != null) requestedEl.value = av.requested_value;
            if (currencyEl && av.currency) currencyEl.value = av.currency;
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
    const detailedResponses = collectDetailedResponses();
    const taskBids = collectTaskBids();
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
    
    try {
        if (isEditMode && currentApplication) {
            // Update existing application
            const updateData = {
                proposal,
                responses: {
                    ...currentApplication.responses,
                    ...detailedResponses,
                    ...taskBids,
                    ...paymentResponses
                },
                application_value
            };
            
            await dataService.updateApplication(currentApplication.id, updateData);
            
            // Notify opportunity creator
            await dataService.createNotification({
                userId: currentOpportunity.creatorId,
                type: 'application_updated',
                title: 'Application Updated',
                message: `${user.email || 'An applicant'} updated their application for "${currentOpportunity.title}"`
            });
            
            alert('Application updated successfully!');
        } else {
            // Create new application
            const applicationData = {
                opportunityId: currentOpportunity.id,
                applicantId: user.id,
                proposal,
                responses: {
                    ...detailedResponses,
                    ...taskBids,
                    ...paymentResponses
                },
                application_value
            };
            
            await dataService.createApplication(applicationData);
            
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
                message: `You received a new application for "${currentOpportunity.title}"`
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
        
        location.reload();
        
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
        // Trigger input event for any listeners
        proposalField.dispatchEvent(new Event('input', { bubbles: true }));
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
        paymentComments: 'The payment terms are acceptable. Open to discussing milestones if needed.'
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
    // Budget range is now in exchangeData, fall back to modelSpecificData for backwards compatibility
    const budgetRange = opportunity.exchangeData?.budgetRange || modelSpecificData.budgetRange;
    const budgetMin = budgetRange?.min || 0;
    const budgetMax = budgetRange?.max || 0;
    
    const existingBidAmount = existingApplication?.responses?.taskBidAmount || '';
    const existingBidDuration = existingApplication?.responses?.taskBidDuration || '';
    const existingBidComments = existingApplication?.responses?.taskBidComments || '';
    
    container.innerHTML = `
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

function populateApplicationForm(application) {
    if (!application) return;
    
    // Populate proposal
    const proposalField = document.getElementById('application-proposal');
    if (proposalField && application.proposal) {
        proposalField.value = application.proposal;
    }
    
    // Populate payment preference (step 4)
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

async function loadApplications(opportunityId) {
    const applicationsList = document.getElementById('applications-list');
    const applicationsCount = document.getElementById('applications-count');
    
    try {
        const allApplications = await dataService.getApplications();
        let opportunityApplications = allApplications.filter(a => a.opportunityId === opportunityId);
        opportunityApplications.sort((a, b) => {
            const scoreA = a.application_value?.value_score != null ? a.application_value.value_score : -1;
            const scoreB = b.application_value?.value_score != null ? b.application_value.value_score : -1;
            return scoreB - scoreA;
        });
        
        applicationsCount.textContent = opportunityApplications.length;
        
        if (opportunityApplications.length === 0) {
            applicationsList.innerHTML = '<p class="text-muted">No applications yet.</p>';
            return;
        }
        
        // Load applicant info
        const applicationsWithUsers = await Promise.all(
            opportunityApplications.map(async (app) => {
                const applicant = await dataService.getUserById(app.applicantId);
                return { ...app, applicant };
            })
        );
        
        // Render applications (Accept/Reject/Start negotiation when status is pending, reviewing, shortlisted, or in_negotiation)
        const canActOnApplication = (app) => {
            const actionable = ['pending', 'reviewing', 'shortlisted', 'in_negotiation'].includes(app.status);
            const opportunityClosed = currentOpportunity && ['contracted', 'in_execution', 'completed', 'closed', 'cancelled'].includes(currentOpportunity.status);
            return actionable && !opportunityClosed;
        };
        const canStartNegotiation = (app) => {
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
                actionsHtml += `<button type="button" class="btn btn-secondary btn-sm btn-start-negotiation" data-application-id="${escapeHtml(app.id)}" data-applicant-id="${escapeHtml(app.applicantId || '')}">Start negotiation</button>`;
            }
            if (showActions) {
                actionsHtml += `<button type="button" class="btn btn-success btn-sm btn-accept-application" data-application-id="${escapeHtml(app.id)}">Accept</button>`;
                actionsHtml += `<button type="button" class="btn btn-danger btn-sm btn-reject-application" data-application-id="${escapeHtml(app.id)}">Reject</button>`;
            }
            actionsHtml += '</div>';
            const negotiationLine = app.status === 'in_negotiation' ? '<p class="text-xs text-gray-500 mt-1">Negotiation: In progress</p>' : '';
            const vs = app.applicant?.profile?.verificationStatus;
            const verificationBadge = vs === 'professional_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Professional</span>' : vs === 'consultant_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Consultant</span>' : vs === 'company_verified' ? '<span class="badge badge-success verification-badge ml-1">Verified Company</span>' : '';
            const av = app.application_value;
            const valueScorePct = av?.value_score != null ? Math.round(av.value_score * 100) : null;
            const valueScoreHtml = valueScorePct != null ? `<span class="badge badge-info ml-1" title="Value compatibility">Value: ${valueScorePct}%</span>` : '';
            const lowValueBadge = av?.lowValueMatch ? '<span class="badge badge-warning ml-1" title="Applicant requested value is more than 30% below opportunity expected value">Low Value Match</span>' : '';
            const breakdown = av?.value_breakdown;
            const breakdownTip = breakdown ? `Budget ${Math.round(breakdown.budgetFit * 100)}% | Mode ${Math.round(breakdown.exchangeModeFit * 100)}% | Scope ${Math.round(breakdown.scopeFit * 100)}%` : '';
            return `
            <div class="application-card" data-application-id="${escapeHtml(app.id)}">
                <div class="application-header">
                    <strong>${escapeHtml(app.applicant?.profile?.name || app.applicant?.email || 'Unknown')}</strong>${verificationBadge}
                    ${valueScoreHtml}
                    ${lowValueBadge}
                    <span class="badge badge-${getApplicationStatusBadgeClass(app.status)}">${escapeHtml(getApplicationStatusLabel(app.status))}</span>
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
                    await dataService.updateApplication(applicationId, { status: newStatus });
                    await loadApplications(opportunityId);
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
                    await loadApplications(opportunityId);
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
    const creatorId = opportunity?.creatorId;

    const getMatchesByOpportunityId = dataService.getMatchesByOpportunityId || (async (id) => {
        const matches = await dataService.getMatches();
        return matches.filter(m => m.opportunityId === id);
    });
    const matches = await getMatchesByOpportunityId(opportunityId);
    const professionalMatches = matches.filter(m => (m.candidateId || m.userId || '').startsWith('user-pro-'));
    const companyMatches = matches.filter(m => (m.candidateId || m.userId || '').startsWith('user-company-'));

    const professionalsWithProfiles = await Promise.all(
        professionalMatches.map(async (m) => {
            const candidateId = m.candidateId || m.userId;
            const candidate = await dataService.getUserById(candidateId);
            return { match: m, candidate };
        })
    );
    const companiesWithProfiles = await Promise.all(
        companyMatches.map(async (m) => {
            const candidateId = m.candidateId || m.userId;
            const candidate = await dataService.getCompanyById(candidateId);
            return { match: m, candidate };
        })
    );

    const scorePct = (m) => Math.round((m.matchScore != null ? m.matchScore : 0) * 100);
    const criteriaSnippet = (m) => {
        const c = (m.criteria || m.matchReasons || []);
        return c.length ? c[0].details || c[0].factor : '';
    };

    if (professionalsWithProfiles.length === 0) {
        professionalsList.innerHTML = '<p class="text-gray-500 text-sm">No matching professionals yet. Publish the opportunity to run matching, or click Run matching below.</p>';
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
                        </div>
                        <span class="badge badge-primary whitespace-nowrap">${scorePct(match)}% match</span>
                    </div>
                </div>`;
        }).join('');
    }

    if (companiesWithProfiles.length === 0) {
        const companies = await dataService.getCompanies();
        const suggested = companies
            .filter(c => c.id !== creatorId && c.status === 'active')
            .slice(0, 6)
            .map((c, i) => ({ company: c, score: 0.70 + (i * 0.04) + Math.random() * 0.05 }));
        suggested.sort((a, b) => b.score - a.score);
        companiesList.innerHTML = suggested.length === 0
            ? '<p class="text-gray-500 text-sm">No matching companies yet.</p>'
            : suggested.map(({ company, score }) => {
            const name = company?.profile?.name || company?.email || company.id;
            const headline = company?.profile?.headline || company?.profile?.description || '';
            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-white">
                    <div class="flex justify-between items-start">
                        <div>
                            <strong class="text-gray-900">${escapeHtml(name)}</strong>
                            ${headline ? `<p class="text-sm text-gray-600 mt-0.5">${escapeHtml(headline.substring(0, 80))}${headline.length > 80 ? '…' : ''}</p>` : ''}
                        </div>
                        <span class="badge badge-secondary whitespace-nowrap">${Math.round(score * 100)}% match</span>
                    </div>
                </div>`;
        }).join('');
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
                        </div>
                        <span class="badge badge-secondary whitespace-nowrap">${scorePct(match)}% match</span>
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
                await window.matchingService.findMatchesForOpportunity(opportunityId);
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
        const application = await dataService.getApplicationById(applicationId);
        if (!application) return;
        const applicant = await dataService.getUserById(application.applicantId) || await dataService.getCompanyById(application.applicantId);
        const applicantName = applicant?.profile?.name || applicant?.email || application.applicantId;
        const proposalText = application.coverLetter || application.proposal || 'No proposal or cover letter provided.';
        const responses = application.responses || {};
        const responsesEntries = Object.entries(responses).filter(([, v]) => v != null && String(v).trim() !== '');
        let responsesHtml = '';
        if (responsesEntries.length > 0) {
            responsesHtml = '<div class="mt-4"><h4 class="text-sm font-semibold text-gray-700 mb-2">Responses</h4><dl class="space-y-2">' +
                responsesEntries.map(([key, value]) => `<div><dt class="text-xs text-gray-500">${escapeHtml(formatLabel(key))}</dt><dd class="text-sm text-gray-900">${escapeHtml(String(value))}</dd></div>`).join('') +
                '</dl></div>';
        }
        const av = application.application_value;
        const valueScorePct = av?.value_score != null ? Math.round(av.value_score * 100) : null;
        const valueSection = valueScorePct != null ? `
            <div class="mb-3 p-3 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-1">Value compatibility</h4>
                <p class="text-sm text-gray-900"><strong>${valueScorePct}%</strong>${av?.lowValueMatch ? ' <span class="badge badge-warning">Low Value Match</span>' : ''}</p>
                ${av?.value_breakdown ? `<p class="text-xs text-gray-500 mt-1">Budget ${Math.round(av.value_breakdown.budgetFit * 100)}% · Mode ${Math.round(av.value_breakdown.exchangeModeFit * 100)}% · Scope ${Math.round(av.value_breakdown.scopeFit * 100)}%</p>` : ''}
                ${av?.offered_value ? `<p class="text-xs mt-1"><strong>Offers:</strong> ${escapeHtml(typeof av.offered_value === 'string' ? av.offered_value : av.offered_value?.description || '')}</p>` : ''}
                ${av?.requested_value != null ? `<p class="text-xs"><strong>Requested:</strong> ${typeof av.requested_value === 'number' ? av.requested_value.toLocaleString() : escapeHtml(String(av.requested_value))} ${escapeHtml(av.currency || 'SAR')}</p>` : ''}
            </div>
        ` : '';
        const contentHTML = `
            <div class="application-detail-modal">
                <div class="mb-3">
                    <strong>${escapeHtml(applicantName)}</strong>
                    <span class="badge badge-${getApplicationStatusBadgeClass(application.status)} ml-2">${escapeHtml(getApplicationStatusLabel(application.status))}</span>
                </div>
                <div class="text-sm text-gray-500 mb-3">Applied: ${new Date(application.createdAt).toLocaleDateString()}</div>
                ${valueSection}
                <div class="mb-3">
                    <h4 class="text-sm font-semibold text-gray-700 mb-1">Cover letter / Proposal</h4>
                    <p class="text-sm text-gray-900 whitespace-pre-wrap">${escapeHtml(proposalText)}</p>
                </div>
                ${responsesHtml}
            </div>
        `;
        if (typeof modalService !== 'undefined') {
            await modalService.showCustom(contentHTML, 'Application details', { confirmText: 'Close' });
        } else {
            alert('Application: ' + applicantName + '\nStatus: ' + application.status + '\n\n' + proposalText);
        }
    } catch (error) {
        console.error('Error showing application detail:', error);
        alert('Failed to load application details.');
    }
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
    const labels = {
        draft: 'Draft',
        published: 'Published',
        in_negotiation: 'In Negotiation',
        contracted: 'Contracted',
        in_execution: 'In Execution',
        completed: 'Completed',
        closed: 'Closed',
        cancelled: 'Cancelled'
    };
    return labels[status] || status || 'Draft';
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

function getApplicationStatusBadgeClass(status) {
    const statusMap = {
        'pending': 'warning',
        'reviewing': 'primary',
        'shortlisted': 'primary',
        'in_negotiation': 'info',
        'accepted': 'success',
        'rejected': 'danger',
        'withdrawn': 'secondary'
    };
    return statusMap[status] || 'secondary';
}

function getApplicationStatusLabel(status) {
    const labelMap = {
        'pending': 'Pending',
        'reviewing': 'Reviewing',
        'shortlisted': 'Shortlisted',
        'in_negotiation': 'In negotiation',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'withdrawn': 'Withdrawn'
    };
    return labelMap[status] || status;
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

async function updateApplicationStatus(applicationId, status) {
    if (!confirm(`Are you sure you want to ${status} this application?`)) return;
    
    try {
        await dataService.updateApplication(applicationId, { status });
        const application = await dataService.getApplicationById(applicationId);
        
        if (status === 'accepted') {
            const opp = await dataService.getOpportunityById(currentOpportunity.id);
            const creatorId = opp.creatorId;
            const contractorId = application.applicantId;
            const ed = opp.exchangeData || {};
            const paymentSchedule = ed.cashMilestones || (opp.value_exchange && opp.value_exchange.value_offered && opp.value_exchange.value_offered.paymentTerms) || '';
            const equityVesting = ed.equityVesting ? { period: ed.equityVesting, percentage: ed.equityPercentage } : null;
            const profitShare = (ed.profitSplit || ed.profitSharePercentage != null) ? { percentage: ed.profitSharePercentage != null ? ed.profitSharePercentage : null, split: ed.profitSplit, basis: ed.profitBasis, distribution: ed.profitDistribution } : null;
            const newContract = await dataService.createContract({
                opportunityId: currentOpportunity.id,
                applicationId: application.id,
                creatorId,
                contractorId,
                scope: opp.title || '',
                paymentMode: opp.exchangeMode || opp.paymentModes?.[0] || 'cash',
                duration: '',
                status: window.CONFIG?.CONTRACT_STATUS?.PENDING || 'pending',
                paymentSchedule: paymentSchedule || undefined,
                equityVesting: equityVesting || undefined,
                profitShare: profitShare || undefined
            });
            await dataService.updateOpportunity(currentOpportunity.id, { status: 'contracted' });
            const user = authService.getCurrentUser();
            if (user) {
                await dataService.createAuditLog({
                    userId: user.id,
                    action: 'contract_created',
                    entityType: 'contract',
                    entityId: newContract.id,
                    details: { opportunityId: currentOpportunity.id, applicationId: application.id }
                });
            }
        }
        
        await dataService.createNotification({
            userId: application.applicantId,
            type: 'application_status_changed',
            title: 'Application Status Updated',
            message: `Your application for "${currentOpportunity.title}" has been ${status}`
        });
        
        await loadApplications(currentOpportunity.id);
    } catch (error) {
        console.error('Error updating application status:', error);
        alert('Failed to update application status.');
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
